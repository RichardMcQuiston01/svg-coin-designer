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

### 1. Types (`src/types/index.ts`)

All TypeScript interfaces and types.

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

#### TextInput (`src/components/TextInput.ts`)

**Purpose**: Reusable text input with label and character counter.

**Usage**:
```typescript
import {createTextInput} from './components/TextInput';

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

#### ImageUploader (`src/components/ImageUploader.ts`)

**Purpose**: Image upload with automatic processing.

**Usage**:
```typescript
import {createImageUploader} from './components/ImageUploader';
import {createDefaultProcessingOptions} from './utils/imageProcessing';

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

#### CoinPreview (`src/components/CoinPreview.ts`)

**Purpose**: Live preview of coin design.

**Usage**:
```typescript
import {createCoinPreview, updateCoinPreview} from './components/CoinPreview';

const preview = createCoinPreview({
  id: 'preview',
  title: 'Obverse',
  coinSide: {
    topCurveText: 'TOP TEXT',
    bottomCurveText: 'BOTTOM TEXT',
    coinPortrait: null,
    originalImage: null,
  },
});

document.body.appendChild(preview);

// Update preview
updateCoinPreview('preview', updatedCoinSide);
```

**API**:
- `createCoinPreview(config: CoinPreviewConfig): HTMLDivElement`
- `updateCoinPreview(previewId: string, coinSide: CoinSide): void`

#### CoinEditor (`src/components/CoinEditor.ts`)

**Purpose**: Main editor orchestrating all components.

**Usage**:
```typescript
import {createCoinEditor} from './components/CoinEditor';

const design = createCoinEditor('app');
console.log('Current design:', design);
```

**API**:
- `createCoinEditor(containerId: string): CoinDesign`

### 3. Utilities

#### Image Processing (`src/utils/imageProcessing.ts`)

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
import {processImage, createDefaultProcessingOptions} from './utils/imageProcessing';

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

#### SVG Generator (`src/utils/svgGenerator.ts`)

**Purpose**: Generate laser-engravable SVG files.

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

// Create default config
function createDefaultSvgConfig(): SvgConfig
```

**Example**:
```typescript
import {
  generateCoinSvgs,
  createDefaultSvgConfig,
  downloadCoinSvgs
} from './utils/svgGenerator';

const config = createDefaultSvgConfig();
config.coinDiameter = 50; // 50mm coin
config.portraitScale = 0.7; // 70% of diameter

const result = await generateCoinSvgs(coinDesign, config);
if (result.success) {
  downloadCoinSvgs(result, 'my-coin');
}
```

**SVG Structure**:
```xml
<svg viewBox="0 0 1000 1000">
  <!-- Coin outline -->
  <circle (outer rim) />
  
  <!-- Portrait with circular clip path -->
  <clipPath id="portraitClip">
    <circle />
  </clipPath>
  <image clip-path="url(#portraitClip)" />
  
  <!-- Curved text paths -->
  <path id="topTextPath" />
  <text><textPath href="#topTextPath" /></text>
  
  <path id="bottomTextPath" />
  <text><textPath href="#bottomTextPath" /></text>
</svg>
```

## Extending the Application

### Adding a New Component

1. Create file in `src/components/`:
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
import {createMyComponent} from './components/MyComponent';
```

### Adding Templates

See `src/utils/templates.ts` for example implementation.

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
        primary: '#your-color',
        secondary: '#your-color',
      },
    },
  },
};
```

#### Custom CSS

Add to `src/styles/main.css`:
```css
@layer components {
  .my-custom-class {
    @apply bg-blue-500 text-white;
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

### Manual Testing Checklist

- [ ] Upload various image formats (PNG, JPG, WEBP)
- [ ] Test with very large images (>5MB)
- [ ] Test with very small images (<100KB)
- [ ] Enter maximum length text (50 chars)
- [ ] Test special characters in text
- [ ] Generate SVG with all fields populated
- [ ] Generate SVG with minimal fields
- [ ] Test on different screen sizes
- [ ] Test in different browsers

### Unit Testing (Future)

Consider adding:
- Jest for unit tests
- Testing Library for component tests
- Playwright for e2e tests

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
