"""dashboard.md パーサー"""
import re
from pathlib import Path
from typing import Any


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
        if section.startswith("🚨 要対応"):
            result["action_required"] = parse_action_required(section)
        elif section.startswith("🔄 進行中"):
            result["in_progress"] = parse_table(section)
        elif section.startswith("✅ 本日の戦果"):
            result["completed_today"] = parse_table(section)
            result["completed_reports"] = parse_completed_reports(section)
        elif section.startswith("🎯 スキル化候補"):
            result["skill_candidates"] = parse_skill_candidates(section)
        elif section.startswith("🛠️ 生成されたスキル"):
            result["generated_skills"] = parse_generated_skills(section)
        elif section.startswith("⏸️ 待機中"):
            result["waiting"] = parse_simple_list(section)
        elif section.startswith("❓ 伺い事項"):
            result["inquiries"] = parse_simple_list(section)

    return result


def parse_action_required(section: str) -> list[dict]:
    """要対応セクションをパース"""
    items = []

    # ### で始まるサブセクションを抽出
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

    dashboard.md 形式:
    ### skill-name（新規）
    | 項目 | 内容 |
    |------|------|
    | 名前 | skill-name |
    | 説明 | 説明文 |
    | 発見元 | cmd_XXX |
    """
    candidates = []

    # 却下済み部分は除外
    main_section = section.split("### 却下済み")[0]

    # 「なし」のみの場合は空リストを返す
    if re.search(r"^\s*なし\s*$", main_section, re.MULTILINE):
        return []

    # ### で始まるスキル名を探す（parse_generated_skills と同じ方式）
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
