# Page 10: Curriculum Mastery Tracker & Timetable

- **Routes:**
  - Syllabus Tracker: `/study` & `/syllabus` ([`SyllabusTrackerPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/SyllabusTrackerPage.tsx))
  - Study Timetable & Hub: `/exam-hub` ([`ExamHub.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/ExamHub.tsx))
- **Access Level:** Protected (Authenticated Candidate)
- **Primary Layout:** Comprehensive curriculum coverage matrix with subject selectors, topic mastery progress gauges, quick drill dispatchers, and weekly study revision planner.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Top Navigation (`<AppNavbar />`):**
   - Breadcrumb navigation: `Portal Home > Official JAMB Syllabus & Study Timetable`.
2. **Subject Switcher Tabs:**
   - Tabs for Use of English and all 16 electives.
   - Shows overall subject mastery percentage (e.g., `Physics: 68% Mastered`).
3. **Topic Mastery Breakdown Matrix:**
   - Exhaustive breakdown of official JAMB UTME syllabus modules for the active subject (e.g., in Physics: *Kinematics*, *Work Energy Power*, *Waves & Sound*, *Electromagnetism*, *Radioactivity*, etc.).
   - Visual Topic Status Badges:
     - 🟢 **Mastered:** Accuracy >= 75% across past drills.
     - 🟡 **In Progress:** Accuracy between 50% and 74%.
     - 🔴 **Deficit Zone:** Accuracy < 50% (flagged for immediate review).
     - ⚪ **Unattempted:** 0 completed questions in this module.
   - Accuracy progress bar and total questions attempted counter for each topic.
   - "Launch Topic Drill" direct action button on every topic row.
4. **Weekly Study Timetable & Revision Planner (`ExamHub.tsx`):**
   - Calendar / timetable view dividing the candidate's 4 UTME subjects across days of the week (Monday through Sunday).
   - Study Session cards with start and end times, assigned topic, and completion checkmarks.
   - "Add Scheduled Session" modal to customize study routines leading up to exam day.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Curriculum-Grounded Diagnostics:**
  - Compares the candidate's actual mock and drill history against the official syllabus requirements, converting raw test attempts into a clear syllabus completion map.
- **One-Click Topic Drill Generation:**
  - Clicking "Launch Drill" on any specific syllabus topic instantly configures and creates a focused practice session targeting only that topic, routing directly to the exam console.
- **Topic Completion Toggle:**
  - Students can manually check off topics as they complete textbook reading, syncing with `/study/syllabus/:subject/topic`.
- **Scheduled Study Planning:**
  - Supports adding study blocks with subject, topic, and scheduled time window, persisted to `/study/timetable`.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Add Syllabus Search:**  
> *"In `SyllabusTrackerPage.tsx`, add a search bar at the top allowing students to search for any topic or subtopic keyword across all subjects."*

> **Study Notes / Summaries:**  
> *"In `SyllabusTrackerPage.tsx`, add an 'Official Syllabus Note' dropdown button on each topic that shows key formulas and definitions required by JAMB."*

> **Timetable Notification Reminder:**  
> *"In `ExamHub.tsx`, add a toggle allowing students to enable browser push notifications 15 minutes before a scheduled study session begins."*
