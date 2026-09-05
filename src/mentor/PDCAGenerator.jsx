import { useState, useEffect, useCallback } from "react";
import {
  generatePDCADraft,
  approvePDCAReport,
  unlockPDCAReport,
  getPDCAReport,
  createMentorTask,
  getMentorTasks,
} from "../services/api";
import { MONTH_TITLES, SEMESTER_LABELS, semesterOf } from "./monthMeta";
import { MONTH_CURRICULA } from "./monthCurricula";

const STATUS_STYLE = {
  met: { icon: "✓", color: "#059669", bg: "#ecfdf5", label: "Met" },
  needs_mentor_review: { icon: "◐", color: "#b45309", bg: "#fffbeb", label: "Needs review" },
  not_met: { icon: "☐", color: "#94a3b8", bg: "#f8fafc", label: "Not met" },
};

const SECTION_META = {
  plan: { label: "Plan", hint: "What did the Fellow set out to learn/do this month?" },
  do: { label: "Do", hint: "What did the Fellow actually do in the field?" },
  check: { label: "Check", hint: "What did the Fellow learn from reflecting on it?" },
  act: { label: "Act", hint: "What happens next, going into the following month?" },
};

// Months grouped by semester for the <select>'s <optgroup>s.
const SEMESTER_GROUPS = [1, 2, 3, 4].map((sem) => ({
  sem,
  label: SEMESTER_LABELS[sem],
  months: Array.from({ length: 24 }, (_, i) => i + 1).filter((m) => semesterOf(m) === sem),
}));

export default function PDCAGenerator({ mentees = [], setToast, onApproved }) {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedFellowId, setSelectedFellowId] = useState("");
  const [report, setReport] = useState(null);
  const [form, setForm] = useState({ plan: "", do: "", check: "", act: "" });
  const [deliverables, setDeliverables] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [activeTab, setActiveTab] = useState("pdca"); // "pdca" | "addTask"
  const [customTasks, setCustomTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assignedTo: "", date: new Date().toISOString().slice(0, 10) });
  const [taskSaving, setTaskSaving] = useState(false);
  // Static lookup — no API call, no database, no publish step. See
  // src/mentor/monthCurricula.js.
  const curriculumMeta = MONTH_CURRICULA[selectedMonth] || null;

  const selectedFellow = mentees.find((m) => m._id === selectedFellowId);

  const resetReportState = () => {
    setReport(null);
    setForm({ plan: "", do: "", check: "", act: "" });
    setDeliverables([]);
    setAiAvailable(true);
  };

  const applyReport = (r) => {
    setReport(r);
    setDeliverables(r.deliverablesStatus || []);
    setForm({
      plan: r.sections?.plan?.mentorText || r.sections?.plan?.aiText || "",
      do: r.sections?.do?.mentorText || r.sections?.do?.aiText || "",
      check: r.sections?.check?.mentorText || r.sections?.check?.aiText || "",
      act: r.sections?.act?.mentorText || r.sections?.act?.aiText || "",
    });
  };

  // Load mentor tasks from backend when Add Task tab opens
  useEffect(() => {
    if (activeTab !== "addTask") return;
    setLoadingTasks(true);
    getMentorTasks({ month: selectedMonth })
      .then((res) => { if (res.success) setCustomTasks(res.tasks || []); })
      .catch(() => {})
      .finally(() => setLoadingTasks(false));
  }, [activeTab, selectedMonth]);

  // Whenever the fellow or month changes, try to load any existing
  // draft/approved report for that combination instead of starting blank.
  const loadExistingReport = useCallback(async (fellowId, month) => {
    if (!fellowId) {
      resetReportState();
      return;
    }
    setLoadingExisting(true);
    resetReportState();
    try {
      const res = await getPDCAReport(fellowId, month);
      if (res.report) applyReport(res.report);
    } catch {
      // No existing report is a normal state (fresh month) — stay blank.
    } finally {
      setLoadingExisting(false);
    }
  }, []);

  useEffect(() => {
    loadExistingReport(selectedFellowId, selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFellowId, selectedMonth]);

  const handleGenerate = async () => {
    if (!selectedFellowId) {
      setToast?.({ msg: "Select a fellow first.", type: "error" });
      return;
    }
    setGenerating(true);
    try {
      const res = await generatePDCADraft(selectedFellowId, selectedMonth);
      applyReport(res.report);
      setAiAvailable(res.aiAvailable);
      setToast?.({
        msg: res.aiAvailable
          ? `AI draft generated for Month ${selectedMonth} — review and edit before approving.`
          : `AI is currently unavailable. A blank Month ${selectedMonth} template is shown below for you to fill in.`,
        type: res.aiAvailable ? "info" : "error",
      });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to generate draft.", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const toggleDeliverable = (id) => {
    setDeliverables((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const order = ["not_met", "needs_mentor_review", "met"];
        const next = order[(order.indexOf(d.status) + 1) % order.length];
        return { ...d, status: next };
      })
    );
  };

  const handleApprove = async () => {
    if (!form.plan.trim() || !form.do.trim() || !form.check.trim() || !form.act.trim()) {
      setToast?.({ msg: "All four PDCA sections are required before approving.", type: "error" });
      return;
    }
    setApproving(true);
    try {
      const res = await approvePDCAReport(selectedFellowId, {
        plan: form.plan,
        doAction: form.do,
        check: form.check,
        act: form.act,
        deliverablesStatus: deliverables,
        month: selectedMonth,
      });
      setReport(res.report);
      setToast?.({
        msg: `Month ${selectedMonth} PDCA report approved and saved to Growth Cycle history.`,
        type: "success",
      });
      onApproved?.();
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to approve report.", type: "error" });
    } finally {
      setApproving(false);
    }
  };

  const handleUnlock = async () => {
    if (!selectedFellowId || !report) return;
    const ok = window.confirm(
      `Unlock Month ${selectedMonth} for ${selectedFellow?.name || "this fellow"}? ` +
        `This moves the approved report back to draft — the fellow's checklist and this PDCA text can be edited again until you re-approve it.`
    );
    if (!ok) return;
    setUnlocking(true);
    try {
      const res = await unlockPDCAReport(selectedFellowId, selectedMonth);
      applyReport(res.report);
      setToast?.({ msg: res.message || `Month ${selectedMonth} unlocked.`, type: "success" });
      onApproved?.();
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to unlock month.", type: "error" });
    } finally {
      setUnlocking(false);
    }
  };

  const lowData = report?.lowDataFields || [];
  const metCount = deliverables.filter((d) => d.status === "met").length;
  const pct = deliverables.length ? Math.round((metCount / deliverables.length) * 100) : 0;
  const monthTitle = MONTH_TITLES[selectedMonth] || "";

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "white" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
            AI PDCA Growth Cycle Report Generator
          </h3>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Full 24-month Fellowship curriculum · grounded in real logged data
          </div>
        </div>

        {/* Month picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0",
              fontWeight: 700, fontSize: 13, color: "#0f172a", background: "#f8fafc",
              minWidth: 260, cursor: "pointer",
            }}
          >
            {SEMESTER_GROUPS.map((g) => (
              <optgroup key={g.sem} label={g.label}>
                {g.months.map((m) => (
                  <option key={m} value={m}>
                    Month {m} — {MONTH_TITLES[m]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { id: "pdca", label: "📊 PDCA Report" },
          { id: "addTask", label: "➕ Add Task" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: activeTab === tab.id ? "1.5px solid #4f46e5" : "1.5px solid #e2e8f0",
              background: activeTab === tab.id ? "#eef2ff" : "white",
              color: activeTab === tab.id ? "#4338ca" : "#64748b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Add Task Panel ── */}
      {activeTab === "addTask" && (
        <div style={{ border: "1px solid #e0e7ff", borderRadius: 12, padding: 16, background: "#f5f7ff", marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#3730a3" }}>
            ➕ Add Learning Module / Task
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                Task Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Anganwadi Visit Documentation"
                value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #c7d2fe", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                Description / Instructions
              </label>
              <textarea
                placeholder="Explain what the fellow needs to do, how to do it, and what evidence is needed…"
                value={taskForm.description}
                onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                style={{ width: "100%", minHeight: 80, padding: "9px 12px", borderRadius: 8, border: "1.5px solid #c7d2fe", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                Assign To Fellow
              </label>
              <select
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm((f) => ({ ...f, assignedTo: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #c7d2fe", fontSize: 13 }}
              >
                <option value="">— Select Fellow —</option>
                {mentees.map((m, i) => (
                  <option key={m._id || i} value={m._id || m.id || ""}>
                    {m.name || `Fellow ${i + 1}`} {m.email ? `(${m.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                Date
              </label>
              <input
                type="date"
                value={taskForm.date}
                onChange={(e) => setTaskForm((f) => ({ ...f, date: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #c7d2fe", fontSize: 13, boxSizing: "border-box" }}
              />
              <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 3 }}>
                This is the day the task will appear on the fellow's Dashboard calendar.
              </div>
            </div>

            <button
              type="button"
              disabled={!taskForm.title.trim() || !taskForm.assignedTo || taskSaving}
              onClick={async () => {
                if (!taskForm.title.trim() || !taskForm.assignedTo) return;
                setTaskSaving(true);
                try {
                  const res = await createMentorTask({
                    fellowId: taskForm.assignedTo,
                    month: selectedMonth,
                    title: taskForm.title.trim(),
                    description: taskForm.description.trim(),
                    date: taskForm.date || new Date().toISOString().slice(0, 10),
                  });
                  if (res.success) {
                    // Attach fellow name locally so it shows immediately without re-fetch
                    const assignedName = mentees.find((m) => (m._id || m.id) === taskForm.assignedTo)?.name || "Fellow";
                    const taskWithName = {
                      ...res.task,
                      fellowId: { _id: taskForm.assignedTo, name: assignedName },
                    };
                    setCustomTasks((prev) => [taskWithName, ...prev]);
                    setTaskForm({ title: "", description: "", assignedTo: "", date: new Date().toISOString().slice(0, 10) });
                    setToast?.({ msg: `Task "${res.task.title}" assigned to ${assignedName} ✅`, type: "success" });
                  }
                } catch (err) {
                  setToast?.({ msg: err.message || "Failed to save task.", type: "error" });
                } finally {
                  setTaskSaving(false);
                }
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: !taskForm.title.trim() || !taskForm.assignedTo ? "#c7d2fe" : "#4f46e5",
                color: "white",
                fontWeight: 700,
                fontSize: 13,
                cursor: !taskForm.title.trim() || !taskForm.assignedTo ? "not-allowed" : "pointer",
                alignSelf: "flex-start",
              }}
            >
              {taskSaving ? "Adding…" : "➕ Add Task"}
            </button>
          </div>

          {/* Added Tasks List */}
          {loadingTasks ? (
            <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>Loading tasks…</div>
          ) : customTasks.filter((t) => t.month === selectedMonth).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#3730a3", marginBottom: 8, textTransform: "uppercase" }}>
                Tasks Added — Month {selectedMonth}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {customTasks
                  .filter((t) => t.month === selectedMonth)
                  .map((t) => {
                    const fellowName = t.fellowId?.name
                      || mentees.find((m) => (m._id || m.id) === (t.fellowId?._id || t.fellowId))?.name
                      || "Fellow";
                    const badgeColor = t.status === "approved" ? "#059669" : t.status === "submitted" ? "#d97706" : "#6d28d9";
                    const badgeBg = t.status === "approved" ? "#d1fae5" : t.status === "submitted" ? "#fef3c7" : "#ede9fe";
                    const badgeLabel = t.status === "approved" ? "Approved ✓" : t.status === "submitted" ? "Evidence Submitted" : "Pending";
                    return (
                      <div key={t._id || t.id} style={{ background: "white", border: "1px solid #e0e7ff", borderRadius: 10, padding: "10px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{t.title}</span>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: badgeColor, background: badgeBg, padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                              {badgeLabel}
                            </span>
                            <span style={{ fontSize: 11, color: "#6d28d9", background: "#ede9fe", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                              → {fellowName}
                            </span>
                          </div>
                        </div>
                        {t.description && (
                          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4, marginBottom: t.evidence?.submittedAt ? 6 : 0 }}>{t.description}</div>
                        )}
                        {/* Show fellow's submitted evidence */}
                        {t.evidence?.submittedAt && (
                          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 10px", marginTop: 6, fontSize: 12 }}>
                            <div style={{ fontWeight: 700, color: "#065f46", marginBottom: 3 }}>📎 Fellow Evidence:</div>
                            {t.evidence.text && <div style={{ color: "#374151" }}>📝 {t.evidence.text}</div>}
                            {t.evidence.formLink && <div style={{ color: "#374151" }}>🔗 <a href={t.evidence.formLink} target="_blank" rel="noreferrer" style={{ color: "#4f46e5" }}>{t.evidence.formLink}</a></div>}
                            {t.evidence.photoUrl && <div style={{ color: "#374151" }}>📷 Photo uploaded</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PDCA Tab content only shown when activeTab === "pdca" ── */}
      {activeTab === "pdca" && <>

      {/* Curriculum context (collapsible) */}
      {curriculumMeta && (
        <div style={{ marginBottom: 14, border: "1px solid #eef2ff", background: "#f5f7ff", borderRadius: 10, overflow: "hidden" }}>
          <button
            type="button"
            onClick={() => setShowContext((v) => !v)}
            style={{
              width: "100%", textAlign: "left", padding: "9px 12px", background: "none",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#4338ca",
            }}
          >
            <span>📘 Month {selectedMonth} curriculum — {monthTitle}</span>
            <span>{showContext ? "▲" : "▼"}</span>
          </button>
          {showContext && (
            <div style={{ padding: "0 14px 14px", fontSize: 12.5, color: "#374151" }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: "#4338ca", marginBottom: 2, fontSize: 11, textTransform: "uppercase" }}>
                  Monthly Objective
                </div>
                {curriculumMeta.monthlyObjective}
              </div>
              {curriculumMeta.weeklyFocus?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, color: "#4338ca", marginBottom: 4, fontSize: 11, textTransform: "uppercase" }}>
                    Weekly Focus
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {curriculumMeta.weeklyFocus.map((w) => (
                      <li key={w.week} style={{ marginBottom: 2 }}>
                        <strong>Week {w.week}:</strong> {w.focus}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fellow picker + generate */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        <select
          value={selectedFellowId}
          onChange={(e) => setSelectedFellowId(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13 }}
        >
          <option value="">Select a fellow…</option>
          {mentees.map((m, index) => {
            const optionKey = m._id || m.id || m.email || `${m.name || "mentee"}-${index}`;
            return (
              <option key={optionKey} value={m._id || m.id || ""}>
                {m.name || `Fellow ${index + 1}`} {m.email ? `(${m.email})` : ""}
              </option>
            );
          })}
        </select>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !selectedFellowId}
          style={{
            padding: "10px 18px", borderRadius: 8, border: "1px solid #c4b5fd",
            background: generating || !selectedFellowId ? "#f3f0ff" : "#ede9fe",
            color: "#5b21b6", fontWeight: 700, cursor: generating || !selectedFellowId ? "not-allowed" : "pointer",
            whiteSpace: "nowrap", opacity: !selectedFellowId ? 0.6 : 1,
          }}
        >
          {generating ? "Generating…" : `✨ Generate Month ${selectedMonth} Draft`}
        </button>
      </div>

      {loadingExisting && (
        <div style={{ color: "#6b7280", fontSize: 13, padding: "10px 0" }}>Loading…</div>
      )}

      {!aiAvailable && report && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: 10, borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
          AI service is currently unavailable — the fields below are a blank Month {selectedMonth} template. Fill them in manually; the deliverables checklist is still computed from real logged data.
        </div>
      )}

      {!loadingExisting && report && (
        <>
          {["plan", "do", "check", "act"].map((key) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 12, marginBottom: 4, textTransform: "uppercase", color: "#374151" }}>
                {SECTION_META[key].label}
                {lowData.includes(key) && (
                  <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700, textTransform: "none" }}>
                    ⚠ low data — needs your input
                  </span>
                )}
                {report?.sections?.[key]?.isAIDrafted && (
                  <span style={{ background: "#ede9fe", color: "#5b21b6", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700, textTransform: "none" }}>
                    AI-drafted
                  </span>
                )}
                <span style={{ fontWeight: 500, color: "#9ca3af", fontSize: 10.5, textTransform: "none" }}>
                  — {SECTION_META[key].hint}
                </span>
              </label>
              <textarea
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", minHeight: 70, padding: 8, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit" }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#374151" }}>
                Month {selectedMonth} Deliverables Checklist ({metCount}/{deliverables.length} met) — click to correct
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? "#059669" : "#b45309" }}>{pct}%</div>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: "#f1f5f9", overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#059669" : "linear-gradient(90deg,#f59e0b,#d97706)", transition: "width 0.3s ease" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {deliverables.map((d, index) => {
                const s = STATUS_STYLE[d.status];
                const itemKey = d.id || d.label || `${d.status}-${index}`;
                return (
                  <button
                    type="button"
                    key={itemKey}
                    onClick={() => toggleDeliverable(d.id || itemKey)}
                    title="Click to cycle: Not met → Needs review → Met"
                    style={{
                      textAlign: "left", fontSize: 11, color: s.color, background: "none",
                      border: "none", cursor: "pointer", padding: "2px 0",
                    }}
                  >
                    {s.icon} {d.label}
                    {d.mentorOverride && <span style={{ color: "#6366f1" }}> (corrected)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving}
              style={{
                padding: "10px 18px", borderRadius: 6, border: "none",
                background: report.status === "approved" ? "#059669" : "#4f46e5",
                color: "#fff", fontWeight: 700, cursor: approving ? "not-allowed" : "pointer",
                opacity: approving ? 0.7 : 1,
              }}
            >
              {approving ? "Saving…" : report.status === "approved" ? "✓ Approved — Re-save to Growth Cycle" : "Approve & Save Growth Cycle"}
            </button>

            {report.status === "approved" && (
              <button
                type="button"
                onClick={handleUnlock}
                disabled={unlocking}
                title="Move this month back to draft so the fellow's checklist and this report can be edited again"
                style={{
                  padding: "10px 18px", borderRadius: 6, border: "1.5px solid #dc2626",
                  background: "#fff", color: "#dc2626", fontWeight: 700,
                  cursor: unlocking ? "not-allowed" : "pointer", opacity: unlocking ? 0.7 : 1,
                }}
              >
                {unlocking ? "Unlocking…" : "🔓 Unlock Month"}
              </button>
            )}

            {report.unlockCount > 0 && (
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Unlocked {report.unlockCount} time{report.unlockCount > 1 ? "s" : ""} so far
              </span>
            )}
          </div>
        </>
      )}

      {!loadingExisting && !report && (
        <div style={{ color: "#6b7280", fontSize: 13 }}>
          {selectedFellow
            ? `No report yet for ${selectedFellow.name} — Month ${selectedMonth} (${monthTitle}). Click "Generate Month ${selectedMonth} Draft" above.`
            : "Select a fellow and click Generate Draft."}
        </div>
      )}

      </> /* end pdca tab */ }
    </div>
  );
}
