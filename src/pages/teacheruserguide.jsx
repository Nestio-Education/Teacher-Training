import { useState } from "react";
import { t } from "../services/i18n";

/* ===========================================
   TEACHER USER GUIDE
   Full-page overlay explaining every tab in
   the Teacher Portal sidebar. Tab list mirrors
   the navItems array in TeacherDashboard.jsx.
=========================================== */

const TEACHER_GUIDE_SECTIONS = [
  {
    icon: "📊",
    title: "Teacher's Dashboard",
    summary: "Your personal overview — assigned classes, progress, and today's activities.",
    steps: [
      "See your total students, attendance %, average grade, certificates, and pending tasks at a glance.",
      "Your assigned class(es) are listed with center, curriculum level, and schedule.",
      "'Today's Activities' surfaces lessons and assigned courses due today.",
      "Course Progress and Upcoming Lessons widgets link straight to those tabs.",
    ],
  },
  {
    icon: "📋",
    title: "Daily Attendance",
    summary: "Mark and review daily attendance for your assigned class.",
    steps: [
      "Select your class and date, then mark each child present or absent.",
      "Review past attendance records for patterns or corrections.",
    ],
  },
  {
    icon: "📍",
    title: "Geotag Attendance",
    summary: "Mark attendance with location verification for center-based check-ins.",
    steps: [
      "Allow location access when prompted so your attendance can be geotagged.",
      "Confirm your location matches your assigned center before submitting.",
    ],
  },
  {
    icon: "🎓",
    title: "Training & Lessons",
    summary: "Manage classroom training sessions and lesson delivery.",
    steps: [
      "View and manage classroom sessions tied to your assigned classes.",
      "Log session details as you conduct them.",
    ],
  },
  {
    icon: "✏️",
    title: "AI Lesson Planner",
    summary: "Generate a lesson plan tailored to your class's age group and focus area.",
    steps: [
      "Select an age group, developmental focus, and duration to generate a plan instantly.",
      "Review and edit the generated plan before using it or submitting it for review.",
    ],
  },
  {
    icon: "📚",
    title: "My Courses",
    summary: "Access your assigned training courses and their notes-based content.",
    steps: [
      "Click a course to open its content — organized as readable notes/lessons, not videos.",
      "Track your progress bar as you complete each section.",
      "Once notes are complete, use 'Go to Assessment' to take the linked MCQ test.",
      "'Restart Course' resets progress to 0% and removes any certificate — use with care.",
    ],
  },
  {
    icon: "📝",
    title: "Assessments",
    summary: "Take proctored MCQ assessments tied to your courses.",
    steps: [
      "Start an assessment only when ready — it's proctored, so avoid switching tabs or exiting fullscreen.",
      "Answer all questions, then submit — your score saves automatically.",
      "A 'results pending review' message means an admin is verifying your submission.",
    ],
  },
  {
    icon: "🏆",
    title: "Certificates",
    summary: "View and download certificates for completed, approved courses.",
    steps: [
      "Certificates appear once a course is completed and reviewed/approved by an admin.",
      "Use 'View Certificate' to preview, or 'Download' to save the PDF.",
    ],
  },
  {
    icon: "🔔",
    title: "Notifications",
    summary: "Stay updated on assignments, deadlines, and admin messages.",
    steps: [
      "New course assignments, deadline reminders, and admin feedback appear here.",
      "Click a notification to mark it read, or use 'Mark all read'.",
    ],
  },
  {
    icon: "💬",
    title: "Feedback",
    summary: "Submit feedback about courses and trainers, and see admin responses.",
    steps: [
      "Rate the course and (optionally) the trainer, tag the topic, and write your feedback.",
      "Toggle 'Submit anonymously' if you'd rather not attach your name.",
      "Your previous submissions and any admin responses are listed on the right.",
    ],
  },
  {
    icon: "👤",
    title: "My Profile",
    summary: "Manage your personal information, password, and preferences.",
    steps: [
      "Click 'Edit Profile' to update your name, phone, address, subject, and experience.",
      "Upload a profile picture (PNG/JPG, max 2MB).",
      "Change your password from the 'Change Password' section — minimum 8 characters.",
      "Set your preferred language and notification channel (in-app, email, SMS, WhatsApp).",
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

export default function TeacherUserGuide({ onClose }) {
  const [openIndex, setOpenIndex] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = TEACHER_GUIDE_SECTIONS.filter(
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
              🎓 {t("Teacher Panel")}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1c1917", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
              📖 {t("User Guide")}
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              {t("A quick walkthrough of every section in your Teacher Portal.")}
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
          placeholder={t("Search a topic, e.g. assessment or attendance...")}
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