// @vitest-environment node
import { describe, it, expect } from "vitest";
import { extensionForImageType, fileContentMatchesType, isUnsafeSvg, sniffImageKind } from "@/lib/validation/upload";

const withHeader = (header: number[] | string, size = 64) => {
  const bytes = new Uint8Array(size);
  bytes.set(typeof header === "string" ? new TextEncoder().encode(header) : header);
  return bytes;
};
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("upload content checks", () => {
  it("sniffs real formats from bytes", () => {
    expect(sniffImageKind(withHeader(PNG))).toBe("png");
    expect(sniffImageKind(withHeader([0xff, 0xd8, 0xff]))).toBe("jpeg");
    expect(sniffImageKind(withHeader('<svg xmlns="http://www.w3.org/2000/svg">'))).toBe("svg");
    expect(sniffImageKind(withHeader("hello world"))).toBeNull();
  });

  it("accepts a file whose bytes match its declared type", async () => {
    expect(await fileContentMatchesType(new File([withHeader(PNG)], "a.png", { type: "image/png" }))).toBe(true);
    expect(await fileContentMatchesType(new File([withHeader([0xff, 0xd8, 0xff])], "a.jpg", { type: "image/jpg" }))).toBe(true);
  });

  it("rejects mismatched, renamed, and SVG content", async () => {
    expect(await fileContentMatchesType(new File([withHeader(PNG)], "a.jpg", { type: "image/jpeg" }))).toBe(false);
    expect(await fileContentMatchesType(new File([withHeader("<html><script>")], "a.png", { type: "image/png" }))).toBe(false);
    expect(await fileContentMatchesType(new File([withHeader("<svg onload=alert(1)>")], "a.svg", { type: "image/svg+xml" }))).toBe(false);
  });

  it("only accepts PDFs when allowed and when the signature is real", async () => {
    const pdf = new File([withHeader("%PDF-1.7")], "a.pdf", { type: "application/pdf" });
    expect(await fileContentMatchesType(pdf)).toBe(false);
    expect(await fileContentMatchesType(pdf, { allowPdf: true })).toBe(true);
    expect(await fileContentMatchesType(new File([withHeader("not a pdf")], "a.pdf", { type: "application/pdf" }), { allowPdf: true })).toBe(false);
  });

  it("derives storage extensions from the MIME type", () => {
    expect(extensionForImageType("image/png")).toBe("png");
    expect(extensionForImageType("image/jpeg")).toBe("jpg");
    expect(extensionForImageType("text/html")).toBe("bin");
  });

  it("flags scriptable SVG", () => {
    expect(isUnsafeSvg('<svg><script>alert(1)</script></svg>')).toBe(true);
    expect(isUnsafeSvg('<svg><a href="javascript:x">')).toBe(true);
    expect(isUnsafeSvg('<svg><rect width="1"/></svg>')).toBe(false);
  });
});
