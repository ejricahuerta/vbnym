# NYM Volleyball → Mock Design Generation PRD

**Scope:** Requirements for producing and maintaining **UI mocks** (static or lightly interactive) that precede or parallel implementation.  
**Related:** [prd-v0.md](./prd-v0.md) (product + engineering). **Stack target for build:** Next.js App Router, shadcn/ui.  
**Version:** 1.1  
**Status:** Draft  
**Last updated:** April 13, 2026  

---

## 1. Problem Statement

Engineering needs **decision-grade visuals**: spacing, hierarchy, component boundaries, and states that map cleanly to shadcn primitives. Ad-hoc screenshots or one-off prompts produce inconsistent tokens, duplicate patterns, and rework. This PRD defines **what** mock artifacts must contain, **where** they live, and **when** they are “done” so design generation is repeatable and handoff-ready.

---

## 2. Goals

| ID | Goal |
|----|------|
| MG1 | Every player-facing and admin-critical screen has an agreed **reference mock** (or wireframe + annotation) before or during the matching sprint slice. |
| MG2 | Mocks **map to shadcn/ui** concepts (Card, Badge, Button, Tabs, Sheet, etc.) so engineers do not invent parallel layouts. |
| MG3 | **Color, type, and density** stay aligned with section 12.2 of `prd-v0.md` unless an explicit design decision log says otherwise. |
| MG4 | Assets are **versioned in-repo** under `docs/prds/assets/` with predictable names (see §6). |
| MG5 | **States** (empty, partial fill, full, error) are documented for list cards and signup flows, not only the happy path. |

---

## 3. Non-Goals

- Final brand guidelines book or marketing site visuals.
- Production React code (that belongs in the app repo / main PRD).
- Pixel-perfect parity across every breakpoint in Figma unless explicitly scoped (mobile-first mocks are sufficient for v1 mocks).

---

## 4. Deliverables

### 4.1 Required artifacts (per screen family)

| Artifact | Description |
|----------|-------------|
| **Static mock** | PNG (or SVG where vector helps), min. width **375px** (mobile) and optionally **1280px** desktop frame for the same screen. |
| **Spec note** | Short markdown block in this PRD’s **Appendix → Screen inventory** *or* a sibling `docs/prds/mock-notes/<screen>.md` listing components, tokens, and edge states. |
| **Component map** | Table: UI region → shadcn component(s) → Lucide icons (if any). |

### 4.2 Optional artifacts

| Artifact | When |
|----------|------|
| Figma (or Penpot) file | When multiple contributors edit layout; link stored in Appendix. |
| Clickable prototype | For OAuth or multi-step signup only. |

---

## 5. Design System Constraints (must match build)

Mocks **must** be generatable and reviewable against these constraints so they do not fight the stack in `prd-v0.md` §12.1.

| Token | Guidance |
|-------|----------|
| Primary / navy | Header, date badge, primary CTA: `slate-900`–`blue-950` range (single hue family per release). |
| Success | Spots badge outline/fill accents: `green-600` (or shadcn `primary` if product later unifies). |
| Surface | Page: `slate-50`; cards: white; borders subtle (`border` / `muted`). |
| Radius | Cards `rounded-xl`; buttons `rounded-md` unless shadcn variant says otherwise. |
| Type | Sans: **Inter** or **Geist**; no decorative display fonts unless explicitly approved. |
| Icons | **Lucide** only in mocks (same as shadcn defaults). |

**Reference anchor:** Existing list mock: `docs/prds/assets/ui-reference-list-view.png` → new mocks should **visually harmonize** with it unless replacing it via changelog here.

---

## 6. Asset Naming & Location

All checked-in mocks:

```
docs/prds/assets/
  ui-reference-<view>-<variant>.png
```

Examples:

- `ui-reference-list-view.png` (canonical list → already exists)
- `ui-reference-map-view.png`
- `ui-reference-run-detail-sheet.png`
- `ui-reference-signup-form.png`
- `ui-reference-admin-runs.png`

**Versioning:** Prefer **descriptive new files** over overwriting (`ui-reference-list-view-v2.png`) so PRs show diffs and history.

**Exploratory / series naming:** `screen.png`, `screen-2.png`, … are acceptable for **non-canonical** explorations; promote to `ui-reference-<view>.png` when a screen becomes the agreed engineering target.

### 6.1 Current repo assets (`docs/prds/assets/`)

| File | What it shows | Use for NYM build |
|------|----------------|-------------------|
| `ui-reference-list-view.png` | Public runs **list**: navy header, list/map toggle, run cards, join CTA | **Canonical** list view (see `prd-v0.md` §12.2). Implemented baseline in `web/`. |
| `screen.png` | **Run detail** + registration: hero meta, availability, “Claim your spot” form (skill, waiver, join) | Future **run detail route** or expanded join flow (beyond bottom sheet). |
| `screen-2.png` | **Map** + search, selected pin, **floating run card**, bottom nav | Map tab layout, floating card pattern, search bar. |
| `screen-3.png` | **Venue** page: hero, address, specs grid, nested upcoming games, amenities, reviews | Optional **location-first** IA; schema today is run-centric, not venue-centric. |
| `screen-4.png` | **Discover** list + search; card states (**slots left**, **almost full**, **private** / notify) | List **edge states**, search, secondary meta (level, time grid). |
| `screen-5.png` | **My games**: upcoming, history, chat / invite / manage | **Post-MVP** authenticated player hub (not in current PRD Day 1). |

Several files use placeholder branding (**“Kinetic Court”** etc.). Treat them as **layout, density, and component** references; **labels, copy, and IA** should stay **NYM**-aligned for implementation.

---

## 7. Screen Inventory (minimum set)

Status: `done` | `needed` | `n/a` (track in Appendix when this PRD is used actively).

| Screen / state | View | Priority | Notes |
|----------------|------|----------|--------|
| Runs list (happy) | List | P0 | Matches existing reference PNG |
| Runs list (empty runs) | List | P0 | Copy + illustration minimal |
| Runs list (full run) | List | P0 | Badge “0 left”, disabled or waitlist CTA per product decision |
| Map view chrome | Map | P0 | Same header + toggle; map area placeholder OK |
| Join / signup | Modal or page | P0 | Fields per `prd-v0` signup model |
| Confirmation (post-submit) | Page | P1 | Code copy block → align with email PRD |
| Admin login | Page | P1 | shadcn Form + Card |
| Admin runs list / editor | Page | P1 | Table or Card list |
| Admin signups + payment code column | Page | P1 | Table, Badge for paid |
| Gmail settings panel | Admin | P2 | Card + Buttons per `prd-v0` §9 |

---

## 8. Generation Process

### 8.1 Inputs (always attach to the task)

1. Link or path to **`prd-v0.md`** relevant sections (player flow, admin §9, UI §12.2).  
2. **Screen row** from §7 (which state).  
3. **Viewport**: default `375×812` mobile first.  

### 8.2 Quality bar (“definition of done” for a mock)

- [ ] Header, toggles, and one primary CTA are **visually consistent** with `ui-reference-list-view.png`.  
- [ ] Every interactive control has a **labeled shadcn mapping** in the component map.  
- [ ] **Contrast:** text on navy meets WCAG AA for key copy (title, CTA).  
- [ ] **Real-ish content** (Toronto-area copy OK); no lorem for critical labels (“join this game”, “N left”).  
- [ ] File saved under `docs/prds/assets/` with naming from §6.  
- [ ] `prd-v0.md` §12.2 (or Appendix) updated with **image link + one-line state description** if this mock becomes canonical.  

### 8.3 AI / tool usage (agnostic)

Whether mocks are produced in **Figma**, **v0**, **image models**, or **hand-drawn**:

- Export **PNG** at 2× for retina if the tool allows; otherwise 1× is acceptable.  
- Avoid fonts not available to the web app.  
- Do not introduce **new** component species (e.g. custom carousel) without a gap analysis against shadcn.

---

## 9. Handoff to Engineering

Before implementation tickets:

1. **Component map** merged (Appendix or `mock-notes/`).  
2. **Asset** in `docs/prds/assets/`.  
3. **States** listed: which are in scope for the sprint.  
4. **Explicit diffs** from the previous mock (if replacing).  

Engineers implement from **`prd-v0.md`** + **this asset**; they do not re-interpret layout from memory.

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Mock uses components shadcn cannot approximate | Review component map against shadcn docs before sign-off. |
| Desktop-only mock | Require mobile frame for P0 screens. |
| Asset drift (email vs app) | Align copy with `prd-v0` §11 templates. |

---

## 11. Appendix → Changelog (this document)

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-04-13 | §6.1 inventory for `ui-reference-list-view.png` + `screen.png` … `screen-5.png`; exploratory naming note. |
| 1.0 | 2026-04-13 | Initial PRD: deliverables, naming, screen inventory, handoff. |

---

## 12. Appendix → Component map template

Copy per screen:

| Region | shadcn | Lucide / notes |
|--------|--------|----------------|
| Example | `Card`, `CardHeader` | → |
| CTA | `Button` variant=`default` | `UserPlus` |

---

*Owner: Design / PM. Engineering may propose edits to §5–§6 for feasibility.*
