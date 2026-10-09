"""
iReside UML Use Case Diagram generator.

Writes docs/iReside-UseCase.svg and docs/iReside-UseCase.drawio from one
declarative spec. Actors and use cases follow the DFD Level-1 processes
(P1.0 - P9.0) and the entities in the core ERD; actors are Tenant and
Landlord only (specialisations of User for shared use cases).

Run:  python scripts/erd/generate_usecase.py
"""
from __future__ import annotations

import os
from xml.sax.saxutils import escape

FONT = "Segoe UI, Helvetica Neue, Arial, sans-serif"
INK = "#1f2937"
LINE = "#374151"
MUTED = "#6b7280"
WHITE = "#ffffff"
PKG_FILL = "#f8fafc"
UC_FILL = "#ffffff"
TINT = {  # package header tints, same family as the ERD
    "account": "#e8edf5", "property": "#e6f1e8", "intake": "#fdf1dc",
    "lease": "#fdf1dc", "billing": "#f6e8ee", "maint": "#f6e8ee", "community": "#ebe6f5",
}

# ---------------------------------------------------------------------------
# Geometry
# ---------------------------------------------------------------------------
UC_W, UC_H = 212, 54
UC_GAP = 16
PKG_PAD_X = 40
PKG_TAB_H = 28
PKG_PAD_TOP = PKG_TAB_H + 18
PKG_PAD_BOT = 22
PKG_GAP = 26

BOUND_X, BOUND_W = 300, 1520
BOUND_Y = 215
MID_GAP = 300          # gap between tenant and landlord columns
TITLE_Y = 44

ACTOR_T_X = 120           # Tenant
ACTOR_L_X = BOUND_X + BOUND_W + 180   # Landlord
ACTOR_U_X = BOUND_X + BOUND_W / 2     # User (generalisation)
ACTOR_U_Y = 130

SHARED_LEFT_CX = BOUND_X + PKG_PAD_X + 40 + UC_W / 2
SHARED_RIGHT_CX = BOUND_X + BOUND_W - PKG_PAD_X - 40 - UC_W / 2
PKG2_W = 2 * UC_W + 2 * 40 + MID_GAP
PKG2_X = BOUND_X + (BOUND_W - PKG2_W) / 2
LEFT_CX = PKG2_X + 40 + UC_W / 2
RIGHT_CX = PKG2_X + PKG2_W - 40 - UC_W / 2

# ---------------------------------------------------------------------------
# Spec
# ---------------------------------------------------------------------------
# Shared row (connected to User)
SHARED_PKG = ("P1.0 / P8.0 / P9.0  Account, Authentication & Communication", "account")
SHARED = [
    ("uc_login", "Register / Log In"),
    ("uc_otp", "Verify Two-Factor\nOTP Code"),
    ("uc_profile", "Manage Profile &\nSecurity Settings"),
    ("uc_message", "Send & Receive\nMessages"),
    ("uc_post", "Post to Community\nFeed"),
    ("uc_notif", "Receive In-App\nNotifications"),
]

# Two-column packages: (title, tint, tenant use cases, landlord use cases)
PACKAGES = [
    ("P2.0 / P3.0  Property, Unit & Blueprint Management", "property",
     [("uc_browse", "Browse Available\nUnits & Policies"), ("uc_viewmap", "View Interactive\nUnit Map")],
     [("uc_manageprop", "Manage Properties\n& Units"), ("uc_layout", "Design Floor Layout\n(Blueprint)")]),
    ("P4.0  Rental Application & Intake", "intake",
     [("uc_apply", "Submit Rental\nApplication")],
     [("uc_invite", "Issue Tenant Intake\nInvite"), ("uc_review", "Review & Decide\nApplication")]),
    ("P5.0  Lease & Tenancy Management", "lease",
     [("uc_sign", "Sign Lease\nDigitally"), ("uc_renew", "Request Lease\nRenewal"), ("uc_moveout", "Request\nMove-Out")],
     [("uc_lease", "Create & Issue\nLease Contract"), ("uc_countersign", "Countersign\nLease"),
      ("uc_processmo", "Process Move-Out\n& Deposit Refund")]),
    ("P6.0  Billing, Payments & Expenses", "billing",
     [("uc_pay", "Pay Rent / Submit\nPayment Proof"), ("uc_viewinv", "View Invoices\n& Receipts")],
     [("uc_invoice", "Generate Monthly\nInvoice"), ("uc_utility", "Record Utility\nMeter Readings"),
      ("uc_confirm", "Confirm Payment &\nIssue Receipt"), ("uc_expense", "Record Property\nExpenses")]),
    ("P7.0  Maintenance & Incident Handling", "maint",
     [("uc_maint", "Submit Maintenance\nRequest")],
     [("uc_triage", "Triage & Resolve\nMaintenance Request")]),
    ("P9.0  Community & Amenity Services", "community",
     [("uc_book", "Book Shared\nAmenity")],
     [("uc_amenity", "Manage Amenities\n& Bookings")]),
]

# «extend» / «include» relationships (from -> to)
EXTENDS = [
    ("uc_otp", "uc_login"),        # OTP challenge extends login when 2FA is enabled
    ("uc_utility", "uc_invoice"),  # utility charges extend the invoice when metered
    ("uc_countersign", "uc_sign"),  # handled as same-column? no -> cross column, drawn separately
]
INCLUDES = [
    ("uc_confirm", "uc_notif_dummy"),  # placeholder, replaced below
]
INCLUDES = []  # keep the diagram focused; includes would duplicate DFD flows

# ---------------------------------------------------------------------------
# Layout computation
# ---------------------------------------------------------------------------
UC: dict[str, dict] = {}   # id -> {label, cx, cy}
PKGS: list[dict] = []      # {title, tint, x, y, w, h}

y = BOUND_Y + 50
# shared package (single horizontal row)
n = len(SHARED)
span = SHARED_RIGHT_CX - SHARED_LEFT_CX
step = span / (n - 1)
pkg_h = PKG_PAD_TOP + UC_H + PKG_PAD_BOT
PKGS.append(dict(title=SHARED_PKG[0], tint=SHARED_PKG[1], x=BOUND_X + PKG_PAD_X, y=y,
                 w=BOUND_W - 2 * PKG_PAD_X, h=pkg_h))
for i, (uid, label) in enumerate(SHARED):
    UC[uid] = dict(label=label, cx=SHARED_LEFT_CX + step * i, cy=y + PKG_PAD_TOP + UC_H / 2)
y += pkg_h + PKG_GAP

for title, tint, tenant, landlord in PACKAGES:
    rows = max(len(tenant), len(landlord))
    pkg_h = PKG_PAD_TOP + rows * UC_H + (rows - 1) * UC_GAP + PKG_PAD_BOT
    PKGS.append(dict(title=title, tint=tint, x=PKG2_X, y=y, w=PKG2_W, h=pkg_h))
    for col, cx in ((tenant, LEFT_CX), (landlord, RIGHT_CX)):
        # vertically centre shorter columns
        off = (rows - len(col)) * (UC_H + UC_GAP) / 2
        for i, (uid, label) in enumerate(col):
            UC[uid] = dict(label=label, cx=cx, cy=y + PKG_PAD_TOP + off + i * (UC_H + UC_GAP) + UC_H / 2)
    y += pkg_h + PKG_GAP

BOUND_H = y - PKG_GAP + 40 - BOUND_Y
TOTAL_W = ACTOR_L_X + 160
TOTAL_H = BOUND_Y + BOUND_H + 150   # room for legend

TENANT_IDS = [u for _, _, t, _ in PACKAGES for u, _ in t]
LANDLORD_IDS = [u for _, _, _, l in PACKAGES for u, _ in l]
mid_y = (UC[TENANT_IDS[0]]["cy"] + UC[TENANT_IDS[-1]]["cy"]) / 2
ACTOR_T_Y = mid_y
ACTOR_L_Y = mid_y

# ---------------------------------------------------------------------------
# SVG
# ---------------------------------------------------------------------------
out: list[str] = []


def esc(s): return escape(s)


def actor_svg(x, y, name, label_side=False):
    """Stick figure centred at (x, y) where y is the vertical centre of the figure."""
    s = f'stroke="{INK}" stroke-width="1.6" fill="none"'
    hy = y - 30
    out.append(f'<circle cx="{x}" cy="{hy}" r="9" {s} fill="{WHITE}"/>')
    out.append(f'<path d="M{x},{hy + 9} L{x},{y + 10} M{x - 16},{y - 10} L{x + 16},{y - 10} '
               f'M{x},{y + 10} L{x - 14},{y + 32} M{x},{y + 10} L{x + 14},{y + 32}" {s}/>')
    if label_side:
        out.append(f'<text x="{x + 26}" y="{y - 24}" text-anchor="start" font-family="{FONT}" font-size="14" '
                   f'font-weight="700" fill="{INK}">{esc(name)}</text>')
    else:
        out.append(f'<text x="{x}" y="{y + 52}" text-anchor="middle" font-family="{FONT}" font-size="14" '
                   f'font-weight="700" fill="{INK}">{esc(name)}</text>')


def uc_svg(u):
    cx, cy = u["cx"], u["cy"]
    out.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{UC_W / 2}" ry="{UC_H / 2}" fill="{UC_FILL}" '
               f'stroke="{INK}" stroke-width="1.3"/>')
    lines = u["label"].split("\n")
    y0 = cy - (len(lines) - 1) * 7.5 + 4.5
    for i, ln in enumerate(lines):
        out.append(f'<text x="{cx}" y="{y0 + i * 15}" text-anchor="middle" font-family="{FONT}" '
                   f'font-size="12" fill="{INK}">{esc(ln)}</text>')


def pkg_svg(p):
    x, y, w, h = p["x"], p["y"], p["w"], p["h"]
    tab_w = min(w, 11 + 7.2 * len(p["title"]))
    out.append(f'<path d="M{x},{y} h{tab_w} v{PKG_TAB_H} h{w - tab_w} v{h - PKG_TAB_H} h{-w} Z" '
               f'fill="{PKG_FILL}" stroke="{MUTED}" stroke-width="1.1"/>')
    out.append(f'<rect x="{x}" y="{y}" width="{tab_w}" height="{PKG_TAB_H}" fill="{TINT[p["tint"]]}" '
               f'stroke="{MUTED}" stroke-width="1.1"/>')
    out.append(f'<text x="{x + 10}" y="{y + 19}" font-family="{FONT}" font-size="12" font-weight="700" '
               f'fill="{INK}">{esc(p["title"])}</text>')


def line(x1, y1, x2, y2, dashed=False, arrow=None):
    d = ' stroke-dasharray="6 4"' if dashed else ""
    m = f' marker-end="url(#{arrow})"' if arrow else ""
    out.append(f'<path d="M{x1:.1f},{y1:.1f} L{x2:.1f},{y2:.1f}" stroke="{LINE}" stroke-width="1.3"{d}{m}/>')


def ellipse_edge_point(u, towards_x, towards_y):
    """Point on the ellipse boundary of use case u in the direction of (towards)."""
    import math
    cx, cy = u["cx"], u["cy"]
    dx, dy = towards_x - cx, towards_y - cy
    a, b = UC_W / 2, UC_H / 2
    t = math.atan2(dy / b, dx / a)
    return cx + a * math.cos(t), cy + b * math.sin(t)


def anchor_pt(uid, side):
    u = UC[uid]
    if side == "L":
        return u["cx"] - UC_W / 2, u["cy"]
    if side == "R":
        return u["cx"] + UC_W / 2, u["cy"]
    return u["cx"], u["cy"] - UC_H / 2   # top


def assoc(ax, ay, uid, side):
    ex, ey = anchor_pt(uid, side)
    line(ax, ay, ex, ey)


def extend_svg(frm, to):
    a, b = UC[frm], UC[to]
    p1 = ellipse_edge_point(a, b["cx"], b["cy"])
    p2 = ellipse_edge_point(b, a["cx"], a["cy"])
    line(*p1, *p2, dashed=True, arrow="open")
    mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
    vertical = abs(p1[0] - p2[0]) < 1
    tx = mx + (12 if vertical else 0)
    ty = (a["cy"] - UC_H / 2 - 8) if not vertical else my + 4
    anchor = "start" if vertical else "middle"
    out.append(f'<text x="{tx:.1f}" y="{ty:.1f}" text-anchor="{anchor}" font-family="{FONT}" font-size="11" '
               f'font-style="italic" fill="{INK}">«extend»</text>')


def legend_svg():
    lx, ly = BOUND_X, BOUND_Y + BOUND_H + 30
    lw, lh = 760, 96
    out.append(f'<rect x="{lx}" y="{ly}" width="{lw}" height="{lh}" fill="#fafafa" stroke="{INK}" stroke-width="1"/>')
    out.append(f'<text x="{lx + 14}" y="{ly + 22}" font-family="{FONT}" font-size="13" font-weight="700" '
               f'fill="{INK}">Legend (UML 2.5 Use Case Diagram)</text>')
    rows = [
        ("assoc", "Association: actor participates in use case"),
        ("ext", "«extend»: optional behaviour inserted at an extension point"),
        ("gen", "Generalisation: Tenant and Landlord are specialisations of User"),
    ]
    for i, (k, label) in enumerate(rows):
        yy = ly + 46 + i * 20
        x0 = lx + 18
        if k == "assoc":
            line(x0, yy, x0 + 60, yy)
        elif k == "ext":
            line(x0, yy, x0 + 60, yy, dashed=True, arrow="open")
        else:
            line(x0, yy, x0 + 60, yy, arrow="tri")
        out.append(f'<text x="{x0 + 74}" y="{yy + 4}" font-family="{FONT}" font-size="11.5" fill="{INK}">{esc(label)}</text>')
    out.append(f'<text x="{lx + 400}" y="{ly + 50}" font-family="{FONT}" font-size="11.5" fill="{INK}">'
               f'Packages correspond to DFD Level-1 processes P1.0–P9.0.</text>')
    out.append(f'<text x="{lx + 400}" y="{ly + 70}" font-family="{FONT}" font-size="11.5" fill="{INK}">'
               f'Shared use cases (top row) are inherited by both actors via User.</text>')


def render_svg() -> str:
    out.clear()
    out.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{TOTAL_W:.0f}" height="{TOTAL_H:.0f}" '
               f'viewBox="0 0 {TOTAL_W:.0f} {TOTAL_H:.0f}" font-family="{FONT}">')
    out.append('<defs>'
               f'<marker id="open" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">'
               f'<path d="M1,1 L11,6 L1,11" fill="none" stroke="{LINE}" stroke-width="1.3"/></marker>'
               f'<marker id="tri" markerWidth="14" markerHeight="14" refX="13" refY="7" orient="auto" markerUnits="userSpaceOnUse">'
               f'<path d="M1,1 L13,7 L1,13 Z" fill="{WHITE}" stroke="{LINE}" stroke-width="1.3"/></marker>'
               '</defs>')
    out.append(f'<rect width="100%" height="100%" fill="{WHITE}"/>')
    out.append(f'<text x="{TOTAL_W / 2}" y="{TITLE_Y}" text-anchor="middle" font-family="{FONT}" font-size="22" '
               f'font-weight="700" fill="{INK}">iReside — UML Use Case Diagram</text>')
    out.append(f'<text x="{TOTAL_W / 2}" y="{TITLE_Y + 22}" text-anchor="middle" font-family="{FONT}" font-size="12.5" '
               f'fill="{MUTED}">Tenant and Landlord interactions grouped by the nine DFD Level-1 processes</text>')

    # system boundary
    out.append(f'<rect x="{BOUND_X}" y="{BOUND_Y}" width="{BOUND_W}" height="{BOUND_H:.0f}" fill="{WHITE}" '
               f'stroke="{INK}" stroke-width="1.6"/>')
    out.append(f'<text x="{BOUND_X + BOUND_W / 2}" y="{BOUND_Y + 30}" text-anchor="middle" font-family="{FONT}" '
               f'font-size="15" font-weight="700" fill="{INK}">iReside Property Management System</text>')

    for p in PKGS:
        pkg_svg(p)

    # generalisation: Tenant/Landlord -> User (orthogonal, outside the boundary)
    gy = ACTOR_U_Y + 2
    for ax, ay in ((ACTOR_T_X, ACTOR_T_Y), (ACTOR_L_X, ACTOR_L_Y)):
        out.append(f'<path d="M{ax},{ay - 40} L{ax},{gy} L{ACTOR_U_X + (-26 if ax < ACTOR_U_X else 26)},{gy}" '
                   f'stroke="{LINE}" stroke-width="1.3" fill="none" marker-end="url(#tri)"/>')

    # associations
    for uid, _ in SHARED:
        assoc(ACTOR_U_X, ACTOR_U_Y + 32, uid, "T")
    for uid in TENANT_IDS:
        assoc(ACTOR_T_X + 18, ACTOR_T_Y, uid, "L")
    for uid in LANDLORD_IDS:
        assoc(ACTOR_L_X - 18, ACTOR_L_Y, uid, "R")

    for frm, to in EXTENDS:
        if frm == "uc_countersign":
            continue  # cross-column; omitted to keep the layout clean (described in notes)
        extend_svg(frm, to)

    for u in UC.values():
        uc_svg(u)

    actor_svg(ACTOR_U_X, ACTOR_U_Y, "User", label_side=True)
    actor_svg(ACTOR_T_X, ACTOR_T_Y, "Tenant")
    actor_svg(ACTOR_L_X, ACTOR_L_Y, "Landlord")
    legend_svg()
    out.append("</svg>")
    return "\n".join(out)


# ---------------------------------------------------------------------------
# draw.io
# ---------------------------------------------------------------------------
def render_drawio() -> str:
    cells: list[str] = []
    k = [10]

    def nid():
        k[0] += 1
        return f"n{k[0]}"

    def a(s): return escape(s, {'"': "&quot;"})

    def vertex(cid, value, style, x, y, w, h):
        cells.append(f'<mxCell id="{cid}" value="{a(value)}" style="{style}" vertex="1" parent="1">'
                     f'<mxGeometry x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" as="geometry"/></mxCell>')

    def edge(src, tgt, style, value="", points=(), label_offset=None):
        pts = "".join(f'<mxPoint x="{x:.0f}" y="{y:.0f}"/>' for x, y in points)
        arr = f'<Array as="points">{pts}</Array>' if pts else ""
        if label_offset:
            arr += f'<mxPoint as="offset" x="{label_offset[0]}" y="{label_offset[1]}"/>'
        cells.append(f'<mxCell id="{nid()}" value="{a(value)}" style="{style}" edge="1" parent="1" '
                     f'source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry">{arr}</mxGeometry></mxCell>')

    vertex(nid(), "<b>iReside — UML Use Case Diagram</b>",
           f"text;html=1;align=center;fontSize=22;fontFamily=Segoe UI;fontColor={INK};", 0, TITLE_Y - 24, TOTAL_W, 30)
    vertex(nid(), "Tenant and Landlord interactions grouped by the nine DFD Level-1 processes",
           f"text;html=1;align=center;fontSize=12.5;fontFamily=Segoe UI;fontColor={MUTED};", 0, TITLE_Y + 6, TOTAL_W, 20)
    vertex("boundary", "iReside Property Management System",
           f"rounded=0;whiteSpace=wrap;html=1;fillColor={WHITE};strokeColor={INK};strokeWidth=1.6;"
           f"verticalAlign=top;spacingTop=8;fontSize=15;fontStyle=1;fontFamily=Segoe UI;fontColor={INK};",
           BOUND_X, BOUND_Y, BOUND_W, BOUND_H)
    for i, p in enumerate(PKGS):
        tab_w = min(p["w"], 11 + 7.2 * len(p["title"]))
        vertex(f"pkg{i}", "",
               f"shape=folder;tabWidth={tab_w:.0f};tabHeight={PKG_TAB_H};tabPosition=left;html=1;"
               f"fillColor={PKG_FILL};strokeColor={MUTED};",
               p["x"], p["y"], p["w"], p["h"])
        vertex(f"pkgtab{i}", p["title"],
               f"rounded=0;html=1;whiteSpace=wrap;align=left;verticalAlign=middle;spacingLeft=6;fontStyle=1;"
               f"fontSize=12;fontFamily=Segoe UI;fillColor={TINT[p['tint']]};strokeColor={MUTED};fontColor={INK};",
               p["x"], p["y"], tab_w, PKG_TAB_H)
    for uid, u in UC.items():
        vertex(uid, u["label"].replace("\n", "<br>"),
               f"ellipse;whiteSpace=wrap;html=1;fillColor={UC_FILL};strokeColor={INK};strokeWidth=1.3;"
               f"fontSize=12;fontFamily=Segoe UI;fontColor={INK};",
               u["cx"] - UC_W / 2, u["cy"] - UC_H / 2, UC_W, UC_H)
    actor_style = (f"shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;"
                   f"strokeColor={INK};strokeWidth=1.6;fillColor={WHITE};fontSize=14;fontStyle=1;fontFamily=Segoe UI;fontColor={INK};")
    for cid, name, x, y in (("actTenant", "Tenant", ACTOR_T_X, ACTOR_T_Y), ("actLandlord", "Landlord", ACTOR_L_X, ACTOR_L_Y)):
        vertex(cid, name, actor_style, x - 18, y - 40, 36, 72)
    vertex("actUser", "User", actor_style.replace("verticalLabelPosition=bottom;verticalAlign=top;",
           "labelPosition=right;verticalLabelPosition=middle;align=left;verticalAlign=middle;"),
           ACTOR_U_X - 18, ACTOR_U_Y - 40, 36, 72)

    assoc_style = f"endArrow=none;html=1;strokeColor={LINE};strokeWidth=1.3;edgeStyle=none;"
    for uid, _ in SHARED:
        edge("actUser", uid, assoc_style + "exitX=0.5;exitY=1;entryX=0.5;entryY=0;")
    for uid in TENANT_IDS:
        edge("actTenant", uid, assoc_style + "exitX=1;exitY=0.5;entryX=0;entryY=0.5;")
    for uid in LANDLORD_IDS:
        edge("actLandlord", uid, assoc_style + "exitX=0;exitY=0.5;entryX=1;entryY=0.5;")
    ext_style = (f"endArrow=open;endFill=0;dashed=1;html=1;strokeColor={LINE};strokeWidth=1.3;edgeStyle=none;"
                 f"fontSize=11;fontStyle=2;fontFamily=Segoe UI;fontColor={INK};")
    for frm, to in EXTENDS:
        if frm == "uc_countersign":
            continue
        horizontal = abs(UC[frm]["cy"] - UC[to]["cy"]) < 1
        edge(frm, to, ext_style, "«extend»", label_offset=(0, -26) if horizontal else (34, 0))
    gen_style = (f"endArrow=block;endFill=0;endSize=10;html=1;strokeColor={LINE};strokeWidth=1.3;"
                 f"edgeStyle=orthogonalEdgeStyle;exitX=0.5;exitY=0;entryX={{ex}};entryY=0.5;")
    gy = ACTOR_U_Y + 2
    edge("actTenant", "actUser", gen_style.format(ex=0), points=[(ACTOR_T_X, gy)])
    edge("actLandlord", "actUser", gen_style.format(ex=1), points=[(ACTOR_L_X, gy)])

    # legend
    lx, ly = BOUND_X, BOUND_Y + BOUND_H + 30
    vertex(nid(), "", f"rounded=0;html=1;fillColor=#fafafa;strokeColor={INK};", lx, ly, 760, 96)
    vertex(nid(), "<b>Legend (UML 2.5 Use Case Diagram)</b>", f"text;html=1;fontSize=13;fontFamily=Segoe UI;fontColor={INK};",
           lx + 8, ly + 4, 400, 22)
    rows = [(assoc_style, "", "Association: actor participates in use case"),
            (ext_style, "", "«extend»: optional behaviour inserted at an extension point"),
            (f"endArrow=block;endFill=0;endSize=10;html=1;strokeColor={LINE};strokeWidth=1.3;edgeStyle=none;", "",
             "Generalisation: Tenant and Landlord are specialisations of User")]
    for i, (st, _, label) in enumerate(rows):
        yy = ly + 46 + i * 20
        p1, p2 = nid(), nid()
        for cid, xx in ((p1, lx + 18), (p2, lx + 78)):
            vertex(cid, "", "shape=ellipse;strokeColor=none;fillColor=none;", xx, yy, 1, 1)
        edge(p1, p2, st)
        vertex(nid(), label, f"text;html=1;fontSize=11.5;fontFamily=Segoe UI;fontColor={INK};verticalAlign=middle;",
               lx + 88, yy - 10, 330, 20)
    vertex(nid(), "Packages correspond to DFD Level-1 processes P1.0–P9.0.<br>Shared use cases (top row) are inherited by both actors via User.",
           f"text;html=1;whiteSpace=wrap;fontSize=11.5;fontFamily=Segoe UI;fontColor={INK};verticalAlign=top;",
           lx + 400, ly + 36, 350, 50)

    body = "\n".join(cells)
    return ('<mxfile host="app.diagrams.net" type="device">\n<diagram id="ireside-usecase" name="iReside Use Case Diagram">\n'
            f'<mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" '
            f'page="1" pageScale="1" pageWidth="{TOTAL_W:.0f}" pageHeight="{TOTAL_H:.0f}" math="0" shadow="0" background="#ffffff">\n'
            f'<root>\n<mxCell id="0"/>\n<mxCell id="1" parent="0"/>\n{body}\n</root>\n</mxGraphModel>\n</diagram>\n</mxfile>\n')


if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    svg = os.path.join(root, "docs", "iReside-UseCase.svg")
    dio = os.path.join(root, "docs", "iReside-UseCase.drawio")
    open(svg, "w", encoding="utf-8").write(render_svg())
    open(dio, "w", encoding="utf-8").write(render_drawio())
    print(f"wrote {svg} and {dio}  ({TOTAL_W:.0f} x {TOTAL_H:.0f}), use cases={len(UC)}")
