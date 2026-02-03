"""multi-agent-shogun-gui: Webダッシュボード"""
import argparse
import os
import subprocess
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, FileResponse

from parser import parse_dashboard

app = FastAPI(title="multi-agent-shogun-gui")


def get_dashboard_path() -> str:
    """環境変数からダッシュボードパスを取得"""
    return os.environ.get("SHOGUN_DASHBOARD_PATH", "")


@app.get("/", response_class=HTMLResponse)
async def root():
    """メインページを返す"""
    static_dir = Path(__file__).parent / "static"
    index_path = static_dir / "index.html"
    if index_path.exists():
        return HTMLResponse(content=index_path.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>multi-agent-shogun-gui</h1><p>static/index.html not found</p>")


@app.get("/api/dashboard")
async def get_dashboard():
    """dashboard.md をパースしてJSONで返す"""
    dashboard_path = get_dashboard_path()
    if not dashboard_path:
        return {"error": "Dashboard path not configured. Set SHOGUN_DASHBOARD_PATH environment variable."}
    return parse_dashboard(dashboard_path)


@app.get("/api/ashigaru/{ashigaru_id}/output")
async def get_ashigaru_output(ashigaru_id: str):
    """足軽ペインの最新出力を取得する

    Args:
        ashigaru_id: 足軽ID (例: "ashigaru1", "ashigaru2", ...)

    Returns:
        足軽ペインの最新50行の出力をJSON形式で返す
    """
    # ashigaru_id からペインインデックスを算出
    # ashigaru1 -> pane 1, ashigaru2 -> pane 2, ...
    if not ashigaru_id.startswith("ashigaru"):
        raise HTTPException(status_code=400, detail="Invalid ashigaru_id format")

    try:
        pane_index = int(ashigaru_id.replace("ashigaru", ""))
        if pane_index < 1 or pane_index > 8:
            raise HTTPException(status_code=400, detail="ashigaru_id must be between 1 and 8")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ashigaru_id format")

    # tmux capture-pane で出力を取得
    target = f"multiagent:agents.{pane_index}"
    try:
        result = subprocess.run(
            ["tmux", "capture-pane", "-t", target, "-p", "-S", "-50"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode != 0:
            return {
                "ashigaru_id": ashigaru_id,
                "pane_index": pane_index,
                "output": "",
                "error": f"Failed to capture pane: {result.stderr.strip() or 'Pane not found'}"
            }

        return {
            "ashigaru_id": ashigaru_id,
            "pane_index": pane_index,
            "output": result.stdout,
            "error": None
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="tmux command timed out")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="tmux not found")


@app.get("/static/{path:path}")
async def static_files(path: str):
    """静的ファイルを返す"""
    static_dir = Path(__file__).parent / "static"
    file_path = static_dir / path
    if file_path.exists():
        return FileResponse(file_path)
    return {"error": "File not found"}


def main():
    parser = argparse.ArgumentParser(description="multi-agent-shogun-gui server")
    parser.add_argument(
        "--dashboard",
        required=True,
        help="Path to dashboard.md",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Server port (default: 8000)",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host address (default: 127.0.0.1)",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable hot reload (development)",
    )

    args = parser.parse_args()

    # dashboard.md のパスを検証
    dashboard_path = Path(args.dashboard)
    if not dashboard_path.exists():
        print(f"Error: Dashboard file not found: {args.dashboard}")
        return 1

    # 環境変数にセット
    os.environ["SHOGUN_DASHBOARD_PATH"] = str(dashboard_path.absolute())

    print(f"Dashboard: {os.environ['SHOGUN_DASHBOARD_PATH']}")
    print(f"Server: http://{args.host}:{args.port}")

    import uvicorn
    uvicorn.run(
        app,  # 文字列ではなくappオブジェクトを直接渡す
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


if __name__ == "__main__":
    main()
