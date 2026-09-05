import { useState, useEffect, useMemo } from "react";
import { Logo, Toast, Badge, StatusBadge, StatCard, SectionCard, S, globalCSS, DonutChart, ActivityItem, ProgressCard, BarChart } from "../components/Shared";
import {LayoutDashboard, Users, MapPin, BookOpen, ClipboardList, TrendingUp, House, MessageSquare } from "lucide-react";
import { t } from "../services/i18n";
import { 
  getStoredSession, 
  getMyCenter, 
  getMentorMe, 
  getMentorFellows, 
  getActivities, 
  getChildren, 
  getMentorFellowsAttendance, 
  getCourseAssignments,
  getPDCACycles, 
  getCapstoneSubmissions, 
  getMenteeObservations 
} from "../services/api";
import { MentorProfileTab, MentorNotificationsTab, MentorFeedbackTab, MenteeManagementTab } from "./MentorDashboardTabs";
import MentorCurriculumTab from "./MentorCurriculumTab";
import MentorLessonPlanTab from "./MentorLessonPlanTab";
import GrowthCycleHub from "./GrowthCycleHub";
import MentorHomeVisitsTab from "./MentorHomeVisitsTab";
import { PendingApprovalsReminder } from "./PendingApprovalsReminder";
import TeacherManagementTab from "../admin/TeacherManagementTab";
import GeotagAttendance from "../pages/GeotagAttendance";
import { calculateTeacherScore } from "../admin/OverviewTab";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getMentorPhotoUrl = (user) => {
  const photo = user?.mentorProfile?.profilePhoto || user?.mentorProfile?.photo || user?.photoUrl || user?.profilePhoto;
  if (!photo) return null;
  if (typeof photo === "string") return photo.startsWith("http") ? photo : `${API_BASE_URL}${photo}`;
  const url = photo.publicUrl || photo.url || photo.path;
  return url || null;
};

/* â”€â”€ Placeholder for tabs â”€â”€ */
function UnderConstructionTab({ label = "This page", icon = "ðŸš§" }) {
  return (
    <div style={{ animation: "fadeIn 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{
        background: "white", borderRadius: 20, padding: "48px 56px",
        textAlign: "center", border: "1px dashed #fbbf24",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)", maxWidth: 460
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1917", marginBottom: 8 }}>
          {label} is under work
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
          This section is currently being built. Please check back soon!
        </div>
      </div>
    </div>
  );
}

/* OverviewTab */
function OverviewTab({ user, workingCenter }) {
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [mentorActivities, setMentorActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    let isInitialLoad = true;
    const fetchOverviewData = () => {
      Promise.all([
        getMentorFellows().catch(() => ({ fellows: [] })),
        getCourseAssignments().catch(() => ({ assignments: [] })),
        getActivities().catch(() => ({ activities: [] })),
        getChildren().catch(() => ({ children: [] })),
        getMentorFellowsAttendance().catch(() => ({ attendanceRecords: [] })),
        getPDCACycles().catch(() => ({ cycles: [] })),
        getCapstoneSubmissions().catch(() => ({ submissions: [] })),
        getMenteeObservations().catch(() => ({ observations: [] }))
      ])
        .then(([fellowsData, assignData, activData, childData, attendData, pdcaRes, capRes, obsRes]) => {
          if (ignore) return;
          setTeachers(fellowsData?.fellows || []);
          setAssignments(assignData?.assignments || []);
          setActivities(activData?.activities || []);
          setChildren(childData?.children || []);
          setAttendance(attendData?.attendanceRecords || []);
          const pdcas = pdcaRes.cycles || [];
          const caps = capRes.submissions || [];
          const obs = obsRes.observations || [];
          const merged = [
            ...pdcas.map(p => ({ id: "pdca_" + p._id, title: `Completed PDCA Cycle (Mentee: ${p.menteeId?.name || "Fellow"})`, date: new Date(p.createdAt || p.date), type: "pdca" })),
            ...caps.map(c => ({ id: "cap_" + c._id, title: `Submitted Capstone Milestone ${c.milestone}`, date: new Date(c.createdAt || c.submittedAt), type: "capstone" })),
            ...obs.map(m => ({ id: "obs_" + m._id, title: `Logged an Observation (Mentee: ${m.menteeId?.name || "Fellow"})`, date: new Date(m.createdAt || m.date), type: "observation" }))
          ].sort((a, b) => b.date - a.date).slice(0, 10);
          setMentorActivities(merged);
        })
        .catch(err => { if (!ignore && isInitialLoad) setError(err.message); })
        .finally(() => { if (!ignore && isInitialLoad) setLoading(false); isInitialLoad = false; });
    };
    fetchOverviewData();
    const interval = setInterval(fetchOverviewData, 8000);
    return () => { ignore = true; clearInterval(interval); };
  }, [user]);

  const myTeachers = useMemo(() =>
    teachers.filter(t => String(t.assignedMentor?._id || t.assignedMentor) === String(user._id || user.id)),
    [teachers, user]);

  const stats = useMemo(() => {
    const uniqueCenters = new Set(myTeachers.map(t => t.teacherProfile?.center?._id || t.teacherProfile?.center).filter(Boolean));
    const uniqueCourses = new Set(assignments.map(a => a.course?._id || a.course).filter(Boolean));
    return {
      totalAssigned: myTeachers.length,
      totalCenters: uniqueCenters.size,
      totalChildren: children.length,
      totalCourses: uniqueCourses.size,
    };
  }, [myTeachers, assignments, children]);

  const attendanceToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayRecs = attendance.filter(r => new Date(r.attendanceDate).toDateString() === todayStr);
    return {
      present: todayRecs.filter(r => r.status === "present").length,
      absent:  todayRecs.filter(r => r.status === "absent").length,
      late:    todayRecs.filter(r => r.status === "late").length,
      halfDay: todayRecs.filter(r => r.status === "half_day").length,
    };
  }, [attendance]);

  const completionStats = useMemo(() => ({
    completed:  assignments.filter(a => ["completed","approved","reviewed"].includes(a.status)).length,
    inProgress: assignments.filter(a => ["in_progress","submitted","under_review","revision"].includes(a.status)).length,
    notStarted: assignments.filter(a => a.status === "assigned").length,
  }), [assignments]);

  const leaderboardData = useMemo(() => {
    return myTeachers.filter(t => t.status === "approved")
      .map(t => ({ teacher: t, score: calculateTeacherScore(t, assignments, attendance) }))
      .sort((a, b) => b.score - a.score).slice(0, 5);
  }, [myTeachers, assignments, attendance]);

  const centerName = workingCenter
    ? [workingCenter.name, workingCenter.city].filter(Boolean).join(", ")
    : "Center not assigned";

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
      <div style={{ fontSize: 16, fontWeight: "bold", color: "#64748b" }}>â³ Loading Overview...</div>
    </div>
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Working Center pill */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "white", border: "1.5px solid #e2e8f0",
          borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, color: "#374151"
        }}>
          <span>Working Center: {centerName}</span>
        </div>
      </div>

      {/* 4 Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "ASSIGNED TEACHERS", val: stats.totalAssigned, accent: "#3b82f6" },
          { label: "TOTAL CENTERS",     val: stats.totalCenters,  accent: "#10b981" },
          { label: "CHILDREN ENROLLED", val: stats.totalChildren, accent: "#d97706" },
          { label: "ASSIGNED COURSES",  val: stats.totalCourses,  accent: "#8b5cf6" }
        ].map((c, i) => (
          <div key={i} style={{
            background: "white", borderRadius: 12, padding: "20px 22px",
            border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            borderTop: `3px solid ${c.accent}`, transition: "box-shadow 0.2s, transform 0.2s"
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${c.accent}30`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* 2-column main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

        {/* Platform Performance Summary */}
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 18px" }}>Platform Performance Summary</h2>
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 18 }}>
              <DonutChart value={attendanceToday.present} max={Math.max(stats.totalAssigned, 1)} color="#10b981" size={72} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Teachers Present Today</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{attendanceToday.present} of {stats.totalAssigned} teachers</div>
              </div>
            </div>
            <div style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 18 }}>
              <DonutChart value={completionStats.completed} max={Math.max(assignments.length, 1)} color="#3b82f6" size={72} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Completed Courses</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{completionStats.completed} of {assignments.length} assignments</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
            {[
              { dot: "#ef4444", label: "Late Today:",      val: attendanceToday.late },
              { dot: "#9ca3af", label: "Absent Today:",    val: attendanceToday.absent },
              { dot: "#d97706", label: "Half Day Today:",  val: attendanceToday.halfDay },
              { dot: "#10b981", label: "In Progress:",     val: completionStats.inProgress },
              { dot: "#d1d5db", label: "Not Started:",     val: completionStats.notStarted },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, display: "inline-block", flexShrink: 0 }} />
                <span>{s.label} <strong>{s.val}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Top Performing Teachers */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              Top Performing Teachers
            </h2>
            {leaderboardData.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No approved teachers yet.</div>
            ) : (
              <div>
                {leaderboardData.map(({ teacher: te, score }, i) => {
                  const rankColors = ["#d97706","#64748b","#b45309","#475569","#475569"];
                  const rankBg    = ["#fef3c7","#f1f5f9","#ffedd5","#f8fafc","#f8fafc"];
                  return (
                    <div key={te._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < leaderboardData.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: rankBg[i], color: rankColors[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{te.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: rankColors[i], flexShrink: 0, marginLeft: 6 }}>{score}%</span>
                        </div>
                        <div style={{ height: 5, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${score}%`, height: "100%", background: rankColors[i], borderRadius: 3, transition: "width 0.8s" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activities */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 14px" }}>Recent Activities</h2>
            {mentorActivities.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto" }}>
                {mentorActivities.map((act) => (
                  <ActivityItem key={act.id}
                    icon={act.type === "pdca" ? "📝" : act.type === "capstone" ? "ðŸ†" : "ðŸ‘€"}
                    text={act.title} time={act.date.toLocaleString()}
                    color={act.type === "pdca" ? "#f59e0b" : act.type === "capstone" ? "#3b82f6" : "#8b5cf6"}
                  />
                ))}
              </div>
            ) : (
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "18px 16px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>
                No recent activity.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Sidebar Avatar  */
function SidebarAvatar({ user, size = 34 }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getMentorPhotoUrl(user);
  if (!photoUrl || imgError) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.42), fontWeight: 800, color: "white", flexShrink: 0 }}>
        {user?.name?.[0] || "?"}
      </div>
    );
  }
  return (
    <div style={{ flexShrink: 0 }}>
      <img src={photoUrl} alt={user?.name} onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }} />
    </div>
  );
}

/* Main MentorDashboard Export */
export default function MentorDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [workingCenter, setWorkingCenter] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "" });
  // ADDED: live pending-fellow-approvals count, fed by the reminder poller below.
  // Used to show a badge on the "Teacher Mgmt." nav item.
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  
  useEffect(() => {
    getMyCenter().then(res => { if (res.center) setWorkingCenter(res.center); })
      .catch(err => console.error("Failed to load working center", err));
    // start dnyaneshwari thorat
    const fetchMentorMe = () => {
      getMentorMe().then(res => { if (res.mentor) setCurrentUser(res.mentor); })
        .catch(err => console.error("Failed to load mentor profile", err));
    };
    fetchMentorMe();
    const interval = setInterval(fetchMentorMe, 8000); // 8-second poll for near-real-time updates
    return () => clearInterval(interval);
    // end dnyaneshwari thorat
  }, []);

  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("spaceece_auth_token");
        const res = await fetch(`${API_BASE_URL}/api/notifications`, { headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) {
          setNotifications((data.notifications || []).map(n => {
            let timeVal = "Just now";
            if (n.createdAt) {
              const diffMs = new Date() - new Date(n.createdAt);
              const diffMins = Math.floor(diffMs / 60000);
              if (diffMins < 60) timeVal = `${diffMins}m ago`;
              else {
                const diffHrs = Math.floor(diffMins / 60);
                timeVal = diffHrs < 24 ? `${diffHrs}h ago` : `${Math.floor(diffHrs / 24)}d ago`;
              }
            }
            return { id: n._id, type: n.type || "info", msg: n.body ? `${n.title}: ${n.body}` : n.title || "", title: n.title, time: timeVal, read: n.read };
          }));
        }
      } catch (error) { console.error("Failed to fetch notifications:", error); }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkNotifRead = async (id) => {
    try {
      const token = localStorage.getItem("spaceece_auth_token");
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: "PATCH", headers: { "Authorization": `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) { console.error("Failed to mark notification as read", error); }
  };

  const handleMarkAllNotifRead = async () => {
    try {
      const token = localStorage.getItem("spaceece_auth_token");
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, { method: "PATCH", headers: { "Authorization": `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) { console.error("Failed to mark all notifications as read", error); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sidebar nav items - narrow icon+label stacked layout 
  const navItems = [
    { key: "overview",      label: "Dashboard",     Icon: LayoutDashboard, color: "#3b82f6" },
    { key: "mentees",       label: "Teacher Management", Icon: Users,           color: "#22c55e", badge: pendingApprovalsCount },
    { key: "my_attendance", label: "My Attendance",     Icon: MapPin,          color: "#06b6d4" },
    { key: "curriculum",    label: "Curriculum",    Icon: BookOpen,        color: "#14b8a6" },
    { key: "lesson_plans",  label: "Lesson Plans",  Icon: ClipboardList,   color: "#f59e0b" },
    { key: "documentation", label: "Growth",        Icon: TrendingUp,      color: "#6366f1" },
    { key: "home_visits",   label: "Home Visits",   Icon: House,           color: "#f43f5e" },
    { key: "feedback",      label: "Feedback",      Icon: MessageSquare,   color: "#ef4444" },
  ];

  const semester = currentUser?.mentorProfile?.fellowshipSemester || 3;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const renderContent = () => {
    switch(activeTab) {
      case "overview":      return <OverviewTab user={currentUser} workingCenter={workingCenter} />;
      case "mentees":       return <TeacherManagementTab role="mentor" user={currentUser} setToast={setToast} onUserUpdate={setCurrentUser} />;
      case "my_attendance": return <GeotagAttendance user={currentUser} />;
      case "curriculum":    return <MentorCurriculumTab user={currentUser} setToast={setToast} />;
      case "lesson_plans":  return <MentorLessonPlanTab user={currentUser} setToast={setToast} />;
      case "documentation": return <GrowthCycleHub user={currentUser} setToast={setToast} onUserUpdate={setCurrentUser} />;
      case "home_visits":   return <MentorHomeVisitsTab user={currentUser} setToast={setToast} />;
      case "notifications": return <MentorNotificationsTab notifications={notifications} onMarkRead={handleMarkNotifRead} onMarkAllRead={handleMarkAllNotifRead} />;
      case "feedback":      return <MentorFeedbackTab user={currentUser} setToast={setToast} />;
      case "profile":       return <MentorProfileTab user={currentUser} onWorkingCenterChange={setWorkingCenter} onUserUpdate={setCurrentUser} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f0f4f8", fontFamily: "'Segoe UI','Inter',-apple-system,sans-serif" }}>
      <style>{globalCSS}</style>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />
      {/* ADDED: mounted once here so it keeps polling for pending approvals no matter which tab is viewed.
          Drives in-app toast, email nudge to mentor, and nav badge via onPendingCountChange. */}
      <PendingApprovalsReminder setToast={setToast} onPendingCountChange={setPendingApprovalsCount} />
      
      {/* Narrow  Sidebar */}
      <div style={{
        width: 88, background: "#fcfcfc", display: "flex", flexDirection: "column",
        flexShrink: 0, height: "100vh", zIndex: 10, boxShadow: "3px 0 16px rgba(158, 158, 158, 0.2)"
      }}>
        {/* Logo area */}
        <div style={{ padding: "16px 0 12px", display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Logo size={68} />
          <div style={{ fontSize: 8, fontWeight: 1500, color: "rgba(0, 0, 0, 0.45)", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center", lineHeight: 1.3 }}>
            TEACHER<br/>MANAGEMENT
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {navItems.map(item => {
            const isActive = activeTab === item.key;
            const accent = item.color || "#3b82f6";
            const NavIcon = item.Icon;
            return (
              <button key={item.key} onClick={() => setActiveTab(item.key)} title={item.label}
                style={{
                  width: 72, display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "10px 4px 8px", border: "none", borderRadius: 10,
                  background: isActive ? `${accent}22` : "transparent",
                  color: isActive ? accent : "rgba(0, 0, 0, 0.7)",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s", position: "relative"
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {isActive && (
                  <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 28, borderRadius: "0 3px 3px 0", background: accent }} />
                )}
                <span style={{
                  width: 36, height: 36, borderRadius: 10, marginBottom: 4,
                  background: isActive ? accent : "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s", position: "relative",
                  color: isActive ? "white" : accent
                }}>
                  <NavIcon size={17} strokeWidth={2} />
                  {item.badge > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "white", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, border: "1.5px solid #1a1d2e" }}>
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, lineHeight: 1.2, textAlign: "center", letterSpacing: "0.2px" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Logout button */}
        <div style={{ padding: "12px 0 16px", display: "flex", justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onLogout} title="Sign Out"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: "8px 12px", borderRadius: 10, transition: "all 0.2s ease", fontFamily: "inherit" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", letterSpacing: "0.2px" }}>Logout</span>
          </button>
        </div>
      </div>

      {/* â”€â”€ Main Content Area â”€â”€ */}
      <div style={{ flex: 1, width: "0px", minWidth: "0px", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* â”€â”€ Top Header Bar â”€â”€ */}
        <div style={{
          background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 28px",
          height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
        }}>
          {/* Left: greeting + fellowship info */}
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
              Hi, {currentUser.name?.split(" ")[0] || "Mentor"}!
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              UMANG Fellowship - Semester {semester} - {today}
            </div>
          </div>

          {/* Right: notification bell + user avatar pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Bell */}
            <button onClick={() => setActiveTab("notifications")}
              style={{ position: "relative", background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#6b7280", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              title="Notifications"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", color: "white", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: "bold", border: "1.5px solid white" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* User avatar pill */}
            <div style={{ position: "relative" }}>
              <div onClick={() => setMenuOpen(!menuOpen)}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "5px 10px 5px 6px", borderRadius: 24, border: "1.5px solid #e5e7eb", background: "white", transition: "border-color 0.2s", userSelect: "none" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
              >
                <SidebarAvatar user={currentUser} size={30} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                  {currentUser.name?.split(" ")[0] || "Mentor"}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              {menuOpen && (
                <div style={{ position: "absolute", top: 46, right: 0, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 190, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <button onClick={() => { setActiveTab("notifications"); setMenuOpen(false); }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", border: "none", background: "white", textAlign: "left", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: 13, fontWeight: 600, color: "#374151", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: "#fef3c7" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      </div>
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && <span style={{ background: "#ef4444", color: "white", borderRadius: 10, padding: "2px 7px", fontSize: 10, fontWeight: "bold" }}>{unreadCount} New</span>}
                  </button>
                  <button onClick={() => { setActiveTab("profile"); setMenuOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "white", textAlign: "left", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: 13, fontWeight: 600, color: "#374151", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: "#e0e7ff" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <span>Profile</span>
                  </button>
                  <button onClick={onLogout}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "white", textAlign: "left", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: "#fee2e2" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </div>
                    <span style={{ color: "#dc2626", fontWeight: 700 }}>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
