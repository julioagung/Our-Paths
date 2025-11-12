/**
 * Script to generate PWA icons and screenshots
 * Run: node generate-pwa-assets.js
 * 
 * Note: This is a helper script. For production, use proper image editing tools
 * or online PWA asset generators like:
 * - https://www.pwabuilder.com/imageGenerator
 * - https://realfavicongenerator.net/
 */

const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'src', 'public', 'images');

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

console.log('PWA Asset Generation Guide');
console.log('===========================\n');

console.log('To complete your PWA setup, you need to create the following assets:\n');

console.log('1. APP ICONS (Required):');
console.log('   Create these icon sizes from your logo.png:');
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
iconSizes.forEach(size => {
  console.log(`   - icon-${size}x${size}.png (${size}x${size} pixels)`);
});

console.log('\n2. SHORTCUT ICONS (Optional but recommended):');
console.log('   - icon-add-96x96.png (96x96 pixels) - Add story icon');
console.log('   - icon-home-96x96.png (96x96 pixels) - Home icon');
console.log('   - icon-notification-96x96.png (96x96 pixels) - Notification icon');

console.log('\n3. SCREENSHOTS (Required for "Skilled" level):');
console.log('   Mobile screenshots (540x720 pixels):');
console.log('   - screenshot-mobile-1.png - Home page with story map');
console.log('   - screenshot-mobile-2.png - Add story page');
console.log('   \n   Desktop screenshot (1280x720 pixels):');
console.log('   - screenshot-desktop-1.png - Desktop view');

console.log('\n4. TOOLS TO GENERATE ICONS:');
console.log('   Online tools (recommended):');
console.log('   - https://www.pwabuilder.com/imageGenerator');
console.log('   - https://realfavicongenerator.net/');
console.log('   - https://favicon.io/');
console.log('   \n   Or use image editing software:');
console.log('   - Photoshop, GIMP, Figma, Canva, etc.');

console.log('\n5. HOW TO TAKE SCREENSHOTS:');
console.log('   - Open your app in browser');
console.log('   - Press F12 to open DevTools');
console.log('   - Toggle device toolbar (Ctrl+Shift+M)');
console.log('   - Set dimensions (540x720 for mobile, 1280x720 for desktop)');
console.log('   - Take screenshot using DevTools screenshot feature');

console.log('\n6. SAVE ALL ASSETS TO:');
console.log(`   ${imagesDir}`);

console.log('\n7. VERIFY YOUR PWA:');
console.log('   After adding assets:');
console.log('   - Run: npm run build');
console.log('   - Run: npm run preview');
console.log('   - Open Chrome DevTools > Application > Manifest');
console.log('   - Check for warnings or errors');

console.log('\n===========================');
console.log('Setup complete! Follow the steps above to add your PWA assets.');
console.log('===========================\n');

// Create a README in images folder
const readmePath = path.join(imagesDir, 'PWA-ASSETS-README.txt');
const readmeContent = `PWA Assets Required
===================

Place the following files in this directory:

APP ICONS:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

SHORTCUT ICONS:
- icon-add-96x96.png
- icon-home-96x96.png
- icon-notification-96x96.png

SCREENSHOTS:
- screenshot-mobile-1.png (540x720)
- screenshot-mobile-2.png (540x720)
- screenshot-desktop-1.png (1280x720)

Use online tools like:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

Or create them manually using image editing software.
`;

fs.writeFileSync(readmePath, readmeContent);
console.log(`Created guide: ${readmePath}`);
