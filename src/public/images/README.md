# PWA Assets Directory

## 📁 Required Files

Place the following PWA assets in this directory:

### App Icons (Required)
```
icon-72x72.png       (72x72 pixels)
icon-96x96.png       (96x96 pixels)
icon-128x128.png     (128x128 pixels)
icon-144x144.png     (144x144 pixels)
icon-152x152.png     (152x152 pixels)
icon-192x192.png     (192x192 pixels)
icon-384x384.png     (384x384 pixels)
icon-512x512.png     (512x512 pixels)
```

### Shortcut Icons (Optional)
```
icon-add-96x96.png           (96x96 pixels) - Add story icon
icon-home-96x96.png          (96x96 pixels) - Home icon
icon-notification-96x96.png  (96x96 pixels) - Notification icon
```

### Screenshots (Required for Skilled Level)
```
screenshot-mobile-1.png      (540x720 pixels) - Home page with map
screenshot-mobile-2.png      (540x720 pixels) - Add story page
screenshot-desktop-1.png     (1280x720 pixels) - Desktop view
```

## 🛠️ How to Generate

### Option 1: Online Tools (Recommended)

**PWA Builder Image Generator:**
1. Visit: https://www.pwabuilder.com/imageGenerator
2. Upload your `logo.png`
3. Download all generated icons
4. Extract to this directory

**Real Favicon Generator:**
1. Visit: https://realfavicongenerator.net/
2. Upload your `logo.png`
3. Configure settings
4. Download package
5. Extract icons to this directory

### Option 2: Manual Creation

**Using Image Editor (Photoshop, GIMP, Figma, etc.):**
1. Open `logo.png`
2. Resize to each required size
3. Export as PNG
4. Save with correct filename

**Using Canva:**
1. Create custom size canvas
2. Import logo
3. Resize and center
4. Download as PNG

### Option 3: Command Line (ImageMagick)

```bash
# Install ImageMagick first
# Then run:

convert logo.png -resize 72x72 icon-72x72.png
convert logo.png -resize 96x96 icon-96x96.png
convert logo.png -resize 128x128 icon-128x128.png
convert logo.png -resize 144x144 icon-144x144.png
convert logo.png -resize 152x152 icon-152x152.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 384x384 icon-384x384.png
convert logo.png -resize 512x512 icon-512x512.png
```

## 📸 How to Take Screenshots

### Using Chrome DevTools:

1. **Open your app** in Chrome
2. **Press F12** to open DevTools
3. **Toggle device toolbar** (Ctrl+Shift+M or Cmd+Shift+M)
4. **Set dimensions:**
   - Mobile: 540x720
   - Desktop: 1280x720
5. **Take screenshot:**
   - Click three dots menu in device toolbar
   - Select "Capture screenshot"
   - Or use Ctrl+Shift+P > "Capture screenshot"

### Screenshot Content Suggestions:

**Mobile Screenshot 1 (Home Page):**
- Show story map with markers
- Display navigation
- Show some story cards

**Mobile Screenshot 2 (Add Story):**
- Show add story form
- Display location picker
- Show image upload

**Desktop Screenshot (Wide View):**
- Show full layout with sidebar
- Display story map
- Show multiple stories

## ✅ Verification

After adding all assets:

1. **Build the app:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Check in Chrome DevTools:**
   - Open DevTools (F12)
   - Go to Application > Manifest
   - Verify all icons appear
   - Check for warnings

3. **Test Install:**
   - Install banner should appear
   - Or click install icon in address bar

## 📝 Notes

- All icons should be PNG format
- Use transparent background for icons
- Screenshots should show actual app content
- Maskable icons should have safe zone (80% of canvas)
- Test on real devices for best results

## 🎨 Design Tips

**For Icons:**
- Keep design simple and recognizable
- Use high contrast colors
- Avoid text in small icons
- Center the main element
- Leave padding around edges

**For Screenshots:**
- Use real content, not placeholders
- Show key features
- Use good lighting/contrast
- Avoid sensitive information
- Make it look appealing

## 🆘 Need Help?

See full documentation:
- `PWA_IMPLEMENTATION.md` - Complete guide
- `PWA_QUICK_START.md` - Quick setup
- Run: `npm run pwa:assets` - Show asset guide

## 📚 Resources

- [PWA Builder](https://www.pwabuilder.com/)
- [Real Favicon Generator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
