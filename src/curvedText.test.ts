/**
 * Tests for the shared curved text renderer used by the preview and the export.
 */

import {describe, expect, it} from 'vitest';
import {createCurvedText, TEXT_FONT_SIZE_RATIO} from './curvedText';

/**
 * Pulls the arc out of a rendered curve.
 * @param markup - Markup returned by createCurvedText
 * @returns The arc's start point, radius, sweep flag and end point
 */
function arc(markup: string): {
  startX: number;
  startY: number;
  radius: number;
  sweep: number;
  endX: number;
  endY: number;
} {
  const match = /d="M (\S+) (\S+) A (\S+) \S+ 0 \d (\d) (\S+) (\S+)"/.exec(
    markup,
  );
  if (!match) {
    throw new Error(`No arc found in: ${markup}`);
  }

  return {
    startX: Number(match[1]),
    startY: Number(match[2]),
    radius: Number(match[3]),
    sweep: Number(match[4]),
    endX: Number(match[5]),
    endY: Number(match[6]),
  };
}

/**
 * Reads the font size off a rendered curve.
 * @param markup - Markup returned by createCurvedText
 * @returns The font size in viewBox units
 */
function fontSizeOf(markup: string): number {
  return Number(/font-size="([\d.]+)"/.exec(markup)?.[1]);
}

/**
 * Renders a curve with defaults suited to the 1000-unit export viewBox.
 * @param text - Text to set on the curve
 * @param isTopCurve - Whether this is the top curve
 * @returns Rendered markup
 */
function render(text: string, isTopCurve: boolean): string {
  return createCurvedText({
    text,
    centerX: 500,
    centerY: 500,
    radius: 382.5,
    fontSize: 45,
    isTopCurve,
  });
}

describe('createCurvedText', () => {
  it('spans an arc proportional to the length of the text', () => {
    // A fixed arc, which the preview used to draw, spread short text across the
    // whole rim and crammed long text into the same span.
    const shortSpan = arc(render('AB', false));
    const longSpan = arc(render('ABCDEFGH', false));

    expect(shortSpan.endX - shortSpan.startX).toBeGreaterThan(0);
    expect(longSpan.endX - longSpan.startX).toBeGreaterThan(
      shortSpan.endX - shortSpan.startX,
    );
  });

  it('runs both curves left to right so glyphs are never upside down', () => {
    for (const isTopCurve of [true, false]) {
      const {startX, endX} = arc(render('SOME TEXT', isTopCurve));
      expect(endX).toBeGreaterThan(startX);
    }
  });

  it('draws the top curve above the centre and the bottom curve below', () => {
    // y grows downward in SVG, so the top arc's endpoints are negative.
    expect(arc(render('TOP', true)).startY).toBeLessThan(0);
    expect(arc(render('BOTTOM', false)).startY).toBeGreaterThan(0);
  });

  it('sets the bottom baseline a cap height further out', () => {
    // Bottom glyphs grow inward, so their baseline has to sit outside the top
    // one for both curves to occupy the same band.
    const top = arc(render('TOP', true));
    const bottom = arc(render('BOTTOM', false));

    expect(bottom.radius).toBeGreaterThan(top.radius);
    expect(bottom.radius - top.radius).toBeCloseTo(45 * 0.72, 3);
  });

  it('keeps the requested font size for text that fits', () => {
    expect(fontSizeOf(render('HAPPY BIRTHDAY', true))).toBe(45);
  });

  it('shrinks text that would otherwise run past the opposite curve', () => {
    const long = render('A'.repeat(60), false);

    expect(fontSizeOf(long)).toBeLessThan(45);
    // The arc must stay clear of the sides of the coin, where the other curve
    // would meet it.
    const {startX, startY, endX, endY, radius} = arc(long);
    const angle = (x: number, y: number) => (Math.atan2(y, x) * 180) / Math.PI;
    const span = Math.abs(angle(startX, startY) - angle(endX, endY));

    expect(span).toBeLessThanOrEqual(170.001);
    expect(radius).toBeGreaterThan(0);
  });

  it('escapes XML metacharacters in user text', () => {
    const markup = render('ROSE & CROWN <3', true);

    expect(markup).toContain('ROSE &amp; CROWN &lt;3');
    expect(markup).not.toContain('& CROWN');
  });

  it('positions the curve about the given centre', () => {
    expect(render('TEXT', true)).toContain('translate(500, 500)');
  });

  it('gives each curve its own path id so curves do not share a path', () => {
    const ids = [render('ONE', true), render('TWO', false)].map(
      (markup) => /<path id="(\S+)"/.exec(markup)?.[1],
    );

    expect(ids[0]).toBeDefined();
    expect(ids[0]).not.toBe(ids[1]);
  });
});

describe('TEXT_FONT_SIZE_RATIO', () => {
  it('gives the preview and the export matching text proportions', () => {
    expect(400 * TEXT_FONT_SIZE_RATIO).toBe(18);
    expect(1000 * TEXT_FONT_SIZE_RATIO).toBe(45);
  });
});
