#!/bin/bash
# ============================================================
# start_gui.sh - multi-agent-shogun-gui 起動スクリプト
# ============================================================
# 実行方法:
#   ./start_gui.sh           # GUI + エージェント起動（デフォルト）
#   ./start_gui.sh -p 8080   # ポート指定
#   ./start_gui.sh -b        # バックグラウンド起動
#   ./start_gui.sh --dev     # 開発モード（ホットリロード有効）
#   ./start_gui.sh --no-agent  # GUIのみ起動（エージェント起動なし）
# ============================================================

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# デフォルト値
PORT=1059
HOST="127.0.0.1"
BACKGROUND=true
DEV_MODE=false
NO_AGENT=false
CLEAN_MODE=false
SETUP_ONLY=false
PID_FILE="$SCRIPT_DIR/.gui.pid"
LOG_FILE="$SCRIPT_DIR/logs/gui.log"

# ヘルプ表示
show_help() {
    echo ""
    echo "  使用方法: ./start_gui.sh [オプション]"
    echo ""
    echo "  オプション:"
    echo "    -p, --port PORT    ポート番号を指定（デフォルト: 1059）"
    echo "    -H, --host HOST    ホストを指定（デフォルト: 127.0.0.1）"
    echo "    -b, --background   バックグラウンドで起動"
    echo "    --dev              開発モード（ホットリロード有効）"
    echo "    --no-agent         GUIのみ起動（エージェント起動なし）"
    echo "    -c, --clean        エージェントをクリーンスタート"
    echo "    -s, --setup-only   エージェントのセットアップのみ（Claude起動なし）"
    echo "    --help             このヘルプを表示"
    echo ""
    echo "  例:"
    echo "    ./start_gui.sh                    # GUI + エージェント起動"
    echo "    ./start_gui.sh -p 8080            # ポート8080で起動"
    echo "    ./start_gui.sh -b                 # バックグラウンド起動"
    echo "    ./start_gui.sh --no-agent         # GUIのみ起動"
    echo "    ./start_gui.sh -c                 # クリーンスタート"
    echo ""
}

# 引数パース
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -H|--host)
            HOST="$2"
            shift 2
            ;;
        -b|--background)
            BACKGROUND=true
            shift
            ;;
        --dev)
            DEV_MODE=true
            shift
            ;;
        --no-agent)
            NO_AGENT=true
            shift
            ;;
        -c|--clean)
            CLEAN_MODE=true
            shift
            ;;
        -s|--setup-only)
            SETUP_ONLY=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "不明なオプション: $1"
            show_help
            exit 1
            ;;
    esac
done

echo ""
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║  🏯 multi-agent-shogun-gui 起動                              ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# STEP 1: エージェント起動（shogunシステム）
# ============================================================
if [ "$NO_AGENT" = false ]; then
    log_info "STEP 1: エージェントシステム起動"

    SHUTSUJIN_SCRIPT="$SCRIPT_DIR/shogun/shutsujin_departure.sh"

    if [ ! -f "$SHUTSUJIN_SCRIPT" ]; then
        log_error "shutsujin_departure.sh が見つかりません"
        echo "  パス: $SHUTSUJIN_SCRIPT"
        exit 1
    fi

    # tmuxセッションが既に存在するか確認
    SHOGUN_EXISTS=false
    MULTIAGENT_EXISTS=false

    if tmux has-session -t shogun 2>/dev/null; then
        SHOGUN_EXISTS=true
    fi
    if tmux has-session -t multiagent 2>/dev/null; then
        MULTIAGENT_EXISTS=true
    fi

    if [ "$SHOGUN_EXISTS" = true ] && [ "$MULTIAGENT_EXISTS" = true ]; then
        log_info "エージェントは既に起動中です"
        echo "  - shogun セッション: 起動中"
        echo "  - multiagent セッション: 起動中"
        echo ""
    else
        # shutsujin_departure.sh のオプション構築
        SHUTSUJIN_OPTS=""
        if [ "$CLEAN_MODE" = true ]; then
            SHUTSUJIN_OPTS="$SHUTSUJIN_OPTS -c"
        fi
        if [ "$SETUP_ONLY" = true ]; then
            SHUTSUJIN_OPTS="$SHUTSUJIN_OPTS -s"
        fi

        log_info "出陣スクリプトを実行中..."
        if bash "$SHUTSUJIN_SCRIPT" $SHUTSUJIN_OPTS; then
            log_success "エージェントシステム起動完了"
        else
            log_warn "エージェントシステム起動に警告がありました（続行）"
        fi
        echo ""
    fi
else
    log_info "エージェント起動をスキップ (--no-agent)"
    echo ""
fi

# ============================================================
# STEP 2: GUI起動
# ============================================================
log_info "STEP 2: GUIダッシュボード起動"

# 既にGUIが起動中かチェック
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        log_warn "GUIは既に起動中です (PID: $OLD_PID)"
        echo ""
        echo "  停止する場合: ./stop_gui.sh"
        echo "  再起動する場合: ./stop_gui.sh && ./start_gui.sh"
        echo ""
        exit 1
    else
        # PIDファイルは存在するがプロセスは死んでいる
        rm -f "$PID_FILE"
    fi
fi

# dashboard.md の存在確認
DASHBOARD_PATH="$SCRIPT_DIR/dashboard.md"
if [ ! -e "$DASHBOARD_PATH" ]; then
    log_error "dashboard.md が見つかりません"
    echo ""
    echo "  セットアップを実行してください: ./setup_gui.sh"
    echo ""
    exit 1
fi

# ログディレクトリ作成
mkdir -p "$SCRIPT_DIR/logs"

# 起動コマンド構築
CMD="python3 $SCRIPT_DIR/app.py --dashboard $DASHBOARD_PATH --port $PORT --host $HOST"
if [ "$DEV_MODE" = true ]; then
    CMD="$CMD --reload"
fi

log_info "GUI設定:"
echo "  ダッシュボード: $DASHBOARD_PATH"
echo "  ホスト: $HOST"
echo "  ポート: $PORT"
echo "  開発モード: $DEV_MODE"
echo "  バックグラウンド: $BACKGROUND"
echo ""

if [ "$BACKGROUND" = true ]; then
    # バックグラウンド起動
    log_info "バックグラウンドで起動中..."
    nohup $CMD > "$LOG_FILE" 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"

    # 起動確認（最大5秒待機）
    sleep 1
    if kill -0 "$PID" 2>/dev/null; then
        log_success "GUI起動完了 (PID: $PID)"
        echo ""
        echo "  ┌──────────────────────────────────────────────────────────────┐"
        echo "  │  🌐 アクセスURL: http://$HOST:$PORT                          "
        echo "  │  📜 ログファイル: $LOG_FILE                                  "
        echo "  │  🛑 停止: ./stop_gui.sh                                      "
        echo "  └──────────────────────────────────────────────────────────────┘"
        echo ""
        echo "  ┌──────────────────────────────────────────────────────────────┐"
        echo "  │  🎮 tmuxセッション                                           "
        echo "  │  将軍: tmux attach -t shogun    または css                   "
        echo "  │  家老・足軽: tmux attach -t multiagent    または csm         "
        echo "  └──────────────────────────────────────────────────────────────┘"
        echo ""
    else
        log_error "GUI起動に失敗しました"
        echo ""
        echo "  ログを確認: cat $LOG_FILE"
        echo ""
        rm -f "$PID_FILE"
        exit 1
    fi
else
    # フォアグラウンド起動
    log_info "フォアグラウンドで起動中..."
    echo ""
    echo "  ┌──────────────────────────────────────────────────────────────┐"
    echo "  │  🌐 アクセスURL: http://$HOST:$PORT                          "
    echo "  │  🛑 停止: Ctrl+C                                             "
    echo "  └──────────────────────────────────────────────────────────────┘"
    echo ""
    echo "  ┌──────────────────────────────────────────────────────────────┐"
    echo "  │  🎮 tmuxセッション（別ターミナルで実行）                      "
    echo "  │  将軍: tmux attach -t shogun    または css                   "
    echo "  │  家老・足軽: tmux attach -t multiagent    または csm         "
    echo "  └──────────────────────────────────────────────────────────────┘"
    echo ""

    # フォアグラウンドで実行（Ctrl+Cで停止可能）
    exec $CMD
fi
