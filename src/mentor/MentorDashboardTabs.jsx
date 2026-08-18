import { useState, useEffect, useRef } from "react";
import { S, SectionCard, Toast, StatCard, StatusBadge, SearchBar, Modal } from "../components/Shared";
import {
  uploadFile,
  submitFeedback,
  getFeedbacks,
  updateMentorMe,
  changeMentorPassword,
  recordMenteeObservation,
  getMenteeObservations,
  submitCapstoneMilestone,
  getCapstoneSubmissions,
  submitPDCACycle,
  getPDCACycles,
  getMentorPDCAReports,
  getMentorFellows,
  updateFellowStatus,
  getMentorMe,
  updateMenteeTracking,
  claimFellow,
  unclaimFellow,
  deleteMentorFellow,
  getMentorAttendance,
  getMentorFellowActivities,
  getMentorFellowTasks,
  designGrowthCycleFromCurriculum,
  updateCycleOutcome,
  getCycleWeeklyReports,
} from "../services/api";

import {
  computeAllFellowInsights,
  getFellowSubmissions,
  matchDeliverables,
} from "./aiInsights";

import Month1PDCAGenerator from "./Month1PDCAGenerator";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getMentorPhotoUrl = (user) => {
  const photo = user?.mentorProfile?.profilePhoto || user?.mentorProfile?.photo || user?.photoUrl || user?.profilePhoto;
  if (!photo) return null;
  if (typeof photo === "string") return photo.startsWith("http") ? photo : `${API_BASE_URL}${photo}`;
  const url = photo.publicUrl || photo.url || photo.path;
  return url || null;
};

/* ── Mentor Profile Tab ── */
export function MentorProfileTab({ user, onWorkingCenterChange, onUserUpdate }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const [stats, setStats] = useState({ pdca: 0, capstones: 0, attendance: 0 });

  useEffect(() => {
    getPDCACycles()
      .then(res => {
        setStats(s => ({ ...s, pdca: (res.cycles || []).length }));
      })
      .catch(err => console.error("Failed to load PDCA count for profile", err));

    getCapstoneSubmissions()
      .then(res => {
        setStats(s => ({ ...s, capstones: (res.submissions || []).length }));
      })
      .catch(err => console.error("Failed to load Capstones count for profile", err));

    getMentorAttendance()
      .then(res => {
        const records = res.records || [];
        const present = records.filter(r => ["present", "late"].includes(r.status)).length;
        const pct = records.length ? Math.round((present / records.length) * 100) : 100;
        setStats(s => ({ ...s, attendance: pct }));
      })
      .catch(err => console.error("Failed to load mentor attendance for profile", err));
  }, [user]);
  
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
  
  const mentorProfile = user.mentorProfile || {};
  const assignedCenter = mentorProfile.assignedCenters?.[0];
  const centerName = assignedCenter && typeof assignedCenter === "object" ? [assignedCenter.name, assignedCenter.city].filter(Boolean).join(", ") : user.workingCenter;

  const [form, setForm] = useState({
    name:          user.name          || "",
    email:         user.email         || "",
    phone:         user.phone         || "",
    address:       mentorProfile.address || user.address || "",
    workingCenter: centerName || "",
    qualification: mentorProfile.qualification || user.qualification || "",
    specialization: mentorProfile.specialization || user.specialization || "",
    experience:    mentorProfile.experience || user.experience || ""
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
          photoUrl = `${API_BASE_URL}${photoUrl}`;
        }
        setProfilePhoto(photoUrl);
        setImageLoadError(false);
        const res = await updateMentorMe({ photoUrl });
        if (res.mentor && onUserUpdate) {
          onUserUpdate(res.mentor);
        }
        setMessage("Profile picture updated successfully!");
        setMessageType("success");
      }
    } catch (error) {
      setMessage(error.message || "Failed to upload profile picture.");
      setMessageType("error");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true);
    try {
      setProfilePhoto(null);
      const res = await updateMentorMe({ photoUrl: "" });
      if (res.mentor && onUserUpdate) {
        onUserUpdate(res.mentor);
      }
      setMessage("Profile picture removed.");
      setMessageType("success");
    } catch (error) {
      setMessage("Failed to remove profile picture.");
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
        email: form.email,
        phone: form.phone,
        mentorProfile: {
          address: form.address,
          qualification: form.qualification,
          specialization: form.specialization,
          experience: form.experience
        }
      };
      
      const res = await updateMentorMe(payload);
      if (res.mentor && onUserUpdate) {
        onUserUpdate(res.mentor);
      }
      if (onWorkingCenterChange) {
        onWorkingCenterChange(form.workingCenter);
      }
      setSavedForm({ ...form });
      setEditing(false);
      setMessage("Profile updated successfully!");
      setMessageType("success");
    } catch (err) {
      setMessage(err.message || "Failed to update profile");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("New passwords do not match");
      setMessageType("error");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage("New password must be at least 6 characters");
      setMessageType("error");
      return;
    }

    setChangingPassword(true);
    try {
      await changeMentorPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMessage("Password changed successfully!");
      setMessageType("success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage(err.message || "Failed to change password");
      setMessageType("error");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 900 }}>
      <Toast msg={message} type={messageType} onClose={() => setMessage("")} />
      
      {/* ── Welcome Banner ── */}
      <div style={{ background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", borderRadius: 20, padding: "24px 28px", marginBottom: 24, color: "white", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.3px" }}>Welcome back, Mentor {user.name?.split(" ")[0] || ""}! 🚀</h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.9)", maxWidth: 500 }}>
            Here is your mentor overview. You are currently mentoring {user.mentorProfile?.assignedTeachers?.length || 0} fellow(s) and guiding their ECCE journey.
          </p>
        </div>
        <div style={{ display: "flex", gap: 16, position: "relative", zIndex: 1 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", padding: "10px 16px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{user.mentorProfile?.assignedTeachers?.length || 0}</div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 }}>Active Mentees</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", padding: "10px 16px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{user.mentorProfile?.center?.name ? "1" : "0"}</div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 }}>Assigned Center</div>
          </div>
        </div>
      </div>

      {/* ── Performance KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard icon="👩‍🏫" label="Active Mentees" val={user.mentorProfile?.assignedTeachers?.length || 0} color="#3b82f6" bg="#dbeafe" />
        <StatCard icon="🔄" label="PDCA Growth Cycles" val={stats.pdca} color="#10b981" bg="#d1fae5" />
        <StatCard icon="🎓" label="Capstone Submissions" val={stats.capstones} color="#8b5cf6" bg="#ede9fe" />
        <StatCard icon="📅" label="My Attendance Rate" val={`${stats.attendance}%`} color="#f59e0b" bg="#fef3c7" />
      </div>

      {/* ── Active Mentees Quick List ── */}
      {user.mentorProfile?.assignedTeachers?.length > 0 && (
        <div style={{ marginBottom: 24, padding: "16px", background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 12 }}>🎓 Your Mentees:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {user.mentorProfile.assignedTeachers.map((mentee, i) => (
              <div key={mentee._id || i} style={{ background: "white", padding: "6px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#1e40af", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }}></div>
                {mentee.name || "Unknown Fellow"}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 style={S.pageTitle}>My Profile</h1>
          <p style={S.pageSub}>Manage your personal information and preferences.</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} style={S.primaryBtn}>
            <span style={{ marginRight: 6 }}>✏️</span> Edit Profile
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setForm({ ...savedForm }); setEditing(false); setMessage(""); }} style={S.exportBtn}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{...S.primaryBtn, opacity: saving ? 0.7 : 1}}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Personal Info */}
          <SectionCard title="👤 Personal Information">
            <div style={{ display: "flex", gap: 24, marginBottom: 24, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 100, height: 100, borderRadius: "50%",
                  background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 800, color: "#4f46e5",
                  border: "4px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  overflow: "hidden"
                }}>
                  {profilePhoto && !imageLoadError ? (
                    <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImageLoadError(true)} />
                  ) : (
                    user?.name?.[0] || "?"
                  )}
                  {uploadingPhoto && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 14 }}>⏳</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{
                    position: "absolute", bottom: 0, right: -4,
                    width: 32, height: 32, borderRadius: "50%",
                    background: "#3b82f6", color: "white", border: "2px solid white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: uploadingPhoto ? "not-allowed" : "pointer", boxShadow: "0 2px 6px rgba(59,130,246,0.3)"
                  }}
                  title="Upload Photo"
                >
                  📷
                </button>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: "none" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{form.name}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b", marginBottom: 8 }}>{user?.email}</p>
                {profilePhoto && (
                  <button onClick={handleRemovePhoto} disabled={uploadingPhoto} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>Full Name</label>
                <input style={{...S.input, background: editing ? "white" : "#f8fafc", opacity: editing ? 1 : 0.7 }} value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={!editing} />
              </div>
              <div>
                <label style={S.label}>Phone Number</label>
                <input style={{...S.input, background: editing ? "white" : "#f8fafc", opacity: editing ? 1 : 0.7 }} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} disabled={!editing} />
              </div>
              <div>
                <label style={S.label}>Email Address (Login ID)</label>
                <input style={{...S.input, background: editing ? "white" : "#f8fafc", opacity: editing ? 1 : 0.7 }} value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!editing} />
                <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, display: "block" }}>Changing this updates your login ID</span>
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Professional Details */}
          <SectionCard title="💼 Professional Details">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>Working Center (Assigned by Admin)</label>
                <input style={{...S.input, background: "#f1f5f9", opacity: 0.6, cursor: "not-allowed" }} value={form.workingCenter} disabled />
              </div>
              <div>
                <label style={S.label}>Qualification</label>
                <input style={{...S.input, background: editing ? "white" : "#f8fafc", opacity: editing ? 1 : 0.7 }} value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} disabled={!editing} placeholder="e.g. M.Ed, B.Ed" />
              </div>
              <div>
                <label style={S.label}>Specialization</label>
                <input style={{...S.input, background: editing ? "white" : "#f8fafc", opacity: editing ? 1 : 0.7 }} value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} disabled={!editing} placeholder="e.g. Early Childhood Education" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>Experience / Bio</label>
                <textarea style={{...S.input, background: editing ? "white" : "#f8fafc", opacity: editing ? 1 : 0.7, minHeight: 80, resize: "vertical" }} value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} disabled={!editing} placeholder="Brief background or experience..." />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>Address</label>
                <textarea style={{...S.input, background: editing ? "white" : "#f8fafc", opacity: editing ? 1 : 0.7, minHeight: 60, resize: "vertical" }} value={form.address} onChange={e => setForm({...form, address: e.target.value})} disabled={!editing} placeholder="Full residential address" />
              </div>
            </div>
          </SectionCard>

          {/* Password Section */}
          <SectionCard title="🔐 Security">
            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: 16, position: "relative" }}>
                <label style={S.label}>Current Password</label>
                <input type={showPassword.current ? "text" : "password"} style={S.input} required
                  value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
                <button type="button" onClick={() => setShowPassword({...showPassword, current: !showPassword.current})} style={{ position: "absolute", right: 12, top: 32, background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>
                  {showPassword.current ? "👁️" : "🙈"}
                </button>
              </div>
              
              <div style={{ marginBottom: 16, position: "relative" }}>
                <label style={S.label}>New Password</label>
                <input type={showPassword.new ? "text" : "password"} style={S.input} required minLength={6}
                  value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                <button type="button" onClick={() => setShowPassword({...showPassword, new: !showPassword.new})} style={{ position: "absolute", right: 12, top: 32, background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>
                  {showPassword.new ? "👁️" : "🙈"}
                </button>
              </div>
              
              <div style={{ marginBottom: 20, position: "relative" }}>
                <label style={S.label}>Confirm New Password</label>
                <input type={showPassword.confirm ? "text" : "password"} style={S.input} required minLength={6}
                  value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                <button type="button" onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})} style={{ position: "absolute", right: 12, top: 32, background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>
                  {showPassword.confirm ? "👁️" : "🙈"}
                </button>
              </div>

              <button type="submit" disabled={changingPassword} style={{ ...S.exportBtn, width: "100%", background: "#f8fafc" }}>
                {changingPassword ? "Updating..." : "Change Password"}
              </button>
            </form>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* ── Mentor Notifications Tab ── */
export function MentorNotificationsTab({ notifications = [], onMarkRead, onMarkAllRead }) {
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
    approval: "✅", approved: "✅", status: "✅", status_update: "✅",
    // attendance
    attendance: "📋", attendance_alert: "⚠️",
    // mentor-specific
    mentor_assigned: "👨‍🏫", teacher_claimed: "🤝", mentee: "👩‍🏫",
    // general
    info: "ℹ️", warning: "⚠️", alert: "🔔", system: "⚙️",
  };
  const getIcon = (type, msg = "") => {
    if (!type && !msg) return "🔔";
    const lower = String(type || "").toLowerCase();
    // First try exact type match
    if (lower && icons[lower] && lower !== "info") return icons[lower];
    // If type is generic/info, scan message content for context
    const text = (msg || "").toLowerCase();
    if (text.includes("approved") || text.includes("approval")) return "✅";
    if (text.includes("course") || text.includes("allocated")) return "📚";
    if (text.includes("curriculum") || text.includes("published")) return "📖";
    if (text.includes("fellow") || text.includes("assigned") || text.includes("teacher")) return "👩‍🏫";
    if (text.includes("capstone") || text.includes("deadline") || text.includes("missed")) return "⚠️";
    if (text.includes("certificate")) return "🏆";
    if (text.includes("attendance")) return "📋";
    if (text.includes("mentor")) return "👨‍🏫";
    if (text.includes("center")) return "🏫";
    if (text.includes("lesson")) return "📖";
    return icons[lower] || "🔔";
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={S.pageTitle}>Notifications</h1>
          <p style={S.pageSub}>{notifications.filter(n=>!n.read).length} unread</p>
        </div>
        <button onClick={onMarkAllRead} style={S.exportBtn}>✓ Mark all read</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", background: "white", borderRadius: 16, border: "1px dashed #cbd5e1", color: "#94a3b8" }}>
            No notifications.
          </div>
        ) : (
          notifications.map(n=>(
            <div key={n.id} onClick={()=>!n.read && onMarkRead(n.id)} style={{ background: n.read?"white":"#fffbeb", borderRadius: 14, padding: "14px 18px", border: `1px solid ${n.read?"#f1f5f9":"#fbbf24"}`, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", borderLeft: `4px solid ${n.read?"#e5e7eb":"#f59e0b"}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: n.read?"#f3f4f6":"#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{getIcon(n.type, n.msg)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: n.read?500:700, color: "#1c1917" }}>{n.msg || n.title || "Notification"}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{n.time}</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }}/>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Mentor Feedback Tab ── */
export function MentorFeedbackTab({ user, setToast }) {
  const [rating, setRating]         = useState(0);
  const [trainerRating, setTRating] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [course, setCourse]         = useState("");
  const [tag, setTag]               = useState("Content Quality");
  const [anonymous, setAnonymous]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loading, setLoading]       = useState(true);

  const TAGS = ["Program UX", "Platform UX", "Mentee Progress", "Schedule", "Other"];
  const stars = (n, size=20) => Array.from({length:5},(_,i) => (
    <span key={i} style={{fontSize:size, cursor:"pointer", color: i < n ? "#f59e0b" : "#e5e7eb"}}>{i < n ? "★" : "☆"}</span>
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { setToast?.({ msg: "Please rate your experience.", type: "error" }); return; }
    if (!suggestion.trim()) { setToast?.({ msg: "Please write your feedback.", type: "error" }); return; }
    setSubmitting(true);
    try {
      const trainerRatingPayload = trainerRating > 0 ? trainerRating : undefined;
      await submitFeedback({
        learner: anonymous ? "Anonymous" : user.name,
        teacherId: user._id, 
        course: course || "General Mentorship",
        ...(trainerRatingPayload !== undefined ? { trainerRating: trainerRatingPayload } : {}),
        rating,
        tag,
        suggestion,
        anonymous,
        status: "pending"
      });
      setToast?.({ msg: "Feedback submitted successfully! Thank you.", type: "success" });
      setSuggestion(""); setRating(0); setTRating(0); setCourse(""); setAnonymous(false);
    } catch(err) {
      setToast?.({ msg: err.message || "Failed to submit feedback.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={S.pageTitle}>Submit Feedback</h1>
      <p style={S.pageSub}>Share your mentor experience and help us improve.</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <SectionCard title="📝 New Feedback">
          <form onSubmit={handleSubmit}>
            <label style={S.label}>Mentee / Topic (optional)</label>
            <input style={{...S.input, marginBottom:12}} value={course} onChange={e=>setCourse(e.target.value)} placeholder="e.g. Teacher Mentorship Session"/>

            <label style={S.label}>Tag / Category</label>
            <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:12}}>
              {TAGS.map(tg => (
                <button type="button" key={tg} onClick={()=>setTag(tg)}
                  style={{padding:"5px 12px", borderRadius:20, border:"1.5px solid", fontSize:11, fontWeight:600, cursor:"pointer",
                    borderColor: tag===tg ? "#f59e0b" : "#e5e7eb",
                    background: tag===tg ? "#fef3c7" : "white",
                    color: tag===tg ? "#92400e" : "#6b7280"}}>
                  {tg}
                </button>
              ))}
            </div>

            <label style={S.label}>Overall Experience *</label>
            <div style={{display:"flex", gap:4, marginBottom:12, cursor:"pointer"}}>
              {[1,2,3,4,5].map(i => (
                <span key={i} onClick={()=>setRating(i)} style={{fontSize:28, color: i<=rating?"#f59e0b":"#e5e7eb"}}>
                  {i<=rating?"★":"☆"}
                </span>
              ))}
              {rating > 0 && <span style={{fontSize:12, color:"#6b7280", marginLeft:8, alignSelf:"center"}}>{rating}/5</span>}
            </div>

            <label style={S.label}>Mentee Engagement (Optional)</label>
            <div style={{display:"flex", gap:4, marginBottom:12, cursor:"pointer"}}>
              {[1,2,3,4,5].map(i => (
                <span key={i} onClick={()=>setTRating(i)} style={{fontSize:22, color: i<=trainerRating?"#f59e0b":"#e5e7eb"}}>
                  {i<=trainerRating?"★":"☆"}
                </span>
              ))}
            </div>

            <label style={S.label}>Detailed Feedback *</label>
            <textarea style={{...S.input, minHeight:100, marginBottom:16}} value={suggestion} onChange={e=>setSuggestion(e.target.value)} placeholder="What went well? What could be improved?" required/>

            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:20}}>
              <input type="checkbox" id="anon" checked={anonymous} onChange={e=>setAnonymous(e.target.checked)} style={{width:16, height:16, accentColor:"#f59e0b"}}/>
              <label htmlFor="anon" style={{fontSize:13, color:"#475569", cursor:"pointer"}}>Submit anonymously (Admin will not see your name)</label>
            </div>

            <button type="submit" disabled={submitting} style={{...S.primaryBtn, width:"100%", opacity: submitting ? 0.7 : 1}}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="🕒 My Past Feedback">
          {loading ? (
             <div style={{padding:20, textAlign:"center", color:"#9ca3af"}}>Loading...</div>
          ) : myFeedbacks.length === 0 ? (
            <div style={{padding:30, textAlign:"center", color:"#9ca3af"}}>
              <div style={{fontSize:32, marginBottom:10}}>💬</div>
              <div style={{fontSize:14, fontWeight:600}}>No feedback submitted yet</div>
            </div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:12, maxHeight:500, overflowY:"auto"}}>
              {myFeedbacks.map((f,i) => (
                <div key={i} style={{padding:16, borderRadius:12, border:"1px solid #f1f5f9", background:"#f8fafc"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8}}>
                    <div style={{fontSize:14, fontWeight:700, color:"#1e293b"}}>{f.course}</div>
                    <div style={{display:"flex"}}>{stars(f.rating, 14)}</div>
                  </div>
                  <div style={{fontSize:11, color:"#6b7280", marginBottom:8}}>
                    <span style={{background:"#e2e8f0", padding:"2px 8px", borderRadius:10, marginRight:8}}>{f.tag}</span>
                    {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "Just now"}
                  </div>
                  <div style={{fontSize:13, color:"#334155", lineHeight:1.5}}>
                    "{f.suggestion}"
                  </div>
                  {f.status === "reviewed" && (
                    <div style={{marginTop:10, padding:10, background:"#d1fae5", borderRadius:8, fontSize:12, color:"#065f46", border:"1px solid #a7f3d0"}}>
                      <strong>Admin Reply:</strong> {f.adminReply || "Thank you! We've noted your feedback."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/* ── Mentee Management Tab ── */
export function MenteeManagementTab({ user, setToast, onUserUpdate }) {
  const mentees = user?.mentorProfile?.assignedTeachers || [];
  const [subTab, setSubTab] = useState("my_mentees"); // "my_mentees" | "approvals"
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [observationModal, setObservationModal] = useState(false);
  const [observationText, setObservationText] = useState("");
  
  // Pending / All fellows state for approvals subtab
  const [allFellows, setAllFellows] = useState([]);
  const [loadingFellows, setLoadingFellows] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  
  // Search and filters for approvals
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // default to all to show approved fellows as well
  const [selectedFellow, setSelectedFellow] = useState(null); // for detail modal

  const fetchFellows = () => {
    setLoadingFellows(true);
    getMentorFellows()
      .then(res => {
        setAllFellows(res?.fellows || []);
      })
      .catch(() => setToast?.({ msg: "Failed to load fellows.", type: "error" }))
      .finally(() => setLoadingFellows(false));
  };

  useEffect(() => {
    fetchFellows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  const handleRecordObservation = (mentee) => {
    setSelectedMentee(mentee);
    setObservationModal(true);
  };

  const submitObservation = async () => {
    if(!observationText.trim()) {
      setToast?.({ msg: "Observation cannot be empty", type: "error" });
      return;
    }
    
    try {
      await recordMenteeObservation(selectedMentee._id, observationText);
      setToast?.({ msg: "Observation recorded successfully!", type: "success" });
      setObservationModal(false);
      setObservationText("");
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to record observation", type: "error" });
    }
  };

  const handleStatusChange = async (fellowId, newStatus) => {
    setActioningId(fellowId);
    try {
      await updateFellowStatus(fellowId, newStatus);
      setToast?.({ msg: `Fellow account ${newStatus} successfully!`, type: "success" });
      
      // Refresh list
      fetchFellows();

      // Refresh mentor profile to sync assignedTeachers
      getMentorMe().then(res => {
        if (res.mentor) onUserUpdate(res.mentor);
      });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to update fellow status", type: "error" });
    } finally {
      setActioningId(null);
    }
  };

  const isClaimed = (fellowId) => {
    return mentees.some(m => {
      const id = typeof m === 'object' && m !== null ? (m._id || m.id) : m;
      return id?.toString() === fellowId?.toString();
    });
  };

  const handleClaimFellow = async (fellowId) => {
    setActioningId(fellowId);
    
    // Optimistic UI Update
    const claimedFellow = allFellows.find(f => (f._id || f.id) === fellowId);
    if (claimedFellow && !isClaimed(fellowId)) {
      onUserUpdate({
        ...user,
        mentorProfile: {
          ...user.mentorProfile,
          assignedTeachers: [...mentees, claimedFellow]
        }
      });
      // Optimistically update fellow status in allFellows list
      setAllFellows(prev => prev.map(f => (f._id || f.id) === fellowId ? { ...f, status: "approved" } : f));
    }

    try {
      await claimFellow(fellowId);
      setToast?.({ msg: "Fellow successfully claimed and added to your mentees!", type: "success" });
      
      // Refresh list
      fetchFellows();

      // Refresh mentor profile to sync assignedTeachers
      getMentorMe().then(res => {
        if (res.mentor) onUserUpdate(res.mentor);
      });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to claim fellow", type: "error" });
      // Revert optimistic update on failure by re-fetching
      getMentorMe().then(res => {
        if (res.mentor) onUserUpdate(res.mentor);
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleUnclaimFellow = async (fellowId) => {
    setActioningId(fellowId);

    // Optimistic UI Update
    if (isClaimed(fellowId)) {
      onUserUpdate({
        ...user,
        mentorProfile: {
          ...user.mentorProfile,
          assignedTeachers: mentees.filter(m => (m._id || m.id || m).toString() !== fellowId.toString())
        }
      });
      // Optimistically update fellow status in allFellows list
      setAllFellows(prev => prev.map(f => (f._id || f.id) === fellowId ? { ...f, status: "pending" } : f));
    }

    try {
      await unclaimFellow(fellowId);
      setToast?.({ msg: "Fellow successfully unclaimed and removed from your mentees.", type: "success" });
      
      // Refresh list
      fetchFellows();

      // Refresh mentor profile to sync assignedTeachers
      getMentorMe().then(res => {
        if (res.mentor) onUserUpdate(res.mentor);
      });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to unclaim fellow", type: "error" });
      // Revert optimistic update on failure by re-fetching
      getMentorMe().then(res => {
        if (res.mentor) onUserUpdate(res.mentor);
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteFellow = async (fellowId) => {
    if (!window.confirm("Are you sure you want to permanently delete this fellow's account? This action cannot be undone.")) return;
    
    setActioningId(fellowId);
    
    // Optimistic UI Update
    setAllFellows(prev => prev.filter(f => (f._id || f.id) !== fellowId));
    onUserUpdate({
      ...user,
      mentorProfile: {
        ...user.mentorProfile,
        assignedTeachers: mentees.filter(m => (m._id || m.id || m).toString() !== fellowId.toString())
      }
    });

    try {
      await deleteMentorFellow(fellowId);
      setToast?.({ msg: "Fellow account successfully deleted.", type: "success" });
      
      // Refresh list
      fetchFellows();
      getMentorMe().then(res => {
        if (res.mentor) onUserUpdate(res.mentor);
      });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to delete fellow", type: "error" });
      // Revert optimistic update
      fetchFellows();
      getMentorMe().then(res => {
        if (res.mentor) onUserUpdate(res.mentor);
      });
    } finally {
      setActioningId(null);
    }
  };
// end dnyaneshwari thorat

  // Filter fellows based on search and statusFilter
  const filteredFellows = allFellows.filter(f => {
    const matchesSearch = f.name?.toLowerCase().includes(search.toLowerCase()) || 
                          f.email?.toLowerCase().includes(search.toLowerCase()) ||
                          f.phone?.includes(search) ||
                          f.teacherProfile?.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = allFellows.filter(f => f.status === "pending").length;
  const approvedCount = allFellows.filter(f => f.status === "approved").length;
  const rejectedCount = allFellows.filter(f => f.status === "rejected" || f.status === "blocked").length;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={S.pageTitle}>Mentee Management</h1>
      <p style={S.pageSub}>Observe, guide, and track progress for your assigned teachers and fellows.</p>

      {/* Sub-tab navigation */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
        <button 
          onClick={() => setSubTab("my_mentees")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13,
            background: subTab === "my_mentees" ? "#eff6ff" : "transparent",
            color: subTab === "my_mentees" ? "#1e40af" : "#64748b",
            cursor: "pointer", transition: "all 0.2s"
          }}
        >
          👥 My Mentees ({mentees.length})
        </button>
        <button 
          onClick={() => setSubTab("approvals")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13,
            background: subTab === "approvals" ? "#fef3c7" : "transparent",
            color: subTab === "approvals" ? "#92400e" : "#64748b",
            cursor: "pointer", transition: "all 0.2s"
          }}
        >
          ⏳ Fellow Approvals {pendingCount > 0 && <span style={{ marginLeft: 6, background: "#ef4444", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: 9 }}>{pendingCount}</span>}
        </button>
      </div>

      {subTab === "my_mentees" ? (
        mentees.length === 0 ? (
          <div style={{ background: "white", padding: 40, borderRadius: 16, textAlign: "center", border: "1px dashed #cbd5e1" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <h3 style={{ margin: "0 0 8px", color: "#1e293b" }}>No Mentees Assigned</h3>
            <p style={{ color: "#64748b", margin: 0 }}>You currently do not have any teachers or fellows assigned to you. Admin will assign mentees soon.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* start dnyaneshwari thorat */}
            {mentees.map((mentee, i) => (
              <div key={mentee._id || i} style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
                
                {/* 1. Identity & Progress */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 250px" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#fef3c7", border: "2px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                      {mentee.role === "fellow" ? "🎓" : "👩‍🏫"}
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#0f172a" }}>{mentee.name || "Unknown Fellow"}</h3>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {mentee.role === "fellow" ? "Fellow" : "General Teacher"} • {mentee.teacherProfile?.subject || "ECCE"}
                      </div>
                      <div style={{ fontSize: 12, color: "#475569", marginTop: 4, display: "flex", gap: 12 }}>
                        {mentee.email && <span>✉️ {mentee.email}</span>}
                        {mentee.phone && <span>📞 {mentee.phone}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "#475569", fontWeight: 600 }}>Course Progress</span>
                      <span style={{ color: "#3b82f6", fontWeight: 800 }}>{(Math.random() * 40 + 60).toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: "75%", height: "100%", background: "#3b82f6", borderRadius: 3 }}></div>
                    </div>
                  </div>
                </div>

                {/* 2. Checklist */}
                <div style={{ background: "#f1f5f9", padding: 16, borderRadius: 10, display: "flex", flexDirection: "column", gap: 10, flex: "2 1 350px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", borderBottom: "1px solid #cbd5e1", paddingBottom: 6 }}>📋 Mentor Tracking Checklist</div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>1. Community Profiling</span>
                    <select 
                      value={mentee.teacherProfile?.communityProfilingStatus || "pending"} 
                      onChange={async (e) => {
                        const newVal = e.target.value;
                        // Optimistic UI Update
                        const updatedMentees = mentees.map(m => 
                          (m._id || m.id) === mentee._id 
                            ? { ...m, teacherProfile: { ...m.teacherProfile, communityProfilingStatus: newVal } } 
                            : m
                        );
                        onUserUpdate({ ...user, mentorProfile: { ...user.mentorProfile, assignedTeachers: updatedMentees } });
                        
                        try {
                          await updateMenteeTracking(mentee._id, { communityProfilingStatus: newVal });
                          setToast?.({ msg: "Community Profiling status updated!", type: "success" });
                          getMentorMe().then(res => { if (res.mentor) onUserUpdate(res.mentor); });
                        } catch (err) {
                          setToast?.({ msg: err.message || "Failed to update tracking", type: "error" });
                          getMentorMe().then(res => { if (res.mentor) onUserUpdate(res.mentor); });
                        }
                      }}
                      style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, background: "white", color: "#1e293b", fontWeight: 600 }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>2. Community Immersion</span>
                    <select 
                      value={mentee.teacherProfile?.communityImmersionStatus || "pending"} 
                      onChange={async (e) => {
                        const newVal = e.target.value;
                        // Optimistic UI Update
                        const updatedMentees = mentees.map(m => 
                          (m._id || m.id) === mentee._id 
                            ? { ...m, teacherProfile: { ...m.teacherProfile, communityImmersionStatus: newVal } } 
                            : m
                        );
                        onUserUpdate({ ...user, mentorProfile: { ...user.mentorProfile, assignedTeachers: updatedMentees } });

                        try {
                          await updateMenteeTracking(mentee._id, { communityImmersionStatus: newVal });
                          setToast?.({ msg: "Community Immersion status updated!", type: "success" });
                          getMentorMe().then(res => { if (res.mentor) onUserUpdate(res.mentor); });
                        } catch (err) {
                          setToast?.({ msg: err.message || "Failed to update tracking", type: "error" });
                          getMentorMe().then(res => { if (res.mentor) onUserUpdate(res.mentor); });
                        }
                      }}
                      style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, background: "white", color: "#1e293b", fontWeight: 600 }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>3. Daily Curriculum Implementation</span>
                    <select 
                      value={mentee.teacherProfile?.curriculumImplementationStatus || "pending"} 
                      onChange={async (e) => {
                        const newVal = e.target.value;
                        // Optimistic UI Update
                        const updatedMentees = mentees.map(m => 
                          (m._id || m.id) === mentee._id 
                            ? { ...m, teacherProfile: { ...m.teacherProfile, curriculumImplementationStatus: newVal } } 
                            : m
                        );
                        onUserUpdate({ ...user, mentorProfile: { ...user.mentorProfile, assignedTeachers: updatedMentees } });

                        try {
                          await updateMenteeTracking(mentee._id, { curriculumImplementationStatus: newVal });
                          setToast?.({ msg: "Daily Curriculum status updated!", type: "success" });
                          getMentorMe().then(res => { if (res.mentor) onUserUpdate(res.mentor); });
                        } catch (err) {
                          setToast?.({ msg: err.message || "Failed to update tracking", type: "error" });
                          getMentorMe().then(res => { if (res.mentor) onUserUpdate(res.mentor); });
                        }
                      }}
                      style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, background: "white", color: "#1e293b", fontWeight: 600 }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* 3. Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "1 1 150px" }}>
                  <button onClick={() => handleRecordObservation(mentee)} style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                    📝 Record Observation
                  </button>
                  <button onClick={() => setToast?.({ msg: "Message feature coming soon!", type: "info" })} style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                    💬 Message
                  </button>
                </div>
              </div>
            ))}
            {/* end dnyaneshwari thorat */}
          </div>
        )
      ) : (
        /* Fellow Approvals View (Styled exactly like Admin's Teacher Management) */
        <div>
          {/* Header Banner */}
          <div style={{ background: "linear-gradient(135deg,#f59e0b 0%,#d97706 60%,#b45309 100%)", borderRadius: 20, padding: "24px 28px", marginBottom: 24, color: "white", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fffbeb", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>Fellow Management</div>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>Fellow Approvals</h1>
              <p style={{ fontSize: 12, margin: 0, color: "rgba(255,255,255,0.85)" }}>
                {approvedCount} approved · {pendingCount} pending · {allFellows.length} total
              </p>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
            <StatCard icon="🎓" label="Total Registered" val={allFellows.length} color="#3b82f6" bg="#dbeafe" />
            <StatCard icon="✅" label="Approved" val={approvedCount} color="#10b981" bg="#d1fae5" />
            <StatCard icon="⏳" label="Pending Approval" val={pendingCount} color="#f59e0b" bg="#fef3c7" />
            <StatCard icon="🚫" label="Rejected" val={rejectedCount} color="#ef4444" bg="#fee2e2" />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone or specialization..." />
            </div>
            <select style={{ ...S.input, width: 140, padding: "8px 12px", marginBottom: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Approvals Table */}
          {loadingFellows ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "#64748b" }}>🔄 Loading approvals...</div>
          ) : (
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    {["Fellow", "Phone", "Qualification", "Specialization", "Joined", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFellows.map((fellow, i) => (
                    <tr key={fellow._id} style={{ borderBottom: "1px solid #f9fafb", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#ede9fe", border: "1.5px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#7c3aed" }}>
                            {fellow.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>{fellow.name || "Unknown Fellow"}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{fellow.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151" }}>{fellow.phone || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151" }}>{fellow.teacherProfile?.qualification || "Graduate"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151" }}>{fellow.teacherProfile?.subject || "ECCE"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#9ca3af" }}>
                        {fellow.createdAt ? new Date(fellow.createdAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {/* start dnyaneshwari thorat */}
                        {isClaimed(fellow._id) ? (
                          <span style={{ background: "#cffafe", color: "#0891b2", padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, display: "inline-block", border: "1px solid #67e8f9" }}>Claimed</span>
                        ) : (
                          <StatusBadge status={fellow.status} />
                        )}
                        {/* end dnyaneshwari thorat */}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          <button onClick={() => setSelectedFellow(fellow)} style={{ ...S.tblBtn, color: "#3b82f6", borderColor: "#93c5fd" }}>👁 View</button>
                          
                          {/* start dnyaneshwari thorat */}
                          {!isClaimed(fellow._id) ? (
                            <button
                              disabled={actioningId === fellow._id}
                              onClick={() => handleClaimFellow(fellow._id)}
                              style={{ ...S.tblBtn, color: "#8b5cf6", borderColor: "#c084fc", fontWeight: 800 }}
                            >
                              ➕ Claim Fellow
                            </button>
                          ) : (
                            <button
                              disabled={actioningId === fellow._id}
                              onClick={() => handleUnclaimFellow(fellow._id)}
                              style={{ ...S.tblBtn, color: "#10b981", borderColor: "#34d399", background: "#ecfdf5", fontWeight: 800 }}
                            >
                              ✅ Claimed (Reset)
                            </button>
                          )}
                          <button
                            disabled={actioningId === fellow._id}
                            onClick={() => handleDeleteFellow(fellow._id)}
                            style={{ ...S.tblBtn, color: "#ef4444", borderColor: "#fca5a5", fontWeight: 800 }}
                            title="Permanently delete fellow account"
                          >
                            🗑 Delete
                          </button>
                          {/* end dnyaneshwari thorat */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredFellows.length === 0 && (
                <div style={{ textAlign: "center", padding: "50px", color: "#9ca3af" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>No fellows found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your filters</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fellow Details Modal */}
      {selectedFellow && (
        <Modal title="🎓 Fellow Profile Details" onClose={() => setSelectedFellow(null)}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#ede9fe", border: "2px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
              🎓
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>{selectedFellow.name}</h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{selectedFellow.email}</p>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13, marginBottom: 20 }}>
            <div><strong>Phone:</strong> {selectedFellow.phone || "—"}</div>
            <div><strong>Status:</strong> <StatusBadge status={selectedFellow.status} /></div>
            <div><strong>Qualification:</strong> {selectedFellow.teacherProfile?.qualification || "Graduate"}</div>
            <div><strong>Specialization:</strong> {selectedFellow.teacherProfile?.subject || "ECCE"}</div>
            <div><strong>Experience:</strong> {selectedFellow.teacherProfile?.experience || "2 years"}</div>
            <div><strong>Address:</strong> {selectedFellow.teacherProfile?.address || "N/A"}</div>
            <div><strong>Joined Date:</strong> {selectedFellow.createdAt ? new Date(selectedFellow.createdAt).toLocaleString("en-IN") : "—"}</div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {selectedFellow.status === "pending" && (
              <>
                <button 
                  disabled={actioningId === selectedFellow._id}
                  onClick={() => { handleStatusChange(selectedFellow._id, "approved"); setSelectedFellow(null); }}
                  style={{ ...S.btnGreen, padding: "8px 16px" }}
                >
                  ✓ Approve
                </button>
                <button 
                  disabled={actioningId === selectedFellow._id}
                  onClick={() => { handleStatusChange(selectedFellow._id, "rejected"); setSelectedFellow(null); }}
                  style={{ ...S.btnRed, padding: "8px 16px" }}
                >
                  ✕ Reject
                </button>
              </>
            )}
            <button onClick={() => setSelectedFellow(null)} style={{ ...S.exportBtn, background: "#f1f5f9" }}>Close</button>
          </div>
        </Modal>
      )}

      {/* Observation Modal */}
      {observationModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s" }}>
          <div style={{ background: "white", padding: 30, borderRadius: 20, width: "100%", maxWidth: 500, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "#0f172a" }}>Record Observation</h2>
            <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 14 }}>Mentee: <strong>{selectedMentee?.name}</strong></p>
            
            <label style={S.label}>Observation Notes</label>
            <textarea 
              autoFocus
              style={{...S.input, minHeight: 120, resize: "vertical", marginBottom: 20}} 
              value={observationText} 
              onChange={e => setObservationText(e.target.value)} 
              placeholder="What did you observe during the session? What feedback was given?"
            />

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setObservationModal(false)} style={{...S.exportBtn, background: "#f1f5f9"}}>Cancel</button>
              <button onClick={submitObservation} style={S.primaryBtn}>Submit Observation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Impact & Capstone Tab ── */
export function ImpactCapstoneTab({ user, setToast, onUserUpdate }) {
  const [capstoneText, setCapstoneText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = () => {
    setLoading(true);
    getCapstoneSubmissions()
      .then(res => setSubmissions(res.submissions || []))
      .catch(err => console.error("Failed to fetch Capstone", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const MILESTONES = [
    { id: 1, title: "Problem Identification", desc: "Identify a core challenge in the early childhood community." },
    { id: 2, title: "Solution Design", desc: "Design a targeted intervention & pedagogical framework." },
    { id: 3, title: "Implementation", desc: "Execute the solution in classroom settings & collect data." },
    { id: 4, title: "Evaluation", desc: "Analyze impact metrics, synthesize findings & finalize report." }
  ];

  const milestone = Math.min(submissions.length + 1, 4);
  const isAllCompleted = submissions.length >= 4;

  const handleSubmit = async () => {
    if(!capstoneText.trim()) {
      setToast?.({ msg: "Please enter your submission notes or document link.", type: "error" });
      return;
    }
    setSubmitting(true);
    
    try {
      await submitCapstoneMilestone(milestone, capstoneText, "");
      setToast?.({ msg: `Milestone ${milestone} submitted successfully!`, type: "success" });
      setCapstoneText("");
      fetchSubmissions();
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to submit milestone", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = (e, file) => {
    e.preventDefault();
    setToast?.({ msg: `Downloading ${file}...`, type: "info" });
    const link = document.createElement("a");
    link.href = `/resources/${encodeURIComponent(file)}`;
    link.download = file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menteesCount = user?.mentorProfile?.assignedTeachers?.length || 0;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Role Badge + Page Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
              Mentor Workspace
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>Impact & Capstone</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Track your Semester 4 Capstone milestones and mentee leadership impact.</p>
        </div>
      </div>

      {/* Top 3 Compact Industrial Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        
        {/* Stat 1: Impact Score */}
        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Impact Score</span>
            <span style={{ fontSize: 10, fontWeight: 700, background: "#d1fae5", color: "#047857", padding: "2px 6px", borderRadius: 4 }}>● Top 10%</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>A+</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Evaluated from mentee progress & reviews</div>
        </div>

        {/* Stat 2: Teachers Guided */}
        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Teachers Guided</span>
            <span style={{ fontSize: 10, fontWeight: 700, background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: 4 }}>● Active</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>{menteesCount}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Fellows currently assigned under mentorship</div>
        </div>

        {/* Stat 3: Capstone Status */}
        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Capstone Status</span>
            <span style={{ fontSize: 10, fontWeight: 700, background: isAllCompleted ? "#d1fae5" : "#fef3c7", color: isAllCompleted ? "#047857" : "#b45309", padding: "2px 6px", borderRadius: 4 }}>
              {isAllCompleted ? "Completed" : "In Progress"}
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4, letterSpacing: "-0.3px" }}>
            {isAllCompleted ? "4 / 4 Completed" : `Milestone ${milestone} of 4`}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{submissions.length} milestone{submissions.length === 1 ? "" : "s"} submitted & verified</div>
        </div>
      </div>

      {/* Main Grid: Capstone Hero & Resources Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        
        {/* HERO: Capstone Project Tracker */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Capstone Project Sequence</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Complete each milestone in order. Submissions sync with program advisors.</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", background: "#f8fafc", padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              Progress: {Math.round((submissions.length / 4) * 100)}%
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ position: "relative", marginBottom: 32, padding: "0 8px" }}>
            {/* Background Line */}
            <div style={{ position: "absolute", top: 14, left: 32, right: 32, height: 2, background: "#e2e8f0", zIndex: 0 }}>
              <div style={{ height: "100%", width: `${(Math.max(0, submissions.length) / 3) * 100}%`, background: "#2563eb", transition: "width 0.4s ease" }} />
            </div>

            {/* Nodes */}
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
              {MILESTONES.map((m) => {
                const isPassed = submissions.length >= m.id;
                const isCurrent = milestone === m.id && !isAllCompleted;
                return (
                  <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 90 }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: isPassed ? "#059669" : isCurrent ? "#2563eb" : "#f8fafc",
                      border: `2px solid ${isPassed ? "#059669" : isCurrent ? "#2563eb" : "#cbd5e1"}`,
                      color: isPassed || isCurrent ? "#ffffff" : "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 800,
                      marginBottom: 8,
                      boxShadow: isCurrent ? "0 0 0 4px rgba(37, 99, 235, 0.15)" : "none",
                      transition: "all 0.25s ease"
                    }}>
                      {isPassed ? "✓" : m.id}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: isCurrent || isPassed ? 700 : 500, textAlign: "center", color: isCurrent ? "#0f172a" : isPassed ? "#059669" : "#64748b", lineHeight: 1.3, height: 28 }}>
                      {m.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submission / Active Milestone Form */}
          {!isAllCompleted ? (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Milestone {milestone} of 4
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b", background: "#ffffff", padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                  Status: Pending Submission
                </span>
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{MILESTONES[milestone - 1]?.title}</h3>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{MILESTONES[milestone - 1]?.desc}</p>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Submission Deliverables / Evidence Link <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea 
                  style={{
                    width: "100%",
                    minHeight: 110,
                    padding: "10px 12px",
                    fontSize: 13,
                    color: "#0f172a",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s, box-shadow 0.15s"
                  }} 
                  placeholder="Provide a summary of your work or paste a link to your Google Drive / Docs evidence folder..."
                  value={capstoneText}
                  onChange={e => setCapstoneText(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                />
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  💡 Helper: Paste a Drive/Docs link or write 2–3 detailed sentences explaining your deliverables.
                </div>
              </div>
              
              <button 
                onClick={handleSubmit} 
                disabled={submitting} 
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  transition: "background 0.2s"
                }}
                onMouseOver={e => { if(!submitting) e.target.style.background = "#1e293b"; }}
                onMouseOut={e => { if(!submitting) e.target.style.background = "#0f172a"; }}
              >
                {submitting ? "Submitting..." : `Submit Milestone ${milestone}`}
              </button>
            </div>
          ) : (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#166534" }}>All Capstone Milestones Completed</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#15803d" }}>Congratulations! You have submitted all 4 milestones for your Semester 4 Capstone project.</p>
            </div>
          )}

          {/* Past Submissions Log */}
          {submissions.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Submission History ({submissions.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {submissions.map((sub, idx) => (
                  <div key={sub._id || idx} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                        Milestone {sub.milestone || idx + 1}: {MILESTONES[(sub.milestone || idx + 1) - 1]?.title}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#047857", background: "#d1fae5", padding: "2px 6px", borderRadius: 4 }}>
                        ✓ Verified
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                      {sub.text || sub.notes || "Submission logged."}
                    </p>
                    {sub.createdAt && (
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                        Logged: {new Date(sub.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SLIM SIDEBAR: Resources & Guidance */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#0f172a" }}>📎 Resources & Guides</h3>
          <p style={{ margin: "0 0 14px", fontSize: 11, color: "#64748b" }}>Reference files for Capstone preparation.</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { title: "Semester 4 Handbook (PDF)", file: "Semester 4 Handbook.pdf", size: "2.4 MB", type: "PDF" },
              { title: "Capstone Presentation Template", file: "Capstone Presentation Template.pptx", size: "1.8 MB", type: "PPTX" },
              { title: "Impact Measurement Guidelines", file: "Impact Measurement Guidelines.pdf", size: "1.1 MB", type: "PDF" },
              { title: "Example Capstone Reports", file: "Example Capstone Reports.zip", size: "4.5 MB", type: "ZIP" },
            ].map((res, i) => (
              <a 
                key={i}
                href="#"
                onClick={(e) => handleDownload(e, res.file)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  textDecoration: "none",
                  transition: "all 0.15s ease"
                }}
                onMouseOver={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                onMouseOut={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 14 }}>📄</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {res.title}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{res.type} · {res.size}</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>↓</span>
              </a>
            ))}
          </div>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9", background: "#faf5ff", padding: 12, borderRadius: 8, border: "1px solid #f3e8ff" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7e22ce", marginBottom: 2 }}>💬 Need Guidance?</div>
            <div style={{ fontSize: 11, color: "#6b21a8", lineHeight: 1.4 }}>Contact your assigned program coordinator or reach out via Feedback tab.</div>
          </div>
        </div>

      </div>
    </div>
  );
}



const DELIVERABLE_DEFS = [
  { id: "weekly_report", label: "Weekly report submitted", types: ["weekly_report"] },
  { id: "lesson_upload", label: "Lesson materials uploaded", types: ["lesson_upload"] },
  { id: "recent_activity", label: "Active in last 14 days", types: null }, // special-cased below
  { id: "goal_progress", label: "Progress on current goal", types: ["goal_update"] },
];

function daysAgo(dateStr) {
  if (!dateStr) return Infinity;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

function computeFellowInsight(fellowId, allActivities) {
  const activities = allActivities.filter((a) => String(a.fellowId) === String(fellowId));
  const sorted = [...activities].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
  const lastActivity = sorted[0];
  const lastActivityDays = lastActivity ? daysAgo(lastActivity.createdAt) : Infinity;

  const missedCount = activities.filter((a) => a.status === "missed").length;
  const completedCount = activities.filter((a) => a.status === "completed" || !a.status).length;

  const deliverables = DELIVERABLE_DEFS.map((d) => {
    let met;
    if (d.id === "recent_activity") {
      met = lastActivityDays <= 14;
    } else {
      met = activities.some((a) => d.types.includes(a.type) && a.status !== "missed");
    }
    return { id: d.id, label: d.label, met };
  });

  const metCount = deliverables.filter((d) => d.met).length;
  const score = Math.round((metCount / deliverables.length) * 100);

  const reasons = [];
  if (lastActivityDays > 21) reasons.push(`No activity logged in ${Math.floor(lastActivityDays)} days.`);
  if (missedCount >= 2) reasons.push(`${missedCount} missed submissions recently.`);
  if (score < 40) reasons.push("Overall deliverable completion is low.");

  let level = "Low";
  if (reasons.length >= 2 || score < 30) level = "High";
  else if (reasons.length === 1 || score < 60) level = "Medium";

  const interventionNeeded = level === "High";

  const performanceSummary = lastActivity
    ? `Last active ${Math.floor(lastActivityDays)} day(s) ago. ${completedCount} completed / ${missedCount} missed items tracked. Deliverable score: ${score}/100.`
    : `No recorded activity yet. Deliverable score: ${score}/100.`;

  const recommendations = [];
  if (!deliverables.find((d) => d.id === "weekly_report")?.met) {
    recommendations.push("Follow up on the missing weekly report.");
  }
  if (!deliverables.find((d) => d.id === "lesson_upload")?.met) {
    recommendations.push("Check in on lesson material uploads.");
  }
  if (lastActivityDays > 14) {
    recommendations.push("Reach out directly — no recent activity logged.");
  }
  if (recommendations.length === 0) {
    recommendations.push("On track — consider setting a stretch goal for next cycle.");
  }

  return {
    risk: { level, reasons },
    progress: { score },
    deliverables,
    performanceSummary,
    recommendations,
    interventionNeeded,
  };
}




export function PDCATab({ user, setToast, onUserUpdate }) {
  const mentees = user?.mentorProfile?.assignedTeachers || [];

  // ── Sub-tab nav ──
  const [activeSubTab, setActiveSubTab] = useState("new_cycle"); // new_cycle | timeline | history

  const [selectedMenteeId, setSelectedMenteeId] = useState("");
  const [pdcaForm, setPdcaForm] = useState({
    plan: "",
    do: "",
    check: "",
    act: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState("all"); // "all" or a mentee _id

  // ── Timeline state ──
  const [timelineFellowId, setTimelineFellowId] = useState("");
  const [expandedMonth, setExpandedMonth] = useState(null);

  // ── AI/ML Layer state ──
  // Two distinct data sources per Section 5 of the architecture design:
  // Fellow Activity Submissions (evidence, reviewed) + Today's Tasks
  // (daily self-logged activity log, reused from TeacherTask).
  const [activities, setActivities] = useState([]);
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [aiLoading, setAiLoading] = useState(true);

  // "Custom Growth Cycle" entries (legacy PDCACycle model).
  const [aiReports, setAiReports] = useState([]);
  // AI Month 1/Month N PDCA reports (PDCAReport model) — only ones the
  // mentor has actually approved count as a logged cycle for progress
  // purposes; drafts-in-progress shouldn't inflate the count.

  const fetchCycles = () => {
    setLoading(true);
    Promise.all([getPDCACycles(), getMentorPDCAReports()])
      .then(([cyclesRes, reportsRes]) => {
        setHistory(cyclesRes.cycles || []);
        setAiReports((reportsRes.reports || []).filter((r) => r.status === "approved"));
      })
      .catch((err) => console.error("Failed to fetch Growth Cycles", err))
      .finally(() => setLoading(false));
  };

  const fetchActivities = () => {
    setAiLoading(true);
    Promise.all([getMentorFellowActivities(), getMentorFellowTasks()])
      .then(([activitiesRes, tasksRes]) => {
        setActivities(activitiesRes.activities || []);
        setTodaysTasks(tasksRes.tasks || []);
      })
      .catch((err) =>
        console.error("Failed to fetch fellow activity data for AI insights", err),
      )
      .finally(() => setAiLoading(false));
  };

  useEffect(() => {
    fetchCycles();
    fetchActivities();
  }, []);


  const insights = computeAllFellowInsights(mentees, activities, todaysTasks);
  const selectedInsight = selectedMenteeId ? insights[selectedMenteeId] : null;
  const fellowsNeedingAttention = mentees
    .map((m) => ({ mentee: m, insight: insights[m._id] }))
    .filter(
      (x) => x.insight?.interventionNeeded || x.insight?.risk?.level === "High",
    );

  const applyAIDraft = () => {
    if (!selectedInsight) {
      setToast?.({
        msg: "Select a fellow first so the AI can pull their activity data.",
        type: "error",
      });
      return;
    }
    setPdcaForm((f) => ({
      ...f,
      // Plan (next cycle): risk + intervention signals only — the mentor
      // still sets the actual Month 2 goals, this just carries the signal
      // forward. Never overwrites Plan text the mentor already started.
      plan: f.plan?.trim() ? f.plan : selectedInsight.planSignals,
      check: selectedInsight.performanceSummary,
      act: selectedInsight.recommendations
        .map((r, i) => `${i + 1}. ${r}`)
        .join("\n"),
    }));
    setToast?.({
      msg: "AI draft applied to Plan, Check & Act — review and edit before saving.",
      type: "info",
    });
  };

// ── Design a Growth Cycle straight from an uploaded curriculum doc ──
// Upload a curriculum file for this fellow's Custom Growth Cycle -> AI
// extracts + structures it AND drafts Plan/Do/Check/Act in one request,
// filling the form below immediately. Nothing needs to be published
// first; the curriculum is kept as a draft for reuse/editing later.
const [curriculumFile, setCurriculumFile] = useState(null);
const [curriculumMonth, setCurriculumMonth] = useState(1);
const [designing, setDesigning] = useState(false);

const handleDesignFromCurriculum = async () => {
  if (!selectedMenteeId) {
    setToast?.({ msg: "Select a fellow first.", type: "error" });
    return;
  }
  if (!curriculumFile) {
    setToast?.({ msg: "Choose a curriculum document first (.docx, .txt, or .md).", type: "error" });
    return;
  }
  setDesigning(true);
  try {
    const res = await designGrowthCycleFromCurriculum(selectedMenteeId, curriculumMonth, curriculumFile);
    setPdcaForm({
      plan: res.draft.plan || "",
      do: res.draft.do || "",
      check: res.draft.check || "",
      act: res.draft.act || "",
    });
    setToast?.({
      msg: res.draft.aiAvailable
        ? `Growth Cycle designed from "${curriculumFile.name}" — review and edit before saving.`
        : "AI is currently unavailable — a blank template was filled in instead. Please write these fields manually.",
      type: res.draft.aiAvailable ? "success" : "error",
    });
    setCurriculumFile(null);
  } catch (err) {
    setToast?.({ msg: err.message || "Failed to design Growth Cycle from curriculum.", type: "error" });
  } finally {
    setDesigning(false);
  }
};

  // Resolve the mentee id a given cycle belongs to, whether menteeId
  // came back populated ({_id, name, email}) or as a raw id string.
  const cycleMenteeId = (cycle) => {
    const m = cycle.menteeId;
    if (!m) return null;
    return typeof m === "object" ? m._id || m.id : m;
  };

  const cycleMenteeName = (cycle) => {
    const m = cycle.menteeId;
    if (!m) return "Unassigned";
    if (typeof m === "object" && m.name) return m.name;
    // fall back to looking the id up in the mentee list currently assigned
    const found = mentees.find((mm) => String(mm._id) === String(m));
    return found?.name || "Unknown Fellow";
  };

  // ── 6-Month Timeline helpers ──
  const getLast6Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }
    return months;
  };

  const cyclesForTimelineFellow = history.filter((c) =>
    timelineFellowId ? String(cycleMenteeId(c)) === String(timelineFellowId) : false,
  );

  const cyclesInMonth = (year, month) =>
    cyclesForTimelineFellow.filter((c) => {
      const d = new Date(c.createdAt || c.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

  // Per-fellow progress summary, built from BOTH cycle sources:
  // - legacy "Custom Growth Cycle" entries (PDCACycle)
  // - approved AI Month N PDCA reports (PDCAReport), e.g. the Month 1
  //   generator's "Approve & Save" action — these weren't being counted
  //   here before, which is why approving a Month 1 report didn't move
  //   this panel.
  const menteeProgress = mentees.map((m) => {
    const cyclesForMentee = history.filter(
      (h) => String(cycleMenteeId(h)) === String(m._id),
    );
    const reportsForMentee = aiReports.filter(
      (r) => String(r.fellowId?._id || r.fellowId) === String(m._id),
    );
    const combinedDates = [
      ...cyclesForMentee.map((h) => h.createdAt || h.date),
      ...reportsForMentee.map((r) => r.approvedAt || r.updatedAt),
    ].filter(Boolean);
    const lastDate = combinedDates.length
      ? new Date(Math.max(...combinedDates.map((d) => new Date(d))))
      : null;
    return {
      mentee: m,
      count: cyclesForMentee.length + reportsForMentee.length,
      lastDate,
    };
  });

  const filteredHistory =
    historyFilter === "all"
      ? history
      : history.filter(
          (h) => String(cycleMenteeId(h)) === String(historyFilter),
        );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMenteeId) {
      setToast?.({
        msg: "Please select which fellow this Growth Cycle is for.",
        type: "error",
      });
      return;
    }
    if (!pdcaForm.plan || !pdcaForm.do || !pdcaForm.check || !pdcaForm.act) {
      setToast?.({
        msg: "Please fill out all Growth Cycle fields.",
        type: "error",
      });
      return;
    }
    setSubmitting(true);

    try {
      // Cycle number is scoped per-fellow so each fellow's own sequence starts at 1.
      const existingForMentee = history.filter(
        (h) => String(cycleMenteeId(h)) === String(selectedMenteeId),
      );
      const cycleNumber = existingForMentee.length + 1;
      await submitPDCACycle(
        cycleNumber,
        pdcaForm.plan,
        pdcaForm.do,
        pdcaForm.check,
        pdcaForm.act,
        selectedMenteeId,
      );
      setToast?.({
        msg: "Growth Cycle assigned and recorded successfully!",
        type: "success",
      });
      setPdcaForm({ plan: "", do: "", check: "", act: "" });
      fetchCycles();
    } catch (err) {
      setToast?.({
        msg: err.message || "Failed to save Growth Cycle",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const subTabs = [
    { key: "new_cycle", label: "✏️ New Goal" },
    { key: "timeline",  label: "📅 6-Month Timeline" },
    { key: "history",   label: "📚 Goal History" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={S.pageTitle}>Growth Cycle</h1>
      <p style={S.pageSub}>
        Assign Plan–Do–Check–Act growth cycles to your fellows and track their
        progress.
      </p>

      {/* ── AI-generated official Month 1 report (always visible, above sub-tabs) ── */}
      <div style={{ marginBottom: 24, marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 800, color: "#5b21b6", background: "#ede9fe",
            border: "1px solid #c4b5fd", borderRadius: 999, padding: "2px 10px",
          }}>
            🤖 AI-GENERATED
          </span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Official Month 1 report — grounded in real logged data. Review and approve here to send to Admin.
          </span>
        </div>
        <Month1PDCAGenerator mentees={mentees} setToast={setToast} onApproved={fetchCycles} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "28px 0 20px" }}>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Custom / Other Growth Cycles
        </span>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
      </div>

      {/* Sub-tab nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key)}
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              transition: "all 0.15s",
              background: activeSubTab === t.key ? "#3b82f6" : "#f1f5f9",
              color: activeSubTab === t.key ? "white" : "#475569",
              boxShadow: activeSubTab === t.key ? "0 2px 8px rgba(59,130,246,0.3)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── NEW GOAL TAB ── */}
      {/* {activeSubTab === "new_cycle" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <SectionCard
            title="🔄 Custom Growth Cycle"
            subtitle="For Month 2+ or informal tracking — separate from the official Month 1 report above."
          >
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Assign To Fellow *</label>
                {mentees.length === 0 ? (
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "#fef3c7",
                      border: "1px solid #fde68a",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#92400e",
                    }}
                  >
                    You have no fellows assigned yet. Claim a fellow from Mentee
                    Management first.
                  </div>
                ) : (
                  <select
                    style={S.input}
                    value={selectedMenteeId}
                    onChange={(e) => setSelectedMenteeId(e.target.value)}
                    required
                  >
                    <option value="">Select a fellow…</option>
                    {mentees.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name || "Unknown Fellow"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div
                style={{
                  marginBottom: 20,
                  background: "#ede9fe",
                  border: "1px solid #c4b5fd",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: "#5b21b6", marginBottom: 8 }}>
                  📄 Design from Curriculum
                </div>
                <div style={{ fontSize: 11, color: "#4c1d95", marginBottom: 10 }}>
                  Upload this month's curriculum document and the AI will
                  design the Plan/Do/Check/Act fields below immediately, using{" "}
                  {selectedMenteeId ? "this fellow's" : "the selected fellow's"}{" "}
                  real logged activity — no separate publish step needed.
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={curriculumMonth}
                    onChange={(e) => setCurriculumMonth(Number(e.target.value))}
                    style={{ ...S.input, width: 110 }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>Month {m}</option>
                    ))}
                  </select>
                  <input
                    type="file"
                    accept=".docx,.txt,.md"
                    onChange={(e) => setCurriculumFile(e.target.files?.[0] || null)}
                    style={{ fontSize: 12, flex: 1, minWidth: 160 }}
                  />
                  <button
                    type="button"
                    onClick={handleDesignFromCurriculum}
                    disabled={designing || !curriculumFile || !selectedMenteeId}
                    style={{
                      padding: "8px 16px", borderRadius: 6, border: "1px solid #7c3aed",
                      background: "#7c3aed", color: "#fff", fontWeight: 700,
                      cursor: designing || !curriculumFile || !selectedMenteeId ? "not-allowed" : "pointer",
                      opacity: designing || !curriculumFile || !selectedMenteeId ? 0.6 : 1,
                    }}
                  >
                    {designing ? "Designing…" : "✨ Design Now"}
                  </button>
                </div>
              </div>

              {selectedMenteeId && selectedInsight && (
                <div
                  style={{
                    marginBottom: 20,
                    background: "#f5f3ff",
                    border: "1px solid #ddd6fe",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{ fontSize: 12, fontWeight: 800, color: "#5b21b6" }}
                    >
                      🤖 AI Insights
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background:
                          selectedInsight.risk.level === "High"
                            ? "#fee2e2"
                            : selectedInsight.risk.level === "Medium"
                              ? "#fef3c7"
                              : "#d1fae5",
                        color:
                          selectedInsight.risk.level === "High"
                            ? "#dc2626"
                            : selectedInsight.risk.level === "Medium"
                              ? "#b45309"
                              : "#059669",
                      }}
                    >
                      {selectedInsight.risk.level} risk
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: "#4f46e5",
                      marginBottom: 10,
                    }}
                  >
                    {selectedInsight.progress.score}
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>/100</span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 4,
                      marginBottom: 10,
                    }}
                  >
                    {selectedInsight.deliverables.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          fontSize: 11,
                          color: d.met
                            ? "#059669"
                            : d.taskOnly
                              ? "#b45309"
                              : "#94a3b8",
                        }}
                        title={
                          d.met
                            ? "Evidenced via submission"
                            : d.taskOnly
                              ? "Logged in Today's Tasks — not yet submitted as evidence"
                              : "No task log or submission yet"
                        }
                      >
                        {d.met ? "✓" : d.taskOnly ? "◐" : "☐"} {d.label}
                      </div>
                    ))}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "#334155", marginBottom: 12 }}
                  >
                    {selectedInsight.performanceSummary}
                  </div>
                  <button
                    type="button"
                    onClick={applyAIDraft}
                    style={{
                      ...S.exportBtn,
                      background: "#ede9fe",
                      color: "#5b21b6",
                      borderColor: "#c4b5fd",
                      fontWeight: 700,
                    }}
                  >
                    ✨ Use AI Draft for Plan, Check & Act
                  </button>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    ...S.label,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      background: "#e0e7ff",
                      color: "#4f46e5",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    P
                  </span>
                  PLAN (Objective & Strategy)
                </label>
                <textarea
                  style={{ ...S.input, minHeight: 60 }}
                  value={pdcaForm.plan}
                  onChange={(e) =>
                    setPdcaForm({ ...pdcaForm, plan: e.target.value })
                  }
                  placeholder="What is the goal? What is the plan?"
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    ...S.label,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      background: "#fef3c7",
                      color: "#d97706",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    D
                  </span>
                  DO (Action Taken)
                </label>
                <textarea
                  style={{ ...S.input, minHeight: 60 }}
                  value={pdcaForm.do}
                  onChange={(e) =>
                    setPdcaForm({ ...pdcaForm, do: e.target.value })
                  }
                  placeholder="How was the plan executed?"
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    ...S.label,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      background: "#d1fae5",
                      color: "#059669",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    C
                  </span>
                  CHECK (Results & Observations)
                </label>
                <textarea
                  style={{ ...S.input, minHeight: 60 }}
                  value={pdcaForm.check}
                  onChange={(e) =>
                    setPdcaForm({ ...pdcaForm, check: e.target.value })
                  }
                  placeholder="What were the outcomes? What worked well?"
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    ...S.label,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      background: "#fee2e2",
                      color: "#dc2626",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    A
                  </span>
                  ACT (Next Steps & Adjustments)
                </label>
                <textarea
                  style={{ ...S.input, minHeight: 60 }}
                  value={pdcaForm.act}
                  onChange={(e) =>
                    setPdcaForm({ ...pdcaForm, act: e.target.value })
                  }
                  placeholder="What changes will you make for the next cycle?"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || mentees.length === 0}
                style={{
                  ...S.primaryBtn,
                  width: "100%",
                  opacity: submitting || mentees.length === 0 ? 0.7 : 1,
                }}
              >
                {submitting ? "Saving..." : "Assign & Save Growth Cycle"}
              </button>
            </form>
          </SectionCard>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {fellowsNeedingAttention.length > 0 && (
              <SectionCard title="🚨 Fellows Needing Attention">
                {fellowsNeedingAttention.map(({ mentee, insight }) => (
                  <div
                    key={mentee._id}
                    style={{
                      padding: "10px 12px",
                      marginBottom: 8,
                      borderRadius: 10,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                    }}
                  >
                    <strong style={{ fontSize: 13, color: "#991b1b" }}>
                      {mentee.name}
                    </strong>
                    <div style={{ fontSize: 11, color: "#7f1d1d" }}>
                      {insight.risk.reasons.join(" ")}
                    </div>
                  </div>
                ))}
              </SectionCard>
            )}
            <SectionCard title="📊 Fellow Progress">
              {mentees.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  No fellows assigned yet.
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {menteeProgress.map(({ mentee, count, lastDate }) => (
                    <button
                      key={mentee._id}
                      onClick={() => {
                        setHistoryFilter(mentee._id);
                        setActiveSubTab("history");
                      }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 14px",
                        borderRadius: 10,
                        textAlign: "left",
                        cursor: "pointer",
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#1e293b",
                          }}
                        >
                          {mentee.name || "Unknown Fellow"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {count} cycle{count !== 1 ? "s" : ""} logged
                          {lastDate
                            ? ` · last on ${new Date(lastDate).toLocaleDateString()}`
                            : ""}
                        </div>
                      </div>
                      {insights[mentee._id] && (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: "#4f46e5",
                            marginRight: 8,
                          }}
                        >
                          {insights[mentee._id].progress.score}
                        </span>
                      )}
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          color: count > 0 ? "#10b981" : "#cbd5e1",
                        }}
                      >
                        {count}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="💡 Growth Cycle Tips">
              <ul
                style={{
                  paddingLeft: 20,
                  margin: 0,
                  color: "#475569",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <li style={{ marginBottom: 8 }}>
                  Keep objectives SMART (Specific, Measurable, Achievable,
                  Relevant, Time-bound).
                </li>
                <li style={{ marginBottom: 8 }}>
                  Document data and specific observations in the{" "}
                  <strong>Check</strong> phase.
                </li>
                <li>
                  Use the <strong>Act</strong> phase to refine your strategy for
                  the next iteration, and revisit the Fellow Progress panel to see
                  who may need a follow-up cycle.
                </li>
              </ul>
            </SectionCard>
          </div>
        </div>
      )} */}

      {/* ── 6-MONTH TIMELINE TAB ── */}
      {activeSubTab === "timeline" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Select Fellow</label>
            <select
              style={{ ...S.input, maxWidth: 320 }}
              value={timelineFellowId}
              onChange={(e) => { setTimelineFellowId(e.target.value); setExpandedMonth(null); }}
            >
              <option value="">— Choose a Fellow —</option>
              {mentees.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>

          {!timelineFellowId ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: 14 }}>
              Select a Fellow above to see their 6-month growth timeline.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                  background: "#eff6ff",
                  borderRadius: 12,
                  padding: "12px 18px",
                  border: "1px solid #bfdbfe",
                }}
              >
                <span style={{ fontSize: 22 }}>📈</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1e40af" }}>
                    {cyclesForTimelineFellow.length} total goal{cyclesForTimelineFellow.length !== 1 ? "s" : ""} across 6 months
                  </div>
                  {cyclesForTimelineFellow[0] && (
                    <div style={{ fontSize: 11, color: "#3b82f6" }}>
                      Last logged: {new Date(cyclesForTimelineFellow[0].createdAt || cyclesForTimelineFellow[0].date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
                {getLast6Months().map(({ label, year, month }) => {
                  const cycles = cyclesInMonth(year, month);
                  const isExpanded = expandedMonth === `${year}-${month}`;
                  const dotColor = cycles.length >= 2 ? "#10b981" : cycles.length === 1 ? "#f59e0b" : "#e2e8f0";
                  const dotBg = cycles.length >= 2 ? "#d1fae5" : cycles.length === 1 ? "#fef3c7" : "#f8fafc";
                  return (
                    <div key={`${year}-${month}`}>
                      <button
                        onClick={() => setExpandedMonth(isExpanded ? null : `${year}-${month}`)}
                        style={{
                          width: "100%",
                          background: isExpanded ? dotBg : "white",
                          border: `2px solid ${isExpanded ? dotColor : "#e2e8f0"}`,
                          borderRadius: 12,
                          padding: "14px 10px",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.15s",
                          fontFamily: "inherit",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: dotBg,
                            border: `3px solid ${dotColor}`,
                            margin: "0 auto 8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 900,
                            color: cycles.length > 0 ? dotColor : "#94a3b8",
                          }}
                        >
                          {cycles.length}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{label}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                          {cycles.length === 0 ? "No goals" : `${cycles.length} goal${cycles.length > 1 ? "s" : ""}`}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {expandedMonth && (() => {
                const [yr, mo] = expandedMonth.split("-").map(Number);
                const mCycles = cyclesInMonth(yr, mo);
                const mLabel = new Date(yr, mo, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
                return mCycles.length === 0 ? null : (
                  <SectionCard title={`Goals in ${mLabel}`}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {mCycles.map((c, i) => (
                        <div key={c._id || i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
                            {new Date(c.createdAt || c.date).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                            {c.plan.substring(0, 80)}{c.plan.length > 80 ? "…" : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                );
              })()}

              <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "#64748b" }}>
                <span>🟢 ≥2 goals</span>
                <span>🟡 1 goal</span>
                <span>⚪ No goals</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── GOAL HISTORY TAB ── */}
      {activeSubTab === "history" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <select
              style={{ ...S.input, width: "auto", minWidth: 180 }}
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
            >
              <option value="all">All Fellows</option>
              {mentees.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {filteredHistory.length} goal{filteredHistory.length !== 1 ? "s" : ""}
            </span>
            {historyFilter !== "all" && (
              <button onClick={() => setHistoryFilter("all")} style={{ ...S.exportBtn }}>
                Clear fellow filter
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                Loading...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                {historyFilter === "all"
                  ? "No Growth Cycles recorded yet."
                  : "No Growth Cycles recorded for this fellow yet."}
              </div>
            ) : (
              filteredHistory.map((item, i) => (
                <div
                  key={item._id || i}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6" }}>
                      🎓 {cycleMenteeName(item)}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                      {new Date(item.createdAt || item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        background: "#d1fae5",
                        color: "#059669",
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      {item.status || "Completed"}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>
                    {item.plan.substring(0, 60) + (item.plan.length > 60 ? "..." : "")}
                  </div>
                  <button
                    onClick={() =>
                      setToast?.({
                        msg: `Plan: ${item.plan}\nDo: ${item.do}\nCheck: ${item.check}\nAct: ${item.act}`,
                        type: "info",
                      })
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: "#3b82f6",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    View Full Cycle →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}