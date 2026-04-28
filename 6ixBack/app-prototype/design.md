# 6ix Back Volleyball → Design System

> Toronto-area volleyball drop-ins, leagues, and tournaments. Sport-inspired
> but friendly, paid by Interac e-Transfer with auto-matched reference codes.
>
> The visual system commits to a **bold sport-block** aesthetic: hard 2px ink
> borders, hand-stamped 2-2 brutalist shadows, no soft drop shadows, no
> rounded-corner-with-coloured-left-border AI-slop.

---

## 1. Brand voice

- **Sport-friendly, not stadium-corporate.** Big display type, but
  conversational copy. We say "show up, hit balls" → not "exclusive elite
  programming."
- **Confident black + a single shouty accent.** Default accent is **electric
  orange `#FF8A1F`** (the volleyball-yellow option still ships as a tweak).
- **Local energy.** EST. 2026 · TKARONTO. Court grids. Marquees. Diagonal
  stripes. Numeric jerseys.

---

## 2. Tokens

All tokens live as CSS custom properties on `body` in `index.html` so they
respond to the Tweaks panel (palette / typography / density). Never hard-code
a hex → use the variable.

### Colors
| Token            | Default                | Use                              |
|------------------|------------------------|----------------------------------|
| `--bg`           | `#EFEAE0` (paper-warm) | App background                   |
| `--bg-2`         | `#E5DFD2`              | Subtle alt panels, tab strips    |
| `--paper`        | `#FBF8F1`              | Cards, inputs                    |
| `--ink`          | `#111114`              | Borders, body text               |
| `--ink-2`        | `#42424A`              | Secondary text                   |
| `--ink-3`        | `#8A8A92`              | Tertiary / mono captions         |
| `--accent`       | `#FF8A1F` (orange)     | Primary actions, hover, highlight|
| `--accent-2`     | `#FFB347`              | Secondary accent surfaces        |
| `--accent-deep`  | `#E5660A`              | Pressed / link-hover accent      |
| `--ok`           | `#1FB36B`              | Paid, confirmed                  |
| `--warn`         | `#FF4D2E`              | Live indicators, destructive     |

Palette can be swapped via Tweaks panel: `body[data-pal="yellow|orange|blue|red"]`.

### Typography
| Token         | Default          | Use                                |
|---------------|------------------|------------------------------------|
| `--display`   | `Archivo Black`  | Hero, page titles, section headers |
| `--ui`        | `Archivo`        | Body, buttons, controls            |
| `--serif`     | `Fraunces`       | Italic accents inside display      |
| `--mono`      | `JetBrains Mono` | Labels, references, captions       |
| `--condensed` | `Archivo Narrow` | Marquee, jersey numbers            |

Typography swaps via `body[data-type="archivo|bricolage|anton|bebas"]`.

### Density
`body[data-density="compact|regular|comfy"]` adjusts:
- `--pad-card`: 14 / 18 / 24 px
- `--gap-stack`: 8 / 11 / 14 px
- `--row-h`: 44 / 50 / 58 px

### Shadow & shape
- Borders: **always 2px solid `--ink`** (1.5px on chips/pills, 2.5px on
  modals and the largest hero cards).
- Radii: **6px** controls, **8px** cards, **3px** chips, **999px** pills.
- Shadows are **hard offset**, never soft:
  - `2px 2px 0 var(--ink)` → inputs, small buttons, chips
  - `3px 3px 0 var(--ink)` → cards, default buttons, popovers
  - `4–6px` → large CTAs, modals
- On hover: lift by `-2px,-2px` and grow shadow. On press: drop to `1px 1px`.

---

## 3. Components → shadcn-compatible API

`ui.jsx` exports React components whose **props match shadcn/ui** so the
prototype can be ported to a Next.js app by swapping imports. The skin commits
to the brand → no neutral shadcn defaults → but the shape of the API is the
same.

### Loading order in `index.html`
1. React, ReactDOM, Babel
2. `tweaks-panel.jsx` (host protocol + tweak controls)
3. `icon.jsx` (Lucide wrapper)
4. `data.jsx` (mock data)
5. `primitives.jsx` (logo, kind badge, header, footer)
6. **`ui.jsx`** ← shadcn-compatible primitives
7. Page components (`landing`, `browse`, `detail`, `host`, `roster`, `admin`)
8. `app.jsx`

### Available components

#### Buttons & forms
| Component | Notes |
|---|---|
| `<Button variant size>` | variants: `default` (ink), `accent` (orange), `outline` (ghost), `ghost`, `destructive`, `link`, `invert`. sizes: `xs`, `sm`, `default`, `lg`, `icon`. |
| `<Input>` / `<Textarea>` | Hard ink border, 2-2 shadow, focus ring lifts shadow into accent. |
| `<Label>` | Mono caps, 11px, `.14em` tracking. |
| `<Field label hint error>` | Convenience wrapper: label + control + hint/error. |
| `<Checkbox>` | 22px, fills with accent on check. |
| `<Switch>` | 44×24, ink → accent on. |
| `<RadioGroup>` / `<RadioGroupItem>` | Standard headless pattern. |

#### Select (composed)
```jsx
<Select value={v} onValueChange={setV}>
  <SelectTrigger><SelectValue placeholder="Choose…"/></SelectTrigger>
  <SelectContent>
    <SelectItem value="dropin">Drop-in</SelectItem>
    <SelectItem value="league">League</SelectItem>
  </SelectContent>
</Select>
```
- Trigger has a `data-tone="dark"` variant for placement on `--ink` surfaces
  (e.g. roster header).
- Content portals to `document.body`, max-height 320px, escape-to-close,
  click-outside-to-close.

#### Dialog
```jsx
<Dialog>
  <DialogTrigger asChild><Button variant="outline">Cancel my spot</Button></DialogTrigger>
  <DialogContent size="sm">
    <DialogHeader>
      <DialogTitle>Cancel your spot?</DialogTitle>
      <DialogDescription>We'll notify the host…</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose>Keep my spot</DialogClose>
      <Button variant="destructive">Yes, cancel</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
- Sizes: `sm` (380px), `default` (520px), `lg` (760px), `xl` (1040px).
- Locks body scroll, escape-to-close, click-overlay-to-close.

#### Tabs
```jsx
<Tabs defaultValue="all">
  <TabsList>
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="dropin">Drop-in</TabsTrigger>
  </TabsList>
  <TabsContent value="all">…</TabsContent>
</Tabs>
```

#### Badge
`<Badge variant="default|accent|outline|dark|destructive|success">` → mono
caps, 1.5px ink border.

#### Card (compositional)
`<UICard>` + `<CardHeader>` / `<CardTitle>` / `<CardDescription>` /
`<CardContent>` / `<CardFooter>`. The base `.card` CSS class (already in
`index.html`) is the most common path; the compositional pieces are there for
shadcn parity.

#### Toast
```jsx
const { toast } = useToast();
toast({ title: 'Saved', description: '…', variant: 'accent' });
```
Render `<Toaster/>` once at app root. Variants: `default` (ink), `accent`,
`success`, `destructive`. Auto-dismiss after `duration` ms (default 3500).

---

## 4. Page-level patterns

### Roster header
- **Always dark.** Black band with `--accent` numerals and a stat strip:
  Signed up / Paid / Sent / Owing. Numbers are `clamp(30px, 4.5vw, 44px)`,
  display weight 900, `letter-spacing: -.03em`.

### Game / event cards
- 2px ink border + 3-3 shadow. **No accent left-border.** Either a full
  `--accent` background, an `--ink` band header, or a paper card with a
  ticket-style stub.
- Sport-block: kind badge (`<KindBadge>`) + skill chip top-left, capacity
  ratio top-right, mono date stamp bottom.

### Host roster table
- Mono row numbers, 32×32 ink-bordered avatars filled with `--accent`,
  reference codes in mono with `.06em` tracking, status dot + 4 mark-as
  buttons (paid / sent / owing / more).

### Empty / filler content
**Don't pad.** If a section feels empty, fix the layout → never invent
copy. Every element earns its place.

---

## 5. Iconography

Lucide icons via the `<Icon name size>` wrapper in `icon.jsx`. Stroke
weight is left at the default Lucide 2 unless used inside a button (`stroke-width: 2.5`)
or as a check/x in a small chip (`3` or `3.5`). No emoji.

---

## 6. Motion

- Hover lifts: `transform .12s ease`, `box-shadow .12s ease`. No transition
  on background or color unless explicitly needed (e.g. `Switch`).
- Dialog enter: `.16s cubic-bezier(.2,.7,.3,1)`, slight 8px Y + 0.98 scale.
- Toast enter: `.18s` translate-X from 20px.
- Marquee: `40s linear infinite`.
- Live pulse on the news pill: `2s` glow loop.
- **No springs, no parallax, no auto-playing video.** Sport-block is
  punchy and direct.

---

## 7. Accessibility

- All buttons must have either a text label or `aria-label`.
- Focus-visible: 3px solid `--accent`, 3px offset.
- Dialogs trap focus by locking body scroll + escape-to-close;
  `role="dialog"` `aria-modal="true"`.
- Selects use `role="listbox"`/`role="option"` + `aria-selected`.
- Color contrast: ink-on-paper is 16.7:1; accent-on-ink is 6.8:1.

---

## 8. Tweaks (in-design controls)

The Tweaks panel is the **product designer's playground** → toggle palette,
typography, density, hero variant. Persists to disk via the host's
`__edit_mode_set_keys` protocol. See `app.jsx` `TWEAK_DEFAULTS` for the
canonical set.

---

## 9. File map

| File | Purpose |
|---|---|
| `index.html` | Tokens (CSS variables, palettes, type pairings, density, .card/.btn/.input/.chip), font loading, mount point |
| `ui.css` | Styles for shadcn-compatible primitives only |
| `ui.jsx` | shadcn-compatible primitive components |
| `primitives.jsx` | Brand-specific primitives (Logo, Header, Footer, KindBadge, CourtSVG…) |
| `data.jsx` | Mock venues, hosts, events, rosters |
| `icon.jsx` | Lucide wrapper |
| `landing.jsx` … `admin.jsx` | Page components |
| `app.jsx` | Router, tweak state, Toaster mount |

---

## 10. Porting to production (shadcn/ui + Tailwind)

The `ui.jsx` API matches shadcn so a port looks like:

```diff
- import { Button } from './ui.jsx'
+ import { Button } from '@/components/ui/button'
```

To preserve the brand skin under shadcn, override its CSS variables in
`globals.css`:

```css
:root {
  --background: 36 33% 91%;       /* --bg */
  --foreground: 240 9% 8%;        /* --ink */
  --primary: 26 100% 56%;         /* --accent */
  --border: 240 9% 8%;            /* --ink */
  --radius: 6px;
  /* …shadow utilities for the 2-2 brutalist offset */
}
```

Then customize `Button`/`Card`/`Input` Tailwind classes to use the hard
shadow (`shadow-[3px_3px_0_var(--border)]`) and 2px borders. Component
prop signatures stay identical.
