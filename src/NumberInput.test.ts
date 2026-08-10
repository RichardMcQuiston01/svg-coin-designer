/**
 * Tests for the NumberInput component.
 *
 * @vitest-environment jsdom
 */

import {describe, expect, it} from 'vitest';
import {createNumberInput, updateNumberInputValue} from './NumberInput';
import type {NumberInputConfig} from './NumberInput';

/**
 * Builds a number input, filling in the fields every test shares.
 * @param overrides - Configuration to merge over the defaults
 * @returns The component's container element
 */
function createInput(
  overrides: Partial<NumberInputConfig> = {},
): HTMLDivElement {
  return createNumberInput({
    id: 'portraitScale',
    name: 'portraitScale',
    label: 'Portrait Size',
    value: 0.85,
    min: 0.25,
    max: 0.9,
    step: 0.05,
    unit: '%',
    onChange: () => {},
    ...overrides,
  });
}

describe('createNumberInput', () => {
  /*
   * A range input sanitises its value against whatever min/max/step are in
   * force at the moment of assignment. Assigning the value before those bounds
   * means it is sanitised against the browser defaults (min 0, max 100, step 1)
   * and cannot be recovered afterwards.
   *
   * This case uses a value above the default max of 100, because jsdom
   * implements clamping. It does not implement step snapping, so the
   * Portrait Size case below - 0.85 snapping to 1 under the default step of 1,
   * then collapsing to 0.25 - reproduces only in a real browser.
   */
  it('gives the slider a value that exceeds the default maximum', () => {
    const slider = createInput({
      value: 500,
      min: 0,
      max: 1000,
      step: 1,
    }).querySelector('input')!;

    expect(slider.value).toBe('500');
  });

  it('gives the slider the requested initial value', () => {
    const slider = createInput().querySelector('input')!;

    expect(slider.value).toBe('0.85');
  });

  it('applies the min, max, and step bounds', () => {
    const slider = createInput().querySelector('input')!;

    expect(slider.min).toBe('0.25');
    expect(slider.max).toBe('0.9');
    expect(slider.step).toBe('0.05');
  });

  it('shows the value display as a percentage', () => {
    const container = createInput();

    expect(container.textContent).toContain('85%');
  });

  it('reports the numeric value through onChange', () => {
    const received: number[] = [];
    const container = createInput({onChange: (value) => received.push(value)});

    const slider = container.querySelector('input')!;
    slider.value = '0.5';
    slider.dispatchEvent(new Event('input'));

    expect(received).toEqual([0.5]);
  });

  it('updates the value display when the slider moves', () => {
    const container = createInput();

    const slider = container.querySelector('input')!;
    slider.value = '0.5';
    slider.dispatchEvent(new Event('input'));

    expect(container.textContent).toContain('50%');
  });
});

describe('updateNumberInputValue', () => {
  it('sets the value of an existing input and notifies listeners', () => {
    const received: number[] = [];
    const container = createInput({onChange: (value) => received.push(value)});
    document.body.appendChild(container);

    updateNumberInputValue('portraitScale', 0.5);

    const slider = container.querySelector('input')!;
    expect(slider.value).toBe('0.5');
    expect(received).toEqual([0.5]);

    document.body.removeChild(container);
  });
});
