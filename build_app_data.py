#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
sansu-app01 用 app_data.json ビルダー（単元名対応版）
- 実装済み .html を走査
- 単元名は updates_list.tsv（「学年」「単元名」「単元フォルダ」の三列TSV）から取得
  * 例行: 1年\t６　たしざん(1)\t1nen/06_tashizan1
- TSVが無い、もしくは一致しない場合はフォルダ名から簡易整形でフォールバック
- タイトルは <h2> を最優先（無ければ meta[name=app-title] → <h1> → <title> → ファイル名）
- 出力: [{"grade":"1","units":[{"name":"…","apps":[{"id":"…","title":"…","path":"…"}]}]}, …]
"""

from __future__ import annotations
import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple, Optional

from bs4 import BeautifulSoup  # pip install beautifulsoup4


# 除外ディレクトリ
SKIP_DIRS = {
    ".git", ".github", "node_modules", "common", "assets", "img", "images",
    "css", "js", "scripts", "tools"
}
# ルート直下の index.html は除外（トップページ）
ROOT_INDEX = {"index.html", "index.htm"}

# ---------- 文字列ユーティリティ ----------
def norm_id(s: str) -> str:
    s = s.strip().lower().replace("　", " ")
    s = re.sub(r"\s+", "_", s)               # 空白→_
    s = re.sub(r"[^a-z0-9_\-]", "-", s)      # 記号→-
    s = re.sub(r"-{2,}", "-", s).strip("-_")
    return s or "app"

def pretty_from_folder(folder: str) -> str:
    """
    フォルダ名からそれっぽい表示名を作る簡易整形（TSVが無い場合のフォールバック）
    例) '05_fuetari_hettari' → '05 fuetari hettari'
    """
    base = folder.replace("_", " ").strip()
    # 先頭の 0 埋め数字を半角空白付きで整形（あれば）
    m = re.match(r"^(\d+)\s*(.*)$", base)
    if m:
        return f"{m.group(1)} {m.group(2)}".strip()
    return base or "未分類"

def ext_meta(soup: BeautifulSoup, name: str) -> str:
    tag = soup.find("meta", attrs={"name": name})
    return (tag.get("content") or "").strip() if tag else ""

def pick_title(soup: BeautifulSoup, fallback_filename: str) -> str:
    for sel in ["h2", None, "h1", "title"]:
        if sel:
            el = soup.find(sel)
            if el and el.get_text(strip=True):
                return el.get_text(strip=True)
        else:
            meta = ext_meta(soup, "app-title")
            if meta:
                return meta
    return Path(fallback_filename).stem

# ---------- 学年・単元の検出 ----------
GRADE_FIRST_RE  = re.compile(r"^(?:(\d+)nen|grade(\d+))$", re.IGNORECASE)

def detect_grade_from_parts(parts: Tuple[str, ...]) -> Optional[str]:
    if not parts:
        return None
    m = GRADE_FIRST_RE.match(parts[0])
    if not m:
        return None
    return m.group(1) or m.group(2)  # '1'..'6'

def unit_key_from_rel(rel: Path) -> Optional[str]:
    """
    '1nen/05_...' または 'grade2/tashihiki' の最初の2階層を unitKey にする
    """
    parts = rel.as_posix().split("/")
    g = detect_grade_from_parts(tuple(parts))
    if not g or len(parts) < 2:
        return None
    return "/".join(parts[:2])  # 例: '1nen/05_fuetari_hettari'

# ---------- TSV 読み込み ----------
def load_updates_tsv(tsv_path: Path, encoding: str) -> Tuple[Dict[str, str], Dict[str, List[str]]]:
    """
    returns:
      unit_name_map: unitKey -> 単元名（例: '1nen/05_...' -> '５ ふえたり へったり'）
      order_by_grade: grade -> [unitKey,...]  （TSVに現れた順）
    """
    unit_name_map: Dict[str, str] = {}
    order_by_grade: Dict[str, List[str]] = defaultdict(list)
    if not tsv_path.exists():
        return unit_name_map, order_by_grade

    with tsv_path.open("r", encoding=encoding, errors="ignore", newline="") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 3:
                continue
            grade_raw, unit_name, unit_path = row[0].strip(), row[1].strip(), row[2].strip()
            # '1年' → '1'
            mg = re.search(r"(\d+)", grade_raw)
            if not mg:
                continue
            grade = mg.group(1)
            # unitKey は '1nen/...'
            unit_key = unit_path.replace("\\", "/")
            unit_name_map[unit_key] = unit_name
            if unit_key not in order_by_grade[grade]:
                order_by_grade[grade].append(unit_key)
    return unit_name_map, order_by_grade

# ---------- メイン処理 ----------
def build_manifest(root: Path, encoding: str, allow_empty_title: bool) -> List[dict]:
    updates_tsv = root / "updates_list.tsv"
    unit_name_map, order_by_grade = load_updates_tsv(updates_tsv, encoding)

    grade_units: Dict[str, Dict[str, dict]] = defaultdict(dict)  # grade -> unitKey -> unitDict
    apps_count = 0

    for file_path in root.rglob("*.htm*"):
        rel = file_path.relative_to(root)
        # ルート直下 index.html は除く
        if rel.as_posix() in ROOT_INDEX:
            continue
        # スキップディレクトリ配下は除外
        if any(p in SKIP_DIRS for p in rel.parts):
            continue

        unit_key = unit_key_from_rel(rel)
        grade = detect_grade_from_parts(rel.parts)
        if not unit_key or not grade:
            continue  # 学年/単元が判定できない構造はスキップ

        try:
            html = file_path.read_text(encoding=encoding, errors="ignore")
        except Exception:
            continue

        soup = BeautifulSoup(html, "html.parser")
        title = pick_title(soup, file_path.name).strip()
        if not allow_empty_title and (not title or title == "(タイトル未設定)"):
            continue

        app_id = ext_meta(soup, "app-id").strip() or norm_id(Path(file_path.name).stem)
        app = {
            "id": app_id,
            "title": title,
            "path": rel.as_posix()
        }

        # 単元名（TSV優先 → フォルダ名整形）
        unit_folder = unit_key.split("/", 1)[1] if "/" in unit_key else unit_key
        unit_name = unit_name_map.get(unit_key) or pretty_from_folder(unit_folder)

        if unit_key not in grade_units[grade]:
            grade_units[grade][unit_key] = {"name": unit_name, "apps": []}
        grade_units[grade][unit_key]["apps"].append(app)
        apps_count += 1

    # 出力整形（学年・単元の並び）
    out: List[dict] = []
    # 学年の順序は 1..6 固定
    for g in [str(i) for i in range(1, 7)]:
        if g not in grade_units:
            continue
        units_dict = grade_units[g]

        # TSVに現れた順（あれば） → それ以外はunit_keyの昇順
        ordered_keys: List[str] = []
        if g in order_by_grade:
            ordered_keys.extend([k for k in order_by_grade[g] if k in units_dict])
        ordered_keys.extend(sorted([k for k in units_dict.keys() if k not in ordered_keys]))

        units = [units_dict[k] for k in ordered_keys if units_dict[k]["apps"]]
        if units:
            out.append({"grade": g, "units": units})

    print(f"Generated manifest for {sum(len(u['apps']) for g in out for u in g['units'])} apps.")
    return out


def main():
    ap = argparse.ArgumentParser(description="Build app_data.json (with unit names) from HTML files.")
    ap.add_argument("--root", default=".", help="Repository root (default: current dir)")
    ap.add_argument("--out", default="app_data.json", help="Output JSON path (default: app_data.json)")
    ap.add_argument("--encoding", default="utf-8", help="HTML/TSV encoding (default: utf-8; Shift_JISなら cp932)")
    ap.add_argument("--allow-empty-title", action="store_true", help="Include entries whose titles are empty")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    data = build_manifest(root, args.encoding, args.allow_empty_title)
    Path(args.out).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] wrote {args.out}")

if __name__ == "__main__":
    main()
