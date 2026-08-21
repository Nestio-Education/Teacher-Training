// backend/src/data/monthCurricula.js
//
// Static, code-based curriculum for all 24 UMANG Fellowship months —
// digitized directly from PDCA_12_Cycle/*.docx and 13_to_24_months_pdca_cycle/*.docx.
// This intentionally bypasses MonthCurriculum (Mongo) and the Curriculum
// Manager admin upload/publish flow entirely: there is nothing to seed and
// nothing to publish. Every month's data is simply available the moment the
// server starts, exactly like the original Month 1 fallback
// (data/month1Curriculum.js) worked — just generalized to all 24 months and
// merged into one file.
//
// NOTE — Month 3 data quality: the source file "PDCA Month 3.docx" (Child
// Psychology & Theories) is a duplicate of Month 4's content in the original
// upload; its body below is Month 4's content as a placeholder. Replace the
// MONTH_CURRICULA[3] entry below once the correct Month 3 source is available.
//
// To edit any month's content: edit the relevant object below and restart
// the server — no database, no publish step, no admin UI required.

export const MONTH_CURRICULA = {
  1: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 1, the Fellow should understand SpacECE's work, the ECCE ecosystem, the Anganwadi system and the context of their assigned community, while beginning to build relationships with key stakeholders and developing the habit of observation, documentation and reflection.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "SYSTEM & COMMUNITY IMMERSION — Understand SpacECE and enter the community through observation."
      },
      {
        "week": 2,
        "focus": "UNDERSTANDING THE ECCE ECOSYSTEM — Connect field observations with ECCE concepts and SpacECE's approach."
      },
      {
        "week": 3,
        "focus": "COMMUNITY RAPPORT BUILDING — Move from observation towards relationship building."
      },
      {
        "week": 4,
        "focus": "DOCUMENTATION, REFLECTION & PREPARATION — Consolidate Month 1 learning and prepare for Month 2."
      }
    ],
    "deliverables": [
      {
        "id": "month_1_learning_goals",
        "label": "Month 1 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_4_anganwadi_visits",
        "label": "Minimum 4 Anganwadi Visits",
        "keywords": [
          "anganwadi visits"
        ],
        "targetCount": 4
      },
      {
        "id": "minimum_4_field_diary_reflection_entries",
        "label": "Minimum 4 Field Diary/Reflection Entries",
        "keywords": [
          "field diary",
          "diary reflection"
        ],
        "targetCount": 4
      },
      {
        "id": "community_map",
        "label": "Community Map",
        "keywords": [
          "community map"
        ],
        "targetCount": null
      },
      {
        "id": "anganwadi_observation_notes",
        "label": "Anganwadi Observation Notes",
        "keywords": [
          "anganwadi observation",
          "observation notes"
        ],
        "targetCount": null
      },
      {
        "id": "aww_interaction_notes",
        "label": "AWW Interaction Notes",
        "keywords": [
          "aww interaction",
          "interaction notes"
        ],
        "targetCount": null
      },
      {
        "id": "asha_health_ecosystem_notes",
        "label": "ASHA/Health Ecosystem Notes",
        "keywords": [
          "asha health",
          "health ecosystem"
        ],
        "targetCount": null
      },
      {
        "id": "initial_stakeholder_list",
        "label": "Initial Stakeholder List",
        "keywords": [
          "initial stakeholder",
          "stakeholder list"
        ],
        "targetCount": null
      },
      {
        "id": "stakeholder_map",
        "label": "Stakeholder Map",
        "keywords": [
          "stakeholder map"
        ],
        "targetCount": null
      },
      {
        "id": "community_member_conversation_notes",
        "label": "Community Member Conversation Notes",
        "keywords": [
          "community member",
          "member conversation"
        ],
        "targetCount": null
      },
      {
        "id": "family_identification_list_for_month_2",
        "label": "Family Identification List for Month 2",
        "keywords": [
          "family identification",
          "identification list"
        ],
        "targetCount": null
      },
      {
        "id": "community_profile_draft",
        "label": "Community Profile — Draft",
        "keywords": [
          "community profile"
        ],
        "targetCount": null
      },
      {
        "id": "theory_practice_reflection",
        "label": "Theory–Practice Reflection",
        "keywords": [
          "theory practice",
          "practice reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_2_goals_action_points",
        "label": "Month 2 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands SpacECE's work",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Month 1 objectives",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has identified learning questions",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has identified initial stakeholders",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "4 Anganwadi visits completed",
          "linkedDeliverableId": "minimum_4_anganwadi_visits"
        },
        {
          "criterion": "Community explored",
          "linkedDeliverableId": "community_map"
        },
        {
          "criterion": "AWW/ASHA engaged",
          "linkedDeliverableId": "asha_health_ecosystem_notes"
        },
        {
          "criterion": "Community members engaged",
          "linkedDeliverableId": "community_map"
        },
        {
          "criterion": "Families identified for future home visits",
          "linkedDeliverableId": "minimum_4_anganwadi_visits"
        },
        {
          "criterion": "Observations documented",
          "linkedDeliverableId": null
        }
      ],
      "check": [
        {
          "criterion": "Can explain Anganwadi routine",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can describe the community context",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify key stakeholders",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can connect theory with field observations",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify gaps and unanswered questions",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Community Profile prepared",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Stakeholder Map updated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Feedback incorporated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Families shortlisted for Month 2 home visits",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 2 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  2: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 2, the Fellow should understand the domains, stages and milestones of child development from 0–6 years, and be able to connect developmental theory with real observations of children at the Anganwadi — while also beginning to plan and conduct simple, age-appropriate daily activities with children, and building skills in structured observation and documentation.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "DOMAINS OF CHILD DEVELOPMENT — Build foundational understanding of the domains of child development (physical, cognitive, language, socio-emotional)."
      },
      {
        "week": 2,
        "focus": "PHYSICAL & COGNITIVE DEVELOPMENT — Observe and document physical and cognitive developmental indicators in young children."
      },
      {
        "week": 3,
        "focus": "LANGUAGE & SOCIO-EMOTIONAL DEVELOPMENT — Observe and document language and socio-emotional developmental indicators."
      },
      {
        "week": 4,
        "focus": "CONSOLIDATION & MILESTONE ASSIGNMENT — Consolidate Month 2 learning and prepare the Developmental Milestone Assignment."
      }
    ],
    "deliverables": [
      {
        "id": "month_2_learning_goals",
        "label": "Month 2 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_4_anganwadi_visits_development_f",
        "label": "Minimum 4 Anganwadi Visits (Development-focused)",
        "keywords": [
          "anganwadi visits"
        ],
        "targetCount": 4
      },
      {
        "id": "child_observation_sheets_3_4_children_co",
        "label": "Child Observation Sheets (3–4 children cohort)",
        "keywords": [
          "child observation",
          "observation sheets"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes_month_",
        "label": "Daily Activity Plan / Session Notes (Month 2 onwards)",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "developmental_milestone_assignment",
        "label": "Developmental Milestone Assignment",
        "keywords": [
          "developmental milestone",
          "milestone assignment"
        ],
        "targetCount": null
      },
      {
        "id": "domain_study_notes",
        "label": "Domain Study Notes",
        "keywords": [
          "domain study",
          "study notes"
        ],
        "targetCount": null
      },
      {
        "id": "milestone_chart_mapping",
        "label": "Milestone Chart Mapping",
        "keywords": [
          "milestone chart",
          "chart mapping"
        ],
        "targetCount": null
      },
      {
        "id": "aww_conversation_notes",
        "label": "AWW Conversation Notes",
        "keywords": [
          "aww conversation",
          "conversation notes"
        ],
        "targetCount": null
      },
      {
        "id": "parent_conversation_notes",
        "label": "Parent Conversation Notes",
        "keywords": [
          "parent conversation",
          "conversation notes"
        ],
        "targetCount": null
      },
      {
        "id": "physical_development_notes",
        "label": "Physical Development Notes",
        "keywords": [
          "physical development",
          "development notes"
        ],
        "targetCount": null
      },
      {
        "id": "cognitive_development_notes",
        "label": "Cognitive Development Notes",
        "keywords": [
          "cognitive development",
          "development notes"
        ],
        "targetCount": null
      },
      {
        "id": "language_development_notes",
        "label": "Language Development Notes",
        "keywords": [
          "language development",
          "development notes"
        ],
        "targetCount": null
      },
      {
        "id": "socio_emotional_notes",
        "label": "Socio-Emotional Notes",
        "keywords": [
          "socio emotional",
          "emotional notes"
        ],
        "targetCount": null
      },
      {
        "id": "theory_practice_reflection",
        "label": "Theory–Practice Reflection",
        "keywords": [
          "theory practice",
          "practice reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_3_goals_action_points",
        "label": "Month 3 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands the domains of child development",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Month 2 objectives",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has identified an observation cohort",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has reviewed milestone charts",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has planned simple daily activities aligned to developmental domains",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "4+ Anganwadi visits completed",
          "linkedDeliverableId": "minimum_4_anganwadi_visits_development_f"
        },
        {
          "criterion": "Observation cohort (3–4 children) tracked",
          "linkedDeliverableId": "child_observation_sheets_3_4_children_co"
        },
        {
          "criterion": "AWW/parents engaged",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Physical, cognitive, language & socio-emotional indicators observed",
          "linkedDeliverableId": "socio_emotional_notes"
        },
        {
          "criterion": "Daily activities with children conducted and documented",
          "linkedDeliverableId": "child_observation_sheets_3_4_children_co"
        },
        {
          "criterion": "Observations documented",
          "linkedDeliverableId": null
        }
      ],
      "check": [
        {
          "criterion": "Can explain developmental domains",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can map observations to milestone charts",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify individual variation among children",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can connect theory with field observations",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify developmental gaps/concerns and flag appropriately",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Developmental Milestone Assignment completed",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Observation Sheets finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Daily Activity Plan / Session Notes finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Feedback incorporated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 3 (Child Psychology) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 3 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  3: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 4, the Fellow should be able to design developmentally appropriate lesson plans and activity plans, and independently plan and lead structured sessions with children at the Anganwadi.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "LESSON PLANNING FUNDAMENTALS — Build foundational understanding of lesson planning structure and ECCE domain alignment."
      },
      {
        "week": 2,
        "focus": "DESIGNING ACTIVITY PLANS — Design and refine 3 activity plans covering different developmental domains."
      },
      {
        "week": 3,
        "focus": "PRACTICE SESSIONS & FEEDBACK — Deliver all 3 activity plans with children and gather structured feedback."
      },
      {
        "week": 4,
        "focus": "CONSOLIDATION & FINAL LESSON PLAN — Consolidate Month 4 learning into a finalised 1-week lesson plan."
      }
    ],
    "deliverables": [
      {
        "id": "month_4_learning_goals",
        "label": "Month 4 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_4_anganwadi_visits_session_deliv",
        "label": "Minimum 4 Anganwadi Visits (Session-delivery focused)",
        "keywords": [
          "anganwadi visits"
        ],
        "targetCount": 4
      },
      {
        "id": "3_activity_plans_covering_different_deve",
        "label": "3 Activity Plans (covering different developmental domains)",
        "keywords": [
          "activity plans"
        ],
        "targetCount": null
      },
      {
        "id": "1_week_lesson_plan",
        "label": "1-Week Lesson Plan",
        "keywords": [
          "week lesson",
          "lesson plan"
        ],
        "targetCount": null
      },
      {
        "id": "session_delivery_notes",
        "label": "Session Delivery Notes",
        "keywords": [
          "session delivery",
          "delivery notes"
        ],
        "targetCount": null
      },
      {
        "id": "mentor_observation_feedback",
        "label": "Mentor Observation Feedback",
        "keywords": [
          "mentor observation",
          "observation feedback"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes",
        "label": "Daily Activity Plan / Session Notes",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "theory_practice_reflection",
        "label": "Theory–Practice Reflection",
        "keywords": [
          "theory practice",
          "practice reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_5_goals_action_points",
        "label": "Month 5 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands lesson planning structure",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Month 4 objectives",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has mapped activities to ECCE domains",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "4+ Anganwadi visits completed",
          "linkedDeliverableId": "minimum_4_anganwadi_visits_session_deliv"
        },
        {
          "criterion": "3 activity plans designed and delivered",
          "linkedDeliverableId": "3_activity_plans_covering_different_deve"
        },
        {
          "criterion": "1-week lesson plan delivered",
          "linkedDeliverableId": "1_week_lesson_plan"
        },
        {
          "criterion": "Sessions documented",
          "linkedDeliverableId": null
        }
      ],
      "check": [
        {
          "criterion": "Can identify what worked and what didn't in each session",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can connect child engagement to session design choices",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can incorporate mentor/AWW feedback into revisions",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "1-Week Lesson Plan finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "3 Activity Plans finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Feedback incorporated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 5 (Home Visits) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 5 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  4: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 4, the Fellow should be able to design developmentally appropriate lesson plans and activity plans, and independently plan and lead structured sessions with children at the Anganwadi.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "LESSON PLANNING FUNDAMENTALS — Build foundational understanding of lesson planning structure and ECCE domain alignment."
      },
      {
        "week": 2,
        "focus": "DESIGNING ACTIVITY PLANS — Design and refine 3 activity plans covering different developmental domains."
      },
      {
        "week": 3,
        "focus": "PRACTICE SESSIONS & FEEDBACK — Deliver all 3 activity plans with children and gather structured feedback."
      },
      {
        "week": 4,
        "focus": "CONSOLIDATION & FINAL LESSON PLAN — Consolidate Month 4 learning into a finalised 1-week lesson plan."
      }
    ],
    "deliverables": [
      {
        "id": "month_4_learning_goals",
        "label": "Month 4 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_4_anganwadi_visits_session_deliv",
        "label": "Minimum 4 Anganwadi Visits (Session-delivery focused)",
        "keywords": [
          "anganwadi visits"
        ],
        "targetCount": 4
      },
      {
        "id": "3_activity_plans_covering_different_deve",
        "label": "3 Activity Plans (covering different developmental domains)",
        "keywords": [
          "activity plans"
        ],
        "targetCount": null
      },
      {
        "id": "1_week_lesson_plan",
        "label": "1-Week Lesson Plan",
        "keywords": [
          "week lesson",
          "lesson plan"
        ],
        "targetCount": null
      },
      {
        "id": "session_delivery_notes",
        "label": "Session Delivery Notes",
        "keywords": [
          "session delivery",
          "delivery notes"
        ],
        "targetCount": null
      },
      {
        "id": "mentor_observation_feedback",
        "label": "Mentor Observation Feedback",
        "keywords": [
          "mentor observation",
          "observation feedback"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes",
        "label": "Daily Activity Plan / Session Notes",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "theory_practice_reflection",
        "label": "Theory–Practice Reflection",
        "keywords": [
          "theory practice",
          "practice reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_5_goals_action_points",
        "label": "Month 5 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands lesson planning structure",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Month 4 objectives",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has mapped activities to ECCE domains",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "4+ Anganwadi visits completed",
          "linkedDeliverableId": "minimum_4_anganwadi_visits_session_deliv"
        },
        {
          "criterion": "3 activity plans designed and delivered",
          "linkedDeliverableId": "3_activity_plans_covering_different_deve"
        },
        {
          "criterion": "1-week lesson plan delivered",
          "linkedDeliverableId": "1_week_lesson_plan"
        },
        {
          "criterion": "Sessions documented",
          "linkedDeliverableId": null
        }
      ],
      "check": [
        {
          "criterion": "Can identify what worked and what didn't in each session",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can connect child engagement to session design choices",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can incorporate mentor/AWW feedback into revisions",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "1-Week Lesson Plan finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "3 Activity Plans finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Feedback incorporated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 5 (Home Visits) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 5 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  5: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 5, the Fellow should be able to plan and conduct respectful, structured home visits, communicate effectively with parents/caregivers about their child's development, and document these interactions clearly.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "HOME VISIT PREPARATION — Learn home visit protocol, consent, safety and basic parent-communication skills."
      },
      {
        "week": 2,
        "focus": "FIRST HOME VISIT — Conduct and document the first home visit."
      },
      {
        "week": 3,
        "focus": "SECOND HOME VISIT & DEEPER PARENT INTERACTION — Conduct the second home visit with a deeper focus on parent interaction."
      },
      {
        "week": 4,
        "focus": "CONSOLIDATION & REFLECTION JOURNAL — Consolidate Month 5 learning into a Reflection Journal."
      }
    ],
    "deliverables": [
      {
        "id": "month_5_learning_goals",
        "label": "Month 5 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "2_home_visit_reports",
        "label": "2 Home Visit Reports",
        "keywords": [
          "home visit",
          "visit reports"
        ],
        "targetCount": null
      },
      {
        "id": "reflection_journal",
        "label": "Reflection Journal",
        "keywords": [
          "reflection journal"
        ],
        "targetCount": null
      },
      {
        "id": "home_visit_protocol_notes",
        "label": "Home Visit Protocol Notes",
        "keywords": [
          "home visit",
          "visit protocol"
        ],
        "targetCount": null
      },
      {
        "id": "family_shortlist_consent_confirmation",
        "label": "Family Shortlist + Consent Confirmation",
        "keywords": [
          "family shortlist",
          "shortlist consent"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes",
        "label": "Daily Activity Plan / Session Notes",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "aww_follow_up_notes",
        "label": "AWW Follow-up Notes",
        "keywords": [
          "aww follow",
          "follow notes"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_6_goals_action_points",
        "label": "Month 6 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands home visit protocol and ethics",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Month 5 objectives",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has identified and secured consent from 2 families",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "2 home visits completed",
          "linkedDeliverableId": "2_home_visit_reports"
        },
        {
          "criterion": "Parents/caregivers engaged respectfully",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Daily activities with children at Anganwadi continued",
          "linkedDeliverableId": "daily_activity_plan_session_notes"
        },
        {
          "criterion": "Observations documented",
          "linkedDeliverableId": null
        }
      ],
      "check": [
        {
          "criterion": "Can connect home context to child's Anganwadi behaviour",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify communication challenges and successes",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can reflect on cultural sensitivities encountered",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "2 Home Visit Reports finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Reflection Journal completed",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Feedback incorporated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 6 (Parent-Toddler & Classroom Management) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 6 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  6: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 6, the Fellow should be able to design and conduct parent-toddler sessions using storytelling, and apply basic classroom management strategies confidently — consolidating all Semester 1 learning (community entry, child development, psychology, lesson planning, home visits) into independent field practice.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "PARENT-TODDLER PROGRAM DESIGN & STORYTELLING TECHNIQUE — Learn how to design a parent-toddler session and build storytelling technique."
      },
      {
        "week": 2,
        "focus": "CONDUCT SESSION 1 (PARENT-TODDLER + STORYTELLING) — Deliver the first parent-toddler storytelling session and gather feedback."
      },
      {
        "week": 3,
        "focus": "CLASSROOM MANAGEMENT STRATEGIES & PRACTICE — Learn and practise basic classroom management strategies during regular Anganwadi visits."
      },
      {
        "week": 4,
        "focus": "CONDUCT SESSION 2 & CONSOLIDATE SEMESTER 1 — Deliver the second parent-toddler session and consolidate the full Semester 1 portfolio."
      }
    ],
    "deliverables": [
      {
        "id": "month_6_learning_goals",
        "label": "Month 6 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "2_parent_toddler_session_plans_delivered",
        "label": "2 Parent-Toddler Session Plans (delivered)",
        "keywords": [
          "parent toddler",
          "toddler session"
        ],
        "targetCount": null
      },
      {
        "id": "storytelling_reflection",
        "label": "Storytelling Reflection",
        "keywords": [
          "storytelling reflection"
        ],
        "targetCount": null
      },
      {
        "id": "classroom_management_field_notes",
        "label": "Classroom Management Field Notes",
        "keywords": [
          "classroom management",
          "management field"
        ],
        "targetCount": null
      },
      {
        "id": "parent_feedback_summary_both_sessions",
        "label": "Parent Feedback Summary (both sessions)",
        "keywords": [
          "parent feedback",
          "feedback summary"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes",
        "label": "Daily Activity Plan / Session Notes",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "semester_1_consolidated_portfolio",
        "label": "Semester 1 Consolidated Portfolio",
        "keywords": [
          "semester consolidated",
          "consolidated portfolio"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_7_goals_action_points",
        "label": "Month 7 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands parent-toddler session design",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands storytelling technique",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands classroom management strategies",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "2 parent-toddler sessions conducted",
          "linkedDeliverableId": "2_parent_toddler_session_plans_delivered"
        },
        {
          "criterion": "Classroom management strategies practised independently",
          "linkedDeliverableId": "classroom_management_field_notes"
        },
        {
          "criterion": "Parents and children engaged",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Sessions documented",
          "linkedDeliverableId": "parent_feedback_summary_both_sessions"
        }
      ],
      "check": [
        {
          "criterion": "Can analyse parent feedback constructively",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify which classroom management strategies worked",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can connect this month's practice to Semester 1 learning overall",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Session plans and storytelling reflection finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Semester 1 Portfolio consolidated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Feedback incorporated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 7 (Advanced Parent Engagement) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Semester 2 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  7: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 7, the Fellow should be able to plan and conduct a structured parent meeting, using advanced engagement strategies to build genuine partnership between the Anganwadi and families, going beyond the basic interaction covered in Month 5.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "ADVANCED ENGAGEMENT STRATEGIES — Learn advanced parent-engagement and group-facilitation strategies."
      },
      {
        "week": 2,
        "focus": "MOBILISATION & MATERIALS PREPARATION — Mobilise parents and prepare all materials for the meeting."
      },
      {
        "week": 3,
        "focus": "CONDUCT THE PARENT MEETING — Deliver the parent meeting and immediately capture feedback."
      },
      {
        "week": 4,
        "focus": "CONSOLIDATION & ENGAGEMENT REPORT — Consolidate Month 7 learning into the final Engagement Report."
      }
    ],
    "deliverables": [
      {
        "id": "month_7_learning_goals",
        "label": "Month 7 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "1_parent_meeting_conducted",
        "label": "1 Parent Meeting Conducted",
        "keywords": [
          "parent meeting",
          "meeting conducted"
        ],
        "targetCount": null
      },
      {
        "id": "parent_meeting_agenda_materials",
        "label": "Parent Meeting Agenda + Materials",
        "keywords": [
          "parent meeting",
          "meeting agenda"
        ],
        "targetCount": null
      },
      {
        "id": "engagement_report",
        "label": "Engagement Report",
        "keywords": [
          "engagement"
        ],
        "targetCount": null
      },
      {
        "id": "community_feedback_summary",
        "label": "Community Feedback Summary",
        "keywords": [
          "community feedback",
          "feedback summary"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes",
        "label": "Daily Activity Plan / Session Notes",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_8_goals_action_points",
        "label": "Month 8 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands advanced parent engagement strategies",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Month 7 objectives",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has a clear meeting agenda and topic",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Parents mobilised and meeting conducted",
          "linkedDeliverableId": "1_parent_meeting_conducted"
        },
        {
          "criterion": "Materials prepared and used effectively",
          "linkedDeliverableId": "parent_meeting_agenda_materials"
        },
        {
          "criterion": "Daily activities with children continued",
          "linkedDeliverableId": "daily_activity_plan_session_notes"
        },
        {
          "criterion": "Meeting documented",
          "linkedDeliverableId": "1_parent_meeting_conducted"
        }
      ],
      "check": [
        {
          "criterion": "Can analyse turnout and engagement patterns",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify facilitation strengths and gaps",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can incorporate community feedback constructively",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Engagement Report finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Follow-up actions with concerned parents completed",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 8 (Home as a Learning Space) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 8 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  8: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 8, the Fellow should be able to assess a family's home environment for learning potential, and design and pilot a simple Home Learning Kit that parents can use with everyday resources.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "CONCEPT & NEEDS ASSESSMENT — Understand the concept of home as a learning space and assess what's available in cohort homes."
      },
      {
        "week": 2,
        "focus": "DESIGNING THE KIT — Build the Home Learning Kit prototype and prepare simple user instructions."
      },
      {
        "week": 3,
        "focus": "PILOTING WITH FAMILIES — Pilot the Home Learning Kit with 1–2 families and gather feedback."
      },
      {
        "week": 4,
        "focus": "CONSOLIDATION & FINAL DOCUMENTATION — Consolidate Month 8 learning into a finalised kit and documentation."
      }
    ],
    "deliverables": [
      {
        "id": "month_8_learning_goals",
        "label": "Month 8 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "home_learning_kit_prototype_finalised",
        "label": "Home Learning Kit Prototype (Finalised)",
        "keywords": [
          "home learning",
          "learning kit"
        ],
        "targetCount": null
      },
      {
        "id": "kit_user_guide",
        "label": "Kit User Guide",
        "keywords": [
          "kit user",
          "user guide"
        ],
        "targetCount": null
      },
      {
        "id": "needs_assessment_notes",
        "label": "Needs Assessment Notes",
        "keywords": [
          "needs assessment",
          "assessment notes"
        ],
        "targetCount": null
      },
      {
        "id": "pilot_feedback_summary_2_families",
        "label": "Pilot Feedback Summary (2 families)",
        "keywords": [
          "pilot feedback",
          "feedback summary"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes",
        "label": "Daily Activity Plan / Session Notes",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_9_goals_action_points",
        "label": "Month 9 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands the concept of home as a learning space",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Month 8 objectives",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has assessed cohort home resources",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Home Learning Kit designed and built",
          "linkedDeliverableId": "home_learning_kit_prototype_finalised"
        },
        {
          "criterion": "Kit piloted with 2 families",
          "linkedDeliverableId": "pilot_feedback_summary_2_families"
        },
        {
          "criterion": "Daily activities with children continued",
          "linkedDeliverableId": "daily_activity_plan_session_notes"
        },
        {
          "criterion": "Pilot documented",
          "linkedDeliverableId": "pilot_feedback_summary_2_families"
        }
      ],
      "check": [
        {
          "criterion": "Can analyse pilot feedback constructively",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify what made the kit usable or not",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can connect kit design to developmental domains",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Kit and User Guide finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Feedback incorporated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 9 (TLMs) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 9 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  9: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 9, the Fellow should be able to design and create 5 low-cost, DIY Teaching-Learning Materials (TLMs) covering different developmental domains, each with a simple user guide, and demonstrate their use with children.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "TLM DESIGN PRINCIPLES & DIY PRACTICE — Learn TLM design principles and practise basic DIY techniques."
      },
      {
        "week": 2,
        "focus": "CREATE TLMs 1–2 — Build and test the first two TLMs."
      },
      {
        "week": 3,
        "focus": "CREATE TLMs 3–5 — Build and test the remaining three TLMs."
      },
      {
        "week": 4,
        "focus": "CONSOLIDATION & DEMONSTRATION — Refine and finalise all 5 TLMs, and demonstrate them formally."
      }
    ],
    "deliverables": [
      {
        "id": "month_9_learning_goals",
        "label": "Month 9 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "5_tlms_covering_different_developmental_",
        "label": "5 TLMs (covering different developmental domains)",
        "keywords": [
          "tlms"
        ],
        "targetCount": null
      },
      {
        "id": "5_user_guides",
        "label": "5 User Guides",
        "keywords": [
          "user guides"
        ],
        "targetCount": null
      },
      {
        "id": "tlm_design_principles_notes",
        "label": "TLM Design Principles Notes",
        "keywords": [
          "tlm design",
          "design principles"
        ],
        "targetCount": null
      },
      {
        "id": "demonstration_feedback",
        "label": "Demonstration Feedback",
        "keywords": [
          "demonstration feedback"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes",
        "label": "Daily Activity Plan / Session Notes",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_10_goals_action_points",
        "label": "Month 10 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands TLM design principles",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Month 9 objectives",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has planned 5 TLM ideas across domains",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "5 TLMs created and tested",
          "linkedDeliverableId": "5_tlms_covering_different_developmental_"
        },
        {
          "criterion": "5 user guides drafted",
          "linkedDeliverableId": "5_user_guides"
        },
        {
          "criterion": "Daily activities with children continued",
          "linkedDeliverableId": "daily_activity_plan_session_notes"
        },
        {
          "criterion": "Testing documented",
          "linkedDeliverableId": null
        }
      ],
      "check": [
        {
          "criterion": "Can analyse which TLMs engaged children most and why",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify safety/durability issues and fix them",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can connect each TLM to a developmental domain",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "5 TLMs and user guides finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Feedback incorporated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 10 (Curriculum Frameworks) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 10 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  10: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 10, the Fellow should understand national ECCE curriculum frameworks (NIPUN Bharat, NCERT guidelines) and be able to design a 1-month ECCE lesson plan aligned to these frameworks, along with a reflection on how they connect to ground-level practice.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "STUDYING NIPUN BHARAT & NCERT FRAMEWORKS — Build foundational understanding of national ECCE curriculum frameworks."
      },
      {
        "week": 2,
        "focus": "MAPPING FRAMEWORK TO PRACTICE — Map current Anganwadi practice against framework expectations and identify gaps."
      },
      {
        "week": 3,
        "focus": "DRAFTING THE 1-MONTH ECCE LESSON PLAN — Draft the full 1-month ECCE lesson plan, week by week, aligned to framework competencies."
      },
      {
        "week": 4,
        "focus": "CONSOLIDATION & REFLECTION PAPER — Finalise the 1-month ECCE Lesson Plan and write the Reflection Paper."
      }
    ],
    "deliverables": [
      {
        "id": "month_10_learning_goals",
        "label": "Month 10 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "1_month_ecce_lesson_plan_framework_align",
        "label": "1-Month ECCE Lesson Plan (framework-aligned)",
        "keywords": [
          "ecce lesson",
          "lesson plan"
        ],
        "targetCount": null
      },
      {
        "id": "reflection_paper",
        "label": "Reflection Paper",
        "keywords": [
          "reflection paper"
        ],
        "targetCount": null
      },
      {
        "id": "curriculum_framework_study_notes",
        "label": "Curriculum Framework Study Notes",
        "keywords": [
          "curriculum framework",
          "framework study"
        ],
        "targetCount": null
      },
      {
        "id": "framework_alignment_gap_analysis_notes",
        "label": "Framework Alignment / Gap Analysis Notes",
        "keywords": [
          "framework alignment",
          "alignment gap"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes",
        "label": "Daily Activity Plan / Session Notes",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_11_goals_action_points",
        "label": "Month 11 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands NIPUN Bharat and NCERT frameworks",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Month 10 objectives",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has mapped current practice to framework competencies",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Framework-linked observations conducted",
          "linkedDeliverableId": "1_month_ecce_lesson_plan_framework_align"
        },
        {
          "criterion": "1-Month ECCE Lesson Plan drafted week by week",
          "linkedDeliverableId": "1_month_ecce_lesson_plan_framework_align"
        },
        {
          "criterion": "Draft activities piloted with children",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Daily activities with children continued",
          "linkedDeliverableId": "daily_activity_plan_session_notes"
        }
      ],
      "check": [
        {
          "criterion": "Can identify gaps between framework and field practice",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can explain root causes of these gaps",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can incorporate mentor feedback into the lesson plan",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "1-Month ECCE Lesson Plan finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Reflection Paper completed",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 11 (Remedial Education) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 11 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  11: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 11, the Fellow should understand school-readiness concepts and remedial education principles, and be able to design and pilot 3 remedial activity plans for children who need additional support.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "SCHOOL READINESS & REMEDIAL EDUCATION BASICS — Understand what school readiness means and the basic principles of remedial education."
      },
      {
        "week": 2,
        "focus": "DESIGNING REMEDIAL ACTIVITY PLANS — Design 3 remedial activity plans targeting specific identified gaps."
      },
      {
        "week": 3,
        "focus": "PILOTING & REFINING REMEDIAL ACTIVITIES — Pilot all 3 remedial activity plans and refine based on children's response."
      },
      {
        "week": 4,
        "focus": "CONSOLIDATION & DEMONSTRATION — Finalise all 3 remedial activity plans and demonstrate them formally."
      }
    ],
    "deliverables": [
      {
        "id": "month_11_learning_goals",
        "label": "Month 11 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "3_remedial_activity_plans_piloted_and_fi",
        "label": "3 Remedial Activity Plans (piloted and finalised)",
        "keywords": [
          "remedial activity",
          "activity plans"
        ],
        "targetCount": null
      },
      {
        "id": "identified_children_list_progress_summar",
        "label": "Identified Children List + Progress Summary",
        "keywords": [
          "identified children",
          "children list"
        ],
        "targetCount": null
      },
      {
        "id": "school_readiness_remedial_education_note",
        "label": "School Readiness & Remedial Education Notes",
        "keywords": [
          "school readiness",
          "readiness remedial"
        ],
        "targetCount": null
      },
      {
        "id": "activity_demonstration_feedback",
        "label": "Activity Demonstration Feedback",
        "keywords": [
          "activity demonstration",
          "demonstration feedback"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes",
        "label": "Daily Activity Plan / Session Notes",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_12_goals_action_points",
        "label": "Month 12 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands school readiness indicators",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands remedial education principles",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has identified children needing targeted support",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "3 remedial activity plans designed and piloted",
          "linkedDeliverableId": "3_remedial_activity_plans_piloted_and_fi"
        },
        {
          "criterion": "Identified children engaged individually/in small groups",
          "linkedDeliverableId": "identified_children_list_progress_summar"
        },
        {
          "criterion": "Daily activities with wider cohort continued",
          "linkedDeliverableId": "daily_activity_plan_session_notes"
        },
        {
          "criterion": "Piloting documented",
          "linkedDeliverableId": null
        }
      ],
      "check": [
        {
          "criterion": "Can analyse each child's response to targeted activities",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can adjust method based on individual response",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can incorporate mentor/AWW feedback",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "3 Remedial Activity Plans finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Feedback incorporated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 12 (Community Communication) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 12 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  12: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 12, the Fellow should understand IEC/BCC (Information, Education & Communication / Behaviour Change Communication) principles, and be able to design and pilot simple community-communication materials that support parent and community behaviour change on an ECCE-relevant topic — consolidating the full Semester 2 portfolio.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "IEC/BCC PRINCIPLES & TOPIC SELECTION — Understand IEC/BCC design principles and select a relevant community-communication topic."
      },
      {
        "week": 2,
        "focus": "DESIGNING THE MATERIALS — Design the IEC/BCC materials with simple, clear messaging and visuals."
      },
      {
        "week": 3,
        "focus": "PILOTING WITH THE COMMUNITY — Pilot the IEC/BCC materials with parents/community members and gather response."
      },
      {
        "week": 4,
        "focus": "CONSOLIDATION & SEMESTER 2 PORTFOLIO — Finalise the IEC/BCC materials and consolidate the full Semester 2 portfolio."
      }
    ],
    "deliverables": [
      {
        "id": "month_12_learning_goals",
        "label": "Month 12 Learning Goals",
        "keywords": [
          "learning goals"
        ],
        "targetCount": null
      },
      {
        "id": "iec_bcc_materials_finalised",
        "label": "IEC/BCC Materials (Finalised)",
        "keywords": [
          "iec bcc",
          "bcc materials"
        ],
        "targetCount": null
      },
      {
        "id": "parent_communication_output",
        "label": "Parent Communication Output",
        "keywords": [
          "parent communication",
          "communication output"
        ],
        "targetCount": null
      },
      {
        "id": "community_response_summary",
        "label": "Community Response Summary",
        "keywords": [
          "community response",
          "response summary"
        ],
        "targetCount": null
      },
      {
        "id": "iec_bcc_principles_notes",
        "label": "IEC/BCC Principles Notes",
        "keywords": [
          "iec bcc",
          "bcc principles"
        ],
        "targetCount": null
      },
      {
        "id": "daily_activity_plan_session_notes",
        "label": "Daily Activity Plan / Session Notes",
        "keywords": [
          "daily activity",
          "activity plan"
        ],
        "targetCount": null
      },
      {
        "id": "semester_2_consolidated_portfolio",
        "label": "Semester 2 Consolidated Portfolio",
        "keywords": [
          "semester consolidated",
          "consolidated portfolio"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection",
        "label": "Monthly Reflection",
        "keywords": [
          "monthly reflection"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_mentor_review",
        "label": "Monthly Mentor Review",
        "keywords": [
          "monthly mentor",
          "mentor review"
        ],
        "targetCount": null
      },
      {
        "id": "month_13_goals_action_points",
        "label": "Month 13 Goals/Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands IEC/BCC design principles",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Month 12 objectives",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has selected a relevant, community-informed topic",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "IEC/BCC materials designed and piloted",
          "linkedDeliverableId": "iec_bcc_materials_finalised"
        },
        {
          "criterion": "Community members engaged for feedback",
          "linkedDeliverableId": "community_response_summary"
        },
        {
          "criterion": "Daily activities with children continued",
          "linkedDeliverableId": "daily_activity_plan_session_notes"
        },
        {
          "criterion": "Piloting documented",
          "linkedDeliverableId": null
        }
      ],
      "check": [
        {
          "criterion": "Can analyse community response and comprehension",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify what messaging/visual choices worked",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can incorporate feedback into the final material",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "IEC/BCC materials and parent communication output finalised",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Semester 2 Portfolio consolidated",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Month 13 (ECCE in Public Policy) focus areas identified",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Semester 3 goals established",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  13: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 13, the Fellow should understand the public policy landscape governing Early Childhood Care and Education (ECCE) in India—including NEP 2020, NIPUN Bharat, and National ECCE Frameworks—and connect high-level policy mandates with grassroots Anganwadi realities, while actively conducting daily preschool learning activities and producing an actionable Policy Brief and Research Paper.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "NATIONAL POLICY FRAMEWORKS & ANGANWADI GROUND REALITY — Understand national ECCE policy standards (NEP 2020, National ECCE Policy) and assess physical and learning infrastructure against these norms."
      },
      {
        "week": 2,
        "focus": "STATE GUIDELINES, FINANCING & CONVERGENCE — Examine state-level ECCE guidelines, ICDS budget allocations, and inter-departmental convergence (Education, Health, and WCD)."
      },
      {
        "week": 3,
        "focus": "POLICY ANALYSIS, EVIDENCE SYNTHESIS & DRAFTING — Synthesize field observations and regulatory research into a formal Policy Brief and draft the academic Research Paper."
      },
      {
        "week": 4,
        "focus": "POLICY DISSEMINATION, FINALIZATION & TRANSITION — Finalize the Policy Brief and Research Paper, deliver a policy presentation, and consolidate Month 13 portfolio."
      }
    ],
    "deliverables": [
      {
        "id": "month_13_learning_goals_policy_analysis_",
        "label": "Month 13 Learning Goals & Policy Analysis Matrix",
        "keywords": [
          "learning goals",
          "goals policy"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_anganwadi_preschool_acti",
        "label": "Minimum 8 Daily Anganwadi Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily anganwadi",
          "anganwadi preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "infrastructure_quality_policy_compliance",
        "label": "Infrastructure & Quality Policy Compliance Audit Checklist",
        "keywords": [
          "infrastructure quality",
          "quality policy"
        ],
        "targetCount": null
      },
      {
        "id": "aww_policy_implementation_workload_notes",
        "label": "AWW Policy Implementation & Workload Notes",
        "keywords": [
          "aww policy",
          "policy implementation"
        ],
        "targetCount": null
      },
      {
        "id": "supplementary_nutrition_health_complianc",
        "label": "Supplementary Nutrition & Health Compliance Report",
        "keywords": [
          "supplementary nutrition",
          "nutrition health"
        ],
        "targetCount": null
      },
      {
        "id": "cdpo_supervisor_interview_notes",
        "label": "CDPO / Supervisor Interview Notes",
        "keywords": [
          "cdpo supervisor",
          "supervisor interview"
        ],
        "targetCount": null
      },
      {
        "id": "local_governance_panchayat_consultation_",
        "label": "Local Governance (Panchayat) Consultation Notes",
        "keywords": [
          "local governance",
          "governance consultation"
        ],
        "targetCount": null
      },
      {
        "id": "parent_policy_perception_survey_notes",
        "label": "Parent Policy Perception Survey Notes",
        "keywords": [
          "parent policy",
          "policy perception"
        ],
        "targetCount": null
      },
      {
        "id": "comparative_policy_case_study_summary",
        "label": "Comparative Policy Case Study Summary",
        "keywords": [
          "comparative policy",
          "policy case"
        ],
        "targetCount": null
      },
      {
        "id": "draft_ecce_policy_brief_with_peer_review",
        "label": "Draft ECCE Policy Brief (with peer review log)",
        "keywords": [
          "ecce policy",
          "policy brief"
        ],
        "targetCount": null
      },
      {
        "id": "final_ecce_policy_brief_submitted",
        "label": "Final ECCE Policy Brief (Submitted)",
        "keywords": [
          "ecce policy",
          "policy brief"
        ],
        "targetCount": null
      },
      {
        "id": "final_research_paper_on_ecce_policy_impl",
        "label": "Final Research Paper on ECCE Policy Implementation",
        "keywords": [
          "research paper",
          "paper ecce"
        ],
        "targetCount": null
      },
      {
        "id": "policy_presentation_deck",
        "label": "Policy Presentation Deck",
        "keywords": [
          "policy presentation",
          "presentation deck"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection_field_diary_entries",
        "label": "Monthly Reflection & Field Diary Entries",
        "keywords": [
          "monthly reflection",
          "reflection field"
        ],
        "targetCount": null
      },
      {
        "id": "structured_monthly_mentor_review",
        "label": "Structured Monthly Mentor Review",
        "keywords": [
          "structured monthly",
          "monthly mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_14_goals_action_points",
        "label": "Month 14 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands NEP 2020 early childhood foundational stage goals",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands National ECCE Policy (2013) & NIPUN Bharat FLN norms",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has mapped statutory benchmarks for space, ratio, and curriculum",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has formulated clear learning questions for field verification",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Delivered regular structured learning sessions (circle time, storytelling, math/literacy readiness)",
          "linkedDeliverableId": "month_13_learning_goals_policy_analysis_"
        },
        {
          "criterion": "Conducted comprehensive infrastructure and TLM policy audits",
          "linkedDeliverableId": "infrastructure_quality_policy_compliance"
        },
        {
          "criterion": "Engaged AWW, CDPO, Supervisors, and Panchayat representatives",
          "linkedDeliverableId": "cdpo_supervisor_interview_notes"
        },
        {
          "criterion": "Documented parent perceptions and center nutrition delivery",
          "linkedDeliverableId": "supplementary_nutrition_health_complianc"
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can identify structural bottlenecks (teacher workload, material supply, multi-age challenges)",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can contrast official curriculum guidelines with real daily classroom practice",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can evaluate public budget utilization at the grassroots level",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has synthesized findings into structured gap analyses",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Finalized comprehensive ECCE Policy Brief with practical solutions",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Completed academic Research Paper with evidence-based findings",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Presented policy recommendations to mentors and peers",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established seamless transition plan and goals for Month 14",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  14: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 14, the Fellow should comprehensively master the institutional ecosystem and stakeholder network surrounding the child—including the ICDS administrative hierarchy, the frontline health triad (AWW, ASHA, ANM), local governance (PRIs), and family dynamics—while delivering daily preschool learning activities and producing a detailed Stakeholder Map and Stakeholder Engagement Strategy Report.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "ICDS ADMINISTRATIVE HIERARCHY & CENTER OPERATIONS — Map the formal administrative hierarchy of ICDS (CDPO, Supervisor, AWW, Helper) and document frontline center operational workflows."
      },
      {
        "week": 2,
        "focus": "THE FRONTLINE HEALTH & NUTRITION TRIAD (AWW, ASHA, ANM) — Analyze the convergence and coordination among frontline workers (AWW, ASHA, ANM) during Village Health, Sanitation and Nutrition Days (VHSND)."
      },
      {
        "week": 3,
        "focus": "LOCAL GOVERNANCE (PRIS), COMMUNITY LEADERS & FAMILIES — Map local political leadership (Panchayati Raj Institutions / Ward Members), informal community influencers, and family decision-makers."
      },
      {
        "week": 4,
        "focus": "STAKEHOLDER ENGAGEMENT STRATEGY, ACTION PLAN & TRANSITION — Finalize the comprehensive Stakeholder Map, compile the Stakeholder Engagement Strategy Report, and prepare for Month 15 (M&E)."
      }
    ],
    "deliverables": [
      {
        "id": "month_14_learning_goals_icds_hierarchy_c",
        "label": "Month 14 Learning Goals & ICDS Hierarchy Chart",
        "keywords": [
          "learning goals",
          "goals icds"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_anganwadi_preschool_acti",
        "label": "Minimum 8 Daily Anganwadi Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily anganwadi",
          "anganwadi preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "aww_operational_workflow_administrative_",
        "label": "AWW Operational Workflow & Administrative Burden Notes",
        "keywords": [
          "aww operational",
          "operational workflow"
        ],
        "targetCount": null
      },
      {
        "id": "asha_worker_early_health_tracking_interv",
        "label": "ASHA Worker & Early Health Tracking Interview Notes",
        "keywords": [
          "asha worker",
          "worker early"
        ],
        "targetCount": null
      },
      {
        "id": "vhsnd_observation_frontline_triad_aaa_co",
        "label": "VHSND Observation & Frontline Triad (AAA) Coordination Report",
        "keywords": [
          "vhsnd observation",
          "observation frontline"
        ],
        "targetCount": null
      },
      {
        "id": "anganwadi_helper_daily_operations_nutrit",
        "label": "Anganwadi Helper Daily Operations & Nutrition Notes",
        "keywords": [
          "anganwadi helper",
          "helper daily"
        ],
        "targetCount": null
      },
      {
        "id": "panchayat_local_governance_leadership_in",
        "label": "Panchayat / Local Governance Leadership Interview Notes",
        "keywords": [
          "panchayat local",
          "local governance"
        ],
        "targetCount": null
      },
      {
        "id": "community_influencers_social_gatekeepers",
        "label": "Community Influencers & Social Gatekeepers Map",
        "keywords": [
          "community influencers",
          "influencers social"
        ],
        "targetCount": null
      },
      {
        "id": "caregiver_parent_focus_group_discussion_",
        "label": "Caregiver / Parent Focus Group Discussion Summary",
        "keywords": [
          "caregiver parent",
          "parent focus"
        ],
        "targetCount": null
      },
      {
        "id": "power_interest_stakeholder_matrix",
        "label": "Power-Interest Stakeholder Matrix",
        "keywords": [
          "power interest",
          "interest stakeholder"
        ],
        "targetCount": null
      },
      {
        "id": "comprehensive_stakeholder_map_final_visu",
        "label": "Comprehensive Stakeholder Map (Final Visual & Detailed Format)",
        "keywords": [
          "comprehensive stakeholder",
          "stakeholder map"
        ],
        "targetCount": null
      },
      {
        "id": "stakeholder_engagement_strategy_report_a",
        "label": "Stakeholder Engagement Strategy Report (Actionable Recommendations)",
        "keywords": [
          "stakeholder engagement",
          "engagement strategy"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection_field_diary_entries",
        "label": "Monthly Reflection & Field Diary Entries",
        "keywords": [
          "monthly reflection",
          "reflection field"
        ],
        "targetCount": null
      },
      {
        "id": "structured_monthly_mentor_review",
        "label": "Structured Monthly Mentor Review",
        "keywords": [
          "structured monthly",
          "monthly mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_15_goals_action_points",
        "label": "Month 15 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands the full ICDS administrative chain from block to center level",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands stakeholder mapping methodologies (Power-Interest, Empathy mapping)",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has identified key formal and informal ecosystem actors",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has prepared structured field inquiry tools and learning goals",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Delivered regular structured early childhood learning activities (motor, literacy, pre-math, art)",
          "linkedDeliverableId": "month_14_learning_goals_icds_hierarchy_c"
        },
        {
          "criterion": "Conducted in-depth interviews with AWW, ASHA, ANM, and Helper",
          "linkedDeliverableId": "asha_worker_early_health_tracking_interv"
        },
        {
          "criterion": "Engaged Gram Panchayat representatives and informal community elders",
          "linkedDeliverableId": "panchayat_local_governance_leadership_in"
        },
        {
          "criterion": "Facilitated parent and caregiver focus group discussions",
          "linkedDeliverableId": "caregiver_parent_focus_group_discussion_"
        },
        {
          "criterion": "Maintained systematic activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can assess the frontline coordination and friction between AWW, ASHA, and ANM",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can map the level of community ownership and PRI support for the Anganwadi",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify high-influence, high-interest champions for early childhood",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has synthesized findings into structured stakeholder matrices",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Finalized comprehensive Stakeholder Map across all ecosystem levels",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Produced a detailed Stakeholder Engagement Strategy Report with practical engagement pathways",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Incorporated mentor feedback into final coalition-building recommendations",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established clear transition plan and goals for Month 15 (M&E)",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  15: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 15, the Fellow should master Monitoring and Evaluation (M&E) frameworks in early childhood settings, design and administer baseline survey tools and developmental observation checklists, analyze learning and growth indicators, and produce an actionable Baseline Survey Report while facilitating daily structured preschool learning activities.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "ECCE M&E FRAMEWORKS, LOGFRAMES & TOOL DESIGN — Build understanding of results-based monitoring frameworks and design child assessment tools."
      },
      {
        "week": 2,
        "focus": "FIELD DATA COLLECTION & CHILD BASELINE ASSESSMENTS — Administer child developmental assessments and caregiver surveys across center cohorts."
      },
      {
        "week": 3,
        "focus": "DATA CLEANING, QUANTITATIVE ANALYSIS & DASHBOARDS — Clean survey datasets, perform descriptive analysis, and create visual progress dashboards."
      },
      {
        "week": 4,
        "focus": "BASELINE REPORT COMPILATION, DISSEMINATION & TRANSITION — Compile and publish the Baseline Survey Report, share findings with center stakeholders, and set Month 16 goals."
      }
    ],
    "deliverables": [
      {
        "id": "month_15_learning_goals_m_e_indicator_re",
        "label": "Month 15 Learning Goals & M&E Indicator Reference Matrix",
        "keywords": [
          "learning goals",
          "goals indicator"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_anganwadi_preschool_acti",
        "label": "Minimum 8 Daily Anganwadi Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily anganwadi",
          "anganwadi preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "standardized_child_developmental_assessm",
        "label": "Standardized Child Developmental Assessment Tool (Validated)",
        "keywords": [
          "standardized child",
          "child developmental"
        ],
        "targetCount": null
      },
      {
        "id": "anganwadi_center_learning_environment_in",
        "label": "Anganwadi Center Learning Environment & Infrastructure Audit Tool",
        "keywords": [
          "anganwadi center",
          "center learning"
        ],
        "targetCount": null
      },
      {
        "id": "caregiver_household_baseline_survey_ques",
        "label": "Caregiver Household Baseline Survey Questionnaire",
        "keywords": [
          "caregiver household",
          "household baseline"
        ],
        "targetCount": null
      },
      {
        "id": "completed_baseline_assessment_sheets_ful",
        "label": "Completed Baseline Assessment Sheets (Full Child Cohort)",
        "keywords": [
          "completed baseline",
          "baseline assessment"
        ],
        "targetCount": null
      },
      {
        "id": "cleaned_digital_baseline_dataset_spreads",
        "label": "Cleaned Digital Baseline Dataset Spreadsheet",
        "keywords": [
          "cleaned digital",
          "digital baseline"
        ],
        "targetCount": null
      },
      {
        "id": "visual_center_baseline_dashboard_child_d",
        "label": "Visual Center Baseline Dashboard (Child Development & Attendance)",
        "keywords": [
          "visual center",
          "center baseline"
        ],
        "targetCount": null
      },
      {
        "id": "draft_baseline_survey_report_with_mentor",
        "label": "Draft Baseline Survey Report (with mentor review notes)",
        "keywords": [
          "baseline survey"
        ],
        "targetCount": null
      },
      {
        "id": "final_baseline_survey_report_completed",
        "label": "Final Baseline Survey Report (Completed)",
        "keywords": [
          "baseline survey"
        ],
        "targetCount": null
      },
      {
        "id": "supervisor_cdpo_baseline_dissemination_b",
        "label": "Supervisor / CDPO Baseline Dissemination Brief",
        "keywords": [
          "supervisor cdpo",
          "cdpo baseline"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection_field_diary_entries",
        "label": "Monthly Reflection & Field Diary Entries",
        "keywords": [
          "monthly reflection",
          "reflection field"
        ],
        "targetCount": null
      },
      {
        "id": "structured_monthly_mentor_review",
        "label": "Structured Monthly Mentor Review",
        "keywords": [
          "structured monthly",
          "monthly mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_16_goals_action_points",
        "label": "Month 16 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands early childhood developmental domain indicators",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands results-based monitoring and baseline vs endline logic",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has developed child-friendly, non-threatening assessment tools",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has established structured data collection and consent protocols",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Conducted regular preschool sessions (math games, language, motor, circle time)",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        },
        {
          "criterion": "Administered individual child assessments across cohorts",
          "linkedDeliverableId": "standardized_child_developmental_assessm"
        },
        {
          "criterion": "Interviewed caregiver families and frontline workers",
          "linkedDeliverableId": "caregiver_household_baseline_survey_ques"
        },
        {
          "criterion": "Documented center environment and attendance metrics systematically",
          "linkedDeliverableId": "anganwadi_center_learning_environment_in"
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can identify specific developmental lags across cognitive, language, and motor domains",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can correlate household factors with early learning outcomes",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can build clear data visualizations and dashboards",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has validated data accuracy and identified sampling limitations",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Compiled a comprehensive, evidence-based Baseline Survey Report",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Shared visual dashboards with frontline Anganwadi workers",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Translated data findings into actionable classroom recommendations",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established seamless transition plan and goals for Month 16",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  16: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 16, the Fellow should understand systemic and intersectional barriers to early learning—including poverty, caste, migration, language/dialect divergence, and disabilities (CWSN)—and design contextualized inclusion strategies while delivering daily inclusive preschool activities and producing an Inclusion Strategy Paper and Field Immersion Report.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "VULNERABILITY MAPPING & EQUITY FRAMEWORKS IN ECCE — Identify marginalized pockets in the community and analyze socio-economic and cultural barriers to preschool access."
      },
      {
        "week": 2,
        "focus": "FIELD IMMERSION, HOME VISITS & LIVED REALITIES — Conduct deep-dive home visits to vulnerable households and understand home learning ecosystems."
      },
      {
        "week": 3,
        "focus": "INCLUSIVE PEDAGOGY, DIFFERENTIATED LEARNING & TLM ADAPTATIONS — Design and pilot differentiated lesson plans and adapted learning materials for diverse learning needs."
      },
      {
        "week": 4,
        "focus": "INCLUSION STRATEGY PAPER, COMMUNITY DIALOGUE & TRANSITION — Finalize the Inclusion Strategy Paper, conduct a caregiver dialogue circle on inclusion, and prepare for Month 17."
      }
    ],
    "deliverables": [
      {
        "id": "month_16_learning_goals_vulnerability_ma",
        "label": "Month 16 Learning Goals & Vulnerability Mapping Matrix",
        "keywords": [
          "learning goals",
          "goals vulnerability"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_inclusive_preschool_acti",
        "label": "Minimum 8 Daily Inclusive Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily inclusive",
          "inclusive preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "vulnerability_out_of_school_children_map",
        "label": "Vulnerability & Out-of-School Children Mapping Register",
        "keywords": [
          "vulnerability out",
          "out school"
        ],
        "targetCount": null
      },
      {
        "id": "home_language_dialect_divergence_analysi",
        "label": "Home Language & Dialect Divergence Analysis Notes",
        "keywords": [
          "home language",
          "language dialect"
        ],
        "targetCount": null
      },
      {
        "id": "detailed_household_immersion_notes_6_in_",
        "label": "Detailed Household Immersion Notes (6 In-Depth Case Studies)",
        "keywords": [
          "detailed household",
          "household immersion"
        ],
        "targetCount": null
      },
      {
        "id": "early_screening_developmental_delay_obse",
        "label": "Early Screening & Developmental Delay Observation Checklists",
        "keywords": [
          "early screening",
          "screening developmental"
        ],
        "targetCount": null
      },
      {
        "id": "universal_design_for_learning_udl_classr",
        "label": "Universal Design for Learning (UDL) Classroom Adaptation Guide",
        "keywords": [
          "universal design",
          "design learning"
        ],
        "targetCount": null
      },
      {
        "id": "3_adapted_accessible_teaching_learning_m",
        "label": "3 Adapted/Accessible Teaching-Learning Materials (with user guides)",
        "keywords": [
          "adapted accessible",
          "accessible teaching"
        ],
        "targetCount": null
      },
      {
        "id": "differentiated_multi_level_preschool_les",
        "label": "Differentiated Multi-Level Preschool Lesson Plans",
        "keywords": [
          "differentiated multi",
          "multi level"
        ],
        "targetCount": null
      },
      {
        "id": "draft_inclusion_strategy_paper_with_peer",
        "label": "Draft Inclusion Strategy Paper (with peer review notes)",
        "keywords": [
          "inclusion strategy",
          "strategy paper"
        ],
        "targetCount": null
      },
      {
        "id": "final_inclusion_strategy_paper_completed",
        "label": "Final Inclusion Strategy Paper (Completed)",
        "keywords": [
          "inclusion strategy",
          "strategy paper"
        ],
        "targetCount": null
      },
      {
        "id": "comprehensive_field_immersion_report_qua",
        "label": "Comprehensive Field Immersion Report (Qualitative Case Studies)",
        "keywords": [
          "comprehensive field",
          "field immersion"
        ],
        "targetCount": null
      },
      {
        "id": "mothers_dialogue_circle_action_summary",
        "label": "Mothers' Dialogue Circle Action Summary",
        "keywords": [
          "mothers dialogue",
          "dialogue circle"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection_field_diary_entries",
        "label": "Monthly Reflection & Field Diary Entries",
        "keywords": [
          "monthly reflection",
          "reflection field"
        ],
        "targetCount": null
      },
      {
        "id": "structured_monthly_mentor_review",
        "label": "Structured Monthly Mentor Review",
        "keywords": [
          "structured monthly",
          "monthly mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_17_goals_action_points",
        "label": "Month 17 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands social, economic, linguistic, and physical exclusion mechanisms",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands Universal Design for Learning (UDL) and differentiated instruction",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has developed respectful community immersion and home-visit protocols",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has established clear vulnerability indicators for center catchments",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Conducted regular inclusive classroom activities (bilingual songs, multi-sensory play)",
          "linkedDeliverableId": "minimum_8_daily_inclusive_preschool_acti"
        },
        {
          "criterion": "Completed in-depth household immersion visits with vulnerable families",
          "linkedDeliverableId": "detailed_household_immersion_notes_6_in_"
        },
        {
          "criterion": "Created and field-tested adapted TLMs for diverse learning needs",
          "linkedDeliverableId": "3_adapted_accessible_teaching_learning_m"
        },
        {
          "criterion": "Facilitated caregiver dialogue circles on supportive home environments",
          "linkedDeliverableId": "home_language_dialect_divergence_analysi"
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_inclusive_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can explain how poverty, caste, and migration impact early learning attendance",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can assess the effectiveness of mother-tongue bridge strategies in class",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can evaluate child engagement levels with differentiated lesson plans",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has synthesized qualitative case studies into clear analytical themes",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Published a rigorous, actionable Inclusion Strategy Paper",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Completed a comprehensive, empathetic Field Immersion Report",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Provided AWW with concrete low-cost differentiated instructional tools",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established seamless transition plan and goals for Month 17",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  17: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 17, the Fellow should achieve mastery in play-based instructional delivery, advanced classroom management, and micro-teaching techniques through peer-led sessions, mock classroom demonstrations, video-reflective analysis, and continuous daily Anganwadi teaching practice, while compiling a comprehensive Pedagogical Feedback Journal.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "ADVANCED LESSON PLANNING & ACTIVE PEDAGOGY — Design holistic, multi-level lesson plans incorporating play, inquiry, storytelling, and foundational numeracy."
      },
      {
        "week": 2,
        "focus": "CLASSROOM MANAGEMENT, ROUTINES & BEHAVIOR SUPPORT — Establish positive behavior routines, transition rituals, and active engagement strategies in multi-age classrooms."
      },
      {
        "week": 3,
        "focus": "PEER-LED MOCK TEACHING DEMONSTRATIONS & VIDEO CRITIQUE — Conduct 2 full mock teaching sessions observed and evaluated by fellow peers and mentors."
      },
      {
        "week": 4,
        "focus": "PEDAGOGICAL JOURNAL COMPILATION, PORTFOLIO & TRANSITION — Compile the Pedagogical Feedback Journal, package master lesson plans, and prepare for Capstone Phase 1."
      }
    ],
    "deliverables": [
      {
        "id": "month_17_learning_goals_pedagogical_mast",
        "label": "Month 17 Learning Goals & Pedagogical Mastery Matrix",
        "keywords": [
          "learning goals",
          "goals pedagogical"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_anganwadi_preschool_acti",
        "label": "Minimum 8 Daily Anganwadi Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily anganwadi",
          "anganwadi preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "master_lesson_planning_framework_guide",
        "label": "Master Lesson Planning Framework Guide",
        "keywords": [
          "master lesson",
          "lesson planning"
        ],
        "targetCount": null
      },
      {
        "id": "classroom_routine_positive_behavior_supp",
        "label": "Classroom Routine & Positive Behavior Support Protocol",
        "keywords": [
          "classroom routine",
          "routine positive"
        ],
        "targetCount": null
      },
      {
        "id": "standardized_peer_observation_rubric_sco",
        "label": "Standardized Peer Observation Rubric & Scoring Sheet",
        "keywords": [
          "standardized peer",
          "peer observation"
        ],
        "targetCount": null
      },
      {
        "id": "2_full_mock_teaching_lesson_plans_langua",
        "label": "2 Full Mock Teaching Lesson Plans (Language & Math/Science)",
        "keywords": [
          "full mock",
          "mock teaching"
        ],
        "targetCount": null
      },
      {
        "id": "mock_class_demonstration_1_documentation",
        "label": "Mock Class Demonstration 1 Documentation & Video/Observation Record",
        "keywords": [
          "mock class",
          "class demonstration"
        ],
        "targetCount": null
      },
      {
        "id": "mock_class_demonstration_2_documentation",
        "label": "Mock Class Demonstration 2 Documentation & Video/Observation Record",
        "keywords": [
          "mock class",
          "class demonstration"
        ],
        "targetCount": null
      },
      {
        "id": "completed_peer_evaluation_forms_from_coh",
        "label": "Completed Peer Evaluation Forms from Cohort Observers",
        "keywords": [
          "completed peer",
          "peer evaluation"
        ],
        "targetCount": null
      },
      {
        "id": "detailed_video_reflective_analysis_matri",
        "label": "Detailed Video-Reflective Analysis Matrix",
        "keywords": [
          "detailed video",
          "video reflective"
        ],
        "targetCount": null
      },
      {
        "id": "draft_pedagogical_feedback_journal_with_",
        "label": "Draft Pedagogical Feedback Journal (with peer critique)",
        "keywords": [
          "pedagogical feedback",
          "feedback journal"
        ],
        "targetCount": null
      },
      {
        "id": "final_pedagogical_feedback_journal_compl",
        "label": "Final Pedagogical Feedback Journal (Completed)",
        "keywords": [
          "pedagogical feedback",
          "feedback journal"
        ],
        "targetCount": null
      },
      {
        "id": "10_master_play_based_lesson_plans_toolki",
        "label": "10 Master Play-Based Lesson Plans Toolkit (Replicable for AWWs)",
        "keywords": [
          "master play",
          "play based"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection_field_diary_entries",
        "label": "Monthly Reflection & Field Diary Entries",
        "keywords": [
          "monthly reflection",
          "reflection field"
        ],
        "targetCount": null
      },
      {
        "id": "structured_monthly_mentor_review",
        "label": "Structured Monthly Mentor Review",
        "keywords": [
          "structured monthly",
          "monthly mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_18_goals_action_points",
        "label": "Month 18 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands 4-step lesson architecture and active learning pedagogy",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands multi-age classroom differentiation and energy pacing",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has developed objective observation rubrics for peer teaching",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has established clear instructional objectives across developmental domains",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Delivered daily structured preschool lesson plans at the Anganwadi",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        },
        {
          "criterion": "Conducted 2 complete mock teaching sessions evaluated by peers and mentor",
          "linkedDeliverableId": "2_full_mock_teaching_lesson_plans_langua"
        },
        {
          "criterion": "Co-taught sessions collaboratively with the Anganwadi Worker",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        },
        {
          "criterion": "Recorded and reviewed teaching footage for critical reflection",
          "linkedDeliverableId": "2_full_mock_teaching_lesson_plans_langua"
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can identify personal teaching strengths and instructional blindspots",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can analyze child attention span, participation rates, and transition friction",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can synthesize peer and mentor critique objectively",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has documented detailed reflective insights in the feedback journal",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Completed a comprehensive, reflective Pedagogical Feedback Journal",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Produced a standardized 10 Master Lesson Plan Toolkit for frontline workers",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Demonstrated observable growth in instructional confidence and classroom control",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established seamless transition plan and goals for Month 18 (Capstone Design)",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  18: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 18, the Fellow should consolidate 1.5 years of field immersion to identify a high-priority grassroots challenge in early childhood education, execute a rigorous needs assessment, design a scalable and contextualized ECCE intervention model, and defend the Capstone Project Design Proposal before a mentor jury panel while maintaining daily child learning sessions.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "PROBLEM IDENTIFICATION, SCOPING & ROOT CAUSE ANALYSIS — Isolate a specific, high-impact problem in community early childhood education (e.g., severe language delays, low male caregiver engagement, lack of play infrastructure, nutrition compliance)."
      },
      {
        "week": 2,
        "focus": "GRASSROOTS NEEDS ASSESSMENT & BENEFICIARY CONSULTATIONS — Administer structured needs assessment tools across caregivers, community leaders, and frontline workers."
      },
      {
        "week": 3,
        "focus": "INTERVENTION DESIGN, THEORY OF CHANGE & CO-CREATION — Design the end-to-end intervention blueprint, Theory of Change, activity toolkits, and monitoring framework."
      },
      {
        "week": 4,
        "focus": "PROPOSAL FINALIZATION, JURY DEFENSE & SEMESTER 3 CLOSURE — Compile the full Capstone Project Phase 1 Design Report, deliver pitch to Jury Panel, and conclude Semester 3."
      }
    ],
    "deliverables": [
      {
        "id": "month_18_learning_goals_capstone_roadmap",
        "label": "Month 18 Learning Goals & Capstone Roadmap",
        "keywords": [
          "learning goals",
          "goals capstone"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_anganwadi_preschool_acti",
        "label": "Minimum 8 Daily Anganwadi Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily anganwadi",
          "anganwadi preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "comprehensive_problem_tree_root_cause_an",
        "label": "Comprehensive Problem Tree & Root Cause Analysis Document",
        "keywords": [
          "comprehensive problem",
          "problem tree"
        ],
        "targetCount": null
      },
      {
        "id": "primary_needs_assessment_toolkit_fgd_gui",
        "label": "Primary Needs Assessment Toolkit (FGD Guides, KII Questionnaires)",
        "keywords": [
          "primary needs",
          "needs assessment"
        ],
        "targetCount": null
      },
      {
        "id": "needs_assessment_survey_findings_transcr",
        "label": "Needs Assessment Survey Findings & Transcripts (Caregivers, AWW, PRIs)",
        "keywords": [
          "needs assessment",
          "assessment survey"
        ],
        "targetCount": null
      },
      {
        "id": "literature_review_sector_benchmark_repor",
        "label": "Literature Review & Sector Benchmark Report",
        "keywords": [
          "literature review",
          "review sector"
        ],
        "targetCount": null
      },
      {
        "id": "co_design_workshop_documentation_communi",
        "label": "Co-Design Workshop Documentation (Community Feedback Log)",
        "keywords": [
          "design workshop",
          "workshop documentation"
        ],
        "targetCount": null
      },
      {
        "id": "complete_theory_of_change_logical_framew",
        "label": "Complete Theory of Change & Logical Framework Matrix",
        "keywords": [
          "complete theory",
          "theory change"
        ],
        "targetCount": null
      },
      {
        "id": "intervention_activity_blueprints_facilit",
        "label": "Intervention Activity Blueprints & Facilitator Guide — Draft",
        "keywords": [
          "intervention activity",
          "activity blueprints"
        ],
        "targetCount": null
      },
      {
        "id": "capstone_implementation_timeline_budget_",
        "label": "Capstone Implementation Timeline, Budget Estimate & M&E Matrix",
        "keywords": [
          "capstone implementation",
          "implementation timeline"
        ],
        "targetCount": null
      },
      {
        "id": "final_capstone_project_phase_1_design_pr",
        "label": "Final Capstone Project – Phase 1 Design Proposal Report (Submitted)",
        "keywords": [
          "capstone project",
          "project phase"
        ],
        "targetCount": null
      },
      {
        "id": "capstone_design_pitch_presentation_deck",
        "label": "Capstone Design Pitch Presentation Deck",
        "keywords": [
          "capstone design",
          "design pitch"
        ],
        "targetCount": null
      },
      {
        "id": "jury_evaluation_scoring_feedback_respons",
        "label": "Jury Evaluation Scoring & Feedback Response Plan",
        "keywords": [
          "jury evaluation",
          "evaluation scoring"
        ],
        "targetCount": null
      },
      {
        "id": "semester_3_consolidated_learning_reflect",
        "label": "Semester 3 Consolidated Learning Reflection & Master Portfolio",
        "keywords": [
          "semester consolidated",
          "consolidated learning"
        ],
        "targetCount": null
      },
      {
        "id": "formal_semester_3_mentor_sign_off",
        "label": "Formal Semester 3 Mentor Sign-off",
        "keywords": [
          "formal semester",
          "semester mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_19_goals_action_points",
        "label": "Month 19 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands problem-tree modeling and systems thinking in early education",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has scoped a clear, actionable, evidence-based challenge",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has designed comprehensive qualitative and quantitative needs assessment tools",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has established a structured 6-month implementation roadmap",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Facilitated daily preschool learning activities at the Anganwadi",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        },
        {
          "criterion": "Conducted extensive caregiver focus groups and key informant interviews",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Hosted participatory community co-design workshops",
          "linkedDeliverableId": "co_design_workshop_documentation_communi"
        },
        {
          "criterion": "Piloted micro-components of the intervention in real classroom conditions",
          "linkedDeliverableId": "intervention_activity_blueprints_facilit"
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can synthesize primary field data into clear unmet need categories",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can build a coherent Theory of Change connecting activities to measurable outcomes",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can stress-test resource and cultural feasibility with community members",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has incorporated peer and mentor critique into design iterations",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Authored a comprehensive, publication-grade Capstone Design Proposal",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Designed a persuasive, data-rich Capstone Pitch Deck",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Successfully defended the project design before the Fellowship Jury Panel",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established a seamless transition into Semester 4 implementation",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  19: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 19, the Fellow should develop advanced grassroots leadership competencies, master adult facilitation methodologies, facilitate 2 multi-stakeholder community/educator workshops, resolve field conflicts, and compile an in-depth Leadership Reflection Journal while continuing daily preschool learning sessions.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "ADAPTIVE LEADERSHIP, SELF-AWARENESS & PUBLIC NARRATIVE — Explore leadership archetypes, emotional intelligence, and craft personal public narratives to inspire community action."
      },
      {
        "week": 2,
        "focus": "ADULT LEARNING PRINCIPLES (ANDRAGOGY) & WORKSHOP 1 DELIVERY — Apply adult learning principles and deliver Facilitation Session 1 for Anganwadi Workers and helpers."
      },
      {
        "week": 3,
        "focus": "COMMUNITY CONFLICT RESOLUTION, MOBILIZATION & WORKSHOP 2 DELIVERY — Navigate community disagreements, build consensus, and deliver Facilitation Session 2 for parents and local leaders."
      },
      {
        "week": 4,
        "focus": "LEADERSHIP JOURNAL COMPILATION, PORTFOLIO & TRANSITION — Compile the comprehensive Leadership Reflection Journal, create a community leadership continuity plan, and prepare for Month 20."
      }
    ],
    "deliverables": [
      {
        "id": "month_19_learning_goals_leadership_self_",
        "label": "Month 19 Learning Goals & Leadership Self-Assessment Matrix",
        "keywords": [
          "learning goals",
          "goals leadership"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_anganwadi_preschool_acti",
        "label": "Minimum 8 Daily Anganwadi Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily anganwadi",
          "anganwadi preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "public_narrative_storyboard_story_of_sel",
        "label": "Public Narrative Storyboard (Story of Self, Us, Now)",
        "keywords": [
          "public narrative",
          "narrative storyboard"
        ],
        "targetCount": null
      },
      {
        "id": "andragogy_adult_learning_facilitation_to",
        "label": "Andragogy & Adult Learning Facilitation Toolkit",
        "keywords": [
          "andragogy adult",
          "adult learning"
        ],
        "targetCount": null
      },
      {
        "id": "workshop_1_facilitation_guide_session_ma",
        "label": "Workshop 1 Facilitation Guide & Session Materials (AWW/Educators)",
        "keywords": [
          "workshop facilitation",
          "facilitation guide"
        ],
        "targetCount": null
      },
      {
        "id": "workshop_1_documentation_attendance_reco",
        "label": "Workshop 1 Documentation, Attendance Record & Participant Feedback",
        "keywords": [
          "workshop documentation",
          "documentation attendance"
        ],
        "targetCount": null
      },
      {
        "id": "workshop_2_facilitation_guide_session_ma",
        "label": "Workshop 2 Facilitation Guide & Session Materials (Parents/Panchayat)",
        "keywords": [
          "workshop facilitation",
          "facilitation guide"
        ],
        "targetCount": null
      },
      {
        "id": "workshop_2_documentation_attendance_reco",
        "label": "Workshop 2 Documentation, Attendance Record & Caregiver Feedback",
        "keywords": [
          "workshop documentation",
          "documentation attendance"
        ],
        "targetCount": null
      },
      {
        "id": "comprehensive_workshop_evaluation_impact",
        "label": "Comprehensive Workshop Evaluation & Impact Report",
        "keywords": [
          "comprehensive workshop",
          "workshop evaluation"
        ],
        "targetCount": null
      },
      {
        "id": "community_conflict_resolution_stakeholde",
        "label": "Community Conflict Resolution & Stakeholder Negotiation Log",
        "keywords": [
          "community conflict",
          "conflict resolution"
        ],
        "targetCount": null
      },
      {
        "id": "draft_leadership_reflection_journal_with",
        "label": "Draft Leadership Reflection Journal (with peer critique)",
        "keywords": [
          "leadership reflection",
          "reflection journal"
        ],
        "targetCount": null
      },
      {
        "id": "final_leadership_reflection_journal_comp",
        "label": "Final Leadership Reflection Journal (Completed)",
        "keywords": [
          "leadership reflection",
          "reflection journal"
        ],
        "targetCount": null
      },
      {
        "id": "community_leadership_peer_mentorship_act",
        "label": "Community Leadership & Peer-Mentorship Action Plan",
        "keywords": [
          "community leadership",
          "leadership peer"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection_field_diary_entries",
        "label": "Monthly Reflection & Field Diary Entries",
        "keywords": [
          "monthly reflection",
          "reflection field"
        ],
        "targetCount": null
      },
      {
        "id": "structured_monthly_mentor_review",
        "label": "Structured Monthly Mentor Review",
        "keywords": [
          "structured monthly",
          "monthly mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_20_goals_action_points",
        "label": "Month 20 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands public narrative and authentic leadership presence",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands adult learning theory (andragogy) and participatory methods",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has designed structured, interactive session plans for diverse stakeholders",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has established clear emotional intelligence and conflict handling strategies",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Facilitated daily early childhood learning sessions at the center",
          "linkedDeliverableId": "month_19_learning_goals_leadership_self_"
        },
        {
          "criterion": "Successfully organized and delivered 2 multi-stakeholder workshops",
          "linkedDeliverableId": "community_conflict_resolution_stakeholde"
        },
        {
          "criterion": "Mobilized diverse community participants (AWWs, helpers, parents, PRIs)",
          "linkedDeliverableId": "workshop_2_facilitation_guide_session_ma"
        },
        {
          "criterion": "Applied active listening and non-violent communication during group dialogue",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can identify personal leadership strengths and emotional triggers",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can evaluate participant engagement, psychological safety, and voice equity",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can synthesize qualitative feedback from community stakeholders",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has documented detailed reflective insights in the leadership journal",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Completed a publication-quality Leadership Reflection Journal",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Created an actionable Community Leadership Continuity Plan for local staff",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Demonstrated enhanced confidence in mobilizing and guiding adult groups",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established seamless transition plan and goals for Month 20 (Social Entrepreneurship)",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  20: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 20, the Fellow should understand the principles of social entrepreneurship and enterprise design in early childhood care and education, analyze leading domestic and global ECCE business model case studies, conduct market viability and willingness-to-pay assessments, and produce a viable ECCE Social Innovation Business Plan while conducting daily preschool learning sessions.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "SOCIAL ENTERPRISE THEORY & GLOBAL/DOMESTIC CASE STUDIES — Explore social enterprise models in early childhood education (e.g., SEWA Balwadis, BRAC Play Labs, low-cost affordable private preschools)."
      },
      {
        "week": 2,
        "focus": "LOCAL MARKET RESEARCH, COMPETITOR ANALYSIS & WILLINGNESS-TO-PAY — Assess local early childhood services (private budget preschools, tuition centers, Anganwadis) and gauge parent willingness-to-pay/co-invest."
      },
      {
        "week": 3,
        "focus": "SOCIAL BUSINESS MODEL CANVAS (SBMC) & VALUE PROPOSITION — Draft the Social Business Model Canvas (Value Proposition, Customer Segments, Channels, Revenue/Subsidy Streams, Cost Structure, Impact Metrics)."
      },
      {
        "week": 4,
        "focus": "BUSINESS PLAN FINALIZATION, EXTERNAL REVIEW & TRANSITION — Finalize the comprehensive ECCE Social Innovation Business Plan, submit for external review, and prepare for Month 21."
      }
    ],
    "deliverables": [
      {
        "id": "month_20_learning_goals_social_enterpris",
        "label": "Month 20 Learning Goals & Social Enterprise Matrix",
        "keywords": [
          "learning goals",
          "goals social"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_anganwadi_preschool_acti",
        "label": "Minimum 8 Daily Anganwadi Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily anganwadi",
          "anganwadi preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "case_study_analysis_1_brac_play_labs_low",
        "label": "Case Study Analysis 1 (BRAC Play Labs & Low-Cost Childcare Models)",
        "keywords": [
          "case study",
          "study analysis"
        ],
        "targetCount": null
      },
      {
        "id": "case_study_analysis_2_women_led_shg_chil",
        "label": "Case Study Analysis 2 (Women-Led SHG Childcare Micro-Enterprises)",
        "keywords": [
          "case study",
          "study analysis"
        ],
        "targetCount": null
      },
      {
        "id": "low_cost_diy_toy_learning_product_protot",
        "label": "Low-Cost DIY Toy/Learning Product Prototype Documentation",
        "keywords": [
          "low cost",
          "cost diy"
        ],
        "targetCount": null
      },
      {
        "id": "parent_willingness_to_pay_wtp_survey_dat",
        "label": "Parent Willingness-to-Pay (WTP) Survey Dataset & Analysis",
        "keywords": [
          "parent willingness",
          "willingness pay"
        ],
        "targetCount": null
      },
      {
        "id": "competitor_preschool_tuition_center_benc",
        "label": "Competitor Preschool & Tuition Center Benchmark Report",
        "keywords": [
          "competitor preschool",
          "preschool tuition"
        ],
        "targetCount": null
      },
      {
        "id": "shg_micro_enterprise_partnership_feasibi",
        "label": "SHG Micro-Enterprise Partnership Feasibility Notes",
        "keywords": [
          "shg micro",
          "micro enterprise"
        ],
        "targetCount": null
      },
      {
        "id": "unit_economics_pricing_model_spreadsheet",
        "label": "Unit Economics & Pricing Model Spreadsheet",
        "keywords": [
          "unit economics",
          "economics pricing"
        ],
        "targetCount": null
      },
      {
        "id": "draft_social_business_model_canvas_with_",
        "label": "Draft Social Business Model Canvas (with peer feedback)",
        "keywords": [
          "social business",
          "business model"
        ],
        "targetCount": null
      },
      {
        "id": "final_validated_social_business_model_ca",
        "label": "Final Validated Social Business Model Canvas (SBMC)",
        "keywords": [
          "validated social",
          "social business"
        ],
        "targetCount": null
      },
      {
        "id": "final_comprehensive_ecce_social_innovati",
        "label": "Final Comprehensive ECCE Social Innovation Business Plan (Submitted)",
        "keywords": [
          "comprehensive ecce",
          "ecce social"
        ],
        "targetCount": null
      },
      {
        "id": "external_expert_mentor_review_feedback_l",
        "label": "External Expert & Mentor Review Feedback Log",
        "keywords": [
          "external expert",
          "expert mentor"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection_field_diary_entries",
        "label": "Monthly Reflection & Field Diary Entries",
        "keywords": [
          "monthly reflection",
          "reflection field"
        ],
        "targetCount": null
      },
      {
        "id": "structured_monthly_mentor_review",
        "label": "Structured Monthly Mentor Review",
        "keywords": [
          "structured monthly",
          "monthly mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_21_goals_action_points",
        "label": "Month 21 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands social vs commercial business models and hybrid financing",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands unit economics, cost drivers, and revenue streams in education",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has developed structured market research and competitor benchmarking tools",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has analyzed benchmark domestic and global ECCE enterprise case studies",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Facilitated daily early learning sessions at the Anganwadi",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        },
        {
          "criterion": "Administered parent willingness-to-pay surveys across community tiers",
          "linkedDeliverableId": "parent_willingness_to_pay_wtp_survey_dat"
        },
        {
          "criterion": "Audited local private preschool competitors and tuition setups",
          "linkedDeliverableId": "competitor_preschool_tuition_center_benc"
        },
        {
          "criterion": "Prototyped low-cost educational materials with children and caregivers",
          "linkedDeliverableId": "case_study_analysis_1_brac_play_labs_low"
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can calculate realistic cost-per-child metrics and operational break-evens",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can assess the feasibility of community fee contributions vs subsidies",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can stress-test value propositions against local cultural priorities",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has synthesized qualitative and quantitative market data into the SBMC",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Completed a comprehensive, robust ECCE Social Innovation Business Plan",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Validated the 9-block Social Business Model Canvas with field evidence",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Incorporated external mentor and expert feedback into the final plan",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established seamless transition plan and goals for Month 21 (Budgeting)",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  21: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 21, the Fellow should master financial modeling, detailed unit costing, operational budgeting, and grassroots resource mobilization for early childhood programs, create a comprehensive Multi-Year Budget Spreadsheet, and develop an actionable Community & In-Kind Resource Mobilization Plan while delivering daily preschool activities.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "UNIT COSTING, COST DRIVERS & FINANCIAL ARCHITECTURE — Deconstruct all direct and indirect cost drivers in early childhood intervention delivery (personnel, learning materials, nutrition, training, infrastructure, M&E)."
      },
      {
        "week": 2,
        "focus": "LINE-ITEM BUDGETING & DYNAMIC MULTI-YEAR SPREADSHEET MODELING — Build a comprehensive, formula-driven Excel/Sheets financial model covering 1-year and 3-year intervention timelines."
      },
      {
        "week": 3,
        "focus": "COMMUNITY RESOURCE MOBILIZATION & IN-KIND SUPPORT MAPPING — Map local non-monetary community resources (Panchayat funds, donated space, volunteer time, SHG nutrition support, local business sponsorships)."
      },
      {
        "week": 4,
        "focus": "MASTER BUDGET FINALIZATION, RESOURCE PLAN & TRANSITION — Finalize the Master Budget Spreadsheet, compile the comprehensive Resource Mobilization Plan, and prepare for Month 22."
      }
    ],
    "deliverables": [
      {
        "id": "month_21_learning_goals_unit_costing_mat",
        "label": "Month 21 Learning Goals & Unit Costing Matrix",
        "keywords": [
          "learning goals",
          "goals unit"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_anganwadi_preschool_acti",
        "label": "Minimum 8 Daily Anganwadi Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily anganwadi",
          "anganwadi preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "unit_costing_cost_per_child_reference_gu",
        "label": "Unit Costing & Cost-per-Child Reference Guide",
        "keywords": [
          "unit costing",
          "costing cost"
        ],
        "targetCount": null
      },
      {
        "id": "local_vendor_price_quotation_collection_",
        "label": "Local Vendor Price Quotation Collection & Audit Register",
        "keywords": [
          "local vendor",
          "vendor price"
        ],
        "targetCount": null
      },
      {
        "id": "center_infrastructure_upgrade_material_c",
        "label": "Center Infrastructure Upgrade & Material Cost Assessment",
        "keywords": [
          "center infrastructure",
          "infrastructure upgrade"
        ],
        "targetCount": null
      },
      {
        "id": "panchayat_local_resource_commitment_meet",
        "label": "Panchayat Local Resource Commitment Meeting Notes",
        "keywords": [
          "panchayat local",
          "local resource"
        ],
        "targetCount": null
      },
      {
        "id": "volunteer_time_community_resource_invent",
        "label": "Volunteer Time & Community Resource Inventory Register",
        "keywords": [
          "volunteer time",
          "time community"
        ],
        "targetCount": null
      },
      {
        "id": "in_kind_community_asset_valuation_matrix",
        "label": "In-Kind Community Asset Valuation Matrix",
        "keywords": [
          "kind community",
          "community asset"
        ],
        "targetCount": null
      },
      {
        "id": "multi_scenario_financial_sensitivity_ana",
        "label": "Multi-Scenario Financial Sensitivity Analysis (Conservative, Base, Scaled)",
        "keywords": [
          "multi scenario",
          "scenario financial"
        ],
        "targetCount": null
      },
      {
        "id": "draft_line_item_budget_with_formula_audi",
        "label": "Draft Line-Item Budget (with formula audits)",
        "keywords": [
          "line item",
          "item budget"
        ],
        "targetCount": null
      },
      {
        "id": "final_master_multi_year_budget_spreadshe",
        "label": "Final Master Multi-Year Budget Spreadsheet (.xlsx / formatted tables)",
        "keywords": [
          "master multi",
          "multi year"
        ],
        "targetCount": null
      },
      {
        "id": "comprehensive_budget_narrative_document_",
        "label": "Comprehensive Budget Narrative Document (Line-by-Line Justifications)",
        "keywords": [
          "comprehensive budget",
          "budget narrative"
        ],
        "targetCount": null
      },
      {
        "id": "community_in_kind_resource_mobilization_",
        "label": "Community & In-Kind Resource Mobilization Strategy Plan",
        "keywords": [
          "community kind",
          "kind resource"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection_field_diary_entries",
        "label": "Monthly Reflection & Field Diary Entries",
        "keywords": [
          "monthly reflection",
          "reflection field"
        ],
        "targetCount": null
      },
      {
        "id": "structured_monthly_mentor_review",
        "label": "Structured Monthly Mentor Review",
        "keywords": [
          "structured monthly",
          "monthly mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_22_goals_action_points",
        "label": "Month 22 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands OpEx, CapEx, overhead allocation, and contingency buffers",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands unit costing calculations (cost per child/center/month)",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has developed standardized costing sheets and vendor quote templates",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has established multi-source resource mobilization frameworks",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Conducted daily early learning sessions at the Anganwadi",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        },
        {
          "criterion": "Collected realistic price quotations from local suppliers and vendors",
          "linkedDeliverableId": "local_vendor_price_quotation_collection_"
        },
        {
          "criterion": "Consulted Gram Panchayat leaders and local SHGs for in-kind contributions",
          "linkedDeliverableId": "panchayat_local_resource_commitment_meet"
        },
        {
          "criterion": "Built dynamic, formula-driven financial models from primary field data",
          "linkedDeliverableId": "multi_scenario_financial_sensitivity_ana"
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can identify financial risks, cost inflators, and funding vulnerabilities",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can conduct scenario analysis across variable donor and local contribution rates",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can verify mathematical formulas, cross-sheet links, and formatting accuracy",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has validated all unit cost assumptions with mentor guidance",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Delivered a comprehensive Master Multi-Year Budget Spreadsheet",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Authored a clear, persuasive Budget Narrative with strong value-for-money justification",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Created a practical Community Resource Mobilization Plan",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established seamless transition plan and goals for Month 22 (Proposal Writing)",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  22: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 22, the Fellow should master the art of grant writing, donor communication, and persuasive public pitching, write a competitive and comprehensive Grant Funding Proposal for their ECCE intervention, design a high-impact Visual Pitch Deck, and pitch live to an evaluation jury panel while maintaining daily preschool learning activities.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "DONOR LANDSCAPE, GRANT PROPOSAL ANATOMY & EXECUTIVE SUMMARY — Map potential CSR and philanthropic donors in the early education sector and master the core architecture of winning grant proposals."
      },
      {
        "week": 2,
        "focus": "PROJECT METHODOLOGY, LOGFRAME, RISK MATRIX & BUDGET NARRATIVE — Write the core project implementation methodology, logical framework, risk mitigation table, and integrate the financial budget."
      },
      {
        "week": 3,
        "focus": "VISUAL PITCH DECK DESIGN & STORYTELLING ARCHITECTURE — Design a high-impact, visual 10-slide Pitch Deck (Problem, Solution, Field Validation, Team, Financial Ask, Scalability)."
      },
      {
        "week": 4,
        "focus": "LIVE DONOR PITCH DEFENSE, PROPOSAL FINALIZATION & TRANSITION — Deliver live presentation to the Fellowship Evaluation Jury Panel, finalize the complete Grant Proposal, and prepare for Month 23."
      }
    ],
    "deliverables": [
      {
        "id": "month_22_learning_goals_donor_landscape_",
        "label": "Month 22 Learning Goals & Donor Landscape Matrix",
        "keywords": [
          "learning goals",
          "goals donor"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_anganwadi_preschool_acti",
        "label": "Minimum 8 Daily Anganwadi Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily anganwadi",
          "anganwadi preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "target_donor_csr_opportunity_profiling_m",
        "label": "Target Donor & CSR Opportunity Profiling Matrix",
        "keywords": [
          "target donor",
          "donor csr"
        ],
        "targetCount": null
      },
      {
        "id": "rfp_deconstruction_donor_compliance_chec",
        "label": "RFP Deconstruction & Donor Compliance Checklist",
        "keywords": [
          "rfp deconstruction",
          "deconstruction donor"
        ],
        "targetCount": null
      },
      {
        "id": "beneficiary_quotes_field_proof_point_rep",
        "label": "Beneficiary Quotes & Field Proof-Point Repository",
        "keywords": [
          "beneficiary quotes",
          "quotes field"
        ],
        "targetCount": null
      },
      {
        "id": "complete_project_logframe_milestone_gant",
        "label": "Complete Project Logframe, Milestone Gantt Chart & Risk Matrix",
        "keywords": [
          "complete project",
          "project logframe"
        ],
        "targetCount": null
      },
      {
        "id": "comprehensive_grant_funding_proposal_fir",
        "label": "Comprehensive Grant Funding Proposal — First Draft (with peer review)",
        "keywords": [
          "comprehensive grant",
          "grant funding"
        ],
        "targetCount": null
      },
      {
        "id": "final_grant_funding_proposal_document_fu",
        "label": "Final Grant Funding Proposal Document (Fully Formatted & Submitted)",
        "keywords": [
          "grant funding",
          "funding proposal"
        ],
        "targetCount": null
      },
      {
        "id": "line_by_line_budget_financial_justificat",
        "label": "Line-by-Line Budget & Financial Justification Appendix",
        "keywords": [
          "line line",
          "line budget"
        ],
        "targetCount": null
      },
      {
        "id": "letters_of_support_from_aww_community_st",
        "label": "Letters of Support from AWW / Community Stakeholders (Appendix)",
        "keywords": [
          "letters support",
          "support aww"
        ],
        "targetCount": null
      },
      {
        "id": "visual_donor_pitch_deck_10_high_impact_s",
        "label": "Visual Donor Pitch Deck — 10 High-Impact Slides (.pptx / PDF)",
        "keywords": [
          "visual donor",
          "donor pitch"
        ],
        "targetCount": null
      },
      {
        "id": "pitch_rehearsal_video_recording_self_cri",
        "label": "Pitch Rehearsal Video Recording & Self-Critique Notes",
        "keywords": [
          "pitch rehearsal",
          "rehearsal video"
        ],
        "targetCount": null
      },
      {
        "id": "live_jury_defense_evaluation_scores_feed",
        "label": "Live Jury Defense Evaluation Scores & Feedback Response Log",
        "keywords": [
          "live jury",
          "jury defense"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection_field_diary_entries",
        "label": "Monthly Reflection & Field Diary Entries",
        "keywords": [
          "monthly reflection",
          "reflection field"
        ],
        "targetCount": null
      },
      {
        "id": "structured_monthly_mentor_review",
        "label": "Structured Monthly Mentor Review",
        "keywords": [
          "structured monthly",
          "monthly mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_23_goals_action_points",
        "label": "Month 23 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands RFP guidelines, donor scoring rubrics, and CSR compliance norms",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands the logical flow from problem statement to budget narrative",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has mapped target donors and tailored value propositions accordingly",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has established a structured 10-slide pitch narrative arc",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Conducted daily early learning sessions at the Anganwadi",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        },
        {
          "criterion": "Authored all sections of a comprehensive, technical grant funding proposal",
          "linkedDeliverableId": "comprehensive_grant_funding_proposal_fir"
        },
        {
          "criterion": "Designed a clean, professional, visual 10-slide donor pitch deck",
          "linkedDeliverableId": "visual_donor_pitch_deck_10_high_impact_s"
        },
        {
          "criterion": "Delivered a timed, live pitch presentation before an expert jury panel",
          "linkedDeliverableId": "live_jury_defense_evaluation_scores_feed"
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can evaluate proposal quality against objective donor rubrics",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can defend operational timelines, unit costing, and risk mitigation strategies",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can accept tough critique and formulate constructive revision plans",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has demonstrated strong verbal clarity, pacing, and audience engagement",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Delivered a publication-grade, fully compliant Grant Funding Proposal",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Produced an executive-level Visual Pitch Deck ready for corporate donors",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Earned formal endorsement and actionable feedback from the Jury Panel",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established seamless transition plan and goals for Month 23 (Capstone Implementation)",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  23: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 23, the Fellow should successfully launch and actively execute their Capstone ECCE intervention on the ground, manage daily operational logistics, train and coach Anganwadi staff and volunteers, deliver daily structured intervention learning sessions with children, and track implementation fidelity through a comprehensive Project Diary and Interim Impact Report.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "PILOT ROLLOUT KICKOFF, MATERIAL SETUP & COHORT ONBOARDING — Launch the Capstone intervention on the ground, set up classroom learning corners, and onboard the child cohort and caregivers."
      },
      {
        "week": 2,
        "focus": "DAILY INTERVENTION DELIVERY, PEDAGOGICAL COACHING & ROUTINE BUILDING — Deliver daily structured intervention modules, co-teach with AWW, and establish robust attendance and learning routines."
      },
      {
        "week": 3,
        "focus": "MID-PILOT FIDELITY AUDIT, PROCESS EVALUATION & ADAPTATION — Conduct mid-pilot fidelity check, evaluate child progress across milestones, and adapt materials based on classroom feedback."
      },
      {
        "week": 4,
        "focus": "INTERIM REPORT COMPILATION, SCALE PREP & TRANSITION — Compile the Interim Implementation Report, consolidate the Project Diary, and plan Month 24 endline evaluation and showcase."
      }
    ],
    "deliverables": [
      {
        "id": "month_23_learning_goals_rollout_operatio",
        "label": "Month 23 Learning Goals & Rollout Operational Protocol",
        "keywords": [
          "learning goals",
          "goals rollout"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_daily_anganwadi_preschool_acti",
        "label": "Minimum 8 Daily Anganwadi Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "daily anganwadi",
          "anganwadi preschool"
        ],
        "targetCount": 8
      },
      {
        "id": "classroom_learning_corner_setup_document",
        "label": "Classroom Learning Corner Setup Documentation & Photos",
        "keywords": [
          "classroom learning",
          "learning corner"
        ],
        "targetCount": null
      },
      {
        "id": "child_cohort_enrollment_baseline_attenda",
        "label": "Child Cohort Enrollment & Baseline Attendance Register",
        "keywords": [
          "child cohort",
          "cohort enrollment"
        ],
        "targetCount": null
      },
      {
        "id": "caregiver_kickoff_orientation_minutes_co",
        "label": "Caregiver Kickoff Orientation Minutes & Commitment Log",
        "keywords": [
          "caregiver kickoff",
          "kickoff orientation"
        ],
        "targetCount": null
      },
      {
        "id": "11_detailed_capstone_intervention_sessio",
        "label": "11 Detailed Capstone Intervention Session Logs (Step-by-Step Delivery)",
        "keywords": [
          "detailed capstone",
          "capstone intervention"
        ],
        "targetCount": null
      },
      {
        "id": "aww_pedagogical_coaching_competency_prog",
        "label": "AWW Pedagogical Coaching & Competency Progress Notes",
        "keywords": [
          "aww pedagogical",
          "pedagogical coaching"
        ],
        "targetCount": null
      },
      {
        "id": "home_visit_outreach_attendance_recovery_",
        "label": "Home Visit Outreach & Attendance Recovery Records",
        "keywords": [
          "home visit",
          "visit outreach"
        ],
        "targetCount": null
      },
      {
        "id": "mid_pilot_implementation_fidelity_audit_",
        "label": "Mid-Pilot Implementation Fidelity Audit Report",
        "keywords": [
          "mid pilot",
          "pilot implementation"
        ],
        "targetCount": null
      },
      {
        "id": "formative_child_progress_milestone_check",
        "label": "Formative Child Progress & Milestone Check Matrix",
        "keywords": [
          "formative child",
          "child progress"
        ],
        "targetCount": null
      },
      {
        "id": "curriculum_material_iteration_documentat",
        "label": "Curriculum & Material Iteration Documentation",
        "keywords": [
          "curriculum material",
          "material iteration"
        ],
        "targetCount": null
      },
      {
        "id": "comprehensive_project_implementation_dia",
        "label": "Comprehensive Project Implementation Diary (Month 23 Entries)",
        "keywords": [
          "comprehensive project",
          "project implementation"
        ],
        "targetCount": null
      },
      {
        "id": "draft_interim_implementation_report_with",
        "label": "Draft Interim Implementation Report (with mentor review)",
        "keywords": [
          "interim implementation"
        ],
        "targetCount": null
      },
      {
        "id": "final_interim_implementation_report_subm",
        "label": "Final Interim Implementation Report (Submitted)",
        "keywords": [
          "interim implementation"
        ],
        "targetCount": null
      },
      {
        "id": "monthly_reflection_field_diary_entries",
        "label": "Monthly Reflection & Field Diary Entries",
        "keywords": [
          "monthly reflection",
          "reflection field"
        ],
        "targetCount": null
      },
      {
        "id": "structured_monthly_mentor_review",
        "label": "Structured Monthly Mentor Review",
        "keywords": [
          "structured monthly",
          "monthly mentor"
        ],
        "targetCount": null
      },
      {
        "id": "month_24_goals_action_points",
        "label": "Month 24 Goals / Action Points",
        "keywords": [
          "goals action",
          "action points"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands project logistics, learning corner design, and material distribution",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands facilitator coaching and gradual release of responsibility (I do, We do, You do)",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has established daily session protocols and attendance recovery mechanisms",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has developed objective fidelity monitoring indicators",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Facilitated 11+ structured capstone intervention sessions at the center",
          "linkedDeliverableId": "11_detailed_capstone_intervention_sessio"
        },
        {
          "criterion": "Transformed the physical classroom into an active learning environment",
          "linkedDeliverableId": "classroom_learning_corner_setup_document"
        },
        {
          "criterion": "Coached and supported the Anganwadi Worker during classroom delivery",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        },
        {
          "criterion": "Maintained consistent home-visit contact with irregular families",
          "linkedDeliverableId": "home_visit_outreach_attendance_recovery_"
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_daily_anganwadi_preschool_acti"
        }
      ],
      "check": [
        {
          "criterion": "Can assess session completion rates, dosage, and child participation levels",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can identify pedagogical bottlenecks and adapt materials for varying learning paces",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can track AWW instructional independence and confidence growth",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has synthesized qualitative field observations into clear formative metrics",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Completed a comprehensive, evidence-rich Interim Implementation Report",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Maintained a detailed, reflective Project Implementation Diary",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Refined instructional toolkits based on ground-level testing",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Established seamless transition plan and goals for Month 24 (Scale & Showcase)",
          "linkedDeliverableId": null
        }
      ]
    }
  },
  24: {
    "curriculumVersion": "docx-v1",
    "monthlyObjective": "By the end of Month 24, the Fellow should complete the final month of the Umang Fellowship by conducting endline impact evaluations, analyzing child learning gains against baseline data, organizing a Community Showcase Exhibition, completing the formal Capstone Project Final Report, and defending their 2-year Fellowship journey before the Grand Jury Panel.",
    "weeklyFocus": [
      {
        "week": 1,
        "focus": "ENDLINE IMPACT ASSESSMENT & CHILD GROWTH DATA COLLECTION — Administer standardized endline developmental assessments across the child cohort to measure learning and milestone gains."
      },
      {
        "week": 2,
        "focus": "IMPACT DATA ANALYSIS, CHILD CASE STUDIES & REPORT COMPILATION — Analyze Baseline vs. Endline gains, write in-depth qualitative child case studies, and draft the Master Capstone Final Report."
      },
      {
        "week": 3,
        "focus": "COMMUNITY SHOWCASE EXHIBITION, STAKEHOLDER HANDOVER & CELEBRATION — Organize and host a grassroots Community Showcase Exhibition celebrating children's growth, and hand over sustainable toolkits to the center."
      },
      {
        "week": 4,
        "focus": "GRAND JURY DEFENSE, 2-YEAR FELLOWSHIP PORTFOLIO & GRADUATION — Defend the 2-year Fellowship journey and Capstone Project before the Grand Jury Panel, consolidate master portfolio, and conclude fellowship."
      }
    ],
    "deliverables": [
      {
        "id": "month_24_learning_goals_endline_evaluati",
        "label": "Month 24 Learning Goals & Endline Evaluation Protocol",
        "keywords": [
          "learning goals",
          "goals endline"
        ],
        "targetCount": null
      },
      {
        "id": "minimum_8_concluding_preschool_activity_",
        "label": "Minimum 8 Concluding Preschool Activity Logs (with lesson plans)",
        "keywords": [
          "concluding preschool",
          "preschool activity"
        ],
        "targetCount": 8
      },
      {
        "id": "cleaned_endline_child_developmental_asse",
        "label": "Cleaned Endline Child Developmental Assessment Dataset",
        "keywords": [
          "cleaned endline",
          "endline child"
        ],
        "targetCount": null
      },
      {
        "id": "baseline_vs_endline_statistical_impact_l",
        "label": "Baseline vs Endline Statistical Impact & Learning Gains Analysis",
        "keywords": [
          "baseline endline",
          "endline statistical"
        ],
        "targetCount": null
      },
      {
        "id": "caregiver_post_intervention_survey_datas",
        "label": "Caregiver Post-Intervention Survey Dataset & Satisfaction Report",
        "keywords": [
          "caregiver post",
          "post intervention"
        ],
        "targetCount": null
      },
      {
        "id": "3_longitudinal_child_transformation_case",
        "label": "3 Longitudinal Child Transformation Case Studies (Full Trajectory)",
        "keywords": [
          "longitudinal child",
          "child transformation"
        ],
        "targetCount": null
      },
      {
        "id": "community_showcase_exhibition_plan_media",
        "label": "Community Showcase Exhibition Plan, Media & Guest Register",
        "keywords": [
          "community showcase",
          "showcase exhibition"
        ],
        "targetCount": null
      },
      {
        "id": "community_showcase_event_report_with_par",
        "label": "Community Showcase Event Report (with parent & PRI testimonials)",
        "keywords": [
          "community showcase",
          "showcase event"
        ],
        "targetCount": null
      },
      {
        "id": "institutional_center_handover_agreement_",
        "label": "Institutional Center Handover Agreement & AWW Sign-off Document",
        "keywords": [
          "institutional center",
          "center handover"
        ],
        "targetCount": null
      },
      {
        "id": "replicable_master_ecce_intervention_manu",
        "label": "Replicable Master ECCE Intervention Manual (Handed to Community)",
        "keywords": [
          "replicable master",
          "master ecce"
        ],
        "targetCount": null
      },
      {
        "id": "final_master_capstone_project_report_com",
        "label": "Final Master Capstone Project Report (Comprehensive Publication-Grade)",
        "keywords": [
          "master capstone",
          "capstone project"
        ],
        "targetCount": null
      },
      {
        "id": "grand_jury_defense_presentation_deck_ppt",
        "label": "Grand Jury Defense Presentation Deck (.pptx / PDF)",
        "keywords": [
          "grand jury",
          "jury defense"
        ],
        "targetCount": null
      },
      {
        "id": "grand_jury_evaluation_scorecard_graduati",
        "label": "Grand Jury Evaluation Scorecard & Graduation Recommendation",
        "keywords": [
          "grand jury",
          "jury evaluation"
        ],
        "targetCount": null
      },
      {
        "id": "2_year_umang_fellowship_master_portfolio",
        "label": "2-Year Umang Fellowship Master Portfolio (24-Month Consolidated Archive)",
        "keywords": [
          "year umang",
          "umang fellowship"
        ],
        "targetCount": null
      },
      {
        "id": "final_summative_fellowship_reflection_es",
        "label": "Final Summative Fellowship Reflection Essay",
        "keywords": [
          "summative fellowship",
          "fellowship reflection"
        ],
        "targetCount": null
      },
      {
        "id": "formal_fellowship_graduation_sign_off_ce",
        "label": "Formal Fellowship Graduation Sign-off & Certification",
        "keywords": [
          "formal fellowship",
          "fellowship graduation"
        ],
        "targetCount": null
      }
    ],
    "successCheck": {
      "plan": [
        {
          "criterion": "Understands rigorous baseline-endline evaluation methodologies",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Understands event management and community exhibition planning",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has designed standardized post-assessment tools across all 4 developmental domains",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has established institutional handover protocols for long-term sustainability",
          "linkedDeliverableId": null
        }
      ],
      "do": [
        {
          "criterion": "Conducted final celebratory preschool learning sessions with children",
          "linkedDeliverableId": "month_24_learning_goals_endline_evaluati"
        },
        {
          "criterion": "Administered endline developmental assessments across the full child cohort",
          "linkedDeliverableId": "cleaned_endline_child_developmental_asse"
        },
        {
          "criterion": "Successfully organized and hosted the Community Showcase Exhibition (40+ attendees)",
          "linkedDeliverableId": "community_showcase_exhibition_plan_media"
        },
        {
          "criterion": "Formally handed over all intervention toolkits and materials to center staff",
          "linkedDeliverableId": "replicable_master_ecce_intervention_manu"
        },
        {
          "criterion": "Maintained daily activity logs and reflective field diary",
          "linkedDeliverableId": "minimum_8_concluding_preschool_activity_"
        }
      ],
      "check": [
        {
          "criterion": "Can calculate statistically verified learning gains and milestone improvements",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can synthesize longitudinal qualitative changes in children, caregivers, and AWWs",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Can critically evaluate program cost-effectiveness, scalability, and institutional limits",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Has defended findings persuasively under grand jury questioning",
          "linkedDeliverableId": null
        }
      ],
      "act": [
        {
          "criterion": "Authored and published the definitive Final Master Capstone Project Report",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Successfully defended 2-year outcomes before the Grand Fellowship Jury Panel",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Consolidated the complete 24-Month Umang Fellowship Master Portfolio",
          "linkedDeliverableId": null
        },
        {
          "criterion": "Graduated as a confident ECCE educator, grassroots leader, and social innovator",
          "linkedDeliverableId": null
        }
      ]
    }
  },
};
