/**
 * Centralized Media Validation and Immediate Rejection Module
 * 
 * Provides unified, strict, and user-friendly validation for all media uploads
 * across the iReside platform (images, documents, receipts, logos, attachments).
 * 
 * Enforces immediate blocking of unsupported, corrupted, or oversized files,
 * prevents subsequent form submission or state changes, and clearly informs
 * the user of the exact reason for rejection and what formats are allowed.
 * 
 * @module lib/validation/media-validation
 */

import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Presets and Configuration
// ---------------------------------------------------------------------------

export type MediaPreset =
  | "image"
  | "branding_logo"
  | "document_and_image"
  | "chat_attachment"
  | "document_only";

export interface PresetConfig {
  name: string;
  allowedExtensions: readonly string[];
  allowedMimeTypes: readonly string[];
  maxSizeMb: number;
  description: string;
}

export const MEDIA_PRESETS: Record<MediaPreset, PresetConfig> = {
  image: {
    name: "Image",
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"],
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ],
    maxSizeMb: 10,
    description: "PNG, JPG, JPEG, or WebP",
  },
  branding_logo: {
    name: "Logo & Brand Mark",
    allowedExtensions: [".png", ".jpg", ".jpeg", ".webp", ".svg"],
    allowedMimeTypes: [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
    ],
    maxSizeMb: 5,
    description: "PNG, JPG, JPEG, WebP, or SVG vector",
  },
  document_and_image: {
    name: "Document or Image",
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    maxSizeMb: 10,
    description: "PNG, JPG, JPEG, WebP, or PDF",
  },
  chat_attachment: {
    name: "Chat Attachment",
    allowedExtensions: [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".pdf",
      ".docx",
      ".xlsx",
      ".txt",
      ".csv",
    ],
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ],
    maxSizeMb: 20,
    description: "Images (PNG, JPG, WebP, GIF) or Documents (PDF, Word, Excel, TXT)",
  },
  document_only: {
    name: "Document",
    allowedExtensions: [".pdf", ".docx", ".doc"],
    allowedMimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ],
    maxSizeMb: 15,
    description: "PDF, DOC, or DOCX",
  },
};

/**
 * HTML <input accept="..."> attribute string presets for native file picker filtering.
 */
export const MEDIA_ACCEPT_STRINGS: Record<MediaPreset, string> = {
  image: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  branding_logo: "image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg",
  document_and_image: "image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.webp,.docx,.doc",
  chat_attachment: "image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.webp,.gif,.docx,.doc,.xlsx,.xls,.txt,.csv,.zip",
  document_only: "application/pdf,.pdf,.docx,.doc",
};

// Dangerous file extensions strictly disallowed across all presets
export const DANGEROUS_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".msi",
  ".js",
  ".vbs",
  ".scr",
  ".pif",
  ".com",
  ".hta",
  ".cpl",
  ".jar",
  ".apk",
  ".php",
  ".asp",
  ".aspx",
  ".py",
  ".pl",
  ".cgi",
  ".dll",
  ".sys",
]);

// Unsupported graphic formats that users commonly attempt to upload
export const COMMON_UNSUPPORTED_IMAGE_FORMATS: Record<string, string> = {
  ".bmp": "Bitmap (.bmp)",
  ".tiff": "TIFF (.tiff)",
  ".tif": "TIFF (.tif)",
  ".psd": "Photoshop document (.psd)",
  ".ai": "Adobe Illustrator (.ai)",
  ".raw": "Camera RAW (.raw)",
  ".cr2": "Canon RAW (.cr2)",
  ".nef": "Nikon RAW (.nef)",
  ".ico": "Icon file (.ico)",
  ".eps": "PostScript (.eps)",
  ".avif": "AVIF (.avif)",
};

// ---------------------------------------------------------------------------
// Validation Types & Interface
// ---------------------------------------------------------------------------

export type MediaRejectionReason =
  | "file_empty"
  | "file_too_large"
  | "too_many_files"
  | "security_blocked"
  | "unsupported_image_format"
  | "unsupported_format"
  | "document_not_allowed";

export interface MediaValidationResult {
  isValid: boolean;
  error?: string;
  reason?: MediaRejectionReason;
  file: File;
  fileName: string;
  fileExtension: string;
  detectedMimeType: string;
  fileSizeFormatted: string;
  allowedFormatsDescription: string;
}

export interface MediaBatchValidationResult {
  isValid: boolean;
  validFiles: File[];
  rejectedFiles: MediaValidationResult[];
  firstError?: string;
  message?: string;
  description?: string;
}

export interface ValidateMediaOptions {
  preset?: MediaPreset;
  allowedExtensions?: readonly string[];
  allowedMimeTypes?: readonly string[];
  maxSizeMb?: number;
  maxSizeBytes?: number;
  maxFiles?: number;
  label?: string;
  customLabel?: string;
}

// ---------------------------------------------------------------------------
// Helper Utilities
// ---------------------------------------------------------------------------

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  if (!filename || !filename.includes(".")) return "";
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase().trim();
  return ext;
}

// ---------------------------------------------------------------------------
// Core Validation Function
// ---------------------------------------------------------------------------

/**
 * Validates an uploaded media file against preset constraints and security policies.
 * Returns an explanatory reason if the file is rejected.
 */
export function validateMediaFile(
  file: File,
  options: ValidateMediaOptions = {}
): MediaValidationResult {
  const presetKey = options.preset || "image";
  const preset = MEDIA_PRESETS[presetKey];

  const allowedExtensions = options.allowedExtensions || preset.allowedExtensions;
  const allowedMimeTypes = options.allowedMimeTypes || preset.allowedMimeTypes;
  const maxSizeMb = options.maxSizeBytes
    ? Math.round((options.maxSizeBytes / (1024 * 1024)) * 10) / 10
    : (options.maxSizeMb ?? preset.maxSizeMb);
  const maxSizeBytes = options.maxSizeBytes ?? maxSizeMb * 1024 * 1024;
  const label = options.customLabel || options.label || preset.name;

  const fileName = file?.name || "Uploaded file";
  const fileExtension = getFileExtension(fileName);
  const detectedMimeType = (file?.type || "").toLowerCase().trim();
  const fileSizeFormatted = formatBytes(file?.size || 0);
  const allowedFormatsDescription = preset.description;

  // 1. Empty or Corrupted Check
  if (!file || file.size <= 0) {
    return {
      isValid: false,
      reason: "file_empty",
      error: `The file "${fileName}" was rejected because it is empty (0 bytes) or corrupted. Please select a valid file.`,
      file,
      fileName,
      fileExtension,
      detectedMimeType,
      fileSizeFormatted,
      allowedFormatsDescription,
    };
  }

  // 2. Dangerous Executable / Script Check
  if (DANGEROUS_EXTENSIONS.has(fileExtension)) {
    return {
      isValid: false,
      reason: "security_blocked",
      error: `The file "${fileName}" was blocked for security reasons. Executable or script files (${fileExtension}) cannot be uploaded.`,
      file,
      fileName,
      fileExtension,
      detectedMimeType,
      fileSizeFormatted,
      allowedFormatsDescription,
    };
  }

  // 3. Known Unsupported Image Format Check
  if (COMMON_UNSUPPORTED_IMAGE_FORMATS[fileExtension]) {
    const formatName = COMMON_UNSUPPORTED_IMAGE_FORMATS[fileExtension];
    return {
      isValid: false,
      reason: "unsupported_image_format",
      error: `The file "${fileName}" was rejected because ${formatName} images are not supported. Please upload ${allowedFormatsDescription}.`,
      file,
      fileName,
      fileExtension,
      detectedMimeType,
      fileSizeFormatted,
      allowedFormatsDescription,
    };
  }

  // 4. Document uploaded when only Images are allowed
  if (
    (presetKey === "image" || presetKey === "branding_logo") &&
    (fileExtension === ".pdf" ||
      fileExtension === ".doc" ||
      fileExtension === ".docx" ||
      fileExtension === ".txt" ||
      detectedMimeType.includes("pdf") ||
      detectedMimeType.includes("document") ||
      detectedMimeType.includes("text/"))
  ) {
    return {
      isValid: false,
      reason: "document_not_allowed",
      error: `The file "${fileName}" was rejected because documents (${fileExtension || "document"}) cannot be used as an image. Supported formats are: ${allowedFormatsDescription}.`,
      file,
      fileName,
      fileExtension,
      detectedMimeType,
      fileSizeFormatted,
      allowedFormatsDescription,
    };
  }

  // 5. Extension and MIME Type Match against Allowed Preset
  const isExtensionAllowed =
    fileExtension.length > 0 &&
    allowedExtensions.some((ext) => ext.toLowerCase() === fileExtension);

  const isMimeAllowed =
    detectedMimeType.length > 0 &&
    allowedMimeTypes.some((mime) => {
      if (mime.endsWith("/*")) {
        const prefix = mime.slice(0, -1);
        return detectedMimeType.startsWith(prefix);
      }
      return mime.toLowerCase() === detectedMimeType;
    });

  // If both extension and MIME are present and neither match, reject
  if (!isExtensionAllowed && !isMimeAllowed) {
    const extDisplay = fileExtension || "unknown format";
    return {
      isValid: false,
      reason: "unsupported_format",
      error: `The file "${fileName}" was rejected because ${extDisplay} is not a supported ${label.toLowerCase()} format. Supported formats are: ${allowedFormatsDescription}.`,
      file,
      fileName,
      fileExtension,
      detectedMimeType,
      fileSizeFormatted,
      allowedFormatsDescription,
    };
  }

  // If extension is not in allowed extensions (e.g. extension spoofing or uncommon format)
  if (fileExtension.length > 0 && !isExtensionAllowed) {
    return {
      isValid: false,
      reason: "unsupported_format",
      error: `The file "${fileName}" was rejected because '${fileExtension}' is not permitted for ${label.toLowerCase()}. Supported formats are: ${allowedFormatsDescription}.`,
      file,
      fileName,
      fileExtension,
      detectedMimeType,
      fileSizeFormatted,
      allowedFormatsDescription,
    };
  }

  // 6. File Size Check
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      reason: "file_too_large",
      error: `The file "${fileName}" exceeds the ${maxSizeMb}MB size limit (selected file is ${fileSizeFormatted}). Please choose a file smaller than ${maxSizeMb}MB.`,
      file,
      fileName,
      fileExtension,
      detectedMimeType,
      fileSizeFormatted,
      allowedFormatsDescription,
    };
  }

  return {
    isValid: true,
    file,
    fileName,
    fileExtension,
    detectedMimeType,
    fileSizeFormatted,
    allowedFormatsDescription,
  };
}

export function normalizeMediaFiles(
  files: File | File[] | FileList | null | undefined
): File[] {
  if (!files) return [];
  if (files instanceof File) return [files];
  if (Array.isArray(files)) return files.filter((f): f is File => f instanceof File);
  if (typeof (files as any)[Symbol.iterator] === "function" || "length" in (files as any)) {
    return Array.from(files as ArrayLike<File>).filter((f): f is File => f instanceof File);
  }
  return [];
}

/**
 * Validates an array or FileList or single media file.
 */
export function validateMediaBatch(
  files: File | File[] | FileList | null | undefined,
  options: ValidateMediaOptions = {}
): MediaBatchValidationResult {
  const fileArray = normalizeMediaFiles(files);
  if (fileArray.length === 0) {
    return {
      isValid: true,
      validFiles: [],
      rejectedFiles: [],
    };
  }

  if (options.maxFiles && fileArray.length > options.maxFiles) {
    const error = `Too many files selected. A maximum of ${options.maxFiles} file${options.maxFiles === 1 ? "" : "s"} can be uploaded at once.`;
    return {
      isValid: false,
      validFiles: [],
      rejectedFiles: [
        {
          isValid: false,
          reason: "too_many_files",
          error,
          file: fileArray[0],
          fileName: fileArray[0]?.name || "batch",
          fileExtension: getFileExtension(fileArray[0]?.name || ""),
          detectedMimeType: fileArray[0]?.type || "",
          fileSizeFormatted: formatBytes(fileArray[0]?.size || 0),
          allowedFormatsDescription: `Maximum ${options.maxFiles} files`,
        },
      ],
      firstError: error,
      message: "Media Upload Blocked",
      description: error,
    };
  }

  const validFiles: File[] = [];
  const rejectedFiles: MediaValidationResult[] = [];

  for (const file of fileArray) {
    const result = validateMediaFile(file, options);
    if (result.isValid) {
      validFiles.push(file);
    } else {
      rejectedFiles.push(result);
    }
  }

  const firstRejection = rejectedFiles[0];
  const firstError = firstRejection?.error;

  return {
    isValid: rejectedFiles.length === 0,
    validFiles,
    rejectedFiles,
    firstError,
    message: firstRejection ? "Media Upload Blocked" : undefined,
    description: firstError,
  };
}

// ---------------------------------------------------------------------------
// Client Interaction Helper (Immediate Blocking + Notification)
// ---------------------------------------------------------------------------

export interface HandleMediaSelectionParams {
  /** The files selected or dropped by the user */
  files: File | File[] | FileList | null | undefined;
  /** Validation preset or custom options */
  options?: ValidateMediaOptions;
  /** Optional HTML input element reference to clear upon rejection */
  inputElement?: HTMLInputElement | null;
  /** Callback fired ONLY when all selected files are valid */
  onValid: (validFiles: File[]) => void;
  /** Callback fired immediately when files are blocked */
  onBlocked?: (errorMsg: string, rejection: MediaValidationResult) => void;
}

export interface FunctionalMediaSelectionOptions extends ValidateMediaOptions {
  multiple?: boolean;
  notify?: (message: string, description?: string) => void;
  onValid?: (validFiles: File[]) => void;
  onBlocked?: (errorMsg: string, rejection: MediaValidationResult) => void;
}

/**
 * Client-side orchestration helper that enforces immediate blocking.
 * Supports both object params and functional (event, options) signatures.
 */
export function handleMediaSelection(
  params: HandleMediaSelectionParams
): boolean;
export function handleMediaSelection(
  target: any,
  options: FunctionalMediaSelectionOptions & { multiple: true }
): File[];
export function handleMediaSelection(
  target: any,
  options?: FunctionalMediaSelectionOptions & { multiple?: false }
): File | null;
export function handleMediaSelection(
  target: any,
  options?: FunctionalMediaSelectionOptions
): File | File[] | null;
export function handleMediaSelection(
  targetOrParams: any,
  options?: FunctionalMediaSelectionOptions
): any {
  if (!targetOrParams) {
    return options?.multiple ? [] : null;
  }

  // 1. Check if invoked with HandleMediaSelectionParams object:
  if (
    typeof targetOrParams === "object" &&
    !("target" in targetOrParams) &&
    !("dataTransfer" in targetOrParams) &&
    !("size" in targetOrParams) &&
    "files" in targetOrParams &&
    typeof targetOrParams.onValid === "function"
  ) {
    const params = targetOrParams as HandleMediaSelectionParams;
    if (!params.files) return false;

    const batch = validateMediaBatch(params.files, params.options);
    if (!batch.isValid) {
      if (params.inputElement) {
        try {
          params.inputElement.value = "";
        } catch {
          // ignore
        }
      }

      const firstRejection = batch.rejectedFiles[0];
      const errorMessage =
        firstRejection?.error || "The selected media file is not supported.";

      toast.error("Media Upload Blocked", {
        description: errorMessage,
        duration: 6000,
      });

      if (params.onBlocked && firstRejection) {
        params.onBlocked(errorMessage, firstRejection);
      }

      return false;
    }

    if (batch.validFiles.length > 0) {
      params.onValid(batch.validFiles);
      return true;
    }
    return false;
  }

  // 2. Functional invocation:
  let inputElement: HTMLInputElement | null = null;
  let rawFiles: any = targetOrParams;

  if (targetOrParams && typeof targetOrParams === "object") {
    if ("target" in targetOrParams && targetOrParams.target) {
      inputElement = targetOrParams.target as HTMLInputElement;
      rawFiles = targetOrParams.target.files;
    } else if ("dataTransfer" in targetOrParams && targetOrParams.dataTransfer) {
      rawFiles = targetOrParams.dataTransfer.files;
    }
  }

  const batch = validateMediaBatch(rawFiles, options);

  if (!batch.isValid) {
    if (inputElement) {
      try {
        inputElement.value = "";
      } catch {
        // ignore
      }
    }

    const firstRejection = batch.rejectedFiles[0];
    const errorMessage =
      firstRejection?.error || "The selected media file is not supported.";

    if (options?.notify) {
      options.notify("Media Upload Blocked", errorMessage);
    } else {
      toast.error("Media Upload Blocked", {
        description: errorMessage,
        duration: 6000,
      });
    }

    if (options?.onBlocked && firstRejection) {
      options.onBlocked(errorMessage, firstRejection);
    }

    return options?.multiple ? [] : null;
  }

  if (options?.onValid) {
    options.onValid(batch.validFiles);
  }

  if (options?.multiple) {
    return batch.validFiles;
  }

  return batch.validFiles[0] || null;
}
