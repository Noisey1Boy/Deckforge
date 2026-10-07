#!/usr/bin/env python3
"""
Copy all html-ppt* template folders from open-design into public/templates/
and generate a fresh templates.json manifest by parsing each folder's SKILL.md.

Each folder has:
  - SKILL.md       (YAML frontmatter with name, description, triggers, scenario)
  - example.html   (the standalone HTML deck — renamed to template.html)
  - optional assets/ subfolder (copied along if present)

Output:
  /home/z/my-project/public/templates/<slug>/template.html (+ assets/)
  /home/z/my-project/public/templates/templates.json
"""

import json
import os
import re
import shutil
import sys
from pathlib import Path

SRC = Path("/home/z/my-project/research/open-design/design-templates")
DEST = Path("/home/z/my-project/public/templates")
MANIFEST_PATH = DEST / "templates.json"

# Folders to skip — they're the master skill / shared assets, not standalone decks
SKIP_FOLDERS = {"html-ppt"}  # plain html-ppt is the master skill, not a deck


def infer_category(folder_name: str, scenario: str) -> str:
    fn = folder_name.lower()
    if "zhangzara" in fn:
        return "Editorial"
    if "xhs" in fn or "pastel" in fn:
        return "Social"
    if any(k in fn for k in ["pitch", "product-launch", "weekly-report"]):
        return "Business"
    if any(k in fn for k in ["course", "tech-sharing", "knowledge", "module"]):
        return "Education"
    if any(k in fn for k in ["cyber", "terminal", "graph", "blueprint", "obsidian", "hermes"]):
        return "Tech"
    if any(k in fn for k in ["brutalist", "taste", "playful", "creative", "scatterbrain"]):
        return "Creative"
    if scenario:
        return scenario.capitalize()
    return "General"


def infer_style(description: str) -> str:
    if not description:
        return "Custom"
    first_sentence = description.split("。")[0].split(". ")[0].lower()
    style_keywords = [
        ("minimal", "Minimal"),
        ("brutalist", "Brutalist"),
        ("editorial", "Editorial"),
        ("dark", "Dark"),
        ("warm", "Warm"),
        ("pastel", "Pastel"),
        ("retro", "Retro"),
        ("vintage", "Retro"),
        ("gradient", "Gradient"),
        ("monochrome", "Monochrome"),
        ("corporate", "Corporate"),
        ("magazine", "Magazine"),
        ("poster", "Poster"),
        ("grid", "Grid"),
        ("professional", "Professional"),
        ("playful", "Playful"),
        ("atmospheric", "Atmospheric"),
        ("literary", "Literary"),
    ]
    for kw, label in style_keywords:
        if kw in first_sentence:
            return label
    return "Custom"


def parse_frontmatter(skill_md_path: Path) -> dict:
    """Parse the YAML frontmatter from SKILL.md (very minimal parser)."""
    text = skill_md_path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not m:
        return {}
    fm = m.group(1)
    result: dict = {}
    current_key = None
    current_block = []
    in_triggers = False
    triggers_list = []
    for line in fm.splitlines():
        # Triggers list (lines starting with "  - ")
        if in_triggers and re.match(r"^\s+-\s+", line):
            item = re.sub(r"^\s+-\s+", "", line).strip().strip('"').strip("'")
            triggers_list.append(item)
            continue
        if in_triggers and not line.startswith(" "):
            in_triggers = False
        # Block scalar (|) continuation
        if current_key and line.startswith("  ") and not in_triggers:
            current_block.append(line.strip())
            continue
        if current_key and current_block:
            result[current_key] = " ".join(current_block).strip()
            current_key = None
            current_block = []
        # key: value
        m2 = re.match(r"^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$", line)
        if m2:
            key, value = m2.group(1), m2.group(2)
            if key == "triggers":
                in_triggers = True
                if value.strip():
                    triggers_list.append(value.strip().strip('"').strip("'"))
                continue
            if value == "|" or value == "":
                current_key = key
                current_block = []
            else:
                result[key] = value.strip()
                current_key = None
    if current_key and current_block:
        result[current_key] = " ".join(current_block).strip()
    if triggers_list:
        result["triggers"] = triggers_list
    return result


def count_slides(html_path: Path) -> int:
    text = html_path.read_text(encoding="utf-8", errors="ignore")
    matches = re.findall(r'<section[^>]*class="[^"]*slide[^"]*"', text, re.IGNORECASE)
    if matches:
        return len(matches)
    matches = re.findall(r'class="[^"]*\bslide\b[^"]*"', text, re.IGNORECASE)
    return len(matches)


def extract_palette(html_path: Path) -> list:
    text = html_path.read_text(encoding="utf-8", errors="ignore")
    colors = []
    root_match = re.search(r":root\s*\{([^}]*)\}", text)
    if root_match:
        root_block = root_match.group(1)
        hex_colors = re.findall(r"#([0-9a-fA-F]{3,8})\b", root_block)
        for token_name in ["--bg", "--accent", "--text-1", "--accent-2", "--bg-soft", "--bg-canvas"]:
            token_match = re.search(rf"{re.escape(token_name)}\s*:\s*(#[0-9a-fA-F]{{3,8}})", root_block)
            if token_match:
                colors.append(token_match.group(1))
                if len(colors) >= 4:
                    break
        while len(colors) < 4 and hex_colors:
            c = "#" + hex_colors.pop(0)
            if c not in colors:
                colors.append(c)
    return colors[:4] if colors else ["#FFFFFF", "#111216", "#3B6CFF", "#7A5CFF"]


def extract_fonts(html_path: Path) -> list:
    text = html_path.read_text(encoding="utf-8", errors="ignore")
    imports = re.findall(r"@import\s+url\(['\"]?https://fonts\.googleapis\.com/[^)]*family=([^)&]+)", text)
    fonts = []
    for imp in imports:
        name = imp.split(":")[0].replace("+", " ")
        if name and name not in fonts:
            fonts.append(name)
    return fonts[:3] if fonts else ["Inter"]


def short_id(folder_name: str) -> str:
    s = folder_name
    if s.startswith("html-ppt-zhangzara-"):
        return s[len("html-ppt-zhangzara-"):]
    if s.startswith("html-ppt-"):
        return s[len("html-ppt-"):]
    return s


def main():
    if not SRC.exists():
        print(f"ERROR: Source not found: {SRC}", file=sys.stderr)
        sys.exit(1)

    # Clean existing template folders (preserve _shared)
    if DEST.exists():
        for item in DEST.iterdir():
            if item.is_dir() and item.name != "_shared":
                shutil.rmtree(item)
            elif item.name == "templates.json":
                item.unlink()
    else:
        DEST.mkdir(parents=True, exist_ok=True)

    folders = sorted([d for d in SRC.iterdir()
                      if d.is_dir() and d.name.startswith("html-ppt")
                      and d.name not in SKIP_FOLDERS])
    print(f"Found {len(folders)} template folders")

    templates = []
    copied = 0
    skipped = 0

    for folder in folders:
        folder_name = folder.name
        skill_md = folder / "SKILL.md"
        example_html = folder / "example.html"

        if not example_html.exists():
            print(f"  SKIP {folder_name}: no example.html")
            skipped += 1
            continue

        display_id = short_id(folder_name)
        dest_dir = DEST / display_id
        dest_dir.mkdir(parents=True, exist_ok=True)

        shutil.copy2(example_html, dest_dir / "template.html")

        assets_src = folder / "assets"
        if assets_src.exists() and assets_src.is_dir():
            assets_dest = dest_dir / "assets"
            if assets_dest.exists():
                shutil.rmtree(assets_dest)
            shutil.copytree(assets_src, assets_dest)

        fm = parse_frontmatter(skill_md) if skill_md.exists() else {}
        name = fm.get("name", folder_name).replace("html-ppt-", "").replace("html-ppt-zhangzara-", "")
        display_name = " ".join(word.capitalize() for word in name.replace("-", " ").split())
        description = fm.get("description", "").strip()
        scenario = ""
        # scenario is nested under od: — try to extract from raw text
        if "scenario:" in skill_md.read_text(encoding="utf-8") if skill_md.exists() else "":
            sm = re.search(r"scenario:\s*([a-zA-Z]+)", skill_md.read_text(encoding="utf-8"))
            if sm:
                scenario = sm.group(1)

        tpl_html = dest_dir / "template.html"
        slides_count = count_slides(tpl_html)
        palette = extract_palette(tpl_html)
        fonts = extract_fonts(tpl_html)

        if slides_count == 0:
            print(f"  SKIP {folder_name}: 0 slides detected")
            shutil.rmtree(dest_dir)
            skipped += 1
            continue

        tagline = description
        if "." in description:
            tagline = description.split(".")[0].strip() + "."
        if len(tagline) > 130:
            tagline = tagline[:127] + "..."

        triggers = fm.get("triggers", []) if isinstance(fm.get("triggers", []), list) else []
        triggers_en = [t for t in triggers if t and not re.search(r"[\u4e00-\u9fff]", t)][:3]
        if not triggers_en:
            triggers_en = [display_name, "presentation", "slides"][:3]

        templates.append({
            "id": display_id,
            "name": display_name,
            "tagline": tagline or f"{display_name} deck template",
            "category": infer_category(folder_name, scenario),
            "style": infer_style(description),
            "palette": palette,
            "fonts": fonts,
            "bestFor": triggers_en,
            "slidesCount": slides_count,
            "tags": [t.lower().replace(" ", "-") for t in triggers_en],
            "previewSlide": 0,
            "sourceFolder": folder_name,
        })
        copied += 1
        print(f"  OK   {folder_name} -> {display_id} ({slides_count} slides)")

    manifest = {
        "templates": templates,
        "themes": [
            {"id": "minimal-white", "name": "Minimal White"},
            {"id": "aurora", "name": "Aurora"},
            {"id": "tokyo-night", "name": "Tokyo Night"},
            {"id": "corporate-clean", "name": "Corporate Clean"},
            {"id": "pitch-deck-vc", "name": "Pitch Deck VC"},
            {"id": "neo-brutalism", "name": "Neo Brutalism"},
            {"id": "xiaohongshu-white", "name": "Xiaohongshu White"},
        ],
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nManifest written: {MANIFEST_PATH}")
    print(f"Templates: {len(templates)} copied, {skipped} skipped")


if __name__ == "__main__":
    main()
