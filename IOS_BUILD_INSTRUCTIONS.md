# iOS Build Instructions

## Step 1: Start the Build

Run this command in your terminal:

```bash
npx eas build --profile development --platform ios
```

## What Happens Next:

1. **EAS will ask for your Apple ID:**
   - Enter the same Apple ID you used for your Developer account
   - Enter your password
   - If you have 2FA enabled, you'll need an app-specific password (see below)

2. **EAS will set up certificates automatically:**
   - It will create provisioning profiles
   - Generate certificates
   - Handle all the code signing setup

3. **Build Process:**
   - The build happens in the cloud (Expo's servers)
   - Takes about 15-25 minutes for iOS builds
   - You'll see progress updates in the terminal

4. **When Build Completes:**
   - You'll get a TestFlight link
   - Or a direct download link
   - You'll also get an email notification

## Step 2: Install on Your iPhone (via TestFlight)

1. **Install TestFlight:**
   - Download TestFlight from the App Store (if you don't have it)

2. **Accept the Invitation:**
   - Click the TestFlight link you received
   - Or check your email for the invitation
   - Accept the invitation in TestFlight

3. **Install the App:**
   - Open TestFlight app on your iPhone
   - Find "Muslim Sync" in the list
   - Tap "Install"
   - The app will appear on your home screen

## Alternative: Direct Installation

If you get a direct download link instead of TestFlight:
1. Open the link on your iPhone
2. Tap "Install"
3. You may need to trust the developer:
   - Go to Settings → General → VPN & Device Management
   - Tap the developer certificate
   - Tap "Trust"

## Step 3: Test Your App

Once installed:
- Open the "Muslim Sync" app on your iPhone
- Test all features thoroughly
- Make sure everything works as expected

## Step 4: Connect for Development (Optional)

If you want to connect to your development server:

```bash
npx expo start --dev-client
```

This allows you to:
- See console logs
- Make code changes and see updates (with fast refresh)
- Debug your app

## Two-Factor Authentication (2FA)

If you have 2FA enabled on your Apple ID:

1. **Create App-Specific Password:**
   - Go to https://appleid.apple.com
   - Sign in with your Apple ID
   - Go to "Security" section
   - Under "App-Specific Passwords", click "Generate Password"
   - Name it "EAS Build" or similar
   - Copy the password (you'll only see it once)

2. **Use the App-Specific Password:**
   - When EAS asks for your password, use the app-specific password instead of your regular Apple ID password

## Troubleshooting

### Build Fails with Certificate Errors:
- Make sure your Apple Developer account is fully activated
- Try: `npx eas credentials` to manage credentials manually
- Or delete and recreate credentials: `npx eas credentials --platform ios`

### Can't Install on Device:
- Make sure your iPhone is registered in your Apple Developer account
- For TestFlight: Make sure you accepted the invitation
- For direct install: Trust the developer certificate in Settings

### Build Takes Too Long:
- iOS builds typically take 15-25 minutes
- This is normal, be patient
- You'll get an email when it's done

## Next Steps After Testing

Once you've tested and everything works:

1. **Build for Production:**
   ```bash
   npx eas build --profile production --platform ios
   ```

2. **Submit to App Store:**
   - Go to https://appstoreconnect.apple.com
   - Create new app listing
   - Fill in app information
   - Upload the production build
   - Submit for review

Good luck! 🚀


