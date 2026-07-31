import React, { useState, useEffect } from "react";
import { StatusBadge } from "../components/Shared";

const API_BASE_URL = "http://localhost:5000";

/* ── Shared amber-themed style tokens for this tab ── */
const btnPrimary = {
  padding: "10px 20px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
  color: "white",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 2px 6px rgba(217,119,6,0.3)",
};
const btnGhost = {
  padding: "10px 20px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "white",
  color: "#374151",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};
const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #fbbf24",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  background: "white",
};
const labelStyle = { display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#92400e" };

// Start: Prajwal edit
const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function formatDuration(numSemesters) {
  const months = (numSemesters || 0) * 6;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${months} Months`;
  if (remMonths === 0) return `${years} Year${years > 1 ? "s" : ""}`;
  return `${years} Year${years > 1 ? "s" : ""} ${remMonths} Months`;
}
// End: Prajwal edit

function StatCard({ icon, label, value, tint }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 140,
        background: "white",
        borderRadius: 16,
        padding: "18px 20px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        borderLeft: `4px solid ${tint}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 40, height: 40, borderRadius: 12, background: `${tint}1a`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#1c1917", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function HeroBanner({ icon, title, subtitle }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
        borderRadius: 20,
        padding: "26px 28px",
        marginBottom: 22,
        color: "white",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(217,119,6,0.25)",
      }}
    >
      <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>{icon} {title}</h1>
      <p style={{ fontSize: 13, opacity: 0.92, margin: "6px 0 0", fontWeight: 600 }}>{subtitle}</p>
    </div>
  );
}

// Start: Prajwal edit — redesigned plan card: gradient header, hover lift, semester progress strip
function PlanCard({ plan, onManage, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const isPublished = plan.status === "published";
  const accent = isPublished ? "#10b981" : "#f59e0b";
  const accentSoft = isPublished ? "#ecfdf5" : "#fffbeb";
  const numSem = plan.numSemesters || 1;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        borderRadius: 20,
        border: "1px solid #f1f5f9",
        boxShadow: hovered ? "0 16px 32px rgba(0,0,0,0.10)" : "0 2px 8px rgba(0,0,0,0.05)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "all 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        cursor: "default",
      }}
    >
      {/* Gradient header strip */}
      <div
        style={{
          height: 74,
          background: isPublished
            ? "linear-gradient(135deg,#10b981 0%,#059669 100%)"
            : "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -20,
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            transition: "transform 0.4s ease",
            transform: hovered ? "scale(1.15)" : "scale(1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -40,
            right: 30,
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div style={{ fontSize: 30, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))", zIndex: 1 }}>
          {isPublished ? "🚀" : "📝"}
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10.5,
            fontWeight: 800,
            color: "white",
            background: "rgba(255,255,255,0.22)",
            padding: "4px 11px",
            borderRadius: 20,
            letterSpacing: "0.3px",
            zIndex: 1,
            textTransform: "uppercase",
          }}
        >
          {isPublished ? "Published" : "Draft"}
        </span>
      </div>

      <div style={{ padding: "18px 20px 4px", flex: 1 }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#1c1917", fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>
          {plan.title}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 11, fontWeight: 700, color: accent, background: accentSoft,
              padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4,
            }}
          >
            ⏱ {formatDuration(numSem)}
          </span>
          <span
            style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af", background: "#f8fafc",
              padding: "4px 10px", borderRadius: 20,
            }}
          >
            📅 {new Date(plan.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Semester progress strip — visualizes plan length at a glance */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", marginBottom: 6, letterSpacing: "0.3px" }}>
            {numSem} SEMESTER{numSem > 1 ? "S" : ""}
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 4,
                  background: i < numSem ? accent : "#f1f5f9",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 20px", display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={onManage}
          style={{
            flex: 1,
            padding: "11px 16px",
            borderRadius: 12,
            border: "none",
            background: hovered
              ? "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)"
              : "#fffbeb",
            color: hovered ? "white" : "#92400e",
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow: hovered ? "0 6px 16px rgba(217,119,6,0.35)" : "none",
            transition: "all 0.22s ease",
          }}
        >
          Manage Plan <span style={{ transform: hovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.22s ease", display: "inline-block" }}>→</span>
        </button>
        {/* Start: Prajwal edit — added Delete Plan button */}
        <button
          onClick={onDelete}
          title="Delete Plan"
          style={{
            padding: "4px 10px",
            borderRadius: 12,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b30d0d",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "inherit",
            flexShrink: 0,
          }}
        >
          🗑️
        </button>
        {/* End: Prajwal edit */}
      </div>
    </div>
  );
}
// End: Prajwal edit

function MentorCurriculumTab({ user }) {
  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [phases, setPhases] = useState([]);

  // UI states
  const [view, setView] = useState("list"); // list, detail
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form states
  // Start: Prajwal edit — replaced 1yr/2yr durationType with numSemesters (1-8, 6 months each)
  const [planForm, setPlanForm] = useState({ title: "", numSemesters: 1 });
  // End: Prajwal edit
  const [phaseForm, setPhaseForm] = useState({
    phaseNumber: 1,
    semester: "Semester 1",
    title: "",
    startDate: "",
    endDate: "",
    topics: [],
  });

  const [mentees, setMentees] = useState([]);
  const [assignForm, setAssignForm] = useState({ fellowId: "", activePhaseId: "" });

  const token = localStorage.getItem("spaceece_auth_token");

  useEffect(() => {
    fetchPlans();
    fetchMentees();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/curriculum/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPhases = async (planId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/curriculum/plans/${planId}/phases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPhases(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMentees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/tracking/mentees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMentees(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/curriculum/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(planForm),
      });
      if (res.ok) {
        fetchPlans();
        setShowPlanForm(false);
        // Start: Prajwal edit
        setPlanForm({ title: "", numSemesters: 1 });
        // End: Prajwal edit
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishPlan = async (planId) => {
    try {
      const plan = plans.find((p) => p._id === planId);
      const res = await fetch(`${API_BASE_URL}/api/mentor/curriculum/plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // Start: Prajwal edit — send numSemesters instead of removed durationType
        body: JSON.stringify({ title: plan.title, numSemesters: plan.numSemesters, status: "published" }),
        // End: Prajwal edit
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start: Prajwal edit — delete plan handler
  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this curriculum plan? This cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/curriculum/plans/${planId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPlans();
      } else {
        const error = await res.json();
        alert(`Failed to delete: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };
  // End: Prajwal edit

  const handleCreatePhase = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/curriculum/plans/${activePlanId}/phases`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(phaseForm),
      });
      if (res.ok) {
        fetchPhases(activePlanId);
        setShowPhaseForm(false);
        setPhaseForm({
          phaseNumber: phases.length + 2,
          semester: `Semester ${Math.ceil((phases.length + 2) / 2)}`,
          title: "",
          startDate: "",
          endDate: "",
          topics: [],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignPlan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/curriculum/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planId: activePlanId,
          fellowId: assignForm.fellowId,
          activePhaseId: assignForm.activePhaseId,
        }),
      });
      if (res.ok) {
        alert("Plan successfully assigned to Fellow!");
        setShowAssignModal(false);
        setAssignForm({ fellowId: "", activePhaseId: "" });
      } else {
        const error = await res.json();
        alert(`Failed: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Dynamic Topic and Material Handlers ---
  const addTopic = () => {
    setPhaseForm({ ...phaseForm, topics: [...phaseForm.topics, { title: "", description: "", materials: [] }] });
  };

  const updateTopic = (index, field, value) => {
    const updatedTopics = [...phaseForm.topics];
    updatedTopics[index][field] = value;
    setPhaseForm({ ...phaseForm, topics: updatedTopics });
  };

  const removeTopic = (index) => {
    const updatedTopics = [...phaseForm.topics];
    updatedTopics.splice(index, 1);
    setPhaseForm({ ...phaseForm, topics: updatedTopics });
  };

  const addMaterial = (topicIndex) => {
    const updatedTopics = [...phaseForm.topics];
    updatedTopics[topicIndex].materials.push({ type: "pdf", title: "", fileUrl: "" });
    setPhaseForm({ ...phaseForm, topics: updatedTopics });
  };

  const updateMaterial = (topicIndex, materialIndex, field, value) => {
    const updatedTopics = [...phaseForm.topics];
    updatedTopics[topicIndex].materials[materialIndex][field] = value;
    setPhaseForm({ ...phaseForm, topics: updatedTopics });
  };

  const removeMaterial = (topicIndex, materialIndex) => {
    const updatedTopics = [...phaseForm.topics];
    updatedTopics[topicIndex].materials.splice(materialIndex, 1);
    setPhaseForm({ ...phaseForm, topics: updatedTopics });
  };

  /* ══════════════════════ DETAIL VIEW ══════════════════════ */
  if (view === "detail") {
    const activePlan = plans.find((p) => p._id === activePlanId);
    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button style={btnGhost} onClick={() => { setView("list"); setActivePlanId(null); }}>
            ← Back to Plans
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            {activePlan?.status === "draft" && (
              <button style={btnPrimary} onClick={() => handlePublishPlan(activePlanId)}>
                🚀 Publish Plan
              </button>
            )}
            <button
              style={{
                ...btnGhost,
                background: activePlan?.status === "draft" ? "#f3f4f6" : "white",
                color: activePlan?.status === "draft" ? "#9ca3af" : "#92400e",
                border: activePlan?.status === "draft" ? "1px solid #e5e7eb" : "1px solid #fbbf24",
                cursor: activePlan?.status === "draft" ? "not-allowed" : "pointer",
              }}
              onClick={() => setShowAssignModal(true)}
              disabled={activePlan?.status === "draft"}
              title={activePlan?.status === "draft" ? "Publish the plan before assigning" : ""}
            >
              👤 Assign to Fellow
            </button>
          </div>
        </div>

        {/* Plan header card */}
        <div
          style={{
            background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
            borderRadius: 20,
            padding: "22px 26px",
            marginBottom: 22,
            color: "white",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(217,119,6,0.25)",
          }}
        >
          <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <h2 style={{ margin: "0 0 10px 0", fontSize: 22, fontWeight: 900, letterSpacing: "-0.3px" }}>{activePlan?.title}</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Start: Prajwal edit — show semester count + computed duration instead of 1yr/2yr */}
            <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20 }}>
              📆 {activePlan?.numSemesters || 1} Semester{(activePlan?.numSemesters || 1) > 1 ? "s" : ""} · {formatDuration(activePlan?.numSemesters || 1)}
            </span>
            {/* End: Prajwal edit */}
            <StatusBadge status={activePlan?.status} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1c1917" }}>📚 Curriculum Phases</h3>
          <button style={{ ...btnPrimary, padding: "8px 16px" }} onClick={() => setShowPhaseForm(!showPhaseForm)}>
            {showPhaseForm ? "✕ Close" : "+ Add Phase"}
          </button>
        </div>

        {showPhaseForm && (
          <div
            style={{
              background: "#fffbeb",
              padding: 22,
              borderRadius: 16,
              border: "1px solid #fde68a",
              marginBottom: 22,
            }}
          >
            <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 800, color: "#92400e" }}>New Phase</h4>
            <form onSubmit={handleCreatePhase}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 15 }}>
                <div>
                  <label style={labelStyle}>Phase Title</label>
                  <input
                    type="text"
                    required
                    style={inputStyle}
                    value={phaseForm.title}
                    onChange={(e) => setPhaseForm({ ...phaseForm, title: e.target.value })}
                    placeholder="e.g. Introduction to Early Childhood"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Semester</label>
                  {/* Start: Prajwal edit — extended Semester options from 4 to 8 */}
                  <select style={inputStyle} value={phaseForm.semester} onChange={(e) => setPhaseForm({ ...phaseForm, semester: e.target.value })}>
                    {SEMESTER_OPTIONS.map((n) => (
                      <option key={n} value={`Semester ${n}`}>
                        Semester {n}
                      </option>
                    ))}
                  </select>
                  {/* End: Prajwal edit */}
                </div>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input type="date" required style={inputStyle} value={phaseForm.startDate} onChange={(e) => setPhaseForm({ ...phaseForm, startDate: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input type="date" required style={inputStyle} value={phaseForm.endDate} onChange={(e) => setPhaseForm({ ...phaseForm, endDate: e.target.value })} />
                </div>
              </div>

              {/* Topics Builder */}
              <div style={{ marginBottom: 20 }}>
                <h5 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#92400e" }}>Topics</h5>
                {phaseForm.topics.map((topic, tIdx) => (
                  <div key={tIdx} style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #fde68a", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#1c1917" }}>Topic {tIdx + 1}</span>
                      <button type="button" onClick={() => removeTopic(tIdx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Topic Title"
                      required
                      style={{ ...inputStyle, marginBottom: 10 }}
                      value={topic.title}
                      onChange={(e) => updateTopic(tIdx, "title", e.target.value)}
                    />
                    <textarea
                      placeholder="Topic Description"
                      style={{ ...inputStyle, marginBottom: 10, minHeight: 60, resize: "vertical" }}
                      value={topic.description}
                      onChange={(e) => updateTopic(tIdx, "description", e.target.value)}
                    />

                    {/* Materials Builder */}
                    <div style={{ marginLeft: 15, borderLeft: "2px solid #fde68a", paddingLeft: 15 }}>
                      <h6 style={{ margin: "0 0 10px 0", fontSize: 12, fontWeight: 700, color: "#9ca3af" }}>Materials</h6>
                      {topic.materials.map((mat, mIdx) => (
                        <div key={mIdx} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                          <select style={{ ...inputStyle, width: 100 }} value={mat.type} onChange={(e) => updateMaterial(tIdx, mIdx, "type", e.target.value)}>
                            <option value="pdf">PDF</option>
                            <option value="video">Video</option>
                            <option value="link">Link</option>
                            <option value="doc">Doc</option>
                          </select>
                          <input type="text" placeholder="Title" style={{ ...inputStyle, flex: 1 }} value={mat.title} onChange={(e) => updateMaterial(tIdx, mIdx, "title", e.target.value)} />
                          <input
                            type="url"
                            placeholder="File URL"
                            required
                            style={{ ...inputStyle, flex: 2 }}
                            value={mat.fileUrl}
                            onChange={(e) => updateMaterial(tIdx, mIdx, "fileUrl", e.target.value)}
                          />
                          <button type="button" onClick={() => removeMaterial(tIdx, mIdx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18 }}>
                            &times;
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addMaterial(tIdx)}
                        style={{ background: "none", border: "1px dashed #fbbf24", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#92400e", fontWeight: 700 }}
                      >
                        + Add Material
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTopic}
                  style={{ ...btnGhost, background: "white", border: "1px dashed #fbbf24", color: "#92400e", padding: "8px 16px", fontSize: 12 }}
                >
                  + Add Topic
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" style={btnGhost} onClick={() => setShowPhaseForm(false)}>
                  Cancel
                </button>
                <button type="submit" style={btnPrimary}>
                  Save Phase
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Phase Timeline View */}
        <div style={{ position: "relative", marginLeft: 10 }}>
          <div style={{ position: "absolute", left: 15, top: 0, bottom: 0, width: 2, background: "#fde68a" }}></div>
          {phases.length === 0 ? (
            <div style={{ padding: "20px 40px", color: "#9ca3af", fontStyle: "italic", fontSize: 13 }}>No phases added yet.</div>
          ) : (
            phases.map((phase) => (
              <div key={phase._id} style={{ position: "relative", paddingLeft: 40, marginBottom: 24 }}>
                <div
                  style={{
                    position: "absolute", left: 9, top: 5, width: 14, height: 14, borderRadius: "50%",
                    background: "#f59e0b", border: "3px solid white", boxShadow: "0 0 0 1px #f59e0b",
                  }}
                ></div>
                <div style={{ background: "white", padding: 18, borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", color: "#1c1917", fontSize: 15, fontWeight: 800 }}>
                        Phase {phase.phaseNumber}: {phase.title}
                      </h4>
                      <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
                        <span style={{ fontWeight: 800, color: "#92400e", marginRight: 10 }}>{phase.semester}</span>
                        {new Date(phase.startDate).toLocaleDateString()} – {new Date(phase.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {phase.topics?.length > 0 && (
                    <div style={{ marginTop: 14, borderTop: "1px dashed #f1f5f9", paddingTop: 14 }}>
                      <h5 style={{ margin: "0 0 10px 0", fontSize: 12.5, fontWeight: 800, color: "#92400e" }}>Topics ({phase.topics.length})</h5>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {phase.topics.map((topic, tIdx) => (
                          <div key={tIdx} style={{ fontSize: 12.5, background: "#fffbeb", padding: "9px 12px", borderRadius: 8 }}>
                            <div style={{ fontWeight: 700, color: "#374151" }}>{topic.title}</div>
                            {topic.materials?.length > 0 && (
                              <div style={{ color: "#9ca3af", marginTop: 4, fontSize: 11.5 }}>{topic.materials.length} Material(s)</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Assign Modal */}
        {showAssignModal && (
          <div
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
            }}
          >
            <div style={{ background: "white", padding: 24, borderRadius: 20, width: 420, maxWidth: "90%", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 17, fontWeight: 900, color: "#1c1917" }}>👤 Assign Curriculum to Fellow</h3>
              <form onSubmit={handleAssignPlan}>
                <div style={{ marginBottom: 15 }}>
                  <label style={labelStyle}>Select Fellow</label>
                  <select required style={inputStyle} value={assignForm.fellowId} onChange={(e) => setAssignForm({ ...assignForm, fellowId: e.target.value })}>
                    <option value="">-- Choose Fellow --</option>
                    {mentees.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Start Active Phase</label>
                  <select required style={inputStyle} value={assignForm.activePhaseId} onChange={(e) => setAssignForm({ ...assignForm, activePhaseId: e.target.value })}>
                    <option value="">-- Choose Phase to Unlock --</option>
                    {phases.map((p) => (
                      <option key={p._id} value={p._id}>
                        Phase {p.phaseNumber} ({p.semester}): {p.title}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, lineHeight: 1.5 }}>
                    The selected phase and any previous phases will be unlocked. Future phases will remain locked for the fellow.
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button type="button" style={btnGhost} onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" style={btnPrimary}>
                    Assign Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════ LIST VIEW ══════════════════════ */
  const published = plans.filter((p) => p.status === "published").length;
  const draft = plans.filter((p) => p.status === "draft").length;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <HeroBanner icon="📚" title="Curriculum Plans" subtitle="Build phased curriculum plans and assign them to your fellows." />

      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard icon="🗂️" label="Total Plans" value={plans.length} tint="#f59e0b" />
        <StatCard icon="✅" label="Published" value={published} tint="#10b981" />
        <StatCard icon="✏️" label="Draft" value={draft} tint="#94a3b8" />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button style={btnPrimary} onClick={() => setShowPlanForm(!showPlanForm)}>
          {showPlanForm ? "✕ Cancel" : "+ Create Plan"}
        </button>
      </div>

      {showPlanForm && (
        <div style={{ background: "#fffbeb", padding: 22, borderRadius: 16, border: "1px solid #fde68a", marginBottom: 22 }}>
          <h3 style={{ margin: "0 0 15px 0", fontSize: 14, fontWeight: 800, color: "#92400e" }}>New Curriculum Plan</h3>
          <form onSubmit={handleCreatePlan} style={{ display: "flex", gap: 15, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 2, minWidth: 220 }}>
              <label style={labelStyle}>Plan Title</label>
              <input
                type="text"
                required
                style={inputStyle}
                value={planForm.title}
                onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                placeholder="e.g. ECDE Foundation 2026"
              />
            </div>
            {/* Start: Prajwal edit — replaced 1yr/2yr Duration dropdown with 1-8 Semester selector */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>Number of Semesters</label>
              <select
                style={inputStyle}
                value={planForm.numSemesters}
                onChange={(e) => setPlanForm({ ...planForm, numSemesters: Number(e.target.value) })}
              >
                {SEMESTER_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} Semester{n > 1 ? "s" : ""} ({formatDuration(n)})
                  </option>
                ))}
              </select>
            </div>
            {/* End: Prajwal edit */}
            <div>
              <button type="submit" style={btnPrimary}>
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Start: Prajwal edit — use redesigned PlanCard instead of plain card markup */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22 }}>
        {plans.map((plan) => (
          <PlanCard
            key={plan._id}
            plan={plan}
            onManage={() => {
              setActivePlanId(plan._id);
              fetchPhases(plan._id);
              setView("detail");
            }}
             // Start: Prajwal edit — pass delete handler
            onDelete={() => handleDeletePlan(plan._id)}
            // End: Prajwal edit
          />
        ))}
        {plans.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: "#9ca3af", background: "white", borderRadius: 16, border: "1px dashed #fbbf24" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>No curriculum plans found. Create your first plan to get started.</div>
          </div>
        )}
      </div>
      {/* End: Prajwal edit */}
    </div>
  );
}

export default MentorCurriculumTab;