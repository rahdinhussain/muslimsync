# Muslim Sync 1.0.3 — compact prayer home

The city label in the top card opens location editing. The toolbar provides refresh and an accessible icon to save or update the selected month offline. Prayer times follow immediately, with separate Start and End columns for every prayer. The three approximate solar restrictions are directly beneath the prayer table. Timetable boundaries, school guidance, Islamic midnight, and polar estimates retain their existing calculations and explanations.

Home owns its Location and PrayerTimeCalculation routes. Saving a location returns to the calling screen. Settings has an explicit menu root, and tapping the Settings tab always returns to that menu. Shortcuts into Settings preserve the menu underneath.

Validation: 39 Node tests pass, including navigation through the real StackRouter and TabRouter, first-run location setup, Settings re-entry, all prayer and solar boundaries in LTR/RTL, and offline-save retry. All eight language catalogs validate. iOS Hermes export succeeds. Browser rendering of the native components passes at 320/375/430 pixels in English/Arabic and light/dark modes, with no horizontal overflow and all five prayers visible near the top. This does not replace testing on a physical iPhone.

Build identifiers: version 1.0.3, iOS build 6, Android version code 2026112401. The production Android profile builds both the signed AAB and APK in one native build.

The iOS cloud build was rejected before scheduling because the Expo free monthly build allowance is exhausted. Expo reports reset on December 1, 2026. No billing plan was changed. To build after quota is available:

```sh
npx eas build --platform ios --profile production --non-interactive
```

After that build succeeds, submit that exact build ID to App Store Connect with `eas submit --platform ios --id BUILD_ID --non-interactive`. Do not submit an older build by choosing latest without checking its version.
