# Aurikrex Exam Arena — Comprehensive UI & UX Page Catalog

This documentation directory contains exhaustive UI and UX reference files for **every single page and screen** in the Aurikrex Exam Arena codebase. Each page has its own dedicated file so you can review what it displays, understand what it does, and know exactly how to prompt changes for each page one-by-one.

---

## 🧭 Master Page Inventory & Architecture Map

| # | Route | Page Title / Role | Component File | Access Tier |
|---|---|---|---|---|
| **01** | `/` | [Public Beta Landing Page](./01-landing-page.md) | [`LandingPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/LandingPage.tsx) | Public |
| **02** | `/arena` | [Exam Arena Marketing Landing](./02-exam-arena-landing.md) | [`ExamArenaLanding.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/ExamArenaLanding.tsx) | Public |
| **03** | `/auth` | [Unified Authentication & Key Gateway](./03-auth-page.md) | [`AuthPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/features/auth/AuthPage.tsx) | Public / Guest |
| **04** | `/dashboard` | [Candidate Command Center & Dashboard](./04-student-dashboard.md) | [`StudentDashboard.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/StudentDashboard.tsx) | Protected (Candidate) |
| **05** | `/mock-setup` | [Mock Exam & Drill Configuration Wizard](./05-mock-setup-page.md) | [`MockSetupPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/MockSetupPage.tsx) | Protected (Candidate) |
| **06** | `/exam/:sessionId` | [JAMB UTME CBT Exam Simulation Console](./06-exam-console.md) | [`ExamConsole.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/features/exam/ExamConsole.tsx) | Protected (Candidate) |
| **07** | `/results/:resultId` | [Diagnostic Result Slip & Answer Review](./07-result-review.md) | [`ResultReview.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/features/results/ResultReview.tsx) | Protected (Candidate) |
| **08** | `/questions` | [Question Bank Explorer & Admin Authoring](./08-question-bank-page.md) | [`QuestionBankPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/features/questions/QuestionBankPage.tsx) | Protected / Admin |
| **09** | `/leaderboard` | [National Scholars Leaderboard & XP Ranks](./09-leaderboard.md) | [`Leaderboard.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/Leaderboard.tsx) | Protected (Candidate) |
| **10** | `/study`, `/syllabus`, `/exam-hub` | [Curriculum Mastery Tracker & Timetable](./10-syllabus-tracker-and-timetable.md) | [`SyllabusTrackerPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/SyllabusTrackerPage.tsx) / [`ExamHub.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/ExamHub.tsx) | Protected (Candidate) |
| **11** | `/profile`, `/settings` | [Candidate Biometric Profile & Security](./11-candidate-profile.md) | [`CandidateProfilePage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/CandidateProfilePage.tsx) | Protected (Candidate) |
| **12** | `/falke-ai`, `/falke` | [Falke AI Curriculum Studio](./12-falke-ai-studio.md) | [`FalkeAiStudioPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/FalkeAiStudioPage.tsx) / [`AiChatWidget.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/features/ai/AiChatWidget.tsx) | Protected (Candidate) |
| **13** | `/admin/overview` | [Admin Control Center Overview](./13-admin-overview.md) | [`AdminOverview.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/admin/AdminOverview.tsx) / [`AdminLayout.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/components/AdminLayout.tsx) | Admin / Super Admin |
| **14** | `/admin/candidates` | [Admin Candidate Directory & Moderation](./14-admin-candidates.md) | [`AdminCandidates.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/admin/AdminCandidates.tsx) | Admin / Super Admin |
| **15** | `/admin/keys` | [Admin Voucher & CBT Key Generation](./15-admin-keys.md) | [`AdminKeys.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/admin/AdminKeys.tsx) | Admin / Super Admin |
| **16** | `/admin/billing` | [Admin Billing Ledger & Revenue Audit](./16-admin-billing.md) | [`AdminBilling.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/admin/AdminBilling.tsx) | Admin / Super Admin |
| **17** | `/sys/auth-checkpoint` | [Admin Secure Access Gate](./17-secure-access-checkpoint.md) | [`SecureAccess.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/admin/SecureAccess.tsx) | Public Gate -> Staff |
| **18** | `/help` | [Help Center & FAQ Knowledgebase](./18-help-center.md) | [`HelpCenter.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/HelpCenter.tsx) | Public / Candidate |
| **19** | `/contact` | [Support Desk & Contact Inquiries](./19-contact-us.md) | [`ContactUs.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/ContactUs.tsx) | Public / Candidate |
| **20** | `/privacy` | [Privacy Policy & Data Protection](./20-privacy-policy.md) | [`PrivacyPolicy.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/PrivacyPolicy.tsx) | Public |
| **21** | `/terms` | [Terms of Service & Candidate Rules](./21-terms-of-service.md) | [`TermsOfService.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/TermsOfService.tsx) | Public |
| **22** | Global Barrier | [System Under Maintenance Screen](./22-under-maintenance.md) | [`UnderMaintenance.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/UnderMaintenance.tsx) | Automatic Gate |

---

## 🎨 Global UI/UX Foundations & Shared Layout Shells

All pages across the platform follow a unified design language configured in [`tailwind.config.ts`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/tailwind.config.ts) and [`ThemeContext.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/contexts/ThemeContext.tsx):

1. **Dual-Theme Support**: Dark mode default (`surface-container-lowest: #000e22`, `surface: #041428`, cyber-precision accents) with clean light mode counterpart (`#ffffff`, `#f8fafc`, `#f1f5f9`).
2. **Standard Accent Colors**:
   - Primary Accent: Royal Blue (`#3454dc` / `var(--color-accent-primary)`)
   - Secondary: Sky Blue (`#7bd0ff` / `var(--secondary)`)
   - Tertiary / Success: Emerald Green (`#45dfa4` / `var(--tertiary)`)
   - AI / Highlights: Warm Gold (`#d7b35c` / `var(--accent-ai-gold)`)
   - Warnings & Streaks: Amber (`#fbbf24`) & Rose (`#fb7185`)
3. **Core Shells**:
   - **Student Top Navigation (`<AppNavbar />`)**: Ecosystem switcher, breadcrumbs/title badge, AuriCoin XP badge, Dark/Light ThemeToggle, Candidate Initials avatar, logout modal.
   - **Admin Layout Shell (`<AdminLayout />`)**: Collapsible dark sidebar, master maintenance status indicator, admin initials, route headers.
   - **Support Shell (`<SupportPageShell />` & `<SupportHero />`)**: Clean prose presentation, category filter chips, search input, footer links.

---

## 💡 How to Prompt & Work Page-by-Page

When requesting changes to any page:
1. Refer to that page's specific reference file (e.g., `docs/pages/06-exam-console.md`).
2. Use the **Prompting Guide & Templates** section at the bottom of each file.
3. You can ask for UI layout tweaks, mobile optimizations, state persistence fixes, accessibility adjustments, or API enhancements with full context.
