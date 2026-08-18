// backend/src/data/month1Curriculum.js
// Digitized from PDCA_Month_1.docx. Mirrors src/mentor/pdcaMonth1Template.js
// on the frontend (kept separate since backend/frontend are different
// packages here — update both if Month 1 curriculum changes).

export const MONTH1_MONTHLY_OBJECTIVE =
  "By the end of Month 1, the Fellow should understand SpacECE's work, the ECCE " +
  "ecosystem, the Anganwadi system and the context of their assigned community, " +
  "while beginning to build relationships with key stakeholders and developing " +
  "the habit of observation, documentation and reflection.";

export const MONTH1_WEEKLY_FOCUS = [
  { week: 1, focus: "System & Community Immersion — understand SpacECE and enter the community through observation." },
  { week: 2, focus: "Understanding the ECCE Ecosystem — connect field observations with ECCE concepts and SpacECE's approach." },
  { week: 3, focus: "Community Rapport Building — move from observation towards relationship building." },
  { week: 4, focus: "Documentation, Reflection & Preparation — consolidate Month 1 learning and prepare for Month 2." },
];

export const MONTH1_DELIVERABLES = [
  { id: "learning_goals", label: "Month 1 Learning Goals", keywords: ["learning goal", "learning objective"] },
  { id: "anganwadi_visits", label: "Anganwadi Visits (min. 4)", keywords: ["anganwadi visit", "aww visit"], targetCount: 4 },
  { id: "field_diary", label: "Field Diary / Reflection Entries (min. 4)", keywords: ["field diary", "reflection entry"], targetCount: 4 },
  { id: "community_map", label: "Community Map", keywords: ["community map"] },
  { id: "observation_notes", label: "Anganwadi Observation Notes", keywords: ["observation note", "anganwadi observation"] },
  { id: "aww_notes", label: "AWW Interaction Notes", keywords: ["aww interaction", "aww conversation", "aww follow-up"] },
  { id: "health_notes", label: "ASHA / Health Ecosystem Notes", keywords: ["asha", "health ecosystem"] },
  { id: "stakeholder_list", label: "Initial Stakeholder List", keywords: ["stakeholder list"] },
  { id: "stakeholder_map", label: "Stakeholder Map", keywords: ["stakeholder map"] },
  { id: "community_convo", label: "Community Member Conversation Notes", keywords: ["community conversation", "community member"] },
  { id: "family_id_list", label: "Family Identification List (Month 2)", keywords: ["family identification", "family id"] },
  { id: "community_profile", label: "Community Profile — Draft", keywords: ["community profile"] },
  { id: "theory_practice", label: "Theory–Practice Reflection", keywords: ["theory-practice", "theory practice", "theory of change"] },
  { id: "monthly_reflection", label: "Monthly Reflection", keywords: ["monthly reflection"] },
  { id: "month2_goals", label: "Month 2 Goals / Action Points", keywords: ["month 2 goal", "month 2 action"] },
];

// Success-check criteria, verbatim from the doc. "do" items are objectively
// countable (auto-assessable against real logged data); "check" items all
// require human judgement and are never auto-assessed — per Section 4:
// "criteria that require judgement ... are always left for the Mentor."
export const MONTH1_SUCCESS_CHECK = {
  plan: ["Understands SpacECE's work", "Understands Month 1 objectives", "Has identified learning questions", "Has identified initial stakeholders"],
  do: ["4 Anganwadi visits completed", "Community explored", "AWW/ASHA engaged", "Community members engaged", "Families identified for future home visits", "Observations documented"],
  check: ["Can explain Anganwadi routine", "Can describe the community context", "Can identify key stakeholders", "Can connect theory with field observations", "Can identify gaps and unanswered questions"],
  act: ["Community Profile prepared", "Stakeholder Map updated", "Feedback incorporated", "Families shortlisted for Month 2 home visits", "Month 2 goals established"],
};

export const CURRICULUM_MODULE_TAG_REGEX = /\[Linked Curriculum Module:\s*([^\]]+)\]/i;