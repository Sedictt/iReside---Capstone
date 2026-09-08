import re
import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_shading(cell, color_hex):
    """Applies background color to a table cell."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=60, bottom=60, left=70, right=70):
    """Sets inner padding for a table cell (in dxa: 20 dxa = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table):
    """Applies clean solid borders around and inside the table matching the PDF."""
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>\n'
        f'  <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>\n'
        f'  <w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>\n'
        f'  <w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>\n'
        f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
        f'  <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def make_row_header(row):
    """Marks a table row to repeat on every new page."""
    trPr = row._tr.get_or_add_trPr()
    trPr.append(OxmlElement('w:tblHeader'))

def set_row_cant_split(row):
    """Prevents table row from being split across page boundaries."""
    trPr = row._tr.get_or_add_trPr()
    trPr.append(OxmlElement('w:cantSplit'))

def parse_markdown_test_cases(md_file_path):
    """Parses role sections and test case rows from markdown."""
    with open(md_file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    sections = []
    cur_sec = {'name': 'Landlord', 'rows': []}
    sections.append(cur_sec)

    for line in lines:
        clean = line.strip()
        if clean.startswith('|'):
            cols = [c.strip() for c in clean.split('|')[1:-1]]
            if len(cols) >= 1:
                first = cols[0].replace('*', '').strip()
                rest_empty = all(c == '' for c in cols[1:])
                if first == 'Landlord' and rest_empty:
                    if cur_sec['name'] != 'Landlord':
                        cur_sec = {'name': 'Landlord', 'rows': []}
                        sections.append(cur_sec)
                    continue
                elif first == 'Tenant' and rest_empty:
                    cur_sec = {'name': 'Tenant', 'rows': []}
                    sections.append(cur_sec)
                    continue
                elif 'System Security' in first and rest_empty:
                    cur_sec = {'name': 'System Security, Accessibility & Resilience', 'rows': []}
                    sections.append(cur_sec)
                    continue

        if clean.startswith('| TC-') or clean.startswith('| TC_'):
            cols = [c.strip() for c in clean.split('|')[1:-1]]
            if len(cols) >= 6:
                while len(cols) < 9:
                    cols.append('')
                # Format breaks cleanly
                cols[4] = cols[4].replace('<br>', '\n')
                cur_sec['rows'].append(cols[:9])

    return [s for s in sections if len(s['rows']) > 0]

def create_styled_document(sections, orientation="portrait", out_path="output.docx"):
    """Generates a styled Word document matching the PDF's visual hierarchy."""
    doc = Document()

    # Configure Section Setup
    for s in doc.sections:
        if orientation.lower() == "portrait":
            s.orientation = 0  # Portrait
            s.page_width = Inches(8.5)
            s.page_height = Inches(11.0)
            s.top_margin = Inches(0.4)
            s.bottom_margin = Inches(0.4)
            s.left_margin = Inches(0.35)
            s.right_margin = Inches(0.35)
            # Available table width = 8.5 - 0.7 = 7.8 inches
            col_widths = [
                Inches(0.95),  # Test Case ID
                Inches(0.90),  # Module / Route
                Inches(1.10),  # Test Scenario
                Inches(1.10),  # Preconditions
                Inches(1.45),  # Test Steps
                Inches(1.20),  # Expected Result
                Inches(0.38),  # Actual Result
                Inches(0.36),  # Pass or Failed
                Inches(0.36)   # Remarks
            ]
            font_size_header = Pt(8.5)
            font_size_body = Pt(7.5)
            font_size_title = Pt(10.5)
            font_size_section = Pt(9.5)
        else:
            s.orientation = 1  # Landscape
            s.page_width = Inches(11.0)
            s.page_height = Inches(8.5)
            s.top_margin = Inches(0.4)
            s.bottom_margin = Inches(0.4)
            s.left_margin = Inches(0.4)
            s.right_margin = Inches(0.4)
            # Available table width = 11.0 - 0.8 = 10.2 inches
            col_widths = [
                Inches(1.20),  # Test Case ID
                Inches(1.10),  # Module / Route
                Inches(1.35),  # Test Scenario
                Inches(1.35),  # Preconditions
                Inches(1.85),  # Test Steps
                Inches(1.55),  # Expected Result
                Inches(0.60),  # Actual Result
                Inches(0.60),  # Pass or Failed
                Inches(0.60)   # Remarks
            ]
            font_size_header = Pt(9.0)
            font_size_body = Pt(8.0)
            font_size_title = Pt(11.5)
            font_size_section = Pt(10.0)

    total_table_width = sum(col_widths)

    table = doc.add_table(rows=0, cols=9)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)

    # 1. Main Title Banner Row (matches PDF page 1 header)
    title_row = table.add_row()
    title_cell = title_row.cells[0]
    for c in title_row.cells[1:]:
        title_cell.merge(c)

    set_cell_shading(title_cell, "F2F4F7")
    set_cell_margins(title_cell, top=100, bottom=100, left=100, right=100)
    title_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    p = title_cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(
        "Design and Development of iReside: Property and Tenant Services Management System\nfor the Landlords of Valenzuela City"
    )
    run.font.name = "Times New Roman"
    run.font.size = font_size_title
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)

    # 2. Table Column Headers
    headers = [
        "Test Case ID",
        "Module /\nRoute",
        "Test Scenario",
        "Preconditions",
        "Test Steps",
        "Expected Result",
        "Actual\nResult",
        "Pass or\nFailed",
        "Remarks"
    ]

    header_row = table.add_row()
    make_row_header(header_row)
    set_row_cant_split(header_row)

    for idx, (cell, text) in enumerate(zip(header_row.cells, headers)):
        set_cell_margins(cell, top=60, bottom=60, left=50, right=50)
        set_cell_shading(cell, "FFFFFF")
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if idx in [0, 6, 7, 8] else WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = font_size_header
        run.font.bold = True
        run.font.color.rgb = RGBColor(0, 0, 0)

    # 3. Add Role Sections & Test Rows
    for sec in sections:
        # Role Header (Merged across 9 columns)
        p_row = table.add_row()
        set_row_cant_split(p_row)
        p_cell = p_row.cells[0]
        for c in p_row.cells[1:]:
            p_cell.merge(c)

        # Light blue tint for section break matching PDF
        set_cell_shading(p_cell, "BDD7EE" if sec['name'] != "Landlord" else "D9E8F5")
        set_cell_margins(p_cell, top=60, bottom=60, left=80, right=80)
        p_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

        p = p_cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(sec['name'])
        run.font.name = "Times New Roman"
        run.font.size = font_size_section
        run.font.bold = True
        run.font.color.rgb = RGBColor(0, 0, 0)

        # Test Case Rows
        for row_data in sec['rows']:
            d_row = table.add_row()
            set_row_cant_split(d_row)

            for c_idx, (cell, val) in enumerate(zip(d_row.cells, row_data)):
                set_cell_margins(cell, top=50, bottom=50, left=50, right=50)
                cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
                p = cell.paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [0, 6, 7, 8] else WD_ALIGN_PARAGRAPH.LEFT
                p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.space_after = Pt(1)
                p.paragraph_format.line_spacing = 1.05

                # Render numbered steps or regular lines
                lines = val.split('\n')
                for l_idx, line in enumerate(lines):
                    if l_idx > 0:
                        p = cell.add_paragraph()
                        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                        p.paragraph_format.space_before = Pt(1)
                        p.paragraph_format.space_after = Pt(1)
                        p.paragraph_format.line_spacing = 1.05
                    run = p.add_run(line)
                    run.font.name = "Times New Roman"
                    run.font.size = font_size_body
                    run.font.color.rgb = RGBColor(0, 0, 0)

    # Apply cell widths
    for row in table.rows:
        if len(row.cells) == 1:
            row.cells[0].width = total_table_width
        else:
            for idx, w in enumerate(col_widths):
                if idx < len(row.cells):
                    row.cells[idx].width = w

    # Ensure parent dir exists
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    doc.save(out_path)
    print(f"Generated {orientation.upper()} at: {out_path}")

def generate_all():
    md_path = r'c:\Users\JV\Documents\GitHub\iReside\docs\QA_TEST_CASES.md'
    sections = parse_markdown_test_cases(md_path)

    total_cases = sum(len(s['rows']) for s in sections)
    print(f"Parsed {len(sections)} sections with {total_cases} total test cases.")

    # 1. Letter Portrait (matches user's PDF exact 8.5 x 11 format)
    create_styled_document(
        sections,
        orientation="portrait",
        out_path=r'c:\Users\JV\Documents\GitHub\iReside\docs\iReside_QA_Test_Cases_Letter_Portrait.docx'
    )

    # 2. Letter Landscape (11 x 8.5)
    create_styled_document(
        sections,
        orientation="landscape",
        out_path=r'c:\Users\JV\Documents\GitHub\iReside\docs\iReside_QA_Test_Cases_Letter_Landscape.docx'
    )

    # 3. Default repo docx
    create_styled_document(
        sections,
        orientation="portrait",
        out_path=r'c:\Users\JV\Documents\GitHub\iReside\docs\iReside_QA_Test_Cases.docx'
    )

    # 4. Also copy directly to user's Downloads folder
    create_styled_document(
        sections,
        orientation="portrait",
        out_path=r'C:\Users\JV\Downloads\iReside_QA_Test_Cases.docx'
    )

if __name__ == "__main__":
    generate_all()
