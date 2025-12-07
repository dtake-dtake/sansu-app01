#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
sansu-app01 用 app_data.json ビルダー（単元名対応・未実装単元表示対応版）
- updates_list.tsv を正として、記載の単元は必ずリストアップする
- 実装済み .html を走査し、各単元に紐付ける
- HTMLが存在しない単元は「apps」が空のリストになり、「開発中」として扱える
- タイトルは <h2> を最優先（無ければ meta[name=app-title] → <h1> → <title> → ファイル名）
"""

from __future__ import annotations
import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional

from bs4 import BeautifulSoup  # pip install beautifulsoup4

SKIP_DIRS = {".git", ".github", "node_modules", "common", "assets", "img", "images", "css", "js", "scripts", "tools"}
ROOT_INDEX = {"index.html", "index.htm"}

def_to_hankaku = str.maketrans("０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ　", "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ")
def_normalize_re = re.compile(r"[˗֊‐‑‒–—―⁃⁻−▬—―─━ー・･,]")

def normalize_for_sort(s: str) -> str:
    s = s.translate(def_to_hankaku)
    s = def_normalize_re.sub("-", s)
    return s.casefold()

def get_title(soup: BeautifulSoup, meta_name: str, fallback_tags: List[str]) -> str:
    if meta_name:
        meta = soup.find("meta", attrs={"name": meta_name})
        if meta and meta.get("content"):
            return meta["content"].strip()
    for tag in fallback_tags:
        node = soup.find(tag)
        if node and node.string:
            return node.string.strip()
    return ""

def get_app_id_from_script(script_content: str) -> Optional[str]:
    patterns = [
        re.compile(r"""(?:const|let|var)\s+APP_ID\s*=\s*['"]([^'"]+)['"]"""),
        re.compile(r"""appId\s*:\s*['"]([^'"]+)['"]"""),
    ]
    for pattern in patterns:
        match = pattern.search(script_content)
        if match:
            return match.group(1)
    return None

def get_page_from_script(script_content: str) -> Optional[str]:
    """スクリプト内から page: 123 または page: "123" を抽出する"""
    pattern = re.compile(r"""page\s*:\s*['"]?(\d+)['"]?""")
    match = pattern.search(script_content)
    if match:
        return match.group(1)
    return None

def extract_info(html_path: Path, encoding: str) -> dict:
    with html_path.open(encoding=encoding, errors="replace") as f:
        content = f.read()
    
    soup = BeautifulSoup(content, "html.parser")
    title = get_title(soup, "app-title", ["h2", "h1", "title"]) or html_path.stem
    
    app_id_from_script = None
    page_from_script = None

    for script in soup.find_all("script"):
        if not script.string:
            continue
        
        # IDの抽出
        if not app_id_from_script:
            app_id_from_script = get_app_id_from_script(script.string)

        # ページ番号の抽出（追加）
        if not page_from_script:
            page_from_script = get_page_from_script(script.string)

        if app_id_from_script and page_from_script:
            break
            
    app_id = app_id_from_script or html_path.stem
    
    result = {"id": app_id, "title": title, "path": str(html_path).replace("\\", "/")}
    if page_from_script:
        result["page"] = page_from_script
    
    return result

def main():
    ap = argparse.ArgumentParser(description="Build app_data.json from directory structure and a TSV file.")
    ap.add_argument("--root", default=".", help="Root directory of the project.")
    ap.add_argument("--tsv", default="updates_list.tsv", help="Path to the TSV file for unit metadata.")
    ap.add_argument("--out", default="app_data.json", help="Output JSON file path.")
    ap.add_argument("--encoding", default="utf-8", help="File encoding for HTML and TSV files.")
    args = ap.parse_args()

    root_path = Path(args.root).resolve()
    tsv_path = root_path / args.tsv

    # 1. TSVからすべての単元情報を読み込む
    all_units = defaultdict(list)
    try:
        with tsv_path.open(encoding=args.encoding, newline="") as f:
            reader = csv.reader(f, delimiter="\t")
            for row in reader:
                if len(row) >= 3:
                    grade, unit_name, unit_dir = row[0].strip(), row[1].strip(), row[2].strip()
                    if grade and unit_name and unit_dir:
                        all_units[grade].append({"name": unit_name, "path": unit_dir, "apps": []})
    except FileNotFoundError:
        print(f"Error: TSV file not found at {tsv_path}")
        return

    # 2. ディレクトリをスキャンしてHTMLファイルを探し、単元に紐付ける
    for html_file in root_path.rglob("*.html"):
        if html_file.name in ROOT_INDEX and html_file.parent == root_path:
            continue
        if any(part in SKIP_DIRS for part in html_file.parts):
            continue

        rel_path = html_file.relative_to(root_path)
        
        for grade, units in all_units.items():
            for unit in units:
                unit_path = Path(unit["path"])
                if rel_path.parent == unit_path:
                    info = extract_info(rel_path, args.encoding)
                    unit["apps"].append(info)
                    break

    # 3. JSONデータを構築
    output_data = []
    for grade in sorted(all_units.keys(), key=lambda g: int(re.sub(r'\D', '', g))):
        grade_data = {"grade": grade, "units": []}
        for unit in all_units[grade]:
            # アプリをタイトルでソート
            unit["apps"].sort(key=lambda x: normalize_for_sort(x["title"]))
            # pathキーはもう不要なので削除
            del unit["path"]
            grade_data["units"].append(unit)
        output_data.append(grade_data)

    # 4. JSONファイルに書き出し
    with open(args.out, "w", encoding=args.encoding) as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated '{args.out}' with {len(all_units)} grades.")

if __name__ == "__main__":
    main()