/**
 * Curved Text Outline Rendering
 *
 * Renders text set around the rim of a coin as real glyph outline paths,
 * for laser software whose SVG import does not implement `<textPath>` (see
 * `curvedText.ts`'s doc comment for why this exists). Each character's own
 * glyph outline, from a bundled Liberation Bold font (see `src/assets/fonts/`),
 * is positioned and rotated along the same arc geometry `curvedText.ts` would
 * use, then baked into a plain filled `<path>`: no `<textPath>`, no font
 * substitution, nothing beyond geometry any SVG importer can draw.
 *
 * Only the SVG export uses this. The live preview keeps using
 * `curvedText.ts`'s native `<textPath>`, which every browser renders
 * correctly and instantly - no font loading required.
 */

import {parse} from 'opentype.js';
import type {Font} from 'opentype.js';
import {CAP_HEIGHT_RATIO, MAX_ARC_DEGREES} from './curvedText';
import type {FontOption} from './index';

// `?inline` resolves to a self-contained data: URI at build/transform time,
// rather than a dev-server-relative path fetched at runtime - the latter has
// no `location` to resolve against outside a browser, which breaks under
// Vitest's plain node test environment.
import LiberationSansBoldUrl from './assets/fonts/LiberationSans-Bold.ttf?inline';
import LiberationSerifBoldUrl from './assets/fonts/LiberationSerif-Bold.ttf?inline';
import LiberationMonoBoldUrl from './assets/fonts/LiberationMono-Bold.ttf?inline';

/** Bundled outline font (Liberation Bold) for each FONT_OPTIONS id. */
const OUTLINE_FONT_URLS: Record<string, string> = {
  sans: LiberationSansBoldUrl,
  serif: LiberationSerifBoldUrl,
  mono: LiberationMonoBoldUrl,
};

/** Parsed fonts are cached by URL so repeated exports don't re-fetch/re-parse. */
const fontCache = new Map<string, Promise<Font>>();

/**
 * Resolves a `CoinDisplaySettings.fontFamily` CSS value back to the
 * `FONT_OPTIONS` id it came from, to look up the matching outline font.
 * @param fontFamily - CSS font-family value stored on CoinDisplaySettings
 * @param fontOptions - the app's FONT_OPTIONS list
 * @returns The matching id, or the first option's id if none matches
 */
export function resolveFontOptionId(
  fontFamily: string,
  fontOptions: FontOption[]
): string {
  return (
    fontOptions.find((option) => option.value === fontFamily)?.id ??
    fontOptions[0]!.id
  );
}

/**
 * Loads (and caches) the bundled outline font for a FONT_OPTIONS id.
 * @param fontOptionId - id field of the selected FontOption
 * @returns The parsed font
 */
function loadOutlineFont(fontOptionId: string): Promise<Font> {
  const url = OUTLINE_FONT_URLS[fontOptionId] ?? OUTLINE_FONT_URLS.sans!;
  let cached = fontCache.get(url);
  if (!cached) {
    cached = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((buffer) => parse(buffer));
    fontCache.set(url, cached);
  }
  return cached;
}

/**
 * Rounds a coordinate to keep generated markup readable.
 * @param value - Value to round
 * @returns The value with at most three decimal places
 */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Radius of the baseline the glyphs are set on - identical to
 * `curvedText.ts`'s private `baselineRadius`, kept local since it is a
 * two-line formula not worth exporting a whole function for.
 * @param radius - Inner radius of the text band
 * @param fontSize - Font size in viewBox units
 * @param isTopCurve - Whether this is the top curve
 * @returns Radius of the arc the glyphs are set on
 */
function baselineRadius(
  radius: number,
  fontSize: number,
  isTopCurve: boolean
): number {
  return isTopCurve ? radius : radius + fontSize * CAP_HEIGHT_RATIO;
}

/**
 * Angle the arc must span to hold a string of the given true width.
 * @param widthAtFontSize - True width of the string at the given font size
 * @param radius - Inner radius of the text band
 * @param fontSize - Font size in viewBox units
 * @param isTopCurve - Whether this is the top curve
 * @returns Arc angle in degrees
 */
function arcAngleForWidth(
  widthAtFontSize: number,
  radius: number,
  fontSize: number,
  isTopCurve: boolean
): number {
  const pathRadius = baselineRadius(radius, fontSize, isTopCurve);
  return (widthAtFontSize / (2 * Math.PI * pathRadius)) * 360;
}

/**
 * Largest font size at which the string still fits within MAX_ARC_DEGREES.
 *
 * Mirrors `curvedText.ts`'s private `fitFontSize`, with the estimated
 * `text.length * CHARACTER_WIDTH_RATIO * ARC_SLACK` term replaced by the
 * glyphs' true total advance width - exact here instead of approximated,
 * since the actual font is already loaded to draw the outlines anyway.
 *
 * @param totalAdvanceUnits - Sum of the string's glyph advance widths, in font units
 * @param unitsPerEm - The font's units-per-em
 * @param radius - Inner radius of the text band
 * @param fontSize - Preferred font size in viewBox units
 * @param isTopCurve - Whether this is the top curve
 * @returns The preferred size, or a reduced one for text that would overrun
 */
function fitFontSize(
  totalAdvanceUnits: number,
  unitsPerEm: number,
  radius: number,
  fontSize: number,
  isTopCurve: boolean
): number {
  const widthAtFontSize = totalAdvanceUnits * (fontSize / unitsPerEm);
  const arcAngle = arcAngleForWidth(widthAtFontSize, radius, fontSize, isTopCurve);
  if (arcAngle <= MAX_ARC_DEGREES) {
    return fontSize;
  }

  const capHeightRatio = isTopCurve ? 0 : CAP_HEIGHT_RATIO;
  const widthPerFontSizeUnit = totalAdvanceUnits / unitsPerEm;
  const lengthPerUnit = widthPerFontSizeUnit * 360;
  const limit = 2 * Math.PI * MAX_ARC_DEGREES;

  return (limit * radius) / (lengthPerUnit - limit * capHeightRatio);
}

/**
 * Options for rendering one curve of text as glyph outlines.
 */
export interface CurvedOutlineOptions {
  /** Text to set on the curve; rendered as given (the caller upper-cases) */
  text: string;
  /** X coordinate of the coin centre */
  centerX: number;
  /** Y coordinate of the coin centre */
  centerY: number;
  /** Inner radius of the band the glyphs should occupy */
  radius: number;
  /** Font size in viewBox units, before any shrink-to-fit */
  fontSize: number;
  /** True for the curve across the top of the coin, false for the bottom */
  isTopCurve: boolean;
  /** Fill colour for the glyphs */
  fill: string;
  /** FONT_OPTIONS id selecting which bundled outline font to use */
  fontOptionId: string;
}

/**
 * Renders one curve of text around the rim of a coin as glyph outline paths.
 *
 * Follows the same direction, sweep, and baseline conventions as
 * `curvedText.ts`'s native `<textPath>` renderer (both curves read left to
 * right; the bottom curve's baseline sits a cap height further out) so the
 * two look the same, just built from different SVG primitives.
 *
 * @param options - Text, geometry and styling for the curve
 * @returns SVG markup for the curve, positioned about the coin centre
 */
export async function createCurvedTextOutline(
  options: CurvedOutlineOptions
): Promise<string> {
  const {text, centerX, centerY, radius, isTopCurve, fill, fontOptionId} = options;

  if (!text.trim()) {
    return '';
  }

  const font = await loadOutlineFont(fontOptionId);
  const glyphs = [...text].map((char) => font.charToGlyph(char));
  const totalAdvanceUnits = glyphs.reduce(
    (sum, glyph) => sum + (glyph.advanceWidth ?? 0),
    0
  );

  const fontSize = fitFontSize(
    totalAdvanceUnits,
    font.unitsPerEm,
    radius,
    options.fontSize,
    isTopCurve
  );
  const pathRadius = baselineRadius(radius, fontSize, isTopCurve);
  const totalWidth = totalAdvanceUnits * (fontSize / font.unitsPerEm);
  const arcAngle = arcAngleForWidth(totalWidth, radius, fontSize, isTopCurve);

  // Same two constraints as curvedText.ts: direction (both curves read left
  // to right) and sweep (the arc bows along the coin's own circle).
  const centerAngle = isTopCurve ? -90 : 90;
  const span = isTopCurve ? arcAngle : -arcAngle;
  const startDeg = centerAngle - span / 2;

  let cumulativeWidth = 0;
  const glyphPaths: string[] = [];

  for (const glyph of glyphs) {
    const advance = (glyph.advanceWidth ?? 0) * (fontSize / font.unitsPerEm);
    const t = totalWidth > 0 ? cumulativeWidth / totalWidth : 0;
    const angleDeg = startDeg + span * t;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = Math.cos(angleRad) * pathRadius;
    const y = Math.sin(angleRad) * pathRadius;

    // The glyph's own "up" direction points outward on the top curve and
    // inward on the bottom one (see CAP_HEIGHT_RATIO's doc comment) - a
    // rotation of (angle + 90) for the top curve and (angle - 90) for the
    // bottom one lands the glyph upright at the pole and leaning correctly
    // away from it, in both cases.
    const rotationDeg = angleDeg + (isTopCurve ? 90 : -90);

    const glyphPath = glyph.getPath(0, 0, fontSize);
    const d = glyphPath.toPathData(2);
    if (d) {
      glyphPaths.push(
        `<path d="${d}" transform="translate(${round(x)} ${round(y)}) rotate(${round(rotationDeg)})"/>`
      );
    }

    cumulativeWidth += advance;
  }

  return `
    <g transform="translate(${round(centerX)}, ${round(centerY)})" fill="${fill}">
      ${glyphPaths.join('\n      ')}
    </g>
  `;
}
