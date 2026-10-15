/**
 * Server-side image upload checks shared by every upload route.
 *
 * The real format is sniffed from the file's leading bytes and the stored
 * content type / extension come from that, never from the client-sent MIME
 * type or file name. SVG (logos only) is additionally screened for scripts.
 *
 * @module lib/validation/upload
 */

// ---------------------------------------------------------------------------
// Image uploads (server-side content check)
// ---------------------------------------------------------------------------

export type ImageKind = "jpeg" | "png" | "webp" | "gif" | "heic" | "svg";

export const IMAGE_KIND_MIME: Record<ImageKind, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  svg: "image/svg+xml",
};

export const IMAGE_KIND_EXTENSIONS: Record<ImageKind, readonly string[]> = {
  jpeg: [".jpg", ".jpeg"],
  png: [".png"],
  webp: [".webp"],
  gif: [".gif"],
  heic: [".heic", ".heif"],
  svg: [".svg"],
};

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...Array.from(bytes.subarray(start, end)));

/** Detects the real image format from the file's leading bytes (ignores the client-sent MIME type). */
export function sniffImageKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (bytes.length >= 8 && startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "webp";
  if (bytes.length >= 6 && (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a")) return "gif";
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 12);
    if (["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(brand)) return "heic";
  }
  // SVG is text: look for an <svg root near the start (after optional BOM / XML prolog / comments).
  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.length, 4096))).trimStart().replace(/^﻿/, "");
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return "svg";
  return null;
}

/** Rejects SVGs that carry script, event handlers, external/foreign content or javascript: links. */
export function isUnsafeSvg(text: string): boolean {
  return /<script[\s>]|<foreignObject[\s>]|\son[a-z]+\s*=|javascript:|<iframe[\s>]|<embed[\s>]|<object[\s>]/i.test(text);
}

export interface ImageUploadPolicy {
  /** Human label used in messages, e.g. "Profile photo". */
  label: string;
  maxBytes: number;
  allowed: readonly ImageKind[];
}

export type ImageUploadCheck =
  | { ok: true; kind: ImageKind; contentType: string; extension: string }
  | { ok: false; error: string };

const fileExtension = (name: string) => {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
};

/**
 * Server-side upload check: size, declared extension, and the real content
 * type sniffed from the bytes. The stored content type and extension come from
 * the sniffed format, never from the client.
 */
export function checkImageUpload(
  file: { name?: string; size: number; type?: string },
  bytes: Uint8Array,
  policy: ImageUploadPolicy,
): ImageUploadCheck {
  const allowedList = policy.allowed.map((kind) => IMAGE_KIND_EXTENSIONS[kind][0].slice(1).toUpperCase()).join(", ");
  const maxMb = Math.round((policy.maxBytes / (1024 * 1024)) * 10) / 10;

  if (!file || file.size <= 0 || bytes.length === 0) return { ok: false, error: "File is empty." };
  if (file.size > policy.maxBytes || bytes.length > policy.maxBytes) {
    return { ok: false, error: `File is too large. Max size is ${maxMb} MB.` };
  }

  const extension = fileExtension(file.name ?? "");
  const allowedExtensions = policy.allowed.flatMap((kind) => IMAGE_KIND_EXTENSIONS[kind]);
  if (extension && !allowedExtensions.includes(extension)) {
    return { ok: false, error: `${policy.label} must be ${allowedList}.` };
  }

  const kind = sniffImageKind(bytes);
  if (!kind || !policy.allowed.includes(kind)) {
    return { ok: false, error: `${policy.label} must be a valid ${allowedList} image.` };
  }
  if (extension && !IMAGE_KIND_EXTENSIONS[kind].includes(extension)) {
    return { ok: false, error: `The file extension does not match its contents. Upload a valid ${allowedList} image.` };
  }

  if (kind === "svg") {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (isUnsafeSvg(text)) return { ok: false, error: "This SVG contains scripts or embedded content and cannot be uploaded." };
  }

  return { ok: true, kind, contentType: IMAGE_KIND_MIME[kind], extension: IMAGE_KIND_EXTENSIONS[kind][0] };
}

const PDF_SIGNATURE = "%PDF-";

/**
 * True when a file's leading bytes match its declared MIME type (raster image
 * or, when allowed, PDF). Lets routes that store `file.type` trust it.
 */
export async function fileContentMatchesType(file: Blob, { allowPdf = false } = {}): Promise<boolean> {
  const declared = (file.type || "").toLowerCase();
  const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  if (declared === "application/pdf") {
    return allowPdf && String.fromCharCode(...Array.from(head.subarray(0, PDF_SIGNATURE.length))) === PDF_SIGNATURE;
  }
  const kind = sniffImageKind(head);
  if (!kind || kind === "svg") return false;
  if (IMAGE_KIND_MIME[kind] === declared) return true;
  return (kind === "jpeg" && declared === "image/jpg") || (kind === "heic" && declared === "image/heif");
}

/** Storage extension for an (already verified) image MIME type, never taken from the client file name. */
export function extensionForImageType(mimeType: string): string {
  const type = mimeType.toLowerCase();
  const kind = (Object.keys(IMAGE_KIND_MIME) as ImageKind[]).find((key) => IMAGE_KIND_MIME[key] === type);
  if (kind) return IMAGE_KIND_EXTENSIONS[kind][0].slice(1);
  if (type === "image/jpg") return "jpg";
  if (type === "image/heif") return "heif";
  return "bin";
}
