import { useState, useEffect, useRef } from "react";
import { Logo, Toast, Badge, StatusBadge, StatCard, SectionCard, Modal, S, globalCSS } from "../components/Shared";
import { t, setLanguage, getLanguageList, getCurrentLanguage, LANG_CHANGE_EVENT } from "../services/i18n";
// Start: Snehal change
import { updateTeacherNotificationPreference, getParentModules, getParentSessionAssignments, submitParentSessionFeedback } from "../services/api";
// End: Snehal change

import AttendanceManager from "./AttendanceManager";
import TrainingAndClassroomManager, { MarkCompleteModal } from "./TrainingAndClassroomManager";
import GeotagAttendance from "./GeotagAttendance";
import ProctoredAssessment from "./Proctoredassessment";      // now reading/notes based, same filename
import TeacherCourseNotes from "./TeacherCourseNotes";    // NEW — replaces the old video CoursesTab
import LessonPlannerTab from "./LessonPlannerTab";
import TeacherUserGuide from "./teacheruserguide";
import CurriculumTab from "./CurriculumTab";
import {
  getTeacherProgress,
  getNotifications,
  markNotificationRead,
  askTeacherChatbot,
  updateCourseAssignmentProgress,
  resetCourseAssignmentProgress,
  updateTeacherMe,
  getTeacherMe,
  uploadFile,
  changeTeacherPassword,
  submitFeedback,
  getFeedbacks,
  updateTeacherLanguage,
  getTeacherCertificates,
  getTeacherChildren,
  deleteCourseAssignment,
  getTeacherClasses,
  getTeacherTasks,
  createTeacherTask,
  updateTeacherTask,
  toggleTeacherTask,
  deleteTeacherTask,
  getTeacherAttendance
} from "../services/api";
// Start: Dnyaneshwari Thorat
import { downloadCertificatePdf, viewCertificatePdf } from "../services/api";
// Start: Dnyaneshwari Thorat
import { onSocketEvent } from "../services/socket";
// End: Dnyaneshwari Thorat
// End: Dnyaneshwari Thorat

/* Resolve a profile photo path to a full URL */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/* Returns teacher's real photo URL or DiceBear fallback */
const getTeacherPhotoUrl = (teacher) => {
  const photo = teacher?.teacherProfile?.profilePhoto || teacher?.teacherProfile?.photo || teacher?.photoUrl || teacher?.profilePhoto;
  if (!photo) return null;
  if (typeof photo === "string") return photo.startsWith("http") ? photo : `${API_BASE_URL}${photo}`;
  const url = photo.publicUrl || photo.url || photo.path;
  return url || null;
};

/* ── Sidebar Avatar Component ── */
function SidebarAvatar({ teacher, size = 34 }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getTeacherPhotoUrl(teacher);

  if (!photoUrl || imgError) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white", flexShrink: 0 }}>
        {teacher?.name?.[0] || "?"}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <img src={photoUrl} alt={teacher?.name} onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }} />
      <span style={{ position: "absolute", bottom: 0, right: 0, background: "#10b981", borderRadius: "50%", width: 12, height: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, border: "1.5px solid white" }}>📷</span>
    </div>
  );
}

/* ── Mentor Avatar for My Mentor section — resolves photo from any format ── */
function MentorAvatarInline({ mentor, size = 48 }) {
  const [imgError, setImgError] = useState(false);

  // Resolve photo URL from various possible shapes
  const resolvePhoto = () => {
    const raw = mentor?.photoUrl || mentor?.mentorProfile?.profilePhoto || mentor?.mentorProfile?.photo || mentor?.profilePhoto || mentor?.photo;
    if (!raw) return null;
    if (typeof raw === "string") {
      if (!raw) return null;
      return raw.startsWith("http") ? raw : `${API_BASE_URL}${raw}`;
    }
    // Object shape: { publicUrl, url, path }
    const path = raw.publicUrl || raw.url || raw.path;
    if (!path) return null;
    return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  };

  const photoUrl = resolvePhoto();

  if (!photoUrl || imgError) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 800, color: "white", flexShrink: 0,
        border: "2px solid #bfdbfe"
      }}>
        {mentor?.name?.[0]?.toUpperCase() || "👨‍🏫"}
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      overflow: "hidden", flexShrink: 0, border: "2px solid #bfdbfe"
    }}>
      <img
        src={photoUrl}
        alt={mentor?.name}
        onError={() => setImgError(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

/* ── Under Construction Placeholder ── */
function UnderConstructionTab({ label = "This page", icon = "🚧" }) {
  return (
    <div style={{ animation: "fadeIn 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{
        background: "white",
        borderRadius: 20,
        padding: "48px 56px",
        textAlign: "center",
        border: "1px dashed #fbbf24",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        maxWidth: 460
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1917", marginBottom: 8 }}>
          {label} is under work
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
          This section is currently being built and is not connected yet. Please check back soon — thank you for your patience!
        </div>
      </div>
    </div>
  );
}

/* ── Colorful KPI Stat Card (Admin-dashboard style) ── */
function TeacherStatCard({ icon, label, val, accent = "#3b82f6", subtitle, subtitleColor }) {
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      border: "1px solid #f1f5f9",
      borderTop: `4px solid ${accent}`,
      padding: "18px 18px 16px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      transition: "transform 0.15s ease, box-shadow 0.15s ease"
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: `${accent}1A`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, marginBottom: 12
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{val}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginTop: 2 }}>{label}</div>
      {subtitle && (
        <div style={{ fontSize: 11, fontWeight: 700, color: subtitleColor || accent, marginTop: 6 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

/* ── Helper Date Formatters ── */
const formatLocalDateStr = (val) => {
  if (!val) return "";
  if (typeof val === "string") {
    const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = typeof val === "string" ? new Date(val) : val;
  if (d instanceof Date && !isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dateNum = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${dateNum}`;
  }
  return "";
};

const getTodayLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const dateNum = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${dateNum}`;
};

/* ── WeeklyScheduleTaskPlannerWidget ── */
function WeeklyScheduleTaskPlannerWidget({ user, lessons = [], assignments = [], courses = [], setActiveTab }) {
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [activeTabFilter, setActiveTabFilter] = useState("today");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  const storageKey = `teacher_custom_tasks_${user?._id || user?.id || 'default'}`;
  const [customTasks, setCustomTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch tasks from backend DB on mount if logged in
  useEffect(() => {
    let isMounted = true;
    getTeacherTasks()
      .then(res => {
        if (isMounted && res && Array.isArray(res.tasks || res)) {
          const apiTasks = (res.tasks || res).map(t => ({
            id: t._id || t.id,
            title: t.title,
            category: t.category || "homework",
            date: t.date ? formatLocalDateStr(t.date) : getTodayLocalDate(),
            time: t.time || `${t.startTime || '11:30'} - ${t.endTime || '12:30'}`,
            completed: !!t.completed,
            assignedByAdmin: !!t.assignedByAdmin,
            isCustom: true
          }));
          setCustomTasks(apiTasks);
        }
      })
      .catch(err => {
        console.warn("[WeeklyPlanner] Backend DB tasks not reachable, using local storage fallback:", err?.message);
      });
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(customTasks));
    } catch (e) {
      console.error(e);
    }
  }, [customTasks, storageKey]);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("homework");
  const [taskDate, setTaskDate] = useState(getTodayLocalDate());
  const [taskStartTime, setTaskStartTime] = useState("11:30");
  const [taskEndTime, setTaskEndTime] = useState("12:30");
  const [formError, setFormError] = useState("");

  const openCreateModal = () => {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskCategory("homework");
    setTaskDate(selectedDayDate || getTodayLocalDate());
    setTaskStartTime("11:30");
    setTaskEndTime("12:30");
    setFormError("");
    setShowAddTaskModal(true);
  };

  const openEditModal = (task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title || "");
    setTaskCategory(task.category || "homework");
    setTaskDate(task.date || getTodayLocalDate());
    const times = (task.time || "11:30 - 12:30").split("-").map(s => s.trim());
    setTaskStartTime(times[0] || "11:30");
    setTaskEndTime(times[1] || "12:30");
    setFormError("");
    setShowAddTaskModal(true);
  };

  const parseTimeToMins = (str) => {
    if (!str) return 0;
    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours < 8) hours += 12;
    return hours * 60 + minutes;
  };

  const handleSaveTask = (e) => {
    if (e) e.preventDefault();
    setFormError("");

    if (!taskTitle || !taskTitle.trim()) {
      setFormError("Please enter a task title.");
      return;
    }

    const startMins = parseTimeToMins(taskStartTime);
    const endMins = parseTimeToMins(taskEndTime);

    if (endMins <= startMins) {
      setFormError("End time must be after start time.");
      return;
    }

    // Check for time overlap against all scheduled tasks on taskDate
    const conflictingTask = combinedTasks.find(t => {
      if (t.date !== taskDate) return false;
      if (editingTaskId && t.id === editingTaskId) return false;

      const times = (t.time || "").split("-").map(s => s.trim());
      const tStart = parseTimeToMins(times[0]);
      const tEnd = parseTimeToMins(times[1] || times[0]) || (tStart + 60);

      return startMins < tEnd && endMins > tStart;
    });

    if (conflictingTask) {
      setFormError(`❌ Time Conflict: The time slot ${taskStartTime} - ${taskEndTime} overlaps with "${conflictingTask.title}" (${conflictingTask.time}). Please choose an unoccupied time slot.`);
      return;
    }

    const taskPayload = {
      title: taskTitle.trim(),
      category: taskCategory || "homework",
      date: taskDate || getTodayLocalDate(),
      startTime: taskStartTime || "11:30",
      endTime: taskEndTime || "12:30",
      time: `${taskStartTime || "11:30"} - ${taskEndTime || "12:30"}`
    };

    if (editingTaskId) {
      setCustomTasks(prev => prev.map(t => t.id === editingTaskId ? {
        ...t,
        ...taskPayload
      } : t));
      updateTeacherTask(editingTaskId, taskPayload).catch(err => console.warn("[DB Sync] Update task failed:", err?.message));
    } else {
      const tempId = "task_" + Date.now().toString();
      const newTask = {
        id: tempId,
        ...taskPayload,
        completed: false,
        isCustom: true,
        createdAt: new Date().toISOString()
      };
      setCustomTasks(prev => [newTask, ...prev]);
      createTeacherTask(taskPayload).then(res => {
        if (res && res._id) {
          setCustomTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: res._id } : t));
        }
      }).catch(err => console.warn("[DB Sync] Create task failed:", err?.message));
    }

    setTaskTitle("");
    setEditingTaskId(null);
    setFormError("");
    setActiveTabFilter("all");
    setShowAddTaskModal(false);
  };

  const [completeModalTask, setCompleteModalTask] = useState(null);

  const toggleTaskStatus = (id) => {
    setCustomTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    toggleTeacherTask(id).catch(err => console.warn("[DB Sync] Toggle task failed:", err?.message));
  };

  const deleteTask = (id) => {
    setCustomTasks(prev => prev.filter(t => t.id !== id));
    deleteTeacherTask(id).catch(err => console.warn("[DB Sync] Delete task failed:", err?.message));
  };

  const categoryMeta = {
    homework: { bg: "#fee2e2", border: "#ef4444", color: "#991b1b", label: "Homework" },
    exam: { bg: "#ffedd5", border: "#f97316", color: "#9a3412", label: "Exam" },
    workshop: { bg: "#fef9c3", border: "#eab308", color: "#854d0e", label: "Workshop" },
    class: { bg: "#dcfce7", border: "#22c55e", color: "#166534", label: "Class" },
    tech: { bg: "#e0e7ff", border: "#6366f1", color: "#3730a3", label: "Technology" },
    admin_assigned: { bg: "#fef3c7", border: "#f59e0b", color: "#92400e", label: "Admin Task" }
  };

  const getWeekDays = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon + selectedWeekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const formatted = formatLocalDateStr(d);
      days.push({
        name: d.toLocaleDateString("en-IN", { weekday: "short" }),
        dateNum: d.getDate(),
        fullDate: formatted,
        isToday: formatted === getTodayLocalDate()
      });
    }
    return days;
  };

  const weekDays = getWeekDays();
  const [selectedDayDate, setSelectedDayDate] = useState(weekDays.find(d => d.isToday)?.fullDate || weekDays[0].fullDate);
  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  const featuredAssignmentList = assignments.slice(0, 1).map((a, i) => ({
    id: a._id || `assignment-${i}`,
    title: a.title || a.course?.title || "Course Assignment",
    date: a.dueDate ? formatLocalDateStr(a.dueDate) : "",
    time: "",
    category: "exam",
    completed: a.status === "completed" || a.status === "approved",
    isCustom: false,
    isAssignment: true
  }));

  const combinedTasks = [
    ...customTasks.map(t => ({
      id: t.id,
      title: t.title,
      date: t.date ? formatLocalDateStr(t.date) : "",
      time: t.time || "11:30 - 12:30",
      category: t.category || "homework",
      completed: t.completed,
      isCustom: true
    })),
    ...lessons.map((l, i) => ({
      id: l._id || `lesson-${i}`,
      title: l.lessonPlan?.title || "Lesson Session",
      date: l.lessonPlan?.scheduleDate ? formatLocalDateStr(l.lessonPlan.scheduleDate) : "",
      time: l.lessonPlan?.timeSlot || "",
      category: "class",
      completed: l.status === "completed",
      isCustom: false
    })),
    ...featuredAssignmentList
  ];

  const todayStr = getTodayLocalDate();
  const displayTasks = combinedTasks.filter(item => {
    const itemDate = item.date ? formatLocalDateStr(item.date) : "";
    if (activeTabFilter === "today") return itemDate === todayStr;
    if (activeTabFilter === "upcoming") return (itemDate ? itemDate >= todayStr : true) && !item.completed;
    if (activeTabFilter === "completed") return item.completed;
    return true;
  });

  const getTopOffsetForTime = (timeStr) => {
    if (!timeStr) return 10;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 10;
    let hour = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    if (hour < 8) hour += 12;
    const decimalHour = hour + min / 60;
    const offset = Math.max(0, (decimalHour - 9) * 50);
    return Math.min(offset, 410);
  };

  const getEventTimeRange = (timeStr) => {
    const [startRaw, endRaw] = (timeStr || "").split("-").map(s => s.trim());
    const start = parseTimeToMins(startRaw);
    const end = parseTimeToMins(endRaw || startRaw) || start + 60;
    return {
      start,
      end: end > start ? end : start + 60
    };
  };

  const buildPackedTimelineEvents = (events) => {
    let previousBottom = 0;
    const cardGap = 10;
    const minCardHeight = 68;
    const pixelsPerMinute = 50 / 60;

    return [...events]
      .sort((a, b) => {
        const aRange = getEventTimeRange(a.time);
        const bRange = getEventTimeRange(b.time);
        return aRange.start - bRange.start || aRange.end - bRange.end;
      })
      .map((ev) => {
        const { start, end } = getEventTimeRange(ev.time);
        const naturalTop = Math.max(0, (start - 9 * 60) * pixelsPerMinute);
        const durationHeight = Math.max(minCardHeight, (end - start) * pixelsPerMinute - 8);
        const displayTop = Math.max(naturalTop, previousBottom);
        previousBottom = displayTop + durationHeight + cardGap;

        return {
          ...ev,
          topOffset: displayTop,
          height: durationHeight
        };
      });
  };

  const dynamicScheduleEvents = combinedTasks.map((item, idx) => {
    const itemDate = item.date ? formatLocalDateStr(item.date) : "";
    const dayIdx = weekDays.findIndex(d => d.fullDate === itemDate);
    return {
      id: item.id || `ev-${idx}`,
      title: item.title,
      time: item.time,
      dayIdx: dayIdx >= 0 ? dayIdx : -1,
      category: item.category || "class",
      topOffset: getTopOffsetForTime(item.time)
    };
  }).filter(ev => ev.dayIdx >= 0);

  const scheduleGridEvents = dynamicScheduleEvents;

  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid #e2e8f0", padding: 24, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.4px", display: "flex", alignItems: "center", gap: 8 }}>
            📅 WEEKLY COURSE SCHEDULE & TASK PLANNER
          </h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Manage timetable sessions, track upcoming deadlines, and mark tasks as complete</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setSelectedWeekOffset(prev => prev - 1)}
            style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#334155" }}
          >
            ← Prev Week
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", padding: "6px 10px", background: "#f1f5f9", borderRadius: 8 }}>
            {weekDays[0]?.dateNum} {weekDays[0]?.name} - {weekDays[6]?.dateNum} {weekDays[6]?.name}
          </span>
          <button
            onClick={() => setSelectedWeekOffset(prev => prev + 1)}
            style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#334155" }}
          >
            Next Week →
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 16, textAlign: "center" }}>
            {weekDays.map((d) => {
              const isSelected = selectedDayDate === d.fullDate;
              return (
                <button
                  key={d.fullDate}
                  onClick={() => setSelectedDayDate(d.fullDate)}
                  style={{
                    padding: "8px 4px",
                    borderRadius: 12,
                    border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: isSelected ? "#eff6ff" : d.isToday ? "#fef3c7" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontSize: 11, color: isSelected ? "#1d4ed8" : "#64748b", fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: isSelected ? "#1e40af" : "#0f172a", marginTop: 2 }}>{d.dateNum}</div>
                </button>
              );
            })}
          </div>

          <div style={{ border: "1px solid #f1f5f9", borderRadius: 16, padding: 16, background: "#fafafa", position: "relative", maxHeight: 420, overflowY: "auto" }}>
            {timeSlots.map((slotTime) => (
              <div key={slotTime} style={{ display: "flex", alignItems: "center", borderBottom: "1px dashed #e2e8f0", height: 50 }}>
                <span style={{ width: 60, fontSize: 11, fontWeight: 700, color: "#94a3b8", flexShrink: 0 }}>{slotTime}</span>
                <div style={{ flex: 1, height: "100%", position: "relative" }} />
              </div>
            ))}

            <div style={{ position: "absolute", top: 16, left: 76, right: 16, bottom: 16, pointerEvents: "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, height: "100%" }}>
                {weekDays.map((d, dayIdx) => {
                  const isSelectedDay = d.fullDate === selectedDayDate;
                  const rawEvents = isSelectedDay ? scheduleGridEvents.filter(ev => ev.dayIdx === dayIdx) : [];
                  const dayEvents = buildPackedTimelineEvents(rawEvents);
                  const isRightHalf = false;
                  return (
                    <div key={d.fullDate} style={{ position: "relative", height: "100%", display: isSelectedDay ? "block" : "none", gridColumn: isSelectedDay ? "1 / -1" : undefined }}>
                      {dayEvents.map((ev, evIdx) => {
                        const meta = categoryMeta[ev.category] || categoryMeta.class;
                        const baseTop = ev.topOffset !== undefined ? ev.topOffset : (evIdx * 85 + 10);
                        return (
                          <div
                            key={ev.id || evIdx}
                            style={{
                              position: "absolute",
                              top: baseTop,
                              ...(isRightHalf ? { right: 0 } : { left: 0 }),
                              minWidth: "200px",
                              maxWidth: "220px",
                              minHeight: ev.height,
                              background: meta.bg,
                              border: `1.5px solid ${meta.border}`,
                              borderRadius: 12,
                              padding: "10px 12px",
                              boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                              pointerEvents: "auto",
                              zIndex: 10 + (ev.overlapIdx || 0),
                              transition: "all 0.2s ease"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginBottom: 4 }}>
                              <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", background: meta.border, color: "white", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.4px" }}>
                                {meta.label || ev.category}
                              </span>

                              <div style={{ fontSize: 11, color: meta.color, opacity: 0.95, fontWeight: 700, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                                ⏱ {ev.time}
                              </div>

                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: meta.color, lineHeight: "1.3", whiteSpace: "normal", wordBreak: "break-word" }}>
                              {ev.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0", padding: 18, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Upcoming Events</h3>
              <span style={{ fontSize: 11, color: "#64748b" }}>Tasks & class schedule</span>
            </div>

            <button
              onClick={openCreateModal}
              style={{
                padding: "6px 12px", background: "linear-gradient(135deg,#f59e0b,#d97706)",
                color: "white", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700,
                cursor: "pointer", boxShadow: "0 2px 6px rgba(217,119,6,0.2)"
              }}
            >
              + Add Task
            </button>
          </div>

          <div style={{ display: "flex", gap: 4, background: "#e2e8f0", padding: 3, borderRadius: 8, marginBottom: 14 }}>
            {[
              { id: "all", label: "All" },
              { id: "today", label: "Today" },
              { id: "upcoming", label: "Upcoming" },
              { id: "completed", label: "Done" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTabFilter(tab.id)}
                style={{
                  flex: 1, padding: "4px 8px", border: "none", borderRadius: 6,
                  background: activeTabFilter === tab.id ? "white" : "transparent",
                  color: activeTabFilter === tab.id ? "#0f172a" : "#64748b",
                  fontSize: 11, fontWeight: activeTabFilter === tab.id ? 700 : 500,
                  cursor: "pointer", transition: "all 0.15s"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", maxHeight: 340, display: "flex", flexDirection: "column", gap: 10 }}>
            {displayTasks.length === 0 ? (
              <div style={{ padding: "24px 12px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
                No events or tasks listed for this view.
              </div>
            ) : (
              displayTasks.map(item => {
                const meta = categoryMeta[item.category] || categoryMeta.homework;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: "white", borderRadius: 12, padding: "12px 14px",
                      border: "1px solid #e2e8f0", borderLeft: `4px solid ${meta.border}`,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)", transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: item.completed ? "#94a3b8" : "#1e293b", textDecoration: item.completed ? "line-through" : "none" }}>
                          {item.title}
                        </div>
                        {(item.date || item.time) ? (
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                            {item.date && <span>📅 {item.date}</span>}
                            {item.time && <span>⏱ {item.time}</span>}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                            📘 Course Assignment
                          </div>
                        )}
                      </div>

                      {item.isCustom && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Task"
                            style={{
                              padding: "4px 6px", borderRadius: 6, border: "none",
                              background: "#eff6ff", color: "#2563eb",
                              fontSize: 10, fontWeight: 700, cursor: "pointer"
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (item.completed) {
                                toggleTaskStatus(item.id);
                              } else {
                                setCompleteModalTask(item);
                              }
                            }}
                            style={{
                              padding: "4px 8px", borderRadius: 6, border: "none",
                              background: item.completed ? "#d1fae5" : "#fef3c7",
                              color: item.completed ? "#065f46" : "#92400e",
                              fontSize: 10, fontWeight: 700, cursor: "pointer"
                            }}
                          >
                            {item.completed ? "✓ Done" : "Mark Done"}
                          </button>
                          <button
                            onClick={() => deleteTask(item.id)}
                            title="Delete Task"
                            style={{
                              padding: "4px 6px", borderRadius: 6, border: "none",
                              background: "#fee2e2", color: "#ef4444",
                              fontSize: 10, fontWeight: 700, cursor: "pointer"
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showAddTaskModal && (
        <Modal title={editingTaskId ? "Edit Task / Event" : "Add New Task / Event"} onClose={() => setShowAddTaskModal(false)}>
          <form onSubmit={handleSaveTask} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && (
              <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, color: "#991b1b", fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>
                {formError}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="e.g. Applied Science Homework, Technology Exam..."
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Date</label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={e => setTaskDate(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Category</label>
                <select
                  value={taskCategory}
                  onChange={e => setTaskCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", boxSizing: "border-box", background: "white" }}
                >
                  <option value="homework">Urgent / Homework</option>
                  <option value="exam">Exam / Assessment</option>
                  <option value="workshop">Workshop / Seminar</option>
                  <option value="class">Regular Class</option>
                  <option value="tech">Technology</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Start Time</label>
                <input
                  type="text"
                  value={taskStartTime}
                  onChange={e => setTaskStartTime(e.target.value)}
                  placeholder="09:30"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>End Time</label>
                <input
                  type="text"
                  value={taskEndTime}
                  onChange={e => setTaskEndTime(e.target.value)}
                  placeholder="11:20"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#475569" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTask}
                style={{ padding: "8px 20px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", boxShadow: "0 2px 6px rgba(217,119,6,0.3)" }}
              >
                {editingTaskId ? "Update Task" : "Save Task"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Floating Mark Complete Modal for Overview Dashboard Tasks */}
      {completeModalTask && (
        <MarkCompleteModal
          activity={{
            _id: completeModalTask.id,
            id: completeModalTask.id,
            activityName: completeModalTask.title,
            title: completeModalTask.title,
            level: completeModalTask.category || "Class Activity"
          }}
          user={user}
          onSubmit={() => {
            toggleTaskStatus(completeModalTask.id);
            setCompleteModalTask(null);
          }}
          onClose={() => setCompleteModalTask(null)}
        />
      )}
    </div>
  );
}

/* ── MyAttendanceSummaryCard ── */
function MyAttendanceSummaryCard({ attendance = 0, summary = {}, attendanceMap = {}, setActiveTab }) {
  const [viewMode, setViewMode] = useState("graph"); // "graph" | "calendar"

  const today = new Date();
  const todayDate = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthName = today.toLocaleString("en-IN", { month: "long" });
  const currentMonthShort = today.toLocaleString("en-IN", { month: "short" });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const isWeekend = (day) => {
    const d = new Date(currentYear, currentMonth, day).getDay();
    return d === 0 || d === 6;
  };

  const getDayKey = (day) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getDayStatus = (day) => {
    if (isWeekend(day)) return "holiday";
    if (day === todayDate) return "today";
    if (day > todayDate) return "upcoming";
    const rec = attendanceMap[getDayKey(day)];
    if (rec?.checkedIn || rec?.status === "present") return "present";
    return "absent";
  };

  const getCalendarTileStyles = (status) => {
    switch (status) {
      case "present":
        return { background: "#EBFDF5", border: "1.5px solid #10B981", color: "#065F46" };
      case "absent":
        return { background: "#FFF1F2", border: "1.5px solid #FDA4AF", color: "#9F1239" };
      case "today":
        return { background: "#FEF3C7", border: "2.5px solid #F59E0B", color: "#B45309", fontWeight: "800" };
      case "holiday":
        return { background: "#FDF6EC", border: "1.5px solid #FBBF24", color: "#92400E" };
      case "upcoming":
      default:
        return { background: "#FFFBF0", border: "1.5px solid #FDE68A", color: "#B45309" };
    }
  };

  // Count ALL present days including weekends (e.g. teacher checked in on Saturday)
  const currentMonthPfx = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-`;
  const presentDays = Object.entries(attendanceMap)
    .filter(([key, r]) =>
      key.startsWith(currentMonthPfx) &&
      (r?.checkedIn || r?.status === "present")
    ).length;
  const totalWorkdays = Array.from({ length: todayDate }, (_, i) => i + 1).filter(d => !isWeekend(d)).length;
  // Absent = workdays not covered by any present record (weekday-only baseline)
  const workdayPresentDays = Array.from({ length: todayDate }, (_, i) => i + 1)
    .filter(d => !isWeekend(d) && (attendanceMap[getDayKey(d)]?.checkedIn || attendanceMap[getDayKey(d)]?.status === "present"))
    .length;
  const absentDays = Math.max(0, totalWorkdays - workdayPresentDays);

  const todayKey = getDayKey(todayDate);
  const todayRecord = attendanceMap[todayKey] || {};

  // Build 6-month trend from attendanceMap keys (format: "YYYY-MM-DD")
  const build6MonthTrend = () => {
    // If backend already provides monthly trend data, prefer it
    if (summary.monthlyTrend && summary.monthlyTrend.length > 0) {
      return summary.monthlyTrend.slice(-6).map((m, i, arr) => ({
        ...m,
        isCurrent: i === arr.length - 1
      }));
    }

    const months = [];
    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(currentYear, currentMonth - offset, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      const daysInMo = new Date(yr, mo + 1, 0).getDate();
      const isCurr = offset === 0;
      const cutoffDay = isCurr ? todayDate : daysInMo;

      let workdays = 0;
      let present = 0;
      for (let day = 1; day <= cutoffDay; day++) {
        const dow = new Date(yr, mo, day).getDay();
        if (dow === 0 || dow === 6) continue; // skip weekends
        workdays++;
        const key = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const rec = attendanceMap[key];
        if (rec?.checkedIn || rec?.status === "present") present++;
      }

      const rate = workdays > 0 ? Math.round((present / workdays) * 100) : (isCurr ? calculatedAttendanceRate : 0);
      const label = new Date(yr, mo, 1).toLocaleString("en-IN", { month: "short" });
      months.push({ month: label, val: rate, isCurrent: isCurr });
    }
    return months;
  };

  // Exact real calculated attendance rate (e.g. 1 present / 21 workdays = 5%)
  const calculatedAttendanceRate = totalWorkdays > 0
    ? Math.round((presentDays / totalWorkdays) * 100)
    : (summary.attendanceRate !== undefined ? summary.attendanceRate : 0);

  const graphTrend = build6MonthTrend();

  return (
    <SectionCard title="My Attendance Summary">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Top Stat Badges */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#065f46" }}>🟢 PRESENT</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#047857", marginTop: 2 }}>{presentDays} Days</div>
              </div>
              <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#854d0e" }}>🟡 LEAVES</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#a16207", marginTop: 2 }}>0 Days</div>
              </div>
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#991b1b" }}>🔴 ABSENT</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#b91c1c", marginTop: 2 }}>{absentDays} Days</div>
              </div>
            </div>

            {/* ── 6-Month Attendance Bar Chart ── */}
            {(() => {
              const CHART_H = 180;
              const gridPcts = [0, 25, 50, 75, 100];

              return (
                <div style={{ background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px 12px" }}>
                  {/* Chart body: value-labels + bars side by side with Y-axis */}
                  <div style={{ display: "flex", alignItems: "stretch", gap: 6 }}>

                    {/* Y-axis tick labels */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: CHART_H,
                      flexShrink: 0,
                      paddingBottom: 2
                    }}>
                      {[...gridPcts].reverse().map(g => (
                        <span key={g} style={{ fontSize: 8, color: "#b0bec5", fontWeight: 600, lineHeight: 1 }}>{g}%</span>
                      ))}
                    </div>

                    {/* Bar area */}
                    <div style={{ flex: 1, position: "relative", height: CHART_H }}>
                      {/* Horizontal grid lines (anchored bottom of this box) */}
                      {gridPcts.map(g => (
                        <div key={g} style={{
                          position: "absolute",
                          left: 0, right: 0,
                          bottom: `${g}%`,
                          borderTop: g === 100
                            ? "1px solid #e2e8f0"
                            : "1px dashed #e9eef4",
                          zIndex: 0
                        }} />
                      ))}
                      {/* Floor */}
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        borderTop: "2px solid #d1d9e0", zIndex: 1
                      }} />

                      {/* Bars — absolutely pinned to the bottom */}
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-around",
                        height: "100%",
                        zIndex: 2
                      }}>
                        {graphTrend.map((d, i) => {
                          const barH = d.val > 0 ? Math.max(6, (d.val / 100) * CHART_H) : 0;
                          const barColor = d.val >= 90
                            ? "linear-gradient(180deg,#34d399,#10b981)"
                            : d.val >= 80
                              ? "linear-gradient(180deg,#fbbf24,#f59e0b)"
                              : d.val > 0
                                ? "linear-gradient(180deg,#f87171,#ef4444)"
                                : "transparent";
                          const valColor = d.val >= 90 ? "#10b981" : d.val >= 80 ? "#f59e0b" : d.val > 0 ? "#ef4444" : "#c8d0da";
                          const barW = d.isCurrent ? 30 : 22;

                          return (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                height: "100%",
                                flex: 1,
                              }}
                            >
                              {/* Value label pinned just above bar */}
                              <span style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: valColor,
                                marginBottom: 3,
                                lineHeight: 1,
                                minHeight: 12
                              }}>
                                {d.val > 0 ? `${d.val}%` : "0%"}
                              </span>

                              {/* Bar */}
                              {barH > 0 ? (
                                <div style={{
                                  width: barW,
                                  height: barH,
                                  borderRadius: "5px 5px 0 0",
                                  background: barColor,
                                  boxShadow: d.isCurrent && d.val > 0 ? "0 3px 10px rgba(16,185,129,0.25)" : "none",
                                  border: d.isCurrent ? "2px solid #059669" : "none",
                                  transition: "all .4s ease",
                                  flexShrink: 0
                                }} />
                              ) : (
                                /* Ghost bar for 0% months */
                                <div style={{
                                  width: barW,
                                  height: 6,
                                  borderRadius: "3px 3px 0 0",
                                  background: d.isCurrent ? "transparent" : "#eef0f3",
                                  border: d.isCurrent ? "1.5px dashed #059669" : "1px solid #e2e8f0",
                                  flexShrink: 0
                                }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Month labels row */}
                  <div style={{ display: "flex", paddingLeft: 20, marginTop: 8 }}>
                    {graphTrend.map((d, i) => (
                      <span key={i} style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: d.isCurrent ? 900 : 500,
                        color: d.isCurrent ? "#1e293b" : "#94a3b8"
                      }}>
                        {d.month}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
      </div>
    </SectionCard>
  );
}

/* ── OverviewTab ── */
function OverviewTab({ user, setActiveTab, courses = [], assignments = [], lessons = [], activities = [], summary = {} }) {
  const attendanceMap = summary.attendanceMap || {};
const today = new Date();
const todayDate = today.getDate();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

const isWeekend = (day) => {
  const d = new Date(currentYear, currentMonth, day).getDay();
  return d === 0 || d === 6;
};
const getDayKey = (day) =>
  `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const totalWorkdays = Array.from({ length: todayDate }, (_, i) => i + 1).filter(d => !isWeekend(d)).length;
const presentWorkdays = Array.from({ length: todayDate }, (_, i) => i + 1)
  .filter(d => !isWeekend(d) && (attendanceMap[getDayKey(d)]?.checkedIn || attendanceMap[getDayKey(d)]?.status === "present"))
  .length;

const attendance = totalWorkdays > 0
  ? Math.round((presentWorkdays / totalWorkdays) * 100)
  : (summary.attendanceRate !== undefined ? summary.attendanceRate : 0);
  const attColor = attendance >= 85 ? "#10b981" : attendance >= 70 ? "#f59e0b" : "#ef4444";
  const photoUrl = getTeacherPhotoUrl(user);

  // Start: Dnyaneshwari Thorat
  const isVisibleCourse = (item) => {
    const title = item?.course?.title || item?.title || "";
    return !title.toLowerCase().includes("ai testing");
  };

  const isFinishedCourse = (item) =>
    item?.status === "completed" ||
    item?.status === "approved" ||
    item?.progressPercent === 100;

  const visibleAssignments = assignments.filter(isVisibleCourse);
  const activeAssignments = visibleAssignments.filter((item) => !isFinishedCourse(item));
  const featuredAssignments = visibleAssignments.slice(0, 5);
  const featuredCourseProgress = visibleAssignments.slice(0, 3);
  // End: Dnyaneshwari Thorat

  const certificatesCount = courses.filter(c => (c.status === "completed" || c.progressPercent === 100) && c.score !== null && c.score !== undefined).length;
  const pendingTasksCount = activeAssignments.filter(a => a.status === "assigned" || a.status === "revision").length;
  const gradedAssignments = visibleAssignments.filter(a => a.score !== null && a.score !== undefined);
  const averageScore = gradedAssignments.length ? Math.round(gradedAssignments.reduce((sum, a) => sum + Number(a.score || 0), 0) / gradedAssignments.length) : 0;
  const centerName = user.teacherProfile?.center
    ? [user.teacherProfile.center.name, user.teacherProfile.center.city].filter(Boolean).join(", ")
    : (user.workingCenter || "Center not assigned");
  const classNames = (user.teacherProfile?.classes || []).map(c => c?.name).filter(Boolean);
  const className = classNames.length > 0 ? classNames.join(", ") : "No class assigned";
  const studentsCount = summary.totalChildren || user.students || 0;

  // Get full class details for the assigned classes (use only classes array, ignore old class field)
  const allAssignedClasses = user.teacherProfile?.classes || [];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>


      {/* KPI Cards Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
        <TeacherStatCard icon="👥" label="Total Students" val={studentsCount} accent="#3b82f6" subtitle="Active" />
        <TeacherStatCard icon="📊" label="Attendance" val={`${attendance}%`} accent={attColor} subtitle={attendance >= 85 ? "Great ✓" : attendance >= 70 ? "Keep it up" : "Needs attention"} />
        <TeacherStatCard icon="🏆" label="Avg Grade" val={gradedAssignments.length ? `${averageScore}%` : "N/A"} accent="#8b5cf6" subtitle={gradedAssignments.length ? `${gradedAssignments.length} graded` : "No grades yet"} />
        <TeacherStatCard icon="📜" label="Certificates" val={certificatesCount} accent="#06b6d4" subtitle="Earned" />
        <TeacherStatCard icon="📋" label="Pending Tasks" val={pendingTasksCount} accent="#ef4444" subtitle={pendingTasksCount === 0 ? "All clear ✓" : "Awaiting submission"} />
      </div>

      {/* ── Weekly Course Schedule & Task Planner Widget ── */}
      <WeeklyScheduleTaskPlannerWidget
        user={user}
        lessons={lessons}
        assignments={assignments}
        courses={courses}
        setActiveTab={setActiveTab}
      />


      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <MyAttendanceSummaryCard attendance={attendance} summary={summary} attendanceMap={summary.attendanceMap || {}} setActiveTab={setActiveTab} />

        <SectionCard title="Course Progress">
          {courses.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No assigned courses yet.</div>
          ) : (
            // Start: Dnyaneshwari Thorat
            featuredCourseProgress.map((c, i) => {
              // End: Dnyaneshwari Thorat
              const progress = c.progressPercent || 0;
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{c.course?.title?.split(" ").slice(0, 3).join(" ") || "Course"}...</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b" }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4, overflow: "hidden", marginBottom: 2 }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#f59e0b,#d97706)", borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{c.status || "Assigned"} · Due: {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "No deadline"}</div>
                </div>
              );
            })
          )}
          <button onClick={() => setActiveTab("courses")} style={{ fontSize: 12, color: "#d97706", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4 }}>View all courses →</button>
        </SectionCard>
      </div>

    </div>
  );
}

/* NOTE: the old video-based `getCourseContent()` helper and `CoursesTab`
   component that used to live here have been removed. Course content is
   now topic-wise reading notes (no video), rendered by the imported
   `TeacherCourseNotes` component — see the "courses" case in
   renderContent() below. */

const formatTeacherDate = (value, options = {}) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", ...options });
};

const getAssignmentTitle = (item) => item.title || item.course?.title || "Assignment";
const isReviewedAssignment = (item) => item.score !== null && item.score !== undefined;
const isCertificateReady = (item) => item.status === "completed" || item.progressPercent === 100 || item.status === "approved" || item.status === "reviewed";

function ScheduleTab({ user, lessons = [] }) {
  const [filter, setFilter] = useState("all");
  const classNames = (user.teacherProfile?.classes || []).map(c => c?.name).filter(Boolean);
  const items = lessons
    .map((item) => ({
      id: item._id,
      title: item.lessonPlan?.title || "Assigned lesson",
      course: item.lessonPlan?.course?.title || "Training",
      date: item.lessonPlan?.scheduleDate || item.assignedDate,
      status: item.status || "pending",
      objectives: item.lessonPlan?.objectives || item.lessonPlan?.description || ""
    }))
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = items.filter((item) => item.date && new Date(item.date) >= today && item.status !== "completed");
  const completed = items.filter((item) => item.status === "completed").length;
  const visibleItems = items.filter((item) => {
    if (filter === "upcoming") return item.date && new Date(item.date) >= today && item.status !== "completed";
    if (filter === "completed") return item.status === "completed";
    if (filter === "pending") return item.status !== "completed";
    return true;
  });
  const filterBtn = (key, label) => (
    <button onClick={() => setFilter(key)} style={{ ...S.exportBtn, background: filter === key ? "#1e40af" : "white", color: filter === key ? "white" : "#6b7280", borderColor: filter === key ? "#1e40af" : "#e5e7eb" }}>
      {label}
    </button>
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={S.pageTitle}>Schedule</h1>
      <p style={S.pageSub}>Subject: {user.subject || user.teacherProfile?.subject || "Assigned teacher"} · {classNames.length > 0 ? classNames.join(", ") : "Class not assigned"}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard icon="📅" label="Scheduled Lessons" val={items.length} color="#3b82f6" bg="#dbeafe" />
        <StatCard icon="⏳" label="Upcoming" val={upcoming.length} color="#f59e0b" bg="#fef3c7" />
        <StatCard icon="✅" label="Completed" val={completed} color="#10b981" bg="#d1fae5" />
      </div>
      <SectionCard title="Assigned Lesson Schedule">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {filterBtn("all", "All")}
          {filterBtn("upcoming", "Upcoming")}
          {filterBtn("pending", "Pending")}
          {filterBtn("completed", "Completed")}
        </div>
        {visibleItems.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", border: "1px dashed #cbd5e1", borderRadius: 12 }}>No lesson schedule found for this filter.</div>
        ) : visibleItems.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", background: "white", borderRadius: 10, marginBottom: 8, border: "1px solid #f3f4f6", borderLeft: `4px solid ${item.status === "completed" ? "#10b981" : "#f59e0b"}` }}>
            <div style={{ width: 118, fontSize: 13, fontWeight: 800, color: "#d97706", flexShrink: 0 }}>{formatTeacherDate(item.date)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>{item.course}</div>
              {item.objectives && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>{String(item.objectives).slice(0, 120)}</div>}
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function GradesTab({ assignments = [] }) {
  const [filter, setFilter] = useState("all");
  const graded = assignments.filter(isReviewedAssignment);
  const average = graded.length ? Math.round(graded.reduce((sum, item) => sum + Number(item.score || 0), 0) / graded.length) : 0;
  const topScore = graded.length ? Math.max(...graded.map((item) => Number(item.score || 0))) : 0;
  const revisions = assignments.filter((item) => item.status === "revision").length;
  const visibleGrades = graded.filter((item) => {
    if (filter === "excellent") return Number(item.score || 0) >= 85;
    if (filter === "needs-work") return Number(item.score || 0) < 60;
    return true;
  });
  const filterBtn = (key, label) => (
    <button onClick={() => setFilter(key)} style={{ ...S.exportBtn, background: filter === key ? "#7c3aed" : "white", color: filter === key ? "white" : "#6b7280", borderColor: filter === key ? "#7c3aed" : "#e5e7eb" }}>
      {label}
    </button>
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={S.pageTitle}>{t("Grades")}</h1>
      <p style={S.pageSub}>{t("Scores and feedback added by admin after review.")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard icon="📊" label={t("Average Score")} val={graded.length ? average + "%" : "--"} color="#8b5cf6" bg="#ede9fe" />
        <StatCard icon="✅" label={t("Reviewed Assignments")} val={graded.length} color="#10b981" bg="#d1fae5" />
        <StatCard icon="⭐" label={t("Best Score")} val={graded.length ? topScore + "%" : "--"} color="#f59e0b" bg="#fef3c7" />
        <StatCard icon="🔄" label={t("Needs Revision")} val={revisions} color="#ef4444" bg="#fee2e2" />
      </div>
      <SectionCard title={t("Reviewed Work")}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {filterBtn("all", t("All reviewed"))}
          {filterBtn("excellent", t("85% and above"))}
          {filterBtn("needs-work", t("Below 60%"))}
        </div>
        {visibleGrades.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", border: "1px dashed #cbd5e1", borderRadius: 12 }}>{t("No grades published for this filter.")}</div>
        ) : visibleGrades.map((item) => (
          <div key={item._id} style={{ padding: 14, border: "1px solid #f1f5f9", borderRadius: 10, marginBottom: 10, background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1c1917" }}>{getAssignmentTitle(item)}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{item.feedback || t("No written feedback added.")}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>{t("Reviewed:")} {formatTeacherDate(item.reviewedAt || item.updatedAt || item.createdAt)}</div>
              </div>
              <div style={{ minWidth: 92, textAlign: "right" }}>
                {(() => {
                  const total = item.assessmentTotal !== undefined && item.assessmentTotal !== null ? item.assessmentTotal : 100;
                  const scorePercent = total > 0 ? (Number(item.score) / total) * 100 : 0;
                  const scoreColor = scorePercent >= 75 ? "#10b981" : scorePercent >= 60 ? "#f59e0b" : "#ef4444";
                  return <div style={{ fontSize: 24, fontWeight: 900, color: scoreColor }}>{item.score}/{total}</div>;
                })()}
                <StatusBadge status={item.status} />
              </div>
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function AssignmentsTab({ assignments = [], onSubmitAssignment }) {
  const [filter, setFilter] = useState("all");
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileObj(file);
      setSelectedFile({ name: file.name, size: (file.size / (1024 * 1024)).toFixed(2) + " MB" });
      if (!title) {
        setTitle(file.name.split(".")[0]);
      }
    }
  };

  const handleCloseModal = () => {
    setUploadModal(false);
    setSelectedFile(null);
    setSelectedFileObj(null);
    setSelectedAssignmentId(null);
    setNote("");
    setTitle("");
  };

  const handleSubmit = async () => {
    if (!selectedAssignmentId) return;
    setSubmitting(true);
    try {
      let uploadedFile = null;
      if (selectedFileObj) {
        const uploadRes = await uploadFile(selectedFileObj);
        if (uploadRes && uploadRes.asset) {
          uploadedFile = {
            asset: uploadRes.asset._id,
            name: uploadRes.asset.originalName || selectedFileObj.name,
            url: uploadRes.asset.publicUrl,
            uploadedAt: new Date().toISOString()
          };
        }
      }

      await onSubmitAssignment(selectedAssignmentId, {
        status: "submitted",
        title: title || undefined,
        feedback: note || "",
        submissionFiles: uploadedFile ? [uploadedFile] : undefined,
        score: null
      });
      handleCloseModal();
    } catch (err) {
      alert("Failed to submit assignment: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = assignments.filter(a => a.status === "assigned").length;
  const revisionCount = assignments.filter(a => a.status === "revision").length;
  const submittedCount = assignments.filter(a => a.status === "submitted" || a.status === "pending").length;
  const reviewedCount = assignments.filter(isReviewedAssignment).length;
  const visibleAssignments = assignments.filter((item) => {
    if (filter === "todo") return item.status === "assigned" || item.status === "revision";
    if (filter === "submitted") return item.status === "submitted" || item.status === "pending";
    if (filter === "reviewed") return isReviewedAssignment(item) || item.status === "approved" || item.status === "reviewed";
    return true;
  });
  const filterBtn = (key, label) => (
    <button onClick={() => setFilter(key)} style={{ ...S.exportBtn, background: filter === key ? "#d97706" : "white", color: filter === key ? "white" : "#6b7280", borderColor: filter === key ? "#d97706" : "#e5e7eb" }}>
      {label}
    </button>
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={S.pageTitle}>My Assignments</h1>
          <p style={S.pageSub}>{pendingCount} assigned · {revisionCount} needs revision</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 18 }}>
        <StatCard icon="✏️" label="To Submit" val={pendingCount + revisionCount} color="#f59e0b" bg="#fef3c7" />
        <StatCard icon="📤" label="Submitted" val={submittedCount} color="#3b82f6" bg="#dbeafe" />
        <StatCard icon="✅" label="Reviewed" val={reviewedCount} color="#10b981" bg="#d1fae5" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {filterBtn("all", "All")}
        {filterBtn("todo", "To submit")}
        {filterBtn("submitted", "Submitted")}
        {filterBtn("reviewed", "Reviewed")}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visibleAssignments.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", background: "white", borderRadius: 16, border: "1px dashed #cbd5e1", color: "#94a3b8" }}>
            No assignments assigned yet.
          </div>
        ) : (
          visibleAssignments.map(a => (
            <div key={a._id} style={{ background: "white", borderRadius: 14, padding: "16px 20px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", borderLeft: `4px solid ${a.status === "approved" || a.status === "reviewed" ? "#10b981" : a.status === "revision" ? "#ef4444" : "#f59e0b"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>{a.status === "approved" || a.status === "reviewed" ? "✅" : a.status === "revision" ? "🔁" : "📝"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>{getAssignmentTitle(a)}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{a.course?.title} · Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No deadline"}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {a.score !== null && a.score !== undefined && <span style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>{a.score}/{a.assessmentTotal !== undefined && a.assessmentTotal !== null ? a.assessmentTotal : 100}</span>}
                  <StatusBadge status={a.status} />
                  {(a.status === "revision" || a.status === "assigned" || a.status === "pending") &&
                    <button
                      onClick={() => {
                        setSelectedAssignmentId(a._id);
                        setTitle(a.title || "");
                        setUploadModal(true);
                      }}
                      style={{ ...S.primaryBtn, padding: "6px 12px", fontSize: 12 }}
                    >
                      {a.status === "revision" ? "Resubmit" : a.status === "pending" ? "Update Submission" : "Submit"}
                    </button>
                  }
                </div>
              </div>
              {a.status === "revision" && a.feedback && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, fontSize: 12, color: "#991b1b" }}>
                  ⚠️ Revision required. Admin feedback: <b>{a.feedback}</b>
                </div>
              )}
              {a.status === "approved" && a.feedback && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#166534" }}>
                  ✓ Feedback: <b>{a.feedback}</b>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {uploadModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 20, padding: "28px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1c1917", margin: 0 }}>Submit Assignment</h3>
              <button onClick={handleCloseModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <label style={S.label}>Assignment Title</label>
            <input style={{ ...S.input, marginBottom: 12 }} value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter assignment title" />
            <label style={S.label}>Upload File</label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.ppt,.pptx" style={{ display: "none" }} />
            <div onClick={() => fileInputRef.current?.click()} style={{ border: "2px dashed #fbbf24", borderRadius: 12, padding: "24px", textAlign: "center", marginBottom: 16, background: "#fffbeb", cursor: "pointer" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
              {selectedFile ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>📄 File Added Successfully!</div>
                  <div style={{ fontSize: 12, color: "#374151", marginTop: 4, fontWeight: 600, wordBreak: "break-all" }}>{selectedFile.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Size: {selectedFile.size}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>Click to add from your device</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>PDF, DOCX, PPT up to 10MB</div>
                </>
              )}
            </div>
            <label style={S.label}>Notes (Optional)</label>
            <textarea style={{ ...S.input, height: 70, resize: "none", marginBottom: 20 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Any notes for the reviewer..." />
            <button onClick={handleSubmit} disabled={submitting} style={{ ...S.primaryBtn, width: "100%" }}>
              {submitting ? "Uploading & Submitting..." : "📤 Submit Assignment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CertificatesTab({ assignments = [], certificates: certs = [] }) {
  const displayCerts = certs.length > 0
    ? certs.filter((c) => c.score !== null && c.score !== undefined)
    : assignments.filter((item) =>
      (item.status === "completed" || item.progressPercent === 100 || item.status === "approved") &&
      item.score !== null && item.score !== undefined
    );

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={S.pageTitle}>Certificates</h1>
      <p style={S.pageSub}>{displayCerts.length} certificate eligible course{displayCerts.length === 1 ? "" : "s"}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
        {displayCerts.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", background: "white", borderRadius: 16, border: "1px dashed #cbd5e1", color: "#94a3b8" }}>
            Certificates will appear after an assigned course is completed and reviewed.
          </div>
        ) : displayCerts.map((item) => {
          const isRealCert = !!item.certificateNumber;
          const issuedDate = isRealCert ? item.issuedAt : (item.completedAt || item.updatedAt || item.createdAt);
          const courseTitle = item.course?.title || item.title || "Completed Course";
          const certId = isRealCert ? item.certificateNumber : `SPC-${String(item._id || "pending").slice(-8).toUpperCase()}`;
          return (
            <div key={item._id} style={{ background: isRealCert ? "linear-gradient(135deg,#fffbeb,#fef3c7)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 16, padding: "24px", border: isRealCert ? "2px solid #fbbf24" : "2px solid #86efac", boxShadow: isRealCert ? "0 4px 20px rgba(245,158,11,0.15)" : "0 4px 20px rgba(34,197,94,0.15)" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1c1917", marginBottom: 8, lineHeight: 1.4 }}>{courseTitle}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {isRealCert && item.grade && <Badge children={`Grade: ${item.grade}`} color="#059669" bg="#d1fae5" />}
                {item.score !== null && item.score !== undefined && (() => {
                  const certTotal = item.assessmentTotal !== undefined && item.assessmentTotal !== null ? item.assessmentTotal : (item.assignment?.assessmentTotal !== undefined && item.assignment?.assessmentTotal !== null ? item.assignment.assessmentTotal : (item.score <= 10 ? 10 : 100));
                  return <Badge children={`Score: ${item.score}/${certTotal}`} color="#059669" bg="#d1fae5" />;
                })()}
                <Badge children={issuedDate ? new Date(issuedDate).toLocaleDateString("en-IN") : "Date pending"} color="#d97706" bg="#fef3c7" />
                {isRealCert && <Badge children={item.status === "issued" ? "Issued" : item.status} color="#7c3aed" bg="#ede9fe" />}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Credential ID: {certId}</div>
              {/* Start: Dnyaneshwari Thorat */}
              {isRealCert && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={async () => {
                      try {
                        await viewCertificatePdf(item._id);
                      } catch (err) {
                        alert(err.message || "Failed to view certificate. Please try again.");
                      }
                    }}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #d97706", background: "white", color: "#d97706", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                  >
                    👁️ View Certificate
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await downloadCertificatePdf(item._id, `Certificate-${item.certificateNumber}.pdf`);
                      } catch (err) {
                        alert(err.message || "Failed to download certificate. Please try again.");
                      }
                    }}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                  >
                    ⬇️ Download
                  </button>
                </div>
              )}
              {/* End: Dnyaneshwari Thorat */}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PROFILE TAB  (Complete Implementation)
───────────────────────────────────────── */
function ProfileTab({ user, onWorkingCenterChange, onUserUpdate }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"

  const [profilePhoto, setProfilePhoto] = useState(user.photoUrl || null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  const teacherProfile = user.teacherProfile || {};
  const center = teacherProfile.center;
  const centerName = center && typeof center === "object" ? [center.name, center.city].filter(Boolean).join(", ") : user.workingCenter;

  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    address: teacherProfile.address || user.address || "",
    workingCenter: centerName || "",
    subject: teacherProfile.subject || user.subject || "",
    degree: teacherProfile.qualification || user.qualification || "",
    expBio: teacherProfile.experience || user.experience || ""
  });

  const [savedForm, setSavedForm] = useState({ ...form });

  useEffect(() => {
    if (user.photoUrl && user.photoUrl !== profilePhoto) {
      setProfilePhoto(user.photoUrl);
      setImageLoadError(false);
    }
  }, [user.photoUrl]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please upload an image file (PNG/JPG/JPEG).");
      setMessageType("error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Image is too large. Please select a photo under 2MB.");
      setMessageType("error");
      return;
    }

    setUploadingPhoto(true);
    setMessage("");
    try {
      const uploadRes = await uploadFile(file);

      if (uploadRes && uploadRes.asset) {
        let photoUrl = uploadRes.asset.publicUrl;

        if (photoUrl.startsWith("/uploads/")) {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
          photoUrl = `${API_BASE_URL}${photoUrl}`;
        }

        setProfilePhoto(photoUrl);
        setImageLoadError(false);

        const res = await updateTeacherMe({ photoUrl });

        if (res.teacher && onUserUpdate) {
          onUserUpdate(res.teacher);
        }

        setMessage("Profile picture updated successfully!");
        setMessageType("success");
      }
    } catch (error) {
      setMessage(error.message || "Failed to upload profile picture.");
      setMessageType("error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        photoUrl: profilePhoto,
        teacherProfile: {
          address: form.address,
          subject: form.subject,
          qualification: form.degree,
          experience: form.expBio
        }
      };
      console.log("Profile save payload:", payload);

      const res = await updateTeacherMe(payload);

      const updated = res.teacher || {};

      const updatedCenter = updated.teacherProfile?.center;
      const updatedCenterName = typeof updatedCenter === "object" ? [updatedCenter.name, updatedCenter.city].filter(Boolean).join(", ") : form.workingCenter;

      const nextForm = {
        ...form,
        name: updated.name || form.name,
        phone: updated.phone || form.phone,
        address: updated.teacherProfile?.address || form.address,
        subject: updated.teacherProfile?.subject || form.subject,
        degree: updated.teacherProfile?.qualification || form.degree,
        expBio: updated.teacherProfile?.experience || form.expBio,
        workingCenter: updatedCenterName
      };

      setForm(nextForm);
      setSavedForm(nextForm);

      if (updated.photoUrl && updated.photoUrl !== profilePhoto) {
        setProfilePhoto(updated.photoUrl);
      }

      if (onUserUpdate) {
        onUserUpdate(updated);
      }

      onWorkingCenterChange && onWorkingCenterChange(updatedCenterName);
      setMessage("Profile saved successfully!");
      setMessageType("success");
      setEditing(false);
    } catch (error) {
      setMessage(error.message || "Profile update failed.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage("Please fill in all password fields.");
      setMessageType("error");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage("New password must be at least 8 characters long.");
      setMessageType("error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("New password and confirm password do not match.");
      setMessageType("error");
      return;
    }

    setChangingPassword(true);
    try {
      await changeTeacherPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMessage("Password changed successfully!");
      setMessageType("success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setMessage(error.message || "Failed to change password.");
      setMessageType("error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancel = () => {
    setForm({ ...savedForm });
    setEditing(false);
    setMessage("");
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 800 }}>
      <Toast msg={message} type={messageType} onClose={() => { setMessage(""); setMessageType(""); }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div>
          <h1 style={S.pageTitle}>My Profile</h1>
          <p style={S.pageSub}>View and manage your account information</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {editing && (
            <button onClick={handleCancel} style={S.exportBtn} disabled={saving}>✕ Cancel</button>
          )}
          <button
            onClick={editing ? handleSave : () => setEditing(true)}
            style={editing ? { ...S.primaryBtn, background: "linear-gradient(135deg,#10b981,#059669)", opacity: saving ? 0.7 : 1 } : S.primaryBtn}
            disabled={saving}
          >
            {editing ? (saving ? "💾 Saving..." : "💾 Save Changes") : "✏️ Edit Profile"}
          </button>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 20, padding: "28px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1c1917", margin: "0 0 16px" }}>📷 Profile Picture</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative" }}>
            {profilePhoto && !imageLoadError ? (
              <img
                src={profilePhoto}
                alt="Profile"
                style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "3px solid #f59e0b" }}
                onError={(e) => {
                  console.error("Image failed to load:", profilePhoto);
                  console.error("Error event:", e);
                  setImageLoadError(true);
                }}
                onLoad={() => {
                  console.log("Image loaded successfully:", profilePhoto);
                  setImageLoadError(false);
                }}
              />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800, color: "white" }}>
                {form.name?.[0] || "U"}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: "50%", background: "#f59e0b", border: "2px solid white", color: "white", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? "⏳" : "📷"}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              {uploadingPhoto ? "Uploading..." : profilePhoto && !imageLoadError ? "Profile picture uploaded" : "No profile picture"}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              Upload a professional photo (PNG/JPG, max 2MB)
            </div>
            {imageLoadError && (
              <div style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}>
                Failed to load image
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 20, padding: "28px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1c1917", margin: "0 0 16px" }}>👤 Personal Information</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={S.label}>Full Name</label>
            {editing ? (
              <input
                style={{ ...S.input, padding: "8px 12px", fontSize: 14, background: "white" }}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
              />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1c1917", padding: "8px 0" }}>{form.name}</div>
            )}
          </div>

          <div>
            <label style={S.label}>Email Address</label>
            <div style={{ fontSize: 14, color: "#6b7280", padding: "8px 0" }}>{user.email}</div>
          </div>

          <div>
            <label style={S.label}>Phone Number</label>
            {editing ? (
              <input
                style={{ ...S.input, padding: "8px 12px", fontSize: 14, background: "white" }}
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            ) : (
              <div style={{ fontSize: 14, color: "#374151", padding: "8px 0" }}>{form.phone || "Not added"}</div>
            )}
          </div>

          <div>
            <label style={S.label}>Subject Specialization</label>
            {editing ? (
              <input
                style={{ ...S.input, padding: "8px 12px", fontSize: 14, background: "white" }}
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Mathematics"
              />
            ) : (
              <div style={{ fontSize: 14, color: "#374151", padding: "8px 0" }}>{form.subject || "Not specified"}</div>
            )}
          </div>
        </div>

        <div>
          <label style={S.label}>Residential Address</label>
          {editing ? (
            <textarea
              style={{ ...S.input, height: 80, fontSize: 14, background: "white", resize: "vertical" }}
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Your complete address"
            />
          ) : (
            <div style={{ fontSize: 14, color: "#374151", padding: "8px 0", lineHeight: 1.5 }}>{form.address || "Not added"}</div>
          )}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 20, padding: "28px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1c1917", margin: "0 0 16px" }}>💼 Professional Information</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={S.label}>Highest Qualification</label>
            {editing ? (
              <input
                style={{ ...S.input, padding: "8px 12px", fontSize: 14, background: "white" }}
                value={form.degree}
                onChange={e => setForm({ ...form, degree: e.target.value })}
                placeholder="e.g. B.Ed, M.Ed"
              />
            ) : (
              <div style={{ fontSize: 14, color: "#374151", padding: "8px 0" }}>{form.degree || "Not specified"}</div>
            )}
          </div>

          <div>
            <label style={S.label}>Working Center</label>
            <div style={{ fontSize: 14, color: "#374151", padding: "8px 0" }}>{form.workingCenter || "Not assigned"}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: -4 }}>(Assigned by admin)</div>
          </div>
        </div>

        <div>
          <label style={S.label}>Professional Work Experience</label>
          {editing ? (
            <textarea
              style={{ ...S.input, height: 100, fontSize: 14, background: "white", resize: "vertical" }}
              value={form.expBio}
              onChange={e => setForm({ ...form, expBio: e.target.value })}
              placeholder="Describe your teaching experience, previous roles, and achievements..."
            />
          ) : (
            <div style={{ fontSize: 14, color: "#374151", padding: "8px 0", lineHeight: 1.6 }}>{form.expBio || "No experience details added"}</div>
          )}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 20, padding: "28px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1c1917", margin: "0 0 16px" }}>🔐 Account Information</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={S.label}>Account Status</label>
            <div style={{ padding: "8px 0" }}>
              <Badge children={user.status || "Active"} color={user.status === "approved" ? "#059669" : "#d97706"} bg={user.status === "approved" ? "#d1fae5" : "#fef3c7"} />
            </div>
          </div>

          <div>
            <label style={S.label}>Role</label>
            <div style={{ fontSize: 14, color: "#374151", padding: "8px 0", textTransform: "capitalize" }}>{user.role || "Teacher"}</div>
          </div>

          <div>
            <label style={S.label}>Batch/Cohort</label>
            <div style={{ fontSize: 14, color: "#374151", padding: "8px 0" }}>{user.batch || "SpacECE"}</div>
          </div>

          <div>
            <label style={S.label}>Member Since</label>
            <div style={{ fontSize: 14, color: "#374151", padding: "8px 0" }}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not available"}
            </div>
          </div>

          <div>
            <label style={S.label}>{t("teacherLanguage")}</label>
            <div style={{ padding: "4px 0" }}>
              <select
                style={{ ...S.input, padding: "6px 10px", background: "white", maxWidth: 160, fontSize: 12 }}
                value={getCurrentLanguage()}
                onChange={async (e) => {
                  const newLang = e.target.value;
                  setLanguage(newLang);
                  try {
                    await updateTeacherLanguage(newLang);
                    setMessage(t("Language") + " updated! Changes applied instantly.");
                    setMessageType("success");
                  } catch (err) {
                    console.error("Failed to save language preference:", err);
                    setMessage("Language updated locally");
                    setMessageType("success");
                  }
                }}
              >
                {getLanguageList().map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Language applies instantly — no reload needed.</div>
            </div>
          </div>

          <div>
            <label style={S.label}>{t("preferredNotification") || "Preferred Notification Channel"}</label>
            <div style={{ padding: "4px 0" }}>
              <select
                style={{ ...S.input, padding: "6px 10px", background: "white", maxWidth: 160, fontSize: 12 }}
                value={user.preferredNotificationChannel || "in_app"}
                onChange={async (e) => {
                  const newChannel = e.target.value;
                  try {
                    await updateTeacherNotificationPreference(newChannel);
                    setMessage("Notification preference saved!");
                    setMessageType("success");
                  } catch (err) {
                    console.error("Failed to save notification preference:", err);
                    setMessage("Notification preference updated locally");
                    setMessageType("success");
                  }
                }}
              >
                <option value="in_app">In-App Only</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="all">All Channels</option>
              </select>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Choose how you receive notifications.</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 20, padding: "28px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1c1917", margin: "0 0 16px" }}>🔒 Change Password</h3>

        <form onSubmit={handlePasswordChange}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={S.label}>Current Password</label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...S.input, paddingRight: "40px" }}
                  type={showPassword.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  disabled={changingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#9ca3af" }}
                >
                  {showPassword.current ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label style={S.label}>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...S.input, paddingRight: "40px" }}
                  type={showPassword.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Min. 8 characters"
                  disabled={changingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#9ca3af" }}
                >
                  {showPassword.new ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label style={S.label}>Confirm New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...S.input, paddingRight: "40px" }}
                  type={showPassword.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  disabled={changingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#9ca3af" }}
                >
                  {showPassword.confirm ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={{ ...S.primaryBtn, background: "linear-gradient(135deg,#ef4444,#dc2626)", opacity: changingPassword ? 0.7 : 1 }}
            disabled={changingPassword}
          >
            {changingPassword ? "Updating Password..." : "🔒 Update Password"}
          </button>
        </form>

        <div style={{ marginTop: 12, padding: "12px", background: "#fef3c7", borderRadius: 8, border: "1px solid #fbbf24" }}>
          <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700, marginBottom: 4 }}>🔐 Security Tips:</div>
          <ul style={{ fontSize: 11, color: "#78350f", margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
            <li>Use a strong password with at least 8 characters</li>
            <li>Include a mix of letters, numbers, and special characters</li>
            <li>Don't reuse passwords from other accounts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({ notifications = [], onMarkRead, onMarkAllRead }) {
  // Start: Dnyaneshwari Thorat
  const icons = {
    // course-related
    course: "📚", course_assigned: "📚", course_allocated: "📚",
    // certificate
    certificate: "🏆", certificate_issued: "🏆", certificate_generated: "🏆",
    // lesson / session
    session: "📹", lesson: "📖", lesson_assigned: "📖",
    // assignment / task
    assignment: "📝", task: "📝", daily_task: "📝",
    // approvals
    approval: "✅", approved: "✅", status: "✅",
    // attendance
    attendance: "📋", attendance_alert: "⚠️",
    // general
    info: "ℹ️", warning: "⚠️", alert: "🔔", system: "⚙️",
  };
  const getIcon = (type) => {
    if (!type) return "🔔";
    const lower = String(type).toLowerCase();
    return icons[lower] || "🔔";
  };
  // End: Dnyaneshwari Thorat

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={S.pageTitle}>Notifications</h1>
          <p style={S.pageSub}>{notifications.filter(n => !n.read).length} unread</p>
        </div>
        <button onClick={onMarkAllRead} style={S.exportBtn}>✓ Mark all read</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", background: "white", borderRadius: 16, border: "1px dashed #cbd5e1", color: "#94a3b8" }}>
            No notifications.
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} onClick={() => !n.read && onMarkRead(n.id)} style={{ background: n.read ? "white" : "#fffbeb", borderRadius: 14, padding: "14px 18px", border: `1px solid ${n.read ? "#f1f5f9" : "#fbbf24"}`, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", borderLeft: `4px solid ${n.read ? "#e5e7eb" : "#f59e0b"}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: n.read ? "#f3f4f6" : "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{getIcon(n.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: "#1c1917" }}>{n.msg}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{n.time}</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TeacherFeedbackTab({ user, setToast }) {
  const [rating, setRating] = useState(0);
  const [trainerRating, setTRating] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [course, setCourse] = useState("");
  const [tag, setTag] = useState("Content Quality");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const TAGS = ["Content Quality", "Platform UX", "Trainer", "Schedule", "Price"];
  const stars = (n, size = 20) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ fontSize: size, cursor: "pointer", color: i < n ? "#f59e0b" : "#e5e7eb" }}>{i < n ? "★" : "☆"}</span>
  ));

  useEffect(() => {
    getFeedbacks()
      .then(data => {
        const mine = (data.feedbacks || []).filter(f =>
          (f.learner && f.learner !== "Anonymous" && f.learner === user.name) ||
          (f.teacherId && String(f.teacherId) === String(user._id))
        );
        setMyFeedbacks(mine);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { setToast?.({ msg: "Please rate the course.", type: "error" }); return; }
    if (!suggestion.trim()) { setToast?.({ msg: "Please write your feedback.", type: "error" }); return; }
    setSubmitting(true);
    try {
      const trainerRatingPayload = trainerRating > 0 ? trainerRating : undefined;
      await submitFeedback({
        learner: anonymous ? "Anonymous" : user.name,
        teacherId: user._id,
        course: course || "General Training",
        ...(trainerRatingPayload !== undefined ? { trainerRating: trainerRatingPayload } : {}),
        rating,
        tag,
        suggestion,
        anonymous,
        status: "pending"
      });
      setToast?.({ msg: "Feedback submitted successfully! Thank you.", type: "success" });
      setSuggestion(""); setRating(0); setTRating(0); setCourse(""); setAnonymous(false);
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to submit feedback.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={S.pageTitle}>Submit Feedback</h1>
      <p style={S.pageSub}>Share your training experience and help us improve.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <SectionCard title="📝 New Feedback">
          <form onSubmit={handleSubmit}>
            <label style={S.label}>Course / Training (optional)</label>
            <input style={{ ...S.input, marginBottom: 12 }} value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. Child Development Basics" />

            <label style={S.label}>Tag / Category</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {TAGS.map(tg => (
                <button type="button" key={tg} onClick={() => setTag(tg)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, border: "1.5px solid", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    borderColor: tag === tg ? "#f59e0b" : "#e5e7eb",
                    background: tag === tg ? "#fef3c7" : "white",
                    color: tag === tg ? "#92400e" : "#6b7280"
                  }}>
                  {tg}
                </button>
              ))}
            </div>

            <label style={S.label}>Course Rating *</label>
            <div style={{ display: "flex", gap: 4, marginBottom: 12, cursor: "pointer" }}>
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} onClick={() => setRating(i)} style={{ fontSize: 28, color: i <= rating ? "#f59e0b" : "#e5e7eb" }}>
                  {i <= rating ? "★" : "☆"}
                </span>
              ))}
              {rating > 0 && <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8, alignSelf: "center" }}>{rating}/5</span>}
            </div>

            <label style={S.label}>Trainer Rating</label>
            <div style={{ display: "flex", gap: 4, marginBottom: 12, cursor: "pointer" }}>
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} onClick={() => setTRating(i)} style={{ fontSize: 22, color: i <= trainerRating ? "#f59e0b" : "#e5e7eb" }}>
                  {i <= trainerRating ? "★" : "☆"}
                </span>
              ))}
            </div>

            <label style={S.label}>Your Feedback *</label>
            <textarea style={{ ...S.input, height: 100, resize: "vertical", marginBottom: 12 }}
              value={suggestion} onChange={e => setSuggestion(e.target.value)}
              placeholder="Share your thoughts about the course content, trainer, or overall experience..." />

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div onClick={() => setAnonymous(!anonymous)}
                style={{ width: 38, height: 22, borderRadius: 11, background: anonymous ? "#6366f1" : "#e5e7eb", position: "relative", cursor: "pointer", transition: "background 0.3s" }}>
                <div style={{ position: "absolute", top: 2, left: anonymous ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
              <label style={{ fontSize: 12, color: "#374151", fontWeight: 600, cursor: "pointer" }} onClick={() => setAnonymous(!anonymous)}>
                🔒 Submit anonymously
              </label>
            </div>

            <button type="submit" disabled={submitting} style={{ ...S.primaryBtn, width: "100%" }}>
              {submitting ? "Submitting..." : "📤 Submit Feedback"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="📋 My Previous Submissions">
          {loading ? (
            <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>Loading...</div>
          ) : myFeedbacks.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 13 }}>You haven't submitted any feedback yet.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myFeedbacks.map((f, i) => (
                <div key={f._id || i} style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 12, border: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>{f.course || "General"}</div>
                    <StatusBadge status={f.status || "pending"} />
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map(j => <span key={j} style={{ fontSize: 14, color: j <= f.rating ? "#f59e0b" : "#e5e7eb" }}>★</span>)}
                    <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 4 }}>{f.rating}/5</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>"{(f.suggestion || "").substring(0, 80)}..."</div>
                  {f.adminResponse && (
                    <div style={{ marginTop: 8, padding: "6px 10px", background: "#f0f9ff", borderRadius: 8, fontSize: 11, color: "#0369a1" }}>
                      💬 Admin: {f.adminResponse}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
                    {f.tag} · {f.date || new Date(f.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
// Snehal change: real sessions + status tracking + feedback connected to backend
/* ═══════════════════════════════════════════
   PARENT CAPACITY BUILDING TAB
═══════════════════════════════════════════ */
function ParentCapacityBuildingTab({ user, setToast }) {
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [sessionLang, setSessionLang] = useState("en");

  useEffect(() => {
    getParentModules({ lang: sessionLang })
      .then(res => {
        const list = res?.modules || [];
        setModules(list);
        if (list.length) setSelectedModuleId(prev => prev || list[0]._id);
      })
      .catch(() => setToast?.({ msg: "Failed to load modules.", type: "error" }));
  }, [sessionLang]);

  const selectedModule = modules.find(m => m._id === selectedModuleId);

  // Snehal change: real per-teacher session status, fetched from backend
  const [sessionAssignments, setSessionAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const loadAssignments = () => {
    if (!selectedModuleId) return;
    setAssignmentsLoading(true);
    getParentSessionAssignments(selectedModuleId)
      .then(res => setSessionAssignments(res?.assignments || []))
      .catch(() => setToast?.({ msg: "Failed to load session status.", type: "error" }))
      .finally(() => setAssignmentsLoading(false));
  };

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleId]);

  const getAssignment = (sessionNumber) =>
    sessionAssignments.find(a => a.sessionNumber === sessionNumber);

  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const [sessionDetails, setSessionDetails] = useState({ date: "", duration: "", venue: "", parentsPresent: "" });
  const [participants, setParticipants] = useState([{ parentName: "", childName: "", contact: "", attendance: "Present" }]);
  const [feedback, setFeedback] = useState({
    parentParticipation: 0, parentEngagement: 0, understandingLevel: "Good",
    questionsAsked: "", challengesFaced: "", suggestions: "", overallRating: 0, remarks: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Snehal change: photo + attendance sheet upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [attendanceFile, setAttendanceFile] = useState(null);
  const photoInputRef = useRef(null);
  const attendanceInputRef = useRef(null);

  const statusColor = (status) => {
    if (status === "Completed") return { c: "#059669", bg: "#d1fae5" };
    if (status === "In Progress") return { c: "#2563eb", bg: "#dbeafe" };
    return { c: "#d97706", bg: "#fef3c7" };
  };

  const openFeedback = (sess) => {
    const assignment = getAssignment(sess.sessionNumber);
    setSelectedSession(sess);
    setSelectedAssignment(assignment);
    setSessionDetails({ date: new Date().toISOString().split("T")[0], duration: "", venue: "", parentsPresent: "" });
    setParticipants([{ parentName: "", childName: "", contact: "", attendance: "Present" }]);
    setFeedback({ parentParticipation: 0, parentEngagement: 0, understandingLevel: "Good", questionsAsked: "", challengesFaced: "", suggestions: "", overallRating: 0, remarks: "" });
    setPhotoFile(null);
    setAttendanceFile(null);
    setFeedbackOpen(true);
  };

  const handleAddParticipant = () => {
    setParticipants([...participants, { parentName: "", childName: "", contact: "", attendance: "Present" }]);
  };

  const handleParticipantChange = (idx, field, value) => {
    const updated = [...participants];
    updated[idx][field] = value;
    setParticipants(updated);
  };

  // Snehal change: real submit — uploads files, then saves feedback + marks Completed
  const handleSubmitFeedback = async () => {
    if (!feedback.overallRating) {
      setToast?.({ msg: "Please give an overall session rating.", type: "error" });
      return;
    }
    if (!selectedAssignment?._id) {
      setToast?.({ msg: "Session assignment not found. Please refresh and try again.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      let photoUploadId, attendanceSheetUploadId;

      if (photoFile) {
        const photoRes = await uploadFile(photoFile);
        photoUploadId = photoRes?.asset?._id;
      }
      if (attendanceFile) {
        const attRes = await uploadFile(attendanceFile);
        attendanceSheetUploadId = attRes?.asset?._id;
      }

      await submitParentSessionFeedback(selectedAssignment._id, {
        sessionDetails,
        participants,
        feedback,
        photoUploadId,
        attendanceSheetUploadId
      });

      setToast?.({ msg: "Feedback submitted successfully!", type: "success" });
      setFeedbackOpen(false);
      setSelectedSession(null);
      setSelectedAssignment(null);
      loadAssignments();
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to submit feedback.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const stars = (value, onChange, size = 22) => (
    <div style={{ display: "flex", gap: 4, cursor: "pointer" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} onClick={() => onChange(i)} style={{ fontSize: size, color: i <= value ? "#f59e0b" : "#e5e7eb" }}>{i <= value ? "★" : "☆"}</span>
      ))}
    </div>
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={S.pageTitle}>Parent Capacity Building</h1>
      <p style={S.pageSub}>Sessions assigned to you by the admin</p>

      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <select
          style={{ ...S.input, maxWidth: 340, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", background: "white", fontWeight: 600, fontSize: 13, color: "#1c1917", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", outline: "none" }}
          value={selectedModuleId}
          onChange={e => setSelectedModuleId(e.target.value)}
        >
          {modules.map(m => (
            <option key={m._id} value={m._id}>Module {m.moduleNumber}: {m.title}</option>
          ))}
        </select>

        <select
          style={{ ...S.input, maxWidth: 160, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", background: "white", fontWeight: 600, fontSize: 13, color: "#1c1917", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", outline: "none" }}
          value={sessionLang}
          onChange={e => setSessionLang(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="mr">मराठी</option>
        </select>
      </div>

      {selectedModule && (
        <SectionCard title="">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedModule.sessions.map(sess => {
              // Snehal change: pull real status for this session
              const assignment = getAssignment(sess.sessionNumber);
              const status = assignment?.status || "Pending";
              const sc = statusColor(status);
              return (
                <div key={sess.sessionNumber} style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 14, padding: "16px 20px", borderLeft: "4px solid #3b82f6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>Session {sess.sessionNumber}: {sess.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{sess.objective}</div>
                    </div>
                    <Badge children={status} color={sc.c} bg={sc.bg} />
                  </div>

                  <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#fef3c7", textAlign: "left" }}>
                        <th style={{ padding: "6px 8px" }}>Time</th>
                        <th style={{ padding: "6px 8px" }}>Activity</th>
                        <th style={{ padding: "6px 8px" }}>Key Focus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sess.activities.map((a, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "6px 8px" }}>{a.time}</td>
                          <td style={{ padding: "6px 8px" }}>{a.activity}</td>
                          <td style={{ padding: "6px 8px" }}>{a.keyFocus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sess.homePractice && (
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>Home Practice: {sess.homePractice}</div>
                  )}
                {sess.content?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Content</div>
                      {sess.content.map((block, ci) => (
                        <div key={ci} style={{ marginBottom: 8 }}>
                          {block.heading && <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917" }}>{block.heading}</div>}
                          <div style={{ fontSize: 12, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{block.body}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sess.reflection && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#1c1917", marginBottom: 6 }}>Reflection</div>
                      <div style={{ fontSize: 12, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{sess.reflection}</div>
                    </div>
                  )}
                  {/* Snehal change: Mark as Completed / Start Session button */}
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                    {status === "Completed" ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>✓ Session Completed</span>
                    ) : (
                      <button
                        onClick={() => openFeedback(sess)}
                        disabled={assignmentsLoading}
                        style={{ ...S.primaryBtn, padding: "8px 16px", fontSize: 12 }}
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {feedbackOpen && selectedSession && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 20, padding: "28px", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1c1917", margin: 0 }}>Session Feedback — {selectedSession.title}</h3>
              <button onClick={() => setFeedbackOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>

            <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1c1917", marginBottom: 10 }}>Session Details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>Session Date</label>
                <input style={S.input} type="date" value={sessionDetails.date} onChange={e => setSessionDetails({ ...sessionDetails, date: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Duration</label>
                <input style={S.input} placeholder="e.g. 90 mins" value={sessionDetails.duration} onChange={e => setSessionDetails({ ...sessionDetails, duration: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Venue</label>
                <input style={S.input} value={sessionDetails.venue} onChange={e => setSessionDetails({ ...sessionDetails, venue: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Number of Parents Present</label>
                <input style={S.input} type="number" min="0" value={sessionDetails.parentsPresent} onChange={e => setSessionDetails({ ...sessionDetails, parentsPresent: e.target.value })} />
              </div>
            </div>

            <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1c1917", marginBottom: 10 }}>Participants</h4>
            {participants.map((p, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px", gap: 8, marginBottom: 8 }}>
                <input style={S.input} placeholder="Parent Name" value={p.parentName} onChange={e => handleParticipantChange(idx, "parentName", e.target.value)} />
                <input style={S.input} placeholder="Child Name" value={p.childName} onChange={e => handleParticipantChange(idx, "childName", e.target.value)} />
                <input style={S.input} placeholder="Contact Number" value={p.contact} onChange={e => handleParticipantChange(idx, "contact", e.target.value)} />
                <select style={S.input} value={p.attendance} onChange={e => handleParticipantChange(idx, "attendance", e.target.value)}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            ))}
            <button onClick={handleAddParticipant} style={{ ...S.exportBtn, marginBottom: 20 }}>+ Add Participant</button>

            {/* Snehal change: Photo + Attendance Sheet upload */}
            <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1c1917", marginBottom: 10 }}>Uploads</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={S.label}>Session Photo</label>
                <input type="file" ref={photoInputRef} accept="image/*" style={{ display: "none" }}
                  onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                <div onClick={() => photoInputRef.current?.click()} style={{ border: "2px dashed #fbbf24", borderRadius: 10, padding: "14px", textAlign: "center", cursor: "pointer", background: "#fffbeb" }}>
                  <div style={{ fontSize: 20 }}>📷</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: photoFile ? "#059669" : "#92400e" }}>
                    {photoFile ? photoFile.name : "Upload photo"}
                  </div>
                </div>
              </div>
              <div>
                <label style={S.label}>Attendance Sheet</label>
                <input type="file" ref={attendanceInputRef} accept="image/*,.pdf" style={{ display: "none" }}
                  onChange={e => setAttendanceFile(e.target.files?.[0] || null)} />
                <div onClick={() => attendanceInputRef.current?.click()} style={{ border: "2px dashed #fbbf24", borderRadius: 10, padding: "14px", textAlign: "center", cursor: "pointer", background: "#fffbeb" }}>
                  <div style={{ fontSize: 20 }}>📋</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: attendanceFile ? "#059669" : "#92400e" }}>
                    {attendanceFile ? attendanceFile.name : "Upload attendance sheet"}
                  </div>
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1c1917", marginBottom: 10 }}>Teacher Feedback</h4>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Parent Participation Rating</label>
              {stars(feedback.parentParticipation, (v) => setFeedback({ ...feedback, parentParticipation: v }))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Parent Engagement Rating</label>
              {stars(feedback.parentEngagement, (v) => setFeedback({ ...feedback, parentEngagement: v }))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Understanding Level</label>
              <select style={S.input} value={feedback.understandingLevel} onChange={e => setFeedback({ ...feedback, understandingLevel: e.target.value })}>
                <option>Excellent</option>
                <option>Good</option>
                <option>Average</option>
                <option>Poor</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Questions Asked</label>
              <textarea style={{ ...S.input, height: 60 }} value={feedback.questionsAsked} onChange={e => setFeedback({ ...feedback, questionsAsked: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Challenges Faced</label>
              <textarea style={{ ...S.input, height: 60 }} value={feedback.challengesFaced} onChange={e => setFeedback({ ...feedback, challengesFaced: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Suggestions</label>
              <textarea style={{ ...S.input, height: 60 }} value={feedback.suggestions} onChange={e => setFeedback({ ...feedback, suggestions: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Overall Session Rating *</label>
              {stars(feedback.overallRating, (v) => setFeedback({ ...feedback, overallRating: v }), 26)}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Additional Remarks</label>
              <textarea style={{ ...S.input, height: 60 }} value={feedback.remarks} onChange={e => setFeedback({ ...feedback, remarks: e.target.value })} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={S.exportBtn} onClick={() => setFeedbackOpen(false)}>Cancel</button>
              <button style={S.primaryBtn} disabled={submitting} onClick={handleSubmitFeedback}>{submitting ? "Submitting..." : "Submit Feedback"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



/* ═══════════════════════════════════════════
   MAIN TEACHER DASHBOARD
═══════════════════════════════════════════ */
export default function TeacherDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [currentUser, setCurrentUser] = useState(user);
  const [showGuide, setShowGuide] = useState(false);
  const [workingCenter, setWorkingCenter] = useState(() => {
    const center = user?.teacherProfile?.center;
    if (typeof center === "object" && center?.name) {
      return [center.name, center.city].filter(Boolean).join(", ");
    }
    return user?.workingCenter || "";
  });

  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({});
  const [certificates, setCertificates] = useState([]);
  const [teacherChildren, setTeacherChildren] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedChildClassId, setSelectedChildClassId] = useState("");
  const [childForm, setChildForm] = useState({ name: "", age: "", gender: "Male", parentName: "", phone: "", email: "", address: "" });
  const [childSaving, setChildSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "bot", text: `Hello ${user.name?.split(" ")[0] || "there"}! I'm your SpaceCE AI Assistant. How can I assist you with your class, attendance, courses, or lesson plans today?` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const refreshCoreData = async () => {
    try {
      const [progressRes, notificationsRes, teacherRes, certificatesRes, classesRes, attRes] = await Promise.all([
        getTeacherProgress(),
        getNotifications(),
        getTeacherMe(),
        getTeacherCertificates(),
        getTeacherClasses(),
        getTeacherAttendance().catch(() => null)
      ]);
      if (progressRes) {
        // Start: Dnyaneshwari Thorat
        const filteredCourses = (progressRes.courses || []).filter(c => {
          if (!c.course) return false;
          const title = c.course.title || "";
          return !title.toLowerCase().includes("ai testing");
        });
        setCourses(filteredCourses);
        // End: Dnyaneshwari Thorat
        setLessons(progressRes.lessons || []);
        setActivities(progressRes.activities || []);

        let attMap = {};
        if (attRes?.records) {
          attRes.records.forEach(record => {
            const dateObj = new Date(record.attendanceDate);
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
            attMap[dateKey] = {
              checkedIn: record.checkedIn ?? (record.status === "present"),
              checkedOut: record.checkedOut ?? false,
              status: record.status || "present"
            };
          });
        }

        setSummary({ ...(progressRes.summary || {}), attendanceMap: attMap });
      }
      if (classesRes?.classes) {
        setTeacherClasses(classesRes.classes);
        if (!selectedChildClassId && classesRes.classes.length > 0) {
          setSelectedChildClassId(classesRes.classes[0]._id || classesRes.classes[0].id);
        }
      }
      if (notificationsRes?.notifications) {
        const mapped = notificationsRes.notifications.map(n => {
          let timeVal = "Just now";
          if (n.createdAt) {
            const diffMs = new Date() - new Date(n.createdAt);
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) timeVal = `${diffMins}m ago`;
            else {
              const diffHrs = Math.floor(diffMins / 60);
              if (diffHrs < 24) timeVal = `${diffHrs}h ago`;
              else timeVal = `${Math.floor(diffHrs / 24)}d ago`;
            }
          }
          return { id: n._id, type: n.type || "info", msg: n.body ? `${n.title}: ${n.body}` : n.title || "", time: timeVal, read: n.read };
        });
        setNotifications(mapped);
      }
      if (teacherRes?.teacher) setCurrentUser(teacherRes.teacher);
      if (certificatesRes?.certificates) setCertificates(certificatesRes.certificates);
    } catch (err) {
      console.error("Error fetching teacher dashboard data:", err);
    }
  };

  useEffect(() => {
    const center = currentUser?.teacherProfile?.center;
    if (center && typeof center === "object" && center.name) {
      const name = [center.name, center.city].filter(Boolean).join(", ");
      setWorkingCenter(name);
    } else if (currentUser?.workingCenter) {
      setWorkingCenter(currentUser.workingCenter);
    }
  }, [currentUser]);

  useEffect(() => {
    setLoading(true);
    refreshCoreData().finally(() => setLoading(false));

    const langHandler = () => refreshCoreData();
    window.addEventListener(LANG_CHANGE_EVENT, langHandler);

    return () => {
      window.removeEventListener(LANG_CHANGE_EVENT, langHandler);
    };
  }, [user]);

  // Start: Dnyaneshwari Thorat
  useEffect(() => {
    const unsubscribe = onSocketEvent("notification:new", (newNotif) => {
      let timeVal = "Just now";
      const mapped = {
        id: newNotif._id,
        type: newNotif.type || "info",
        msg: newNotif.body ? `${newNotif.title}: ${newNotif.body}` : newNotif.title || "",
        time: timeVal,
        read: newNotif.read
      };
      setNotifications((prev) => [mapped, ...prev]);
      setToast({ msg: `🔔 ${newNotif.title}`, type: "info" });
      
      // Dynamically refresh the dashboard if it's an approval, claim, status update, or class/center assignment
      if (
        ["status_update", "approval", "mentor_assigned", "class_assigned", "class_assignment"].includes(newNotif.type) || 
        newNotif.title?.includes("Mentor Assigned") ||
        newNotif.title?.includes("Class Assigned") ||
        newNotif.title?.includes("Center Assigned")
      ) {
        refreshCoreData();
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);
  // End: Dnyaneshwari Thorat

  useEffect(() => {
    if (selectedChildClassId) {
      getTeacherChildren(selectedChildClassId)
        .then(res => { if (res?.children) setTeacherChildren(res.children); })
        .catch(err => console.error("Error loading children for class:", err));
    }
  }, [selectedChildClassId]);

  const handleTabSwitch = (tab) => {
    if (activeTab !== tab) setTabLoading(true);
    setActiveTab(tab);
    setTimeout(() => setTabLoading(false), 300);
  };

  const handleMarkDone = async (assignId, payload) => {
    try {
      await updateCourseAssignmentProgress(assignId, payload);
      setToast({ msg: "Progress saved! ✓", type: "success" });
      refreshCoreData();
    } catch (err) {
      setToast({ msg: "Failed to save progress.", type: "error" });
    }
  };

  const handleSubmitAssignment = async (assignId, payload) => {
    await updateCourseAssignmentProgress(assignId, payload);
    setToast({ msg: "Assignment submitted successfully! 📤", type: "success" });
    refreshCoreData();
  };

  const handleRestartCourse = async (assignment) => {
    if (!assignment?._id) return;
    const title = assignment?.course?.title || assignment?.title || "this course";
    if (!window.confirm(`Restart ${title}? This will remove the certificate and reset course progress back to 0%.`)) return;
    try {
      await resetCourseAssignmentProgress(assignment._id);
      setToast({ msg: `Course restarted: ${title}`, type: "success" });
      await refreshCoreData();
    } catch (err) {
      console.error("Failed to reset course:", err);
      setToast({ msg: err.message || "Failed to restart course.", type: "error" });
    }
  };

  const handleRemoveCourse = async (assignment) => {
    if (!assignment?._id) return;
    const title = assignment?.course?.title || assignment?.title || "this course";
    if (!window.confirm(`Are you sure you want to remove "${title}" from your courses?`)) return;
    try {
      await deleteCourseAssignment(assignment._id);
      setToast({ msg: `Course removed: ${title}`, type: "success" });
      await refreshCoreData();
    } catch (err) {
      console.error("Failed to remove course:", err);
      setToast({ msg: err.message || "Failed to remove course.", type: "error" });
    }
  };
  // End: Dnyaneshwari Thorat

  const handleMarkNotifRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      refreshCoreData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotifRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => markNotificationRead(n.id)));
      setToast({ msg: "All notifications marked as read.", type: "success" });
      refreshCoreData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await askTeacherChatbot(userMsg);
      if (res && res.reply) {
        setChatMessages(prev => [...prev, { sender: "bot", text: res.reply }]);
      } else {
        setChatMessages(prev => [...prev, { sender: "bot", text: "I'm sorry, I'm having trouble connecting right now." }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: "bot", text: "Something went wrong. Please try again later." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingAssignmentsCount = courses.filter(a => a.status === "assigned" || a.status === "revision").length;

  const navItems = [
    { key: "overview", label: currentUser?.role === "fellow" ? "Fellow's Dashboard" : "Teacher's Dashboard", icon: "📊", color: "#3b82f6" },
    { key: "children_att", label: "Daily Attendance", icon: "📋", color: "#22c55e" },
    { key: "geotag", label: "Geotag Attendance", icon: "📍", color: "#ec4899" },
    { key: "training", label: "Training & Lessons", icon: "🎓", color: "#8b5cf6" },
    { key: "planner", label: "AI Lesson Planner", icon: "✏️", color: "#f59e0b" },
    { key: "courses", label: "My Courses", icon: "📚", color: "#06b6d4" },
    { key: "parent_capacity", label: "Parent Capacity Building", icon: "👪", color: "#f97316" },
    { key: "assessment", label: "Assessments", icon: "📝", color: "#ef4444" },
    { key: "certificates", label: "Certificates", icon: "🏆", color: "#eab308" },
    { key: "feedback", label: "Feedback", icon: "💬", color: "#6366f1" },
  ];

  // Start: Fellow-only tabs
  if (currentUser?.role === "fellow") {
    navItems.splice(navItems.length - 1, 0,
      { key: "curriculum", label: t("Curriculum"), icon: "📖", color: "#14b8a6" }
    );
  }
  // End: Fellow-only tabs

  const enrichedUser = { ...currentUser, workingCenter };

  // Pages that are fully wired to backend/database and should render normally.
  // Every other page shows an "Under Construction" placeholder instead.
  // "courses" and "assessment" are now notes/assessment based (no video) —
  // both are fully wired, so they're included here.
  const WORKING_TABS = new Set(["overview", "children_att", "geotag", "profile", "training", "courses", "assessment", "certificates", "notifications", "feedback", "lesson_planner", "parent_capacity", "curriculum", "planner"]);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", fontSize: 16, fontWeight: 700, color: "#64748b" }}>
          🔄 Loading Portal Data...
        </div>
      );
    }
    if (tabLoading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh", fontSize: 14, fontWeight: 600, color: "#d97706" }}>
          🔄 Loading...
        </div>
      );
    }

    if (!WORKING_TABS.has(activeTab)) {
      const navItem = navItems.find(n => n.key === activeTab);
      return <UnderConstructionTab label={navItem ? t(navItem.label) : "This page"} icon={navItem?.icon || "🚧"} />;
    }

    switch (activeTab) {
      case "overview": return <OverviewTab user={enrichedUser} setActiveTab={handleTabSwitch} courses={courses} assignments={courses} lessons={lessons} activities={activities} summary={summary} />;
      case "children_att": return <AttendanceManager user={enrichedUser} onRosterChange={refreshCoreData} />;
      case "geotag": return <GeotagAttendance user={enrichedUser} />;
      case "training": return <TrainingAndClassroomManager user={enrichedUser} />;
      case "planner": return <LessonPlannerTab setToast={setToast} user={enrichedUser} />;
      case "courses":
        return (
          <TeacherCourseNotes
            assignments={courses}
            onMarkDone={handleMarkDone}
            onGoToAssessment={() => handleTabSwitch("assessment")}
            onRestartCourse={handleRestartCourse}
            onRemoveCourse={handleRemoveCourse}
          />
        );
      case "assessment":
        return <ProctoredAssessment assignments={courses} />;
      case "schedule": return <ScheduleTab user={enrichedUser} lessons={lessons} />;
      case "grades": return <GradesTab assignments={courses} />;
      case "assignments": return <AssignmentsTab assignments={courses} onSubmitAssignment={handleSubmitAssignment} />;
      case "parent_capacity": return <ParentCapacityBuildingTab user={enrichedUser} setToast={setToast} />;
      case "curriculum": return <CurriculumTab user={enrichedUser} />;
      case "certificates": return <CertificatesTab assignments={courses} certificates={certificates} />;
      case "notifications": return <NotificationsTab notifications={notifications} onMarkRead={handleMarkNotifRead} onMarkAllRead={handleMarkAllNotifRead} />;
      case "feedback": return <TeacherFeedbackTab user={enrichedUser} setToast={setToast} />;
      case "profile": return <ProfileTab user={enrichedUser} onWorkingCenterChange={setWorkingCenter} onUserUpdate={setCurrentUser} />;
      default: return null;
    }
  };

  const topCenterName = currentUser?.teacherProfile?.center
    ? [currentUser.teacherProfile.center.name, currentUser.teacherProfile.center.city].filter(Boolean).join(", ")
    : (currentUser?.workingCenter || "Center not assigned");
  const topClassNames = (currentUser?.teacherProfile?.classes || []).map(c => c?.name).filter(Boolean);
  const topClassName = topClassNames.length > 0 ? topClassNames.join(", ") : "No class assigned";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc", fontFamily: "'Segoe UI','Inter',-apple-system,sans-serif" }}>
      <style>{globalCSS}</style>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />

      <div style={{ width: 240, background: "white", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 12px rgba(0,0,0,0.04)", position: "relative", height: "100vh" }}>
        <div style={{ padding: "20px 16px 12px" }}>
          <Logo size={120} />
          <div style={{ textAlign: "center", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe", margin: "6px auto 0", display: "inline-block", width: "fit-content" }}>
            🎓 {t(currentUser?.role === "fellow" ? "Fellow Panel" : "Teacher Panel")}
          </div>
        </div>
        <nav style={{ padding: "4px 10px", flex: 1, overflowY: "auto", marginBottom: 80 }}>
          {navItems.map(item => {
            const isActive = activeTab === item.key;
            const accent = item.color || "#3b82f6";
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", border: "none",
                  borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
                  borderRadius: 10,
                  background: isActive ? `${accent}14` : "transparent",
                  color: isActive ? accent : "#6b7280",
                  fontSize: 12, fontWeight: isActive ? 800 : 600, cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left", marginBottom: 2, transition: "all 0.18s"
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: isActive ? accent : `${accent}1A`,
                  color: isActive ? "white" : accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, transition: "all 0.18s"
                }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{t(item.label)}</span>
                {item.badge > 0 && <span style={{ background: "#ef4444", color: "white", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "1px 7px" }}>{item.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{
          position: "fixed", bottom: 0, left: 0, width: 240,
          padding: "12px 16px", borderTop: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", gap: 10, background: "white", zIndex: 50
        }}>
          <SidebarAvatar teacher={currentUser} size={34} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917" }}>{currentUser.name?.split(" ")[0]}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.subject}</div>
          </div>
          <button onClick={onLogout} title={t("Sign Out")}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 22, color: "#ef4444", padding: "8px",
              borderRadius: "8px", transition: "all 0.2s ease",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >⏻</button>
        </div>
      </div>

      <div style={{ flex: 1, width: "0px", minWidth: "0px", padding: "28px 32px", overflowY: "auto", maxHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20, position: "relative" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1c1917", margin: 0, letterSpacing: "-0.3px" }}>
              Hi, {currentUser.name?.split(" ")[0] || (currentUser.role === "fellow" ? "Fellow" : "Teacher")}! 👋
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, background: "#f8fafc", padding: "3px 10px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                📅 {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span style={{ fontSize: 11, color: "#92400e", fontWeight: 600, background: "#fef3c7", padding: "3px 10px", borderRadius: 12, border: "1px solid #fde68a", display: "inline-flex", alignItems: "center", gap: 4 }}>
                📍 {topCenterName}
              </span>
              <span style={{ fontSize: 11, color: "#1e40af", fontWeight: 600, background: "#dbeafe", padding: "3px 10px", borderRadius: 12, border: "1px solid #bfdbfe", display: "inline-flex", alignItems: "center", gap: 4 }}>
                📚 {topClassName}
              </span>

              <span
  style={{
    fontSize: 11,
    color: "#1e40af",
    fontWeight: 600,
    background: "#dbeafe",
    padding: "3px 10px",
    borderRadius: 12,
    border: "1px solid #bfdbfe",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  }}
>
  Mentor: {user.assignedMentor?.name || "Not Assigned"}
</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setShowGuide(true)}
              title={t("User Guide")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 20,
                border: "1px solid #bfdbfe", background: "white",
                color: "#1e40af", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>📖</span>
              {t("User Guide")}
            </button>

            <div
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                padding: "6px 12px", borderRadius: 20, background: "#fef3c7",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #fbbf24",
                transition: "all 0.2s ease", position: "relative"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#fde68a"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#fef3c7"}
            >
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4, background: "#ef4444", color: "white",
                  borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, fontWeight: "bold", border: "2px solid white"
                }}>
                  {unreadCount}
                </span>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>{currentUser.name?.split(" ")[0] || (currentUser.role === "fellow" ? "Fellow" : "Teacher")}</div>
              <div style={{ fontSize: 18, fontWeight: 700, paddingBottom: 6, color: "#92400e" }}>⋮</div>
            </div>

            {menuOpen && (
              <div style={{
                position: "absolute", top: 48, right: 0, background: "white",
                border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                zIndex: 50, minWidth: 180, display: "flex", flexDirection: "column", overflow: "hidden"
              }}>
                <button
                  onClick={() => { setActiveTab("notifications"); setMenuOpen(false); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", border: "none", background: "white", textAlign: "left", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: 14, fontWeight: 600, color: "#374151", transition: "background 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "#fef3c7" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    </div>
                    <span style={{ color: "#374151", fontWeight: 700 }}>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span style={{ background: "#ef4444", color: "white", borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: "bold" }}>
                      {unreadCount} New
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab("profile"); setMenuOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", border: "none", background: "white", textAlign: "left", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: 14, fontWeight: 600, color: "#374151", transition: "background 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "#e0e7ff" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <span style={{ color: "#374151", fontWeight: 700 }}>My Profile</span>
                </button>
                <button
                  onClick={onLogout}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", border: "none", background: "white", textAlign: "left", cursor: "pointer", color: "#dc2626", fontSize: 14, fontWeight: 600, transition: "background 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fef2f2"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "#fee2e2" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  </div>
                  <span style={{ color: "#dc2626", fontWeight: 700 }}>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {renderContent()}
      </div>

      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        {chatOpen && (
          <div style={{ width: 340, height: 460, background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(12px)", border: "1px solid #fbbf24", borderRadius: 20, boxShadow: "0 10px 40px rgba(0,0,0,0.12)", marginBottom: 16, display: "flex", flexDirection: "column", overflow: "hidden", animation: "slideUp 0.3s ease" }}>
            <div style={{ background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)", padding: "16px 20px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.2px" }}>SpaceCE Assistant</div>
                  <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700 }}>Online · Portal Helper</div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "white", fontSize: 18, cursor: "pointer", padding: 0 }}>✕</button>
            </div>
            <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: "#fafbfc" }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: msg.sender === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0",
                    background: msg.sender === "user" ? "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)" : "white",
                    color: msg.sender === "user" ? "white" : "#1c1917",
                    fontSize: 12.5,
                    fontWeight: 600,
                    lineHeight: 1.45,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    border: msg.sender === "user" ? "none" : "1px solid #f1f5f9"
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: "white", padding: "12px 18px", borderRadius: "16px 16px 16px 0", border: "1px solid #f1f5f9", display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ width: 6, height: 6, background: "#d97706", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out both" }} />
                    <span style={{ width: 6, height: 6, background: "#d97706", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out both 0.2s" }} />
                    <span style={{ width: 6, height: 6, background: "#d97706", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out both 0.4s" }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: 12, background: "white", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="Ask about attendance, courses..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendChatMessage()}
                style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: 10, padding: "8px 12px", fontSize: 12, outline: "none", fontWeight: 600 }}
              />
              <button
                onClick={handleSendChatMessage}
                style={{ background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)", border: "none", color: "white", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 6px rgba(217,119,6,0.3)" }}
              >
                ➔
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
            border: "none",
            color: "white",
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(217,119,6,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s ease"
          }}
        >
          💬
        </button>
      </div>

      {showGuide && <TeacherUserGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}