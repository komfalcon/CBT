# Page 17: Admin Secure Access Gate

- **Route:** `/sys/auth-checkpoint`
- **Component File:** [`SecureAccess.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/admin/SecureAccess.tsx)
- **Access Level:** Public Security Gate (Restricted to Authorized Administrators)
- **Primary Layout:** Isolated, high-security crimson login terminal with ambient shield aesthetics, master credentials input, and mandatory Two-Factor OTP checkpoint.

---

## 1. What the Page Shows (UI Layout & Components)

1. **High-Security Ambient Layout:**
   - Dark background with glowing crimson alert ambient rings (`bg-red-500/10`).
   - Theme toggle in the top-right corner.
2. **Security Shield Emblem & Header:**
   - Pulsing `ShieldAlert` icon inside a red border card.
   - Title: `System Access — Authorized personnel only`.
3. **Step 1: Admin Credentials Form:**
   - Input: Admin Email (`placeholder="sysadmin@aurikrex.com"`).
   - Input: Master Password.
   - Primary Submit Button: "Authenticate Terminal".
4. **Step 2: Mandatory 2FA OTP Form (if MFA required):**
   - 6-digit numeric OTP field.
   - "Verify Security Code" button.
5. **Security Error / Rejection Banner:**
   - Strict red alert box displaying "Access Denied. This account does not have administrator privileges." if standard students attempt to sign in here.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Isolated Admin Ingestion Gate:**
  - Prevents mixing staff credentials with the standard student `/auth` route.
- **Strict Role Enforcement:**
  - Verifies that `response.user.role === 'admin'` or `'super_admin'`.
  - Rejects any standard candidate account and refuses entry into `/admin/*`.
- **MFA Challenge Handling:**
  - Automatically switches into OTP mode if the system administrator account has 2FA enabled, requiring the TOTP token before granting access cookies.
- **Redirection:**
  - On valid authentication, saves `user_role` and redirects directly to `/admin/overview`.

---

## 3. How to Prompt This Page

### Example Prompts:
> **IP Whitelisting Notice:**  
> *"In `SecureAccess.tsx`, add an info banner showing the current client IP address with a notice that all administrative access attempts are logged for security audits."*

> **Rate-Limit Visual Lockdown:**  
> *"Add a 30-second lockout countdown in `SecureAccess.tsx` if an invalid password is submitted more than 3 times consecutively."*
