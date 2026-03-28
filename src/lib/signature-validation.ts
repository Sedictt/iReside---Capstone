/**
 * Signature Validation Utilities
 * Validates signature data format, size, dimensions, and sanitizes data URLs
 */

/**
 * Validation result interface
 */
export interface SignatureValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a string is valid base64 encoding
 */
export function isValidBase64(str: string): boolean {
  try {
    // Check if string matches base64 pattern
    const base64Pattern = /^[A-Za-z0-9+/=]+$/;
    return base64Pattern.test(str);
  } catch {
    return false;
  }
}

/**
 * Validate that signature data is a valid base64-encoded PNG image
 */
export function validateBase64PNG(dataUrl: string): SignatureValidationResult {
  // Check for data URL format
  if (!dataUrl.startsWith("data:image/png;base64,")) {
    return {
      valid: false,
      error: "Signature must be a PNG image data URL",
    };
  }

  // Extract base64 data
  const base64Data = dataUrl.split(",")[1];
  if (!base64Data) {
    return {
      valid: false,
      error: "Invalid data URL format",
    };
  }

  // Validate base64 encoding
  if (!isValidBase64(base64Data)) {
    return {
      valid: false,
      error: "Invalid base64 encoding",
    };
  }

  return { valid: true };
}

/**
 * Validate signature file size (must be under 500KB)
 */
export function validateSignatureSize(
  dataUrl: string,
  maxSizeKB: number = 500
): SignatureValidationResult {
  // Calculate size from base64 data
  const base64Data = dataUrl.split(",")[1];
  if (!base64Data) {
    return {
      valid: false,
      error: "Invalid data URL format",
    };
  }

  // Base64 encoding adds ~33% overhead, so decode to get actual size
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInKB = sizeInBytes / 1024;

  if (sizeInKB > maxSizeKB) {
    return {
      valid: false,
      error: `Signature file is too large (${Math.round(sizeInKB)}KB). Maximum size is ${maxSizeKB}KB.`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions from data URL
 */
export function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = dataUrl;
  });
}

/**
 * Validate signature dimensions (min 100x50, max 1000x500 pixels)
 */
export async function validateSignatureDimensions(
  dataUrl: string,
  minWidth: number = 100,
  minHeight: number = 50,
  maxWidth: number = 1000,
  maxHeight: number = 500
): Promise<SignatureValidationResult> {
  try {
    const { width, height } = await getImageDimensions(dataUrl);

    if (width < minWidth || height < minHeight) {
      return {
        valid: false,
        error: `Signature is too small (${width}x${height}). Minimum size is ${minWidth}x${minHeight} pixels.`,
      };
    }

    if (width > maxWidth || height > maxHeight) {
      return {
        valid: false,
        error: `Signature is too large (${width}x${height}). Maximum size is ${maxWidth}x${maxHeight} pixels.`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Failed to validate signature dimensions",
    };
  }
}

/**
 * Sanitize signature data URL to prevent XSS
 * Removes any non-image data from the data URL
 */
export function sanitizeSignatureDataURL(dataUrl: string): string {
  // Only allow data:image/png;base64, prefix
  if (!dataUrl.startsWith("data:image/png;base64,")) {
    throw new Error("Invalid signature data URL format");
  }

  // Extract and validate base64 data
  const parts = dataUrl.split(",");
  if (parts.length !== 2) {
    throw new Error("Invalid data URL structure");
  }

  const [prefix, base64Data] = parts;

  // Validate that base64 data contains only valid characters
  if (!isValidBase64(base64Data)) {
    throw new Error("Invalid base64 data");
  }

  // Reconstruct sanitized data URL
  return `${prefix},${base64Data}`;
}

/**
 * Check if signature canvas is empty (all transparent or white pixels)
 */
export function isSignatureEmpty(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(true);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Check if all pixels are transparent or white
      let hasContent = false;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // If any pixel is not white/transparent, signature has content
        if (a > 0 && (r < 250 || g < 250 || b < 250)) {
          hasContent = true;
          break;
        }
      }

      resolve(!hasContent);
    };
    img.onerror = () => {
      resolve(true); // Treat error as empty
    };
    img.src = dataUrl;
  });
}

/**
 * Comprehensive signature validation
 * Performs all validation checks in sequence
 */
export async function validateSignature(
  dataUrl: string | null
): Promise<SignatureValidationResult> {
  // Check if signature exists
  if (!dataUrl) {
    return {
      valid: false,
      error: "Please provide a signature",
    };
  }

  // Validate format
  const formatResult = validateBase64PNG(dataUrl);
  if (!formatResult.valid) {
    return formatResult;
  }

  // Validate size
  const sizeResult = validateSignatureSize(dataUrl);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  // Check if empty
  const isEmpty = await isSignatureEmpty(dataUrl);
  if (isEmpty) {
    return {
      valid: false,
      error: "Signature canvas is empty. Please sign before saving.",
    };
  }

  // Validate dimensions
  const dimensionsResult = await validateSignatureDimensions(dataUrl);
  if (!dimensionsResult.valid) {
    return dimensionsResult;
  }

  return { valid: true };
}

/**
 * Retry helper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}
