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
  downloadCoinSvgs,
} from './svgGenerator';
import type {CoinDesign, CoinSide} from './index';

type CoinSideKey = 'obverse' | 'reverse';

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

  // Initialize portrait scale state (default 85%)
  let portraitScale = 0.85;

  // Clear container. On desktop (lg+) the page itself does not scroll - the
  // layout is sized to fit a typical viewport, with only the (variable-length)
  // side editor panel scrolling internally if its content runs long. Below
  // that breakpoint the two-column layout stacks, so the page falls back to
  // normal scrolling rather than clipping content that no longer fits.
  container.innerHTML = '';
  container.className =
    'flex flex-col lg:h-screen lg:overflow-hidden px-4 py-3 max-w-7xl mx-auto w-full';

  // Create header (title + Export/Reset actions, top-right)
  const header = createHeader(coinDesign, () => portraitScale);
  container.appendChild(header);

  // Main layout: side editor tabs on the left, live previews on the right
  const mainLayout = document.createElement('div');
  mainLayout.className =
    'flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 mt-3';

  const editorColumn = createEditorColumn(coinDesign, portraitScale, (value) => {
    portraitScale = value;
    updateCoinPreview('obverse-preview', coinDesign.obverse, portraitScale);
    updateCoinPreview('reverse-preview', coinDesign.reverse, portraitScale);
  });
  mainLayout.appendChild(editorColumn);

  const previewColumn = createPreviewColumn(coinDesign, portraitScale);
  mainLayout.appendChild(previewColumn);

  container.appendChild(mainLayout);

  return coinDesign;
}

/**
 * Creates the page header with title and the Export/Reset actions
 * anchored to the top-right corner
 * @param coinDesign - Current coin design
 * @param getPortraitScale - Getter for the current portrait scale
 * @returns Header element
 */
function createHeader(
  coinDesign: CoinDesign,
  getPortraitScale: () => number
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

  const actionButtons = createActionButtons(coinDesign, getPortraitScale);

  header.appendChild(titleGroup);
  header.appendChild(actionButtons);

  return header;
}

/**
 * Creates the left-hand editor column: a tabbed switcher between the
 * obverse and reverse side editors, plus the shared portrait size control
 * @param coinDesign - Current coin design
 * @param initialPortraitScale - Starting portrait scale
 * @param onPortraitScaleChange - Called when the portrait size control changes
 * @returns Editor column element
 */
function createEditorColumn(
  coinDesign: CoinDesign,
  initialPortraitScale: number,
  onPortraitScaleChange: (value: number) => void
): HTMLElement {
  const column = document.createElement('div');
  column.className = 'flex flex-col min-h-0';

  const sidePanels: Record<CoinSideKey, HTMLElement> = {
    obverse: createSideEditor('obverse', coinDesign.obverse, (side) => {
      coinDesign.obverse = side;
      updateCoinPreview('obverse-preview', side, initialPortraitScale);
    }),
    reverse: createSideEditor('reverse', coinDesign.reverse, (side) => {
      coinDesign.reverse = side;
      updateCoinPreview('reverse-preview', side, initialPortraitScale);
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

  const portraitSizeCard = document.createElement('div');
  portraitSizeCard.className = 'card mt-3 shrink-0 py-3';

  const portraitSizeControl = createNumberInput({
    id: 'portraitScale',
    name: 'portraitScale',
    label: 'Portrait Size',
    value: initialPortraitScale,
    min: 0.25,
    max: 0.9,
    step: 0.05,
    unit: '%',
    helperText: 'Adjust the portrait diameter as a percentage of the coin radius',
    onChange: onPortraitScaleChange,
  });
  portraitSizeCard.appendChild(portraitSizeControl);
  column.appendChild(portraitSizeCard);

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
 * @param portraitScale - Current portrait scale
 * @returns Preview column element
 */
function createPreviewColumn(
  coinDesign: CoinDesign,
  portraitScale: number
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
    portraitScale: portraitScale,
  });
  obversePreview.className += ' w-full max-w-[280px]';

  // Reverse preview
  const reversePreview = createCoinPreview({
    id: 'reverse-preview',
    title: 'Reverse (Back)',
    coinSide: coinDesign.reverse,
    portraitScale: portraitScale,
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
 * @param getPortraitScale - Getter for the current portrait scale
 * @returns Action buttons container
 */
function createActionButtons(
  coinDesign: CoinDesign,
  getPortraitScale: () => number
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
      config.portraitScale = getPortraitScale();
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
