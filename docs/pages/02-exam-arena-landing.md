# Page 02: Exam Arena Marketing Landing

- **Route:** `/arena`
- **Component File:** [`ExamArenaLanding.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/ExamArenaLanding.tsx)
- **Access Level:** Public (Guest & Authenticated)
- **Primary Layout:** Focused dark-futuristic marketing page centered around competitive exam readiness, repair missions, and live arena preparation.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Ambient Background & Grid Matrix:**
   - Subtle glowing ambient gradient blobs (accent royal blue and emerald tertiary) with a 54px cybernetic coordinate grid overlay.
2. **Minimal Header:**
   - Aurikrex Exam Arena logo emblem, navigation links (`How it works`, `Training modes`, `Arena`), ThemeToggle, Sign-in link, and "Enter Arena" CTA.
3. **Hero Section:**
   - Eyebrow badge: `THE INTELLIGENT JAMB TRAINING SYSTEM` with sparkling icon.
   - Headline: *"Don’t just take tests. Train for the moment."*
   - Direct CTA: *"Build my readiness map"* routing to `/auth?mode=register`.
4. **Interactive Readiness Radar Preview:**
   - Graphic display of candidate mastery levels across core subjects:
     - English (78% · stable)
     - Mathematics (64% · fragile)
     - Physics (52% · critical)
     - Chemistry (81% · stable)
   - Visual mission cards:
     - **Repair Mission:** Newton's Laws (12 questions · 8 min · amber warning)
     - **Quick Sprint:** Use of English (5 questions · 3 min · blue sprint)
     - **Live Arena:** Find an opponent (Beta Test Arena · purple battle)
5. **The 4-Step Mastery Loop (`#system`):**
   - `01 Attempt`: Take a realistic mock or a focused sprint.
   - `02 Diagnose`: Determine whether mistakes stemmed from knowledge gaps, timing pressure, or overconfidence.
   - `03 Repair`: Run micro-missions targeted strictly at the diagnosed weakness.
   - `04 Stabilise`: Re-test weak zones until accuracy reaches benchmark stability.
6. **Live Training Modes Showcase (`#missions`):**
   - Highlighting Full Mocks, Deficit Drills, and Competitive Head-to-Head sprints.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Targeted Funnel Entry:** Serves as a streamlined high-conversion landing page for candidates coming from ads or social campaigns focused on score improvement.
- **Visual Subject Health Demonstration:** Demonstrates to candidates how the system categorizes knowledge into *stable*, *fragile*, and *critical* states rather than presenting vague percentage scores.
- **Direct Router Navigation:** Quick routing to registration (`/auth?mode=register`) or sign-in (`/auth?mode=login`).

---

## 3. How to Prompt This Page

### Example Prompts:
> **Visual Refresh:**  
> *"In `ExamArenaLanding.tsx`, enhance the interactive radar card so users can click on the 'Repair Mission' card to see a preview modal of sample diagnostic questions."*

> **Feature Alignment:**  
> *"Align the training modes in `ExamArenaLanding.tsx` with the latest options available in `MockSetupPage.tsx`."*
