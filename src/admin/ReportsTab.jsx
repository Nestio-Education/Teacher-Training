import { useEffect, useMemo, useState } from "react";
import { AttendanceBar, BarChart, S, SectionCard, StatCard, StatusBadge } from "../components/Shared";
import { getCourseAssignments, getTeacherAttendance, getTrainers, getCenters, getClasses, getChildren, getLessonPlans, getAdminLessonAssignments, getActivities, getCourses, getAdminMentors, getMentorAttendance, getAdminMentorTracking } from "../services/api";
import { t } from "../services/i18n";

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildMonthlyEnrollment(teachers) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const val = teachers.filter((teacher) => {
      const createdAt = teacher.createdAt ? new Date(teacher.createdAt) : null;
      return createdAt &&
        createdAt.getMonth() === date.getMonth() &&
        createdAt.getFullYear() === date.getFullYear();
    }).length;
    return {
      month: date.toLocaleString("en-IN", { month: "short" }),
      val,
    };
  });
}

function buildMonthlyActivity(allActivities) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - index) + 1, 0);
    const completed = allActivities.filter(a => {
      const d = a.reviewedAt || a.createdAt;
      if (!d) return false;
      const dt = new Date(d);
      return dt >= date && dt <= monthEnd && (a.status === "approved" || a.status === "completed");
    }).length;
    const total = allActivities.filter(a => {
      const d = a.createdAt;
      if (!d) return false;
      const dt = new Date(d);
      return dt >= date && dt <= monthEnd;
    }).length;
    return {
      month: date.toLocaleString("en-IN", { month: "short" }),
      val: completed,
      total,
    };
  });
}

/* ── Global keyframes + hover/animation classes used across every report tab ── */
const ReportStyles = () => (
  <style>{`
    @keyframes reportFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes rowSlideIn {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes barGrow {
      from { height: 0 !important; opacity: 0.3; }
      to   { opacity: 1; }
    }
    @keyframes popIn {
      0%   { opacity: 0; transform: scale(0.85); }
      70%  { opacity: 1; transform: scale(1.04); }
      100% { transform: scale(1); }
    }
    @keyframes shimmerMove {
      0%   { background-position: -200px 0; }
      100% { background-position: 200px 0; }
    }
    @keyframes pulseDot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.4); opacity: 0.5; }
    }
    @keyframes underlineSlide {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }

    .report-fade-in { animation: reportFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }

    .report-tab-btn { position: relative; overflow: hidden; transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
    .report-tab-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .report-tab-btn.active::after {
      content: ""; position: absolute; left: 8px; right: 8px; bottom: 3px; height: 2px;
      background: #f59e0b; border-radius: 2px; transform-origin: left; animation: underlineSlide 0.3s ease;
    }

    .stat-pop { animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
    .stat-pop:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

    .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
    .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.08); }

    .hover-row { transition: background 0.15s ease, transform 0.15s ease; animation: rowSlideIn 0.35s ease both; }
    .hover-row:hover { background: #fffbeb !important; transform: translateX(2px); }

    .export-btn-anim { transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .export-btn-anim:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 6px 16px rgba(245,158,11,0.25); }
    .export-btn-anim:active { transform: translateY(0) scale(0.98); }

    .progress-fill-anim { transition: width 0.8s cubic-bezier(0.16,1,0.3,1); }

    .live-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #10b981; margin-right: 6px; animation: pulseDot 1.6s ease-in-out infinite; }

    .bar-tooltip {
      position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(4px);
      background: #1c1917; color: white; font-size: 10px; font-weight: 700; padding: 4px 8px;
      border-radius: 6px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease;
      z-index: 5;
    }
    .bar-wrap:hover .bar-tooltip { opacity: 1; transform: translateX(-50%) translateY(0); }
    .bar-wrap { position: relative; }
    .bar-fill-anim { transition: filter 0.15s ease, transform 0.15s ease; transform-origin: bottom; }
    .bar-wrap:hover .bar-fill-anim { filter: brightness(1.12); transform: scaleX(1.08); }
  `}</style>
);

/* ── Animated, gradient bar chart with staggered grow-in + hover tooltips ── */
const AnimatedBarChart = ({ data, color = "#f59e0b", colorLight = "#fde68a", height = 140, label = "val", subLabel }) => {
  const safeData = Array.isArray(data) ? data : [];
  const max = Math.max(...safeData.map(d => d[label] || 0), 1);
  const gradId = `barGrad-${color.replace("#", "")}`;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height, padding: "0 4px" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={colorLight} />
          </linearGradient>
        </defs>
      </svg>
      {safeData.map((d, i) => {
        const val = d[label] || 0;
        const pct = Math.max((val / max) * 100, val > 0 ? 6 : 2);
        return (
          <div key={i} className="bar-wrap" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
            <div className="bar-tooltip">{val}{subLabel ? ` ${subLabel}` : ""}</div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#374151" }}>{val}</span>
            <div
              className="bar-fill-anim"
              style={{
                width: "100%",
                maxWidth: 34,
                height: `${pct}%`,
                background: `linear-gradient(180deg, ${color}, ${colorLight})`,
                borderRadius: "8px 8px 3px 3px",
                animation: `barGrow 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s both`,
                boxShadow: `0 4px 10px ${color}33`,
              }}
            />
            <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, letterSpacing: 0.3 }}>{d.month || d.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function ReportsTab({ teachers = [], courses = [], setToast }) {
  const [activeReport, setActiveReport] = useState("teacherPerformance");
  const [assignments, setAssignments] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [centers, setCenters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [children, setChildren] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [planAssignments, setPlanAssignments] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentorAttendance, setMentorAttendance] = useState([]);
  const [trackingData, setTrackingData] = useState({ pdca: [], capstone: [], observations: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCourseAssignments(), getTrainers(), getTeacherAttendance(),
      getCenters(), getClasses(), getChildren(), getLessonPlans(),
      getAdminLessonAssignments(), getActivities(), getAdminMentors(),
      getMentorAttendance(), getAdminMentorTracking()
    ]).then(([a, tr, at, ce, cl, ch, lp, pa, act, mt, ma, mtrack]) => {
      setAssignments(a?.assignments || []);
      setTrainers(tr?.trainers || []);
      setAttendanceRecords(at?.records || []);
      setCenters(ce?.centers || []);
      setClasses(cl?.classes || []);
      setChildren(ch?.children || []);
      setLessonPlans(lp?.lessonPlans || []);
      setPlanAssignments(pa?.assignments || []);
      setAllActivities(act?.activities || act?.submissions || []);
      setMentors(mt?.mentors || []);
      setMentorAttendance(ma?.records || ma?.attendanceRecords || []);
      setTrackingData(mtrack || { pdca: [], capstone: [], observations: [] });
    }).catch(err => {
      console.error("Reports data load error:", err);
    }).finally(() => setLoading(false));
  }, []);

  const approvedTeachers = teachers.filter(t => t.status === "approved");
  const publishedCourses = courses.filter(c => c.status === "published");

  /* ── Teacher Performance Report ── */
  const teacherPerformance = useMemo(() => {
    return approvedTeachers.map(t => {
      const tAssignments = assignments.filter(a => String(a.teacher?._id || a.teacher) === String(t._id));
      const completed = tAssignments.filter(a => a.status === "completed" || a.status === "approved").length;
      const overdue = tAssignments.filter(a => {
        if (a.status === "completed" || a.status === "approved") return false;
        if (a.dueDate) return new Date(a.dueDate) < new Date();
        return false;
      }).length;
      const total = tAssignments.length || 1;
      const onTimeRate = Math.round((completed / total) * 100);
      const attendanceRecs = attendanceRecords.filter(r => String(r.teacher?._id || r.teacher) === String(t._id));
      const present = attendanceRecs.filter(r => ["present", "late"].includes(r.status)).length;
      const attendanceRate = attendanceRecs.length ? Math.round((present / attendanceRecs.length) * 100) : 0;
      const center = t.teacherProfile?.center;
      return { teacher: t, completed, overdue, total: tAssignments.length, onTimeRate, attendanceRate, centerName: center?.name || "—" };
    }).sort((a, b) => b.onTimeRate - a.onTimeRate);
  }, [approvedTeachers, assignments, attendanceRecords]);

  /* ── Class Progress Report ── */
  const classProgress = useMemo(() => {
    return classes.map(cls => {
      const clsTeachers = approvedTeachers.filter(t => {
        const clsIds = (t.teacherProfile?.classes || []).map(c => c?._id || c);
        return clsIds.includes(cls._id || cls.id);
      });
      const clsPlanAssignments = planAssignments.filter(pa => {
        const clsId = pa.class?._id || pa.class;
        return String(clsId) === String(cls._id || cls.id);
      });
      const totalPlans = clsPlanAssignments.length;
      const completedPlans = clsPlanAssignments.filter(pa => pa.status === "completed" || pa.status === "reviewed").length;
      const planPct = totalPlans ? Math.round((completedPlans / totalPlans) * 100) : 0;
      const clsChildren = children.filter(ch => String(ch.class?._id || ch.class) === String(cls._id || cls.id));
      const center = centers.find(c => (c._id || c.id) === (cls.center?._id || cls.center));
      return { cls, centerName: center?.name || "—", teacherCount: clsTeachers.length, childCount: clsChildren.length, totalPlans, completedPlans, planPct };
    });
  }, [classes, approvedTeachers, planAssignments, children, centers]);

  /* ── Child Development Report ── */
  const childDevelopment = useMemo(() => {
    return children.filter(ch => ch.status === "active").map(ch => {
      const cls = classes.find(c => (c._id || c.id) === (ch.class?._id || ch.class));
      const clsPlanAssignments = planAssignments.filter(pa => {
        const clsId = pa.class?._id || pa.class;
        return String(clsId) === String(ch.class?._id || ch.class);
      });
      const totalActivities = clsPlanAssignments.length;
      const completedActivities = clsPlanAssignments.filter(pa => pa.status === "completed" || pa.status === "reviewed").length;
      const progressPct = totalActivities ? Math.round((completedActivities / totalActivities) * 100) : 0;
      const childGrades = allActivities.filter(a => String(a.child?._id || a.child) === String(ch._id));
      const avgScore = childGrades.length ? Math.round(childGrades.reduce((sum, g) => sum + (g.score || 0), 0) / childGrades.length) : 0;
      return { child: ch, className: cls?.name || "—", centerName: ch.center?.name || "—", totalActivities, completedActivities, progressPct, avgScore };
    });
  }, [children, classes, planAssignments, allActivities]);

  /* ── Center Summary Report ── */
  const centerSummary = useMemo(() => {
    return centers.filter(c => c.status === "active").map(center => {
      const centerTeachers = approvedTeachers.filter(t => String(t.teacherProfile?.center?._id || t.teacherProfile?.center) === String(center._id));
      const centerClasses = classes.filter(c => String(c.center?._id || c.center) === String(center._id));
      const centerChildren = children.filter(ch => String(ch.center?._id || ch.center) === String(center._id));
      const centerAssignments = assignments.filter(a => {
        const t = teachers.find(te => String(te._id) === String(a.teacher?._id || a.teacher));
        return t && String(t.teacherProfile?.center?._id || t.teacherProfile?.center) === String(center._id);
      });
      const completed = centerAssignments.filter(a => a.status === "completed" || a.status === "approved").length;
      const completionRate = centerAssignments.length ? Math.round((completed / centerAssignments.length) * 100) : 0;
      return { center, teacherCount: centerTeachers.length, classCount: centerClasses.length, childCount: centerChildren.length, assignmentCount: centerAssignments.length, completionRate };
    });
  }, [centers, approvedTeachers, classes, children, assignments, teachers]);

  const monthlyActivity = useMemo(() => buildMonthlyActivity(allActivities), [allActivities]);
  const monthlyEnrollment = useMemo(() => buildMonthlyEnrollment(teachers), [teachers]);

  /* ── Enrollment trend derived stats (for the animated summary cards) ── */
  const enrollmentStats = useMemo(() => {
    const vals = monthlyEnrollment.map(m => m.val);
    const total = vals.reduce((a, b) => a + b, 0);
    const last = vals[vals.length - 1] || 0;
    const prev = vals[vals.length - 2] || 0;
    const growthPct = prev === 0 ? (last > 0 ? 100 : 0) : Math.round(((last - prev) / prev) * 100);
    const peakIdx = vals.indexOf(Math.max(...vals));
    const peakMonth = monthlyEnrollment[peakIdx]?.month || "—";
    const peakVal = vals[peakIdx] || 0;
    const avgPerMonth = total ? Math.round((total / 6) * 10) / 10 : 0;
    return { total, last, growthPct, peakMonth, peakVal, avgPerMonth };
  }, [monthlyEnrollment]);

  /* ── Mentors Performance Report ── */
  const mentorsReport = useMemo(() => {
    return mentors.map(m => {
      const center = m.mentorProfile?.center;
      const centerName = center?.name || m.mentorProfile?.assignedCenter || "—";
      const menteesCount = (m.mentorProfile?.assignedTeachers || []).length;

      const pdcaCount = (trackingData.pdca || []).filter(p => String(p.mentorId?._id || p.mentorId) === String(m._id)).length;
      const capstoneCount = (trackingData.capstone || []).filter(c => String(c.mentorId?._id || c.mentorId) === String(m._id)).length;
      const observationCount = (trackingData.observations || []).filter(o => String(o.mentorId?._id || o.mentorId) === String(m._id)).length;

      const mAttendance = (mentorAttendance || []).filter(r => String(r.mentor?._id || r.mentor || r.teacher?._id || r.teacher) === String(m._id));
      const present = mAttendance.filter(r => ["present", "late"].includes(r.status)).length;
      const attendanceRate = mAttendance.length ? Math.round((present / mAttendance.length) * 100) : 0;

      return {
        mentor: m,
        centerName,
        menteesCount,
        pdcaCount,
        capstoneCount,
        observationCount,
        attendanceRate
      };
    });
  }, [mentors, mentorAttendance, trackingData]);

  const exportMentorsReport = () => {
    downloadCsv("mentors-performance-report.csv", [
      ["Mentor Name", "Email", "Center", "Mentees Count", "PDCA Growth Cycles", "Capstone Submissions", "Observations", "Attendance Rate"],
      ...mentorsReport.map(r => [r.mentor.name, r.mentor.email, r.centerName, r.menteesCount, r.pdcaCount, r.capstoneCount, r.observationCount, `${r.attendanceRate}%`])
    ]);
  };

  const reportTabs = [
    { key: "teacherPerformance", label: t("Teacher Performance"), icon: "👩‍🏫" },
    { key: "classProgress", label: t("Class Progress"), icon: "🎒" },
    { key: "childDevelopment", label: t("Child Development"), icon: "👶" },
    { key: "centerSummary", label: t("Center Summary"), icon: "🏫" },
    { key: "monthlyActivity", label: t("Monthly Activity"), icon: "📊" },
    { key: "enrollment", label: t("Enrollment Trend"), icon: "📈" },
    { key: "completion", label: "Course Completion", icon: "✅" },
    { key: "attendance", label: "Attendance", icon: "📅" },
    { key: "trainer", label: t("Trainers"), icon: "🎯" },
    { key: "mentors", label: t("Mentors"), icon: "👨‍🏫" },
  ];

  const exportTeacherPerformance = () => {
    downloadCsv("teacher-performance-report.csv", [
      ["Teacher", "Center", "Assignments Completed", "Overdue", "Total", "On-Time Rate", "Attendance Rate"],
      ...teacherPerformance.map(r => [r.teacher.name, r.centerName, r.completed, r.overdue, r.total, `${r.onTimeRate}%`, `${r.attendanceRate}%`])
    ]);
  };

  const exportClassProgress = () => {
    downloadCsv("class-progress-report.csv", [
      ["Class", "Center", "Teachers", "Children", "Plans Assigned", "Plans Completed", "Progress %"],
      ...classProgress.map(r => [r.cls.name, r.centerName, r.teacherCount, r.childCount, r.totalPlans, r.completedPlans, `${r.planPct}%`])
    ]);
  };

  const exportChildDevelopment = () => {
    downloadCsv("child-development-report.csv", [
      ["Child", "Class", "Center", "Activities Completed", "Total Activities", "Progress %"],
      ...childDevelopment.map(r => [r.child.fullName, r.className, r.centerName, r.completedActivities, r.totalActivities, `${r.progressPct}%`])
    ]);
  };

  const exportCenterSummary = () => {
    downloadCsv("center-summary-report.csv", [
      ["Center", "Teachers", "Classes", "Children", "Assignments", "Completion Rate"],
      ...centerSummary.map(r => [r.center.name, r.teacherCount, r.classCount, r.childCount, r.assignmentCount, `${r.completionRate}%`])
    ]);
  };

  const exportMonthlyActivity = () => {
    downloadCsv("monthly-activity-report.csv", [
      ["Month", "Completed", "Total"],
      ...monthlyActivity.map(r => [r.month, r.val, r.total])
    ]);
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh", fontSize: 14, fontWeight: 600, color: "#d97706" }}>🔄 Loading Reports...</div>;
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <ReportStyles />
      <h1 style={S.pageTitle}>{t("Reports & Analytics")}</h1>
      <p style={S.pageSub}>{t("Comprehensive operational reports — all data exportable as CSV.")}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { icon: "👩‍🏫", label: t("Teachers"), val: approvedTeachers.length, color: "#f59e0b", bg: "#fef3c7" },
          { icon: "🎒", label: t("Classes"), val: classes.length, color: "#3b82f6", bg: "#dbeafe" },
          { icon: "👶", label: t("Children"), val: children.length, color: "#10b981", bg: "#d1fae5" },
          { icon: "🏫", label: t("Centers"), val: centers.filter(c => c.status === "active").length, color: "#8b5cf6", bg: "#ede9fe" },
          { icon: "📚", label: t("Courses"), val: publishedCourses.length, color: "#06b6d4", bg: "#cffafe" },
          { icon: "📝", label: t("Activities"), val: allActivities.length, color: "#ef4444", bg: "#fee2e2" },
        ].map((s, i) => (
          <div key={s.label} className="stat-pop" style={{ animationDelay: `${i * 0.06}s` }}>
            <StatCard icon={s.icon} label={s.label} val={s.val} color={s.color} bg={s.bg} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {reportTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveReport(tab.key)}
            className={`report-tab-btn${activeReport === tab.key ? " active" : ""}`}
            style={{
              padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${activeReport === tab.key ? "#f59e0b" : "#e5e7eb"}`,
              background: activeReport === tab.key ? "#fef3c7" : "white", color: activeReport === tab.key ? "#92400e" : "#6b7280",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Teacher Performance Report */}
      {activeReport === "teacherPerformance" && (
        <div className="report-fade-in" key="teacherPerformance">
        <SectionCard title="Teacher Performance Report" action={<button className="export-btn-anim" style={S.exportBtn} onClick={exportTeacherPerformance}>Export CSV</button>}>
          {teacherPerformance.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13 }}>No teacher data.</div> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                {["Teacher", "Center", "Completed", "Overdue", "On-Time Rate", "Attendance"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {teacherPerformance.map((r, i) => (
                  <tr key={r.teacher._id} className="hover-row" style={{ borderBottom: "1px solid #f9fafb", animationDelay: `${i * 0.03}s` }}>
                    <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#1c1917" }}>{r.teacher.name}</td>
                    <td style={{ padding: "12px", fontSize: 12, color: "#6b7280" }}>{r.centerName}</td>
                    <td style={{ padding: "12px", fontSize: 13, color: "#10b981", fontWeight: 700 }}>{r.completed}</td>
                    <td style={{ padding: "12px", fontSize: 13, color: r.overdue > 0 ? "#ef4444" : "#9ca3af", fontWeight: 700 }}>{r.overdue}</td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ height: 6, width: 60, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                          <div className="progress-fill-anim" style={{ height: "100%", width: `${r.onTimeRate}%`, background: r.onTimeRate >= 80 ? "#10b981" : r.onTimeRate >= 50 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: r.onTimeRate >= 80 ? "#10b981" : r.onTimeRate >= 50 ? "#f59e0b" : "#ef4444" }}>{r.onTimeRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px", fontSize: 12, fontWeight: 600, color: r.attendanceRate >= 90 ? "#10b981" : "#f59e0b" }}>{r.attendanceRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
        </div>
      )}

      {/* Class Progress Report */}
      {activeReport === "classProgress" && (
        <div className="report-fade-in" key="classProgress">
        <SectionCard title="Class Progress Report" action={<button className="export-btn-anim" style={S.exportBtn} onClick={exportClassProgress}>Export CSV</button>}>
          {classProgress.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13 }}>No classes found.</div> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
              {classProgress.map((r, i) => (
                <div key={r.cls._id} className="hover-lift" style={{ background: "#f9fafb", borderRadius: 12, padding: 16, border: "1px solid #f3f4f6", animation: `reportFadeUp 0.4s ease ${i * 0.05}s both` }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1c1917", marginBottom: 4 }}>{r.cls.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>{r.centerName} · {r.childCount} children · {r.teacherCount} teacher(s)</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
                    <span style={{ color: "#6b7280" }}>Lesson Plan Progress</span>
                    <span style={{ fontWeight: 700, color: r.planPct >= 80 ? "#10b981" : r.planPct >= 50 ? "#f59e0b" : "#ef4444" }}>{r.completedPlans}/{r.totalPlans} ({r.planPct}%)</span>
                  </div>
                  <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                    <div className="progress-fill-anim" style={{ height: "100%", width: `${r.planPct}%`, background: r.planPct >= 80 ? "#10b981" : r.planPct >= 50 ? "#f59e0b" : "#ef4444", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        </div>
      )}

      {/* Child Development Report */}
      {activeReport === "childDevelopment" && (
        <div className="report-fade-in" key="childDevelopment">
        <SectionCard title="Child Development Report" action={<button className="export-btn-anim" style={S.exportBtn} onClick={exportChildDevelopment}>Export CSV</button>}>
          {childDevelopment.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13 }}>No active children.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  {["Child", "Class", "Center", "Progress", "Activities Done"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {childDevelopment.slice(0, 50).map((r, i) => (
                    <tr key={r.child._id} className="hover-row" style={{ borderBottom: "1px solid #f9fafb", animationDelay: `${i * 0.02}s` }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#1c1917" }}>{r.child.fullName}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>{r.className}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>{r.centerName}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ height: 6, width: 50, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                            <div className="progress-fill-anim" style={{ height: "100%", width: `${r.progressPct}%`, background: r.progressPct >= 80 ? "#10b981" : "#f59e0b", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700 }}>{r.progressPct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#374151" }}>{r.completedActivities}/{r.totalActivities}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
        </div>
      )}

      {/* Center Summary Report */}
      {activeReport === "centerSummary" && (
        <div className="report-fade-in" key="centerSummary">
        <SectionCard title="Center Summary Report" action={<button className="export-btn-anim" style={S.exportBtn} onClick={exportCenterSummary}>Export CSV</button>}>
          {centerSummary.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13 }}>No centers.</div> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {centerSummary.map((r, i) => (
                <div key={r.center._id} className="hover-lift" style={{ background: "white", borderRadius: 14, padding: 18, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderTop: "3px solid #8b5cf6", animation: `reportFadeUp 0.4s ease ${i * 0.05}s both` }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1c1917", marginBottom: 10 }}>{r.center.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div style={{ textAlign: "center", padding: 8, background: "#f8fafc", borderRadius: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b" }}>{r.teacherCount}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Teachers</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 8, background: "#f8fafc", borderRadius: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#3b82f6" }}>{r.classCount}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Classes</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 8, background: "#f8fafc", borderRadius: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>{r.childCount}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Children</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: "#6b7280" }}>Completion Rate</span>
                      <span style={{ fontWeight: 700, color: r.completionRate >= 80 ? "#10b981" : "#f59e0b" }}>{r.completionRate}%</span>
                    </div>
                    <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                      <div className="progress-fill-anim" style={{ height: "100%", width: `${r.completionRate}%`, background: r.completionRate >= 80 ? "#10b981" : "#f59e0b", borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        </div>
      )}

      {/* Monthly Activity Report */}
      {activeReport === "monthlyActivity" && (
        <div className="report-fade-in" key="monthlyActivity">
        <SectionCard title="Monthly Activity Completion Report" action={<button className="export-btn-anim" style={S.exportBtn} onClick={exportMonthlyActivity}>Export CSV</button>}>
          <AnimatedBarChart data={monthlyActivity} color="#3b82f6" colorLight="#bfdbfe" height={160} label="val" subLabel="done" />
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10 }}>
            {monthlyActivity.map((m, i) => (
              <div key={i} className="hover-lift" style={{ background: "#f9fafb", borderRadius: 8, padding: 10, textAlign: "center", border: "1px solid #f3f4f6", animation: `reportFadeUp 0.35s ease ${i * 0.05}s both` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>{m.month}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#3b82f6" }}>{m.val}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>of {m.total} total</div>
              </div>
            ))}
          </div>
        </SectionCard>
        </div>
      )}

      {/* Enrollment Trend — redesigned, animated, with summary stat cards */}
      {activeReport === "enrollment" && (
        <div className="report-fade-in" key="enrollment">
        <SectionCard
          title="Teacher Enrollment Trend"
          action={
            <button
              className="export-btn-anim"
              style={S.exportBtn}
              onClick={() => downloadCsv("teacher-enrollment.csv", [["Name", "Email", "Status", "Center", "Created"], ...teachers.map(t => [t.name, t.email, t.status, t.teacherProfile?.center?.name || "", t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : ""])])}
            >
              Export CSV
            </button>
          }
        >
          {/* Animated summary stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 22 }}>
            <div className="stat-pop hover-lift" style={{ animationDelay: "0s", background: "linear-gradient(135deg,#fffbeb,#fef3c7)", borderRadius: 14, padding: "16px 18px", border: "1px solid #fde68a" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Total (6 mo)</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#b45309" }}>{enrollmentStats.total}</div>
            </div>
            <div className="stat-pop hover-lift" style={{ animationDelay: "0.06s", background: enrollmentStats.growthPct >= 0 ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : "linear-gradient(135deg,#fef2f2,#fee2e2)", borderRadius: 14, padding: "16px 18px", border: `1px solid ${enrollmentStats.growthPct >= 0 ? "#a7f3d0" : "#fecaca"}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: enrollmentStats.growthPct >= 0 ? "#065f46" : "#991b1b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>MoM Growth</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: enrollmentStats.growthPct >= 0 ? "#059669" : "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
                {enrollmentStats.growthPct >= 0 ? "▲" : "▼"} {Math.abs(enrollmentStats.growthPct)}%
              </div>
            </div>
            <div className="stat-pop hover-lift" style={{ animationDelay: "0.12s", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", borderRadius: 14, padding: "16px 18px", border: "1px solid #bfdbfe" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Peak Month</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#2563eb" }}>{enrollmentStats.peakMonth} <span style={{ fontSize: 14, color: "#60a5fa" }}>({enrollmentStats.peakVal})</span></div>
            </div>
            <div className="stat-pop hover-lift" style={{ animationDelay: "0.18s", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", borderRadius: 14, padding: "16px 18px", border: "1px solid #ddd6fe" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5b21b6", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                <span className="live-dot" />Avg / Month
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#7c3aed" }}>{enrollmentStats.avgPerMonth}</div>
            </div>
          </div>

          {/* Animated gradient bar chart */}
          <div style={{ background: "linear-gradient(180deg,#fffdf7,#ffffff)", border: "1px solid #f3f4f6", borderRadius: 16, padding: "20px 16px 8px" }}>
            <AnimatedBarChart data={monthlyEnrollment} color="#f59e0b" colorLight="#fde68a" height={180} subLabel="new teachers" />
          </div>
        </SectionCard>
        </div>
      )}

      {/* Course Completion */}
      {activeReport === "completion" && (
        <div className="report-fade-in" key="completion">
        <SectionCard title="Course Completion Report" action={<button className="export-btn-anim" style={S.exportBtn} onClick={() => {
          const data = publishedCourses.map(c => {
            const ca = assignments.filter(a => String(a.course?._id || a.course) === String(c._id));
            const comp = ca.filter(a => a.status === "completed" || a.status === "approved").length;
            return [c.title, ca.length, comp, ca.length ? `${Math.round(comp/ca.length*100)}%` : "0%"];
          });
          downloadCsv("course-completion.csv", [["Course", "Assigned", "Completed", "Rate"], ...data]);
        }}>Export CSV</button>}>
          {publishedCourses.map((c, i) => {
            const ca = assignments.filter(a => String(a.course?._id || a.course) === String(c._id));
            const comp = ca.filter(a => a.status === "completed" || a.status === "approved").length;
            const pct = ca.length ? Math.round(comp / ca.length * 100) : 0;
            return (
              <div key={c._id} className="hover-lift" style={{ marginBottom: 14, padding: 8, borderRadius: 8, animation: `reportFadeUp 0.35s ease ${i * 0.04}s both` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{c.title}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444" }}>{comp}/{ca.length} ({pct}%)</span>
                </div>
                <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div className="progress-fill-anim" style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444", borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </SectionCard>
        </div>
      )}

      {/* Attendance */}
      {activeReport === "attendance" && (
        <div className="report-fade-in" key="attendance">
        <SectionCard title="Teacher Attendance Report" action={<button className="export-btn-anim" style={S.exportBtn} onClick={() => {
          const data = approvedTeachers.map(t => {
            const recs = attendanceRecords.filter(r => String(r.teacher?._id || r.teacher) === String(t._id));
            const pres = recs.filter(r => ["present", "late"].includes(r.status)).length;
            return [t.name, recs.length ? `${Math.round(pres/recs.length*100)}%` : "N/A", recs.length];
          });
          downloadCsv("teacher-attendance.csv", [["Teacher", "Attendance %", "Records"], ...data]);
        }}>Export CSV</button>}>
          {approvedTeachers.map((t, i) => {
            const recs = attendanceRecords.filter(r => String(r.teacher?._id || r.teacher) === String(t._id));
            const pres = recs.filter(r => ["present", "late"].includes(r.status)).length;
            const pct = recs.length ? Math.round(pres / recs.length * 100) : 0;
            return (
              <div key={t._id} className="hover-lift" style={{ borderRadius: 8, animation: `reportFadeUp 0.3s ease ${i * 0.03}s both` }}>
                <AttendanceBar val={pct} name={`${t.name} (${recs.length} records)`} />
              </div>
            );
          })}
        </SectionCard>
        </div>
      )}

      {/* Trainers */}
      {activeReport === "trainer" && (
        <div className="report-fade-in" key="trainer">
        <SectionCard title="Trainer Performance Report" action={<button className="export-btn-anim" style={S.exportBtn} onClick={() => downloadCsv("trainer-report.csv", [["Trainer", "Subject", "Rating", "Status"], ...trainers.map(t => [t.name, t.subject, t.rating || 0, t.status])])}>Export CSV</button>}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "2px solid #f3f4f6" }}>
              {["Trainer", "Subject", "Sessions", "Rating", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {trainers.map((tr, i) => (
                <tr key={tr._id} className="hover-row" style={{ borderBottom: "1px solid #f9fafb", animationDelay: `${i * 0.03}s` }}>
                  <td style={{ padding: "12px", fontSize: 13, fontWeight: 700 }}>{tr.name}</td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#6b7280" }}>{tr.subject}</td>
                  <td style={{ padding: "12px", fontSize: 13 }}>{tr.sessions || 0}</td>
                  <td style={{ padding: "12px", fontSize: 13 }}>⭐ {tr.rating || 0}</td>
                  <td style={{ padding: "12px" }}><StatusBadge status={tr.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
        </div>
      )}

      {/* Mentors */}
      {activeReport === "mentors" && (
        <div className="report-fade-in" key="mentors">
        <SectionCard title="Mentor Performance & Tracking Report" action={<button className="export-btn-anim" style={S.exportBtn} onClick={exportMentorsReport}>Export CSV</button>}>
          {mentorsReport.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13 }}>No mentors found.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    {["Mentor", "Center", "Assigned Mentees", "PDCA Cycles", "Capstones", "Observations", "Attendance Rate"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mentorsReport.map((r, i) => (
                    <tr key={r.mentor._id} className="hover-row" style={{ borderBottom: "1px solid #f9fafb", animationDelay: `${i * 0.03}s` }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>{r.mentor.name}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{r.mentor.email}</div>
                      </td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#4b5563" }}>{r.centerName}</td>
                      <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#3b82f6" }}>{r.menteesCount}</td>
                      <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#10b981" }}>{r.pdcaCount}</td>
                      <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{r.capstoneCount}</td>
                      <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#8b5cf6" }}>{r.observationCount}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ height: 6, width: 50, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                            <div className="progress-fill-anim" style={{ height: "100%", width: `${r.attendanceRate}%`, background: r.attendanceRate >= 90 ? "#10b981" : "#f59e0b", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: r.attendanceRate >= 90 ? "#10b981" : "#d97706" }}>{r.attendanceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
        </div>
      )}
    </div>
  );
}