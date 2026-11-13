import { jsPDF } from "jspdf";

export interface AnalyticsPdfRow {
    metric: string;
    value: string;
    change: string;
    trend: string;
}

export interface AnalyticsPdfOptions {
    title?: string;
    subtitle?: string;
    generatedAt: Date;
    range: string;
    scopeLabel: string;
    rows: AnalyticsPdfRow[];
    filename: string;
}

const toPdfSafeText = (text: string): string =>
    String(text ?? "").replace(/₱/g, "PHP ");

export function generatePortfolioAnalyticsPdf({
    title = "Portfolio Analytics Report",
    subtitle = "Landlord Financial & Operational Summary",
    generatedAt,
    range,
    scopeLabel,
    rows,
    filename,
}: AnalyticsPdfOptions): void {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const footerReserved = 52;

    const drawHeaderBanner = (isContinuation = false) => {
        const bannerHeight = isContinuation ? 48 : 76;
        doc.setFillColor(76, 29, 149); // iReside deep violet (#4C1D95)
        doc.rect(0, 0, pageWidth, bannerHeight, "F");

        doc.setFillColor(139, 92, 246); // Brand violet accent (#8B5CF6)
        doc.rect(0, bannerHeight - 4, pageWidth, 4, "F");

        doc.setTextColor(255, 255, 255);
        if (isContinuation) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("iReside", margin, 28);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(221, 214, 254);
            doc.text(toPdfSafeText(title), pageWidth - margin, 28, { align: "right" });
        } else {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.text("iReside", margin, 34);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(221, 214, 254);
            doc.text(toPdfSafeText(subtitle), margin, 54);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text(toPdfSafeText(title), pageWidth - margin, 34, { align: "right" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(221, 214, 254);
            doc.text(
                toPdfSafeText(`Generated ${generatedAt.toLocaleString()}`),
                pageWidth - margin,
                52,
                { align: "right" }
            );
        }
    };

    drawHeaderBanner(false);
    let y = 96;

    const ensureSpace = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - footerReserved) {
            doc.addPage();
            drawHeaderBanner(true);
            y = 68;
            return true;
        }
        return false;
    };

    // ─── Metadata Summary Strip ────────────────────────────────────────
    const metaBoxHeight = 52;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.75);
    doc.roundedRect(margin, y, contentWidth, metaBoxHeight, 6, 6, "FD");

    const colW = contentWidth / 3;
    const metaItems = [
        { label: "REPORTING PERIOD", value: range || "Custom Range" },
        { label: "REPORT SCOPE", value: scopeLabel },
        { label: "METRICS INCLUDED", value: `${rows.length} KPIs` },
    ];

    metaItems.forEach((item, idx) => {
        const x = margin + idx * colW + 14;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, x, y + 19);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        const clipped = doc.splitTextToSize(toPdfSafeText(item.value), colW - 24)[0] ?? "";
        doc.text(clipped, x, y + 36);

        if (idx > 0) {
            doc.setDrawColor(226, 232, 240);
            doc.line(margin + idx * colW, y + 10, margin + idx * colW, y + metaBoxHeight - 10);
        }
    });

    y += metaBoxHeight + 22;

    // ─── KPI Summary Table ─────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Key Performance Indicators", margin, y);
    y += 12;

    const colNumX = margin + 10;
    const colMetricX = margin + 32;
    const colMetricW = 185;
    const colValueRightX = margin + 325;
    const colValueW = 98;
    const colChangeX = margin + 340;
    const colChangeW = contentWidth - 348;

    const drawTableHeader = () => {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, contentWidth, 26, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text("#", colNumX, y + 16);
        doc.text("METRIC", colMetricX, y + 16);
        doc.text("VALUE", colValueRightX, y + 16, { align: "right" });
        doc.text("PERIOD CHANGE / CONTEXT", colChangeX, y + 16);
        y += 26;
    };

    drawTableHeader();

    if (rows.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("No KPI rows available for the selected reporting period.", margin + 12, y + 22);
        y += 36;
    } else {
        rows.forEach((row, index) => {
            const metricLines = doc.splitTextToSize(toPdfSafeText(row.metric), colMetricW);
            const valueLines = doc.splitTextToSize(toPdfSafeText(row.value), colValueW);
            const changeLines = doc.splitTextToSize(toPdfSafeText(row.change), colChangeW);
            const maxLines = Math.max(metricLines.length, valueLines.length, changeLines.length, 1);
            const rowHeight = Math.max(28, maxLines * 13 + 14);

            if (ensureSpace(rowHeight + 6)) {
                drawTableHeader();
            }

            if (index % 2 === 1) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, y, contentWidth, rowHeight, "F");
            }

            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

            const textY = y + 17;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(100, 116, 139);
            doc.text(String(index + 1), colNumX, textY);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(15, 23, 42);
            doc.text(metricLines, colMetricX, textY);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(76, 29, 149);
            doc.text(valueLines, colValueRightX, textY, { align: "right" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text(changeLines, colChangeX, textY);

            y += rowHeight;
        });
    }

    // ─── Period Trend Breakdown ────────────────────────────────────────
    const rowsWithTrend = rows.filter((r) => r.trend && r.trend.trim().length > 0);
    if (rowsWithTrend.length > 0) {
        y += 24;
        ensureSpace(64);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text("Period Trend Breakdown", margin, y);
        y += 14;

        rowsWithTrend.forEach((row) => {
            const points = row.trend
                .split("|")
                .map((p) => p.trim())
                .filter(Boolean);

            const cols = 3;
            const gridRows = Math.ceil(points.length / cols);
            const blockHeight = 26 + gridRows * 15 + 12;

            ensureSpace(Math.min(blockHeight, 90));

            // Metric sub-header bar
            doc.setFillColor(245, 243, 255);
            doc.setDrawColor(221, 214, 254);
            doc.roundedRect(margin, y, contentWidth, 22, 4, 4, "FD");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(76, 29, 149);
            doc.text(toPdfSafeText(row.metric), margin + 10, y + 14.5);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(15, 23, 42);
            doc.text(toPdfSafeText(row.value), margin + contentWidth - 10, y + 14.5, { align: "right" });

            y += 28;

            const cellW = contentWidth / cols;
            for (let i = 0; i < points.length; i++) {
                const colIdx = i % cols;
                if (colIdx === 0 && i > 0) {
                    y += 15;
                    if (ensureSpace(20)) {
                        // Continue cleanly on next page
                    }
                }
                const [dateLabel, rawVal] = points[i].split(":").map((s) => s.trim());
                const x = margin + colIdx * cellW + 8;

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5);
                doc.setTextColor(100, 116, 139);
                doc.text(toPdfSafeText(dateLabel ?? ""), x, y + 6);

                if (rawVal !== undefined) {
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(8.5);
                    doc.setTextColor(30, 41, 59);
                    doc.text(toPdfSafeText(rawVal), x + cellW - 22, y + 6, { align: "right" });
                }
            }

            y += 20;
        });
    }

    // ─── Page Footers (all pages) ──────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.75);
        doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
            "iReside Property Management  •  Portfolio Analytics Report",
            margin,
            pageHeight - 20
        );
        doc.text(
            `Page ${page} of ${totalPages}`,
            pageWidth - margin,
            pageHeight - 20,
            { align: "right" }
        );
    }

    doc.save(filename);
}
