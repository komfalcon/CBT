# Page 06: JAMB UTME CBT Exam Simulation Console

- **Route:** `/exam/:sessionId`
- **Component File:** [`ExamConsole.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/features/exam/ExamConsole.tsx)
- **Access Level:** Protected (Authenticated Candidate with valid session)
- **Primary Layout:** High-focus exam interface with persistent top utility bar, subject tab switcher, question card display, floating on-screen JAMB calculator, right question matrix navigator, and submit modal.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Top Security & Session Bar:**
   - Candidate Aurikrex ID & photo placeholder.
   - Live Countdown Timer: Formatted as `HH:MM:SS` (e.g., `01:59:42`).
     - Changes color to warning amber below 15 minutes, and flashing red below 5 minutes.
   - Network / Auto-Save Indicator: Shows "Saved" with a green checkmark or "Syncing..." during background saves.
   - Calculator Trigger Button (`Calculator` icon with shortcut `[C]`).
   - Flag Question Button (`Flag` icon with shortcut `[F]`).
   - "Submit Exam" Button (`Send` icon with shortcut `[S]`).
2. **Subject Navigation Tabs:**
   - Horizontal tab bar with the candidate's 4 subjects (e.g., `Use of English (60)`, `Mathematics (40)`, `Physics (40)`, `Chemistry (40)`).
   - Shows badge indicating how many questions in that subject have been answered (e.g., `38/40`).
3. **Main Question Presentation Area (`<QuestionCard />`):**
   - Question Number and Topic header (e.g., `Question 14 of 40 · Current Electricity`).
   - Question Stem: Formatted with LaTeX math rendering via `KaTeX` (equations like `\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`).
   - Diagram Viewer: Renders embedded SVG diagrams or high-resolution illustration images.
   - Radio Options A, B, C, D:
     - Large clickable cards with clear letter badges.
     - Selected option highlighted with accent color and checkmark.
4. **Bottom Action & Navigation Bar:**
   - "Previous Question" button (`[P]` or `[Left Arrow]`).
   - "Next Question" button (`[N]` or `[Right Arrow]`).
   - Option selection shortcut hints (`Keys A, B, C, D`).
5. **Interactive On-Screen JAMB Calculator:**
   - Floating, draggable 8-digit calculator window mimicking standard JAMB CBT hardware:
     - Digits 0-9, basic operations (`+`, `-`, `*`, `/`, `%`), clear (`C`), equals (`=`), and parentheses.
     - Fully draggable across the desktop screen and touch-friendly on mobile devices.
6. **Question Matrix Drawer / Sidebar:**
   - Grid of buttons for every question in the active subject (1 to 60 or 1 to 40).
   - Visual color coding:
     - 🟩 **Answered:** Green background.
     - ⬜ **Unanswered:** Border outline only.
     - 🚩 **Flagged for Review:** Rose badge with flag icon.
     - 🟦 **Currently Active:** Glowing blue border.
7. **Submit Confirmation Dialog:**
   - Comprehensive summary modal displayed before ending the test:
     - Total Questions Answered vs. Unanswered across each subject.
     - Number of flagged questions.
     - Warning prompt if questions remain unattempted.
     - Action buttons: "Return to Exam" vs. "Confirm & Submit Final Exam".

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Official JAMB 8-Key Keyboard Shortcuts:**
  - Candidates can complete the entire examination without touching a mouse, simulating actual JAMB CBT center keyboards:
    - `A`, `B`, `C`, `D`: Select corresponding answer option.
    - `N` or `ArrowRight`: Advance to next question.
    - `P` or `ArrowLeft`: Return to previous question.
    - `F`: Toggle flag status on active question.
    - `C`: Open or close the on-screen calculator.
    - `S`: Open the final submit modal.
- **Automated Background Answer Debouncing:**
  - Answers are stored in React state and automatically synced in the background using `saveExamAnswers(sessionId, answers, timeRemaining)` every few seconds or on question switches.
- **Auto-Submission on Timer Expiration:**
  - When the countdown reaches `00:00:00`, the exam freezes user input, automatically submits all recorded answers, and navigates straight to `/results/:resultId`.
- **Flagging Persistence:**
  - Flagged question IDs are persisted in both local state and `localStorage` so flags survive accidental browser reloads.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Question Text Size Toggle:**  
> *"In `ExamConsole.tsx`, add an accessibility text size switcher (Standard / Large / Extra Large) in the top bar so candidates with poor vision can increase font size during exams."*

> **Scientific Calculator Mode:**  
> *"Expand the on-screen calculator in `ExamConsole.tsx` to include square root (`√`), power (`x²`), and basic trigonometric functions (`sin`, `cos`, `tan`) for mathematics and physics questions."*

> **Prevent Accidental Tab Close:**  
> *"Add a `beforeunload` window listener in `ExamConsole.tsx` warning candidates if they attempt to refresh or close the tab while an active exam is in progress."*
