/**
 * Script to download Arabic fonts for the Quran app
 * Run: node scripts/download-fonts.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '../assets/fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Font URLs from Google Fonts (direct TTF download links)
const fonts = [
  {
    name: 'Amiri-Regular',
    url: 'https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf',
    file: 'Amiri-Regular.ttf'
  },
  {
    name: 'Amiri-Bold',
    url: 'https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Bold.ttf',
    file: 'Amiri-Bold.ttf'
  },
  {
    name: 'NotoSansArabic-Regular',
    url: 'https://github.com/google/fonts/raw/main/ofl/notosansarabic/NotoSansArabic%5Bwdth%2Cwght%5D.ttf',
    file: 'NotoSansArabic-Regular.ttf'
  },
  // Nastaliq font - optional, can be added manually later
  // {
  //   name: 'NotoNastaliqUrdu-Regular',
  //   url: 'https://example.com/NotoNastaliqUrdu-Regular.ttf',
  //   file: 'NotoNastaliqUrdu-Regular.ttf'
  // }
];

function downloadFont(font) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, font.file);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${font.name} already exists, skipping...`);
      resolve();
      return;
    }

    console.log(`Downloading ${font.name}...`);
    const file = fs.createWriteStream(filePath);
    
    https.get(font.url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded ${font.name}`);
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`✓ Downloaded ${font.name}`);
            resolve();
          });
        }).on('error', reject);
      } else {
        file.close();
        fs.unlinkSync(filePath);
        reject(new Error(`Failed to download ${font.name}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      reject(err);
    });
  });
}

async function downloadAllFonts() {
  console.log('Starting font download...\n');
  
  try {
    for (const font of fonts) {
      await downloadFont(font);
    }
    console.log('\n✓ All fonts downloaded successfully!');
    console.log('Fonts are located in: assets/fonts/');
    console.log('\nNext steps:');
    console.log('1. Update src/utils/fontLoader.js to load these fonts');
    console.log('2. Restart your Expo app');
  } catch (error) {
    console.error('Error downloading fonts:', error);
    process.exit(1);
  }
}

downloadAllFonts();

