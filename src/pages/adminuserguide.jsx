import { useState } from "react";
import { t } from "../services/i18n";

/* ===========================================
   ADMIN USER GUIDE
   Full-page overlay explaining every tab in
   the Admin Panel sidebar.
=========================================== */

const ADMIN_GUIDE_SECTIONS = [
  {
    icon: "📊",
    title: "Admin Dashboard",
    summary: "Your at-a-glance overview of the whole platform.",
    steps: [
      "Shows total centers, teachers, children, course completion %, and pending activities in the top banner.",
      "The colored cards below break these numbers down individually.",
      "The 'Teacher Registrations' chart tracks growth over the last 6 months.",
      "Use this page first each day to spot anything needing attention.",
    ],
  },
  {
    icon: "🏫",
    title: "Center Management",
    summary: "Add, edit, and monitor training centers.",
    steps: [
      "Click 'Add Center' to register a new center with its name, address, and contact details.",
      "Use the search/filter bar to find a specific center quickly.",
      "Click a center row to view its assigned teachers, enrolled children, and activity history.",
      "Deactivate a center instead of deleting it if it's temporarily closed.",
    ],
  },
  {
    icon: "👩‍🏫",
    title: "Teacher Management",
    summary: "Manage teacher accounts, roles, and center assignments.",
    steps: [
      "Add a new teacher with their email — they'll receive login credentials.",
      "Assign or reassign a teacher to a center from their profile page.",
      "Use the status toggle to activate/deactivate a teacher's access.",
      "Pending teacher approvals show as a badge on the sidebar tab.",
    ],
  },
  {
    icon: "📚",
    title: "Course Management",
    summary: "Create and organize training courses and their content.",
    steps: [
      "Click 'New Course' — add a title, description, and category.",
      "Upload notes-based content (.docx) which is automatically parsed into readable lessons.",
      "Attach a proctored MCQ assessment to a course from the assessment tab.",
      "Publish only when content and assessment are ready.",
    ],
  },
  {
    icon: "📸",
    title: "Activity Monitoring",
    summary: "Track teacher and child activity logs across centers.",
    steps: [
      "View a recent feed of activities logged by teachers.",
      "Filter by center, date range, or activity type to audit specific periods.",
      "Flagged or incomplete activities are highlighted for follow-up.",
    ],
  },
  {
    icon: "📋",
    title: "Lesson Plans",
    summary: "Review and manage lesson plans submitted or generated for teachers.",
    steps: [
      "Browse lesson plans by center, age group, or activity type.",
      "Approve, edit, or reject a submitted lesson plan from its detail view.",
      "Plans generated via the AI Lesson Planner appear here too.",
    ],
  },
  {
    icon: "✏️",
    title: "AI Lesson Planner",
    summary: "Generate early-childhood lesson plans automatically.",
    steps: [
      "Select an age group, developmental focus, and duration to generate a plan instantly.",
      "The generator draws from the curated activity dataset.",
      "Review and edit the generated plan before publishing it.",
    ],
  },
  {
    icon: "👶",
    title: "Children & Classes",
    summary: "Manage enrolled children and their class/section assignments.",
    steps: [
      "Add a child's profile with basic details and enrollment date.",
      "Assign each child to a class/section under a specific center.",
      "Move a child between classes as they progress.",
    ],
  },
  {
    icon: "📝",
    title: "Assignment Review",
    summary: "Review assessment submissions and scores awaiting approval.",
    steps: [
      "The badge count shows how many submissions are pending review.",
      "Open a submission to see the teacher's answers and auto-graded score.",
      "Approve or request resubmission — approved scores sync automatically to dashboards.",
    ],
  },
  {
    icon: "📅",
    title: "Attendance",
    summary: "Track daily attendance across centers and classes.",
    steps: [
      "View attendance by center, class, or individual child.",
      "Export attendance data for a date range for reporting purposes.",
    ],
  },
  {
    icon: "📈",
    title: "Reports & Analytics",
    summary: "Deeper analytics on course completion, attendance, and performance.",
    steps: [
      "Choose a report type and filter by date range or center.",
      "Export reports for stakeholders as needed.",
    ],
  },
  {
    icon: "🔔",
    title: "Notifications",
    summary: "System and platform notifications for admins.",
    steps: [
      "New approvals, flagged activities, or system alerts appear here.",
      "Mark notifications as read or click through to the relevant page.",
    ],
  },
  {
    icon: "⚙️",
    title: "Settings & Roles",
    summary: "Configure platform settings and manage admin/staff role permissions.",
    steps: [
      "Manage who has admin access and what permissions each role has.",
      "Update platform-wide settings and defaults.",
    ],
  },
  {
    icon: "💬",
    title: "Feedback",
    summary: "Review feedback submitted by teachers about courses and trainers.",
    steps: [
      "Browse feedback by tag, rating, or course.",
      "Respond to feedback — your response is visible to the teacher who submitted it.",
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
          background: isOpen ? "#fef3c7" : "white",
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

export default function AdminUserGuide({ onClose }) {
  const [openIndex, setOpenIndex] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = ADMIN_GUIDE_SECTIONS.filter(
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
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fbbf24",
                marginBottom: 10,
              }}
            >
              🛡️ {t("Admin Panel")}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1c1917", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
              📖 {t("User Guide")}
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              {t("A quick walkthrough of every section in the Admin Panel.")}
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
          placeholder={t("Search a topic, e.g. attendance or course...")}
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