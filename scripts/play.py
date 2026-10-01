#!/usr/bin/env python3
"""Google Play release status.

    python3 scripts/play.py

Reads the track state straight from the Play Developer API. Auth is a service
account JWT; the key lives in .secrets/ (gitignored) and is never inlined.

Play has no single "approved" flag like Apple. Three independent gates:
  1. Release review — per release, usually automatic and fast.
  2. Production access — NEW personal accounts must run a CLOSED test with 12
     testers opted in for 14 CONTINUOUS days, then apply. This account is an
     organization account (since 2026-09-30), which is exempt.
  3. Developer verification — Play Console > Settings > Developer account.
Only gate 1 is observable through this API, so absence of a production release
does not by itself tell you which gate you are stuck behind.
"""
import json, os, time, urllib.parse, urllib.request
import jwt

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.environ.get('PLAY_KEY_PATH',
                     os.path.join(REPO, '.secrets', 'play-service-account.json'))
PKG = os.environ.get('PLAY_PACKAGE', 'com.austinrt.crapplemaps')
API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'


def token():
    if not os.path.exists(KEY):
        raise SystemExit(f'Play service account key not found: {KEY}')
    sa = json.load(open(KEY))
    now = int(time.time())
    assertion = jwt.encode({
        'iss': sa['client_email'],
        'scope': 'https://www.googleapis.com/auth/androidpublisher',
        'aud': 'https://oauth2.googleapis.com/token',
        'iat': now, 'exp': now + 3600}, sa['private_key'], algorithm='RS256')
    body = urllib.parse.urlencode({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': assertion}).encode()
    return json.load(urllib.request.urlopen(
        'https://oauth2.googleapis.com/token', data=body))['access_token']


def main():
    t = token()
    h = {'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json'}
    # An "edit" is Play's transaction handle; reads need one too. We never commit it.
    edit = json.load(urllib.request.urlopen(
        urllib.request.Request(f'{API}/{PKG}/edits', data=b'{}', method='POST', headers=h)))
    eid = edit['id']
    tracks = json.load(urllib.request.urlopen(
        urllib.request.Request(f'{API}/{PKG}/edits/{eid}/tracks', headers=h)))
    print(f'package {PKG}\n')
    for tr in tracks.get('tracks', []):
        rels = tr.get('releases', [])
        print(f"track {tr['track']:<18} releases={len(rels)}")
        for r in rels:
            frac = r.get('userFraction')
            print(f"    status={r.get('status'):<12} versionCodes={r.get('versionCodes')} "
                  f"name={r.get('name')}" + (f" rollout={frac}" if frac else ''))
    # A release sent for review already reads status=completed here, so the API
    # cannot tell "in review" from "live". The public listing can.
    on_prod = any(t_['track'] == 'production' and t_.get('releases')
                  for t_ in tracks.get('tracks', []))
    try:
        live = urllib.request.urlopen(urllib.request.Request(
            f'https://play.google.com/store/apps/details?id={PKG}',
            headers={'User-Agent': 'Mozilla/5.0'}), timeout=20).status == 200
    except Exception:
        live = False
    print('\nPRODUCTION RELEASE:', 'yes' if on_prod else 'no')
    print('LIVE ON PLAY:', 'yes' if live else 'no — the public listing is not up yet')


if __name__ == "__main__":
    main()
