import { list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

type MobileRelease = {
  downloadUrl: string;
  filename: string;
  version: string;
  size?: number;
  builtAt?: string;
};

/**
 * Returns metadata or redirects to the most recently published Android APK.
 *
 * Supports:
 * - JSON metadata: GET /api/mobile-release
 * - Direct download trigger: GET /api/mobile-release?download=1
 */
export async function GET(req: NextRequest) {
  try {
    const isDirectDownload = req.nextUrl.searchParams.get("download") === "1";
    const variant = req.nextUrl.searchParams.get("variant") === "debug" ? "debug" : "release";
    let release: MobileRelease | null = null;

    // 1. Try resolving from Vercel Blob if available (for release builds)
    try {
      if (variant === "release" && process.env.BLOB_READ_WRITE_TOKEN) {
        const { blobs } = await list({ prefix: "mobile/current.json", limit: 1 });
        const manifestBlob = blobs.find((blob) => blob.pathname === "mobile/current.json");

        if (manifestBlob) {
          const manifestResponse = await fetch(manifestBlob.url, { cache: "no-store" });
          if (manifestResponse.ok) {
            const data = (await manifestResponse.json()) as Partial<MobileRelease>;
            if (data.downloadUrl && data.filename) {
              release = {
                downloadUrl: data.downloadUrl,
                filename: data.filename,
                version: data.version || "1.0.0",
                size: data.size,
                builtAt: data.builtAt,
              };
            }
          }
        }
      }
    } catch {
      // Fall through to local static asset
    }

    // 2. Fall back to local public download if not configured in Blob
    if (!release) {
      const filename = variant === "debug" ? "iReside-v1.0.0-debug.apk" : "iReside-v1.0.0-release.apk";
      const publicPath = path.join(process.cwd(), "public", "downloads", filename);
      let size: number | undefined;

      try {
        if (fs.existsSync(publicPath)) {
          size = fs.statSync(publicPath).size;
        }
      } catch {
        // stat fallback
      }

      release = {
        downloadUrl: `/downloads/${filename}`,
        filename,
        version: "1.0.0",
        size: size || 4939371,
        builtAt: new Date().toISOString(),
      };
    }

    // 3. Direct download if ?download=1
    if (isDirectDownload) {
      const filename = release.filename || "iReside-v1.0.0-release.apk";
      const publicPath = path.join(process.cwd(), "public", "downloads", filename);
      if (fs.existsSync(publicPath)) {
        const fileBuffer = fs.readFileSync(publicPath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.android.package-archive",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": fileBuffer.length.toString(),
            "Cache-Control": "public, max-age=3600",
          },
        });
      }

      return NextResponse.redirect(new URL(release.downloadUrl, req.url), {
        status: 302,
        headers: {
          "Content-Disposition": `attachment; filename="${release.filename}"`,
          "Content-Type": "application/vnd.android.package-archive",
          "Cache-Control": "no-store",
        },
      });
    }

    // 4. Return release metadata
    return NextResponse.json(release, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[GET /api/mobile-release]", error);
    return NextResponse.json(
      { error: "The Android APK is temporarily unavailable. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
