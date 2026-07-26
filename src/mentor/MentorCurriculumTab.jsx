import React, { useState, useEffect } from "react";
import { S, StatusBadge } from "../components/Shared";

const API_BASE_URL = "http://localhost:5000";

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
  const [planForm, setPlanForm] = useState({ title: "", durationType: "1yr" });
  const [phaseForm, setPhaseForm] = useState({
    phaseNumber: 1,
    semester: "Semester 1",
    title: "",
    startDate: "",
    endDate: "",
    topics: []
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
        headers: { "Authorization": `Bearer ${token}` }
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
        headers: { "Authorization": `Bearer ${token}` }
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
        headers: { "Authorization": `Bearer ${token}` }
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
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(planForm)
      });
      if (res.ok) {
        fetchPlans();
        setShowPlanForm(false);
        setPlanForm({ title: "", durationType: "1yr" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishPlan = async (planId) => {
    try {
      const plan = plans.find(p => p._id === planId);
      const res = await fetch(`${API_BASE_URL}/api/mentor/curriculum/plans/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title: plan.title, durationType: plan.durationType, status: "published" })
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePhase = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/curriculum/plans/${activePlanId}/phases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(phaseForm)
      });
      if (res.ok) {
        fetchPhases(activePlanId);
        setShowPhaseForm(false);
        // Reset phase form
        setPhaseForm({
          phaseNumber: phases.length + 2,
          semester: `Semester ${Math.ceil((phases.length + 2) / 2)}`,
          title: "",
          startDate: "",
          endDate: "",
          topics: []
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
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: activePlanId,
          fellowId: assignForm.fellowId,
          activePhaseId: assignForm.activePhaseId
        })
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
    setPhaseForm({
      ...phaseForm,
      topics: [
        ...phaseForm.topics,
        { title: "", description: "", materials: [] }
      ]
    });
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

  if (view === "detail") {
    const activePlan = plans.find(p => p._id === activePlanId);
    return (
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <button 
            style={{ ...S.button, background: "#6b7280" }}
            onClick={() => { setView("list"); setActivePlanId(null); }}
          >
            ← Back to Plans
          </button>
          <div style={{ display: "flex", gap: "10px" }}>
            {activePlan?.status === "draft" && (
              <button 
                style={{ ...S.button, background: "#f59e0b" }}
                onClick={() => handlePublishPlan(activePlanId)}
              >
                Publish Plan
              </button>
            )}
            <button 
              style={S.button}
              onClick={() => setShowAssignModal(true)}
              disabled={activePlan?.status === "draft"}
              title={activePlan?.status === "draft" ? "Publish the plan before assigning" : ""}
            >
              Assign to Fellow
            </button>
          </div>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
          <h2 style={{ margin: "0 0 10px 0", color: "#1f2937" }}>{activePlan?.title}</h2>
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "#6b7280", background: "#f3f4f6", padding: "4px 8px", borderRadius: "4px" }}>
              Duration: {activePlan?.durationType === "1yr" ? "1 Year" : "2 Years"}
            </span>
            <StatusBadge status={activePlan?.status} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#374151" }}>Curriculum Phases</h3>
          <button 
            style={{ ...S.button, padding: "6px 12px", fontSize: "14px" }}
            onClick={() => setShowPhaseForm(!showPhaseForm)}
          >
            + Add Phase
          </button>
        </div>

        {showPhaseForm && (
          <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 15px 0" }}>New Phase</h4>
            <form onSubmit={handleCreatePhase}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>Phase Title</label>
                  <input
                    type="text"
                    required
                    style={S.input}
                    value={phaseForm.title}
                    onChange={e => setPhaseForm({ ...phaseForm, title: e.target.value })}
                    placeholder="e.g. Introduction to Early Childhood"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>Semester</label>
                  <select
                    style={S.input}
                    value={phaseForm.semester}
                    onChange={e => setPhaseForm({ ...phaseForm, semester: e.target.value })}
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>Start Date</label>
                  <input
                    type="date"
                    required
                    style={S.input}
                    value={phaseForm.startDate}
                    onChange={e => setPhaseForm({ ...phaseForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>End Date</label>
                  <input
                    type="date"
                    required
                    style={S.input}
                    value={phaseForm.endDate}
                    onChange={e => setPhaseForm({ ...phaseForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Topics Builder */}
              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ margin: "0 0 10px 0", color: "#4b5563" }}>Topics</h5>
                {phaseForm.topics.map((topic, tIdx) => (
                  <div key={tIdx} style={{ background: "#fff", padding: "15px", borderRadius: "6px", border: "1px solid #e5e7eb", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>Topic {tIdx + 1}</span>
                      <button type="button" onClick={() => removeTopic(tIdx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>Remove</button>
                    </div>
                    <input
                      type="text"
                      placeholder="Topic Title"
                      required
                      style={{ ...S.input, marginBottom: "10px" }}
                      value={topic.title}
                      onChange={e => updateTopic(tIdx, "title", e.target.value)}
                    />
                    <textarea
                      placeholder="Topic Description"
                      style={{ ...S.input, marginBottom: "10px", minHeight: "60px" }}
                      value={topic.description}
                      onChange={e => updateTopic(tIdx, "description", e.target.value)}
                    />
                    
                    {/* Materials Builder */}
                    <div style={{ marginLeft: "15px", borderLeft: "2px solid #e5e7eb", paddingLeft: "15px" }}>
                      <h6 style={{ margin: "0 0 10px 0", color: "#6b7280" }}>Materials</h6>
                      {topic.materials.map((mat, mIdx) => (
                        <div key={mIdx} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
                          <select
                            style={{ ...S.input, width: "100px" }}
                            value={mat.type}
                            onChange={e => updateMaterial(tIdx, mIdx, "type", e.target.value)}
                          >
                            <option value="pdf">PDF</option>
                            <option value="video">Video</option>
                            <option value="link">Link</option>
                            <option value="doc">Doc</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Title"
                            style={{ ...S.input, flex: 1 }}
                            value={mat.title}
                            onChange={e => updateMaterial(tIdx, mIdx, "title", e.target.value)}
                          />
                          <input
                            type="url"
                            placeholder="File URL"
                            required
                            style={{ ...S.input, flex: 2 }}
                            value={mat.fileUrl}
                            onChange={e => updateMaterial(tIdx, mIdx, "fileUrl", e.target.value)}
                          />
                          <button type="button" onClick={() => removeMaterial(tIdx, mIdx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "18px" }}>&times;</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addMaterial(tIdx)} style={{ background: "none", border: "1px dashed #d1d5db", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", cursor: "pointer", color: "#6b7280" }}>+ Add Material</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addTopic} style={{ ...S.button, background: "#e5e7eb", color: "#374151", padding: "6px 12px", fontSize: "13px" }}>+ Add Topic</button>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" style={{ ...S.button, background: "#fff", color: "#374151", border: "1px solid #d1d5db" }} onClick={() => setShowPhaseForm(false)}>Cancel</button>
                <button type="submit" style={S.button}>Save Phase</button>
              </div>
            </form>
          </div>
        )}

        {/* Phase Timeline View */}
        <div style={{ position: "relative", marginLeft: "10px" }}>
          <div style={{ position: "absolute", left: "15px", top: 0, bottom: 0, width: "2px", background: "#e5e7eb" }}></div>
          {phases.length === 0 ? (
            <div style={{ padding: "20px 40px", color: "#6b7280", fontStyle: "italic" }}>No phases added yet.</div>
          ) : (
            phases.map((phase, idx) => (
              <div key={phase._id} style={{ position: "relative", paddingLeft: "40px", marginBottom: "30px" }}>
                <div style={{ position: "absolute", left: "9px", top: "5px", width: "14px", height: "14px", borderRadius: "50%", background: "#f97316", border: "3px solid #fff", boxShadow: "0 0 0 1px #f97316" }}></div>
                <div style={{ background: "#fff", padding: "15px", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 5px 0", color: "#1f2937", fontSize: "16px" }}>Phase {phase.phaseNumber}: {phase.title}</h4>
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>
                        <span style={{ fontWeight: "600", marginRight: "10px" }}>{phase.semester}</span>
                        {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {phase.topics?.length > 0 && (
                    <div style={{ marginTop: "15px", borderTop: "1px dashed #e5e7eb", paddingTop: "15px" }}>
                      <h5 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#4b5563" }}>Topics ({phase.topics.length})</h5>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {phase.topics.map((topic, tIdx) => (
                          <div key={tIdx} style={{ fontSize: "13px", background: "#f9fafb", padding: "8px 12px", borderRadius: "4px" }}>
                            <div style={{ fontWeight: "600", color: "#374151" }}>{topic.title}</div>
                            {topic.materials?.length > 0 && (
                              <div style={{ color: "#6b7280", marginTop: "4px", fontSize: "12px" }}>
                                {topic.materials.length} Material(s)
                              </div>
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
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "400px", maxWidth: "90%" }}>
              <h3 style={{ margin: "0 0 15px 0" }}>Assign Curriculum to Fellow</h3>
              <form onSubmit={handleAssignPlan}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>Select Fellow</label>
                  <select
                    required
                    style={S.input}
                    value={assignForm.fellowId}
                    onChange={e => setAssignForm({ ...assignForm, fellowId: e.target.value })}
                  >
                    <option value="">-- Choose Fellow --</option>
                    {mentees.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>Start Active Phase</label>
                  <select
                    required
                    style={S.input}
                    value={assignForm.activePhaseId}
                    onChange={e => setAssignForm({ ...assignForm, activePhaseId: e.target.value })}
                  >
                    <option value="">-- Choose Phase to Unlock --</option>
                    {phases.map(p => (
                      <option key={p._id} value={p._id}>Phase {p.phaseNumber} ({p.semester}): {p.title}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "5px" }}>
                    The selected phase and any previous phases will be unlocked. Future phases will remain locked for the fellow.
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" style={{ ...S.button, background: "#fff", color: "#374151", border: "1px solid #d1d5db" }} onClick={() => setShowAssignModal(false)}>Cancel</button>
                  <button type="submit" style={S.button}>Assign Plan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={S.pageTitle}>Curriculum Plans</h2>
        <button style={S.button} onClick={() => setShowPlanForm(!showPlanForm)}>
          {showPlanForm ? "Cancel" : "+ Create Plan"}
        </button>
      </div>

      {showPlanForm && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#374151" }}>New Curriculum Plan</h3>
          <form onSubmit={handleCreatePlan} style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>Plan Title</label>
              <input
                type="text"
                required
                style={S.input}
                value={planForm.title}
                onChange={e => setPlanForm({ ...planForm, title: e.target.value })}
                placeholder="e.g. ECDE Foundation 2026"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>Duration</label>
              <select
                style={S.input}
                value={planForm.durationType}
                onChange={e => setPlanForm({ ...planForm, durationType: e.target.value })}
              >
                <option value="1yr">1 Year</option>
                <option value="2yr">2 Years</option>
              </select>
            </div>
            <div>
              <button type="submit" style={S.button}>Create</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {plans.map(plan => (
          <div key={plan._id} style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <StatusBadge status={plan.status} />
                <span style={{ fontSize: "12px", color: "#6b7280", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>
                  {plan.durationType === "1yr" ? "1 Year" : "2 Years"}
                </span>
              </div>
              <h3 style={{ margin: "0 0 10px 0", color: "#1f2937", fontSize: "18px" }}>{plan.title}</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                Created: {new Date(plan.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div style={{ borderTop: "1px solid #e5e7eb", padding: "10px 20px", background: "#f9fafb" }}>
              <button 
                style={{ ...S.button, width: "100%", padding: "8px", background: "#fff", color: "#f97316", border: "1px solid #f97316" }}
                onClick={() => {
                  setActivePlanId(plan._id);
                  fetchPhases(plan._id);
                  setView("detail");
                }}
              >
                Manage Plan
              </button>
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#6b7280", background: "#fff", borderRadius: "8px", border: "1px dashed #d1d5db" }}>
            No curriculum plans found. Create your first plan to get started.
          </div>
        )}
      </div>
    </div>
  );
}

export default MentorCurriculumTab;
