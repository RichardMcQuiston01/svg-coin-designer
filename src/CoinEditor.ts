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

  // Clear container
  container.innerHTML = '';
  container.className = 'container mx-auto px-4 py-8 max-w-7xl';

  // Create header
  const header = createHeader();
  container.appendChild(header);

  // Create main layout
  const mainLayout = document.createElement('div');
  mainLayout.className = 'grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8';

  // Create obverse (front) side editor
  const obverseEditor = createSideEditor(
    'obverse',
    'Obverse (Front)',
    coinDesign.obverse,
    (side: CoinSide) => {
      coinDesign.obverse = side;
      updateCoinPreview('obverse-preview', side, portraitScale);
    }
  );

  // Create reverse (back) side editor
  const reverseEditor = createSideEditor(
    'reverse',
    'Reverse (Back)',
    coinDesign.reverse,
    (side: CoinSide) => {
      coinDesign.reverse = side;
      updateCoinPreview('reverse-preview', side, portraitScale);
    }
  );

  // Add editors to layout
  mainLayout.appendChild(obverseEditor);
  mainLayout.appendChild(reverseEditor);
  container.appendChild(mainLayout);


  // Create portrait size control section
  const portraitSizeSection = document.createElement('section');
  portraitSizeSection.className = 'mt-8 max-w-2xl mx-auto';
  
  const portraitSizeCard = document.createElement('div');
  portraitSizeCard.className = 'card';
  
  const portraitSizeControl = createNumberInput({
    id: 'portraitScale',
    name: 'portraitScale',
    label: 'Portrait Size',
    value: portraitScale,
    min: 0.25,
    max: 0.90,
    step: 0.05,
    unit: '%',
    helperText: 'Adjust the portrait diameter as a percentage of the coin radius',
    onChange: (value: number) => {
      portraitScale = value;
      // Update both previews
      updateCoinPreview('obverse-preview', coinDesign.obverse, portraitScale);
      updateCoinPreview('reverse-preview', coinDesign.reverse, portraitScale);
    },
  });
  
  portraitSizeCard.appendChild(portraitSizeControl);
  portraitSizeSection.appendChild(portraitSizeCard);
  container.appendChild(portraitSizeSection);
  // Create preview section
  const previewSection = createPreviewSection(coinDesign, portraitScale);
  container.appendChild(previewSection);

  // Create action buttons
  const actionButtons = createActionButtons(coinDesign, portraitScale);
  container.appendChild(actionButtons);

  return coinDesign;
}

/**
 * Creates the page header
 * @returns Header element
 */
function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'text-center mb-8';

  const title = document.createElement('h1');
  title.className = 'text-4xl font-bold text-gray-900 mb-2';
  title.textContent = 'Commemorative Coin Designer';

  const subtitle = document.createElement('p');
  subtitle.className = 'text-gray-600 text-lg';
  subtitle.textContent = 'Design custom coins with laser-engravable SVG output';

  header.appendChild(title);
  header.appendChild(subtitle);

  return header;
}

/**
 * Creates an editor for one side of the coin
 * @param prefix - Prefix for element IDs (obverse/reverse)
 * @param title - Title for this side
 * @param coinSide - Initial coin side data
 * @param onUpdate - Update callback
 * @returns Editor container element
 */
function createSideEditor(
  prefix: string,
  title: string,
  coinSide: CoinSide,
  onUpdate: (side: CoinSide) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'card';

  // Section title
  const sectionTitle = document.createElement('h2');
  sectionTitle.className = 'text-2xl font-semibold text-gray-800 mb-6';
  sectionTitle.textContent = title;
  container.appendChild(sectionTitle);

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
 * Creates the preview section
 * @param coinDesign - Current coin design
 * @returns Preview section element
 */
function createPreviewSection(coinDesign: CoinDesign, portraitScale: number): HTMLElement {
  const section = document.createElement('section');
  section.className = 'mt-12';

  const title = document.createElement('h2');
  title.className = 'text-2xl font-semibold text-gray-800 mb-6 text-center';
  title.textContent = 'Live Preview';
  section.appendChild(title);

  const previewGrid = document.createElement('div');
  previewGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-8';

  // Obverse preview
  const obversePreview = createCoinPreview({
    id: 'obverse-preview',
    title: 'Obverse (Front)',
    coinSide: coinDesign.obverse,
    portraitScale: portraitScale,
  });

  // Reverse preview
  const reversePreview = createCoinPreview({
    id: 'reverse-preview',
    title: 'Reverse (Back)',
    coinSide: coinDesign.reverse,
    portraitScale: portraitScale,
  });

  previewGrid.appendChild(obversePreview);
  previewGrid.appendChild(reversePreview);
  section.appendChild(previewGrid);

  return section;
}

/**
 * Creates action buttons section
 * @param coinDesign - Current coin design
 * @returns Action buttons container
 */
function createActionButtons(coinDesign: CoinDesign, portraitScale: number): HTMLElement {
  const container = document.createElement('div');
  container.className = 'mt-8 flex flex-col sm:flex-row gap-4 justify-center';

  // Export SVG button
  const exportButton = document.createElement('button');
  exportButton.type = 'button';
  exportButton.className = 'btn-primary';
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
      config.portraitScale = portraitScale;
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
  resetButton.className = 'btn-secondary';
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
