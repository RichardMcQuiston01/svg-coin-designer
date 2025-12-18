/**
 * CoinPreview Component
 * Displays a live preview of the coin design
 */

import type {CoinSide} from './index';

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
    svg += `
      <defs>
        <clipPath id="portraitClip-${Date.now()}">
          <circle cx="${centerX}" cy="${centerY}" r="${portraitRadius}"/>
        </clipPath>
      </defs>
      <image x="${centerX - portraitRadius}" y="${centerY - portraitRadius}" 
             width="${portraitRadius * 2}" height="${portraitRadius * 2}" 
             href="${coinSide.coinPortrait}" 
             clip-path="url(#portraitClip-${Date.now()})" 
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
    svg += createCurvedText(
      coinSide.topCurveText.toUpperCase(),
      centerX,
      centerY,
      textRadius,
      -90,
      true
    );
  }

  // Add bottom curved text
  if (coinSide.bottomCurveText.trim()) {
    svg += createCurvedText(
      coinSide.bottomCurveText.toUpperCase(),
      centerX,
      centerY,
      textRadius,
      90,
      false
    );
  }

  svg += `
    </svg>
  `;

  previewElement.innerHTML = svg;
}

/**
 * Creates curved text for SVG preview
 * @param text - Text to display
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param radius - Radius of text curve
 * @param startAngle - Starting angle in degrees
 * @param isTopCurve - Whether this is top or bottom curve
 * @returns SVG text element string
 */
function createCurvedText(
  text: string,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  isTopCurve: boolean
): string {
  // Calculate character positioning
  const chars = text.split('');
  const totalAngle = 120; // Total arc angle for text

  // For bottom curve, reverse direction (go counter-clockwise)
  const angleStep = (totalAngle / (chars.length - 1 || 1)) * (isTopCurve ? 1 : -1);
  const startOffset = startAngle - (totalAngle / 2) * (isTopCurve ? 1 : -1);

  let textElements = '';

  chars.forEach((char, index) => {
    const angle = (startOffset + (angleStep * index)) * (Math.PI / 180);
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    // Calculate rotation for each character
    // Bottom curve needs 180 degree offset to be readable from same orientation as top
    const baseRotation = startOffset + (angleStep * index) + 90;
    const rotation = isTopCurve ? baseRotation : baseRotation + 180;

    textElements += `
      <text x="${x}" y="${y}"
            font-family="Arial, sans-serif" font-size="18" font-weight="bold"
            fill="#333" text-anchor="middle"
            transform="rotate(${rotation} ${x} ${y})">
        ${char}
      </text>
    `;
  });

  return textElements;
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
