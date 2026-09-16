# API Documentation - Coin Designer

## Architecture Overview

The application follows a **component-based architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                      main.ts                            │
│                 (Application Entry)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  CoinEditor.ts                          │
│              (Main Orchestrator)                         │
└──────┬────────────┬────────────┬────────────────────────┘
       │            │            │
       ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│TextInput │  │  Image   │  │  Coin    │
│Component │  │ Uploader │  │ Preview  │
└──────────┘  └──────┬───┘  └──────────┘
                     │
                     ▼
              ┌─────────────┐
              │Image        │
              │Processing   │
              │Utils        │
              └─────────────┘
                     │
                     ▼
              ┌─────────────┐
              │SVG          │
              │Generator    │
              │Utils        │
              └─────────────┘
```

## Core Modules

### 1. Types (`src/index.ts`)

All TypeScript interfaces and types. `src/` is flat - there is no `src/types/`
subdirectory.

#### Key Types:

**CoinSide**
```typescript
interface CoinSide {
  topCurveText: string;
  bottomCurveText: string;
  coinPortrait: string | null;
  originalImage: File | null;
}
```

**CoinDesign**
```typescript
interface CoinDesign {
  obverse: CoinSide;
  reverse: CoinSide;
}
```

**CoinDisplaySettings** - shared by the live preview and the SVG export; edited from the
gear-icon Display Settings panel and persisted to `localStorage`
```typescript
interface CoinDisplaySettings {
  portraitScale: number;   // portrait diameter as a fraction of the coin radius
  fontFamily: string;      // curved text font-family, picked from FONT_OPTIONS
  textRadiusScale: number; // curved text radius as a fraction of the coin radius
}
```

**FontOption** - one entry in the Font picker
```typescript
interface FontOption {
  id: string;
  label: string;
  value: string; // CSS font-family value
}
```

**ImageProcessingOptions**
```typescript
interface ImageProcessingOptions {
  removeBackground: boolean;
  convertToGrayscale: boolean;
  circularCrop: boolean;
  targetSize: number;
  contrastAdjustment: number;
  brightnessAdjustment: number;
}
```

### 2. Components

#### TextInput (`src/TextInput.ts`)

**Purpose**: Reusable text input with label and character counter.

**Usage**:
```typescript
import {createTextInput} from './TextInput';

const input = createTextInput({
  id: 'myInput',
  name: 'myInput',
  label: 'Enter Text',
  placeholder: 'Type here...',
  value: '',
  maxLength: 50,
  onChange: (value: string) => {
    console.log('Value changed:', value);
  },
});

document.body.appendChild(input);
```

**API**:
- `createTextInput(config: TextInputConfig): HTMLDivElement`
- `updateTextInputValue(inputId: string, value: string): void`

#### NumberInput (`src/NumberInput.ts`)

**Purpose**: Labelled range slider with a live numeric readout. Backs every Display
Settings control (Portrait Size, Text Offset).

**Usage**:
```typescript
import {createNumberInput} from './NumberInput';

const slider = createNumberInput({
  id: 'portraitScale',
  name: 'portraitScale',
  label: 'Portrait Size',
  value: 0.85,
  min: 0.25,
  max: 0.9,
  step: 0.05,
  unit: '%',
  helperText: 'Adjust the portrait diameter as a percentage of the coin radius',
  onChange: (value: number) => {
    console.log('Value changed:', value);
  },
});

document.body.appendChild(slider);
```

**API**:
- `createNumberInput(config: NumberInputConfig): HTMLDivElement`
- `updateNumberInputValue(inputId: string, value: number): void`

#### ImageUploader (`src/ImageUploader.ts`)

**Purpose**: Image upload with automatic processing.

**Usage**:
```typescript
import {createImageUploader} from './ImageUploader';
import {createDefaultProcessingOptions} from './imageProcessing';

const uploader = createImageUploader({
  id: 'imageUpload',
  label: 'Upload Image',
  acceptedTypes: 'image/png,image/jpeg',
  currentImage: null,
  processingOptions: createDefaultProcessingOptions(),
  onImageUpload: (imageData: string, file: File) => {
    console.log('Image uploaded:', imageData);
  },
  onError: (error: string) => {
    console.error('Upload error:', error);
  },
});

document.body.appendChild(uploader);
```

**API**:
- `createImageUploader(config: ImageUploaderConfig): HTMLDivElement`

#### CoinPreview (`src/CoinPreview.ts`)

**Purpose**: Live preview of coin design. Renders the same curved-text geometry
(`src/curvedText.ts`) as the SVG export, so the screen and the exported file agree.

**Usage**:
```typescript
import {createCoinPreview, updateCoinPreview} from './CoinPreview';
import {createDefaultDisplaySettings} from './svgGenerator';

const preview = createCoinPreview({
  id: 'preview',
  title: 'Obverse',
  coinSide: {
    topCurveText: 'TOP TEXT',
    bottomCurveText: 'BOTTOM TEXT',
    coinPortrait: null,
    originalImage: null,
  },
  settings: createDefaultDisplaySettings(), // optional; defaults if omitted
});

document.body.appendChild(preview);

// Update preview
updateCoinPreview('preview', updatedCoinSide, updatedSettings);
```

**API**:
- `createCoinPreview(config: CoinPreviewConfig): HTMLDivElement`
- `updateCoinPreview(previewId: string, coinSide: CoinSide, settings?: CoinDisplaySettings): void`

#### DonateWidget (`src/DonateWidget.ts`)

**Purpose**: Dismissible floating donation card, mounted separately from the editor so
it stays fixed on screen while the page scrolls. Dismissal is stored in `localStorage`
under `coinDesigner.donateDismissed`.

**Usage**:
```typescript
import {mountDonateWidget} from './DonateWidget';

mountDonateWidget(); // appends the card to document.body if not already dismissed
```

#### CoinEditor (`src/CoinEditor.ts`)

**Purpose**: Main editor orchestrating all components.

**Usage**:
```typescript
import {createCoinEditor} from './CoinEditor';

const design = createCoinEditor('app');
console.log('Current design:', design);
```

**API**:
- `createCoinEditor(containerId: string): CoinDesign`

`createCoinEditor` builds the header (title, gear-icon Display Settings, Export/Reset),
the tabbed Obverse/Reverse editor, and the live preview column, then returns the
`CoinDesign` it will keep mutating as the user edits. `CoinDisplaySettings` is created
internally (loaded from `localStorage` if present) and is not returned - reach it only
through the UI.

### 3. Utilities

#### Image Processing (`src/imageProcessing.ts`)

**Purpose**: Image manipulation for coin portraits.

**Key Functions**:

```typescript
// Load an image file
async function loadImage(file: File): Promise<HTMLImageElement | null>

// Process image with options
async function processImage(
  file: File,
  options: ImageProcessingOptions
): Promise<ProcessingResult>

// Create default options
function createDefaultProcessingOptions(): ImageProcessingOptions
```

**Example**:
```typescript
import {processImage, createDefaultProcessingOptions} from './imageProcessing';

const options = createDefaultProcessingOptions();
options.contrastAdjustment = 20; // More contrast
options.brightnessAdjustment = 10; // Brighter

const result = await processImage(imageFile, options);
if (result.success && result.imageData) {
  // Use processed image
  img.src = result.imageData;
} else {
  console.error(result.errorMessage);
}
```

**Image Processing Pipeline**:
1. Load image → HTMLImageElement
2. Resize to target size
3. Remove background (optional)
4. Adjust brightness
5. Adjust contrast
6. Convert to grayscale (optional)
7. Apply circular crop (optional)
8. Export as base64

#### SVG Generator (`src/svgGenerator.ts`)

**Purpose**: Generate laser-engravable SVG files. Also the home of the display-settings
defaults and constants (`createDefaultDisplaySettings`, `FONT_OPTIONS`,
`LASER_ENGRAVE_COLOR`, `LASER_SCORE_COLOR`) that `CoinPreview.ts` and `CoinEditor.ts`
import, per the documented dependency direction in [TECHNOLOGY.md](TECHNOLOGY.md).

**Key Functions**:

```typescript
// Generate SVGs for both sides
async function generateCoinSvgs(
  design: CoinDesign,
  config: SvgConfig
): Promise<SvgGenerationResult>

// Download a single SVG
function downloadSvg(svgContent: string, filename: string): void

// Download both coin SVGs
function downloadCoinSvgs(
  result: SvgGenerationResult,
  baseName: string
): void

// Create default config (coinDiameter, dpi, fontSize, plus the display-settings defaults)
function createDefaultSvgConfig(): SvgConfig

// Create just the display-settings defaults (portraitScale, fontFamily, textRadiusScale)
function createDefaultDisplaySettings(): CoinDisplaySettings
```

**Key Constants**:

```typescript
// The Font picker's options; `value` is used as-is as the CSS font-family
const FONT_OPTIONS: FontOption[]

// Stroke/fill colors applied to the export so LightBurn/xTool can auto-layer by color
const LASER_ENGRAVE_COLOR = '#000000'; // curved text
const LASER_SCORE_COLOR = '#0000FF';   // coin outline + portrait guide circle
```

**Example**:
```typescript
import {
  generateCoinSvgs,
  createDefaultSvgConfig,
  downloadCoinSvgs
} from './svgGenerator';

const config = createDefaultSvgConfig();
config.coinDiameter = 50; // 50mm coin (not currently applied to the output - see below)
config.portraitScale = 0.7; // 70% of the coin radius

const result = await generateCoinSvgs(coinDesign, config);
if (result.success) {
  downloadCoinSvgs(result, 'my-coin');
}
```

`SvgConfig.coinDiameter`, `.dpi`, and `.fontSize` are accepted but not currently applied
to the output - see [TECHNOLOGY.md's Known Gaps](TECHNOLOGY.md#known-gaps).
`.portraitScale`, `.fontFamily`, and `.textRadiusScale` do affect it.

**SVG Structure**:
```xml
<svg viewBox="0 0 1000 1000">
  <!-- Coin outline (Score: stroke="#0000FF") -->
  <circle (outer rim) />

  <!-- Portrait guide circle (Score: stroke="#0000FF", dashed) -->
  <circle (dashed) />

  <!-- Portrait with circular clip path -->
  <clipPath id="portraitClip">
    <circle />
  </clipPath>
  <image clip-path="url(#portraitClip)" />

  <!-- Curved text paths (Engrave: fill="#000000") -->
  <path id="topTextPath" />
  <text fill="#000000"><textPath href="#topTextPath" /></text>

  <path id="bottomTextPath" />
  <text fill="#000000"><textPath href="#bottomTextPath" /></text>
</svg>
```

See [QUICK_START.md's Laser Software Import section](QUICK_START.md#laser-software-import)
for what the Score/Engrave split is for, and a caveat about `<text>` vs. outline paths
when importing into xTool Creative Space.

## Extending the Application

### Adding a New Component

1. Create file in `src/` (flat - no `components/` subdirectory):
```typescript
// MyComponent.ts
export interface MyComponentConfig {
  id: string;
  // ... other config
}

export function createMyComponent(
  config: MyComponentConfig
): HTMLDivElement {
  const container = document.createElement('div');
  // Build component
  return container;
}
```

2. Import and use:
```typescript
import {createMyComponent} from './MyComponent';
```

### Adding Templates

See `src/templates.ts` for example implementation.

**Steps**:
1. Define template structure
2. Create template selector UI
3. Apply template on selection
4. Update all inputs with template values

### Integrating AI Services

#### Background Removal API

Replace basic background removal in `imageProcessing.ts`:

```typescript
async function removeBackgroundAI(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': 'YOUR_API_KEY',
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Background removal failed');
  }
  
  return await response.blob();
}
```

#### Smart Cropping API

```typescript
async function smartCrop(file: File): Promise<string> {
  // Integrate with Cloudinary, Imgix, or custom AI service
  const response = await fetch('YOUR_CROPPING_API', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  return data.croppedImageUrl;
}
```

### Custom Styling

#### Modify Theme

Edit `tailwind.config.js`:
```javascript
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#your-color',
          secondary: '#your-color',
        },
      },
    },
  },
};
```

#### Custom CSS

Add to `src/main.css`:
```css
@layer components {
  .my-custom-class {
    @apply bg-brand-primary text-white;
  }
}
```

### Error Handling Pattern

All async functions return result objects:

```typescript
interface Result {
  success: boolean;
  data?: T;
  errorMessage?: string;
}

// Usage
const result = await someFunction();
if (result.success && result.data) {
  // Handle success
} else {
  // Handle error
  console.error(result.errorMessage);
}
```

## Testing

### Unit Testing

Vitest 4 with jsdom is already in place, colocated with the code it covers as
`src/*.test.ts` (41 tests as of this revision - see `npm run test`). New suites should
follow the same pattern: the default environment is `node`, and a test file that needs a
DOM opts in per-file with a `@vitest-environment jsdom` docblock, which keeps pure-logic
tests off jsdom and the suite fast. See [TECHNOLOGY.md](TECHNOLOGY.md) and the
`Testing` section of the main [README](../README.md) for the available scripts.

### Manual Testing Checklist

- [ ] Upload various image formats (PNG, JPG, WEBP)
- [ ] Test with very large images (>5MB)
- [ ] Test with very small images (<100KB)
- [ ] Enter maximum length text (50 chars)
- [ ] Test special characters in text
- [ ] Generate SVG with all fields populated
- [ ] Generate SVG with minimal fields
- [ ] Change Portrait Size, Font, and Text Offset in Display Settings, and confirm both
      the live preview and the exported SVG reflect them
- [ ] Test on different screen sizes, including a desktop width (confirm no page
      scrolling) and a phone width (confirm no horizontal overflow)
- [ ] Test in different browsers

Consider adding Playwright for browser-driven e2e coverage of the above; not currently
in the project.

## Performance Optimization

### Image Processing

Currently processes on client-side:
- Good: No server needed
- Bad: Slow for large images

Consider:
- Web Workers for background processing
- Progressive image loading
- Thumbnail generation

### SVG Generation

Optimizations:
- Cache generated SVGs
- Debounce preview updates
- Lazy load preview until needed

## Security Considerations

1. **File Upload**: Validate file types and sizes
2. **XSS**: Sanitize user text input (currently basic)
3. **CSP**: Add Content Security Policy headers
4. **CORS**: Configure if adding backend APIs

## Browser Compatibility

**Minimum versions**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required APIs**:
- Canvas API
- File API
- FileReader API
- URL.createObjectURL
- SVG support

## Deployment

### Static Hosting

After `npm run build`, deploy `dist/` folder to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

### Environment Variables

For API keys, create `.env`:
```
VITE_REMOVE_BG_API_KEY=your_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloud
```

Access in code:
```typescript
const apiKey = import.meta.env.VITE_REMOVE_BG_API_KEY;
```

## Contributing

When contributing:
1. Follow Google TypeScript Style Guide
2. Add JSDoc comments
3. Include error handling
4. Update this documentation
5. Test across browsers

## Questions?

Check the main README.md or code comments for more details.
