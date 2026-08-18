// backend/src/services/month1Grounding.js
//
// Deterministic, rule-based fact assembly for the Month 1 PDCA generator.
// This is the "grounding" layer: every count/status here is computed from
// real ActivitySubmission + TeacherTask records, never guessed. The AI
// service only turns these pre-computed facts into prose — it never
// recomputes or contradicts them. Mirrors the matching logic already
// proven out in src/mentor/aiInsights.js on the frontend.

import {
  MONTH1_DELIVERABLES,
  MONTH1_SUCCESS_CHECK,
} from "../data/month1Curriculum.js";

function normalizeTaskSignals(tasks) {
  return (tasks || [])
    .filter((t) => t.completed)
    .map((t) => ({
      text: `${t.title || ""} ${t.category || ""}`.toLowerCase(),
      date: new Date(t.date || t.createdAt),
    }));
}

function normalizeSubmissionSignals(submissions) {
  return (submissions || []).map((s) => ({
    text: `${s.activityName || ""} ${s.description || ""}`.toLowerCase(),
    date: new Date(s.activityDate || s.createdAt),
  }));
}

/**
 * Match logged Today's Tasks + Fellow Activity Submissions against the 15
 * real Month 1 deliverables. Returns a status per deliverable:
 *   - "met"                -> evidenced via a reviewed submission
 *   - "needs_mentor_review" -> logged as a task but not yet submitted as evidence
 *   - "not_met"             -> no task log or submission at all
 */
export function matchMonth1Deliverables(submissions, tasks = []) {
  const subSignals = normalizeSubmissionSignals(submissions);
  const taskSignals = normalizeTaskSignals(tasks);

  return MONTH1_DELIVERABLES.map((d) => {
    const subMatches = subSignals.filter((s) => d.keywords.some((k) => s.text.includes(k)));
    const taskMatches = taskSignals.filter((s) => d.keywords.some((k) => s.text.includes(k)));
    const count = subMatches.length;
    const met = d.targetCount ? count >= d.targetCount : count > 0;
    const touchedByTaskOnly = !met && taskMatches.length > 0;

    let status = "not_met";
    if (met) status = "met";
    else if (touchedByTaskOnly) status = "needs_mentor_review";

    return { id: d.id, label: d.label, status, count, targetCount: d.targetCount || null };
  });
}

/**
 * Section 4: "do" success-check criteria are objectively countable, so we
 * auto-assess them against the deliverables above. "check" criteria are all
 * judgement calls (understanding, trust, sensitivity) — never auto-assessed,
 * always left for the Mentor, per the doc's explicit rule.
 */
const DO_CRITERION_TO_DELIVERABLE = {
  "4 Anganwadi visits completed": "anganwadi_visits",
  "Observations documented": "observation_notes",
  "Families identified for future home visits": "family_id_list",
};

export function autoAssessSuccessCheck(deliverablesStatus) {
  const byId = Object.fromEntries(deliverablesStatus.map((d) => [d.id, d]));

  const doAssessed = MONTH1_SUCCESS_CHECK.do.map((criterion) => {
    const linkedId = DO_CRITERION_TO_DELIVERABLE[criterion];
    if (!linkedId) {
      return { criterion, autoAssessed: false, note: "Mentor to assess" };
    }
    const d = byId[linkedId];
    return {
      criterion,
      autoAssessed: true,
      met: d?.status === "met",
      basis: d ? `${d.label}: ${d.status}` : "no data",
    };
  });

  // "check" is always mentor-only judgement — never auto-assessed.
  const checkAssessed = MONTH1_SUCCESS_CHECK.check.map((criterion) => ({
    criterion,
    autoAssessed: false,
    note: "Mentor to assess — requires judgement, not derivable from logs.",
  }));

  return { do: doAssessed, check: checkAssessed };
}

/**
 * Compact, factual bullet list — the only "evidence" the AI is allowed to
 * write from. Every line here is either a literal count or a direct field
 * value, nothing inferred.
 */
export function buildFactsSummary(fellow, submissions, tasks, deliverablesStatus) {
  const facts = [];
  const met = deliverablesStatus.filter((d) => d.status === "met");
  const needsReview = deliverablesStatus.filter((d) => d.status === "needs_mentor_review");
  const notMet = deliverablesStatus.filter((d) => d.status === "not_met");

  facts.push(`${met.length} of ${deliverablesStatus.length} Month 1 deliverables evidenced via reviewed submissions.`);
  if (needsReview.length) {
    facts.push(`${needsReview.length} deliverable(s) logged in Today's Tasks but not yet submitted as evidence: ${needsReview.map((d) => d.label).join("; ")}.`);
  }
  if (notMet.length) {
    facts.push(`${notMet.length} deliverable(s) with no task log or submission at all: ${notMet.map((d) => d.label).join("; ")}.`);
  }

  const allDates = [
    ...submissions.map((s) => new Date(s.activityDate || s.createdAt)),
    ...tasks.map((t) => new Date(t.date || t.createdAt)),
  ].filter((d) => !isNaN(d));
  if (allDates.length) {
    const lastDate = new Date(Math.max(...allDates));
    const daysSince = Math.floor((new Date() - lastDate) / 86400000);
    facts.push(`Most recent logged activity: ${daysSince} day(s) ago.`);
  } else {
    facts.push("No activity logged yet this cycle.");
  }

  const reworked = submissions.filter((s) => s.status === "flagged" || s.status === "rejected");
  if (reworked.length) {
    facts.push(`${reworked.length} submission(s) sent back for rework/rejected.`);
  }

  const feedback = submissions
    .filter((s) => s.adminComments)
    .slice(-2)
    .map((s) => s.adminComments.trim());
  if (feedback.length) {
    facts.push(`Recent mentor feedback on file: ${feedback.map((f) => `"${f}"`).join("; ")}`);
  }

  return facts;
}