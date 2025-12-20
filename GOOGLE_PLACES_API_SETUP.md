# Google Places API Setup Guide

The Mosque Finder feature requires a Google Places API key to function. Follow these steps to set it up:

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown at the top
4. Click "New Project"
5. Enter a project name (e.g., "Muslim Sync")
6. Click "Create"

## Step 2: Enable Places API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Places API"
3. Click on "Places API" and click "Enable"
4. Also enable "Places API (New)" if available

## Step 3: Create an API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Your API key will be generated
4. **Important**: Click "Restrict Key" to secure it:
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API" and "Places API (New)"
   - Click "Save"

## Step 4: Add API Key to the App

1. Open `src/config/apiKeys.js` in your project
2. Replace `YOUR_GOOGLE_PLACES_API_KEY_HERE` with your actual API key:

```javascript
export const GOOGLE_PLACES_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

3. Save the file

## Step 5: Test the Feature

1. Restart your Expo development server
2. Navigate to the "Mosques" tab in the app
3. Allow location access when prompted
4. The app should now display nearby mosques

## Important Notes

- **Free Tier**: Google provides $200 in free credits per month, which is typically enough for thousands of requests
- **Billing**: Make sure billing is enabled in your Google Cloud project (you won't be charged unless you exceed the free tier)
- **Security**: Never commit your API key to version control. Consider using environment variables for production
- **Rate Limits**: The free tier allows up to 1,000 requests per day for Places API

## Troubleshooting

### "REQUEST_DENIED" Error
- Check that your API key is correct in `src/config/apiKeys.js`
- Verify that Places API is enabled in Google Cloud Console
- Ensure your API key restrictions allow Places API

### "No mosques found"
- This might be normal if there are no mosques in your area
- Try refreshing your location
- The search radius is 5km - mosques outside this range won't appear

### Location Permission Issues
- Make sure location permissions are granted in your device settings
- On iOS, you may need to add location permissions to `app.json`

## Need Help?

If you encounter issues, check:
1. Google Cloud Console for API usage and errors
2. The app's console logs for detailed error messages
3. Contact support at contact@muslimsync.com






