import { useEffect, useMemo, useState } from "react";
import { BarChart, DonutChart, ActivityItem, S, SectionCard, StatCard, StatusBadge } from "../components/Shared";
import { getAdminDashboard, getAdminTeachers, getAdminMentors, getCenters, getCourseAssignments, getTeacherAttendance } from "../services/api";
import { t } from "../services/i18n";

export function calculateTeacherScore(teacher, teacherAssignments, teacherAttendanceRecords) {
  // 1. Course Progress (average of assignment progressPercent)
  const teacherAssigns = teacherAssignments.filter(a => String(a.teacher?._id || a.teacher) === String(teacher._id || teacher.id));
  const avgProgress = teacherAssigns.length 
    ? teacherAssigns.reduce((sum, a) => sum + (a.progressPercent || 0), 0) / teacherAssigns.length 
    : 0;

  // 2. Assignment Completion Rate
  const completedAssigns = teacherAssigns.filter(a => ["completed", "approved", "reviewed"].includes(a.status)).length;
  const assignmentRate = teacherAssigns.length ? (completedAssigns / teacherAssigns.length) * 100 : 0;

  // 3. Attendance Percentage
  const teacherAtt = teacherAttendanceRecords.filter(r => String(r.teacher?._id || r.teacher) === String(teacher._id || teacher.id));
  const presentCount = teacherAtt.filter(r => ["present", "late"].includes(r.status)).length;
  const attendanceRate = teacherAtt.length ? (presentCount / teacherAtt.length) * 100 : 85; // Default to 85% if no records yet

  // 4. Lesson Completion
  const lessonsCompleted = teacher.teacherProfile?.lessonsCompleted || 0;
  const lessonScore = Math.min(lessonsCompleted * 5, 100); // 20 lessons = 100%

  // 5. Completed Courses
  const coursesCompleted = teacher.teacherProfile?.coursesCompleted || 0;
  const courseScore = Math.min(coursesCompleted * 20, 100); // 5 courses = 100%

  // 6. Assessment results
  const gradedAssigns = teacherAssigns.filter(a => a.score !== null);
  const avgScore = gradedAssigns.length 
    ? (gradedAssigns.reduce((sum, a) => sum + (a.score || 0), 0) / gradedAssigns.reduce((sum, a) => sum + (a.rubric?.reduce((s, r) => s + (r.maxScore || 25), 0) || 100), 0)) * 100
    : 80;

  let score = (avgProgress * 0.20) + (assignmentRate * 0.15) + (attendanceRate * 0.25) + (lessonScore * 0.15) + (courseScore * 0.15) + (avgScore * 0.10);
  
  if (teacher.status !== "approved") {
    score = score * 0.5;
  }

  return Math.round(Math.min(Math.max(score, 0), 100));
}

function buildMonthlyRegistrations(teachers) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.toLocaleString("en-IN", { month: "short" });
    const count = teachers.filter((t) => {
      const d = t.createdAt ? new Date(t.createdAt) : null;
      return d && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    }).length;
    months.push({ month, val: count });
  }
  return months;
}

export default function OverviewTab() {
  const [stats, setStats]         = useState(null);
  const [teachers, setTeachers]   = useState([]);
  const [centers, setCenters]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [mentors, setMentors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    let ignore = false;
    let isInitialLoad = true;

    const fetchOverviewData = () => {
      Promise.all([
        getAdminDashboard(),
        getAdminTeachers(),
        getCenters(),
        getCourseAssignments(),
        getTeacherAttendance(),
        getAdminMentors(),
      ])
        .then(([dash, teachersData, centersData, assignData, attendData, mentorsData]) => {
          if (ignore) return;
          setStats(dash || {});
          setTeachers(teachersData?.teachers || []);
          setCenters(centersData?.centers || []);
          setAssignments(assignData?.assignments || []);
          setAttendance(attendData?.records || []);
          setMentors(mentorsData?.mentors || []);
        })
        .catch(err => {
          if (!ignore) {
            console.error("Overview poll failed:", err);
            if (isInitialLoad) setError(err.message);
          }
        })
        .finally(() => {
          if (!ignore && isInitialLoad) setLoading(false);
          isInitialLoad = false;
        });
    };

    fetchOverviewData();
    const interval = setInterval(fetchOverviewData, 8000); // 8-second poll for near-real-time updates

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  const approvedTeachers = teachers.filter(t => t.status === "approved");
  const pendingTeachers  = teachers.filter(t => t.status === "pending");
  const rejectedTeachers = teachers.filter(t => t.status === "rejected");

  const monthlyReg    = useMemo(() => buildMonthlyRegistrations(teachers), [teachers]);
  const addedThisMonth = monthlyReg[monthlyReg.length - 1]?.val || 0;

  const topTeachersWithScores = useMemo(() => {
    return approvedTeachers.map(t => {
      const score = calculateTeacherScore(t, assignments, attendance);
      return { teacher: t, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  }, [approvedTeachers, assignments, attendance]);

  const recentActivities = useMemo(() => {
    const items = [];
    [...teachers].slice(0, 3).forEach(t => items.push({
      icon: t.status === "pending" ? "⏳" : "✅",
      text: `${t.name} ${t.status === "pending" ? "registered — awaiting approval" : "is an active teacher"}`,
      time: t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recently",
      color: t.status === "pending" ? "#f59e0b" : "#10b981",
    }));
    assignments.slice(0, 2).forEach(a => items.push({
      icon: "📚",
      text: `${a.teacher?.name || "Teacher"} assigned to "${a.course?.title || "a course"}"`,
      time: a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recently",
      color: "#3b82f6",
    }));
    return items.slice(0, 5);
  }, [teachers, assignments]);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #fef3c7", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: "#d97706" }}>{t("Loading dashboard data...")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{t("⚠️")}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>{t("Failed to load dashboard")}</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>

      {/* ── Hero Header ── */}
      <div style={{ background: "linear-gradient(135deg,#f59e0b 0%,#d97706 60%,#b45309 100%)", borderRadius: 20, padding: "28px 32px", marginBottom: 24, color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
        <div style={{ position: "absolute", bottom: -20, right: 80, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fffbeb", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
                {t("SpacECE Admin Panel")}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
                {t(greeting)}, Admin! 👋
              </h1>
              <p style={{ fontSize: 13, margin: 0, color: "rgba(255,255,255,0.85)" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              {pendingTeachers.length > 0 && (
                <div style={{ background: "rgba(239,68,68,0.25)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fee2e2" }}>{pendingTeachers.length}</div>
                  <div style={{ fontSize: 10, color: "#fee2e2", fontWeight: 700 }}>{t("Pending Approval")}</div>
                </div>
              )}
              <div style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{approvedTeachers.length}</div>
                <div style={{ fontSize: 10, color: "white", fontWeight: 700 }}>{t("Active Teachers")}</div>
              </div>
              <div style={{ background: "rgba(139,92,246,0.3)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#ede9fe" }}>{stats?.totalMentors ?? mentors.length}</div>
                <div style={{ fontSize: 10, color: "#ede9fe", fontWeight: 700 }}>{t("Active Mentors")}</div>
              </div>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div style={{ display: "flex", gap: 20, marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap" }}>
            {[
              { label: t("Centers"),          val: stats?.totalCenters    ?? centers.length, icon: "🏫" },
              { label: t("Mentors"),          val: stats?.totalMentors    ?? mentors.length, icon: "👨‍🏫" },
              { label: t("Children"),         val: stats?.totalChildren   ?? 0,              icon: "👶" },
              { label: t("Course Completion"),val: `${stats?.courseCompletionPercent ?? 0}%`, icon: "📚" },
              { label: t("Present Today"),    val: stats?.teacherAttendanceToday ?? 0,       icon: "✅" },
              { label: t("Pending Activities"),val: stats?.pendingActivities ?? 0,           icon: "📋" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1 }}>{item.val}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{item.label}</div>
                </div>
                {i < 5 && <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)", marginLeft: 12 }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Cards Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { icon: "🏫", label: t("Total Centers"),     val: stats?.totalCenters ?? centers.length, color: "#f59e0b", bg: "#fef3c7", sub: `${centers.filter(c=>c.status==="active").length} ${t("active")}` },
          { icon: "👩‍🏫", label: t("Total Teachers"),   val: stats?.totalTeachers ?? teachers.length, color: "#10b981", bg: "#d1fae5", sub: `+${addedThisMonth} ${t("this month")}` },
          { icon: "👨‍🏫", label: t("Total Mentors"),    val: stats?.totalMentors ?? 0, color: "#8b5cf6", bg: "#ede9fe", sub: stats?.pendingMentors > 0 ? `${stats.pendingMentors} ${t("pending approvals")}` : t("All clear ✓") },
          { icon: "⏳", label: t("Pending Approvals"), val: pendingTeachers.length, color: "#ef4444", bg: "#fee2e2", sub: pendingTeachers.length > 0 ? t("Need attention") : t("All clear ✓") },
          { icon: "👶", label: t("Total Children"),    val: stats?.totalChildren ?? 0, color: "#3b82f6", bg: "#dbeafe", sub: t("Active Enrollments") },
          { icon: "📚", label: t("Course Completion"), val: `${stats?.courseCompletionPercent ?? 0}%`, color: "#06b6d4", bg: "#cffafe", sub: t("Assigned vs done") },
          { icon: "📋", label: t("Pending Activities"),val: stats?.pendingActivities ?? 0, color: "#a855f7", bg: "#faf5ff", sub: t("Awaiting review") },
        ].map((s, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "18px 20px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderTop: `3px solid ${s.color}` }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#1c1917", letterSpacing: "-1px", lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, marginTop: 3 }}>{s.label}</div>
            {s.sub && <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Teacher Registration Chart */}
        <SectionCard title={`📊 ${t("Teacher Registrations — Last 6 Months")}`}>
          {teachers.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0", textAlign: "center" }}>{t("No teacher records yet.")}</div>
          ) : (
            <>
              <BarChart data={monthlyReg} color="#f59e0b" height={150} />
              <div style={{ display: "flex", gap: 12, marginTop: 16, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
                {[
                  { label: t("Total"),    val: teachers.length,          color: "#374151" },
                  { label: t("Approved"), val: approvedTeachers.length,  color: "#10b981" },
                  { label: t("Pending"),  val: pendingTeachers.length,   color: "#f59e0b" },
                  { label: t("Rejected"), val: rejectedTeachers.length,  color: "#ef4444" },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px", background: "#f9fafb", borderRadius: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        {/* Operational Summary */}
        <SectionCard title={`⚡ ${t("Platform Summary")}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: t("Teacher Attendance Today"),  val: stats?.teacherAttendanceToday ?? 0, max: Math.max(stats?.totalTeachers ?? 1, 1),  color: "#10b981" },
              { label: t("Course Completion Rate"),    val: stats?.completedCourses  ?? 0,       max: Math.max(stats?.assignedCourses  ?? 1, 1), color: "#3b82f6" },
              { label: t("Pending Lessons"),           val: stats?.pendingLessons    ?? 0,       max: Math.max(stats?.assignedCourses  ?? 1, stats?.pendingLessons ?? 1), color: "#f59e0b" },
              { label: t("Activity Reviews Needed"),   val: stats?.pendingActivities ?? 0,       max: Math.max(stats?.pendingActivities ?? 1, 10),                        color: "#8b5cf6" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <DonutChart value={item.val} max={item.max} color={item.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: item.color, fontWeight: 800, marginTop: 2 }}>{item.val} / {item.max}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20 }}>
        {/* Top Teachers Leaderboard */}
        <SectionCard title={`🏆 ${t("Top Performing Teachers")}`}>
          {topTeachersWithScores.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "20px 0" }}>{t("No approved teachers yet.")}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topTeachersWithScores.map(({ teacher: t, score }, i) => {
                const rankBadges = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                const rankColors = ["#f59e0b", "#64748b", "#b45309", "#475569", "#475569"];
                const rankBg = ["#fef3c7", "#f1f5f9", "#ffedd5", "#f8fafc", "#f8fafc"];
                return (
                  <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: rankBg[i], color: rankColors[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                      {i < 3 ? rankBadges[i] : i + 1}
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${rankColors[i]}22, ${rankColors[i]}44)`, color: rankColors[i], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                      {t.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: rankColors[i] }}>{score}%</span>
                      </div>
                      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${score}%`, height: "100%", background: rankColors[i], borderRadius: 3, transition: "width 0.8s" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {topTeachersWithScores.length === 0 && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#fef3c7", borderRadius: 8, fontSize: 11, color: "#92400e" }}>
              💡 Approve teachers to see their performance stats here.
            </div>
          )}
        </SectionCard>

        {/* Centers at a Glance */}
        <SectionCard title={`🏫 ${t("Centers at a Glance")}`}>
          {centers.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "20px 0" }}>{t("No centers created yet.")}</div>
          ) : centers.slice(0, 5).map((c, i) => (
            <div key={c._id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10,
                background: c.status === "active" ? "linear-gradient(135deg,#fef3c7,#fbbf24)" : "#f3f4f6",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{t("🏫")}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{c.city || "—"} · {c.teachers?.length || 0} {t("teachers")}</div>
              </div>
              <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                background: c.status === "active" ? "#d1fae5" : "#f3f4f6",
                color: c.status === "active" ? "#065f46" : "#6b7280", flexShrink: 0 }}>
                {c.status}
              </span>
            </div>
          ))}
          {centers.length > 5 && (
            <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", paddingTop: 8 }}>+{centers.length - 5} more centers</div>
          )}
        </SectionCard>

        {/* Mentor Overview */}
        <SectionCard title={`👨‍🏫 ${t("Mentor Overview")}`}>
          {mentors.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "20px 0" }}>{t("No mentors registered yet.")}</div>
          ) : (
            <>
              {/* Mentor Status Breakdown */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[
                  { label: "Approved", val: mentors.filter(m => m.status === "approved").length, color: "#10b981", bg: "#d1fae5" },
                  { label: "Pending",  val: mentors.filter(m => m.status === "pending").length,  color: "#f59e0b", bg: "#fef3c7" },
                  { label: "Blocked",  val: mentors.filter(m => m.status === "blocked").length,  color: "#ef4444", bg: "#fee2e2" },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: s.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: s.color, fontWeight: 700 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Mentors List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {mentors.slice(0, 5).map((m, i) => (
                  <div key={m._id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf622,#8b5cf644)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                      {m.name?.[0]?.toUpperCase() || "M"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{m.email}</div>
                    </div>
                    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700,
                      background: m.status === "approved" ? "#d1fae5" : m.status === "pending" ? "#fef3c7" : "#fee2e2",
                      color: m.status === "approved" ? "#065f46" : m.status === "pending" ? "#92400e" : "#991b1b", flexShrink: 0 }}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
              {mentors.length > 5 && (
                <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", paddingTop: 8 }}>+{mentors.length - 5} more mentors</div>
              )}
            </>
          )}
        </SectionCard>

        {/* Recent Activity */}
        <SectionCard title="🕐 Recent Activity">
          {recentActivities.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No recent activity.</div>
          ) : recentActivities.map((a, i) => (
            <ActivityItem key={i} {...a} />
          ))}

          {/* Teacher Status Snapshot */}
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Teacher Breakdown</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { label: "Approved", val: approvedTeachers.length,  color: "#10b981", bg: "#d1fae5" },
                { label: "Pending",  val: pendingTeachers.length,   color: "#f59e0b", bg: "#fef3c7" },
                { label: "Rejected", val: rejectedTeachers.length,  color: "#ef4444", bg: "#fee2e2" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: s.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: s.color, fontWeight: 700 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
