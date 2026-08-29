// Prajwal start
import { useState, useEffect } from "react";
import { SectionCard, S, Badge, StatusBadge } from "../components/Shared";
// Start: Dnyaneshwari Thorat
import { getChildAssessments, saveChildAssessment, getActiveQuestionBank } from "../services/api";
// End: Dnyaneshwari Thorat

import {
  RATING_SCALE_3,
  SECTIONS_2_3_YEARS,
  AGE_GROUPS,
  SECTIONS,
  scoreOf,
  computeSectionScores,
} from "../data/childAssessmentSections";

/* ─────────────────────────────────────────
   Child Dashboard — Module 1
   (Child Profile & Assessment)
   Spec ref: Teacher_Portal_Functional_Spec.pdf
   Section 2 — Child Profile & Assessment
   3 tabs: Child Profile / Child Assessment / Activity Suggestions
───────────────────────────────────────── */

const OVERALL_OPTIONS = [
  { value: "on_track", label: "On Track" },
  { value: "slight_delay", label: "Slight Delay — provide details below" },
  { value: "significant_delay", label: "Significant Delay — provide details below" },
  { value: "other", label: "Other" },
];

export const ASSESSMENT_DOMAINS = [
  "Cognitive",
  "Language",
  "Literacy",
  "Numeracy",
  "Social-Emotional",
  "Physical & Motor Skills",
  "Creativity",
  "School Readiness",
];

const ASSESSMENT_STAGES = ["Baseline", "Midline", "Endline"];

/* TODO(backend): replace with real API calls once the Activity Engine
   endpoints from the DB/UI Integration Spec are wired up:
   - GET child profile          -> /children/:id
   - GET assessments            -> /children/:id/assessments
   - GET activity_recommendations joined with activities
   For now this renders with empty/placeholder state so the screen and
   flow can be reviewed before the backend contract lands. */

function ChildProfileTab({ child, editing, setEditing, form, setForm, onSave, saving }) {
  const field = (label, key, type = "text") => (
    <div>
      <label style={S.label}>{label}</label>
      {editing ? (
        type === "textarea" ? (
          <textarea
            style={{ ...S.input, height: 70, resize: "vertical" }}
            value={form[key] || ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ) : (
          <input
            type={type}
            style={S.input}
            value={form[key] || ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        )
      ) : (
        <div style={{ fontSize: 13, color: "#374151", padding: "8px 0" }}>{form[key] || "Not added"}</div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionCard title="Basic Information">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={S.label}>Child ID</label>
            <div style={{ fontSize: 13, color: "#9ca3af", padding: "8px 0" }}>{child.id}</div>
          </div>
          {field("Full Name", "name")}
          {field("Date of Birth", "dob", "date")}
          <div>
            <label style={S.label}>Age</label>
            <div style={{ fontSize: 13, color: "#374151", padding: "8px 0" }}>
              {form.dob ? Math.floor((Date.now() - new Date(form.dob)) / 3.15576e10) + " yrs" : "—"}
            </div>
          </div>
          <div>
            <label style={S.label}>Gender</label>
            {editing ? (
              <select style={S.input} value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <div style={{ fontSize: 13, color: "#374151", padding: "8px 0" }}>{form.gender || "Not set"}</div>
            )}
          </div>
          {field("Admission Date", "admissionDate", "date")}
          <div>
            <label style={S.label}>Current Level (Milestone-based)</label>
            <div style={{ padding: "8px 0" }}>
              <Badge children="Auto-derived from latest assessment" color="#7c3aed" bg="#ede9fe" />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Additional Details">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {field("Parent/Guardian Name", "parentName")}
          {field("Contact Number", "contactNumber", "tel")}
          {field("Blood Group", "bloodGroup")}
          {field("Emergency Contact", "emergencyContact")}
        </div>
        {field("Address", "address", "textarea")}
        <div style={{ height: 12 }} />
        {field("Medical Conditions", "medicalConditions", "textarea")}
        <div style={{ height: 12 }} />
        {field("Allergies", "allergies", "textarea")}
        <div style={{ height: 12 }} />
        {field("Special Needs", "specialNeeds", "textarea")}
        <div style={{ height: 12 }} />
        {field("Interests", "interests")}
        <div style={{ height: 12 }} />
        {field("Notes", "notes", "textarea")}
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {editing ? (
          <button onClick={onSave} disabled={saving} style={S.primaryBtn}>
            {saving ? "Saving..." : "💾 Save"}
          </button>
        ) : (
          <button onClick={() => setEditing(true)} style={S.primaryBtn}>
            ✏️ Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

function SectionPieChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.score, 0);

  if (total === 0) {
    return (
      <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", border: "1px dashed #cbd5e1", borderRadius: 12 }}>
        Rate at least one item and save the assessment to see the section-wise breakdown.
      </div>
    );
  }

  const cx = 110, cy = 110, radius = 90;
  const filtered = data.filter((d) => d.score > 0);

  const { slices } = filtered.reduce(
    (acc, d, i) => {
      const fraction = d.score / total;
      const startAngle = acc.angle;
      const endAngle = startAngle + fraction * 2 * Math.PI;
      const x1 = cx + radius * Math.sin(startAngle);
      const y1 = cy - radius * Math.cos(startAngle);
      const x2 = cx + radius * Math.sin(endAngle);
      const y2 = cy - radius * Math.cos(endAngle);
      const largeArc = fraction > 0.5 ? 1 : 0;
      const path =
        fraction >= 0.999
          ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
          : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      acc.slices.push({ ...d, path, fraction, color: PIE_COLORS[i % PIE_COLORS.length] });
      acc.angle = endAngle;
      return acc;
    },
    { angle: 0, slices: [] }
  );

  return (
    <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
      <svg width={220} height={220} viewBox="0 0 220 220">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={2} />
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: "#1c1917" }}>{s.title}</span>
            <span style={{ color: "#6b7280" }}>
              {s.score}/{s.max} pts · {Math.round(s.fraction * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChildAssessmentTab({ child, onAssessmentSaved }) {
  const [stage, setStage] = useState("Baseline");
  const [savedAssessments, setSavedAssessments] = useState({});
  const [answers, setAnswers] = useState({});
  const [openActivities, setOpenActivities] = useState({});
  const [overallStatus, setOverallStatus] = useState("");
  const [otherStatusText, setOtherStatusText] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [nextAssessmentDate, setNextAssessmentDate] = useState("");
  const [assessmentDate, setAssessmentDate] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [loading, setLoading] = useState(false);

  const ageGroup = getAgeGroupFromChild(child);

  // ── NEW: sections now come from state, loaded from the DB ──
  const [activeSections, setActiveSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsSource, setSectionsSource] = useState(""); // "db" | "fallback"

  useEffect(() => {
    if (!child) return;
    setSectionsLoading(true);
    getActiveQuestionBank(ageGroup)
      .then(res => {
        setActiveSections(res.questionBank.sections);
        setSectionsSource("db");
      })
      .catch(err => {
        // No DB question bank yet for this age group — fall back to the static file so
        // the tab still works for age groups that haven't been migrated yet.
        console.warn(`No DB question bank for ${ageGroup}, using static fallback.`, err);
        setActiveSections(AGE_GROUPS[ageGroup] || SECTIONS_2_3_YEARS);
        setSectionsSource("fallback");
      })
      .finally(() => setSectionsLoading(false));
  }, [child, ageGroup]);

  // Load any previously saved assessments for this child from the backend database
  useEffect(() => {
    const childId = child?.id || child?._id;
    if (!childId) return;
    setLoading(true);
    getChildAssessments(childId)
      .then((data) => {
        setSavedAssessments(data || {});
      })
      .catch((err) => {
        console.error("Error loading child assessments:", err);
        setSavedAssessments({});
      })
      .finally(() => {
        setLoading(false);
      });
    setStage("Baseline");
  }, [child]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate the form whenever the stage changes or saved data updates
  useEffect(() => {
    const rec = savedAssessments[stage];
    setAnswers(rec?.answers || {});
    setOverallStatus(rec?.overallStatus || "");
    setOtherStatusText(rec?.otherStatusText || "");
    setRecommendation(rec?.recommendation || "");
    setNextAssessmentDate(rec?.nextAssessmentDate ? new Date(rec.nextAssessmentDate).toISOString().split("T")[0] : "");
    setAssessmentDate(rec?.assessmentDate ? new Date(rec.assessmentDate).toISOString().split("T")[0] : "");
    setShowValidation(false);
  }, [stage, savedAssessments]);

  const totalItems = activeSections.reduce((sum, s) => sum + s.items.length, 0);
  const answeredCount = Object.keys(answers).length;
  const totalScore = Object.values(answers).reduce((sum, r) => {
    const s = scoreOf(r);
    return sum + (s === null ? 0 : s);
  }, 0);

  const toggleActivities = (id) => setOpenActivities((p) => ({ ...p, [id]: !p[id] }));
  const setAnswer = (id, value) => setAnswers((p) => ({ ...p, [id]: value }));

  const allItemIds = activeSections.flatMap((s) => s.items.map((it) => it.id));
  const unansweredIds = allItemIds.filter((id) => !answers[id]);

  const handleSaveAssessment = () => {
    // Smart defaults for seamless saving
    const effectiveDate = assessmentDate || new Date().toISOString().split("T")[0];
    const effectiveStatus = overallStatus || "on_track";

    setShowValidation(false);
    const sectionScores = computeSectionScores(answers, activeSections);
    const record = {
      stage,
      ageGroup,
      answers,
      overallStatus: effectiveStatus,
      otherStatusText,
      recommendation,
      nextAssessmentDate: nextAssessmentDate || null,
      assessmentDate: effectiveDate,
      sectionScores,
      savedAt: new Date().toISOString(),
    };

    setLoading(true);
    const childId = child?.id || child?._id;
    saveChildAssessment(childId, record)
      .then((res) => {
        const savedData = (res && res.assessment) ? res.assessment : (res && res.stage ? res : record);
        const updated = { ...savedAssessments, [stage]: savedData };
        setSavedAssessments(updated);
        setSavedMsg(`${stage} assessment saved successfully!`);
        if (onAssessmentSaved) {
          onAssessmentSaved();
        }
        setTimeout(() => setSavedMsg(""), 3500);
      })
      .catch((err) => {
        console.error("Error saving child assessment:", err);
        // Fallback save locally to guarantee state update
        const updated = { ...savedAssessments, [stage]: record };
        setSavedAssessments(updated);
        setSavedMsg(`${stage} assessment saved!`);
        setTimeout(() => setSavedMsg(""), 3500);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const stageTheme = {
    Baseline: { color: "#166534", bg: "#f0fdf4", border: "#bbf7d0", icon: "🟢", desc: "Initial entry evaluation at start of academic year" },
    Midline: { color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe", icon: "🔵", desc: "Mid-year progress checkpoint to track developmental growth" },
    Endline: { color: "#6b21a8", bg: "#faf5ff", border: "#e9d5ff", icon: "🟣", desc: "End-of-year final assessment for outcome measuring" },
  }[stage] || { color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe", icon: "📋", desc: "" };

  const stageBtn = (s) => {
    const rec = savedAssessments[s];
    const isSaved = Boolean(rec && (rec.savedAt || rec.assessmentDate || (rec.answers && Object.keys(rec.answers).length > 0) || (rec.sectionScores && rec.sectionScores.length > 0)));
    const isCurrent = stage === s;
    const isDrafting = isCurrent && answeredCount > 0 && !isSaved;

    return (
      <button
        key={s}
        type="button"
        onClick={() => setStage(s)}
        style={{
          padding: "8px 18px",
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          border: isCurrent ? "2px solid #1e40af" : "1px solid #cbd5e1",
          background: isCurrent ? "#1e40af" : "white",
          color: isCurrent ? "white" : "#475569",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: isCurrent ? "0 2px 8px rgba(30,64,175,0.25)" : "none",
          transition: "all 0.15s ease",
        }}
      >
        <span>{s} Assessment</span>
        {isSaved ? (
          <span style={{ fontSize: 11, background: isCurrent ? "rgba(255,255,255,0.25)" : "#dcfce7", color: isCurrent ? "white" : "#166534", padding: "2px 6px", borderRadius: 12, fontWeight: 700 }}>
            ✓ Saved
          </span>
        ) : isDrafting ? (
          <span style={{ fontSize: 10, background: isCurrent ? "rgba(255,255,255,0.25)" : "#fef3c7", color: isCurrent ? "white" : "#92400e", padding: "2px 6px", borderRadius: 12, fontWeight: 700 }}>
            ✏️ {answeredCount} Rated
          </span>
        ) : (
          <span style={{ fontSize: 10, opacity: 0.7 }}>(Pending)</span>
        )}
      </button>
    );
  };

  if (sectionsLoading || loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px", fontSize: 14, color: "#d97706", fontWeight: 700 }}>
        🔄 Loading question bank...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stages Bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>📌 Evaluation Stage:</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{ASSESSMENT_STAGES.map(stageBtn)}</div>
      </div>

      {/* Auto-Assigned Student Age Group Banner (Hides all other age groups) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: stageTheme.bg, border: `1px solid ${stageTheme.border}`, padding: "12px 16px", borderRadius: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>👶</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: stageTheme.color }}>
              Assigned Age Group: {ageGroup}
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
              Automatically assigned for <strong>{child?.name || "Student"}</strong> based on Date of Birth / Age · ({activeSections.length} Domains · {totalItems} Questions)
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {sectionsSource === "fallback" && (
            <Badge children="Using built-in question set" color="#92400e" bg="#fef3c7" />
          )}
          <span style={{ fontSize: 11, fontWeight: 700, background: stageTheme.color, color: "white", padding: "4px 12px", borderRadius: 20 }}>
            {stageTheme.icon} {stage} Stage Evaluation
          </span>
        </div>
      </div>

      {/* ── 3-Stage Milestone Progress Comparison Card ── */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>📊 Academic Year Milestone Progression ({ageGroup})</span>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Click any stage to view/edit</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {["Baseline", "Midline", "Endline"].map((stg) => {
            const rec = savedAssessments[stg];
            const isCurrent = stage === stg;
            const isSaved = Boolean(rec && (rec.savedAt || rec.assessmentDate || (rec.answers && Object.keys(rec.answers).length > 0) || (rec.sectionScores && rec.sectionScores.length > 0)));
            const isDrafting = isCurrent && answeredCount > 0 && !isSaved;

            const scores = rec?.sectionScores || (isCurrent && answeredCount > 0 ? computeSectionScores(answers, activeSections) : []);
            const scoreTotal = isSaved ? scores.reduce((sum, s) => sum + (s.score || 0), 0) : (isCurrent ? totalScore : 0);
            const maxTotal = scores.reduce((sum, s) => sum + (s.max || 0), 0) || totalItems * 3;
            const pct = maxTotal > 0 ? Math.round((scoreTotal / maxTotal) * 100) : 0;
            const theme = {
              Baseline: { border: "#bbf7d0", bg: "#f0fdf4", text: "#166534", badge: "🟢 Entry Stage" },
              Midline: { border: "#bfdbfe", bg: "#eff6ff", text: "#1e40af", badge: "🔵 Mid-Year" },
              Endline: { border: "#e9d5ff", bg: "#faf5ff", text: "#6b21a8", badge: "🟣 Year End" },
            }[stg];

            return (
              <div
                key={stg}
                onClick={() => setStage(stg)}
                style={{
                  background: isCurrent ? theme.bg : "#f8fafc",
                  border: isCurrent ? `2px solid ${theme.text}` : `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isCurrent ? `0 2px 8px ${theme.border}` : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: isCurrent ? theme.text : "#475569" }}>
                    {stg} Assessment
                  </span>
                  <span style={{ fontSize: 10, background: theme.bg, color: theme.text, padding: "1px 6px", borderRadius: 10, fontWeight: 700, border: `1px solid ${theme.border}` }}>
                    {theme.badge}
                  </span>
                </div>
                {isSaved ? (
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>
                      {scoreTotal} <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>/ {maxTotal} pts ({pct}%)</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#059669", fontWeight: 700, marginTop: 2 }}>
                      ✓ Saved on {rec.assessmentDate ? new Date(rec.assessmentDate).toLocaleDateString() : "Record"}
                    </div>
                  </div>
                ) : isDrafting ? (
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#d97706" }}>
                      {scoreTotal} <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>/ {totalItems * 3} pts</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#d97706", fontWeight: 700, marginTop: 2 }}>
                      ✏️ In Progress ({answeredCount}/{totalItems} rated)
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>— Pending</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Click to begin evaluation</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Specific Assessment Header */}
      <div style={{ background: "white", borderRadius: 14, border: `2px solid ${stageTheme.border}`, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
            Child's Developmental {stage} Assessment ({ageGroup})
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            {stageTheme.desc}
          </div>
        </div>
        {savedAssessments[stage] ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", background: "#dcfce7", border: "1px solid #86efac", padding: "4px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>✓</span> Saved Record Loaded for {stage}
          </div>
        ) : (
          <div style={{ fontSize: 12, fontWeight: 600, color: "#d97706", background: "#fef3c7", border: "1px solid #fde68a", padding: "4px 12px", borderRadius: 8 }}>
            📝 New Entry for {stage}
          </div>
        )}
      </div>

      <SectionCard title={`${stage} Form — ${child?.name || "Child"}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div id="item-assessment-date">
            <label style={S.label}>Assessment Date <span style={{ color: "#dc2626" }}>*</span></label>
            <input
              type="date"
              style={{ ...S.input, borderColor: showValidation && !assessmentDate ? "#dc2626" : undefined, boxShadow: showValidation && !assessmentDate ? "0 0 0 2px rgba(220,38,38,0.15)" : undefined }}
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
            />
            {showValidation && !assessmentDate && <span style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "block" }}>Required</span>}
          </div>
          <div>
            <label style={S.label}>Assessed By</label>
            <div style={{ fontSize: 13, color: "#374151", padding: "8px 0" }}>
              Auto-filled from logged-in teacher
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#1e293b",
            color: "#f1f5f9",
            borderRadius: 10,
            padding: "0.7rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>
            {answeredCount} / {totalItems} items rated
            {unansweredIds.length > 0 && (
              <span style={{ color: "#fbbf24", marginLeft: 8, fontSize: 12 }}>({unansweredIds.length} remaining)</span>
            )}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#fca5a5", fontSize: 11 }}>All fields are mandatory <span style={{ color: "#ef4444" }}>*</span></span>
            <span>Running score: {totalScore}</span>
          </span>
        </div>
        {showValidation && unansweredIds.length > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            Please rate all {unansweredIds.length} unanswered items before saving. Unanswered items are highlighted in red.
          </div>
        )}

        {activeSections.map((section) => (
          <div key={section.id} style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "2px solid #1e293b",
                paddingBottom: "0.4rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "2px 8px", borderRadius: 6 }}>
                  Domain {section.number}
                </span>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1c1917", margin: 0 }}>
                  {section.title} <span style={{ color: "#dc2626", fontSize: 14 }}>*</span>
                </h3>
              </div>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, background: "#f1f5f9", padding: "2px 8px", borderRadius: 4 }}>
                {section.items.length} Questions
              </span>
            </div>

            {section.items.map((item, idx) => {
              const scale = item.ratingScale || RATING_SCALE_3;
              const currentValue = answers[item.id];
              const hasActivities = item.activities?.length > 0;
              const isOpen = !!openActivities[item.id];
              const isUnanswered = showValidation && !currentValue;

              return (
                <div
                  key={item.id}
                  id={`item-${item.id}`}
                  style={{
                    background: isUnanswered ? "#fff5f5" : "white",
                    border: isUnanswered ? "1.5px solid #fca5a5" : "1px solid #e4e2da",
                    borderRadius: 10,
                    padding: "0.9rem 1rem",
                    marginBottom: "0.8rem",
                    boxShadow: isUnanswered ? "0 0 0 2px rgba(220,38,38,0.1)" : "0 1px 2px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Question Header & Title */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: 4, marginRight: 8 }}>
                        Question {idx + 1} ({item.id})
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                        {item.title || item.text}
                      </span>
                    </div>
                    {currentValue ? (
                      <span style={{ color: "#16a34a", fontWeight: "bold", fontSize: 12, background: "#f0fdf4", padding: "2px 8px", borderRadius: 999, border: "1px solid #bbf7d0" }}>
                        ✓ Rated
                      </span>
                    ) : isUnanswered ? (
                      <span style={{ color: "#dc2626", fontSize: 11, fontWeight: 700, background: "#fef2f2", padding: "2px 8px", borderRadius: 4 }}>
                        Required
                      </span>
                    ) : null}
                  </div>

                  {/* Milestone & Stage Focus Badges */}
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Stage Focus Tag */}
                    <span style={{ fontSize: 11, background: stageTheme.bg, color: stageTheme.color, padding: "2px 8px", borderRadius: 4, border: `1px solid ${stageTheme.border}`, fontWeight: 700 }}>
                      {stageTheme.icon} {stage} Benchmark Objective
                    </span>
                    {item.milestone && (
                      <span style={{ fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 4, border: "1px solid #cbd5e1" }}>
                        📌 <strong>LFA Indicator:</strong> {item.milestone}
                      </span>
                    )}
                    {item.targetAge && (
                      <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                        🎯 Target Age: {item.targetAge}
                      </span>
                    )}
                  </div>

                  {/* Question Observation Text */}
                  <p style={{ margin: "8px 0 6px 0", fontSize: 13, color: "#334155", fontWeight: 500, lineHeight: 1.4 }}>
                    {item.text} <span style={{ color: "#dc2626" }}>*</span>
                  </p>

                  {/* Rating buttons */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {scale.map((option) => {
                      const selected = currentValue === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAnswer(item.id, option)}
                          style={{
                            fontSize: 11,
                            fontWeight: selected ? 700 : 600,
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: selected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                            background: selected ? "#2563eb" : "#f8fafc",
                            color: selected ? "white" : "#334155",
                            cursor: "pointer",
                            boxShadow: selected ? "0 2px 4px rgba(37,99,235,0.2)" : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {/* Suggested Activities toggle */}
                  {hasActivities && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => toggleActivities(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 11,
                          color: "#d97706",
                          fontWeight: 600,
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        💡 {isOpen ? "Hide" : "Show"} activities to observe/implement ({item.activities.length}) {isOpen ? "▲" : "▼"}
                      </button>
                      {isOpen && (
                        <div style={{ marginTop: 6, padding: "8px 12px", background: "#fffbeb", borderRadius: 6, border: "1px solid #fef3c7" }}>
                          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
                            {item.activities.map((a, i) => <li key={i} style={{ marginBottom: 3 }}>{a}</li>)}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", marginBottom: 8 }}>
            Overall Developmental Progress <span style={{ color: "#dc2626" }}>*</span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {OVERALL_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4b4f45", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="overallStatus"
                  checked={overallStatus === opt.value}
                  onChange={() => setOverallStatus(opt.value)}
                />
                {opt.label}
              </label>
            ))}
            {overallStatus === "other" && (
              <input
                type="text"
                value={otherStatusText}
                onChange={(e) => setOtherStatusText(e.target.value)}
                placeholder="Please specify details"
                style={{ ...S.input, marginTop: 6 }}
              />
            )}
          </div>
          {showValidation && !overallStatus && <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600, marginBottom: 8 }}>⚠️ Please select an overall status</div>}

          <label style={S.label}>Recommendations / Next Steps</label>
          <textarea
            style={{ ...S.input, height: 70, resize: "vertical", marginBottom: 12 }}
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            placeholder="Enter recommended activities, therapies, or observations..."
          />

          <label style={S.label}>Next Follow-up Assessment Date</label>
          <input
            type="date"
            style={{ ...S.input, marginBottom: 16 }}
            value={nextAssessmentDate}
            onChange={(e) => setNextAssessmentDate(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button onClick={handleSaveAssessment} style={S.primaryBtn}>
            💾 Save {stage} Assessment
          </button>
          {savedMsg && <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>✓ {savedMsg}</span>}
          {showValidation && unansweredIds.length > 0 && (
            <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 700 }}>
              ⚠️ {unansweredIds.length} unanswered item{unansweredIds.length > 1 ? "s" : ""} — please complete all fields
            </span>
          )}
        </div>
      </SectionCard>

      <SectionCard title="📈 Section-wise Score Breakdown">
        <SectionPieChart data={savedAssessments[stage]?.sectionScores || computeSectionScores(answers, activeSections)} />
      </SectionCard>
    </div>
  );
}
/**
 * Build activity recommendations from the Section-wise Score Breakdown chart.
 * HIGH score → 1-2 suggestions only (child is doing well)
 * LOW score  → MORE suggestions (child needs support)
 */
function buildRecommendationsFromChart(chartScores, answers, activeSections = SECTIONS_2_3_YEARS) {
  const sectionsToUse = activeSections || SECTIONS_2_3_YEARS;
  return sectionsToUse.map((section) => {
    const chartEntry = chartScores.find((cs) => cs.id === section.id);
    if (!chartEntry) return null;

    const pct = chartEntry.max > 0 ? Math.round((chartEntry.score / chartEntry.max) * 100) : 0;

    // HIGH score = fewer suggestions, LOW score = more suggestions
    let maxItems, maxActivitiesPerItem;
    if (pct >= 76) {
      // Doing great — just 1 item, 1 activity
      maxItems = 1;
      maxActivitiesPerItem = 1;
    } else if (pct >= 51) {
      // Good progress — 2 items, 1 activity each
      maxItems = 2;
      maxActivitiesPerItem = 1;
    } else if (pct >= 26) {
      // Needs support — all items, 2 activities each
      maxItems = section.items.length;
      maxActivitiesPerItem = 2;
    } else {
      // Needs strong support — ALL items, ALL activities
      maxItems = section.items.length;
      maxActivitiesPerItem = 3;
    }

    // Sort items by individual score (weakest first)
    const sortedItems = [...section.items].sort((a, b) => {
      const sa = scoreOf(answers[a.id]);
      const sb = scoreOf(answers[b.id]);
      return (sa === null ? -1 : sa) - (sb === null ? -1 : sb);
    });

    const items = sortedItems.slice(0, maxItems).map((item) => ({
      ...item,
      itemScore: scoreOf(answers[item.id]),
      activities: item.activities.slice(0, maxActivitiesPerItem),
    }));

    return {
      sectionId: section.id,
      sectionNumber: section.number,
      title: section.title,
      score: chartEntry.score,
      max: chartEntry.max,
      pct,
      items,
      totalActivities: items.reduce((sum, it) => sum + it.activities.length, 0),
    };
  })
    .filter(Boolean)
    .sort((a, b) => a.pct - b.pct);
}

// Section icons for visual flair
const SECTION_ICONS = {
  gross_fine_motor: "🏃",
  cognitive: "🧠",
  social_emotional: "🤝",
  language: "🗣️",
  adaptive: "🎒",
  sensory_regulation: "🎨",
};

function ActivitySuggestionsTab({ child }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [completedActivities, setCompletedActivities] = useState({});
  // Start: Dnyaneshwari Thorat
  const [savedAssessments, setSavedAssessments] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const childId = child?.id || child?._id;
    if (!childId) return;
    setLoading(true);
    getChildAssessments(childId)
      .then((data) => {
        setSavedAssessments(data || {});
      })
      .catch((err) => {
        console.error("Error loading child assessments for suggestions:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [child]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px", fontSize: 14, color: "#d97706", fontWeight: 700 }}>
        🔄 Loading suggestions...
      </div>
    );
  }

  let chartScores = null;
  let answers = {};
  let latestStage = "";

  const ageGroup = getAgeGroupFromChild(child);
  const activeSections = AGE_GROUPS[ageGroup] || SECTIONS_2_3_YEARS;

  for (const stage of ["Endline", "Midline", "Baseline"]) {
    if (savedAssessments[stage] && savedAssessments[stage].answers && Object.keys(savedAssessments[stage].answers).length > 0) {
      const rec = savedAssessments[stage];
      answers = rec.answers || {};
      chartScores = rec.sectionScores || computeSectionScores(answers, activeSections);
      latestStage = stage;
      break;
    }
  }

  const hasChartData = chartScores && chartScores.some((s) => s.score > 0);
  // End: Dnyaneshwari Thorat

  // ── No data state ──
  if (!hasChartData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0" }}>
        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "2px dashed #d97706",
            padding: "48px 40px",
            textAlign: "center",
            maxWidth: 500,
            width: "100%",
            boxShadow: "0 4px 24px rgba(217,119,6,0.08)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              margin: "0 auto 20px",
              boxShadow: "0 4px 12px rgba(245,158,11,0.2)",
            }}
          >
            🎯
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
            Complete an Assessment First
          </div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
            Activity suggestions are based on the <strong style={{ color: "#d97706" }}>Section-wise Score Breakdown</strong> chart.
            Go to the <strong>Child Assessment</strong> tab, rate each section, and save. Suggestions will appear here automatically.
          </div>
        </div>
      </div>
    );
  }

  const recommendations = buildRecommendationsFromChart(chartScores, answers, activeSections);
  const totalActivities = recommendations.reduce((sum, r) => sum + r.totalActivities, 0);
  const completedCount = Object.values(completedActivities).filter(Boolean).length;

  const toggleSection = (id) => setExpandedSections((p) => ({ ...p, [id]: !p[id] }));
  const toggleComplete = (key) => setCompletedActivities((p) => ({ ...p, [key]: !p[key] }));

  // Score-to-label helper
  const getScoreLabel = (pct) => {
    if (pct >= 76) return { text: "Doing Well", color: "#059669", bg: "#d1fae5" };
    if (pct >= 51) return { text: "Good Progress", color: "#d97706", bg: "#fef3c7" };
    if (pct >= 26) return { text: "Needs Support", color: "#ea580c", bg: "#fff7ed" };
    return { text: "Needs Focus", color: "#dc2626", bg: "#fee2e2" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Header Banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
          borderRadius: 16,
          padding: "22px 24px",
          color: "white",
          borderTop: "3px solid #f59e0b",
          boxShadow: "0 4px 20px rgba(15,23,42,0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                🎯 Activity Suggestions
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              Based on <span style={{ color: "#fbbf24", fontWeight: 700 }}>{latestStage}</span> Score Breakdown · Low scores get more suggestions
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ textAlign: "center", padding: "6px 14px", background: "rgba(245,158,11,0.12)", borderRadius: 10, border: "1px solid rgba(245,158,11,0.25)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>{totalActivities}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Total</div>
            </div>
            <div style={{ textAlign: "center", padding: "6px 14px", background: "rgba(16,185,129,0.12)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.25)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399" }}>{completedCount}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Done</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 14, background: "#334155", borderRadius: 999, height: 5, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, #f59e0b, #d97706)",
              width: totalActivities > 0 ? `${(completedCount / totalActivities) * 100}%` : "0%",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* ── Section Cards ── */}
      {recommendations.map((rec) => {
        const isExpanded = expandedSections[rec.sectionId] !== false;
        const label = getScoreLabel(rec.pct);
        const icon = SECTION_ICONS[rec.sectionId] || "📋";

        return (
          <div
            key={rec.sectionId}
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #f1f5f9",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {/* Section Header */}
            <div
              onClick={() => toggleSection(rec.sectionId)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                cursor: "pointer",
                borderBottom: isExpanded ? "1px solid #fde68a" : "none",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(217,119,6,0.3)",
                  }}
                >
                  {icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>
                    {rec.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: label.color,
                        background: label.bg,
                        padding: "2px 10px",
                        borderRadius: 20,
                        border: `1px solid ${label.color}30`,
                      }}
                    >
                      {label.text}
                    </span>
                    <span style={{ fontSize: 11, color: "#92400e", fontWeight: 600 }}>
                      {rec.score}/{rec.max} pts
                    </span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      · {rec.totalActivities} {rec.totalActivities === 1 ? "activity" : "activities"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Score ring */}
                <div style={{ position: "relative", width: 44, height: 44 }}>
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                    <circle
                      cx="22" cy="22" r="18" fill="none"
                      stroke={rec.pct >= 76 ? "#059669" : rec.pct >= 51 ? "#d97706" : rec.pct >= 26 ? "#ea580c" : "#dc2626"}
                      strokeWidth="3"
                      strokeDasharray={`${(rec.pct / 100) * 113.1} 113.1`}
                      strokeLinecap="round"
                      transform="rotate(-90 22 22)"
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0f172a" }}>
                    {rec.pct}%
                  </div>
                </div>

                <span style={{ fontSize: 14, color: "#d97706", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>
                  ▼
                </span>
              </div>
            </div>

            {/* Activity Cards */}
            {isExpanded && (
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {rec.items.map((item) => (
                  <div key={item.id}>
                    {/* Item label */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span
                        style={{
                          background: "linear-gradient(135deg, #f59e0b, #d97706)",
                          color: "white",
                          fontSize: 10,
                          fontWeight: 800,
                          borderRadius: 6,
                          padding: "3px 9px",
                          flexShrink: 0,
                        }}
                      >
                        {item.id}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", lineHeight: 1.4, flex: 1 }}>
                        {item.text}
                      </span>
                      {item.itemScore !== null && item.itemScore !== undefined && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: item.itemScore <= 1 ? "#dc2626" : item.itemScore <= 2 ? "#d97706" : "#059669",
                            background: item.itemScore <= 1 ? "#fee2e2" : item.itemScore <= 2 ? "#fef3c7" : "#d1fae5",
                            borderRadius: 20,
                            padding: "2px 10px",
                            flexShrink: 0,
                          }}
                        >
                          Score {item.itemScore}
                        </span>
                      )}
                    </div>

                    {/* Activity cards grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
                      {item.activities.map((activity, ai) => {
                        const actKey = `${item.id}_${ai}`;
                        const isDone = !!completedActivities[actKey];
                        // Parse activity name (before —) and description (after —)
                        const dashIdx = activity.indexOf("—");
                        const actName = dashIdx > -1 ? activity.slice(0, dashIdx).trim() : activity;
                        const actDesc = dashIdx > -1 ? activity.slice(dashIdx + 1).trim() : "";

                        return (
                          <div
                            key={ai}
                            style={{
                              background: isDone
                                ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                                : "white",
                              border: isDone ? "1.5px solid #86efac" : "1.5px solid #f1f5f9",
                              borderRadius: 14,
                              padding: "16px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                              transition: "all 0.25s ease",
                              opacity: isDone ? 0.8 : 1,
                              boxShadow: isDone
                                ? "none"
                                : "0 2px 8px rgba(0,0,0,0.04)",
                              borderTop: isDone
                                ? "3px solid #10b981"
                                : "3px solid #f59e0b",
                            }}
                          >
                            {/* Activity name */}
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: isDone ? "#059669" : "#0f172a",
                                textDecoration: isDone ? "line-through" : "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span style={{ fontSize: 14 }}>{isDone ? "✅" : "📌"}</span>
                              {actName}
                            </div>

                            {/* Activity description */}
                            {actDesc && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: isDone ? "#6b7280" : "#64748b",
                                  lineHeight: 1.6,
                                  textDecoration: isDone ? "line-through" : "none",
                                }}
                              >
                                {actDesc}
                              </div>
                            )}

                            {/* Mark done button */}
                            <button
                              onClick={() => toggleComplete(actKey)}
                              style={{
                                alignSelf: "flex-start",
                                marginTop: "auto",
                                background: isDone
                                  ? "linear-gradient(135deg, #10b981, #059669)"
                                  : "linear-gradient(135deg, #f59e0b, #d97706)",
                                border: "none",
                                borderRadius: 8,
                                padding: "6px 16px",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "white",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: isDone
                                  ? "0 2px 8px rgba(16,185,129,0.25)"
                                  : "0 2px 8px rgba(217,119,6,0.25)",
                              }}
                            >
                              {isDone ? "✓ Completed" : "Mark Done"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ChildDashboardModal({ child, onClose }) {
  const [tab, setTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: child?.name || "" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setForm({ name: child?.name || "" });
    setTab("profile");
    setEditing(false);
  }, [child]);

  const handleSaveProfile = () => {
    setSaving(true);
    // TODO(backend): call updateChildProfile(child.id, form) once endpoint exists
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
    }, 400);
  };

  const handleAssessmentSaved = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const tabBtn = (key, label, icon) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 16px",
        border: "none",
        borderRadius: 10,
        background: tab === key ? "#dbeafe" : "transparent",
        color: tab === key ? "#1e40af" : "#6b7280",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );

  if (!child) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1200,
        backdropFilter: "blur(4px)",
        overflowY: "auto",
        padding: "32px 16px",
      }}
    >
      <div style={{ background: "#f8fafc", borderRadius: 20, width: "100%", maxWidth: 960, boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e5e7eb", background: "white", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👶</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1c1917" }}>{child.name}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Roll No: {child.rollNo}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "12px 24px 0", background: "white", borderBottom: "1px solid #f1f5f9" }}>
          {tabBtn("profile", "Child Profile", "🧾")}
          {tabBtn("assessment", "Child Assessment", "📊")}
          {tabBtn("activities", "Activity Suggestions", "🎯")}
        </div>

        {/* Content */}
        <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}>
          {tab === "profile" && (
            <ChildProfileTab child={child} editing={editing} setEditing={setEditing} form={form} setForm={setForm} onSave={handleSaveProfile} saving={saving} />
          )}
          {tab === "assessment" && (
            <ChildAssessmentTab child={child} onAssessmentSaved={handleAssessmentSaved} />
          )}
          {tab === "activities" && (
            <ActivitySuggestionsTab key={`${child.id}_${refreshKey}`} child={child} />
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", background: "white", borderRadius: "0 0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={S.exportBtn}>← Back</button>
        </div>
      </div>
    </div>
  );
}
// Prajwal end

export function normalizeAgeGroup(strVal) {
  if (strVal === undefined || strVal === null || strVal === "") return null;
  const s = String(strVal).trim().toLowerCase();

  if (s.includes("1-2") || s.includes("1–2") || s.includes("toddler")) return "1–2 Years";
  if (s.includes("2-3") || s.includes("2–3") || s.includes("playgroup")) return "2–3 Years";
  if (s.includes("3-4") || s.includes("3–4") || s.includes("nursery")) return "3–4 Years";
  if (s.includes("4-5") || s.includes("4–5") || s.includes("jr") || s.includes("junior")) return "4–5 Years";
  if (s.includes("5-6") || s.includes("5–6") || s.includes("sr") || s.includes("senior")) return "5–6 Years";

  const num = Number(s);
  if (!isNaN(num)) {
    if (num < 2.0) return "1–2 Years";
    if (num < 3.0) return "2–3 Years";
    if (num < 4.0) return "3–4 Years";
    if (num < 5.0) return "4–5 Years";
    return "5–6 Years";
  }

  return null;
}

export function getAgeGroupFromChild(child) {
  if (!child) return "2–3 Years";

  // 1. Explicit ageGroup property
  if (child.ageGroup) {
    const norm = normalizeAgeGroup(child.ageGroup);
    if (norm) return norm;
  }
  if (child.class?.ageGroup) {
    const norm = normalizeAgeGroup(child.class.ageGroup);
    if (norm) return norm;
  }

  // 2. DOB calculation
  const dobVal = child.dateOfBirth || child.dob;
  if (dobVal) {
    const dob = new Date(dobVal);
    if (!isNaN(dob.getTime())) {
      const ageInYears = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (ageInYears < 2.0) return "1–2 Years";
      if (ageInYears < 3.0) return "2–3 Years";
      if (ageInYears < 4.0) return "3–4 Years";
      if (ageInYears < 5.0) return "4–5 Years";
      return "5–6 Years";
    }
  }

  // 3. Numeric/string age property (e.g. 5, "5", "5-6")
  if (child.age !== undefined && child.age !== null) {
    const normAge = normalizeAgeGroup(child.age);
    if (normAge) return normAge;
  }

  // 4. Class Name / Label Fallback (e.g. "sr (5-6)", "5-6", "Senior KG")
  const classNameStr = child.className || child.class?.name || child.class;
  if (classNameStr) {
    const normClass = normalizeAgeGroup(classNameStr);
    if (normClass) return normClass;
  }

  return "2–3 Years";
}
