// Start: Snehal change
import { useState, useEffect } from "react";
import {
  createParentModule, updateParentModule, deleteParentModule, getParentModules,
  getParentModuleAssignments, assignParentModule, removeParentModuleAssignment,
  getAdminTeachers, getClasses,
} from "../services/api";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb",
  fontSize: 13, fontFamily: "inherit", color: "#1c1917", outline: "none", boxSizing: "border-box",
};
const labelStyle = { fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6, display: "block" };
const smallBtn = (bg, color) => ({
  padding: "6px 12px", borderRadius: 8, border: "none", background: bg, color,
  fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
});

function emptyActivity() { return { time: "", activity: "", keyFocus: "" }; }
function emptyContentBlock() { return { heading: "", body: "" }; }
function emptySession(num) {
  return {
    sessionNumber: num, title: "", objective: "", homePractice: "",
    activities: [emptyActivity()],
    // Start: Snehal change — detailed content fields
    content: [],
    reflection: "",
    // End: Snehal change
  };
}

function StatCard({ icon, value, label, borderColor }) {
  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", borderTop: `3px solid ${borderColor}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 20, flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#1c1917" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );
}

// Start: Snehal change — Assign modal (module -> teacher + class)
function AssignModal({ mod, teachers, classes, onClose, setToast }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAssignments = () => {
    setLoading(true);
    getParentModuleAssignments(mod._id)
      .then((res) => setAssignments(res.assignments || []))
      .catch((error) => setToast?.({ msg: error.message || "Could not load assignments.", type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAssignments(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAssign = async () => {
    if (!teacherId && !classId) {
      setToast?.({ msg: "Select at least a teacher or a class.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await assignParentModule({ moduleId: mod._id, teacherId: teacherId || null, classId: classId || null });
      setToast?.({ msg: "Module assigned.", type: "success" });
      setTeacherId("");
      setClassId("");
      loadAssignments();
    } catch (error) {
      setToast?.({ msg: error.message || "Could not assign module.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (assignmentId) => {
    try {
      await removeParentModuleAssignment(assignmentId);
      setToast?.({ msg: "Assignment removed.", type: "success" });
      loadAssignments();
    } catch (error) {
      setToast?.({ msg: error.message || "Could not remove assignment.", type: "error" });
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: 480, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#1c1917" }}>
          Assign Module {mod.moduleNumber}
        </h3>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>{mod.title}</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Teacher</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={inputStyle}>
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} style={inputStyle}>
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={handleAssign} disabled={saving}
          style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: saving ? "#fcd34d" : "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer", marginBottom: 20 }}>
          {saving ? "Assigning..." : "+ Assign"}
        </button>

        <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>Current assignments</div>
        {loading ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>Loading...</div>
        ) : assignments.length === 0 ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>Not assigned to anyone yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {assignments.map((a) => (
              <div key={a._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#fafafa", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 12, color: "#1c1917" }}>
                  <strong>{a.teacher?.name || "No teacher"}</strong> — {a.class?.name || "No class"}
                </div>
                <button onClick={() => handleRemove(a._id)} style={{ ...smallBtn("#fee2e2", "#dc2626"), padding: "4px 8px" }}>Remove</button>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: 20, width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
}
// End: Snehal change

// Start: Snehal change — Detail modal: opens in read-only "view" mode, has an Edit
// button top-right that switches the SAME modal into edit mode (no separate screen).
function ModuleDetailModal({ mod, onClose, onSaved, setToast }) {
  const [mode, setMode] = useState("view"); // "view" | "edit"
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => buildFormFromModule(mod));

  function buildFormFromModule(m) {
    return {
      moduleNumber: m.moduleNumber ?? "",
      title: m.title || "",
      category: m.category || "",
      sessions: (m.sessions?.length ? m.sessions : []).map((s) => ({
        sessionNumber: s.sessionNumber,
        title: s.title || "",
        objective: s.objective || "",
        homePractice: s.homePractice || "",
        activities: s.activities?.length ? JSON.parse(JSON.stringify(s.activities)) : [emptyActivity()],
        // Default safely — older sessions may not have these yet
        content: s.content?.length ? JSON.parse(JSON.stringify(s.content)) : [],
        reflection: s.reflection || "",
      })),
    };
  }

  const enterEdit = () => {
    setForm(buildFormFromModule(mod));
    setMode("edit");
  };

  const handleFieldChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addSession = () => {
    setForm({ ...form, sessions: [...form.sessions, emptySession(form.sessions.length + 1)] });
  };
  const removeSession = (idx) => {
    setForm({ ...form, sessions: form.sessions.filter((_, i) => i !== idx) });
  };
  const updateSessionField = (idx, field, value) => {
    const sessions = [...form.sessions];
    sessions[idx] = { ...sessions[idx], [field]: value };
    setForm({ ...form, sessions });
  };
  const addActivity = (sIdx) => {
    const sessions = [...form.sessions];
    sessions[sIdx].activities = [...sessions[sIdx].activities, emptyActivity()];
    setForm({ ...form, sessions });
  };
  const removeActivity = (sIdx, aIdx) => {
    const sessions = [...form.sessions];
    sessions[sIdx].activities = sessions[sIdx].activities.filter((_, i) => i !== aIdx);
    setForm({ ...form, sessions });
  };
  const updateActivityField = (sIdx, aIdx, field, value) => {
    const sessions = [...form.sessions];
    sessions[sIdx].activities[aIdx] = { ...sessions[sIdx].activities[aIdx], [field]: value };
    setForm({ ...form, sessions });
  };

  // Start: Snehal change — content block (heading/body) + reflection editing
  const addContentBlock = (sIdx) => {
    const sessions = [...form.sessions];
    sessions[sIdx].content = [...(sessions[sIdx].content || []), emptyContentBlock()];
    setForm({ ...form, sessions });
  };
  const removeContentBlock = (sIdx, cIdx) => {
    const sessions = [...form.sessions];
    sessions[sIdx].content = sessions[sIdx].content.filter((_, i) => i !== cIdx);
    setForm({ ...form, sessions });
  };
  const updateContentField = (sIdx, cIdx, field, value) => {
    const sessions = [...form.sessions];
    const content = [...sessions[sIdx].content];
    content[cIdx] = { ...content[cIdx], [field]: value };
    sessions[sIdx] = { ...sessions[sIdx], content };
    setForm({ ...form, sessions });
  };
  const updateReflection = (sIdx, value) => {
    updateSessionField(sIdx, "reflection", value);
  };
  // End: Snehal change

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.moduleNumber || !form.title) {
      setToast?.({ msg: "Module number and title are required.", type: "error" });
      return;
    }
    setSaving(true);
    const payload = {
      moduleNumber: Number(form.moduleNumber),
      title: form.title,
      category: form.category,
      sessions: form.sessions.map((s) => ({
        sessionNumber: s.sessionNumber,
        title: s.title,
        objective: s.objective,
        homePractice: s.homePractice,
        activities: s.activities,
        content: s.content || [],
        reflection: s.reflection || "",
      })),
    };
    try {
      await updateParentModule(mod._id, payload);
      setToast?.({ msg: "Module updated successfully!", type: "success" });
      onSaved?.({ ...mod, ...payload });
      setMode("view");
    } catch (error) {
      setToast?.({ msg: error.message || "Could not save module.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "40px 16px", overflowY: "auto" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: 720, maxWidth: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>MODULE {form.moduleNumber}</div>
            <h3 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 800, color: "#1c1917" }}>{form.title}</h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {mode === "view" ? (
              <button onClick={enterEdit} style={smallBtn("#e0f2fe", "#0369a1")}>✏️ Edit</button>
            ) : (
              <button onClick={() => setMode("view")} style={smallBtn("#f1f5f9", "#475569")}>Cancel</button>
            )}
            <button onClick={onClose} style={smallBtn("#f1f5f9", "#475569")}>✕ Close</button>
          </div>
        </div>

        {mode === "view" ? (
          <ModuleDetailView form={form} />
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Module Number</label>
              <input type="number" name="moduleNumber" value={form.moduleNumber} onChange={handleFieldChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Title</label>
              <input type="text" name="title" value={form.title} onChange={handleFieldChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input type="text" name="category" value={form.category} onChange={handleFieldChange} style={inputStyle} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Sessions</label>
                <button type="button" onClick={addSession} style={smallBtn("#fef3c7", "#92400e")}>+ Add Session</button>
              </div>

              {form.sessions.map((session, sIdx) => (
                <div key={sIdx} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12, background: "#fafafa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <strong style={{ fontSize: 12, color: "#1c1917" }}>Session {session.sessionNumber}</strong>
                    <button type="button" onClick={() => removeSession(sIdx)} style={smallBtn("#fee2e2", "#dc2626")}>Remove Session</button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input type="text" placeholder="Session title" value={session.title}
                      onChange={(e) => updateSessionField(sIdx, "title", e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Objective" value={session.objective}
                      onChange={(e) => updateSessionField(sIdx, "objective", e.target.value)} style={inputStyle} />

                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginTop: 4 }}>Activities</div>
                    {session.activities.map((act, aIdx) => (
                      <div key={aIdx} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 30px", gap: 6 }}>
                        <input type="text" placeholder="Time" value={act.time}
                          onChange={(e) => updateActivityField(sIdx, aIdx, "time", e.target.value)} style={inputStyle} />
                        <input type="text" placeholder="Activity" value={act.activity}
                          onChange={(e) => updateActivityField(sIdx, aIdx, "activity", e.target.value)} style={inputStyle} />
                        <input type="text" placeholder="Key Focus" value={act.keyFocus}
                          onChange={(e) => updateActivityField(sIdx, aIdx, "keyFocus", e.target.value)} style={inputStyle} />
                        <button type="button" onClick={() => removeActivity(sIdx, aIdx)}
                          style={{ ...smallBtn("#fee2e2", "#dc2626"), padding: "6px" }}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addActivity(sIdx)} style={smallBtn("#e0f2fe", "#0369a1")}>+ Add Activity Row</button>

                    <input type="text" placeholder="Home Practice" value={session.homePractice}
                      onChange={(e) => updateSessionField(sIdx, "homePractice", e.target.value)} style={inputStyle} />

                    {/* Start: Snehal change — Detailed Content blocks + Reflection, same form */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginTop: 4 }}>Detailed Content</div>
                    {(session.content || []).map((block, cIdx) => (
                      <div key={cIdx} style={{ border: "1px dashed #e5e7eb", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input type="text" placeholder="Heading (optional)" value={block.heading || ""}
                            onChange={(e) => updateContentField(sIdx, cIdx, "heading", e.target.value)} style={inputStyle} />
                          <button type="button" onClick={() => removeContentBlock(sIdx, cIdx)}
                            style={{ ...smallBtn("#fee2e2", "#dc2626"), padding: "6px 10px" }}>✕</button>
                        </div>
                        <textarea placeholder="Body text" value={block.body || ""} rows={3}
                          onChange={(e) => updateContentField(sIdx, cIdx, "body", e.target.value)}
                          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
                      </div>
                    ))}
                    <button type="button" onClick={() => addContentBlock(sIdx)} style={smallBtn("#e0f2fe", "#0369a1")}>+ Add Content Block</button>

                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginTop: 4 }}>Reflection</div>
                    <textarea placeholder="Reflection text" value={session.reflection || ""} rows={3}
                      onChange={(e) => updateReflection(sIdx, e.target.value)}
                      style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
                    {/* End: Snehal change */}
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" disabled={saving}
              style={{ marginTop: 4, padding: "12px 20px", borderRadius: 10, border: "none", background: saving ? "#fcd34d" : "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              {saving ? "Saving..." : "Update Module"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Start: Snehal change — read-only formatted view of a module + its sessions
function ModuleDetailView({ form }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {form.category && (
        <span style={{ fontSize: 10, fontWeight: 700, color: "#92400e", background: "#fef3c7", padding: "3px 8px", borderRadius: 20, alignSelf: "flex-start" }}>
          {form.category}
        </span>
      )}

      {form.sessions.map((session, sIdx) => (
        <div key={sIdx} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fafafa" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1c1917", marginBottom: 4 }}>
            Session {session.sessionNumber}: {session.title}
          </div>
          {session.objective && (
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10, fontStyle: "italic" }}>{session.objective}</div>
          )}

          {session.activities?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Activities</div>
              {session.activities.map((act, aIdx) => (
                <div key={aIdx} style={{ fontSize: 12, color: "#1c1917", marginBottom: 4 }}>
                  <strong>{act.time}</strong> — {act.activity}{act.keyFocus ? ` (${act.keyFocus})` : ""}
                </div>
              ))}
            </div>
          )}

          {session.content?.length > 0 ? (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Content</div>
              {session.content.map((block, cIdx) => (
                <div key={cIdx} style={{ marginBottom: 8 }}>
                  {block.heading && <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917" }}>{block.heading}</div>}
                  <div style={{ fontSize: 12, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{block.body}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginBottom: 10 }}>
              Detailed content not added yet.
            </div>
          )}
        {session.reflection && (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 12, fontWeight: 800, color: "#1c1917", marginBottom: 6 }}>Reflection</div>
    <div style={{ fontSize: 12, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{session.reflection}</div>
  </div>
)}
          {session.homePractice && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4 }}>Home Practice</div>
              <div style={{ fontSize: 12, color: "#374151" }}>{session.homePractice}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
// End: Snehal change

export default function ParentModulesManagementTab({ setToast }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ moduleNumber: "", title: "", category: "", sessions: [] });
  const [saving, setSaving] = useState(false);

  // Start: Snehal change — teachers/classes for assignment + which module's modal is open
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assigningModule, setAssigningModule] = useState(null);
  const [viewingModule, setViewingModule] = useState(null);

  useEffect(() => {
    getAdminTeachers()
      .then((res) => setTeachers(res.teachers || []))
      .catch(() => {});
    getClasses()
      .then((res) => setClasses(res.classes || []))
      .catch(() => {});
  }, []);
  // End: Snehal change

  const loadModules = () => {
    setLoading(true);
    getParentModules()
      .then((res) => setModules(res.modules || []))
      .catch((error) => setToast?.({ msg: error.message || "Could not load modules.", type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadModules(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openAddForm = () => {
    setForm({ moduleNumber: "", title: "", category: "", sessions: [] });
    setShowForm(true);
  };

  const handleDelete = async (mod) => {
    if (!window.confirm(`Delete "Module ${mod.moduleNumber}: ${mod.title}"? This cannot be undone.`)) return;
    try {
      await deleteParentModule(mod._id);
      setToast?.({ msg: "Module deleted.", type: "success" });
      loadModules();
    } catch (error) {
      setToast?.({ msg: error.message || "Could not delete module.", type: "error" });
    }
  };

  const handleFieldChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addSession = () => {
    setForm({ ...form, sessions: [...form.sessions, emptySession(form.sessions.length + 1)] });
  };
  const removeSession = (idx) => {
    setForm({ ...form, sessions: form.sessions.filter((_, i) => i !== idx) });
  };
  const updateSessionField = (idx, field, value) => {
    const sessions = [...form.sessions];
    sessions[idx] = { ...sessions[idx], [field]: value };
    setForm({ ...form, sessions });
  };
  const addActivity = (sIdx) => {
    const sessions = [...form.sessions];
    sessions[sIdx].activities = [...sessions[sIdx].activities, emptyActivity()];
    setForm({ ...form, sessions });
  };
  const removeActivity = (sIdx, aIdx) => {
    const sessions = [...form.sessions];
    sessions[sIdx].activities = sessions[sIdx].activities.filter((_, i) => i !== aIdx);
    setForm({ ...form, sessions });
  };
  const updateActivityField = (sIdx, aIdx, field, value) => {
    const sessions = [...form.sessions];
    sessions[sIdx].activities[aIdx] = { ...sessions[sIdx].activities[aIdx], [field]: value };
    setForm({ ...form, sessions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.moduleNumber || !form.title) {
      setToast?.({ msg: "Module number and title are required.", type: "error" });
      return;
    }
    setSaving(true);
    const payload = {
      moduleNumber: Number(form.moduleNumber),
      title: form.title,
      category: form.category,
      sessions: form.sessions,
    };
    try {
      await createParentModule(payload);
      setToast?.({ msg: "Module added successfully!", type: "success" });
      setShowForm(false);
      loadModules();
    } catch (error) {
      setToast?.({ msg: error.message || "Could not save module.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI','Inter',-apple-system,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", borderRadius: 20, padding: "28px 32px", marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1px", color: "#fef3c7", marginBottom: 6 }}>PARENT CAPACITY BUILDING</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "white", marginBottom: 4 }}>Modules</div>
        <div style={{ fontSize: 13, color: "#fef3c7" }}>{modules.length} module{modules.length !== 1 ? "s" : ""} in the curriculum</div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "stretch" }}>
        <StatCard icon="📚" value={modules.length} label="Total Modules" borderColor="#f59e0b" />
        <StatCard icon="🗓️" value={modules.reduce((s, m) => s + (m.sessions?.length || 0), 0)} label="Total Sessions" borderColor="#10b981" />
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={showForm ? () => setShowForm(false) : openAddForm}
            style={{ padding: "12px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}>
            {showForm ? "✕ Cancel" : "+ Add Module"}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", borderTop: "3px solid #f59e0b", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24, marginBottom: 24, maxWidth: 720 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#1c1917" }}>Add New Module</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Module Number</label>
              <input type="number" name="moduleNumber" value={form.moduleNumber} onChange={handleFieldChange} style={inputStyle} placeholder="e.g. 2" />
            </div>
            <div>
              <label style={labelStyle}>Title</label>
              <input type="text" name="title" value={form.title} onChange={handleFieldChange} style={inputStyle} placeholder="e.g. Strengthening Parent-Child Relationships" />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input type="text" name="category" value={form.category} onChange={handleFieldChange} style={inputStyle} placeholder="e.g. Social, Pedagogy, Health" />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Sessions</label>
                <button type="button" onClick={addSession} style={smallBtn("#fef3c7", "#92400e")}>+ Add Session</button>
              </div>

              {form.sessions.map((session, sIdx) => (
                <div key={sIdx} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12, background: "#fafafa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <strong style={{ fontSize: 12, color: "#1c1917" }}>Session {session.sessionNumber}</strong>
                    <button type="button" onClick={() => removeSession(sIdx)} style={smallBtn("#fee2e2", "#dc2626")}>Remove Session</button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input type="text" placeholder="Session title" value={session.title}
                      onChange={(e) => updateSessionField(sIdx, "title", e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Objective" value={session.objective}
                      onChange={(e) => updateSessionField(sIdx, "objective", e.target.value)} style={inputStyle} />

                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginTop: 4 }}>Activities</div>
                    {session.activities.map((act, aIdx) => (
                      <div key={aIdx} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 30px", gap: 6 }}>
                        <input type="text" placeholder="Time" value={act.time}
                          onChange={(e) => updateActivityField(sIdx, aIdx, "time", e.target.value)} style={inputStyle} />
                        <input type="text" placeholder="Activity" value={act.activity}
                          onChange={(e) => updateActivityField(sIdx, aIdx, "activity", e.target.value)} style={inputStyle} />
                        <input type="text" placeholder="Key Focus" value={act.keyFocus}
                          onChange={(e) => updateActivityField(sIdx, aIdx, "keyFocus", e.target.value)} style={inputStyle} />
                        <button type="button" onClick={() => removeActivity(sIdx, aIdx)}
                          style={{ ...smallBtn("#fee2e2", "#dc2626"), padding: "6px" }}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addActivity(sIdx)} style={smallBtn("#e0f2fe", "#0369a1")}>+ Add Activity Row</button>

                    <input type="text" placeholder="Home Practice" value={session.homePractice}
                      onChange={(e) => updateSessionField(sIdx, "homePractice", e.target.value)} style={inputStyle} />
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" disabled={saving}
              style={{ marginTop: 4, padding: "12px 20px", borderRadius: 10, border: "none", background: saving ? "#fcd34d" : "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              {saving ? "Saving..." : "Save Module"}
            </button>
          </form>
        </div>
      )}

      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>Showing {modules.length} of {modules.length} modules</div>

      {loading ? (
        <div style={{ color: "#6b7280", fontSize: 13 }}>Loading modules...</div>
      ) : modules.length === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 13 }}>No modules yet — add your first one above.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {modules.map((mod) => (
            <div key={mod._id} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", borderTop: "3px solid #f59e0b", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 20 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {mod.category && <span style={{ fontSize: 10, fontWeight: 700, color: "#92400e", background: "#fef3c7", padding: "3px 8px", borderRadius: 20 }}>{mod.category}</span>}
                <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", background: "#f1f5f9", padding: "3px 8px", borderRadius: 20 }}>{mod.sessions?.length || 0} sessions</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917", marginBottom: 4 }}>Module {mod.moduleNumber}: {mod.title}</div>
              {mod.objective && <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>{mod.objective}</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {/* Start: Snehal change — View replaces Edit on the card */}
                <button onClick={() => setViewingModule(mod)} style={{ flex: 1, ...smallBtn("#e0f2fe", "#0369a1"), padding: "8px" }}>👁️ View</button>
                {/* End: Snehal change */}
                <button onClick={() => handleDelete(mod)} style={{ flex: 1, ...smallBtn("#fee2e2", "#dc2626"), padding: "8px" }}>🗑️ Delete</button>
              </div>
              <button onClick={() => setAssigningModule(mod)}
                style={{ width: "100%", marginTop: 8, ...smallBtn("#dcfce7", "#15803d"), padding: "8px" }}>
                🔗 Assign to Teacher / Class
              </button>
            </div>
          ))}
        </div>
      )}

      {assigningModule && (
        <AssignModal
          mod={assigningModule}
          teachers={teachers}
          classes={classes}
          onClose={() => setAssigningModule(null)}
          setToast={setToast}
        />
      )}

      {/* Start: Snehal change — render Detail modal (view + inline edit) */}
      {viewingModule && (
        <ModuleDetailModal
          mod={viewingModule}
          onClose={() => setViewingModule(null)}
          onSaved={() => loadModules()}
          setToast={setToast}
        />
      )}
      {/* End: Snehal change */}
    </div>
  );
}
// End: Snehal change
