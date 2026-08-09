# Quick Start Guide - Commemorative Coin Designer

## Installation & Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd svg-coin-designer
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

Your application will be available at `http://localhost:3000`

## Using the Application

### Design Your Coin in 4 Steps:

#### 1. Obverse (Front) Side

- **Top Curve Text**: Enter text like "CERTIFIED NICE LIST" (50 characters max)
- **Bottom Curve Text**: Enter a name or date (50 characters max)
- **Upload Portrait**: Click "Upload Image" and select a photo

#### 2. Reverse (Back) Side

- **Top Curve Text**: Enter text like "MERRY CHRISTMAS"
- **Bottom Curve Text**: Enter year like "2025"
- **Upload Portrait**: Upload a themed image (e.g., Santa)

#### 3. Portrait Size

Use the **Portrait Size** control below the two editors to set how much of the coin the
portrait fills. It accepts 0.25 to 0.90 in steps of 0.05 and defaults to 0.85. The
setting applies to both sides and updates the previews live.

#### 4. Export

- Click "Export SVG Files"
- Two files will download:
  - `commemorative-coin-obverse.svg`
  - `commemorative-coin-reverse.svg`

Each side needs at least one of a top text, a bottom text, or a portrait before the
export will run. If either side is completely empty you will get a warning instead of
a download.

To start over, click **Reset Design**. It asks for confirmation, then reloads the page.
There is no undo, and nothing is saved between reloads.

## Image Tips

### Best Results:

- **Format**: PNG, JPEG, or WebP
- **Maximum size**: 10 MB per file
- **Dimensions**: At least 800x800 pixels
- **Content**: Clear subject, minimal background
- **Style**: High contrast works best for engraving

### Automatic Processing:

Every upload is processed on-device before it reaches the preview:

- Scaled to cover an 800x800 canvas, centred
- Contrast raised by +10
- Converted to grayscale
- Cropped to a circle

Background removal exists but is off by default, and brightness is left at 0.

## Common Issues

### Images look too dark/light

Adjust the defaults in `createDefaultProcessingOptions()` in `src/imageProcessing.ts`:

```typescript
contrastAdjustment: 10,  // Increase for more contrast
brightnessAdjustment: 0, // Adjust from -100 to 100
```

### Text doesn't fit on curve

Keep text under 30 characters for best results. The inputs cap at 50 characters.
Text is automatically upper-cased in the exported SVG.

### Preview looks different from SVG

The preview is a simplified visualization. The exported SVG is the accurate version
for laser engraving.

### Nothing downloads when I click Export

Both sides must have some content - see step 4 above. If the design is valid and you
still get one file instead of two, check that your browser is not blocking the second
download; the two files are requested 100 ms apart.

## Production Build

```bash
npm run build
npm run preview
```

The build produces a single self-contained `dist/index.html` with all JavaScript and
CSS inlined, so it can be opened directly in a browser without a server.
`npm run preview` serves it at `http://localhost:4173` if you would rather test over
HTTP.

## Customization

### Change the Portrait Size Default

Edit `createDefaultSvgConfig()` in `src/svgGenerator.ts`, and the matching initial
value in `src/CoinEditor.ts`:

```typescript
portraitScale: 0.85, // 85% of the coin radius
```

### Change the Font

Font family and size are hard-coded in the `<text>` element inside
`createCurvedTextPath()` in `src/svgGenerator.ts`:

```typescript
<text font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">
```

The `fontFamily` and `fontSize` fields on `SvgConfig` are not currently read, so
editing them has no effect.

### Change the Coin Size

The exported SVG uses a fixed 1000x1000 viewBox, with the coin outline at 90% of it.
Scale the file to your target diameter in your laser software. The `coinDiameter` and
`dpi` fields on `SvgConfig` are not currently applied to the output.

To change the proportions inside the SVG, edit the radius maths in
`generateCoinSideSvg()` in `src/svgGenerator.ts`:

```typescript
const coinRadius = (svgSize / 2) * 0.9;  // Coin outline
const textRadius = coinRadius * 0.85;    // Text baseline
```

## Need Help?

1. Check the main [README](../README.md) and [TECHNOLOGY.md](TECHNOLOGY.md)
2. Review code comments in source files
3. Check browser console for error messages
4. Ensure Node.js version is 18+

## Next Steps

- Wire up the templates defined in `src/templates.ts` - they are not yet used by the UI
- Integrate AI background removal
- Add custom fonts
- Implement save/load functionality

See [ROADMAP.md](ROADMAP.md) for the full list.
