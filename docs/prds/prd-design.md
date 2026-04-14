web application/stitch/projects/15606271158987994423/screens/70f298251a2a47adba0bae194d4bf9ea
# NYM Volleyball — Product Requirements Document (PRD)

**Project Name:** NYM Volleyball (The Kinetic Court)
**Status:** Canonical Reference
**Target Stack:** Next.js, Tailwind CSS, shadcn/ui, Lucide Icons

## 1. Executive Summary
NYM Volleyball is a premium, community-focused platform for coordinating drop-in volleyball sessions. It bridges the gap between casual recreational play and professional sports aesthetics, providing a "decision-grade" interface for discovery, registration, and community management.

## 2. User Personas
*   **The Player:** Looking for high-quality games, clear location data, and a seamless "one-tap" join experience.
*   **The Admin:** Needs to manage session schedules, track registrations, and handle court-specific configurations.

## 3. Core Features & User Flows
### 3.1 Game Discovery (P0)
*   **List View:** Chronological feed of upcoming sessions with 'Slots Left' indicators and 'Join' CTAs.
*   **Map View:** Geographic distribution of games using interactive pins.
*   **Details View:** Deep dive into venue amenities (Regulation net height, Surface type), reviews, and location maps.

### 3.2 Registration & Profile (P0)
*   **Quick Join:** Modal/Page flow for capturing player info and skill level.
*   **Player Profile:** Participation-centric dashboard showing 'Games Played' and 'Payment History'.
*   **My Games:** Personal schedule management for upcoming and past sessions.

### 3.3 Administrative Terminal (P1)
*   **Secure Access:** Admin-only login for terminal access.
*   **Session Management:** (Planned) Editor for creating and updating game runs.

## 4. Design Guidelines (The Kinetic Court)
*   **Aesthetic:** Editorial, Premium, Kinetic.
*   **Color Palette:** Primary Navy (`#031635`), Slate Grays, and Success Green for status.
*   **Typography:** Bold, uppercase headers with tracking-tighter for a sports-magazine feel.
*   **Layout:** Card-based architecture using `rounded-xl` and `shadow-lg` for depth.

## 5. Technical Constraints
*   **Mobile-First:** All player flows must be optimized for 375px viewports.
*   **Component Mapping:** Every UI element must map to a shadcn/ui primitive (Card, Badge, Button, etc.).
*   **Iconography:** Use Lucide icons consistently.

---
*Generated based on screens {{DATA:SCREEN:SCREEN_26}}, {{DATA:SCREEN:SCREEN_23}}, {{DATA:SCREEN:SCREEN_18}}, {{DATA:SCREEN:SCREEN_15}}.*