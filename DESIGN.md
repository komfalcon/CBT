# Aurikrex Exam Arena — Official Design & UI/UX Specification (`DESIGN.md`)

> **Source of Truth**: Derived strictly from repository code, database schemas, styling tokens, and routes in `C:\Users\DELL\AURIKEX\CBT`.  
> **Status**: Production Reference  
> **Target Platform**: Nigerian JAMB UTME Computer-Based Test (CBT) Preparation Platform

---

## 1. Product Identity & Purpose

| Attribute | Specification | Source in Codebase |
| :--- | :--- | :--- |
| **Product Name** | `Aurikrex Exam Arena` | `frontend/index.html`, `README.md` |
| **Parent Brand** | `Aurikrex` (Badge: *"by Aurikrex"* / *"A product of Aurikrex"*) | `LandingPage.tsx`, `SupportPageShell.tsx` |
| **Domain** | `https://cbt.aurikrex.com` | `frontend/index.html`, `backend/src/main.ts` |
| **Target Audience** | Nigerian candidates preparing for the Joint Admissions and Matriculation Board (JAMB) Unified Tertiary Matriculation Examination (UTME). | `README.md`, `index.html` |
| **Primary Tagline** | *"Practice with purpose. Score with confidence."* | `LandingPage.tsx` L290 |
| **Secondary Kicker** | *"Nigeria's focused UTME practice platform"* | `LandingPage.tsx` L289 |
| **Founder Attribution**| `Omotosho Korede Samuel` | `LandingPage.tsx` L354 |
| **Support Desk** | `info@aurikrex.com` / `+234 911 368 3395` / `www.aurikrex.com` | `LandingPage.tsx`, `ContactUs.tsx` |

---

## 2. Dominant Features & Native Product Shape

### Primary Feature: Official 4-Subject Timed UTME Simulation
The product’s native shape is organized around the official JAMB exam session, not generic quizzes:
* **Session Duration**: 120 minutes (`02:00:00` countdown timer, auto-submits on `00:00:00`).
* **Subject Composition**: Exactly 4 subjects:
  1. **Use of English** (Compulsory): 60 questions (Comprehension, Lexis, Structure, Oral forms).
  2. **3 Elective Subjects**: 40 questions each (e.g., Mathematics, Physics, Chemistry).
  3. **Total Questions**: 180 questions (`totalScore` calculated out of 400).
* **Question Grid Palette**: Split into tabs by subject:
  * English: Numbers 1 through 60.
  * Electives: Numbers 1 through 40.
  * Palette States:
    * `Answered`: Emerald badge (`bg-emerald-500` / `#34d399`)
    * `Current / Active`: Primary Accent Blue (`bg-blue-600` / `#5b72ff`)
    * `Unanswered`: Muted Slate (`bg-slate-300` / `border-white/10`)
* **Hardware & Center Access**: Supports offline/cyber-cafe candidates using access keys (`CBT Key`).

### Secondary Feature: Shared AI Explanation Cache & Falke AI
* **Falke AI Study Assistant**: Curriculum-aligned AI tutor capable of explaining problems in simple English and Nigerian Pidgin across all 17 JAMB subjects.
* **Explanation Cache Engine** (`backend/src/ai/explanation-cache.service.ts`):
  * Normalized SHA-256 hash of question text, options, answer key, and LaTeX/diagrams.
  * Cache hits cost **0 Auri Coins** and return instantaneously without calling AI providers.
  * Cache misses consume **5 Auri Coins** from the candidate's monthly allowance.
  * Candidate report threshold: 3 deduplicated reports automatically flags an explanation for regeneration.

---

## 3. Real Vocabulary & Microcopy (Zero Placeholder)

All copy, labels, and notices must be drawn directly from the codebase:

### System & Authentication Terms
* **`Aurikrex ID`** (`AKX-XXXXXX`): Universal identity string linking CBT to Library, Bytes, and Central.
* **`CBT Key`**: A 256-bit hashed access key for cyber-cafe and school computer lab logins without entering personal email passwords.
* **`Auri Coins`**: Universal platform currency (5,000 monthly allowance for active students, displayed in `AuriCoinBadge`).
* **`JAMB Reg Number`**: `jamb_reg_no` field for official validation.

### Public Beta Copy & Guarantees
* **Badge**: *"Public Beta — Free Launch Access"*
* **Headline**: *"100% Free Full Access for Every Candidate."*
* **Guarantee**: *"No payment required. No hidden fees. All full mocks, topic drills, and 20 daily Falke AI messages are completely free during public beta."*
* **Target Benchmark**: *"Build the confidence to score 300+."*

### Verified Quantometrics
* `1,000,000+` Practice questions in database
* `17` JAMB subjects covered
* `100,000+` Students enrolled
* `300+` Average score boost
* `10` Daily full mocks during Beta

---

## 4. Visual Identity & Design System Tokens

Extracted directly from `frontend/src/index.css` and `frontend/tailwind.config.ts`.

### Typography Hierarchy
```css
--font-display: 'Sora', system-ui, sans-serif;       /* Section headings, stat numbers, modal titles */
--font-body:    'Inter', system-ui, sans-serif;      /* Question text, options, body copy, explanations */
--font-mono:    'JetBrains Mono', monospace;         /* Exam countdown timer, CBT Keys, Aurikrex IDs */
```

### Color Palette & Theme Tokens
The interface requires full dual-theme support. **Never hardcode raw `#000000` or `#ffffff`**.

| Semantic Token | Dark Mode (`:root` / default) | Light Mode (`[data-theme='light']`) | Usage |
| :--- | :--- | :--- | :--- |
| `--color-bg-primary` | `#08101f` | `#f7f8fa` | Global page background |
| `--color-bg-secondary`| `#0d172b` | `#eef1f5` | Section bands, toolbars, sidebars |
| `--color-bg-card` | `#111d34` | `#ffffff` | Question cards, modals, preview tiles |
| `--color-text-primary`| `#f8fbff` | `#101828` | Main headings, question titles |
| `--color-text-secondary`|`#a9b7cc` | `#475467` | Option text, body paragraphs |
| `--color-text-muted` | `#74839c` | `#526176` | Question metadata, timing details |
| `--color-border` | `rgba(156, 172, 201, 0.14)` | `rgba(16, 24, 40, 0.14)` | Card borders, dividers |
| `--color-border-hover`| `rgba(140, 163, 219, 0.42)` | `rgba(52, 84, 220, 0.38)` | Active input, focused option |
| `--color-accent-primary`|`#5b72ff` | `#3454dc` | Primary CTA, current question |
| `--color-accent-info` | `#38bdf8` | `#0369a1` | Progress bars, topic tags |
| `--color-accent-ai-flag`|`#d7b35c` | `#8a5a00` | Falke AI tutor badge / gold tier |
| `--color-accent-streak` |`#fb7185` | `#be123c` | Streak counter, urgent timer (<5m) |
| `--color-success` | `#34d399` | `#087443` | Correct answer, completed questions |
| `--color-error` | `#fb7185` | `#b42318` | Incorrect answer, validation alert |
| `--color-warning` | `#fbbf24` | `#8a5a00` | Warning, beta announcement badge |

### Spatial & Shape Radii
* **Pills / Status Chips**: `rounded-full` (`--radius-pill: 999px`)
* **Inputs & Controls**: `rounded-lg` (`--radius-md: 10px`) or `rounded-xl`
* **Cards & Containers**: `rounded-2xl` (`--radius-xl: 22px`)
* **Grid Spacing**: 4px base (`--space-1: 4px` to `--space-10: 96px`)

---

## 5. Verified Subject Catalog (17 JAMB UTME Subjects)

Derived from `backend/src/questions/types/question.types.ts` and `LandingPage.tsx`:

### Compulsory Subject
1. **Use of English** (`english`) — 60 questions. Topics: *Comprehension, Lexis, Structure, Oral Forms*.

### Technical Electives (40 questions each)
2. **Mathematics** (`mathematics`) — *Algebra, Calculus, Statistics*
3. **Physics** (`physics`) — *Mechanics, Waves, Electromagnetism*
4. **Chemistry** (`chemistry`) — *Organic, Inorganic, Physical*
5. **Biology** (`biology`) — *Anatomy, Ecology, Genetics*
6. **Geography** (`geography`) — *Physical, Human, Map Reading*
7. **Economics** (`economics`) — *Micro, Macro, Development*
8. **Accounting** (`accounting`) — *Bookkeeping, Financial Statements*
9. **Agricultural Science** (`agriculture`) — *Agronomy, Livestock, Forestry*
10. **Further Mathematics** (`further_mathematics`) — *Mechanics, Pure Maths, Stats*

### Non-Technical Electives (40 questions each)
11. **Government** (`government`) — *Constitution, Political Theory*
12. **Literature in English** (`literature`) — *Drama, Prose, Poetry*
13. **Commerce** (`commerce`) — *Trade, Banking, Insurance*
14. **Civic Education** (`civic_education`) — *Values, Rights, Governance*
15. **Christian Religious Knowledge** (`crk`) — *Themes, Epistles, Gospels*
16. **Islamic Religious Knowledge** (`irk`) — *Quran, Hadith, Fiqh*
17. **History** (`history`) — *Pre-Colonial, Colonial, Modern*

---

## 6. Page Architecture & Layout Standards

```
Route Architecture:
├── /                     → LandingPage (Marketing, Preview Simulator, Pricing)
├── /arena                → ExamArenaLanding (Practice modes, direct launch)
├── /auth                 → AuthPage (Login with Email/Google/CBT Key, Register)
├── /dashboard            → StudentDashboard (Readiness score, stats, streak, subject combo)
├── /mock-setup           → MockSetupPage (Select subjects, time limits, mode)
├── /exam/:sessionId      → ExamConsole (Full simulation screen)
├── /results/:resultId    → ResultReview (Scorecard, subject breakdown, Falke AI review)
├── /leaderboard          → Leaderboard (XP, mock performance rankings)
├── /questions            → QuestionBankPage (Topic exploration, practice drills)
├── /study                → StudyHub (Syllabus checklist, timetable)
└── /admin/*              → AdminLayout (Questions, Candidates, Billing, Keys)
```

### 1. Persistent Ecosystem Top Bar
Every authenticated and marketing page must maintain the universal top bar:
* **Brand Mark**: Favicon icon (`/favicon.svg`) + `Aurikrex Exam Arena` in `font-display`.
* **AuriCoin Badge (`AuriCoinBadge`)**: Displays coin count (e.g., `5,000 Coins`). Listens to `aurikrex:coins-updated` events for real-time balance updates.
* **Ecosystem Switcher (`AurikrexAppsSwitcher`)**: Seamless jumping between `CBT`, `Library`, `Bytes`, and `Vault`.
* **Theme Toggle (`ThemeToggle`)**: Transitions between Dark (`#08101f`) and Light (`#f7f8fa`).
* **Profile / CBT Key Indicator**: Candidate name, Aurikrex ID badge, and Logout button.

### 2. Candidate Dashboard Pattern (`/dashboard`)
* **Hero Banner**: Candidate greeting, Level, XP points, and Study Streak (`streak_count` with flame icon).
* **UTME Readiness Score**: Calculated 0–100% dial based on recent mock exam averages.
* **Subject Combination Widget**: Displays candidate's 4 registered subjects. Enforces that *Use of English* is never removed.
* **Diagnostic Breakdown**: Horizontal accuracy bars by subject and lowest-accuracy topic recommendation (*"Your next weak topic"*).
* **Action Grid**:
  * *Launch Full Mock* (`/mock-setup`)
  * *Targeted Drill* (Custom modal: Subject, Topic, Difficulty 1–5, Question Count)
  * *Study Syllabus Tracker* (`/study`)
  * *Leaderboard Standings* (`/leaderboard`)

### 3. Exam Console Pattern (`/exam/:sessionId`)
* **Header Bar**:
  * Active subject tabs with badges indicating answered counts (e.g., `English (42/60)`, `Mathematics (28/40)`).
  * Center countdown timer formatted in `font-mono` (`01:42:18`). Changes to `--color-accent-streak` under 5 minutes.
  * Submit Exam button with confirmation modal (reports count of unanswered questions).
* **Question Display Panel**:
  * Question index and mark allocation (*"Question 12 of 60 · 1 mark"*).
  * Topic tag pill (*"Comprehension"*, *"Mechanics"*).
  * High-fidelity question body supporting LaTeX math via KaTeX and SVG diagrams / TikZ.
  * Option cards `A`, `B`, `C`, `D` with keyboard shortcuts (`A`, `B`, `C`, `D`, `P` for previous, `N` for next).
* **Right Sidebar Question Palette**:
  * 4-column numerical grid.
  * Live status legend: Answered (Green), Current (Blue), Unanswered (Gray).
  * Auto-save indicator: *"Exam integrity: Your progress is saved automatically"*.

---

## 7. Component Guardrails & Anti-Patterns

1. **No Artificial Placeholders**: Never invent fake subjects (e.g. "Science 101"), fake test names, or dummy testimonials. Always use the 17 official JAMB subjects and verified platform copy.
2. **Strict Dual-Theme Adherence**: All surfaces must dynamically inherit from CSS variables. Never apply hardcoded background classes like `bg-black`, `bg-slate-900`, or `bg-white` without semantic wrappers (`bg-bg-primary`, `bg-bg-card`, etc.).
3. **Combination Integrity**: Enforce that any UTME combination generated or displayed contains **English** as subject 1, followed by 3 unique approved electives.
4. **Zero-Downtime Coin Event Dispatch**: Every AI action or explanation view must dispatch window event `aurikrex:coins-updated` with `{ remainingCoins, nextResetDate }` to keep the persistent top bar in sync without refreshing the page.
