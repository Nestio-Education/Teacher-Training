/**
 * Growth Cycle AI/ML Insights Engine
 * ----------------------------------
 * Implements Section 3 of "PDCA & Curriculum Intelligence — AI/ML Workflow &
 * Architecture Design", using the real Month 1 checklist digitized in
 * pdcaMonth1Template.js (from PDCA_Month_1.docx) instead of guessed baselines.
 * Rule-based / heuristic — no external AI API call — with documented NOTE
 * blocks on where to swap in a trained model once multi-cycle data exists.
 *
 * Data sources (Section 5 of the architecture design — TWO distinct feeds,
 * not one):
 *   (a) Fellow Activity Submissions (ActivitySubmission, live) — evidence
 *       reviewed by the mentor: field diary, community map, reports, with a
 *       Pending/Approved/Needs Rework/Rejected status.
 *   (b) "Today's Tasks" (TeacherTask, live — reused rather than rebuilt; see
 *       the /api/mentor/fellow-tasks route comment in server.js) — the
 *       fellow's own daily self-logged activity log ("Activity Log DB" in
 *       the architecture diagram).
 *
 * Covers:
 *   3.1 Fellow Progress Scoring       — now blends BOTH sources
 *   3.2 Curriculum / Activity Mapping — now maps BOTH tasks + submissions
 *   3.3 Pending Activity Detection    — "no matching task log OR submission" = pending
 *   3.4 Delay / Risk Prediction       — staleness now checked across BOTH sources
 *   3.5 Performance Analysis (against PDCA Success Check criteria)
 *   3.6 Personalized Activity Recommendations
 *   3.7 Mentor Intervention Recommendations
 *   Section 4 — Plan-stage signal surfacing (risk + intervention -> next Plan)
 */

import { MONTH1_DELIVERABLES, CURRICULUM_MODULE_TAG_REGEX } from "./pdcaMonth1Template";

export { MONTH1_DELIVERABLES };

// ---- Tunable constants ---------------------------------------------------
// NOTE: every function below now takes an optional `deliverablesList` param
// (defaulting to the digitized Month 1 checklist) so callers that already
// know which month's curriculum they're grounding against — e.g. the
// "Design from Curriculum" flow, which fetches the real MonthCurriculum doc
// for whichever month was picked — can pass THAT list in instead of always
// being pinned to Month 1. `monthLabel` (default "Month 1") is only used in
// the generated summary/pending-item text, not in the matching logic.
const STALE_DAYS_MEDIUM = 7;             // no new activity in a week -> medium concern
const STALE_DAYS_HIGH = 14;              // no new activity in two weeks -> high concern
const REWORK_RATE_MEDIUM = 0.25;         // 25%+ flagged/rejected -> medium risk
const REWORK_RATE_HIGH = 0.4;            // 40%+ flagged/rejected -> high risk
const MENTOR_REVIEW_SLA_DAYS = 5;        // days a submission can sit un-reviewed before it's an intervention trigger

const daysBetween = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));

const isoWeekKey = (d) => {
  const date = new Date(d);
  const onejan = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${week}`;
};

/**
 * 3.2 Curriculum / Activity Mapping — Fellow Activity Submissions.
 * Direct lookup against the "[Linked Curriculum Module: ...]" tag already
 * embedded in submission descriptions (see server.js seed-samples route) —
 * no ML needed since the tag is structured, not free text.
 */
export function extractCurriculumModule(submission) {
  const m = (submission.description || "").match(CURRICULUM_MODULE_TAG_REGEX);
  return m ? m[1].trim() : null;
}

/**
 * Normalize both data sources into one signal shape so downstream functions
 * don't need to know which source a given piece of evidence came from.
 * Only *completed* tasks count as a real signal — a task still "Pending" /
 * "Started" hasn't actually happened yet.
 */
function normalizeTaskSignals(tasks) {
  return (tasks || [])
    .filter((t) => t.completed)
    .map((t) => ({
      source: "task",
      text: `${t.title || ""} ${t.category || ""}`.toLowerCase(),
      date: new Date(t.date || t.completedAt || t.createdAt),
      raw: t,
    }));
}

function normalizeSubmissionSignals(submissions) {
  return (submissions || []).map((s) => ({
    source: "submission",
    text: `${s.activityName || ""} ${s.description || ""}`.toLowerCase(),
    date: new Date(s.activityDate || s.createdAt),
    raw: s,
  }));
}

/**
 * 3.3 Pending Activity Detection — real version, now dual-source.
 * Matches BOTH logged Today's Tasks and Fellow Activity Submissions against
 * the 15 digitized Month 1 deliverables. Per Section 5: "no matching task log
 * OR submission = pending" — a deliverable only counts as untouched if
 * NEITHER source shows it. Submission-based "met" (evidenced) stays separate
 * from task-based "touched" (self-logged, not yet reviewed) so Progress
 * Scoring still rewards actual reviewed evidence, not just a self-checked box.
 */
export function matchDeliverables(submissions, tasks = [], deliverablesList = MONTH1_DELIVERABLES) {
  const subSignals = normalizeSubmissionSignals(submissions);
  const taskSignals = normalizeTaskSignals(tasks);
  const list = deliverablesList?.length ? deliverablesList : MONTH1_DELIVERABLES;

  return list.map((d) => {
    const subMatches = subSignals.filter((s) => d.keywords.some((k) => s.text.includes(k)));
    const taskMatches = taskSignals.filter((s) => d.keywords.some((k) => s.text.includes(k)));
    const count = subMatches.length;
    const met = d.targetCount ? count >= d.targetCount : count > 0; // "evidenced" — submissions only
    const touched = met || count > 0 || taskMatches.length > 0;     // "not pending" — any partial evidence from either source
    return {
      ...d,
      count,
      met,
      touched,
      taskOnly: !met && taskMatches.length > 0, // logged by the fellow, not yet evidenced/reviewed
      matches: subMatches,
      taskMatches,
    };
  });
}

/**
 * 3.1 Fellow Progress Scoring
 * 40% activity completion (evidenced deliverables / 15) + 40% submission
 * approval rate + 20% consistency. Consistency is now a blend of (a) the
 * fellow's Today's Tasks daily completion streak and (b) distinct weeks
 * active across either source — so a fellow logging daily tasks but with
 * submissions still in review isn't scored as inconsistent.
 * NOTE (later, per doc): once 2-3 PDCA cycles of outcome data exist across
 * fellows, replace these fixed weights with a regression model.
 */
export function computeProgressScore(submissions, tasks = [], deliverablesList = MONTH1_DELIVERABLES) {
  const hasAny = submissions.length > 0 || tasks.length > 0;
  if (!hasAny) {
    return { score: 0, activityCompletion: 0, approvalRate: 0, consistency: 0, taskCompletionRate: 0 };
  }

  const list = deliverablesList?.length ? deliverablesList : MONTH1_DELIVERABLES;
  const deliverables = matchDeliverables(submissions, tasks, list);
  const metCount = deliverables.filter((d) => d.met).length;
  const activityCompletion = (metCount / list.length) * 100;

  const reviewed = submissions.filter((s) => s.status !== "pending");
  const approved = submissions.filter((s) => s.status === "approved").length;
  // Give benefit of the doubt when nothing has been reviewed yet rather than
  // scoring a brand-new fellow as 0% approved.
  const approvalRate = reviewed.length > 0 ? (approved / reviewed.length) * 100 : 70;

  // Today's Tasks completion streak (Section 3.1, input (a))
  const taskCompletionRate = tasks.length > 0
    ? (tasks.filter((t) => t.completed).length / tasks.length) * 100
    : null;

  // Weeks-active consistency across BOTH sources (Section 3.1, input blend)
  const allDates = [
    ...submissions.map((s) => new Date(s.activityDate || s.createdAt)),
    ...tasks.map((t) => new Date(t.date || t.createdAt)),
  ].filter((d) => !isNaN(d));
  let weeksConsistency = 0;
  if (allDates.length > 0) {
    const weeksActive = new Set(allDates.map(isoWeekKey)).size;
    const firstDate = new Date(Math.min(...allDates));
    const lastDate = new Date(Math.max(...allDates));
    const spanWeeks = Math.max(1, Math.ceil((daysBetween(lastDate, firstDate) + 1) / 7));
    weeksConsistency = Math.min(weeksActive / spanWeeks, 1) * 100;
  }
  // Blend weeks-active pattern with the daily task-completion streak when
  // Today's Tasks data exists; fall back to weeks-active alone otherwise.
  const consistency = taskCompletionRate === null
    ? weeksConsistency
    : (weeksConsistency + taskCompletionRate) / 2;

  const score = Math.round(0.4 * activityCompletion + 0.4 * approvalRate + 0.2 * consistency);

  return {
    score: Math.max(0, Math.min(100, score)),
    activityCompletion: Math.round(activityCompletion),
    approvalRate: Math.round(approvalRate),
    consistency: Math.round(consistency),
    taskCompletionRate: taskCompletionRate === null ? null : Math.round(taskCompletionRate),
  };
}

/**
 * 3.3 Pending Activity Detection
 * Combines: (a) Month 1 deliverables untouched by EITHER source, (b) Month 1
 * deliverables logged as a task but never submitted as evidence, (c) fellows
 * gone quiet across both sources, and (d) submissions sitting un-reviewed
 * past the mentor SLA.
 */
export function detectPendingItems(submissions, tasks = [], now = new Date(), deliverablesList = MONTH1_DELIVERABLES, monthLabel = "Month 1") {
  const pending = [];

  if (submissions.length === 0 && tasks.length === 0) {
    pending.push({ type: "no_activity", label: "No activities logged yet this cycle." });
    return pending;
  }

  const list = deliverablesList?.length ? deliverablesList : MONTH1_DELIVERABLES;
  const deliverables = matchDeliverables(submissions, tasks, list);
  const untouched = deliverables.filter((d) => !d.touched);
  if (untouched.length > 0) {
    pending.push({
      type: "missing_deliverables",
      label: `${untouched.length} of ${list.length} ${monthLabel} deliverables have no task log OR submission yet: ${untouched.slice(0, 3).map((d) => d.label).join(", ")}${untouched.length > 3 ? "…" : ""}`,
      items: untouched,
    });
  }

  const loggedNotEvidenced = deliverables.filter((d) => d.taskOnly);
  if (loggedNotEvidenced.length > 0) {
    pending.push({
      type: "logged_not_evidenced",
      label: `${loggedNotEvidenced.length} deliverable(s) logged in Today's Tasks but not yet submitted as evidence: ${loggedNotEvidenced.slice(0, 3).map((d) => d.label).join(", ")}${loggedNotEvidenced.length > 3 ? "…" : ""}`,
      items: loggedNotEvidenced,
    });
  }

  const allDates = [
    ...submissions.map((s) => new Date(s.activityDate || s.createdAt)),
    ...tasks.map((t) => new Date(t.date || t.createdAt)),
  ].filter((d) => !isNaN(d));
  if (allDates.length > 0) {
    const lastDate = new Date(Math.max(...allDates));
    const daysSinceLast = daysBetween(now, lastDate);

    if (daysSinceLast >= STALE_DAYS_HIGH) {
      pending.push({ type: "stale", label: `No new task log or submission in ${daysSinceLast} days.` });
    } else if (daysSinceLast >= STALE_DAYS_MEDIUM) {
      pending.push({ type: "stale", label: `No new task log or submission in ${daysSinceLast} days — worth a check-in.` });
    }
  }

  const awaitingReview = submissions.filter((s) => {
    if (s.status !== "pending") return false;
    const submitted = new Date(s.activityDate || s.createdAt);
    return daysBetween(now, submitted) >= MENTOR_REVIEW_SLA_DAYS;
  });
  if (awaitingReview.length > 0) {
    pending.push({
      type: "awaiting_review",
      label: `${awaitingReview.length} submission${awaitingReview.length > 1 ? "s" : ""} awaiting your review for ${MENTOR_REVIEW_SLA_DAYS}+ days.`,
      submissionIds: awaitingReview.map((s) => s._id),
    });
  }

  return pending;
}

/**
 * 3.4 Delay / Risk Prediction
 * Threshold/heuristic flag: Low / Medium / High. Staleness now checked
 * across BOTH Today's Tasks and Submissions, so a fellow who's still logging
 * daily tasks isn't flagged purely because a submission hasn't landed yet.
 * NOTE (later, per doc): swap for logistic regression / gradient boosting on
 * pace features once multiple cohorts of labeled outcome data exist.
 */
export function computeRiskLevel(submissions, tasks = [], now = new Date()) {
  if (submissions.length === 0 && tasks.length === 0) {
    return { level: "Medium", reasons: ["No activities logged yet — too early to tell, but worth an early nudge."] };
  }

  const allDates = [
    ...submissions.map((s) => new Date(s.activityDate || s.createdAt)),
    ...tasks.map((t) => new Date(t.date || t.createdAt)),
  ].filter((d) => !isNaN(d));

  const reasons = [];
  let level = "Low";

  if (allDates.length > 0) {
    const lastDate = new Date(Math.max(...allDates));
    const daysSinceLast = daysBetween(now, lastDate);
    if (daysSinceLast >= STALE_DAYS_HIGH) {
      level = "High";
      reasons.push(`No task log or submission in ${daysSinceLast} days.`);
    } else if (daysSinceLast >= STALE_DAYS_MEDIUM) {
      level = "Medium";
      reasons.push(`No task log or submission in ${daysSinceLast} days.`);
    }
  }

  const reviewed = submissions.filter((s) => s.status !== "pending");
  const reworked = submissions.filter((s) => s.status === "flagged" || s.status === "rejected").length;
  const reworkRate = reviewed.length > 0 ? reworked / reviewed.length : 0;

  if (reviewed.length >= 3 && reworkRate >= REWORK_RATE_HIGH) {
    level = "High";
    reasons.push(`${Math.round(reworkRate * 100)}% of reviewed submissions needed rework.`);
  } else if (reviewed.length >= 3 && reworkRate >= REWORK_RATE_MEDIUM) {
    if (level !== "High") level = "Medium";
    reasons.push(`${Math.round(reworkRate * 100)}% of reviewed submissions needed rework.`);
  }

  // A fellow logging tasks daily but with no submissions at all yet is a
  // softer, distinct signal from going fully quiet — worth a medium flag
  // rather than staying "Low" on task activity alone.
  if (tasks.length >= 5 && submissions.length === 0 && level === "Low") {
    level = "Medium";
    reasons.push("Logging daily tasks, but no Fellow Activity Submissions filed yet this cycle.");
  }

  if (reasons.length === 0) reasons.push("On pace — no concerning gaps or rework detected.");

  return { level, reasons };
}

/**
 * 3.5 Performance Analysis
 * Reports against the real Month 1 deliverables checklist (both sources),
 * plus the fellow's own mentor feedback text — no external text-summarization
 * model call (keeps this instant/free; chatbot_service route is available
 * later per Section 5, gated on Open Item 8 / a real Gemini-Mistral key).
 */
export function buildPerformanceSummary(fellowName, submissions, tasks, progress, risk, deliverablesList = MONTH1_DELIVERABLES, monthLabel = "Month 1") {
  const list = deliverablesList?.length ? deliverablesList : MONTH1_DELIVERABLES;
  const deliverables = matchDeliverables(submissions, tasks, list);
  const evidenced = deliverables.filter((d) => d.met);
  const untouched = deliverables.filter((d) => !d.touched);
  const loggedNotEvidenced = deliverables.filter((d) => d.taskOnly);
  const visits = deliverables.find((d) => d.id === "anganwadi_visits");
  const diary = deliverables.find((d) => d.id === "field_diary");

  const lines = [];
  const visitsDiaryNote = visits || diary
    ? ` (${visits?.count || 0}${visits?.targetCount ? `/${visits.targetCount}` : ""} Anganwadi visits, ${diary?.count || 0}${diary?.targetCount ? `/${diary.targetCount}` : ""} field diary entries)`
    : "";
  lines.push(
    `${fellowName || "This fellow"} has evidenced ${evidenced.length} of ${list.length} ${monthLabel} deliverables via submissions` +
    `${visitsDiaryNote}.`
  );
  if (progress.taskCompletionRate !== null) {
    lines.push(`Today's Tasks completion rate this cycle: ${progress.taskCompletionRate}%.`);
  }
  if (loggedNotEvidenced.length > 0) {
    lines.push(`Logged but not yet submitted as evidence: ${loggedNotEvidenced.map((d) => d.label).join("; ")}.`);
  }
  if (untouched.length > 0) {
    lines.push(`Not yet started (no task log or submission): ${untouched.map((d) => d.label).join("; ")}.`);
  } else {
    lines.push(`Every ${monthLabel} deliverable has at least a task log or submission on record.`);
  }
  lines.push(`Progress score: ${progress.score}/100. Risk: ${risk.level}.`);

  const lastReviewed = [...submissions]
    .filter((s) => s.adminComments)
    .sort((a, b) => new Date(b.reviewedAt || b.updatedAt || 0) - new Date(a.reviewedAt || a.updatedAt || 0))[0];
  if (lastReviewed) {
    lines.push(`Most recent mentor feedback: "${lastReviewed.adminComments}"`);
  }

  return lines.join(" ");
}

/**
 * 3.6 Personalized Activity Recommendations
 * Rule-based gap -> suggested-next-action mapping, now naming the specific
 * missing Month 1 deliverable and touched curriculum module rather than a
 * generic nudge.
 */
export function buildRecommendations(submissions, tasks, pendingItems, risk) {
  const recs = [];

  pendingItems.forEach((p) => {
    if (p.type === "no_activity") {
      recs.push("Ask the fellow to log their first Today's Task and submit their first activity for this cycle as soon as possible.");
    } else if (p.type === "missing_deliverables") {
      const first = p.items[0];
      recs.push(`Prioritize "${first.label}" next — it has no task log or submission yet, the most overdue item this cycle.`);
    } else if (p.type === "logged_not_evidenced") {
      const first = p.items[0];
      recs.push(`"${first.label}" is logged in Today's Tasks — remind the fellow to submit the actual evidence for mentor review.`);
    } else if (p.type === "stale") {
      recs.push("Follow up directly with the fellow this week to unblock whatever is stalling new activity.");
    } else if (p.type === "awaiting_review") {
      recs.push(`Clear the ${p.submissionIds?.length || ""} submission(s) waiting on your review — fellows can't act on feedback they haven't received.`);
    }
  });

  const reworked = submissions.filter((s) => s.status === "flagged" || s.status === "rejected");
  if (reworked.length > 0) {
    const example = reworked[reworked.length - 1];
    recs.push(
      `Walk through the feedback on "${example.activityName || "the flagged submission"}" together and agree a resubmission date.`
    );
  }

  const modules = [...new Set(submissions.map(extractCurriculumModule).filter(Boolean))];
  if (modules.length) {
    recs.push(`Curriculum modules touched this cycle: ${modules.join(", ")}. Confirm coverage against the Semester plan before assigning Month 2 activities.`);
  }

  if (risk.level === "Low" && submissions.some((s) => s.status === "approved")) {
    recs.push("Fellow is on track — consider assigning the next curriculum module or a stretch activity.");
  }

  if (recs.length === 0) {
    recs.push("No specific gaps detected this cycle — keep reinforcing consistent daily logging and weekly submissions.");
  }

  return recs;
}

/**
 * 3.7 Mentor Intervention Recommendations
 * "High risk + submission(s) sitting unreviewed for MENTOR_REVIEW_SLA_DAYS+"
 * triggers a nudge to the mentor themself, not just the fellow.
 */
export function needsMentorIntervention(risk, pendingItems) {
  const hasStaleReview = pendingItems.some((p) => p.type === "awaiting_review");
  return risk.level === "High" && hasStaleReview;
}

/**
 * Section 4 — "Plan (next cycle)" row: Risk flags (3.4) and Mentor
 * Intervention Recommendations (3.7) inform what gets prioritized in the
 * next month's Plan. The AI only *surfaces signals* here — it never writes
 * the actual Month 2 goals; that stays entirely with the mentor, per the
 * rule: "Mentor doesn't write it from scratch, Fellow doesn't finalize it."
 */
export function buildPlanSignals(risk, pendingItems, interventionNeeded) {
  const lines = [];
  lines.push(`Signals carried in from current AI insights (risk: ${risk.level}) — use these to shape this cycle's goals, don't paste them in as-is:`);
  risk.reasons.forEach((r) => lines.push(`- ${r}`));
  pendingItems
    .filter((p) => p.type !== "awaiting_review") // that one's a mentor action item, not a fellow goal
    .forEach((p) => lines.push(`- ${p.label}`));
  if (interventionNeeded) {
    lines.push("- High risk + a review backlog — this fellow may need a direct check-in before Month 2 goals are set, not just a written plan.");
  }
  if (lines.length === 1) {
    lines.push("- No outstanding risk signals; set goals based on the fellow's normal Month 2 progression.");
  }
  return lines.join("\n");
}

/** Filter the full activities list down to one fellow's submissions. */
export function getFellowSubmissions(fellow, allSubmissions) {
  return (allSubmissions || []).filter((s) => {
    const teacherId = typeof s.teacher === "object" ? s.teacher?._id : s.teacher;
    return String(teacherId) === String(fellow._id);
  });
}

/** Filter the full Today's Tasks list down to one fellow's tasks. */
export function getFellowTasks(fellow, allTasks) {
  return (allTasks || []).filter((t) => {
    const teacherId = typeof t.teacher === "object" ? t.teacher?._id : t.teacher;
    return String(teacherId) === String(fellow._id);
  });
}

/** Run the full pipeline for one fellow, across BOTH data sources. */
export function computeFellowInsights(fellow, submissions, tasks = [], now = new Date(), deliverablesList = MONTH1_DELIVERABLES, monthLabel = "Month 1") {
  const list = deliverablesList?.length ? deliverablesList : MONTH1_DELIVERABLES;
  const progress = computeProgressScore(submissions, tasks, list);
  const pendingItems = detectPendingItems(submissions, tasks, now, list, monthLabel);
  const risk = computeRiskLevel(submissions, tasks, now);
  const performanceSummary = buildPerformanceSummary(fellow?.name, submissions, tasks, progress, risk, list, monthLabel);
  const recommendations = buildRecommendations(submissions, tasks, pendingItems, risk);
  const interventionNeeded = needsMentorIntervention(risk, pendingItems);
  const planSignals = buildPlanSignals(risk, pendingItems, interventionNeeded);
  const deliverables = matchDeliverables(submissions, tasks, list);

  return { progress, pendingItems, risk, performanceSummary, recommendations, planSignals, interventionNeeded, deliverables };
}

/**
 * Run the pipeline across every fellow, keyed by fellow _id.
 * `deliverablesList`/`monthLabel` let a caller ground every fellow's
 * insight against a specific month's real curriculum (e.g. whichever month
 * is selected in "Design from Curriculum") instead of the Month 1 default.
 */
export function computeAllFellowInsights(mentees, allSubmissions, allTasks = [], now = new Date(), deliverablesList = MONTH1_DELIVERABLES, monthLabel = "Month 1") {
  const map = {};
  (mentees || []).forEach((m) => {
    const fellowSubs = getFellowSubmissions(m, allSubmissions);
    const fellowTasks = getFellowTasks(m, allTasks);
    map[m._id] = computeFellowInsights(m, fellowSubs, fellowTasks, now, deliverablesList, monthLabel);
  });
  return map;
}