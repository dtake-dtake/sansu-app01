# prune_missing_apps.py
import json, os, shutil
from datetime import datetime

root = os.path.dirname(__file__)
app_json = os.path.join(root, "app_data.json")

with open(app_json, encoding="utf-8") as f:
    data = json.load(f)

def exists_html(path):
    return isinstance(path, str) and path.lower().endswith(".html") \
           and os.path.isfile(os.path.join(root, path.replace("/", os.sep)))

new_data, changed = [], False
for grade in data:
    new_units = []
    for u in grade.get("units", []):
        kept_apps = [a for a in u.get("apps", []) if exists_html(a.get("path"))]
        if kept_apps:
            u["apps"] = kept_apps
            new_units.append(u)
        else:
            changed = True
    if new_units:
        grade["units"] = new_units
        new_data.append(grade)
    else:
        changed = True

if changed:
    backup = app_json + "." + datetime.now().strftime("%Y%m%d_%H%M%S") + ".bak"
    shutil.copyfile(app_json, backup)
    with open(app_json, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)
    print("不要なダミーを削除しました。バックアップ:", backup)
else:
    print("変更なし")
