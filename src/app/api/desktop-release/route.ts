import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type DesktopRelease = {
  downloadUrl: string;
  filename: string;
  propertyName: string;
  builtAt: string;
};

/**
 * Returns the installer most recently published for this Vercel instance.
 *
 * The installer is deliberately built outside the Vercel deployment. Electron's
 * Windows toolchain belongs in the Windows release workflow, while Blob holds
 * the resulting binary without adding it to the web deployment.
 */
export async function GET() {
  try {
    const { blobs } = await list({ prefix: "desktop/current.json", limit: 1 });
    const manifestBlob = blobs.find((blob) => blob.pathname === "desktop/current.json");

    if (!manifestBlob) {
      return NextResponse.json(
        { error: "The branded Windows installer has not been published yet." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const manifestResponse = await fetch(manifestBlob.url, { cache: "no-store" });
    if (!manifestResponse.ok) throw new Error(`Could not read release manifest (${manifestResponse.status})`);

    const release = (await manifestResponse.json()) as Partial<DesktopRelease>;
    if (
      typeof release.downloadUrl !== "string" ||
      typeof release.filename !== "string" ||
      typeof release.propertyName !== "string" ||
      typeof release.builtAt !== "string"
    ) {
      throw new Error("Release manifest is invalid");
    }

    const normalizedRelease: DesktopRelease = {
      downloadUrl: release.downloadUrl,
      filename: release.filename,
      propertyName: release.propertyName,
      builtAt: release.builtAt,
    };

    return NextResponse.json(normalizedRelease, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[GET /api/desktop-release]", error);
    return NextResponse.json(
      { error: "The Windows installer is temporarily unavailable. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
