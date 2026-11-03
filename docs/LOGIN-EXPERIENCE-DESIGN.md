# Animated campus entry experience

Date: 2026-11-03. User requests a professional, premium, responsive landing/login experience based on the supplied screenshot of /login.

## Scope and direction
Redesign the existing public login route as a complete entry page rather than adding an unrelated marketing site. Keep the approved navy/blue palette, bundled DM Sans, Lucide icon system and existing authentication/reset behavior. Signup remains available at /signup.

Use a calm full-page canvas with a proper brand/navigation header, a strong editorial headline, an original campus-network illustration, concise platform highlights and a carefully composed sign-in card. Include a working appearance control and real signup links. Do not add fake sign-in methods, statistics, password recovery or dead buttons.

## Motion
Use original CSS/SVG motion: staggered entrance, gentle floating interface cards, restrained atmospheric glow and connection-line reveals. Animate transforms/opacity; avoid per-frame React state, large video downloads and new animation dependencies. No specific external animated website or retained REA capture was provided, so do not claim a reverse-engineering analysis occurred. All decorative visuals are hidden from assistive technology; reduced-motion preference disables motion with all content still visible.

## Responsive/accessibility contract
- Desktop: balanced two-column composition with an illustration and a readable form.
- Tablet/mobile: compact hero above the form; remove large decorative artwork, preserve the useful copy and links, and prevent horizontal overflow.
- 320px minimum width; inputs retain labels, required/email semantics, autofill and keyboard password visibility.
- One primary heading, semantic landmarks, visible focus, readable light/dark themes, disabled/busy submit states and visible authentication failures.

## Validation
Run the existing browser suite and extend it for the new entry structure, appearance control, narrow/mobile/tablet sizes, missing/invalid credentials, visibility toggle and reduced motion. Retain all dashboard/role regressions. Verify production build using the committed Vite configuration, inspect screenshots and push the verified result to the existing main branch for testing.

## Delivered and verified
- Original campus illustration isolated in frontend/src/components/auth/CampusScene.jsx. Page styling is scoped in LoginLanding.css so signup retains its existing layout.
- Working brand/header navigation, appearance cycling, signup links, labeled inputs, busy submission, credential errors and password visibility.
- Motion check verifies that the central illustration's computed transform actually changes. Reduced-motion checks verify motion is disabled. Removed a parent opacity entrance animation after visual review found it could suppress the nested animated illustration's painting.
- Browser suite passed against the production artifact: desktop 1440px, tablet 1024px, mobile 390px and narrow 320px; both themes; native empty validation; pending/rejected sign-in; password visibility; reset routing; existing dashboard fixtures and navigation. Browser animation waits tolerate normal cancellation during theme changes.
- Existing unit/HTTP regressions: 50 passed. No backend changes.
- Production build passed using the committed Vite configuration: 14,924 modules transformed. Existing large-bundle warning remains. No new runtime dependencies or downloaded animation/video assets.
- Visually inspected desktop, dark, tablet and mobile screenshots under docs/verification/login-*.png. Browser API responses are isolated fixtures, not a live MongoDB test.
