# Page 12: Falke AI Curriculum Studio

- **Routes:**
  - Full AI Studio: `/falke-ai` & `/falke` ([`FalkeAiStudioPage.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/FalkeAiStudioPage.tsx))
  - Floating Widget: Persistent across student routes ([`AiChatWidget.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/features/ai/AiChatWidget.tsx))
- **Access Level:** Protected (Authenticated Candidate)
- **Primary Layout:** 3-column academic conversation layout with topic threads sidebar, active AI dialogue stream with KaTeX math rendering, dialect toggle, and curriculum quick-prompt chips.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Top Navigation (`<AppNavbar />`):**
   - Breadcrumb navigation: `Portal Home > Falke AI Curriculum Studio`.
2. **Left Sidebar: Threads & Telemetry:**
   - "New Study Session" primary button.
   - **Dialect Switcher Box:**
     - Toggle between **Standard Academic English** and **Nigerian Pidgin English** (`"No wahala! Make we solve am together"`).
   - Saved study conversations / historical question queries.
   - Offline cache indicator: Displays cache hits vs. real-time LLM responses.
3. **Center Main Dialogue Area:**
   - Chat message feed with distinct visual styles:
     - **Candidate Messages:** Right-aligned bubbles in surface accent colors.
     - **Falke AI Responses:** Left-aligned cards with avatar emblem, markdown formatting, step-by-step numbered logic, and LaTeX math formulas rendered with KaTeX.
   - Real-time thinking / loading spinner during generation.
   - Auto-scroll to latest response on new tokens.
4. **Bottom Chat Input Console:**
   - Multi-line text input with placeholder: *"Ask any past question, formula derivation, or concept..."*
   - Send button (`ArrowRight` / `Send` icon).
   - "Clear Session" icon button.
5. **Right Sidebar / Prompt Suggestion Chips:**
   - Suggested high-yield UTME topics for rapid inquiry:
     - *"Explain Le Chatelier’s principle in equilibrium"*
     - *"Derive the formula for time of flight in projectile motion"*
     - *"How do I identify vowel phonemes in Use of English?"*
     - *"Explain the difference between unitary and federal government systems"*

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Curriculum-Grounded Tutoring:**
  - Sends candidate prompts and full dialogue history to `chatWithTutor({ message, history })`.
  - Injects dialect-specific instructions into system prompts to ensure responses remain strictly accurate to the Nigerian JAMB UTME syllabus while matching the chosen dialect (Standard English vs. Nigerian Pidgin).
- **Offline & Cache Resilience:**
  - Automatically handles network failures or upstream LLM rate limits by falling back to curated local syllabus explanation caches with toast notifications.
- **Floating Companion Mode (`<AiChatWidget />`):**
  - Also available as a floating bottom-right drawer on the Dashboard, Question Bank, and Result Review pages, allowing students to consult Falke AI without interrupting their workflow.

---

## 3. How to Prompt This Page

### Example Prompts:
> **Add Image / Diagram Input:**  
> *"In `FalkeAiStudioPage.tsx`, add an image upload button next to the input so candidates can upload screenshots of past exam diagrams for Falke AI to analyze."*

> **Formula Cheat Sheet Generator:**  
> *"Add a prompt button in `FalkeAiStudioPage.tsx` labeled 'Generate Formula Sheet' that asks Falke AI to output all mandatory formulas for the candidate's chosen subject in a clean table."*

> **Voice / Audio Explanation:**  
> *"Add a Text-to-Speech (TTS) audio play button on Falke AI responses in `FalkeAiStudioPage.tsx` so students can listen to explanations being read out loud."*
