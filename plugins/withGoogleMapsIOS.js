const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// react-native-maps 1.x keeps Google Maps support in a separate pod
// (`react-native-google-maps`, which pulls GoogleMaps 8.4.0). It is not linked
// by default and ships no Expo plugin, so we add it to the Podfile during
// prebuild. The API key itself is injected via ios.config.googleMapsApiKey.
const POD_LINE = `  pod 'react-native-google-maps', :path => File.dirname(\`node --print "require.resolve('react-native-maps/package.json')"\`)`;

module.exports = function withGoogleMapsIOS(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (!contents.includes('react-native-google-maps')) {
        contents = contents.replace(/(target ['"][^'"]+['"] do)/, `$1\n${POD_LINE}`);
        fs.writeFileSync(podfile, contents);
      }
      return cfg;
    },
  ]);
};
