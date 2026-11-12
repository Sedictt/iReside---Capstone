# -*- coding: utf-8 -*-
"""Build the print-ready A5 user manual (English and Filipino) as Word files.

    python scripts/user-manual/build_manual.py

Writes docs/manual/iReside_User_Manual_EN.docx and _FIL.docx.
Run export_pdf.ps1 afterwards to fill the table of contents and make PDFs.
"""
import os
import re
import sys

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Mm, Pt, RGBColor

sys.path.insert(0, os.path.dirname(__file__))
from manual_content import BOOK, CHAPTERS, FIL_LABELS, LANG_NOTE  # noqa: E402
from build_markdown import build_markdown  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "docs", "manual")

FONT = "Arial"
INK = RGBColor(0x11, 0x11, 0x11)
BODY_PT = 12
H1_PT = 22
H2_PT = 18
H3_PT = 14

# A5 portrait. Text width = 148 - 16 (outside) - 15 (inside) - 6 (binding) = 111 mm.
# The outside margin has 1 mm spare because Word lets trailing spaces run past it.
PAGE_W, PAGE_H = Mm(148), Mm(210)
MARGIN_OUT, MARGIN_IN, MARGIN_TB, GUTTER = Mm(16), Mm(15), Mm(17), Mm(6)
TEXT_W = Mm(111)
SHOT_W = Mm(96)  # step pictures are 16:10, so 60 mm tall
SHOTS_DIR = os.path.join(OUT_DIR, "shots")


def safe_image(path):
    if not path or not os.path.exists(path):
        return None
    try:
        import io
        from PIL import Image
        with Image.open(path) as img:
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            buf.seek(0)
            return buf
    except Exception as e:
        print(f"Warning: could not process {path}: {e}")
        return None


# ---------------------------------------------------------------- low level
def set_cell_border(cell, sz=12, color="111111", val="single"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), val)
        el.set(qn("w:sz"), str(sz))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        borders.append(el)
    tc_pr.append(borders)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_margins(cell, mm=3):
    tc_pr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:w"), str(int(mm * 56.7)))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tc_pr.append(mar)


def set_row_height(row, height, exact=False):
    tr_pr = row._tr.get_or_add_trPr()
    h = OxmlElement("w:trHeight")
    h.set(qn("w:val"), str(int(height.twips if hasattr(height, "twips") else height)))
    h.set(qn("w:hRule"), "exact" if exact else "atLeast")
    tr_pr.append(h)
    cant = OxmlElement("w:cantSplit")
    tr_pr.append(cant)


def table_no_split(table):
    for row in table.rows:
        tr_pr = row._tr.get_or_add_trPr()
        tr_pr.append(OxmlElement("w:cantSplit"))


def fixed_table(table, width):
    tbl_pr = table._tbl.tblPr
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tbl_pr.append(layout)
    w = OxmlElement("w:tblW")
    w.set(qn("w:w"), str(width.twips))
    w.set(qn("w:type"), "dxa")
    tbl_pr.append(w)


def add_field(paragraph, instr):
    run = paragraph.add_run()
    for kind, text in (("begin", None), ("instr", instr), ("separate", None), ("end", None)):
        if kind == "instr":
            el = OxmlElement("w:instrText")
            el.set(qn("xml:space"), "preserve")
            el.text = text
        else:
            el = OxmlElement("w:fldChar")
            el.set(qn("w:fldCharType"), kind)
        run._r.append(el)
    return run


def keep_next(p, on=True):
    p.paragraph_format.keep_with_next = on
    p.paragraph_format.keep_together = True


# ---------------------------------------------------------------- text
TOKEN = re.compile(r"(\[\[.+?\]\]|\*\*.+?\*\*)")


def arial(run):
    """Pin a run to Arial so Word never falls back to the theme fonts."""
    run.font.name = FONT
    r_fonts = run._r.get_or_add_rPr().get_or_add_rFonts()
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        r_fonts.set(qn(attr), FONT)
    return run


def add_rich(paragraph, text, lang, size=BODY_PT, bold=False, italic=False):
    """Write text with [[Label]] and **bold** markup into a paragraph."""
    start = len(paragraph.runs)
    _add_rich(paragraph, text, lang, size, bold, italic)
    for run in paragraph.runs[start:]:
        arial(run)
    return paragraph


def _add_rich(paragraph, text, lang, size, bold, italic):
    for part in TOKEN.split(text):
        if not part:
            continue
        if part.startswith("[["):
            label = part[2:-2]
            if lang == "fil":
                fil = FIL_LABELS.get(label)
                if fil is None:
                    raise KeyError(f"No Filipino label for: {label}")
                r = paragraph.add_run(fil)
                r.bold = True
                r.font.size = Pt(size)
                if fil != label:
                    r2 = paragraph.add_run(f" ({label})")
                    r2.font.size = Pt(size)
                    r2.italic = italic
            else:
                r = paragraph.add_run(label)
                r.bold = True
                r.font.size = Pt(size)
        elif part.startswith("**"):
            r = paragraph.add_run(part[2:-2])
            r.bold = True
            r.italic = italic
            r.font.size = Pt(size)
        else:
            r = paragraph.add_run(part)
            r.bold = bold
            r.italic = italic
            r.font.size = Pt(size)


def pick(pair, lang):
    return pair[0] if lang == "en" else pair[1]


# ---------------------------------------------------------------- document
def setup_document():
    doc = Document()
    sec = doc.sections[0]
    sec.orientation = WD_ORIENT.PORTRAIT
    sec.page_width, sec.page_height = PAGE_W, PAGE_H
    sec.top_margin = sec.bottom_margin = MARGIN_TB
    sec.left_margin, sec.right_margin = MARGIN_IN, MARGIN_OUT
    sec.gutter = GUTTER
    sec.header_distance = Mm(8)
    sec.footer_distance = Mm(8)

    # Mirror margins so the binding gutter is always on the inside edge.
    settings = doc.settings.element
    settings.append(OxmlElement("w:mirrorMargins"))

    # Document default font is Arial too (empty paragraphs, fields, TOC lines).
    rpr_default = doc.styles.element.find(qn("w:docDefaults")).find(qn("w:rPrDefault")).find(qn("w:rPr"))
    fonts = rpr_default.find(qn("w:rFonts"))
    if fonts is None:
        fonts = OxmlElement("w:rFonts")
        rpr_default.insert(0, fonts)
    for attr in list(fonts.attrib):
        del fonts.attrib[attr]
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        fonts.set(qn(attr), FONT)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = FONT
    normal.font.size = Pt(BODY_PT)
    normal.font.color.rgb = INK
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    pf = normal.paragraph_format
    pf.space_after = Pt(6)
    pf.line_spacing = 1.2
    pf.widow_control = True

    for name, size, before, after in (("Heading 1", H1_PT, 0, 12),
                                      ("Heading 2", H2_PT, 0, 8),
                                      ("Heading 3", H3_PT, 10, 4)):
        st = styles[name]
        st.font.name = FONT
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = INK
        r_fonts = st.element.rPr.rFonts
        for attr in [a for a in r_fonts.attrib if "Theme" in a]:
            del r_fonts.attrib[attr]
        for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
            r_fonts.set(qn(attr), FONT)
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(after)
        st.paragraph_format.keep_with_next = True
        st.paragraph_format.line_spacing = 1.1

    for name in ("TOC 1", "TOC 2"):
        st = styles[name] if name in [s.name for s in styles] else styles.add_style(name, 1)
        st.font.name = FONT
        st.font.size = Pt(BODY_PT)
        st.font.bold = name == "TOC 1"
        st.paragraph_format.space_after = Pt(3 if name == "TOC 2" else 2)
        st.paragraph_format.space_before = Pt(0 if name == "TOC 2" else 8)
        st.paragraph_format.left_indent = Mm(0 if name == "TOC 1" else 4)

    # Page number on every page, centred in the footer.
    footer = sec.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = add_field(fp, "PAGE")
    r.font.size = Pt(BODY_PT)
    r.font.name = FONT
    return doc


def page_break(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def heading(doc, text, level, lang, new_page=False):
    p = doc.add_paragraph(style=f"Heading {level}")
    add_rich(p, text, lang, size={1: H1_PT, 2: H2_PT, 3: H3_PT}[level])
    for r in p.runs:
        r.bold = True
    p.paragraph_format.page_break_before = new_page
    return p


def para(doc, text, lang, **kw):
    p = doc.add_paragraph()
    add_rich(p, text, lang, **kw)
    return p


def bullets(doc, items, lang):
    for pair in items:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Mm(6)
        p.paragraph_format.first_line_indent = Mm(-5)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run("•\t")
        r.font.size = Pt(BODY_PT)
        p.paragraph_format.tab_stops.add_tab_stop(Mm(6))
        add_rich(p, pick(pair, lang), lang)


def note_box(doc, kind, text, lang):
    book = BOOK[lang]
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    fixed_table(t, TEXT_W)
    cell = t.cell(0, 0)
    cell.width = TEXT_W
    if kind == "warning":
        set_cell_border(cell, sz=24)
        set_cell_shading(cell, "FFFFFF")
        label = "⚠ " + book["warning"]
    else:
        set_cell_border(cell, sz=8, val="single")
        set_cell_shading(cell, "F2F2F2")
        label = "✓ " + book["tip"]
    set_cell_margins(cell, 3)
    p = cell.paragraphs[0]
    r = p.add_run(label)
    r.bold = True
    r.font.size = Pt(BODY_PT)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    p2 = cell.add_paragraph()
    add_rich(p2, text, lang)
    p2.paragraph_format.space_after = Pt(0)
    table_no_split(t)
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(4)
    spacer.paragraph_format.line_spacing = 0.6


def step_block(doc, n, text, caption, lang, image=None):
    """One step: number + action, then the screen picture and its caption.

    Steps done outside iReside (the GCash app, counting cash) have no picture,
    so they print as the action only. Everything is kept on one page.
    """
    book = BOOK[lang]
    t = doc.add_table(rows=3 if image else 1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    fixed_table(t, TEXT_W)

    c0 = t.cell(0, 0)
    c0.width = TEXT_W
    set_cell_margins(c0, 1)
    p = c0.paragraphs[0]
    r = p.add_run(f"{book['step']} {n}.  ")
    r.bold = True
    r.font.size = Pt(BODY_PT + 1)
    arial(r)
    add_rich(p, text, lang, size=BODY_PT + 1)
    p.paragraph_format.space_after = Pt(3)

    if image:
        c1 = t.cell(1, 0)
        c1.width = TEXT_W
        set_cell_margins(c1, 0)
        p = c1.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        p.add_run().add_picture(image, width=SHOT_W)
        # Thin frame so the picture edge shows on white paper.
        set_cell_border(c1, sz=6, color="888888")

        c2 = t.cell(2, 0)
        c2.width = TEXT_W
        set_cell_margins(c2, 1)
        p = c2.paragraphs[0]
        add_rich(p, caption, lang, size=BODY_PT, italic=True)
        p.paragraph_format.space_after = Pt(0)
    table_no_split(t)
    for row in t.rows[:-1]:
        for cp in row.cells[0].paragraphs:
            cp.paragraph_format.keep_with_next = True
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(6)
    spacer.paragraph_format.line_spacing = 0.6


def render_block(doc, block, lang):
    kind = block[0]
    if kind == "p":
        para(doc, pick(block[1:3], lang), lang)
    elif kind == "h":
        heading(doc, pick(block[1:3], lang), 3, lang)
    elif kind == "list":
        bullets(doc, block[1], lang)
    elif kind in ("tip", "warning"):
        note_box(doc, kind, pick(block[1:3], lang), lang)
    elif kind == "lang_note":
        k, en, fil = LANG_NOTE[lang]
        note_box(doc, k, en if lang == "en" else fil, lang)
    elif kind == "qa":
        q = pick(block[1:3], lang)
        a = pick(block[3:5], lang)
        qp = doc.add_paragraph()
        keep_next(qp)
        qp.paragraph_format.space_before = Pt(8)
        qp.paragraph_format.space_after = Pt(2)
        r = qp.add_run(("Q: " if lang == "en" else "T: "))
        r.bold = True
        add_rich(qp, q, lang, bold=True)
        ap = doc.add_paragraph()
        ap.paragraph_format.left_indent = Mm(6)
        ap.paragraph_format.keep_together = True
        r = ap.add_run(("A: " if lang == "en" else "S: "))
        r.bold = True
        add_rich(ap, a, lang)
    else:
        raise ValueError(kind)


def render_terms(doc, terms, lang):
    terms = sorted(terms, key=lambda b: (b[1] if lang == "en" else b[2]).lower())
    for b in terms:
        word = b[1] if lang == "en" else b[2]
        meaning = b[3] if lang == "en" else b[4]
        p = doc.add_paragraph()
        p.paragraph_format.keep_together = True
        p.paragraph_format.space_after = Pt(5)
        r = p.add_run(word)
        r.bold = True
        if lang == "fil" and b[1].lower() != b[2].lower():
            r2 = p.add_run(f" ({b[1]})")
            r2.italic = True
        p.add_run(" – ")
        add_rich(p, meaning, lang)


# ---------------------------------------------------------------- pages
def cover(doc, lang):
    book = BOOK[lang]
    for _ in range(4):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(book["title"])
    r.bold = True
    r.font.size = Pt(44)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(book["subtitle"])
    r.bold = True
    r.font.size = Pt(26)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    r = p.add_run(book["for_whom"])
    r.font.size = Pt(16)

    # Simple house mark drawn with a bordered box, no photos.
    for _ in range(3):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("⌂")
    r.font.size = Pt(60)
    for _ in range(2):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(book["cover_note"])
    r.font.size = Pt(BODY_PT)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(book["edition"])
    r.font.size = Pt(BODY_PT)


def owner_box(doc, lang):
    """Inside cover: a place to write the email address (never the password)."""
    labels = {
        "en": ("This book belongs to:", "My email address:", "My room or unit:",
               "My landlord's name and number:", "Never write your password here."),
        "fil": ("Ang librong ito ay pag-aari ni:", "Ang aking email address:", "Ang aking kwarto o unit:",
                "Pangalan at number ng may-ari:", "Huwag kailanman isulat dito ang password."),
    }[lang]
    for text in labels[:4]:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        r = p.add_run(text)
        r.bold = True
        line = doc.add_paragraph()
        line.add_run("_" * 38)
    note_box(doc, "warning", labels[4], lang)


def toc(doc, lang):
    book = BOOK[lang]
    # Not a Heading 1, so the contents page does not list itself.
    p = doc.add_paragraph()
    p.paragraph_format.page_break_before = True
    p.paragraph_format.space_after = Pt(12)
    r = arial(p.add_run(book["toc"]))
    r.bold = True
    r.font.size = Pt(H1_PT)
    para(doc, book["toc_hint"], lang)
    p = doc.add_paragraph()
    arial(add_field(p, 'TOC \\o "1-2" \\h \\z'))


def build(lang):
    doc = setup_document()
    cover(doc, lang)
    page_break(doc)
    owner_box(doc, lang)
    toc(doc, lang)

    for ch in CHAPTERS:
        heading(doc, pick(ch["title"], lang), 1, lang, new_page=True)
        if "blocks" in ch:
            terms = [b for b in ch["blocks"] if b[0] == "term"]
            for b in ch["blocks"]:
                if b[0] != "term":
                    render_block(doc, b, lang)
            if terms:
                render_terms(doc, terms, lang)
        for i, task in enumerate(ch.get("tasks", [])):
            # The first task shares the chapter's opening page.
            heading(doc, pick(task["title"], lang), 2, lang, new_page=i > 0)
            para(doc, pick(task["intro"], lang), lang)
            for n, (en, fil, cap_en, cap_fil) in enumerate(task["steps"], start=1):
                shot = os.path.join(SHOTS_DIR, lang, f"{task['key']}-{n}.jpg")
                img_obj = safe_image(shot)
                step_block(doc, n,
                           en if lang == "en" else fil,
                           cap_en if lang == "en" else cap_fil, lang,
                           image=img_obj)
            for b in task.get("boxes", []):
                render_block(doc, b, lang)

    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, f"iReside_User_Manual_{lang.upper()}.docx")
    doc.core_properties.title = f"{BOOK[lang]['title']} {BOOK[lang]['subtitle']}"
    doc.core_properties.author = "iReside"
    doc.save(path)
    return path


def check_sentences():
    """Warn about any sentence longer than 15 words."""
    long = []

    def scan(text):
        if not text:
            return
        plain = re.sub(r"\[\[(.+?)\]\]|\*\*(.+?)\*\*", lambda m: m.group(1) or m.group(2), text)
        for s in re.split(r"(?<=[.!?:])\s+", plain):
            if len(s.split()) > 15:
                long.append(s)

    def walk(obj):
        if isinstance(obj, str):
            scan(obj)
        elif isinstance(obj, (list, tuple)):
            for x in obj:
                walk(x)
        elif isinstance(obj, dict):
            for v in obj.values():
                walk(v)

    walk(CHAPTERS)
    walk(LANG_NOTE)
    return long


if __name__ == "__main__":
    too_long = check_sentences()
    for s in too_long:
        print("LONG:", len(s.split()), s)
    for lang in ("en", "fil"):
        print(build(lang))
        print(build_markdown(lang))
