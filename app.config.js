const withGoogleMapsIOS = require('./plugins/withGoogleMapsIOS');

// Extends the static app.json with the Google Maps keys (kept in .env, out of
// source control) and the iOS Google Maps pod plugin.
//
// Takes the `config` Expo passes in (already loaded from app.json) rather than
// requiring app.json itself — otherwise `expo doctor` flags the static config
// as unused and fails the build's doctor step.
module.exports = ({ config }) => {
  const expo = { ...config };
  const iosKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY;
  const androidKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY;

  if (iosKey) {
    expo.ios = { ...expo.ios, config: { ...(expo.ios?.config || {}), googleMapsApiKey: iosKey } };
  }
  // No non-exempt encryption (only standard HTTPS) — avoids a manual ASC compliance step for TestFlight.
  expo.ios = { ...expo.ios, infoPlist: { ...(expo.ios?.infoPlist || {}), ITSAppUsesNonExemptEncryption: false } };
  if (androidKey) {
    expo.android = {
      ...expo.android,
      config: { ...(expo.android?.config || {}), googleMaps: { apiKey: androidKey } },
    };
  }

  expo.plugins = [...(expo.plugins || []), withGoogleMapsIOS];
  expo.owner = 'theaustinrt';
  expo.extra = { ...(expo.extra || {}), eas: { ...(expo.extra?.eas || {}), projectId: '5c4b5d0b-aaa6-4334-a4bf-5d08ddd7d29b' } };
  // expo-updates (OTA) config — set manually because dynamic config can't be auto-written by eas update:configure.
  expo.runtimeVersion = { policy: 'appVersion' };
  expo.updates = { ...(expo.updates || {}), url: 'https://u.expo.dev/5c4b5d0b-aaa6-4334-a4bf-5d08ddd7d29b' };
  return { expo };
};
