"""multi-agent-shogun-gui: Webダッシュボード"""
import argparse
import os
from pathlib import Path

from fastapi import FastAPI
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
