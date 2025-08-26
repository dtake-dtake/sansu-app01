# -*- coding: utf-8 -*-
import argparse
import json
import os
import re
import shutil
from datetime import datetime

# ========= 抽出用の正規表現 =========
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
SCRIPT_SRC_RE = re.compile(r"<script[^>]+src=[\"']([^\"']+)[\"'][^>]*>", re.IGNORECASE)
APP_ID_CONST_RE = re.compile(r"""const\s+APP_ID\s*=\s*['"]([^'"]+)['"]""", re.IGNORECASE)
# 設定オブジェクト/初期化引数/共通setupなどのappId
APP_ID_IN_OBJ_RE = re.compile(r"""(?:^|[{\s,])appId\s*:\s*['"]([^'"]+)['"]""", re.IGNORECASE | re.DOTALL)
COMMON_SETUP_RE = re.compile(r"""Common\.setup\(\s*\{[^}]*appId\s*:\s*['"]([^'"]+)['"]""", re.IGNORECASE | re.DOTALL)
INIT_CALL_RE = re.compile(r"""initializeDrillApp\(\s*\{[^}]*appId\s*:\s*['"]([^'"]+)['"]""", re.IGNORECASE | re.DOTALL)

def slugify(s: str) -> str:
    """ファイル名から apps 用の id を作る（安全なスラグ）"""
    s = os.path.splitext(s)[0]
    s = re.sub(r"[^\w\-]+", "-", s, flags=re.UNICODE)
    s = re.sub(r"-{2,}", "-", s).strip("-").lower()
    return s or "item"

def natural_key(s: str):
    """01_xxx, 10_xxx を自然順ソート"""
    return [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", s)]

def read_text_safe(path: str) -> str:
    """UTF-8優先でテキストを読む（BOM/CP932も薄くケア）"""
    for enc in ("utf-8", "utf-8-sig", "cp932"):
        try:
            with open(path, "r", encoding=enc) as f:
                return f.read()
        except Exception:
            pass
    # 最後の保険
    with open(path, "rb") as f:
        return f.read().decode("utf-8", errors="ignore")

def extract_title(html_path: str) -> str:
    """HTML の <title> を拾う。なければファイル名から生成"""
    try:
        html = read_text_safe(html_path)
        m = TITLE_RE.search(html)
        if m:
            title = re.sub(r"\s+", " ", m.group(1).strip())
            return title
    except Exception:
        pass
    base = os.path.basename(html_path)
    name = os.path.splitext(base)[0]
    return name.replace("_", " ")

def find_app_id_in_text(text: str):
    """テキスト塊の中から appId を探す（優先順に）"""
    m = APP_ID_CONST_RE.search(text)
    if m:
        return m.group(1), "APP_ID const"
    m = COMMON_SETUP_RE.search(text)
    if m:
        return m.group(1), "Common.setup"
    m = INIT_CALL_RE.search(text)
    if m:
        return m.group(1), "initializeDrillApp"
    m = APP_ID_IN_OBJ_RE.search(text)
    if m:
        return m.group(1), "object appId"
    return None, None

def resolve_js_candidates(root: str, html_path: str, src: str):
    """scriptのsrcからローカルファイル候補パスを列挙（存在チェックは呼び出し側）"""
    candidates = []
    if src.startswith(("http://", "https://")):
        return candidates  # 外部CDNはスキップ
    # ルート相対（/common/...）想定
    if src.startswith("/"):
        candidates.append(os.path.normpath(os.path.join(root, src.lstrip("/"))))
    # HTMLファイルからの相対
    html_dir = os.path.dirname(html_path)
    candidates.append(os.path.normpath(os.path.join(html_dir, src)))
    # ./ や ../ の重複解決済みの候補を返す
    return candidates

def extract_app_id_from_html(root: str, html_path: str):
    """
    HTML本文 → まずは直書きのAPP_IDやsetup/initializeを検索。
    見つからなければ <script src="..."> を辿って外部JSで検索。
    それでも無ければ None を返す。
    """
    html_text = read_text_safe(html_path)

    # 1) HTML内の直書き
    app_id, method = find_app_id_in_text(html_text)
    if app_id:
        return app_id, f"inline:{method}"

    # 2) 外部JSを辿る
    srcs = SCRIPT_SRC_RE.findall(html_text)
    for src in srcs:
        for cand in resolve_js_candidates(root, html_path, src):
            if os.path.isfile(cand):
                try:
                    js_text = read_text_safe(cand)
                    app_id, method = find_app_id_in_text(js_text)
                    if app_id:
                        return app_id, f"js:{method}:{os.path.relpath(cand, root)}"
                except Exception:
                    pass

    # 3) 見つからず
    return None, None

def main():
    ap = argparse.ArgumentParser(description="Update app_data.json apps from a directory of HTML files.")
    ap.add_argument("--root", required=True, help="プロジェクトのルート（index.html と app_data.json がある場所）")
    ap.add_argument("--grade", required=True, help="更新対象の学年名（例：3年）")
    ap.add_argument("--unit", required=True, help="更新対象の単元名（app_data.json と完全一致）")
    ap.add_argument("--dir", required=True, help="HTML を読み取る相対パス（例：3nen/3_tasizan_hikizan_hissan）")
    ap.add_argument("--quiet", action="store_true", help="詳細ログを抑制する")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    app_json_path = os.path.join(root, "app_data.json")
    scan_dir = os.path.join(root, args.dir)

    if not os.path.isfile(app_json_path):
        raise SystemExit(f"app_data.json が見つかりません: {app_json_path}")
    if not os.path.isdir(scan_dir):
        raise SystemExit(f"対象フォルダが見つかりません: {scan_dir}")

    html_files = [f for f in os.listdir(scan_dir) if f.lower().endswith(".html") and f.lower() != "template.html"]
    if not html_files:
        raise SystemExit("HTML ファイルが見つかりませんでした。")

    html_files.sort(key=natural_key)

    new_apps = []
    for fname in html_files:
        full = os.path.join(scan_dir, fname)
        title = extract_title(full)

        # ★ appId の抽出（フォールバックあり）
        explicit_app_id, how = extract_app_id_from_html(root, full)
        if explicit_app_id:
            app_id = explicit_app_id  # 抽出できたらそれを採用（大文字小文字/ハイフン等も原文ママ）
            if not args.quiet:
                print(f"[OK] {fname}: appId='{app_id}' ← {how}")
        else:
            app_id = slugify(fname)   # 最後の手段：ファイル名スラグ
            if not args.quiet:
                print(f"[WARN] {fname}: appId を検出できず。slugify('{fname}') → '{app_id}' を採用")

        rel_path = os.path.join(args.dir, fname).replace("\\", "/")  # JSON は / でOK
        new_apps.append({"id": app_id, "title": title, "path": rel_path})

    # 既存 app_data.json を読み込み、該当ユニットの apps を置換
    with open(app_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    grade_obj = next((g for g in data if g.get("grade") == args.grade), None)
    if not grade_obj:
        raise SystemExit(f"学年が見つかりません: {args.grade}")

    unit_obj = next((u for u in grade_obj.get("units", []) if u.get("name") == args.unit), None)
    if not unit_obj:
        raise SystemExit(f"単元が見つかりません: {args.unit}")

    unit_obj["apps"] = new_apps

    # バックアップ作成 → 上書き保存
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
