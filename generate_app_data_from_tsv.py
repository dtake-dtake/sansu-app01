# -*- coding: utf-8 -*-
"""
TSV から app_data.json を再生成するスクリプト。
並び順は TSV の行順を尊重し、フォルダ配下の HTML を再帰的に探索します。
appId は HTML/JS から抽出（無ければファイル名の slug）、title は h2 → title → ファイル名の順。
"""
import argparse, csv, json, os, re, shutil
from datetime import datetime
from html import unescape

# 正規表現
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
H2_RE = re.compile(r"<h2[^>]*>(.*?)</h2>", re.IGNORECASE | re.DOTALL)
SCRIPT_SRC_RE = re.compile(r"<script[^>]+src=[\"']([^\"']+)[\"'][^>]*>", re.IGNORECASE)
APP_ID_CONST_RE  = re.compile(r"""const\s+APP_ID\s*=\s*['"]([^'"]+)['"]""", re.IGNORECASE)
APP_ID_IN_OBJ_RE = re.compile(r"""(?:^|[{\s,])appId\s*:\s*['"]([^'"]+)['"]""", re.IGNORECASE | re.DOTALL)
COMMON_SETUP_RE  = re.compile(r"""Common\.setup\(\s*\{[^}]*appId\s*:\s*['"]([^'"]+)['"]""", re.IGNORECASE | re.DOTALL)
INIT_CALL_RE     = re.compile(r"""initializeDrillApp\(\s*\{[^}]*appId\s*:\s*['"]([^'"]+)['"]""", re.IGNORECASE | re.DOTALL)

def read_text_safe(path):
    for enc in ("utf-8", "utf-8-sig", "cp932"):
        try:
            with open(path, "r", encoding=enc) as f:
                return f.read()
        except Exception:
            pass
    with open(path, "rb") as f:
        return f.read().decode("utf-8", errors="ignore")

def slugify(s):
    s = os.path.splitext(os.path.basename(s))[0]
    s = re.sub(r"[^\w\-]+", "-", s).strip("-").lower()
    s = re.sub(r"-{2,}", "-", s)
    return s or "item"

def natural_key(s):
    return [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", s)]

def extract_h2_or_title(html_text, fallback_name):
    m = H2_RE.search(html_text)
    if m:
        txt = unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
        if txt:
            return txt
    m2 = TITLE_RE.search(html_text)
    if m2:
        txt = unescape(re.sub(r"\s+", " ", m2.group(1))).strip()
        if txt:
            return txt
    return os.path.splitext(os.path.basename(fallback_name))[0].replace("_", " ")

def find_app_id_in_text(text):
    for regex in (APP_ID_CONST_RE, COMMON_SETUP_RE, INIT_CALL_RE, APP_ID_IN_OBJ_RE):
        m = regex.search(text)
        if m:
            return m.group(1)
    return None

def resolve_js_candidates(root, html_path, src):
    cands = []
    if not src or src.startswith(("http://", "https://")):
        return cands
    src = src.split("?", 1)[0].split("#", 1)[0]
    if src.startswith("/"):
        cands.append(os.path.normpath(os.path.join(root, src.lstrip("/"))))
    html_dir = os.path.dirname(html_path)
    cands.append(os.path.normpath(os.path.join(html_dir, src)))
    return cands

def extract_app_id_and_title_from_html(root, html_path):
    html_text = read_text_safe(html_path)
    app_id = find_app_id_in_text(html_text)
    if not app_id:
        srcs = SCRIPT_SRC_RE.findall(html_text)
        for src in srcs:
            for cand in resolve_js_candidates(root, html_path, src):
                if os.path.isfile(cand):
                    js_text = read_text_safe(cand)
                    app_id = find_app_id_in_text(js_text)
                    if app_id:
                        break
            if app_id:
                break
    title = extract_h2_or_title(html_text, html_path)
    return app_id, title

def collect_htmls(scan_root):
    htmls = []
    for dirpath, _, filenames in os.walk(scan_root):
        for fn in filenames:
            if not fn.lower().endswith(".html"): 
                continue
            if fn.lower() == "template.html":
                continue
            htmls.append(os.path.join(dirpath, fn))
    htmls.sort(key=lambda p: natural_key(os.path.relpath(p, scan_root)))
    return htmls

def load_tsv_rows(tsv_path):
    rows = []
    with open(tsv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if not row or len(row) < 3:
                continue
            grade = row[0].strip()
            unit  = row[1].strip()
            dpath = row[2].strip()
            if grade and unit and dpath and not grade.startswith("#") and not unit.startswith("#"):
                rows.append((grade, unit, dpath))
    return rows

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True, help="プロジェクトルート（index.html / app_data.json がある場所）")
    ap.add_argument("--tsv",  required=True, help="updates_list.tsv のパス")
    ap.add_argument("--json", default="app_data.json", help="出力する app_data.json（相対 or 絶対）")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    tsv_path = os.path.abspath(args.tsv)
    json_path = args.json if os.path.isabs(args.json) else os.path.join(root, args.json)

    rows = load_tsv_rows(tsv_path)
    if not rows:
        raise SystemExit("TSV に有効な行がありません（学年, 単元名, ディレクトリ の3列が必要）")

    grades = []
    for grade_name, unit_name, rel_dir in rows:
        g = next((g for g in grades if g["grade"] == grade_name), None)
        if not g:
            g = {"grade": grade_name, "units": []}
            grades.append(g)

        scan_dir = os.path.join(root, rel_dir)
        apps = []
        if os.path.isdir(scan_dir):
            for full in collect_htmls(scan_dir):
                rel_path = os.path.relpath(full, root).replace("\\", "/")
                app_id, title = extract_app_id_and_title_from_html(root, full)
                if not app_id:
                    app_id = slugify(os.path.basename(full))
                apps.append({"id": app_id, "title": title, "path": rel_path})
        g["units"].append({"name": unit_name, "apps": apps})

    if os.path.isfile(json_path):
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup = json_path + f".{ts}.bak"
        shutil.copyfile(json_path, backup)
        print("バックアップ:", backup)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(grades, f, ensure_ascii=False, indent=2)
    print("生成完了:", json_path)
    print(f"学年数 {len(grades)}  | 単元総数 {sum(len(g['units']) for g in grades)}")

if __name__ == "__main__":
    main()
