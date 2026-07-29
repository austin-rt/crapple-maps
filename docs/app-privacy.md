# App Privacy questionnaire answers

Fill these in at App Store Connect → App Privacy. They match what the code
actually does (verified July 2026: no analytics or crash-reporting SDK is
installed, so nothing is collected for tracking or third-party advertising).

**Do you or your third-party partners collect data from this app?** → Yes

For every type below: **not used for tracking**, **not used for advertising**,
and **linked to the user's identity** (it's tied to their account).

| Data type | Collected | Purpose | Linked | Tracking |
|---|---|---|---|---|
| Email address | Yes | App Functionality (account) | Yes | No |
| Name (display name / username) | Yes | App Functionality | Yes | No |
| User ID | Yes | App Functionality | Yes | No |
| Photos | Yes | App Functionality (log/restroom/avatar images) | Yes | No |
| Coarse or precise location | **No** | — | — | — |
| User content (logs, comments, reviews) | Yes | App Functionality | Yes | No |

**Why location is "not collected":** the device's live location is used
on-device only, to sort nearby restrooms and center the map. It is never
transmitted to or stored on our servers. When a user *deliberately* places a
pin (adding a restroom, logging a visit), the coordinate they chose is stored
as part of that content — that is covered by "User content", not location
tracking. If a reviewer questions this, the honest alternative is to declare
"Precise Location → App Functionality → Linked → No tracking", which is also
defensible; do not declare it as used for tracking or advertising.

**Third parties receiving data**
- Supabase — database, auth, and file storage (our backend; a processor).
- Google Maps Platform — map tiles, address search, and reverse geocoding.
  Receives the query coordinates/text, not the user's identity.

**Account deletion:** in-app at Profile → Delete account, backed by the
`delete_account()` RPC. Required by guideline 5.1.1(v).
