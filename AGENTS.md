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

A native rebuild (new tag) is required only when native code changes: a new
native module, changed permissions/entitlements, or app config. Everything else
ships over the air to the current runtime.
