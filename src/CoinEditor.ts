/**
 * CoinEditor Component
 * Main component that orchestrates the coin design interface
 */

import {createTextInput} from './TextInput';
import {createNumberInput} from './NumberInput';
import {createImageUploader} from './ImageUploader';
import {createCoinPreview, updateCoinPreview} from './CoinPreview';
import {createDefaultProcessingOptions} from './imageProcessing';
import {
  generateCoinSvgs,
  createDefaultSvgConfig,
  createDefaultDisplaySettings,
  downloadCoinSvgs,
  FONT_OPTIONS,
} from './svgGenerator';
import type {CoinDesign, CoinDisplaySettings, CoinSide} from './index';

type CoinSideKey = 'obverse' | 'reverse';

/** localStorage key for the persisted display settings */
const DISPLAY_SETTINGS_KEY = 'coinDesigner.displaySettings';

/**
 * Creates the initial empty coin design
 * @returns Empty coin design object
 */
function createEmptyCoinDesign(): CoinDesign {
  return {
    obverse: {
      topCurveText: '',
      bottomCurveText: '',
      coinPortrait: null,
      originalImage: null,
    },
    reverse: {
      topCurveText: '',
      bottomCurveText: '',
      coinPortrait: null,
      originalImage: null,
    },
  };
}

/**
 * Loads the persisted display settings, falling back to the defaults for
 * anything missing or invalid.
 *
 * Storage can throw - Safari's private mode and blocked third-party storage
 * both do - so a failure is treated as "nothing saved" rather than an error.
 *
 * @returns Display settings to use
 */
function loadDisplaySettings(): CoinDisplaySettings {
  const defaults = createDefaultDisplaySettings();

  try {
    const saved = localStorage.getItem(DISPLAY_SETTINGS_KEY);
    if (!saved) {
      return defaults;
    }

    const parsed = JSON.parse(saved) as Partial<CoinDisplaySettings>;
    return {
      portraitScale:
        typeof parsed.portraitScale === 'number'
          ? parsed.portraitScale
          : defaults.portraitScale,
      fontFamily:
        typeof parsed.fontFamily === 'string'
          ? parsed.fontFamily
          : defaults.fontFamily,
      textRadiusScale:
        typeof parsed.textRadiusScale === 'number'
          ? parsed.textRadiusScale
          : defaults.textRadiusScale,
    };
  } catch {
    return defaults;
  }
}

/**
 * Persists the display settings.
 *
 * @param settings - Display settings to save
 */
function saveDisplaySettings(settings: CoinDisplaySettings): void {
  try {
    localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // A save that cannot be stored still applies for the rest of this visit.
  }
}

/**
 * Creates the coin editor interface
 * @param containerId - ID of the container element
 * @returns The coin design state
 */
export function createCoinEditor(containerId: string): CoinDesign {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element with ID '${containerId}' not found`);
  }

  // Initialize coin design state
  const coinDesign = createEmptyCoinDesign();

  // Display settings (portrait size, font, text offset), mutated in place so
  // every closure below always reads the current values.
  const displaySettings = loadDisplaySettings();

  const refreshPreview = (sideKey: CoinSideKey): void => {
    updateCoinPreview(`${sideKey}-preview`, coinDesign[sideKey], displaySettings);
  };

  const refreshAllPreviews = (): void => {
    refreshPreview('obverse');
    refreshPreview('reverse');
  };

  // Clear container. On desktop (lg+) the page itself does not scroll - the
  // layout is sized to fit a typical viewport, with only the (variable-length)
  // side editor panel scrolling internally if its content runs long. Below
  // that breakpoint the two-column layout stacks, so the page falls back to
  // normal scrolling rather than clipping content that no longer fits.
  container.innerHTML = '';
  container.className =
    'flex flex-col lg:h-screen lg:overflow-hidden px-4 py-3 max-w-7xl mx-auto w-full';

  // Create header (title + settings/Export/Reset actions, top-right)
  const header = createHeader(coinDesign, displaySettings, () => {
    saveDisplaySettings(displaySettings);
    refreshAllPreviews();
  });
  container.appendChild(header);

  // Main layout: side editor tabs on the left, live previews on the right
  const mainLayout = document.createElement('div');
  mainLayout.className =
    'flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 mt-3';

  const editorColumn = createEditorColumn(coinDesign, (sideKey, side) => {
    coinDesign[sideKey] = side;
    refreshPreview(sideKey);
  });
  mainLayout.appendChild(editorColumn);

  const previewColumn = createPreviewColumn(coinDesign, displaySettings);
  mainLayout.appendChild(previewColumn);

  container.appendChild(mainLayout);

  return coinDesign;
}

/**
 * Creates the page header with title and the settings/Export/Reset actions
 * anchored to the top-right corner
 * @param coinDesign - Current coin design
 * @param displaySettings - Display settings, mutated in place by the settings panel
 * @param onDisplaySettingsChange - Called after any display setting changes
 * @returns Header element
 */
function createHeader(
  coinDesign: CoinDesign,
  displaySettings: CoinDisplaySettings,
  onDisplaySettingsChange: () => void
): HTMLElement {
  const header = document.createElement('header');
  header.className = 'shrink-0 flex items-start justify-between gap-4';

  const titleGroup = document.createElement('div');

  const title = document.createElement('h1');
  title.className = 'text-2xl sm:text-3xl font-bold text-gray-900';
  title.textContent = 'Commemorative Coin Designer';

  const subtitle = document.createElement('p');
  subtitle.className = 'text-gray-600 text-sm mt-1';
  subtitle.textContent = 'Design custom coins with laser-engravable SVG output';

  titleGroup.appendChild(title);
  titleGroup.appendChild(subtitle);

  const actionGroup = document.createElement('div');
  actionGroup.className = 'shrink-0 flex items-center gap-2';

  const settingsButton = createSettingsPanel(displaySettings, onDisplaySettingsChange);
  const actionButtons = createActionButtons(coinDesign, displaySettings);

  actionGroup.appendChild(settingsButton);
  actionGroup.appendChild(actionButtons);

  header.appendChild(titleGroup);
  header.appendChild(actionGroup);

  return header;
}

/**
 * Creates the gear icon button and its Display Settings popover (portrait
 * size, font, and text offset)
 * @param displaySettings - Display settings, mutated in place as controls change
 * @param onChange - Called after any control changes
 * @returns The gear icon toggle button
 */
function createSettingsPanel(
  displaySettings: CoinDisplaySettings,
  onChange: () => void
): HTMLElement {
  const gearButton = document.createElement('button');
  gearButton.type = 'button';
  gearButton.setAttribute('aria-haspopup', 'true');
  gearButton.setAttribute('aria-expanded', 'false');
  gearButton.setAttribute('aria-label', 'Display settings');
  gearButton.className =
    'shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2';
  gearButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  `;

  // Rendered on <body>, like the notification toast, so the popover is never
  // clipped by the editor container's overflow-hidden on desktop.
  const backdrop = document.createElement('div');
  backdrop.className = 'hidden fixed inset-0 z-40';

  const panel = document.createElement('div');
  panel.className =
    'hidden fixed top-16 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg p-4';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Display settings');

  const panelHeader = document.createElement('div');
  panelHeader.className = 'flex items-center justify-between mb-2';

  const panelTitle = document.createElement('h3');
  panelTitle.className = 'text-base font-semibold text-gray-800';
  panelTitle.textContent = 'Display Settings';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close settings');
  closeButton.className = 'text-xl leading-none text-gray-400 hover:text-gray-600 transition-colors';
  closeButton.textContent = '×';

  panelHeader.appendChild(panelTitle);
  panelHeader.appendChild(closeButton);
  panel.appendChild(panelHeader);

  // Portrait Size
  const portraitSizeControl = createNumberInput({
    id: 'settingsPortraitScale',
    name: 'portraitScale',
    label: 'Portrait Size',
    value: displaySettings.portraitScale,
    min: 0.25,
    max: 0.9,
    step: 0.05,
    unit: '%',
    helperText: 'Adjust the portrait diameter as a percentage of the coin radius',
    onChange: (value: number) => {
      displaySettings.portraitScale = value;
      onChange();
    },
  });
  panel.appendChild(portraitSizeControl);

  // Font
  const fontField = document.createElement('div');
  fontField.className = 'mb-4';

  const fontLabel = document.createElement('label');
  fontLabel.htmlFor = 'settingsFontFamily';
  fontLabel.className = 'form-label';
  fontLabel.textContent = 'Font';

  const fontSelect = document.createElement('select');
  fontSelect.id = 'settingsFontFamily';
  fontSelect.name = 'fontFamily';
  fontSelect.className = 'input-field';

  FONT_OPTIONS.forEach((font) => {
    const option = document.createElement('option');
    option.value = font.value;
    option.textContent = font.label;
    option.selected = font.value === displaySettings.fontFamily;
    fontSelect.appendChild(option);
  });

  fontSelect.addEventListener('change', () => {
    displaySettings.fontFamily = fontSelect.value;
    onChange();
  });

  fontField.appendChild(fontLabel);
  fontField.appendChild(fontSelect);
  panel.appendChild(fontField);

  // Text Offset
  const textOffsetControl = createNumberInput({
    id: 'settingsTextOffset',
    name: 'textRadiusScale',
    label: 'Text Offset',
    value: displaySettings.textRadiusScale,
    min: 0.5,
    max: 0.9,
    step: 0.01,
    unit: '%',
    helperText: 'Adjust the margin between the dashed portrait guide and the curved text',
    onChange: (value: number) => {
      displaySettings.textRadiusScale = value;
      onChange();
    },
  });
  panel.appendChild(textOffsetControl);

  const closePanel = (): void => {
    panel.classList.add('hidden');
    backdrop.classList.add('hidden');
    gearButton.setAttribute('aria-expanded', 'false');
  };

  const openPanel = (): void => {
    panel.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    gearButton.setAttribute('aria-expanded', 'true');
  };

  gearButton.addEventListener('click', () => {
    if (panel.classList.contains('hidden')) {
      openPanel();
    } else {
      closePanel();
    }
  });
  closeButton.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closePanel();
    }
  });

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  return gearButton;
}

/**
 * Creates the left-hand editor column: a tabbed switcher between the
 * obverse and reverse side editors
 * @param coinDesign - Current coin design
 * @param onSideChange - Called with the updated side after any field changes
 * @returns Editor column element
 */
function createEditorColumn(
  coinDesign: CoinDesign,
  onSideChange: (sideKey: CoinSideKey, side: CoinSide) => void
): HTMLElement {
  const column = document.createElement('div');
  column.className = 'flex flex-col min-h-0';

  const sidePanels: Record<CoinSideKey, HTMLElement> = {
    obverse: createSideEditor('obverse', coinDesign.obverse, (side) => {
      onSideChange('obverse', side);
    }),
    reverse: createSideEditor('reverse', coinDesign.reverse, (side) => {
      onSideChange('reverse', side);
    }),
  };
  sidePanels.reverse.classList.add('hidden');

  const tabBar = createTabBar(
    [
      {key: 'obverse', label: 'Obverse (Front)'},
      {key: 'reverse', label: 'Reverse (Back)'},
    ],
    (key) => {
      (Object.keys(sidePanels) as CoinSideKey[]).forEach((sideKey) => {
        sidePanels[sideKey].classList.toggle('hidden', sideKey !== key);
      });
    }
  );
  column.appendChild(tabBar);

  const panelWrapper = document.createElement('div');
  panelWrapper.className =
    'flex-1 min-h-0 overflow-y-auto bg-white rounded-b-xl rounded-tr-xl shadow-md p-4';
  panelWrapper.appendChild(sidePanels.obverse);
  panelWrapper.appendChild(sidePanels.reverse);
  column.appendChild(panelWrapper);

  return column;
}

/**
 * Creates a tab bar that toggles between the given tabs
 * @param tabs - Tab key/label pairs, in display order
 * @param onSelect - Called with the selected tab's key
 * @returns Tab bar element
 */
function createTabBar(
  tabs: Array<{key: CoinSideKey; label: string}>,
  onSelect: (key: CoinSideKey) => void
): HTMLElement {
  const tabBar = document.createElement('div');
  tabBar.className = 'shrink-0 flex gap-1 border-b border-gray-200';
  tabBar.setAttribute('role', 'tablist');

  const buttons = tabs.map(({label}) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('role', 'tab');
    button.className = 'tab-button';
    return button;
  });

  tabs.forEach(({key}, index) => {
    const button = buttons[index]!;
    button.addEventListener('click', () => {
      buttons.forEach((btn) => btn.classList.remove('tab-button-active'));
      button.classList.add('tab-button-active');
      onSelect(key);
    });
    tabBar.appendChild(button);
  });

  buttons[0]?.classList.add('tab-button-active');

  return tabBar;
}

/**
 * Creates an editor for one side of the coin
 * @param prefix - Prefix for element IDs (obverse/reverse)
 * @param coinSide - Initial coin side data
 * @param onUpdate - Update callback
 * @returns Editor container element
 */
function createSideEditor(
  prefix: string,
  coinSide: CoinSide,
  onUpdate: (side: CoinSide) => void
): HTMLElement {
  const container = document.createElement('div');

  // Top curve text input
  const topTextInput = createTextInput({
    id: `${prefix}TopCurveText`,
    name: `${prefix}TopCurveText`,
    label: 'Top Curve Text',
    placeholder: 'Enter text for top curve',
    value: coinSide.topCurveText,
    maxLength: 50,
    onChange: (value: string) => {
      coinSide.topCurveText = value;
      onUpdate(coinSide);
    },
  });
  container.appendChild(topTextInput);

  // Bottom curve text input
  const bottomTextInput = createTextInput({
    id: `${prefix}BottomCurveText`,
    name: `${prefix}BottomCurveText`,
    label: 'Bottom Curve Text',
    placeholder: 'Enter text for bottom curve',
    value: coinSide.bottomCurveText,
    maxLength: 50,
    onChange: (value: string) => {
      coinSide.bottomCurveText = value;
      onUpdate(coinSide);
    },
  });
  container.appendChild(bottomTextInput);

  // Image uploader
  const imageUploader = createImageUploader({
    id: `${prefix}CoinPortrait`,
    label: 'Coin Portrait',
    acceptedTypes: 'image/png,image/jpeg,image/jpg,image/webp',
    currentImage: coinSide.coinPortrait,
    processingOptions: createDefaultProcessingOptions(),
    onImageUpload: (imageData: string, originalFile: File) => {
      coinSide.coinPortrait = imageData;
      coinSide.originalImage = originalFile;
      onUpdate(coinSide);
    },
    onError: (error: string) => {
      console.error(`Error uploading ${prefix} image:`, error);
      showNotification(`Error: ${error}`, 'error');
    },
  });
  container.appendChild(imageUploader);

  return container;
}

/**
 * Creates the right-hand live preview column
 * @param coinDesign - Current coin design
 * @param displaySettings - Current display settings
 * @returns Preview column element
 */
function createPreviewColumn(
  coinDesign: CoinDesign,
  displaySettings: CoinDisplaySettings
): HTMLElement {
  const column = document.createElement('div');
  column.className = 'flex flex-col min-h-0';

  const title = document.createElement('h2');
  title.className = 'shrink-0 text-lg font-semibold text-gray-800 mb-3 text-center';
  title.textContent = 'Live Preview';
  column.appendChild(title);

  const previewGrid = document.createElement('div');
  previewGrid.className = 'flex-1 min-h-0 grid grid-cols-2 gap-4 place-items-center';

  // Obverse preview
  const obversePreview = createCoinPreview({
    id: 'obverse-preview',
    title: 'Obverse (Front)',
    coinSide: coinDesign.obverse,
    settings: displaySettings,
  });
  obversePreview.className += ' w-full max-w-[280px]';

  // Reverse preview
  const reversePreview = createCoinPreview({
    id: 'reverse-preview',
    title: 'Reverse (Back)',
    coinSide: coinDesign.reverse,
    settings: displaySettings,
  });
  reversePreview.className += ' w-full max-w-[280px]';

  previewGrid.appendChild(obversePreview);
  previewGrid.appendChild(reversePreview);
  column.appendChild(previewGrid);

  return column;
}

/**
 * Creates the Export SVG / Reset Design action buttons
 * @param coinDesign - Current coin design
 * @param displaySettings - Current display settings
 * @returns Action buttons container
 */
function createActionButtons(
  coinDesign: CoinDesign,
  displaySettings: CoinDisplaySettings
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'shrink-0 flex flex-col xs:flex-row gap-2';

  // Export SVG button
  const exportButton = document.createElement('button');
  exportButton.type = 'button';
  exportButton.className = 'btn-primary-compact whitespace-nowrap';
  exportButton.textContent = 'Export SVG Files';

  exportButton.addEventListener('click', async () => {
    try {
      // Validate design
      if (!validateDesign(coinDesign)) {
        showNotification(
          'Please complete the design by adding text and images to both sides',
          'warning'
        );
        return;
      }

      // Show processing state
      exportButton.disabled = true;
      exportButton.textContent = 'Generating SVGs...';

      // Generate SVGs
      const config = createDefaultSvgConfig();
      config.portraitScale = displaySettings.portraitScale;
      config.fontFamily = displaySettings.fontFamily;
      config.textRadiusScale = displaySettings.textRadiusScale;
      const result = await generateCoinSvgs(coinDesign, config);

      if (!result.success || !result.obverseSvg || !result.reverseSvg) {
        throw new Error(result.errorMessage || 'Failed to generate SVG files');
      }

      // Download SVGs
      downloadCoinSvgs(result, 'commemorative-coin');

      showNotification('SVG files downloaded successfully!', 'success');

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to export SVG files';
      showNotification(`Error: ${errorMessage}`, 'error');
      console.error('Export error:', error);
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = 'Export SVG Files';
    }
  });

  // Reset button
  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'btn-secondary-compact whitespace-nowrap';
  resetButton.textContent = 'Reset Design';

  resetButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the entire design? This cannot be undone.')) {
      window.location.reload();
    }
  });

  container.appendChild(exportButton);
  container.appendChild(resetButton);

  return container;
}

/**
 * Validates that the coin design is complete
 * @param design - Coin design to validate
 * @returns True if design is valid
 */
function validateDesign(design: CoinDesign): boolean {
  const obverseValid = design.obverse.topCurveText.trim() !== '' ||
                      design.obverse.bottomCurveText.trim() !== '' ||
                      design.obverse.coinPortrait !== null;

  const reverseValid = design.reverse.topCurveText.trim() !== '' ||
                      design.reverse.bottomCurveText.trim() !== '' ||
                      design.reverse.coinPortrait !== null;

  return obverseValid && reverseValid;
}

/**
 * Shows a notification message
 * @param message - Message to display
 * @param type - Notification type
 */
function showNotification(
  message: string,
  type: 'success' | 'error' | 'warning'
): void {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in max-w-md ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-yellow-500 text-gray-900'
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 5000);
}
