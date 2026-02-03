#!/bin/bash
# ============================================================
# setup_gui.sh - multi-agent-shogun-gui 初回セットアップスクリプト
# GUI付きshogunシステムの環境構築ツール
# ============================================================
# 実行方法:
#   chmod +x setup_gui.sh
#   ./setup_gui.sh
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

log_step() {
    echo -e "\n${CYAN}${BOLD}━━━ $1 ━━━${NC}\n"
}

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 結果追跡用変数
RESULTS=()
HAS_ERROR=false

echo ""
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║  🏯 multi-agent-shogun-gui インストーラー                     ║"
echo "  ║     GUI Dashboard + CLI Agent System                         ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  このスクリプトはGUI付きshogunシステムの初回セットアップ用です。"
echo "  CLI本体のセットアップ + GUI依存関係のインストールを行います。"
echo ""
echo "  インストール先: $SCRIPT_DIR"
echo ""

# ============================================================
# STEP 1: CLI本体のセットアップを実行
# ============================================================
log_step "STEP 1: CLI本体のセットアップ"

if [ -f "$SCRIPT_DIR/shogun/first_setup.sh" ]; then
    log_info "shogun/first_setup.sh を実行中..."
    if bash "$SCRIPT_DIR/shogun/first_setup.sh"; then
        log_success "CLI本体のセットアップ完了"
        RESULTS+=("CLI本体: OK")
    else
        log_warn "CLI本体のセットアップで警告がありました（続行可能）"
        RESULTS+=("CLI本体: 警告あり")
    fi
else
    log_error "shogun/first_setup.sh が見つかりません"
    RESULTS+=("CLI本体: 失敗")
    HAS_ERROR=true
fi

# ============================================================
# STEP 2: シンボリックリンク作成
# ============================================================
log_step "STEP 2: シンボリックリンク作成"

# シンボリックリンク対象リスト
SYMLINK_TARGETS=(
    "config"
    "queue"
    "status"
    "logs"
    "memory"
    "dashboard.md"
)

LINK_CREATED=0
LINK_EXISTED=0

for target in "${SYMLINK_TARGETS[@]}"; do
    if [ -e "$SCRIPT_DIR/shogun/$target" ] || [ -d "$SCRIPT_DIR/shogun/$target" ]; then
        if [ -L "$SCRIPT_DIR/$target" ]; then
            log_info "$target: シンボリックリンク既存"
            LINK_EXISTED=$((LINK_EXISTED + 1))
        elif [ -e "$SCRIPT_DIR/$target" ]; then
            log_warn "$target: 実体ファイルが存在（スキップ）"
        else
            ln -s "shogun/$target" "$SCRIPT_DIR/$target"
            log_info "$target -> shogun/$target リンク作成"
            LINK_CREATED=$((LINK_CREATED + 1))
        fi
    else
        log_warn "shogun/$target が存在しません"
    fi
done

log_success "シンボリックリンク: 作成 $LINK_CREATED, 既存 $LINK_EXISTED"
RESULTS+=("シンボリックリンク: OK")

# ============================================================
# STEP 3: Python環境チェック
# ============================================================
log_step "STEP 3: Python環境チェック"

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    log_success "Python3 がインストール済みです (v$PYTHON_VERSION)"
    RESULTS+=("Python3: OK (v$PYTHON_VERSION)")
else
    log_error "Python3 がインストールされていません"
    echo ""
    echo "  インストール方法:"
    echo "    Ubuntu/Debian: sudo apt-get install python3 python3-pip"
    echo "    macOS:         brew install python3"
    RESULTS+=("Python3: 未インストール")
    HAS_ERROR=true
fi

# ============================================================
# STEP 4: GUI依存関係インストール
# ============================================================
log_step "STEP 4: GUI依存関係インストール"

if command -v pip3 &> /dev/null || command -v pip &> /dev/null; then
    PIP_CMD="pip3"
    if ! command -v pip3 &> /dev/null; then
        PIP_CMD="pip"
    fi

    log_info "Python依存関係をインストール中..."
    if $PIP_CMD install -r "$SCRIPT_DIR/requirements.txt" --quiet; then
        log_success "GUI依存関係インストール完了"
        RESULTS+=("GUI依存関係: OK")
    else
        log_error "GUI依存関係のインストールに失敗しました"
        RESULTS+=("GUI依存関係: 失敗")
        HAS_ERROR=true
    fi
else
    log_error "pip がインストールされていません"
    echo ""
    echo "  インストール方法:"
    echo "    Ubuntu/Debian: sudo apt-get install python3-pip"
    RESULTS+=("GUI依存関係: pip未インストール")
    HAS_ERROR=true
fi

# ============================================================
# STEP 5: dashboard.md 初期化
# ============================================================
log_step "STEP 5: dashboard.md 初期化"

DASHBOARD_PATH="$SCRIPT_DIR/shogun/dashboard.md"

if [ ! -f "$DASHBOARD_PATH" ]; then
    log_info "dashboard.md を作成中..."
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M")
    cat > "$DASHBOARD_PATH" << EOF
# 戦況報告（Dashboard）

最終更新: $TIMESTAMP

---

## 🚨 要対応

なし

---

## 📋 進行中

| ID | プロジェクト | タスク | 担当 | 状態 |
|----|------------|--------|------|------|
| - | - | - | - | - |

---

## ✅ 本日の戦果

| ID | プロジェクト | タスク | 結果 |
|----|------------|--------|------|
| - | - | - | - |

---

## 💡 スキル化候補

なし

---

## 🛠️ 生成されたスキル

なし

---

## ⏳ 待機中

なし

---

## ❓ 伺い事項

なし
EOF
    log_success "dashboard.md を作成しました"
else
    log_info "dashboard.md は既に存在します"
fi

RESULTS+=("dashboard.md: OK")

# ============================================================
# STEP 6: queue/shogun_to_karo.yaml 初期化
# ============================================================
log_step "STEP 6: 指示キュー初期化"

QUEUE_PATH="$SCRIPT_DIR/shogun/queue/shogun_to_karo.yaml"

if [ ! -f "$QUEUE_PATH" ]; then
    log_info "shogun_to_karo.yaml を作成中..."
    cat > "$QUEUE_PATH" << 'EOF'
# 将軍 → 家老 指示キュー
# status: pending → in_progress → done

queue: []
EOF
    log_success "shogun_to_karo.yaml を作成しました"
else
    log_info "shogun_to_karo.yaml は既に存在します"
fi

RESULTS+=("指示キュー: OK")

# ============================================================
# STEP 7: bashrc alias設定（GUI用）
# ============================================================
log_step "STEP 7: GUI用alias設定"

BASHRC_FILE="$HOME/.bashrc"
ALIAS_ADDED=false

if [ -f "$BASHRC_FILE" ]; then
    # csg alias (GUI起動)
    EXPECTED_CSG="alias csg='python3 $SCRIPT_DIR/app.py --dashboard $SCRIPT_DIR/dashboard.md'"
    if ! grep -q "alias csg=" "$BASHRC_FILE" 2>/dev/null; then
        echo "" >> "$BASHRC_FILE"
        echo "# multi-agent-shogun-gui alias (added by setup_gui.sh)" >> "$BASHRC_FILE"
        echo "$EXPECTED_CSG" >> "$BASHRC_FILE"
        log_info "alias csg を追加しました（GUIダッシュボード起動）"
        ALIAS_ADDED=true
    else
        log_info "alias csg は既に設定されています"
    fi
else
    log_warn "$BASHRC_FILE が見つかりません"
fi

if [ "$ALIAS_ADDED" = true ]; then
    log_success "alias設定を追加しました"
    log_warn "alias を反映するには: source ~/.bashrc"
fi

RESULTS+=("GUI alias: OK")

# ============================================================
# 結果サマリー
# ============================================================
echo ""
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║  📋 セットアップ結果サマリー                                  ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo ""

for result in "${RESULTS[@]}"; do
    if [[ $result == *"未インストール"* ]] || [[ $result == *"失敗"* ]]; then
        echo -e "  ${RED}✗${NC} $result"
    elif [[ $result == *"警告"* ]] || [[ $result == *"スキップ"* ]]; then
        echo -e "  ${YELLOW}!${NC} $result"
    else
        echo -e "  ${GREEN}✓${NC} $result"
    fi
done

echo ""

if [ "$HAS_ERROR" = true ]; then
    echo "  ╔══════════════════════════════════════════════════════════════╗"
    echo "  ║  ⚠️  一部の依存関係が不足しています                           ║"
    echo "  ╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  上記の警告を確認し、不足しているものをインストールしてください。"
else
    echo "  ╔══════════════════════════════════════════════════════════════╗"
    echo "  ║  ✅ セットアップ完了！準備万端でござる！                      ║"
    echo "  ╚══════════════════════════════════════════════════════════════╝"
fi

echo ""
echo "  ┌──────────────────────────────────────────────────────────────┐"
echo "  │  📜 次のステップ                                             │"
echo "  └──────────────────────────────────────────────────────────────┘"
echo ""
echo "  1. エージェント起動（出陣）:"
echo "     ./shogun/shutsujin_departure.sh"
echo ""
echo "  2. GUIダッシュボード起動:"
echo "     python3 app.py --dashboard ./dashboard.md"
echo "     または: csg（alias設定済みの場合）"
echo ""
echo "  3. ブラウザでアクセス:"
echo "     http://127.0.0.1:1059"
echo ""
echo "  ┌──────────────────────────────────────────────────────────────┐"
echo "  │  🎮 利用可能なalias                                          │"
echo "  └──────────────────────────────────────────────────────────────┘"
echo ""
echo "  css  - 将軍ウィンドウを開く (tmux attach -t shogun)"
echo "  csm  - 家老・足軽ウィンドウを開く (tmux attach -t multiagent)"
echo "  csg  - GUIダッシュボードを起動"
echo ""
echo "  ════════════════════════════════════════════════════════════════"
echo "   天下布武！ (Tenka Fubu!)"
echo "  ════════════════════════════════════════════════════════════════"
echo ""

if [ "$HAS_ERROR" = true ]; then
    exit 1
fi
