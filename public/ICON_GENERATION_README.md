# Icon and Social Card Generation

This directory contains all the necessary assets generated from the `favicon-dark-square-var1.svg` and `logo_upswitch_white_var2.svg` files.

## Generated Assets

### Favicons (SVG)
- ✅ `favicon-dark-square-var1.svg` - Main favicon (48x48)
- ✅ `favicon-16x16.svg` - Small favicon
- ✅ `favicon-32x32.svg` - Standard favicon

### Apple Touch Icon
- ✅ `apple-touch-icon.svg` - SVG version (180x180)
- ⚠️ `apple-touch-icon.png` - PNG version (needs generation)

### Android Chrome Icons
- ✅ `android-chrome-192x192.svg` - SVG version
- ✅ `android-chrome-512x512.svg` - SVG version
- ⚠️ PNG versions needed for better compatibility

### Social Cards
- ✅ `social-card-1200x630.html` - Updated with new logo
- ⚠️ `social-card-1200x630.png` - Needs generation from HTML

## Generating PNG Icons

### Option 1: Using Puppeteer (Recommended)

1. Install Puppeteer:
```bash
npm install puppeteer
```

2. Run the generation script:
```bash
node public/generate-icons.js
```

This will generate:
- `apple-touch-icon.png` (180x180)
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `favicon.png` (32x32) - convert to .ico manually

### Option 2: Manual Conversion

Use online tools or image editors:
1. Open `favicon-dark-square-var1.svg` in an image editor
2. Export at required sizes:
   - 16x16, 32x32 → `favicon.ico` (multi-size ICO)
   - 180x180 → `apple-touch-icon.png`
   - 192x192 → `android-chrome-192x192.png`
   - 512x512 → `android-chrome-512x512.png`

### Option 3: Using ImageMagick (if installed)

```bash
# Convert SVG to PNG at different sizes
convert favicon-dark-square-var1.svg -resize 180x180 apple-touch-icon.png
convert favicon-dark-square-var1.svg -resize 192x192 android-chrome-192x192.png
convert favicon-dark-square-var1.svg -resize 512x512 android-chrome-512x512.png

# Create multi-size ICO
convert favicon-dark-square-var1.svg -resize 16x16 favicon-16.png
convert favicon-dark-square-var1.svg -resize 32x32 favicon-32.png
convert favicon-16.png favicon-32.png favicon.ico
```

## Generating Social Card PNG

### Option 1: Browser Screenshot
1. Open `social-card-1200x630.html` in a browser
2. Set browser zoom to 100%
3. Take screenshot at exactly 1200x630 pixels
4. Save as `social-card-1200x630.png`

### Option 2: Using Puppeteer
```bash
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto('file://' + require('path').resolve('public/social-card-1200x630.html'));
  await page.screenshot({ path: 'public/social-card-1200x630.png' });
  await browser.close();
})();
"
```

## Current Status

✅ All SVG icons created
✅ Social card HTML updated with new logo
✅ Manifest.json updated
⚠️ PNG icons need generation (use scripts above)
⚠️ favicon.ico needs creation (convert from PNG)

## Notes

- SVG icons work in modern browsers and are preferred
- PNG versions are needed for older browsers and some platforms
- The favicon.ico file is a fallback for very old browsers
- All icons are based on `favicon-dark-square-var1.svg`

