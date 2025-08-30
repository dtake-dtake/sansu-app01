import os
import re
from bs4 import BeautifulSoup # このライブラリのインストールが必要です (pip install beautifulsoup4)

def find_html_files(root_dir):
    """指定されたディレクトリ以下のHTMLファイルを探す"""
    html_files = []
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith(".html"):
                # パスを正規化
                relative_path = os.path.join(dirpath, filename).replace("\\", "/")
                html_files.append(relative_path)
    return html_files

def extract_app_info(html_path):
    """HTMLファイルからアプリ名とappIdを抽出する"""
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')

            # アプリ名を<title>タグから取得
            app_name = soup.title.string.strip() if soup.title else ""

            # appIdをJavaScriptコード内から正規表現で抽出
            match = re.search(r'appId\s*=\s*["\'](.*?)["\']', content)
            app_id = match.group(1) if match else ""

            return app_name, app_id
    except Exception as e:
        print(f"Error processing {html_path}: {e}")
        return None, None

def get_unit_name_from_path(path):
    """ファイルパスから単元名を取得する"""
    # パスの2番目の要素を単元名とする（例: 1nen/06_tashizan1/... -> 06_tashizan1）
    parts = path.split('/')
    if len(parts) > 2:
        return parts[1]
    return ""


def main():
    target_dirs = ["1nen", "2nen", "3nen"] # 対象の学年フォルダ
    output_file = "updates_list_generated.tsv" # 新しく生成するファイル名

    with open(output_file, "w", encoding="utf-8") as f:
        for grade_dir in target_dirs:
            if not os.path.isdir(grade_dir):
                continue

            html_files = find_html_files(grade_dir)
            for path in html_files:
                app_name, app_id = extract_app_info(path)
                unit_name = get_unit_name_from_path(path)

                if app_name and app_id: # アプリ名とappIdが取得できたものだけを対象とする
                    # TSV形式でファイルに書き出す
                    f.write(f"{path}\t{unit_name}\t{app_name}\n")

    print(f"Generated {output_file} with {len(html_files)} entries.")

if __name__ == "__main__":
    main()