# multi-agent-shogun-gui

**Webダッシュボード for multi-agent-shogun**

shogunマルチエージェントシステムの戦況をリアルタイムで可視化するWebダッシュボードです。

## 概要

このダッシュボードは `dashboard.md` をパースし、以下の情報をWebブラウザで表示します：

- 🚨 **要対応事項** - 殿（人間）の判断が必要なアイテム
- 🔄 **進行中タスク** - 現在実行中の足軽の状況
- ✅ **本日の戦果** - 完了したタスク一覧
- 🎯 **スキル化候補** - 承認待ちのスキル
- 🛠️ **生成されたスキル** - 作成済みスキル

### 主な機能

1. **リアルタイム更新** - 数秒ごとに自動更新
2. **ステータス色分け** - 完了（緑）/進行中（青）/ブロック（赤）
3. **足軽稼働状況** - idle/busy の一目確認
4. **JSON API** - プログラムからのアクセス対応

## 必要な環境

- Python 3.10以上
- 以下のPythonパッケージ:
  - `fastapi` - Web API フレームワーク
  - `uvicorn` - ASGI サーバー

## インストール

### 1. リポジトリのクローン

```bash
git clone git@github.com:torumitsutake/multi-agent-shogun-gui.git
cd multi-agent-shogun-gui
```

### 2. 依存パッケージのインストール

```bash
pip install fastapi uvicorn
```

## 使用方法

### サーバー起動

```bash
# デフォルト（dashboard.mdのパスを指定）
python app.py --dashboard /path/to/multi-agent-shogun/dashboard.md

# ポート指定
python app.py --dashboard /path/to/dashboard.md --port 8080
```

### アクセス

- **Webダッシュボード**: http://localhost:8000
- **JSON API**: http://localhost:8000/api/dashboard

### コマンドライン引数

| 引数 | 必須 | デフォルト | 説明 |
|------|------|-----------|------|
| `--dashboard` | ✅ | - | dashboard.md のパス |
| `--port` | ❌ | 8000 | サーバーポート |
| `--host` | ❌ | 127.0.0.1 | ホストアドレス |
| `--reload` | ❌ | false | ホットリロード有効化（開発用） |

## API エンドポイント

### GET /api/dashboard

dashboard.md をパースしたJSON形式のデータを返します。

```json
{
  "last_updated": "2026-02-03 10:05",
  "action_required": [...],
  "in_progress": [...],
  "completed_today": [...],
  "skill_candidates": [...],
  "generated_skills": [...],
  "waiting": [...],
  "inquiries": [...]
}
```

## 技術的な詳細

### アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  dashboard.md   │────▶│   FastAPI App   │────▶│   Web Browser   │
│  (shogun側)     │     │  (parser + API) │     │  (HTML/CSS/JS)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### ファイル構成

| ファイル | 役割 |
|---------|------|
| `app.py` | FastAPIアプリケーション（メイン） |
| `parser.py` | dashboard.md パーサー |
| `static/index.html` | フロントエンドHTML |
| `static/style.css` | スタイルシート |
| `static/app.js` | フロントエンドロジック |

## ライセンス

MIT License

## 関連プロジェクト

- [multi-agent-shogun](https://github.com/yohey-w/multi-agent-shogun) - 本体システム
