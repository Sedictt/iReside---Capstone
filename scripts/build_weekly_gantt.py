import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import csv
import os
import datetime
from PIL import Image, ImageDraw, ImageFont

# --- GREEN PALETTE (Faithfully extracted from reference spreadsheet) ---
DARK_GREEN_HEADER = '375623'     # Quarter 1 & Task Code/Name header, Category row bg (RGB 55, 86, 35)
DARK_GREEN_Q2 = '2D4B1C'         # Quarter 2 header (RGB 45, 75, 28)
DARK_GREEN_Q3 = '375623'         # Quarter 3 header (RGB 55, 86, 35)
DARK_GREEN_FINAL = '243E17'      # Final Phase header (RGB 36, 62, 23)

MONTH_GREEN_BG = '2E521E'        # Month header background (RGB 46, 82, 30)
MONTH_TEXT = 'FFFFFF'            # Month header text color

WEEK_LIGHT_GREEN_BG = 'E2EFDA'   # Week subheader background (RGB 226, 239, 218)
WEEK_DARK_GREEN_TEXT = '375623'  # Week subheader text color (RGB 55, 86, 35)

CATEGORY_ROW_BG = '375623'       # Section category header row bg (RGB 55, 86, 35)
CATEGORY_BAR_FILL = '4E7D3A'     # Olive-Forest Green for category timeline span (RGB 78, 125, 58)
TASK_BAR_FILL = '70AD47'         # Excel Accent 6 Green / Task Gantt bar fill color (RGB 112, 173, 71)

WHITE_TEXT = 'FFFFFF'
DARK_TEXT = '1F2937'
MUTED_TEXT = '4B5563'
BORDER_GRAY = 'D1D5DB'
BORDER_GREEN = 'A9D08E'          # Soft green border accent (RGB 169, 208, 142)
HEADER_BORDER_COLOR = '243E17'   # Dark header border

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

# Canonical 73-task schedule strictly faithful to WBSD (40 Weeks: Jan – Oct 2026)
TASKS = [
    # 1.0 Research & Planning (Quarter 1: W1–W8)
    ('1.0', 'Research & Planning', True, 1, 8),
    ('1.0.1', 'Research and Requirement Analysis', False, 1, 3),
    ('1.0.2', 'Client Meeting / Approval', False, 3, 5),
    ('1.0.3', 'UI/UX Design & Prototyping', False, 5, 8),
    
    # 1.1 Account Management (Quarter 1: W8–W13)
    ('1.1', 'Account Management', True, 8, 13),
    ('1.1.1', 'Sign Up', False, 8, 9),
    ('1.1.2', 'Sign In', False, 9, 10),
    ('1.1.3', 'Recover Account', False, 10, 11),
    ('1.1.4', 'Sign Out', False, 11, 11),
    ('1.1.5', 'Profile Management', False, 11, 13),
    
    # 1.2 Core Platform Setup (Quarter 1: W9–W13)
    ('1.2', 'Core Platform Setup', True, 9, 13),
    ('1.2.1', 'Application Layout and Navigation', False, 9, 11),
    ('1.2.2', 'Design System and Styling', False, 11, 12),
    ('1.2.3', 'State and Data Utilities', False, 11, 13),
    ('1.2.4', 'Authentication Guards and Middleware', False, 12, 13),
    
    # 1.3 Tenant Discovery Portal (Quarter 2: W14–W18)
    ('1.3', 'Tenant Discovery Portal', True, 14, 18),
    ('1.3.1', 'Map-Based Search', False, 14, 15),
    ('1.3.2', 'Location Suggestions', False, 15, 16),
    ('1.3.3', 'Listing Filters and Cards', False, 16, 17),
    ('1.3.4', 'Property Details', False, 17, 18),
    ('1.3.5', 'Saved Listings', False, 18, 18),
    
    # 1.4 Applications and Lease Management (Quarter 2: W18–W24)
    ('1.4', 'Applications and Lease Management', True, 18, 24),
    ('1.4.1', 'Application Submission', False, 18, 19),
    ('1.4.2', 'Application Timeline', False, 19, 20),
    ('1.4.3', 'Application Review Workflow', False, 20, 21),
    ('1.4.4', 'Lease Generation', False, 21, 22),
    ('1.4.5', 'Digital Lease Signing', False, 22, 23),
    ('1.4.6', 'Renewal and Move-Out Tracking', False, 23, 24),
    
    # 1.5 Property and Unit Management (Quarter 2: W22–W26)
    ('1.5', 'Property and Unit Management', True, 22, 26),
    ('1.5.1', 'Property Registration', False, 22, 23),
    ('1.5.2', 'Property Verification Support', False, 23, 24),
    ('1.5.3', 'Modular Floor Planner', False, 24, 25),
    ('1.5.4', 'Grid Snapping and Layout Tools', False, 25, 26),
    ('1.5.5', 'Unit Listing Wizard', False, 25, 26),
    ('1.5.6', 'Unit Media Management', False, 26, 26),
    ('1.5.7', 'Listing Status Management', False, 26, 26),
    
    # 1.6 Financial Operations (Quarter 3: W27–W31)
    ('1.6', 'Financial Operations', True, 27, 31),
    ('1.6.1', 'Ledger and Invoice Tracking', False, 27, 28),
    ('1.6.2', 'Invoice Breakdown Engine', False, 28, 29),
    ('1.6.3', 'Receipt Upload and Verification', False, 29, 30),
    ('1.6.4', 'Payment History Views', False, 30, 30),
    ('1.6.5', 'Report Exporting', False, 30, 31),
    ('1.6.6', 'Export History and Audit Logs', False, 31, 31),
    ('1.6.7', 'Date Range Filters', False, 31, 31),
    
    # 1.7 Maintenance, Messaging, and AI (Quarter 3: W31–W35)
    ('1.7', 'Maintenance, Messaging, and AI', True, 31, 35),
    ('1.7.1', 'Maintenance Request Tracking', False, 31, 32),
    ('1.7.2', 'Maintenance Status Updates', False, 32, 32),
    ('1.7.3', 'Real-Time Messaging', False, 32, 33),
    ('1.7.4', 'Presence and Read Indicators', False, 33, 33),
    ('1.7.5', 'Media and File Sharing', False, 33, 33),
    ('1.7.6', 'AI Assistant and RAG Context', False, 33, 34),
    ('1.7.7', 'Landlord Analytics', False, 34, 35),
    ('1.7.8', 'Message Moderation', False, 35, 35),
    
    # 1.8 Admin Governance (Quarter 3: W34–W36)
    ('1.8', 'Admin Governance', True, 34, 36),
    ('1.8.1', 'System Monitoring Dashboard', False, 34, 35),
    ('1.8.2', 'Registration Review Dashboard', False, 35, 35),
    ('1.8.3', 'Internal Administrative Notes', False, 35, 35),
    ('1.8.4', 'User Management Tools', False, 35, 36),
    ('1.8.5', 'Secure Sign-Out', False, 36, 36),
    
    # 1.9 Testing and Deployment (Final Phase: W36–W38)
    ('1.9', 'Testing and Deployment', True, 36, 38),
    ('1.9.1', 'Unit and Integration Testing', False, 36, 36),
    ('1.9.2', 'Security and Access Review', False, 37, 37),
    ('1.9.3', 'Bug Fixing and Refinement', False, 37, 38),
    ('1.9.4', 'Documentation and Final Submission', False, 38, 38),
    
    # 2.1 System Operations & Configuration (Final Phase: W38–W39)
    ('2.1', 'System Operations & Configuration', True, 38, 39),
    ('2.1.1', 'Offline Mode', False, 38, 38),
    ('2.1.2', 'Turnkey Onboarding & Workspace Setup', False, 38, 39),
    ('2.1.3', 'Dynamic White-Label Branding', False, 39, 39),
    ('2.1.4', 'Audit Logging', False, 39, 39),
    
    # 2.2 Testing & Revisions (Final Phase: W39–W40)
    ('2.2', 'Testing & Revisions', True, 39, 40),
    ('2.2.1', 'IT Expert Testing', False, 39, 39),
    ('2.2.2', 'User Acceptance Testing (UAT)', False, 40, 40),
    ('2.2.3', 'System Refinement', False, 40, 40),
]

def build_gantt():
    xlsx_path = 'docs/iReside - GanttChart.xlsx'
    
    # Load or create workbook
    if os.path.exists(xlsx_path):
        wb = openpyxl.load_workbook(xlsx_path)
        if 'Final Gantt Chart' in wb.sheetnames:
            wb['Final Gantt Chart'].title = 'Daily Gantt Chart (Archive)'
        if 'Weekly Gantt Chart (W1-W40)' in wb.sheetnames:
            del wb['Weekly Gantt Chart (W1-W40)']
        ws = wb.create_sheet(title='Weekly Gantt Chart (W1-W40)', index=0)
    else:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = 'Weekly Gantt Chart (W1-W40)'
    
    wb.active = 0
    ws.views.sheetView[0].showGridLines = True

    thin_border = Border(
        left=Side(style='thin', color=BORDER_GRAY),
        right=Side(style='thin', color=BORDER_GRAY),
        top=Side(style='thin', color=BORDER_GRAY),
        bottom=Side(style='thin', color=BORDER_GRAY)
    )

    header_border = Border(
        left=Side(style='thin', color=HEADER_BORDER_COLOR),
        right=Side(style='thin', color=HEADER_BORDER_COLOR),
        top=Side(style='thin', color=HEADER_BORDER_COLOR),
        bottom=Side(style='thin', color=HEADER_BORDER_COLOR)
    )

    ws.row_dimensions[1].height = 26
    ws.row_dimensions[2].height = 20
    ws.row_dimensions[3].height = 20

    quarters = [
        (3, 15, 'QUARTER 1 (Weeks 1 – 13)', DARK_GREEN_HEADER, WHITE_TEXT),
        (16, 28, 'QUARTER 2 (Weeks 14 – 26)', DARK_GREEN_Q2, WHITE_TEXT),
        (29, 37, 'QUARTER 3 (Weeks 27 – 35)', DARK_GREEN_Q3, WHITE_TEXT),
        (38, 42, '(Weeks 36 – 40)', DARK_GREEN_FINAL, WHITE_TEXT),
    ]

    # Style Row 1 & Row 2 Top Left (Cols 1-2)
    for r in [1, 2]:
        for c in [1, 2]:
            cell = ws.cell(r, c)
            cell.fill = PatternFill(start_color=DARK_GREEN_HEADER, end_color=DARK_GREEN_HEADER, fill_type='solid')
            cell.border = header_border

    # Format Row 1 Quarters (Style all cells FIRST, then merge)
    for start_c, end_c, title, bg, fg in quarters:
        for c in range(start_c, end_c + 1):
            cell = ws.cell(1, c)
            cell.fill = PatternFill(start_color=bg, end_color=bg, fill_type='solid')
            cell.font = Font(name='Segoe UI', size=11, bold=True, color=fg)
            cell.alignment = Alignment(horizontal='center', vertical='center')
            cell.border = header_border
        ws.cell(1, start_c).value = title
        ws.merge_cells(start_row=1, start_column=start_c, end_row=1, end_column=end_c)

    # Row 2: Months (Jan – Oct 2026 across 40 weeks)
    months = [
        # Quarter 1
        (3, 6, 'Jan', MONTH_GREEN_BG, MONTH_TEXT),
        (7, 10, 'Feb', MONTH_GREEN_BG, MONTH_TEXT),
        (11, 15, 'Mar', MONTH_GREEN_BG, MONTH_TEXT),
        # Quarter 2
        (16, 19, 'Apr', MONTH_GREEN_BG, MONTH_TEXT),
        (20, 23, 'May', MONTH_GREEN_BG, MONTH_TEXT),
        (24, 28, 'Jun', MONTH_GREEN_BG, MONTH_TEXT),
        # Quarter 3
        (29, 32, 'Jul', MONTH_GREEN_BG, MONTH_TEXT),
        (33, 37, 'Aug', MONTH_GREEN_BG, MONTH_TEXT),
        # Final Phase
        (38, 41, 'Sep', MONTH_GREEN_BG, MONTH_TEXT),
        (42, 42, 'Oct', MONTH_GREEN_BG, MONTH_TEXT),
    ]

    for start_c, end_c, title, bg, fg in months:
        for c in range(start_c, end_c + 1):
            cell = ws.cell(2, c)
            cell.fill = PatternFill(start_color=bg, end_color=bg, fill_type='solid')
            cell.font = Font(name='Segoe UI', size=10, bold=True, color=fg)
            cell.alignment = Alignment(horizontal='center', vertical='center')
            cell.border = header_border
        ws.cell(2, start_c).value = title
        if start_c != end_c:
            ws.merge_cells(start_row=2, start_column=start_c, end_row=2, end_column=end_c)

    # Row 3: Column Labels & Weeks (W1 to W40)
    c1 = ws.cell(3, 1, 'Task Code')
    c1.fill = PatternFill(start_color=DARK_GREEN_HEADER, end_color=DARK_GREEN_HEADER, fill_type='solid')
    c1.font = Font(name='Segoe UI', size=10, bold=True, color=WHITE_TEXT)
    c1.alignment = Alignment(horizontal='center', vertical='center')
    c1.border = header_border

    c2 = ws.cell(3, 2, 'Task Name')
    c2.fill = PatternFill(start_color=DARK_GREEN_HEADER, end_color=DARK_GREEN_HEADER, fill_type='solid')
    c2.font = Font(name='Segoe UI', size=10, bold=True, color=WHITE_TEXT)
    c2.alignment = Alignment(horizontal='left', vertical='center', indent=1)
    c2.border = header_border

    for w in range(1, 41):
        col_idx = w + 2
        cell = ws.cell(3, col_idx, f'W{w}')
        cell.fill = PatternFill(start_color=WEEK_LIGHT_GREEN_BG, end_color=WEEK_LIGHT_GREEN_BG, fill_type='solid')
        cell.font = Font(name='Segoe UI', size=9, bold=True, color=WEEK_DARK_GREEN_TEXT)
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = header_border

    # Data Rows (starting row 4)
    current_row = 4
    for code, name, is_cat, start_w, end_w in TASKS:
        ws.row_dimensions[current_row].height = 22 if is_cat else 20
        
        cell_code = ws.cell(current_row, 1, code)
        cell_name = ws.cell(current_row, 2, name)
        
        if is_cat:
            cat_fill = PatternFill(start_color=CATEGORY_ROW_BG, end_color=CATEGORY_ROW_BG, fill_type='solid')
            cell_code.fill = cat_fill
            cell_code.font = Font(name='Segoe UI', size=10, bold=True, color=WHITE_TEXT)
            cell_code.alignment = Alignment(horizontal='center', vertical='center')
            cell_code.border = thin_border
            
            cell_name.fill = cat_fill
            cell_name.font = Font(name='Segoe UI', size=10, bold=True, color=WHITE_TEXT)
            cell_name.alignment = Alignment(horizontal='left', vertical='center')
            cell_name.border = thin_border
            
            for w in range(1, 41):
                col_idx = w + 2
                c_cell = ws.cell(current_row, col_idx)
                if start_w <= w <= end_w:
                    c_cell.fill = PatternFill(start_color=CATEGORY_BAR_FILL, end_color=CATEGORY_BAR_FILL, fill_type='solid')
                else:
                    c_cell.fill = PatternFill(start_color='F2F5F0', end_color='F2F5F0', fill_type='solid')
                c_cell.border = thin_border
        else:
            zebra_bg = 'FFFFFF' if (current_row % 2 == 0) else 'F8FAF8'
            default_fill = PatternFill(start_color=zebra_bg, end_color=zebra_bg, fill_type='solid')
            
            cell_code.fill = default_fill
            cell_code.font = Font(name='Segoe UI', size=9, bold=False, color=MUTED_TEXT)
            cell_code.alignment = Alignment(horizontal='center', vertical='center')
            cell_code.border = thin_border
            
            cell_name.fill = default_fill
            cell_name.font = Font(name='Segoe UI', size=9, bold=False, color=DARK_TEXT)
            cell_name.alignment = Alignment(horizontal='left', vertical='center', indent=1)
            cell_name.border = thin_border
            
            for w in range(1, 41):
                col_idx = w + 2
                c_cell = ws.cell(current_row, col_idx)
                if start_w <= w <= end_w:
                    c_cell.fill = PatternFill(start_color=TASK_BAR_FILL, end_color=TASK_BAR_FILL, fill_type='solid')
                else:
                    c_cell.fill = default_fill
                c_cell.border = thin_border

        current_row += 1

    # Column dimensions
    ws.column_dimensions['A'].width = 12
    ws.column_dimensions['B'].width = 44
    for w in range(1, 41):
        col_letter = get_column_letter(w + 2)
        ws.column_dimensions[col_letter].width = 5.2

    # Freeze Panes at C4
    ws.freeze_panes = 'C4'

    # Update and synchronize 'Daily Gantt Chart (Archive)'
    sync_daily_archive_sheet(wb)

    wb.save(xlsx_path)
    print(f'Successfully built {xlsx_path} with {current_row - 4} tasks across 40 weeks!')

    # Export CSV version
    csv_path = 'docs/iReside - GanttChart_Weekly.csv'
    export_weekly_csv(csv_path)
    print(f'Successfully exported {csv_path}')

    # Render high-resolution PNG image version
    render_png(TASKS, quarters, months)

def export_weekly_csv(csv_path):
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Header Row 1: Quarters matching merged cell structure
        r1 = ['', ''] + ['QUARTER 1 (Weeks 1 – 13)'] + [''] * 12 + \
             ['QUARTER 2 (Weeks 14 – 26)'] + [''] * 12 + \
             ['QUARTER 3 (Weeks 27 – 35)'] + [''] * 8 + \
             ['(Weeks 36 – 40)'] + [''] * 4
        writer.writerow(r1)
        
        # Header Row 2: Months matching merged cell structure
        r2 = ['', ''] + ['Jan'] + [''] * 3 + \
             ['Feb'] + [''] * 3 + \
             ['Mar'] + [''] * 4 + \
             ['Apr'] + [''] * 3 + \
             ['May'] + [''] * 3 + \
             ['Jun'] + [''] * 4 + \
             ['Jul'] + [''] * 3 + \
             ['Aug'] + [''] * 4 + \
             ['Sep'] + [''] * 3 + \
             ['Oct']
        writer.writerow(r2)
        
        # Header Row 3: Task Code, Task Name, Weeks
        r3 = ['Task Code', 'Task Name'] + [f'W{w}' for w in range(1, 41)]
        writer.writerow(r3)
        
        # Data Rows
        for code, name, is_cat, start_w, end_w in TASKS:
            row_data = [code, name]
            for w in range(1, 41):
                if start_w <= w <= end_w:
                    row_data.append('■' if not is_cat else '▲')
                else:
                    row_data.append('')
            writer.writerow(row_data)

def sync_daily_archive_sheet(wb):
    """Keep Daily Gantt Chart (Archive) completely synchronized with canonical WBSD names,

    headers, and daily duration bars for tasks 2.1 and 2.2."""
    if 'Daily Gantt Chart (Archive)' not in wb.sheetnames:
        return
    
    daily_ws = wb['Daily Gantt Chart (Archive)']

    # 1. Update all task titles to exact WBSD strings
    daily_name_map = {
        6: '1.0.3 UI/UX Design & Prototyping',
        24: '1.4 Applications and Lease Management',
        31: '1.5 Property and Unit Management',
        34: '1.5.3 Modular Floor Planner',
        35: '1.5.4 Grid Snapping and Layout Tools',
        36: '1.5.5 Unit Listing Wizard',
        47: '1.7 Maintenance, Messaging, and AI',
        62: '1.9 Testing and Deployment',
        66: '1.9.4 Documentation and Final Submission',
        67: '2.1 System Operations & Configuration',
        68: '2.1.1 Offline Mode',
        69: '2.1.2 Turnkey Onboarding & Workspace Setup',
        70: '2.1.3 Dynamic White-Label Branding',
        71: '2.1.4 Audit Logging',
        72: '2.2 Testing & Revisions',
        73: '2.2.1 IT Expert Testing',
        74: '2.2.2 User Acceptance Testing (UAT)',
        75: '2.2.3 System Refinement',
    }
    for r_idx, corrected_name in daily_name_map.items():
        daily_ws.cell(r_idx, 1).value = corrected_name

    # 2. Add June (Days 121–150) and July (Days 151–167) timeline columns
    # Dark Green header fill: FF375623, Subheader day number fill: FFE2EFDA
    dark_green_header = PatternFill(start_color='FF375623', end_color='FF375623', fill_type='solid')
    light_green_sub = PatternFill(start_color='FFE2EFDA', end_color='FFE2EFDA', fill_type='solid')
    header_font = Font(name='Arial Narrow', size=10, bold=True, color='FFFFFF')
    day_font = Font(name='Arial Narrow', size=8, bold=False, color='000000')

    # June: col 122 (Day 121, Jun 1) to col 151 (Day 150, Jun 30) -> 30 days
    jun_start_col = 122
    jun_end_col = 151
    for c in range(jun_start_col, jun_end_col + 1):
        cell_r1 = daily_ws.cell(1, c)
        cell_r1.fill = dark_green_header
        cell_r1.font = header_font
        cell_r1.alignment = Alignment(horizontal='center', vertical='center')
        
        day_num = c - jun_start_col + 1
        cell_r2 = daily_ws.cell(2, c)
        cell_r2.value = day_num
        cell_r2.fill = light_green_sub
        cell_r2.font = day_font
        cell_r2.alignment = Alignment(horizontal='center', vertical='center')

    daily_ws.cell(1, jun_start_col).value = datetime.datetime(2026, 6, 1, 0, 0)
    # Check if merge already exists before merging
    jun_range = f'{get_column_letter(jun_start_col)}1:{get_column_letter(jun_end_col)}1'
    if jun_range not in [str(m) for m in daily_ws.merged_cells.ranges]:
        daily_ws.merge_cells(start_row=1, start_column=jun_start_col, end_row=1, end_column=jun_end_col)

    # July: col 152 (Day 151, Jul 1) to col 168 (Day 167, Jul 17) -> 17 days
    jul_start_col = 152
    jul_end_col = 168
    for c in range(jul_start_col, jul_end_col + 1):
        cell_r1 = daily_ws.cell(1, c)
        cell_r1.fill = dark_green_header
        cell_r1.font = header_font
        cell_r1.alignment = Alignment(horizontal='center', vertical='center')
        
        day_num = c - jul_start_col + 1
        cell_r2 = daily_ws.cell(2, c)
        cell_r2.value = day_num
        cell_r2.fill = light_green_sub
        cell_r2.font = day_font
        cell_r2.alignment = Alignment(horizontal='center', vertical='center')

    daily_ws.cell(1, jul_start_col).value = datetime.datetime(2026, 7, 1, 0, 0)
    jul_range = f'{get_column_letter(jul_start_col)}1:{get_column_letter(jul_end_col)}1'
    if jul_range not in [str(m) for m in daily_ws.merged_cells.ranges]:
        daily_ws.merge_cells(start_row=1, start_column=jul_start_col, end_row=1, end_column=jul_end_col)

    # Set column widths for new columns
    for c in range(jun_start_col, jul_end_col + 1):
        daily_ws.column_dimensions[get_column_letter(c)].width = 2.4

    # 3. Add timeline bars for rows 67 to 75 matching exact WBSD durations:
    # 2.1 Category: Jun 1 to Jun 29 (Days 121–149 -> cols 122–150)
    # 2.1.1 Offline Mode: 4d -> Jun 1 to Jun 4 (cols 122–125)
    # 2.1.2 Turnkey Onboarding: 10d -> Jun 5 to Jun 14 (cols 126–135)
    # 2.1.3 Dynamic White-Label Branding: 8d -> Jun 15 to Jun 22 (cols 136–143)
    # 2.1.4 Audit Logging: 7d -> Jun 23 to Jun 29 (cols 144–150)
    # 2.2 Category: Jun 30 to Jul 16 (Days 150–166 -> cols 151–167)
    # 2.2.1 IT Expert Testing: 5d -> Jun 30 to Jul 4 (cols 151–155)
    # 2.2.2 UAT: 7d -> Jul 5 to Jul 11 (cols 156–162)
    # 2.2.3 System Refinement: 5d -> Jul 12 to Jul 16 (cols 163–167)
    cat_bar_fill = PatternFill(start_color='FF4E7D3A', end_color='FF4E7D3A', fill_type='solid')
    task_bar_fill = PatternFill(start_color='FFC6EFCE', end_color='FFC6EFCE', fill_type='solid')
    white_fill = PatternFill(start_color='FFFFFFFF', end_color='FFFFFFFF', fill_type='solid')

    daily_bars = [
        (67, True, 122, 150),
        (68, False, 122, 125),
        (69, False, 126, 135),
        (70, False, 136, 143),
        (71, False, 144, 150),
        (72, True, 151, 167),
        (73, False, 151, 155),
        (74, False, 156, 162),
        (75, False, 163, 167),
    ]

    for r_idx, is_c, start_col, end_col in daily_bars:
        for c in range(2, jul_end_col + 1):
            cell = daily_ws.cell(r_idx, c)
            if start_col <= c <= end_col:
                cell.fill = cat_bar_fill if is_c else task_bar_fill
            else:
                cell.fill = white_fill

    # Style row headers for rows 67–75
    cat_row_fill = PatternFill(start_color='FF375623', end_color='FF375623', fill_type='solid')
    cat_text_font = Font(name='Arial Narrow', size=10, bold=True, color='FFFFFF')
    task_text_font = Font(name='Arial Narrow', size=9, bold=False)

    for r_idx, is_c, _, _ in daily_bars:
        c1 = daily_ws.cell(r_idx, 1)
        if is_c:
            c1.fill = cat_row_fill
            c1.font = cat_text_font
        else:
            c1.font = task_text_font

    # Prune any empty rows beyond 75 and empty columns beyond 168
    if daily_ws.max_row > 75:
        daily_ws.delete_rows(76, daily_ws.max_row - 75)
    if daily_ws.max_column > jul_end_col:
        daily_ws.delete_cols(jul_end_col + 1, daily_ws.max_column - jul_end_col)

def render_png(tasks, quarters, months):
    png_path = 'docs/iReside - GanttChart_Weekly.png'
    
    col_w_code = 80
    col_w_name = 280
    col_w_week = 28
    num_weeks = 40
    width = col_w_code + col_w_name + num_weeks * col_w_week  # 1480 px

    h_r1 = 30
    h_r2 = 24
    h_r3 = 24
    header_h = h_r1 + h_r2 + h_r3  # 78 px

    row_heights = [22 if is_cat else 20 for _, _, is_cat, _, _ in tasks]
    height = header_h + sum(row_heights)  # 1562 px

    img = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Fonts with fallbacks
    font_paths_bold = ['C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf']
    font_paths_reg = ['C:/Windows/Fonts/segoui.ttf', 'C:/Windows/Fonts/arial.ttf']

    def load_font(paths, size, default_bold=False):
        for p in paths:
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except Exception:
                    pass
        return ImageFont.load_default()

    font_q = load_font(font_paths_bold, 11)
    font_m = load_font(font_paths_bold, 10)
    font_w = load_font(font_paths_bold, 9)
    font_cat = load_font(font_paths_bold, 10)
    font_code = load_font(font_paths_reg, 9)
    font_name = load_font(font_paths_reg, 9)

    border_header_rgb = hex_to_rgb(HEADER_BORDER_COLOR)
    border_cell_rgb = hex_to_rgb(BORDER_GRAY)

    # Draw Row 1: Top-left header & Quarters
    draw.rectangle([0, 0, col_w_code + col_w_name, h_r1], fill=hex_to_rgb(DARK_GREEN_HEADER))
    draw.line([(0, 0), (col_w_code + col_w_name, 0)], fill=border_header_rgb)
    draw.line([(0, h_r1), (col_w_code + col_w_name, h_r1)], fill=border_header_rgb)
    draw.line([(col_w_code + col_w_name, 0), (col_w_code + col_w_name, h_r1)], fill=border_header_rgb)

    for start_c, end_c, title, bg_hex, fg_hex in quarters:
        w_start = start_c - 2  # 1-based week
        w_end = end_c - 2
        x1 = col_w_code + col_w_name + (w_start - 1) * col_w_week
        x2 = col_w_code + col_w_name + w_end * col_w_week
        draw.rectangle([x1, 0, x2, h_r1], fill=hex_to_rgb(bg_hex))
        draw.rectangle([x1, 0, x2, h_r1], outline=border_header_rgb)
        
        bbox = draw.textbbox((0, 0), title, font=font_q)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = x1 + (x2 - x1 - tw) // 2
        ty = (h_r1 - th) // 2 - 1
        draw.text((tx, ty), title, fill=hex_to_rgb(fg_hex), font=font_q)

    # Draw Row 2: Months
    draw.rectangle([0, h_r1, col_w_code + col_w_name, h_r1 + h_r2], fill=hex_to_rgb(DARK_GREEN_HEADER))
    draw.line([(col_w_code + col_w_name, h_r1), (col_w_code + col_w_name, h_r1 + h_r2)], fill=border_header_rgb)
    draw.line([(0, h_r1 + h_r2), (col_w_code + col_w_name, h_r1 + h_r2)], fill=border_header_rgb)

    for start_c, end_c, title, bg_hex, fg_hex in months:
        w_start = start_c - 2
        w_end = end_c - 2
        x1 = col_w_code + col_w_name + (w_start - 1) * col_w_week
        x2 = col_w_code + col_w_name + w_end * col_w_week
        draw.rectangle([x1, h_r1, x2, h_r1 + h_r2], fill=hex_to_rgb(bg_hex))
        draw.rectangle([x1, h_r1, x2, h_r1 + h_r2], outline=border_header_rgb)
        
        bbox = draw.textbbox((0, 0), title, font=font_m)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = x1 + (x2 - x1 - tw) // 2
        ty = h_r1 + (h_r2 - th) // 2 - 1
        draw.text((tx, ty), title, fill=hex_to_rgb(fg_hex), font=font_m)

    # Draw Row 3: Task Code, Task Name, Weeks
    y_r3 = h_r1 + h_r2
    # Task Code header
    draw.rectangle([0, y_r3, col_w_code, y_r3 + h_r3], fill=hex_to_rgb(DARK_GREEN_HEADER), outline=border_header_rgb)
    bbox = draw.textbbox((0, 0), 'Task Code', font=font_m)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((col_w_code - tw) // 2, y_r3 + (h_r3 - th) // 2 - 1), 'Task Code', fill=hex_to_rgb(WHITE_TEXT), font=font_m)

    # Task Name header
    draw.rectangle([col_w_code, y_r3, col_w_code + col_w_name, y_r3 + h_r3], fill=hex_to_rgb(DARK_GREEN_HEADER), outline=border_header_rgb)
    bbox = draw.textbbox((0, 0), 'Task Name', font=font_m)
    th = bbox[3] - bbox[1]
    draw.text((col_w_code + 12, y_r3 + (h_r3 - th) // 2 - 1), 'Task Name', fill=hex_to_rgb(WHITE_TEXT), font=font_m)

    # W1 to W40 headers
    for w in range(1, num_weeks + 1):
        x1 = col_w_code + col_w_name + (w - 1) * col_w_week
        x2 = x1 + col_w_week
        bg_hex = WEEK_LIGHT_GREEN_BG
        fg_hex = WEEK_DARK_GREEN_TEXT
        draw.rectangle([x1, y_r3, x2, y_r3 + h_r3], fill=hex_to_rgb(bg_hex), outline=border_header_rgb)
        
        w_title = f'W{w}'
        bbox = draw.textbbox((0, 0), w_title, font=font_w)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text((x1 + (col_w_week - tw) // 2, y_r3 + (h_r3 - th) // 2 - 1), w_title, fill=hex_to_rgb(fg_hex), font=font_w)

    # Draw Data Rows
    current_y = header_h
    for row_idx, (code, name, is_cat, start_w, end_w) in enumerate(tasks):
        r_height = 22 if is_cat else 20
        y1 = current_y
        y2 = y1 + r_height

        if is_cat:
            cat_bg = hex_to_rgb(CATEGORY_ROW_BG)
            # Code cell
            draw.rectangle([0, y1, col_w_code, y2], fill=cat_bg, outline=border_cell_rgb)
            bbox = draw.textbbox((0, 0), code, font=font_cat)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            draw.text(((col_w_code - tw) // 2, y1 + (r_height - th) // 2 - 1), code, fill=hex_to_rgb(WHITE_TEXT), font=font_cat)

            # Name cell
            draw.rectangle([col_w_code, y1, col_w_code + col_w_name, y2], fill=cat_bg, outline=border_cell_rgb)
            bbox = draw.textbbox((0, 0), name, font=font_cat)
            th = bbox[3] - bbox[1]
            draw.text((col_w_code + 8, y1 + (r_height - th) // 2 - 1), name, fill=hex_to_rgb(WHITE_TEXT), font=font_cat)

            # Week cells
            for w in range(1, num_weeks + 1):
                wx1 = col_w_code + col_w_name + (w - 1) * col_w_week
                wx2 = wx1 + col_w_week
                cell_fill = hex_to_rgb(CATEGORY_BAR_FILL) if (start_w <= w <= end_w) else hex_to_rgb('F2F5F0')
                draw.rectangle([wx1, y1, wx2, y2], fill=cell_fill, outline=border_cell_rgb)
        else:
            zebra_hex = 'FFFFFF' if (row_idx % 2 == 0) else 'F8FAF8'
            zebra_rgb = hex_to_rgb(zebra_hex)
            
            # Code cell
            draw.rectangle([0, y1, col_w_code, y2], fill=zebra_rgb, outline=border_cell_rgb)
            bbox = draw.textbbox((0, 0), code, font=font_code)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            draw.text(((col_w_code - tw) // 2, y1 + (r_height - th) // 2 - 1), code, fill=hex_to_rgb(MUTED_TEXT), font=font_code)

            # Name cell
            draw.rectangle([col_w_code, y1, col_w_code + col_w_name, y2], fill=zebra_rgb, outline=border_cell_rgb)
            bbox = draw.textbbox((0, 0), name, font=font_name)
            th = bbox[3] - bbox[1]
            draw.text((col_w_code + 14, y1 + (r_height - th) // 2 - 1), name, fill=hex_to_rgb(DARK_TEXT), font=font_name)

            # Week cells
            for w in range(1, num_weeks + 1):
                wx1 = col_w_code + col_w_name + (w - 1) * col_w_week
                wx2 = wx1 + col_w_week
                cell_fill = hex_to_rgb(TASK_BAR_FILL) if (start_w <= w <= end_w) else zebra_rgb
                draw.rectangle([wx1, y1, wx2, y2], fill=cell_fill, outline=border_cell_rgb)

        current_y += r_height

    img.save(png_path)
    print(f'Successfully rendered high-res Gantt Chart preview: {png_path} ({width}x{height})')

if __name__ == '__main__':
    build_gantt()
