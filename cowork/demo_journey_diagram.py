#!/usr/bin/env python3
"""
Generate a HAND-DRAWN Excalidraw swimlane of the Zasocitinib demo journey.

Source process: cowork/demo_journey copy.html
Three lanes:  Patient (Sarah)  ->  Salesforce Data Cloud  ->  Takeda Patient Delegate

Hand-drawn look = roughness:1 + fontFamily:1 (Virgil).
Colours are taken ONLY from the excalidraw skill's semantic palette.
Output: demo_journey_diagram.excalidraw  (POST to Kroki for SVG)
"""
import json, os

OUT = os.path.join(os.path.dirname(__file__), "demo_journey_diagram.excalidraw")

# ---- palette (from skill) -------------------------------------------------
PATIENT = ("#dbeafe", "#1e40af")   # Primary / Input  (user-facing)
DC      = ("#f3e8ff", "#6b21a8")   # External / AI    (data platform)
DEL     = ("#dcfce7", "#166534")   # Success / Data   (care team)
KEY     = ("#fed7aa", "#c2410c")   # Trigger / Start  (personalisation moment)
ALERT   = ("#fee2e2", "#991b1b")   # Error / Critical (elevated-score alert)

# ---- geometry -------------------------------------------------------------
COL0, PITCH, BW, BH = 300, 250, 190, 96
LANE_X, LANE_W = 40, 2040
LANES = {  # lane -> (rect_top, height)
    "patient": (70, 220),
    "dc":      (360, 220),
    "del":     (650, 220),
}
def col_x(c):   return COL0 + c * PITCH
def lane_cy(l): t, h = LANES[l]; return t + h / 2
def box_y(l):   return lane_cy(l) - BH / 2

elements = []
_seed = 1000
def seed():
    global _seed; _seed += 7; return _seed

# box_id -> list of {id,type} for boundElements
bound = {}

def box(bid, col, lane, label, fill, stroke, key=False):
    x, y = col_x(col), box_y(lane)
    bound.setdefault(bid, [])
    txt_id = bid + "_t"
    bound[bid].append({"id": txt_id, "type": "text"})
    elements.append({
        "id": bid, "type": "rectangle", "x": x, "y": y,
        "width": BW, "height": BH, "angle": 0,
        "strokeColor": stroke, "backgroundColor": fill,
        "fillStyle": "solid", "strokeWidth": 2.5 if key else 1.5,
        "strokeStyle": "solid", "roughness": 1, "opacity": 100,
        "seed": seed(), "roundness": {"type": 3},
        "boundElements": bound[bid], "updated": 1,
    })
    elements.append({
        "id": txt_id, "type": "text", "x": x + 8, "y": y + 12,
        "width": BW - 16, "height": BH - 24, "angle": 0,
        "strokeColor": stroke, "backgroundColor": "transparent",
        "fillStyle": "solid", "strokeWidth": 1, "strokeStyle": "solid",
        "roughness": 1, "opacity": 100, "seed": seed(),
        "text": label, "fontSize": 15, "fontFamily": 1,
        "textAlign": "center", "verticalAlign": "middle",
        "containerId": bid, "lineHeight": 1.25, "updated": 1,
        "boundElements": None,
    })

def lane_zone(lane, label, fill, stroke):
    t, h = LANES[lane]
    elements.append({
        "id": "zone_" + lane, "type": "rectangle", "x": LANE_X, "y": t,
        "width": LANE_W, "height": h, "angle": 0,
        "strokeColor": stroke, "backgroundColor": fill,
        "fillStyle": "solid", "strokeWidth": 1, "strokeStyle": "dashed",
        "roughness": 1, "opacity": 22, "seed": seed(),
        "roundness": {"type": 3}, "boundElements": None, "updated": 1,
    })
    elements.append({
        "id": "zlbl_" + lane, "type": "text", "x": LANE_X + 18, "y": t + 10,
        "width": 360, "height": 26, "angle": 0,
        "strokeColor": stroke, "backgroundColor": "transparent",
        "fillStyle": "solid", "strokeWidth": 1, "strokeStyle": "solid",
        "roughness": 1, "opacity": 100, "seed": seed(),
        "text": label, "fontSize": 20, "fontFamily": 1,
        "textAlign": "left", "verticalAlign": "top",
        "lineHeight": 1.25, "updated": 1, "boundElements": None,
    })

def arrow(aid, pts, x, y, color, width=1.5, style="solid"):
    elements.append({
        "id": aid, "type": "arrow", "x": x, "y": y,
        "width": abs(pts[-1][0] - pts[0][0]) or 1,
        "height": abs(pts[-1][1] - pts[0][1]) or 1, "angle": 0,
        "strokeColor": color, "backgroundColor": "transparent",
        "fillStyle": "solid", "strokeWidth": width, "strokeStyle": style,
        "roughness": 1, "opacity": 100, "seed": seed(),
        "points": pts, "roundness": {"type": 2},
        "startArrowhead": None, "endArrowhead": "arrow",
        "boundElements": None, "updated": 1,
    })

def flow(aid, a, b, color):
    """horizontal arrow between two boxes in the SAME lane (a left of b)"""
    x1 = a["col"];
    sx = col_x(a["col"]) + BW
    ex = col_x(b["col"])
    y = lane_cy(a["lane"])
    arrow(aid, [[0, 0], [ex - sx, 0]], sx, y, color, 1.5)
    bound.setdefault(a["id"], []).append({"id": aid, "type": "arrow"})
    bound.setdefault(b["id"], []).append({"id": aid, "type": "arrow"})

def free_label(lid, text, x, y, color, size=13):
    elements.append({
        "id": lid, "type": "text", "x": x, "y": y,
        "width": max(60, int(max(len(s) for s in text.split("\n")) * size * 0.58)),
        "height": 20 * (text.count("\n") + 1), "angle": 0,
        "strokeColor": color, "backgroundColor": "transparent",
        "fillStyle": "solid", "strokeWidth": 1, "strokeStyle": "solid",
        "roughness": 1, "opacity": 100, "seed": seed(),
        "text": text, "fontSize": size, "fontFamily": 1,
        "textAlign": "left", "verticalAlign": "top",
        "lineHeight": 1.2, "updated": 1, "boundElements": None,
    })

# ---- lane zones (draw first so boxes sit on top) --------------------------
lane_zone("patient", "PATIENT   (Sarah)", *PATIENT)
lane_zone("dc",      "SALESFORCE DATA CLOUD", *DC)
lane_zone("del",     "TAKEDA PATIENT DELEGATE", *DEL)

# ---- boxes ----------------------------------------------------------------
# lane 1 : patient  (cols 0..6)
P = [
    ("p1", 0, "1. Opens App\nDose card + NRS",        PATIENT, False),
    ("p2", 1, "2. Confirms Dose\nZaso 15 mg taken",   PATIENT, False),
    ("p3", 2, "3. Rates Itch\nNRS 8 of 10",           PATIENT, False),
    ("p4", 3, "4. Completes PsOdisk\nSleep 8 Emo 7 Work 6", PATIENT, False),
    ("p5", 4, "5. Submits Check-In\nSyncing to Salesforce", PATIENT, False),
    ("p6", 5, "6. Education Hub\n3 tailored articles", KEY,     True),
    ("p7", 6, "7. Reads Article\nSleep + Emotional",   PATIENT, False),
]
# lane 2 : data cloud (cols 1..5)
D = [
    ("dcA", 1, "Trigger A\nAdherence ingested", DC,  False),
    ("dcB", 2, "Trigger B\nNRS score ingested", DC,  False),
    ("dcC", 3, "Trigger C\nFull PRO ingested",   DC,  False),
    ("dcP", 4, "Agentforce\nMatches content",    KEY, True),
    ("dcO", 5, "Output\nContent returned",        DC,  False),
]
# lane 3 : delegate (cols 2..6)
G = [
    ("g1", 2, "PRO Dashboard\nHistory + trends",     DEL,   False),
    ("g2", 3, "Alert!\nElevated scores",             ALERT, True),
    ("g3", 4, "Engagement\nArticles read + time",    DEL,   False),
    ("g4", 5, "Outreach\nProactive support call",    DEL,   False),
    ("g5", 6, "Close Loop\nCoordinate w/ HCP",       DEL,   False),
]

meta = {}
for bid, c, label, (fill, stroke), key in P:
    box(bid, c, "patient", label, fill, stroke, key); meta[bid] = {"id": bid, "col": c, "lane": "patient"}
for bid, c, label, (fill, stroke), key in D:
    box(bid, c, "dc", label, fill, stroke, key); meta[bid] = {"id": bid, "col": c, "lane": "dc"}
for bid, c, label, (fill, stroke), key in G:
    box(bid, c, "del", label, fill, stroke, key); meta[bid] = {"id": bid, "col": c, "lane": "del"}

# ---- in-lane flow arrows --------------------------------------------------
def chain(ids, color):
    for i in range(len(ids) - 1):
        flow(f"f_{ids[i]}_{ids[i+1]}", meta[ids[i]], meta[ids[i+1]], color)
chain([b[0] for b in P], PATIENT[1])
chain([b[0] for b in D], DC[1])
chain([b[0] for b in G], DEL[1])

# ---- cross-lane handoff arrows -------------------------------------------
def down(aid, a, b, color, style):
    x = col_x(a["col"]) + BW / 2
    y1 = box_y(a["lane"]) + BH
    y2 = box_y(b["lane"])
    arrow(aid, [[0, 0], [0, y2 - y1]], x, y1, color, 2, style)
    bound.setdefault(a["id"], []).append({"id": aid, "type": "arrow"})
    bound.setdefault(b["id"], []).append({"id": aid, "type": "arrow"})

def up(aid, a, b, color, style, width=2.5):
    x = col_x(a["col"]) + BW / 2
    y1 = box_y(a["lane"])          # top of source (dc)
    y2 = box_y(b["lane"]) + BH     # bottom of target (patient)
    arrow(aid, [[0, 0], [0, y2 - y1]], x, y1, color, width, style)
    bound.setdefault(a["id"], []).append({"id": aid, "type": "arrow"})
    bound.setdefault(b["id"], []).append({"id": aid, "type": "arrow"})

# patient -> data cloud (ingest, dashed)
down("x_p2_dcA", meta["p2"], meta["dcA"], PATIENT[1], "dashed")
down("x_p3_dcB", meta["p3"], meta["dcB"], PATIENT[1], "dashed")
down("x_p4_dcC", meta["p4"], meta["dcC"], PATIENT[1], "dashed")
# data cloud -> patient (personalised content, solid + bold)
up("x_dcO_p6", meta["dcO"], meta["p6"], KEY[1], "solid", 2.5)
# data cloud -> delegate (score threshold, elbow, dashed)
sx = col_x(meta["dcP"]["col"]) + BW / 2
sy = box_y("dc") + BH
tx = col_x(meta["g2"]["col"]) + BW / 2
ty = box_y("del")
arrow("x_dcP_g2", [[0, 0], [0, (ty - sy) / 2], [tx - sx, (ty - sy) / 2], [tx - sx, ty - sy]],
      sx, sy, DC[1], 2, "dashed")
bound.setdefault("dcP", []).append({"id": "x_dcP_g2", "type": "arrow"})
bound.setdefault("g2", []).append({"id": "x_dcP_g2", "type": "arrow"})

# ---- cross-lane arrow labels (free-floating, so they never mask the line) --
free_label("l_dose", "dose",        col_x(1) + BW / 2 + 12, (box_y("patient")+BH+box_y("dc"))/2 - 10, PATIENT[1])
free_label("l_nrs",  "NRS",         col_x(2) + BW / 2 + 12, (box_y("patient")+BH+box_y("dc"))/2 - 10, PATIENT[1])
free_label("l_pro",  "PsOdisk",     col_x(3) + BW / 2 + 12, (box_y("patient")+BH+box_y("dc"))/2 - 10, PATIENT[1])
free_label("l_pers", "personalised\ncontent", col_x(5) + BW / 2 + 14, (box_y("patient")+BH+box_y("dc"))/2 - 20, KEY[1])
free_label("l_thr",  "score threshold", sx + 16, sy + 10, DC[1])

doc = {
    "type": "excalidraw", "version": 2, "source": "claude-code",
    "elements": elements,
    "appState": {"viewBackgroundColor": "#ffffff", "gridSize": None},
    "files": {},
}
with open(OUT, "w") as f:
    json.dump(doc, f, indent=1)
print(f"wrote {OUT}  ({len(elements)} elements)")
