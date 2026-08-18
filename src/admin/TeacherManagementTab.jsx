import { useState, useEffect } from "react";
import { AttendanceBar, Modal, S, SearchBar, SectionCard, StatCard, StatusBadge, Toast } from "../components/Shared";
import { getAdminTeachers, updateTeacherStatus, updateTeacherProfile, registerTeacher, getCenters, getClasses, sendDirectMessageToTeacher, blockTeacher, unblockTeacher, deleteTeacher, assignTeacherTaskByAdmin, getMentorFellows, claimFellow, unclaimFellow, updateFellowStatus, deleteMentorFellow, getTasksForTeacher } from "../services/api";
import { t } from "../services/i18n";
import MentorManagementTab from "../mentor/MentorManagementTab";

// Reuse same base URL pattern as ActivityMonitoringTab
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Returns the teacher's real photo URL if available, otherwise DiceBear initials avatar
const avatarSrc = (teacher) =>
  teacher.photoUrl ||
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teacher.name)}`;

// Resolve a profile photo path to a full URL, or return null so we fall back to DiceBear
const getPhotoUrl = (photo) => {
  if (!photo) return null;
  const path = photo.publicUrl || photo.url || photo.path || (typeof photo === "string" ? photo : "");
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
};

const taskActionBtnStyle = {
  ...S.tblBtn,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #86efac",
  background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
  color: "#047857",
  fontSize: 12,
  fontWeight: 800,
  boxShadow: "0 4px 10px rgba(16, 185, 129, 0.12)",
};

const mapTeacherFromApi = (tr) => ({
  id: tr._id || tr.id,
  name: tr.name,
  email: tr.email,
  phone: tr.phone || "",
  subject: tr.teacherProfile?.subject || "N/A",
  address: tr.teacherProfile?.address || "N/A",
  qualification: tr.teacherProfile?.qualification || "N/A",
  experience: tr.teacherProfile?.experience || "N/A",
  status: tr.status === "blocked" ? "blocked" : (tr.status || "pending"),
  joined: tr.createdAt ? new Date(tr.createdAt).toLocaleDateString("en-IN") : "—",
  attendance: tr.teacherProfile?.performanceRating ? Math.round(tr.teacherProfile.performanceRating * 20) : 0,
  classes: tr.teacherProfile?.lessonsCompleted || 0,
  assignedCenter: tr.teacherProfile?.center?.name || "Not Assigned",
  centerId: tr.teacherProfile?.center?._id || tr.teacherProfile?.center || "",
  classId: (tr.teacherProfile?.classes || [])[0]?._id || "",
  classIds: (tr.teacherProfile?.classes || []).map(c => c?._id || c),
  classNames: (tr.teacherProfile?.classes || []).map(c => c?.name || "—"),
  batch: (tr.teacherProfile?.classes || []).map(c => c?.name).filter(Boolean).join(", ") || "—",
  // NEW: resolve real profile photo from any common API shape (including tr.photoUrl from User model)
  photoUrl: tr.photoUrl ? getPhotoUrl(tr.photoUrl) : getPhotoUrl(
    tr.teacherProfile?.profilePhoto ||
    tr.teacherProfile?.photo ||
    tr.profilePhoto ||
    tr.photo ||
    null
  ),
  assignedMentor: tr.assignedMentor || null,
  assignedMentorId: tr.assignedMentor?._id || tr.assignedMentor || null,
  assignedMentorName: tr.assignedMentor?.name || null,
  bio: tr.teacherProfile?.bio || tr.bio || "",
  dob: tr.teacherProfile?.dob ? new Date(tr.teacherProfile.dob).toLocaleDateString("en-IN") : "",
  gender: tr.teacherProfile?.gender || "",
  languages: tr.teacherProfile?.languages || [],
});

/* ─── Reusable teacher avatar with graceful fallback ─── */
function TeacherAvatar({ teacher, size = 34, borderColor = "#e2e8f0", borderWidth = 1 }) {
  const [src, setSrc] = useState(avatarSrc(teacher));

  // If the real photo URL errors, fall back to DiceBear
  const handleError = () =>
    setSrc(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teacher.name)}`);

  return (
    <img
      src={src}
      alt={teacher.name}
      onError={handleError}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        border: `${borderWidth}px solid ${borderColor}`,
        background: "#f3f4f6",
        flexShrink: 0,
      }}
    />
  );
}

/* ── Reject Modal ── */
function RejectModal({ teacher, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const reasons = ["Incomplete documents", "Invalid qualification", "Duplicate account", "Suspicious activity", "Other"];
  return (
    <Modal title={`✕ Reject — ${teacher.name}`} onClose={onClose}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: "#991b1b" }}>
        ⚠️ Teacher status will be marked as rejected.
      </div>
      <label style={S.label}>Reason *</label>
      <select style={{ ...S.input, marginBottom: 20 }} value={reason} onChange={e => setReason(e.target.value)}>
        <option value="">Select a reason...</option>
        {reasons.map(r => <option key={r}>{r}</option>)}
      </select>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { if (!reason) return; onConfirm(reason); }} style={{ ...S.btnRed, flex: 1, padding: "10px", fontSize: 13 }}>✕ Reject</button>
        <button onClick={onClose} style={{ ...S.tblBtn, flex: 1, padding: "10px", fontSize: 13 }}>Cancel</button>
      </div>
    </Modal>
  );
}

/* ── Block Modal ── */
function BlockModal({ teacher, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const reasons = ["Policy violation", "Misconduct", "Fraudulent activity", "Repeated absence", "Other"];
  return (
    <Modal title={`🚫 Block — ${teacher.name}`} onClose={onClose}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: "#991b1b" }}>
        ⚠️ Blocking suspends access. Teacher can be unblocked later.
      </div>
      <label style={S.label}>Reason *</label>
      <select style={{ ...S.input, marginBottom: 20 }} value={reason} onChange={e => setReason(e.target.value)}>
        <option value="">Select a reason...</option>
        {reasons.map(r => <option key={r}>{r}</option>)}
      </select>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { if (!reason) return; onConfirm(reason); }} style={{ ...S.btnRed, flex: 1, padding: "10px", fontSize: 13 }}>🚫 Block Access</button>
        <button onClick={onClose} style={{ ...S.tblBtn, flex: 1, padding: "10px", fontSize: 13 }}>Cancel</button>
      </div>
    </Modal>
  );
}

/* ── Direct Message Modal ── */
function DirectMessageModal({ teacher, onClose, setToast }) {
  const [msg, setMsg] = useState("");
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState("in_app");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!subject.trim() || !msg.trim()) {
      setToast({ msg: "Subject and message cannot be empty.", type: "error" });
      return;
    }
    setSending(true);
    try {
      await sendDirectMessageToTeacher(teacher.id, { subject: subject.trim(), body: msg.trim(), channel });
      setToast({ msg: `Message sent to ${teacher.name}!`, type: "success" });
      onClose();
    } catch (err) {
      setToast({ msg: err.message || "Failed to send message", type: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title={`💬 Message — ${teacher.name}`} onClose={onClose}>
      <label style={S.label}>Channel</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[{ val: "in_app", label: "📱 In-App" }, { val: "email", label: "📧 Email" }].map(c => (
          <button key={c.val} onClick={() => setChannel(c.val)}
            style={{
              flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${channel === c.val ? "#f59e0b" : "#e5e7eb"}`,
              background: channel === c.val ? "#fef3c7" : "white", color: channel === c.val ? "#92400e" : "#6b7280",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
            }}>
            {c.label}
          </button>
        ))}
      </div>
      <label style={S.label}>To</label>
      <input style={{ ...S.input, marginBottom: 12, background: "#f3f4f6", color: "#6b7280" }}
        value={`${teacher.name} (${teacher.email})`} readOnly />
      <label style={S.label}>Subject *</label>
      <input style={{ ...S.input, marginBottom: 12 }} value={subject}
        onChange={e => setSubject(e.target.value)} placeholder="Message subject..." />
      <label style={S.label}>Message *</label>
      <textarea style={{ ...S.input, height: 120, resize: "none", marginBottom: 20 }}
        value={msg} onChange={e => setMsg(e.target.value)}
        placeholder={`Write a message to ${teacher.name.split(" ")[0]}...`} />
      <button onClick={send} disabled={sending}
        style={{ ...S.primaryBtn, width: "100%", opacity: sending ? 0.7 : 1 }}>
        {sending ? "Sending..." : "📤 Send Message"}
      </button>
    </Modal>
  );
}

/* ── Edit Teacher Modal ── */
function EditTeacherModal({ teacher, onSave, onClose, setToast }) {
  const [form, setForm] = useState({
    name: teacher.name || "",
    email: teacher.email || "",
    phone: teacher.phone || "",
    subject: teacher.subject || "",
    qualification: teacher.qualification || "",
    experience: teacher.experience || "",
    address: teacher.address || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setToast({ msg: "Name and email are required.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await updateTeacherProfile(teacher.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        teacherProfile: {
          subject: form.subject,
          qualification: form.qualification,
          experience: form.experience,
          address: form.address,
        },
      });
      setToast({ msg: "Teacher profile updated!", type: "success" });
      onSave();
      onClose();
    } catch (err) {
      setToast({ msg: err.message || "Failed to update teacher", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`✏️ Edit Teacher — ${teacher.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={S.label}>Full Name *</label>
            <input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Teacher name" />
          </div>
          <div>
            <label style={S.label}>Email *</label>
            <input style={S.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="teacher@email.com" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label style={S.label}>Phone</label>
            <input style={S.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label style={S.label}>Subject</label>
            <input style={S.input} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Early Childhood" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label style={S.label}>Qualification</label>
            <select style={S.input} value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })}>
              {["", "Graduate", "Post-Graduate", "B.Ed", "D.El.Ed", "Other"].map(o => <option key={o} value={o}>{o || "Select..."}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Experience</label>
            <select style={S.input} value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })}>
              {["", "Fresher", "1-2 yrs", "3-5 yrs", "5-10 yrs", "10+ yrs"].map(o => <option key={o} value={o}>{o || "Select..."}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={S.label}>Address</label>
          <textarea style={{ ...S.input, height: 60, resize: "none" }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Teacher address" />
        </div>
        <button type="submit" disabled={saving} style={{ ...S.primaryBtn, width: "100%", marginTop: 16, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Save Changes →"}
        </button>
      </form>
    </Modal>
  );
}

/* ── Change Center Modal ── */
function ChangeCenterModal({ teacher, centers = [], classes = [], onSave, onClose }) {
  const [selectedCenter, setSelectedCenter] = useState(teacher.centerId || "");
  const [selectedClassIds, setSelectedClassIds] = useState(teacher.classIds || []);

  const filteredClasses = selectedCenter
    ? classes.filter(c => String(c.center || c.centerId || c.center?._id) === String(selectedCenter))
    : [];

  useEffect(() => {
    if (selectedCenter) {
      const allIds = filteredClasses.map(c => c._id || c.id);
      setSelectedClassIds(allIds);
    } else {
      setSelectedClassIds([]);
    }
  }, [selectedCenter]);

  const toggleClass = (classId) => {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const selectAll = () => setSelectedClassIds(filteredClasses.map(c => c._id || c.id));
  const clearAll = () => setSelectedClassIds([]);

  return (
    <Modal title={`🏫 Change Center — ${teacher.name}`} onClose={onClose}>
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: "#0c4a6e" }}>
        ℹ️ Select a center — all classes will be auto-assigned. You can uncheck classes you don't want.
      </div>
      <label style={S.label}>Select Training Center</label>
      <select style={{ ...S.input, marginBottom: 12 }} value={selectedCenter}
        onChange={e => setSelectedCenter(e.target.value)}>
        <option value="">No Center Assigned</option>
        {centers.map(c => (
          <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
        ))}
      </select>

      {selectedCenter && filteredClasses.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ ...S.label, marginBottom: 0 }}>Select Classes ({selectedClassIds.length}/{filteredClasses.length})</label>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={selectAll}
                style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontWeight: 600, color: "#374151" }}>
                All
              </button>
              <button type="button" onClick={clearAll}
                style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontWeight: 600, color: "#374151" }}>
                None
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, marginBottom: 16, background: "#fafafa" }}>
            {filteredClasses.map(cls => (
              <label key={cls._id || cls.id}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#374151", background: selectedClassIds.includes(cls._id || cls.id) ? "#eff6ff" : "transparent", marginBottom: 2 }}>
                <input type="checkbox" checked={selectedClassIds.includes(cls._id || cls.id)}
                  onChange={() => toggleClass(cls._id || cls.id)}
                  style={{ accentColor: "#3b82f6", width: 14, height: 14 }} />
                <span>{cls.name}</span>
                {cls.ageGroup && <span style={{ fontSize: 10, color: "#9ca3af" }}>({cls.ageGroup})</span>}
              </label>
            ))}
          </div>
        </>
      )}

      {selectedCenter && filteredClasses.length === 0 && (
        <div style={{ textAlign: "center", padding: "16px", color: "#9ca3af", fontSize: 12, marginBottom: 16, background: "#f9fafb", borderRadius: 8, border: "1px dashed #e5e7eb" }}>
          No classes found for this center. Create classes first.
        </div>
      )}

      <button onClick={() => onSave(selectedCenter, null, selectedClassIds)} style={{ ...S.primaryBtn, width: "100%" }}>
        Save Center & Classes Assignment →
      </button>
    </Modal>
  );
}

/* ── Teacher Full Profile View ── */
function TeacherProfileView({ teacher, centers = [], classes = [], onBack, onUpdate, setToast }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [showReject, setShowReject] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  // NEW: lightbox to view full-size profile photo
  const [photoLightbox, setPhotoLightbox] = useState(false);

  const isPending = teacher.status === "pending";
  const isApproved = teacher.status === "approved";
  const isRejected = teacher.status === "rejected";
  const isBlocked = teacher.status === "blocked";

  const doApprove = () =>
    updateTeacherStatus(teacher.id, "approved")
      .then(() => { onUpdate(); setToast({ msg: "Teacher approved!", type: "success" }); })
      .catch(err => setToast({ msg: err.message, type: "error" }));

  const doReject = () =>
    updateTeacherStatus(teacher.id, "rejected")
      .then(() => { onUpdate(); setShowReject(false); setToast({ msg: "Teacher rejected.", type: "error" }); })
      .catch(err => setToast({ msg: err.message, type: "error" }));

  const doBlock = () =>
    blockTeacher(teacher.id)
      .then(() => { onUpdate(); setShowBlock(false); setToast({ msg: "Teacher blocked.", type: "error" }); })
      .catch(err => setToast({ msg: err.message, type: "error" }));

  const doUnblock = () =>
    unblockTeacher(teacher.id)
      .then(() => { onUpdate(); setToast({ msg: "Teacher unblocked!", type: "success" }); })
      .catch(err => setToast({ msg: err.message, type: "error" }));

  const doDelete = () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${teacher.name}?`)) return;
    deleteTeacher(teacher.id)
      .then(() => { onBack(); setToast({ msg: "Teacher deleted.", type: "success" }); })
      .catch(err => setToast({ msg: err.message, type: "error" }));
  };

  const doChangeCenter = (centerId, classId, classIds) =>
    updateTeacherProfile(teacher.id, { teacherProfile: { center: centerId, class: classId, classes: classIds || [] } })
      .then(() => { onUpdate(); setToast({ msg: "Center & classes assignment updated!", type: "success" }); setShowCourses(false); })
      .catch(err => setToast({ msg: err.message, type: "error" }));

  const [showAssignTask, setShowAssignTask] = useState(false);

  const quickActions = [
    { icon: "📌", label: "Assign Task", onClick: () => setShowAssignTask(true), color: "#059669", bg: "#d1fae5" },
    { icon: "💬", label: "Send Message", onClick: () => setShowMsg(true), color: "#8b5cf6", bg: "#ede9fe" },
    { icon: "🏫", label: "Change Center", onClick: () => setShowCourses(true), color: "#f59e0b", bg: "#fef3c7" },
    { icon: "✏️", label: "Edit Profile", onClick: () => setShowEdit(true), color: "#2563eb", bg: "#dbeafe" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {showReject && <RejectModal teacher={teacher} onClose={() => setShowReject(false)} onConfirm={doReject} />}
      {showBlock && <BlockModal teacher={teacher} onClose={() => setShowBlock(false)} onConfirm={doBlock} />}
      {showMsg && <DirectMessageModal teacher={teacher} onClose={() => setShowMsg(false)} setToast={setToast} />}
      {showCourses && <ChangeCenterModal teacher={teacher} centers={centers} classes={classes} onClose={() => setShowCourses(false)} onSave={doChangeCenter} />}
      {showEdit && <EditTeacherModal teacher={teacher} onClose={() => setShowEdit(false)} onSave={() => { onUpdate(); }} setToast={setToast} />}
      {showAssignTask && <AssignTaskModal teacher={teacher} onClose={() => setShowAssignTask(false)} setToast={setToast} />}

      {/* NEW: full-size photo lightbox */}
      {photoLightbox && teacher.photoUrl && (
        <div
          onClick={() => setPhotoLightbox(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1100,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: 24
          }}>
          <img src={teacher.photoUrl} alt={teacher.name}
            style={{
              maxWidth: "80vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 16,
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)", border: "3px solid #f59e0b"
            }} />
          <button onClick={() => setPhotoLightbox(false)}
            style={{
              position: "absolute", top: 20, right: 24, background: "rgba(255,255,255,0.15)",
              border: "none", color: "white", fontSize: 22, width: 40, height: 40,
              borderRadius: "50%", cursor: "pointer"
            }}>✕</button>
        </div>
      )}

      <button onClick={onBack} style={S.backBtn}>← Back to Teachers</button>

      {/* Profile Header — now shows real photo with click-to-enlarge */}
      <div style={{
        background: "white", borderRadius: 20, padding: 24, border: "1px solid #f1f5f9",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", gap: 20, alignItems: "center", marginBottom: 20
      }}>

        {/* Avatar / photo — clickable if a real photo exists */}
        <div
          onClick={() => teacher.photoUrl && setPhotoLightbox(true)}
          style={{ position: "relative", flexShrink: 0, cursor: teacher.photoUrl ? "zoom-in" : "default" }}
          title={teacher.photoUrl ? "Click to view full photo" : ""}>
          <TeacherAvatar teacher={teacher} size={80} borderColor="#f59e0b" borderWidth={2.5} />
          {/* Badge indicating it's a real photo vs generated avatar */}
          {teacher.photoUrl ? (
            <span style={{
              position: "absolute", bottom: 2, right: 2, background: "#10b981",
              borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 9, border: "2px solid white"
            }} title="Profile photo uploaded">📷</span>
          ) : (
            <span style={{
              position: "absolute", bottom: 2, right: 2, background: "#9ca3af",
              borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 9, border: "2px solid white"
            }} title="Auto-generated avatar">🤖</span>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1c1917", margin: 0 }}>{teacher.name}</h2>
            <StatusBadge status={teacher.status} />
            {/* NEW: subtle label so admin knows photo source */}
            <span style={{
              fontSize: 10, color: teacher.photoUrl ? "#10b981" : "#9ca3af",
              background: teacher.photoUrl ? "#d1fae5" : "#f3f4f6",
              border: `1px solid ${teacher.photoUrl ? "#86efac" : "#e5e7eb"}`,
              borderRadius: 20, padding: "2px 8px", fontWeight: 700
            }}>
              {teacher.photoUrl ? "📷 Photo uploaded" : "🤖 Auto avatar"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 6px" }}>{teacher.subject} Teacher · {teacher.assignedCenter}</p>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9ca3af", flexWrap: "wrap" }}>
            <span>📧 {teacher.email}</span>
            <span>📱 {teacher.phone}</span>
            {teacher.gender && <span>⚧ {teacher.gender}</span>}
            {teacher.dob && <span>🎂 {teacher.dob}</span>}
          </div>
          {/* NEW: show bio if teacher filled it in */}
          {teacher.bio && (
            <p style={{
              fontSize: 12, color: "#475569", margin: "8px 0 0", fontStyle: "italic",
              background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
              padding: "6px 10px", maxWidth: 480
            }}>
              "{teacher.bio}"
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {isPending && <><button onClick={doApprove} style={S.primaryBtn}>✓ Approve</button><button onClick={() => setShowReject(true)} style={S.btnRed}>✕ Reject</button></>}
          {isApproved && <button onClick={() => setShowBlock(true)} style={{ ...S.tblBtn, color: "#dc2626", borderColor: "#fca5a5" }}>🚫 Block</button>}
          {isBlocked && <button onClick={doUnblock} style={S.primaryBtn}>✓ Unblock</button>}
          {isRejected && <button onClick={doApprove} style={S.primaryBtn}>✓ Reactivate</button>}
          <button onClick={() => setShowEdit(true)} style={{ ...S.tblBtn, color: "#2563eb", borderColor: "#93c5fd" }}>✏️ Edit</button>
          <button onClick={doDelete} style={{ ...S.tblBtn, color: "#dc2626", borderColor: "#fca5a5" }}>🗑️ Delete</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 20 }}>
        {quickActions.map((act, i) => (
          <button key={i} onClick={act.onClick}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 12,
              borderRadius: 12, border: "1px solid #f1f5f9", background: act.bg, color: act.color,
              fontSize: 11, fontWeight: 700, cursor: "pointer"
            }}>
            <span style={{ fontSize: 20 }}>{act.icon}</span>
            <span>{act.label}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1px solid #e5e7eb", marginBottom: 20 }}>
        {["overview", "activity", "tasks"].map(sec => (
          <button key={sec} onClick={() => setActiveSection(sec)}
            style={{
              padding: "10px 16px", background: "none", border: "none",
              borderBottom: activeSection === sec ? "2.5px solid #f59e0b" : "2.5px solid transparent",
              color: activeSection === sec ? "#d97706" : "#6b7280",
              fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize"
            }}>
            {sec}
          </button>
        ))}
      </div>

      {activeSection === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <SectionCard title="👤 Registration Details">
            {/* NEW: show teacher's uploaded profile photo in a dedicated card slot */}
            {teacher.photoUrl && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Profile Photo</div>
                <div
                  onClick={() => setPhotoLightbox(true)}
                  style={{
                    width: 80, height: 80, borderRadius: 12, overflow: "hidden", cursor: "zoom-in",
                    border: "2px solid #f59e0b", boxShadow: "0 2px 8px rgba(245,158,11,0.25)"
                  }}
                  title="Click to enlarge">
                  <img src={teacher.photoUrl} alt={teacher.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { icon: "🎓", label: "Qualification", val: teacher.qualification },
                { icon: "🏢", label: "Assigned Center", val: teacher.assignedCenter },
                { icon: "💼", label: "Experience", val: teacher.experience },
                { icon: "📅", label: "Joined", val: teacher.joined },
                { icon: "📍", label: "Address", val: teacher.address },
                { icon: "🗂️", label: "Class Assigned", val: teacher.batch },
                ...(teacher.classNames?.length ? [{ icon: "📚", label: "Assigned Classes", val: teacher.classNames.join(", ") }] : []),
                ...(teacher.gender ? [{ icon: "⚧", label: "Gender", val: teacher.gender }] : []),
                ...(teacher.dob ? [{ icon: "🎂", label: "DOB", val: teacher.dob }] : []),
                ...(teacher.languages?.length ? [{ icon: "🗣️", label: "Languages", val: teacher.languages.join(", ") }] : []),
              ].map((r, i) => (
                <div key={i} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px", border: "1px solid #f3f4f6" }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{r.icon} {r.val}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="📊 Performance Statistics">
            {isApproved ? (
              <>
                <AttendanceBar val={teacher.attendance || 0} name="Overall Performance Rate" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                  <div style={{ background: "#d1fae5", borderRadius: 10, padding: "12px", textAlign: "center", border: "1px solid #86efac" }}>
                    <div style={{ fontSize: 16 }}>✅</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1917" }}>{teacher.classes}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>Lessons Completed</div>
                  </div>
                  <div style={{ background: "#dbeafe", borderRadius: 10, padding: "12px", textAlign: "center", border: "1px solid #93c5fd" }}>
                    <div style={{ fontSize: 16 }}>📋</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1917" }}>{teacher.attendance}%</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>Score Rate</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "30px", color: "#9ca3af" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 12 }}>Stats available after approval</div>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {activeSection === "activity" && (
        <SectionCard title="🕓 Activity Log">
          {[
            { action: "Registered on platform", time: teacher.joined, icon: "👤", type: "info" },
            { action: `Assigned to center: ${teacher.assignedCenter}`, time: "—", icon: "🏫", type: "success" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: a.type === "success" ? "#d1fae5" : "#dbeafe",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0
              }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1c1917" }}>{a.action}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {activeSection === "tasks" && <TeacherTasksSection teacher={teacher} />}
    </div>
  );
}

/* ── TeacherTasksSection: tasks assigned to this specific teacher ── */
function TeacherTasksSection({ teacher }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getTasksForTeacher(teacher.id)
      .then((res) => { if (!ignore) setTasks(res.tasks || []); })
      .catch((err) => { if (!ignore) setError(err.message || "Could not load tasks."); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [teacher.id]);

  if (loading) {
    return <SectionCard title="📌 Assigned Tasks"><div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Loading tasks...</div></SectionCard>;
  }
  if (error) {
    return <SectionCard title="📌 Assigned Tasks"><div style={{ padding: 20, textAlign: "center", color: "#ef4444", fontSize: 12 }}>{error}</div></SectionCard>;
  }
  if (tasks.length === 0) {
    return <SectionCard title="📌 Assigned Tasks"><div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No tasks assigned yet.</div></SectionCard>;
  }

  return (
    <SectionCard title={`📌 Assigned Tasks (${tasks.length})`}>
      {tasks.map((task) => {
        const isOverdue = !task.completed && task.date && task.date < new Date().toISOString().split("T")[0];
        return (
          <div key={task._id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 12px", borderRadius: 10, marginBottom: 8,
            background: task.completed ? "#f0fdf4" : isOverdue ? "#fef2f2" : "#fffbeb",
            border: `1px solid ${task.completed ? "#bbf7d0" : isOverdue ? "#fecaca" : "#fde68a"}`
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>{task.title}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                {task.category || "task"} · {task.date}{task.time ? ` · ${task.time}` : ""}
              </div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
              color: task.completed ? "#16a34a" : isOverdue ? "#dc2626" : "#d97706",
              background: task.completed ? "#dcfce7" : isOverdue ? "#fee2e2" : "#fef3c7"
            }}>
              {task.completed ? "✓ Completed" : isOverdue ? "Overdue" : "Pending"}
            </span>
          </div>
        );
      })}
    </SectionCard>
  );
}

/* ══════════════════════════════════════════
   MAIN TEACHER MANAGEMENT TAB
   ══════════════════════════════════════════ */
export function TeacherManagementList({ setToast, role = "admin", user = null, onUserUpdate }) {
  const [teachers, setTeachers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [centerFilter, setCenterFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [assigningTaskTeacher, setAssigningTaskTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setLocalToast] = useState({ msg: "", type: "" });
  const [newT, setNewT] = useState({
    name: "", email: "", phone: "", subject: "", address: "",
    qualification: "Graduate", experience: "Fresher", assignedCenter: "", assignedClasses: [], password: ""
  });

  const isMentorView = role === "mentor" || user?.role === "mentor";
  const showToast = setToast || setLocalToast;

  const loadData = async () => {
    setLoading(true);
    try {
      let teachersRes;
      if (isMentorView) {
        const res = await getMentorFellows();
        teachersRes = { fellows: res.fellows || [] };
      } else {
        const res = await getAdminTeachers();
        teachersRes = { teachers: res.teachers || [] };
      }
      const [centersRes, classesRes] = await Promise.all([
        getCenters(),
        getClasses()
      ]);
      const rawTeachers = isMentorView ? teachersRes.fellows : teachersRes.teachers;
      setTeachers((rawTeachers || []).map(mapTeacherFromApi));
      setCenters(centersRes.centers || []);
      setClasses(classesRes.classes || []);
    } catch (err) {
      showToast({ msg: "Failed to fetch teachers: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [role]);

  const filtered = teachers.filter(tr => {
    const q = search.toLowerCase();
    const matchesSearch = (tr.name.toLowerCase().includes(q) || tr.email.toLowerCase().includes(q) ||
      tr.phone.includes(q) || (tr.subject || "").toLowerCase().includes(q));
    if (!matchesSearch) return false;

    if (statusFilter !== "all" && tr.status !== statusFilter) return false;
    if (centerFilter !== "all" && tr.centerId !== centerFilter) return false;

    return true;
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newT.name || !newT.email || !newT.phone || !newT.subject || !newT.password) {
      showToast({ msg: "Please fill in all required fields.", type: "error" }); return;
    }
    try {
      const res = await registerTeacher({
        name: newT.name, email: newT.email, phone: newT.phone, password: newT.password,
        qualification: newT.qualification, subject: newT.subject,
        experience: newT.experience, address: newT.address,
        center: newT.assignedCenter || undefined,
        class: newT.assignedClasses.length === 1 ? newT.assignedClasses[0] : undefined,
        classIds: newT.assignedClasses.length > 0 ? newT.assignedClasses : undefined,
      });
      const newId = res.teacher?.id || res.teacher?._id;

      if (role === "mentor") {
        if (newId) await claimFellow(newId);
      } else {
        await updateTeacherStatus(newId, "approved");
        if ((newT.assignedCenter || newT.assignedClasses.length > 0) && newId) {
          await updateTeacherProfile(newId, {
            teacherProfile: {
              center: newT.assignedCenter || undefined,
              classes: newT.assignedClasses,
            }
          });
        }
      }
      showToast({ msg: "Teacher registered, approved & assigned!", type: "success" });
      setAddModal(false);
      setNewT({ name: "", email: "", phone: "", subject: "", address: "", qualification: "Graduate", experience: "Fresher", assignedCenter: "", assignedClasses: [], password: "" });
      await loadData();
    } catch (err) {
      showToast({ msg: "Error: " + err.message, type: "error" });
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #fef3c7", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: "#d97706" }}>Loading Teachers...</span>
    </div>
  );

  if (selected) {
    return (
      <TeacherProfileView
        teacher={teachers.find(t => t.id === selected.id) || selected}
        centers={centers}
        classes={classes}
        onBack={() => { setSelected(null); loadData(); }}
        onUpdate={loadData}
        setToast={showToast}
      />
    );
  }

  const pending = teachers.filter(t => t.status === "pending").length;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {!setToast && <Toast msg={toast.msg} type={toast.type} onClose={() => setLocalToast({ msg: "", type: "" })} />}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#f59e0b 0%,#d97706 60%,#b45309 100%)", borderRadius: 20, padding: "24px 28px", marginBottom: 24, color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fffbeb", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>{isMentorView ? t("Teacher Management") : t("User Management")}</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>{isMentorView ? t("All Teachers") : t("All Users")}</h1>
            <p style={{ fontSize: 12, margin: 0, color: "rgba(255,255,255,0.85)" }}>
              {`${teachers.filter(t => t.status === "approved").length} approved · ${pending} pending · ${teachers.length} total`}
            </p>
          </div>
          <button onClick={() => setAddModal(true)} style={S.primaryBtn}>+ {t("Add Teacher")}</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard icon="👩‍🏫" label={t("Total Registered")} val={teachers.length} color="#3b82f6" bg="#dbeafe" />
        <StatCard icon="✅" label={t("Approved")} val={teachers.filter(t => t.status === "approved").length} color="#10b981" bg="#d1fae5" />
        <StatCard icon="⏳" label={t("Pending Approval")} val={pending} color="#f59e0b" bg="#fef3c7" />
        <StatCard icon="🚫" label={t("Rejected/Blocked")} val={teachers.filter(t => t.status === "rejected" || t.status === "blocked").length} color="#ef4444" bg="#fee2e2" />
        {/* NEW: how many have uploaded a real photo */}
        <StatCard icon="📷" label={t("Photos Uploaded")} val={teachers.filter(t => t.photoUrl).length} color="#8b5cf6" bg="#ede9fe" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone or subject..." />
        </div>
        <select style={{ ...S.input, width: 140, padding: "8px 12px", marginBottom: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="blocked">Blocked</option>
          <option value="rejected">Rejected</option>
        </select>
        <select style={{ ...S.input, width: 180, padding: "8px 12px", marginBottom: 0 }} value={centerFilter} onChange={e => setCenterFilter(e.target.value)}>
          <option value="all">All Centers</option>
          {centers.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
              {["Teacher", "Phone", "Center", "Joined", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tr, i) => (
              <tr key={tr.id} style={{ borderBottom: "1px solid #f9fafb", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* NEW: uses real photo when available */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <TeacherAvatar teacher={tr} size={38} borderColor={tr.photoUrl ? "#f59e0b" : "#e2e8f0"} borderWidth={tr.photoUrl ? 2 : 1} />
                      {/* tiny camera badge if real photo */}
                      {tr.photoUrl && (
                        <span style={{
                          position: "absolute", bottom: -1, right: -1, background: "#10b981",
                          borderRadius: "50%", width: 13, height: 13, display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 7, border: "1.5px solid white"
                        }}>📷</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>{tr.name}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{tr.email}</div>
                      <div style={{ fontSize: 10, color: tr.assignedMentorName ? "#0284c7" : "#64748b", fontWeight: 700 }}>
                        👤 {tr.assignedMentorName ? `Monitored by: ${tr.assignedMentorName}` : "Unassigned / Unclaimed"}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151" }}>{tr.phone || "—"}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151" }}>
                  <div>{tr.assignedCenter}</div>
                  {tr.classNames?.length > 0 ? (
                    <div style={{ fontSize: 10, color: "#10b981", marginTop: 2, fontWeight: 600 }}>
                      {tr.classNames.length} class{tr.classNames.length > 1 ? "es" : ""} assigned
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2, fontWeight: 600 }}>
                      No class assigned
                    </div>
                  )}
                </td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "#9ca3af" }}>{tr.joined}</td>
                <td style={{ padding: "12px 14px" }}><StatusBadge status={tr.status} /></td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <button onClick={() => setAssigningTaskTeacher(tr)}
                      style={{ ...S.tblBtn, color: "#059669", borderColor: "#a7f3d0", background: "#ecfdf5" }}
                      title="Assign task to teacher">📌 Task</button>
                    <button onClick={() => setSelected(tr)}
                      style={{ ...S.tblBtn, color: "#3b82f6", borderColor: "#93c5fd" }}>👁 View</button>
                    {isMentorView ? (
                      <>
                        {String(tr.assignedMentorId) === String(user?._id || user?.id) ? (
                          <>
                            {tr.status === "pending" && (
                              <button onClick={async () => {
                                try { await updateFellowStatus(tr.id, "approved"); await loadData(); showToast({ msg: `${tr.name} approved!`, type: "success" }); }
                                catch (err) { showToast({ msg: err.message, type: "error" }); }
                              }} style={{ ...S.btnGreen }}>✓ Approve</button>
                            )}
                            {tr.status === "approved" && (
                              <button onClick={async () => {
                                try { await updateFellowStatus(tr.id, "rejected"); await loadData(); showToast({ msg: `${tr.name} rejected.`, type: "error" }); }
                                catch (err) { showToast({ msg: err.message, type: "error" }); }
                              }} style={{ ...S.btnRed }}>🚫 Reject</button>
                            )}
                            {tr.status === "rejected" && (
                              <button onClick={async () => {
                                try { await updateFellowStatus(tr.id, "approved"); await loadData(); showToast({ msg: `${tr.name} approved!`, type: "success" }); }
                                catch (err) { showToast({ msg: err.message, type: "error" }); }
                              }} style={{ ...S.btnGreen }}>✓ Approve</button>
                            )}
                            <button onClick={async () => {
                              try {
                                await unclaimFellow(tr.id);
                                await loadData();
                                if (onUserUpdate) {
                                  const updatedMentees = (user?.mentorProfile?.assignedTeachers || []).filter(m => String(m?._id || m) !== String(tr.id));
                                  onUserUpdate({
                                    ...user,
                                    mentorProfile: {
                                      ...(user?.mentorProfile || {}),
                                      assignedTeachers: updatedMentees
                                    }
                                  });
                                }
                                showToast({ msg: `Unclaimed ${tr.name} successfully.`, type: "success" });
                              } catch (err) {
                                showToast({ msg: err.message, type: "error" });
                              }
                            }} style={{ ...S.tblBtn, color: "#ef4444", borderColor: "#fca5a5" }}>Unclaim</button>
                            <button onClick={async () => {
                              if (!window.confirm(`Delete ${tr.name} permanently?`)) return;
                              try { await deleteMentorFellow(tr.id); await loadData(); showToast({ msg: `${tr.name} deleted.`, type: "success" }); }
                              catch (err) { showToast({ msg: err.message, type: "error" }); }
                            }} style={{ ...S.tblBtn, color: "#dc2626", borderColor: "#fca5a5" }} title="Delete fellow">🗑️</button>
                          </>
                        ) : !tr.assignedMentorId ? (
                          <>
                            <button onClick={async () => {
                              try {
                                await claimFellow(tr.id);
                                await loadData();
                                if (onUserUpdate) {
                                  const updatedMentees = [...(user?.mentorProfile?.assignedTeachers || []), tr.id];
                                  onUserUpdate({
                                    ...user,
                                    mentorProfile: {
                                      ...(user?.mentorProfile || {}),
                                      assignedTeachers: updatedMentees
                                    }
                                  });
                                }
                                showToast({ msg: `Claimed ${tr.name} successfully!`, type: "success" });
                              } catch (err) {
                                showToast({ msg: err.message, type: "error" });
                              }
                            }} style={{ ...S.tblBtn, color: "#10b981", borderColor: "#6ee7b7" }}>Claim</button>
                            {tr.status === "pending" && (
                              <button onClick={async () => {
                                try { await updateFellowStatus(tr.id, "approved"); await loadData(); showToast({ msg: `${tr.name} approved!`, type: "success" }); }
                                catch (err) { showToast({ msg: err.message, type: "error" }); }
                              }} style={{ ...S.btnGreen }}>✓ Approve</button>
                            )}
                            {tr.status === "approved" && (
                              <button onClick={async () => {
                                try { await updateFellowStatus(tr.id, "rejected"); await loadData(); showToast({ msg: `${tr.name} rejected.`, type: "error" }); }
                                catch (err) { showToast({ msg: err.message, type: "error" }); }
                              }} style={{ ...S.btnRed }}>🚫 Reject</button>
                            )}
                            {tr.status === "rejected" && (
                              <button onClick={async () => {
                                try { await updateFellowStatus(tr.id, "approved"); await loadData(); showToast({ msg: `${tr.name} approved!`, type: "success" }); }
                                catch (err) { showToast({ msg: err.message, type: "error" }); }
                              }} style={{ ...S.btnGreen }}>✓ Approve</button>
                            )}
                            <button onClick={async () => {
                              if (!window.confirm(`Delete ${tr.name} permanently?`)) return;
                              try { await deleteMentorFellow(tr.id); await loadData(); showToast({ msg: `${tr.name} deleted.`, type: "success" }); }
                              catch (err) { showToast({ msg: err.message, type: "error" }); }
                            }} style={{ ...S.tblBtn, color: "#dc2626", borderColor: "#fca5a5" }} title="Delete fellow">🗑️</button>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", alignSelf: "center" }}>Claimed</span>
                        )}
                      </>
                    ) : (
                      <>
                        {tr.status === "pending" && (
                          <button onClick={async () => {
                            try { await updateTeacherStatus(tr.id, "approved"); await loadData(); showToast({ msg: `${tr.name} approved!`, type: "success" }); }
                            catch (err) { showToast({ msg: err.message, type: "error" }); }
                          }} style={{ ...S.btnGreen }}>✓ Approve</button>
                        )}
                        {tr.status === "approved" && (
                          <button onClick={async () => {
                            try { await blockTeacher(tr.id); await loadData(); showToast({ msg: `${tr.name} blocked.`, type: "error" }); }
                            catch (err) { showToast({ msg: err.message, type: "error" }); }
                          }} style={{ ...S.btnRed }}>🚫 Block</button>
                        )}
                        {tr.status === "blocked" && (
                          <button onClick={async () => {
                            try { await unblockTeacher(tr.id); await loadData(); showToast({ msg: `${tr.name} unblocked!`, type: "success" }); }
                            catch (err) { showToast({ msg: err.message, type: "error" }); }
                          }} style={{ ...S.btnGreen }}>✓ Unblock</button>
                        )}
                        <button onClick={async () => {
                          if (!window.confirm(`Delete ${tr.name} permanently?`)) return;
                          try { await deleteTeacher(tr.id); await loadData(); showToast({ msg: `${tr.name} deleted.`, type: "success" }); }
                          catch (err) { showToast({ msg: err.message, type: "error" }); }
                        }} style={{ ...S.tblBtn, color: "#dc2626", borderColor: "#fca5a5" }} title="Delete teacher">🗑️</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px", color: "#9ca3af" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>No teachers found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your filters</div>
          </div>
        )}
      </div>

      {/* Assign Task Modal from Table Row */}
      {assigningTaskTeacher && (
        <AssignTaskModal
          teacher={assigningTaskTeacher}
          onClose={() => setAssigningTaskTeacher(null)}
          setToast={showToast}
          isMentorView={isMentorView}
        />
      )}

      {/* Add Teacher Modal */}
      {addModal && (
        <Modal title="👩‍🏫 Add New Teacher" onClose={() => setAddModal(false)}>
          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
              {[
                { key: "name", label: "Full Name *", icon: "👤", ph: "Priya Sharma" },
                { key: "subject", label: "Subject *", icon: "📘", ph: "Early Childhood" },
                { key: "email", label: "Email *", icon: "📧", ph: "teacher@school.edu", type: "email" },
                { key: "phone", label: "Phone *", icon: "📱", ph: "+91 98765 43210" },
              ].map(f => (
                <div key={f.key}>
                  <label style={S.label}>{f.label}</label>
                  <div style={{ position: "relative" }}>
                    <span style={S.fieldIcon}>{f.icon}</span>
                    <input style={{ ...S.input, paddingLeft: 32 }} type={f.type || "text"}
                      value={newT[f.key]} onChange={e => setNewT({ ...newT, [f.key]: e.target.value })} placeholder={f.ph} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div>
                <label style={S.label}>Qualification</label>
                <select style={S.input} value={newT.qualification} onChange={e => setNewT({ ...newT, qualification: e.target.value })}>
                  {["Graduate", "Post-Graduate", "B.Ed", "D.El.Ed", "Other"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Experience</label>
                <select style={S.input} value={newT.experience} onChange={e => setNewT({ ...newT, experience: e.target.value })}>
                  {["Fresher", "1-2 yrs", "3-5 yrs", "5-10 yrs", "10+ yrs"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={S.label}>Assigned Center</label>
              <select style={S.input} value={newT.assignedCenter} onChange={e => {
                const centerId = e.target.value;
                setNewT(prev => {
                  if (centerId) {
                    const allIds = classes.filter(c => String(c.center || c.centerId || c.center?._id) === String(centerId)).map(c => c._id || c.id);
                    return { ...prev, assignedCenter: centerId, assignedClasses: allIds };
                  }
                  return { ...prev, assignedCenter: centerId, assignedClasses: [] };
                });
              }}>
                <option value="">Select Center (optional)</option>
                {centers.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
              </select>
            </div>
            {newT.assignedCenter && (() => {
              const filteredCls = classes.filter(c => String(c.center || c.centerId || c.center?._id) === String(newT.assignedCenter));
              if (filteredCls.length === 0) return null;
              const allSelected = filteredCls.every(c => newT.assignedClasses.includes(c._id || c.id));
              return (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ ...S.label, marginBottom: 0 }}>Assigned Classes ({newT.assignedClasses.length}/{filteredCls.length})</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" onClick={() => setNewT(prev => ({ ...prev, assignedClasses: filteredCls.map(c => c._id || c.id) }))}
                        style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontWeight: 600, color: "#374151" }}>
                        All
                      </button>
                      <button type="button" onClick={() => setNewT(prev => ({ ...prev, assignedClasses: [] }))}
                        style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontWeight: 600, color: "#374151" }}>
                        None
                      </button>
                    </div>
                  </div>
                  <div style={{ maxHeight: 140, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, background: "#fafafa" }}>
                    {filteredCls.map(cls => (
                      <label key={cls._id || cls.id}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#374151", background: newT.assignedClasses.includes(cls._id || cls.id) ? "#eff6ff" : "transparent", marginBottom: 2 }}>
                        <input type="checkbox" checked={newT.assignedClasses.includes(cls._id || cls.id)}
                          onChange={() => {
                            const id = cls._id || cls.id;
                            setNewT(prev => ({
                              ...prev,
                              assignedClasses: prev.assignedClasses.includes(id) ? prev.assignedClasses.filter(x => x !== id) : [...prev.assignedClasses, id]
                            }));
                          }}
                          style={{ accentColor: "#3b82f6", width: 14, height: 14 }} />
                        <span>{cls.name}</span>
                        {cls.ageGroup && <span style={{ fontSize: 10, color: "#9ca3af" }}>({cls.ageGroup})</span>}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div style={{ marginTop: 12 }}>
              <label style={S.label}>Password *</label>
              <div style={{ position: "relative" }}>
                <span style={S.fieldIcon}>🔒</span>
                <input style={{ ...S.input, paddingLeft: 32 }} type="password"
                  value={newT.password} onChange={e => setNewT({ ...newT, password: e.target.value })} placeholder="Set initial password" />
              </div>
            </div>
            <button type="submit" style={{ ...S.primaryBtn, width: "100%", marginTop: 20 }}>
              Add Teacher & Auto-Approve →
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ── AssignTaskModal ── */
function AssignTaskModal({ teacher, onClose, setToast, isMentorView = false }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(isMentorView ? "mentor_assigned" : "admin_assigned");
  const [taskMode, setTaskMode] = useState(isMentorView ? "single" : "single");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [holidayDates, setHolidayDates] = useState("");
  const [startTime, setStartTime] = useState("11:30");
  const [endTime, setEndTime] = useState("12:30");
  const [submitting, setSubmitting] = useState(false);
  const isDaily = taskMode === "daily";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setToast({ msg: "Please enter a task title.", type: "error" });
      return;
    }
    if (taskMode === "daily" && (!startDate || !endDate)) {
      setToast({ msg: "Please choose a start and end date for daily tasks.", type: "error" });
      return;
    }
    if (taskMode === "daily" && new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
      setToast({ msg: "End date must be after the start date.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        date,
        startDate,
        endDate,
        startTime,
        endTime,
        time: `${startTime} - ${endTime}`,
        taskMode,
        skipWeekends,
        holidayDates: holidayDates
          .split(",")
          .map(d => d.trim())
          .filter(Boolean)
      };
      const res = await assignTeacherTaskByAdmin(teacher.id, payload);
      const createdCount = res?.createdCount || 0;
      setToast({
        msg: taskMode === "daily"
          ? `Daily task created for ${createdCount} working day${createdCount === 1 ? "" : "s"} for ${teacher.name}! 📌`
          : `Task assigned to ${teacher.name}! 📌`,
        type: "success"
      });
      onClose();
    } catch (err) {
      setToast({ msg: err.message || "Failed to assign task.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`📌 Assign Task to ${teacher.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 16, padding: 14, boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#334155", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Task Details
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={S.label}>Task Title *</label>
              <input
                style={{ ...S.input, background: "#fbfdff" }}
                placeholder="e.g. Conduct Parent-Teacher Review Session"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {isMentorView && (
              <div>
                <label style={S.label}>Task Type</label>
                <select style={{ ...S.input, background: "#fbfdff" }} value={taskMode} onChange={(e) => setTaskMode(e.target.value)}>
                  <option value="single">Single custom date</option>
                  <option value="daily">Daily task for a date range</option>
                </select>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div>
                <label style={S.label}>Category</label>
                <select style={{ ...S.input, background: "#fbfdff" }} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value={isMentorView ? "mentor_assigned" : "admin_assigned"}>{isMentorView ? "Mentor Assigned" : "Admin Assigned"}</option>
                  <option value="homework">Homework</option>
                  <option value="class">Class</option>
                  <option value="exam">Exam / Assessment</option>
                  <option value="workshop">Workshop</option>
                  <option value="tech">Technology</option>
                </select>
              </div>
              {!isDaily && (
                <div>
                  <label style={S.label}>Scheduled Date</label>
                  <input
                    type="date"
                    style={{ ...S.input, background: "#fbfdff" }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {isDaily && (
          <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 16, padding: 14, boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#334155", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.6px" }}>
              Recurring Schedule
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={S.label}>Start Date</label>
                <input type="date" style={{ ...S.input, background: "#fbfdff" }} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div>
                <label style={S.label}>End Date</label>
                <input type="date" style={{ ...S.input, background: "#fbfdff" }} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <label style={{ ...S.label, display: "flex", alignItems: "center", gap: 8, marginBottom: 0, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 12px", borderRadius: 12 }}>
                <input type="checkbox" checked={skipWeekends} onChange={(e) => setSkipWeekends(e.target.checked)} />
                Skip weekends
              </label>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                Holidays are optional and comma separated.
              </span>
            </div>

            <div>
              <label style={S.label}>Holiday dates (optional, comma separated)</label>
              <input
                style={{ ...S.input, background: "#fbfdff" }}
                value={holidayDates}
                onChange={(e) => setHolidayDates(e.target.value)}
                placeholder="2026-08-15, 2026-09-02"
              />
            </div>
          </div>
        )}

        <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 16, padding: 14, boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#334155", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Timing
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <label style={S.label}>Start Time</label>
              <input type="time" style={{ ...S.input, background: "#fbfdff" }} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>End Time</label>
              <input type="time" style={{ ...S.input, background: "#fbfdff" }} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6, flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} style={{ ...S.exportBtn, padding: "9px 16px", borderRadius: 10 }}>Cancel</button>
          <button type="submit" disabled={submitting} style={{ ...S.primaryBtn, padding: "11px 18px", borderRadius: 10 }}>
            {submitting ? "Assigning..." : isDaily ? "Assign Daily Tasks →" : "Assign Task →"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   UNIFIED USER MANAGEMENT TAB
   ══════════════════════════════════════════ */
export default function TeacherManagementTab({ setToast, role = "admin", user = null, onUserUpdate }) {
  const [activeRole, setActiveRole] = useState("Teacher");
  const isMentorView = role === "mentor" || user?.role === "mentor";

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>{isMentorView ? t("Teacher Management") : t("User Management")}</h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{isMentorView ? t("Manage teachers, courses, and access.") : t("Manage platform users, roles, and access.")}</p>
        </div>
        {!isMentorView && (
          <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 12 }}>
            {["Teacher", "Mentor"].map(roleKey => (
              <button
                key={roleKey}
                onClick={() => setActiveRole(roleKey)}
                style={{
                  padding: "8px 24px",
                  borderRadius: 8,
                  background: activeRole === roleKey ? "white" : "transparent",
                  color: activeRole === roleKey ? "#0f172a" : "#64748b",
                  fontWeight: activeRole === roleKey ? 700 : 600,
                  fontSize: 13,
                  border: "none",
                  boxShadow: activeRole === roleKey ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {t(roleKey + "s")}
              </button>
            ))}
          </div>
        )}
      </div>

      {isMentorView || activeRole === "Teacher" ? (
        <TeacherManagementList setToast={setToast} role={role} user={user} onUserUpdate={onUserUpdate} />
      ) : (
        <MentorManagementTab setToast={setToast} role={role} />
      )}
    </div>
  );
}
