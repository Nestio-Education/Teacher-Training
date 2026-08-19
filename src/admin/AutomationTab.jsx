import { useState, useEffect } from "react";
import { Logo, Toast, Badge, StatusBadge, StatCard, SectionCard, S, globalCSS } from "../components/Shared";
import { t, setLanguage, getLanguageList, getCurrentLanguage } from "../services/i18n";
import { getAutomationStatus, sendAttendanceReminders, autoAssignCourse, getAdminDashboard, getCourses, getReminderRiskReport, sendDueReminders } from "../services/api";

export default function AutomationTab({ user }) {
  const [automationStatus, setAutomationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [sendingReminders, setSendingReminders] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState([]);
  const [reminderChannel, setReminderChannel] = useState("in_app");
  const [riskReport, setRiskReport] = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(true);
  const [sendingDueReminders, setSendingDueReminders] = useState(false);
  const [lastSentDetails, setLastSentDetails] = useState(null);
  const [lastAttendanceReminderNames, setLastAttendanceReminderNames] = useState(null);
  const [lastAutoAssignNames, setLastAutoAssignNames] = useState(null);

  useEffect(() => {
    loadAutomationData();
  }, []);

  const loadAutomationData = async () => {
    setLoading(true);
    try {
      const [statusRes, dashboardRes, coursesRes] = await Promise.all([
        getAutomationStatus(),
        getAdminDashboard(),
        getCourses(),
      ]);
      setAutomationStatus(statusRes);
      setCourses(coursesRes.courses || []);
    } catch (err) {
      console.error("Failed to load automation data:", err);
    } finally {
      setLoading(false);
    }
    loadRiskReport();
  };

  const loadRiskReport = async () => {
    setLoadingRisk(true);
    try {
      const res = await getReminderRiskReport();
      setRiskReport(res);
    } catch (err) {
      console.error("Failed to load reminder risk report:", err);
    } finally {
      setLoadingRisk(false);
    }
  };

  const handleSendDueReminders = async () => {
    setSendingDueReminders(true);
    try {
      const result = await sendDueReminders();
      setToast({
        msg: `Sent ${result.sentCount} reminder(s)` +
          (result.adminNotified ? `, ${result.adminNotified} admin(s) notified` : "") +
          (result.centerMentorsNotified ? `, ${result.centerMentorsNotified} center mentor(s) notified` : "") +
          (result.mentorsNotified ? `, ${result.mentorsNotified} mentor(s) notified about at-risk fellows` : "") +
          ".",
        type: "success",
      });
      setLastSentDetails(result.sentDetails || []);
      loadRiskReport();
    } catch (err) {
      setToast({ msg: err.message || "Failed to send reminders.", type: "error" });
    } finally {
      setSendingDueReminders(false);
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const result = await sendAttendanceReminders(reminderChannel);
      const errNote = result.channelErrors?.length
        ? ` ⚠️ Channel errors: ${result.channelErrors.join("; ")}`
        : "";
      setToast({
        msg: (result.message || "Reminders sent!") + errNote,
        type: result.sent > 0 ? "success" : "error",
      });
      setLastAttendanceReminderNames(result.sentTo || []);
      loadAutomationData();
    } catch (err) {
      setToast({ msg: err.message || "Failed to send reminders.", type: "error" });
    } finally {
      setSendingReminders(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!selectedCourse) {
      setToast({ msg: "Please select a course first.", type: "error" });
      return;
    }
    setAutoAssigning(true);
    try {
      const result = await autoAssignCourse(selectedCourse);
      setToast({ msg: result.message || "Auto-assignment completed!", type: "success" });
      setLastAutoAssignNames(result.assignedTo || []);
      setSelectedCourse("");
      loadAutomationData();
    } catch (err) {
      setToast({ msg: err.message || "Failed to auto-assign.", type: "error" });
    } finally {
      setAutoAssigning(false);
    }
  };

  const status = automationStatus?.automationStatus || {};

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#d97706" }}>🔄 Loading Automation Status...</div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={S.pageTitle}>⚙️ Automation Center</h1>
          <p style={S.pageSub}>Monitor and control automated processes across the portal</p>
        </div>
        <button onClick={loadAutomationData} style={S.exportBtn}>🔄 Refresh Status</button>
      </div>

      {/* Automation Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard 
          icon="📍" 
          label="Attendance Reminders" 
          val={status.attendanceReminders?.pending || 0} 
          sub={`${status.attendanceReminders?.total || 0} total (teachers/mentors/fellows)`}
          color="#f59e0b" 
          bg="#fef3c7"
        />
        <StatCard 
          icon="📚" 
          label="Pending Assignments" 
          val={status.courseAssignments?.pending || 0} 
          sub="Awaiting completion"
          color="#3b82f6" 
          bg="#dbeafe"
        />
        <StatCard 
          icon="🔔" 
          label="Unread Notifications" 
          val={status.notifications?.unread || 0} 
          sub="Across all teachers"
          color="#ef4444" 
          bg="#fee2e2"
        />
        <StatCard 
          icon="✅" 
          label="Automation Status" 
          val="Active" 
          sub="All systems running"
          color="#10b981" 
          bg="#d1fae5"
        />
      </div>

      {/* AI Reminder Prediction — who is likely to miss a deadline */}
      <SectionCard title="🎯 AI Reminder Prediction — Who is likely to miss deadlines?">
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
          Risk is calculated from each teacher's attendance history, completion rate, and pending/overdue tasks
          (daily activity reports, assessments, course deadlines, parent sessions). Teachers flagged HIGH or
          MEDIUM automatically get a reminder {riskReport?.reminderWindowHours || 24} hours before their deadline.
        </p>

        <div style={{ padding: "10px 14px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>
            🤖 Fully automatic: this runs on its own every day at 10:00 AM — no admin action needed.
            The button below is only for sending an extra reminder right now, if needed.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <StatCard icon="🔴" label="High Risk" val={riskReport?.highRiskCount ?? "-"} sub="Likely to miss deadline" color="#ef4444" bg="#fee2e2" />
          <StatCard icon="🟡" label="Medium Risk" val={riskReport?.mediumRiskCount ?? "-"} sub="Needs a nudge" color="#f59e0b" bg="#fef3c7" />
          <StatCard icon="🟢" label="Low Risk" val={riskReport?.lowRiskCount ?? "-"} sub="On track" color="#10b981" bg="#d1fae5" />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={handleSendDueReminders}
            disabled={sendingDueReminders}
            style={{ ...S.primaryBtn, background: "linear-gradient(135deg,#ef4444,#b91c1c)", opacity: sendingDueReminders ? 0.6 : 1 }}
          >
            {sendingDueReminders ? "Sending..." : "📤 Send Reminders Now"}
          </button>
        </div>

        {lastSentDetails !== null && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 8 }}>
              📋 Last run — {lastSentDetails.length} reminder(s) sent:
            </div>
            {lastSentDetails.length === 0 ? (
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                No one had anything due within the next 24 hours at the time of this run.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lastSentDetails.map((d, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#374151", borderBottom: i < lastSentDetails.length - 1 ? "1px solid #dcfce7" : "none", paddingBottom: 6 }}>
                    <span style={{ fontWeight: 700 }}>{d.teacherName}</span>
                    {" — "}
                    <span style={{ color: "#166534" }}>{d.category}</span>
                    {": "}
                    <span>{d.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loadingRisk ? (
          <div style={{ fontSize: 13, color: "#9ca3af", padding: 16 }}>Loading risk report...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#6b7280", borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "8px 10px" }}>Teacher</th>
                  <th style={{ padding: "8px 10px" }}>Role</th>
                  <th style={{ padding: "8px 10px" }}>Risk of Delay</th>
                  <th style={{ padding: "8px 10px" }}>Score</th>
                  <th style={{ padding: "8px 10px" }}>Reasons</th>
                  <th style={{ padding: "8px 10px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(riskReport?.teachers || []).map((t) => (
                  <tr key={t.teacherId} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1c1917" }}>{t.teacherName}</td>
                    <td style={{ padding: "8px 10px", color: "#6b7280", textTransform: "capitalize" }}>{t.role || "teacher"}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <Badge
                        color={t.riskLevel === "HIGH" ? "#ef4444" : t.riskLevel === "MEDIUM" ? "#f59e0b" : "#10b981"}
                        bg={t.riskLevel === "HIGH" ? "#fee2e2" : t.riskLevel === "MEDIUM" ? "#fef3c7" : "#d1fae5"}
                      >
                        {t.riskLevel}
                      </Badge>
                    </td>
                    <td style={{ padding: "8px 10px", color: "#6b7280" }}>{t.riskScore}</td>
                    <td style={{ padding: "8px 10px", color: "#6b7280" }}>{t.reasons.join("; ")}</td>
                    <td style={{ padding: "8px 10px", color: "#374151" }}>{t.action}</td>
                  </tr>
                ))}
                {(!riskReport?.teachers || riskReport.teachers.length === 0) && (
                  <tr>
                    <td colSpan={6} style={{ padding: "16px", textAlign: "center", color: "#9ca3af" }}>
                      No teacher data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Automation Features Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        
        {/* Attendance Auto-Reminder */}
        <SectionCard title="📍 Auto Attendance Reminders">
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
            Automatically send reminders to teachers who haven't marked attendance today.
          </p>
          
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Notification Channel</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { key: "in_app", label: "In-App", icon: "🔔" },
                { key: "sms", label: "SMS", icon: "📱" },
                { key: "whatsapp", label: "WhatsApp", icon: "💬" },
                { key: "all", label: "All Channels", icon: "🌐" },
              ].map(ch => (
                <button
                  key={ch.key}
                  onClick={() => setReminderChannel(ch.key)}
                  style={{
                    padding: "8px 14px", borderRadius: 8, border: "1.5px solid",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    borderColor: reminderChannel === ch.key ? "#f59e0b" : "#e5e7eb",
                    background: reminderChannel === ch.key ? "#fef3c7" : "white",
                    color: reminderChannel === ch.key ? "#92400e" : "#6b7280",
                  }}
                >
                  {ch.icon} {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Pending (teachers/mentors/fellows): <strong style={{ color: "#f59e0b" }}>{status.attendanceReminders?.pending || 0}</strong>
              </div>
            </div>
            <button
              onClick={handleSendReminders}
              disabled={sendingReminders || (status.attendanceReminders?.pending || 0) === 0}
              style={{
                ...S.primaryBtn,
                background: "linear-gradient(135deg,#f59e0b,#d97706)",
                opacity: (sendingReminders || (status.attendanceReminders?.pending || 0) === 0) ? 0.6 : 1,
              }}
            >
              {sendingReminders ? "Sending..." : "📤 Send Reminders"}
            </button>
          </div>

          {lastAttendanceReminderNames !== null && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>
                📋 Last sent — {lastAttendanceReminderNames.length} notified:
              </div>
              {lastAttendanceReminderNames.length === 0 ? (
                <div style={{ fontSize: 12, color: "#6b7280" }}>Everyone had already marked attendance.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {lastAttendanceReminderNames.map((p, i) => (
                    <span key={p.id || i} style={{ fontSize: 11, fontWeight: 600, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 6, padding: "3px 8px" }}>
                      {p.name} <span style={{ fontWeight: 400, color: "#b45309", textTransform: "capitalize" }}>({p.role})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>
              ✅ Auto-sends reminders via the selected channel to teachers, mentors and fellows who haven't checked in today.
            </div>
          </div>
        </SectionCard>

        {/* Auto Course Assignment */}
        <SectionCard title="📚 Auto Course Assignment">
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
            Automatically assign courses to teachers, mentors and fellows based on their subject specialization.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Select Course</label>
            <select
              style={{ ...S.input, padding: "10px 14px" }}
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
            >
              <option value="">-- Select a course --</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title || "Untitled Course"}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAutoAssign}
            disabled={autoAssigning || !selectedCourse}
            style={{
              ...S.primaryBtn,
              width: "100%",
              background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
              opacity: (autoAssigning || !selectedCourse) ? 0.6 : 1,
            }}
          >
            {autoAssigning ? "Assigning..." : "🤖 Auto-Assign to Matching Teachers"}
          </button>

          {lastAutoAssignNames !== null && (
            <div style={{ marginTop: 16, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 6 }}>
                📋 Last run — assigned to {lastAutoAssignNames.length}:
              </div>
              {lastAutoAssignNames.length === 0 ? (
                <div style={{ fontSize: 12, color: "#6b7280" }}>No new matches — everyone matching was already assigned.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {lastAutoAssignNames.map((p, i) => (
                    <span key={p.id || i} style={{ fontSize: 11, fontWeight: 600, color: "#1d4ed8", background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 6, padding: "3px 8px" }}>
                      {p.name} <span style={{ fontWeight: 400, color: "#3b82f6", textTransform: "capitalize" }}>({p.role})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 16, padding: "10px 14px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
            <div style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 600 }}>
              💡 Matching logic: Teachers, mentors and fellows with the same subject specialization as the course category will be auto-assigned.
            </div>
          </div>
        </SectionCard>
      </div>


      {/* Automation History / Logs */}
      <SectionCard title="📋 Automation Activity Log">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
          {[
            { 
              title: "Attendance System", 
              status: "active", 
              lastRun: "Daily 9:00 AM",
              icon: "📍",
              description: "Sends reminders to teachers who haven't marked attendance"
            },
            { 
              title: "Course Notifications", 
              status: "active", 
              lastRun: "On assignment",
              icon: "📚",
              description: "Notifies teachers when new courses are assigned"
            },
            { 
              title: "Assignment Alerts", 
              status: "active", 
              lastRun: "On submission",
              icon: "📝",
              description: "Alerts admin when teachers submit assignments"
            },
            { 
              title: "OTP Password Reset", 
              status: "active", 
              lastRun: "On request",
              icon: "🔐",
              description: "SHA-256 hashed OTP for secure password resets"
            },
            { 
              title: "Multi-Language Support", 
              status: "active", 
              lastRun: "Always",
              icon: "🌐",
              description: "6 languages: EN, HI, MR, TE, KN, TA"
            },
            { 
              title: "Real-time Notifications", 
              status: "active", 
              lastRun: "Instant",
              icon: "⚡",
              description: "Socket.IO for live updates across devices"
            },
          ].map((item, i) => (
            <div key={i} style={{ 
              padding: "16px", background: "white", borderRadius: 12, 
              border: "1px solid #f1f5f9", borderLeft: "4px solid #10b981" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{item.lastRun}</div>
                </div>
                <StatusBadge status="active" />
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.4 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="⚡ Quick Actions">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              const allPending = status.attendanceReminders?.pending || 0;
              if (allPending > 0) {
                handleSendReminders();
              } else {
                setToast({ msg: "All teachers have marked attendance today!", type: "success" });
              }
            }}
            style={{ ...S.primaryBtn, background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            📍 Send All Attendance Reminders
          </button>
          <button
            onClick={loadAutomationData}
            style={S.exportBtn}
          >
            🔄 Refresh All Status
          </button>
        </div>
      </SectionCard>
    </div>
  );
}