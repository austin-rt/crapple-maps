#!/usr/bin/env python3
"""Post-process the Expo web export (dist/) for static hosting on Vercel.

1. Icon-font 404 fix: Vercel drops node_modules/ dirs, and Expo hides the
   @expo/vector-icons fonts under assets/node_modules — rename + rewrite refs.
2. Standalone /info marketing page: replace the app-SPA route's info.html with a
   complete, self-contained HTML doc (from marketing/info.template.html) so it
   scrolls like a normal web page instead of being trapped in the RN-web shell.
"""
import os

DIST = 'dist'

# 1) Move icon fonts out of node_modules and rewrite references.
nm = os.path.join(DIST, 'assets', 'node_modules')
if os.path.isdir(nm):
    os.rename(nm, os.path.join(DIST, 'assets', '_deps'))
    for root, _dirs, files in os.walk(DIST):
        for name in files:
            if not name.endswith(('.js', '.css', '.html', '.json', '.map')):
                continue
            path = os.path.join(root, name)
            try:
                data = open(path, encoding='utf-8').read()
            except (UnicodeDecodeError, OSError):
                continue
            if 'assets/node_modules' in data:
                open(path, 'w', encoding='utf-8').write(data.replace('assets/node_modules', 'assets/_deps'))
    print('postbuild: icon fonts moved assets/node_modules -> assets/_deps')

# 2) Standalone /info page.
tpl = open('marketing/info.template.html', encoding='utf-8').read()
tpl = tpl.replace('__PHONE1__', '/cm-android.jpg').replace('__PHONE2__', '/cm-ios.jpg').replace('__WEB__', '/cm-web.jpg')
head, body = tpl.split('</style>', 1)
doc = (
    '<!doctype html>\n<html lang="en">\n<head>\n'
    '<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + head + '</style>\n</head>\n<body>\n' + body.strip() + '\n</body>\n</html>\n'
)
open(os.path.join(DIST, 'info.html'), 'w', encoding='utf-8').write(doc)
print('postbuild: wrote standalone dist/info.html')
