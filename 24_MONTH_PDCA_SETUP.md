# 24-Month PDCA Report Generator — Setup

The mentor-side "AI Month 1 PDCA Report Generator" is now the **AI PDCA
Growth Cycle Report Generator**, covering all 24 months of the UMANG
Fellowship curriculum, not just Month 1.

## Design choice: static data, not a database

This deliberately does **not** use `MonthCurriculum` (Mongo), the Curriculum
Manager admin tab, or any upload/parse/publish flow. All 24 months of
curriculum content live in two plain code files, mirroring how the original
Month 1 fallback (`backend/src/data/month1Curriculum.js`) always worked —
just generalized to every month:

- **`backend/src/data/monthCurricula.js`** — full data per month (objective,
  weekly focus, deliverables checklist with matching keywords, PDCA
  success-check criteria). Used by `/api/pdca/generate` for AI grounding and
  deliverable auto-matching against a Fellow's real submissions/tasks.
- **`src/mentor/monthCurricula.js`** — a lighter mirror (objective + weekly
  focus only) used by the mentor UI's "About this month" panel. No API call.

**Nothing to seed, nothing to publish, no database step.** The data is just
there the moment the server starts. To edit a month's content, edit the
object for that month in both files and restart — keep them in sync.

> **Known gap:** the source file `PDCA Month 3.docx` (Child Psychology &
> Theories) turned out to be a duplicate of Month 4's content in the
> original upload. `MONTH_CURRICULA[3]` in both files currently holds that
> placeholder (Month 4's) content. Once you have the correct Month 3
> material, replace the `3: { ... }` entry in both files.

## What changed

| File | Status | Purpose |
|---|---|---|
| `backend/src/data/monthCurricula.js` | **New** | Full curriculum data, all 24 months |
| `src/mentor/monthCurricula.js` | **New** | Display-only mirror (objective + weekly focus) |
| `src/mentor/monthMeta.js` | **New** | Short titles for the month picker dropdown |
| `src/mentor/PDCAGenerator.jsx` | **New**, replaces `Month1PDCAGenerator.jsx` | The generator UI, now for any month |
| `src/mentor/Month1PDCAGenerator.jsx` | **Deleted** | Superseded by `PDCAGenerator.jsx` |
| `src/mentor/MentorDashboardTabs.jsx` | **Edited** | Imports/renders `PDCAGenerator` instead |
| `backend/src/routes/pdcaGenerate.js` | **Edited** | `/generate` now reads `MONTH_CURRICULA[month]` directly instead of querying `MonthCurriculum` in Mongo, and the old Month-1-only legacy branch was removed (every month, including 1, now takes the same code path) |

`src/mentor/CurriculumManager.jsx` and the `backend/src/routes/curriculum.js`
/ `mentorCurriculum.js` routes are untouched and still exist in the project,
but the PDCA generator no longer depends on them for anything.

## Setup — there isn't one

1. Drop in the files above (or unzip the delivered project over your working
   copy — `node_modules`/`dist` are excluded so it won't touch installed
   packages).
2. Start the app as usual:
   ```bash
   cd backend && npm run dev
   # separate terminal, project root
   npm run dev
   ```
3. In the mentor dashboard's **Growth Cycle** tab, the generator shows a
   **Month** dropdown (1–24, grouped by semester). Pick a fellow and a
   month, **Generate Draft**, edit Plan/Do/Check/Act and the deliverables
   checklist, **Approve & Save** — same flow as Month 1 always had, now for
   every month.

## Editing a month's content later

Open `backend/src/data/monthCurricula.js`, find the entry for that month
number, edit `monthlyObjective` / `weeklyFocus` / `deliverables` /
`successCheck`, and make the matching edit in `src/mentor/monthCurricula.js`
(just `monthlyObjective` + `weeklyFocus` there). Restart the backend to pick
up the change — no publish step, no admin UI.
