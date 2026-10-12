# Page 01: Public Beta Landing Page

- **Route:** `/`
- **Component File:** [`LandingPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/LandingPage.tsx)
- **Supporting Components Directory:** [`frontend/src/pages/landing/`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/landing/)
  - [`LandingHeader.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/landing/LandingHeader.tsx)
  - [`LandingFooter.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/landing/LandingFooter.tsx)
  - [`SampleExam.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/landing/SampleExam.tsx)
  - [`CbtKeyDialog.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/landing/CbtKeyDialog.tsx)
  - [`ActionLink.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/landing/ActionLink.tsx)
  - [`content.ts`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/landing/content.ts)
- **Supporting Hook:** [`useAuthStatus.ts`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/hooks/useAuthStatus.ts)
- **Access Level:** Public (Guest & Authenticated)
- **Primary Layout:** Semantic, accessible landing page shell with skip-to-content navigation, sticky navbar, honest static sample illustration, 4-step walkthrough, feature breakdown, verified 17-subject showcase, transparent public beta entitlement details, accessible `<dialog>` for CBT key sign-in, and canonical footer.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Skip-to-Content Link:**
   - Hidden by default, visible on focus (`#content`), ensuring direct accessibility for keyboard and screen-reader users without getting trapped in the header.

2. **Sticky Header Navigation (`LandingHeader.tsx`):**
   - Brand lockup with logo (`/favicon.svg`), title (`Aurikrex Exam Arena`), and `Beta` tag.
   - In-page anchors (`#how-it-works`, `#included`, `#subjects`, `#access`) configured with `scroll-padding-top` to prevent overlapping on navigation.
   - Right-side cluster:
     - Aurikrex ecosystem switcher (`AurikrexAppsSwitcher`, icon-only).
     - Global dark/light theme toggle (`ThemeToggle`).
     - Dynamic authentication-aware CTAs:
       - **Signed out:** `Sign in` link and primary `Create free account` CTA.
       - **Signed in:** Direct `Dashboard` action.
     - Accessible mobile drawer toggle (`aria-expanded`, `aria-controls`, Escape-to-close).

3. **Hero Section:**
   - Single strong, grounded value proposition: *"Practise for the JAMB UTME with timed computer-based mocks."*
   - Honest lead copy highlighting 4-subject full mocks, topic drills, and Falke AI explanations in English or Nigerian Pidgin.
   - Clear trust statement: *"Free during the public beta · No payment card needed."*
   - Context-sensitive CTAs matching the candidate's authentication state.
   - "Have a CBT key?" trigger for direct modal entry.

4. **Static Sample Exam Illustration (`SampleExam.tsx`):**
   - Non-interactive, honestly labelled illustrative `<figure>` displaying what a genuine UTME CBT screen looks like (Use of English question, 4 options, dual English/Pidgin explanation snippet, exam room shortcut hints).
   - Marked with an explicit caption: *"Illustration of the exam screen with a sample question. It is not a live exam."* to avoid misleading users into thinking it is a live browser simulator without credentials.

5. **How It Works (`#how-it-works`):**
   - Clear ordered list (`<ol>`) outlining the 4 verified steps:
     1. Create a free account (with 6-digit email confirmation).
     2. Choose your four subjects (English + 3 electives).
     3. Take a mock or a drill (180 questions / 120 minutes full mock vs 10/20/40 question drills).
     4. Review and repeat (subject breakdown, detailed review, topic targeting).

6. **What's Included (`#included`):**
   - 6 core capabilities verified against the real codebase:
     - Timed four-subject mocks (autosaved answers, 180 questions, 120 mins).
     - Topic drills (configurable question count and difficulty).
     - Real exam hotkeys (`A`–`D`, `N`, `P`, `F`, `S`, plus on-screen calculator).
     - Falke AI explanations in English and Nigerian Pidgin.
     - Weakness diagnosis and performance analytics.
     - Syllabus coverage tracking and leaderboard.

7. **Subjects Showcase (`#subjects`):**
   - Dynamically generated from `AVAILABLE_SUBJECTS` in `constants/subjects.ts` (17 verified subjects).
   - Visually indicates Use of English as compulsory and lists all electives clearly without fake marketing counts.

8. **Transparent Public Beta Access (`#access`):**
   - Plain-language explanation of access and limits:
     - Full feature access without payment card during beta.
     - Account-tier daily mock limits vs unlimited drills.
     - AuriCoins quota (5,000 monthly, 5 coins per AI explanation).
     - Link to canonical Terms of Service (`/terms`).

9. **Final Call-to-Action:**
   - Focused closing section prompting the user to create their account or start their mock.

10. **Native Accessible CBT Key Dialog (`CbtKeyDialog.tsx`):**
    - Uses HTML5 `<dialog>` with `showModal()`.
    - Handles Escape key, backdrop dismiss, body scroll lock, and autofocus.
    - Inline validation and accessible error states (`role="alert"`).
    - Submits directly to `loginWithCbtKey()` via API rather than insecurely leaking keys in URL query params.

11. **Canonical Platform Footer (`LandingFooter.tsx`):**
    - Standard navigation groups (Product, Support, Legal).
    - Verified contact channels (support email and telephone).
    - Founder notice ("Founded by Omotosho Korede Samuel").
    - Mandatory independent disclaimer: *"Aurikrex Exam Arena is an independent practice platform. It is not affiliated with or endorsed by JAMB."*

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Authentic Verification:** Uses `useAuthStatus` to check `localStorage` tokens and validates them via `getMe()`. Unauthorized or expired tokens cleanly transition to signed-out states.
- **Direct CBT Key Authentication:** Candidates with an existing key can authenticate directly from the modal and navigate immediately to `/dashboard` upon verification.
- **Keyboard Navigation & Accessibility:** Full focus rings with `focus-visible`, sticky header clearance via CSS `scroll-padding-top`, and WCAG AA compliant text contrast in both light and dark themes using `accent-royal-blue`.
- **Responsive Fluid Layout:** Designed for screen widths from 320px to 1920px without horizontal scroll or truncated text.

---

## 3. How to Prompt This Page

Use these prompts when iterating on `LandingPage.tsx` or its modules:

### Example Prompts:
> **Copy & Announcement Updates:**  
> *"In `content.ts`, update the beta announcement note to inform candidates about upcoming scheduled maintenance for the mock exam server."*

> **Feature Section Adjustments:**  
> *"Add a new card to the `FEATURES` list in `content.ts` highlighting the offline drill export feature once implemented."*

> **Header Navigation Tweaks:**  
> *"In `LandingHeader.tsx`, add an external link to the Aurikrex community Telegram channel in the right-side actions on desktop."*
