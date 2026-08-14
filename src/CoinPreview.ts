/**
 * CoinPreview Component
 * Displays a live preview of the coin design
 */

import {createCurvedText, TEXT_FONT_SIZE_RATIO} from './curvedText';
import type {CoinSide} from './index';

/** Source of unique clip-path ids across every preview on the page */
let nextClipId = 0;

/**
 * Configuration for CoinPreview component
 */
export interface CoinPreviewConfig {
  /** Component ID */
  id: string;
  /** Title for this side */
  title: string;
  /** Coin side data to display */
  coinSide: CoinSide;
  /** Portrait scale (0-1, where 1 = 100% of coin radius) */
  portraitScale?: number;
}

/**
 * Creates a coin preview component
 * @param config - Component configuration
 * @returns HTMLDivElement containing the preview
 */
export function createCoinPreview(config: CoinPreviewConfig): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'card';

  // Create title
  const title = document.createElement('h3');
  title.className = 'text-lg font-semibold text-gray-800 mb-4 text-center';
  title.textContent = config.title;

  // Create preview container
  const previewContainer = document.createElement('div');
  previewContainer.className = 'coin-preview';
  previewContainer.id = config.id;

  // Create SVG preview
  updatePreview(previewContainer, config.coinSide, config.portraitScale || 0.85);

  // Assemble component
  container.appendChild(title);
  container.appendChild(previewContainer);

  return container;
}

/**
 * Updates the coin preview with current design
 * @param previewElement - Preview container element
 * @param coinSide - Coin side data to display
 * @param portraitScale - Portrait scale (0-1, where 1 = 100% of coin radius)
 */
function updatePreview(
  previewElement: HTMLElement,
  coinSide: CoinSide,
  portraitScale: number = 0.85
): void {
  const svgSize = 400;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const coinRadius = svgSize / 2 * 0.95;
  const textRadius = coinRadius * 0.85;
  const portraitRadius = coinRadius * portraitScale;
  const fontSize = svgSize * TEXT_FONT_SIZE_RATIO;

  // Create SVG
  let svg = `
    <svg width="100%" height="100%" viewBox="0 0 ${svgSize} ${svgSize}" 
         xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      
      <!-- Coin background with metallic gradient -->
      <defs>
        <radialGradient id="coinGradient" cx="30%" cy="30%">
          <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#e0e0e0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#c0c0c0;stop-opacity:1" />
        </radialGradient>
        <filter id="coinShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="2" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Coin base -->
      <circle cx="${centerX}" cy="${centerY}" r="${coinRadius}" 
              fill="url(#coinGradient)" stroke="#a0a0a0" stroke-width="3" 
              filter="url(#coinShadow)"/>
      
      <!-- Inner rim -->
      <circle cx="${centerX}" cy="${centerY}" r="${coinRadius - 10}" 
              fill="none" stroke="#888" stroke-width="1"/>
  `;

  // Add portrait if available
  if (coinSide.coinPortrait) {
    // Ids are document-wide, so the two previews need distinct ones. A counter
    // is used rather than a timestamp, which repeats across previews rendered
    // in the same millisecond and can differ between the two places it is read.
    const clipId = `portraitClip-${(nextClipId += 1)}`;
    svg += `
      <defs>
        <clipPath id="${clipId}">
          <circle cx="${centerX}" cy="${centerY}" r="${portraitRadius}"/>
        </clipPath>
      </defs>
      <image x="${centerX - portraitRadius}" y="${centerY - portraitRadius}"
             width="${portraitRadius * 2}" height="${portraitRadius * 2}"
             href="${coinSide.coinPortrait}"
             clip-path="url(#${clipId})"
             preserveAspectRatio="xMidYMid slice"
             opacity="0.9"/>
    `;
  } else {
    // Placeholder circle
    svg += `
      <circle cx="${centerX}" cy="${centerY}" r="${portraitRadius}" 
              fill="#d0d0d0" stroke="#999" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="${centerX}" y="${centerY}" 
            font-family="Arial, sans-serif" font-size="16" 
            fill="#666" text-anchor="middle" dominant-baseline="middle">
        No Image
      </text>
    `;
  }

  // Add top curved text
  if (coinSide.topCurveText.trim()) {
    svg += createCurvedText({
      text: coinSide.topCurveText.toUpperCase(),
      centerX,
      centerY,
      radius: textRadius,
      fontSize,
      isTopCurve: true,
      fill: '#333',
    });
  }

  // Add bottom curved text
  if (coinSide.bottomCurveText.trim()) {
    svg += createCurvedText({
      text: coinSide.bottomCurveText.toUpperCase(),
      centerX,
      centerY,
      radius: textRadius,
      fontSize,
      isTopCurve: false,
      fill: '#333',
    });
  }

  svg += `
    </svg>
  `;

  previewElement.innerHTML = svg;
}

/**
 * Updates an existing coin preview
 * @param previewId - ID of the preview element
 * @param coinSide - Updated coin side data
 * @param portraitScale - Portrait scale (0-1, where 1 = 100% of coin radius)
 */
export function updateCoinPreview(
  previewId: string,
  coinSide: CoinSide,
  portraitScale: number = 0.85
): void {
  const previewElement = document.getElementById(previewId);
  if (previewElement) {
    updatePreview(previewElement, coinSide, portraitScale);
  }
}
