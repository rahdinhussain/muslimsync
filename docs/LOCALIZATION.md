# Mobile localization

## Supported languages and startup

The mobile interface ships with English (`en`), Bangla (`bn`), Arabic (`ar`), and Urdu (`ur`). Every interface catalog is bundled in the application; choosing a language and using translated interface text do not require a network connection.

`LocaleProvider` reads `@muslim_sync_language_v1` from AsyncStorage before mounting the main navigator. A valid saved choice wins over the device language. Without a saved choice, the device language only suggests a supported option: the language picker still requires an explicit confirmation. Unsupported device languages suggest English.

The first-launch picker appears before screens that request location permission. A failed preference write leaves the picker open and displays a translated error, allowing the user to retry. Settings → Language uses the same picker. Saving immediately updates the interface and the preference on that installation. Preferences are not synchronized to an account or to the separate website.

## Catalogs and code

- `i18n/languages.json`: shared locale codes, native names, writing directions, and Intl locales.
- `i18n/locales/<locale>/common.json`: shared actions, navigation, language-picker text, prayer labels, and common status messages.
- `i18n/locales/<locale>/mobile.json`: mobile-specific interface messages.
- `i18n/native/<locale>.json`: localized iOS permission descriptions.
- `src/i18n/index.js`: bundled i18next setup, plural-rule data, interpolation, and date/number/time presentation helpers.
- `src/context/LocaleContext.js`: hydration, explicit persistence, and the selected interface direction.
- `src/components/LocalizedPrimitives.js`: explicit Text, TextInput, and SafeAreaView wrappers for writing direction. They do not translate text automatically or patch React Native globals.

Call `tr('section.message', { value1: value })` for mobile messages and `tr('actions.save', { ns: 'common' })` for shared messages. Components displaying translated text must subscribe to `useAppLocale()` so a language change rerenders them. Resolve translated labels during rendering; do not store translated strings in module-level constants or use them as IDs.

Use whole messages with `{{variable}}` interpolation. Keep navigation route names, database values, cache IDs, API parameters, and prayer-calculation IDs stable. Number interpolation uses the selected Intl locale. `formatDate`, `formatNumber`, and `formatPrayerTime` format visible values without changing stored dates, numbers, or prayer times. Hijri month labels use the existing API's numeric month; localization does not substitute a different calendar calculation.

The initial implementation contains 362 mobile messages and 73 common messages per language. The included Bangla, Arabic, and Urdu interface catalogs were drafted during implementation. They are bundled messages rather than runtime machine-translation overlays, and they have not yet received native-speaker review. Review wording and typography with native speakers before a public release.

## Keeping web and mobile aligned

The repositories share the language registry and common namespace. Each platform owns its platform-specific catalog. When a shared message changes, update all four languages and synchronize the shared assets explicitly:

```sh
node scripts/sync-shared-locales.mjs --from /path/to/other/repository
node scripts/sync-shared-locales.mjs --from /path/to/other/repository --check
npm run check:locales
```

The sync script copies only `languages.json` and `common.json`; it does not copy mobile or web catalogs. The checker verifies required keys, nonempty messages, matching interpolation placeholders, and compatible plural variants. English is the fallback catalog, not a substitute for supplying the other supported catalogs.

To add a language, add its registry entry, complete both namespaces, register its i18next resource and plural data, and add its native locale configuration. Add the equivalent website resources in the web repository. Validate real layouts and content sources before presenting that language as supported.

## RTL and native behavior

Arabic and Urdu use RTL. The selected application locale sets the root, screen, modal, text, and input direction. Logical start/end spacing and directional icons mirror UI controls. React Navigation 6 stack gestures compensate when the selected application direction differs from the native device direction. Changing language does not force `I18nManager`, restart the app, or require a device language change.

Original Arabic scripture keeps RTL regardless of interface language. Transliteration stays LTR. Quran meaning text follows the separately selected edition's direction. The Qibla compass retains physical LTR coordinates so a layout change cannot reverse its bearings.

Native permission dialogs and system UI follow operating-system language rules. The app supplies the supported native locale declarations and localized iOS location descriptions; an in-app preference does not itself change the OS language.

## Quran editions are independent content

The app interface language and Quran edition are separate preferences. On first use, if there is no prior Quran preference, the app suggests `en.sahih` for English, `bn.bengali` for Bangla, or `ur.maududi` for Urdu. Arabic starts without an additional translation. After initialization, changing the interface language preserves the saved Quran edition, including an explicit deselection.

Two named Bangla editions are available:

- `bn.bengali`: Muhiuddin Khan (মুহিউদ্দীন খান).
- `bn.hoque`: Zohurul Hoque (জহুরুল হক).

`src/i18n/quran-sources.cjs` centralizes provider endpoints. AlQuran Cloud requests use the exact selected edition's singular endpoint. Verified Quran.com fallbacks use Saheeh International resource 20, Pickthall 19, Yusuf Ali 22, and Urdu Maududi 97. Mustafa Khattab uses the named Allah Edition from the Quran API catalog. Never substitute an unrelated translator, different language, or guessed provider ID to make a request succeed.

Provider catalogs used for those IDs:

- <https://api.alquran.cloud/v1/edition/language/bn>
- <https://api.quran.com/api/v4/resources/translations?language=en>
- <https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions.json>

Earlier application code contained mismatched fallback IDs, including an English Maududi resource for the Urdu selection. Translation downloads now use `@quran_translation_v2_<edition>`. Legacy translation data remains on disk but is not presented under a verified edition name; users see a notice to download those translations again. Arabic and audio downloads remain available. Generic Arabic surah caches do not supply translation text without an independently identified edition. Missing edition text is clearly shown as unavailable.

The original Arabic, named source translations, transliterations, reciter names, surah names, and source references are not machine translated as interface strings.

## Dua translations and offline caches

Interface localization works without a database migration. Translated religious content uses the optional additive migration `sql/20261112_dua_translations.sql`, applied after the original dua schema in a trusted database administration workflow.

`dua_translations` stores `(dua_id, locale)` with translated title, meaning, optional transliteration, source attribution, review status, and update time. `dua_category_translations` stores `(category_id, locale)` names and review status. Row-level security exposes only reviewed rows to public/authenticated readers; publishing remains a privileged operation. Never put a service-role credential in the app.

The release workflow for content is:

1. Apply the migration to the intended environment after reviewing it against that database.
2. Add translations from an attributed source with `reviewed = false`.
3. Have an appropriate reviewer check the meaning, title, transliteration, and source.
4. Publish reviewed rows through the trusted administration workflow.

No live migration or religious-content translation seeding was performed as part of this code change. Missing tables, unavailable translations, and optional query failures preserve the existing content. Non-English screens explicitly label an English meaning fallback instead of implying it is translated. Reviewed translation source attribution is displayed, and original Arabic remains intact.

Dua text downloads use `@dua_downloaded_text_v2_<locale>_<duaId>` and store the requested locale, actual content language, source, and schema version. Changing language does not reuse another language's cache entry. Legacy unmarked text downloads are accepted only as English. Text-only downloads are indexed independently of audio downloads. Audio remains shared across locales because it is the original recitation.

## Validation

Run from the repository root:

```sh
npm ci
npm run check:locales
npm run test:localization
npx expo config --type public
npx expo export --platform ios --platform android --output-dir /tmp/muslimsync-localized-bundle
git diff --check
```

The implementation was checked with all 10 localization behavior tests and all 1,740 catalog values passing. Tests exercise first-launch confirmation, restart persistence, unsupported/device locale fallbacks, write failures, RTL state, localized numbers/dates, edition independence, reviewed content rules, locale-isolated downloads, optional-table fallback, and rejection of unverified legacy Quran editions. The tests run actual locale/provider/storage modules with native I/O replaced. They do not simulate the complete native UI.

Both iOS and Android production Hermes bundles exported successfully. Direct AlQuran requests for Al-Fatihah returned the requested `bn.bengali`, `bn.hoque`, `en.sahih`, and `ur.maududi` identifiers with seven verses. A source audit checked all 31 JavaScript modules and found no unresolved literal translation keys. Remaining literal JSX text consists of branding/contact information and preserved source content.

`react-test-renderer` emits its upstream deprecation notice in the test runner; the expected simulated storage failure is also logged. Neither is a failing test.

## Native build and release

`app.json` now configures the Expo SDK 54 `expo-localization` plugin with supported locales, RTL support, Android dynamic locale support, and native language files. The installed and locked plugin version 17.0.9 supports these options (`package.json` allows compatible versions through `~17.0.7`). These native settings require a new development/production binary; publishing JavaScript alone does not add them to an already installed binary.

Before a store submission, increment `ios.buildNumber` and `android.versionCode` as appropriate. The existing production EAS profile has no automatic version increment configured. Build using the project's existing signing and distribution process.

Real-device and simulator UI checks, permission-dialog localization, TalkBack/VoiceOver behavior, native typography, store builds, and App Store/Play Store submission were not performed in this environment. Validate first install, restart, offline operation, every settings screen, drawer layouts, and both RTL languages on iOS and Android before release. No build was published or submitted by this change.
