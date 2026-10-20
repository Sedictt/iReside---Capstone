/**
 * Encode a PDF Blob as base64 so a signing page can send the exact document the
 * signer drew on (ink placed where it was drawn) to the sign API.
 * Returns undefined when encoding fails; callers then let the server fall back.
 */
export async function blobToBase64(blob: Blob | null | undefined): Promise<string | undefined> {
  if (!blob) return undefined;
  try {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.byteLength; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength)) as unknown as number[]
      );
    }
    return btoa(binary);
  } catch (error) {
    console.warn("[pdf-base64] Failed to encode signed PDF:", error);
    return undefined;
  }
}
