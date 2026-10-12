# Page 04: Candidate Command Center & Dashboard

- **Route:** `/dashboard`
- **Component File:** [`StudentDashboard.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/StudentDashboard.tsx)
- **Access Level:** Protected (Authenticated Candidate)
- **Primary Layout:** High-density academic dashboard with global `<AppNavbar />`, candidate profile banner, KPI metrics bento grid, primary action cards, subject diagnostic breakdown, weak-topic AI recommendation, and recent exam history table.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Global Ecosystem Navigation Bar (`<AppNavbar />`):**
   - Brand logo, current page title badge ("Candidate Command Center"), direct links to Arena (`/mock-setup`), Question Bank (`/questions`), Syllabus (`/study`), Leaderboard (`/leaderboard`), and Falke AI (`/falke-ai`).
   - AuriCoin XP badge displaying current points and level.
   - Dual-theme toggle (Dark/Light).
   - Candidate initials avatar dropdown with link to Profile (`/profile`) and sign out.
2. **Candidate Identity & Combination Banner:**
   - Candidate Full Name, unique Aurikrex ID (`AKX-XXXXXX`) with one-click copy button.
   - Active 4-Subject UTME Combination display (e.g., `Use of English · Mathematics · Physics · Chemistry`).
   - "Edit Subject Combination" button that launches a dedicated modal.
3. **Core Readiness Metric Tiles (Bento Grid):**
   - **Target Readiness Index (%):** Calculated readiness score based on average mock performance against the 400-mark UTME ceiling.
   - **Average Mock Score:** Mean score across all completed 180-question simulations (e.g., `284 / 400`).
   - **Total Questions Solved:** Aggregate counter across mocks and topic drills.
   - **Exam Pace / Speed:** Average time spent per full mock session (e.g., `1h 42m`).
4. **Primary Exam Launch Actions (Split Cards):**
   - **Start Full 180Q Mock:** Bold gradient card routing directly to `/mock-setup`.
   - **Launch Focused Topic Drill:** Interactive modal launcher allowing students to practice specific weak topics in 10, 20, or 40-question bursts.
5. **Subject Performance Diagnostic Gauges:**
   - Visual accuracy progress bars for each of the candidate's 4 selected subjects.
   - Color-coded status tags:
     - 🟢 **Stable** (Accuracy >= 70%)
     - 🟡 **Fragile** (Accuracy 50% - 69%)
     - 🔴 **Critical** (Accuracy < 50%)
6. **AI Weakness Diagnostic Spotlight:**
   - Highlights the candidate's most urgent weak topic (e.g., `Physics: Alternating Current Circuits (32% accuracy)`).
   - Instant "Repair Weakness" button that opens the drill modal pre-filled with that exact subject and topic.
7. **Recent Exam History Table:**
   - Chronological list of completed tests.
   - Columns: Date & Time, Exam Mode (Full Mock vs. Topic Drill), Subjects Tested, Total Score (/400), Time Taken, and Action link to view the complete diagnostic breakdown at `/results/:resultId`.
8. **Voucher / CBT Key Management Card:**
   - Shows active activation key status and expiration info.
9. **Floating Falke AI Tutor Assistant (`<AiChatWidget />`):**
   - Persistent bottom-right floating trigger that opens a compact slide-over chat for quick study inquiries.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Subject Combination Modification Modal:**
  - Candidates can open a modal to reconfigure their 3 UTME electives (Use of English is locked as mandatory).
  - Validates that exactly 4 subjects are chosen before updating via `updateMe(...)`.
- **Focused Topic Drill Modal Flow:**
  - Select subject -> dynamically fetches all syllabus topics via `getSubjectTopics(subject)` -> choose difficulty (`easy`, `medium`, `hard`, `any`) -> pick question count (10, 20, 40) -> creates session via `createExamSession(...)` -> immediately launches `/exam/:sessionId`.
- **Automatic Diagnostics Computation:**
  - Aggregates data from `getTopicStats()` and `getResultsHistory()` on mount to calculate real-time readiness ratings without requiring manual refreshes.
- **Biometric / ID Copy:**
  - Instant clipboard copying of candidate Aurikrex ID and CBT voucher key with responsive feedback toasts.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Add New Metric Tile:**  
> *"In `StudentDashboard.tsx`, add a metric tile for 'Daily Study Streak' showing the number of consecutive days the candidate has practiced, with a fire flame icon."*

> **Improve Diagnostic Breakdown:**  
> *"In the subject breakdown section of `StudentDashboard.tsx`, add a mini radar chart comparing the student's accuracy against the national average for each subject."*

> **History Filter:**  
> *"Add a filter dropdown to the Recent Exam History table in `StudentDashboard.tsx` to toggle between 'All Tests', 'Full Mocks Only', and 'Topic Drills Only'."*
