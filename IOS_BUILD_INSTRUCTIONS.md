# iOS test build

For a standalone iPhone test build, use the existing `preview` profile after verifying Expo project access and the Apple signing setup:

```sh
npx --no-install eas whoami
npx --no-install eas device:create
npx --no-install eas build --profile preview --platform ios
```

Register each test device before building. Install the completed ad hoc build using its EAS build-page link on a device included in the provisioning profile. It launches without Metro. TestFlight requires a separate store build and upload workflow; completing an internal build provides an EAS installation link.

For the iOS Simulator, create a simulator artifact and install it on a Mac with Xcode/Simulator:

```sh
npx --no-install eas build --profile simulator --platform ios
npx --no-install eas build:run --platform ios
```

For active development with Metro, use `--profile development` instead and start `npx expo start --dev-client` after installation.

Use the Expo CLI's normal authentication/provisioning flow. See [the complete test-build guide](docs/TEST_BUILDS.md) for prerequisites, supported CLI behavior, localization checks, versioning, and the separate store-release workflow.
