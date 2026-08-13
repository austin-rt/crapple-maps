#!/usr/bin/env python3
"""App Store Connect API client (ES256 JWT).

The store listing is not fully drivable from the CLI — attaching a build to a
version, swapping screenshots and creating a review submission all need the REST
API. This is the shared client for that.

    from asc import call
    status, body = call('GET', '/apps')

Or straight from a shell:

    python3 scripts/asc.py GET /apps
    python3 scripts/asc.py PATCH /appStoreVersions/<id> '{"data": {...}}'

Auth is an ES256 JWT signed with the App Store Connect private key. The key is
the only secret and it stays in .secrets/ (gitignored) — never inline it here.
The key id and issuer id are identifiers, not credentials, but they are read
from the environment so a different key can be dropped in without a code edit.

    ASC_KEY_ID    default Y2YF5P5593
    ASC_ISSUER    default 81d35fdb-c8e5-4617-a00f-bfed08a246d1
    ASC_KEY_PATH  default .secrets/AuthKey_<ASC_KEY_ID>.p8

Requires pyjwt with a crypto backend: pip3 install 'pyjwt[crypto]'
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

import jwt

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY_ID = os.environ.get('ASC_KEY_ID', 'Y2YF5P5593')
ISSUER = os.environ.get('ASC_ISSUER', '81d35fdb-c8e5-4617-a00f-bfed08a246d1')
KEY_PATH = os.environ.get('ASC_KEY_PATH',
                          os.path.join(REPO, '.secrets', f'AuthKey_{KEY_ID}.p8'))
BASE = 'https://api.appstoreconnect.apple.com/v1'

APP_ID = '6795301489'  # Crapple Maps, for convenience in ad-hoc scripts


def token():
    if not os.path.exists(KEY_PATH):
        raise SystemExit(
            f'App Store Connect key not found: {KEY_PATH}\n'
            'It is gitignored, so a fresh clone will not have it. Download the '
            '.p8 from App Store Connect > Users and Access > Integrations, or '
            'point ASC_KEY_PATH at it.')
    now = int(time.time())
    return jwt.encode(
        {'iss': ISSUER, 'iat': now, 'exp': now + 600, 'aud': 'appstoreconnect-v1'},
        open(KEY_PATH).read(), algorithm='ES256',
        headers={'kid': KEY_ID, 'typ': 'JWT'})


def call(method, path, body=None):
    """Returns (http_status, parsed_body). Never raises on a 4xx/5xx — the API
    puts the useful detail in the error body, so hand it back to the caller."""
    url = path if path.startswith('http') else BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Authorization', 'Bearer ' + token())
    if data:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {'raw': raw[:500]}


if __name__ == '__main__':
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    m, p = sys.argv[1], sys.argv[2]
    b = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
    st, body = call(m, p, b)
    print('HTTP', st)
    print(json.dumps(body, indent=2)[:3000])
