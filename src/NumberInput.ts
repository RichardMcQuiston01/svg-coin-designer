/**
 * NumberInput Component
 * Reusable number input field with label, range slider, and validation
 */

/**
 * Configuration for NumberInput component
 */
export interface NumberInputConfig {
  /** Input field ID */
  id: string;
  /** Input field name attribute */
  name: string;
  /** Label text */
  label: string;
  /** Initial value */
  value: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Unit to display (e.g., '%', 'px', 'mm') */
  unit?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Change event handler */
  onChange: (value: number) => void;
}

/**
 * Creates a number input component with range slider
 * @param config - Component configuration
 * @returns HTMLDivElement containing the input field and slider
 */
export function createNumberInput(config: NumberInputConfig): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'mb-4';

  // Create label
  const label = document.createElement('label');
  label.htmlFor = config.id;
  label.className = 'form-label';
  label.textContent = config.label;

  // Create input wrapper (flex container for input and value display)
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'flex items-center gap-3';

  // Create range slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = config.id;
  slider.name = config.name;
  slider.className = 'flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer';
  slider.value = config.value.toString();

  if (config.min !== undefined) {
    slider.min = config.min.toString();
  }
  if (config.max !== undefined) {
    slider.max = config.max.toString();
  }
  if (config.step !== undefined) {
    slider.step = config.step.toString();
  }

  // Create value display
  const valueDisplay = document.createElement('div');
  valueDisplay.className = 'text-lg font-semibold text-gray-700 min-w-[4rem] text-right';
  valueDisplay.textContent = `${Math.round(config.value * 100)}${config.unit || ''}`;

  // Add change event listener
  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const numValue = parseFloat(target.value);

    // Update value display
    valueDisplay.textContent = `${Math.round(numValue * 100)}${config.unit || ''}`;

    // Call onChange callback
    config.onChange(numValue);
  };

  slider.addEventListener('input', handleChange);

  // Assemble input wrapper
  inputWrapper.appendChild(slider);
  inputWrapper.appendChild(valueDisplay);

  // Assemble component
  container.appendChild(label);
  container.appendChild(inputWrapper);

  // Add helper text if specified
  if (config.helperText) {
    const helper = document.createElement('div');
    helper.className = 'text-xs text-gray-500 mt-1';
    helper.textContent = config.helperText;
    container.appendChild(helper);
  }

  return container;
}

/**
 * Updates the value of an existing number input
 * @param inputId - ID of the input to update
 * @param value - New value
 */
export function updateNumberInputValue(inputId: string, value: number): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  if (input) {
    input.value = value.toString();
    // Trigger input event to update any listeners
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }
}
