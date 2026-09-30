#!/usr/bin/env python3
"""Replace the App Store screenshots on the editable version with store/screenshots.

    python3 scripts/screenshots.py            # upload to the version in PREPARE_FOR_SUBMISSION

Screenshots belong to a version record, not the app, and a new version starts
with copies of the previous version's. This deletes those in each set we own
and uploads the files from the matching folder, in filename order (0-hero.png
first — Apple's share card uses the first iPhone screenshot).
"""
import hashlib
import os
import sys
import urllib.request

from asc import APP_ID, call
from release import editable_version

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETS = {'APP_IPHONE_67': 'store/screenshots/ios-6.9', 'APP_IPAD_PRO_3GEN_129': 'store/screenshots/ipad-13'}


def upload(set_id, path):
    data = open(path, 'rb').read()
    st, b = call('POST', '/appScreenshots', {"data": {
        "type": "appScreenshots",
        "attributes": {"fileName": os.path.basename(path), "fileSize": len(data)},
        "relationships": {"appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": set_id}}}}})
    if st >= 400:
        raise SystemExit(f'reserve {path} failed {st}: {b}')
    shot = b['data']
    for op in shot['attributes']['uploadOperations']:
        chunk = data[op['offset']:op['offset'] + op['length']]
        req = urllib.request.Request(op['url'], data=chunk, method=op['method'])
        for h in op.get('requestHeaders', []):
            req.add_header(h['name'], h['value'])
        urllib.request.urlopen(req).read()
    st, b = call('PATCH', f"/appScreenshots/{shot['id']}", {"data": {
        "type": "appScreenshots", "id": shot['id'],
        "attributes": {"uploaded": True, "sourceFileChecksum": hashlib.md5(data).hexdigest()}}})
    if st >= 400:
        raise SystemExit(f'commit {path} failed {st}: {b}')
    return shot['id']


def main():
    ver = editable_version()
    if not ver:
        raise SystemExit('No editable version (PREPARE_FOR_SUBMISSION / rejected).')
    print('version', ver['attributes']['versionString'], ver['attributes']['appStoreState'])
    st, b = call('GET', f"/appStoreVersions/{ver['id']}/appStoreVersionLocalizations")
    loc = next(l for l in b['data'] if l['attributes']['locale'] == 'en-US')
    st, b = call('GET', f"/appStoreVersionLocalizations/{loc['id']}/appScreenshotSets")
    sets = {s['attributes']['screenshotDisplayType']: s['id'] for s in b['data']}
    for kind, folder in SETS.items():
        set_id = sets.get(kind)
        if not set_id:
            st, b = call('POST', '/appScreenshotSets', {"data": {
                "type": "appScreenshotSets", "attributes": {"screenshotDisplayType": kind},
                "relationships": {"appStoreVersionLocalization": {"data": {"type": "appStoreVersionLocalizations", "id": loc['id']}}}}})
            set_id = b['data']['id']
        st, b = call('GET', f'/appScreenshotSets/{set_id}/appScreenshots')
        for old in b.get('data', []):
            call('DELETE', f"/appScreenshots/{old['id']}")
        files = sorted(f for f in os.listdir(os.path.join(REPO, folder)) if f.endswith('.png'))
        ids = [upload(set_id, os.path.join(REPO, folder, f)) for f in files]
        st, b = call('PATCH', f'/appScreenshotSets/{set_id}/relationships/appScreenshots',
                     {"data": [{"type": "appScreenshots", "id": i} for i in ids]})
        print(f'{kind}: {len(ids)} uploaded {files} (order -> {st})')


if __name__ == '__main__':
    main()
