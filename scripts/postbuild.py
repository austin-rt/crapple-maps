#!/usr/bin/env python3
"""Post-process the Expo web export (dist/) for static hosting on Vercel.

1. Icon-font 404 fix: Vercel drops node_modules/ dirs, and Expo hides the
   @expo/vector-icons fonts under assets/node_modules — rename + rewrite refs.
2. Pre-paint the dark-mode class so the statically-exported (light) HTML
   doesn't flash light for dark-mode users before hydration.
3. Legal pages (privacy + terms) copied in for the App Store listing.
4. Standalone /info marketing page: replace the app-SPA route's info.html with a
   complete, self-contained HTML doc (from marketing/info.template.html) so it
   scrolls like a normal web page instead of being trapped in the RN-web shell.
"""
import os
import shutil

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

# 2) Pre-paint dark mode. The export is pre-rendered light; the app flips the
# `dark` class only after hydration. Setting it before first paint lets every
# CSS-variable-styled element render dark immediately (inline style props still
# wait for the ThemePrefProvider hydration flip).
SNIPPET = ("<script>try{if(matchMedia('(prefers-color-scheme: dark)').matches)"
           "document.documentElement.classList.add('dark')}catch(e){}</script>")
patched = 0
for root, _dirs, files in os.walk(DIST):
    for name in files:
        if not name.endswith('.html'):
            continue
        path = os.path.join(root, name)
        data = open(path, encoding='utf-8').read()
        if '<head>' in data and SNIPPET not in data:
            open(path, 'w', encoding='utf-8').write(data.replace('<head>', '<head>' + SNIPPET, 1))
            patched += 1
print(f'postbuild: dark-mode pre-paint script injected into {patched} pages')

# 3) Standalone /info page.
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

# 4) Legal pages (privacy + terms). Self-contained static docs, required for the
# App Store listing and linked from the profile screen.
shutil.copy('marketing/legal.css', os.path.join(DIST, 'legal.css'))
for page in ('privacy', 'terms'):
    shutil.copy(f'marketing/{page}.html', os.path.join(DIST, f'{page}.html'))

# Contact form posts straight to Supabase (the anon key is already public in the
# client bundle), so the page needs no server of its own.
contact = open('marketing/contact.template.html', encoding='utf-8').read()
contact = (contact
           .replace('__SUPABASE_URL__', os.environ.get('EXPO_PUBLIC_SUPABASE_URL', ''))
           .replace('__SUPABASE_ANON_KEY__', os.environ.get('EXPO_PUBLIC_SUPABASE_ANON_KEY', '')))
open(os.path.join(DIST, 'contact.html'), 'w', encoding='utf-8').write(contact)
print('postbuild: wrote dist/privacy.html, dist/terms.html, dist/contact.html, dist/legal.css')
