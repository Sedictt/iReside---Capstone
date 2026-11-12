import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

doc = docx.Document()

# Page setup
for s in doc.sections:
    s.top_margin = Inches(1.0)
    s.bottom_margin = Inches(1.0)
    s.left_margin = Inches(1.0)
    s.right_margin = Inches(1.0)

# Colors
PRIMARY = RGBColor(47, 111, 94)   # Forest green brand / #2f6f5e
DARK = RGBColor(31, 41, 55)       # Charcoal
MUTED = RGBColor(107, 114, 128)   # Gray

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

# Title
title_p = doc.add_paragraph()
title_run = title_p.add_run('Appendix: Client & Intended Market User Interview Transcript')
title_run.font.name = 'Calibri'
title_run.font.size = Pt(20)
title_run.font.bold = True
title_run.font.color.rgb = PRIMARY
title_p.paragraph_format.space_after = Pt(2)

sub_p = doc.add_paragraph()
sub_run = sub_p.add_run('System Requirements Elicitation & Specification Phase (Capstone 1)')
sub_run.font.name = 'Calibri'
sub_run.font.size = Pt(13)
sub_run.font.italic = True
sub_run.font.color.rgb = MUTED
sub_p.paragraph_format.space_after = Pt(16)

# Meta Table
meta_table = doc.add_table(rows=6, cols=2)
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    ('Project Title:', 'iReside: Property & Tenant Services Management System'),
    ('Document Type:', 'Formal User Interview Transcript & Requirements Mapping'),
    ('Date of Interview:', 'October 15, 2025'),
    ('Location / Venue:', 'Fernando Gonzales Dormitory, Marulas, Valenzuela City'),
    ('Interviewee:', 'John Peter Gonzales (Property Owner / Landlord)'),
    ('Interviewer:', 'Joseph Venedict Tillo (Lead Developer & Capstone Researcher)')
]
for idx, (label, val) in enumerate(meta_data):
    row = meta_table.rows[idx]
    c1, c2 = row.cells[0], row.cells[1]
    c1.width = Inches(1.8)
    c2.width = Inches(4.7)
    p1 = c1.paragraphs[0]
    r1 = p1.add_run(label)
    r1.font.bold = True
    r1.font.size = Pt(10)
    r1.font.name = 'Calibri'
    p2 = c2.paragraphs[0]
    r2 = p2.add_run(val)
    r2.font.size = Pt(10)
    r2.font.name = 'Calibri'
    set_cell_background(c1, 'F3F4F6')
    set_cell_background(c2, 'F9FAFB')

doc.add_paragraph().paragraph_format.space_after = Pt(12)

# Background Callout
bg_p = doc.add_paragraph()
bg_r = bg_p.add_run('Background & Objectives: ')
bg_r.font.bold = True
bg_r.font.size = Pt(10.5)
bg_r.font.color.rgb = PRIMARY
bg_r2 = bg_p.add_run('This semi-structured interview was conducted during the Capstone 1 system requirements elicitation phase to investigate operational pain points, manual tracking bottlenecks, and financial reconciliation challenges encountered by micro-to-medium rental property owners in Valenzuela City, Metro Manila. The recorded insights directly justify the functional specifications and UX workflows of the iReside platform.')
bg_r2.font.size = Pt(10)
bg_p.paragraph_format.space_after = Pt(16)

# Read markdown lines to add transcript
with open(r'c:\Users\JV\Documents\GitHub\iReside\docs\CLIENT_INTERVIEW_TRANSCRIPT_REQUIREMENTS.md', encoding='utf-8') as f:
    text = f.read()

# Split into transcript and matrix
parts = text.split('### Verbatim Transcript (Filipino / Taglish)')
if len(parts) > 1:
    body = parts[1].split('### System Requirements Traceability Matrix')[0]
else:
    body = text

sections = body.split('#### ')

for sec in sections:
    sec = sec.strip()
    if not sec:
        continue
    lines = sec.split('\n')
    header = lines[0].replace('---', '').strip()
    if header:
        hp = doc.add_paragraph()
        hr = hp.add_run(header)
        hr.font.name = 'Calibri'
        hr.font.size = Pt(13)
        hr.font.bold = True
        hr.font.color.rgb = PRIMARY
        hp.paragraph_format.space_before = Pt(12)
        hp.paragraph_format.space_after = Pt(6)

    # Process conversational lines
    full_sec_text = '\n'.join(lines[1:])
    qa_blocks = full_sec_text.split('\n\n')
    for block in qa_blocks:
        block = block.strip()
        if not block or block == '---':
            continue
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        
        if block.startswith('**Interviewer:**'):
            content = block.replace('**Interviewer:**', '').strip()
            r_spk = p.add_run('Interviewer: ')
            r_spk.font.bold = True
            r_spk.font.color.rgb = PRIMARY
            r_spk.font.name = 'Calibri'
            r_spk.font.size = Pt(10.5)
            r_txt = p.add_run(content)
            r_txt.font.name = 'Calibri'
            r_txt.font.size = Pt(10.5)
        elif block.startswith('**Interviewee') or block.startswith('**Interviewee (Mang John):**'):
            spk_label = block.split('**')[1]
            content = block.split('**:', 1)[-1].strip() if '**:' in block else block.split('**', 2)[-1].replace(':', '').strip()
            r_spk = p.add_run(spk_label + ': ')
            r_spk.font.bold = True
            r_spk.font.color.rgb = DARK
            r_spk.font.name = 'Calibri'
            r_spk.font.size = Pt(10.5)
            r_txt = p.add_run(content)
            r_txt.font.name = 'Calibri'
            r_txt.font.size = Pt(10.5)
        else:
            r_txt = p.add_run(block.replace('**', ''))
            r_txt.font.name = 'Calibri'
            r_txt.font.size = Pt(10)

# Page break before Matrix
doc.add_page_break()

# Matrix Header
mp = doc.add_paragraph()
mr = mp.add_run('System Requirements Traceability Matrix (Defense Justification Guide)')
mr.font.name = 'Calibri'
mr.font.size = Pt(15)
mr.font.bold = True
mr.font.color.rgb = PRIMARY
mp.paragraph_format.space_after = Pt(10)

sub_m = doc.add_paragraph()
sub_mr = sub_m.add_run('This traceability table maps specific modules and controversial feature choices of the iReside architecture to documented user requirements elicited during the interview, providing bulletproof justification against panel scrutiny.')
sub_mr.font.size = Pt(10)
sub_mr.font.italic = True
sub_m.paragraph_format.space_after = Pt(12)

# Matrix Data
matrix_data = [
    (
        'Interactive 2D Unit Map (/landlord/unit-map)',
        'Why build a complex visual 2D floor layout instead of a simple database table or grid?',
        'Section III: Landlords manage multi-floor facilities where room layout, proximity to stairs/windows, and current physical condition matter to prospective tenants. The 2D map eliminates physical stair-climbing and prevents double-booking rooms undergoing repairs.'
    ),
    (
        'Utility Submeter Automated Calculation (/landlord/utility-billing)',
        'Why include utility billing calculation? Isn\'t rent ledger management sufficient for a property app?',
        'Section II: Submeter utilities are the single highest source of tenant friction and accounting doubt. Automated calculation based on current vs. previous readings, coupled with photo proof and transparent breakdown, eliminates human math errors and disputes.'
    ),
    (
        'Payment Verification & Proof Upload (/landlord/invoices)',
        'Why require landlord verification for GCash / Bank transfers rather than auto-marking them as paid?',
        'Section I: Messenger screenshots are buried and lack transactional linkage. Senders often use third-party names (e.g. parents/relatives), and risks of forged/recycled GCash receipts require explicit landlord verification before ledger settlement.'
    ),
    (
        'Segregated Security Deposit & Advance Rails',
        'Why separate Security Deposit tracking from the regular Monthly Rent balance?',
        'Section IV: Tenants frequently attempt to offset their final month\'s rent with their security deposit ("ibawas sa deposit"), leaving landlords unprotected against unpaid utility bills or damaged fixtures upon property turnover.'
    ),
    (
        'Dual Onboarding (Invite Link & Quick Add) (/landlord/tenants)',
        'Why support both self-service digital links and direct landlord data entry?',
        'Section V: Accommodates heterogeneous tenant demographics: tech-literate university students prefer mobile self-registration, while non-technical walk-in industrial workers require direct in-person landlord onboarding.'
    ),
    (
        'Photo-Evidence Maintenance Ticketing (/landlord/maintenance)',
        'Why implement structured ticketing with photo uploads instead of relying on standard SMS/chat?',
        'Section VI: Verbal and text reports lead to forgotten work orders and incorrect replacement parts being dispatched. Visual photographic evidence ensures contractors arrive with the appropriate tools and materials.'
    ),
    (
        'Two-Role Architecture (Landlord & Tenant Only)',
        'Why is there no overarching System Administrator role in the database?',
        'Section VII: Guarantees technical sovereignty and financial privacy. Micro-to-medium landlords reject recurring third-party admin subscriptions and centralized surveillance over their rental income and tenant data.'
    )
]

table = doc.add_table(rows=len(matrix_data) + 1, cols=3)
table.alignment = WD_TABLE_ALIGNMENT.CENTER

headers = ['System Module / Feature', 'Panel Question / Defense Risk', 'Documented User Requirement & Client Justification']
hdr_row = table.rows[0]
for idx, h in enumerate(headers):
    cell = hdr_row.cells[idx]
    p = cell.paragraphs[0]
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(255, 255, 255)
    set_cell_background(cell, '2F6F5E')

widths = [Inches(1.8), Inches(2.2), Inches(2.5)]

for row_idx, data in enumerate(matrix_data):
    row = table.rows[row_idx + 1]
    bg_color = 'F9FAFB' if row_idx % 2 == 1 else 'FFFFFF'
    for col_idx, text_val in enumerate(data):
        cell = row.cells[col_idx]
        cell.width = widths[col_idx]
        set_cell_background(cell, bg_color)
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(text_val)
        r.font.name = 'Calibri'
        r.font.size = Pt(9)
        if col_idx == 0:
            r.font.bold = True

output_path = r'c:\Users\JV\Documents\GitHub\iReside\docs\iReside_Client_Interview_Transcript.docx'
doc.save(output_path)
print('DOCX successfully saved to:', output_path)
