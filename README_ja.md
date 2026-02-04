<div align="center">

# multi-agent-shogun-gui

**[multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) の軍議場（Web指揮所） — ブラウザより全軍を監視し、指示を送る**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Built_for-Claude_Code-blueviolet)](https://code.claude.com)
[![Python](https://img.shields.io/badge/Python-FastAPI-blue)]()

[English](README.md) | [日本語](README_ja.md)

</div>

---

[multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) の上に据えるリアルタイム軍議場（Web GUI）でござる。ブラウザひとつで指示を送り、エージェントの状況を確認し、結果を確認することができるのじゃ。

<p align="center">
  <img src="screenshot.png" alt="multi-agent-shogun-gui ダッシュボード - リアルタイム監視・制御インターフェース" width="800" style="max-width: 100%;">
</p>

*将軍の状態・進行中のタスク・足軽の進捗を映すダッシュボード — AI全軍をひとつの画面にて統覧できるのじゃ*

## 機能

- **ライブダッシュボード** — `dashboard.md` を読み解き、要対応の急報・進行中のタスク・完了したタスク・スキル化候補を整然たるUIで表示する（五秒ごとに自動更新）
- **コマンド入力** — ブラウザより将軍に直接命令を送ることができる（`Cmd+Enter` / `Ctrl+Enter`）
- **将軍のログ** — tmuxにアタッチせずとも、将軍の作業内容をリアルタイムで確認できる
- **足軽の進捗** — 進捗表にてワーカーをクリックすれば、モーダルにてペイン出力をリアルタイム表示する
- **スキル化候補の確認** — 提案されたスキルをポップアップカードで一覧できる

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

GUIは `dashboard.md` と tmux ペイン出力を FastAPI バックエンド経由で読み取る仕組みでござる。CLIの軍制（`shogun/`）は tmux 内にて独立して動いており、GUIはその上に載る監視・制御パネルの役割を果たすのじゃ。

## 前提条件

以下を準備してから始めるのじゃ：

- **macOS または Linux**（WindowsはWSL2にて参陣のこと）
- **Python 3.8+**
- **tmux**
- **Claude Code CLI**（`claude`）
- **Node.js**（MCPサーバー用）

## セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/torumitsutake/multi-agent-shogun-gui.git
cd multi-agent-shogun-gui

# 2. 初回セットアップ（CLI依存関係 + GUI依存関係をインストール）
chmod +x setup_gui.sh start_gui.sh stop_gui.sh
./setup_gui.sh

# 3. 起動（エージェント + GUI）
./start_gui.sh

# 4. ブラウザでダッシュボードを開く
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

システムは二つのtmuxセッションにて動いておる：

| セッション | 構成 | アタッチ方法 |
|------|------|-----------|
| `shogun` | 将軍（総大将） | `tmux attach -t shogun` |
| `multiagent` | 家老（ペイン0）+ 足軽1-8（ペイン1-8） | `tmux attach -t multiagent` |

### 便利なエイリアス（セットアップで追加）

```bash
css   # 将軍セッションにアタッチ
csm   # multiagentセッションにアタッチ
csg   # GUIダッシュボードを起動
```

## Shogun Core のアップデート

`shogun/` ディレクトリは [yohey-w/multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) からの [git subtree](https://www.atlassian.com/git/tutorials/git-subtree) として管理されておる。最新版を取り込むには、以下の通りにいたせ。

```bash
# upstreamリモートの追加（初回のみ）
git remote add upstream git@github.com:yohey-w/multi-agent-shogun.git

# 最新版を取得
git fetch upstream
git subtree pull --prefix=shogun upstream main --squash
```

## API エンドポイント

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| `GET` | `/` | ダッシュボードHTML |
| `GET` | `/api/dashboard` | パース済みダッシュボードデータ（JSON） |
| `GET` | `/api/pane/shogun` | 将軍ペイン出力 |
| `GET` | `/api/ashigaru/{ashigaru_id}/output` | 足軽ペイン出力 |
| `POST` | `/api/command` | 将軍にコマンド送信 |

## トラブルシューティング

<details>
<summary><b>ダッシュボードが開かぬ？</b></summary>

依存パッケージが揃っておるか確認いたせ：
```bash
pip3 install -r requirements.txt
```

別のプロセスが起動しておらぬか確認：
```bash
./stop_gui.sh
./start_gui.sh
```

</details>

<details>
<summary><b>ダッシュボードにデータが表示されぬ？</b></summary>

エージェントが動いており `dashboard.md` が存在するか確認いたせ：
```bash
ls -la dashboard.md           # shogun/dashboard.md へのシンボリックリンクのはず
tmux has-session -t shogun    # 0が返れば正常
```

</details>

<details>
<summary><b>足軽の出力が見えぬ？</b></summary>

GUIは `tmux capture-pane` にてtmuxペイン出力を読み取っておる。multiagentセッションが動いておるか確認いたせ：
```bash
tmux has-session -t multiagent
```

</details>

CLIシステムに関わるトラブルは、[multi-agent-shogun トラブルシューティング](https://github.com/yohey-w/multi-agent-shogun#troubleshooting)を参照されたし。

## クレジット

このGUIは [yohey-w](https://github.com/yohey-w) 殿の [multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) を礎に築かれたものでござる。Claude Code と tmux を駆使した強力なる並列開発システムであり、本GUIを支えるCLIシステムの階層（将軍→家老→足軽）はすべて multi-agent-shogun に由来する。この卓越したシステムの基盤に深き感謝を表するものなり。

このGUIが御役に立ったならば、ぜひ本家にも星印を献上されたし: [⭐ multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun)

- システムの原型: [Claude-Code-Communication](https://github.com/Akira-Papa/Claude-Code-Communication) by Akira-Papa

## ライセンス

[MIT](LICENSE)
