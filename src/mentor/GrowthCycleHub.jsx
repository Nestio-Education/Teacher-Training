import { useState } from "react";
import AttendanceTab from "../admin/AttendanceTab";
import MentorActivitiesTab from "./MentorActivitiesTab";
import MentorCourseManagementTab from "./MentorCourseManagementTab";
import { ImpactCapstoneTab, PDCATab } from "./MentorDashboardTabs";

const SECTIONS = [
  { key: "pdca", label: "PDCA & Observations", icon: "🔄" },
  { key: "attendance", label: "Attendance", icon: "📅" },
  { key: "activities", label: "Activities", icon: "📝" },
  { key: "courses", label: "Courses", icon: "📚" },
  { key: "impact", label: "Impact & Capstone", icon: "🏆" },
];

export default function GrowthCycleHub({ user, setToast, onUserUpdate }) {
  const [section, setSection] = useState("pdca");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: 12,
          marginBottom: 20,
        }}
      >
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: section === s.key ? 800 : 600,
              color: section === s.key ? "#6366f1" : "#64748b",
              background: section === s.key ? "#6366f114" : "transparent",
              border: section === s.key ? "1px solid #6366f133" : "1px solid transparent",
              borderRadius: 10,
              padding: "7px 13px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {section === "pdca" && (
        <PDCATab user={user} setToast={setToast} onUserUpdate={onUserUpdate} />
      )}
      {section === "attendance" && (
        <AttendanceTab role="mentor" user={user} setToast={setToast} />
      )}
      {section === "activities" && (
        <MentorActivitiesTab user={user} setToast={setToast} />
      )}
      {section === "courses" && (
        <MentorCourseManagementTab user={user} setToast={setToast} />
      )}
      {section === "impact" && (
        <ImpactCapstoneTab user={user} setToast={setToast} onUserUpdate={onUserUpdate} />
      )}
    </div>
  );
}
