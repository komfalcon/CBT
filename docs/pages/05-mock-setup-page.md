# Page 05: Mock Exam & Drill Configuration Wizard

- **Route:** `/mock-setup`
- **Component File:** [`MockSetupPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/MockSetupPage.tsx)
- **Access Level:** Protected (Authenticated Candidate)
- **Primary Layout:** Multi-step wizard interface with combination presets, topic selection accordions, difficulty tuning, and instant launch button.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Header & Navigation (`<AppNavbar />`):**
   - Breadcrumb navigation: `Candidate Command Center > Mock Setup Wizard`.
2. **Preset Combination Quick-Select Bar:**
   - One-click buttons for popular Nigerian university degree subject combinations:
     - **Engineering & Tech:** English, Mathematics, Physics, Chemistry
     - **Medicine & Life Sciences:** English, Biology, Chemistry, Physics
     - **Social Sciences / Admin:** English, Economics, Government, Mathematics
     - **Arts & Humanities:** English, Literature, Government, CRK/IRK
3. **Interactive 4-Subject Picker Matrix:**
   - Grid of all 17 JAMB UTME subjects.
   - **Use of English** is permanently locked and badged as "Mandatory · 60 Questions".
   - Candidates pick exactly 3 electives (40 Questions each) for a standard 180-question mock.
   - Live visual counter: `Selected: 4 / 4 Subjects`.
4. **Exam Mode Selector:**
   - **Full Standard Mock Exam:** 180 questions, 120-minute timer, full UTME simulation across all 4 subjects.
   - **Deficit Repair Drill:** Focused practice session targeting diagnosed weak topics with custom question limits.
5. **Difficulty Calibration Toggle:**
   - Choices: `Any (Curriculum Standard)` | `Foundational (Easy)` | `Moderate (Medium)` | `Challenging (Hard)`.
6. **Per-Subject Topic Sampling Controls:**
   - Accordion for each selected subject allowing candidates to toggle between:
     - **Random Syllabus Sampling:** Balanced draw across all syllabus modules.
     - **Specific Topic Focus:** Checkboxes for individual syllabus topics (e.g., Selecting only *Calculus* and *Trigonometry* in Mathematics).
7. **Session Summary Card & Launch Button:**
   - Overview panel displaying:
     - Total Questions (180 Qs)
     - Time Allocated (2 hours / 120 mins)
     - Selected Subjects breakdown
   - Large primary "Initialize Exam Session" button with loader state.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Combination Validation:** Enforces the strict rule that candidates must select Use of English plus exactly 3 electives before the launch button is enabled.
- **Dynamic Topic Fetching:** As subjects are toggled, the page asynchronously fetches all active syllabus topics and question counts for that subject using `getSubjectTopics(subject)`.
- **Session Generation API Call:**
  - Upon clicking "Initialize Exam Session", it dispatches `createExamSession({ subjects, mode, difficulty, subjectConfigs })`.
  - Backend pulls randomized questions matching the exact criteria and builds a secure session.
  - Returns `sessionId` and navigates immediately to `/exam/${sessionId}`.
- **Toast Notifications:** Displays feedback when users attempt to deselect English or select more than 4 subjects.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Preset Addition:**  
> *"In `MockSetupPage.tsx`, add a new preset button for 'Law & Legal Studies' (English, Literature, Government, and CRK/IRK). "*

> **Timer Customization for Practice:**  
> *"Add an optional practice timer mode in `MockSetupPage.tsx` where students can choose 'Untimed Practice' or '1.5x Extended Time (180 mins)' for learning mode."*

> **Save Default Combination:**  
> *"Add a checkbox in `MockSetupPage.tsx` labeled 'Save as my default combination' that updates the candidate's profile so they don't have to re-select subjects each time."*
