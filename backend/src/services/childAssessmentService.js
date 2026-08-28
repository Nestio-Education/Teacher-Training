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



export function normalizeAgeGroup(strVal) {
  if (strVal === undefined || strVal === null || strVal === "") return null;
  const s = String(strVal).trim().toLowerCase();

  if (s.includes("1-2") || s.includes("1–2") || s.includes("toddler")) return "1–2 Years";
  if (s.includes("2-3") || s.includes("2–3") || s.includes("playgroup")) return "2–3 Years";
  if (s.includes("3-4") || s.includes("3–4") || s.includes("nursery")) return "3–4 Years";
  if (s.includes("4-5") || s.includes("4–5") || s.includes("5-6") || s.includes("5–6") || s.includes("jr") || s.includes("sr") || s.includes("junior") || s.includes("senior")) return "4–5 Years";

  const num = Number(s);
  if (!isNaN(num)) {
    if (num < 2.0) return "1–2 Years";
    if (num < 3.0) return "2–3 Years";
    if (num < 4.0) return "3–4 Years";
    return "4–5 Years";
  }

  return null;
}

export function getAgeGroupFromChild(child) {
  if (!child) return "2–3 Years";

  // 1. Explicit ageGroup property (handles "3-4 Years", "3–4 Years", etc.)
  if (child.ageGroup) {
    const norm = normalizeAgeGroup(child.ageGroup);
    if (norm) return norm;
  }
  if (child.class?.ageGroup) {
    const norm = normalizeAgeGroup(child.class.ageGroup);
    if (norm) return norm;
  }

  // 2. DOB calculation
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

  // 3. Numeric/string age property (e.g. 3, "3", "3-4")
  if (child.age !== undefined && child.age !== null) {
    const normAge = normalizeAgeGroup(child.age);
    if (normAge) return normAge;
  }

  // 4. Class Name / Label Fallback (e.g. "Nursery (3-4)", "Nursery", "3-4")
  const classNameStr = child.className || child.class?.name || child.class;
  if (classNameStr) {
    const normClass = normalizeAgeGroup(classNameStr);
    if (normClass) return normClass;
  }

  return "2–3 Years";
}
