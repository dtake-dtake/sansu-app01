# -*- coding: utf-8 -*-
import argparse
import json
import os
import re
import shutil
from datetime import datetime

TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)

def slugify(s: str) -> str:
    """ファイル名から apps 用の id を作る（安全なスラグ）"""
    s = os.path.splitext(s)[0]
    s = re.sub(r"[^\w\-]+", "-", s, flags=re.UNICODE)
    s = re.sub(r"-{2,}", "-", s).strip("-").lower()
    return s or "item"

def natural_key(s: str):
    """01_xxx, 10_xxx を自然順ソート"""
    return [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", s)]

def extract_title(html_path: str) -> str:
    """HTML の <title> を拾う。なければファイル名から生成"""
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            html = f.read()
        m = TITLE_RE.search(html)
        if m:
            title = re.sub(r"\s+", " ", m.group(1).strip())
            return title
    except Exception:
        pass
    base = os.path.basename(html_path)
    name = os.path.splitext(base)[0]
    return name.replace("_", " ")

def main():
    ap = argparse.ArgumentParser(description="Update app_data.json apps from a directory of HTML files.")
    ap.add_argument("--root", required=True, help="プロジェクトのルート（index.html と app_data.json がある場所）")
    ap.add_argument("--grade", required=True, help="更新対象の学年名（例：3年）")
    ap.add_argument("--unit", required=True, help="更新対象の単元名（app_data.json と完全一致）")
    ap.add_argument("--dir", required=True, help="HTML を読み取る相対パス（例：3nen/3_tasizan_hikizan_hissan）")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    app_json_path = os.path.join(root, "app_data.json")
    scan_dir = os.path.join(root, args.dir)

    if not os.path.isfile(app_json_path):
        raise SystemExit(f"app_data.json が見つかりません: {app_json_path}")
    if not os.path.isdir(scan_dir):
        raise SystemExit(f"対象フォルダが見つかりません: {scan_dir}")

    html_files = [f for f in os.listdir(scan_dir) if f.lower().endswith(".html")]
    if not html_files:
        raise SystemExit("HTML ファイルが見つかりませんでした。")

    html_files.sort(key=natural_key)

    new_apps = []
    for fname in html_files:
        full = os.path.join(scan_dir, fname)
        title = extract_title(full)
        app_id = slugify(fname)
        rel_path = os.path.join(args.dir, fname).replace("\\", "/")  # JSON は / でOK
        new_apps.append({"id": app_id, "title": title, "path": rel_path})

    with open(app_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    grade_obj = next((g for g in data if g.get("grade") == args.grade), None)
    if not grade_obj:
        raise SystemExit(f"学年が見つかりません: {args.grade}")

    unit_obj = next((u for u in grade_obj.get("units", []) if u.get("name") == args.unit), None)
    if not unit_obj:
        raise SystemExit(f"単元が見つかりません: {args.unit}")

    unit_obj["apps"] = new_apps

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(root, f"app_data.backup.{ts}.json")
    shutil.copyfile(app_json_path, backup_path)

    with open(app_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"更新完了: {args.grade} / {args.unit}")
    print(f"HTML {len(new_apps)}件を反映しました。")
    print(f"バックアップ: {backup_path}")

if __name__ == "__main__":
    main()
