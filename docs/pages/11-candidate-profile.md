# Page 11: Candidate Biometric Profile & Security

- **Routes:** `/profile` & `/settings`
- **Component File:** [`CandidateProfilePage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/CandidateProfilePage.tsx)
- **Access Level:** Protected (Authenticated Candidate)
- **Primary Layout:** Comprehensive candidate account portal with identity hero banner, navigation tabs, biometric details form, subject combination manager, voucher key manager, and security settings panel.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Top Navigation (`<AppNavbar />`):**
   - Breadcrumb navigation: `Portal Home > Candidate Profile & Account > Identity & Settings`.
2. **Profile Hero Bento Card:**
   - Candidate initials avatar with verified center badge (`Biometrically Verified at CBT Testing Center`).
   - Candidate Full Name, primary email address, permanent Aurikrex ID (`AKX-XXXXXX`), and live sync status with the national JAMB portal.
3. **Account Tabs Bar:**
   - `Candidate Bio & JAMB Details`
   - `UTME Subject Combination`
   - `CBT Voucher Key`
   - `Security & Two-Factor Auth`
4. **Tab 1: Candidate Bio & JAMB Profile:**
   - Editable fields: Full Legal Name, Email Address, Contact Phone Number.
   - Official JAMB Registration Number field (e.g., `202510984210EF`).
   - Designated CBT Examination Center & Geopolitical Zone dropdown (e.g., `Lagos Center — Mainland Zone`).
   - "Save Biometric Profile" action button.
5. **Tab 2: UTME Subject Combination Manager:**
   - Displays the candidate's active 4-subject combination.
   - Allows updating the 3 electives with instant validation.
6. **Tab 3: CBT Key Management:**
   - Active voucher key display with masked/unmasked toggle and instant clipboard copy button.
   - Status badge: `Active — Unlimited Mocks Unlocked`.
7. **Tab 4: Security Settings (`<SecuritySettings />`):**
   - Password update form (Current Password, New Password, Confirm Password).
   - **Two-Factor Authentication (2FA / TOTP):** Enable/disable authenticator app integration with QR code modal.
   - **Passkeys / WebAuthn:** Biometric login setup (Fingerprint, FaceID, Windows Hello).
   - **Active Sessions Directory:** View active logged-in devices and IP locations with one-click "Revoke All Other Sessions" button.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Biometric Identity Updates:** Submits candidate profile changes to `updateMe({ fullName, phone, ... })` and displays toast notifications upon success.
- **Voucher Key & ID Copy:** One-click copying to clipboard formatted specifically for cyber-café terminal entry.
- **Enterprise Security Management:** Interacts with MFA and session revocation endpoints, allowing students to protect their accounts against credential theft on public cafe computers.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Target Institution & Course Fields:**  
> *"In `CandidateProfilePage.tsx`, add input fields for 'First Choice University' and 'Target Course of Study' (e.g., Computer Science, Medicine) with cut-off mark recommendations."*

> **Profile Picture Upload:**  
> *"Add an avatar photo upload button in `CandidateProfilePage.tsx` that lets candidates upload a passport photo matching JAMB photo specifications."*

> **Download Candidate Exam Slip:**  
> *"Add a 'Print Exam Registration Slip' button on `CandidateProfilePage.tsx` that generates a clean printable summary of the candidate's bio, subjects, and center."*
