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

### Changed

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

### Removed

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
