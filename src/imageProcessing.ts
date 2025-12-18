/**
 * Image Processing Utilities
 * Handles image manipulation for coin portraits including background removal,
 * grayscale conversion, and circular cropping for laser engraving
 */

import type {ImageProcessingOptions, ProcessingResult} from './index';

/**
 * Loads an image file and returns an HTMLImageElement
 * @param file - The image file to load
 * @returns Promise resolving to loaded image or null on error
 */
export async function loadImage(file: File): Promise<HTMLImageElement | null> {
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (!event.target?.result) {
          reject(new Error('Failed to read image file'));
          return;
        }
        image.src = event.target.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Error reading image file'));
      };

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Error loading image'));

      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Failed to load image:', error);
    return null;
  }
}

/**
 * Converts an image to grayscale for laser engraving
 * @param imageData - The image data to convert
 * @returns Grayscale image data
 */
function convertToGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Calculate luminance using standard weights
    const grayscale = Math.round(
      0.299 * data[i]! +      // Red
      0.587 * data[i + 1]! +  // Green
      0.114 * data[i + 2]!    // Blue
    );
    
    data[i] = grayscale;      // Red
    data[i + 1] = grayscale;  // Green
    data[i + 2] = grayscale;  // Blue
    // Alpha channel (i + 3) remains unchanged
  }
  
  return imageData;
}

/**
 * Applies circular crop to image data
 * @param canvas - Canvas containing the image
 * @param context - Canvas rendering context
 * @returns Canvas with circular mask applied
 */
function applyCircularCrop(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
): HTMLCanvasElement {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY);

  // Create circular clipping path
  context.globalCompositeOperation = 'destination-in';
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.closePath();
  context.fill();
  context.globalCompositeOperation = 'source-over';

  return canvas;
}

/**
 * Adjusts image contrast
 * @param imageData - The image data to adjust
 * @param contrast - Contrast adjustment value (-100 to 100)
 * @returns Adjusted image data
 */
function adjustContrast(imageData: ImageData, contrast: number): ImageData {
  const data = imageData.data;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i]! - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1]! - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2]! - 128) + 128));
  }

  return imageData;
}

/**
 * Adjusts image brightness
 * @param imageData - The image data to adjust
 * @param brightness - Brightness adjustment value (-100 to 100)
 * @returns Adjusted image data
 */
function adjustBrightness(imageData: ImageData, brightness: number): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i]! + brightness));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1]! + brightness));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2]! + brightness));
  }

  return imageData;
}

/**
 * Simple background removal using alpha threshold
 * Note: For production use, consider integrating with AI-based background removal APIs
 * @param imageData - The image data to process
 * @param threshold - Alpha threshold for background detection
 * @returns Image data with background removed
 */
function removeBackground(
  imageData: ImageData,
  threshold: number = 240
): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    // Simple threshold-based background removal
    // In production, integrate with AI service for better results
    if (r > threshold && g > threshold && b > threshold) {
      data[i + 3] = 0; // Set alpha to transparent
    }
  }

  return imageData;
}

/**
 * Processes an image file according to specified options
 * @param file - The image file to process
 * @param options - Processing options
 * @returns Promise resolving to processing result
 */
export async function processImage(
  file: File,
  options: ImageProcessingOptions
): Promise<ProcessingResult> {
  try {
    // Load the image
    const image = await loadImage(file);
    if (!image) {
      return {
        success: false,
        errorMessage: 'Failed to load image. Please ensure the file is a valid image format.',
      };
    }

    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', {willReadFrequently: true});
    
    if (!context) {
      return {
        success: false,
        errorMessage: 'Failed to create canvas context for image processing.',
      };
    }

    // Set canvas size to target size
    canvas.width = options.targetSize;
    canvas.height = options.targetSize;

    // Draw image centered and scaled to fit
    const scale = Math.max(
      options.targetSize / image.width,
      options.targetSize / image.height
    );
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (options.targetSize - scaledWidth) / 2;
    const y = (options.targetSize - scaledHeight) / 2;

    context.drawImage(image, x, y, scaledWidth, scaledHeight);

    // Get image data for processing
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Apply background removal if requested
    if (options.removeBackground) {
      imageData = removeBackground(imageData);
    }

    // Apply brightness adjustment
    if (options.brightnessAdjustment !== 0) {
      imageData = adjustBrightness(imageData, options.brightnessAdjustment);
    }

    // Apply contrast adjustment
    if (options.contrastAdjustment !== 0) {
      imageData = adjustContrast(imageData, options.contrastAdjustment);
    }

    // Convert to grayscale if requested
    if (options.convertToGrayscale) {
      imageData = convertToGrayscale(imageData);
    }

    // Put processed image data back
    context.putImageData(imageData, 0, 0);

    // Apply circular crop if requested
    if (options.circularCrop) {
      applyCircularCrop(canvas, context);
    }

    // Convert to base64
    const imageDataUrl = canvas.toDataURL('image/png');

    return {
      success: true,
      imageData: imageDataUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred during image processing';
    
    console.error('Image processing error:', error);
    return {
      success: false,
      errorMessage,
    };
  }
}

/**
 * Creates a default processing options object
 * @returns Default image processing options
 */
export function createDefaultProcessingOptions(): ImageProcessingOptions {
  return {
    removeBackground: false,
    convertToGrayscale: true,
    circularCrop: true,
    targetSize: 800,
    contrastAdjustment: 10,
    brightnessAdjustment: 0,
  };
}
