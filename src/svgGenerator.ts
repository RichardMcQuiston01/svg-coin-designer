/**
 * SVG Generation Utilities
 * Creates SVG files for laser engraving with curved text and portraits
 */

import type {CoinDesign, SvgConfig, SvgGenerationResult} from './index';

/**
 * Font size for curved text, in viewBox units.
 *
 * The export previously hard-coded 14 on a 1000-unit viewBox - about 1.4% of
 * the coin diameter, too small to engrave. This is the proportion the live
 * preview has always shown: 18 units on its 400-unit viewBox.
 */
const TEXT_FONT_SIZE = 45;

/**
 * Average glyph advance width, as a fraction of the font size.
 *
 * Preserves the ratio the original approximation used (12 units at a font size
 * of 14) while letting the font size change independently.
 */
const CHARACTER_WIDTH_RATIO = 12 / 14;

/**
 * Creates a curved text path for SVG
 * @param text - The text to curve
 * @param radius - Radius of the curve
 * @param isTopCurve - Whether this is top curve (true) or bottom curve (false)
 * @returns SVG path element string
 */
function createCurvedTextPath(
  text: string,
  radius: number,
  isTopCurve: boolean
): string {
  const id = `textPath-${Math.random().toString(36).slice(2, 11)}`;
  const circumference = 2 * Math.PI * radius;

  // Arc length needed for the text, tracking the font size so larger text gets
  // a proportionally longer path to sit on.
  const textLength = text.length * TEXT_FONT_SIZE * CHARACTER_WIDTH_RATIO;
  const arcAngle = (textLength / circumference) * 360;

  // Two independent constraints decide the arc.
  //
  // Direction: glyphs follow the path's travel, so both arcs must run left to
  // right or the text renders upside down. The bottom span is negated so it
  // still starts on the left.
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

  const x1 = Math.cos(startRad) * radius;
  const y1 = Math.sin(startRad) * radius;
  const x2 = Math.cos(endRad) * radius;
  const y2 = Math.sin(endRad) * radius;

  const pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2} ${y2}`;

  return `
    <defs>
      <path id="${id}" d="${pathD}" fill="none"/>
    </defs>
    <text font-family="Arial, sans-serif" font-size="${TEXT_FONT_SIZE}" font-weight="bold" fill="black">
      <textPath href="#${id}" startOffset="50%" text-anchor="middle">
        ${text}
      </textPath>
    </text>
  `;
}

/**
 * Generates SVG for a single coin side
 * @param text - Top curve text
 * @param bottomText - Bottom curve text
 * @param portraitData - Base64 image data for portrait
 * @param config - SVG configuration
 * @returns SVG string
 */
function generateCoinSideSvg(
  topText: string,
  bottomText: string,
  portraitData: string | null,
  config: SvgConfig
): string {
  const svgSize = 1000; // Fixed SVG viewBox size
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const coinRadius = (svgSize / 2) * 0.9; // 90% of SVG size
  const textRadius = coinRadius * 0.85; // Text at 85% of coin radius
  const portraitRadius = coinRadius * config.portraitScale;

  // Create the SVG header
  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" 
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  
  <!-- Coin outline -->
  <circle cx="${centerX}" cy="${centerY}" r="${coinRadius}" 
          fill="none" stroke="black" stroke-width="2"/>
  
  <!-- Inner circle for portrait area -->
  <circle cx="${centerX}" cy="${centerY}" r="${portraitRadius}" 
          fill="none" stroke="black" stroke-width="1" stroke-dasharray="5,5"/>
`;

  // Add portrait image if provided
  if (portraitData) {
    svg += `
  <!-- Portrait image -->
  <defs>
    <clipPath id="portraitClip">
      <circle cx="${centerX}" cy="${centerY}" r="${portraitRadius}"/>
    </clipPath>
  </defs>
  <image x="${centerX - portraitRadius}" y="${centerY - portraitRadius}" 
         width="${portraitRadius * 2}" height="${portraitRadius * 2}" 
         href="${portraitData}" clip-path="url(#portraitClip)" preserveAspectRatio="xMidYMid slice"/>
`;
  }

  // Add top curved text
  if (topText.trim()) {
    svg += `
  <!-- Top curve text -->
  <g transform="translate(${centerX}, ${centerY})">
    ${createCurvedTextPath(topText.toUpperCase(), textRadius, true)}
  </g>
`;
  }

  // Add bottom curved text
  if (bottomText.trim()) {
    svg += `
  <!-- Bottom curve text -->
  <g transform="translate(${centerX}, ${centerY})">
    ${createCurvedTextPath(bottomText.toUpperCase(), textRadius, false)}
  </g>
`;
  }

  svg += `
</svg>`;

  return svg;
}

/**
 * Generates SVG files for both sides of the coin
 * @param design - Complete coin design
 * @param config - SVG configuration
 * @returns Promise resolving to generation result
 */
export async function generateCoinSvgs(
  design: CoinDesign,
  config: SvgConfig
): Promise<SvgGenerationResult> {
  try {
    // Generate obverse (front) SVG
    const obverseSvg = generateCoinSideSvg(
      design.obverse.topCurveText,
      design.obverse.bottomCurveText,
      design.obverse.coinPortrait,
      config
    );

    // Generate reverse (back) SVG
    const reverseSvg = generateCoinSideSvg(
      design.reverse.topCurveText,
      design.reverse.bottomCurveText,
      design.reverse.coinPortrait,
      config
    );

    return {
      success: true,
      obverseSvg,
      reverseSvg,
    };
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error occurred during SVG generation';

    console.error('SVG generation error:', error);
    return {
      success: false,
      errorMessage,
    };
  }
}

/**
 * Creates a default SVG configuration object
 * @returns Default SVG configuration
 */
export function createDefaultSvgConfig(): SvgConfig {
  return {
    coinDiameter: 40, // 40mm diameter
    dpi: 300,
    fontFamily: 'Arial, sans-serif',
    fontSize: 14,
    portraitScale: 0.85, // Portrait is 85% of coin diameter
  };
}

/**
 * Downloads an SVG as a file
 * @param svgContent - The SVG content to download
 * @param filename - Desired filename
 */
export function downloadSvg(svgContent: string, filename: string): void {
  try {
    const blob = new Blob([svgContent], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading SVG:', error);
    throw new Error('Failed to download SVG file');
  }
}

/**
 * Downloads both coin side SVGs as separate files
 * @param result - SVG generation result
 * @param baseName - Base filename (will be suffixed with -obverse/-reverse)
 */
export function downloadCoinSvgs(
  result: SvgGenerationResult,
  baseName: string = 'coin'
): void {
  if (!result.success || !result.obverseSvg || !result.reverseSvg) {
    throw new Error('Cannot download SVGs: Generation was not successful');
  }

  downloadSvg(result.obverseSvg, `${baseName}-obverse.svg`);
  
  // Small delay to prevent browser from blocking multiple downloads
  setTimeout(() => {
    downloadSvg(result.reverseSvg!, `${baseName}-reverse.svg`);
  }, 100);
}
