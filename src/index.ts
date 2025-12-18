/**
 * Type definitions for the Coin Designer application
 * Defines all data structures used throughout the application
 */

/**
 * Represents a single side of a coin (obverse or reverse)
 */
export interface CoinSide {
  /** Text displayed along the top curve of the coin */
  topCurveText: string;
  /** Text displayed along the bottom curve of the coin */
  bottomCurveText: string;
  /** Portrait image data (base64 or URL) */
  coinPortrait: string | null;
  /** Original uploaded file for processing */
  originalImage: File | null;
}

/**
 * Complete coin design containing both sides
 */
export interface CoinDesign {
  /** Front side of the coin */
  obverse: CoinSide;
  /** Back side of the coin */
  reverse: CoinSide;
}

/**
 * Template for pre-filled coin designs
 */
export interface CoinTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Display name of the template */
  name: string;
  /** Description of the template */
  description: string;
  /** Pre-filled design data */
  design: CoinDesign;
  /** Optional preview image URL */
  previewUrl?: string;
}

/**
 * Image processing options for preparing coin portraits
 */
export interface ImageProcessingOptions {
  /** Remove background from the image */
  removeBackground: boolean;
  /** Convert to grayscale for laser engraving */
  convertToGrayscale: boolean;
  /** Smart crop to circular bounds */
  circularCrop: boolean;
  /** Target size in pixels */
  targetSize: number;
  /** Contrast adjustment (-100 to 100) */
  contrastAdjustment: number;
  /** Brightness adjustment (-100 to 100) */
  brightnessAdjustment: number;
}

/**
 * SVG generation configuration
 */
export interface SvgConfig {
  /** Coin diameter in millimeters */
  coinDiameter: number;
  /** DPI for laser engraving */
  dpi: number;
  /** Font family for curved text */
  fontFamily: string;
  /** Font size for text */
  fontSize: number;
  /** Portrait diameter as percentage of coin */
  portraitScale: number;
}

/**
 * Result of image processing operation
 */
export interface ProcessingResult {
  /** Whether processing was successful */
  success: boolean;
  /** Processed image data (base64) */
  imageData?: string;
  /** Error message if processing failed */
  errorMessage?: string;
}

/**
 * Result of SVG generation operation
 */
export interface SvgGenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** Generated SVG content for obverse */
  obverseSvg?: string;
  /** Generated SVG content for reverse */
  reverseSvg?: string;
  /** Error message if generation failed */
  errorMessage?: string;
}

/**
 * Event handler type for coin design updates
 */
export type CoinDesignUpdateHandler = (design: CoinDesign) => void;

/**
 * Event handler type for errors
 */
export type ErrorHandler = (error: Error) => void;
