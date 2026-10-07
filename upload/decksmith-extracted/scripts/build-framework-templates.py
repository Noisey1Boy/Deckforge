#!/usr/bin/env python3
"""
Generate framework-based templates for impress.js, Shower, and DZSlides.
Each template is a complete demo deck with proper slide structure for its framework.

Output: /home/z/my-project/public/templates/<framework>-<variant>/template.html
"""
import json
from pathlib import Path
from textwrap import dedent

DEST = Path("/home/z/my-project/public/templates")
MANIFEST_PATH = DEST / "templates.json"

# ===========================================================================
# IMPRESS.JS TEMPLATES
# ===========================================================================
# impress.js structure:
#   <div id="impress">
#     <div class="step slide" data-x="0" data-y="0">...slide 1...</div>
#     <div class="step" data-x="1200" data-y="0">...slide 2...</div>
#     <div class="step" data-x="2400" data-y="0" data-rotate="90">...</div>
#     <div class="step" data-x="3000" data-y="1000" data-scale="2">...</div>
#   </div>
#   <script src="/frameworks/impressjs/impress.js"></script>
#   <script>impress().init();</script>

IMPRESS_TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>{title}</title>
<link rel="stylesheet" href="/frameworks/impressjs/impress-demo.css">
<style>
  :root {{
    --accent: {accent};
    --bg: {bg};
    --text: {text};
  }}
  body {{ background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, sans-serif; }}
  .step {{ width: 1100px; padding: 60px 80px; box-sizing: border-box; }}
  .step.slide {{
    background: var(--bg);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.08);
    border: 1px solid rgba(0,0,0,0.06);
  }}
  .step h1 {{ font-size: 4em; line-height: 1.1; margin-bottom: 0.3em; letter-spacing: -0.03em; font-weight: 800; }}
  .step h2 {{ font-size: 2.5em; line-height: 1.15; margin-bottom: 0.5em; letter-spacing: -0.02em; font-weight: 700; color: var(--accent); }}
  .step h3 {{ font-size: 1.6em; margin-bottom: 0.4em; font-weight: 600; }}
  .step p {{ font-size: 1.2em; line-height: 1.55; opacity: 0.85; margin-bottom: 0.5em; }}
  .step .kicker {{ display: inline-block; font-size: 0.65em; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); margin-bottom: 0.5em; font-weight: 600; }}
  .step .lede {{ font-size: 1.4em; line-height: 1.5; opacity: 0.7; max-width: 32em; }}
  .step ul {{ font-size: 1.15em; line-height: 1.7; padding-left: 1.2em; }}
  .step .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1.2em; margin-top: 1em; }}
  .step .card {{ background: rgba(127,127,127,0.06); border: 1px solid rgba(127,127,127,0.15); border-radius: 10px; padding: 1.2em; }}
  .step .card h4 {{ color: var(--accent); font-size: 1.1em; margin-bottom: 0.3em; font-weight: 600; }}
  .step .card p {{ font-size: 0.95em; opacity: 0.7; }}
  .step .big {{ font-size: 3.5em; font-weight: 800; color: var(--accent); line-height: 1; }}
  .step .big-label {{ font-size: 0.8em; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em; }}
  .step .quote {{ font-size: 1.8em; line-height: 1.4; font-style: italic; opacity: 0.9; max-width: 28em; }}
  .step .pill {{ display: inline-block; font-size: 0.7em; padding: 0.3em 0.8em; border: 1px solid currentColor; border-radius: 999px; margin-right: 0.3em; opacity: 0.7; }}
  /* Subtle hint */
  .hint {{ position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); font-size: 0.8em; opacity: 0.5; pointer-events: none; }}
  /* Speaker notes — hidden by default */
  .notes {{ display: none; }}
</style>
</head>
<body class="impress-not-supported">
<div class="fallback-message">
  <p>Your browser <b>doesn't support the features required</b> by impress.js.</p>
</div>

<div id="impress" data-transition-duration="800" data-width="1920" data-height="1080" data-perspective="1500">

  <div class="step slide" data-x="0" data-y="0">
    <span class="kicker">Cover</span>
    <h1>Presentation Title</h1>
    <p class="lede">A concise subtitle that frames the talk.</p>
    <p class="lede">Author Name · Date</p>
    <div class="notes">Welcome the audience and set the stage for the talk.</div>
  </div>

  <div class="step slide" data-x="1400" data-y="0">
    <span class="kicker">Problem</span>
    <h2>The problem we're solving</h2>
    <div class="grid">
      <div class="card"><h4>Pain point 1</h4><p>Describe the issue and why it matters to your audience.</p></div>
      <div class="card"><h4>Pain point 2</h4><p>Quantify the impact: time lost, money wasted, opportunities missed.</p></div>
    </div>
    <div class="notes">Anchor the problem in real numbers and stories.</div>
  </div>

  <div class="step slide" data-x="2800" data-y="0">
    <span class="kicker">Solution</span>
    <h2>How it works</h2>
    <div class="grid">
      <div class="card"><h4>Feature 1</h4><p>One-line description of the first key capability.</p></div>
      <div class="card"><h4>Feature 2</h4><p>One-line description of the second key capability.</p></div>
      <div class="card"><h4>Feature 3</h4><p>One-line description of the third key capability.</p></div>
      <div class="card"><h4>Feature 4</h4><p>One-line description of the fourth key capability.</p></div>
    </div>
    <div class="notes">Walk through each feature with a concrete example.</div>
  </div>

  <div class="step" data-x="4200" data-y="0" data-scale="2">
    <span class="kicker">Traction</span>
    <h2>The numbers</h2>
    <div class="grid">
      <div><div class="big">10k</div><div class="big-label">Weekly actives</div></div>
      <div><div class="big">32%</div><div class="big-label">MoM growth</div></div>
    </div>
    <div class="notes">Zoom out to emphasize the scale of traction.</div>
  </div>

  <div class="step slide" data-x="5600" data-y="0" data-rotate="90">
    <span class="kicker">Roadmap</span>
    <h2>Where we're going</h2>
    <ul>
      <li><strong>Q1:</strong> Launch v1 to general availability</li>
      <li><strong>Q2:</strong> Expand to European markets</li>
      <li><strong>Q3:</strong> Ship mobile app for iOS and Android</li>
      <li><strong>Q4:</strong> Close Series A funding round</li>
    </ul>
    <div class="notes">Rotate perspective to signal a forward-looking section.</div>
  </div>

  <div class="step slide" data-x="5600" data-y="1000" data-rotate="180">
    <span class="kicker">Quote</span>
    <p class="quote">&ldquo;This product changed how our team works. We've cut meeting time by 40%.&rdquo;</p>
    <p class="lede" style="margin-top: 1.5em;">— Customer Name, CEO at Company</p>
    <div class="notes">Use a customer quote to build social proof.</div>
  </div>

  <div class="step slide" data-x="4200" data-y="1000" data-rotate="270">
    <span class="kicker">Thanks</span>
    <h2>Thank you</h2>
    <p class="lede">Questions? hello@example.com</p>
    <p class="lede">
      <span class="pill">github.com/example</span>
      <span class="pill">example.com</span>
    </p>
    <div class="notes">Close with a clear call-to-action and contact info.</div>
  </div>

</div>

<div class="hint">Use arrow keys or space to navigate · ESC for overview</div>

<script src="/frameworks/impressjs/impress.js"></script>
<script>impress().init();</script>
</body>
</html>
"""

# ===========================================================================
# SHOWER TEMPLATES
# ===========================================================================
# Shower structure:
#   <body class="shower list">
#     <header class="caption">...</header>
#     <section class="slide" id="cover">...</section>
#     <section class="slide">...</section>
#     ...
#   </body>
#   <link rel="stylesheet" href="/frameworks/shower/themes/ribbon.css">
#   <script src="/frameworks/shower/core/index.js" defer></script>

SHOWER_TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>{title}</title>
<link rel="stylesheet" href="/frameworks/shower/themes/{theme_file}">
<style>
  :root {{ --accent: {accent}; }}
  .slide {{ padding: 60px 80px; }}
  .slide h2 {{ color: var(--accent); }}
  .slide .kicker {{ display: inline-block; font-size: 0.5em; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); margin-bottom: 0.6em; font-weight: 600; }}
  .slide .lede {{ font-size: 1.1em; opacity: 0.7; line-height: 1.5; margin-top: 0.4em; }}
  .slide .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1em; margin-top: 0.6em; }}
  .slide .grid-3 {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.9em; margin-top: 0.6em; }}
  .slide .card {{ background: rgba(127,127,127,0.06); border: 1px solid rgba(127,127,127,0.15); border-radius: 8px; padding: 1em; }}
  .slide .card h3 {{ color: var(--accent); font-size: 1.1em; margin-bottom: 0.3em; }}
  .slide .card p {{ font-size: 0.9em; opacity: 0.75; }}
  .slide .big {{ font-size: 3em; font-weight: 800; color: var(--accent); line-height: 1; }}
  .slide .big-label {{ font-size: 0.6em; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em; }}
  .slide .quote {{ font-size: 1.4em; line-height: 1.5; font-style: italic; opacity: 0.9; max-width: 30em; }}
  .slide .pill {{ display: inline-block; font-size: 0.6em; padding: 0.3em 0.7em; border: 1px solid currentColor; border-radius: 999px; margin-right: 0.3em; opacity: 0.7; }}
  .slide ul {{ font-size: 1em; line-height: 1.7; padding-left: 1.2em; }}
  .slide .timeline {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8em; margin-top: 0.8em; }}
  .slide .timeline-item {{ border-left: 3px solid var(--accent); padding-left: 0.8em; }}
  .slide .timeline-item h3 {{ font-size: 1em; color: var(--accent); margin-bottom: 0.2em; }}
  .slide .timeline-item p {{ font-size: 0.85em; opacity: 0.7; }}
</style>
</head>
<body class="shower list">
<header class="caption">
  <h1>Presentation Title</h1>
  <p>Author Name</p>
</header>

<section class="slide" id="cover">
  <span class="kicker">Cover</span>
  <h2>Presentation Title</h2>
  <p class="lede">A concise subtitle that frames the talk.</p>
  <p class="lede">Author Name · Date</p>
</section>

<section class="slide">
  <span class="kicker">Problem</span>
  <h2>The problem we're solving</h2>
  <div class="grid">
    <div class="card"><h3>Pain point 1</h3><p>Describe the issue and why it matters to your audience.</p></div>
    <div class="card"><h3>Pain point 2</h3><p>Quantify the impact: time lost, money wasted, opportunities missed.</p></div>
  </div>
</section>

<section class="slide">
  <span class="kicker">Solution</span>
  <h2>How it works</h2>
  <div class="grid-3">
    <div class="card"><h3>Feature 1</h3><p>One-line description.</p></div>
    <div class="card"><h3>Feature 2</h3><p>One-line description.</p></div>
    <div class="card"><h3>Feature 3</h3><p>One-line description.</p></div>
  </div>
</section>

<section class="slide">
  <span class="kicker">Traction</span>
  <h2>The numbers</h2>
  <div class="grid-3">
    <div><div class="big">10k</div><div class="big-label">Weekly actives</div></div>
    <div><div class="big">32%</div><div class="big-label">MoM growth</div></div>
    <div><div class="big">$14k</div><div class="big-label">MRR</div></div>
  </div>
</section>

<section class="slide">
  <span class="kicker">Roadmap</span>
  <h2>Where we're going</h2>
  <div class="timeline">
    <div class="timeline-item"><h3>Q1</h3><p>Launch v1</p></div>
    <div class="timeline-item"><h3>Q2</h3><p>Expand to EU</p></div>
    <div class="timeline-item"><h3>Q3</h3><p>Mobile app</p></div>
    <div class="timeline-item"><h3>Q4</h3><p>Series A</p></div>
  </div>
</section>

<section class="slide">
  <span class="kicker">Quote</span>
  <h2>What people say</h2>
  <p class="quote">&ldquo;This product changed how our team works. We've cut meeting time by 40%.&rdquo;</p>
  <p class="lede" style="margin-top: 1.5em;">— Customer Name, CEO at Company</p>
</section>

<section class="slide" id="thanks">
  <span class="kicker">Thanks</span>
  <h2>Thank you</h2>
  <p class="lede">Questions? hello@example.com</p>
  <p class="lede">
    <span class="pill">github.com/example</span>
    <span class="pill">example.com</span>
  </p>
</section>

<div class="progress"></div>

<script src="/frameworks/shower/core/index.js" defer></script>
</body>
</html>
"""

# ===========================================================================
# DZSLIDES TEMPLATE
# ===========================================================================
# DZSlides structure: plain <section> elements, CSS+JS inlined in template
# We'll use the official DZSlides template.html as the base, but rewrite the
# slide content with our standard demo structure.

DZSLIDES_TPL = """<!DOCTYPE html>
<meta charset="utf-8">
<title>{title}</title>

<style>
  /* DZSlides base styles (inlined from template) */
  html {{ font-size: 32px; }}
  body {{ font-family: 'Inter', -apple-system, sans-serif; background: {bg}; color: {text}; margin: 0; padding: 0; }}
  header, footer {{ position: fixed; left: 0; right: 0; padding: 0.5em 1em; font-size: 0.6em; opacity: 0.5; }}
  header {{ top: 0; }}
  footer {{ bottom: 0; }}
  section {{
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    padding: 3em 4em; box-sizing: border-box;
    display: flex; flex-direction: column; justify-content: center;
    opacity: 0; transition: opacity 0.3s ease;
  }}
  section[aria-selected="true"] {{ opacity: 1; }}
  h1 {{ font-size: 2.4em; line-height: 1.1; margin-bottom: 0.3em; letter-spacing: -0.03em; font-weight: 800; }}
  h2 {{ font-size: 1.8em; line-height: 1.15; margin-bottom: 0.5em; letter-spacing: -0.02em; font-weight: 700; color: {accent}; }}
  h3 {{ font-size: 1.3em; margin-bottom: 0.4em; font-weight: 600; }}
  p {{ font-size: 1em; line-height: 1.55; opacity: 0.85; margin-bottom: 0.5em; }}
  ul {{ font-size: 1em; line-height: 1.7; padding-left: 1.2em; }}
  .kicker {{ display: inline-block; font-size: 0.55em; letter-spacing: 0.22em; text-transform: uppercase; color: {accent}; margin-bottom: 0.6em; font-weight: 600; }}
  .lede {{ font-size: 1.15em; opacity: 0.7; line-height: 1.5; max-width: 32em; }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1em; margin-top: 0.6em; }}
  .grid-3 {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.9em; margin-top: 0.6em; }}
  .card {{ background: rgba(127,127,127,0.06); border: 1px solid rgba(127,127,127,0.15); border-radius: 8px; padding: 1em; }}
  .card h3 {{ color: {accent}; font-size: 1em; margin-bottom: 0.3em; }}
  .card p {{ font-size: 0.85em; opacity: 0.75; }}
  .big {{ font-size: 2.6em; font-weight: 800; color: {accent}; line-height: 1; }}
  .big-label {{ font-size: 0.55em; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em; }}
  .quote {{ font-size: 1.3em; line-height: 1.5; font-style: italic; opacity: 0.9; max-width: 30em; }}
  .pill {{ display: inline-block; font-size: 0.55em; padding: 0.3em 0.7em; border: 1px solid currentColor; border-radius: 999px; margin-right: 0.3em; opacity: 0.7; }}
  [role="note"] {{ display: none; }}
  .next {{ opacity: 0.3; transition: opacity 0.3s; }}
  [aria-selected="true"] .next {{ opacity: 1; }}
</style>

<header>DZSlides · Presentation Title</header>
<footer>by Author Name</footer>

<section aria-selected="true">
  <span class="kicker">Cover</span>
  <h1>Presentation Title</h1>
  <p class="lede">A concise subtitle that frames the talk.</p>
  <p class="lede">Author Name · Date</p>
  <div role="note">Welcome the audience and set the stage.</div>
</section>

<section>
  <span class="kicker">Problem</span>
  <h2>The problem we're solving</h2>
  <div class="grid">
    <div class="card"><h3>Pain point 1</h3><p>Describe the issue and why it matters.</p></div>
    <div class="card"><h3>Pain point 2</h3><p>Quantify the impact on users.</p></div>
  </div>
  <div role="note">Anchor the problem in real numbers.</div>
</section>

<section>
  <span class="kicker">Solution</span>
  <h2>How it works</h2>
  <div class="grid-3">
    <div class="card"><h3>Feature 1</h3><p>One-line description.</p></div>
    <div class="card"><h3>Feature 2</h3><p>One-line description.</p></div>
    <div class="card"><h3>Feature 3</h3><p>One-line description.</p></div>
  </div>
  <div role="note">Walk through each feature with a concrete example.</div>
</section>

<section>
  <span class="kicker">Traction</span>
  <h2>The numbers</h2>
  <div class="grid-3">
    <div><div class="big">10k</div><div class="big-label">Weekly actives</div></div>
    <div><div class="big">32%</div><div class="big-label">MoM growth</div></div>
    <div><div class="big">$14k</div><div class="big-label">MRR</div></div>
  </div>
  <div role="note">Highlight growth trajectory.</div>
</section>

<section>
  <span class="kicker">Roadmap</span>
  <h2>Where we're going</h2>
  <ul>
    <li><strong>Q1:</strong> Launch v1</li>
    <li><strong>Q2:</strong> Expand to EU</li>
    <li><strong>Q3:</strong> Mobile app</li>
    <li><strong>Q4:</strong> Series A</li>
  </ul>
  <div role="note">Signal forward momentum.</div>
</section>

<section>
  <span class="kicker">Quote</span>
  <h2>What people say</h2>
  <p class="quote">&ldquo;This product changed how our team works. We've cut meeting time by 40%.&rdquo;</p>
  <p class="lede" style="margin-top: 1.5em;">— Customer Name, CEO at Company</p>
  <div role="note">Use a quote for social proof.</div>
</section>

<section>
  <span class="kicker">Thanks</span>
  <h2>Thank you</h2>
  <p class="lede">Questions? hello@example.com</p>
  <p class="lede">
    <span class="pill">github.com/example</span>
    <span class="pill">example.com</span>
  </p>
  <div role="note">Close with a clear call-to-action.</div>
</section>

<script>
  // Minimal DZSlides-like keyboard nav (inline, no external dep)
  (function() {{
    var sections = document.querySelectorAll('section');
    var current = 0;
    function show(i) {{
      sections.forEach(function(s, idx) {{
        if (idx === i) s.setAttribute('aria-selected', 'true');
        else s.removeAttribute('aria-selected');
      }});
      current = i;
    }}
    document.addEventListener('keydown', function(e) {{
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {{
        e.preventDefault();
        if (current < sections.length - 1) show(current + 1);
      }} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {{
        e.preventDefault();
        if (current > 0) show(current - 1);
      }} else if (e.key === 'Home') {{
        show(0);
      }} else if (e.key === 'End') {{
        show(sections.length - 1);
      }}
    }});
    // Notify parent of slide count when previewing
    window.parent.postMessage({{type: 'preview-ready', slide: 0, count: sections.length}}, '*');
  }})();
</script>
</body>
</html>
"""

# ===========================================================================
# TEMPLATE DEFINITIONS
# ===========================================================================

TEMPLATES = [
    # impress.js — spatial/3D theme
    {
        "id": "impress-spatial",
        "name": "Impress Spatial",
        "framework": "impress.js",
        "tagline": "Prezi-style 3D spatial deck — camera flies between positioned/rotated/scaled slides.",
        "category": "Creative",
        "style": "3D Spatial",
        "accent": "#3b6cff",
        "bg": "#f8f9fa",
        "text": "#111216",
        "fonts": ["Inter"],
        "bestFor": ["keynote", "spatial", "prezi-style", "3d"],
        "slidesCount": 7,
        "sourceFolder": "frameworks/impressjs",
    },
    # impress.js — dark variant
    {
        "id": "impress-dark",
        "name": "Impress Dark 3D",
        "framework": "impress.js",
        "tagline": "Dark-themed impress.js deck with 3D camera transitions and electric-cyan accent.",
        "category": "Tech",
        "style": "3D Dark",
        "accent": "#00d4ff",
        "bg": "#0a0e1a",
        "text": "#e8eaed",
        "fonts": ["Inter"],
        "bestFor": ["tech-talk", "3d", "keynote", "spatial"],
        "slidesCount": 7,
        "sourceFolder": "frameworks/impressjs",
    },
    # Shower — Ribbon theme (light, blue accents)
    {
        "id": "shower-ribbon",
        "name": "Shower Ribbon",
        "framework": "shower",
        "tagline": "Shower's classic Ribbon theme — clean light slides with blue accent stripe.",
        "category": "Business",
        "style": "Minimal",
        "accent": "#4a87dd",
        "theme_file": "ribbon.css",
        "fonts": ["PT Sans", "PT Serif"],
        "bestFor": ["report", "tutorial", "documentation"],
        "slidesCount": 7,
        "sourceFolder": "frameworks/shower",
    },
    # Shower — Material theme (Google Material Design)
    {
        "id": "shower-material",
        "name": "Shower Material",
        "framework": "shower",
        "tagline": "Google Material Design slides — bold colors, card elevation, Roboto type.",
        "category": "Business",
        "style": "Material",
        "accent": "#3f51b5",
        "theme_file": "material.css",
        "fonts": ["Roboto", "Roboto Slab"],
        "bestFor": ["product-launch", "google-style", "modern"],
        "slidesCount": 7,
        "sourceFolder": "frameworks/shower",
    },
    # DZSlides — single-file minimalist
    {
        "id": "dzslides-minimal",
        "name": "DZSlides Minimal",
        "framework": "dzslides",
        "tagline": "Single-file HTML deck — zero dependencies, plain sections, inlined CSS+JS.",
        "category": "General",
        "style": "Minimal",
        "accent": "#e63946",
        "bg": "#fafafa",
        "text": "#1a1a1a",
        "fonts": ["Inter"],
        "bestFor": ["minimal", "single-file", "no-deps", "teaching"],
        "slidesCount": 7,
        "sourceFolder": "frameworks/dzslides",
    },
]


def main():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    # Remove any existing entries with our framework IDs (idempotent)
    new_ids = {t["id"] for t in TEMPLATES}
    manifest["templates"] = [t for t in manifest["templates"] if t.get("id") not in new_ids]

    for tpl in TEMPLATES:
        tpl_id = tpl["id"]
        dest_dir = DEST / tpl_id
        dest_dir.mkdir(parents=True, exist_ok=True)

        if tpl["framework"] == "impress.js":
            html = IMPRESS_TPL.format(
                title=tpl["name"],
                accent=tpl["accent"],
                bg=tpl["bg"],
                text=tpl["text"],
            )
        elif tpl["framework"] == "shower":
            html = SHOWER_TPL.format(
                title=tpl["name"],
                accent=tpl["accent"],
                theme_file=tpl["theme_file"],
            )
        elif tpl["framework"] == "dzslides":
            html = DZSLIDES_TPL.format(
                title=tpl["name"],
                accent=tpl["accent"],
                bg=tpl["bg"],
                text=tpl["text"],
            )
        else:
            print(f"  SKIP unknown framework: {tpl['framework']}")
            continue

        (dest_dir / "template.html").write_text(html, encoding="utf-8")
        print(f"  OK {tpl_id} -> {dest_dir / 'template.html'} ({len(html)} bytes)")

        # Palette inference
        if tpl["framework"] == "impress.js":
            palette = [tpl["bg"], tpl["accent"], tpl["text"], "#ffffff"]
        elif tpl["framework"] == "shower":
            palette = ["#ffffff", tpl["accent"], "#222222", "#666666"]
        else:
            palette = [tpl["bg"], tpl["accent"], tpl["text"], "#ffffff"]

        manifest["templates"].append({
            "id": tpl_id,
            "name": tpl["name"],
            "tagline": tpl["tagline"],
            "category": tpl["category"],
            "style": tpl["style"],
            "palette": palette,
            "fonts": tpl["fonts"],
            "bestFor": tpl["bestFor"],
            "slidesCount": tpl["slidesCount"],
            "tags": [tpl["framework"].replace(".", "").lower()] + tpl["bestFor"],
            "previewSlide": 0,
            "sourceFolder": tpl["sourceFolder"],
            "framework": tpl["framework"] if tpl["framework"] != "impress.js" else "impress.js",
        })

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nManifest: {len(manifest['templates'])} total templates")


if __name__ == "__main__":
    main()
