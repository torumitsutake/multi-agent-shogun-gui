<div align="center">

# multi-agent-shogun-gui

**[multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) のWebダッシュボード — ブラウザからAI軍団を監視・指揮**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Built_for-Claude_Code-blueviolet)](https://code.claude.com)
[![Python](https://img.shields.io/badge/Python-FastAPI-blue)]()

[English](README.md) | [日本語](README_ja.md)

</div>

---

[multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) の上に載るリアルタイムWeb GUIです。ブラウザひとつで命令を出し、エージェントの稼働状況を確認し、結果をレビューできます。

<p align="center">
  <img src="screenshot.png" alt="multi-agent-shogun-gui ダッシュボード - リアルタイム監視・制御インターフェース" width="800" style="max-width: 100%;">
</p>

*将軍ステータス・進行中タスク・足軽ワーカーを表示するライブダッシュボード — AI労働力全体をひとつの画面で監視*

## 機能

- **ライブダッシュボード** — `dashboard.md` をパースし、要対応事項・進行中タスク・完了タスク・スキル化候補をクリーンなUIで表示（5秒ごとに自動更新）
- **コマンド入力** — ブラウザから将軍に直接指示を送信（`Cmd+Enter` / `Ctrl+Enter`）
- **将軍ターミナル** — tmuxにアタッチせずに将軍のリアルタイム出力を確認
- **足軽モニター** — 進捗テーブルのワーカーをクリックすると、モーダルでペイン出力をリアルタイム表示
- **スキル化候補ビューア** — 提案されたスキルをポップアップカードレイアウトで閲覧

## アーキテクチャ

```
multi-agent-shogun-gui/
├── app.py                     # FastAPI サーバー
├── parser.py                  # dashboard.md → JSON パーサー
├── setup_gui.sh               # 初回セットアップ（CLI + GUI）
├── start_gui.sh               # GUI + エージェント起動
├── stop_gui.sh                # GUI停止（エージェントも任意で停止）
├── requirements.txt           # Python依存パッケージ（FastAPI, uvicorn）
│
├── static/
│   ├── index.html             # ダッシュボード SPA
│   ├── style.css
│   └── app.js
│
├── shogun/                    # ← multi-agent-shogun の git subtree
│   ├── CLAUDE.md
│   ├── instructions/
│   ├── shutsujin_departure.sh
│   ├── first_setup.sh
│   └── ...
│
└── symlinks（セットアップで作成）
    ├── config → shogun/config
    ├── queue → shogun/queue
    ├── dashboard.md → shogun/dashboard.md
    └── ...
```

GUIは `dashboard.md` と tmux ペイン出力を FastAPI バックエンド経由で読み取ります。CLIエージェントシステム（`shogun/`）は tmux 内で独立して動作し、GUIはその上に載る読み取り・指揮レイヤーです。

## 前提条件

- **macOS または Linux**（WindowsはWSL2）
- **Python 3.8+**
- **tmux**
- **Claude Code CLI**（`claude`）
- **Node.js**（MCPサーバー用）

## クイックスタート

```bash
# 1. クローン
git clone https://github.com/torumitsutake/multi-agent-shogun-gui.git
cd multi-agent-shogun-gui

# 2. 初回セットアップ（CLI依存関係 + GUI依存関係をインストール）
chmod +x setup_gui.sh start_gui.sh stop_gui.sh
./setup_gui.sh

# 3. 起動（エージェント + GUI）
./start_gui.sh

# 4. ブラウザで開く
open http://127.0.0.1:1059
```

## 使い方

### 起動

```bash
./start_gui.sh                # エージェント + GUI を起動（デフォルト）
./start_gui.sh -p 8080        # カスタムポート
./start_gui.sh --no-agent     # GUIのみ（エージェントは起動済みの場合）
./start_gui.sh --dev           # 開発モード（ホットリロード）
./start_gui.sh -c              # クリーンスタート（エージェントをリセット）
```

### 停止

```bash
./stop_gui.sh                  # GUIのみ停止
./stop_gui.sh -a               # GUI + 全エージェント停止（tmuxセッション含む）
./stop_gui.sh -f               # 強制停止（SIGKILL）
```

### tmux セッション

エージェントシステムは2つのtmuxセッションで動作します：

| セッション | 内容 | アタッチ |
|-----------|------|---------|
| `shogun` | 将軍（総大将） | `tmux attach -t shogun` |
| `multiagent` | 家老（ペイン0）+ 足軽1-8（ペイン1-8） | `tmux attach -t multiagent` |

### 便利なエイリアス（セットアップで追加）

```bash
css   # 将軍セッションにアタッチ
csm   # multiagentセッションにアタッチ
csg   # GUIダッシュボードを起動
```

## Shogun Coreのアップデート

`shogun/` ディレクトリは [yohey-w/multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) からの [git subtree](https://www.atlassian.com/git/tutorials/git-subtree) として管理されています。

```bash
# upstreamリモートの追加（初回のみ）
git remote add upstream git@github.com:yohey-w/multi-agent-shogun.git

# 最新の変更を取得
git fetch upstream
git subtree pull --prefix=shogun upstream main --squash
```

## APIエンドポイント

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| `GET` | `/` | ダッシュボードHTML |
| `GET` | `/api/dashboard` | パース済みダッシュボードデータ（JSON） |
| `GET` | `/api/pane/shogun` | 将軍ペイン出力 |
| `GET` | `/api/ashigaru/{ashigaru_id}/output` | 足軽ペイン出力 |
| `POST` | `/api/command` | 将軍にコマンド送信 |

## トラブルシューティング

<details>
<summary><b>GUIが起動しない？</b></summary>

依存パッケージがインストールされているか確認：
```bash
pip3 install -r requirements.txt
```

別のインスタンスが動いていないか確認：
```bash
./stop_gui.sh
./start_gui.sh
```

</details>

<details>
<summary><b>ダッシュボードにデータが表示されない？</b></summary>

エージェントが稼働中で `dashboard.md` が存在するか確認：
```bash
ls -la dashboard.md           # shogun/dashboard.md へのシンボリックリンクのはず
tmux has-session -t shogun    # 0が返れば正常
```

</details>

<details>
<summary><b>足軽の出力が表示されない？</b></summary>

GUIは `tmux capture-pane` でtmuxペイン出力を読み取ります。multiagentセッションが動作しているか確認：
```bash
tmux has-session -t multiagent
```

</details>

CLI関連の問題については、[multi-agent-shogun トラブルシューティングガイド](https://github.com/yohey-w/multi-agent-shogun#troubleshooting)を参照してください。

## クレジット

このプロジェクトは [yohey-w](https://github.com/yohey-w) 氏の [multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) をベースに構築されています。Claude Code と tmux を活用した強力なマルチエージェント並列開発フレームワークであり、本GUIを支えるCLIベースのエージェント階層（将軍→家老→足軽）はすべて multi-agent-shogun に由来します。この卓越した基盤に深く感謝いたします。

このプロジェクトが役に立ったら、ぜひ元リポジトリにスターを: [⭐ multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun)

- 原型: [Claude-Code-Communication](https://github.com/Akira-Papa/Claude-Code-Communication) by Akira-Papa

## ライセンス

[MIT](LICENSE)
