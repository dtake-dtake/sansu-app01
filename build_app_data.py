#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
sansu-app01 用 app_data.json ビルダー
- 実装済み .html を走査
- タイトルは <h2> を最優先で取得（なければメタ/見出し/タイトル/ファイル名にフォールバック）
- id は <meta name="app-id"> or ファイル名（正規化）
- grade はパスの 'gradeN' か <meta name="app-grade">
- unit は <meta name="app-unit"> or 直上ディレクトリ名
- (タイトル未設定) や空タイトルは除外
- 出力は index.html が期待する構造:
  [
    {"grade":"1","units":[{"unit":"…","apps":[{"id":"…","title":"…","path":"…"}]}]},
    ...
  ]
"""

import argparse
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup  # pip install beautifulsoup4

# 走査から除外するディレクトリ
DEFAULT_SKIP_DIRS = {
    ".git", ".github", "node_modules", "common", "data", "assets", "images",
    "img", "css", "js", "scripts", "tools"
}
# 除外するファイル名の一部
DEFAULT_SKIP_FILES_REGEX = re.compile(
    r"(index\.html?$|template|sample|_draft|\.bak\.html?$)", re.IGNORECASE
)

def normalize_id(s: str) -> str:
    # 半角化/空白除去 → 英数-_ のみ
    s = s.strip()
    s = s.replace("　", " ")
    s = s.lower()
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^a-z0-9_\-]", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-_")
    return s or "app"

def extract_meta(soup, name):
    tag = soup.find("meta", attrs={"name": name})
    return (tag.get("content") or "").strip() if tag else ""

def extract_title(soup: BeautifulSoup, fallback_filename: str) -> str:
    # 1) h2
    h2 = soup.find("h2")
    if h2 and h2.get_text(strip=True):
        return h2.get_text(strip=True)
    # 2) meta[name=app-title]
    mt = extract_meta(soup, "app-title")
    if mt:
        return mt
    # 3) h1
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return h1.get_text(strip=True)
    # 4) <title>
    tt = soup.find("title")
    if tt and tt.get_text(strip=True):
        return tt.get_text(strip=True)
    # 5) ファイル名
    return Path(fallback_filename).stem

def detect_grade(rel_path: Path, soup: BeautifulSoup) -> str:
    # 1) meta があれば最優先
    meta_g = extract_meta(soup, "app-grade")
    if meta_g:
        mg = re.search(r"(\d+)", meta_g)
        if mg:
            return mg.group(1)

    p = str(rel_path).replace("\\", "/")

    # 2) パスから推測: gradeN / Nnen の両方に対応
    m = re.search(r"(?:^|/)(?:grade|グレード)?(\d+)(?:/|$)", p, re.IGNORECASE)
    if m:
        return m.group(1)

    m2 = re.search(r"(?:^|/)([1-6])(?:nen)(?:/|$)", p, re.IGNORECASE)
    if m2:
        return m2.group(1)

    # 見つからない場合は "0"
    return "0"

def detect_unit(rel_path: Path, soup: BeautifulSoup) -> str:
    mu = extract_meta(soup, "app-unit")
    if mu:
        return mu.strip()
    # 直上ディレクトリ名
    parent = rel_path.parent.name
    return parent or "その他"

def file_should_skip(p: Path) -> bool:
    if p.suffix.lower() not in {".html", ".htm"}:
        return True
    if DEFAULT_SKIP_FILES_REGEX.search(p.name):
        return True
    # 階層にスキップ対象ディレクトリが含まれるか
    for part in p.parts:
        if part in DEFAULT_SKIP_DIRS:
            return True
    return False

def main():
    ap = argparse.ArgumentParser(description="Build app_data.json from implemented HTML files.")
    ap.add_argument("--root", default=".", help="Repo root directory (default: .)")
    ap.add_argument("--out", default="app_data.json", help="Output JSON path (default: app_data.json)")
    ap.add_argument("--encoding", default="utf-8", help="File read encoding (default: utf-8)")
    ap.add_argument("--skip-dirs", nargs="*", default=[], help="Additional dir names to skip")
    ap.add_argument("--allow-empty-title", action="store_true", help="Do not drop entries with empty or '(タイトル未設定)'")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"[ERROR] root not found: {root}", file=sys.stderr)
        sys.exit(1)

    DEFAULT_SKIP_DIRS.update(args.skip_dirs)

    items = []  # (grade, unit, app_dict)
    for p in root.rglob("*.htm*"):
        if file_should_skip(p.relative_to(root)):
            continue

        try:
            html = p.read_text(encoding=args.encoding, errors="ignore")
        except Exception as e:
            print(f"[WARN] read failed: {p} ({e})", file=sys.stderr)
            continue

        soup = BeautifulSoup(html, "html.parser")
        rel = p.relative_to(root)

        title = extract_title(soup, p.name).strip()
        if not args.allow_empty_title:
            if not title or title == "(タイトル未設定)":
                # タイトル未設定は「実装未完」と見做して除外
                continue

        # id
        app_id = extract_meta(soup, "app-id").strip()
        if not app_id:
            app_id = normalize_id(Path(p.name).stem)

        grade = detect_grade(rel, soup)
        unit  = detect_unit(rel, soup)

        app = {
            "id": app_id,
            "title": title,
            "path": str(rel).replace("\\", "/")
        }
        items.append((grade, unit, app))

    # grade / unit でグループ化
    from collections import defaultdict
    grade_map = defaultdict(lambda: defaultdict(list))
    for grade, unit, app in items:
        grade_map[grade][unit].append(app)

    # 各 apps を path で安定ソート
    def sort_key_app(a): return (a["title"], a["path"])
    def sort_key_unit(u): return u
    def sort_key_grade(g): return (int(g) if g.isdigit() else 999, g)

    out_data = []
    for g in sorted(grade_map.keys(), key=sort_key_grade):
        units = []
        for u in sorted(grade_map[g].keys(), key=sort_key_unit):
            apps = sorted(grade_map[g][u], key=sort_key_app)
            units.append({"unit": u, "apps": apps})
        out_data.append({"grade": g, "units": units})

    # 書き出し（UTF-8, 改行, インデント）
    out_path = Path(args.out)
    out_path.write_text(json.dumps(out_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] wrote {out_path} ({out_path.resolve()}) with {sum(len(x['apps']) for u in out_data for x in u['units'])} apps.")

if __name__ == "__main__":
    main()
