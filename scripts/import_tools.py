"""Export the supplied Compassly workbook to the runtime catalog."""
from json import dump
from pathlib import Path
from re import sub
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "Book1.xlsx"
target = ROOT / "public" / "tools.json"
target.parent.mkdir(exist_ok=True)

book = load_workbook(source, read_only=True, data_only=True)
rows = list(book.active.values)
# The supplied workbook has no header row; its fixed eight-column layout is
# documented by the project brief and is normalized here at import time.
headers = ["id", "tool_name", "keywords", "icon", "category", "purpose", "meta_title", "meta_description"]

def slugify(value):
    return sub(r"(^-|-$)", "", sub(r"[^a-z0-9]+", "-", value.lower()))

tools = []
for row in rows:
    record = dict(zip(headers, row))
    name = str(record.get("tool_name", "")).strip()
    if not name:
        continue
    category = str(record.get("category", "General Utilities")).strip()
    tools.append({
        "id": int(record.get("id") or len(tools) + 1), "name": name,
        "slug": slugify(name), "keywords": str(record.get("keywords", "")),
        "icon": str(record.get("icon", "fa-solid fa-wand-magic-sparkles")),
        "category": category, "categorySlug": slugify(category),
        "purpose": str(record.get("purpose", "")),
        "metaTitle": str(record.get("meta_title", f"{name} – Free Online Tool")),
        "metaDescription": str(record.get("meta_description", "")),
    })

with target.open("w", encoding="utf-8") as output:
    dump(tools, output, ensure_ascii=False, indent=2)
print(f"Exported {len(tools)} tools to {target}")
