<div align="center">

# multi-agent-shogun-gui

**[multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) の軍議場（Web指揮所） — ブラウザより全軍を監視し、下知を飛ばす**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Built_for-Claude_Code-blueviolet)](https://code.claude.com)
[![Python](https://img.shields.io/badge/Python-FastAPI-blue)]()

[English](README.md) | [日本語](README_ja.md)

</div>

---

[multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) の上に据えるリアルタイム軍議場（Web GUI）でござる。ブラウザひとつで下知を飛ばし、諸隊の動きを睨み、戦果を検分することができるのじゃ。

<p align="center">
  <img src="screenshot.png" alt="multi-agent-shogun-gui ダッシュボード - リアルタイム監視・制御インターフェース" width="800" style="max-width: 100%;">
</p>

*将軍の陣容・進行中の作戦・足軽の働きぶりを映す陣中絵図 — AI全軍をひとつの画面にて統覧できるのじゃ*

## 備えの功能

- **陣中絵図（ライブダッシュボード）** — `dashboard.md` を読み解き、要対応の急報・進行中の作戦・完了した武功・スキル化候補を整然たるUIで表示する（五秒ごとに自動更新）
- **下知入力** — ブラウザより将軍に直接命令を送ることができる（`Cmd+Enter` / `Ctrl+Enter`）
- **将軍の陣中日記** — tmuxにアタッチせずとも、将軍の働きぶりをリアルタイムで検分できる
- **足軽の動静** — 進捗の軍勢表にてワーカーをクリックすれば、モーダルにてペイン出力をリアルタイム表示する
- **スキル化候補の目利き** — 提案されたスキルを札組み（ポップアップカード）で一覧できる

## 城郭の構え

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

GUIは `dashboard.md` と tmux ペイン出力を FastAPI バックエンド経由で読み取る仕組みでござる。CLIの軍制（`shogun/`）は tmux 内にて独立して動いており、GUIはその上に載る物見櫓・指揮所の役割を果たすのじゃ。

## 出陣の備え

以下の武具を揃えてから参陣されよ：

- **macOS または Linux**（WindowsはWSL2にて参陣のこと）
- **Python 3.8+**
- **tmux**
- **Claude Code CLI**（`claude`）
- **Node.js**（MCPサーバー用）

## 陣立ての儀

```bash
# 一、陣地を構える
git clone https://github.com/torumitsutake/multi-agent-shogun-gui.git
cd multi-agent-shogun-gui

# 二、初回の陣立て（CLI依存関係 + GUI依存関係をインストール）
chmod +x setup_gui.sh start_gui.sh stop_gui.sh
./setup_gui.sh

# 三、出陣（エージェント + GUI）
./start_gui.sh

# 四、軍議場をブラウザにて開く
open http://127.0.0.1:1059
```

## 出陣の作法

### 出陣

```bash
./start_gui.sh                # エージェント + GUI を起動（デフォルト）
./start_gui.sh -p 8080        # カスタムポート
./start_gui.sh --no-agent     # GUIのみ（エージェントは起動済みの場合）
./start_gui.sh --dev           # 開発モード（ホットリロード）
./start_gui.sh -c              # クリーンスタート（エージェントをリセット）
```

### 退陣

```bash
./stop_gui.sh                  # GUIのみ停止
./stop_gui.sh -a               # GUI + 全エージェント停止（tmuxセッション含む）
./stop_gui.sh -f               # 強制停止（SIGKILL）
```

### tmux 陣営

軍制は二つのtmux陣営にて動いておる：

| 陣営 | 布陣 | 参陣の仕方 |
|------|------|-----------|
| `shogun` | 将軍（総大将） | `tmux attach -t shogun` |
| `multiagent` | 家老（ペイン0）+ 足軽1-8（ペイン1-8） | `tmux attach -t multiagent` |

### 便利な合言葉（セットアップで追加）

```bash
css   # 将軍の陣にアタッチ
csm   # multiagent陣営にアタッチ
csg   # 軍議場（GUIダッシュボード）を起動
```

## 本陣の更新

`shogun/` の陣は [yohey-w/multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) からの [git subtree](https://www.atlassian.com/git/tutorials/git-subtree) として管理されておる。本陣の最新の軍法を取り入れるには、以下の通りにいたせ。

```bash
# upstreamリモートの追加（初陣のみ）
git remote add upstream git@github.com:yohey-w/multi-agent-shogun.git

# 最新の軍法を取得
git fetch upstream
git subtree pull --prefix=shogun upstream main --squash
```

## 伝令の経路

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| `GET` | `/` | ダッシュボードHTML |
| `GET` | `/api/dashboard` | パース済みダッシュボードデータ（JSON） |
| `GET` | `/api/pane/shogun` | 将軍ペイン出力 |
| `GET` | `/api/ashigaru/{ashigaru_id}/output` | 足軽ペイン出力 |
| `POST` | `/api/command` | 将軍にコマンド送信 |

## 陣中の難儀

<details>
<summary><b>軍議場が開かぬ？</b></summary>

兵糧（依存パッケージ）が揃っておるか確認いたせ：
```bash
pip3 install -r requirements.txt
```

別の陣が張られておらぬか確認：
```bash
./stop_gui.sh
./start_gui.sh
```

</details>

<details>
<summary><b>陣中絵図にデータが映らぬ？</b></summary>

軍勢が動いており `dashboard.md` が存在するか確認いたせ：
```bash
ls -la dashboard.md           # shogun/dashboard.md へのシンボリックリンクのはず
tmux has-session -t shogun    # 0が返れば正常
```

</details>

<details>
<summary><b>足軽の動静が見えぬ？</b></summary>

GUIは `tmux capture-pane` にてtmuxペイン出力を読み取っておる。multiagent陣営が動いておるか確認いたせ：
```bash
tmux has-session -t multiagent
```

</details>

CLI軍制に関わる難儀は、[multi-agent-shogun 陣中救護の書](https://github.com/yohey-w/multi-agent-shogun#troubleshooting)を参照されたし。

## 恩義

この軍議場は [yohey-w](https://github.com/yohey-w) 殿の [multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) を礎に築かれたものでござる。Claude Code と tmux を駆使した強力なる並列開発の軍制であり、本GUIを支えるCLI軍制の階層（将軍→家老→足軽）はすべて multi-agent-shogun に由来する。この卓越した軍法の基盤に深き恩義を表するものなり。

この軍議場が御役に立ったならば、ぜひ本陣にも星印を献上されたし: [⭐ multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun)

- 軍法の原型: [Claude-Code-Communication](https://github.com/Akira-Papa/Claude-Code-Communication) by Akira-Papa

## 御定書

[MIT](LICENSE)
