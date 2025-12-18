# Quick Start Guide - Commemorative Coin Designer

## Installation & Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd coin-designer
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

Your application will be available at `http://localhost:3000`

## Using the Application

### Design Your Coin in 3 Steps:

#### 1. Obverse (Front) Side
- **Top Curve Text**: Enter text like "CERTIFIED NICE LIST"
- **Bottom Curve Text**: Enter a name or date
- **Upload Portrait**: Click "Upload Image" and select a photo

#### 2. Reverse (Back) Side
- **Top Curve Text**: Enter text like "MERRY CHRISTMAS"
- **Bottom Curve Text**: Enter year like "2025"
- **Upload Portrait**: Upload a themed image (e.g., Santa)

#### 3. Export
- Click "Export SVG Files"
- Two files will download:
  - `commemorative-coin-obverse.svg`
  - `commemorative-coin-reverse.svg`

## Image Tips

### Best Results:
- **Format**: PNG or JPG
- **Size**: At least 800x800 pixels
- **Content**: Clear subject, minimal background
- **Style**: High contrast works best for engraving

### Automatic Processing:
The app automatically:
- Converts to grayscale
- Crops to circular shape
- Enhances contrast
- Resizes optimally

## Keyboard Shortcuts

- `Ctrl/Cmd + S`: (Future) Save design
- `Ctrl/Cmd + E`: (Future) Export SVG

## Common Issues

### Images look too dark/light
Adjust the brightness/contrast settings in `imageProcessing.ts`:
```typescript
contrastAdjustment: 10,  // Increase for more contrast
brightnessAdjustment: 0, // Adjust from -100 to 100
```

### Text doesn't fit on curve
Keep text under 30 characters for best results.
The app limits to 50 characters.

### Preview looks different from SVG
The preview is a simplified visualization.
The exported SVG is the accurate version for laser engraving.

## Production Build

```bash
npm run build
npm run preview
```

Files will be in the `dist` folder.

## Customization

### Change Coin Size
Edit `src/utils/svgGenerator.ts`:
```typescript
coinDiameter: 40, // Change to desired size in mm
```

### Change Font
Edit `src/utils/svgGenerator.ts`:
```typescript
fontFamily: 'Arial, sans-serif', // Change to your font
fontSize: 14, // Adjust size
```

### Portrait Size
Edit portrait scale (0-1):
```typescript
portraitScale: 0.6, // 60% of coin diameter
```

## Need Help?

1. Check the main README.md
2. Review code comments in source files
3. Check browser console for error messages
4. Ensure Node.js version is 18+

## Next Steps

- Add templates (see `src/utils/templates.ts`)
- Integrate AI background removal API
- Add custom fonts
- Implement save/load functionality
