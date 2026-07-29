import { SECTIONS, computeSectionScores, scoreOf, getAcademicYear } from "../data/childAssessmentSections.js";

/**
 * Recompute section scores purely from answers server-side to prevent client spoofing.
 */
export function computeAndValidateSectionScores(answers) {
  return computeSectionScores(answers);
}

/**
 * Build activity recommendations from the Section-wise Score Breakdown chart.
 * HIGH score → 1-2 suggestions only (child is doing well)
 * LOW score  → MORE suggestions (child needs support)
 */
export function buildRecommendations(sectionScores, answers) {
  return SECTIONS.map((section) => {
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
