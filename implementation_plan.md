# Growth Cycle (PDCA) — Full Implementation Plan

## What This Feature Is

The **Growth Cycle** is a structured coaching tool (Plan → Do → Check → Act) used by Mentors in the UMAANG Fellowship Teacher Training Program. A Mentor sets goals for each Fellow (trainee teacher), tracks their progress over months, and Fellows report back weekly on what they've done toward each goal.



---

## Part 1: Current State (What Already Exists)

### Backend
| File | What it does |
|---|---|
| `backend/src/models/MentorTracking.js` | `PDCACycle` schema: stores `mentorId`, `menteeId`, `cycleNumber`, `plan`, `do`, `check`, `act`, `status`, `date` |
| `backend/src/routes/mentorTracking.js` | `GET /api/mentor/tracking/pdca` — fetch all cycles for mentor; `POST /api/mentor/tracking/pdca` — create a new cycle |

### Frontend (Mentor Dashboard)
| File | What it does |
|---|---|
| `src/mentor/MentorDashboard.jsx` | Renders the `PDCATab` under the "Growth Cycle" sidebar nav item |
| `src/mentor/MentorDashboardTabs.jsx` → `PDCATab` | New cycle form (4 PDCA fields + fellow selector); Fellow progress summary (cycle counts); Filterable cycle history list |
| `src/services/api.js` | `getPDCACycles()` and `submitPDCACycle(cycleNumber, plan, do, check, act, menteeId)` |

### Frontend (Teacher Dashboard)
| File | What it does |
|---|---|
| *(nothing)* | Fellows currently cannot see any PDCA goals set for them |

### What's Missing / Not Built Yet
- ❌ No target date / deadline on goals
- ❌ No skill category on goals
- ❌ No goal outcome (Met / Not Met)
- ❌ No 6-month visual timeline
- ❌ Fellow has no view of their own goals
- ❌ No weekly progress reporting by Fellow
- ❌ No overdue/upcoming status indicators

---

## Part 2: What We Are Building

### Feature A — Target Date on Goals
**Who:** Mentor  
**What:** Add an optional "Target Date" field to the PDCA form so the Mentor can write goals like *"Class should recognise all shapes by Aug 31."*

### Feature B — 6-Month Growth Timeline
**Who:** Mentor  
**What:** Visual month-by-month view for any selected Fellow. Shows the last 6 months as a horizontal timeline. Each month shows how many cycles were logged, color-coded (🟢 ≥2, 🟡 1, ⚪ 0). Click any month to expand and read the cycle cards for that month.

### Feature D — Fellow "My Goals" Panel (Teacher Dashboard)
**Who:** Fellow / Teacher  
**What:** A new read-only panel on the Teacher Dashboard showing all goals the Mentor has set for them. Each goal shows: the PDCA fields, target date, skill category, status badge (Overdue / Upcoming / Met).

### Feature E — Status Badges on Goals
**Who:** Both  
**What:** Each goal automatically shows a status based on today's date vs target date and the outcome:
- 🔴 **Overdue** — target date passed, outcome not marked
- 🟡 **Upcoming** — target date within 7 days
- 🟢 **On Track** — target date is future and > 7 days away
- ✅ **Met** / ❌ **Not Met** / 🟡 **Partially Met** — after mentor marks outcome

### Feature F — Goal Outcome Marking
**Who:** Mentor  
**What:** Once the target date arrives, Mentor can mark the goal as:
- ✅ Met
- 🟡 Partially Met
- ❌ Not Met

This replaces the current flat "Completed" status with a meaningful result.

### Feature G — Skill Category Tags
**Who:** Mentor (sets), Fellow (sees)  
**What:** Each goal is tagged with one of these categories:
`Classroom Management | Literacy | Numeracy | Social-Emotional | Transitions | Other`  
Mentor and Fellow can filter goals by category. Helps identify patterns over time (e.g., Sneha consistently struggles with Literacy goals).

### Feature H — Weekly Progress Reports by Fellow
**Who:** Fellow submits, Mentor reads  
**What:**
- Fellow opens "My Goals" → picks a goal → clicks **"Submit This Week's Update"**
- Fills in a short free-text box: *"This week I introduced the shape sorting activity. Children responded well."*
- Mentor opens any cycle in the Growth Cycle tab → sees all weekly reports stacked below it
- Mentor can see the progression week by week without creating a full new cycle

---

## Part 3: System Flow (End to End)

```
1. Mentor creates a goal (PDCA cycle)
   └── Sets: Plan, Do, Check, Act, Target Date, Skill Category
   
2. Fellow logs into their dashboard
   └── Sees "My Goals" panel with all goals from Mentor
   └── Sees: Target Date, Category, Status badge (Upcoming / Overdue)
   
3. Every week, Fellow submits a Weekly Progress Report
   └── "This week I did X toward this goal"
   
4. Mentor opens Growth Cycle tab → selects the cycle
   └── Sees all weekly reports stacked below the goal
   └── Views 6-month timeline to see activity patterns
   
5. After target date, Mentor marks outcome
   └── Met ✅ / Partially Met 🟡 / Not Met ❌
   └── Goal is now closed with a result
```

---

## Part 4: Changes Required

---

### Backend

#### [MODIFY] `backend/src/models/MentorTracking.js`
Add to `pdcaCycleSchema`:
```js
targetDate:   { type: Date, default: null },
category:     { type: String, enum: ["Classroom Management","Literacy","Numeracy","Social-Emotional","Transitions","Other"], default: "Other" },
outcome:      { type: String, enum: ["pending","met","partially_met","not_met"], default: "pending" },
outcomeNotes: { type: String, default: "" },
```

Add new `WeeklyReport` schema (for Feature H):
```js
const weeklyReportSchema = new mongoose.Schema({
  cycleId:   { type: ObjectId, ref: "PDCACycle", required: true, index: true },
  teacherId: { type: ObjectId, ref: "User", required: true, index: true },
  weekOf:    { type: Date, required: true },   // Monday of that week
  report:    { type: String, required: true },
}, { timestamps: true });
```

---

#### [MODIFY] `backend/src/routes/mentorTracking.js`
Add fields to `POST /pdca` (accept `targetDate`, `category`).

Add new route: `PATCH /pdca/:id/outcome` — Mentor marks goal as Met / Not Met.

Add new route: `GET /pdca/:cycleId/weekly-reports` — Mentor reads Fellow's weekly reports.

---

#### [MODIFY] `backend/src/server.js`
Register new teacher-side route for weekly report submission:
- `POST /api/teacher/goals/:cycleId/weekly-report`
- `GET  /api/teacher/goals` — returns all cycles assigned to this teacher (by their `menteeId`)

---

### Frontend

#### [MODIFY] `src/services/api.js`
Add new API functions:
- `submitPDCACycle(...)` — add `targetDate` and `category` params
- `updateCycleOutcome(cycleId, outcome, outcomeNotes)` — PATCH outcome
- `getCycleWeeklyReports(cycleId)` — GET weekly reports for a cycle (mentor)
- `getMyGoals()` — GET all cycles where I am the mentee (teacher)
- `submitWeeklyReport(cycleId, report, weekOf)` — POST weekly report (teacher)

---

#### [MODIFY] `src/mentor/MentorDashboardTabs.jsx` → `PDCATab`
Expand into **2-panel layout**:

**Left panel — New Goal Form** (enhanced):
- Fellow selector *(existing)*
- Skill Category dropdown *(new — Feature G)*
- Target Date picker *(new — Feature A)*
- Plan / Do / Check / Act textareas *(existing)*
- Submit button *(existing)*

**Right panel — 3 sub-tabs:**

| Sub-tab | Content |
|---|---|
| **Fellow Progress** | Existing cycle count summary per Fellow |
| **6-Month Timeline** | New month-by-month visual (Feature B) |
| **Cycle History** | Enhanced history — each card shows category tag, target date, status badge, outcome marker, + weekly reports accordion |

---

#### [MODIFY] Teacher Dashboard (the existing Teacher Dashboard file)
Add a **"My Goals 🎯"** section (Feature D + E + H):
- Lists all goals the Mentor set for this Fellow
- Each goal shows: category tag, target date, status badge
- "Submit This Week's Update" button → opens a small text form
- Past weekly reports shown as a collapsible history

---

## Part 5: File Summary

| File | Change Type |
|---|---|
| `backend/src/models/MentorTracking.js` | MODIFY — add 4 fields to PDCACycle; add WeeklyReport schema |
| `backend/src/routes/mentorTracking.js` | MODIFY — add outcome PATCH + weekly reports GET |
| `backend/src/server.js` | MODIFY — register 2 new teacher-side routes |
| `src/services/api.js` | MODIFY — add 5 new API functions |
| `src/mentor/MentorDashboardTabs.jsx` | MODIFY — expand PDCATab (new form fields + timeline + enhanced history) |
| Teacher Dashboard file | MODIFY — add "My Goals" section |

---

## Part 6: Verification Plan

1. ✅ Backend starts without errors
2. ✅ Mentor can create a goal with Target Date and Category
3. ✅ Cycle history shows category tag, target date, status badge
4. ✅ 6-month timeline renders correctly for a selected Fellow
5. ✅ Mentor can mark a goal as Met / Not Met after target date
6. ✅ Fellow sees their goals on the Teacher Dashboard
7. ✅ Fellow can submit a weekly report on a specific goal
8. ✅ Mentor sees all weekly reports stacked under the cycle

> [!IMPORTANT]
> Which file is the Teacher Dashboard stored in? (e.g., `TeacherDashboard.jsx` or similar) — needed before starting the Fellow-side changes (D, E, H).
