/**
 * Coin Design Templates
 * Pre-designed templates for common coin themes
 * 
 * Note: This is an example implementation for future enhancement.
 * To integrate, import this in CoinEditor and add a template selector UI.
 */

import type {CoinTemplate} from './index';

/**
 * Christmas coin template
 */
const christmasTemplate: CoinTemplate = {
  id: 'christmas-2025',
  name: 'Christmas 2025',
  description: 'Holiday-themed coin with space for custom portrait',
  design: {
    obverse: {
      topCurveText: 'CERTIFIED NICE LIST',
      bottomCurveText: 'PERSONALIZED NAME',
      coinPortrait: null, // User uploads their photo
      originalImage: null,
    },
    reverse: {
      topCurveText: 'MERRY CHRISTMAS',
      bottomCurveText: '2025',
      coinPortrait: null, // Could include default Santa image
      originalImage: null,
    },
  },
};

/**
 * Birthday coin template
 */
const birthdayTemplate: CoinTemplate = {
  id: 'birthday-celebration',
  name: 'Birthday Celebration',
  description: 'Birthday-themed commemorative coin',
  design: {
    obverse: {
      topCurveText: 'HAPPY BIRTHDAY',
      bottomCurveText: 'BIRTHDAY NAME',
      coinPortrait: null,
      originalImage: null,
    },
    reverse: {
      topCurveText: 'CELEBRATING',
      bottomCurveText: '2025',
      coinPortrait: null,
      originalImage: null,
    },
  },
};

/**
 * Achievement coin template
 */
const achievementTemplate: CoinTemplate = {
  id: 'achievement-award',
  name: 'Achievement Award',
  description: 'Professional achievement recognition coin',
  design: {
    obverse: {
      topCurveText: 'EXCELLENCE AWARD',
      bottomCurveText: 'RECIPIENT NAME',
      coinPortrait: null,
      originalImage: null,
    },
    reverse: {
      topCurveText: 'IN RECOGNITION OF',
      bottomCurveText: 'ACHIEVEMENT',
      coinPortrait: null,
      originalImage: null,
    },
  },
};

/**
 * Wedding coin template
 */
const weddingTemplate: CoinTemplate = {
  id: 'wedding-commemorative',
  name: 'Wedding Commemorative',
  description: 'Wedding celebration coin',
  design: {
    obverse: {
      topCurveText: 'HAPPILY MARRIED',
      bottomCurveText: 'COUPLE NAMES',
      coinPortrait: null,
      originalImage: null,
    },
    reverse: {
      topCurveText: 'FOREVER TOGETHER',
      bottomCurveText: 'WEDDING DATE',
      coinPortrait: null,
      originalImage: null,
    },
  },
};

/**
 * All available templates
 */
export const templates: CoinTemplate[] = [
  christmasTemplate,
  birthdayTemplate,
  achievementTemplate,
  weddingTemplate,
];

/**
 * Gets a template by ID
 * @param templateId - Template identifier
 * @returns Template if found, undefined otherwise
 */
export function getTemplateById(templateId: string): CoinTemplate | undefined {
  return templates.find(template => template.id === templateId);
}

/**
 * Creates a copy of a template (deep clone)
 * @param template - Template to clone
 * @returns Cloned template
 */
export function cloneTemplate(template: CoinTemplate): CoinTemplate {
  return JSON.parse(JSON.stringify(template));
}

/**
 * Example usage in CoinEditor:
 * 
 * // Add template selector to UI
 * const templateSelector = createTemplateSelector(templates);
 * 
 * // On template selection
 * templateSelector.addEventListener('change', (event) => {
 *   const templateId = (event.target as HTMLSelectElement).value;
 *   const template = getTemplateById(templateId);
 *   if (template) {
 *     const templateCopy = cloneTemplate(template);
 *     // Apply template to coin design
 *     coinDesign.obverse = templateCopy.design.obverse;
 *     coinDesign.reverse = templateCopy.design.reverse;
 *     // Update UI with template values
 *     updateAllInputs(coinDesign);
 *   }
 * });
 */
