# Android test build

For a standalone installable build with the multilingual interface, use the existing `preview` profile:

```sh
npx --no-install eas whoami
npx --no-install eas build --profile preview --platform android
```

Run the build only after verifying Expo project access, signing, and available build capacity. Install the APK from the completed EAS build page on the Android test device. A preview build includes its JavaScript bundle and launches without a development server.

For active development with Metro, use the `development` profile and then start Metro:

```sh
npx --no-install eas build --profile development --platform android
npx expo start --dev-client
```

See [the complete test-build guide](docs/TEST_BUILDS.md) for environment prerequisites, signing, localization checks, and the separate store-release workflow. The current production Android profile produces an APK; Google Play AAB preparation is a separate release step.
