<div align="center">

# multi-agent-shogun <sup>v2.0.0</sup>

**Claude Code マルチエージェント統率システム**

*コマンド1つで、10体のAIエージェント（将軍1+家老1+足軽8）が並列稼働*

**Talk Coding — Vibe Codingではなく、スマホに話すだけでAIが実行**

[![GitHub Stars](https://img.shields.io/github/stars/yohey-w/multi-agent-shogun?style=social)](https://github.com/yohey-w/multi-agent-shogun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Built_for-Claude_Code-blueviolet)](https://code.claude.com)
[![Shell](https://img.shields.io/badge/Shell%2FBash-100%25-green)]()

[English](README.md) | [日本語](README_ja.md)

</div>

<!-- <p align="center">
  <img src="assets/screenshots/tmux_multiagent_9panes.png" alt="multi-agent-shogun: 9ペインが並列稼働" width="800">
</p> -->

<p align="center"><i>家老1体が足軽8体を統率 — 実際の稼働画面、モックデータなし</i></p>

---

## これは何？

**multi-agent-shogun** は、複数の Claude Code インスタンスを同時に実行し、戦国時代の軍制のように統率するシステムです。

**なぜ使うのか？**
- 1つの命令で、8体のAIワーカーが並列で実行
- 待ち時間なし - タスクがバックグラウンドで実行中も次の命令を出せる
- AIがセッションを跨いであなたの好みを記憶（Memory MCP）
- ダッシュボードでリアルタイム進捗確認

```
      あなた（上様）
           │
           ▼ 命令を出す
    ┌─────────────┐
    │   SHOGUN    │  ← 命令を受け取り、即座に委譲
    └──────┬──────┘
           │ YAMLファイル + tmux
    ┌──────▼──────┐
    │    KARO     │  ← タスクをワーカーに分配
    └──────┬──────┘
           │
  ┌─┬─┬─┬─┴─┬─┬─┬─┐
  │1│2│3│4│5│6│7│8│  ← 8体のワーカーが並列実行
  └─┴─┴─┴─┴─┴─┴─┴─┘
      ASHIGARU
```

---

## なぜ Shogun なのか？

多くのマルチエージェントフレームワークは、連携のためにAPIトークンを消費します。Shogunは違います。

| | Claude Code `Task` ツール | LangGraph | CrewAI | **multi-agent-shogun** |
|---|---|---|---|---|
| **アーキテクチャ** | 1プロセス内のサブエージェント | グラフベースの状態機械 | ロールベースエージェント | tmux経由の階層構造 |
| **並列性** | 逐次実行（1つずつ） | 並列ノード（v0.2+） | 限定的 | **8体の独立エージェント** |
| **連携コスト** | TaskごとにAPIコール | API + インフラ（Postgres/Redis） | API + CrewAIプラットフォーム | **ゼロ**（YAML + tmux） |
| **可観測性** | Claudeのログのみ | LangSmith連携 | OpenTelemetry | **ライブtmuxペイン** + ダッシュボード |
| **スキル発見** | なし | なし | なし | **ボトムアップ自動提案** |
| **セットアップ** | Claude Code内蔵 | 重い（インフラ必要） | pip install | シェルスクリプト |

### 他のフレームワークとの違い

**連携コストゼロ** — エージェント間の通信はディスク上のYAMLファイル。APIコールは実際の作業にのみ使われ、オーケストレーションには使われません。8体のエージェントを動かしても、支払うのは8体分の作業コストだけです。

**完全な透明性** — すべてのエージェントが見えるtmuxペインで動作。すべての指示・報告・判断がプレーンなYAMLファイルで、読んで、diffして、バージョン管理できます。ブラックボックスなし。

**実戦で鍛えた階層構造** — 将軍→家老→足軽の指揮系統が設計レベルで衝突を防止：明確な責任分担、エージェントごとの専用ファイル、イベント駆動通信、ポーリングなし。

---

## ボトムアップスキル発見

他のフレームワークにはない機能です。

足軽がタスクを実行する中で、**再利用可能なパターンを自動的に発見**し、スキル候補として提案します。家老が提案を `dashboard.md` に集約し、殿（あなた）が正式なスキルに昇格させるか判断します。

```
足軽がタスクを完了
    ↓
気づき: 「このパターン、3つのプロジェクトで同じことをした」
    ↓
YAMLで報告:  skill_candidate:
                 found: true
                 name: "api-endpoint-scaffold"
                 reason: "3プロジェクトで同じRESTスキャフォールドパターンを使用"
    ↓
dashboard.md に掲載 → 殿が承認 → .claude/commands/ にスキル作成
    ↓
全エージェントが /api-endpoint-scaffold を呼び出し可能に
```

スキルは実際の作業から有機的に成長します — 既製のテンプレートライブラリからではなく。スキルセットは**あなた自身**のワークフローの反映になります。

---

## 🚀 クイックスタート

### 🪟 Windowsユーザー（最も一般的）

<table>
<tr>
<td width="60">

**Step 1**

</td>
<td>

📥 **リポジトリをダウンロード**

[ZIPダウンロード](https://github.com/yohey-w/multi-agent-shogun/archive/refs/heads/main.zip) して `C:\tools\multi-agent-shogun` に展開

*または git を使用:* `git clone https://github.com/yohey-w/multi-agent-shogun.git C:\tools\multi-agent-shogun`

</td>
</tr>
<tr>
<td>

**Step 2**

</td>
<td>

🖱️ **`install.bat` を実行**

右クリック→「管理者として実行」（WSL2が未インストールの場合）。WSL2 + Ubuntu をセットアップします。

</td>
</tr>
<tr>
<td>

**Step 3**

</td>
<td>

🐧 **Ubuntu を開いて以下を実行**（初回のみ）

```bash
cd /mnt/c/tools/multi-agent-shogun
./first_setup.sh
```

</td>
</tr>
<tr>
<td>

**Step 4**

</td>
<td>

✅ **出陣！**

```bash
./shutsujin_departure.sh
```

</td>
</tr>
</table>

#### 🔑 初回のみ: 認証

`first_setup.sh` 完了後、一度だけ以下を実行して認証：

```bash
# 1. PATHの反映
source ~/.bashrc

# 2. OAuthログイン + Bypass Permissions承認（1コマンドで完了）
claude --dangerously-skip-permissions
#    → ブラウザが開く → Anthropicアカウントでログイン → CLIに戻る
#    → 「Bypass Permissions」の承認画面 → 「Yes, I accept」を選択（↓キーで2を選んでEnter）
#    → /exit で退出
```

認証情報は `~/.claude/` に保存され、以降は不要。

#### 📅 毎日の起動（初回セットアップ後）

**Ubuntuターミナル**（WSL）を開いて実行：

```bash
cd /mnt/c/tools/multi-agent-shogun
./shutsujin_departure.sh
```

### 📱 スマホからアクセス（どこからでも指揮）

ベッドから、カフェから、トイレから。スマホでAI部下を操作できる。

**必要なもの（全部無料）：**

| 名前 | 一言で言うと | 役割 |
|------|------------|------|
| [Tailscale](https://tailscale.com/) | 外から自宅に届く道 | カフェからでもトイレからでも自宅PCに繋がる |
| SSH | その道を歩く足 | Tailscaleの道を通って自宅PCにログインする |
| [Termux](https://termux.dev/) | スマホの黒い画面 | SSHを使うために必要。スマホに入れるだけ |

**セットアップ：**

1. WSLとスマホの両方にTailscaleをインストール
2. WSL側（Auth key方式 — ブラウザ不要）：
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscaled &
   sudo tailscale up --authkey tskey-auth-XXXXXXXXXXXX
   sudo service ssh start
   ```
3. スマホのTermuxから：
   ```sh
   pkg update && pkg install openssh
   ssh あなたのユーザー名@あなたのTailscale IP
   css    # 将軍に繋がる
   ```
4. ＋ボタンで新しいウィンドウを開いて、部下の様子も見る：
   ```sh
   ssh あなたのユーザー名@あなたのTailscale IP
   csm    # 家老+足軽の9ペインが広がる
   ```

**切り方：** Termuxのウィンドウをスワイプで閉じるだけ。tmuxセッションは生き残る。AI部下は黙々と作業を続けている。

**音声入力：** スマホの音声入力で喋れば、将軍が自然言語を理解して全軍に指示を出す。音声認識の誤字も文脈で解釈してくれる。

**もっと簡単に：** ntfyを設定すると、ntfyアプリから直接通知の受信やコマンドの送信ができます。SSHは不要です。

---

<details>
<summary>🐧 <b>Linux / Mac ユーザー</b>（クリックで展開）</summary>

### 初回セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/yohey-w/multi-agent-shogun.git ~/multi-agent-shogun
cd ~/multi-agent-shogun

# 2. スクリプトに実行権限を付与
chmod +x *.sh

# 3. 初回セットアップを実行
./first_setup.sh
```

### 毎日の起動

```bash
cd ~/multi-agent-shogun
./shutsujin_departure.sh
```

</details>

---

<details>
<summary>❓ <b>WSL2とは？なぜ必要？</b>（クリックで展開）</summary>

### WSL2について

**WSL2（Windows Subsystem for Linux）** は、Windows内でLinuxを実行できる機能です。このシステムは `tmux`（Linuxツール）を使って複数のAIエージェントを管理するため、WindowsではWSL2が必要です。

### WSL2がまだない場合

問題ありません！`install.bat` を実行すると：
1. WSL2がインストールされているかチェック（なければ自動インストール）
2. Ubuntuがインストールされているかチェック（なければ自動インストール）
3. 次のステップ（`first_setup.sh` の実行方法）を案内

**クイックインストールコマンド**（PowerShellを管理者として実行）：
```powershell
wsl --install
```

その後、コンピュータを再起動して `install.bat` を再実行してください。

</details>

---

<details>
<summary>📋 <b>スクリプトリファレンス</b>（クリックで展開）</summary>

| スクリプト | 用途 | 実行タイミング |
|-----------|------|---------------|
| `install.bat` | Windows: WSL2 + Ubuntu のセットアップ | 初回のみ |
| `first_setup.sh` | tmux、Node.js、Claude Code CLI のインストール + Memory MCP設定 | 初回のみ |
| `shutsujin_departure.sh` | tmuxセッション作成 + Claude Code起動 + 指示書読み込み + ntfyリスナー起動 | 毎日 |

### `install.bat` が自動で行うこと：
- ✅ WSL2がインストールされているかチェック（未インストールなら案内）
- ✅ Ubuntuがインストールされているかチェック（未インストールなら案内）
- ✅ 次のステップ（`first_setup.sh` の実行方法）を案内

### `shutsujin_departure.sh` が行うこと：
- ✅ tmuxセッションを作成（shogun + multiagent）
- ✅ 全エージェントでClaude Codeを起動
- ✅ 各エージェントに指示書を自動読み込み
- ✅ キューファイルをリセットして新しい状態に
- ✅ ntfyリスナーを起動してスマホ通知を有効化（設定済みの場合）

**実行後、全エージェントが即座にコマンドを受け付ける準備完了！**

</details>

---

<details>
<summary>🔧 <b>必要環境（手動セットアップの場合）</b>（クリックで展開）</summary>

依存関係を手動でインストールする場合：

| 要件 | インストール方法 | 備考 |
|------|-----------------|------|
| WSL2 + Ubuntu | PowerShellで `wsl --install` | Windowsのみ |
| Ubuntuをデフォルトに設定 | `wsl --set-default Ubuntu` | スクリプトの動作に必要 |
| tmux | `sudo apt install tmux` | ターミナルマルチプレクサ |
| Node.js v20+ | `nvm install 20` | MCPサーバーに必要 |
| Claude Code CLI | `curl -fsSL https://claude.ai/install.sh \| bash` | Anthropic公式CLI（ネイティブ版を推奨。npm版は非推奨） |

</details>

---

### ✅ セットアップ後の状態

どちらのオプションでも、**10体のAIエージェント**が自動起動します：

| エージェント | 役割 | 数 |
|-------------|------|-----|
| 🏯 将軍（Shogun） | 総大将 - あなたの命令を受ける | 1 |
| 📋 家老（Karo） | 管理者 - タスクを分配 | 1 |
| ⚔️ 足軽（Ashigaru） | ワーカー - 並列でタスク実行 | 8 |

tmuxセッションが作成されます：
- `shogun` - ここに接続してコマンドを出す
- `multiagent` - ワーカーがバックグラウンドで稼働

---

## 📖 基本的な使い方

### Step 1: 将軍に接続

`shutsujin_departure.sh` 実行後、全エージェントが自動的に指示書を読み込み、作業準備完了となります。

新しいターミナルを開いて将軍に接続：

```bash
tmux attach-session -t shogun
```

### Step 2: 最初の命令を出す

将軍は既に初期化済み！そのまま命令を出せます：

```
JavaScriptフレームワーク上位5つを調査して比較表を作成せよ
```

将軍は：
1. タスクをYAMLファイルに書き込む
2. 家老（管理者）に通知
3. 即座にあなたに制御を返す（待つ必要なし！）

その間、家老はタスクを足軽ワーカーに分配し、並列実行します。

### Step 3: 進捗を確認

エディタで `dashboard.md` を開いてリアルタイム状況を確認：

```markdown
## 進行中
| ワーカー | タスク | 状態 |
|----------|--------|------|
| 足軽 1 | React調査 | 実行中 |
| 足軽 2 | Vue調査 | 実行中 |
| 足軽 3 | Angular調査 | 完了 |
```

### 詳細なフロー

```
あなた: 「トップ5のMCPサーバを調査して比較表を作成せよ」
```

将軍がタスクを `queue/shogun_to_karo.yaml` に書き込み、家老を起動。あなたには即座に制御が戻ります。

家老がタスクをサブタスクに分解：

| ワーカー | 割当内容 |
|----------|----------|
| 足軽 1 | Notion MCP調査 |
| 足軽 2 | GitHub MCP調査 |
| 足軽 3 | Playwright MCP調査 |
| 足軽 4 | Memory MCP調査 |
| 足軽 5 | Sequential Thinking MCP調査 |

5体の足軽が同時に調査開始。リアルタイムで作業を見ることができます。

結果は完了次第 `dashboard.md` に表示されます。

---

## ✨ 主な特徴

### ⚡ 1. 並列実行

1つの命令で最大8つの並列タスクを生成：

```
あなた: 「5つのMCPサーバを調査せよ」
→ 5体の足軽が同時に調査開始
→ 数時間ではなく数分で結果が出る
```

### 🔄 2. ノンブロッキングワークフロー

将軍は即座に委譲して、あなたに制御を返します：

```
あなた: 命令 → 将軍: 委譲 → あなた: 次の命令をすぐ出せる
                                    ↓
                    ワーカー: バックグラウンドで実行
                                    ↓
                    ダッシュボード: 結果を表示
```

長いタスクの完了を待つ必要はありません。

### 🧠 3. セッション間記憶（Memory MCP）

AIがあなたの好みを記憶します：

```
セッション1: 「シンプルな方法が好き」と伝える
            → Memory MCPに保存

セッション2: 起動時にAIがメモリを読み込む
            → 複雑な方法を提案しなくなる
```

### 📡 4. イベント駆動（ポーリングなし）

エージェントはファイルベースのメールボックス（inbox_write.sh + inbox_watcher.sh）で通信します。
**ポーリングループでAPIコールを浪費しません。**

**2層構造（nudge-only配信方式）:**

- **Layer 1: ファイル永続化**
  - `inbox_write.sh` がメッセージを `queue/inbox/{agent}.yaml` に flock（排他ロック）付きで書き込み
  - メッセージ全文をYAMLに保存 — 永続化保証
  - 複数エージェントが同時書き込み可能（flockが直列化）

- **Layer 2: nudge配信**
  - `inbox_watcher.sh` が `inotifywait`（カーネルイベント）でファイル変更を検知
  - watcherが短い1行のnudge（起動シグナル）を `send-keys` で送信（timeout 5s）
  - エージェント自身が自分のinboxファイルをReadして未読メッセージを処理
  - **send-keysはメッセージ全文を送らない** — 起床通知のみ

- **CPU使用率ゼロ**: watcherは`inotifywait`でファイル変更イベントまでブロック（待機中はCPU 0%）

### 📸 5. スクリーンショット連携

VSCode拡張のClaude Codeはスクショを貼り付けて事象を説明できます。このCLIシステムでも同等の機能を実現：

```
# config/settings.yaml でスクショフォルダを設定
screenshot:
  path: "/mnt/c/Users/あなたの名前/Pictures/Screenshots"

# 将軍に伝えるだけ:
あなた: 「最新のスクショを見ろ」
あなた: 「スクショ2枚見ろ」
→ AIが即座にスクリーンショットを読み取って分析
```

**💡 Windowsのコツ:** `Win + Shift + S` でスクショが撮れます。保存先を `settings.yaml` のパスに合わせると、シームレスに連携できます。

こんな時に便利：
- UIのバグを視覚的に説明
- エラーメッセージを見せる
- 変更前後の状態を比較

### 📁 6. コンテキスト管理

効率的な知識共有のため、四層構造のコンテキストを採用：

| レイヤー | 場所 | 用途 |
|---------|------|------|
| Layer 1: Memory MCP | `memory/shogun_memory.jsonl` | プロジェクト横断・セッションを跨ぐ長期記憶 |
| Layer 2: Project | `config/projects.yaml`, `projects/<id>.yaml`, `context/{project}.md` | プロジェクト固有情報・技術知見 |
| Layer 3: YAML Queue | `queue/shogun_to_karo.yaml`, `queue/tasks/`, `queue/reports/` | タスク管理・指示と報告の正データ |
| Layer 4: Session | CLAUDE.md, instructions/*.md | 作業中コンテキスト（/clearで破棄） |

この設計により：
- どの足軽でも任意のプロジェクトを担当可能
- エージェント切り替え時もコンテキスト継続
- 関心の分離が明確
- セッション間の知識永続化

#### /clear プロトコル（コスト最適化）

長時間作業するとコンテキスト（Layer 4）が膨れ、APIコストが増大する。`/clear` でセッション記憶を消去すれば、コストがリセットされる。Layer 1〜3はファイルとして残るので失われない。

`/clear` 後の復帰コスト: **約6,800トークン**（v1から42%改善 — CLAUDE.mdのYAML化 + 英語のみの指示書でトークンコストを70%削減）

1. CLAUDE.md（自動読み込み）→ shogunシステムの一員と認識
2. `tmux display-message -t "$TMUX_PANE" -p '#{@agent_id}'` → 自分の番号を確認
3. Memory MCP 読み込み → 殿の好みを復元（~700トークン）
4. タスクYAML 読み込み → 次の仕事を確認（~800トークン）

「何を読ませないか」の設計がコスト削減に効いている。

#### 汎用コンテキストテンプレート

すべてのプロジェクトで同じ7セクション構成のテンプレートを使用：

| セクション | 目的 |
|-----------|------|
| What | プロジェクトの概要説明 |
| Why | 目的と成功の定義 |
| Who | 関係者と責任者 |
| Constraints | 期限、予算、制約 |
| Current State | 進捗、次のアクション、ブロッカー |
| Decisions | 決定事項と理由の記録 |
| Notes | 自由記述のメモ・気づき |

この統一フォーマットにより：
- どのエージェントでも素早くオンボーディング可能
- すべてのプロジェクトで一貫した情報管理
- 足軽間の作業引き継ぎが容易

### 📱 7. スマホ通知（ntfy）

スマホと将軍の間で双方向通信 — SSH不要、Tailscale不要、サーバ不要。

| 方向 | 仕組み |
|------|--------|
| **スマホ → 将軍** | ntfyアプリからメッセージを送信 → `ntfy_listener.sh` がストリーミングで受信 → 将軍が自動処理 |
| **家老 → スマホ（直接）** | 家老が `dashboard.md` を更新する際、`scripts/ntfy.sh` 経由で直接プッシュ通知を送信 — **将軍を経由しない**（将軍は人間との対話用、進捗報告用ではない） |

```
📱 あなた（ベッドから）       🏯 将軍
    │                          │
    │  "React 19を調査せよ"    │
    ├─────────────────────────►│
    │    (ntfyメッセージ)      │  → 家老に委譲 → 足軽が作業
    │                          │
    │  "✅ cmd_042 完了"       │
    │◄─────────────────────────┤
    │    (プッシュ通知)        │
```

**セットアップ：**
1. `config/settings.yaml` に `ntfy_topic: "shogun-yourname"` を追加
2. スマホに [ntfyアプリ](https://ntfy.sh) をインストールし、同じトピックをサブスクライブ
3. `shutsujin_departure.sh` がリスナーを自動起動 — 追加手順なし

**通知の例：**

| イベント | 通知内容 |
|----------|----------|
| コマンド完了 | `✅ cmd_042 complete — 5/5 subtasks done` |
| タスク失敗 | `❌ subtask_042c failed — API rate limit` |
| 対応要 | `🚨 Action needed: approve skill candidate` |
| ストリーク更新 | `🔥 3-day streak! 12/12 tasks today` |

無料、アカウント不要、サーバ管理不要。[ntfy.sh](https://ntfy.sh) — オープンソースのプッシュ通知サービスを利用。

> **⚠️ セキュリティ注意:** トピック名がそのままパスワードです。知っている人は誰でも通知を読んだり、将軍にメッセージを送れてしまいます。推測されにくい名前を選び、**スクリーンショットやブログ、GitHubコミットなどで公開しないでください**。

**動作確認:**

```bash
# テスト通知をスマホに送信
bash scripts/ntfy.sh "将軍システムからのテスト通知 🏯"
```

スマホに通知が届けば設定完了です。届かない場合:
- `config/settings.yaml` の `ntfy_topic` が設定されているか（空でないか、余分な引用符がないか）
- スマホのntfyアプリで**完全に同じトピック名**を購読しているか
- スマホがインターネットに接続されており、ntfyの通知が有効か

**スマホから将軍に指示を送る方法:**

1. スマホでntfyアプリを開く
2. 購読しているトピックをタップ
3. メッセージを入力（例: `React 19のベストプラクティスを調査して`）して送信
4. `ntfy_listener.sh` が受信 → `queue/ntfy_inbox.yaml` に書き込み → 将軍を起こす
5. 将軍がメッセージを読み、通常の家老→足軽パイプラインで処理

送信したテキストがそのままコマンドになります。将軍に話しかけるように書けばOK — 特別な構文は不要です。

**リスナーの手動起動**（`shutsujin_departure.sh` を使わない場合）:

```bash
# バックグラウンドでリスナーを起動
nohup bash scripts/ntfy_listener.sh &>/dev/null &

# 起動確認
pgrep -f ntfy_listener.sh

# ログを見ながら起動（フォアグラウンド）
bash scripts/ntfy_listener.sh
```

リスナーは接続が切れても自動的に再接続します。`shutsujin_departure.sh` で出陣すれば自動起動されるため、手動起動は出陣スクリプトを使わない場合のみ必要です。

**トラブルシューティング:**

| 症状 | 対処 |
|------|------|
| スマホに通知が来ない | `settings.yaml` とntfyアプリのトピック名が完全に一致しているか確認 |
| リスナーが起動しない | `bash scripts/ntfy_listener.sh` をフォアグラウンドで実行してエラーを確認 |
| スマホ→将軍が動かない | リスナーが稼働中か確認: `pgrep -f ntfy_listener.sh` |
| メッセージが将軍に届かない | `queue/ntfy_inbox.yaml` を確認 — メッセージがあれば将軍が処理中の可能性 |
| "ntfy_topic not configured" エラー | `config/settings.yaml` に `ntfy_topic: "your-topic"` を追加 |
| 通知が重複する | 再接続時の正常動作 — 将軍がメッセージIDで重複排除します |
| トピック名を変更したのに通知が来ない | リスナーの再起動が必要: `pkill -f ntfy_listener.sh && nohup bash scripts/ntfy_listener.sh &>/dev/null &` |

#### SayTask通知

行動心理学に基づくモチベーション通知：

- **ストリーク追跡**: `saytask/streaks.yaml` で連続完了日数をカウント — ストリーク維持が損失回避の心理を利用してモメンタムを持続
- **Eat the Frog** 🐸: その日の最も難しいタスクを「カエル」としてマーク。完了すると特別な祝福通知が送信される
- **日次進捗**: `12/12 tasks today` — 視覚的な完了フィードバックがArbeitslust効果（仕事の進捗による喜び）を強化

### 🖼️ 8. ペインボーダータスク表示

各tmuxペインのボーダーにエージェントの現在のタスクを表示：

```
┌ ashigaru1 (Sonnet) VF requirements ─┬ ashigaru3 (Opus) API research ──────┐
│                                      │                                     │
│  Working on SayTask requirements     │  Researching REST API patterns      │
│                                      │                                     │
├ ashigaru2 (Sonnet) ─────────────────┼ ashigaru4 (Opus) DB schema design ──┤
│                                      │                                     │
│  (idle — waiting for assignment)     │  Designing database schema          │
│                                      │                                     │
└──────────────────────────────────────┴─────────────────────────────────────┘
```

- **作業中**: `ashigaru1 (Sonnet) VF requirements` — エージェント名、モデル、タスク概要
- **待機中**: `ashigaru1 (Sonnet)` — モデル名のみ、タスクなし
- 家老がタスク割当・完了時に自動更新
- 9ペインを一目見れば、誰が何をしているか即座にわかる

### 🔊 9. シャウトモード（戦国エコー）

足軽がタスクを完了すると、パーソナライズされた戦国風の叫びをtmuxペインに表示します — 部下が働いている実感を得られる。

```
┌ ashigaru1 (Sonnet) ──────────┬ ashigaru2 (Sonnet) ──────────┐
│                               │                               │
│  ⚔️ 足軽1号、任を果たし待機！ │  🔥 足軽2号、二番槍の意地！   │
│  八刃一志の志、胸に刻む！     │  八刃一志！共に城を落とせ！   │
│  ❯                            │  ❯                            │
└───────────────────────────────┴───────────────────────────────┘
```

**仕組み:**

家老がタスクYAMLに `echo_message` フィールドを記述。足軽は全作業完了後（レポート + inbox通知の後）、**最後のアクション**として `echo` を実行。メッセージは `❯` プロンプト直上に残る。

```yaml
# タスクYAML（家老が記述）
task:
  task_id: subtask_001
  description: "比較表を作成"
  echo_message: "🔥 足軽1号、先陣を切って参る！八刃一志！"
```

**シャウトモードがデフォルト。** 無効にする場合（echoのAPIトークン節約）:

```bash
./shutsujin_departure.sh --silent    # 戦国エコーなし
./shutsujin_departure.sh             # デフォルト: シャウトモード（戦国エコー有効）
```

サイレントモードは `DISPLAY_MODE=silent` をtmux環境変数に設定。家老がタスクYAML作成時にこれを確認し、`echo_message` フィールドを省略する。

---

## 🗣️ SayTask — タスク管理が嫌いな人のためのタスク管理

### SayTaskとは？

**タスク管理が嫌いな人のためのタスク管理。スマホに話しかけるだけ。**

**Talk Coding — Vibe Codingではない。** タスクを話すだけで、AIが整理する。入力なし、アプリを開かない、摩擦ゼロ。

- **ターゲット**: Todoistをインストールしたけど3日で開かなくなった人
- あなたの敵は他のアプリじゃない。何もしないこと。競合は他の生産性ツールではなく、無行動
- UIゼロ。入力ゼロ。アプリを開く動作ゼロ。ただ話すだけ

> *「あなたの敵は他のアプリじゃない。何もしないことだ。」*

### 仕組み

1. [ntfyアプリ](https://ntfy.sh)をインストール（無料、アカウント不要）
2. スマホに話しかける: *「歯医者 明日」*、*「請求書 金曜まで」*
3. AIが自動整理 → 朝に通知: *「今日の予定です」*

```
 🗣️ 「牛乳買う、歯医者 明日、請求書 金曜まで」
       │
       ▼
 ┌──────────────────┐
 │  ntfy → 将軍     │  AIが自動分類、日付解析、優先度設定
 └────────┬─────────┘
          │
          ▼
 ┌──────────────────┐
 │   tasks.yaml     │  構造化ストレージ（ローカル、端末外に出ない）
 └────────┬─────────┘
          │
          ▼
 📱 朝の通知:
    「今日: 🐸 請求書期限 · 🦷 歯医者3時 · 🛒 牛乳買う」
```

### 変更前／変更後

| 変更前（v1） | 変更後（v2） |
|:-----------:|:----------:|
| ![タスク一覧 v1](images/screenshots/ntfy_tasklist_v1_before.jpg) | ![タスク一覧 v2](images/screenshots/ntfy_tasklist_v2_aligned.jpg) |
| 生のタスクダンプ | きれいに整理された日次サマリ |

> *注: スクリーンショットに表示されているトピック名は例です。自分専用のトピック名を使用してください。*

### ユースケース

- 🛏️ **ベッドの中**: *「明日レポート提出しないと」* — 忘れる前にキャプチャ、ノート探さなくていい
- 🚗 **運転中**: *「クライアントAの見積もり忘れないで」* — ハンズフリー、前を見たまま
- 💻 **仕事中**: *「あ、牛乳買わないと」* — 即座にダンプしてフローに戻る
- 🌅 **起床時**: 今日のタスクが既に通知で待っている — アプリを開かない、受信トレイ確認不要
- 🐸 **Eat the Frog**: AIが毎朝一番大変なタスクを選ぶ — 無視してもいいし、最初に倒してもいい

### FAQ

**Q: 他のタスクアプリと何が違う？**
A: アプリを開かない。ただ話すだけ。摩擦ゼロ。多くのタスクアプリは、人々が開かなくなるから失敗する。SayTaskはそのステップ自体を取り除いた。

**Q: Shogunシステム全体なしでSayTaskだけ使える？**
A: SayTaskはShogunの機能の一部。Shogunはスタンドアロンのマルチエージェント開発プラットフォームとしても機能する — 1つのシステムで両方の機能が手に入る。

**Q: 🐸 Frogって何？**
A: 毎朝、AIがあなたの一番大変なタスクを選ぶ — 避けたいやつ。最初に倒す（「Eat the Frog」方式）か無視するか。あなた次第。

**Q: 無料？**
A: すべて無料でオープンソース。ntfyも無料。アカウント不要、サーバ不要、サブスクリプション不要。

**Q: データはどこに保存される？**
A: ローカルのYAMLファイル。クラウドには何も送信されない。タスクは端末の外に出ない。

**Q: 「仕事のあれ」みたいに曖昧なことを言ったら？**
A: AIがベストを尽くして分類・スケジュールする。後で修正もできる — でもポイントは、忘れる前に思考をキャプチャすること。

### SayTask vs cmdパイプライン

将軍システムには2つの補完的なタスクシステムがある：

| 機能 | SayTask（音声レイヤー） | cmdパイプライン（AI実行） |
|---|:-:|:-:|
| 音声入力 → タスク作成 | ✅ | — |
| 朝の通知ダイジェスト | ✅ | — |
| Eat the Frog 🐸 選定 | ✅ | — |
| ストリーク追跡 | ✅ | ✅ |
| AI実行タスク（複数ステップ） | — | ✅ |
| 8エージェント並列実行 | — | ✅ |

SayTaskは個人の生産性を担当（キャプチャ → スケジュール → リマインド）。cmdパイプラインは複雑な作業を担当（リサーチ、コード、複数ステップのタスク）。両者はストリーク追跡を共有し、どちらのタスクを完了してもデイリーストリークにカウントされる。

---

## 🧠 モデル設定

| エージェント | モデル | 思考モード | 理由 |
|-------------|--------|----------|------|
| 将軍 | Opus | **有効（high）** | 殿との戦略議論・リサーチ・方針設計に深い推論が必要 |
| 家老 | Opus | 有効 | タスク分配には慎重な判断が必要 |
| 足軽1-4 | Sonnet | 有効 | コスト効率重視の標準タスク向け |
| 足軽5-8 | Opus | 有効 | 複雑なタスク向けのフル機能 |

将軍は殿（人間）の参謀として、タスク中継だけでなく戦略議論・リサーチ分析・方針設計を行う。これらはBloom's Taxonomy の Level 4-6（分析・評価・創造）に該当し、Thinking有効が必須。中継のみに特化したい場合は `--shogun-no-thinking` オプションで無効化可能。

### 陣形モード

| 陣形 | 足軽1-4 | 足軽5-8 | コマンド |
|------|---------|---------|---------|
| **平時の陣**（デフォルト） | Sonnet | Opus | `./shutsujin_departure.sh` |
| **決戦の陣**（全力） | Opus | Opus | `./shutsujin_departure.sh -k` |

平時は半数を安いSonnetモデルで運用。ここぞという時に `-k`（`--kessen`）で全軍Opusの「決戦の陣」に切り替え。家老の判断で `/model opus` を送れば、個別の足軽を一時昇格させることも可能。

### Bloom's Taxonomy によるタスク分類

タスクはBloom's Taxonomy（ブルームの分類法）に基づいて分類し、最適なモデルに割り当てます：

| レベル | カテゴリ | 内容 | モデル |
|--------|----------|------|--------|
| L1 | 記憶 | 事実の想起、コピー、一覧化 | Sonnet |
| L2 | 理解 | 説明、要約、言い換え | Sonnet |
| L3 | 応用 | 手順の実行、既知パターンの実装 | Sonnet |
| L4 | 分析 | 比較、調査、構造の分解 | Opus |
| L5 | 評価 | 判断、批評、推奨 | Opus |
| L6 | 創造 | 設計、構築、新しいソリューションの統合 | Opus |

家老が各サブタスクにBloomレベルを付与し、適切なエージェント層にルーティングします。これにより、コスト効率の高い実行が実現します：定型作業はSonnetへ、複雑な推論はOpusへ。

### タスク依存関係（blockedBy）

タスクは `blockedBy` を使って他タスクへの依存を宣言できます：

```yaml
# queue/tasks/ashigaru2.yaml
task:
  task_id: subtask_010b
  blockedBy: ["subtask_010a"]  # 足軽1のタスク完了を待つ
  description: "subtask_010aで構築したAPIクライアントを統合"
```

ブロック元のタスクが完了すると、家老が自動的に依存タスクのブロックを解除し、空いている足軽に割り当てます。これにより待機時間が削減され、依存タスクの効率的なパイプライン処理が可能になります。

---

## 🧭 核心思想（Philosophy）

> **「脳死で依頼をこなすな。最速×最高のアウトプットを常に念頭に置け。」**

将軍システムは5つの核心原則に基づいて設計されている：

| 原則 | 説明 |
|------|------|
| **自律陣形設計** | テンプレートではなく、タスクの複雑さに応じて陣形を設計 |
| **並列化** | サブエージェントを活用し、単一障害点を作らない |
| **リサーチファースト** | 判断の前にエビデンスを探す |
| **継続的学習** | モデルの知識カットオフだけに頼らない |
| **三角測量** | 複数視点からのリサーチと統合的オーソライズ |

詳細: **[docs/philosophy.md](docs/philosophy.md)**

---

## 🎯 設計思想

### なぜ階層構造（将軍→家老→足軽）なのか

1. **即座の応答**: 将軍は即座に委譲し、あなたに制御を返す
2. **並列実行**: 家老が複数の足軽に同時分配
3. **単一責任**: 各役割が明確に分離され、混乱しない
4. **スケーラビリティ**: 足軽を増やしても構造が崩れない
5. **障害分離**: 1体の足軽が失敗しても他に影響しない
6. **人間への報告一元化**: 将軍だけが人間とやり取りするため、情報が整理される

### なぜメールボックスシステムなのか

1. **状態の永続化**: YAMLファイルで構造化通信し、エージェント再起動にも耐える
2. **ポーリング不要**: `inotifywait`はイベント駆動（カーネルレベル）なので、アイドル時のAPIコストゼロ
3. **割り込み防止**: エージェント同士やあなたの入力への割り込みを防止
4. **デバッグ容易**: 人間がinbox YAMLファイルを直接読んでメッセージフローを把握できる
5. **競合回避**: `flock`（排他ロック）で同時書き込みを防止 — 複数エージェントが同時送信してもレースコンディションなし
6. **配信保証**: ファイル書き込み成功 = メッセージ配信保証。到達確認不要、偽陰性なし、send-keys失敗による1.5時間ハングもなし
7. **nudge-only配信**: `send-keys`は短い起床通知のみ送信（timeout 5s）、メッセージ全文は送らない。エージェントが自分でinboxファイルをRead。旧方式（メッセージ全文をsend-keys送信）で発生した文字化け・1.5時間ハング等の配信障害を根絶。

### エージェント識別（@agent_id）

各ペインに `@agent_id` というtmuxユーザーオプションを設定（例: `karo`, `ashigaru1`）。`pane_index` はペイン再配置でズレるが、`@agent_id` は `shutsujin_departure.sh` が起動時に固定設定するため変わらない。

エージェントの自己識別:
```bash
tmux display-message -t "$TMUX_PANE" -p '#{@agent_id}'
```
`-t "$TMUX_PANE"` が必須。省略するとアクティブペイン（操作中のペイン）の値が返り、誤認識の原因になる。

モデル名は `@model_name`、現在のタスクの要約は `@current_task` として保存され、いずれも `pane-border-format` で常時表示されます。Claude Codeがペインタイトルを上書きしても、これらのユーザーオプションは消えません。

### なぜ dashboard.md は家老のみが更新するのか

1. **単一更新者**: 競合を防ぐため、更新責任者を1人に限定
2. **情報集約**: 家老は全足軽の報告を受ける立場なので全体像を把握
3. **一貫性**: すべての更新が1つの品質ゲートを通過
4. **割り込み防止**: 将軍が更新すると、殿の入力中に割り込む恐れあり

---

## 🛠️ スキル

初期状態ではスキルはありません。
運用中にダッシュボード（dashboard.md）の「スキル化候補」から承認して増やしていきます。

スキルは `/スキル名` で呼び出し可能。将軍に「/スキル名 を実行」と伝えるだけ。

### スキルの思想

**1. スキルはコミット対象外**

`.claude/commands/` 配下のスキルはリポジトリにコミットしない設計。理由：
- 各ユーザの業務・ワークフローは異なる
- 汎用的なスキルを押し付けるのではなく、ユーザが自分に必要なスキルを育てていく

**2. スキル取得の手順**

```
足軽が作業中にパターンを発見
    ↓
dashboard.md の「スキル化候補」に上がる
    ↓
殿（あなた）が内容を確認
    ↓
承認すれば家老に指示してスキルを作成
```

スキルはユーザ主導で増やすもの。自動で増えると管理不能になるため、「これは便利」と判断したものだけを残す。

---

## 🔌 MCPセットアップガイド

MCP（Model Context Protocol）サーバはClaudeの機能を拡張します。セットアップ方法：

### MCPとは？

MCPサーバはClaudeに外部ツールへのアクセスを提供します：
- **Notion MCP** → Notionページの読み書き
- **GitHub MCP** → PR作成、Issue管理
- **Memory MCP** → セッション間で記憶を保持

### MCPサーバのインストール

以下のコマンドでMCPサーバを追加：

```bash
# 1. Notion - Notionワークスペースに接続
claude mcp add notion -e NOTION_TOKEN=your_token_here -- npx -y @notionhq/notion-mcp-server

# 2. Playwright - ブラウザ自動化
claude mcp add playwright -- npx @playwright/mcp@latest
# 注意: 先に `npx playwright install chromium` を実行してください

# 3. GitHub - リポジトリ操作
claude mcp add github -e GITHUB_PERSONAL_ACCESS_TOKEN=your_pat_here -- npx -y @modelcontextprotocol/server-github

# 4. Sequential Thinking - 複雑な問題を段階的に思考
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking

# 5. Memory - セッション間の長期記憶（推奨！）
# ✅ first_setup.sh で自動設定済み
# 手動で再設定する場合:
claude mcp add memory -e MEMORY_FILE_PATH="$PWD/memory/shogun_memory.jsonl" -- npx -y @modelcontextprotocol/server-memory
```

### インストール確認

```bash
claude mcp list
```

全サーバが「Connected」ステータスで表示されるはずです。

---

## 🌍 実用例

### 例1: 調査タスク

```
あなた: 「AIコーディングアシスタント上位5つを調査して比較せよ」

実行される処理:
1. 将軍が家老に委譲
2. 家老が割り当て:
   - 足軽1: GitHub Copilotを調査
   - 足軽2: Cursorを調査
   - 足軽3: Claude Codeを調査
   - 足軽4: Codeiumを調査
   - 足軽5: Amazon CodeWhispererを調査
3. 5体が同時に調査
4. 結果がdashboard.mdに集約
```

### 例2: PoC準備

```
あなた: 「このNotionページのプロジェクトでPoC準備: [URL]」

実行される処理:
1. 家老がMCP経由でNotionコンテンツを取得
2. 足軽2: 確認すべき項目をリスト化
3. 足軽3: 技術的な実現可能性を調査
4. 足軽4: PoC計画書を作成
5. 全結果がdashboard.mdに集約、会議の準備完了
```

---

## ⚙️ 設定

### 言語設定

```yaml
# config/settings.yaml
language: ja   # 日本語のみ
language: en   # 日本語 + 英訳併記
```

### スクリーンショット連携

```yaml
# config/settings.yaml
screenshot:
  path: "/mnt/c/Users/あなたの名前/Pictures/Screenshots"
```

将軍に「最新のスクショを見ろ」と伝えるだけで、スクリーンキャプチャを読み取って分析します。（Windowsでは `Win+Shift+S`）

### ntfy（スマホ通知）

```yaml
# config/settings.yaml
ntfy_topic: "shogun-yourname"
```

スマホの [ntfyアプリ](https://ntfy.sh) で同じトピックをサブスクライブしてください。リスナーは `shutsujin_departure.sh` で自動起動します。

---

## 🛠️ 上級者向け

<details>
<summary><b>スクリプトアーキテクチャ</b>（クリックで展開）</summary>

```
┌─────────────────────────────────────────────────────────────────────┐
│                      初回セットアップ（1回だけ実行）                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  install.bat (Windows)                                              │
│      │                                                              │
│      ├── WSL2のチェック/インストール案内                              │
│      └── Ubuntuのチェック/インストール案内                            │
│                                                                     │
│  first_setup.sh (Ubuntu/WSLで手動実行)                               │
│      │                                                              │
│      ├── tmuxのチェック/インストール                                  │
│      ├── Node.js v20+のチェック/インストール (nvm経由)                │
│      ├── Claude Code CLIのチェック/インストール（ネイティブ版）       │
│      │       ※ npm版検出時はネイティブ版への移行を提案                │
│      └── Memory MCPサーバー設定                                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                      毎日の起動（毎日実行）                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  shutsujin_departure.sh                                             │
│      │                                                              │
│      ├──▶ tmuxセッションを作成                                       │
│      │         • "shogun"セッション（1ペイン）                        │
│      │         • "multiagent"セッション（9ペイン、3x3グリッド）        │
│      │                                                              │
│      ├──▶ キューファイルとダッシュボードをリセット                     │
│      │                                                              │
│      └──▶ 全エージェントでClaude Codeを起動                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

</details>

<details>
<summary><b>shutsujin_departure.sh オプション</b>（クリックで展開）</summary>

```bash
# デフォルト: フル起動（tmuxセッション + Claude Code起動）
./shutsujin_departure.sh

# セッションセットアップのみ（Claude Code起動なし）
./shutsujin_departure.sh -s
./shutsujin_departure.sh --setup-only

# タスクキューをクリア（指令履歴は保持）
./shutsujin_departure.sh -c
./shutsujin_departure.sh --clean

# 決戦の陣: 全足軽をOpusで起動（最大能力・高コスト）
./shutsujin_departure.sh -k
./shutsujin_departure.sh --kessen

# サイレントモード: 戦国エコーを無効化（echoのAPIトークン節約）
./shutsujin_departure.sh -S
./shutsujin_departure.sh --silent

# フル起動 + Windows Terminalタブを開く
./shutsujin_departure.sh -t
./shutsujin_departure.sh --terminal

# 将軍中継専用モード: 将軍のThinkingを無効化（コスト節約）
./shutsujin_departure.sh --shogun-no-thinking

# ヘルプを表示
./shutsujin_departure.sh -h
./shutsujin_departure.sh --help
```

</details>

<details>
<summary><b>よく使うワークフロー</b>（クリックで展開）</summary>

**通常の毎日の使用：**
```bash
./shutsujin_departure.sh          # 全て起動
tmux attach-session -t shogun     # 接続してコマンドを出す
```

**デバッグモード（手動制御）：**
```bash
./shutsujin_departure.sh -s       # セッションのみ作成

# 特定のエージェントでClaude Codeを手動起動
tmux send-keys -t shogun:0 'claude --dangerously-skip-permissions' Enter
tmux send-keys -t multiagent:0.0 'claude --dangerously-skip-permissions' Enter
```

**クラッシュ後の再起動：**
```bash
# 既存セッションを終了
tmux kill-session -t shogun
tmux kill-session -t multiagent

# 新しく起動
./shutsujin_departure.sh
```

</details>

<details>
<summary><b>便利なエイリアス</b>（クリックで展開）</summary>

`first_setup.sh` を実行すると、以下のエイリアスが `~/.bashrc` に自動追加されます：

```bash
alias csst='cd /mnt/c/tools/multi-agent-shogun && ./shutsujin_departure.sh'
alias css='tmux attach-session -t shogun'      # 将軍ウィンドウの起動
alias csm='tmux attach-session -t multiagent'  # 家老・足軽ウィンドウの起動
```

※ エイリアスを反映するには `source ~/.bashrc` を実行するか、PowerShellで `wsl --shutdown` してからターミナルを開き直してください。

</details>

---

## 📁 ファイル構成

<details>
<summary><b>クリックでファイル構成を展開</b></summary>

```
multi-agent-shogun/
│
│  ┌─────────────────── セットアップスクリプト ───────────────────┐
├── install.bat               # Windows: 初回セットアップ
├── first_setup.sh            # Ubuntu/Mac: 初回セットアップ
├── shutsujin_departure.sh    # 毎日の起動（指示書自動読み込み）
│  └────────────────────────────────────────────────────────────┘
│
├── instructions/             # エージェント指示書
│   ├── shogun.md             # 将軍の指示書
│   ├── karo.md               # 家老の指示書
│   └── ashigaru.md           # 足軽の指示書
│
├── scripts/                  # ユーティリティスクリプト
│   ├── inbox_write.sh        # エージェントinboxへのメッセージ書き込み
│   ├── inbox_watcher.sh      # inotifywaitでinbox変更を監視
│   ├── ntfy.sh               # スマホにプッシュ通知を送信
│   └── ntfy_listener.sh      # スマホからのメッセージをストリーミング受信
│
├── config/
│   ├── settings.yaml         # 言語、ntfy、その他の設定
│   └── projects.yaml         # プロジェクト一覧
│
├── projects/                 # プロジェクト詳細（git対象外、機密情報含む）
│   └── <project_id>.yaml    # 各プロジェクトの全情報（クライアント、タスク、Notion連携等）
│
├── queue/                    # 通信ファイル
│   ├── shogun_to_karo.yaml   # 将軍から家老へのコマンド
│   ├── ntfy_inbox.yaml       # スマホからの受信メッセージ（ntfy）
│   ├── inbox/                # エージェント別inboxファイル
│   │   ├── shogun.yaml       # 将軍へのメッセージ
│   │   ├── karo.yaml         # 家老へのメッセージ
│   │   └── ashigaru{1-8}.yaml # 各足軽へのメッセージ
│   ├── tasks/                # 各ワーカーのタスクファイル
│   └── reports/              # ワーカーレポート
│
├── saytask/                  # 行動心理学に基づくモチベーション管理
│   └── streaks.yaml          # ストリーク追跡と日次進捗
│
├── templates/                # レポート・コンテキストテンプレート
│   ├── integ_base.md         # 統合: ベーステンプレート
│   ├── integ_fact.md         # 統合: ファクトファインディング
│   ├── integ_proposal.md     # 統合: 提案書
│   ├── integ_code.md         # 統合: コードレビュー
│   ├── integ_analysis.md     # 統合: 分析
│   └── context_template.md   # 汎用7セクション プロジェクトコンテキスト
│
├── memory/                   # Memory MCP保存場所
├── dashboard.md              # リアルタイム状況一覧
└── CLAUDE.md                 # システム指示書（自動読み込み）
```

</details>

---

## 📂 プロジェクト管理

このシステムは自身の開発だけでなく、**全てのホワイトカラー業務**を管理・実行する。プロジェクトのフォルダはこのリポジトリの外にあってもよい。

### 仕組み

```
config/projects.yaml          # プロジェクト一覧（ID・名前・パス・ステータスのみ）
projects/<project_id>.yaml    # 各プロジェクトの詳細情報
```

- **`config/projects.yaml`**: どのプロジェクトがあるかの一覧（サマリのみ）
- **`projects/<id>.yaml`**: そのプロジェクトの全詳細（クライアント情報、契約、タスク、関連ファイル、Notionページ等）
- **プロジェクトの実ファイル**（ソースコード、設計書等）は `path` で指定した外部フォルダに配置
- **`projects/` はGit追跡対象外**（クライアントの機密情報を含むため）

### 例

```yaml
# config/projects.yaml
projects:
  - id: my_client
    name: "クライアントXコンサルティング"
    path: "/mnt/c/Consulting/client_x"
    status: active

# projects/my_client.yaml
id: my_client
client:
  name: "クライアントX"
  company: "X株式会社"
contract:
  fee: "月額"
current_tasks:
  - id: task_001
    name: "システムアーキテクチャレビュー"
    status: in_progress
```

この分離設計により、将軍システムは複数の外部プロジェクトを横断的に統率しつつ、プロジェクトの詳細情報はバージョン管理の対象外に保つことができる。

---

## 🔧 トラブルシューティング

<details>
<summary><b>npm版のClaude Code CLIを使っている？</b></summary>

npm版（`npm install -g @anthropic-ai/claude-code`）は公式で非推奨（deprecated）になりました。`first_setup.sh` を再実行すると、npm版を検出してネイティブ版への移行を提案します。

```bash
# first_setup.sh を再実行
./first_setup.sh

# npm版が検出されると以下のメッセージが表示される:
# ⚠️ npm版 Claude Code CLI が検出されました（公式非推奨）
# ネイティブ版をインストールしますか? [Y/n]:

# Y を選択後、npm版をアンインストール:
npm uninstall -g @anthropic-ai/claude-code
```

</details>

<details>
<summary><b>MCPツールが動作しない？</b></summary>

MCPツールは「遅延ロード」方式で、最初にロードが必要です：

```
# 間違い - ツールがロードされていない
mcp__memory__read_graph()  ← エラー！

# 正しい - 先にロード
ToolSearch("select:mcp__memory__read_graph")
mcp__memory__read_graph()  ← 動作！
```

</details>

<details>
<summary><b>エージェントが権限を求めてくる？</b></summary>

`--dangerously-skip-permissions` 付きで起動していることを確認：

```bash
claude --dangerously-skip-permissions --system-prompt "..."
```

</details>

<details>
<summary><b>ワーカーが停止している？</b></summary>

ワーカーのペインを確認：
```bash
tmux attach-session -t multiagent
# Ctrl+B の後に数字でペインを切り替え
```

</details>

<details>
<summary><b>将軍やエージェントが落ちた？（Claude Codeプロセスがkillされた）</b></summary>

**`css` 等のtmuxセッション起動エイリアスを使って再起動してはいけません。** これらのエイリアスはtmuxセッションを作成するため、既存のtmuxペイン内で実行するとセッションがネスト（入れ子）になり、入力が壊れてペインが使用不能になります。

**正しい再起動方法：**

```bash
# 方法1: ペイン内でclaudeを直接実行
claude --model opus --dangerously-skip-permissions

# 方法2: 家老がrespawn-paneで強制再起動（ネストも解消される）
tmux respawn-pane -t shogun:0.0 -k 'claude --model opus --dangerously-skip-permissions'
```

**誤ってtmuxをネストしてしまった場合：**
1. `Ctrl+B` の後 `d` でデタッチ（内側のセッションから離脱）
2. その後 `claude` を直接実行（`css` は使わない）
3. デタッチが効かない場合は、別のペインから `tmux respawn-pane -k` で強制リセット

</details>

---

## 📚 tmux クイックリファレンス

| コマンド | 説明 |
|----------|------|
| `tmux attach -t shogun` | 将軍に接続 |
| `tmux attach -t multiagent` | ワーカーに接続 |
| `Ctrl+B` の後 `0-8` | ペイン間を切り替え |
| `Ctrl+B` の後 `d` | デタッチ（実行継続） |
| `tmux kill-session -t shogun` | 将軍セッションを停止 |
| `tmux kill-session -t multiagent` | ワーカーセッションを停止 |

### 🖱️ マウス操作

`first_setup.sh` が `~/.tmux.conf` に `set -g mouse on` を自動設定するため、マウスによる直感的な操作が可能です：

| 操作 | 説明 |
|------|------|
| マウスホイール | ペイン内のスクロール（出力履歴の確認） |
| ペインをクリック | ペイン間のフォーカス切替 |
| ペイン境界をドラッグ | ペインのリサイズ |

キーボード操作に不慣れな場合でも、マウスだけでペインの切替・スクロール・リサイズが行えます。

---

<details>
<summary><b>v2.0.0の新機能</b></summary>

- **ntfy双方向通信** — スマホからコマンドを送信、タスク完了時にプッシュ通知を受信
- **SayTask通知** — ストリーク追跡、Eat the Frog 🐸、行動心理学に基づくモチベーション管理
- **ペインボーダータスク表示** — tmuxペインボーダーで各エージェントの現在のタスクを一目で確認
- **60%の指示書トークン削減** — 英語のみの指示書 + YAML再構造化
- **42%の/clear復帰コスト削減** — コンテキストリセット後のエージェント復帰高速化
- **決戦モード**（`-k` フラグ）— 全足軽Opusの最大能力陣形
- **タスク依存関係システム**（`blockedBy`）— 依存タスクの自動ブロック解除
- **5つの統合テンプレート** — ファクトファインディング、提案書、コードレビュー、分析の標準化レポート形式
- **シャウトモード**（デフォルト）— 足軽がタスク完了時にパーソナライズされた戦国風の叫びを表示。`--silent` で無効化
- **nudge-only メールボックス** — ファイルベースのinboxで通信、`send-keys` は1行の起床通知のみ送信。配信障害を根絶
- **エージェント自己識別**（`@agent_id`）— tmuxユーザーオプションによる安定したID、ペイン再配置の影響を受けない

</details>

---

## コントリビューション

Issue、Pull Requestを歓迎します。

- **バグ報告**: 再現手順を添えてIssueを作成してください
- **機能アイデア**: まずDiscussionで提案してください
- **スキル**: スキルは個人のワークフローに最適化されるものであり、このリポジトリには含めません

## 🙏 クレジット

[Claude-Code-Communication](https://github.com/Akira-Papa/Claude-Code-Communication) by Akira-Papa をベースに開発。

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照。

---

<div align="center">

**コマンド1つ。エージェント8体。連携コストゼロ。**

⭐ 役に立ったらスターをお願いします — 他の人にも見つけてもらえます。

</div>
