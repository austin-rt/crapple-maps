# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Versioning

`expo.version` in app.json is the launch version and stays put. Do NOT bump it
per change — `runtimeVersion.policy` is `appVersion`, so every bump forks the
OTA runtime and the TestFlight version train, stranding earlier builds and
splitting updates across trains. EAS auto-increments the build number; that is
the only number that should move.

Bump `version` only for a real user-facing release, and keep
`store.config.json` `apple.version` identical — App Store Connect will not let
you attach a build whose version string differs from the version record.

# Shipping

`git push` to main is the only step. The pipeline decides what a change needs:

- app/, components/, hooks/, lib/, theme/, assets/ → web deploy + OTA update
- marketing/, public/, scripts/ → web deploy only
- package.json, app.json, plugins/ → native build + TestFlight submit as well

Native binaries build only for changes OTA can't deliver (new dependencies,
app config, native plugins), so nothing needs to be tagged or triggered by
hand. `submit.production.ios.groups` in eas.json adds each new build to the
TestFlight groups on upload — without it, `eas submit` only uploads the binary
and the build sits unassigned. Apple's Beta App Review is required once per
app; later builds distribute without it unless the app changes significantly. To force a build without a native change:

    npx eas-cli workflow:run .eas/workflows/release-native.yml

Tags are not a trigger — EAS applies `paths` to tag pushes as well, so a tag
only fires when the tagged commit happens to touch those files.
