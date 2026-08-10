/**
 * ImageUploader Component
 * Reusable image upload component with preview and processing
 */

import {processImage, createDefaultProcessingOptions} from './imageProcessing';
import type {ImageProcessingOptions} from './index';

/**
 * Configuration for ImageUploader component
 */
export interface ImageUploaderConfig {
  /** Component ID */
  id: string;
  /** Label text */
  label: string;
  /** Accepted file types */
  acceptedTypes: string;
  /** Current image data URL */
  currentImage: string | null;
  /** Processing options */
  processingOptions: ImageProcessingOptions;
  /** Upload event handler */
  onImageUpload: (imageData: string, originalFile: File) => void;
  /** Error handler */
  onError: (error: string) => void;
}

/**
 * Creates an image uploader component
 * @param config - Component configuration
 * @returns HTMLDivElement containing the uploader
 */
export function createImageUploader(config: ImageUploaderConfig): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'mb-4';

  // Create label
  const label = document.createElement('label');
  label.htmlFor = config.id;
  label.className = 'form-label';
  label.textContent = config.label;

  // Create file input (hidden)
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = config.id;
  fileInput.accept = config.acceptedTypes;
  fileInput.className = 'hidden';

  // Create upload button
  const uploadButton = document.createElement('button');
  uploadButton.type = 'button';
  uploadButton.className = 'btn-secondary w-full';
  uploadButton.textContent = config.currentImage ? 'Change Image' : 'Upload Image';
  
  uploadButton.addEventListener('click', () => {
    fileInput.click();
  });

  // Create preview container
  const previewContainer = document.createElement('div');
  previewContainer.className = 'mt-3';

  // Create preview image
  const preview = document.createElement('div');
  preview.className = 'relative w-full max-w-xs mx-auto';
  
  if (config.currentImage) {
    updatePreview(preview, config.currentImage);
  }

  // Create processing indicator
  const processingIndicator = document.createElement('div');
  processingIndicator.className = 'hidden mt-2 text-center text-sm text-brand-primary';
  processingIndicator.textContent = 'Processing image...';

  // Create error message container
  const errorContainer = document.createElement('div');
  errorContainer.className = 'hidden error-message';

  // Handle file selection
  fileInput.addEventListener('change', async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError(errorContainer, 'Please select a valid image file.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showError(errorContainer, 'Image file is too large. Maximum size is 10MB.');
      return;
    }

    try {
      // Show processing indicator
      processingIndicator.classList.remove('hidden');
      hideError(errorContainer);

      // Process the image
      const result = await processImage(file, config.processingOptions);

      // Hide processing indicator
      processingIndicator.classList.add('hidden');

      if (!result.success || !result.imageData) {
        showError(
          errorContainer,
          result.errorMessage || 'Failed to process image. Please try another image.'
        );
        config.onError(result.errorMessage || 'Processing failed');
        return;
      }

      // Update preview
      updatePreview(preview, result.imageData);
      
      // Update button text
      uploadButton.textContent = 'Change Image';

      // Call upload handler
      config.onImageUpload(result.imageData, file);

    } catch (error) {
      processingIndicator.classList.add('hidden');
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      showError(errorContainer, errorMessage);
      config.onError(errorMessage);
      console.error('Image upload error:', error);
    }
  });

  // Assemble component
  container.appendChild(label);
  container.appendChild(uploadButton);
  container.appendChild(fileInput);
  container.appendChild(processingIndicator);
  container.appendChild(errorContainer);
  previewContainer.appendChild(preview);
  container.appendChild(previewContainer);

  return container;
}

/**
 * Updates the image preview
 * @param previewElement - Preview container element
 * @param imageData - Image data URL to display
 */
function updatePreview(previewElement: HTMLElement, imageData: string): void {
  previewElement.innerHTML = '';
  
  const img = document.createElement('img');
  img.src = imageData;
  img.alt = 'Uploaded portrait';
  img.className = 'w-full h-auto rounded-lg border-2 border-gray-300';
  
  previewElement.appendChild(img);
}

/**
 * Shows an error message
 * @param errorContainer - Error message container
 * @param message - Error message to display
 */
function showError(errorContainer: HTMLElement, message: string): void {
  errorContainer.textContent = message;
  errorContainer.classList.remove('hidden');
}

/**
 * Hides the error message
 * @param errorContainer - Error message container
 */
function hideError(errorContainer: HTMLElement): void {
  errorContainer.classList.add('hidden');
}

/**
 * Creates default image uploader configuration
 * @param id - Component ID
 * @param label - Label text
 * @returns Default configuration
 */
export function createDefaultImageUploaderConfig(
  id: string,
  label: string
): Partial<ImageUploaderConfig> {
  return {
    id,
    label,
    acceptedTypes: 'image/png,image/jpeg,image/jpg,image/webp',
    currentImage: null,
    processingOptions: createDefaultProcessingOptions(),
  };
}
