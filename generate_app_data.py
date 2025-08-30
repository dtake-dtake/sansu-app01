# generate_app_data.py (改良版)
# -----------------------------------------------------------------------------
# 概要:
#   updates_list.tsv から「単元名」を読み込み、
#   実際のフォルダ構成と照らし合わせながら app_data.json を全自動で生成します。
#
# 使い方:
#   1. 外部ライブラリをインストールします:
#      pip install beautifulsoup4
#   2. コマンドプロンプトでこのスクリプトを実行します:
#      python generate_app_data.py
# -----------------------------------------------------------------------------

import os
import json
import re
import shutil
import csv
from datetime import datetime
from collections import defaultdict

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("エラー: beautifulsoup4 ライブラリが見つかりません。")
    print("コマンドプロンプトで pip install beautifulsoup4 を実行してください。")
    exit()

# --- 設定項目 ---
# スキャン対象の学年フォルダ
TARGET_DIRECTORIES = ["1nen", "2nen", "3nen", "4nen", "5nen", "6nen", "common"]
# 出力ファイル名
OUTPUT_JSON_FILE = "app_data.json"
# 単元名の定義ファイル
UNIT_LIST_TSV = "updates_list.tsv"
# --- 設定ここまで ---

def load_unit_names(tsv_file):
    """updates_list.tsvを読み込み、フォルダパスと単元名の対応辞書を作成する"""
    unit_map = {}
    if not os.path.exists(tsv_file):
        print(f"警告: {tsv_file} が見つかりません。フォルダ名を単元名として使用します。")
        return unit_map

    try:
        with open(tsv_file, "r", encoding="utf-8") as f:
            # tsvファイルはタブ区切りなので、csvリーダーで方言を指定して読み込む
            reader = csv.reader(f, delimiter='\t')
            for row in reader:
                if len(row) >= 2:
                    # 1列目: パス (例: 1nen/06_tashizan1/9-3_tashizan_10made.html)
                    # 2列目: 単元名 (例: たしざん(1))
                    path = row[0].strip().replace("\\", "/")
                    unit_name = row[1].strip()
                    # パスからディレクトリ部分だけを抽出
                    unit_dir = os.path.dirname(path)
                    if unit_dir and unit_dir not in unit_map:
                        unit_map[unit_dir] = unit_name
    except Exception as e:
        print(f"エラー: {tsv_file} の読み込み中にエラーが発生しました: {e}")
    return unit_map

def extract_app_info(file_path):
    """HTMLファイルからアプリ名とappIdを抽出する"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        try:
            with open(file_path, "r", encoding="shift_jis") as f:
                content = f.read()
        except Exception as e:
            print(f"警告: ファイルが読み込めませんでした: {file_path} ({e})")
            return None, None

    app_id_match = re.search(r'appId\s*=\s*["\'](.*?)["\']', content)
    app_id = app_id_match.group(1) if app_id_match else None
    soup = BeautifulSoup(content, 'html.parser')
    app_name = soup.title.string.strip() if soup.title else "タイトルなし"

    if not app_id:
        print(f"警告: appIdが見つかりませんでした: {file_path}")
        return None, None

    return app_name, app_id

def main():
    """メイン処理"""
    print("アプリのスキャンを開始します...")
    # まず単元名の対応リストを読み込む
    unit_name_map = load_unit_names(UNIT_LIST_TSV)
    all_grades_data = []

    for grade_name in TARGET_DIRECTORIES:
        grade_path = grade_name
        if not os.path.isdir(grade_path):
            continue

        print(f"【{grade_name}】フォルダを処理中...")
        units = defaultdict(list)

        for dirpath, _, filenames in os.walk(grade_path):
            for filename in [f for f in filenames if f.lower().endswith('.html')]:
                file_path = os.path.join(dirpath, filename).replace("\\", "/")
                app_name, app_id = extract_app_info(file_path)

                if app_name and app_id:
                    unit_path = os.path.dirname(file_path)
                    app_data = {
                        "name": app_name,
                        "path": file_path,
                        "appId": app_id
                    }
                    units[unit_path].append(app_data)

        if not units:
            continue

        grade_units_list = []
        for unit_path in sorted(units.keys()):
            # tsvファイルから単元名を取得。なければフォルダ名を単元名とする
            unit_name = unit_name_map.get(unit_path, os.path.basename(unit_path))
            grade_units_list.append({
                "name": unit_name,
                "apps": sorted(units[unit_path], key=lambda x: x['path'])
            })

        all_grades_data.append({
            "grade": grade_name,
            "units": grade_units_list
        })

    if os.path.exists(OUTPUT_JSON_FILE):
        backup_filename = f"{OUTPUT_JSON_FILE}.{datetime.now().strftime('%Y%m%d_%H%M%S')}.bak"
        shutil.copyfile(OUTPUT_JSON_FILE, backup_filename)
        print(f"既存のファイルをバックアップしました: {backup_filename}")

    with open(OUTPUT_JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(all_grades_data, f, ensure_ascii=False, indent=2)

    print("-" * 40)
    print(f"🎉 {OUTPUT_JSON_FILE} の生成が完了しました！ ({len(all_grades_data)}学年分)")
    print("-" * 40)

if __name__ == "__main__":
    main()