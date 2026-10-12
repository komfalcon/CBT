# Page 18: Help Center & FAQ Knowledgebase

- **Route:** `/help`
- **Component File:** [`HelpCenter.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/HelpCenter.tsx)
- **Access Level:** Public & Authenticated Candidates
- **Primary Layout:** Clean support documentation layout with `<SupportPageShell />`, category chips, live FAQ search bar, expandable accordion answers, and direct contact CTA.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Hero Header (`<SupportHero />`):**
   - Eyebrow tag: `AURIKREX EXAM ARENA HELP CENTER`.
   - Title: *"Answers to keep your study flow uninterrupted."*
   - Description and Search Input with instant query filtering.
2. **Category Filter Chips:**
   - `All Topics`
   - `Account & Billing` (Sign-in, verification, subscriptions, refunds)
   - `Using the CBT Simulator` (Mocks, drills, timing, scoring, Falke AI)
   - `CBT Keys` (Redeeming vouchers on shared cyber-café computers)
   - `Technical Issues` (Browser compatibility, offline behavior, KaTeX rendering)
3. **Expandable FAQ Accordion Matrix:**
   - Curated high-yield UTME candidate questions:
     - How to create and verify a candidate account?
     - Can I sign in with Google?
     - Why do I need to choose four UTME subjects?
     - How does the CBT Key work on cyber-café computers?
     - What happens if my internet connection drops during an exam?
     - How does Falke AI score derivations?
   - Clean animated Chevron dropdowns revealing comprehensive answers.
4. **Fallback Contact CTA Card:**
   - "Still need help?" banner linking directly to the Contact Us page (`/contact`) or email support.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Instant Search Filtering:**
  - Real-time client-side text filtering: searching "offline" or "refund" immediately filters down the FAQ list.
- **Category Switching:**
  - Clicking any category pill smoothly filters items to that topic without reloading the page.
- **Deep Anchor Linking:**
  - FAQs have unique IDs enabling direct links from error screens (e.g., pointing a candidate to `/help#keys` when a key fails).

---

## 3. How to Prompt This Page

### Example Prompts:
> **Add New FAQ Items:**  
> *"In `HelpCenter.tsx`, add new FAQ items explaining how JAMB UTME negative marking works (if applicable) and how to change exam centers."*

> **Quick Video Tutorials Section:**  
> *"Add a 'Video Guides' section in `HelpCenter.tsx` with embed cards showing a 2-minute walkthrough on how to take a mock exam."*
