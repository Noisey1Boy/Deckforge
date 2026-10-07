#!/usr/bin/env python3
"""
Bundles Shower theme CSS files by inlining all @import statements.
Reads styles/index.css, follows @import links, concatenates everything into
a single self-contained ribbon.css / material.css that can be served from /public/.

This is necessary because Shower's npm package ships CSS as many small files
with @import statements that don't resolve correctly in browser <link> tags
(the paths are relative to the source, not the served location).
"""

import re
from pathlib import Path

SHOWER_BASE = Path("/home/z/my-project/node_modules/@shower")
DEST = Path("/home/z/my-project/public/frameworks/shower/themes")

def inline_imports(css_text: str, base_dir: Path, seen: set) -> str:
    """Recursively inline all @import statements."""
    def replace_import(match):
        import_path = match.group(1).strip().strip('"').strip("'")
        if import_path.startswith('http'):
            return match.group(0)  # Leave external URLs alone
        resolved = (base_dir / import_path).resolve()
        if not resolved.exists() or str(resolved) in seen:
            return f'/* already inlined: {import_path} */'
        seen.add(str(resolved))
        sub_text = resolved.read_text(encoding='utf-8')
        return inline_imports(sub_text, resolved.parent, seen)

    return re.sub(r'@import\s+[\'"]([^\'"]+)[\'"];?', replace_import, css_text)


for theme_name in ['ribbon', 'material']:
    theme_dir = SHOWER_BASE / theme_name / 'styles'
    entry = theme_dir / 'index.css'
    if not entry.exists():
        print(f"SKIP {theme_name}: {entry} not found")
        continue

    seen = {str(entry.resolve())}
    bundled = inline_imports(entry.read_text(encoding='utf-8'), theme_dir, seen)
    out_path = DEST / f'{theme_name}.css'
    out_path.write_text(bundled, encoding='utf-8')
    print(f"OK {theme_name}.css: {len(bundled)} bytes ({len(seen)} files inlined)")

# Also copy the fonts and pictures
import shutil
for theme_name in ['ribbon', 'material']:
    src_fonts = SHOWER_BASE / theme_name / 'fonts'
    if src_fonts.exists():
        dst_fonts = DEST / theme_name / 'fonts'
        if dst_fonts.exists():
            shutil.rmtree(dst_fonts)
        shutil.copytree(src_fonts, dst_fonts)
        print(f"OK copied fonts for {theme_name}: {sum(1 for _ in dst_fonts.iterdir())} files")
    # Pictures directory
    src_pics = SHOWER_BASE / theme_name / 'pictures'
    if src_pics.exists():
        dst_pics = DEST / theme_name / 'pictures'
        if dst_pics.exists():
            shutil.rmtree(dst_pics)
        shutil.copytree(src_pics, dst_pics)
        print(f"OK copied pictures for {theme_name}: {sum(1 for _ in dst_pics.iterglob('**/*') if _.is_file())} files")
