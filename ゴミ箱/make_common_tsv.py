# make_common_tsv.py
# app_data.json を読み、●/・で始まる単元を「共通」行として TSV 断片にする
# 出力: updates_list_common.tsv（タブ区切り: 学年,番号,単元名,ディレクトリ）

import json, os, re

APP_JSON = "app_data.json"
OUT_TSV  = "updates_list_common.tsv"

# ●や・のバリエーションを吸収して先頭の印だけ落とす
LEAD_MARK = re.compile(r'^[\s\u3000]*[●・]+[\s\u3000]*')

def unit_is_common(name: str) -> bool:
    # 先頭が ● or ・（全角・半角空白を許容）
    return bool(LEAD_MARK.match(name or ""))

def clean_title(name: str) -> str:
    return LEAD_MARK.sub("", name or "").strip()

def guess_dir_from_path(path: str) -> str:
    """
    path が 'common/kaemasuka_3nen.html' のような単一HTMLでも
    ディレクトリとして 'common/kaemasuka_3nen' を提案。
    すでにフォルダ配下のHTMLなら、その親フォルダを返す。
    """
    d = os.path.dirname(path)
    base = os.path.splitext(os.path.basename(path))[0]
    # common の単一HTML想定: common/<base>.html -> common/<base>
    if d.lower() == "common":
        return f"{d}/{base}"
    # すでにフォルダ配下に複数HTMLがある場合はそのフォルダを使う
    return d or "common"

def main():
    with open(APP_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    rows = []
    seen = set()  # path 重複などの重複排除（同一特集が複数学年に載っているケース対策）

    # 学年→単元の順を維持
    for grade in data:
        for unit in grade.get("units", []):
            name = unit.get("name", "")
            if not unit_is_common(name):
                continue

            # 代表の path を 1つ確保（最初の app）
            apps = unit.get("apps", [])
            if not apps:
                continue
            path = apps[0].get("path", "").strip()
            if not path:
                continue

            key = (clean_title(name), path)
            if key in seen:
                continue
            seen.add(key)

            title = clean_title(name)
            directory = guess_dir_from_path(path)

            # 共通の採番は 1 からの通しにする
            rows.append(("共通", title, directory))

    # 採番して TSV 化（順番は app_data.json の出現順）
    with open(OUT_TSV, "w", encoding="utf-8", newline="") as f:
        n = 1
        for grade_label, title, directory in rows:
            f.write(f"{grade_label}\t{n}\t{title}\t{directory}\n")
            n += 1

    print(f"wrote: {OUT_TSV}  ({len(rows)} items)")

if __name__ == "__main__":
    main()
