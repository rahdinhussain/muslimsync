# Multilingual mobile test builds

Use the existing `preview` profile to test the bundled app on Android and registered iOS devices. It includes the JavaScript bundle and does not require a Metro development server. The `development` profile is for development with Metro. The `simulator` profile produces an iOS Simulator build that requires a Mac to run.

These commands create remote builds when explicitly run; they are not part of the localization checks or GitHub pull-request CI. An Expo account with project access, suitable signing configuration, and available build capacity must be in place first. No remote build or store submission has been started by the localization implementation.

## Existing project and profiles

The configured EAS project is `e5b0eec2-e349-4dea-b1cc-52a101c164d6`. Both platforms use `com.muslimsync.app` as the application identifier.

| Profile | Platform | Output/use | Metro required |
| --- | --- | --- | --- |
| `preview` | Android | Installable APK | No |
| `android-test` | Android | Installable APK; equivalent existing test profile | No |
| `preview` | iOS | Ad hoc device build for registered devices | No |
| `simulator` | iOS | iOS Simulator app | No |
| `development` | Android/iOS | Development client | Yes, for local development |
| `production` | Android | Currently an APK, as explicitly configured | No |
| `production` | iOS | Store-signed Release build | No |

An internal iOS build is installed from its EAS build page on a device included in the provisioning profile. TestFlight uses a separate store build and upload workflow. An iOS Simulator build runs without Apple device signing or an Apple Developer membership, but needs a Mac with Xcode/Simulator to run. See the official [internal distribution](https://docs.expo.dev/build/internal-distribution/) and [iOS Simulator](https://docs.expo.dev/build-reference/simulators/) guides.

## Public backend configuration

The mobile client now defaults to the current `https://api.muslimsync.com` backend. Its matching **public anon-role client key** is intentionally included in `src/config/publicBackend.json`, just as a mobile/web client includes its public client key in the delivered bundle. No private or service-role credential belongs in this file. Database row-level policies control what this public client can read or change.

A fresh clone and an EAS build work with those tracked public defaults; the ignored legacy `src/config/apiKeys.js` is unused. For another environment, set **both** `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Expo substitutes these static environment references when creating the JavaScript bundle. Changing the variables requires a new bundle/build; it does not remotely retarget an already installed binary.

The `preview` EAS profile explicitly selects the `preview` environment. Configure both public overrides there if a different backend is needed; otherwise EAS uses the working defaults from the source archive. For local development, Expo supports the same variables in an ignored local environment file. Never set a service-role key or an `sb_secret_` key as an `EXPO_PUBLIC_` variable.

Run the configuration guard before bundling:

```sh
npm run check:client-config
npm run test:client-config
```

The EAS `eas-build-post-install` hook runs the guard automatically after dependency installation and before native compilation. It uses Expo's local environment-file precedence as well as EAS-provided environment values. It rejects partial URL/key overrides, invalid origins, non-anon JWT roles, secret-key formats, and expired JWTs without logging key values. The guard checks configuration type and validity dates; the backend verifies the JWT signature and authorization. The current default pair was separately verified with an authenticated public-client HEAD request that returned HTTP 200 without returning records.

## Account and signing preparation

From a checkout containing the localization changes, install the locked dependencies and verify the active Expo account:

```sh
npm ci
npx --no-install eas whoami
```

The account must have access to the existing EAS project. If authentication is absent, sign in using the Expo CLI's normal interactive authentication flow on the build operator's machine. Keep credentials out of source files, pull-request comments, and chat.

For Android, use the signing key already associated with the app when updating an existing installation. For physical iOS devices, confirm the Apple team/signing setup and register each test device before creating the ad hoc build. The existing EAS CLI 16.28.0 supports the commands below; it does not support the newer `--refresh-ad-hoc-provisioning-profile` option. Use the normal interactive provisioning flow with this version.

## Android standalone preview

After the build operator confirms project access, signing, and build capacity:

```sh
npx --no-install eas build --profile preview --platform android
```

Open the completed build's install link on the Android test device and install its APK. Launch the app directly. The language picker and all interface dictionaries work without Metro or a network connection; features that fetch prayer/mosque/source content still need their normal data or an existing download.

## iPhone standalone preview

Register the test device through the existing Expo/Apple team workflow, then build:

```sh
npx --no-install eas device:create
npx --no-install eas build --profile preview --platform ios
```

Use the EAS installation link on a registered device. Only devices included in the ad hoc provisioning profile can install that build. Adding another device requires updating the profile through a new build or the documented re-signing workflow.

## iOS Simulator preview

Create a simulator artifact:

```sh
npx --no-install eas build --profile simulator --platform ios
```

On a Mac with Xcode/Simulator installed, run an appropriate simulator build from the build list:

```sh
npx --no-install eas build:run --platform ios
```

The Linux development workspace and ThinkCentre server inspected during release preparation do not have Xcode/Simulator. Neither has a configured Android native toolchain. JavaScript/Hermes export is available, but it is not an APK/IPA compilation or a physical-device test.

## Localization acceptance pass

Use a test installation to exercise:

1. First install: language choice appears before location permission and navigation.
2. Choose each of English, Bangla, Arabic, and Urdu; restart and confirm the explicit choice persists.
3. Change language in Settings, including Arabic ↔ Bangla or Urdu ↔ English. Check tabs, settings, back gestures, drawers, long text, and text input direction.
4. Confirm original Arabic scripture and Qibla compass bearings retain the correct direction.
5. Test dates, numbers, prayer labels, permissions, and VoiceOver/TalkBack.
6. Confirm interface language and Quran edition remain separate. Check both named Bangla editions and offline Quran downloads.
7. Verify an unavailable dua meaning is labeled as an English fallback. Download different locales and check they remain isolated while offline.
8. Review all translated interface text with native speakers before public release.

## Versioning and store release remain separate

The repository currently declares app version `1.0.0`, iOS build number `2`, and Android version code `1`. There is no configured auto-increment policy. EAS history includes an iOS production build numbered 2 and Android attempts numbered 1. Build history does not prove which versions were accepted by the stores. Confirm the current remote/store numbers before choosing the next store-release values; standalone previews retain the declared numbers.

For Google Play, prepare an AAB profile (`android.buildType: "app-bundle"`) or change the production Android profile during the store-release task; the existing production profile explicitly produces APKs. Do not assume the production command already generates an AAB. See [Android build artifact formats](https://docs.expo.dev/build-reference/apk/) and [version management](https://docs.expo.dev/build-reference/app-versions/).

The app uses Expo SDK 54's native build defaults. SDK/tool version overrides do not belong directly under `expo.android`; the invalid legacy fields were removed. If a future build requires an override, configure a supported build-properties plugin and validate it against the selected Expo SDK.

The Qibla sensor dependency is aligned to SDK 54 (`expo-sensors ~15.0.8`). A separate patch-maintenance update is still recommended for Expo, the development client, file system, fonts, and Babel preset. Existing Expo Doctor warnings about the locally installed EAS CLI and the `eas` npm script are also separate tooling cleanup; they do not change which preview profile is selected.

For catalog validation, content migration, and the completed Hermes export checks, see [LOCALIZATION.md](LOCALIZATION.md).
