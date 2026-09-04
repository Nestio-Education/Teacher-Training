// backend/src/services/pdcaGrounding.js
//
// Deterministic, rule-based fact assembly for the PDCA generator, driven by
// a MonthCurriculum document instead of hardcoded per-month constants. This
// is the "grounding" layer: every count/status here is computed from real
// ActivitySubmission + TeacherTask records, never guessed — the AI service
// only turns these pre-computed facts into prose. Generalizes what used to
// be month1Grounding.js (kept in place, unused, for reference) so it works
// for any month once its curriculum has been uploaded and published.
/**
 * Given an activity's date and the fellow's fellowship-start anchor,
 * returns which fellowship month (1–24) that activity falls into, or
 * null if it's outside the 24-month window. This is what actually
 * answers "which month does this activity count towards" — the anchor
 * is teacherProfile.fellowshipStartDate if set, else the account's
 * createdAt (when they were approved/onboarded).
 */
export function computeFellowshipMonth(dateValue, anchorDate) {
  const d = new Date(dateValue);
  const anchor = new Date(anchorDate);
  if (isNaN(d) || isNaN(anchor)) return null;
  const monthNum =
    (d.getFullYear() - anchor.getFullYear()) * 12 +
    (d.getMonth() - anchor.getMonth()) +
    1;
  return monthNum >= 1 && monthNum <= 24 ? monthNum : null;
}

// Maps a calendar category to the natural-language phrases a mentor would
// actually write for it, so keyword-based deliverable matching (e.g.
// "anganwadi visits", "home visit") reliably fires even when the fellow's
// own title/notes wording differs from the curriculum's exact phrasing.
const CATEGORY_SIGNAL_PHRASES = {
  field_visit: "field visit field visits home visit home visits anganwadi visit anganwadi visits",
  pcb_session: "pcb session anganwadi visit anganwadi visits parent capacity building",
  class_lesson: "class lesson classroom session lesson plan",
  self_learning: "self learning",
  mentor_task: "mentor assigned task",
  custom_task: "",
};

function normalizeTaskSignals(tasks) {
  // Only a task explicitly reported as "completed" counts as real
  // evidence — "partial" and "skipped" reports set task.completed=true
  // too (it just means the report was filed), but they are NOT the
  // fellow saying they actually finished the activity, so they must
  // never auto-tick a checklist item.
  return (tasks || [])
    .filter((t) => t.completed && t.completionStatus === "completed")
    .map((t) => ({
      text: `${t.title || ""} ${t.category || ""} ${CATEGORY_SIGNAL_PHRASES[t.category] || ""} ${t.reportNotes || ""}`.toLowerCase(),
      date: new Date(t.date || t.createdAt),
    }));
}

function normalizeSubmissionSignals(submissions) {
  return (submissions || []).map((s) => ({
    text: `${s.activityName || ""} ${s.description || ""} ${s.type || ""} ${s.purposeOfActivity || ""}`.toLowerCase(),
    date: new Date(s.activityDate || s.createdAt),
  }));
}

/**
 * Match logged Today's Tasks + Fellow Activity Submissions against a
 * curriculum's deliverables list. Returns a status per deliverable:
 *   - "met"     -> combined evidence (calendar task marked Completed +
 *                  reported, and/or a formal Activity Submission) meets
 *                  the deliverable's target count
 *   - "not_met" -> not enough matching evidence yet
 *
 * A completed-and-reported calendar task counts exactly like a formal
 * Activity Submission here — the fellow did the real-world activity
 * either way, so either one should auto-tick the checklist. This is
 * the intentional "just do the activity, checklist ticks itself"
 * behaviour requested for the PDCA/Task-of-the-Month sync.
 */
export function matchDeliverables(deliverableDefs, submissions, tasks = []) {
  const subSignals = normalizeSubmissionSignals(submissions);
  const taskSignals = normalizeTaskSignals(tasks);

  return (deliverableDefs || []).map((d) => {
    const keywords = d.keywords || [];
    const subMatches = subSignals.filter((s) => keywords.some((k) => s.text.includes(k)));
    const taskMatches = taskSignals.filter((s) => keywords.some((k) => s.text.includes(k)));
    // Combined: a completed calendar task and a formal submission are
    // both real evidence the activity happened, so both count toward
    // the target — a fellow shouldn't need to do the same activity
    // twice (once as a task, once as a "real" submission) to get credit.
    const count = subMatches.length + taskMatches.length;
    const target = d.targetCount || 1;
    const met = count >= target;

    const status = met ? "met" : "not_met";

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