import { jsPDF } from "jspdf";
import { DocArticle, DocAudience, DOCS_ARTICLES } from "./docsData";

export async function generateDocsPdf(audience: DocAudience = "landlord"): Promise<void> {
  const targetAudience: "tenant" | "landlord" | "it" =
    audience === "user" ? "landlord" : (audience as "tenant" | "landlord" | "it");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const articles = DOCS_ARTICLES.filter((a) => a.audience === targetAudience);

  // Helper: Draw Standard Running Header (1:1 with EBook)
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

  // Helper: Draw Standard Running Footer (1:1 with EBook)
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

  // =========================================================================
  // PAGE 0: FRONT COVER (1:1 Monochrome E-Book Cover)
  // =========================================================================
  let y = margin + 5;

  // Header Spine
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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  const headerAudienceLabel =
    targetAudience === "tenant"
      ? "TENANT USER MANUAL"
      : targetAudience === "landlord"
      ? "LANDLORD USER MANUAL"
      : "TECHNICAL MANUAL";
  doc.text(headerAudienceLabel, pageWidth - margin, y + 5.2, { align: "right" });

  y += 9;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageWidth - margin, y);

  // Hero Section
  y += 45;
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, 48, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  const badgeLabel =
    targetAudience === "tenant"
      ? "RESIDENT LIVING GUIDE"
      : targetAudience === "landlord"
      ? "PROPERTY MANAGER GUIDE"
      : "TECHNICAL DOCUMENTATION";
  doc.text(badgeLabel, margin + 3, y + 4.2);

  y += 14;
  doc.setFont("times", "bold"); // Serif heading matching ebook font-serif
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  const coverTitle =
    targetAudience === "tenant"
      ? "Tenant User Guide &\nResident Living Manual"
      : targetAudience === "landlord"
      ? "Landlord Operations &\nProperty Management Manual"
      : "Technical Setup &\nDeveloper Guide";
  doc.text(coverTitle, margin, y);

  y += 24;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 18, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const coverSummary =
    targetAudience === "tenant"
      ? "Your official guide to paying rent online via GCash/Card, signing digital leases, reporting maintenance issues, and staying connected with your community."
      : targetAudience === "landlord"
      ? "A complete guide to property setups, inviting residents, automating billing & submeters, managing maintenance work orders, and tracking portfolio analytics."
      : "Clear instructions for setting up the database, security rules, email sending, serverless crons, and maintenance tools.";
  const splitCoverSummary = doc.splitTextToSize(coverSummary, contentWidth - 15);
  doc.text(splitCoverSummary, margin, y);

  // Cover Footer
  y = pageHeight - margin - 15;
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("OFFICIAL MANUAL", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("iReside System", margin, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("Edition 2026", pageWidth - margin, y + 3, { align: "right" });

  // =========================================================================
  // PAGE 1: TABLE OF CONTENTS (1:1 with EBook)
  // =========================================================================
  doc.addPage();
  y = margin + 5;

  drawRunningHeader("Table of Contents", "Page 1");

  y = margin + 18;
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(
    targetAudience === "tenant"
      ? "Resident Chapters"
      : targetAudience === "landlord"
      ? "Landlord Operations"
      : "Technical Topics",
    margin,
    y
  );

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Topics included in this official guide.", margin, y);

  y += 10;
  articles.forEach((art, idx) => {
    if (y > pageHeight - margin - 20) {
      drawRunningFooter("iReside User Guide", "Contents");
      doc.addPage();
      drawRunningHeader("Table of Contents (Cont.)", "Page 1b");
      y = margin + 18;
    }

    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(120, 120, 120);
    doc.text((idx + 1).toString().padStart(2, "0"), margin, y + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    // Shorten title if too long to prevent overlapping page number
    const maxTitleWidth = contentWidth - 25;
    const titleText = doc.splitTextToSize(art.title, maxTitleWidth)[0] || art.title;
    doc.text(titleText, margin + 10, y + 4);

    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`p.${(idx + 2).toString().padStart(2, "0")}`, pageWidth - margin, y + 4, {
      align: "right",
    });

    y += 5.5;
    doc.setDrawColor(240, 240, 243);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  });

  drawRunningFooter("iReside User Guide", "Contents");

  // =========================================================================
  // PAGES 2+: ARTICLE CHAPTERS (1:1 with EBook)
  // =========================================================================
  articles.forEach((art, idx) => {
    doc.addPage();
    const pageNumStr = `Page ${(idx + 2).toString().padStart(2, "0")}`;
    drawRunningHeader(art.categoryLabel, pageNumStr);

    y = margin + 16;

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    const splitTitle = doc.splitTextToSize(art.title, contentWidth);
    doc.text(splitTitle, margin, y);
    y += splitTitle.length * 7 + 2;

    // Summary
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    const splitSummary = doc.splitTextToSize(art.summary, contentWidth);
    doc.text(splitSummary, margin, y);
    y += splitSummary.length * 4.5 + 8;

    // Step Cards
    if (art.steps && art.steps.length > 0) {
      art.steps.forEach((step, sIdx) => {
        const descLines = doc.splitTextToSize(step.description, contentWidth - 16);
        const tipLines = step.tip ? doc.splitTextToSize(`TIP: ${step.tip}`, contentWidth - 18) : [];
        const extraTipHeight = step.tip ? tipLines.length * 3.5 + 4 : 0;
        const cardHeight = Math.max(16, descLines.length * 4 + (step.codeSnippet ? 20 : 12) + extraTipHeight);

        // Card Container Box
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, contentWidth, cardHeight, "F");
        doc.setDrawColor(225, 225, 230);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, contentWidth, cardHeight, "S");

        // Step Number Badge (Black Box with White Number)
        doc.setFillColor(0, 0, 0);
        doc.rect(margin + 3.5, y + 3.5, 5.5, 5.5, "F");
        doc.setFont("courier", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text((sIdx + 1).toString(), margin + 5.2, y + 7.4);

        // Step Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(0, 0, 0);
        doc.text(step.title, margin + 12, y + 7.5);

        // Step Description
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        doc.text(descLines, margin + 12, y + 13);

        // Step Tip Callout
        if (step.tip) {
          const tipY = y + descLines.length * 4 + 13;
          doc.setFillColor(254, 243, 199);
          doc.rect(margin + 12, tipY, contentWidth - 15, tipLines.length * 3.5 + 3, "F");
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(0.2);
          doc.rect(margin + 12, tipY, contentWidth - 15, tipLines.length * 3.5 + 3, "S");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(180, 83, 9);
          doc.text(tipLines, margin + 14, tipY + 3.5);
        }

        // Code Snippet (Black block with monospace text)
        if (step.codeSnippet) {
          const codeY = y + descLines.length * 4 + 14 + extraTipHeight;
          doc.setFillColor(0, 0, 0);
          doc.rect(margin + 12, codeY, contentWidth - 15, 8, "F");
          doc.setFont("courier", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(255, 255, 255);
          doc.text(step.codeSnippet, margin + 15, codeY + 5.2);
        }

        y += cardHeight + 4;
      });
    }

    // Markdown content block (if technical runbook)
    if (art.contentMarkdown) {
      doc.setFillColor(0, 0, 0);
      const splitMd = doc.splitTextToSize(art.contentMarkdown.trim(), contentWidth - 10);
      const mdHeight = Math.min(splitMd.length * 3.8 + 6, 80);
      doc.rect(margin, y, contentWidth, mdHeight, "F");

      doc.setFont("courier", "normal");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(splitMd.slice(0, 18), margin + 4, y + 5);
      y += mdHeight + 6;
    }

    drawRunningFooter("iReside Guide", (idx + 2).toString().padStart(2, "0"));
  });

  // =========================================================================
  // PAGE N+2: SUPPORT & QUICK TIPS (1:1 with EBook)
  // =========================================================================
  doc.addPage();
  const supportPageNum = (articles.length + 2).toString().padStart(2, "0");
  drawRunningHeader("Help & Support", "Quick Tips");

  y = margin + 16;
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text("Need More Help or Have Questions?", margin, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "Here are common troubleshooting tools and tips to keep your property running smoothly.",
    margin,
    y
  );

  y += 12;
  // Card 1
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, contentWidth, 20, "F");
  doc.setDrawColor(225, 225, 230);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 20, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("1. INSTANT DIGITAL ASSISTANT", margin + 5, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "Use the in-app iRis resident assistant or consult your building administrator anytime.",
    margin + 5,
    y + 13
  );

  y += 24;
  // Card 2
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, contentWidth, 20, "F");
  doc.setDrawColor(225, 225, 230);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 20, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("2. DATA PRIVACY & SECURITY", margin + 5, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "All lease contracts, official payment receipts, and resident records are protected with bank-grade encryption.",
    margin + 5,
    y + 13
  );

  drawRunningFooter("iReside Guide", supportPageNum);

  // =========================================================================
  // PAGE N+3: QUICK REFERENCE CONTROLS (1:1 with EBook)
  // =========================================================================
  doc.addPage();
  const refPageNum = (articles.length + 3).toString().padStart(2, "0");
  drawRunningHeader("Quick Reference", "Key Controls");

  y = margin + 16;
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text("Quick Keyboard Controls", margin, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "Turn pages effortlessly using your keyboard or the on-screen buttons.",
    margin,
    y
  );

  y += 12;
  const shortcuts = [
    { action: "Turn to Next Page", key: "Right Arrow / Space" },
    { action: "Turn to Previous Page", key: "Left Arrow" },
    { action: "Search Help Topics", key: "Search Bar in Header" },
  ];

  shortcuts.forEach((sc) => {
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, contentWidth, 14, "F");
    doc.setDrawColor(225, 225, 230);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, 14, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text(sc.action, margin + 5, y + 9);

    doc.setFillColor(235, 235, 240);
    doc.rect(pageWidth - margin - 45, y + 3.5, 40, 7, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(sc.key, pageWidth - margin - 25, y + 8, { align: "center" });

    y += 17;
  });

  drawRunningFooter("iReside Guide", refPageNum);

  // =========================================================================
  // PAGE N+4: BACK COVER (1:1 Monochrome E-Book Back Cover)
  // =========================================================================
  doc.addPage();
  y = margin + 5;

  // Header Spine
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text("iReside", margin, y + 5);
  doc.text("OFFICIAL GUIDE", pageWidth - margin, y + 5, { align: "right" });

  y += 9;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageWidth - margin, y);

  // Center Monogram & Title
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
  doc.text("iReside System", pageWidth / 2, y, { align: "center" });

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Simple property management made easy.", pageWidth / 2, y, { align: "center" });

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Designed for property owners, landlords, and residents.", pageWidth / 2, y, {
    align: "center",
  });

  // Footer
  y = pageHeight - margin - 15;
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("iReside Property Platform", margin, y + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("2026 Edition", pageWidth - margin, y + 3, { align: "right" });

  // Save PDF file
  const filename =
    targetAudience === "tenant"
      ? "iReside_Tenant_User_Guide.pdf"
      : targetAudience === "landlord"
      ? "iReside_Landlord_User_Guide.pdf"
      : "iReside_Technical_Guide.pdf";
  doc.save(filename);
}
