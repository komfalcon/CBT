# Page 07: Diagnostic Result Slip & Answer Review

- **Route:** `/results/:resultId`
- **Component File:** [`ResultReview.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/features/results/ResultReview.tsx)
- **Access Level:** Protected (Authenticated Candidate)
- **Primary Layout:** High-fidelity performance review slip with summary banner, subject score breakdown, filter toolbar, detailed question analysis cards, step-by-step explanations, and interactive Falke AI Tutor assistance.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Top Ecosystem Bar (`<AppNavbar />`):**
   - Breadcrumb navigation: `Dashboard > Exam Results > Performance Review`.
2. **Performance Verdict & Score Banner:**
   - **Total Overall Score:** e.g., `292 / 400` with visual ranking tier (e.g., `Top 5% — High Competitive Standing`).
   - **Accuracy Rate (%):** Overall percentage of correct responses.
   - **Total Time Spent:** Time elapsed during the test (e.g., `1h 48m 12s`).
   - Diagnostic Advice Card: Identifies the candidate's strongest subject and flags the weakest subject needing urgent revision.
3. **Subject Breakdown Grid:**
   - Dedicated score card for each of the 4 tested subjects:
     - Subject Name & Score (e.g., `Mathematics: 76 / 100`, `Physics: 52 / 100`).
     - Micro counters: Green badge for Correct (e.g., `38`), Red badge for Incorrect (e.g., `14`), Gray badge for Unanswered (e.g., `8`).
4. **Question Review Filter Toolbar:**
   - **Filter by Subject:** Dropdown/tabs (`All Subjects`, `English`, `Math`, `Physics`, `Chemistry`).
   - **Filter by Outcome:** Buttons to view:
     - `All Questions`
     - 🟢 `Correct Answers Only`
     - 🔴 `Incorrect Answers (Weaknesses)`
     - ⚪ `Unanswered / Skipped`
5. **Interactive Question Review List (`<QuestionCard />`):**
   - Question Stem rendered with math formulas via KaTeX and diagram illustrations.
   - All 4 options with post-exam visual states:
     - 🟢 **Correct Answer:** Highlighted in bold green border with a checkmark badge.
     - 🔴 **Candidate Selection (if wrong):** Highlighted in red with an 'X' icon.
     - ⚪ **Other Options:** Neutral background.
   - **Official Syllabus Explanation Box:**
     - Curated academic justification explaining why the correct option is right and why common distractors are incorrect.
   - **Falke AI Interactive Tutor Button (`<ExplainButton />`):**
     - Button labeled "Ask Falke AI to Explain this Step-by-Step".
     - Language toggle: Standard Academic English vs. Nigerian Pidgin.
     - Triggers an instant AI breakdown of the concept without leaving the question card.
6. **Action Footer Bar:**
   - "Download Official Result Slip (PDF)" button.
   - "Retake Full Mock" button.
   - "Launch Targeted Deficit Drill on Weak Topics" button.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Detailed Diagnostic Filtering:**
  - Candidates can instantly filter down to *only* their incorrect questions in Physics, enabling rapid review of mistakes without scrolling through 180 questions.
- **Embedded Falke AI Tutor Chat:**
  - Candidates can query Falke AI directly regarding any confusing question; the system packages the question text, options, and candidate answer as prompt context to return tailored explanations.
- **Result Slip Export:**
  - Generates a print-ready or downloadable PDF result slip formatted like official JAMB UTME score notifications.
- **Feedback Rating:**
  - Candidates can upvote or downvote explanations to train the question bank's explanation quality.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Add Time-per-Question Analytics:**  
> *"In `ResultReview.tsx`, add a metric badge on each question card showing the amount of seconds the student spent on that question, flagging questions where they spent over 2 minutes."*

> **Direct Study Action:**  
> *"Add a 'Add to Revision List' bookmark button on every incorrect question in `ResultReview.tsx` so students can save difficult questions to a personal review deck."*

> **Social Sharing Card:**  
> *"Add a 'Share My Score' button on `ResultReview.tsx` that generates a clean social media banner image with the candidate's score and target course."*
