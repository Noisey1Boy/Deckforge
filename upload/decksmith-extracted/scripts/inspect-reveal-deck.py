#!/usr/bin/env python3
import json
import re

with open('/tmp/gen-reveal-test.json') as f:
    data = json.load(f)

if 'error' in data:
    print('ERROR:', data['error'])
else:
    html = data['html']
    print(f'HTML length: {len(html)}')
    print(f'Has DOCTYPE: {"<!DOCTYPE" in html[:100]}')
    print(f'Has html tag: {"<html" in html[:500]}')
    print(f'Has class=reveal: {chr(34) + "class=" + chr(34) + chr(34) + "reveal" + chr(34) + chr(34) in html}')
    # simpler check
    has_reveal_class = 'class="reveal"' in html
    has_slides_class = 'class="slides"' in html
    print(f'Has class="reveal": {has_reveal_class}')
    print(f'Has class="slides": {has_slides_class}')
    print(f'Has Reveal.initialize: {"Reveal.initialize" in html}')
    print(f'References /revealjs/dist/: {"/revealjs/dist/" in html}')
    sections = re.findall(r'<section[^>]*>', html)
    print(f'Section count: {len(sections)}')
    slide_classes = re.findall(r'class="[^"]*slide[^"]*"', html)
    print(f'class=slide count: {len(slide_classes)}')
    has_aside_notes = '<aside class="notes"' in html
    print(f'Has <aside class="notes": {has_aside_notes}')
    print()
    print('=== First 500 chars ===')
    print(html[:500])
    print()
    print('=== Last 400 chars ===')
    print(html[-400:])

    # Save it for browser preview
    with open('/home/z/my-project/public/test-reveal-deck.html', 'w') as f:
        f.write(html)
    print('\nSaved to /home/z/my-project/public/test-reveal-deck.html for browser preview')
