# Page 15: Admin Voucher & CBT Key Generation

- **Route:** `/admin/keys`
- **Component File:** [`AdminKeys.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/admin/AdminKeys.tsx)
- **Access Level:** Staff (Admin or Super Admin only)
- **Primary Layout:** Industrial batch voucher generator interface, generated keys export dialog, and searchable voucher allocation table.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Header & Summary Stats:**
   - Section Title: `CBT Activation Keys & Voucher Management`.
   - Metrics: Total Keys Issued, Activated Keys, Unused / Available Keys.
2. **Batch Key Generator Card:**
   - Quantity selector: Choose number of keys to generate in a single batch (e.g., 10, 50, 100, 500 keys).
   - "Generate Keys" primary button with spinner indicator.
3. **Generated Keys Presentation Modal:**
   - Displays newly minted keys in a monospace list (e.g., `AKX-9821-4401`, `AKX-3312-8874`).
   - "Copy All Keys to Clipboard" button.
   - "Download CSV for Printing" button (formats keys for scratch-card printing and cyber-café bulk sales).
4. **Voucher Directory & Search Table:**
   - Search input: Filter by Voucher Key string, Assigned Candidate Name, or Candidate Email.
   - Columns:
     - Activation Key (e.g., `AKX-XXXX-XXXX`)
     - Assigned Candidate (or `Unassigned / Unclaimed`)
     - Status Badge (`Activated` in emerald vs. `Pending / Unused` in amber)
     - Creation Date
     - Expiry / Validity window
5. **Pagination Controls:**
   - Page navigation and row counter.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Cryptographic Batch Voucher Minting:**
  - Invokes `generateCbtKeys(quantity)` which produces unique, collision-free activation vouchers formatted to the `AKX-` standard.
- **Physical Distribution Export:**
  - Generates downloadable CSV sheets ready for distribution to school administrators, tutorial centers, and cyber-café operators across Nigeria.
- **Voucher Audit Trail:**
  - Allows admins to search any scratch card number brought by a student to verify when it was generated, who redeemed it, and whether it has been compromised.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Batch Tagging / Batch Name:**  
> *"In `AdminKeys.tsx`, add a 'Batch Tag / School Name' input field (e.g., 'King's College Lagos - Batch 1') when generating keys so admins can track which school received which batch."*

> **Revoke / Invalidate Key:**  
> *"Add a 'Revoke Key' action button in `AdminKeys.tsx` for unused vouchers in case a batch of printed scratch cards is reported lost or stolen."*

> **Custom Expiry Date:**  
> *"Add an expiry date picker in `AdminKeys.tsx` allowing admins to set whether a batch of keys expires in 30 days, 90 days, or stays valid indefinitely."*
