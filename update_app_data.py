# -*- coding: utf-8 -*-
import argparse, json, os, re, shutil
from datetime import datetime

TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
SCRIPT_SRC_RE = re.compile(r"<script[^>]+src=[\"']([^\"']+)[\"'][^>]*>", re.IGNORECASE)
APP_ID_CONST_RE = re.compile(r"""const\s+APP_ID\s*=\s*['"]([^'"]+)['"]""", re.IGNORECASE)
APP_ID_IN_OBJ_RE = re.compile(r"""(?:^|[{\s,])appId\s*:\s*['"]([^'"]+)['"]""", re.IGNORECASE | re.DOTALL)
COMMON_SETUP_RE = re.compile(r"""Common\.setup\(\s*\{[^}]*appId\s*:\s*['"]([^'"]+)['"]""", re.IGNORECASE | re.DOTALL)
INIT_CALL_RE = re.compile(r"""initializeDrillApp\(\s*\{[^}]*appId\s*:\s*['"]([^'"]+)['"]""", re.IGNORECASE | re.DOTALL)

def slugify(s: str) -> str:
    s = os.path.splitext(s)[0]
    s = re.sub(r"[^\w\-]+", "-", s).strip("-").lower()
    s = re.sub(r"-{2,}", "-", s)
    return s or "item"

def natural_key(s: str):
    return [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", s)]

def read_text_safe(path: str) -> str:
    for enc in ("utf-8", "utf-8-sig", "cp932"):
        try:
            with open(path, "r", encoding=enc) as f:
                return f.read()
        except Exception:
            pass
    with open(path, "rb") as f:
        return f.read().decode("utf-8", errors="ignore")

def extract_title(html_path: str) -> str:
    try:
        html = read_text_safe(html_path)
        m = TITLE_RE.search(html)
        if m:
            return re.sub(r"\s+", " ", m.group(1).strip())
    except Exception:
        pass
    return os.path.splitext(os.path.basename(html_path))[0].replace("_", " ")

def find_app_id_in_text(text: str):
    for regex, tag in (
        (APP_ID_CONST_RE, "APP_ID const"),
        (COMMON_SETUP_RE, "Common.setup"),
        (INIT_CALL_RE, "initializeDrillApp"),
        (APP_ID_IN_OBJ_RE, "object appId"),
    ):
        m = regex.search(text)
        if m:
            return m.group(1), tag
    return None, None

def resolve_js_candidates(root: str, html_path: str, src: str):
    cands = []
    if src.startswith(("http://", "https://")):
        return cands
    src = src.split("?", 1)[0].split("#", 1)[0]  # ← 追加：クエリ/ハッシュ除去
    if src.startswith("/"):
        cands.append(os.path.normpath(os.path.join(root, src.lstrip("/"))))
    html_dir = os.path.dirname(html_path)
    cands.append(os.path.normpath(os.path.join(html_dir, src)))
    return cands

def extract_app_id_from_html(root: str, html_path: str):
    html_text = read_text_safe(html_path)
    app_id, how = find_app_id_in_text(html_text)
    if app_id:
        return app_id, f"inline:{how}"
    for src in SCRIPT_SRC_RE.findall(html_text):
        for cand in resolve_js_candidates(root, html_path, src):
            if os.path.isfile(cand):
                js_text = read_text_safe(cand)
                app_id, how = find_app_id_in_text(js_text)
                if app_id:
                    rel = os.path.relpath(cand, root)
                    return app_id, f"js:{how}:{rel}"
    return None, None

def main():
    ap = argparse.ArgumentParser(description="Update app_data.json from HTML drills.")
    ap.add_argument("--root", required=True)
    ap.add_argument("--grade", required=True)
    ap.add_argument("--unit", required=True)
    ap.add_argument("--dir", required=True)
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--skip-if-empty", action="store_true",
                    help="HTMLが無い場合はJSONを変更せずスキップ")
    ap.add_argument("--remove-unit-if-empty", action="store_true",
                    help="HTMLが無い場合は該当の単元自体をJSONから削除")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    app_json_path = os.path.join(root, "app_data.json")
    scan_dir = os.path.join(root, args.dir)
    if not os.path.isfile(app_json_path):
        raise SystemExit(f"app_data.json が見つかりません: {app_json_path}")
    if not os.path.isdir(scan_dir):
        if args.skip_if_empty or args.remove_unit_if_empty:
            # 単元削除/スキップの処理へ
            html_files = []
        else:
            raise SystemExit(f"対象フォルダが見つかりません: {scan_dir}")
    else:
        html_files = [f for f in os.listdir(scan_dir)
                      if f.lower().endswith(".html") and f.lower() != "template.html"]
        html_files.sort(key=natural_key)

    # 空単元の扱い
    if not html_files:
        with open(app_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        grade_obj = next((g for g in data if g.get("grade") == args.grade), None)
        if not grade_obj:
            print(f"[SKIP] 学年なし: {args.grade}")
            return
        if args.remove_unit_if_empty:
            before = len(grade_obj.get("units", []))
            grade_obj["units"] = [u for u in grade_obj.get("units", [])
                                  if u.get("name") != args.unit]
            after = len(grade_obj["units"])
            if before != after:
                ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_path = os.path.join(root, f"app_data.backup.{ts}.json")
                shutil.copyfile(app_json_path, backup_path)
                with open(app_json_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"[REMOVED] {args.grade}/{args.unit}（HTMLなし）→ JSONから削除。バックアップ: {backup_path}")
            else:
                print(f"[SKIP] {args.grade}/{args.unit} は JSONに見当たらず、変更なし。")
        else:
            print(f"[SKIP] {args.grade}/{args.unit}: HTMLなし→JSON変更せず")
        return

    # ここから通常更新
    new_apps = []
    for fname in html_files:
        full = os.path.join(scan_dir, fname)
        title = extract_title(full)
        explicit_app_id, how = extract_app_id_from_html(root, full)
        app_id = explicit_app_id if explicit_app_id else slugify(fname)
        if not args.quiet:
            if explicit_app_id:
                print(f"[OK] {fname}: appId='{app_id}' ← {how}")
            else:
                print(f"[WARN] {fname}: appId検出不可。slugify→ '{app_id}'")
        rel_path = os.path.join(args.dir, fname).replace("\\", "/")
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

    print(f"更新完了: {args.grade} / {args.unit}（{len(new_apps)}件）")
    print(f"バックアップ: {backup_path}")

if __name__ == "__main__":
    main()
