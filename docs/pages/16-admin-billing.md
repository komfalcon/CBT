# Page 16: Admin Billing Ledger & Revenue Audit

- **Route:** `/admin/billing`
- **Component File:** [`AdminBilling.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/admin/AdminBilling.tsx)
- **Access Level:** Staff (Admin or Super Admin only)
- **Primary Layout:** Financial audit ledger interface with revenue summary metrics, transaction search, status badges, and transaction detail inspection.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Header & Summary Tiles:**
   - Section Title: `Billing Ledger & Financial Audit`.
   - Total Gross Revenue processed (in Nigerian Naira ₦).
   - Total Successful Transactions vs. Failed Checkouts.
2. **Transaction Search Bar:**
   - Filter by Paystack Payment Reference (e.g., `trx_akx_20250912`), Candidate Email, or Amount.
3. **Billing Transactions Table:**
   - Columns:
     - Payment Reference ID (with click-to-copy button).
     - Candidate Details (Full Name and Account Email).
     - Amount Paid (Formatted in Naira, e.g., `₦2,500.00`).
     - Gateway / Channel (`Paystack Card`, `Bank Transfer`, `CBT Voucher Code`).
     - Transaction Status (`Successful` in green, `Failed` in red, `Pending` in amber).
     - Timestamp (Formatted Date & Time).
4. **Transaction Detail Modal / Drawer:**
   - Breakdown of gateway metadata, customer IP, invoice ID, and purchased plan tier (Plus, Pro, Max).
5. **Pagination Controls:**
   - Page navigation (10 items per page) with total transaction count.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Financial Audit Reconciliation:**
  - Queries `getBillingLedger({ page, limit })` to pull confirmed payments from the billing microservice.
- **Support Dispute Resolution:**
  - Enables administrators to quickly locate a student's Paystack reference when they submit support tickets claiming their account did not unlock after payment.
- **Copy Metadata:**
  - One-click copy for reference IDs and candidate emails.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Export Financial Audit Report:**  
> *"In `AdminBilling.tsx`, add an 'Export Ledger to CSV' button allowing finance teams to download the complete transaction ledger for monthly tax reporting."*

> **Manual Payment Activation:**  
> *"Add a 'Manually Resolve / Activate' action in `AdminBilling.tsx` for pending transactions where the bank debited the student but the webhook timed out."*

> **Date Range Filter:**  
> *"Add date picker filters (Start Date & End Date) in `AdminBilling.tsx` to view revenue generated in a specific month or week."*
