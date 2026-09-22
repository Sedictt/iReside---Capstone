import { describe, it, expect, vi } from "vitest";
import {
  validateMediaFile,
  validateMediaBatch,
  handleMediaSelection,
  MEDIA_PRESETS,
  MEDIA_ACCEPT_STRINGS,
  DANGEROUS_EXTENSIONS,
  COMMON_UNSUPPORTED_IMAGE_FORMATS,
} from "../../lib/validation/media-validation";

// Helper to create mock File objects
function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const blob = new Blob(["x".repeat(Math.min(size, 1024))], { type });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("Media Validation & Immediate Rejection Module", () => {
  describe("validateMediaFile - Image Preset", () => {
    it("accepts standard web image formats (.jpg, .jpeg, .png, .webp)", () => {
      const jpg = createMockFile("avatar.jpg", 1024 * 1024, "image/jpeg");
      const png = createMockFile("photo.png", 2 * 1024 * 1024, "image/png");
      const webp = createMockFile("banner.webp", 500 * 1024, "image/webp");

      expect(validateMediaFile(jpg, { preset: "image" }).isValid).toBe(true);
      expect(validateMediaFile(png, { preset: "image" }).isValid).toBe(true);
      expect(validateMediaFile(webp, { preset: "image" }).isValid).toBe(true);
    });

    it("rejects zero-byte / empty files with explanatory error", () => {
      const empty = createMockFile("empty.png", 0, "image/png");
      const result = validateMediaFile(empty, { preset: "image" });

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("file_empty");
      expect(result.error).toContain("empty (0 bytes) or corrupted");
    });

    it("rejects dangerous script / executable files with security block reason", () => {
      const exe = createMockFile("malicious.exe", 1024, "application/x-msdownload");
      const bat = createMockFile("run.bat", 512, "text/plain");
      const sh = createMockFile("script.sh", 256, "application/x-sh");

      const exeRes = validateMediaFile(exe, { preset: "image" });
      const batRes = validateMediaFile(bat, { preset: "image" });
      const shRes = validateMediaFile(sh, { preset: "image" });

      expect(exeRes.isValid).toBe(false);
      expect(exeRes.reason).toBe("security_blocked");
      expect(exeRes.error).toContain("blocked for security reasons");

      expect(batRes.isValid).toBe(false);
      expect(batRes.reason).toBe("security_blocked");

      expect(shRes.isValid).toBe(false);
      expect(shRes.reason).toBe("security_blocked");
    });

    it("rejects known unsupported graphic formats (.bmp, .tiff, .psd) with targeted explanation", () => {
      const bmp = createMockFile("drawing.bmp", 1024 * 1024, "image/bmp");
      const tiff = createMockFile("scan.tiff", 2 * 1024 * 1024, "image/tiff");
      const psd = createMockFile("design.psd", 3 * 1024 * 1024, "image/vnd.adobe.photoshop");

      const bmpRes = validateMediaFile(bmp, { preset: "image" });
      const tiffRes = validateMediaFile(tiff, { preset: "image" });
      const psdRes = validateMediaFile(psd, { preset: "image" });

      expect(bmpRes.isValid).toBe(false);
      expect(bmpRes.reason).toBe("unsupported_image_format");
      expect(bmpRes.error).toContain("Bitmap (.bmp) images are not supported");
      expect(bmpRes.error).toContain("PNG, JPG, JPEG, or WebP");

      expect(tiffRes.isValid).toBe(false);
      expect(tiffRes.reason).toBe("unsupported_image_format");
      expect(tiffRes.error).toContain("TIFF (.tiff) images are not supported");

      expect(psdRes.isValid).toBe(false);
      expect(psdRes.reason).toBe("unsupported_image_format");
    });

    it("rejects documents when only images are expected", () => {
      const pdf = createMockFile("document.pdf", 1024 * 1024, "application/pdf");
      const docx = createMockFile("resume.docx", 500 * 1024, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

      const pdfRes = validateMediaFile(pdf, { preset: "image" });
      const docxRes = validateMediaFile(docx, { preset: "image" });

      expect(pdfRes.isValid).toBe(false);
      expect(pdfRes.reason).toBe("document_not_allowed");
      expect(pdfRes.error).toContain("documents (.pdf) cannot be used as an image");

      expect(docxRes.isValid).toBe(false);
      expect(docxRes.reason).toBe("document_not_allowed");
    });

    it("rejects files exceeding size limit with precise MB indication", () => {
      const hugeImage = createMockFile("huge.jpg", 15 * 1024 * 1024, "image/jpeg");
      const result = validateMediaFile(hugeImage, { preset: "image", maxSizeMb: 10 });

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("file_too_large");
      expect(result.error).toContain("exceeds the 10MB size limit");
      expect(result.error).toContain("15 MB");
    });
  });

  describe("validateMediaFile - Branding Logo Preset", () => {
    it("accepts SVG vector logos in addition to standard images", () => {
      const svg = createMockFile("logo.svg", 20 * 1024, "image/svg+xml");
      const png = createMockFile("logo.png", 200 * 1024, "image/png");

      expect(validateMediaFile(svg, { preset: "branding_logo" }).isValid).toBe(true);
      expect(validateMediaFile(png, { preset: "branding_logo" }).isValid).toBe(true);
    });

    it("enforces 5MB logo limit", () => {
      const bigLogo = createMockFile("logo.png", 6 * 1024 * 1024, "image/png");
      const res = validateMediaFile(bigLogo, { preset: "branding_logo" });

      expect(res.isValid).toBe(false);
      expect(res.reason).toBe("file_too_large");
      expect(res.error).toContain("5MB");
    });
  });

  describe("validateMediaFile - Document and Image Preset (Receipts/Permits)", () => {
    it("accepts both images and PDF documents", () => {
      const receiptJpg = createMockFile("receipt.jpg", 1024 * 1024, "image/jpeg");
      const receiptPdf = createMockFile("receipt.pdf", 1024 * 1024, "application/pdf");
      const permitPng = createMockFile("permit.png", 2 * 1024 * 1024, "image/png");

      expect(validateMediaFile(receiptJpg, { preset: "document_and_image" }).isValid).toBe(true);
      expect(validateMediaFile(receiptPdf, { preset: "document_and_image" }).isValid).toBe(true);
      expect(validateMediaFile(permitPng, { preset: "document_and_image" }).isValid).toBe(true);
    });

    it("rejects unsupported extensions like .zip or .txt for receipts", () => {
      const zip = createMockFile("proof.zip", 500 * 1024, "application/zip");
      const txt = createMockFile("receipt.txt", 1024, "text/plain");

      const zipRes = validateMediaFile(zip, { preset: "document_and_image" });
      const txtRes = validateMediaFile(txt, { preset: "document_and_image" });

      expect(zipRes.isValid).toBe(false);
      expect(zipRes.reason).toBe("unsupported_format");
      expect(zipRes.error).toContain("PNG, JPG, JPEG, WebP, or PDF");

      expect(txtRes.isValid).toBe(false);
      expect(txtRes.reason).toBe("unsupported_format");
    });
  });

  describe("validateMediaBatch", () => {
    it("returns valid when all files meet criteria", () => {
      const f1 = createMockFile("p1.jpg", 100 * 1024, "image/jpeg");
      const f2 = createMockFile("p2.png", 200 * 1024, "image/png");

      const batch = validateMediaBatch([f1, f2], { preset: "image" });
      expect(batch.isValid).toBe(true);
      expect(batch.validFiles).toHaveLength(2);
      expect(batch.rejectedFiles).toHaveLength(0);
    });

    it("immediately catches invalid files in a batch and identifies the first error", () => {
      const f1 = createMockFile("p1.jpg", 100 * 1024, "image/jpeg");
      const f2 = createMockFile("bad.exe", 1024, "application/x-msdownload");
      const f3 = createMockFile("p3.png", 200 * 1024, "image/png");

      const batch = validateMediaBatch([f1, f2, f3], { preset: "image" });
      expect(batch.isValid).toBe(false);
      expect(batch.rejectedFiles).toHaveLength(1);
      expect(batch.rejectedFiles[0].fileName).toBe("bad.exe");
      expect(batch.firstError).toContain("security reasons");
    });
  });

  describe("handleMediaSelection Orchestration Helper", () => {
    it("calls onValid only when files pass validation", () => {
      const onValid = vi.fn();
      const onBlocked = vi.fn();
      const validFile = createMockFile("avatar.png", 500 * 1024, "image/png");

      const result = handleMediaSelection({
        files: validFile,
        options: { preset: "image" },
        onValid,
        onBlocked,
      });

      expect(result).toBe(true);
      expect(onValid).toHaveBeenCalledWith([validFile]);
      expect(onBlocked).not.toHaveBeenCalled();
    });

    it("immediately blocks invalid file, resets input element, fires onBlocked and halts onValid", () => {
      const onValid = vi.fn();
      const onBlocked = vi.fn();
      const invalidFile = createMockFile("virus.exe", 1024, "application/x-msdownload");
      const mockInput = { value: "C:\\fakepath\\virus.exe" } as HTMLInputElement;

      const result = handleMediaSelection({
        files: invalidFile,
        options: { preset: "image" },
        inputElement: mockInput,
        onValid,
        onBlocked,
      });

      expect(result).toBe(false);
      expect(mockInput.value).toBe(""); // cleared immediately!
      expect(onValid).not.toHaveBeenCalled(); // halted!
      expect(onBlocked).toHaveBeenCalled();
      expect(onBlocked.mock.calls[0][0]).toContain("security reasons");
    });

    it("supports functional signature returning single File on valid input", () => {
      const notify = vi.fn();
      const validFile = createMockFile("photo.png", 200 * 1024, "image/png");
      const mockEvent = {
        target: {
          files: [validFile],
          value: "C:\\fakepath\\photo.png",
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      const result = handleMediaSelection(mockEvent, {
        preset: "image",
        notify,
      });

      expect(result).toBe(validFile);
      expect(notify).not.toHaveBeenCalled();
      expect(mockEvent.target.value).toBe("C:\\fakepath\\photo.png");
    });

    it("supports functional signature immediately resetting input and calling notify on invalid input", () => {
      const notify = vi.fn();
      const invalidFile = createMockFile("document.pdf", 500 * 1024, "application/pdf");
      const mockEvent = {
        target: {
          files: [invalidFile],
          value: "C:\\fakepath\\document.pdf",
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      const result = handleMediaSelection(mockEvent, {
        preset: "image",
        notify,
      });

      expect(result).toBeNull();
      expect(mockEvent.target.value).toBe(""); // cleared!
      expect(notify).toHaveBeenCalled();
      expect(notify.mock.calls[0][0]).toBe("Media Upload Blocked");
      expect(notify.mock.calls[0][1]).toContain("cannot be used as an image");
    });

    it("supports functional signature with multiple: true returning valid files array", () => {
      const notify = vi.fn();
      const file1 = createMockFile("photo1.jpg", 100 * 1024, "image/jpeg");
      const file2 = createMockFile("photo2.png", 200 * 1024, "image/png");
      const mockEvent = {
        target: {
          files: [file1, file2],
          value: "selected",
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      const result = handleMediaSelection(mockEvent, {
        preset: "image",
        multiple: true,
        notify,
      });

      expect(result).toEqual([file1, file2]);
      expect(notify).not.toHaveBeenCalled();
    });

    it("supports functional signature with multiple: true blocking and clearing when any file in batch is invalid", () => {
      const notify = vi.fn();
      const file1 = createMockFile("photo1.jpg", 100 * 1024, "image/jpeg");
      const file2 = createMockFile("script.sh", 50 * 1024, "application/x-sh");
      const mockEvent = {
        target: {
          files: [file1, file2],
          value: "selected",
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      const result = handleMediaSelection(mockEvent, {
        preset: "image",
        multiple: true,
        notify,
      });

      expect(result).toEqual([]);
      expect(mockEvent.target.value).toBe(""); // cleared!
      expect(notify).toHaveBeenCalled();
    });
  });

  describe("MEDIA_ACCEPT_STRINGS", () => {
    it("defines accept strings for all 5 presets", () => {
      expect(MEDIA_ACCEPT_STRINGS.image).toContain("image/jpeg");
      expect(MEDIA_ACCEPT_STRINGS.branding_logo).toContain("image/svg+xml");
      expect(MEDIA_ACCEPT_STRINGS.document_and_image).toContain(".pdf");
      expect(MEDIA_ACCEPT_STRINGS.chat_attachment).toContain(".zip");
      expect(MEDIA_ACCEPT_STRINGS.document_only).toContain("application/pdf");
    });
  });
});
