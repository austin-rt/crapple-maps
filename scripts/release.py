#!/usr/bin/env python3
"""Inspect and finish an App Store release.

    python3 scripts/release.py status     # read-only: where the release stands
    python3 scripts/release.py submit     # attach newest build + submit for review
    python3 scripts/release.py ship 1.1.5 35
        # what release-native.yml runs after uploading build 35: create version
        # 1.1.5 if needed, wait for Apple to finish processing that build, set
        # the release notes from store.config.json, attach it and submit

WHY THIS EXISTS
The last mile of an iOS release is not something `eas` can do. EAS builds the
binary and uploads it (the `submit_ios` job in .eas/workflows/release-native.yml);
everything after that — attaching that build to the version record, and creating
the review submission — is App Store Connect REST only.

THINGS THAT WILL BITE YOU
* A version in WAITING_FOR_REVIEW is FROZEN. Screenshots and metadata reject with
  409 STATE_ERROR. Withdraw it first (that lands it in DEVELOPER_REJECTED, which
  is developer-withdrawn, not an Apple rejection) and it becomes editable again.
* Screenshots belong to a VERSION, not the app. Once a version is live you cannot
  change them without a new version string and a new build. Get them right before
  submitting.
* A build only becomes attachable once Apple finishes processing it: it has to
  read VALID, not PROCESSING.
"""
import json
import os
import sys
import time

from asc import APP_ID, REPO, call

OPEN = {'PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED',
        'METADATA_REJECTED', 'INVALID_BINARY'}


def versions():
    st, b = call('GET', f'/apps/{APP_ID}/appStoreVersions?limit=10')
    return b.get('data', [])


def builds():
    st, b = call('GET', f'/apps/{APP_ID}/builds'
                        '?limit=200&fields[builds]=version,processingState,uploadedDate')
    rows = [(int(x['attributes']['version']), x['attributes']['processingState'],
             x['attributes'].get('uploadedDate'), x['id'])
            for x in b.get('data', []) if (x['attributes'].get('version') or '').isdigit()]
    return sorted(rows)


def editable_version():
    """The version we can still change. Anything not frozen by review."""
    for v in versions():
        if v['attributes']['appStoreState'] in OPEN:
            return v
    return None


def status():
    for v in versions():
        a = v['attributes']
        print(f"version {a['versionString']} -> {a['appStoreState']}  ({v['id']})")
        st, b = call('GET', f"/appStoreVersions/{v['id']}/build")
        cur = (b.get('data') or {})
        if cur:
            st2, b2 = call('GET', f"/builds/{cur['id']}?fields[builds]=version")
            print('   attached build:', b2.get('data', {}).get('attributes', {}).get('version'))
        else:
            print('   attached build: (none)')

    print('\nnewest builds in App Store Connect:')
    for v, s, u, i in builds()[-5:]:
        print(f'   build {v:>4} | {s:<12} | {u}')

    st, b = call('GET', f'/apps/{APP_ID}/reviewSubmissions?limit=5')
    print('\nreview submissions:')
    for r in b.get('data', []):
        print('  ', r['id'][:12], r['attributes'].get('state'),
              '| submitted', r['attributes'].get('submittedDate'))


def submit():
    ver = editable_version()
    if not ver:
        raise SystemExit('No editable version — it is already in review. '
                         'Withdraw it first if you need to change something.')
    valid = [r for r in builds() if r[1] == 'VALID']
    if not valid:
        raise SystemExit('No VALID build in App Store Connect yet — still processing.')
    bnum, _, _, bid = valid[-1]
    submit_version(ver, bnum, bid)


def ship(vstr, bnum):
    """Release-native's last step. Takes the build number from the EAS build,
    not "newest VALID": preview builds upload to the same app with the same
    version string."""
    bnum = int(bnum)
    ver = next((v for v in versions() if v['attributes']['versionString'] == vstr), None)
    if ver and ver['attributes']['appStoreState'] not in OPEN:
        print(f"version {vstr} is {ver['attributes']['appStoreState']}; nothing to submit")
        return
    if not ver:
        ver = create_version(vstr)
    bid = wait_valid(bnum)
    set_release_notes(ver['id'])
    submit_version(ver, bnum, bid)


def create_version(vstr):
    # Releases as soon as Apple approves it. Metadata and screenshots carry over
    # from the previous version.
    st, b = call('POST', '/appStoreVersions', {"data": {
        "type": "appStoreVersions",
        "attributes": {"platform": "IOS", "versionString": vstr, "releaseType": "AFTER_APPROVAL"},
        "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}}}})
    if st >= 400:
        raise SystemExit(f'create version {vstr} failed {st}: {b}')
    print(f'created version {vstr}')
    return b['data']


def wait_valid(bnum, timeout=90 * 60):
    """Apple processes an upload for minutes to an hour before it can attach."""
    deadline = time.time() + timeout
    while True:
        row = next((r for r in builds() if r[0] == bnum), None)
        state = row[1] if row else 'NOT UPLOADED'
        if state == 'VALID':
            return row[3]
        if state in ('INVALID', 'FAILED'):
            raise SystemExit(f'build {bnum} is {state} in App Store Connect')
        if time.time() > deadline:
            raise SystemExit(f'build {bnum} still {state} after {timeout // 60} minutes')
        print(f'build {bnum}: {state}, checking again in a minute')
        time.sleep(60)


def set_release_notes(vid):
    """What's New, from store.config.json apple.info.en-US.releaseNotes."""
    with open(os.path.join(REPO, 'store.config.json')) as f:
        notes = json.load(f)['apple']['info']['en-US'].get('releaseNotes')
    if not notes:
        raise SystemExit('store.config.json has no apple.info.en-US.releaseNotes')
    st, b = call('GET', f'/appStoreVersions/{vid}/appStoreVersionLocalizations')
    loc = next(l for l in b.get('data', []) if l['attributes']['locale'] == 'en-US')
    st, b = call('PATCH', f"/appStoreVersionLocalizations/{loc['id']}", {"data": {
        "type": "appStoreVersionLocalizations", "id": loc['id'], "attributes": {"whatsNew": notes}}})
    print('release notes ->', st, '' if st < 400 else b)
    if st >= 400:
        raise SystemExit(b)


def submit_version(ver, bnum, bid):
    vid, vstr = ver['id'], ver['attributes']['versionString']
    print(f'version {vstr} ({ver["attributes"]["appStoreState"]}) <- build {bnum}')

    st, b = call('PATCH', f'/appStoreVersions/{vid}', {"data": {
        "type": "appStoreVersions", "id": vid,
        "relationships": {"build": {"data": {"type": "builds", "id": bid}}}}})
    print('attach build ->', st)
    if st >= 400:
        raise SystemExit(b)

    st, b = call('POST', '/reviewSubmissions', {"data": {
        "type": "reviewSubmissions",
        "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}}}})
    if st >= 400 and 'already exists' not in str(b):
        raise SystemExit(f'create submission failed {st}: {b}')
    if st < 400:
        sub = b['data']['id']
    else:
        st, b = call('GET', f'/apps/{APP_ID}/reviewSubmissions?limit=5')
        sub = next(r['id'] for r in b['data']
                   if r['attributes'].get('state') in ('READY_FOR_REVIEW', 'UNRESOLVED_ISSUES'))
    print('submission', sub)

    st, b = call('POST', '/reviewSubmissionItems', {"data": {
        "type": "reviewSubmissionItems",
        "relationships": {
            "reviewSubmission": {"data": {"type": "reviewSubmissions", "id": sub}},
            "appStoreVersion": {"data": {"type": "appStoreVersions", "id": vid}}}}})
    print('add version to submission ->', st, '' if st < 400 else b)

    st, b = call('PATCH', f'/reviewSubmissions/{sub}', {"data": {
        "type": "reviewSubmissions", "id": sub, "attributes": {"submitted": True}}})
    print('submit ->', st, b.get('data', {}).get('attributes', {}).get('state') if st < 400 else b)
    if st >= 400:
        raise SystemExit('review submission failed')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
    {'status': status, 'submit': submit, 'ship': ship}[cmd](*sys.argv[2:])
