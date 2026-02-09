"""dashboard.md パーサー"""
import re
from pathlib import Path
from typing import Any


def strip_emoji(text: str) -> str:
    """文字列先頭の絵文字を除去してテキスト部分のみ返す"""
    # 先頭の絵文字とスペースを除去（日本語を含まない範囲のみ）
    # emoji ライブラリを使わず、先頭の非ASCII文字を除去する簡易実装
    result = text.lstrip()
    # 先頭が日本語（ひらがな、カタカナ、漢字）またはASCIIでない場合、
    # 日本語以外の文字をスキップ
    while result:
        char = result[0]
        # 日本語の範囲: ひらがな、カタカナ、漢字、ASCII
        if (
            "\u3040" <= char <= "\u309F"  # ひらがな
            or "\u30A0" <= char <= "\u30FF"  # カタカナ
            or "\u4E00" <= char <= "\u9FFF"  # 漢字
            or "\u3400" <= char <= "\u4DBF"  # 漢字拡張A
            or char.isascii()
        ):
            break
        result = result[1:]
    return result.strip()


def normalize_table_keys(rows: list[dict]) -> list[dict]:
    """テーブルのカラム名を正規化キーに変換

    dashboard.mdのテーブルカラム名（日本語）を、GUIアプリが期待する
    正規化キー（英語）に変換する。

    変換マッピング:
    - 時刻/ID → time
    - 戦場/プロジェクト → project
    - 任務/タスク → task
    - 結果 → result
    - 担当 → assignee
    - 状態/状況 → status
    """
    key_mapping = {
        "時刻": "time",
        "ID": "time",
        "戦場": "project",
        "プロジェクト": "project",
        "任務": "task",
        "タスク": "task",
        "結果": "result",
        "担当": "assignee",
        "状態": "status",
        "状況": "status",
    }

    normalized = []
    for row in rows:
        new_row = {}
        for key, value in row.items():
            # マッピングがあれば正規化キーを使用、なければ元のキーを保持
            normalized_key = key_mapping.get(key, key)
            new_row[normalized_key] = value
        normalized.append(new_row)

    return normalized


def parse_dashboard(filepath: str) -> dict[str, Any]:
    """dashboard.md をパースしてJSONに変換"""
    path = Path(filepath)
    if not path.exists():
        return {"error": f"File not found: {filepath}"}

    content = path.read_text(encoding="utf-8")

    result = {
        "last_updated": "",
        "action_required": [],
        "in_progress": [],
        "completed_today": [],
        "completed_reports": [],
        "skill_candidates": [],
        "generated_skills": [],
        "waiting": [],
        "inquiries": [],
    }

    # 最終更新時刻
    match = re.search(r"最終更新:\s*(.+)", content)
    if match:
        result["last_updated"] = match.group(1).strip()

    # セクション分割
    sections = re.split(r"\n## ", content)

    for section in sections:
        # セクションの最初の行から絵文字を除去してマッチング
        first_line = section.split("\n")[0]
        section_title = strip_emoji(first_line)
        if section_title.startswith("要対応"):
            result["action_required"] = parse_action_required(section)
        elif section_title.startswith("進行中"):
            result["in_progress"] = normalize_table_keys(parse_table(section))
        elif section_title.startswith("本日の戦果"):
            result["completed_today"] = normalize_table_keys(parse_table(section))
            result["completed_reports"] = parse_completed_reports(section)
        elif section_title.startswith("スキル化候補"):
            result["skill_candidates"] = parse_skill_candidates(section)
        elif section_title.startswith("生成されたスキル"):
            result["generated_skills"] = parse_generated_skills(section)
        elif section_title.startswith("待機中"):
            result["waiting"] = parse_simple_list(section)
        elif section_title.startswith("伺い事項"):
            result["inquiries"] = parse_simple_list(section)

    return result


def parse_action_required(section: str) -> list[dict]:
    """要対応セクションをパース"""
    items = []

    # ### で始まるサブセクションを抽出（既存ロジック・後方互換）
    subsections = re.split(r"\n### ", section)
    for sub in subsections[1:]:  # 最初はヘッダー部分なのでスキップ
        lines = sub.strip().split("\n")
        if not lines:
            continue

        title = lines[0].strip()
        content_lines = []
        for line in lines[1:]:
            if line.strip() and not line.startswith("---"):
                content_lines.append(line.strip())

        items.append({
            "title": title,
            "content": "\n".join(content_lines),
        })

    # ### でアイテムが見つからなかった場合のフォールバック
    if not items:
        lines = section.split("\n")
        # ヘッダー行（「要対応」等）と区切り線をスキップ
        body_lines = []
        for line in lines[1:]:
            if line.strip() == "---":
                break
            body_lines.append(line)

        body = "\n".join(body_lines).strip()

        # 「なし」のみの場合
        if not body or body == "なし":
            return []

        # **【...】...** パターンでアイテムを分割
        bold_pattern = re.compile(r'^\*\*【(.+?)】(.+?)\*\*$')
        current_title = None
        current_lines = []

        for line in body_lines:
            match = bold_pattern.match(line.strip())
            if match:
                # 前のアイテムを保存
                if current_title is not None:
                    items.append({
                        "title": current_title,
                        "content": "\n".join(current_lines).strip(),
                    })
                current_title = f"【{match.group(1)}】{match.group(2)}"
                current_lines = []
            elif current_title is not None:
                current_lines.append(line)

        # 最後のアイテムを保存
        if current_title is not None:
            items.append({
                "title": current_title,
                "content": "\n".join(current_lines).strip(),
            })

        # **【...】** パターンもなかった場合、本文全体を1アイテムとして扱う
        if not items and body:
            items.append({
                "title": "要対応事項",
                "content": body,
            })

    return items


def parse_table(section: str) -> list[dict]:
    """Markdownテーブルをパース"""
    rows = []
    lines = section.split("\n")

    headers = []
    for i, line in enumerate(lines):
        if "|" in line and "---" not in line:
            cells = [c.strip() for c in line.split("|") if c.strip()]
            if not headers:
                headers = cells
            else:
                if len(cells) == len(headers):
                    if all(c == '-' for c in cells):
                        continue
                    row = dict(zip(headers, cells))
                    rows.append(row)

    return rows


def parse_completed_reports(section: str) -> list[dict]:
    """完了報告の詳細をパース"""
    reports = []

    # ### cmd_XXX 完了報告 のパターンを探す
    subsections = re.split(r"\n### (cmd_\d+) 完了報告", section)

    for i in range(1, len(subsections), 2):
        if i + 1 < len(subsections):
            cmd_id = subsections[i]
            content = subsections[i + 1]

            report = {"cmd_id": cmd_id, "content": {}}

            # 指令と結果を抽出
            match = re.search(r"\*\*指令\*\*:\s*(.+)", content)
            if match:
                report["content"]["order"] = match.group(1).strip()

            match = re.search(r"\*\*結果\*\*:\s*(.+)", content)
            if match:
                report["content"]["result"] = match.group(1).strip()

            reports.append(report)

    return reports


def parse_skill_candidates(section: str) -> list[dict]:
    """スキル化候補をパース

    dashboard.md 形式（2パターン対応）:

    パターン1（テーブル形式）:
    ### skill-name（新規）
    | 項目 | 内容 |
    |------|------|
    | 名前 | skill-name |
    | 説明 | 説明文 |
    | 発見元 | cmd_XXX |

    パターン2（箇条書き形式）:
    - **skill-name**（cmd_XXX / 発見元）— 説明文
    - **skill-name**（cmd_XXX / 発見元）- 説明文
    """
    candidates = []

    # 却下済み部分は除外
    main_section = section.split("### 却下済み")[0]

    # 「なし」のみの場合は空リストを返す
    if re.search(r"^\s*なし\s*$", main_section, re.MULTILINE):
        return []

    # パターン1: ### で始まるスキル名を探す（既存ロジック・後方互換）
    subsections = re.split(r"\n### ", main_section)
    for sub in subsections[1:]:
        lines = sub.strip().split("\n")
        if not lines:
            continue

        # スキル名（### の後の行）
        header = lines[0].strip()
        # 「（新規）」などの注釈を除去してスキル名を取得
        skill_name = re.sub(r"（.+）$", "", header).strip()

        skill_info = {
            "name": skill_name,
            "description": "",
            "source": "",
            "status": "承認待ち",
        }

        # テーブルから詳細を抽出
        for line in lines[1:]:
            if "|" in line and "---" not in line:
                cells = [c.strip() for c in line.split("|") if c.strip()]
                if len(cells) >= 2:
                    key = cells[0]
                    value = cells[1]
                    if key == "名前":
                        skill_info["name"] = value
                    elif key == "説明":
                        skill_info["description"] = value
                    elif key == "発見元":
                        skill_info["source"] = value
                    elif key == "汎用性":
                        skill_info["generality"] = value

        candidates.append(skill_info)

    # パターン2: 箇条書き形式のフォールバック（### 形式が見つからなかった場合）
    if not candidates:
        # - **name**（source）— description または - **name**（source）- description
        # emダッシュ（—）とハイフン（-）の両方に対応
        bullet_pattern = re.compile(r'^\s*-\s+\*\*(.+?)\*\*[（(](.+?)[）)]\s*[—\-]\s*(.+)$')

        lines = main_section.split("\n")
        for line in lines:
            # 取り消し線のある行は除外（却下済み）
            if "~~" in line:
                continue

            match = bullet_pattern.match(line)
            if match:
                skill_info = {
                    "name": match.group(1).strip(),
                    "source": match.group(2).strip(),
                    "description": match.group(3).strip(),
                    "status": "承認待ち",
                }
                candidates.append(skill_info)

    return candidates


def parse_generated_skills(section: str) -> list[dict]:
    """生成されたスキルをパース"""
    skills = []

    # ### で始まるスキル名を探す
    subsections = re.split(r"\n### ", section)
    for sub in subsections[1:]:
        lines = sub.strip().split("\n")
        if not lines:
            continue

        skill_name = lines[0].strip()
        skill_info = {"name": skill_name}

        # テーブルから詳細を抽出
        for line in lines[1:]:
            if "|" in line and "---" not in line:
                cells = [c.strip() for c in line.split("|") if c.strip()]
                if len(cells) >= 2:
                    key = cells[0]
                    value = cells[1]
                    if key == "設計書":
                        skill_info["design_doc"] = value
                    elif key == "説明":
                        skill_info["description"] = value
                    elif key == "対応言語":
                        skill_info["languages"] = value
                    elif key == "生成日":
                        skill_info["created_at"] = value

        skills.append(skill_info)

    return skills


def parse_simple_list(section: str) -> list[str]:
    """シンプルなリストをパース"""
    items = []
    lines = section.split("\n")

    for line in lines:
        line = line.strip()
        if line.startswith("- "):
            items.append(line[2:])
        elif line == "なし":
            return []

    return items


if __name__ == "__main__":
    import json
    import sys

    if len(sys.argv) > 1:
        result = parse_dashboard(sys.argv[1])
        print(json.dumps(result, ensure_ascii=False, indent=2))
