#!/bin/bash
#
# multi-agent-shogun-gui: subtree構成への移行スクリプト
#
# 【概要】
# 現在のGUIリポジトリを、CLI本体をsubtreeとして取り込む構成に再構築する
#
# 【実行前の確認事項】
# - 作業中のファイルがないこと（git status がクリーン）
# - インターネット接続があること（GitHub から subtree を取得）
#
# 【実行方法】
# chmod +x migrate_to_subtree.sh
# ./migrate_to_subtree.sh
#

set -e  # エラー時に停止

# 色付き出力
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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 確認プロンプト
confirm() {
    read -p "$1 [y/N]: " response
    case "$response" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) return 1 ;;
    esac
}

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "=========================================="
echo "  multi-agent-shogun-gui 移行スクリプト"
echo "=========================================="
echo ""

# ===== Phase 0: 事前確認 =====
log_info "Phase 0: 事前確認"

# Git リポジトリか確認
if [ ! -d ".git" ]; then
    log_error "Gitリポジトリではありません。正しいディレクトリで実行してください。"
    exit 1
fi

# 作業ディレクトリがクリーンか確認
if [ -n "$(git status --porcelain)" ]; then
    log_warning "未コミットの変更があります:"
    git status --short
    echo ""
    if ! confirm "続行しますか？（変更は移行コミットに含まれます）"; then
        log_info "中止しました。先に git commit または git stash を実行してください。"
        exit 0
    fi
fi

log_success "事前確認完了"
echo ""

# ===== Phase 1: エージェント停止 =====
log_info "Phase 1: エージェント停止"

if tmux has-session -t shogun 2>/dev/null; then
    log_info "shogun セッションを停止中..."
    tmux kill-session -t shogun
    log_success "shogun セッション停止完了"
else
    log_info "shogun セッションは存在しません（スキップ）"
fi

if tmux has-session -t multiagent 2>/dev/null; then
    log_info "multiagent セッションを停止中..."
    tmux kill-session -t multiagent
    log_success "multiagent セッション停止完了"
else
    log_info "multiagent セッションは存在しません（スキップ）"
fi

log_success "Phase 1 完了: エージェント停止"
echo ""

# ===== Phase 2: 重複ファイルの削除 =====
log_info "Phase 2: CLI本体からコピーしたファイルを削除"

# 削除対象リスト
DELETE_TARGETS=(
    "CLAUDE.md"
    "instructions"
    "shutsujin_departure.sh"
    "first_setup.sh"
    "setup.sh"
    "install.bat"
    "context"
    "skills"
    "config"
    "queue"
    "status"
    "logs"
    "memory"
    ".claude"
    "dashboard.md"
    "README.md"
    "README_ja.md"
    ".gitattributes"
    "projects"
)

for target in "${DELETE_TARGETS[@]}"; do
    if [ -e "$target" ] || [ -L "$target" ]; then
        log_info "削除: $target"
        rm -rf "$target"
    fi
done

# コミット
git add -A
if [ -n "$(git status --porcelain)" ]; then
    git commit -m "Remove CLI files before subtree add

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
    log_success "削除をコミットしました"
else
    log_info "削除対象がありませんでした（スキップ）"
fi

log_success "Phase 2 完了: 重複ファイル削除"
echo ""

# ===== Phase 3: subtree add =====
log_info "Phase 3: CLI本体をsubtreeとして追加"

UPSTREAM_REPO="https://github.com/yohey-w/multi-agent-shogun.git"
SUBTREE_PREFIX="shogun"

log_info "取得元: $UPSTREAM_REPO"
log_info "配置先: $SUBTREE_PREFIX/"

git subtree add --prefix="$SUBTREE_PREFIX" "$UPSTREAM_REPO" main --squash

log_success "Phase 3 完了: subtree add"
echo ""

# ===== Phase 4: シンボリックリンク作成 =====
log_info "Phase 4: シンボリックリンク作成"

# シンボリックリンク対象リスト
SYMLINK_TARGETS=(
    "CLAUDE.md"
    "instructions"
    "queue"
    "dashboard.md"
    "config"
    "context"
    "skills"
    "status"
    "logs"
    "memory"
    ".claude"
)

for target in "${SYMLINK_TARGETS[@]}"; do
    if [ -e "$SUBTREE_PREFIX/$target" ] || [ -d "$SUBTREE_PREFIX/$target" ]; then
        if [ ! -e "$target" ]; then
            log_info "シンボリックリンク作成: $target -> $SUBTREE_PREFIX/$target"
            ln -s "$SUBTREE_PREFIX/$target" "$target"
        else
            log_warning "$target は既に存在します（スキップ）"
        fi
    else
        log_warning "$SUBTREE_PREFIX/$target が存在しません（スキップ）"
    fi
done

# コミット
git add -A
if [ -n "$(git status --porcelain)" ]; then
    git commit -m "Add symlinks to shogun/ directory

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
    log_success "シンボリックリンクをコミットしました"
else
    log_info "シンボリックリンクの変更がありませんでした（スキップ）"
fi

log_success "Phase 4 完了: シンボリックリンク作成"
echo ""

# ===== Phase 5: 完了報告 =====
echo ""
echo "=========================================="
echo "  移行完了！"
echo "=========================================="
echo ""
log_success "subtree構成への移行が完了しました"
echo ""
echo "【移行後の構成】"
echo "  shogun/          - CLI本体（git subtree）"
echo "  app.py           - GUI（維持）"
echo "  parser.py        - GUI（維持）"
echo "  static/          - GUI（維持）"
echo "  CLAUDE.md        - シンボリックリンク -> shogun/CLAUDE.md"
echo "  instructions/    - シンボリックリンク -> shogun/instructions/"
echo "  queue/           - シンボリックリンク -> shogun/queue/"
echo "  dashboard.md     - シンボリックリンク -> shogun/dashboard.md"
echo ""
echo "【次のステップ】"
echo "  1. エージェント再起動: ./shogun/shutsujin_departure.sh"
echo "  2. GUI起動: python3 app.py --dashboard ./dashboard.md"
echo ""
echo "【CLI本体の更新取り込み（将来）】"
echo "  git subtree pull --prefix=shogun $UPSTREAM_REPO main --squash"
echo ""
