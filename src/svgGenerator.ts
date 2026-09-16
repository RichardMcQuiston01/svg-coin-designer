/**
 * SVG Generation Utilities
 * Creates SVG files for laser engraving with curved text and portraits
 */

import {createCurvedText, TEXT_FONT_SIZE_RATIO} from './curvedText';
import type {
  CoinDesign,
  CoinDisplaySettings,
  FontOption,
  SvgConfig,
  SvgGenerationResult,
} from './index';

/**
 * Fonts offered in the display settings panel, applied to the curved text in
 * both the live preview and the exported SVG.
 */
export const FONT_OPTIONS: FontOption[] = [
  {id: 'sans', label: 'Sans Serif (Arial)', value: 'Arial, Helvetica, sans-serif'},
  {
    id: 'serif',
    label: 'Serif (Times New Roman)',
    value: "'Times New Roman', Times, serif",
  },
  {
    id: 'mono',
    label: 'Monospace (Courier New)',
    value: "'Courier New', Courier, monospace",
  },
];

/**
 * Creates the default display settings (portrait size, font, text offset)
 * shared by the live preview and SVG export
 * @returns Default display settings
 */
export function createDefaultDisplaySettings(): CoinDisplaySettings {
  return {
    portraitScale: 0.85, // Portrait is 85% of coin diameter
    fontFamily: FONT_OPTIONS[0]!.value,
    textRadiusScale: 0.85, // Curved text at 85% of the coin radius
  };
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
  const textRadius = coinRadius * config.textRadiusScale;
  const portraitRadius = coinRadius * config.portraitScale;
  const fontSize = svgSize * TEXT_FONT_SIZE_RATIO;

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
  ${createCurvedText({
    text: topText.toUpperCase(),
    centerX,
    centerY,
    radius: textRadius,
    fontSize,
    isTopCurve: true,
    fontFamily: config.fontFamily,
  })}
`;
  }

  // Add bottom curved text
  if (bottomText.trim()) {
    svg += `
  <!-- Bottom curve text -->
  ${createCurvedText({
    text: bottomText.toUpperCase(),
    centerX,
    centerY,
    radius: textRadius,
    fontSize,
    isTopCurve: false,
    fontFamily: config.fontFamily,
  })}
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
    fontSize: 14,
    ...createDefaultDisplaySettings(),
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
