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

/**
 * Recovers the centre of a circular arc from its endpoint parameterisation,
 * following the conversion in the SVG specification (F.6.5).
 *
 * @param x1 - Start x
 * @param y1 - Start y
 * @param x2 - End x
 * @param y2 - End y
 * @param radius - Arc radius
 * @param largeArc - SVG large-arc flag
 * @param sweep - SVG sweep flag
 * @returns Centre of the circle the arc lies on
 */
function arcCenter(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radius: number,
  largeArc: number,
  sweep: number,
): {x: number; y: number} {
  const midX = (x1 - x2) / 2;
  const midY = (y1 - y2) / 2;
  const numerator =
    radius ** 4 - radius ** 2 * midY ** 2 - radius ** 2 * midX ** 2;
  const denominator = radius ** 2 * midY ** 2 + radius ** 2 * midX ** 2;
  const scale =
    (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));

  return {
    x: scale * midY + (x1 + x2) / 2,
    y: -scale * midX + (y1 + y2) / 2,
  };
}

/**
 * Pulls every text arc out of an exported SVG.
 * @param svg - Exported SVG markup
 * @returns One entry per curved text path
 */
function textArcs(svg: string): Array<{
  startX: number;
  startY: number;
  radius: number;
  largeArc: number;
  sweep: number;
  endX: number;
  endY: number;
}> {
  return [
    ...svg.matchAll(/d="M (\S+) (\S+) A (\S+) \S+ 0 (\d) (\d) (\S+) (\S+)"/g),
  ].map((match) => ({
    startX: Number(match[1]),
    startY: Number(match[2]),
    radius: Number(match[3]),
    largeArc: Number(match[4]),
    sweep: Number(match[5]),
    endX: Number(match[6]),
    endY: Number(match[7]),
  }));
}

describe('curved text orientation', () => {
  it('runs both curves left to right so glyphs are never upside down', async () => {
    // Text on a textPath follows the path's direction of travel. An arc running
    // right to left renders every glyph rotated 180 degrees, which is what the
    // bottom curve did in exported files.
    const result = await generateCoinSvgs(
      createTextOnlyDesign('TOP', 'BOTTOM'),
      createDefaultSvgConfig(),
    );

    const arcs = textArcs(result.obverseSvg!);
    expect(arcs).toHaveLength(2);

    for (const arc of arcs) {
      expect(arc.endX).toBeGreaterThan(arc.startX);
    }
  });

  it("sets both curves on the coin's own circle, not the mirrored one", async () => {
    // Any two endpoints admit two arcs of equal radius, on mirrored circles.
    // Only one is the coin's circle; the other bows inward toward the middle.
    // Text coordinates are relative to the coin centre, so a correct arc
    // resolves to (0, 0).
    const result = await generateCoinSvgs(
      createTextOnlyDesign('CERTIFIED NICE LIST', 'RICHARD'),
      createDefaultSvgConfig(),
    );

    for (const arc of textArcs(result.obverseSvg!)) {
      const center = arcCenter(
        arc.startX,
        arc.startY,
        arc.endX,
        arc.endY,
        arc.radius,
        arc.largeArc,
        arc.sweep,
      );

      expect(center.x).toBeCloseTo(0, 2);
      expect(center.y).toBeCloseTo(0, 2);
    }
  });

  it('renders text large enough to engrave', async () => {
    // 14 units on a 1000 viewBox is 1.4% of the coin diameter. The preview has
    // always shown 18 on a 400 viewBox, which is the same proportion as 45 here.
    const result = await generateCoinSvgs(
      createTextOnlyDesign('TOP', 'BOTTOM'),
      createDefaultSvgConfig(),
    );

    const fontSize = Number(/font-size="([\d.]+)"/.exec(result.obverseSvg!)?.[1]);
    expect(fontSize).toBe(45);
  });

  it('widens the arc to match the larger text', async () => {
    // The arc length must track the font size, or the text overflows the path
    // it is set on.
    const short = await generateCoinSvgs(
      createTextOnlyDesign('AB', ''),
      createDefaultSvgConfig(),
    );
    const long = await generateCoinSvgs(
      createTextOnlyDesign('ABCDEFGH', ''),
      createDefaultSvgConfig(),
    );

    const span = (svg: string) => {
      const arc = textArcs(svg)[0]!;
      return arc.endX - arc.startX;
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
