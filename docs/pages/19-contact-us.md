# Page 19: Support Desk & Contact Inquiries

- **Route:** `/contact`
- **Component File:** [`ContactUs.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/ContactUs.tsx)
- **Access Level:** Public & Authenticated Candidates
- **Primary Layout:** Dual-pane support layout with direct communication channels (email, phone, center location) and structured inquiry form.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Hero Header (`<SupportHero />`):**
   - Title: *"Support when your study flow is interrupted."*
   - Description and support context icon.
2. **Left Column: Direct Channels:**
   - **Email Desk:** `info@aurikrex.com` (Official support inbox).
   - **Phone Support:** Operational hotline for urgent exam issues.
   - **Turnaround Notice:** "Inquiries answered within 24 hours during the UTME registration cycle."
   - **Safety Disclaimer:** Explicit reminder: *"Never share your password, CBT key, card number, or verification code in support requests."*
3. **Right Column: Structured Support Ticket Form:**
   - Inputs:
     - Full Name
     - Candidate Account Email
     - Inquiry Topic Dropdown:
       - `Account access or verification`
       - `CBT key activation issue`
       - `Billing, cancellation, or refund`
       - `Mock exam or drill error`
       - `Falke AI tutor inquiry`
       - `Technical issue / bug`
       - `Other inquiry`
     - Detailed Message textarea
   - Primary "Submit Ticket to Support Team" button.

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Mailto Pre-Formatting Engine:**
  - Upon submitting the form, it pre-compiles a standardized, formatted email body containing the candidate's name, email, selected category, and message, automatically launching the user's email client addressed directly to the support team.
- **Client Security Guidance:**
  - Prevents students from inadvertently posting sensitive banking info or passwords into message bodies.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Add Direct Backend Ticket API:**  
> *"In `ContactUs.tsx`, replace the mailto redirect with a direct POST request to `/api/support/tickets` so tickets are stored in the database, showing a ticket confirmation number."*

> **WhatsApp Support Button:**  
> *"Add a 'Chat with Support on WhatsApp' direct button in `ContactUs.tsx` with a pre-filled greeting message for Nigerian students."*
