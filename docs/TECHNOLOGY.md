# TECHNOLOGY

Technical reference for the Commemorative Coin Designer: the stack it is built on,
how the source is laid out, and how the pieces fit together.

## Technology Stack

- **TypeScript 5.3** - strict mode, plus `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch`, `noImplicitReturns`, and `noUncheckedIndexedAccess`
- **Vite 5** - dev server on port 3000, production bundler
- **vite-plugin-singlefile 2.3** - inlines all JS and CSS into one standalone `dist/index.html`
- **TailwindCSS 3.4** - utility-first styling, compiled through PostCSS with Autoprefixer
- **No runtime framework** - components are plain factory functions that build and
  return DOM elements

### Browser APIs

All processing happens client-side; there is no backend.

- **Canvas 2D** - image resize, grayscale, contrast/brightness, circular crop
  (contexts are created with `{willReadFrequently: true}`, since pixel data is read
  and written extensively)
- **File / FileReader** - reading uploaded portraits
- **Blob + `URL.createObjectURL`** - triggering SVG downloads
- **SVG `<textPath>` and `<clipPath>`** - curved text and circular portrait masking

## Project Structure

```
svg-coin-designer/
├── docs/
│   ├── QUICK_START.md        # Task-oriented guide for new users
│   ├── ROADMAP.md            # Planned features
│   └── TECHNOLOGY.md         # This file
├── src/
│   ├── main.ts               # Entry point; boots the editor, handles fatal errors
│   ├── main.css              # Tailwind layers + .card/.btn-primary/.input-field classes
│   ├── index.ts              # Shared TypeScript type definitions (no runtime code)
│   ├── CoinEditor.ts         # Orchestrator: owns design state, builds the UI, exports
│   ├── CoinPreview.ts        # Live preview rendering for each coin side
│   ├── ImageUploader.ts      # File input, validation, hand-off to processing
│   ├── TextInput.ts          # Labelled text input
│   ├── NumberInput.ts        # Numeric input used for the portrait size control
│   ├── imageProcessing.ts    # Canvas pipeline: resize, grayscale, contrast, crop
│   ├── svgGenerator.ts       # Curved-text SVG generation and file download
│   └── templates.ts          # Pre-defined designs (not yet wired into the UI)
├── index.html                # HTML entry point
├── coin-icon.svg             # Favicon
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

`src/` is flat - there are no `components/`, `utils/`, or `types/` subdirectories.
All imports inside `src/` use relative paths, for example
`import {createTextInput} from './TextInput'`.

## Architecture

### Component factory pattern

Every component is a function that creates DOM elements and returns them. There is no
class hierarchy, no virtual DOM, and no framework lifecycle.

```typescript
export function createMyComponent(config: MyConfig): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'tailwind-classes';
  // ...build the component
  return container;
}
```

### State and data flow

`CoinEditor.ts` holds a single `CoinDesign` object as the source of truth, alongside a
`portraitScale` value. Data flows one way, through callbacks:

1. The user edits a component (for example `TextInput`).
2. The component invokes its `onChange` callback with the new value.
3. `CoinEditor` mutates the corresponding field on the design.
4. `CoinEditor` calls `updateCoinPreview()` to re-render that side.

```typescript
interface CoinDesign {
  obverse: CoinSide;
  reverse: CoinSide;
}
```

### Error handling

Async operations return a result object rather than throwing, so callers branch on
`success` before touching the payload:

```typescript
interface ProcessingResult {
  success: boolean;
  imageData?: string;
  errorMessage?: string;
}
```

## Image Processing Pipeline

`processImage()` in `src/imageProcessing.ts` applies steps in this order:

1. **Load** the file via `FileReader` into an `Image`
2. **Resize** onto an 800x800 canvas, scaled to cover and centred
3. **Background removal** - threshold-based, RGB > 240 becomes transparent
   (off by default)
4. **Brightness** adjustment, -100 to 100 (default 0, skipped when 0)
5. **Contrast** adjustment, -100 to 100 (default +10)
6. **Grayscale** conversion, weighted `R*0.299 + G*0.587 + B*0.114`
7. **Circular crop** via a `destination-in` composite
8. **Export** as a base64 PNG data URL

Defaults live in `createDefaultProcessingOptions()`.

## SVG Generation

`src/svgGenerator.ts` emits a fixed **1000 x 1000** viewBox per coin side:

| Element | Radius |
| --- | --- |
| Coin outline | `(1000 / 2) * 0.9` = 450 |
| Text baseline | `coinRadius * 0.85` = 382.5 |
| Portrait | `coinRadius * portraitScale` (default 0.85) |

Curved text is produced by computing the arc length needed for the string, centring it
on the given start angle, emitting an SVG arc path, and rendering the text with
`<textPath startOffset="50%" text-anchor="middle">`. Text is upper-cased on output.
The portrait is masked with a circular `<clipPath>`.

## Build Output

`npm run build` runs `tsc` and then `vite build`, producing a single self-contained
`dist/index.html` with all JavaScript and CSS inlined. It can be opened directly over
`file://` with no server and no CORS issues. Source maps are emitted alongside it, and
`coin-icon.svg` remains a separate asset.

## Known Gaps

Accurate as of this revision - see [ROADMAP.md](ROADMAP.md) for planned work.

- `src/templates.ts` defines four templates but nothing imports it; there is no
  template picker in the UI.
- `file-saver` is declared in `package.json` dependencies but is never imported.
  Downloads use `Blob` + `URL.createObjectURL` directly.
- Of the `SvgConfig` fields, only `portraitScale` affects output. `coinDiameter`,
  `dpi`, `fontFamily`, and `fontSize` are currently unused - font family and size are
  hard-coded inside `createCurvedTextPath()`.
- No `localStorage` persistence; designs are lost on reload.
- `tailwind.config.js` extends nothing, so the documented brand colours and Montserrat
  heading font are not yet wired up. Buttons use stock Tailwind blues.
- `npm run build` currently fails typechecking with `TS2882` on the `./main.css`
  side-effect import; the project has no `src/vite-env.d.ts` declaring Vite's client types.
