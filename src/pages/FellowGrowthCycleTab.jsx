import { useState, useEffect, useCallback } from "react";
import { Toast, Badge, S } from "../components/Shared";
import {
  getFellowPDCAProgress,
  getFellowPDCAMonth,
  updateFellowPDCAChecklist,
  getFellowAssignedTasks,
  submitTaskEvidence,
  sendPDCANotification,
} from "../services/api";
import { MONTH_TITLES, SEMESTER_LABELS, semesterOf } from "../mentor/monthMeta";
import { MONTH_CURRICULA } from "../mentor/monthCurricula";

const SECTION_META = {
  plan: { label: "Plan", hint: "Monthly learning goals and initial target setup", color: "#4f46e5", bg: "#eef2ff" },
  do: { label: "Do", hint: "Fieldwork, Anganwadi visits, and classroom execution", color: "#d97706", bg: "#fffbeb" },
  check: { label: "Check", hint: "Reflections, outcomes, and progress evaluation", color: "#059669", bg: "#ecfdf5" },
  act: { label: "Act", hint: "Next cycle planning and improvements for upcoming month", color: "#dc2626", bg: "#fef2f2" },
};

// ── Reusable Evidence Form (text + form link + photo) ──
function EvidenceForm({ onSubmit }) {
  const [text, setText] = useState("");
  const [formLink, setFormLink] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const [photoName, setPhotoName] = useState("");

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoBase64(ev.target.result);
      setPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const canSubmit = text.trim() || formLink.trim() || photoBase64;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        type="text"
        placeholder="📝 Describe what you did (required if no photo/link)…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #fdba74", fontSize: 13, boxSizing: "border-box" }}
      />
      <input
        type="url"
        placeholder="🔗 Paste Google Form link or any URL…"
        value={formLink}
        onChange={(e) => setFormLink(e.target.value)}
        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #fdba74", fontSize: 13, boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{
          padding: "7px 14px", borderRadius: 8, border: "1.5px dashed #fdba74",
          background: "white", color: "#92400e", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>
          📷 Upload Photo
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
        </label>
        {photoName && <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>✓ {photoName}</span>}
      </div>
      {photoBase64 && (
        <img src={photoBase64} alt="preview" style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 8, border: "1px solid #fed7aa", objectFit: "cover" }} />
      )}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit({ text, formLink, photoBase64 })}
        style={{
          padding: "9px 18px", borderRadius: 8, border: "none",
          background: canSubmit ? "#ea580c" : "#fca974",
          color: "white", fontWeight: 700, fontSize: 13,
          cursor: canSubmit ? "pointer" : "not-allowed",
          alignSelf: "flex-start",
        }}
      >
        Submit Evidence ✓
      </button>
      <div style={{ fontSize: 11, color: "#92400e" }}>
        💡 Submit any one — text, form link, OR photo. Deliverable auto-marks as Met.
      </div>
    </div>
  );
}

export default function FellowGrowthCycleTab({ user, setToast }) {
  const [monthsSummary, setMonthsSummary] = useState([]);
  const [assignedMentor, setAssignedMentor] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [monthData, setMonthData] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSemFilter, setActiveSemFilter] = useState("all");
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [expandedDeliverable, setExpandedDeliverable] = useState(null); // for Change #3 elaboration
  const [evidenceMap, setEvidenceMap] = useState({}); // { [deliverableId]: { text, file } }
  const [evidenceInput, setEvidenceInput] = useState(""); // temp input value
  // Mentor-assigned custom tasks
  const [mentorTasks, setMentorTasks] = useState([]);
  const [loadingMentorTasks, setLoadingMentorTasks] = useState(false);
  // Evidence modal state
  const [evidenceModal, setEvidenceModal] = useState(null); // { taskId, taskTitle }
  const [evidenceForm, setEvidenceForm] = useState({ text: "", formLink: "", photoBase64: "" });
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  // Load mentor-assigned tasks for selected month
  useEffect(() => {
    if (!selectedMonth) return;
    setLoadingMentorTasks(true);
    getFellowAssignedTasks({ month: selectedMonth })
      .then((res) => { if (res.success) setMentorTasks(res.tasks || []); })
      .catch(() => {})
      .finally(() => setLoadingMentorTasks(false));
  }, [selectedMonth]);

  // 1. Fetch 24-Month Roadmap Progress
  const fetchRoadmap = useCallback(async () => {
    setLoadingRoadmap(true);
    try {
      const res = await getFellowPDCAProgress();
      if (res.success) {
        setMonthsSummary(res.months || []);
        if (res.mentor) setAssignedMentor(res.mentor);

        // Auto-select first in-progress or draft month, or Month 1
        const activeMonth = (res.months || []).find(
          (m) => m.status === "draft" || m.status === "not_started"
        );
        if (activeMonth) {
          setSelectedMonth(activeMonth.month);
        }
      }
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to load growth cycle roadmap.", type: "error" });
    } finally {
      setLoadingRoadmap(false);
    }
  }, [setToast]);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  // 2. Fetch Detailed Info for Selected Month
  const fetchMonthDetails = useCallback(async (mNum) => {
    setLoadingMonth(true);
    setHasUnsavedChanges(false);
    try {
      const res = await getFellowPDCAMonth(mNum);
      if (res.success) {
        setMonthData(res);
        setDeliverables(res.deliverablesStatus || []);
      }
    } catch (err) {
      setToast?.({ msg: err.message || `Failed to load Month ${mNum} data.`, type: "error" });
    } finally {
      setLoadingMonth(false);
    }
  }, [setToast]);

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthDetails(selectedMonth);
    }
  }, [selectedMonth, fetchMonthDetails]);

  // 3. Checklist Handlers for Fellow
  const isMonthLocked = monthData?.isApproved || monthData?.report?.status === "approved";

  const handleToggleSingle = (id) => {
    if (isMonthLocked) return;
    setDeliverables((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const willBeMet = d.status !== "met";
        return {
          ...d,
          status: willBeMet ? "met" : "not_met",
          count: willBeMet ? (d.targetCount || 1) : 0,
          fellowMarked: true,
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleAdjustCount = (id, delta) => {
    if (isMonthLocked) return;
    setDeliverables((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const target = d.targetCount || 1;
        const current = d.count || 0;
        const nextCount = Math.max(0, current + delta);
        const isMet = nextCount >= target;
        return {
          ...d,
          count: nextCount,
          status: isMet ? "met" : "not_met",
          fellowMarked: true,
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleNoteChange = (id, noteText) => {
    if (isMonthLocked) return;
    setDeliverables((prev) =>
      prev.map((d) => (d.id === id ? { ...d, note: noteText, fellowMarked: true } : d))
    );
    setHasUnsavedChanges(true);
  };

  // Evidence Submit — auto-marks deliverable as met
  const handleEvidenceSubmit = (id, evidenceData) => {
    const { text, formLink, photoBase64 } = evidenceData || {};
    if (!text?.trim() && !formLink?.trim() && !photoBase64) return;
    const displayText = text?.trim() || formLink?.trim() || "Photo uploaded";
    setEvidenceMap((prev) => ({
      ...prev,
      [id]: { text: displayText, formLink: formLink?.trim(), photoBase64, submittedAt: new Date().toISOString() },
    }));
    // auto-mark as met
    setDeliverables((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "met", fellowMarked: true, note: `Evidence: ${displayText}` } : d
      )
    );
    setHasUnsavedChanges(true);
    setToast?.({ msg: "Evidence submitted — deliverable marked as Met ✅", type: "success" });
  };

  // Submit evidence for mentor-assigned task
  const handleTaskEvidenceSubmit = async (taskId) => {
    const { text, formLink, photoBase64 } = evidenceForm;
    if (!text?.trim() && !formLink?.trim() && !photoBase64) {
      setToast?.({ msg: "Add at least one piece of evidence.", type: "error" });
      return;
    }
    setSubmittingEvidence(true);
    try {
      const res = await submitTaskEvidence(taskId, { text, formLink, photoUrl: photoBase64 });
      if (res.success) {
        setMentorTasks((prev) => prev.map((t) => t._id === taskId ? res.task : t));
        setEvidenceModal(null);
        setEvidenceForm({ text: "", formLink: "", photoBase64: "" });
        setToast?.({ msg: "Evidence submitted! Your mentor will review it. ✅", type: "success" });

        // 🔔 Alert mentor that fellow submitted evidence for their assigned task
        if (assignedMentor?._id) {
          const taskTitle = mentorTasks.find((t) => t._id === taskId)?.title || "a task";
          sendPDCANotification({
            recipientId: assignedMentor._id,
            type: "evidence_submitted",
            title: "Fellow Submitted Task Evidence 📎",
            body: `${user?.name || "Your fellow"} has submitted evidence for "${taskTitle}". Review it in the Growth Cycle → Add Task tab.`,
          }).catch(() => {});
        }
      }
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to submit evidence.", type: "error" });
    } finally {
      setSubmittingEvidence(false);
    }
  };

  // 4. Save Checklist to Backend
  const handleSaveChecklist = async () => {
    if (isMonthLocked) return;
    setSaving(true);
    try {
      const res = await updateFellowPDCAChecklist(selectedMonth, deliverables);
      if (res.success) {
        setHasUnsavedChanges(false);
        setToast?.({ msg: `Month ${selectedMonth} checklist progress saved! ✅`, type: "success" });
        // Refresh summary so top roadmap updates
        const roadmapRes = await getFellowPDCAProgress();
        if (roadmapRes.success) setMonthsSummary(roadmapRes.months || []);

        // 🔔 Notify mentor if fellow has completed all deliverables for this month
        const allMet = deliverables.length > 0 && deliverables.every((d) => d.status === "met");
        if (allMet && assignedMentor?._id) {
          sendPDCANotification({
            recipientId: assignedMentor._id,
            type: "module_completed",
            title: "Fellow Completed a Module 🎉",
            body: `${user?.name || "Your fellow"} has marked all deliverables as Met for Month ${selectedMonth}. You can now generate and approve their PDCA report.`,
          }).catch(() => {});
        }
      }
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to save checklist.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Statistics
  const metCount = deliverables.filter((d) => d.status === "met").length;
  const totalDeliverables = deliverables.length;
  const progressPercent = totalDeliverables > 0 ? Math.round((metCount / totalDeliverables) * 100) : 0;
  const approvedMonthsCount = monthsSummary.filter((m) => m.status === "approved").length;

  const filteredMonths = monthsSummary.filter((m) =>
    activeSemFilter === "all" ? true : m.semester === Number(activeSemFilter)
  );

  const fallbackCurriculum = MONTH_CURRICULA[selectedMonth] || null;
  const currentObjective = monthData?.monthlyObjective || fallbackCurriculum?.monthlyObjective || "Focus on your designated fellowship learning modules and field objectives for this month.";
  const currentWeeklyFocus = monthData?.weeklyFocus || fallbackCurriculum?.weeklyFocus || [];

  return (
    <div style={{ animation: "fadeIn 0.3s ease", paddingBottom: 40 }}>
      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ ...S.pageTitle, display: "flex", alignItems: "center", gap: 10 }}>
            <span>📈 UMANG Growth Cycle (PDCA)</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "#ede9fe", color: "#6d28d9", border: "1px solid #c4b5fd" }}>
              24-Month Fellowship
            </span>
          </h1>
          <p style={S.pageSub}>
            Track your monthly milestone targets, check off daily & weekly deliverables, and view mentor evaluation reports.
          </p>
        </div>

        {assignedMentor && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>💼</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Assigned Mentor</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{assignedMentor.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Metric Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", borderTop: "4px solid #7c3aed", padding: "14px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#7c3aed" }}>{approvedMonthsCount} / 24</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Months Approved ✅</div>
        </div>
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", borderTop: "4px solid #3b82f6", padding: "14px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Month {selectedMonth}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Current Selected</div>
        </div>
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", borderTop: "4px solid #10b981", padding: "14px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#059669" }}>{metCount} / {totalDeliverables}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Month Deliverables Met</div>
        </div>
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", borderTop: "4px solid #f59e0b", padding: "14px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: progressPercent === 100 ? "#059669" : "#d97706" }}>{progressPercent}%</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Month Completion</div>
        </div>
      </div>

      {/* ── 24-Month Roadmap Navigator ── */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px 20px", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🗺️ Fellowship Roadmap (24 Months)</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>— Click any month to view & track</span>
          </div>

          {/* Semester Tabs Filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Months" },
              { id: 1, label: "Sem 1 (M1-6)" },
              { id: 2, label: "Sem 2 (M7-12)" },
              { id: 3, label: "Sem 3 (M13-18)" },
              { id: 4, label: "Sem 4 (M19-24)" },
            ].map((sem) => (
              <button
                key={sem.id}
                onClick={() => setActiveSemFilter(sem.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: activeSemFilter === sem.id ? "#7c3aed" : "#f1f5f9",
                  color: activeSemFilter === sem.id ? "white" : "#475569",
                  transition: "all 0.15s",
                }}
              >
                {sem.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Card Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))", gap: 10 }}>
          {filteredMonths.map((m) => {
            const isSelected = selectedMonth === m.month;
            const isApproved = m.status === "approved";
            const isDraft = m.status === "draft";

            let badgeBg = "#f1f5f9";
            let badgeColor = "#64748b";
            let badgeText = "Not Started";

            if (isApproved) {
              badgeBg = "#d1fae5";
              badgeColor = "#065f46";
              badgeText = "Approved ✅";
            } else if (isDraft || m.metCount > 0) {
              badgeBg = "#e0e7ff";
              badgeColor = "#3730a3";
              badgeText = "In Progress";
            }

            return (
              <div
                key={m.month}
                onClick={() => setSelectedMonth(m.month)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: isSelected ? "2px solid #7c3aed" : "1px solid #e2e8f0",
                  background: isSelected ? "#f5f3ff" : "white",
                  boxShadow: isSelected ? "0 4px 12px rgba(124,58,237,0.15)" : "none",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: isSelected ? "#7c3aed" : "#0f172a" }}>
                      M{m.month}
                    </span>
                    <span style={{ fontSize: 9.5, fontWeight: 800, background: badgeBg, color: badgeColor, padding: "1px 6px", borderRadius: 4 }}>
                      {badgeText}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", lineHeight: 1.3, marginBottom: 8, minHeight: 28 }}>
                    {m.title}
                  </div>
                </div>

                <div>
                  <div style={{ height: 4, borderRadius: 2, background: "#e2e8f0", overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${m.percent}%`, background: isApproved ? "#10b981" : "#7c3aed" }} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textAlign: "right" }}>
                    {m.metCount}/{m.totalCount}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Selected Month Detail & Action Workspace ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        {/* Top Month Header Card */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", background: "#f3e8ff", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" }}>
                  {SEMESTER_LABELS[semesterOf(selectedMonth)]}
                </span>
                {isMonthLocked && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#065f46", background: "#d1fae5", padding: "2px 8px", borderRadius: 6 }}>
                    ✓ Locked & Approved by Mentor
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: "4px 0" }}>
                Month {selectedMonth}: {MONTH_TITLES[selectedMonth] || `Month ${selectedMonth}`}
              </h2>
            </div>

            {!isMonthLocked && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {hasUnsavedChanges && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>
                    ● Unsaved changes
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveChecklist}
                  disabled={saving || !hasUnsavedChanges}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: hasUnsavedChanges ? "#7c3aed" : "#e2e8f0",
                    color: hasUnsavedChanges ? "white" : "#94a3b8",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: hasUnsavedChanges ? "pointer" : "not-allowed",
                    boxShadow: hasUnsavedChanges ? "0 2px 8px rgba(124,58,237,0.3)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {saving ? "Saving…" : "💾 Save My Progress"}
                </button>
              </div>
            )}
          </div>

          {/* Objective Box */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              🎯 Monthly Learning Objective
            </div>
            <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.5 }}>
              {currentObjective}
            </div>
          </div>

          {/* Weekly Focus (Collapsible) */}
          {currentWeeklyFocus?.length > 0 && (
            <div style={{ border: "1px solid #eef2ff", background: "#f5f7ff", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>📅 4-Week Focus Roadmap</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {currentWeeklyFocus.map((w) => (
                  <div key={w.week} style={{ background: "white", padding: "10px 12px", borderRadius: 8, border: "1px solid #e0e7ff" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#4338ca", marginBottom: 2 }}>
                      Week {w.week}
                    </div>
                    <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                      {w.focus}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Deliverables Checklist ── */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  📋 Milestone Thresholds & Deliverables Checklist
                </h3>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {isMonthLocked
                    ? "This month's checklist is verified and approved."
                    : "Mark each deliverable as you complete your field activities daily/weekly."}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: progressPercent === 100 ? "#059669" : "#7c3aed" }}>
                  {metCount} of {totalDeliverables} Completed ({progressPercent}%)
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: 8, borderRadius: 4, background: "#f1f5f9", overflow: "hidden", marginBottom: 16 }}>
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  background: progressPercent === 100 ? "#10b981" : "linear-gradient(90deg, #7c3aed, #a855f7)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {/* Checklist Items */}
            {loadingMonth ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading checklist…</div>
            ) : deliverables.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: 10 }}>
                No specific deliverables listed for this month.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {deliverables.map((item, idx) => {
                  const isMet = item.status === "met";
                  const target = item.targetCount || 1;
                  const isMultiCount = target > 1;
                  const count = item.count || 0;

                  const isExpanded = expandedDeliverable === (item.id || idx);
                  const evidence = evidenceMap[item.id];
                  // Elaboration text: use item.description if backend provides, else generate from label
                  const elaboration = item.description ||
                    `📌 Task: ${item.label}\n\nHow to complete this deliverable:\n• Review the monthly learning objective and understand the context of this task.\n• Carry out the required field activity or documentation as instructed by your mentor.\n• Collect evidence (photos, form, report, or notes) that shows you completed this task.\n• Submit the evidence below — the deliverable will be automatically marked as Met once evidence is added.`;

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        borderRadius: 12,
                        border: isMet ? "1.5px solid #10b981" : isExpanded ? "1.5px solid #7c3aed" : "1px solid #e2e8f0",
                        background: isMet ? "#f0fdf4" : isExpanded ? "#faf5ff" : "white",
                        transition: "all 0.15s ease",
                        overflow: "hidden",
                      }}
                    >
                      {/* ── Row Header (always visible) ── */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 12,
                          padding: "12px 16px",
                          cursor: "pointer",
                        }}
                        onClick={() => setExpandedDeliverable(isExpanded ? null : (item.id || idx))}
                      >
                        {/* Left: checkbox + title */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 200 }}>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              // Checkbox click only allowed if already met (to uncheck) OR if multiCount
                              // For non-met single deliverables — must submit evidence first
                              if (!isMonthLocked && isMultiCount) handleToggleSingle(item.id);
                              if (!isMonthLocked && !isMultiCount && isMet) handleToggleSingle(item.id); // allow uncheck
                              if (!isMonthLocked && !isMultiCount && !isMet) {
                                // expand panel instead of marking met
                                setExpandedDeliverable(item.id || idx);
                              }
                            }}
                            title={!isMet && !isMultiCount ? "Submit evidence below to mark as Met" : ""}
                            style={{
                              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                              border: isMet ? "none" : "2px solid #cbd5e1",
                              background: isMet ? "#10b981" : "white",
                              color: "white", fontSize: 14, fontWeight: 900,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: isMonthLocked ? "not-allowed" : (!isMet && !isMultiCount ? "help" : "pointer"),
                              transition: "all 0.15s ease",
                            }}
                          >
                            {isMet ? "✓" : ""}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: isMet ? "#065f46" : "#1e293b" }}>
                              {item.label}
                            </div>
                            {!isMet && !isMultiCount && (
                              <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 2, fontWeight: 600 }}>
                                📎 Submit evidence to mark as Met
                              </div>
                            )}
                            {evidence && (
                              <div style={{ fontSize: 11.5, color: "#7c3aed", marginTop: 2 }}>
                                📎 Evidence submitted
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: counter / status + expand arrow */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {isMultiCount ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                              <button type="button" onClick={() => handleAdjustCount(item.id, -1)} disabled={isMonthLocked || count <= 0}
                                style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 800, fontSize: 14, cursor: isMonthLocked || count <= 0 ? "not-allowed" : "pointer", opacity: count <= 0 ? 0.5 : 1 }}>-</button>
                              <span style={{ fontSize: 13, fontWeight: 800, minWidth: 50, textAlign: "center", color: isMet ? "#059669" : "#0f172a" }}>{count} / {target}</span>
                              <button type="button" onClick={() => handleAdjustCount(item.id, 1)} disabled={isMonthLocked}
                                style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 800, fontSize: 14, cursor: isMonthLocked ? "not-allowed" : "pointer" }}>+</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 6, background: isMet ? "#d1fae5" : "#f1f5f9", color: isMet ? "#065f46" : "#64748b" }}>
                              {isMet ? "Met ✓" : "Pending"}
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {/* ── Expanded Panel: Elaboration + Evidence ── */}
                      {isExpanded && (
                        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #e2e8f0" }}>
                          {/* Elaboration */}
                          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 14px", marginTop: 12, marginBottom: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: "#0369a1", textTransform: "uppercase", marginBottom: 6 }}>
                              📖 How to Complete This Deliverable
                            </div>
                            <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                              {elaboration}
                            </div>
                          </div>

                          {/* Evidence Section */}
                          {!isMonthLocked && (
                            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 14px" }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: "#c2410c", textTransform: "uppercase", marginBottom: 8 }}>
                                📋 Submit Evidence {evidence ? "— ✅ Submitted" : "(Required to mark as Met)"}
                              </div>
                              {evidence ? (
                                <div style={{ fontSize: 13, color: "#7c2d12", lineHeight: 1.6 }}>
                                  {evidence.text && <div>📝 {evidence.text}</div>}
                                  {evidence.formLink && <div>🔗 <a href={evidence.formLink} target="_blank" rel="noreferrer" style={{ color: "#4f46e5" }}>{evidence.formLink}</a></div>}
                                  {evidence.photoBase64 && <img src={evidence.photoBase64} alt="evidence" style={{ marginTop: 6, maxWidth: "100%", maxHeight: 160, borderRadius: 8, border: "1px solid #fed7aa" }} />}
                                  <div style={{ fontSize: 11, color: "#92400e", marginTop: 4 }}>Submitted at {new Date(evidence.submittedAt).toLocaleString("en-IN")}</div>
                                </div>
                              ) : (
                                <EvidenceForm onSubmit={(data) => handleEvidenceSubmit(item.id, data)} />
                              )}
                            </div>
                          )}

                          {/* Locked state evidence view */}
                          {isMonthLocked && evidence && (
                            <div style={{ fontSize: 12, color: "#065f46", background: "#d1fae5", borderRadius: 8, padding: "8px 12px" }}>
                              📎 Evidence on record: {evidence.text}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Mentor-Assigned Tasks ── */}
        {(loadingMentorTasks || mentorTasks.length > 0) && (
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
              📌 Mentor-Assigned Tasks — Month {selectedMonth}
            </h3>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
              Tasks your mentor has specifically assigned to you this month.
            </div>

            {loadingMentorTasks ? (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading tasks…</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {mentorTasks.map((task) => {
                  const isSubmitted = task.status === "submitted" || task.status === "approved";
                  const isApproved = task.status === "approved";
                  return (
                    <div key={task._id} style={{
                      border: isApproved ? "1.5px solid #10b981" : isSubmitted ? "1.5px solid #f59e0b" : "1px solid #e2e8f0",
                      borderRadius: 12, background: isApproved ? "#f0fdf4" : isSubmitted ? "#fffbeb" : "white",
                      overflow: "hidden",
                    }}>
                      {/* Task header */}
                      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>{task.title}</div>
                          {task.description && <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>{task.description}</div>}
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 6, whiteSpace: "nowrap", flexShrink: 0,
                          background: isApproved ? "#d1fae5" : isSubmitted ? "#fef3c7" : "#f1f5f9",
                          color: isApproved ? "#065f46" : isSubmitted ? "#92400e" : "#64748b",
                        }}>
                          {isApproved ? "✓ Approved" : isSubmitted ? "⏳ Pending Review" : "Pending"}
                        </span>
                      </div>

                      {/* Submitted evidence view */}
                      {isSubmitted && task.evidence?.submittedAt && (
                        <div style={{ margin: "0 16px 12px", background: "#f8fafc", borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: "#334155", marginBottom: 4 }}>Your submitted evidence:</div>
                          {task.evidence.text && <div style={{ color: "#475569" }}>📝 {task.evidence.text}</div>}
                          {task.evidence.formLink && <div>🔗 <a href={task.evidence.formLink} target="_blank" rel="noreferrer" style={{ color: "#4f46e5", fontSize: 12 }}>{task.evidence.formLink}</a></div>}
                          {task.evidence.photoUrl && <div style={{ color: "#475569", marginTop: 4 }}>📷 Photo submitted</div>}
                        </div>
                      )}

                      {/* Submit evidence button */}
                      {!isSubmitted && (
                        <div style={{ padding: "0 16px 14px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEvidenceModal({ taskId: task._id, taskTitle: task.title });
                              setEvidenceForm({ text: "", formLink: "", photoBase64: "" });
                            }}
                            style={{
                              padding: "8px 18px", borderRadius: 8, border: "none",
                              background: "#4f46e5", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer",
                            }}
                          >
                            📤 Submit Evidence
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Evidence Modal for mentor tasks */}
        {evidenceModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <div style={{ background: "white", borderRadius: 16, padding: 24, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                  📤 Submit Evidence
                </h3>
                <button type="button" onClick={() => setEvidenceModal(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 14, background: "#f1f5f9", padding: "8px 12px", borderRadius: 8 }}>
                Task: {evidenceModal.taskTitle}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>📝 Description / Notes</label>
                <input type="text" placeholder="What did you do? Describe briefly…"
                  value={evidenceForm.text} onChange={(e) => setEvidenceForm((f) => ({ ...f, text: e.target.value }))}
                  style={{ padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13 }} />

                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>🔗 Form Link / Google Form URL</label>
                <input type="url" placeholder="https://forms.gle/…"
                  value={evidenceForm.formLink} onChange={(e) => setEvidenceForm((f) => ({ ...f, formLink: e.target.value }))}
                  style={{ padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13 }} />

                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>📷 Photo Upload</label>
                <label style={{ padding: "10px 16px", borderRadius: 8, border: "2px dashed #c7d2fe", background: "#f5f7ff", color: "#4338ca", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
                  {evidenceForm.photoBase64 ? "✅ Photo selected — click to change" : "Click to upload a photo"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setEvidenceForm((f) => ({ ...f, photoBase64: ev.target.result }));
                    reader.readAsDataURL(file);
                  }} />
                </label>
                {evidenceForm.photoBase64 && (
                  <img src={evidenceForm.photoBase64} alt="preview" style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 10, objectFit: "cover", border: "1px solid #e2e8f0" }} />
                )}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setEvidenceModal(null)}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#64748b" }}>
                  Cancel
                </button>
                <button type="button"
                  disabled={submittingEvidence || (!evidenceForm.text.trim() && !evidenceForm.formLink.trim() && !evidenceForm.photoBase64)}
                  onClick={() => handleTaskEvidenceSubmit(evidenceModal.taskId)}
                  style={{
                    padding: "9px 22px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
                    background: "#4f46e5", color: "white", opacity: submittingEvidence ? 0.7 : 1,
                  }}>
                  {submittingEvidence ? "Submitting…" : "Submit Evidence ✓"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Official PDCA Report from Mentor (Read-Only) ── */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <span>📑 Official PDCA Evaluation & Growth Cycle Report</span>
                {isMonthLocked && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#065f46", background: "#d1fae5", padding: "2px 8px", borderRadius: 6 }}>
                    Approved by Mentor
                  </span>
                )}
              </h3>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                The official Plan–Do–Check–Act synthesis approved by your mentor for Month {selectedMonth}.
              </div>
            </div>

            {monthData?.report?.approvedAt && (
              <div style={{ fontSize: 12, color: "#64748b" }}>
                📅 Approved on: {new Date(monthData.report.approvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            )}
          </div>

          {monthData?.report?.status === "approved" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {["plan", "do", "check", "act"].map((key) => {
                const section = monthData.report.sections?.[key];
                const meta = SECTION_META[key];
                const text = section?.mentorText || section?.aiText || "No text recorded.";

                return (
                  <div
                    key={key}
                    style={{
                      border: `1px solid ${meta.color}30`,
                      background: meta.bg,
                      borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: meta.color, textTransform: "uppercase" }}>
                        {meta.label}
                      </span>
                      {section?.isAIDrafted && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: "white", color: meta.color, padding: "1px 6px", borderRadius: 4, border: `1px solid ${meta.color}40` }}>
                          AI-Assisted
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                      {meta.hint}
                    </div>
                    <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.5, flex: 1 }}>
                      {text}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "30px 20px", textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Month {selectedMonth} PDCA Report is Pending Mentor Review
              </div>
              <div style={{ fontSize: 12.5, color: "#64748b", maxWidth: 500, margin: "0 auto" }}>
                Keep your deliverables checklist updated above. At the end of the month, your mentor will review your completed targets and approve your official PDCA evaluation report here.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
