"""
Export the iReside core ERD to an editable draw.io file (docs/iReside-ERD.drawio).

Reuses the layout, entities and connector waypoints computed in generate_erd.py,
so the diagram opens in draw.io exactly as the SVG/PNG render.

Run:  python scripts/erd/export_drawio.py
"""
from __future__ import annotations

import os
from xml.sax.saxutils import escape

import generate_erd as G

E, RELS, W, HDR, ROW = G.E, G.RELS, G.W, G.HDR, G.ROW

ARROW = {"11": "ERmandOne", "01": "ERzeroToOne", "0M": "ERzeroToMany", "1M": "ERoneToMany"}

cells: list[str] = []
_id = [100]


def nid() -> str:
    _id[0] += 1
    return f"c{_id[0]}"


def attr(s: str) -> str:
    return escape(s, {'"': "&quot;"})


def add_entity(e: G.Entity):
    style = (
        "swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=%d;"
        "horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;"
        "marginBottom=0;html=1;rounded=1;arcSize=3;fontSize=13;fontFamily=Segoe UI;"
        "strokeColor=%s;strokeWidth=1.3;fontColor=%s;fillColor=%s;swimlaneFillColor=#ffffff;"
        "whiteSpace=wrap;" % (HDR, G.INK, G.INK, G.TINT[e.domain])
    )
    cells.append(
        f'<mxCell id="{e.name}" value="{attr(e.name)}" style="{style}" vertex="1" parent="1">'
        f'<mxGeometry x="{e.x:.0f}" y="{e.y:.0f}" width="{W}" height="{e.h:.0f}" as="geometry"/></mxCell>'
    )
    for i, (tag, a, typ) in enumerate(e.attrs):
        name_html = a
        if tag.startswith("PK"):
            name_html = f"<b><u>{a}</u></b>"
        elif tag == "FK":
            name_html = f"<i>{a}</i>"
        tag_html = f'<span style="font-size:9.5px;font-weight:700;color:{G.TYPE_INK};display:inline-block;width:34px">{tag}</span>'
        label = (
            f'<div style="display:flex;justify-content:space-between;align-items:center;width:226px">'
            f'<span>{tag_html}{name_html}</span>'
            f'<span style="font-family:Consolas,Menlo,monospace;font-size:10px;color:{G.TYPE_INK}">{typ}</span></div>'
        )
        rstyle = (
            "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;"
            "spacingRight=6;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
            "html=1;whiteSpace=wrap;fontSize=11.5;fontFamily=Segoe UI;fontColor=%s;" % G.INK
        )
        cells.append(
            f'<mxCell id="{e.name}__{a}" value="{attr(label)}" style="{rstyle}" vertex="1" parent="{e.name}">'
            f'<mxGeometry y="{HDR + ROW * i}" width="{W}" height="{ROW}" as="geometry"/></mxCell>'
        )
    # bottom padding row keeps the box height identical to the SVG
    cells.append(
        f'<mxCell id="{e.name}__pad" value="" style="text;strokeColor=none;fillColor=none;" vertex="1" parent="{e.name}">'
        f'<mxGeometry y="{HDR + ROW * len(e.attrs)}" width="{W}" height="{G.PAD_B}" as="geometry"/></mxCell>'
    )


def anchor(e: G.Entity, pt: tuple[float, float]) -> tuple[str, str]:
    """Return (cell id, 'x=..;y=..' constraint) for a connector endpoint on entity e."""
    x, y = pt
    if abs(y - e.y) < 0.5:          # top edge
        return e.name, f"exitX={(x - e.x) / W:.3f};exitY=0"
    if abs(y - e.bottom) < 0.5:     # bottom edge
        return e.name, f"exitX={(x - e.x) / W:.3f};exitY=1"
    # side edge -> attach to the attribute row at that y
    idx = int((y - e.y - HDR) // ROW)
    idx = max(0, min(idx, len(e.attrs) - 1))
    row_id = f"{e.name}__{e.attrs[idx][1]}"
    side = "0" if abs(x - e.x) < 0.5 else "1"
    return row_id, f"exitX={side};exitY=0.5"


def add_rel(r: G.Rel):
    p, c = E[r.parent], E[r.child]
    src, sconst = anchor(p, r.points[0])
    tgt, tconst = anchor(c, r.points[-1])
    tconst = tconst.replace("exitX", "entryX").replace("exitY", "entryY")
    style = (
        "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
        f"strokeColor={G.LINE};strokeWidth=1.4;endFill=0;startFill=0;"
        f"startArrow={ARROW[r.pcard]};endArrow={ARROW[r.ccard]};"
        f"{sconst};{tconst};exitDx=0;exitDy=0;entryDx=0;entryDy=0;"
    )
    pts = "".join(f'<mxPoint x="{x:.0f}" y="{y:.0f}"/>' for x, y in r.points[1:-1])
    arr = f'<Array as="points">{pts}</Array>' if pts else ""
    cells.append(
        f'<mxCell id="{nid()}" style="{style}" edge="1" parent="1" source="{src}" target="{tgt}">'
        f'<mxGeometry relative="1" as="geometry">{arr}</mxGeometry></mxCell>'
    )


def add_text(x, y, w, h, html, style_extra=""):
    style = ("text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontFamily=Segoe UI;"
             f"fontColor={G.INK};" + style_extra)
    cells.append(
        f'<mxCell id="{nid()}" value="{attr(html)}" style="{style}" vertex="1" parent="1">'
        f'<mxGeometry x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" as="geometry"/></mxCell>'
    )


def add_legend():
    lx = G.col_x[4] - 10
    ly = E["messages"].bottom + 50
    lw, lh = W + 90, 290
    cells.append(
        f'<mxCell id="{nid()}" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#fafafa;'
        f'strokeColor={G.INK};" vertex="1" parent="1">'
        f'<mxGeometry x="{lx}" y="{ly}" width="{lw}" height="{lh}" as="geometry"/></mxCell>'
    )
    add_text(lx + 10, ly + 6, lw - 20, 22, "<b>Legend (Crow’s Foot)</b>", "fontSize=13;")
    items = [("11", "Exactly one (mandatory)"), ("01", "Zero or one (optional)"),
             ("0M", "Zero or many (optional)"), ("1M", "One or many (mandatory)")]
    for i, (card, label) in enumerate(items):
        yy = ly + 46 + i * 26
        a, b = nid(), nid()
        for cid, xx in ((a, lx + 18), (b, lx + 70)):
            cells.append(
                f'<mxCell id="{cid}" value="" style="shape=ellipse;strokeColor=none;fillColor=none;" '
                f'vertex="1" parent="1"><mxGeometry x="{xx}" y="{yy}" width="1" height="1" as="geometry"/></mxCell>'
            )
        cells.append(
            f'<mxCell id="{nid()}" style="edgeStyle=none;html=1;strokeColor={G.LINE};strokeWidth=1.4;'
            f'endArrow={ARROW[card]};startArrow=none;endFill=0;" edge="1" parent="1" source="{a}" target="{b}">'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>'
        )
        add_text(lx + 84, yy - 10, lw - 94, 20, label, "fontSize=11.5;verticalAlign=middle;")
    yy = ly + 46 + 4 * 26 + 2
    add_text(lx + 10, yy - 8, lw - 20, 20,
             "<b>PK</b> primary key (bold, underlined) &nbsp; <b>FK</b> foreign key (italic)", "fontSize=11;")
    add_text(lx + 10, yy + 14, lw - 20, 20, "Domain groups (header tint):", "fontSize=11;")
    for i, (dom, label) in enumerate(G.DOMAIN_LABEL.items()):
        sy = yy + 38 + i * 18
        cells.append(
            f'<mxCell id="{nid()}" value="" style="rounded=0;fillColor={G.TINT[dom]};strokeColor={G.INK};'
            f'strokeWidth=0.8;" vertex="1" parent="1"><mxGeometry x="{lx + 18}" y="{sy}" width="14" height="11" as="geometry"/></mxCell>'
        )
        add_text(lx + 38, sy - 5, lw - 50, 20, label, "fontSize=10.5;verticalAlign=middle;")


def add_notes():
    nx = G.col_x[3] - 10
    ny = E["payment_receipts"].bottom + 50
    nw = W + 20
    html = (
        "<b style='font-size:13px'>Notes</b><br>"
        "1. Connectors are drawn for the primary (identifying) relationship of each foreign key. "
        "Duplicated owner keys (landlord_id / tenant_id) that exist for row-level security are listed "
        "as FK attributes without connectors.<br>"
        "2. profiles.id references Supabase auth.users(id).<br>"
        "3. conversation_participants is the associative entity resolving the many-to-many between "
        "profiles and conversations."
    )
    cells.append(
        f'<mxCell id="{nid()}" value="{attr(html)}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#fafafa;'
        f'strokeColor={G.INK};align=left;verticalAlign=top;spacing=10;fontSize=10.8;fontFamily=Segoe UI;'
        f'fontColor={G.INK};" vertex="1" parent="1">'
        f'<mxGeometry x="{nx}" y="{ny}" width="{nw}" height="190" as="geometry"/></mxCell>'
    )


def build() -> str:
    cells.clear()
    add_text(0, 20, G.TOTAL_W, 30,
             "<b>iReside Core Database — Entity Relationship Diagram (Crow’s Foot Notation)</b>",
             "fontSize=22;align=center;")
    add_text(0, 54, G.TOTAL_W, 20,
             "23 core entities spanning the User, Property, Intake &amp; Lease, Billing &amp; Maintenance, "
             "and Messaging &amp; Community domains (PostgreSQL / Supabase)",
             f"fontSize=12.5;align=center;fontColor={G.TYPE_INK};")
    for e in E.values():
        add_entity(e)
    for r in RELS:
        add_rel(r)
    add_legend()
    add_notes()
    body = "\n".join(cells)
    return (
        '<mxfile host="app.diagrams.net" type="device">\n'
        '<diagram id="ireside-core-erd" name="iReside Core ERD">\n'
        f'<mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
        f'arrows="1" fold="1" page="1" pageScale="1" pageWidth="{G.TOTAL_W:.0f}" pageHeight="{G.TOTAL_H:.0f}" '
        'math="0" shadow="0" background="#ffffff">\n<root>\n'
        '<mxCell id="0"/>\n<mxCell id="1" parent="0"/>\n'
        f"{body}\n</root>\n</mxGraphModel>\n</diagram>\n</mxfile>\n"
    )


if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dest = os.path.join(root, "docs", "iReside-ERD.drawio")
    with open(dest, "w", encoding="utf-8") as fh:
        fh.write(build())
    print(f"wrote {dest}  cells={len(cells)}")
