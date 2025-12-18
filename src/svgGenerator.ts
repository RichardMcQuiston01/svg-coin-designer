/**
 * SVG Generation Utilities
 * Creates SVG files for laser engraving with curved text and portraits
 */

import type {CoinDesign, SvgConfig, SvgGenerationResult} from './index';

/**
 * Creates a curved text path for SVG
 * @param text - The text to curve
 * @param radius - Radius of the curve
 * @param startAngle - Starting angle in degrees
 * @param isTopCurve - Whether this is top curve (true) or bottom curve (false)
 * @returns SVG path element string
 */
function createCurvedTextPath(
  text: string,
  radius: number,
  startAngle: number,
  isTopCurve: boolean
): string {
  const id = `textPath-${Math.random().toString(36).substr(2, 9)}`;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the arc length needed for the text
  const textLength = text.length * 12; // Approximate character width
  const arcAngle = (textLength / circumference) * 360;
  
  // Adjust start angle to center the text
  const centeredStartAngle = startAngle - (arcAngle / 2);
  
  // Convert angles to radians
  const startRad = (centeredStartAngle * Math.PI) / 180;
  const endRad = ((centeredStartAngle + arcAngle) * Math.PI) / 180;
  
  // Calculate start and end points
  const x1 = Math.cos(startRad) * radius;
  const y1 = Math.sin(startRad) * radius;
  const x2 = Math.cos(endRad) * radius;
  const y2 = Math.sin(endRad) * radius;
  
  // Determine sweep direction based on curve type
  const sweepFlag = isTopCurve ? 0 : 1;
  
  // Create the arc path
  const pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2} ${y2}`;
  
  return `
    <defs>
      <path id="${id}" d="${pathD}" fill="none"/>
    </defs>
    <text font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">
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
    ${createCurvedTextPath(topText.toUpperCase(), textRadius, -90, true)}
  </g>
`;
  }

  // Add bottom curved text
  if (bottomText.trim()) {
    svg += `
  <!-- Bottom curve text -->
  <g transform="translate(${centerX}, ${centerY})">
    ${createCurvedTextPath(bottomText.toUpperCase(), textRadius, 90, false)}
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
