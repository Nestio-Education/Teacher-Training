// backend/src/data/monthMeta.js
export const MONTH_TITLES = {
  1: "Orientation & Community Immersion",
  2: "Understanding Child Development (0–6 Years)",
  3: "Child Psychology & Theories",
  4: "Lesson Planning & Session Design",
  5: "Home Visits & Parent Interaction (Basic)",
  6: "Parent-Toddler Program, Storytelling & Classroom Mgmt",
  7: "Advanced Parent Engagement",
  8: "Home as a Learning Space",
  9: "Teaching-Learning Materials (TLMs)",
  10: "Curriculum Frameworks (NIPUN, NCERT, etc.)",
  11: "Remedial Education & School Readiness",
  12: "Community Communication (IEC/BCC)",
  13: "ECCE in Public Policy",
  14: "ICDS & Stakeholder Mapping",
  15: "Monitoring & Evaluation (M&E)",
  16: "Working in Marginalized Contexts",
  17: "Teaching & Facilitation Practice",
  18: "Capstone Project – Phase 1 (Design)",
  19: "Leadership & Facilitation",
  20: "Social Entrepreneurship in ECCE",
  21: "Budgeting & Resource Mobilization",
  22: "Proposal Writing & Donor Pitching",
  23: "Capstone Project – Phase 2 (Implementation)",
  24: "Capstone Project – Phase 2 (Scale & Showcase)",
};

export function semesterOf(month) {
  return Math.floor((month - 1) / 6) + 1;
}

export const SEMESTER_LABELS = {
  1: "Semester 1 — Months 1–6",
  2: "Semester 2 — Months 7–12",
  3: "Semester 3 — Months 13–18",
  4: "Semester 4 — Months 19–24",
};

export const MONTHS = Array.from({ length: 24 }, (_, i) => {
  const month = i + 1;
  return { month, title: MONTH_TITLES[month], semester: semesterOf(month) };
});
