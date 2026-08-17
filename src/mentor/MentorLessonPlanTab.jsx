// Force Vite HMR reload
import { useState, useEffect, useMemo } from "react";
import { Modal, S, SearchBar, StatCard, StatusBadge, Toast } from "../components/Shared";
import { t, getCurrentLanguageCode } from "../services/i18n";
import {
  getLessonPlans, getCenters, getClasses,
  mentorImportLessonExcel, mentorAutoPublishLessonPlan, mentorAssignLessonPlan,
  getMentorLessonAssignments, updateMentorLessonAssignment,
  getMentorLessonReports, reviewMentorLessonReport,
  getMentorFellows, deleteMentorLessonPlan, generateAIActivitySchedule
} from "../services/api";
import ACTIVITY_BANK from "../data/activityBank";
import ACADEMIC_ACTIVITY_BANK from "../data/academicActivityBank";

/* ── Activity Bank helpers (dataset-driven topics) ── */
const getActivityTypes = () => [...new Set(ACTIVITY_BANK.map(a => a.type))].sort();

const getActivityLevels = (type) =>
  [...new Set(ACTIVITY_BANK.filter(a => !type || a.type === type).map(a => a.level))]
    .sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")));

const getActivityTopics = (type, level) => {
  const seen = new Set();
  const topics = [];
  ACTIVITY_BANK.forEach(a => {
    if (type && a.type !== type) return;
    if (level && a.level !== level) return;
    if (!seen.has(a.activity)) {
      seen.add(a.activity);
      topics.push(a.activity);
    }
  });
  return topics.sort();
};

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Academic Activity Bank helpers ── */
const getAcademicCategories = () => [...new Set(ACADEMIC_ACTIVITY_BANK.map(a => a.category))].sort();

const getAcademicSubjects = (category) =>
  [...new Set(ACADEMIC_ACTIVITY_BANK.filter(a => !category || a.category === category).map(a => a.subject))];

const getAcademicStartMonths = (category, subject) =>
  [...new Set(
    ACADEMIC_ACTIVITY_BANK
      .filter(a => (!category || a.category === category) && (!subject || a.subject === subject))
      .map(a => a.month)
  )].sort((a, b) => a - b);

const getAcademicPoolFromMonth = ({ category, subject, startMonth }) =>
  ACADEMIC_ACTIVITY_BANK
    .filter(a => a.category === category && a.subject === subject && a.month >= startMonth)
    .sort((a, b) => a.month - b.month || a.set - b.set || a.activityNumber - b.activityNumber);

const generateAcademicScheduleFromDataset = ({ category, subject, startMonth, startDate, durationWeeks, maxActivitiesPerDay }) => {
  const pool = getAcademicPoolFromMonth({ category, subject, startMonth });
  if (pool.length === 0) return { error: "No content found for that Category/Subject/Start Month." };

  const buckets = [];
  const seen = new Set();
  pool.forEach(a => {
    const key = `${a.month}-${a.set}`;
    if (!seen.has(key)) {
      seen.add(key);
      buckets.push({ month: a.month, set: a.set, items: [] });
    }
    buckets.find(b => b.month === a.month && b.set === a.set).items.push(a);
  });

  if (durationWeeks > buckets.length) {
    return {
      error: `Only ${buckets.length} week(s) of ${category} ${subject} content available starting from Month ${startMonth}. Reduce the duration or choose an earlier start month / different subject.`,
    };
  }

  const weeks = [];
  let cur = new Date(startDate);
  for (let w = 0; w < durationWeeks; w++) {
    const weekDays = [];
    while (weekDays.length < 5) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) weekDays.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(weekDays);
  }

  const schedule = [];
  weeks.forEach((weekDays, weekIndex) => {
    const items = buckets[weekIndex].items;
    let cursor = 0;
    weekDays.forEach(d => {
      const activities = [];
      for (let i = 0; i < maxActivitiesPerDay; i++) {
        const a = items[cursor % items.length];
        cursor++;
        activities.push({
          order: i + 1,
          contentTitle: a.keyConcept,
          moduleTitle: `Month ${a.month} · Set ${a.set}`,
          contentType: a.format || a.subject,
          durationMinutes: 30,
          materials: "",
          purpose: a.keyConcept,
          howToConduct: a.content,
          facilitatorRole: "",
          expectedOutcomes: "",
          instructions: a.content,
          objectives: a.keyConcept,
        });
      }
      schedule.push({ date: d.toISOString().split("T")[0], dayOfWeek: WEEKDAY_NAMES[d.getDay()], activities });
    });
  });

  const totalActivities = schedule.reduce((sum, day) => sum + day.activities.length, 0);
  const endMonth = buckets[buckets.length - 1].month;
  const title = startMonth === endMonth
    ? `${category} · ${subject} · Month ${startMonth}`
    : `${category} · ${subject} · Months ${startMonth}–${endMonth}`;

  return { course: { title }, totalActivities, totalDays: schedule.length, durationWeeks, schedule };
};

const generateScheduleFromDataset = ({ type, level, topic, startDate, durationWeeks, maxActivitiesPerDay }) => {
  const pool = ACTIVITY_BANK.filter(a => a.type === type && a.level === level);
  if (pool.length === 0) return null;

  const chosen = pool.filter(a => a.activity === topic);
  const restSeen = new Set(chosen.map(a => a.activity));
  const rest = [];
  pool.forEach(a => {
    if (!restSeen.has(a.activity)) { restSeen.add(a.activity); rest.push(a); }
  });
  const orderedPool = [...chosen, ...rest];

  const days = [];
  const cur = new Date(startDate);
  const totalWorkingDays = durationWeeks * 5;
  while (days.length < totalWorkingDays) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  let cursor = 0;
  const schedule = days.map(d => {
    const activities = [];
    for (let i = 0; i < maxActivitiesPerDay; i++) {
      const a = orderedPool[cursor % orderedPool.length];
      cursor++;
      activities.push({
        order: i + 1,
        contentTitle: a.activity,
        moduleTitle: `${a.type} · ${a.level}`,
        contentType: a.duration,
        durationMinutes: a.durationMinutes,
        materials: a.materials,
        purpose: a.purpose,
        howToConduct: a.howToConduct,
        facilitatorRole: a.facilitatorRole,
        expectedOutcomes: a.expectedOutcomes,
        instructions: `How to conduct:\n${a.howToConduct}\n\nFacilitator role: ${a.facilitatorRole}`,
        objectives: a.expectedOutcomes || a.purpose,
      });
    }
    return {
      date: d.toISOString().split("T")[0],
      dayOfWeek: WEEKDAY_NAMES[d.getDay()],
      activities,
    };
  });

  const totalActivities = schedule.reduce((sum, d) => sum + d.activities.length, 0);
  return {
    course: { title: topic },
    totalActivities,
    totalDays: schedule.length,
    durationWeeks,
    schedule,
  };
};

/* ── Styles ── */
const tabBtnStyle = (active) => ({
  padding: "10px 20px", border: "none", borderRadius: "10px 10px 0 0",
  background: active ? "#1e40af" : "#e2e8f0", color: active ? "#fff" : "#475569",
  fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
  fontFamily: "inherit",
});

const cardStyle = {
  background: "#fff", borderRadius: 14, padding: 20,
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  marginBottom: 16,
};

const btnPrimary = {
  padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none",
  borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
};

const btnSecondary = {
  padding: "10px 20px", background: "#e2e8f0", color: "#1e293b", border: "none",
  borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
};

const selectStyle = {
  padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
  fontSize: 13, fontFamily: "inherit", background: "#fff",
  width: "100%", boxSizing: "border-box"
};

/* ── Main Component ── */
export default function MentorLessonPlanTab({ user, setToast }) {
  const [activeTab, setActiveTab] = useState("plans");
  const [plans, setPlans] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [reports, setReports] = useState([]);
  const [centers, setCenters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [fellows, setFellows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Import modal
  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Auto-publish modal
  const [autoModal, setAutoModal] = useState(false);
  const [autoMode, setAutoMode] = useState("bank"); // "bank" or "ai"
  const [generating, setGenerating] = useState(false);
  const [autoForm, setAutoForm] = useState({
    type: "", level: "", topic: "", startDate: new Date().toISOString().split("T")[0],
    durationWeeks: 2, maxActivitiesPerDay: 2, centerId: "", classId: "", title: "",
    category: "", subject: "", startMonth: "",
    teacherId: "", gradeBand: "",
  });
  const [preview, setPreview] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [targetMode, setTargetMode] = useState("fellow"); // "fellow" or "center"



  // Clear preview if form changes so they can generate again
  useEffect(() => {
    setPreview(null);
  }, [autoForm, autoMode]);

  // Assign modal
  const [assignModal, setAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ planIds: [], teacherId: "", centerId: "", classId: "", gradeBand: "" });
  const [assigning, setAssigning] = useState(false);

  // Derive mentor's own centers from the already-loaded fellows array (not from the global centers state)
  const myCenters = useMemo(() => {
    const seen = new Map();
    fellows.forEach(f => {
      const c = f.teacherProfile?.center;
      if (c && c._id && !seen.has(String(c._id))) seen.set(String(c._id), c);
    });
    return [...seen.values()];
  }, [fellows]);

  const selectedCenter = myCenters.find(c => String(c._id) === String(assignForm.centerId)) || null;
  const fellowsAtCenter = assignForm.centerId
    ? fellows.filter(f => String(f.teacherProfile?.center?._id) === String(assignForm.centerId))
    : [];

  // Derive auto-publish fellow's center (reuses myCenters from the assign modal)
  const autoSelectedFellow = fellows.find(f => String(f._id) === String(autoForm.teacherId)) || null;
  const autoSelectedCenter = autoSelectedFellow?.teacherProfile?.center
    ? myCenters.find(c => String(c._id) === String(autoSelectedFellow.teacherProfile.center._id))
    : null;

  // Review modal
  const [reviewModal, setReviewModal] = useState(null); // assignment or report object
  const [reviewType, setReviewType] = useState("assignment"); // "assignment" or "report"
  const [reviewFeedback, setReviewFeedback] = useState("");

  const showToast = setToast || (() => { });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getLessonPlans({ lang: getCurrentLanguageCode() }),
      getMentorLessonAssignments(),
      getMentorLessonReports(),
      getCenters(),
      getClasses(),
      getMentorFellows(),
    ]).then(([plansRes, assnsRes, reportsRes, centersRes, classesRes, fellowsRes]) => {
      setPlans(plansRes.lessonPlans || []);
      setAssignments(assnsRes.assignments || []);
      setReports(reportsRes.reports || []);
      setCenters(centersRes.centers || []);
      setClasses(classesRes.classes || []);
      setFellows(fellowsRes.fellows || []);
      setLoading(false);
    }).catch(err => {
      console.error("Error loading lesson plan data:", err);
      setLoading(false);
      showToast({ msg: "Failed to load lesson plan data.", type: "error" });
    });
  };

  useEffect(() => { loadData(); }, []);

  // My plans = plans where createdBy matches current user
  const myPlans = useMemo(() => plans.filter(p => {
    const createdById = p.createdBy?._id || p.createdBy;
    return String(createdById) === String(user?._id || user?.id);
  }), [plans, user]);

  const filteredPlans = myPlans.filter(p => {
    const q = search.toLowerCase();
    return (p.title || "").toLowerCase().includes(q) || (p.objectives || "").toLowerCase().includes(q);
  });

  // ── Import Excel ──
  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await mentorImportLessonExcel(formData);
      setImportResult(res);
      showToast({ msg: res.message || "Import complete!", type: "success" });
      loadData();
    } catch (err) {
      showToast({ msg: err.message || "Import failed.", type: "error" });
    } finally {
      setImporting(false);
    }
  };

  // ── Auto-Publish ──
  const handleGenerate = async () => {
    if (autoMode === "academic") {
      const sched = generateAcademicScheduleFromDataset(autoForm);
      if (sched?.error) {
        showToast({ msg: sched.error, type: "error" });
        return;
      }
      setPreview(sched);
    } else if (autoMode === "bank") {
      const sched = generateScheduleFromDataset(autoForm);
      if (!sched) {
        showToast({ msg: "No activities found for this combination.", type: "error" });
        return;
      }
      setPreview(sched);
    } else {
      setGenerating(true);
      try {
        const sched = await generateAIActivitySchedule(autoForm);
        setPreview(sched);
      } catch (err) {
        showToast({ msg: err.message || "AI generation failed.", type: "error" });
      } finally {
        setGenerating(false);
      }
    }
  };

  const handlePublish = async () => {
    if (!preview) return;

    const targetTitle = autoMode === "academic"
      ? `${autoForm.category}-${autoForm.subject} (${autoForm.startMonth})`
      : autoMode === "bank"
        ? `${autoForm.type} · ${autoForm.level} — ${autoForm.topic}`
        : preview.course?.title || "AI Lesson Plan";
    const titleExists = plans.some(p => (p.title || "").split(" — ")[0] === targetTitle);
    if (titleExists) {
      showToast({ msg: "You already have a lesson plan group with this title. Please change the topic or category to create a unique plan.", type: "error" });
      return;
    }

    if (targetMode === "fellow") {
      if (!autoForm.teacherId) {
        showToast({ msg: "Please select a fellow to assign this to.", type: "error" });
        return;
      }
      if (autoSelectedCenter?.type === "school" && !autoForm.gradeBand) {
        showToast({ msg: "Please select a grade band for this fellow's school.", type: "error" });
        return;
      }
    }
    setPublishing(true);
    try {
      const res = await mentorAutoPublishLessonPlan({
        schedule: preview.schedule,
        title: autoMode === "academic"
          ? `${autoForm.category}-${autoForm.subject} (${autoForm.startMonth})`
          : autoMode === "bank"
            ? `${autoForm.type} · ${autoForm.level} — ${autoForm.topic}`
            : preview.course?.title || "AI Lesson Plan",
        teacherId: targetMode === "fellow" ? autoForm.teacherId : undefined,
        gradeBand: targetMode === "fellow" ? (autoForm.gradeBand || undefined) : undefined,
        centerId: targetMode === "center" ? (autoForm.centerId || undefined) : undefined,
        classId: targetMode === "center" ? (autoForm.classId || undefined) : undefined,
      });
      showToast({ msg: res.message || "Published!", type: "success" });
      setAutoModal(false);
      setPreview(null);
      loadData();
    } catch (err) {
      showToast({ msg: err.message || "Publish failed.", type: "error" });
    } finally {
      setPublishing(false);
    }
  };

  // ── Assign ──
  const handleAssign = async () => {
    if (!assignForm.planIds || assignForm.planIds.length === 0 || !assignForm.teacherId) {
      showToast({ msg: "Please select a lesson plan and a fellow.", type: "error" });
      return;
    }
    if (selectedCenter?.type === "school" && !assignForm.gradeBand) {
      showToast({ msg: "Please select a grade band for this school.", type: "error" });
      return;
    }
    setAssigning(true);
    try {
      let assignedCount = 0;
      for (const planId of assignForm.planIds) {
        await mentorAssignLessonPlan({ ...assignForm, lessonPlanId: planId, gradeBand: assignForm.gradeBand || undefined });
        assignedCount++;
      }
      showToast({ msg: `Assigned ${assignedCount} lesson plans!`, type: "success" });
      setAssignForm({ planIds: [], teacherId: "", centerId: "", classId: "", gradeBand: "" });
      setAssignModal(false);
      loadData();
    } catch (err) {
      showToast({ msg: err.message || "Assignment failed for some plans.", type: "error" });
    } finally {
      setAssigning(false);
    }
  };

  // ── Review assignment or report ──
  const handleReview = async (status) => {
    if (!reviewModal) return;
    try {
      if (reviewType === "assignment") {
        await updateMentorLessonAssignment(reviewModal._id, { status, adminFeedback: reviewFeedback });
      } else {
        await reviewMentorLessonReport(reviewModal._id, { status, adminFeedback: reviewFeedback });
      }
      showToast({ msg: `Marked as ${status}!`, type: "success" });
      setReviewModal(null);
      setReviewFeedback("");
      loadData();
    } catch (err) {
      showToast({ msg: err.message || "Review failed.", type: "error" });
    }
  };

  const [deletingGroupTitle, setDeletingGroupTitle] = useState(null);

  const handleDeleteGroup = async (groupTitle, planIds) => {
    if (!window.confirm(`Are you sure you want to delete all ${planIds.length} plans in the "${groupTitle}" group and their assignments?`)) return;
    setDeletingGroupTitle(groupTitle);
    try {
      // Delete all plans in the group sequentially
      for (const id of planIds) {
        await deleteMentorLessonPlan(id);
      }
      showToast({ msg: `Deleted ${planIds.length} plans.`, type: "success" });
      loadData();
    } catch (err) {
      showToast({ msg: err.message || "Failed to delete some plans.", type: "error" });
      loadData(); // reload whatever is left
    } finally {
      setDeletingGroupTitle(null);
    }
  };

  const groupedPlans = useMemo(() => {
    const groups = {};
    filteredPlans.forEach(p => {
      const baseTitle = (p.title || "").split(" — ")[0];
      if (!groups[baseTitle]) {
        groups[baseTitle] = {
          baseTitle,
          planIds: [],
          earliestDate: null,
          latestDate: null,
          objectives: p.objectives ? [p.objectives] : [],
          id: p._id, // use first plan's ID as a React key
        };
      } else {
        if (p.objectives && !groups[baseTitle].objectives.includes(p.objectives)) {
          groups[baseTitle].objectives.push(p.objectives);
        }
      }
      groups[baseTitle].planIds.push(p._id);
      
      if (p.scheduleDate) {
        const d = new Date(p.scheduleDate);
        if (!groups[baseTitle].earliestDate || d < groups[baseTitle].earliestDate) groups[baseTitle].earliestDate = d;
        if (!groups[baseTitle].latestDate || d > groups[baseTitle].latestDate) groups[baseTitle].latestDate = d;
      }
    });

    // Resolve assigned names for each group and return as an array
    return Object.values(groups).map(g => {
      const groupAssignments = assignments.filter(a => g.planIds.includes(String(a.lessonPlan?._id || a.lessonPlan)));
      const assignedNames = [...new Set(groupAssignments.map(a => a.teacher?.name).filter(Boolean))];
      return { ...g, assignedNames };
    }).sort((a, b) => {
      // Sort by earliestDate descending (newest groups first)
      if (a.earliestDate && b.earliestDate) return b.earliestDate - a.earliestDate;
      return 0;
    });
  }, [filteredPlans, assignments]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: "pulse 1.5s infinite" }}>📋</div>
          <div style={{ color: "#6b7280", fontSize: 14 }}>Loading lesson plans…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease", padding: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1c1917", margin: 0 }}>📋 Lesson Plan Management</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btnPrimary} onClick={() => setImportModal(true)}>📥 Import Excel</button>
          <button style={{ ...btnPrimary, background: "#059669" }} onClick={() => setAutoModal(true)}>⚡ Auto-Generate & Publish</button>
          <button style={btnSecondary} onClick={() => setAssignModal(true)}>📌 Assign Plan</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="My Plans" value={myPlans.length} icon="📋" color="#3b82f6" />
        <StatCard label="Assignments" value={assignments.length} icon="📌" color="#8b5cf6" />
        <StatCard label="Completed" value={assignments.filter(a => a.status === "completed" || a.status === "reviewed").length} icon="✅" color="#10b981" />
        <StatCard label="Pending Review" value={reports.filter(r => r.status === "pending").length} icon="⏳" color="#f59e0b" />
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e2e8f0", marginBottom: 16 }}>
        {[
          { key: "plans", label: "My Plans" },
          { key: "assignments", label: "Assignments" },
          { key: "reports", label: "Completion Reports" },
        ].map(tab => (
          <button key={tab.key} style={tabBtnStyle(activeTab === tab.key)} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...S.input, maxWidth: 360 }}
        />
      </div>

      {/* Content */}
      {activeTab === "plans" && (
        <div>
          {groupedPlans.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", color: "#94a3b8", padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              No lesson plans yet. Import from Excel or auto-generate to get started.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {groupedPlans.map(g => (
                <div key={g.id} style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
                  borderLeft: "6px solid #1e40af",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12
                }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#1c1917", lineHeight: 1.3 }}>{g.baseTitle}</div>
                    </div>
                    {g.earliestDate && (
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>📅</span> 
                        {new Date(g.earliestDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                        {g.latestDate && g.latestDate.getTime() !== g.earliestDate.getTime() && (
                          <> — {new Date(g.latestDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}</>
                        )}
                        <span style={{ marginLeft: 6, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          {g.planIds.length} Days
                        </span>
                      </div>
                    )}
                    {g.objectives && g.objectives.length > 0 && (
                      <ul style={{ 
                        fontSize: 12, 
                        color: "#64748b", 
                        margin: "10px 0 0 0", 
                        paddingLeft: 18, 
                        lineHeight: 1.5,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        columnGap: "12px",
                        rowGap: "2px"
                      }}>
                        {g.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                      </ul>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
                    {g.assignedNames.length > 0 && (
                      <div style={{ fontSize: 12, color: "#059669", background: "#ecfdf5", padding: "6px 10px", borderRadius: 6, border: "1px solid #d1fae5" }}>
                        <strong>👥 Assigned to:</strong> {g.assignedNames.join(", ")}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        style={{ flex: 1, padding: "8px 0", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#475569", cursor: deletingGroupTitle === g.baseTitle ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
                        onClick={() => handleDeleteGroup(g.baseTitle, g.planIds)}
                        disabled={deletingGroupTitle === g.baseTitle}
                        onMouseOver={e => !deletingGroupTitle && (e.currentTarget.style.background = "#f8fafc")}
                        onMouseOut={e => !deletingGroupTitle && (e.currentTarget.style.background = "#fff")}
                      >
                        {deletingGroupTitle === g.baseTitle ? "Deleting…" : "🗑️ Delete"}
                      </button>
                      <button
                        style={{ flex: 1, padding: "8px 0", background: "#1e40af", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
                        onClick={() => {
                          setAssignForm(prev => ({ ...prev, planIds: g.planIds, centerId: "", teacherId: "", gradeBand: "" }));
                          setAssignModal(true);
                        }}
                        onMouseOver={e => e.currentTarget.style.background = "#1e3a8a"}
                        onMouseOut={e => e.currentTarget.style.background = "#1e40af"}
                      >📌 Assign</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "assignments" && (
        <div>
          {assignments.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", color: "#94a3b8", padding: 40 }}>
              No assignments yet.
            </div>
          ) : (
            assignments.filter(a => {
              const q = search.toLowerCase();
              const name = a.teacher?.name || "";
              const title = a.lessonPlan?.title || "";
              return name.toLowerCase().includes(q) || title.toLowerCase().includes(q);
            }).map(a => (
              <div key={a._id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.lessonPlan?.title || "Untitled"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      👤 {a.teacher?.name || "—"} · {a.center?.name || "—"} · {a.class?.name || "—"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      📅 Assigned: {a.assignedDate ? new Date(a.assignedDate).toLocaleDateString("en-IN") : "—"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusBadge status={a.status} />
                    {(a.status === "completed" || a.status === "pending") && (
                      <button
                        style={{ ...btnPrimary, fontSize: 11, padding: "6px 14px" }}
                        onClick={() => { setReviewModal(a); setReviewType("assignment"); setReviewFeedback(a.adminFeedback || ""); }}
                      >Review</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div>
          {reports.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", color: "#94a3b8", padding: 40 }}>
              No completion reports yet.
            </div>
          ) : (
            reports.filter(r => {
              const q = search.toLowerCase();
              const name = r.teacher?.name || "";
              return name.toLowerCase().includes(q);
            }).map(r => (
              <div key={r._id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {r.assignment?.lessonPlan?.title || "Untitled"} — Report
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      👤 {r.teacher?.name || "—"}
                    </div>
                    {r.teachingNotes && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        📝 {r.teachingNotes.substring(0, 150)}{r.teachingNotes.length > 150 ? "…" : ""}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusBadge status={r.status} />
                    {r.status === "pending" && (
                      <button
                        style={{ ...btnPrimary, fontSize: 11, padding: "6px 14px" }}
                        onClick={() => { setReviewModal(r); setReviewType("report"); setReviewFeedback(r.adminFeedback || ""); }}
                      >Review</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Import Excel Modal ── */}
      {importModal && (
        <Modal onClose={() => { setImportModal(false); setImportFile(null); setImportResult(null); }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 800 }}>📥 Import Lesson Plans from Excel</h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            Upload an Excel file with columns: <strong>Title</strong>, Centre, Objectives, Instructions, Activities, Resources, Date, Week.
            Rows for centres outside your scope will be skipped.
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={e => setImportFile(e.target.files[0])}
            style={{ marginBottom: 16 }}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={btnSecondary} onClick={() => { setImportModal(false); setImportFile(null); setImportResult(null); }}>Cancel</button>
            <button style={btnPrimary} onClick={handleImport} disabled={!importFile || importing}>
              {importing ? "Importing…" : "Import"}
            </button>
          </div>
          {importResult && (
            <div style={{ marginTop: 16, padding: 14, background: "#f0fdf4", borderRadius: 10, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: "#166534" }}>✅ {importResult.message}</div>
              {importResult.skippedRows?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 600, color: "#b45309", marginBottom: 4 }}>⚠️ Skipped rows:</div>
                  {importResult.skippedRows.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#6b7280" }}>
                      Row {s.row}: {s.reason}{s.centreName ? ` (${s.centreName})` : ""}{s.title ? ` — "${s.title}"` : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ── Auto-Publish Modal ── */}
      {autoModal && (
        <Modal width={750} onClose={() => { setAutoModal(false); setPreview(null); }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 800 }}>⚡ Auto-Generate & Publish</h3>

          {/* ── Target mode toggle ── */}
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="radio" name="targetMode" checked={targetMode === "fellow"} onChange={() => { setTargetMode("fellow"); setAutoForm(p => ({ ...p, centerId: "", classId: "" })); }} />
              <strong>Single Fellow</strong>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="radio" name="targetMode" checked={targetMode === "center"} onChange={() => { setTargetMode("center"); setAutoForm(p => ({ ...p, teacherId: "", gradeBand: "" })); }} />
              <strong>Whole Center</strong> <span style={{ fontSize: 11, color: "#64748b" }}>(broadcast)</span>
            </label>
          </div>

          {targetMode === "fellow" ? (
            <div style={{ display: "grid", gridTemplateColumns: autoSelectedCenter?.type === "school" ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Fellow / Teacher</label>
                <select style={selectStyle} value={autoForm.teacherId} onChange={e => setAutoForm(p => ({ ...p, teacherId: e.target.value, gradeBand: "" }))}>
                  <option value="">Select fellow…</option>
                  {fellows.map(f => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
                </select>
                {autoSelectedCenter && (
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    📍 {autoSelectedCenter.name} — {autoSelectedCenter.type === "school" ? "School" : "Preschool"}
                  </div>
                )}
              </div>
              {autoSelectedCenter?.type === "school" && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Grade Band</label>
                  <select style={selectStyle} value={autoForm.gradeBand} onChange={e => setAutoForm(p => ({ ...p, gradeBand: e.target.value }))}>
                    <option value="">Select grade band…</option>
                    {(autoSelectedCenter.gradeBands || []).map(band => (
                      <option key={band} value={band}>{band === "1-9" ? "1-9 (combined)" : band}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Center (optional)</label>
                <select style={selectStyle} value={autoForm.centerId} onChange={e => setAutoForm(p => ({ ...p, centerId: e.target.value }))}>
                  <option value="">All centers…</option>
                  {myCenters.map(c => <option key={c._id} value={c._id}>{c.name} ({c.type === "school" ? "School" : "Preschool"})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Class (optional)</label>
                <select style={selectStyle} value={autoForm.classId} onChange={e => setAutoForm(p => ({ ...p, classId: e.target.value }))}>
                  <option value="">All classes…</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1", fontSize: 11, color: "#dc2626" }}>
                ⚠️ This will assign the generated plan to every fellow matching the filter above (or every one of your fellows, if left blank).
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="radio" name="autoMode" checked={autoMode === "ai"} onChange={() => setAutoMode("ai")} />
              <strong>AI Generate</strong> (Groq)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="radio" name="autoMode" checked={autoMode === "bank"} onChange={() => setAutoMode("bank")} />
              <strong>From Activity Bank</strong> (Curated List)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="radio" name="autoMode" checked={autoMode === "academic"} onChange={() => setAutoMode("academic")} />
              <strong>Academic Bank</strong> (FLN/Content)
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {autoMode === "academic" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Category</label>
                    <select style={selectStyle} value={autoForm.category} onChange={e => setAutoForm(p => ({ ...p, category: e.target.value, subject: "", startMonth: "" }))}>
                      <option value="">Select category…</option>
                      {getAcademicCategories().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Subject</label>
                    <select style={selectStyle} value={autoForm.subject} onChange={e => setAutoForm(p => ({ ...p, subject: e.target.value, startMonth: "" }))}>
                      <option value="">Select subject…</option>
                      {getAcademicSubjects(autoForm.category).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Start Month</label>
                  <select style={selectStyle} value={autoForm.startMonth} onChange={e => setAutoForm(p => ({ ...p, startMonth: Number(e.target.value) }))}>
                    <option value="">Select start month…</option>
                    {getAcademicStartMonths(autoForm.category, autoForm.subject).map(m => <option key={m} value={m}>Month {m}</option>)}
                  </select>
                  {autoForm.subject && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Hint: 4 Sets ≈ 1 month of content.</div>}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Activity Type</label>
                    <select style={selectStyle} value={autoForm.type} onChange={e => setAutoForm(p => ({ ...p, type: e.target.value, level: "", topic: "" }))}>
                      <option value="">Select type…</option>
                      {getActivityTypes().map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Level</label>
                    <select style={selectStyle} value={autoForm.level} onChange={e => setAutoForm(p => ({ ...p, level: e.target.value, topic: "" }))}>
                      <option value="">Select level…</option>
                      {getActivityLevels(autoForm.type).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Topic</label>
                  <select style={selectStyle} value={autoForm.topic} onChange={e => setAutoForm(p => ({ ...p, topic: e.target.value }))}>
                    <option value="">Select topic…</option>
                    {getActivityTopics(autoForm.type, autoForm.level).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Start Date</label>
                <input type="date" style={selectStyle} value={autoForm.startDate} onChange={e => setAutoForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Weeks</label>
                <input type="number" min={1} max={12} style={selectStyle} value={autoForm.durationWeeks} onChange={e => setAutoForm(p => ({ ...p, durationWeeks: Number(e.target.value) }))} />
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  {[{ label: "1 Week", weeks: 1 }, { label: "2 Weeks", weeks: 2 }, { label: "1 Month", weeks: 4 }].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      style={{ ...btnSecondary, padding: "3px 8px", fontSize: 10, minWidth: 0 }}
                      onClick={() => setAutoForm(prev => ({ ...prev, durationWeeks: p.weeks }))}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Activities/Day</label>
                <input type="number" min={1} max={5} style={selectStyle} value={autoForm.maxActivitiesPerDay} onChange={e => setAutoForm(p => ({ ...p, maxActivitiesPerDay: Number(e.target.value) }))} />
              </div>
            </div>


          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button style={btnSecondary} onClick={() => { setAutoModal(false); setPreview(null); }}>Cancel</button>
            {!preview ? (
              <button style={btnPrimary} onClick={handleGenerate} disabled={(autoMode === "academic" ? (!autoForm.category || !autoForm.subject || !autoForm.startMonth) : (!autoForm.type || !autoForm.level || !autoForm.topic)) || generating}>
                {generating ? "Generating…" : "Generate Preview"}
              </button>
            ) : (
              <button
                style={{ ...btnPrimary, background: publishing ? "#9ca3af" : "#059669", cursor: publishing ? "not-allowed" : "pointer" }}
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? "Publishing…" : `✅ Publish ${preview.totalDays} Plans`}
              </button>
            )}
          </div>
          {preview && (
            <div style={{ marginTop: 16, maxHeight: 300, overflowY: "auto", padding: 14, background: "#f8fafc", borderRadius: 10, fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#1e40af" }}>
                Preview: {preview.totalDays} days, {preview.totalActivities} total activities
              </div>
              {preview.schedule.slice(0, 5).map((day, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <strong>{day.date} ({day.dayOfWeek})</strong>
                  {day.activities.map((a, j) => (
                    <div key={j} style={{ marginLeft: 12, color: "#6b7280" }}>
                      {a.order}. {a.contentTitle}
                    </div>
                  ))}
                </div>
              ))}
              {preview.schedule.length > 5 && (
                <div style={{ color: "#94a3b8", fontStyle: "italic" }}>…and {preview.schedule.length - 5} more days</div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ── Assign Modal ── */}
      {assignModal && (
        <Modal onClose={() => setAssignModal(false)}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 800 }}>📌 Assign Lesson Plan</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Lesson Plan</label>
              <select style={{ ...selectStyle, width: "100%" }} value={assignForm.lessonPlanId} onChange={e => setAssignForm(p => ({ ...p, lessonPlanId: e.target.value }))}>
                <option value="">Select plan…</option>
                {myPlans.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Preschool / School</label>
              <select
                style={{ ...selectStyle, width: "100%" }}
                value={assignForm.centerId}
                onChange={e => setAssignForm(p => ({ ...p, centerId: e.target.value, teacherId: "", gradeBand: "" }))}
              >
                <option value="">Select institution…</option>
                {myCenters.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type === "school" ? "School" : "Preschool"})
                  </option>
                ))}
              </select>
            </div>

            {selectedCenter?.type === "school" && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Grade Band</label>
                <select
                  style={{ ...selectStyle, width: "100%" }}
                  value={assignForm.gradeBand}
                  onChange={e => setAssignForm(p => ({ ...p, gradeBand: e.target.value }))}
                >
                  <option value="">Select grade band…</option>
                  {(selectedCenter.gradeBands || []).map(band => (
                    <option key={band} value={band}>{band === "1-9" ? "1-9 (combined)" : band}</option>
                  ))}
                </select>
                {(selectedCenter.gradeBands || []).length === 0 && (
                  <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>
                    This school has no grade bands configured yet — add them in Center Management first.
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Fellow / Teacher</label>
              <select
                style={{ ...selectStyle, width: "100%" }}
                value={assignForm.teacherId}
                onChange={e => setAssignForm(p => ({ ...p, teacherId: e.target.value }))}
                disabled={!assignForm.centerId}
              >
                <option value="">{assignForm.centerId ? "Select fellow…" : "Select an institution first"}</option>
                {fellowsAtCenter.map(f => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
              </select>
            </div>

          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
            <button style={btnSecondary} onClick={() => setAssignModal(false)}>Cancel</button>
            <button style={{ ...btnPrimary, background: "#059669" }} onClick={handleAssign} disabled={assigning}>
              {assigning ? "Assigning…" : "Assign Plan"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Review Modal ── */}
      {reviewModal && (
        <Modal onClose={() => { setReviewModal(null); setReviewFeedback(""); }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 800 }}>
            📝 Review {reviewType === "assignment" ? "Assignment" : "Completion Report"}
          </h3>
          <div style={{ marginBottom: 16, fontSize: 13 }}>
            <div><strong>Fellow:</strong> {reviewModal.teacher?.name || "—"}</div>
            <div><strong>Plan:</strong> {reviewType === "assignment" ? reviewModal.lessonPlan?.title : reviewModal.assignment?.lessonPlan?.title || "—"}</div>
            <div><strong>Status:</strong> <StatusBadge status={reviewModal.status} /></div>
            {reviewType === "report" && reviewModal.teachingNotes && (
              <div style={{ marginTop: 8, padding: 10, background: "#f8fafc", borderRadius: 8 }}>
                <strong>Teaching Notes:</strong> {reviewModal.teachingNotes}
              </div>
            )}
            {reviewType === "report" && reviewModal.activityDescription && (
              <div style={{ marginTop: 4, padding: 10, background: "#f8fafc", borderRadius: 8 }}>
                <strong>Activity Description:</strong> {reviewModal.activityDescription}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Feedback</label>
            <textarea
              style={{ ...S.input, minHeight: 80 }}
              value={reviewFeedback}
              onChange={e => setReviewFeedback(e.target.value)}
              placeholder="Add your review feedback…"
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button style={btnSecondary} onClick={() => { setReviewModal(null); setReviewFeedback(""); }}>Cancel</button>
            <button style={{ ...btnPrimary, background: "#dc2626" }} onClick={() => handleReview("rejected")}>Reject</button>
            <button style={{ ...btnPrimary, background: "#f59e0b", color: "#1c1917" }} onClick={() => handleReview("revision_requested")}>Request Revision</button>
            <button style={{ ...btnPrimary, background: "#059669" }} onClick={() => handleReview("approved")}>Approve</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
