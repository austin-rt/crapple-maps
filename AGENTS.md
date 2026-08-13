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
- package.json, app.json, plugins/ → native builds + TestFlight and Play internal

Native binaries build only for changes OTA can't deliver (new dependencies,
app config, native plugins), so nothing needs to be tagged or triggered by
hand. `submit.production.ios.groups` in eas.json adds each new build to the
TestFlight groups on upload — without it, `eas submit` only uploads the binary
and the build sits unassigned. List EXTERNAL groups only: Apple distributes to
internal groups automatically and rejects explicit assignment, so naming one
kills the submit job with "Builds cannot be assigned to this internal group"
*after* the upload already succeeded — the build reaches TestFlight while CI
reports failure. The Play service-account key lives on EAS
servers (`eas credentials -p android`), NOT in eas.json — a
`serviceAccountKeyPath` would point at gitignored `.secrets/` and break CI. Apple's Beta App Review is required once per
app; later builds distribute without it unless the app changes significantly. To force a build without a native change:

    npx eas-cli workflow:run .eas/workflows/release-native.yml

Tags are not a trigger — EAS applies `paths` to tag pushes as well, so a tag
only fires when the tagged commit happens to touch those files.

A workflow's `paths` must include the workflow file itself and any config it
depends on (`eas.json`). Otherwise a commit that changes what the pipeline
*does* won't run it, and the change sits there looking shipped: adding the
Android build+submit jobs touched only `release-native.yml` and `eas.json`, so
the Play submit path went unexecuted until someone forced a run.

# Android builds are slow, and that is the plan, not a bug

The Expo account is on the **free** plan. iOS builds pick up a worker in
minutes; Android ones can sit `IN_QUEUE` for hours with `updatedAt` frozen at
creation and no logs. That looks identical to a wedged job — it isn't, and
cancelling and re-queuing does not help. Check status.expo.dev before
assuming an outage, and do NOT "fix" it with `--local` builds; the point is
that `git push` ships.

The iOS submit job must be `type: submit`, never `type: testflight`. A
testflight job that submits an EAS build (`build_id`) is a **paid-plan** feature;
on the free plan it fails at once with "Failed to start job" and uploads nothing.
It is easy to miss because `build_ios` still reports success — builds 17, 18 and
19 all finished and none reached App Store Connect, so the version sat in review
with a stale binary attached. The `asc_build_id` alternative the error suggests
is circular: it submits a build that is already in App Store Connect, which is
the step that failed. Beta App Review only matters for EXTERNAL TestFlight
testers, not for an App Store release.

Both workflows set `concurrency.cancel_in_progress`, so a newer push cancels
the older run instead of stacking behind it. Without that, queued builds would
submit oldest-first and land stale binaries after fresh ones.

The same queue affects `type: update` jobs, so an OTA can take a long time to
publish. `eas update --branch production` from a machine publishes the
identical update immediately when something needs to reach devices now.
