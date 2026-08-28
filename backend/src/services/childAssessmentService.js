import { SECTIONS, AGE_GROUPS, computeSectionScores, scoreOf, getAcademicYear } from "../data/childAssessmentSections.js";

/**
 * Recompute section scores purely from answers server-side to prevent client spoofing.
 */
export function computeAndValidateSectionScores(answers, sectionsInput = SECTIONS) {
  return computeSectionScores(answers, sectionsInput);
}

/**
 * Build activity recommendations from the Section-wise Score Breakdown chart.
 * HIGH score → 1-2 suggestions only (child is doing well)
 * LOW score  → MORE suggestions (child needs support)
 */
export function buildRecommendations(sectionScores, answers, sectionsInput = SECTIONS) {
  const activeSections = sectionsInput || SECTIONS;
  return activeSections.map((section) => {
    const chartEntry = sectionScores.find((cs) => cs.id === section.id);
    if (!chartEntry) return null;

    const pct = chartEntry.max > 0 ? Math.round((chartEntry.score / chartEntry.max) * 100) : 0;

    let maxItems, maxActivitiesPerItem;
    if (pct >= 76) {
      // Doing great — just 1 item, 1 activity
      maxItems = 1;
      maxActivitiesPerItem = 1;
    } else if (pct >= 51) {
      // Good progress — 2 items, 1 activity each
      maxItems = 2;
      maxActivitiesPerItem = 1;
    } else if (pct >= 26) {
      // Needs support — all items, 2 activities each
      maxItems = section.items.length;
      maxActivitiesPerItem = 2;
    } else {
      // Needs strong support — ALL items, ALL activities
      maxItems = section.items.length;
      maxActivitiesPerItem = 3;
    }

    // Sort items by individual score (weakest first)
    const sortedItems = [...section.items].sort((a, b) => {
      const sa = scoreOf(answers[a.id]);
      const sb = scoreOf(answers[b.id]);
      return (sa === null ? -1 : sa) - (sb === null ? -1 : sb);
    });

    const items = sortedItems.slice(0, maxItems).map((item) => ({
      ...item,
      itemScore: scoreOf(answers[item.id]),
      activities: item.activities.slice(0, maxActivitiesPerItem),
    }));

    return {
      sectionId: section.id,
      sectionNumber: section.number,
      title: section.title,
      score: chartEntry.score,
      max: chartEntry.max,
      pct,
      items,
      totalActivities: items.reduce((sum, it) => sum + it.activities.length, 0),
    };
  })
    .filter(Boolean)
    .sort((a, b) => a.pct - b.pct);
}

/**
 * Finds the latest stage with data.
 * Checks Endline -> Midline -> Baseline for the given academic year first.
 * If fallbackToPreviousYear is true and nothing found, it checks the previous academic year.
 * The input is an array of assessment documents (ideally sorted by academicYear DESC, or just pass all assessments).
 */
export function getLatestStageWithData(assessments) {
  if (!assessments || assessments.length === 0) return null;

  // Group by academic year
  const groupedByYear = assessments.reduce((acc, curr) => {
    if (!acc[curr.academicYear]) acc[curr.academicYear] = {};
    acc[curr.academicYear][curr.stage] = curr;
    return acc;
  }, {});

  // Sort academic years descending
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
    // "2026-27" vs "2025-26" -> compare strings is fine as long as centuries match
    return b.localeCompare(a);
  });

  const stages = ["Endline", "Midline", "Baseline"];
  
  for (const year of sortedYears) {
    for (const stage of stages) {
      const assessment = groupedByYear[year][stage];
      if (assessment && assessment.answers && Object.keys(assessment.answers).length > 0) {
        return assessment;
      }
    }
  }

  return null;
}

export function getAgeGroupFromChild(child) {
  if (!child) return "2–3 Years";

  // 1. Direct explicit ageGroup matching
  if (child.ageGroup && AGE_GROUPS[child.ageGroup]) return child.ageGroup;
  if (child.class?.ageGroup && AGE_GROUPS[child.class.ageGroup]) return child.class.ageGroup;

  // 2. DOB calculation (checking dateOfBirth or dob)
  const dobVal = child.dateOfBirth || child.dob;
  if (dobVal) {
    const dob = new Date(dobVal);
    if (!isNaN(dob.getTime())) {
      const ageInYears = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (ageInYears < 2.0) return "1–2 Years";
      if (ageInYears < 3.0) return "2–3 Years";
      if (ageInYears < 4.0) return "3–4 Years";
      return "4–5 Years";
    }
  }

  // 3. Numeric age property
  if (typeof child.age === "number" || (child.age && !isNaN(Number(child.age)))) {
    const age = Number(child.age);
    if (age < 2.0) return "1–2 Years";
    if (age < 3.0) return "2–3 Years";
    if (age < 4.0) return "3–4 Years";
    return "4–5 Years";
  }

  // 4. Class Name / Label Fallback (e.g. "jr (4-5)", "4-5", "nursery", "1-2", "3-4")
  const classNameStr = String(child.className || child.class?.name || child.class || "").toLowerCase();
  if (classNameStr.includes("1-2") || classNameStr.includes("1–2") || classNameStr.includes("toddler")) {
    return "1–2 Years";
  }
  if (classNameStr.includes("2-3") || classNameStr.includes("2–3") || classNameStr.includes("playgroup")) {
    return "2–3 Years";
  }
  if (classNameStr.includes("3-4") || classNameStr.includes("3–4") || classNameStr.includes("nursery")) {
    return "3–4 Years";
  }
  if (classNameStr.includes("4-5") || classNameStr.includes("4–5") || classNameStr.includes("jr") || classNameStr.includes("junior")) {
    return "4–5 Years";
  }
  if (classNameStr.includes("5-6") || classNameStr.includes("5–6") || classNameStr.includes("sr") || classNameStr.includes("senior")) {
    return "4–5 Years";
  }

  return "2–3 Years";
}
