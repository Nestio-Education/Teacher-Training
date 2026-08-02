import { useState, useEffect } from "react";
import { Logo, Toast, globalCSS } from "../components/Shared";
import { t, getCurrentLanguageCode, LANG_CHANGE_EVENT } from "../services/i18n";
import OverviewTab from "../admin/OverviewTab";
import CenterManagementTab from "../admin/CenterManagementTab";
import CurriculumTrainingTab from "../admin/CurriculumTrainingTab";
import ActivityMonitoringTab from "../admin/ActivityMonitoringTab";
import ChildrenManagementTab from "../admin/ChildrenManagement";
import AssignmentReviewTab from "../admin/AssignmentReviewTab";
import AttendanceTab from "../admin/AttendanceTab";
import ReportsTab from "../admin/ReportsTab";
import NotificationsTab from "../admin/NotificationsTab";
import SettingsTab from "../admin/SettingsTab";
import FeedbackManagementTab from "../admin/FeedbackManagementTab";
import LessonPlannerTab from "./LessonPlannerTab";
import ChildFeedbackTab from "../admin/ChildFeedbackTab";
// Start: Snehal change
import ParentModulesManagementTab from "../admin/ParentModulesManagementTab";
// End: Snehal change
import AdminUserGuide from "./adminuserguide";
import MentorManagementTab from "../mentor/MentorManagementTab";
//import ScheduleManagementTab from "../admin/ScheduleManagementTab";
//import CertificateManagementTab from "../admin/CertificateManagementTab";
//import AutomationTab from "../admin/AutomationTab";
//import SystemHealthTab from "../admin/SystemHealthTab";
//import AdminProfileTab from "../admin/AdminProfileTab";
//import HelpFAQTab from "../admin/HelpFAQTab";
import { getAdminTeachers, getCourseAssignments, getCourses, updateTeacherStatus } from "../services/api";
//import CourseManagementTab from "../admin/CourseManagementTab";
//import BatchManagementTab from "../admin/BatchManagementTab";
//import AssessmentManagementTab from "../admin/AssessmentManagementTab";
//import CertificateManagementTab from "../admin/CertificateManagementTab";
//import LiveSessionsTab from "../admin/LiveSessionsTab";


/* ===========================================
   MAIN ADMIN DASHBOARD
=========================================== */
export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [teachers,  setTeachers]  = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments,setAssignments] = useState([]);
  const [toast, setToast] = useState({msg:"",type:""});
  const [menuOpen, setMenuOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const pending = teachers.filter(t=>t.status==="pending");
  const mapCourseAssignmentForReview = (assignment) => {
    const course = assignment.course || {};
    const teacher = assignment.teacher || {};
    const statusMap = {
      assigned: "pending",
      in_progress: "under review",
      completed: "reviewed",
      submitted: "submitted",
      reviewed: "reviewed",
      approved: "approved",
      revision: "revision",
    };
    const rubric = assignment.rubric?.length ? assignment.rubric : [
      { criterion: "Content accuracy", score: null, maxScore: 25 },
      { criterion: "Age-appropriate planning", score: null, maxScore: 25 },
      { criterion: "Presentation and clarity", score: null, maxScore: 20 },
      { criterion: "Practical classroom use", score: null, maxScore: 30 },
    ];

    return {
      id: assignment._id,
      teacher: teacher.name || "Unknown Teacher",
      teacherEmail: teacher.email || "",
      title: assignment.title || course.title || "Course Assignment",
      course: course.title || "Training Course",
      batch: assignment.batch || "DB Assignment",
      submitted: (assignment.submittedAt || assignment.completedAt) ? new Date(assignment.submittedAt || assignment.completedAt).toLocaleDateString("en-IN") : "Not submitted",
      submittedDate: assignment.submittedAt || assignment.completedAt || assignment.updatedAt || assignment.createdAt,
      status: statusMap[assignment.status] || assignment.status || "pending",
      feedback: assignment.feedback || "",
      score: assignment.score,
      rubric,
      trainer: assignment.trainer || "",
      reviewedBy: assignment.reviewedBy || "",
      reviewedAt: assignment.reviewedAt || "",
      notified: assignment.notified || false,
      annotations: assignment.annotations || [],
    };
  };

  const navItems = [
    { key:"overview",     label:t("Admin Dashboard"),          icon:"\uD83D\uDCCA" },
    { key:"centers",      label:t("Center Management"), icon:"\uD83C\uDFEB" },
    { key:"mentorMgmt",   label:t("Mentor Management"),  icon:"👨‍🏫" },
    { key: "curriculum", label:t("Course Management"), icon: "\uD83D\uDCDA" },
    // Start: Snehal change
    { key: "parentModules", label:t("Parent Capacity Building"), icon: "\uD83D\uDC6A" },
    // End: Snehal change
    { key: "activities", label:t("Activity Monitoring"), icon: "\uD83D\uDCF8" },
    { key: "children", label:t("Children & Classes"), icon: "\uD83D\uDC76" },
    { key:"attendance",   label:t("Attendance"),        icon:"\uD83D\uDCC5" },
    { key:"reports",      label:t("Reports & Analytics"),icon:"\uD83D\uDCC8" },
    { key:"feedback",     label:t("Feedback"),              icon:"\uD83D\uDCAC" },
    { key: "childfeedback", label: "Child Feedback", icon: "💬" },
  ];
  const persistTeachers = (updater) => {
  setTeachers(prev => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    next.forEach((teacher) => {
      const previous = prev.find((item) => (item._id || item.id) === (teacher._id || teacher.id));
      if (previous && previous.status !== teacher.status) {
        updateTeacherStatus(teacher._id || teacher.id, teacher.status).catch((error) => {
          setToast({ msg: error.message || "Could not update teacher status.", type: "error" });
        });
      }
    });
    return next;
  });
};


  const renderContent = () => {
    switch(activeTab) {
      case "overview":     return <OverviewTab teachers={teachers} courses={courses} batches={[]} sessions={[]}/>;
      case "centers": return <CenterManagementTab allTeachers={teachers} setToast={setToast}/>;
      case "curriculum": return <CurriculumTrainingTab setToast={setToast}/>;
      // case "assessments": return <AssessmentResultsTab setToast={setToast}/>;
      case "activities": return <ActivityMonitoringTab setToast={setToast}/>;
      case "children": return <ChildrenManagementTab setToast={setToast}/>;
      case "attendance":   return <AttendanceTab teachers={teachers} sessions={[]}/>;
      case "reports":      return <ReportsTab teachers={teachers} courses={courses} batches={[]}/>;
      case "notifications":return <NotificationsTab teachers={teachers} setToast={setToast}/>;
      case "settings":     return <SettingsTab setToast={setToast} teachers={teachers} />;
      //case "schedules":    return <ScheduleManagementTab setToast={setToast}/>;
     // case "certificates": return <CertificateManagementTab setToast={setToast}/>;
      case "feedback":     return <FeedbackManagementTab setToast={setToast}/>;
      case "mentorMgmt":   return <MentorManagementTab setToast={setToast} role="admin" />;
      // Start: Snehal change
      case "parentModules": return <ParentModulesManagementTab setToast={setToast}/>;
      // End: Snehal change
      //case "automation":   return <AutomationTab user={user} setToast={setToast}/>;
      case "childfeedback": return <ChildFeedbackTab/>;
      default:             return null;
    }
  };
  useEffect(() => {
    let ignore = false;
    let isInitialLoad = true;

    const fetchDashboardData = () => {
      Promise.all([getAdminTeachers(), getCourses({ lang: getCurrentLanguageCode() }), getCourseAssignments()])
        .then(([teacherRes, courseRes, assignmentRes]) => {
          if (ignore) return;
          setTeachers(teacherRes.teachers || []);
          setCourses(courseRes.courses || []);
          setAssignments((assignmentRes.assignments || []).map(mapCourseAssignmentForReview));
          isInitialLoad = false;
        })
        .catch((error) => {
          if (!ignore && isInitialLoad) {
            setToast({ msg: error.message || "Could not load dashboard data from MongoDB.", type: "error" });
          }
          console.error("Dashboard poll failed:", error);
        });
    };


    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    window.addEventListener(LANG_CHANGE_EVENT, fetchDashboardData);

    return () => {
      ignore = true;
      clearInterval(interval);
      window.removeEventListener(LANG_CHANGE_EVENT, fetchDashboardData);
    };
  }, []);


  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#f8fafc", fontFamily:"'Segoe UI','Inter',-apple-system,sans-serif" }}>
      <style>{globalCSS}</style>
      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:"",type:""})}/>

      {/* Sidebar */}
      <div style={{ width:250, background:"white", borderRight:"1px solid #f1f5f9", display:"flex", flexDirection:"column", flexShrink:0, boxShadow:"2px 0 12px rgba(0,0,0,0.04)", position:"relative", height:"100vh" }}>
        <div style={{ padding:"20px 16px 12px" }}>
          <Logo size={120}/>
          <div style={{ textAlign:"center", padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700,
            background:"#fef3c7", color:"#92400e", border:"1px solid #fbbf24", margin:"6px auto 0", display:"inline-block", width:"fit-content", letterSpacing:"0.3px" }}>
            🛡️ {t("Admin Panel")}
          </div>
        </div>

        <nav style={{ padding:"4px 10px", flex: 1, overflowY: "auto", marginBottom: "80px" }}>
          {navItems.map(item=>(
            <button key={item.key} onClick={()=>setActiveTab(item.key)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 12px",
                border:"none", borderRadius:10, background:activeTab===item.key?"#fef3c7":"transparent",
                color:activeTab===item.key?"#92400e":"#6b7280", fontSize:12, fontWeight:600,
                cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom:2,
                transition:"all 0.18s" }}>
              <span style={{ fontSize:15 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.badge>0 && <span style={{ background:"#ef4444", color:"white", borderRadius:20, fontSize:10, fontWeight:800, padding:"1px 7px", minWidth:18, textAlign:"center" }}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div style={{
          position: "fixed", bottom: 0, left: 0, width: 250,
          padding:"12px 16px", borderTop:"1px solid #f1f5f9",
          display:"flex", alignItems:"center", gap:10, background:"white", zIndex: 50
        }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#d97706)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"white" }}>A</div>
          <div style={{ flex:1, overflow:"hidden" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#1c1917" }}>Admin</div>
            <div style={{ fontSize:10, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email}</div>
          </div>
          <button onClick={onLogout} title={t("Sign Out")}
            style={{
              background:"transparent", border:"none", cursor:"pointer",
              fontSize:22, color:"#ef4444", padding:"8px",
              borderRadius: "8px", transition: "all 0.2s ease",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            onMouseEnter={(e)=>e.currentTarget.style.background="#fee2e2"}
            onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}
          >⏻</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex:1, padding:"28px 32px", overflowY:"auto", maxHeight:"100vh" }}>
        {/* Top bar: User Guide button + Admin 3-dot menu, top-right corner */}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginBottom:16, position:"relative" }}>
          <button
            onClick={() => setShowGuide(true)}
            title={t("User Guide")}
            style={{
              display:"flex",
              alignItems:"center",
              gap:6,
              padding:"8px 16px",
              borderRadius:10,
              border:"1px solid #fbbf24",
              background:"white",
              color:"#92400e",
              fontSize:12,
              fontWeight:700,
              fontFamily:"inherit",
              cursor:"pointer",
              transition:"all 0.18s",
              boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={(e)=>{ e.currentTarget.style.background="#fffbeb"; }}
            onMouseLeave={(e)=>{ e.currentTarget.style.background="white"; }}
          >
            <span style={{ fontSize:14, lineHeight:1 }}>📖</span>
            {t("User Guide")}
          </button>

          <div
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display:"flex", alignItems:"center", gap: 10, cursor:"pointer",
              padding:"6px 12px", borderRadius:20, background:"#fef3c7",
              boxShadow:"0 1px 3px rgba(0,0,0,0.1)", border:"1px solid #fbbf24",
              transition:"all 0.2s ease"
            }}
            onMouseEnter={(e)=>e.currentTarget.style.background="#fde68a"}
            onMouseLeave={(e)=>e.currentTarget.style.background="#fef3c7"}
          >
            <div style={{ fontSize:14, fontWeight:700, color:"#92400e" }}>Admin</div>
            <div style={{ fontSize: 18, fontWeight: 700, paddingBottom: 6, color:"#92400e" }}>⋮</div>
          </div>

          {menuOpen && (
            <div
              style={{
                position:"absolute", top:"110%", right:0, background:"white",
                borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
                border:"1px solid #f1f5f9", overflow:"hidden", minWidth:200, zIndex:60
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); setActiveTab("settings"); }}
                style={{ display:"flex", alignItems:"center", gap: 12, padding:"12px 18px", border:"none", background:"white", textAlign:"left", cursor:"pointer", width:"100%", fontSize:14, fontWeight:600, transition: "background 0.2s" }}
                onMouseEnter={(e)=>e.currentTarget.style.background="#f8fafc"}
                onMouseLeave={(e)=>e.currentTarget.style.background="white"}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "#fef3c7" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </div>
                <span style={{ color: "#374151", fontWeight: 700 }}>{t("Settings & Roles")}</span>
              </button>
              <button
                onClick={onLogout}
                style={{ display:"flex", alignItems:"center", gap: 12, padding:"12px 18px", border:"none", background:"white", textAlign:"left", cursor:"pointer", color:"#dc2626", fontSize:14, fontWeight:600, transition: "background 0.2s" }}
                onMouseEnter={(e)=>e.currentTarget.style.background="#fef2f2"}
                onMouseLeave={(e)=>e.currentTarget.style.background="white"}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "#fee2e2" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </div>
                <span style={{ color: "#dc2626", fontWeight: 700 }}>{t("Logout")}</span>
              </button>
            </div>
          )}
        </div>

        {renderContent()}
      </div>

      {showGuide && <AdminUserGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}