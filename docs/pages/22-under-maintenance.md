# Page 22: System Under Maintenance Screen

- **Route:** Global Interceptor / Barrier (Active across all public and student routes when maintenance mode is engaged)
- **Component File:** [`UnderMaintenance.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/UnderMaintenance.tsx)
- **Access Level:** System Barrier (Visible to all non-admin visitors)
- **Primary Layout:** Atmospheric full-screen maintenance barrier with ambient warm amber glows, status indicators, and live retry button.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Header:**
   - Aurikrex Exam Arena logo emblem.
   - Status badge: `Maintenance Mode — Scheduled Upgrades`.
   - Pulsing amber live beacon.
2. **Main Center Terminal:**
   - Visual icon: Wrench & Shield icon inside an amber gradient circle.
   - Headline: *"Platform Upgrades Underway"*.
   - Subtitle: Explains that engineers are performing core updates to the question bank, syllabus sync, or server infrastructure.
   - Estimated Resolution Notice: Encourages candidates to take a short study break and check back shortly.
3. **Interactive "Check System Status" Button:**
   - Action button with spinning refresh icon (`RefreshCw`).
   - Clicking sends a live request to the backend to check if maintenance has ended.
   - Displays real-time message:
     - If still in maintenance: *"Maintenance is still underway. Please check back shortly."*
     - If back online: *"Platform is back online! Redirecting..."* with automatic page reload.
4. **Staff / Admin Bypass Link:**
   - Discrete link in footer: `Staff Access Checkpoint` routing directly to `/sys/auth-checkpoint`.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Global Barrier Interceptor:**
  - Evaluated in `App.tsx` on every route change:
    - If `isMaintenance === true`, and user is not an admin (`user_role !== 'admin'`), and route does not start with `/admin` or `/sys/auth-checkpoint`, this screen completely replaces the router.
- **Automated Heartbeat Polling:**
  - Background polling in `App.tsx` checks `/system/maintenance-status` every 15 seconds. If the admin turns maintenance off, users are seamlessly restored without having to restart their browser.
- **Zero Data Corruption:**
  - Blocks candidates from starting or submitting exam sessions while database migrations or schema adjustments are in progress.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Add Countdown Timer:**  
> *"In `UnderMaintenance.tsx`, add an optional estimated downtime countdown timer (e.g., 'Expected back online in 15 minutes')."*

> **Twitter / Telegram Status Link:**  
> *"Add a 'Check Live Server Status on Telegram/X' button in `UnderMaintenance.tsx` so students can follow maintenance updates in real time."*
