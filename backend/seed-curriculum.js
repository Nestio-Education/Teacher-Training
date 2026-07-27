import mongoose from "mongoose";
import { CurriculumPlan, CurriculumPhase } from "./src/models/Curriculum.js";
import { User } from "./src/models/User.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const seedCurriculum = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB.");

    const mentor = await User.findOne({ role: "mentor" });
    if (!mentor) {
      console.log("No mentor found in DB. Cannot create plan.");
      process.exit(1);
    }
    console.log(`Using mentor: ${mentor.name} (${mentor._id})`);

    // Create the Plan
    const plan = await CurriculumPlan.create({
      mentor: mentor._id,
      title: "UMANG Fellowship Semester 4",
      durationType: "2yr",
      status: "published"
    });
    console.log(`Created Plan: ${plan.title}`);

    // Create Phases
    const phasesData = [
      {
        phaseNumber: 1,
        semester: "Semester 4",
        title: "Month 19 — Leadership Identity",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-31"),
        topics: [
          { title: "Week 1: Leadership Philosophy & Personal Values", description: "Write a personal Leadership Manifesto that integrates values, philosophy, field experience, and future vision." },
          { title: "Week 2: Adaptive Leadership & Vision Building", description: "Distinguish between technical challenges and adaptive challenges." },
          { title: "Week 3: Emotional Intelligence & Servant Leadership", description: "Practise servant leadership behaviours in cluster community." },
          { title: "Week 4: Ethical Leadership & Leadership Manifesto", description: "Reflect on ethical dilemmas and develop a personal ethical framework." }
        ]
      },
      {
        phaseNumber: 2,
        semester: "Semester 4",
        title: "Month 20 — Capstone Project Implementation",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-30"),
        topics: [
          { title: "Week 1: Project Planning & Launch", description: "Move Capstone Project from planning to execution." },
          { title: "Week 2: Resource Mobilisation & Early Implementation", description: "Secure resources and establish data collection systems." },
          { title: "Week 3: Deep Implementation & Monitoring", description: "Run core activities with increasing community ownership." },
          { title: "Week 4: Mid-Point Review & Course Correction", description: "Review progress against indicators and adapt plans." }
        ]
      },
      {
        phaseNumber: 3,
        semester: "Semester 4",
        title: "Month 21 — Systems Influence",
        startDate: new Date("2026-10-01"),
        endDate: new Date("2026-10-31"),
        topics: [
          { title: "Policy Understanding", description: "Study the ECE Policy Landscape." },
          { title: "Government Collaboration & ICDS Integration", description: "Formalise relationships into documented partnerships." },
          { title: "Grant Writing & Proposal Writing", description: "Learn to write a compelling, structured funding proposal." },
          { title: "Policy Brief Writing & NGO Collaboration", description: "Write concise documents to present problems, provide evidence, and recommend specific policy actions." }
        ]
      },
      {
        phaseNumber: 4,
        semester: "Semester 4",
        title: "Month 22 — Career Readiness",
        startDate: new Date("2026-11-01"),
        endDate: new Date("2026-11-30"),
        topics: [
          { title: "Career Pathways & Resume Masterclass", description: "Present experience in a way that speaks directly to each type of employer." },
          { title: "LinkedIn Branding", description: "Create a compelling LinkedIn presence." },
          { title: "Interview Preparation (STAR Method)", description: "Select, shape, and articulate STAR stories with precision." },
          { title: "Professional Portfolio & Salary Negotiation", description: "Complete a professional portfolio and learn offer evaluation." }
        ]
      },
      {
        phaseNumber: 5,
        semester: "Semester 4",
        title: "Month 23 — Capstone Completion",
        startDate: new Date("2026-12-01"),
        endDate: new Date("2026-12-31"),
        topics: [
          { title: "Impact Assessment (M&E)", description: "Conduct a formal endline assessment." },
          { title: "Data Analysis Framework", description: "Organise raw data into a clean spreadsheet and calculate summary statistics." },
          { title: "Success Stories & Case Studies", description: "Write narrative case studies of real individuals touched by the project." },
          { title: "Community Validation", description: "Present findings back to the community and ask for their assessment." }
        ]
      },
      {
        phaseNumber: 6,
        semester: "Semester 4",
        title: "Month 24 — Graduation & Alumni Transition",
        startDate: new Date("2027-01-01"),
        endDate: new Date("2027-01-31"),
        topics: [
          { title: "Final Leadership Summit", description: "4-Day Residential Bootcamp (Legacy & Leadership, Innovation Showcase, Final Presentations)." },
          { title: "Exit Interview", description: "60-minute structured Exit Interview with the Programme Manager." },
          { title: "Two-Year Career Roadmap", description: "Map professional development goals for the 24 months following graduation." },
          { title: "Graduation Ceremony", description: "Formally receive the Certificate in Early Childhood Education & Community Leadership." }
        ]
      }
    ];

    for (let phaseData of phasesData) {
      const phase = await CurriculumPhase.create({
        plan: plan._id,
        ...phaseData
      });
      console.log(`Created Phase ${phase.phaseNumber}: ${phase.title}`);
    }

    console.log("Seed complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedCurriculum();
