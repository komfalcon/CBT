# Page 01: Public Beta Landing Page

- **Route:** `/`
- **Component File:** [`LandingPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/LandingPage.tsx)
- **Access Level:** Public (Guest & Authenticated)
- **Primary Layout:** Full-bleed marketing shell with top banner, sticky navbar, interactive hero simulation, subject showcases, feature bento grids, and footer.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Public Beta Announcement Strip:**
   - Top banner highlighting `100% Free Full Access for Every UTME Candidate`.
   - Live pulse indicator: `2025/2026 JAMB Portal Synced`.
2. **Sticky Header Navigation:**
   - Brand logo (`favicon.svg`) with BETA tag and "by Aurikrex" subtext.
   - Smooth scroll anchor links: `#features`, `#subjects`, `#pricing`, and direct link to CBT Key login (`/auth?mode=cbt_key`).
   - Dynamic right CTA:
     - If logged out: `Sign In` link + `Start Free Mock` button (`/mock-setup`).
     - If logged in: `Dashboard` button (`/dashboard`).
   - Theme toggle (Dark/Light mode) and responsive hamburger menu for mobile devices.
3. **Hero Section & Interactive CBT Simulator Preview:**
   - Headline: *"Don't just take tests. Train for the moment."*
   - Live interactive JAMB Exam Console preview widget directly in the hero:
     - Real working countdown timer (`01:48:22` counting down).
     - Subject switcher tabs (Use of English, Mathematics, Physics, Chemistry).
     - Live clickable option buttons (A, B, C, D) updating state.
     - Collapsible **Falke AI Tutor explanation drawer** with English vs. Nigerian Pidgin toggle.
   - Primary Call-to-Action buttons:
     - "Start Free 180Q Mock" (routes to `/mock-setup`).
     - "Enter with CBT Key" modal trigger.
4. **All 17 JAMB UTME Subjects Grid:**
   - Interactive subject list covering Use of English (mandatory 60 Qs) and all 16 electives (Mathematics, Physics, Chemistry, Biology, Economics, Government, Literature, etc.).
   - Visual chips showing question count (`Elective · 40 Qs`), topic highlights, and icons.
5. **Core System Feature Bento Grid:**
   - **Realistic Exam Simulation:** 180 questions, 120-minute countdown, 8-key navigation (A-B-C-D, N-P, S, R).
   - **Curriculum-Trained AI Tutor (Falke AI):** Instant step-by-step math derivations and explanations in English and Pidgin.
   - **Topic-Level Weakness Diagnosis:** Pinpoints fragile topics before exam day.
   - **Offline & Low-Bandwidth Resilient:** Engineered for Nigerian network conditions and cyber-café terminals.
6. **Live Telemetry & Social Proof Metrics:**
   - Animated counters for questions solved, registered candidates, and success rates.
7. **Free Beta Pricing / Plan Comparison:**
   - Clear comparison showing full free access during the 2025/2026 UTME campaign.
8. **CBT Key Modal Dialog:**
   - Accessible modal allowing students with printed scratch cards or cyber-café vouchers to paste their key and get instant 1-click access.
9. **Global Platform Footer:**
   - Support links (Help Center, Contact Us, Privacy Policy, Terms of Service), social links, and copyright notices.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Interactive Hero Trial:** Allows prospective students to test the exam answering flow and Falke AI explanation drawer right on the landing page without signing up first.
- **CBT Key Quick Redemption Flow:** Clicking "CBT Key" opens a modal. Submitting `AKX-XXXXXX` routes immediately to `/auth?mode=cbt_key&key=...`, bypassing standard registration friction.
- **Authentication State Detection:** Automatically checks `localStorage` for active tokens. If authenticated, the header CTA changes to "Dashboard" to avoid redundant re-logins.
- **Dual-Theme Adaptive:** Full dark mode by default with seamless transitions into high-contrast light mode.
- **Mobile Drawer Navigation:** Accessible drawer toggle on mobile viewports (< 1024px) that auto-closes on navigation.

---

## 3. How to Prompt This Page

Use these prompts when you want to modify, enhance, or polish `LandingPage.tsx`:

### Example Prompts:
> **Copy & Headline Updates:**  
> *"On the landing page (`LandingPage.tsx`), update the hero headline and subtext to emphasize the upcoming JAMB UTME registration deadline and highlight that mocks are 100% free."*

> **Interactive Demo Expansion:**  
> *"In the landing page interactive preview widget, add a calculator toggle preview button so students can preview the on-screen JAMB calculator before starting."*

> **Subject Grid & SEO Tweaks:**  
> *"Update the 17 subjects section in `LandingPage.tsx` so clicking on a subject card deep-links directly into the Question Bank filtered by that subject."*
