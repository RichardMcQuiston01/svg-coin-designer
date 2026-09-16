# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- MIT `LICENSE` file. The README had advertised MIT since the initial commit, but the
  licence file was empty, which left the project effectively unlicensed.
- `"license": "MIT"` field in `package.json`, so tooling reports the licence correctly.
- `docs/TECHNOLOGY.md` - technology stack, project layout, architecture, the image
  processing pipeline, SVG geometry, and a list of known gaps.
- `docs/ROADMAP.md` - planned features and future enhancements.
- `CHANGELOG.md` - this file.
- A `Documentation` section in the README linking to the guides, changelog, and licence.
- `Buy Me a Coffee` section in the README with a `donate.svg` badge linking to Square.
- `package-lock.json` is now tracked, so a clone installs the exact dependency tree.
  Previously it was ignored, which left nothing pinning the versions: a working copy
  without `node_modules` fell through to a globally installed TypeScript 7, and the build
  failed with a `TS2882` error pointing at the `./main.css` import in `src/main.ts` rather
  than at the missing install.
- `typecheck` script (`tsc --noEmit`) for a type check without a full build.
- A `Type Checking` section in the README documenting the new script.

- Vitest 4 with jsdom, plus `test`, `test:watch`, and `test:file` scripts, and a
  `Testing` section in the README. The default test environment is `node`; suites that
  need a DOM opt in per file with a `@vitest-environment jsdom` docblock, which cut the
  suite from 44.9s to 1.4s.
- Characterisation tests pinning the current SVG export contract (1000x1000 viewBox,
  upper-cased curve text, portrait radius scaling, omission of empty elements) and the
  `TextInput` component. These exist to protect the renderer unification planned for
  Stage 1; both suites were verified to fail when the behaviour they cover is mutated.
- `src/vite-env.d.ts` declaring Vite's client types, which resolves the latent `TS2882`
  error on the `./main.css` side-effect import and types `import.meta.env`.
- Brand theme tokens in `tailwind.config.js`: `brand.primary` (`#1D4228`),
  `brand.secondary` (`#5F8560`), hover and active variants, a `heading` font family, and
  the `slide-in` keyframes that `CoinEditor` already referenced but which were never
  defined.
- Montserrat for headings, self-hosted via `@fontsource/montserrat` (weights 600 and 700,
  latin subset) and base64-inlined by a font-specific `assetsInlineLimit` rule, so the
  standalone build needs no network. This grows `dist/index.html` from 34 kB to 84 kB.

- `src/DonateWidget.ts` - a dismissible floating card in the bottom-right corner of the
  app, with a short appeal, a `Donate via Stripe` link, and a QR code for the same page.
  The QR code is a pre-generated SVG inlined from `src/assets/donate-qr.svg`, so it stays
  crisp at any size and the standalone `file://` build needs no network to show it. The
  dismissal is stored in `localStorage` under `coinDesigner.donateDismissed`; storage
  failures (Safari private mode, blocked storage) fall back to showing the card. The QR
  code is hidden below 400 px wide, where the card has no room for it and the phone
  holding it cannot scan its own display anyway.
- An `xs` (400 px) Tailwind breakpoint, below the smallest stock one.
- A tabbed switcher between the Obverse and Reverse side editors in `CoinEditor.ts`,
  replacing the two side-by-side editor cards, so the design column fits a desktop
  viewport without scrolling.
- A gear-icon **Display Settings** panel in the header, replacing the standalone
  Portrait Size card: it now also offers a **Font** picker (Sans Serif / Serif /
  Monospace, `FONT_OPTIONS` in `src/svgGenerator.ts`) and a **Text Offset** slider
  (`textRadiusScale`) controlling the gap between the dashed portrait guide and the
  curved text. All three settings persist to `localStorage` under
  `coinDesigner.displaySettings` and restore on reload, following the same
  try/catch-wrapped pattern as the donate widget's dismissal flag.
- `LASER_ENGRAVE_COLOR` (`#000000`) and `LASER_SCORE_COLOR` (`#0000FF`) in
  `src/svgGenerator.ts`. The exported SVG now strokes the coin outline and the portrait
  guide circle blue and fills the curved text black, so LightBurn and xTool Creative
  Space can auto-assign a Score and an Engrave layer on import instead of importing
  everything as one undifferentiated black layer.
- `src/glyphOutline.ts`, a second curved-text renderer used only by the SVG export.
  Confirmed by testing a real export in xTool Creative Space: its SVG importer does not
  implement `<textPath>` at all, so exported curved text rendered nowhere - the portrait
  imported fine as an Engrave layer, but the text was simply absent. `glyphOutline.ts`
  loads the selected font (a bundled Liberation Bold face - see below) via `opentype.js`,
  and bakes each glyph's own outline into a plain filled `<path>`, positioned and rotated
  along the same arc `curvedText.ts` would use, with no `<textPath>`, no font
  substitution, and no dependency on the importer understanding text layout at all. The
  live preview is unaffected and still uses `curvedText.ts`'s `<textPath>`, which every
  browser already renders correctly - see the new doc comments atop both files. Since
  loading and parsing a font is inherently asynchronous, `generateCoinSideSvg()` and its
  two curve calls are now `async`/`await`, which `generateCoinSvgs()` already
  accommodated (it already returned a `Promise`).
- `src/assets/fonts/` - vendored Liberation Sans/Serif/Mono Bold `.ttf` files (plus
  `OFL.txt`/`AUTHORS`) for `glyphOutline.ts` to outline text with. Extracted once from
  the `@formepdf/fonts-standard` npm package (not a runtime dependency) rather than
  bundling the proprietary Arial/Times New Roman/Courier New fonts the Display Settings
  panel names, which cannot be redistributed; Liberation is metrically and visually
  compatible with all three and SIL Open Font License-licensed. Only the Bold weight is
  vendored, since curved text is always rendered bold, roughly halving the font payload
  versus also including Regular.
- `opentype.js` (pinned below 2.0.0, which has a known SVG coordinate-flip regression)
  and its `@types/opentype.js` dev dependency, for parsing the vendored fonts and
  generating glyph outline paths.
- `CAP_HEIGHT_RATIO` and `MAX_ARC_DEGREES` are now exported from `src/curvedText.ts` (no
  behaviour change) so `glyphOutline.ts` can share them, keeping the two renderers'
  curved-text geometry in agreement.
- `vite.config.ts`'s `assetsInlineLimit` now force-inlines `.ttf` as well as `.woff2`,
  for the same reason as the existing rule: the vendored fonts are 300-400 KB each, well
  past Vite's default 4 KB threshold, and would otherwise ship as separate `dist/assets/`
  files that break the standalone build over `file://`.

### Changed

- The README's donation link and its `donate.svg` QR code now point at Stripe rather
  than Square. The QR code is regenerated for the new URL and rendered at 220 px rather
  than 1155, so it no longer takes up most of the page.
- Moved `QUICK_START.md` to `docs/QUICK_START.md`.
- Moved `API_DOCUMENTATION.md` to `docs/API_DOCUMENTATION.md`.
- Moved the `Technology Stack` and `Project Structure` sections out of the README into
  `docs/TECHNOLOGY.md`.
- Moved `Future Enhancements` out of the README into `docs/ROADMAP.md`.
- Rewrote `docs/QUICK_START.md` and `docs/TECHNOLOGY.md` to match the actual codebase.
  The documented tree had described `src/components/`, `src/utils/`, `src/types/`, and
  `src/styles/` subdirectories that do not exist - `src/` is flat - and omitted
  `NumberInput.ts` and `templates.ts` entirely.
- Corrected the documented default `portraitScale` from 0.6 to 0.85, and documented the
  Portrait Size control and its 0.25-0.90 range.
- Corrected the "Change Font" and "Change Coin Size" instructions, which told readers to
  edit `SvgConfig` fields (`fontFamily`, `fontSize`, `coinDiameter`, `dpi`) that the SVG
  generator never reads.
- Corrected source paths throughout the quick start guide, which referred to
  `src/utils/svgGenerator.ts` and `src/utils/templates.ts`.
- Reconciled the `COPYRIGHT` file and the README copyright notice with the MIT licence.
  Both previously read "All rights reserved", contradicting the stated licence.
- `.gitignore` now excludes `.claude/settings.local.json` and `console_errors.txt`.
- `.gitignore` no longer excludes `package-lock.json`.
- The documented lint command in `CLAUDE.md` is now `npm run typecheck`.
- Buttons, focus rings, and the image-processing indicator now use the brand palette
  instead of stock Tailwind blues. Tailwind's default `--tw-ring-color` is overridden, so
  no stock blue remains anywhere in the built stylesheet.
- Range, checkbox, and radio controls set `accent-color` to the brand primary. Native form
  controls paint themselves with the browser's own accent colour, which utility classes
  cannot reach, so the Portrait Size slider had stayed stock blue.
- Headings (`h1`-`h6`) now render in Montserrat; body text keeps the system stack.
- The fatal-error screen in `src/main.ts` reuses the `.btn-primary` class rather than
  repeating inline colour utilities.
- `docs/TECHNOLOGY.md` records the Vitest, brand-token, and font decisions, and its
  `Known Gaps` section drops the three items Stage 0 closed while adding the split
  renderer and the Portrait Size export bug.
- Trimmed the README to a hub. Its `Usage` and `Image Processing` sections and the
  expanded `Two Ways to Use the Production Build` block restated `docs/QUICK_START.md` -
  about 81 of the README's 155 lines - and the two copies had already drifted apart on
  three points of fact. The README now covers install, build, typecheck, and test (115
  lines), and links to the Quick Start Guide for the design walkthrough and the upload
  pipeline.
- Restored the standard wording of the README's `Buy Me a Coffee` section and moved it
  below `Copyright` as the final section. The body copy now matches the floating donate
  card in `src/DonateWidget.ts`, which had been showing visitors a different ask.
- Moved the Export SVG Files / Reset Design buttons from a row below the previews into
  the header, top-right, next to the new Display Settings gear icon.
- Moved the Live Preview column to sit beside the tabbed editor instead of below it, so
  both are visible at once on a desktop viewport.
- On desktop (the `lg` Tailwind breakpoint and up) the page itself no longer scrolls;
  below `lg`, where the two-column layout stacks into one, it falls back to normal
  scrolling instead of clipping content that no longer fits. The header also now stacks
  the title above the action buttons below the `sm` breakpoint, rather than sharing one
  row - on phone-width screens (~390 px) that row previously overflowed horizontally,
  which widened the mobile browser's layout viewport past the actual screen and pushed
  the (fixed-position) Display Settings panel partly off-screen.
- `SvgConfig.fontFamily` is now actually passed into `createCurvedText()` on export. It
  was defined but never read, so the export always fell back to `createCurvedText()`'s
  own hard-coded default regardless of what the config said.
- The standalone build grew from ~102 KB to ~1.7 MB (gzipped: ~53 KB to ~820 KB), almost
  entirely the ~1.1 MB of vendored font data `glyphOutline.ts` needs to outline curved
  text for export - see the new `src/assets/fonts/` entry above and
  [TECHNOLOGY.md's Known Gaps](docs/TECHNOLOGY.md#known-gaps) for a possible future
  reduction (subsetting the fonts to the glyphs curved text can actually contain).
- `src/svgGenerator.test.ts`'s `curved text orientation` suite now parses the exported
  `<path transform="translate(x y) rotate(deg)">` glyph placements instead of a
  `<textPath>`'s `<path d="M ... A ...">` arc command, since the export no longer emits
  one. Two of the five tests (mirrored-circle and inside-coin-outline checks) had gone
  silently vacuous under the new markup - their regexes matched nothing, so their loops
  ran zero times and passed without checking anything - and are rewritten alongside the
  three that failed outright.

### Removed

- The `Roadmap` entry from the README's `Documentation` list. `docs/ROADMAP.md` is
  unchanged and still linked from `docs/QUICK_START.md` and `docs/TECHNOLOGY.md`.
- The `file-saver` dependency and its `@types/file-saver` types. Nothing imported either;
  downloads use `Blob` + `URL.createObjectURL` directly.
- `.claude/settings.local.json` from version control. It holds per-machine Claude Code
  permission grants that are specific to a single developer's working copy, so committing
  it meant local tool approvals showed up as repository changes. It remains gitignored, so
  local copies are untouched.
- `console_errors.txt` from version control. It was a stale browser console dump from an
  earlier `F:\claude_coding\` checkout, recording CORS failures against a multi-file
  `dist/assets/` layout that the single-file build no longer produces. It remains
  gitignored, so local copies are untouched.
- `lint` script. It ran `eslint src --ext ts,tsx`, but ESLint was never a dependency and
  `--ext` was removed in ESLint 9, so the script could not run. The strict compiler
  options already in `tsconfig.json` cover what a lint preset would catch on a codebase
  this size, so `npm run typecheck` replaces it rather than adding a linter.
- `Code Style` section from the README.
- `Contributing` section from the README.
- `Keyboard Shortcuts` section from the quick start guide. It documented
  <kbd>Ctrl</kbd>+<kbd>S</kbd> and <kbd>Ctrl</kbd>+<kbd>E</kbd> as "(Future)" bindings
  that have never been implemented.

- The preview and the export now share one curved-text renderer, `src/curvedText.ts`.
  The preview had laid text out character by character across a fixed 120-degree arc,
  so its spacing bore no relation to the text and neither did it match the exported
  file; both now set text on an arc sized to the text.

### Fixed

- The README's clone instructions ran `cd coin-designer`, which fails: the repository
  clones to `svg-coin-designer`. The `coin-designer` name comes from `package.json`.
- The README's feature list advertised background removal without noting that
  `createDefaultProcessingOptions()` sets `removeBackground: false`, so it is off unless
  a caller opts in.
- Curved text in the preview no longer spreads short lines across the whole rim or runs
  long ones into the coin edge, and the bottom curve no longer sits a cap height low
  across the portrait ring. Its baseline now sits a cap height further out than the top
  curve's, because bottom glyphs grow inward, which puts both curves in the same band.
- Curved text is no longer clipped where a run of wide glyphs outgrows the estimated
  text width: the arc is padded past the estimate, and text that would otherwise pass
  170 degrees and collide with the curve opposite is scaled down to fit.
- An ampersand in curve text no longer produces a malformed SVG; XML metacharacters are
  escaped.
- Preview clip-path ids are drawn from a counter rather than `Date.now()`, which repeats
  across previews rendered in the same millisecond and can differ between the two places
  the id is read, leaving a portrait unclipped.
- The Portrait Size slider sat at its minimum while its label read 85%.
  `createNumberInput()` assigned the slider's value before its `min`, `max`, and `step`,
  so the browser sanitised `0.85` against the defaults in force at that moment
  (min 0, max 100, step 1): it snapped to `1`, was then clamped by `max="0.9"`, and
  settled on `0.25`. The bounds are now assigned first. Note that jsdom implements
  clamping but not step snapping, so the regression test exercises the clamping path and
  the snapping case was confirmed in Chrome.
- The exported SVG never reflected a changed Portrait Size. `createActionButtons()`
  captured the `portraitScale` primitive by value when the UI was built, so the export
  handler always read that initial snapshot rather than the current value; the live
  preview looked correct because it re-reads the value on every change. Fixed at the
  time by passing a getter closure; superseded by the `displaySettings` object (mutated
  in place) added with the Display Settings panel, which closes over the live values by
  construction.

## [1.0.0] - 2025-12-18

### Added

- Initial release.
- Dual-side coin editor for the obverse (front) and reverse (back).
- Curved text along the top and bottom of each side, up to 50 characters per field,
  upper-cased on export.
- Portrait upload per side, accepting PNG, JPEG, and WebP up to 10 MB.
- Client-side image processing: scale to an 800x800 canvas, optional threshold-based
  background removal, brightness and contrast adjustment, grayscale conversion for
  engraving, and a circular crop.
- Portrait size control covering 0.25 to 0.90 of the coin radius.
- Live preview of both sides, updating as the design changes.
- SVG export producing `commemorative-coin-obverse.svg` and
  `commemorative-coin-reverse.svg` on a 1000x1000 viewBox.
- Reset button that clears the design after confirmation.
- Single-file production build via `vite-plugin-singlefile`, yielding a standalone
  `dist/index.html` that runs offline over `file://`.
- Pre-defined coin templates in `src/templates.ts` (not yet wired into the UI).

[Unreleased]: https://github.com/RichardMcQuiston01/svg-coin-designer/compare/929b7d6...dev
[1.0.0]: https://github.com/RichardMcQuiston01/svg-coin-designer/commit/929b7d6
