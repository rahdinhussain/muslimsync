# Production Build Guide - App Store Submission

This guide will help you create a production build and submit it to the App Store.

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - You'll need this to submit to the App Store

2. **EAS CLI** (already installed)
   - Verify: `npx eas-cli --version`

3. **Expo Account** (free)
   - Sign up at: https://expo.dev/signup
   - Login: `npx eas-cli login`

## Step 1: Login to Expo

```bash
npx eas-cli login
```

Enter your Expo account credentials.

## Step 2: Configure App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Click **"My Apps"** → **"+"** → **"New App"**
4. Fill in:
   - **Platform**: iOS
   - **Name**: Muslim Sync
   - **Primary Language**: English (or your preferred language)
   - **Bundle ID**: `com.muslimsync.app` (must match app.json)
   - **SKU**: A unique identifier (e.g., `muslim-sync-001`)
   - **User Access**: Full Access (unless you have a team)

## Step 3: Build Production App

### Option A: Build on EAS (Recommended - Cloud Build)

```bash
# Build for iOS App Store
npx eas-cli build --platform ios --profile production
```

This will:
- Build your app in the cloud (takes 15-30 minutes)
- Generate an `.ipa` file ready for App Store submission
- Handle code signing automatically

**Follow the prompts:**
- Choose "Let EAS handle credentials" (recommended)
- EAS will create certificates and provisioning profiles automatically

### Option B: Build Locally (Advanced)

```bash
npx eas-cli build --platform ios --profile production --local
```

Requires Xcode and can be slower, but gives you more control.

## Step 4: Submit to App Store

Once the build completes:

```bash
# Submit to App Store Connect
npx eas-cli submit --platform ios --profile production
```

**Follow the prompts:**
- Select the build you just created
- EAS will upload it to App Store Connect

## Step 5: Complete App Store Listing

1. Go to App Store Connect → Your App
2. Fill in required information:

   **App Information:**
   - Category: Lifestyle or Reference
   - Privacy Policy URL (required)
   - Support URL

   **Pricing and Availability:**
   - Price: Free (or set your price)
   - Availability: Select countries

   **App Privacy:**
   - Answer privacy questions about data collection
   - Your app uses location data (for prayer times and Qibla)

   **Version Information:**
   - What's New: Describe your app features
   - Screenshots: Upload screenshots (required)
     - iPhone 6.7" (iPhone 14 Pro Max, etc.)
     - iPhone 6.5" (iPhone 11 Pro Max, etc.)
     - iPhone 5.5" (iPhone 8 Plus, etc.)
   - App Preview (optional but recommended)
   - Description: Write a compelling description
   - Keywords: Relevant keywords (e.g., "prayer, quran, islam, muslim, qibla")
   - Support URL
   - Marketing URL (optional)

## Step 6: Submit for Review

1. In App Store Connect, go to your app version
2. Click **"Submit for Review"**
3. Answer any export compliance questions
4. Wait for review (typically 24-48 hours)

## Important Notes

### Before Building:

1. **Update Version Number** (if needed):
   ```json
   // app.json
   "version": "1.0.0"  // Update to "1.0.1" for updates
   ```

2. **Test Your App Thoroughly:**
   - Test all features
   - Test on a physical device
   - Ensure location permissions work
   - Test offline functionality

3. **Privacy Policy** (Required):
   - You MUST have a privacy policy URL
   - It should explain what data you collect (location)
   - Host it on your website or use a free service

4. **App Icons & Splash:**
   - Ensure `assets/icon.png` is 1024x1024
   - Ensure `assets/splash.png` is high quality

### Common Issues:

**Build Fails:**
- Check EAS build logs: `npx eas-cli build:list`
- Ensure all dependencies are compatible
- Check for any missing assets

**Submission Fails:**
- Ensure you've completed all required fields in App Store Connect
- Check that your bundle ID matches exactly
- Verify certificates are valid

**Review Rejection:**
- Common reasons: Missing privacy policy, unclear app description, crashes
- Fix issues and resubmit

## Quick Commands Reference

```bash
# Check build status
npx eas-cli build:list

# View build details
npx eas-cli build:view [BUILD_ID]

# Check submission status
npx eas-cli submit:list

# Update app version
# Edit app.json: "version": "1.0.1"

# Build and submit in one go (after first time)
npx eas-cli build --platform ios --profile production --auto-submit
```

## Next Steps After Approval

1. **Monitor Reviews**: Check App Store Connect for user reviews
2. **Update Regularly**: Keep the app updated with bug fixes and features
3. **Marketing**: Share your app on social media, websites, etc.

## Need Help?

- EAS Documentation: https://docs.expo.dev/build/introduction/
- App Store Connect Help: https://help.apple.com/app-store-connect/
- Expo Forums: https://forums.expo.dev/

Good luck with your App Store submission! 🚀


