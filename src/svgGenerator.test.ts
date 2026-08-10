/**
 * Characterisation tests for the current SVG export contract.
 *
 * The preview and the export currently use separate renderers. These tests pin
 * the export's observable behaviour so it can be verified to survive any future
 * consolidation of the two.
 */

import {describe, expect, it} from 'vitest';
import {createDefaultSvgConfig, generateCoinSvgs} from './svgGenerator';
import type {CoinDesign} from './index';

/**
 * Builds a coin design with the given text on both sides.
 * @param topText - Text for the top curve of both sides
 * @param bottomText - Text for the bottom curve of both sides
 * @returns A design with no portrait images
 */
function createTextOnlyDesign(topText: string, bottomText: string): CoinDesign {
  const side = {
    topCurveText: topText,
    bottomCurveText: bottomText,
    coinPortrait: null,
    originalImage: null,
  };

  return {obverse: {...side}, reverse: {...side}};
}

describe('createDefaultSvgConfig', () => {
  it('defaults the portrait to 85% of the coin radius', () => {
    expect(createDefaultSvgConfig().portraitScale).toBe(0.85);
  });
});

describe('generateCoinSvgs', () => {
  it('emits a 1000x1000 viewBox for both sides', async () => {
    const result = await generateCoinSvgs(
      createTextOnlyDesign('top', 'bottom'),
      createDefaultSvgConfig(),
    );

    expect(result.success).toBe(true);
    expect(result.obverseSvg).toContain('viewBox="0 0 1000 1000"');
    expect(result.reverseSvg).toContain('viewBox="0 0 1000 1000"');
  });

  it('upper-cases curve text on export', async () => {
    const result = await generateCoinSvgs(
      createTextOnlyDesign('merry christmas', 'twenty twenty five'),
      createDefaultSvgConfig(),
    );

    expect(result.obverseSvg).toContain('MERRY CHRISTMAS');
    expect(result.obverseSvg).toContain('TWENTY TWENTY FIVE');
    expect(result.obverseSvg).not.toContain('merry christmas');
  });

  it('omits the portrait image element when no portrait is set', async () => {
    const result = await generateCoinSvgs(
      createTextOnlyDesign('top', 'bottom'),
      createDefaultSvgConfig(),
    );

    expect(result.obverseSvg).not.toContain('<image');
  });

  it('scales the portrait circle with portraitScale', async () => {
    const config = createDefaultSvgConfig();
    config.portraitScale = 0.5;

    const result = await generateCoinSvgs(
      createTextOnlyDesign('top', 'bottom'),
      config,
    );

    // coinRadius is (1000 / 2) * 0.9 = 450, so a 0.5 scale gives r="225".
    expect(result.obverseSvg).toContain('r="225"');
  });

  it('omits empty text so blank fields produce no text element', async () => {
    const result = await generateCoinSvgs(
      createTextOnlyDesign('', ''),
      createDefaultSvgConfig(),
    );

    expect(result.success).toBe(true);
    expect(result.obverseSvg).not.toContain('<text');
  });
});
