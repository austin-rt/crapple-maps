#!/usr/bin/env python3
"""Inspect and finish an App Store release.

    python3 scripts/release.py status     # read-only: where the release stands
    python3 scripts/release.py submit     # attach newest build + submit for review

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
import sys

from asc import APP_ID, call


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
    OPEN = {'PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED',
            'METADATA_REJECTED', 'INVALID_BINARY'}
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
    vid, vstr = ver['id'], ver['attributes']['versionString']

    valid = [r for r in builds() if r[1] == 'VALID']
    if not valid:
        raise SystemExit('No VALID build in App Store Connect yet — still processing.')
    bnum, _, _, bid = valid[-1]
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


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
    {'status': status, 'submit': submit}[cmd]()
