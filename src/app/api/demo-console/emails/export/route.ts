import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { SAMPLE_EMAILS, renderSampleEmailById } from "@/lib/email/sample-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isAllowed() {
    return process.env.NODE_ENV !== "production" || process.env.DEMO_CONSOLE_ENABLED === "true";
}

// Standard CRC-32 table for ZIP entries
const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[i] = c >>> 0;
    }
    return table;
})();

function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

/** Build a standard uncompressed (STORE) ZIP buffer from named file buffers. */
function buildZip(entries: Array<{ name: string; data: Buffer }>): Buffer {
    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;

    for (const entry of entries) {
        const nameBuf = Buffer.from(entry.name, "utf8");
        const crc = crc32(entry.data);
        const size = entry.data.length;

        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
        localHeader.writeUInt16LE(20, 4); // version needed to extract
        localHeader.writeUInt16LE(0, 6); // general purpose bit flag
        localHeader.writeUInt16LE(0, 8); // compression method: 0 = STORE
        localHeader.writeUInt16LE(0, 10); // last mod file time
        localHeader.writeUInt16LE(0x5421, 12); // last mod file date
        localHeader.writeUInt32LE(crc, 14);
        localHeader.writeUInt32LE(size, 18);
        localHeader.writeUInt32LE(size, 22);
        localHeader.writeUInt16LE(nameBuf.length, 26);
        localHeader.writeUInt16LE(0, 28); // extra field length

        localParts.push(localHeader, nameBuf, entry.data);

        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0); // central file header signature
        centralHeader.writeUInt16LE(20, 4); // version made by
        centralHeader.writeUInt16LE(20, 6); // version needed
        centralHeader.writeUInt16LE(0, 8); // flags
        centralHeader.writeUInt16LE(0, 10); // method: STORE
        centralHeader.writeUInt16LE(0, 12); // mod time
        centralHeader.writeUInt16LE(0x5421, 14); // mod date
        centralHeader.writeUInt32LE(crc, 16);
        centralHeader.writeUInt32LE(size, 20);
        centralHeader.writeUInt32LE(size, 24);
        centralHeader.writeUInt16LE(nameBuf.length, 28);
        centralHeader.writeUInt16LE(0, 30); // extra field length
        centralHeader.writeUInt16LE(0, 32); // file comment length
        centralHeader.writeUInt16LE(0, 34); // disk number start
        centralHeader.writeUInt16LE(0, 36); // internal file attrs
        centralHeader.writeUInt32LE(0, 38); // external file attrs
        centralHeader.writeUInt32LE(offset, 42); // relative offset of local header

        centralParts.push(centralHeader, nameBuf);
        offset += localHeader.length + nameBuf.length + entry.data.length;
    }

    const centralDir = Buffer.concat(centralParts);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // end of central dir signature
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralDir.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, centralDir, eocd]);
}

async function renderHtmlListToPngs(items: Array<{ id: string; htmlBody: string }>) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 680, height: 900, deviceScaleFactor: 2 });
        const results: Array<{ id: string; png: Buffer }> = [];
        for (const item of items) {
            await page.setContent(item.htmlBody, { waitUntil: "load" });
            const raw = await page.screenshot({ type: "png", fullPage: true });
            results.push({ id: item.id, png: Buffer.from(raw) });
        }
        return results;
    } finally {
        await browser.close();
    }
}

export async function GET(req: NextRequest) {
    if (!isAllowed()) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id")?.trim();
        const all = searchParams.get("all") === "true";
        const idsParam = searchParams.get("ids")?.trim();

        if (id) {
            const rendered = await renderSampleEmailById(id);
            if (!rendered) {
                return NextResponse.json({ error: "Email template not found." }, { status: 404 });
            }
            const [shot] = await renderHtmlListToPngs([{ id: rendered.id, htmlBody: rendered.htmlBody }]);
            return new NextResponse(new Uint8Array(shot.png), {
                status: 200,
                headers: {
                    "Content-Type": "image/png",
                    "Content-Disposition": `attachment; filename="ireside-email-${rendered.id}.png"`,
                    "Cache-Control": "no-store",
                },
            });
        }

        const requestedIds = idsParam
            ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
            : all
              ? SAMPLE_EMAILS.map((e) => e.id)
              : [];

        if (requestedIds.length === 0) {
            return NextResponse.json(
                { error: "Provide ?id=<templateId>, ?ids=a,b, or ?all=true" },
                { status: 400 },
            );
        }

        const renderedList = (
            await Promise.all(requestedIds.map((itemId) => renderSampleEmailById(itemId)))
        ).filter((x): x is NonNullable<typeof x> => Boolean(x));

        const shots = await renderHtmlListToPngs(
            renderedList.map((r) => ({ id: r.id, htmlBody: r.htmlBody })),
        );

        const zipBuffer = buildZip(
            shots.map((s) => ({
                name: `ireside-email-${s.id}.png`,
                data: s.png,
            })),
        );

        return new NextResponse(new Uint8Array(zipBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": 'attachment; filename="ireside-sample-emails.zip"',
                "Cache-Control": "no-store",
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message ?? "Failed to export sample emails" },
            { status: 500 },
        );
    }
}
