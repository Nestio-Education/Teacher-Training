// backend/src/services/pdcaGrounding.js
//
// Deterministic, rule-based fact assembly for the PDCA generator, driven by
// a MonthCurriculum document instead of hardcoded per-month constants. This
// is the "grounding" layer: every count/status here is computed from real
// ActivitySubmission + TeacherTask records, never guessed — the AI service
// only turns these pre-computed facts into prose. Generalizes what used to
// be month1Grounding.js (kept in place, unused, for reference) so it works
// for any month once its curriculum has been uploaded and published.

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
 * Match logged Today's Tasks + Fellow Activity Submissions against a
 * curriculum's deliverables list. Returns a status per deliverable:
 *   - "met"                -> evidenced via a reviewed submission
 *   - "needs_mentor_review" -> logged as a task but not yet submitted as evidence
 *   - "not_met"             -> no task log or submission at all
 */
export function matchDeliverables(deliverableDefs, submissions, tasks = []) {
  const subSignals = normalizeSubmissionSignals(submissions);
  const taskSignals = normalizeTaskSignals(tasks);

  return (deliverableDefs || []).map((d) => {
    const keywords = d.keywords || [];
    const subMatches = subSignals.filter((s) => keywords.some((k) => s.text.includes(k)));
    const taskMatches = taskSignals.filter((s) => keywords.some((k) => s.text.includes(k)));
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
 * "do" success-check criteria that have a linkedDeliverableId are
 * objectively countable, so auto-assess them against the deliverables
 * above. "check" criteria (and any "do" criterion without a link) always
 * require human judgement and are never auto-assessed.
 */
export function autoAssessSuccessCheck(successCheck, deliverablesStatus) {
  const byId = Object.fromEntries(deliverablesStatus.map((d) => [d.id, d]));

  const assessPhase = (criteria, autoAssessable) =>
    (criteria || []).map(({ criterion, linkedDeliverableId }) => {
      if (!autoAssessable || !linkedDeliverableId || !byId[linkedDeliverableId]) {
        return { criterion, autoAssessed: false, note: "Mentor to assess" };
      }
      const d = byId[linkedDeliverableId];
      return {
        criterion,
        autoAssessed: true,
        met: d.status === "met",
        basis: `${d.label}: ${d.status}`,
      };
    });

  return {
    do: assessPhase(successCheck?.do, true),
    check: assessPhase(successCheck?.check, false),
  };
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

  facts.push(`${met.length} of ${deliverablesStatus.length} deliverables evidenced via reviewed submissions.`);
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