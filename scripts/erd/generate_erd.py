"""
iReside core ERD generator (Crow's Foot notation).

Produces docs/iReside-ERD.svg from a declarative entity/relationship spec.
Layout is an explicit grid so every connector is orthogonal, enters an entity
at the relevant PK/FK row, and never crosses an entity box.

Run:  python scripts/erd/generate_erd.py
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Visual constants
# ---------------------------------------------------------------------------
W = 250            # entity width
HDR = 30           # header height
ROW = 18           # attribute row height
PAD_B = 6          # bottom padding inside entity
FONT = "Segoe UI, Helvetica Neue, Arial, sans-serif"
MONO = "Consolas, Menlo, monospace"

INK = "#1f2937"
LINE = "#374151"
TYPE_INK = "#6b7280"
WHITE = "#ffffff"

# Domain header tints (very light, print-safe)
TINT = {
    "users":     "#e8edf5",
    "property":  "#e6f1e8",
    "leasing":   "#fdf1dc",
    "billing":   "#f6e8ee",
    "community": "#ebe6f5",
}
DOMAIN_LABEL = {
    "users": "User & Account",
    "property": "Property, Unit & Blueprint",
    "leasing": "Intake & Lease",
    "billing": "Billing & Maintenance",
    "community": "Messaging & Community",
}


@dataclass
class Entity:
    name: str
    domain: str
    attrs: list[tuple[str, str, str]]   # (key tag, attribute, type)
    x: float = 0
    y: float = 0

    @property
    def h(self) -> float:
        return HDR + ROW * len(self.attrs) + PAD_B

    @property
    def cx(self) -> float:
        return self.x + W / 2

    @property
    def bottom(self) -> float:
        return self.y + self.h

    @property
    def right(self) -> float:
        return self.x + W

    def row_y(self, attr: str) -> float:
        for i, (_, a, _) in enumerate(self.attrs):
            if a == attr:
                return self.y + HDR + ROW * (i + 0.5)
        raise KeyError(f"{self.name}.{attr}")


# ---------------------------------------------------------------------------
# Entities (attributes trimmed to what is needed to understand the structure)
# ---------------------------------------------------------------------------
E: dict[str, Entity] = {}


def ent(name, domain, attrs):
    E[name] = Entity(name, domain, attrs)


PK, FK, PF, AT = "PK", "FK", "PK, FK", ""

ent("profiles", "users", [
    (PK, "id", "uuid"), (AT, "email", "text"), (AT, "full_name", "text"),
    (AT, "role", "user_role"), (AT, "phone", "text"), (AT, "avatar_url", "text"),
    (AT, "business_name", "text"), (AT, "created_at", "timestamptz"),
])
ent("user_security_settings", "users", [
    (PF, "profile_id", "uuid"), (AT, "two_factor_enabled", "boolean"),
    (AT, "two_factor_email", "text"), (AT, "otp_code", "text"),
    (AT, "otp_expiry", "timestamptz"), (AT, "has_changed_password", "boolean"),
])
ent("notifications", "users", [
    (PK, "id", "uuid"), (FK, "user_id", "uuid"), (AT, "type", "notification_type"),
    (AT, "title", "text"), (AT, "message", "text"), (AT, "read", "boolean"),
    (AT, "created_at", "timestamptz"),
])
ent("properties", "property", [
    (PK, "id", "uuid"), (FK, "landlord_id", "uuid"), (AT, "name", "text"),
    (AT, "address", "text"), (AT, "city", "text"), (AT, "type", "property_type"),
    (AT, "total_units", "integer"), (AT, "total_floors", "integer"),
    (AT, "base_rent_amount", "numeric"), (AT, "house_rules", "text[]"),
])
ent("units", "property", [
    (PK, "id", "uuid"), (FK, "property_id", "uuid"), (AT, "name", "text"),
    (AT, "floor", "integer"), (AT, "status", "unit_status"),
    (AT, "rent_amount", "numeric"), (AT, "beds", "integer"),
    (AT, "baths", "integer"), (AT, "sqft", "integer"),
])
ent("property_floor_configs", "property", [
    (PK, "id", "uuid"), (FK, "property_id", "uuid"), (AT, "floor_number", "integer"),
    (AT, "floor_key", "text"), (AT, "display_name", "text"), (AT, "sort_order", "integer"),
])
ent("unit_map_positions", "property", [
    (PF, "unit_id", "uuid"), (AT, "floor_key", "text"), (AT, "x", "integer"),
    (AT, "y", "integer"), (AT, "w", "integer"), (AT, "h", "integer"),
])
ent("tenant_intake_invites", "leasing", [
    (PK, "id", "uuid"), (FK, "landlord_id", "uuid"), (FK, "property_id", "uuid"),
    (FK, "unit_id", "uuid"), (AT, "mode", "text"), (AT, "token_hash", "text"),
    (AT, "status", "text"), (AT, "max_uses", "integer"), (AT, "use_count", "integer"),
    (AT, "expires_at", "timestamptz"),
])
ent("applications", "leasing", [
    (PK, "id", "uuid"), (FK, "unit_id", "uuid"), (FK, "applicant_id", "uuid"),
    (FK, "landlord_id", "uuid"), (FK, "invite_id", "uuid"), (FK, "lease_id", "uuid"),
    (AT, "status", "application_status"), (AT, "monthly_income", "numeric"),
    (AT, "employment_status", "text"), (AT, "move_in_date", "date"),
])
ent("leases", "leasing", [
    (PK, "id", "uuid"), (FK, "unit_id", "uuid"), (FK, "tenant_id", "uuid"),
    (FK, "landlord_id", "uuid"), (AT, "status", "lease_status"),
    (AT, "start_date", "date"), (AT, "end_date", "date"),
    (AT, "monthly_rent", "numeric"), (AT, "security_deposit", "numeric"),
    (AT, "signed_at", "timestamptz"), (AT, "signed_document_url", "text"),
])
ent("lease_signing_audit", "leasing", [
    (PK, "id", "uuid"), (FK, "lease_id", "uuid"), (FK, "actor_id", "uuid"),
    (AT, "event_type", "text"), (AT, "ip_address", "inet"),
    (AT, "user_agent", "text"), (AT, "created_at", "timestamptz"),
])
ent("move_out_requests", "leasing", [
    (PK, "id", "uuid"), (FK, "lease_id", "uuid"), (FK, "tenant_id", "uuid"),
    (FK, "landlord_id", "uuid"), (AT, "requested_date", "date"),
    (AT, "status", "move_out_status"), (AT, "reason", "text"),
    (AT, "inspection_date", "date"), (AT, "deposit_refund_amount", "numeric"),
    (AT, "completed_at", "timestamptz"),
])
ent("payments", "billing", [
    (PK, "id", "uuid"), (FK, "lease_id", "uuid"), (FK, "tenant_id", "uuid"),
    (FK, "landlord_id", "uuid"), (AT, "invoice_number", "text"),
    (AT, "amount", "numeric"), (AT, "paid_amount", "numeric"),
    (AT, "status", "payment_status"), (AT, "method", "payment_method"),
    (AT, "due_date", "date"), (AT, "paid_at", "timestamptz"),
])
ent("utility_readings", "billing", [
    (PK, "id", "uuid"), (FK, "lease_id", "uuid"), (FK, "unit_id", "uuid"),
    (FK, "property_id", "uuid"), (FK, "payment_id", "uuid"),
    (AT, "utility_type", "utility_type"), (AT, "billing_period_start", "date"),
    (AT, "billing_period_end", "date"), (AT, "previous_reading", "numeric"),
    (AT, "current_reading", "numeric"), (AT, "computed_charge", "numeric"),
])
ent("payment_receipts", "billing", [
    (PK, "id", "uuid"), (FK, "payment_id", "uuid"), (FK, "tenant_id", "uuid"),
    (FK, "landlord_id", "uuid"), (AT, "receipt_number", "text"),
    (AT, "amount", "numeric"), (AT, "method", "payment_method"),
    (AT, "issued_at", "timestamptz"),
])
ent("maintenance_requests", "billing", [
    (PK, "id", "uuid"), (FK, "unit_id", "uuid"), (FK, "tenant_id", "uuid"),
    (FK, "landlord_id", "uuid"), (AT, "title", "text"), (AT, "description", "text"),
    (AT, "category", "text"), (AT, "status", "maintenance_status"),
    (AT, "priority", "maintenance_priority"), (AT, "images", "text[]"),
    (AT, "resolved_at", "timestamptz"),
])
ent("expenses", "billing", [
    (PK, "id", "uuid"), (FK, "landlord_id", "uuid"), (FK, "property_id", "uuid"),
    (FK, "unit_id", "uuid"), (AT, "category", "text"), (AT, "amount", "numeric"),
    (AT, "date_incurred", "date"), (AT, "description", "text"),
])
ent("amenities", "community", [
    (PK, "id", "uuid"), (FK, "property_id", "uuid"), (FK, "landlord_id", "uuid"),
    (AT, "name", "text"), (AT, "type", "text"), (AT, "price_per_unit", "numeric"),
    (AT, "capacity", "integer"), (AT, "status", "text"),
])
ent("amenity_bookings", "community", [
    (PK, "id", "uuid"), (FK, "amenity_id", "uuid"), (FK, "tenant_id", "uuid"),
    (FK, "landlord_id", "uuid"), (AT, "booking_date", "date"),
    (AT, "start_time", "time"), (AT, "end_time", "time"),
    (AT, "total_price", "numeric"), (AT, "status", "text"),
])
ent("community_posts", "community", [
    (PK, "id", "uuid"), (FK, "property_id", "uuid"), (FK, "author_id", "uuid"),
    (AT, "author_role", "user_role"), (AT, "type", "post_type_enum"),
    (AT, "title", "text"), (AT, "content", "text"), (AT, "is_pinned", "boolean"),
    (AT, "status", "post_status_enum"), (AT, "created_at", "timestamptz"),
])
ent("conversations", "community", [
    (PK, "id", "uuid"), (AT, "created_at", "timestamptz"), (AT, "updated_at", "timestamptz"),
])
ent("conversation_participants", "community", [
    (PK, "id", "uuid"), (FK, "conversation_id", "uuid"), (FK, "user_id", "uuid"),
    (AT, "created_at", "timestamptz"),
])
ent("messages", "community", [
    (PK, "id", "uuid"), (FK, "conversation_id", "uuid"), (FK, "sender_id", "uuid"),
    (AT, "type", "message_type"), (AT, "content", "text"),
    (AT, "read_at", "timestamptz"), (AT, "created_at", "timestamptz"),
])

# ---------------------------------------------------------------------------
# Layout: top band (users) + 5 stacked columns
# ---------------------------------------------------------------------------
MARGIN_L = 120           # room for 4 left-margin lanes
MARGIN_R = 80
TITLE_H = 70
GUT = [150, 170, 140, 150]        # gutters between C0-C1, C1-C2, C2-C3, C3-C4
COL_GAP_V = 60
CHANNEL = 150            # vertical space between band and columns (profile fan-out)

col_x = [MARGIN_L]
for g in GUT:
    col_x.append(col_x[-1] + W + g)

columns = [
    ["community_posts", "maintenance_requests", "expenses", "amenities", "amenity_bookings"],
    ["properties", "units", "property_floor_configs", "unit_map_positions"],
    ["tenant_intake_invites", "applications", "leases", "lease_signing_audit"],
    ["move_out_requests", "payments", "utility_readings", "payment_receipts"],
    ["conversations", "conversation_participants", "messages"],
]

band = ["user_security_settings", "profiles", "notifications"]
band_top = TITLE_H + 20
for name, cx in zip(band, col_x[:3]):
    E[name].x = cx
    E[name].y = band_top
band_h = max(E[n].h for n in band)
cols_top = band_top + band_h + CHANNEL

for ci, names in enumerate(columns):
    y = cols_top
    for n in names:
        E[n].x = col_x[ci]
        E[n].y = y
        y += E[n].h + COL_GAP_V

TOTAL_W = col_x[-1] + W + MARGIN_R
TOTAL_H = max(E[n].bottom for n in E) + 40

# ---------------------------------------------------------------------------
# Relationships
#   card codes: "11" exactly one, "01" zero or one, "0M" zero or many, "1M" one or many
# ---------------------------------------------------------------------------


@dataclass
class Rel:
    parent: str
    child: str
    pcard: str
    ccard: str
    points: list[tuple[float, float]] = field(default_factory=list)


RELS: list[Rel] = []


def gutter_lane(gi: int, k: int, n: int) -> float:
    """x of lane k (0..n-1) centred in gutter gi."""
    g0 = col_x[gi] + W
    width = GUT[gi]
    step = width / (n + 1)
    return g0 + step * (k + 1)


def side_rel(parent, child, pcard, ccard, *, p_side, c_side, c_attr, lane_x,
             p_attr="id", p_dy=0.0):
    p, c = E[parent], E[child]
    sy = p.row_y(p_attr) + p_dy
    ty = c.row_y(c_attr)
    sx = p.right if p_side == "R" else p.x
    tx = c.x if c_side == "L" else c.right
    pts = [(sx, sy), (lane_x, sy), (lane_x, ty), (tx, ty)]
    if abs(sy - ty) < 0.5:
        pts = [(sx, sy), (tx, ty)]
    RELS.append(Rel(parent, child, pcard, ccard, pts))


def vert_rel(parent, child, pcard, ccard, dx=0.0):
    p, c = E[parent], E[child]
    x = p.cx + dx
    RELS.append(Rel(parent, child, pcard, ccard, [(x, p.bottom), (x, c.y)]))


def channel_rel(child, pcard, ccard, *, exit_dx, lane_y, drop_x, c_side, c_attr):
    """profiles.bottom -> channel lane -> vertical drop -> child side port."""
    p, c = E["profiles"], E[child]
    ex = p.cx + exit_dx
    ty = c.row_y(c_attr)
    tx = c.x if c_side == "L" else c.right
    pts = [(ex, p.bottom), (ex, lane_y), (drop_x, lane_y), (drop_x, ty), (tx, ty)]
    RELS.append(Rel("profiles", child, pcard, ccard, pts))


P = E["profiles"]

# --- top band -------------------------------------------------------------
side_rel("profiles", "user_security_settings", "11", "01",
         p_side="L", c_side="R", c_attr="profile_id", lane_x=gutter_lane(0, 0, 1))
side_rel("profiles", "notifications", "11", "0M",
         p_side="R", c_side="L", c_attr="user_id", lane_x=gutter_lane(1, 0, 1))
vert_rel("profiles", "properties", "11", "0M")

# --- profile fan-out (channel below band) ---------------------------------
# Left-going group (into left margin lanes). Deeper target -> shallower lane,
# exit further left, outer margin lane.
ch_y0 = P.bottom + 28
LANE_DY = 16
left_targets = [  # (child, attr, pcard)
    ("amenity_bookings", "tenant_id", "11"),
    ("expenses", "landlord_id", "11"),
    ("maintenance_requests", "tenant_id", "11"),
    ("community_posts", "author_id", "11"),
]
for i, (child, attr, pcard) in enumerate(left_targets):
    margin_x = 24 + 22 * i                       # outer lane for i=0 (deepest)
    channel_rel(child, pcard, "0M", exit_dx=-100 + 20 * i, lane_y=ch_y0 + LANE_DY * i,
                drop_x=margin_x, c_side="L", c_attr=attr)

# Right-going groups. Shallower target -> shallower lane, exit further right,
# gutter lane nearer the target column.
right_targets = [  # (child, attr, pcard, gutter index, lane k, n)
    ("applications", "applicant_id", "01", 1, 5, 6),
    ("leases", "tenant_id", "11", 1, 4, 6),
    ("conversation_participants", "user_id", "11", 3, 2, 3),
    ("messages", "sender_id", "11", 3, 1, 3),
]
order = [0, 1, 2, 3]
for rank, i in enumerate(order):
    child, attr, pcard, gi, k, n = right_targets[i]
    channel_rel(child, pcard, "0M", exit_dx=100 - 20 * rank, lane_y=ch_y0 + LANE_DY * rank,
                drop_x=gutter_lane(gi, k, n), c_side="L", c_attr=attr)

# --- property column internals -------------------------------------------
vert_rel("properties", "units", "11", "0M")
side_rel("properties", "property_floor_configs", "11", "0M",
         p_side="L", c_side="L", c_attr="property_id", lane_x=gutter_lane(0, 4, 5), p_dy=0)
side_rel("units", "unit_map_positions", "11", "01",
         p_side="R", c_side="R", c_attr="unit_id", lane_x=gutter_lane(1, 0, 6))

# --- property/unit -> operations (C1 -> C0) --------------------------------
side_rel("properties", "community_posts", "11", "0M",
         p_side="L", c_side="R", c_attr="property_id", lane_x=gutter_lane(0, 3, 5))
side_rel("units", "maintenance_requests", "11", "0M",
         p_side="L", c_side="R", c_attr="unit_id", lane_x=gutter_lane(0, 2, 5))
_p, _c = E["properties"], E["expenses"]
_ex = _p.x + 34
_my = _p.bottom + COL_GAP_V / 2
_lx = gutter_lane(0, 1, 5)
_ty = _c.row_y("property_id")
RELS.append(Rel("properties", "expenses", "01", "0M",
                [(_ex, _p.bottom), (_ex, _my), (_lx, _my), (_lx, _ty), (_c.right, _ty)]))
side_rel("properties", "amenities", "11", "0M",
         p_side="L", c_side="R", c_attr="property_id", lane_x=gutter_lane(0, 0, 5))
vert_rel("amenities", "amenity_bookings", "11", "0M")

# --- property/unit -> intake & lease (C1 -> C2) ----------------------------
side_rel("properties", "tenant_intake_invites", "11", "0M",
         p_side="R", c_side="L", c_attr="property_id", lane_x=gutter_lane(1, 1, 6))
side_rel("units", "applications", "11", "0M",
         p_side="R", c_side="L", c_attr="unit_id", lane_x=gutter_lane(1, 3, 6))
side_rel("units", "leases", "11", "0M",
         p_side="R", c_side="L", c_attr="unit_id", lane_x=gutter_lane(1, 2, 6))
vert_rel("tenant_intake_invites", "applications", "01", "0M")
vert_rel("leases", "applications", "01", "0M")   # applications.lease_id (drawn upward)
vert_rel("leases", "lease_signing_audit", "11", "0M")

# --- lease -> billing / move-out (C2 -> C3) --------------------------------
side_rel("leases", "move_out_requests", "11", "0M",
         p_side="R", c_side="L", c_attr="lease_id", lane_x=gutter_lane(2, 0, 3))
side_rel("leases", "payments", "11", "0M",
         p_side="R", c_side="L", c_attr="lease_id", lane_x=gutter_lane(2, 1, 3), p_dy=0)
side_rel("leases", "utility_readings", "11", "0M",
         p_side="R", c_side="L", c_attr="lease_id", lane_x=gutter_lane(2, 2, 3))
vert_rel("payments", "utility_readings", "01", "0M")
side_rel("payments", "payment_receipts", "11", "0M",
         p_side="R", c_side="R", c_attr="payment_id", lane_x=gutter_lane(3, 0, 3))

# --- messaging (C4) -------------------------------------------------------
vert_rel("conversations", "conversation_participants", "11", "1M")
side_rel("conversations", "messages", "11", "0M",
         p_side="R", c_side="R", c_attr="conversation_id", lane_x=col_x[4] + W + 36)

# ---------------------------------------------------------------------------
# SVG rendering
# ---------------------------------------------------------------------------
out: list[str] = []


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def draw_entity(e: Entity):
    out.append(f'<g class="entity" id="{e.name}">')
    out.append(f'<rect x="{e.x}" y="{e.y}" width="{W}" height="{e.h}" rx="3" ry="3" '
               f'fill="{WHITE}" stroke="{INK}" stroke-width="1.3"/>')
    out.append(f'<path d="M{e.x},{e.y + HDR} h{W}" stroke="{INK}" stroke-width="1.3"/>')
    out.append(f'<rect x="{e.x + 0.65}" y="{e.y + 0.65}" width="{W - 1.3}" height="{HDR - 1.3}" '
               f'rx="2.5" ry="2.5" fill="{TINT[e.domain]}"/>')
    out.append(f'<text x="{e.cx}" y="{e.y + HDR / 2 + 5}" text-anchor="middle" '
               f'font-family="{FONT}" font-size="13.5" font-weight="700" fill="{INK}">{esc(e.name)}</text>')
    for i, (tag, attr, typ) in enumerate(e.attrs):
        yy = e.y + HDR + ROW * (i + 0.5) + 4
        weight = "700" if tag.startswith("PK") else "400"
        deco = ' text-decoration="underline"' if tag.startswith("PK") else ""
        style = ' font-style="italic"' if tag == "FK" else ""
        if tag:
            out.append(f'<text x="{e.x + 8}" y="{yy}" font-family="{FONT}" font-size="9.5" '
                       f'font-weight="700" fill="{TYPE_INK}">{tag}</text>')
        out.append(f'<text x="{e.x + 46}" y="{yy}" font-family="{FONT}" font-size="11.5" '
                   f'font-weight="{weight}"{deco}{style} fill="{INK}">{esc(attr)}</text>')
        out.append(f'<text x="{e.right - 8}" y="{yy}" text-anchor="end" font-family="{MONO}" '
                   f'font-size="10" fill="{TYPE_INK}">{esc(typ)}</text>')
    out.append("</g>")


def end_direction(pts, at_end: bool):
    """Unit vector pointing from the line INTO the entity at that end."""
    if at_end:
        (x1, y1), (x2, y2) = pts[-2], pts[-1]
    else:
        (x1, y1), (x2, y2) = pts[1], pts[0]
    dx, dy = x2 - x1, y2 - y1
    n = max(abs(dx), abs(dy))
    return (dx / n if n else 0, dy / n if n else 0)


def draw_card(x, y, d, card):
    """Draw a Crow's Foot symbol at box edge (x,y). d points INTO the box."""
    dx, dy = d                       # into box
    bx, by = -dx, -dy                # back along the line
    px, py = -dy, dx                 # perpendicular
    s = 'stroke="%s" stroke-width="1.4" fill="none"' % LINE

    def pt(dist, off=0.0):
        return (x + bx * dist + px * off, y + by * dist + py * off)

    def bar(dist):
        (ax, ay), (cx, cy) = pt(dist, -7), pt(dist, 7)
        out.append(f'<path d="M{ax:.1f},{ay:.1f} L{cx:.1f},{cy:.1f}" {s}/>')

    def circle(dist):
        cx, cy = pt(dist)
        out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="4.5" stroke="{LINE}" '
                   f'stroke-width="1.4" fill="{WHITE}"/>')

    def crow():
        ox, oy = pt(16)
        for off in (-7, 0, 7):
            tx, ty = pt(0, off)
            out.append(f'<path d="M{ox:.1f},{oy:.1f} L{tx:.1f},{ty:.1f}" {s}/>')

    if card == "11":
        bar(10); bar(18)
    elif card == "01":
        bar(12); circle(24)
    elif card == "0M":
        crow(); circle(24)
    elif card == "1M":
        crow(); bar(22)


def draw_rel(r: Rel):
    d = " ".join(("M" if i == 0 else "L") + f"{x:.1f},{y:.1f}" for i, (x, y) in enumerate(r.points))
    out.append(f'<path d="{d}" stroke="{LINE}" stroke-width="1.4" fill="none" '
               f'stroke-linejoin="round"/>')
    draw_card(*r.points[0], end_direction(r.points, False), r.pcard)
    draw_card(*r.points[-1], end_direction(r.points, True), r.ccard)


def draw_legend():
    lx = col_x[4] - 10
    ly = E["messages"].bottom + 50
    lw = W + 90
    lh = 280
    out.append(f'<rect x="{lx}" y="{ly}" width="{lw}" height="{lh}" fill="#fafafa" '
               f'stroke="{INK}" stroke-width="1"/>')
    out.append(f'<text x="{lx + 14}" y="{ly + 24}" font-family="{FONT}" font-size="13" '
               f'font-weight="700" fill="{INK}">Legend (Crow’s Foot)</text>')
    items = [("11", "Exactly one (mandatory)"), ("01", "Zero or one (optional)"),
             ("0M", "Zero or many (optional)"), ("1M", "One or many (mandatory)")]
    for i, (card, label) in enumerate(items):
        yy = ly + 50 + i * 26
        x0 = lx + 18
        out.append(f'<path d="M{x0},{yy} L{x0 + 50},{yy}" stroke="{LINE}" stroke-width="1.4"/>')
        draw_card(x0 + 50, yy, (1, 0), card)
        out.append(f'<text x="{x0 + 66}" y="{yy + 4}" font-family="{FONT}" font-size="11.5" '
                   f'fill="{INK}">{label}</text>')
    yy = ly + 50 + 4 * 26 + 2
    out.append(f'<text x="{lx + 14}" y="{yy}" font-family="{FONT}" font-size="11" fill="{INK}">'
               f'<tspan font-weight="700">PK</tspan> primary key (bold, underlined)'
               f'  <tspan font-weight="700">FK</tspan> foreign key (italic)</text>')
    yy += 22
    out.append(f'<text x="{lx + 14}" y="{yy}" font-family="{FONT}" font-size="11" fill="{INK}">'
               f'Domain groups (header tint):</text>')
    for i, (dom, label) in enumerate(DOMAIN_LABEL.items()):
        row, colm = divmod(i, 1)
        sx, sy = lx + 18, yy + 12 + row * 18
        out.append(f'<rect x="{sx}" y="{sy}" width="14" height="11" fill="{TINT[dom]}" '
                   f'stroke="{INK}" stroke-width="0.8"/>')
        out.append(f'<text x="{sx + 20}" y="{sy + 9.5}" font-family="{FONT}" font-size="10.5" '
                   f'fill="{INK}">{label}</text>')


def draw_note():
    nx = col_x[3] - 10
    ny = E["payment_receipts"].bottom + 50
    nw = W + 20
    lines = [
        "Notes",
        "1. Connectors are drawn for the primary (identifying)",
        "   relationship of each foreign key. Duplicated owner",
        "   keys (landlord_id / tenant_id) that exist for row-level",
        "   security are listed as FK attributes without connectors.",
        "2. profiles.id references Supabase auth.users(id).",
        "3. conversation_participants is the associative entity",
        "   resolving the many-to-many between profiles and",
        "   conversations.",
    ]
    nh = 18 * len(lines) + 20
    out.append(f'<rect x="{nx}" y="{ny}" width="{nw}" height="{nh}" fill="#fafafa" '
               f'stroke="{INK}" stroke-width="1"/>')
    for i, t in enumerate(lines):
        w = "700" if i == 0 else "400"
        out.append(f'<text x="{nx + 12}" y="{ny + 24 + i * 18}" font-family="{FONT}" '
                   f'font-size="{13 if i == 0 else 10.8}" font-weight="{w}" fill="{INK}" '
                   f'xml:space="preserve">{esc(t)}</text>')


def render() -> str:
    out.clear()
    out.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{TOTAL_W}" height="{TOTAL_H}" '
               f'viewBox="0 0 {TOTAL_W} {TOTAL_H}" font-family="{FONT}">')
    out.append(f'<rect width="100%" height="100%" fill="{WHITE}"/>')
    out.append(f'<text x="{TOTAL_W / 2}" y="44" text-anchor="middle" font-family="{FONT}" '
               f'font-size="22" font-weight="700" fill="{INK}">iReside Core Database — '
               f'Entity Relationship Diagram (Crow’s Foot Notation)</text>')
    out.append(f'<text x="{TOTAL_W / 2}" y="66" text-anchor="middle" font-family="{FONT}" '
               f'font-size="12.5" fill="{TYPE_INK}">23 core entities spanning the User, Property, '
               f'Intake &amp; Lease, Billing &amp; Maintenance, and Messaging &amp; Community domains '
               f'(PostgreSQL / Supabase)</text>')
    for r in RELS:
        draw_rel(r)
    for e in E.values():
        draw_entity(e)
    draw_legend()
    draw_note()
    out.append("</svg>")
    return "\n".join(out)


if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dest = os.path.join(root, "docs", "iReside-ERD.svg")
    with open(dest, "w", encoding="utf-8") as fh:
        fh.write(render())
    print(f"wrote {dest}  ({TOTAL_W} x {TOTAL_H}), entities={len(E)}, relationships={len(RELS)}")
