import { useState } from "react";
import { t } from "../services/i18n";

/* ===========================================
   MENTOR USER GUIDE
   Full-page overlay explaining every tab in
   the Mentor Panel sidebar. Section order and
   set mirrors the navItems array in
   MentorDashboard.jsx — update both together.
=========================================== */

const MENTOR_GUIDE_SECTIONS = [
  {
    icon: "📊",
    title: "Overview",
    summary: "Your at-a-glance summary of assigned teachers, centers, and mentee progress.",
    steps: [
      "See your assigned teachers, total centers, children enrolled, and assigned courses in the top stat cards.",
      "Track average course completion, active vs. pending/inactive teacher status, and pending reviews.",
      "The recent activity feed lists your latest Growth Cycles, Capstone milestones, and mentee observations.",
    ],
  },
  {
    icon: "👥",
    title: "Teacher Management",
    summary: "Manage the teachers and fellows assigned to you, and approve new fellow accounts.",
    steps: [
      "Review fellows awaiting approval — the badge on this tab shows how many are pending.",
      "Approve or reject a fellow's account, or record an observation about a mentee's progress.",
      "See at a glance which of your fellows are active vs. pending/inactive.",
    ],
  },
  {
    icon: "📅",
    title: "Teacher Attendance",
    summary: "Review the daily attendance your assigned fellows have logged.",
    steps: [
      "See present, absent, and late counts, plus an overall attendance rate, for the fellows you mentor.",
      "Search by fellow name to check an individual's attendance history.",
      "Each entry shows the date, status, and whether it was logged via geotag, manually, or through the app.",
    ],
  },
  {
    icon: "📍",
    title: "My Attendance",
    summary: "Mark your own attendance with location verification.",
    steps: [
      "Allow location access when prompted so your check-in can be geotagged.",
      "Confirm your location matches your working center before submitting.",
      "Review your past check-in history and session log.",
    ],
  },
  {
    icon: "📝",
    title: "Fellow Activities",
    summary: "Review, grade, and give feedback on activity submissions from your fellows.",
    steps: [
      "Open a submission to review it, then approve, reject, or flag it for rework — rejecting or flagging requires feedback text.",
      "Select multiple submissions and use 'Bulk Approve' to clear several at once.",
      "Use the keyboard shortcuts in the review panel to move through submissions quickly.",
    ],
  },
  {
    icon: "📚",
    title: "Curriculum Management",
    summary: "Build and manage the fellowship curriculum, and assign it to your fellows.",
    steps: [
      "Click '+ Create New Plan', or 'Seed UMANG Plan' to start from the standard template.",
      "Add modules to each semester, or use 'Bulk Import' to add several modules at once.",
      "Open a plan's builder to edit its content, then use 'Assign Mentees' to assign it to specific fellows.",
    ],
  },
  {
    icon: "📋",
    title: "Lesson Plans",
    summary: "Manage, generate, and review lesson plans for your fellows.",
    steps: [
      "Use 'Import Excel' to bulk-add lesson plans, or 'Auto-Generate & Publish' to have AI draft one from a category, subject, and month.",
      "Use 'Assign Plan' to assign a lesson plan to specific fellows.",
      "Open a submitted assignment or report to review it, add feedback, and approve or reject it.",
    ],
  },
  {
    icon: "🏆",
    title: "Impact & Capstone",
    summary: "Track your own Semester 4 Capstone project and mentee leadership impact.",
    steps: [
      "Submit each of the four milestones in order — Problem Identification, Solution Design, Implementation, and Evaluation.",
      "Your Impact Score, teachers guided, and capstone progress are shown in the stat cards at the top.",
      "Submissions sync automatically with program advisors — no separate notification needed.",
    ],
  },
  {
    icon: "📝",
    title: "Growth Cycle",
    summary: "Assign Plan–Do–Check–Act growth cycles to your fellows and track their progress.",
    steps: [
      "Use the AI-generated report to review and approve an official month 1–24 report for a fellow, grounded in their logged data, before it's sent to Admin.",
      "Or fill out a custom Growth Cycle — Plan, Do, Check, Act — for a specific fellow under 'New Growth Cycle'.",
      "Each fellow's cycles are numbered in their own sequence — check 'Fellow Progress' and 'Growth Cycle History' to see where each fellow stands.",
    ],
  },
  {
    icon: "💬",
    title: "Feedback",
    summary: "Share your own mentoring experience and see how past feedback was received.",
    steps: [
      "Rate your experience and write your feedback under 'New Feedback'.",
      "Your previously submitted feedback is listed under 'My Past Feedback'.",
    ],
  },
  {
    icon: "🔔",
    title: "Notifications",
    summary: "Stay updated on approvals, fellow submissions, and admin messages.",
    steps: [
      "Open this from the ⋮ menu near your name in the top-right corner — it isn't in the sidebar.",
      "You'll also get an in-app reminder — and an email to your login address — whenever fellows are waiting on your approval.",
      "Click a notification to mark it read, or use 'Mark all read'.",
    ],
  },
  {
    icon: "👤",
    title: "Profile",
    summary: "Manage your personal information, professional details, and password.",
    steps: [
      "Open this from the ⋮ menu near your name in the top-right corner — it isn't in the sidebar.",
      "Update your personal information and professional details.",
      "Change your password from the Security section.",
    ],
  },
];

function GuideSection({ section, isOpen, onToggle }) {
  return (
    <div
      style={{
        border: "1px solid #f1f5f9",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 10,
        background: "white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          border: "none",
          background: isOpen ? "#dbeafe" : "white",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          transition: "background 0.18s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>{section.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1c1917" }}>{t(section.title)}</div>
            <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>{t(section.summary)}</div>
          </div>
        </div>
        <span
          style={{
            color: "#9ca3af",
            fontSize: 12,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s",
          }}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: "4px 18px 16px 54px" }}>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#4b5563", fontSize: 12.5, lineHeight: 1.7 }}>
            {section.steps.map((step, i) => (
              <li key={i}>{t(step)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function MentorUserGuide({ onClose }) {
  const [openIndex, setOpenIndex] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = MENTOR_GUIDE_SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#f8fafc",
        zIndex: 2000,
        overflowY: "auto",
        fontFamily: "'Segoe UI','Inter',-apple-system,sans-serif",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 28px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: "#dbeafe",
                color: "#1e40af",
                border: "1px solid #bfdbfe",
                marginBottom: 10,
              }}
            >
              🎓 {t("Mentor Panel")}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1c1917", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
              📖 {t("User Guide")}
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              {t("A quick walkthrough of every section in the Mentor Panel.")}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#374151",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ✕ {t("Close")}
          </button>
        </div>

        <input
          type="text"
          placeholder={t("Search a topic, e.g. growth cycle or attendance...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 20,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 13 }}>
            {t("No matching topics. Try another search term.")}
          </div>
        ) : (
          filtered.map((section, i) => (
            <GuideSection
              key={section.title}
              section={section}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))
        )}
      </div>
    </div>
  );
}