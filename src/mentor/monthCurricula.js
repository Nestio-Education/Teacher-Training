// src/mentor/monthCurricula.js
//
// Static display data for all 24 months — objective + weekly focus only,
// used by the curriculum context panel in PDCAGenerator.jsx. No API call,
// no database: this mirrors backend/src/data/monthCurricula.js (which also
// carries deliverables/successCheck for grounding) but keeps the frontend
// bundle light. Keep the two in sync if you edit a month's content.
//
// NOTE — Month 3: the source doc for Month 3 (Child Psychology & Theories)
// was a duplicate of Month 4 in the original upload; its objective/weekly
// focus below are placeholders. Update MONTH_CURRICULA[3] once correct.

export const MONTH_CURRICULA = {
  1: {
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
    ]
  },
  2: {
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
    ]
  },
  3: {
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
    ]
  },
  4: {
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
    ]
  },
  5: {
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
    ]
  },
  6: {
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
    ]
  },
  7: {
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
    ]
  },
  8: {
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
    ]
  },
  9: {
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
    ]
  },
  10: {
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
    ]
  },
  11: {
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
    ]
  },
  12: {
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
    ]
  },
  13: {
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
    ]
  },
  14: {
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
    ]
  },
  15: {
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
    ]
  },
  16: {
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
    ]
  },
  17: {
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
    ]
  },
  18: {
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
    ]
  },
  19: {
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
    ]
  },
  20: {
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
    ]
  },
  21: {
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
    ]
  },
  22: {
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
    ]
  },
  23: {
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
    ]
  },
  24: {
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
    ]
  },
};
