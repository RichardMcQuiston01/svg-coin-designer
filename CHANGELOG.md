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

### Removed

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
