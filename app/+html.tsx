import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Web-only HTML shell. Expo's default shell ships no <title> and no social
// tags, so crapplemaps.com previewed as a bare URL anywhere it was shared —
// Slack, iMessage, a tweet. This is the root document for the web build only;
// it never renders on native.
const TITLE = 'Crapple Maps: Gotta go? We got you.';
const DESCRIPTION =
  'Find the nearest public restroom before it becomes a problem. Nearly 100,000 mapped, with door codes, accessibility, and whether you need to buy something.';
const URL = 'https://crapplemaps.com';
const OG_IMAGE = `${URL}/cm-web.jpg`; // 1400x880, already served from public/

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        {/* Matches the app's dark surface so mobile browser chrome doesn't
            flash white against it. */}
        <meta name="theme-color" content="#0a0e11" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Crapple Maps" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1400" />
        <meta property="og:image:height" content="880" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* Disables body scrolling on web so ScrollView components work as they
            do on native. Remove it if you want a natively scrolling document. */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
