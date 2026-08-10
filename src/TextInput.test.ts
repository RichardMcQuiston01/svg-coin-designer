/**
 * Tests for the TextInput component.
 *
 * These also serve as the smoke test that the jsdom environment is wired up,
 * since every component in this codebase builds real DOM nodes.
 *
 * @vitest-environment jsdom
 */

import {describe, expect, it} from 'vitest';
import {createTextInput} from './TextInput';

describe('createTextInput', () => {
  it('renders a label bound to the input', () => {
    const container = createTextInput({
      id: 'obverseTopCurveText',
      name: 'obverseTopCurveText',
      label: 'Top Curve Text',
      placeholder: 'Enter text',
      value: '',
      onChange: () => {},
    });

    const label = container.querySelector('label');
    const input = container.querySelector('input');

    expect(label?.textContent).toBe('Top Curve Text');
    expect(label?.htmlFor).toBe('obverseTopCurveText');
    expect(input?.id).toBe('obverseTopCurveText');
  });

  it('reports each keystroke through onChange', () => {
    const received: string[] = [];
    const container = createTextInput({
      id: 'test',
      name: 'test',
      label: 'Test',
      placeholder: '',
      value: '',
      onChange: (value: string) => received.push(value),
    });

    const input = container.querySelector('input')!;
    input.value = 'NOEL';
    input.dispatchEvent(new Event('input'));

    expect(received).toEqual(['NOEL']);
  });

  it('shows a character counter when maxLength is set', () => {
    const container = createTextInput({
      id: 'test',
      name: 'test',
      label: 'Test',
      placeholder: '',
      value: 'ABC',
      maxLength: 50,
      onChange: () => {},
    });

    expect(container.textContent).toContain('3/50');
  });

  it('omits the character counter when maxLength is absent', () => {
    const container = createTextInput({
      id: 'test',
      name: 'test',
      label: 'Test',
      placeholder: '',
      value: 'ABC',
      onChange: () => {},
    });

    expect(container.textContent).not.toContain('/');
  });
});
