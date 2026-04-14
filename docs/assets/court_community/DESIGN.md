# Design System Document: Athletic Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Gallery."** 

Volleyball is a sport of high-speed transitions, verticality, and precise floor geometry. To move beyond a "standard" community platform, this system rejects the static, boxy templates of traditional social apps. Instead, we embrace an editorial layout that feels like a premium sports journal. 

We break the "template" look through:
- **Intentional Asymmetry:** Using staggered grids for player profiles and match galleries.
- **Overlapping Elements:** Floating action buttons and text overlays that break container boundaries to mimic a ball crossing the net.
- **High-Contrast Typography:** Pairing the geometric authority of Lexend with the functional clarity of Manrope.

## 2. Colors & Surface Architecture
The palette is rooted in a deep, authoritative Navy (`#031635`), but the "premium" feel is achieved through how we layer the Slate and Surface tones.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are prohibited for sectioning. We define boundaries through tonal shifts. A section should end and another begin by transitioning from `surface` to `surface-container-low`. This creates a seamless, "liquid" UI that feels modern and expensive.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine, semi-translucent paper.
- **Base Layer:** `surface` (#faf8ff)
- **Content Sections:** `surface-container-low` (#f2f3ff)
- **Interactive Cards:** `surface-container-lowest` (#ffffff) for maximum "pop" against the tinted background.
- **Depth Transitions:** Use `surface-container-high` (#e2e7ff) for nested elements like search bars within a header.

### The "Glass & Gradient" Rule
To inject "soul" into the athletic aesthetic:
- **Glassmorphism:** Navigation bars and floating action headers must use `surface-variant` at 70% opacity with a `20px` backdrop-blur. This keeps the user connected to the content "underneath" the court.
- **Signature Textures:** For Hero sections and primary CTAs, use a subtle linear gradient: `primary` (#000000) to `primary-container` (#081b3a) at a 135-degree angle. This prevents the navy from feeling "flat" or "dead."

## 3. Typography
Our typography strategy balances the "Impact" of the game with the "Information" of the community.

- **Display & Headlines (Lexend):** A geometric sans-serif that echoes the lines of a volleyball court. Use `display-lg` (3.5rem) for hero impact statements and `headline-md` (1.75rem) for section titles.
- **Body & Labels (Manrope):** A highly legible, modern sans-serif. Manrope’s open apertures ensure readability on mobile devices while players are on the move. Use `body-lg` (1rem) for general content and `label-sm` (0.6875rem) for metadata like "Game Full" or "3 Spots Left."

**Editorial Hint:** Always use a tighter letter-spacing (-0.02em) for `display` tokens to create a more "branded," customized feel.

## 4. Elevation & Depth
We convey hierarchy through **Tonal Layering** rather than heavy drop shadows.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a soft, natural lift that mimics ambient gym lighting.
- **Ambient Shadows:** When a floating effect is required (e.g., a "Join Game" FAB), use the `shadow-lg` scale but modify the color. Use a 6% opacity version of `on-surface` (#131b2e) with a 24px blur. It should feel like a soft glow, not a dark smudge.
- **The "Ghost Border":** If a border is required for accessibility (e.g., an input field), use `outline-variant` (#c5c6cf) at **20% opacity**. Never use a 100% opaque border.

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `rounded-xl`, white text. No border.
- **Secondary:** `surface-container-highest` fill with `on-surface` text.
- **Tertiary:** Transparent background, `primary` text, with a 2px `surface-tint` underline on hover.

### Cards (The "Match Card")
- **Forbid Dividers:** Do not use lines to separate "Time," "Location," and "Skill Level." Use `8px` of vertical whitespace and varying typography weights (e.g., `title-md` for time, `body-sm` for location).
- **Interactive State:** On tap/hover, transition the background from `surface-container-lowest` to `surface-bright`.

### Inputs & Search
- Use `surface-container-high` for the input track. 
- Use `rounded-xl` for all corners. 
- The cursor/caret should be the `tertiary-fixed` green to provide a subtle "Success/Go" hint.

### Signature Component: The "Court Status" Chip
- For "Spots Available," use `tertiary-container` (#002109) background with `tertiary-fixed` (#6bff8f) text. This high-contrast, dark-mode-within-light-mode look feels premium and athletic.

## 6. Do's and Don'ts

### Do:
- **Do** use `rounded-xl` (1.5rem) for large containers and `md` (0.75rem) for smaller buttons to create a "nested radius" effect.
- **Do** use intentional whitespace. If you think a section needs a divider line, try adding `24px` of additional padding instead.
- **Do** prioritize mobile-first gestures. Ensure all "Join" actions are within the bottom 30% of the screen.

### Don't:
- **Don't** use pure black (#000000) for text. Use `on-surface` (#131b2e) to maintain the navy tonal depth.
- **Don't** use standard "Success Green" (#00FF00). Only use the specified `tertiary` tokens for a more sophisticated, "Forest/Sport" green.
- **Don't** use high-contrast shadows. If the shadow is the first thing you notice, it’s too heavy. Reduce opacity until it "felt rather than seen."