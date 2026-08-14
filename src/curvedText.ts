/**
 * Curved Text Rendering
 *
 * The single renderer for text set around the rim of a coin. Both the live
 * preview and the SVG export use it, so what a user arranges on screen is what
 * comes out of the exported file.
 */

/**
 * Font size for curved text, as a fraction of the viewBox size.
 *
 * The preview has always shown 18 units on its 400-unit viewBox; the same
 * proportion is 45 units on the export's 1000-unit viewBox.
 */
export const TEXT_FONT_SIZE_RATIO = 18 / 400;

/**
 * Average glyph advance width, as a fraction of the font size.
 *
 * Preserves the ratio the original approximation used (12 units at a font size
 * of 14) while letting the font size change independently.
 */
const CHARACTER_WIDTH_RATIO = 12 / 14;

/**
 * Cap height as a fraction of the font size, for Arial-like faces.
 *
 * Glyphs sit on the baseline and extend "up" in the path's local frame. On the
 * top arc that direction points outward, so the text occupies the band between
 * the portrait ring and the coin edge. On the bottom arc it points inward, so
 * the baseline is pushed out by this much for the glyphs to land in the same
 * band rather than across the portrait.
 */
const CAP_HEIGHT_RATIO = 0.72;

/**
 * Extra arc length beyond the estimated width of the text.
 *
 * The per-character width is only an approximation, and a renderer drops any
 * part of a `textPath` that runs past the end of its path. The slack absorbs
 * strings of wide glyphs; because the text is centred on the path, unused
 * length simply hangs off both ends and changes nothing about the spacing.
 */
const ARC_SLACK = 1.25;

/**
 * Largest arc a single curve may occupy, in degrees.
 *
 * Two curves of 170 degrees would meet at the sides of the coin. Text long
 * enough to need more than this is scaled down to fit instead.
 */
const MAX_ARC_DEGREES = 170;

/**
 * Options for rendering one curve of text.
 */
export interface CurvedTextOptions {
  /** Text to set on the curve; rendered as given */
  text: string;
  /** X coordinate of the coin centre */
  centerX: number;
  /** Y coordinate of the coin centre */
  centerY: number;
  /** Inner radius of the band the glyphs should occupy */
  radius: number;
  /** Font size in viewBox units */
  fontSize: number;
  /** True for the curve across the top of the coin, false for the bottom */
  isTopCurve: boolean;
  /** Fill colour for the glyphs */
  fill?: string;
  /** Font family for the glyphs */
  fontFamily?: string;
}

/**
 * Escapes text for inclusion in SVG markup.
 * @param value - Raw user text
 * @returns The text with XML metacharacters escaped
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
 * Radius of the baseline the glyphs are set on.
 *
 * The bottom baseline sits a cap height further out, because its glyphs grow
 * inward, so both curves land in the same band.
 *
 * @param radius - Inner radius of the text band
 * @param fontSize - Font size in viewBox units
 * @param isTopCurve - Whether this is the top curve
 * @returns Radius of the arc the text is set on
 */
function baselineRadius(
  radius: number,
  fontSize: number,
  isTopCurve: boolean,
): number {
  return isTopCurve ? radius : radius + fontSize * CAP_HEIGHT_RATIO;
}

/**
 * Angle the arc must span to hold the text at a given font size.
 * @param text - Text to be set on the curve
 * @param radius - Inner radius of the text band
 * @param fontSize - Font size in viewBox units
 * @param isTopCurve - Whether this is the top curve
 * @returns Arc angle in degrees
 */
function arcAngleFor(
  text: string,
  radius: number,
  fontSize: number,
  isTopCurve: boolean,
): number {
  const pathRadius = baselineRadius(radius, fontSize, isTopCurve);
  const arcLength = text.length * fontSize * CHARACTER_WIDTH_RATIO * ARC_SLACK;

  return (arcLength / (2 * Math.PI * pathRadius)) * 360;
}

/**
 * Largest font size at which the text still fits within MAX_ARC_DEGREES.
 * @param text - Text to be set on the curve
 * @param radius - Inner radius of the text band
 * @param fontSize - Preferred font size in viewBox units
 * @param isTopCurve - Whether this is the top curve
 * @returns The preferred size, or a reduced one for text that would overrun
 */
function fitFontSize(
  text: string,
  radius: number,
  fontSize: number,
  isTopCurve: boolean,
): number {
  const arcAngle = arcAngleFor(text, radius, fontSize, isTopCurve);
  if (arcAngle <= MAX_ARC_DEGREES) {
    return fontSize;
  }

  // Solve arcAngleFor(size) = MAX_ARC_DEGREES for the size. Scaling by the
  // overshoot would undershoot instead: the bottom curve's baseline radius
  // falls with the font size, which widens the angle back out again.
  //
  //   360 n W S f / (2 pi (r + C f)) = MAX
  //   f (360 n W S - 2 pi MAX C)     = 2 pi MAX r
  //
  // The bracket is positive whenever the limit is exceeded at all, so this is
  // always a real, smaller size.
  const capHeightRatio = isTopCurve ? 0 : CAP_HEIGHT_RATIO;
  const lengthPerUnit = text.length * CHARACTER_WIDTH_RATIO * ARC_SLACK * 360;
  const limit = 2 * Math.PI * MAX_ARC_DEGREES;

  return (limit * radius) / (lengthPerUnit - limit * capHeightRatio);
}

/**
 * Renders one curve of text around the rim of a coin.
 *
 * Both curves read left to right. Glyphs follow the direction their path
 * travels, so the bottom arc is drawn from left to right as well - reversing it
 * would turn every glyph upside down.
 *
 * @param options - Text, geometry and styling for the curve
 * @returns SVG markup for the curve, positioned about the coin centre
 */
export function createCurvedText(options: CurvedTextOptions): string {
  const {text, centerX, centerY, radius, isTopCurve} = options;
  const fill = options.fill ?? 'black';
  const fontFamily = options.fontFamily ?? 'Arial, sans-serif';

  const fontSize = fitFontSize(text, radius, options.fontSize, isTopCurve);
  const pathRadius = baselineRadius(radius, fontSize, isTopCurve);
  const arcAngle = arcAngleFor(text, radius, fontSize, isTopCurve);

  const id = `textPath-${Math.random().toString(36).slice(2, 11)}`;

  // Two independent constraints decide the arc.
  //
  // Direction: the bottom span is negated so that, like the top, it starts on
  // the left of the coin and ends on the right.
  //
  // Sweep: any two endpoints admit two arcs of the same radius, on mirrored
  // circles. Only one lies on the coin's own circle; the other bows inward
  // toward the centre of the coin.
  const centerAngle = isTopCurve ? -90 : 90;
  const span = isTopCurve ? arcAngle : -arcAngle;
  const sweepFlag = isTopCurve ? 1 : 0;

  const startDeg = centerAngle - span / 2;
  const endDeg = startDeg + span;

  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;

  const x1 = round(Math.cos(startRad) * pathRadius);
  const y1 = round(Math.sin(startRad) * pathRadius);
  const x2 = round(Math.cos(endRad) * pathRadius);
  const y2 = round(Math.sin(endRad) * pathRadius);

  const pathD = `M ${x1} ${y1} A ${round(pathRadius)} ${round(pathRadius)} 0 0 ${sweepFlag} ${x2} ${y2}`;

  return `
    <g transform="translate(${round(centerX)}, ${round(centerY)})">
      <defs>
        <path id="${id}" d="${pathD}" fill="none"/>
      </defs>
      <text font-family="${fontFamily}" font-size="${round(fontSize)}" font-weight="bold" fill="${fill}">
        <textPath href="#${id}" startOffset="50%" text-anchor="middle">${escapeXml(text)}</textPath>
      </text>
    </g>
  `;
}
