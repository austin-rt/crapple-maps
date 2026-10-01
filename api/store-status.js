// Which stores Crapple Maps can be downloaded from, for the web's "get the app"
// banner (components/web/GetAppBanner.tsx). The Google Play listing returns 404
// until Google approves the first release, so the banner asks here instead of
// linking to a missing page. Cached at the edge for an hour, so the Android
// banner turns itself on within an hour of the listing going live.

const PLAY = 'https://play.google.com/store/apps/details?id=com.austinrt.crapplemaps&hl=en_US';

module.exports = async (req, res) => {
  let android = false;
  try {
    const r = await fetch(PLAY, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'manual' });
    android = r.status === 200;
  } catch {}
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(JSON.stringify({ ios: true, android }));
};
