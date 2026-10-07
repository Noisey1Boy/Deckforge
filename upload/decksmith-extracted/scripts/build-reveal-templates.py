#!/usr/bin/env python3
"""
Generate 7 reveal.js-based templates — each uses a different built-in reveal.js theme.
The slide structure is shared; the visual identity (fonts, colors, accents) comes from
the theme CSS file shipped by reveal.js.

Output: /home/z/my-project/public/templates/reveal-<theme>/template.html
"""
import json
from pathlib import Path
from textwrap import dedent

DEST = Path("/home/z/my-project/public/templates")

# Each template: theme file + accent color + brief description
TEMPLATES = [
    {
        "id": "reveal-black",
        "name": "Reveal Black",
        "theme": "black.css",
        "accent": "#42affa",
        "tagline": "Default dark reveal.js theme — white type on black, blue accent.",
        "category": "Tech",
        "style": "Dark",
        "bestFor": ["tech-talk", "keynote", "product-demo"],
    },
    {
        "id": "reveal-white",
        "name": "Reveal White",
        "theme": "white.css",
        "accent": "#3b759e",
        "tagline": "Clean white reveal.js theme — black type on white, muted teal accent.",
        "category": "Business",
        "style": "Minimal",
        "bestFor": ["pitch-deck", "sales", "investor-deck"],
    },
    {
        "id": "reveal-dracula",
        "name": "Reveal Dracula",
        "theme": "dracula.css",
        "accent": "#ff79c6",
        "tagline": "Dracula color scheme — dark purple canvas, pink/green/cyan accents.",
        "category": "Tech",
        "style": "Dark",
        "bestFor": ["dev-tool", "open-source", "indie"],
    },
    {
        "id": "reveal-league",
        "name": "Reveal League",
        "theme": "league.css",
        "accent": "#13daec",
        "tagline": "League Gotham — dark gray with cyan accent, condensed sans type.",
        "category": "Tech",
        "style": "Dark",
        "bestFor": ["meetup", "tech-sharing", "indie-dev"],
    },
    {
        "id": "reveal-solarized",
        "name": "Reveal Solarized",
        "theme": "solarized.css",
        "accent": "#b58900",
        "tagline": "Solarized light — warm cream canvas with Ethan Schoonover's palette.",
        "category": "Education",
        "style": "Warm",
        "bestFor": ["educational", "tutorial", "course"],
    },
    {
        "id": "reveal-night",
        "name": "Reveal Night",
        "theme": "night.css",
        "accent": "#e7ad52",
        "tagline": "Night theme — black canvas, gold accent, serif headings.",
        "category": "Editorial",
        "style": "Dark",
        "bestFor": ["literary", "essay", "manifesto"],
    },
    {
        "id": "reveal-moon",
        "name": "Reveal Moon",
        "theme": "moon.css",
        "accent": "#51498d",
        "tagline": "Moon — deep blue-gray with muted purple accent, open sans type.",
        "category": "Business",
        "style": "Dark",
        "bestFor": ["report", "review", "internal-update"],
    },
]

# The shared slide HTML body. Uses reveal.js markup:
#   <div class="reveal"><div class="slides"><section>...</section>...</div></div>
# Plus a small <style> block that defines .kicker / .lede / .grid / .card / .big-number
# primitives, all themed via the --accent CSS variable (overridden per template).
SLIDES_HTML = dedent("""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>{title}</title>
<link rel="stylesheet" href="/revealjs/dist/reset.css">
<link rel="stylesheet" href="/revealjs/dist/reveal.css">
<link rel="stylesheet" href="/revealjs/dist/theme/{theme_file}" id="theme">
<style>
  :root {{ --accent: {accent}; }}
  .reveal .slide-number {{ font-size: 0.4em; }}
  .reveal section {{ text-align: left; }}
  .reveal h1, .reveal h2, .reveal h3, .reveal h4 {{ text-transform: none; letter-spacing: -0.01em; }}
  .reveal h1 {{ font-size: 2.2em; line-height: 1.15; }}
  .reveal h2 {{ font-size: 1.5em; line-height: 1.2; margin-bottom: 0.6em; }}
  .reveal h3 {{ font-size: 1.05em; }}
  .reveal p, .reveal li {{ line-height: 1.55; }}
  .reveal .kicker {{
    display: inline-block; font-size: 0.4em; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--accent);
    margin-bottom: 0.5em; opacity: 0.95; font-weight: 600;
  }}
  .reveal .lede {{ font-size: 0.55em; opacity: 0.7; line-height: 1.5; margin-top: 0.6em; }}
  .reveal .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1em; margin-top: 0.6em; }}
  .reveal .grid-3 {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.9em; margin-top: 0.6em; }}
  .reveal .grid-4 {{ display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.8em; margin-top: 0.6em; }}
  .reveal .card {{
    background: rgba(127,127,127,0.08);
    border: 1px solid rgba(127,127,127,0.15);
    border-radius: 10px; padding: 1.1em;
  }}
  .reveal .card h4 {{ color: var(--accent); font-size: 0.55em; margin-bottom: 0.4em; font-weight: 600; }}
  .reveal .card p {{ font-size: 0.42em; opacity: 0.75; line-height: 1.45; }}
  .reveal .big-number {{ font-size: 2.8em; font-weight: 700; color: var(--accent); line-height: 1; letter-spacing: -0.02em; }}
  .reveal .big-label {{ font-size: 0.42em; opacity: 0.65; margin-top: 0.3em; text-transform: uppercase; letter-spacing: 0.1em; }}
  .reveal .delta-up {{ color: #4ade80; font-size: 0.45em; }}
  .reveal .delta-down {{ color: #f87171; font-size: 0.45em; }}
  .reveal .pill {{
    display: inline-block; font-size: 0.35em;
    padding: 0.25em 0.7em; border: 1px solid currentColor;
    border-radius: 999px; margin-right: 0.3em; opacity: 0.8;
  }}
  .reveal .quote {{ font-size: 0.7em; line-height: 1.5; font-style: italic; opacity: 0.9; max-width: 32em; }}
  .reveal .quote-attr {{ font-size: 0.42em; opacity: 0.55; margin-top: 0.6em; }}
  .reveal .timeline {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8em; margin-top: 0.8em; }}
  .reveal .timeline-item {{ border-left: 2px solid var(--accent); padding-left: 0.8em; }}
  .reveal .timeline-item h4 {{ font-size: 0.5em; color: var(--accent); margin-bottom: 0.2em; }}
  .reveal .timeline-item p {{ font-size: 0.4em; opacity: 0.7; }}
  .reveal ul.bullets {{ font-size: 0.5em; line-height: 1.7; padding-left: 1.2em; }}
  .reveal ul.bullets li {{ margin-bottom: 0.25em; }}
  .reveal .footer {{ position: absolute; bottom: 0.5em; right: 1em; font-size: 0.3em; opacity: 0.4; }}
</style>
</head>
<body>
<div class="reveal">
  <div class="slides">

    <section>
      <span class="kicker">Cover</span>
      <h1>Presentation Title</h1>
      <p class="lede">A concise subtitle that frames the talk.</p>
      <p class="lede">Author Name · Date</p>
    </section>

    <section>
      <span class="kicker">Problem</span>
      <h2>The problem we're solving</h2>
      <div class="grid-2">
        <div class="card"><h4>Pain point 1</h4><p>Describe the issue and why it matters.</p></div>
        <div class="card"><h4>Pain point 2</h4><p>Describe the issue and why it matters.</p></div>
      </div>
    </section>

    <section>
      <span class="kicker">Solution</span>
      <h2>How it works</h2>
      <div class="grid-3">
        <div class="card"><h4>Feature 1</h4><p>One-line description.</p></div>
        <div class="card"><h4>Feature 2</h4><p>One-line description.</p></div>
        <div class="card"><h4>Feature 3</h4><p>One-line description.</p></div>
      </div>
    </section>

    <section>
      <span class="kicker">Traction</span>
      <h2>The numbers</h2>
      <div class="grid-3">
        <div><div class="big-number">10k</div><div class="big-label">Weekly actives</div><div class="delta-up">+8%</div></div>
        <div><div class="big-number">32%</div><div class="big-label">MoM growth</div><div class="delta-up">+5pt</div></div>
        <div><div class="big-number">$14k</div><div class="big-label">MRR</div><div class="delta-up">+12%</div></div>
      </div>
    </section>

    <section>
      <span class="kicker">Roadmap</span>
      <h2>Where we're going</h2>
      <div class="timeline">
        <div class="timeline-item"><h4>Q1</h4><p>Launch v1</p></div>
        <div class="timeline-item"><h4>Q2</h4><p>Expand to EU</p></div>
        <div class="timeline-item"><h4>Q3</h4><p>Mobile app</p></div>
        <div class="timeline-item"><h4>Q4</h4><p>Series A</p></div>
      </div>
    </section>

    <section>
      <span class="kicker">Quote</span>
      <h2>What people say</h2>
      <p class="quote">"This product changed how our team works. We've cut meeting time by 40%."</p>
      <p class="quote-attr">— Customer Name, CEO at Company</p>
    </section>

    <section>
      <span class="kicker">Thanks</span>
      <h2>Thank you</h2>
      <p class="lede">Questions? hello@example.com</p>
      <p class="lede">
        <span class="pill">github.com/example</span>
        <span class="pill">example.com</span>
      </p>
    </section>

  </div>
</div>

<script src="/revealjs/dist/reveal.js"></script>
<script src="/revealjs/dist/plugin/notes.js"></script>
<script src="/revealjs/dist/plugin/markdown.js"></script>
<script src="/revealjs/dist/plugin/highlight.js"></script>
<script>
  Reveal.initialize({{
    controls: true,
    progress: true,
    center: true,
    hash: true,
    transition: 'slide',
    plugins: [RevealNotes, RevealMarkdown, RevealHighlight]
  }});
</script>
</body>
</html>
""")

# Fonts/palettes per theme (extracted by inspecting reveal.js theme CSS files)
THEME_FONTS = {
    "black.css": ["Inter", "Opal Sans"],
    "white.css": ["Source Sans Pro", "Inter"],
    "dracula.css": ["Fira Sans", "Source Code Pro"],
    "league.css": ["Lato", "League Gothic"],
    "solarized.css": ["Helvetica Neue", "Lato"],
    "night.css": ["Open Sans", "Quattrocento"],
    "moon.css": ["Open Sans", "Montserrat"],
}
THEME_PALETTE = {
    "black.css": ["#222222", "#42affa", "#ffffff", "#a2a9b4"],
    "white.css": ["#ffffff", "#3b759e", "#222222", "#7a7a7a"],
    "dracula.css": ["#282a36", "#ff79c6", "#f8f8f2", "#bd93f9"],
    "league.css": ["#2b2722", "#13daec", "#eee", "#777"],
    "solarized.css": ["#fdf6e3", "#b58900", "#586e75", "#268bd2"],
    "night.css": ["#111111", "#e7ad52", "#eee", "#888"],
    "moon.css": ["#002b36", "#51498d", "#93a1a1", "#eee"],
}

manifest_entries = []

for tpl in TEMPLATES:
    tpl_id = tpl["id"]
    theme_file = tpl["theme"]
    accent = tpl["accent"]

    dest_dir = DEST / tpl_id
    dest_dir.mkdir(parents=True, exist_ok=True)

    html = SLIDES_HTML.format(
        title=tpl["name"],
        theme_file=theme_file,
        accent=accent,
    )
    (dest_dir / "template.html").write_text(html, encoding="utf-8")
    print(f"  OK {tpl_id} -> {dest_dir / 'template.html'}")

    manifest_entries.append({
        "id": tpl_id,
        "name": tpl["name"],
        "tagline": tpl["tagline"],
        "category": tpl["category"],
        "style": tpl["style"],
        "palette": THEME_PALETTE[theme_file],
        "fonts": THEME_FONTS[theme_file],
        "bestFor": tpl["bestFor"],
        "slidesCount": 7,
        "tags": ["revealjs"] + tpl["bestFor"],
        "previewSlide": 0,
        "sourceFolder": f"reveal.js theme: {theme_file}",
        "framework": "reveal.js",
    })

# Update manifest — append reveal templates to existing 45
manifest_path = DEST / "templates.json"
existing = json.loads(manifest_path.read_text(encoding="utf-8"))
# Remove any old reveal-* entries first (idempotent)
existing["templates"] = [t for t in existing["templates"] if not t.get("id", "").startswith("reveal-")]
# Add new reveal templates
existing["templates"].extend(manifest_entries)

manifest_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"\nManifest updated: {len(existing['templates'])} total templates ({len(manifest_entries)} reveal.js templates added)")
