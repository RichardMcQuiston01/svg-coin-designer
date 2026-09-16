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

The **Export SVG Files** and **Reset Design** buttons sit in the top-right corner of the
header, next to a gear icon for Display Settings - both stay visible while you edit.
On a desktop-width window the whole editor fits without scrolling.

### Design Your Coin in 4 Steps:

#### 1. Obverse (Front) Side

The **Obverse (Front)** / **Reverse (Back)** tabs switch which side you're editing; each
side keeps its own fields.

- **Top Curve Text**: Enter text like "CERTIFIED NICE LIST" (50 characters max)
- **Bottom Curve Text**: Enter a name or date (50 characters max)
- **Upload Portrait**: Click "Upload Image" and select a photo

#### 2. Reverse (Back) Side

Click the **Reverse (Back)** tab, then:

- **Top Curve Text**: Enter text like "MERRY CHRISTMAS"
- **Bottom Curve Text**: Enter year like "2025"
- **Upload Portrait**: Upload a themed image (e.g., Santa)

#### 3. Display Settings

Click the gear icon in the header to open the **Display Settings** panel. It applies to
both sides and updates the previews live:

- **Portrait Size**: How much of the coin the portrait fills. 0.25 to 0.90 in steps of
  0.05, defaults to 0.85.
- **Font**: Sans Serif (Arial), Serif (Times New Roman), or Monospace (Courier New),
  applied to the curved text.
- **Text Offset**: The curved text's radius as a fraction of the coin radius - in effect,
  the gap between the dashed portrait guide circle and the text. 0.5 to 0.9 in steps of
  0.01, defaults to 0.85.

All three settings are remembered in your browser (`localStorage`) and restored the next
time you open the app - close the settings panel with the &times; button, the backdrop,
or the Escape key.

#### 4. Export

- Click "Export SVG Files"
- Two files will download:
  - `commemorative-coin-obverse.svg`
  - `commemorative-coin-reverse.svg`

Each side needs at least one of a top text, a bottom text, or a portrait before the
export will run. If either side is completely empty you will get a warning instead of
a download.

To start over, click **Reset Design**. It asks for confirmation, then reloads the page.
There is no undo, and the design's text and images are not saved between reloads (unlike
Display Settings, which are).

## Laser Software Import

The exported SVG color-codes its shapes for laser software that assigns an operation per
imported color (LightBurn, xTool Creative Space):

- **Blue** (`#0000FF`) - the coin outline and the dashed portrait guide circle. Intended
  for a **Score** (light line) operation.
- **Black** (`#000000`) - the curved text. Intended for an **Engrave** (fill) operation.

Neither tool has a universal built-in meaning for these colors - you still assign the
operation to each layer once after import, but the color split does the grouping for
you.

The curved text itself is already exported as outline paths, not a live `<text>`
element - xTool Creative Space's SVG importer does not support `<textPath>` (confirmed
by testing a real export in it) and would otherwise drop the text entirely. There is
nothing to convert yourself; this is why the standalone build is close to 2 MB rather
than a few hundred KB - see [TECHNOLOGY.md](TECHNOLOGY.md#svg-generation).

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

Portrait size, font, and text offset are all adjustable at runtime from the gear-icon
Display Settings panel - the sections below are for changing the *defaults*, or options
the UI doesn't expose a control for.

### Change the Portrait Size or Text Offset Default

Edit `createDefaultDisplaySettings()` in `src/svgGenerator.ts`:

```typescript
export function createDefaultDisplaySettings(): CoinDisplaySettings {
  return {
    portraitScale: 0.85,   // 85% of the coin radius
    fontFamily: FONT_OPTIONS[0]!.value,
    textRadiusScale: 0.85, // 85% of the coin radius
  };
}
```

### Add or Change a Font Option

The Font picker's three options come from `FONT_OPTIONS` in `src/svgGenerator.ts`:

```typescript
export const FONT_OPTIONS: FontOption[] = [
  {id: 'sans', label: 'Sans Serif (Arial)', value: 'Arial, Helvetica, sans-serif'},
  {id: 'serif', label: 'Serif (Times New Roman)', value: "'Times New Roman', Times, serif"},
  {id: 'mono', label: 'Monospace (Courier New)', value: "'Courier New', Courier, monospace"},
];
```

Add an entry to offer a fourth font in the picker; the `value` is used as-is for the
`<text>` element's `font-family`, in both the live preview and the export, so pick a
family your laser software (and most browsers, for the preview) can already resolve
without embedding a font file.

### Change the Coin Size

The exported SVG uses a fixed 1000x1000 viewBox, with the coin outline at 90% of it.
Scale the file to your target diameter in your laser software. The `coinDiameter` and
`dpi` fields on `SvgConfig` are not currently applied to the output.

To change the proportions inside the SVG, edit the radius maths in
`generateCoinSideSvg()` in `src/svgGenerator.ts`:

```typescript
const coinRadius = (svgSize / 2) * 0.9;              // Coin outline
const textRadius = coinRadius * config.textRadiusScale; // Text baseline (default 0.85)
```

## Need Help?

1. Check the main [README](../README.md) and [TECHNOLOGY.md](TECHNOLOGY.md)
2. Review code comments in source files
3. Check browser console for error messages
4. Ensure Node.js version is 18+

## Next Steps

- Wire up the templates defined in `src/templates.ts` - they are not yet used by the UI
- Integrate AI background removal
- Persist the design content (text and portraits), not just Display Settings, to
  `localStorage`

See [ROADMAP.md](ROADMAP.md) for the full list.
