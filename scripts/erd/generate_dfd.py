"""
iReside Level 1 Data Flow Diagram generator (Gane & Sarson notation).

Writes docs/iReside-DFD-Level1.svg and docs/iReside-DFD-Level1.drawio from one
declarative spec (entities, ten ranked processes, logical data stores, flows).
Layout is a strict three-column design: external entities (left), ranked
processes (centre, 1.0 at the top), logical data stores (right). Every flow is
routed orthogonally through a private vertical "trunk" inside the gap between
columns; trunk order is chosen by a small search that minimises line crossings.

Run:  python scripts/erd/generate_dfd.py
Then: node scripts/erd/render_dfd_png.cjs   (PNG via Playwright)
"""
from __future__ import annotations

import itertools
import os
from xml.sax.saxutils import escape

# ---------------------------------------------------------------------------
# Visual constants
# ---------------------------------------------------------------------------
FONT = "Segoe UI, Helvetica Neue, Arial, sans-serif"
INK = "#111827"
LINE = "#374151"
MUTED = "#6b7280"
WHITE = "#ffffff"
ENTITY_FILL = "#f3f4f6"
PROCESS_FILL = "#ffffff"
STORE_FILL = "#f8fafc"
STROKE_W = 1.4
FLOW_W = 1.2
LABEL_PT = 12

# ---------------------------------------------------------------------------
# Specification (derived from the live schema and API routes, Oct 2026)
# ---------------------------------------------------------------------------
ENTITIES = [  # id, display lines, note
    ("E1", ["Landlord"], ""),
    ("E2", ["Tenant"], "(applicant / resident)"),
]

PROCESSES = [  # number, name lines (ranked, most significant first)
    ("1.0", ["Authenticate Users &", "Secure Accounts"]),
    ("2.0", ["Manage Properties", "& Units"]),
    ("3.0", ["Process Tenant", "Applications"]),
    ("4.0", ["Manage Leases", "& E-Signing"]),
    ("5.0", ["Bill Rent &", "Process Payments"]),
    ("6.0", ["Handle Maintenance", "Requests"]),
    ("7.0", ["Process Move-Out", "Requests"]),
    ("8.0", ["Deliver Messages", "& Notifications"]),
    ("9.0", ["Generate Analytics", "& Reports"]),
    ("10.0", ["Provide iRis AI", "Assistance"]),
]

STORES = [  # id, name lines
    ("D1", ["User Accounts &", "Security Settings"]),
    ("D2", ["Properties, Units &", "Floor Plans"]),
    ("D3", ["Intake Invites &", "Applications"]),
    ("D4", ["Leases, Renewals &", "Signing Audit"]),
    ("D5", ["Invoices, Payments &", "Utility Billing"]),
    ("D6", ["Maintenance Requests"]),
    ("D7", ["Move-Out Requests"]),
    ("D8", ["Conversations, Messages", "& Notifications"]),
    ("D9", ["Expenses & Report", "Exports"]),
    ("D10", ["iRis Chat History"]),
    ("D11", ["Document & Media Files", "(Storage Buckets)"]),
]

# (source, destination, label).  P<n> = process n, E = entity, D = store.
FLOWS = [
    # --- external entities <-> processes --------------------------------
    ("E1", "P1", "Registration & Login Credentials"),
    ("P1", "E1", "Session, OTP & 2FA Status"),
    ("E2", "P1", "Login / Account-Claim Credentials"),
    ("P1", "E2", "Session & Verification Status"),

    ("E1", "P2", "Property, Unit & Floor-Plan Details"),
    ("P2", "E1", "Property Portfolio & Unit Status"),

    ("E1", "P3", "Invite Links & Application Decisions"),
    ("P3", "E1", "Submitted Applications & Fee Proofs"),
    ("E2", "P3", "Application Form, Documents & Fee Proof"),
    ("P3", "E2", "Invite Details & Application Status"),

    ("E1", "P4", "Lease Terms & Landlord Signature"),
    ("P4", "E1", "Lease Status & Signed Document"),
    ("E2", "P4", "Tenant Signature & Renewal Request"),
    ("P4", "E2", "Lease Document & Renewal Decision"),

    ("E1", "P5", "Payment Confirmation & Utility Readings"),
    ("P5", "E1", "Invoice, Payment & Receipt Summary"),
    ("E2", "P5", "Payment Submission & Proof of Payment"),
    ("P5", "E2", "Invoices, Balances & Receipts"),

    ("E1", "P6", "Triage Decision & Status Update"),
    ("P6", "E1", "Triaged Maintenance Queue"),
    ("E2", "P6", "Maintenance Request & Photos"),
    ("P6", "E2", "Request Status & Resolution"),

    ("E1", "P7", "Move-Out Decision & Inspection Results"),
    ("P7", "E1", "Move-Out Requests & Checklist"),
    ("E2", "P7", "Move-Out Request & Checklist"),
    ("P7", "E2", "Move-Out Status & Deposit Settlement"),

    ("E1", "P8", "Chat Messages & Attachments"),
    ("P8", "E1", "Conversations & Notifications"),
    ("E2", "P8", "Chat Messages & Attachments"),
    ("P8", "E2", "Conversations & Notifications"),

    ("E1", "P9", "Report Parameters & Expense Entries"),
    ("P9", "E1", "Analytics Dashboard & Exported Report"),

    ("E2", "P10", "Chat Prompt"),
    ("P10", "E2", "AI Assistant Reply"),

    # --- processes <-> data stores ----------------------------------------
    ("P1", "D1", "Account, Profile & Security Settings"),
    ("D1", "P1", "Credentials, Role & 2FA Settings"),
    ("P1", "D11", "Business Permit Documents"),

    ("P2", "D2", "Property, Unit & Floor-Plan Records"),
    ("D2", "P2", "Property & Unit Records"),
    ("P2", "D11", "Property Images"),

    ("P3", "D3", "Invite, Application & Fee Records"),
    ("D3", "P3", "Invite & Application Records"),
    ("D2", "P3", "Available Unit Details"),
    ("P3", "D1", "New Tenant Account"),
    ("P3", "D11", "Applicant Documents & Fee Proof"),
    ("P3", "D8", "Application Notifications"),

    ("P4", "D4", "Lease, Signature & Audit Records"),
    ("D4", "P4", "Lease & Renewal Records"),
    ("D3", "P4", "Approved Application Details"),
    ("P4", "D2", "Unit Occupancy Status"),
    ("P4", "D11", "Signed Lease PDF"),
    ("P4", "D8", "Lease Notifications"),

    ("P5", "D5", "Invoice, Payment & Receipt Records"),
    ("D5", "P5", "Invoice, Payment & Utility Records"),
    ("D4", "P5", "Active Lease Terms"),
    ("D2", "P5", "Property Billing Defaults"),
    ("P5", "D11", "Payment Proof Images"),
    ("P5", "D8", "Billing Notifications"),

    ("P6", "D6", "Request, Triage & Status Records"),
    ("D6", "P6", "Maintenance Records"),
    ("D4", "P6", "Tenant Lease Reference"),
    ("D2", "P6", "Unit & Property Reference"),
    ("P6", "D11", "Maintenance Photos"),
    ("P6", "D8", "Maintenance Notifications"),

    ("P7", "D7", "Move-Out, Inspection & Deposit Records"),
    ("D7", "P7", "Move-Out Records"),
    ("D4", "P7", "Lease Details"),
    ("P7", "D4", "Lease Termination"),
    ("P7", "D2", "Unit Vacancy Status"),
    ("D5", "P7", "Outstanding Balances"),
    ("P7", "D8", "Move-Out Notifications"),

    ("P8", "D8", "Message, Report & Notification Records"),
    ("D8", "P8", "Conversation History & Notifications"),
    ("D1", "P8", "Participant Profiles"),
    ("P8", "D11", "Message Attachments"),

    ("D2", "P9", "Property & Unit Data"),
    ("D4", "P9", "Lease Data"),
    ("D5", "P9", "Payment & Invoice Data"),
    ("D6", "P9", "Maintenance Data"),
    ("P9", "D9", "Expense & Export Records"),
    ("D9", "P9", "Expense Records"),

    ("P10", "D10", "Chat Transcript"),
    ("D10", "P10", "Chat History"),
    ("D1", "P10", "Tenant Profile Context"),
    ("D4", "P10", "Tenant Lease Context"),
    ("D5", "P10", "Payment Context"),
    ("D6", "P10", "Maintenance Context"),
]

# ---------------------------------------------------------------------------
# Geometry
# ---------------------------------------------------------------------------
TITLE_H = 110
TOP = TITLE_H + 40

ENT_X, ENT_W = 70, 260
ENT_MIN_H = 84

PROC_X, PROC_W, PROC_H, PROC_PITCH = 1140, 380, 176, 222

STORE_X, STORE_W = 2600, 470
STORE_MIN_H = 72
STORE_ID_W = 64

PORT_GAP = 19          # vertical spacing between ports on one side
TRUNK_GAP = 12       # horizontal spacing between neighbouring trunks
LABEL_ZONE = 350       # trunk-free zone next to processes for labels

LEFT_TRUNK_MAX = PROC_X - LABEL_ZONE        # trunks live left of this
RIGHT_TRUNK_MIN = PROC_X + PROC_W + LABEL_ZONE

CANVAS_W = STORE_X + STORE_W + 70


class Node:
    def __init__(self, nid, kind, x, y, w, h, lines, note=""):
        self.id, self.kind = nid, kind
        self.x, self.y, self.w, self.h = x, y, w, h
        self.lines, self.note = lines, note
        self.left_ports = []   # flows attached to the left side
        self.right_ports = []  # flows attached to the right side

    @property
    def cy(self):
        return self.y + self.h / 2

    @property
    def right(self):
        return self.x + self.w

    @property
    def bottom(self):
        return self.y + self.h


class Flow:
    def __init__(self, src, dst, label):
        self.src, self.dst, self.label = src, dst, label
        self.trunk_x = None
        self.src_y = None   # port y at source node
        self.dst_y = None   # port y at destination node
        self.group = None   # entity/store id (the non-process end)
        self.proc = None    # process id
        self.to_proc = None

    @property
    def side(self):
        return "left" if self.group.startswith("E") else "right"


def build_nodes():
    nodes = {}
    # processes
    for i, (num, lines) in enumerate(PROCESSES):
        y = TOP + i * PROC_PITCH
        nodes[f"P{i + 1}"] = Node(f"P{i + 1}", "process", PROC_X, y, PROC_W, PROC_H, lines, num)
    diagram_bottom = TOP + (len(PROCESSES) - 1) * PROC_PITCH + PROC_H
    return nodes, diagram_bottom


def port_count(flows, node_id):
    return sum(1 for f in flows if node_id in (f.src, f.dst))


def place_side_nodes(nodes, flows, specs, kind, x, w, min_h, y_top, y_bottom, extra_pad):
    """Distribute entities/stores evenly in a column, sized by their port count."""
    heights = []
    for sid, lines, *rest in specs:
        n = port_count(flows, sid)
        h = max(min_h, n * PORT_GAP + 2 * extra_pad, len(lines) * 18 + 2 * extra_pad)
        heights.append(h)
    total = sum(heights)
    gap = (y_bottom - y_top - total) / (len(specs) - 1)
    y = y_top
    for (sid, lines, *rest), h in zip(specs, heights):
        note = rest[0] if rest else ""
        nodes[sid] = Node(sid, kind, x, y, w, h, lines, note)
        y += h + gap


def assign_ports(node, side, flows_on_side, trunk_dist):
    """Order flows on one side of a node to avoid stub/trunk crossings.

    other end above -> top ports (nearer trunk first);
    other end below -> bottom ports (nearer trunk last).
    """
    above, below = [], []
    for f in flows_on_side:
        other = f.dst if f.src == node.id else f.src
        oy = NODES[other].cy
        (above if oy < node.cy else below).append(f)
    above.sort(key=lambda f: trunk_dist(f))
    below.sort(key=lambda f: -trunk_dist(f))
    ordered = above + below
    n = len(ordered)
    if n == 0:
        return
    span = (n - 1) * PORT_GAP
    y0 = node.cy - span / 2
    for i, f in enumerate(ordered):
        y = y0 + i * PORT_GAP
        if f.src == node.id:
            f.src_y = y
        else:
            f.dst_y = y
    setattr(node, f"{side}_ports", ordered)


def route(flows, side, group_order, inner_desc):
    """Assign trunk x positions for one gap, then ports, then count crossings."""
    side_flows = [f for f in flows if f.side == side]
    # trunk order: by group (entity/store) then by process index
    def inner_key(f):
        pi = int(f.proc[1:])
        return (-pi if inner_desc else pi, 0 if f.to_proc else 1)
    ordered = []
    for g in group_order:
        ordered += sorted([f for f in side_flows if f.group == g], key=inner_key)
    n = len(ordered)
    if side == "left":
        xs = [LEFT_TRUNK_MAX - (n - 1 - i) * TRUNK_GAP for i in range(n)]
    else:
        xs = [RIGHT_TRUNK_MIN + i * TRUNK_GAP for i in range(n)]
    for f, x in zip(ordered, xs):
        f.trunk_x = x

    # ports
    for nid, node in NODES.items():
        if side == "left":
            if node.kind == "process":
                fl = [f for f in side_flows if nid in (f.src, f.dst)]
                assign_ports(node, "left", fl, lambda f: PROC_X - f.trunk_x)
            elif node.kind == "entity":
                fl = [f for f in side_flows if nid in (f.src, f.dst)]
                assign_ports(node, "right", fl, lambda f: f.trunk_x - node.right)
        else:
            if node.kind == "process":
                fl = [f for f in side_flows if nid in (f.src, f.dst)]
                assign_ports(node, "right", fl, lambda f: f.trunk_x - node.right)
            elif node.kind == "store":
                fl = [f for f in side_flows if nid in (f.src, f.dst)]
                assign_ports(node, "left", fl, lambda f: node.x - f.trunk_x)

    # crossings: horizontal stubs vs vertical trunks
    segs_h, segs_v = [], []
    for f in ordered:
        a = NODES[f.src]
        b = NODES[f.dst]
        if side == "left":
            ent, proc = (a, b) if a.kind == "entity" else (b, a)
            ey = f.src_y if a is ent else f.dst_y
            py = f.src_y if a is proc else f.dst_y
            segs_h.append((ey, ent.right, f.trunk_x))
            segs_h.append((py, f.trunk_x, proc.x))
        else:
            st, proc = (a, b) if a.kind == "store" else (b, a)
            sy = f.src_y if a is st else f.dst_y
            py = f.src_y if a is proc else f.dst_y
            segs_h.append((py, proc.right, f.trunk_x))
            segs_h.append((sy, f.trunk_x, st.x))
        segs_v.append((f.trunk_x, min(ey if side == "left" else sy, py), max(ey if side == "left" else sy, py)))
    cross = 0
    for (y, x1, x2) in segs_h:
        lo, hi = min(x1, x2), max(x1, x2)
        for (x, y1, y2) in segs_v:
            if lo < x < hi and y1 < y < y2:
                cross += 1
    return cross


def optimise(flows, side, groups):
    """Exhaustive search for small group counts, pairwise-swap hill climb otherwise."""
    groups = list(groups)
    if len(groups) <= 7:
        best = None
        for perm in itertools.permutations(groups):
            for desc in (False, True):
                c = route(flows, side, perm, desc)
                if best is None or c < best[0]:
                    best = (c, perm, desc)
    else:
        best = None
        for desc in (False, True):
            order = list(groups)
            cur = route(flows, side, order, desc)
            improved = True
            while improved:
                improved = False
                for i in range(len(order)):
                    for j in range(i + 1, len(order)):
                        cand = list(order)
                        cand[i], cand[j] = cand[j], cand[i]
                        c = route(flows, side, cand, desc)
                        if c < cur:
                            order, cur, improved = cand, c, True
            if best is None or cur < best[0]:
                best = (cur, tuple(order), desc)
    route(flows, side, best[1], best[2])
    return best


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
NODES, DIAGRAM_BOTTOM = build_nodes()
FLOW_OBJS = [Flow(*f) for f in FLOWS]
for f in FLOW_OBJS:
    if f.src.startswith("P"):
        f.proc, f.group, f.to_proc = f.src, f.dst, False
    else:
        f.proc, f.group, f.to_proc = f.dst, f.src, True

place_side_nodes(NODES, FLOW_OBJS, ENTITIES, "entity", ENT_X, ENT_W, ENT_MIN_H,
                 TOP, DIAGRAM_BOTTOM, 14)
place_side_nodes(NODES, FLOW_OBJS, STORES, "store", STORE_X, STORE_W, STORE_MIN_H,
                 TOP, DIAGRAM_BOTTOM, 12)

LEFT_BEST = optimise(FLOW_OBJS, "left", [e[0] for e in ENTITIES])
RIGHT_BEST = optimise(FLOW_OBJS, "right", [s[0] for s in STORES])

CANVAS_H = DIAGRAM_BOTTOM + 150


def polyline(f):
    """Return the orthogonal point list for a flow (src -> dst)."""
    a, b = NODES[f.src], NODES[f.dst]
    if f.side == "left":
        if a.kind == "entity":        # entity -> process
            return [(a.right, f.src_y), (f.trunk_x, f.src_y), (f.trunk_x, f.dst_y), (b.x, f.dst_y)]
        return [(a.x, f.src_y), (f.trunk_x, f.src_y), (f.trunk_x, f.dst_y), (b.right, f.dst_y)]
    if a.kind == "process":           # process -> store
        return [(a.right, f.src_y), (f.trunk_x, f.src_y), (f.trunk_x, f.dst_y), (b.x, f.dst_y)]
    return [(a.x, f.src_y), (f.trunk_x, f.src_y), (f.trunk_x, f.dst_y), (b.right, f.dst_y)]


def label_anchor(f):
    """Label sits on the stub next to the process box."""
    p = NODES[f.proc]
    py = f.src_y if f.src == f.proc else f.dst_y
    if f.side == "left":
        return (p.x - 9, py - 5, "end")
    return (p.right + 9, py - 5, "start")


# ---------------------------------------------------------------------------
# SVG
# ---------------------------------------------------------------------------
def svg_text(x, y, s, size=12, weight="normal", anchor="middle", fill=INK, italic=False, halo=False):
    style = f'font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'
    if italic:
        style += ' font-style="italic"'
    if halo:
        style += f' paint-order="stroke" stroke="{WHITE}" stroke-width="4" stroke-linejoin="round"'
    return f'<text x="{x:.1f}" y="{y:.1f}" {style}>{escape(s)}</text>'


def render_svg() -> str:
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS_W}" height="{CANVAS_H}" '
        f'viewBox="0 0 {CANVAS_W} {CANVAS_H}">',
        '<defs>',
        f'<marker id="arrow" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="11" markerHeight="11" '
        f'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{LINE}"/></marker>',
        '</defs>',
        f'<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="{WHITE}"/>',
    ]
    # title block
    out.append(svg_text(CANVAS_W / 2, 52, "iReside Property Management System", 26, "bold"))
    out.append(svg_text(CANVAS_W / 2, 82, "Level 1 Data Flow Diagram  (Gane & Sarson notation)", 16, "normal", fill=MUTED))
    # column headings
    for x, w, t in ((ENT_X, ENT_W, "EXTERNAL ENTITIES"), (PROC_X, PROC_W, "SYSTEM PROCESSES (ranked by significance)"),
                    (STORE_X, STORE_W, "LOGICAL DATA STORES")):
        out.append(svg_text(x + w / 2, TOP - 16, t, 13, "bold", fill=MUTED))

    # flows (drawn first so symbols sit on top)
    for f in FLOW_OBJS:
        pts = polyline(f)
        d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        out.append(f'<polyline points="{d}" fill="none" stroke="{LINE}" stroke-width="{FLOW_W}" '
                   f'stroke-linejoin="miter" marker-end="url(#arrow)"/>')
    for f in FLOW_OBJS:
        x, y, anchor = label_anchor(f)
        out.append(svg_text(x, y, f.label, LABEL_PT, anchor=anchor, halo=True))

    # entities (Gane & Sarson: rectangle with drop shadow)
    for n in NODES.values():
        if n.kind != "entity":
            continue
        out.append(f'<rect x="{n.x + 5}" y="{n.y + 5}" width="{n.w}" height="{n.h}" fill="#9ca3af" opacity="0.45"/>')
        out.append(f'<rect x="{n.x}" y="{n.y}" width="{n.w}" height="{n.h}" fill="{ENTITY_FILL}" '
                   f'stroke="{INK}" stroke-width="{STROKE_W}"/>')
        lines = n.lines + ([n.note] if n.note else [])
        lh = 18
        y0 = n.cy - (len(lines) - 1) * lh / 2 + 5
        for i, s in enumerate(lines):
            is_note = n.note and i == len(lines) - 1
            out.append(svg_text(n.x + n.w / 2, y0 + i * lh, s, 11.5 if is_note else 14,
                                "normal" if is_note else "bold", fill=MUTED if is_note else INK, italic=bool(is_note)))

    # processes (rounded rectangle, number strip above a divider)
    for n in NODES.values():
        if n.kind != "process":
            continue
        out.append(f'<rect x="{n.x}" y="{n.y}" width="{n.w}" height="{n.h}" rx="16" ry="16" fill="{PROCESS_FILL}" '
                   f'stroke="{INK}" stroke-width="{STROKE_W}"/>')
        strip = 34
        out.append(f'<line x1="{n.x}" y1="{n.y + strip}" x2="{n.right}" y2="{n.y + strip}" stroke="{INK}" stroke-width="{STROKE_W}"/>')
        out.append(svg_text(n.x + n.w / 2, n.y + 23, n.note, 15, "bold"))
        body_cy = n.y + strip + (n.h - strip) / 2
        lh = 21
        y0 = body_cy - (len(n.lines) - 1) * lh / 2 + 6
        for i, s in enumerate(n.lines):
            out.append(svg_text(n.x + n.w / 2, y0 + i * lh, s, 15.5, "bold"))

    # data stores (open-ended rectangle with ID cell)
    for n in NODES.values():
        if n.kind != "store":
            continue
        out.append(f'<rect x="{n.x}" y="{n.y}" width="{n.w}" height="{n.h}" fill="{STORE_FILL}" stroke="none"/>')
        out.append(f'<path d="M{n.right},{n.y} L{n.x},{n.y} L{n.x},{n.bottom} L{n.right},{n.bottom}" fill="none" '
                   f'stroke="{INK}" stroke-width="{STROKE_W}"/>')
        out.append(f'<line x1="{n.x + STORE_ID_W}" y1="{n.y}" x2="{n.x + STORE_ID_W}" y2="{n.bottom}" '
                   f'stroke="{INK}" stroke-width="{STROKE_W}"/>')
        out.append(svg_text(n.x + STORE_ID_W / 2, n.cy + 5, n.id, 14, "bold"))
        lh = 19
        cx = n.x + STORE_ID_W + (n.w - STORE_ID_W) / 2
        y0 = n.cy - (len(n.lines) - 1) * lh / 2 + 5
        for i, s in enumerate(n.lines):
            out.append(svg_text(cx, y0 + i * lh, s, 14, "bold"))

    # legend
    ly = CANVAS_H - 92
    lx = ENT_X
    out.append(svg_text(lx, ly - 14, "Legend (Gane & Sarson)", 12, "bold", anchor="start", fill=MUTED))
    out.append(f'<rect x="{lx + 4}" y="{ly + 4}" width="54" height="34" fill="#9ca3af" opacity="0.45"/>')
    out.append(f'<rect x="{lx}" y="{ly}" width="54" height="34" fill="{ENTITY_FILL}" stroke="{INK}" stroke-width="1.2"/>')
    out.append(svg_text(lx + 70, ly + 22, "External entity", 12, anchor="start"))
    lx2 = lx + 200
    out.append(f'<rect x="{lx2}" y="{ly}" width="70" height="34" rx="8" ry="8" fill="{WHITE}" stroke="{INK}" stroke-width="1.2"/>')
    out.append(f'<line x1="{lx2}" y1="{ly + 12}" x2="{lx2 + 70}" y2="{ly + 12}" stroke="{INK}" stroke-width="1.2"/>')
    out.append(svg_text(lx2 + 35, ly + 9.5, "n.0", 8, "bold"))
    out.append(svg_text(lx2 + 86, ly + 22, "Process (number / name)", 12, anchor="start"))
    lx3 = lx2 + 260
    out.append(f'<path d="M{lx3 + 70},{ly} L{lx3},{ly} L{lx3},{ly + 34} L{lx3 + 70},{ly + 34}" fill="none" stroke="{INK}" stroke-width="1.2"/>')
    out.append(f'<line x1="{lx3 + 22}" y1="{ly}" x2="{lx3 + 22}" y2="{ly + 34}" stroke="{INK}" stroke-width="1.2"/>')
    out.append(svg_text(lx3 + 11, ly + 21, "Dn", 9, "bold"))
    out.append(svg_text(lx3 + 86, ly + 22, "Data store (logical grouping of tables)", 12, anchor="start"))
    lx4 = lx3 + 330
    out.append(f'<polyline points="{lx4},{ly + 17} {lx4 + 70},{ly + 17}" fill="none" stroke="{LINE}" stroke-width="1.2" marker-end="url(#arrow)"/>')
    out.append(svg_text(lx4 + 86, ly + 22, "Data flow (labelled with the data carried; direction = movement of data)", 12, anchor="start"))
    out.append(svg_text(CANVAS_W - 70, CANVAS_H - 40,
                        "Processes are numbered by significance rank (1.0 = highest); numbering does not imply execution order.  "
                        "Source: live Supabase schema (58 tables) and Next.js API routes, October 2026.",
                        11, anchor="end", fill=MUTED, italic=True))
    out.append('</svg>')
    return "\n".join(out)


# ---------------------------------------------------------------------------
# draw.io
# ---------------------------------------------------------------------------
def render_drawio() -> str:
    a = lambda s: escape(s, {'"': "&quot;"})
    cells = []
    ids = {}
    counter = [2]

    def nid():
        counter[0] += 1
        return f"c{counter[0]}"

    def vertex(value, style, x, y, w, h, parent="1"):
        cid = nid()
        cells.append(f'<mxCell id="{cid}" value="{a(value)}" style="{style}" vertex="1" parent="{parent}">'
                     f'<mxGeometry x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" as="geometry"/></mxCell>')
        return cid

    for n in NODES.values():
        if n.kind == "entity":
            val = "<b>" + "<br>".join(n.lines) + "</b>" + (f"<br><i><font style=\"font-size:10px\">{n.note}</font></i>" if n.note else "")
            ids[n.id] = vertex(val, f"rounded=0;whiteSpace=wrap;html=1;shadow=1;fillColor={ENTITY_FILL};strokeColor={INK};fontSize=13;fontFamily=Segoe UI;",
                               n.x, n.y, n.w, n.h)
        elif n.kind == "process":
            val = (f'<div style="font-size:14px"><b>{n.note}</b></div><hr style="margin:4px 0;border:0;border-top:1px solid {INK}">'
                   f'<b>{"<br>".join(n.lines)}</b>')
            ids[n.id] = vertex(val, f"rounded=1;arcSize=12;whiteSpace=wrap;html=1;fillColor={PROCESS_FILL};strokeColor={INK};fontSize=14;fontFamily=Segoe UI;verticalAlign=top;spacingTop=6;",
                               n.x, n.y, n.w, n.h)
        else:
            gid = vertex("", f"shape=partialRectangle;right=0;whiteSpace=wrap;html=1;fillColor={STORE_FILL};strokeColor={INK};",
                         n.x, n.y, n.w, n.h)
            ids[n.id] = gid
            vertex(f"<b>{n.id}</b>", f"shape=partialRectangle;top=0;bottom=0;left=0;right=1;fillColor=none;strokeColor={INK};html=1;fontSize=13;fontFamily=Segoe UI;",
                   0, 0, STORE_ID_W, n.h, parent=gid)
            vertex("<b>" + "<br>".join(n.lines) + "</b>", "text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;fontSize=13;fontFamily=Segoe UI;",
                   STORE_ID_W, 0, n.w - STORE_ID_W, n.h, parent=gid)

    for f in FLOW_OBJS:
        pts = polyline(f)
        src, dst = NODES[f.src], NODES[f.dst]
        (x0, y0), (x3, y3) = pts[0], pts[-1]
        ex, ey = (x0 - src.x) / src.w, (y0 - src.y) / src.h
        nx, ny = (x3 - dst.x) / dst.w, (y3 - dst.y) / dst.h
        wp = "".join(f'<mxPoint x="{x:.0f}" y="{y:.0f}"/>' for x, y in pts[1:-1])
        style = (f"edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;strokeColor={LINE};strokeWidth=1;"
                 f"fontSize=10;fontFamily=Segoe UI;labelBackgroundColor={WHITE};"
                 f"exitX={ex:.3f};exitY={ey:.3f};exitDx=0;exitDy=0;entryX={nx:.3f};entryY={ny:.3f};entryDx=0;entryDy=0;")
        # label near the process end
        lab_pos = -0.75 if f.src == f.proc else 0.75
        if f.side == "right" and f.src != f.proc:
            lab_pos = 0.75
        cells.append(f'<mxCell id="{nid()}" value="{a(f.label)}" style="{style}" edge="1" parent="1" '
                     f'source="{ids[f.src]}" target="{ids[f.dst]}"><mxGeometry x="{lab_pos}" relative="1" as="geometry">'
                     f'<Array as="points">{wp}</Array></mxGeometry></mxCell>')

    # title
    vertex("<b style=\"font-size:22px\">iReside Property Management System</b><br><font style=\"font-size:14px\">Level 1 Data Flow Diagram (Gane &amp; Sarson notation)</font>",
           "text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;fontFamily=Segoe UI;", CANVAS_W / 2 - 400, 20, 800, 70)
    body = "\n".join(cells)
    return ('<mxfile host="generate_dfd.py" modified="2026-10-09" agent="iReside DFD generator" version="24.0">\n'
            '<diagram id="dfd-level1" name="DFD Level 1">\n'
            f'<mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" '
            f'page="1" pageScale="1" pageWidth="{CANVAS_W:.0f}" pageHeight="{CANVAS_H:.0f}" background="#ffffff" math="0" shadow="0">\n'
            f'<root>\n<mxCell id="0"/>\n<mxCell id="1" parent="0"/>\n{body}\n</root>\n</mxGraphModel>\n</diagram>\n</mxfile>\n')


def validate():
    """Structural checks required by the DFD rules."""
    problems = []
    if len(PROCESSES) != 10:
        problems.append("process count != 10")
    kinds = {k: v.kind for k, v in NODES.items()}
    for f in FLOW_OBJS:
        ks, kd = kinds[f.src], kinds[f.dst]
        if "process" not in (ks, kd):
            problems.append(f"flow without a process end: {f.src}->{f.dst}")
        if not f.label.strip():
            problems.append(f"unlabelled flow {f.src}->{f.dst}")
    seen = set()
    for f in FLOW_OBJS:
        key = (f.src, f.dst, f.label)
        if key in seen:
            problems.append(f"duplicate flow {key}")
        seen.add(key)
    for sid, *_ in STORES:
        if port_count(FLOW_OBJS, sid) == 0:
            problems.append(f"store {sid} unused")
    for eid, *_ in ENTITIES:
        if port_count(FLOW_OBJS, eid) == 0:
            problems.append(f"entity {eid} unused")
    for i in range(len(PROCESSES)):
        pid = f"P{i + 1}"
        ins = [f for f in FLOW_OBJS if f.dst == pid]
        outs = [f for f in FLOW_OBJS if f.src == pid]
        if not ins or not outs:
            problems.append(f"{pid} lacks inputs or outputs")
    return problems


if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    docs = os.path.join(root, "docs")
    probs = validate()
    with open(os.path.join(docs, "iReside-DFD-Level1.svg"), "w", encoding="utf-8") as fh:
        fh.write(render_svg())
    with open(os.path.join(docs, "iReside-DFD-Level1.drawio"), "w", encoding="utf-8") as fh:
        fh.write(render_drawio())
    print(f"canvas {CANVAS_W}x{CANVAS_H}; flows {len(FLOW_OBJS)}; "
          f"left crossings {LEFT_BEST[0]} (order {LEFT_BEST[1]}, desc={LEFT_BEST[2]}); "
          f"right crossings {RIGHT_BEST[0]} (order {RIGHT_BEST[1]}, desc={RIGHT_BEST[2]})")
    print("validation:", "OK" if not probs else probs)
