import { useState, useEffect, useCallback } from "react";
import { Toast, Badge, S } from "../components/Shared";
import {
  getFellowPDCAProgress,
  getFellowPDCAMonth,
  updateFellowPDCAChecklist,
} from "../services/api";
import { MONTH_TITLES, SEMESTER_LABELS, semesterOf } from "../mentor/monthMeta";
import { MONTH_CURRICULA } from "../mentor/monthCurricula";

const SECTION_META = {
  plan: { label: "Plan", hint: "Monthly learning goals and initial target setup", color: "#4f46e5", bg: "#eef2ff" },
  do: { label: "Do", hint: "Fieldwork, Anganwadi visits, and classroom execution", color: "#d97706", bg: "#fffbeb" },
  check: { label: "Check", hint: "Reflections, outcomes, and progress evaluation", color: "#059669", bg: "#ecfdf5" },
  act: { label: "Act", hint: "Next cycle planning and improvements for upcoming month", color: "#dc2626", bg: "#fef2f2" },
};

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

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                        padding: "12px 16px",
                        borderRadius: 12,
                        border: isMet ? "1.5px solid #10b981" : "1px solid #e2e8f0",
                        background: isMet ? "#f0fdf4" : "white",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Left: Title & Status */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 260 }}>
                        <button
                          type="button"
                          onClick={() => !isMultiCount && handleToggleSingle(item.id)}
                          disabled={isMonthLocked || isMultiCount}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            border: isMet ? "none" : "2px solid #cbd5e1",
                            background: isMet ? "#10b981" : "white",
                            color: "white",
                            fontSize: 14,
                            fontWeight: 900,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: isMonthLocked || isMultiCount ? "default" : "pointer",
                            transition: "all 0.15s ease",
                            padding: 0,
                          }}
                        >
                          {isMet ? "✓" : ""}
                        </button>

                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: isMet ? "#065f46" : "#1e293b" }}>
                            {item.label}
                          </div>
                          {item.note && (
                            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                              📝 <em>{item.note}</em>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Counter or Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {isMultiCount ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleAdjustCount(item.id, -1)}
                              disabled={isMonthLocked || count <= 0}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                background: "white",
                                color: "#475569",
                                fontWeight: 800,
                                fontSize: 14,
                                cursor: isMonthLocked || count <= 0 ? "not-allowed" : "pointer",
                                opacity: count <= 0 ? 0.5 : 1,
                              }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 800, minWidth: 50, textAlign: "center", color: isMet ? "#059669" : "#0f172a" }}>
                              {count} / {target}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustCount(item.id, 1)}
                              disabled={isMonthLocked}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                background: "white",
                                color: "#475569",
                                fontWeight: 800,
                                fontSize: 14,
                                cursor: isMonthLocked ? "not-allowed" : "pointer",
                              }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 6, background: isMet ? "#d1fae5" : "#f1f5f9", color: isMet ? "#065f46" : "#64748b" }}>
                            {isMet ? "Met ✓" : "Pending"}
                          </span>
                        )}

                        {/* Optional note prompt for Fellow */}
                        {!isMonthLocked && (
                          <button
                            type="button"
                            onClick={() => {
                              const currentNote = item.note || "";
                              const newNote = prompt(`Add a quick note or evidence location for "${item.label}":`, currentNote);
                              if (newNote !== null) {
                                handleNoteChange(item.id, newNote);
                              }
                            }}
                            title="Add note/evidence link"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "#64748b",
                              padding: "4px 8px",
                              borderRadius: 6,
                            }}
                          >
                            ✏️ Note
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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
