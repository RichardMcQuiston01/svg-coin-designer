/**
 * TextInput Component
 * Reusable text input field with label and validation
 */

/**
 * Configuration for TextInput component
 */
export interface TextInputConfig {
  /** Input field ID */
  id: string;
  /** Input field name attribute */
  name: string;
  /** Label text */
  label: string;
  /** Placeholder text */
  placeholder: string;
  /** Initial value */
  value: string;
  /** Maximum character length */
  maxLength?: number;
  /** Change event handler */
  onChange: (value: string) => void;
}

/**
 * Creates a text input component
 * @param config - Component configuration
 * @returns HTMLDivElement containing the input field
 */
export function createTextInput(config: TextInputConfig): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'mb-4';

  // Create label
  const label = document.createElement('label');
  label.htmlFor = config.id;
  label.className = 'form-label';
  label.textContent = config.label;

  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.id = config.id;
  input.name = config.name;
  input.className = 'input-field';
  input.placeholder = config.placeholder;
  input.value = config.value;
  
  if (config.maxLength) {
    input.maxLength = config.maxLength;
  }

  // Add change event listener
  input.addEventListener('input', (event: Event) => {
    const target = event.target as HTMLInputElement;
    config.onChange(target.value);
  });

  // Assemble component
  container.appendChild(label);
  container.appendChild(input);

  // Add character counter if maxLength is specified
  if (config.maxLength) {
    const counter = document.createElement('div');
    counter.className = 'text-xs text-gray-500 mt-1 text-right';
    counter.textContent = `${config.value.length}/${config.maxLength}`;

    input.addEventListener('input', () => {
      counter.textContent = `${input.value.length}/${config.maxLength}`;
    });

    container.appendChild(counter);
  }

  return container;
}

/**
 * Updates the value of an existing text input
 * @param inputId - ID of the input to update
 * @param value - New value
 */
export function updateTextInputValue(inputId: string, value: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  if (input) {
    input.value = value;
    // Trigger input event to update any listeners
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }
}
