# App Privacy questionnaire — answers to enter

The only step that can't be automated: Apple exposes no API for App Privacy
(every `appDataUsage*` endpoint 404s on v1/v2/v3), and the web form is behind
Apple ID + 2FA. Everything else in the listing is already pushed.

**Where:** https://appstoreconnect.apple.com/apps/6795301489/distribution/privacy
→ "Get Started" (or Edit).

Answers below are derived from what the code actually does, verified July 2026:
no analytics or crash-reporting SDK is installed, so nothing is collected for
tracking or third-party advertising.

## 1. "Do you or your third-party partners collect data from this app?" → **Yes**

## 2. Select these data types, and only these

| Section | Check |
|---|---|
| Contact Info | **Email Address**, **Name** |
| Identifiers | **User ID** |
| User Content | **Photos or Videos**, **Other User Content** |

Leave everything else unchecked — notably **Location** (see below), Contacts,
Health & Fitness, Financial Info, Browsing History, Search History, Usage Data,
Diagnostics.

## 3. For every checked type, the same three answers

- **Used for:** App Functionality *only*
- **Linked to the user's identity:** **Yes** (it's tied to their account)
- **Used for tracking:** **No**

## 4. Why Location is *not* declared

The device's live location is used on-device only — to sort nearby restrooms
and center the map. It is never transmitted to or stored on our servers. When a
user deliberately places a pin (adding a restroom, logging a visit), the
coordinate they chose is saved as part of that content, which is already
covered by **User Content**.

If a reviewer pushes back, the safe alternative is to add
**Location → Precise Location → App Functionality → Linked: Yes → Tracking: No**.
Never declare location as used for tracking or advertising.

## 5. Third parties receiving data

- **Supabase** — database, auth, and file storage (our backend; a processor).
- **Google Maps Platform** — map tiles, address search, reverse geocoding.
  Receives query coordinates/text, not the user's identity.

## Related requirements (already done, for the record)

- **Account deletion** (guideline 5.1.1(v)) — Profile → Delete account, backed
  by the `delete_account()` RPC. Verified end to end.
- **UGC moderation** (guideline 1.2) — report and block on posts and comments;
  zero-tolerance policy stated at https://crapplemaps.com/terms.
- **Privacy policy URL** — https://crapplemaps.com/privacy (already on the
  listing).
