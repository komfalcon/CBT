# Page 09: National Scholars Leaderboard & XP Ranks

- **Route:** `/leaderboard`
- **Component File:** [`Leaderboard.tsx`](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/frontend/src/pages/Leaderboard.tsx)
- **Access Level:** Protected (Authenticated Candidate)
- **Primary Layout:** Gamified national leaderboard interface with Top 3 Podium showcase, candidate rank banner, leaderboard tabs, search filter, and full scholar rankings table.

---

## 1. What the Page Shows (UI Layout & Components)

1. **Header Navigation (`<AppNavbar />`):**
   - Breadcrumb navigation: `Portal Home > National Scholars Leaderboard`.
2. **Personal Standing Sticky Banner:**
   - Displays the logged-in candidate's current national rank (e.g., `#14 National Ranking`), active level badge, total AuriCoin XP points, daily practice streak count, and points needed to reach the next tier.
3. **Top 3 National Podium Showcase:**
   - Visual 1st, 2nd, and 3rd place podium:
     - **1st Place (Gold Crown):** Scholar Name, Avatar, Level, State/Zone, Subject combination, and total XP.
     - **2nd Place (Silver Medal):** Runner-up stats and badge.
     - **3rd Place (Bronze Medal):** Third position scholar details.
4. **Leaderboard Category Tabs:**
   - **All-Time XP Ranks:** Total experience points accumulated through mocks and drills.
   - **Mock Exam Average:** Ranked by highest average score (/400).
   - **Daily Streaks:** Ranked by longest consecutive daily study streaks.
   - **Regional / State Ranks:** Filtered by Nigerian geopolitical zones and states.
5. **Search & Filter Bar:**
   - Instant search input allowing users to find peers by Candidate Name, State (e.g., *Lagos*, *Oyo*, *Rivers*), or Aurikrex ID (`AKX-XXXXXX`).
6. **National Scholars Ranks Table / Card List:**
   - Columns:
     - Rank position (#1 to #100+)
     - Candidate identity (Avatar initials, Full Name, verified checkmark)
     - Aurikrex ID
     - State / CBT Center Zone
     - 4-Subject Combination tags
     - Current Level & Streak Fire icon (e.g., `🔥 14 days`)
     - Total Points / Score

---

## 2. What the Page Does (UX Behaviors & User Flows)

- **Real-Time Data Aggregation:**
  - Queries `/leaderboard/xp` and `/leaderboard/streak` simultaneously on mount.
- **Dynamic Sorting & Filtering:**
  - Automatically re-sorts scholars based on active tab selection (XP vs. Streak vs. Mock Average) and filters results dynamically as the user types in the search box.
- **Personal Highlight:**
  - Auto-locates the logged-in student in the dataset, highlighting their row in the table and anchoring their score at the top banner.

---

## 3. How to Prompt This Page

### Example Prompts:
> **State Filter Dropdown:**  
> *"In `Leaderboard.tsx`, add a state dropdown filter with all 36 Nigerian states + FCT so candidates can filter the leaderboard to their home state."*

> **Badge Showcase:**  
> *"Add achievement badges (e.g., 'Speed Demon', 'Math Wizard', 'Century Club') next to candidate names in `Leaderboard.tsx` based on their milestones."*

> **Weekly Reset Toggle:**  
> *"Add a toggle in `Leaderboard.tsx` allowing candidates to view 'This Week's Leaders' vs. 'All-Time Leaders'."*
