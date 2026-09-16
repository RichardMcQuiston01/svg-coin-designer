# TECHNOLOGY

Technical reference for the Commemorative Coin Designer: the stack it is built on,
how the source is laid out, and how the pieces fit together.

## Technology Stack

- **TypeScript 5.3** - strict mode, plus `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch`, `noImplicitReturns`, and `noUncheckedIndexedAccess`
- **Vite 5** - dev server on port 3000, production bundler
- **vite-plugin-singlefile 2.3** - inlines all JS and CSS into one standalone `dist/index.html`
- **TailwindCSS 3.4** - utility-first styling, compiled through PostCSS with Autoprefixer.
  The theme defines `brand.primary` (`#1D4228`) and `brand.secondary` (`#5F8560`) tokens
  plus a `heading` font family, rather than ad-hoc hex values in components
- **Vitest 4 + jsdom** - unit tests colocated with sources as `src/*.test.ts`. The default
  environment is `node`; suites needing a DOM opt in with a `@vitest-environment jsdom`
  docblock, which keeps pure-logic tests off jsdom and the suite roughly 30x faster
- **Montserrat** - self-hosted via `@fontsource/montserrat` (600 and 700, latin subset),
  base64-inlined into the build so headings need no network
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
│   ├── assets/
│   │   └── donate-qr.svg     # Pre-generated QR code for the donation page
│   ├── main.ts               # Entry point; boots the editor, handles fatal errors
│   ├── main.css              # Tailwind layers, @font-face, .card/.btn-primary classes
│   ├── index.ts              # Shared TypeScript type definitions (no runtime code)
│   ├── vite-env.d.ts         # Vite client types (CSS imports, import.meta.env)
│   ├── *.test.ts             # Vitest suites, colocated with the code they cover
│   ├── CoinEditor.ts         # Orchestrator: owns design state, builds the UI, exports
│   ├── CoinPreview.ts        # Live preview rendering for each coin side
│   ├── DonateWidget.ts       # Dismissible floating donation card
│   ├── curvedText.ts         # Shared curved-text renderer for preview and export
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
├── vitest.config.ts
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

`CoinEditor.ts` holds two objects as the source of truth: a `CoinDesign` (the text and
portraits) and a `CoinDisplaySettings` (portrait size, font, text offset), shared by
both sides. Data flows one way, through callbacks:

1. The user edits a component (for example `TextInput`, or a Display Settings control).
2. The component invokes its `onChange` callback with the new value.
3. `CoinEditor` mutates the corresponding field on `coinDesign` or `displaySettings`.
4. `CoinEditor` calls `updateCoinPreview()` to re-render the affected side(s).

```typescript
interface CoinDesign {
  obverse: CoinSide;
  reverse: CoinSide;
}

interface CoinDisplaySettings {
  portraitScale: number;
  fontFamily: string;
  textRadiusScale: number;
}
```

`displaySettings` is a single object mutated in place (`displaySettings.portraitScale =
value`) rather than a reassigned primitive, so every closure captured when the UI was
built - the export button included - always reads the current value. It persists to
`localStorage` under `coinDesigner.displaySettings` (see `loadDisplaySettings()` /
`saveDisplaySettings()` in `CoinEditor.ts`) and restores on reload. `coinDesign` does not
currently persist.

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
| Text baseline | `coinRadius * textRadiusScale` (default 0.85 = 382.5) |
| Portrait | `coinRadius * portraitScale` (default 0.85) |

`portraitScale`, `fontFamily`, and `textRadiusScale` all come from `CoinDisplaySettings`
(`createDefaultDisplaySettings()`), which the gear-icon Display Settings panel edits at
runtime - Portrait Size, Font, and Text Offset respectively.

### Laser software colors

The coin outline and the portrait guide circle are stroked `LASER_SCORE_COLOR`
(`#0000FF`); the curved text is filled `LASER_ENGRAVE_COLOR` (`#000000`). LightBurn and
xTool Creative Space can both auto-create a layer per imported color, so a fresh import
splits into a Score layer (the two circles) and an Engrave layer (the text) rather than
one undifferentiated black layer. This follows the common convention those tools'
communities use (black = fill/engrave, blue = line), not a spec either tool guarantees -
see the color constants' doc comment in `svgGenerator.ts`.

Curved text comes from `src/curvedText.ts`, which the live preview uses as well, so the
screen and the exported file agree. For each curve it computes the arc length the string
needs, centres that arc on the top or bottom of the coin, emits an SVG arc path, and sets
the text on it with `<textPath startOffset="50%" text-anchor="middle">`. Text is
upper-cased on output. The portrait is masked with a circular `<clipPath>`.

Three details are easy to get wrong here:

- **Direction.** Glyphs follow the direction their path travels, so both arcs are drawn
  left to right. Reversing the bottom arc turns every glyph upside down.
- **Sweep.** Any two endpoints admit two arcs of equal radius, on mirrored circles. Only
  one is the coin's own circle; the other bows in toward the centre.
- **Baseline radius.** Glyphs grow "up" in the path's local frame, which points outward
  on the top arc and inward on the bottom one. The bottom baseline therefore sits a cap
  height further out, so both curves occupy the same band.

Font size is `0.045 x` the viewBox (45 units on the export, 18 on the preview's 400-unit
viewBox). Text long enough to span more than 170 degrees is scaled down, so the two
curves cannot meet at the sides of the coin.

## Build Output

`npm run build` runs `tsc` and then `vite build`, producing a single self-contained
`dist/index.html` with all JavaScript and CSS inlined. It can be opened directly over
`file://` with no server and no CORS issues. Source maps are emitted alongside it, and
`coin-icon.svg` remains a separate asset.

## Known Gaps

Accurate as of this revision - see [ROADMAP.md](ROADMAP.md) for planned work.

- `src/templates.ts` defines four templates but nothing imports it; there is no
  template picker in the UI.
- Of the `SvgConfig` fields, `portraitScale`, `fontFamily`, and `textRadiusScale` affect
  output. `coinDiameter`, `dpi`, and `fontSize` are still unused - the actual font size
  comes from `TEXT_FONT_SIZE_RATIO` in `src/curvedText.ts` instead.
- No `localStorage` persistence for the design content (text and portraits) - only the
  display settings (portrait size, font, text offset) and the donation card's dismissal
  are stored, so a design's text and images are still lost on reload.
- The exported curved text is a raw `<text>`/`<textPath>` element, not an outlined
  vector path. xTool's own SVG-import guidance recommends converting text to paths
  before import so it processes reliably; LightBurn generally handles `<text>` via its
  own font substitution, which depends on a matching font being installed on that
  machine. Converting text to paths on export (e.g. via an embedded font's glyph
  outlines) would remove this dependency for both tools, but is not implemented.
