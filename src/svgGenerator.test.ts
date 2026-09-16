/**
 * Characterisation tests for the current SVG export contract.
 *
 * The export renders curved text as glyph outline paths (see
 * `glyphOutline.ts`) rather than a native `<textPath>`, so laser software
 * that does not implement `<textPath>` (xTool Creative Space, at least)
 * still gets the text. The live preview is unaffected and keeps using
 * `<textPath>` - see `curvedText.ts`'s doc comment for why.
 */

import {describe, expect, it} from 'vitest';
import {CAP_HEIGHT_RATIO} from './curvedText';
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

/**
 * Pulls out the two `<g>` wrappers - one per curve - that hold each curve's
 * glyph outline paths.
 * @param svg - Exported SVG markup
 * @returns The inner markup of each curve's group, in document order
 */
function curveGroups(svg: string): string[] {
  return [
    ...svg.matchAll(/<g transform="translate\(500, 500\)" fill="[^"]*">([\s\S]*?)<\/g>/g),
  ].map((match) => match[1]!);
}

/**
 * Pulls every glyph's placement out of one curve's group markup.
 * @param groupMarkup - One entry from curveGroups()
 * @returns One entry per glyph, in reading order
 */
function textGlyphs(
  groupMarkup: string
): Array<{x: number; y: number; rotation: number}> {
  return [
    ...groupMarkup.matchAll(
      /<path d="[^"]*" transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)"\/>/g,
    ),
  ].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
    rotation: Number(match[3]),
  }));
}

/**
 * Distance of a glyph's placement from the coin centre.
 * @param glyph - A glyph placement from textGlyphs()
 * @returns The radius the glyph sits on
 */
function glyphRadius(glyph: {x: number; y: number}): number {
  return Math.hypot(glyph.x, glyph.y);
}

describe('curved text orientation', () => {
  it('runs both curves left to right so glyphs are never upside down', async () => {
    // Each glyph's x position must strictly increase along both curves. A
    // curve running right to left would place every later glyph behind the
    // one before it - which is what the bottom curve did before glyph
    // outlines replaced <textPath> (that bug showed up as arcs running
    // backwards; the equivalent here would be decreasing x).
    const result = await generateCoinSvgs(
      createTextOnlyDesign('TOP', 'BOTTOM'),
      createDefaultSvgConfig(),
    );

    const groups = curveGroups(result.obverseSvg!);
    expect(groups).toHaveLength(2);

    for (const group of groups) {
      const glyphs = textGlyphs(group);
      expect(glyphs.length).toBeGreaterThan(1);
      for (let i = 1; i < glyphs.length; i++) {
        expect(glyphs[i]!.x).toBeGreaterThan(glyphs[i - 1]!.x);
      }
    }
  });

  it('sets both curves on a circle centred on the coin, not off to one side', async () => {
    const result = await generateCoinSvgs(
      createTextOnlyDesign('CERTIFIED NICE LIST', 'RICHARD'),
      createDefaultSvgConfig(),
    );

    for (const group of curveGroups(result.obverseSvg!)) {
      const glyphs = textGlyphs(group);
      expect(glyphs.length).toBeGreaterThan(0);

      const firstRadius = glyphRadius(glyphs[0]!);
      for (const glyph of glyphs) {
        expect(glyphRadius(glyph)).toBeCloseTo(firstRadius, 1);
      }
    }
  });

  it('keeps bottom text out of the portrait area', async () => {
    // Glyphs sit on the baseline and extend "up" in their own local frame.
    // On the top arc that points outward, into the band between the portrait
    // ring and the coin edge. On the bottom arc it points inward, so the
    // bottom baseline has to sit further out for its glyphs to land in the
    // same band instead of over the portrait.
    const result = await generateCoinSvgs(
      createTextOnlyDesign('TOP', 'BOTTOM'),
      createDefaultSvgConfig(),
    );

    const [topGroup, bottomGroup] = curveGroups(result.obverseSvg!);
    const topRadius = glyphRadius(textGlyphs(topGroup!)[0]!);
    const bottomRadius = glyphRadius(textGlyphs(bottomGroup!)[0]!);

    expect(bottomRadius).toBeGreaterThan(topRadius);
  });

  it('keeps both curves inside the coin outline', async () => {
    const result = await generateCoinSvgs(
      createTextOnlyDesign('TOP', 'BOTTOM'),
      createDefaultSvgConfig(),
    );

    // coinRadius is (1000 / 2) * 0.9 = 450.
    for (const group of curveGroups(result.obverseSvg!)) {
      for (const glyph of textGlyphs(group)) {
        expect(glyphRadius(glyph)).toBeLessThanOrEqual(450);
      }
    }
  });

  it('renders text large enough to engrave', async () => {
    // Top curve radius is textRadius (382.5); bottom curve radius is
    // textRadius + fontSize * CAP_HEIGHT_RATIO. Font size should be 45 (the
    // preview has always shown 18 on its 400-unit viewBox, the same
    // proportion), so the two curves' radii should differ by close to
    // 45 * CAP_HEIGHT_RATIO.
    const result = await generateCoinSvgs(
      createTextOnlyDesign('TOP', 'BOTTOM'),
      createDefaultSvgConfig(),
    );

    const [topGroup, bottomGroup] = curveGroups(result.obverseSvg!);
    const topRadius = glyphRadius(textGlyphs(topGroup!)[0]!);
    const bottomRadius = glyphRadius(textGlyphs(bottomGroup!)[0]!);

    expect(bottomRadius - topRadius).toBeCloseTo(45 * CAP_HEIGHT_RATIO, 0);
  });

  it('widens the arc to match the larger text', async () => {
    // The arc length must track the text length, or a long string crowds
    // into itself or overruns the coin edge.
    const short = await generateCoinSvgs(
      createTextOnlyDesign('AB', ''),
      createDefaultSvgConfig(),
    );
    const long = await generateCoinSvgs(
      createTextOnlyDesign('ABCDEFGH', ''),
      createDefaultSvgConfig(),
    );

    const span = (svg: string) => {
      const xs = textGlyphs(curveGroups(svg)[0]!).map((glyph) => glyph.x);
      return Math.max(...xs) - Math.min(...xs);
    };

    expect(span(long.obverseSvg!)).toBeGreaterThan(span(short.obverseSvg!));
  });
});

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
    // Glyph outlines carry no literal text content to assert on, so this
    // proves upper-casing by equivalence instead: whatever case the user
    // typed, the rendered glyphs come out identical.
    const lower = await generateCoinSvgs(
      createTextOnlyDesign('merry christmas', 'twenty twenty five'),
      createDefaultSvgConfig(),
    );
    const upper = await generateCoinSvgs(
      createTextOnlyDesign('MERRY CHRISTMAS', 'TWENTY TWENTY FIVE'),
      createDefaultSvgConfig(),
    );

    expect(lower.obverseSvg).toBe(upper.obverseSvg);
    expect(lower.reverseSvg).toBe(upper.reverseSvg);
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

  it('omits empty text so blank fields produce no glyph paths', async () => {
    const result = await generateCoinSvgs(
      createTextOnlyDesign('', ''),
      createDefaultSvgConfig(),
    );

    expect(result.success).toBe(true);
    expect(result.obverseSvg).not.toContain('<path');
  });
});
