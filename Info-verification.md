# CBT Page Audit Verification

## TASK 1 — DEFINITIVE PATTERN INVENTORY

After a strict re-scan of all 6 pages (LandingPage, AuthPage, StudentDashboard, QuestionBankPage, ExamConsole, ResultReview), there are exactly **7** distinct utility-class patterns that represent visually/functionally identical UI elements appearing across 2 or more pages.

**1. Primary Solid Button**
*   **AuthPage.tsx:** Lines 444, 608, 661, 706, 744, 776, 841, 913 (Varies: mostly `rounded-xl py-3`, line 913 uses `rounded-lg px-4`)
*   **StudentDashboard.tsx:** Lines 545, 615 (`rounded-lg px-4`)
*   **ExamConsole.tsx:** Lines 274, 441, 603 (`rounded-lg px-6`, `rounded-xl px-6`)
*   **ResultReview.tsx:** Line 145 (`rounded-lg px-6`)

**2. Primary Gradient Button**
*   **LandingPage.tsx:** Lines 181, 240, 815 (`bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4` and variants)
*   **StudentDashboard.tsx:** Line 366 (`bg-gradient-to-r from-indigo-600 to-violet-600 py-3 rounded-xl`)

**3. Card Container**
*   **StudentDashboard.tsx:** Lines 216, 309, 348, 395, 433 (`rounded-2xl border border-slate-900 bg-slate-900/40 p-6`)
*   **ResultReview.tsx:** Lines 207, 231, 272 (`rounded-2xl border border-slate-900 bg-slate-900/40 p-6`)

**4. Modal / Dialog Overlay**
*   **AuthPage.tsx:** Line 865 (`fixed inset-0 bg-slate-950/80 backdrop-blur-sm` containing `max-w-sm bg-slate-900 border-slate-850`)
*   **StudentDashboard.tsx:** Lines 484, 557 (`fixed inset-0 bg-slate-950/80 backdrop-blur-sm` containing `max-w-xl` and `max-w-sm` `bg-slate-900 border-slate-850`)
*   **ExamConsole.tsx:** Lines 526, 581 (`fixed inset-0 bg-slate-950/80 backdrop-blur-sm` containing `max-w-md bg-slate-900 border-slate-800`)

**5. Dark Form Input Field**
*   **AuthPage.tsx:** Lines 413, 437, 486, 501, 515, 530, etc. (`w-full rounded-xl bg-slate-950 border border-slate-800/80`)
*   **StudentDashboard.tsx:** Line 575 (`w-full rounded-xl bg-slate-950 border border-slate-800 p-3`)

**6. Status / Alert Box (Translucent bg + tinted border)**
*   **AuthPage.tsx:** Lines 343, 602 (`bg-rose-500/10 border-rose-500/20` and `bg-emerald-500/10 border-emerald-500/20`)
*   **StudentDashboard.tsx:** Line 291 (`bg-amber-500/10 border border-amber-500/20`)
*   **ExamConsole.tsx:** Line 543 (`bg-rose-500/10 border border-rose-500/20`)
*   **ResultReview.tsx:** Lines 347-348 (Variant: uses `/5` for background opacity `bg-rose-500/5 border-rose-500/20` and `bg-emerald-500/5 border-emerald-500/20`)

**7. Outline Badge/Pill**
*   **LandingPage.tsx:** Lines 331, 436 (`inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5`)
*   **StudentDashboard.tsx:** Line 225 (`inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5`)

**Corrected Total Count: 7**
*Why the count differs from the prior "5":* The previous audit's table was an imprecise estimate that loosely grouped elements, while the page-by-page detail mistakenly included page-specific singletons (like Segmented Control Tabs or the Danger Button) that do not actually meet the criteria of appearing across 2 or more distinct pages.

---

## TASK 2 — QUESTION CARD DUPLICATION CHECK

**Finding: DUPLICATED.** 

`ResultReview.tsx` does **not** import any question-rendering components from `ExamConsole.tsx` or a shared location. Instead, it maintains a completely independent, duplicated implementation of the question rendering logic.

**Evidence:**
1. **No Shared Imports:** A review of the imports at the top of `ResultReview.tsx` shows only standard libraries (`react`, `react-router-dom`, `lucide-react`), the API client (`./api`), and the AI widgets. There is no import targeting `features/exam`.
2. **Duplicated External Dependencies:** Both files independently import `Latex` from `react-latex-next` and `katex/dist/katex.min.css`.
3. **Duplicated Subject Labels:** Both files independently declare an identical `const SUBJECT_LABELS: Record<string, string> = { english: 'Use of English', ... }` object at the top of the file.
4. **Duplicated Markup:** `ResultReview.tsx` explicitly reconstructs the question stem and the diagram rendering inline (e.g., `dangerouslySetInnerHTML={{ __html: q.diagram_svg }}`), mirroring the exact approach written in `ExamConsole.tsx` rather than calling a shared `<QuestionCard />` component.

---

## TASK 3 — DEAD TOKEN CHECK

**Finding: GENUINELY UNUSED.**

A full repository search (`grep`) for instances of the string `dark-blue` within the `src/` directory confirms that it is completely unused. There are no occurrences of `bg-dark-blue`, `text-dark-blue`, `border-dark-blue`, or any other utility class referencing this token anywhere in the frontend codebase. The token defined in `tailwind.config.ts` is dead code.
