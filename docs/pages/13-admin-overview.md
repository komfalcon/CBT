# Page 13: Admin Control Center Overview

- **Route:** `/admin/overview`
- **Component Files:** [`AdminOverview.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/admin/AdminOverview.tsx) wrapped in [`AdminLayout.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/components/AdminLayout.tsx)
- **Access Level:** Staff (Admin or Super Admin only)
- **Primary Layout:** Dual-pane administrative layout with left collapsible navigation sidebar, system status banner, maintenance gate modal, high-level KPI tiles, and quick control hub.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Admin Master Navigation Shell (`<AdminLayout />`):**
   - Left dark sidebar with links to:
     - `Overview` (`/admin/overview`)
     - `Candidates Directory` (`/admin/candidates`)
     - `Activation Keys` (`/admin/keys`)
     - `Billing Ledger` (`/admin/billing`)
     - `Question Bank` (`/admin/questions`)
   - Platform Maintenance Status pill (shows Green `Platform Live` or Amber `Maintenance Mode Active`).
   - Admin user initials avatar, role badge (`Super Admin` / `Admin`), and sign out button.
2. **System Maintenance Master Control Card:**
   - Visual toggle switch to enable or disable global maintenance mode.
   - Information banner showing last toggle timestamp.
   - Master Password Verification Modal: Required before changing maintenance state.
3. **Executive KPI Dashboard Cards:**
   - **Total Registered Candidates:** Aggregate student count with growth indicators.
   - **Active CBT Voucher Keys:** Number of currently activated and pending scratch cards.
   - **Gross Revenue (NGN):** Total platform earnings processed through Paystack and vouchers.
   - **Total Question Bank Assets:** Total active questions, diagram count, and LaTeX formulas.
   - **Mocks Completed Today:** Live telemetry showing exams submitted in the last 24 hours.
4. **Quick Navigation Command Hub:**
   - Action cards to quickly jump into candidate moderation, batch key generation, or AI question synthesis.
5. **System Health & Server Telemetry Panel:**
   - Server heartbeat indicator, API status, database latency, and background worker state.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Platform-Wide Maintenance Lock:**
  - When an admin toggles maintenance on (verified by master password), the backend updates `/system/maintenance-status`.
  - Non-admin student sessions across the country immediately switch to the [`UnderMaintenance.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/UnderMaintenance.tsx) screen, protecting against data corruption during server updates.
- **Role Verification & Route Protection:**
  - Guaranteed by `<AdminRoute>` which intercepts unauthorized candidates and redirects them to the checkpoint gate.
- **Periodic Telemetry Refresh:**
  - Auto-polls `getOverviewStats()` and `getMaintenanceStatus()` to keep live indicators accurate.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Real-Time Active Sessions:**  
> *"In `AdminOverview.tsx`, add a live counter showing the number of candidates currently taking an active exam session right now."*

> **Server Performance Chart:**  
> *"Add a mini line chart in `AdminOverview.tsx` showing daily exam completions over the last 14 days."*

> **Quick Broadcast Banner:**  
> *"Add an admin broadcast alert tool in `AdminOverview.tsx` that allows admins to publish an urgent announcement banner visible to all students on the dashboard."*
