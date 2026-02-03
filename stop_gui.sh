#!/bin/bash
# ============================================================
# stop_gui.sh - multi-agent-shogun-gui 停止スクリプト
# ============================================================
# 実行方法:
#   ./stop_gui.sh           # GUIのみ停止
#   ./stop_gui.sh -a        # GUI + エージェント停止
#   ./stop_gui.sh -f        # 強制停止（SIGKILL）
# ============================================================

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
FORCE=false
STOP_AGENT=false
PID_FILE="$SCRIPT_DIR/.gui.pid"

# ヘルプ表示
show_help() {
    echo ""
    echo "  使用方法: ./stop_gui.sh [オプション]"
    echo ""
    echo "  オプション:"
    echo "    -a, --all      GUI + エージェント（tmuxセッション）を停止"
    echo "    -f, --force    強制停止（SIGKILL使用）"
    echo "    --help         このヘルプを表示"
    echo ""
    echo "  例:"
    echo "    ./stop_gui.sh          # GUIのみ停止"
    echo "    ./stop_gui.sh -a       # GUI + エージェント停止"
    echo "    ./stop_gui.sh -a -f    # 全て強制停止"
    echo ""
}

# 引数パース
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--all)
            STOP_AGENT=true
            shift
            ;;
        -f|--force)
            FORCE=true
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
echo "  ║  🏯 multi-agent-shogun-gui 停止                              ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# STEP 1: GUI停止
# ============================================================
log_info "STEP 1: GUI停止"

GUI_STOPPED=false

# PIDファイルからプロセス停止を試みる
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        log_info "GUI停止中... (PID: $PID)"

        if [ "$FORCE" = true ]; then
            kill -9 "$PID" 2>/dev/null || true
            log_warn "強制停止しました (SIGKILL)"
        else
            kill "$PID" 2>/dev/null || true

            # 最大5秒待機
            for i in {1..5}; do
                if ! kill -0 "$PID" 2>/dev/null; then
                    break
                fi
                sleep 1
            done

            # まだ生きていたら強制終了
            if kill -0 "$PID" 2>/dev/null; then
                log_warn "通常停止に失敗、強制停止します..."
                kill -9 "$PID" 2>/dev/null || true
            fi
        fi

        rm -f "$PID_FILE"
        log_success "GUI停止完了"
        GUI_STOPPED=true
    else
        log_warn "PIDファイルは存在しますが、プロセスは既に停止しています"
        rm -f "$PID_FILE"
    fi
else
    log_info "PIDファイルが見つかりません"
fi

# app.py プロセスを検索して停止（PIDファイルがない場合のフォールバック）
if [ "$GUI_STOPPED" = false ]; then
    RUNNING_PIDS=$(pgrep -f "python.*app.py.*dashboard" 2>/dev/null || true)

    if [ -n "$RUNNING_PIDS" ]; then
        log_info "実行中のGUIプロセスを検出:"
        for pid in $RUNNING_PIDS; do
            CMD=$(ps -p "$pid" -o args= 2>/dev/null || echo "unknown")
            echo "  PID $pid: $CMD"
        done
        echo ""

        read -p "  これらのプロセスを停止しますか? [Y/n]: " REPLY
        REPLY=${REPLY:-Y}
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for pid in $RUNNING_PIDS; do
                if [ "$FORCE" = true ]; then
                    kill -9 "$pid" 2>/dev/null || true
                else
                    kill "$pid" 2>/dev/null || true
                fi
                log_info "停止: PID $pid"
            done
            log_success "全てのGUIプロセスを停止しました"
        else
            log_info "GUI停止をキャンセルしました"
        fi
    else
        log_info "実行中のGUIプロセスはありません"
    fi
fi

echo ""

# ============================================================
# STEP 2: エージェント停止（オプション）
# ============================================================
if [ "$STOP_AGENT" = true ]; then
    log_info "STEP 2: エージェント停止"

    # shogun セッション停止
    if tmux has-session -t shogun 2>/dev/null; then
        log_info "shogun セッションを停止中..."
        tmux kill-session -t shogun
        log_success "shogun セッション停止完了"
    else
        log_info "shogun セッションは存在しません"
    fi

    # multiagent セッション停止
    if tmux has-session -t multiagent 2>/dev/null; then
        log_info "multiagent セッションを停止中..."
        tmux kill-session -t multiagent
        log_success "multiagent セッション停止完了"
    else
        log_info "multiagent セッションは存在しません"
    fi

    echo ""
    log_success "全システム停止完了"
else
    echo "  ┌──────────────────────────────────────────────────────────────┐"
    echo "  │  💡 エージェントも停止する場合: ./stop_gui.sh -a             "
    echo "  └──────────────────────────────────────────────────────────────┘"
fi

echo ""
