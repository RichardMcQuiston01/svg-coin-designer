# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TypeScript-based web application for designing custom commemorative coins with laser-engravable SVG output. The app allows users to design both sides (obverse/reverse) of coins with curved text and portrait images.

## Development Commands

```bash
# Start development server (port 3000)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build
npm run preview

# Lint TypeScript files
npm run lint
```

## Design & UX Guidelines

### Typography

- **Montserrat font** for headers only (h1, h2, h3, etc.)
- System fonts for body text, buttons, labels, and other UI elements

### Brand Colors

- **Primary**: `#1D4228` (dark green)
- **Secondary**: `#5F8560` (light green)

**Usage**: Apply company colors to primary actions and accents:
- Primary buttons (Export, Save, etc.)
- Links and interactive elements
- Highlights and active states
- **Do not** use for body text or large background areas
- Keep neutral backgrounds (white, gray) for readability

### User Experience

- **User-friendly**: Intuitive interface with clear labels and feedback
- **Pleasant look and feel**: Clean, professional design with smooth interactions
- **Responsive**: Must work on desktop, tablet, and mobile devices

## Architecture

### Component-Based Structure

The application uses a **component-based architecture** without frameworks - pure TypeScript creating and returning DOM elements:

```
src/
  ├── main.ts (entry point)
  │   └── CoinEditor.ts (orchestrator)
  │       ├── TextInput.ts (reusable text inputs)
  │       ├── ImageUploader.ts (image upload + processing)
  │       └── CoinPreview.ts (live preview)
  │           ├── imageProcessing.ts (grayscale, crop, contrast)
  │           └── svgGenerator.ts (curved text paths, SVG export)
  ├── templates.ts (pre-designed templates)
  ├── index.ts (type definitions)
  └── main.css (styles)
```

**Key Pattern**: All components are factory functions that:
1. Create DOM elements using `document.createElement()`
2. Return HTMLElement
3. Accept configuration objects with callbacks for state updates
4. Use TailwindCSS for styling with brand colors

### Data Flow

State management is **callback-based** with unidirectional data flow:

1. User interacts with component (e.g., TextInput)
2. Component calls `onChange` callback with new value
3. Parent (CoinEditor) updates `coinDesign` state object
4. Parent calls `updateCoinPreview()` to refresh preview
5. Preview re-renders with new data

**Central State**: The `CoinDesign` object in `CoinEditor.ts` is the single source of truth:
```typescript
interface CoinDesign {
  obverse: CoinSide;
  reverse: CoinSide;
}
```

### File Organization

All source code is in the `src/` directory:
- **Components**: `src/CoinEditor.ts`, `src/TextInput.ts`, `src/ImageUploader.ts`, `src/CoinPreview.ts`
- **Utilities**: `src/imageProcessing.ts`, `src/svgGenerator.ts`, `src/templates.ts`
- **Types**: `src/index.ts` (TypeScript type definitions)
- **Entry Point**: `src/main.ts`
- **Styles**: `src/main.css`

All imports within `src/` use relative paths (e.g., `import {createTextInput} from './TextInput'`).

## Image Processing Pipeline

The `processImage()` function in `imageProcessing.ts` applies transformations in this order:

1. **Load & Resize**: Scale to 800x800px target size
2. **Background Removal**: Simple threshold-based (240 RGB value)
3. **Brightness**: Adjustment (-100 to 100)
4. **Contrast**: Adjustment using factor formula
5. **Grayscale**: Convert for laser engraving (weighted: R*0.299 + G*0.587 + B*0.114)
6. **Circular Crop**: Apply circular clipping path using `destination-in` composite
7. **Export**: Convert to base64 PNG data URL

**Canvas Context**: Always uses `{willReadFrequently: true}` option for `getContext('2d')` since pixel data is read/written extensively.

## SVG Generation

The `svgGenerator.ts` creates laser-ready SVG files:

### Curved Text Algorithm

1. Calculate arc length needed for text
2. Center text by adjusting start angle
3. Generate SVG arc path (`M ... A ...`)
4. Use `<textPath>` with `startOffset="50%"` and `text-anchor="middle"`

### SVG Structure

Fixed 1000x1000 viewBox with:
- Outer circle at 90% (coin outline)
- Text radius at 85% of coin
- Portrait radius at 60% of coin (configurable via `portraitScale`)
- Portrait clipped using `<clipPath>` with circular `<circle>`

### Key Constants

- `svgSize = 1000` (viewBox)
- `coinRadius = svgSize / 2 * 0.9`
- `textRadius = coinRadius * 0.85`
- `portraitRadius = coinRadius * config.portraitScale` (default 0.6)

## TypeScript Configuration

Strict mode enabled with additional checks:
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noImplicitReturns: true`
- `noUncheckedIndexedAccess: true`

**Important**: Always check array access with `!` assertion or optional chaining since `noUncheckedIndexedAccess` makes all array access potentially undefined.

## Technical Requirements

### Data Persistence

**Use localStorage whenever possible** for saving form data:

- Save coin design state (text, images) to localStorage
- Auto-save on user input changes
- Restore previous design on page load
- Provide "Clear Saved Data" option in UI

**Implementation Pattern**:
```typescript
// Save to localStorage
const saveDesign = (design: CoinDesign) => {
  localStorage.setItem('coinDesign', JSON.stringify(design));
};

// Load from localStorage
const loadDesign = (): CoinDesign | null => {
  const saved = localStorage.getItem('coinDesign');
  return saved ? JSON.parse(saved) : null;
};
```

### AI Features with Toggle Controls

**Users must be able to toggle AI features ON/OFF individually**:

1. **Background Removal** (AI-powered)
   - Toggle: Enable/Disable AI background removal
   - When OFF: Use basic threshold-based removal (current implementation)
   - When ON: Use AI service (remove.bg, Cloudinary, etc.)

2. **Recoloring** (AI-powered)
   - Toggle: Enable/Disable AI recoloring
   - When OFF: Use basic color adjustments (brightness/contrast)
   - When ON: Use AI service for smart recoloring

3. **Cropping** (Prefer browser-based)
   - Toggle: Enable/Disable AI smart crop
   - When OFF: Use browser Canvas API for manual/automatic crop (preferred)
   - When ON: Use AI service for intelligent cropping (Cloudinary, Imgix)

**Implementation Requirements**:
- Add settings panel with toggle switches for each feature
- Store toggle states in localStorage
- Clearly indicate when AI features are active
- Provide fallback to browser-based processing when AI is disabled
- Show cost implications if using paid APIs

### Browser-First Approach

**For cropping and resizing, prefer browser features and free libraries**:

- Use Canvas API for image manipulation (already implemented)
- Consider libraries: `browser-image-compression`, `pica` (high-quality resize)
- Only use AI APIs when specifically beneficial (smart crop, complex background removal)
- Keep processing client-side when possible for privacy and cost

## Code Patterns

### Component Factory Pattern

```typescript
export function createMyComponent(config: MyConfig): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'tailwind-classes';

  // Build component

  return container;
}
```

### Result Pattern for Error Handling

All async operations return result objects:

```typescript
interface ProcessingResult {
  success: boolean;
  imageData?: string;
  errorMessage?: string;
}

// Check success before accessing data
if (result.success && result.imageData) {
  // Use result.imageData
}
```

### State Update Pattern

```typescript
// Component accepts onChange callback
onChange: (value: string) => {
  coinSide.topCurveText = value;
  onUpdate(coinSide);  // Notify parent
}
```

## Templates System

`templates.ts` contains pre-designed coin templates (Christmas, Birthday, Wedding, Achievement). **Not currently integrated into UI** - this is a future enhancement. To integrate:

1. Import templates in CoinEditor
2. Create dropdown/selector UI element
3. On selection, clone template and apply to `coinDesign`
4. Update all input values to reflect template

## Future Enhancement Notes

### AI Service Integration & API Comparison

**NOTE**: Future work will include a detailed pros/cons analysis for various API services.

#### Background Removal APIs

Options to consider:
1. **remove.bg**
   - Pros: Best-in-class quality, simple API
   - Cons: Paid service, rate limits
   - Integration: Replace `removeBackground()` in `src/imageProcessing.ts`

2. **Cloudinary AI**
   - Pros: All-in-one service (hosting + processing), good quality
   - Cons: Paid, more complex setup
   - Integration: Can handle entire image pipeline

3. **@imgly/background-removal** (Browser-based)
   - Pros: Free, runs in browser, privacy-friendly
   - Cons: Slower, requires model download
   - Integration: Add as npm dependency

**Implementation Pattern**:
```typescript
// src/imageProcessing.ts
async function removeBackgroundAI(
  imageData: string,
  apiKey: string
): Promise<string> {
  const formData = new FormData();
  formData.append('image_url', imageData);

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {'X-Api-Key': apiKey},
    body: formData,
  });

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
```

#### Smart Cropping & Image Enhancement

Options:
1. **Cloudinary**
   - Features: Smart crop (g_auto), auto-enhance, face detection
   - Best for: Professional applications with budget

2. **Imgix**
   - Features: Real-time image processing, CDN delivery
   - Best for: High-traffic applications

3. **Browser Canvas API** (Current)
   - Features: Basic crop, resize, filters
   - Best for: Privacy, cost-free, offline capability

#### Recoloring/Enhancement APIs

1. **DeepAI Colorization API**
2. **Cloudinary AI Effects**
3. **Custom TensorFlow.js models** (browser-based)

**TODO**: Create detailed comparison document with:
- Cost per 1000 images
- Quality benchmarks
- API response times
- Browser compatibility
- Privacy considerations

### Template UI

Add template selector in `CoinEditor.createHeader()` section. Templates are already defined in `src/templates.ts`.

### Web Workers

For large image processing, consider offloading `processImage()` to Web Worker to prevent UI blocking.

**Implementation**:
```typescript
// src/workers/imageProcessor.worker.ts
self.addEventListener('message', async (e) => {
  const {file, options} = e.data;
  const result = await processImage(file, options);
  self.postMessage(result);
});
```

### localStorage Enhancement

Add:
- Export/Import design as JSON file
- Version saved designs
- Thumbnail previews in load dialog
- Auto-backup before destructive operations

## Common Development Tasks

### Adding New Text Input

```typescript
const input = createTextInput({
  id: 'myInput',
  label: 'Label Text',
  onChange: (value: string) => {
    coinSide.property = value;
    updateCoinPreview('preview-id', coinSide);
  },
});
```

### Modifying Image Processing

Edit `src/imageProcessing.ts` - changes apply automatically to all uploads. Default options are in `createDefaultProcessingOptions()`.

### Adjusting Coin Layout

Modify radius calculations in `src/svgGenerator.ts`:
- Text position: Change `textRadius = coinRadius * 0.85`
- Portrait size: Change `portraitScale` in `createDefaultSvgConfig()`
- Coin margins: Change `coinRadius = (svgSize / 2) * 0.9`

### Updating Styles

Uses TailwindCSS utility classes. Custom styles go in `src/main.css` using `@layer components`.

**Brand Colors**: Update Tailwind config in `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1D4228',
          secondary: '#5F8560',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
      },
    },
  },
};
```

## Browser APIs Used

- Canvas API (image processing)
- File API & FileReader (image upload)
- URL.createObjectURL (blob downloads)
- SVG with `<textPath>` and `<clipPath>` (requires modern browser)
- localStorage (data persistence)

## Build Output

Vite builds to `dist/` with **vite-plugin-singlefile** to create a standalone HTML file:

### Build Characteristics:
- **Single self-contained HTML file**: All JavaScript and CSS inlined in `dist/index.html`
- **File size**: ~31KB (gzipped: ~9KB)
- **Standalone capability**: Can be opened directly in any browser via `file://` protocol
- **Source maps**: Available (not inlined, optional for debugging)
- **External assets**: Only `coin-icon.svg` remains separate (favicon)

### Two Usage Modes:

**1. Standalone Mode (Recommended for Distribution)**
- Simply open `dist/index.html` in any web browser
- Works offline without any server
- Perfect for sending to users or deploying as a single file
- All features work: localStorage, image upload/processing, SVG export

**2. Server Mode (Development/Testing)**
```bash
npm run preview  # Serves at http://localhost:4173
```

### Deployment Options:
- **Static hosts**: Netlify, Vercel, GitHub Pages, AWS S3 + CloudFront
- **Direct distribution**: Email or share the single HTML file
- **Offline use**: Works completely offline once loaded

**Note**: The `file://` protocol has no CORS restrictions for this build thanks to vite-plugin-singlefile inlining all scripts and styles.
