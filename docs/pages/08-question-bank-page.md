# Page 08: Question Bank Explorer & Admin Authoring

- **Routes:**
  - Student Explorer: `/questions`
  - Admin Master Console: `/admin/questions`
- **Component File:** [`QuestionBankPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/features/questions/QuestionBankPage.tsx)
- **Access Level:** Protected (Candidates have read-only browse mode; Administrators unlock full CRUD, import, PDF scanner, and AI generator tabs)
- **Primary Layout:** Comprehensive multi-tab repository interface with search filters, question authoring form, bulk JSON/CSV importers, OCR PDF extraction terminal, and synthetic AI generator engine.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Tab Navigation (Dynamic based on user role):**
   - **Candidates:** Browse & Practice Search tab.
   - **Administrators:** Unlocks 6 dedicated tabs:
     1. `Browse & Manage` (Repository list)
     2. `Create Question` (Manual authoring)
     3. `Batch Import` (CSV/JSON upload)
     4. `PDF Scanner` (Automated past-question OCR)
     5. `AI Generator` (Synthetic question synthesizer)
     6. `Analytics & Stats` (Question bank distribution)
2. **Tab 1: Question Explorer & Browse:**
   - Search input for keywords, formulas, or topic names.
   - Filters: Subject dropdown (17 subjects), Difficulty rating (1 to 5 stars), Era/Year.
   - Paginated question list showing question stem with KaTeX formatting, options A-D, correct answer indicator, syllabus topic, and official explanation accordion.
3. **Tab 2: Manual Authoring Studio (`create`):**
   - Form fields: Subject, Syllabus Topic, Question Text (supports LaTeX syntax), Options A, B, C, D, Correct Option selector (A, B, C, D), Difficulty Level (1 to 5), Detailed Explanation, and Question Tags.
   - Live visual preview rendering equations and formatting in real time.
4. **Tab 3: Bulk Import Studio (`import`):**
   - Drag-and-drop file upload zone for JSON or CSV question files.
   - Dry-run validation engine that inspects uploaded rows for schema errors, missing correct options, or malformed LaTeX before committing to the database.
5. **Tab 4: Automated PDF Scanner & Extraction (`pdf_scanner`):**
   - File upload or directory path input to scan past JAMB UTME papers.
   - Live extraction terminal showing real-time scanning progress, OCR status, parsed questions count, and diagnostic extraction logs.
6. **Tab 5: Industrial AI Question Generator (`ai_generator`):**
   - Controls to synthesize high-quality UTME questions using AI:
     - Target Subject & Source Type: `Mixed Curriculum`, `Calculation with LaTeX`, `SVG Diagram Questions`, or `Comprehension Passages`.
     - Target Question Count (e.g., 500, 5,000, 30,000).
     - Live execution telemetry: Generated count in current job, diagram count, LaTeX formula count, active model status, and Stop/Start buttons.
7. **Tab 6: Bank Analytics & Statistics (`stats`):**
   - Visual breakdown of total questions across all 17 subjects, difficulty spread, diagram coverage, and syllabus topic distribution.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Student Study Mode (`/questions`):** Candidates can browse past questions topic-by-topic, practice specific concepts, and view instant explanations.
- **Admin Authoring & Moderation (`/admin/questions`):** Admins can edit existing questions, delete flawed questions, or manually add new questions to the syllabus.
- **Autonomous PDF Ingestion:** Scans directories of historical past question PDFs, automatically splitting questions, extracting diagrams, and saving structured questions.
- **AI Synthesis Pipeline:** Runs background AI question generation jobs using Gemini/DeepSeek models to expand the question bank with novel questions matching the 2025/2026 JAMB curriculum.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Question Editing Polish:**  
> *"In `QuestionBankPage.tsx`, add an inline edit modal for questions in the 'Browse' tab so admins can fix typos in question stems without deleting and re-creating them."*

> **Export Questions to CSV:**  
> *"Add an 'Export Filtered Questions' button in `QuestionBankPage.tsx` so admins can export selected subject questions as a CSV file."*

> **Diagram Upload Support:**  
> *"In the manual question creation form in `QuestionBankPage.tsx`, add an image upload button that converts uploaded diagrams into SVG or base64 format."*
