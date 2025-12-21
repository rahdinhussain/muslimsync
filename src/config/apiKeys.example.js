// API Keys Configuration Example
// 
// IMPORTANT: Copy this file to apiKeys.js and add your actual API keys
// The apiKeys.js file is in .gitignore and will NOT be committed to version control
//
// To get a Google Places API key:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select an existing one
// 3. Enable "Places API" and "Places API (New)" in the API Library
// 4. Go to "Credentials" and create an API key
// 5. (Recommended) Restrict the API key to only "Places API" for security
// 6. Replace the value below with your actual API key

export const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY_HERE';

// To check if API key is set
export const isGooglePlacesKeySet = () => {
  return GOOGLE_PLACES_API_KEY && 
         GOOGLE_PLACES_API_KEY !== 'YOUR_GOOGLE_PLACES_API_KEY_HERE' &&
         GOOGLE_PLACES_API_KEY.trim().length > 0;
};







