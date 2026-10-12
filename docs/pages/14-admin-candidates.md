# Page 14: Admin Candidate Directory & Moderation

- **Route:** `/admin/candidates`
- **Component File:** [`AdminCandidates.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/admin/AdminCandidates.tsx)
- **Access Level:** Staff (Admin or Super Admin only)
- **Primary Layout:** Searchable and filterable candidate directory table with moderation action modals, candidate detail drawer, and account status controls.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Top Command Header:**
   - Section Title: `Candidate Roster & Account Moderation`.
   - Total Candidate Count badge (e.g., `12,450 registered scholars`).
2. **Search & Filter Controls Bar:**
   - Text search input: Filter by Candidate Name, Email address, Phone number, or Aurikrex ID (`AKX-XXXXXX`).
   - Role Filter Dropdown: `All Roles`, `Students`, `Staff / Admins`.
   - Status Filter Dropdown: `All Statuses`, `Active`, `Suspended`.
3. **Candidate Directory Table:**
   - Columns:
     - Candidate Identity: Avatar, Full Name, Email.
     - Aurikrex ID with one-click copy button.
     - Phone Number.
     - Role Badge (`Student`, `Admin`, `Super Admin`).
     - Status Badge (`Active` in green vs. `Suspended` in rose).
     - Completed Mocks & XP points.
     - Actions: "View Profile" eye icon, "Suspend / Reactivate" shield icon.
4. **Candidate Inspection Modal:**
   - Detailed candidate dossier:
     - Registration Date, Last Login IP/Timestamp.
     - Assigned CBT Voucher Key.
     - 4-Subject UTME combination.
     - Average Mock Score and topic diagnostic history.
5. **Account Suspension Confirmation Modal:**
   - Safety dialog requiring admin confirmation before suspending or restoring student access.
6. **Pagination Navigation:**
   - Page switcher with items per page count (10, 25, 50).

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Asynchronous Search Debouncing:**
  - Performs debounced queries to `/admin/candidates?search=...&role=...&status=...&page=...` to ensure smooth performance over large databases.
- **Account Moderation:**
  - Admins can immediately suspend problematic accounts or reactivate suspended accounts via `updateCandidateStatus(userId, status)`.
- **Deep Inspection:**
  - Allows staff to verify whether a student actually paid, inspect their registered voucher key, and troubleshoot exam issues.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Export Candidate Roster:**  
> *"In `AdminCandidates.tsx`, add an 'Export Roster to Excel/CSV' button that exports the filtered candidate table with names, emails, phones, and average scores."*

> **Manual Password Reset:**  
> *"Add a 'Send Password Reset Link' action button inside the candidate detail modal in `AdminCandidates.tsx` so admins can assist locked-out students."*

> **Role Elevation Control:**  
> *"Add a role upgrade dropdown in the candidate detail modal in `AdminCandidates.tsx` allowing Super Admins to promote a user from Student to Admin."*
