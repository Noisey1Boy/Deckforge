#!/usr/bin/env python3
import json
import re

with open('/tmp/gen-impress-test.json') as f:
    data = json.load(f)

if 'error' in data:
    print('ERROR:', data['error'])
else:
    html = data['html']
    print(f'HTML length: {len(html)}')
    print(f'Has DOCTYPE: {"<!DOCTYPE" in html[:100]}')
    print(f'Has id=impress: {"id=\"impress\"" in html}')
    print(f'Has impress.js script: {"/frameworks/impressjs/impress.js" in html}')
    print(f'Has impress().init: {"impress().init" in html}')
    print(f'Step count: {len(re.findall(r"class=\"[^\"]*step[^\"]*\"", html))}')
    print(f'Has data-x attribute: {"data-x=" in html}')
    print(f'Has data-rotate attribute: {"data-rotate=" in html}')
    print(f'Has data-scale attribute: {"data-scale=" in html}')
    print(f'Has <div class="notes": {"<div class=\"notes\"" in html}')
    print()
    print('=== First 400 chars ===')
    print(html[:400])
    print()
    print('=== Last 300 chars ===')
    print(html[-300:])

    # Save for browser preview
    with open('/home/z/my-project/public/test-impress-deck.html', 'w') as f:
        f.write(html)
    print('\nSaved to /home/z/my-project/public/test-impress-deck.html')
