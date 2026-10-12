# Page 03: Unified Authentication & Key Gateway

- **Route:** `/auth` (Supports URL params: `?mode=login`, `?mode=register`, `?mode=cbt_key&key=...`, `?mode=reset-password&token=...`)
- **Component File:** [`AuthPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/features/auth/AuthPage.tsx)
- **Access Level:** Public / Guest (Redirects to `/dashboard` upon successful session establishment)
- **Primary Layout:** Centered dual-column authentication card with responsive ambient gradients, feedback banners, and mode switchers.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Brand Identity Header:**
   - Circular emblem logo, "Aurikrex Exam Arena" headline, subtext, and ThemeToggle in the top corner.
2. **Dynamic Auth Mode Tabs:**
   - Segmented tab bar allowing instant switching between:
     - **CBT Key Access** (Default recommended entry for Nigerian cyber-café & scratch card candidates).
     - **Sign In** (Email + Password).
     - **Register** (New candidate biometric profile creation).
3. **Form 1: CBT Key Access (`mode: 'cbt-key-login'`):**
   - Single input field for 12 to 16-character alphanumeric voucher code (e.g., `AKX-9821-4401`).
   - Information callout explaining that the CBT Key unlocks unlimited mocks without requiring credit cards or initial passwords.
   - "Activate & Enter Portal" submit button.
4. **Form 2: Standard Sign In (`mode: 'login'`):**
   - Inputs: Email address, Password (with toggleable show/hide eye icon).
   - "Forgot Password?" trigger link.
   - Primary "Sign In to Candidate Dashboard" button.
   - Divider line with Google Sign-In GIS button (`#google-signin-btn`).
5. **Form 3: Candidate Registration (`mode: 'register'`):**
   - Inputs: Full Name, Email Address, Phone Number (optional for SMS alerts), Password, Confirm Password.
   - Password strength guidelines (min 8 chars, uppercase, number, symbol).
   - "Create Candidate Profile" submit button.
   - Automatic routing to email verification step.
6. **Form 4: Email Verification OTP (`mode: 'verify-email'`):**
   - Displays the candidate's email address.
   - 6-digit OTP code input field.
   - "Verify & Activate Account" button with "Resend Code" countdown timer.
7. **Form 5: Two-Factor Authentication (2FA / MFA) Modal:**
   - Triggered automatically when an account with 2FA enabled signs in.
   - Prompts for the 6-digit authenticator app code.
8. **Form 6 & 7: Forgot Password & Reset Password:**
   - Forgot: Email input to dispatch reset link.
   - Reset: New password & confirm password input, auto-reading `?token=` from the query parameter.
9. **Feedback & Alert Callouts:**
   - Integrated `<Alert />` component displaying error, warning, or success toasts.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **CBT Key Fast-Track:**
  - When candidates enter with a valid CBT voucher, the backend creates or binds the session immediately, issues access cookies/JWTs, and navigates straight to `/dashboard`.
- **Query Parameter Detection:**
  - Auto-switches modes based on URL query string (e.g., landing page CTA links to `/auth?mode=register` or `/auth?mode=cbt_key&key=AKX-ABC123`).
- **Google GIS OAuth Integration:**
  - Automatically loads and initializes Google Identity Services (`https://accounts.google.com/gsi/client`), renders the official dark/pill Google button, and submits JWT tokens to `/auth/google`.
- **Session & Role Persistence:**
  - Stores tokens in `localStorage` (`accessToken`, `token`, `user_role`) and supports HTTP-only cookie authentication.
- **Graceful Error Handling:**
  - Displays user-friendly error banners for invalid credentials, expired OTPs, already registered emails, or revoked CBT keys.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Add Social Provider:**  
> *"In `AuthPage.tsx`, add an optional 'Continue with Phone Number' SMS login mode alongside the CBT Key and Email options."*

> **Form Validation Polish:**  
> *"Enhance the client-side validation in `AuthPage.tsx` register form so the password field has a live strength meter (Weak / Medium / Strong) with color indicators."*

> **Auto-Format CBT Key:**  
> *"In `AuthPage.tsx`, auto-format the CBT Key input as the user types by automatically capitalizing letters and inserting hyphens every 4 characters."*
