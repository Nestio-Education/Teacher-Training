import { useState, useEffect } from "react";
import {
  parseCurriculumDocument,
  publishCurriculum,
  getCurriculumList,
  getCurriculum,
  deleteCurriculum,
} from "../services/api";

const emptyDraft = (month) => ({
  month,
  monthlyObjective: "",
  weeklyFocus: [],
  deliverables: [],
  successCheck: { plan: [], do: [], check: [], act: [] },
  sourceFileName: null,
  aiProvider: null,
});

/* ── Curriculum upload & review UI ──
   Upload a curriculum doc (.docx/.txt/.md) for a month -> AI parses it into
   the structured shape the PDCA generator needs (objective, weekly focus,
   deliverables + matching keywords, success-check criteria) -> review and
   edit everything in place -> Publish. Once published, that month lights
   up in the Growth Cycle tab's month selector. No developer hand-editing
   of a curriculum data file required. */
export default function CurriculumManager({ setToast, onPublished }) {
  const [month, setMonth] = useState(1);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const fetchList = () => {
    setLoadingList(true);
    getCurriculumList()
      .then((res) => setList(res.curricula || []))
      .catch((err) => console.error("Failed to load curriculum list", err))
      .finally(() => setLoadingList(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleParse = async () => {
    if (!file) {
      setToast?.({ msg: "Choose a curriculum document first (.docx, .txt, or .md).", type: "error" });
      return;
    }
    setParsing(true);
    try {
      const res = await parseCurriculumDocument(month, file);
      setDraft(res.draft);
      setToast?.({
        msg: "AI parsed the document — review every field below before publishing.",
        type: "info",
      });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to parse curriculum document.", type: "error" });
    } finally {
      setParsing(false);
    }
  };

  const loadExisting = async (m) => {
    setMonth(m);
    setFile(null);
    try {
      const res = await getCurriculum(m);
      setDraft(res.curriculum || emptyDraft(m));
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to load curriculum.", type: "error" });
    }
  };

  const handlePublish = async () => {
    if (!draft?.monthlyObjective?.trim()) {
      setToast?.({ msg: "Monthly objective can't be empty.", type: "error" });
      return;
    }
    if (!draft?.deliverables?.length) {
      setToast?.({ msg: "Add at least one deliverable.", type: "error" });
      return;
    }
    setPublishing(true);
    try {
      await publishCurriculum(month, draft);
      setToast?.({ msg: `Month ${month} curriculum published.`, type: "success" });
      fetchList();
      onPublished?.();
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to publish curriculum.", type: "error" });
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (m) => {
    try {
      await deleteCurriculum(m);
      setToast?.({ msg: `Month ${m} curriculum removed.`, type: "info" });
      fetchList();
      if (draft?.month === m) setDraft(null);
      onPublished?.();
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to delete curriculum (admin only).", type: "error" });
    }
  };

  // ── Draft field editors ──
  const updateDraft = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const updateWeek = (i, field, value) => {
    const next = [...draft.weeklyFocus];
    next[i] = { ...next[i], [field]: value };
    updateDraft({ weeklyFocus: next });
  };
  const addWeek = () =>
    updateDraft({ weeklyFocus: [...draft.weeklyFocus, { week: draft.weeklyFocus.length + 1, focus: "" }] });
  const removeWeek = (i) => updateDraft({ weeklyFocus: draft.weeklyFocus.filter((_, idx) => idx !== i) });

  const updateDeliverable = (i, field, value) => {
    const next = [...draft.deliverables];
    next[i] = { ...next[i], [field]: value };
    updateDraft({ deliverables: next });
  };
  const addDeliverable = () =>
    updateDraft({
      deliverables: [...draft.deliverables, { id: `deliverable_${draft.deliverables.length + 1}`, label: "", keywords: [], targetCount: null }],
    });
  const removeDeliverable = (i) => updateDraft({ deliverables: draft.deliverables.filter((_, idx) => idx !== i) });

  const updateCriterion = (phase, i, field, value) => {
    const next = [...draft.successCheck[phase]];
    next[i] = { ...next[i], [field]: value };
    updateDraft({ successCheck: { ...draft.successCheck, [phase]: next } });
  };
  const addCriterion = (phase) =>
    updateDraft({
      successCheck: {
        ...draft.successCheck,
        [phase]: [...draft.successCheck[phase], { criterion: "", linkedDeliverableId: null }],
      },
    });
  const removeCriterion = (phase, i) =>
    updateDraft({
      successCheck: { ...draft.successCheck, [phase]: draft.successCheck[phase].filter((_, idx) => idx !== i) },
    });

  const inputStyle = { width: "100%", padding: 6, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 };
  const rowBtnStyle = { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 12, padding: "0 4px" };
  const addBtnStyle = { background: "none", border: "none", color: "#4f46e5", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "4px 0" };

  return (
    <div>
      {/* Existing curricula list */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: "#374151", marginBottom: 6 }}>
          Months with curriculum on file
        </div>
        {loadingList ? (
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Loading…</div>
        ) : list.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94a3b8" }}>None uploaded yet — upload one below.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {list.map((c) => (
              <div
                key={c.month}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "4px 8px",
                  fontSize: 11,
                }}
              >
                <button
                  type="button"
                  onClick={() => loadExisting(c.month)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "#1e293b" }}
                >
                  Month {c.month}
                </button>
                <span
                  style={{
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 8,
                    background: c.status === "published" ? "#d1fae5" : "#fef3c7",
                    color: c.status === "published" ? "#059669" : "#92400e",
                  }}
                >
                  {c.status}
                </span>
                <button type="button" onClick={() => handleDelete(c.month)} style={rowBtnStyle} title="Remove (admin only)">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload + parse */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 2 }}>Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ ...inputStyle, width: 90 }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>Month {m}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 2 }}>
            Curriculum document (.docx, .txt, .md)
          </label>
          <input
            type="file"
            accept=".docx,.txt,.md"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ fontSize: 12 }}
          />
        </div>
        <button
          type="button"
          onClick={handleParse}
          disabled={parsing || !file}
          style={{
            padding: "8px 16px", borderRadius: 6, border: "1px solid #c4b5fd",
            background: "#ede9fe", color: "#5b21b6", fontWeight: 700, cursor: file ? "pointer" : "not-allowed",
            opacity: file ? 1 : 0.6,
          }}
        >
          {parsing ? "Parsing…" : "✨ Parse with AI"}
        </button>
      </div>

      {/* Review/edit + publish */}
      {draft && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>
              Reviewing Month {month} draft
              {draft.aiProvider && (
                <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: "#ede9fe", color: "#5b21b6", padding: "2px 6px", borderRadius: 4 }}>
                  AI-parsed via {draft.aiProvider}
                </span>
              )}
            </div>
          </div>

          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
            Monthly Objective
          </label>
          <textarea
            value={draft.monthlyObjective}
            onChange={(e) => updateDraft({ monthlyObjective: e.target.value })}
            style={{ ...inputStyle, minHeight: 50, marginBottom: 14 }}
          />

          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
            Weekly Focus
          </label>
          {draft.weeklyFocus.map((w, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <input type="number" value={w.week} onChange={(e) => updateWeek(i, "week", Number(e.target.value))} style={{ ...inputStyle, width: 60 }} />
              <input value={w.focus} onChange={(e) => updateWeek(i, "focus", e.target.value)} style={inputStyle} placeholder="Focus for this week" />
              <button type="button" onClick={() => removeWeek(i)} style={rowBtnStyle}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addWeek} style={{ ...addBtnStyle, marginBottom: 14 }}>+ Add week</button>

          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
            Deliverables ({draft.deliverables.length})
          </label>
          {draft.deliverables.map((d, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 80px 24px", gap: 6, marginBottom: 4, alignItems: "center" }}>
              <input value={d.id} onChange={(e) => updateDeliverable(i, "id", e.target.value)} style={inputStyle} placeholder="id" />
              <input value={d.label} onChange={(e) => updateDeliverable(i, "label", e.target.value)} style={inputStyle} placeholder="Label" />
              <input
                value={(d.keywords || []).join(", ")}
                onChange={(e) => updateDeliverable(i, "keywords", e.target.value.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean))}
                style={inputStyle}
                placeholder="match keywords, comma sep"
              />
              <input
                type="number"
                value={d.targetCount ?? ""}
                onChange={(e) => updateDeliverable(i, "targetCount", e.target.value === "" ? null : Number(e.target.value))}
                style={inputStyle}
                placeholder="min #"
              />
              <button type="button" onClick={() => removeDeliverable(i)} style={rowBtnStyle}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addDeliverable} style={{ ...addBtnStyle, marginBottom: 14 }}>+ Add deliverable</button>

          {["plan", "do", "check", "act"].map((phase) => (
            <div key={phase} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
                Success Check — {phase}
              </label>
              {draft.successCheck[phase].map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: phase === "do" ? "3fr 1.5fr 24px" : "1fr 24px", gap: 6, marginBottom: 4 }}>
                  <input value={c.criterion} onChange={(e) => updateCriterion(phase, i, "criterion", e.target.value)} style={inputStyle} placeholder="Criterion" />
                  {phase === "do" && (
                    <select
                      value={c.linkedDeliverableId || ""}
                      onChange={(e) => updateCriterion(phase, i, "linkedDeliverableId", e.target.value || null)}
                      style={inputStyle}
                    >
                      <option value="">— mentor to assess —</option>
                      {draft.deliverables.map((d) => (
                        <option key={d.id} value={d.id}>{d.label || d.id}</option>
                      ))}
                    </select>
                  )}
                  <button type="button" onClick={() => removeCriterion(phase, i)} style={rowBtnStyle}>✕</button>
                </div>
              ))}
              <button type="button" onClick={() => addCriterion(phase)} style={addBtnStyle}>+ Add criterion</button>
            </div>
          ))}

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            style={{ padding: "10px 18px", borderRadius: 6, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            {publishing ? "Publishing…" : `✓ Publish Month ${month} Curriculum`}
          </button>
        </div>
      )}
    </div>
  );
}