import { jsPDF } from "jspdf";
import {
  DOCS_ARTICLES,
  DOCS_EDITION,
  MANUAL_TITLES,
  type DocArticle,
  type DocAudience,
  type ManualAudience,
} from "./docsData";

const LINE_HEIGHT_MM = 4;

/**
 * Exports one manual (or all three) as a printable A4 PDF that mirrors the
 * interactive reader: cover, contents, one chapter per article, help page,
 * keyboard reference, back cover. Chapters paginate automatically.
 */
export async function generateDocsPdf(audience: DocAudience = "landlord"): Promise<void> {
  const isMaster = audience === "all";
  const targetAudience: ManualAudience = audience === "user" || audience === "all" ? "landlord" : audience;
  const manual = MANUAL_TITLES[targetAudience];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - margin - 10;

  const articles: DocArticle[] = isMaster
    ? DOCS_ARTICLES
    : DOCS_ARTICLES.filter((article) => article.audience === targetAudience);

  const coverLabel = isMaster ? "Complete System Manual" : manual.cover;
  const footerLabel = isMaster ? "iReside Manual" : manual.short;

  const drawRunningHeader = (categoryLabel: string, pageNumStr: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(categoryLabel.toUpperCase(), margin, margin + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(pageNumStr, pageWidth - margin, margin + 4, { align: "right" });

    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 7, pageWidth - margin, margin + 7);
  };

  const drawRunningFooter = (leftText: string, pageNumStr: string) => {
    const footerY = pageHeight - margin + 4;
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(leftText, margin, footerY);
    doc.text(pageNumStr, pageWidth - margin, footerY, { align: "right" });
  };

  // ---------------------------------------------------------------------------
  // Cover
  // ---------------------------------------------------------------------------
  let y = margin + 5;

  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, 7, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("iR", margin + 1.8, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("iReside", margin + 10, y + 5.2);

  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(coverLabel.toUpperCase(), pageWidth - margin, y + 5.2, { align: "right" });

  y += 9;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageWidth - margin, y);

  y += 45;
  const badge = isMaster ? "ALL MANUALS" : manual.short.toUpperCase();
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, doc.getTextWidth(badge) + 8, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(badge, margin + 3, y + 4.2);

  y += 14;
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  const coverTitleLines = doc.splitTextToSize(isMaster ? "iReside Complete System Manual" : manual.cover, contentWidth - 10);
  doc.text(coverTitleLines, margin, y);
  y += coverTitleLines.length * 10 + 4;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 18, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const tagline = isMaster
    ? "The tenant, landlord, and technical manuals in one document."
    : manual.tagline;
  doc.text(doc.splitTextToSize(tagline, contentWidth - 15), margin, y);

  y = pageHeight - margin - 15;
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("OFFICIAL MANUAL", margin, y);
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("iReside", margin, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Edition ${DOCS_EDITION} · ${articles.length} topics`, pageWidth - margin, y + 3, { align: "right" });

  // ---------------------------------------------------------------------------
  // Contents
  // ---------------------------------------------------------------------------
  doc.addPage();
  drawRunningHeader("Contents", "Page 1");

  y = margin + 18;
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(isMaster ? "All topics" : manual.short, margin, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Each topic starts on its own page.", margin, y);

  y += 10;
  articles.forEach((article, idx) => {
    if (y > bottomLimit - 10) {
      drawRunningFooter(footerLabel, "Contents");
      doc.addPage();
      drawRunningHeader("Contents (continued)", "Page 1");
      y = margin + 18;
    }

    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(120, 120, 120);
    doc.text((idx + 1).toString().padStart(2, "0"), margin, y + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    const title = doc.splitTextToSize(article.title, contentWidth - 25)[0] || article.title;
    doc.text(title, margin + 10, y + 4);

    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`p.${(idx + 2).toString().padStart(2, "0")}`, pageWidth - margin, y + 4, { align: "right" });

    y += 5.5;
    doc.setDrawColor(240, 240, 243);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  });

  drawRunningFooter(footerLabel, "Contents");

  // ---------------------------------------------------------------------------
  // Chapters
  // ---------------------------------------------------------------------------
  articles.forEach((article, idx) => {
    const chapterNumber = (idx + 2).toString().padStart(2, "0");
    const header = isMaster ? `${MANUAL_TITLES[article.audience].short} · ${article.categoryLabel}` : article.categoryLabel;

    doc.addPage();
    drawRunningHeader(header, `Page ${chapterNumber}`);
    y = margin + 16;

    /** Start a continuation page when `needed` mm would overflow the current page. */
    const ensureSpace = (needed: number) => {
      if (y + needed <= bottomLimit) return;
      drawRunningFooter(footerLabel, chapterNumber);
      doc.addPage();
      drawRunningHeader(`${header} (continued)`, `Page ${chapterNumber}`);
      y = margin + 16;
    };

    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    const titleLines = doc.splitTextToSize(article.title, contentWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 7 + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    const summaryLines = doc.splitTextToSize(article.summary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4.5 + 6;

    if (article.prerequisites && article.prerequisites.length > 0) {
      const lines = article.prerequisites.flatMap((item) => doc.splitTextToSize(`• ${item}`, contentWidth - 10));
      const boxHeight = lines.length * LINE_HEIGHT_MM + 10;
      ensureSpace(boxHeight + 4);
      doc.setFillColor(245, 245, 247);
      doc.rect(margin, y, contentWidth, boxHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(60, 60, 60);
      doc.text("BEFORE YOU START", margin + 4, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text(lines, margin + 4, y + 10);
      y += boxHeight + 4;
    }

    article.steps?.forEach((step, stepIdx) => {
      const descLines = doc.splitTextToSize(step.description, contentWidth - 16);
      const tipLines = step.tip ? doc.splitTextToSize(`Tip: ${step.tip}`, contentWidth - 18) : [];
      const codeLines = step.codeSnippet ? step.codeSnippet.split("\n") : [];
      const tipHeight = tipLines.length > 0 ? tipLines.length * 3.5 + 4 : 0;
      const codeHeight = codeLines.length > 0 ? codeLines.length * 3.6 + 5 : 0;
      const cardHeight = 13 + descLines.length * LINE_HEIGHT_MM + tipHeight + codeHeight + 2;

      ensureSpace(cardHeight + 4);

      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, contentWidth, cardHeight, "F");
      doc.setDrawColor(225, 225, 230);
      doc.setLineWidth(0.3);
      doc.rect(margin, y, contentWidth, cardHeight, "S");

      doc.setFillColor(0, 0, 0);
      doc.rect(margin + 3.5, y + 3.5, 5.5, 5.5, "F");
      doc.setFont("courier", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text((stepIdx + 1).toString(), margin + 5.2, y + 7.4);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text(step.title, margin + 12, y + 7.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text(descLines, margin + 12, y + 13);

      let cursor = y + 13 + descLines.length * LINE_HEIGHT_MM;

      if (tipLines.length > 0) {
        doc.setFillColor(254, 243, 199);
        doc.rect(margin + 12, cursor, contentWidth - 15, tipLines.length * 3.5 + 3, "F");
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.2);
        doc.rect(margin + 12, cursor, contentWidth - 15, tipLines.length * 3.5 + 3, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(180, 83, 9);
        doc.text(tipLines, margin + 14, cursor + 3.5);
        cursor += tipHeight;
      }

      if (codeLines.length > 0) {
        doc.setFillColor(0, 0, 0);
        doc.rect(margin + 12, cursor, contentWidth - 15, codeHeight - 1, "F");
        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text(codeLines, margin + 15, cursor + 4);
      }

      y += cardHeight + 4;
    });

    if (article.result) {
      const lines = doc.splitTextToSize(`Result: ${article.result}`, contentWidth - 8);
      const boxHeight = lines.length * LINE_HEIGHT_MM + 6;
      ensureSpace(boxHeight + 4);
      doc.setFillColor(236, 253, 245);
      doc.rect(margin, y, contentWidth, boxHeight, "F");
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, contentWidth, boxHeight, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(6, 78, 59);
      doc.text(lines, margin + 4, y + 5);
      y += boxHeight + 4;
    }

    if (article.contentMarkdown) {
      const lines = doc.splitTextToSize(article.contentMarkdown.trim(), contentWidth - 10);
      const boxHeight = lines.length * 3.6 + 6;
      ensureSpace(Math.min(boxHeight, bottomLimit - margin - 16) + 4);
      doc.setFillColor(0, 0, 0);
      doc.rect(margin, y, contentWidth, boxHeight, "F");
      doc.setFont("courier", "normal");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(lines, margin + 4, y + 5);
      y += boxHeight + 6;
    }

    drawRunningFooter(footerLabel, chapterNumber);
  });

  // ---------------------------------------------------------------------------
  // Help & support
  // ---------------------------------------------------------------------------
  doc.addPage();
  const supportPage = (articles.length + 2).toString().padStart(2, "0");
  drawRunningHeader("Help & support", `Page ${supportPage}`);

  y = margin + 16;
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text("Need more help?", margin, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Where to go when this manual does not answer your question.", margin, y);

  const supportTips: Array<[string, string]> = targetAudience === "tenant"
    ? [
        ["Ask your landlord", "Open Messages in the portal. The conversation is kept as a record for both parties."],
        ["Ask iRis", "The Chat with iRis button on your dashboard answers questions about your lease, dues, and house rules."],
        ["Your records", "Receipts, signed leases, and messages are stored securely and are visible only to you and your landlord."],
      ]
    : targetAudience === "landlord"
      ? [
          ["Check the installation", "Open /setup/technical to verify the database connection and mail transport."],
          ["Search the manual", "Use the search button in the interactive manual to find a topic by keyword."],
          ["Written guides", "Longer walkthroughs are available on the documentation site at /docs/introduction."],
        ]
      : [
          ["Health endpoint", "/api/health reports database and mail transport status for uptime monitoring."],
          ["Commissioning page", "/setup/technical lists required environment variables and runs connectivity checks."],
          ["Source of truth", "source-of-truth-db.sql and supabase/migrations define the schema; vercel.json defines scheduled jobs."],
        ];

  y += 12;
  supportTips.forEach(([title, body], index) => {
    const bodyLines = doc.splitTextToSize(body, contentWidth - 10);
    const cardHeight = 10 + bodyLines.length * LINE_HEIGHT_MM;
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, contentWidth, cardHeight, "F");
    doc.setDrawColor(225, 225, 230);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, cardHeight, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`${index + 1}. ${title.toUpperCase()}`, margin + 5, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(bodyLines, margin + 5, y + 13);
    y += cardHeight + 4;
  });

  drawRunningFooter(footerLabel, supportPage);

  // ---------------------------------------------------------------------------
  // Quick reference
  // ---------------------------------------------------------------------------
  doc.addPage();
  const referencePage = (articles.length + 3).toString().padStart(2, "0");
  drawRunningHeader("Quick reference", `Page ${referencePage}`);

  y = margin + 16;
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text("Interactive manual controls", margin, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Keyboard shortcuts available in the in-app reader.", margin, y);

  y += 12;
  const shortcuts: Array<[string, string]> = [
    ["Next page", "Right arrow / Space"],
    ["Previous page", "Left arrow"],
    ["Close search or contents", "Esc"],
    ["Search topics", "Search button in header"],
  ];

  shortcuts.forEach(([action, key]) => {
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, contentWidth, 14, "F");
    doc.setDrawColor(225, 225, 230);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, 14, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text(action, margin + 5, y + 9);

    doc.setFillColor(235, 235, 240);
    doc.rect(pageWidth - margin - 55, y + 3.5, 50, 7, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(key, pageWidth - margin - 30, y + 8, { align: "center" });

    y += 17;
  });

  drawRunningFooter(footerLabel, referencePage);

  // ---------------------------------------------------------------------------
  // Back cover
  // ---------------------------------------------------------------------------
  doc.addPage();
  y = margin + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text("iReside", margin, y + 5);
  doc.text(coverLabel.toUpperCase(), pageWidth - margin, y + 5, { align: "right" });

  y += 9;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageWidth - margin, y);

  y = pageHeight / 2 - 35;
  doc.setFillColor(0, 0, 0);
  doc.rect(pageWidth / 2 - 8, y, 16, 16, "F");
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("iR", pageWidth / 2, y + 11, { align: "center" });

  y += 26;
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text("iReside", pageWidth / 2, y, { align: "center" });

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text(doc.splitTextToSize(tagline, contentWidth - 30), pageWidth / 2, y, { align: "center" });

  y = pageHeight - margin - 15;
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("iReside property management platform", margin, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text(`Edition ${DOCS_EDITION}`, pageWidth - margin, y + 3, { align: "right" });

  const filename = isMaster
    ? "iReside_Complete_Manual.pdf"
    : `iReside_${manual.short.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}
