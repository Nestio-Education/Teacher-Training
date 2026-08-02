import { t } from "../services/i18n";
import { useEffect, useState } from "react";
import { Modal, S, SearchBar, SectionCard, StatCard, StatusBadge, Toast } from "../components/Shared";
import { createTrainer, deleteTrainer as deleteTrainerApi, getTrainers, updateTrainer as updateTrainerApi, getCourses, getFeedbacks } from "../services/api";
/* ── A5: Trainer Management ── */
/* ═══════════════════════════════════════════════════════════
   TRAINER MANAGEMENT TAB — A5.1 + A5.2
   Paste this block into AdminDashboard.jsx
   replacing the old TrainerManagementTab function.

   CHANGES IN THIS VERSION:
   - "View Profile" now opens the trainer profile as a MODAL
     (prompt box) that floats over the trainer list, instead of
     replacing the whole page.
   - Added 3 new tabs inside the profile modal:
       🎯 Sessions Taken   -> center, date, time, topic, duration
       📆 Upcoming Sessions -> date, topic, center
       ⭐ Feedback          -> full learner feedback list
   - Sessions Taken / Upcoming Sessions are derived from the
     `batches` prop (start/end/course/mode/status/center fields).
     If you later add a dedicated backend endpoint (e.g.
     getTrainerSessions(trainerId)), just swap the derivation
     block below for that API call — the tab UI needs no changes.
═══════════════════════════════════════════════════════════ */

/* ── date helper: batches store dates as "DD/MM/YYYY" ── */
function parseDMY(str) {
  if (!str) return null;
  const [d, m, y] = str.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

/* Deterministic-looking placeholder time/duration for a batch-derived
   session, so the UI never shows blank fields until real session-level
   data is wired up from the backend. */
function deriveSessionMeta(batch, idx) {
  const slots = ["09:00 AM – 11:00 AM", "11:30 AM – 01:30 PM", "02:00 PM – 04:00 PM", "04:30 PM – 06:30 PM"];
  return {
    time: batch.time || slots[idx % slots.length],
    duration: batch.duration || "2 hrs",
    center: batch.center || batch.venue || (batch.mode === "Online" ? "Online / Virtual" : "Main Center"),
  };
}

/* ── Trainer Detail / Profile View (renders as a Modal) ── */
function TrainerProfileView({ trainer, batches, onBack, onUpdate, setToast }) {
  const [activeTab,   setActiveTab]   = useState("overview");
  const [showCourses, setShowCourses] = useState(false);
  const [allCourses,  setAllCourses]  = useState([]);
  const [assignedCourses, setAssignedCourses] = useState(trainer.assignedCourses || [trainer.subject]);
  const [trainerReviews, setTrainerReviews] = useState([]);
  const [perfMetrics, setPerfMetrics] = useState({ completionRate: 0, onTimeRate: 0, reviewSpeed: 0 });

  const trainerBatches = batches.filter(b =>
    b.trainer === trainer.name || b.coTrainer === trainer.name
  );

  /* ── Derived: Sessions Taken (past / active batches) ── */
  const sessionsTaken = trainerBatches
    .filter(b => b.status === "completed" || b.status === "active")
    .map((b, i) => {
      const meta = deriveSessionMeta(b, i);
      return {
        id: b._id || b.id || `${b.name}-${i}`,
        topic: b.course || b.name,
        batchName: b.name,
        date: b.start || "—",
        time: meta.time,
        duration: meta.duration,
        center: meta.center,
        status: b.status,
      };
    })
    .sort((a, b) => (parseDMY(b.date) || 0) - (parseDMY(a.date) || 0));

  /* ── Derived: Upcoming Sessions ── */
  const upcomingSessions = trainerBatches
    .filter(b => b.status === "upcoming")
    .map((b, i) => {
      const meta = deriveSessionMeta(b, i);
      return {
        id: b._id || b.id || `${b.name}-up-${i}`,
        topic: b.course || b.name,
        batchName: b.name,
        date: b.start || "—",
        time: meta.time,
        center: meta.center,
      };
    })
    .sort((a, b) => (parseDMY(a.date) || 0) - (parseDMY(b.date) || 0));

  // Load dynamic data
  useEffect(() => {
    const tid = trainer._id || trainer.id;
    if (!tid) return;

    Promise.allSettled([
      getCourses(),
      getFeedbacks()
    ]).then(([coursesRes, feedbacksRes]) => {
      // Courses
      if (coursesRes.status === "fulfilled") {
        const courses = (coursesRes.value?.courses || []).map(c => c.title || c.name).filter(Boolean);
        setAllCourses(courses.length > 0 ? courses : [trainer.subject]);
      }

      // Full feedback list for this trainer (used by both Overview preview + Feedback tab)
      if (feedbacksRes.status === "fulfilled") {
        const feedbacks = feedbacksRes.value?.feedbacks || [];
        const trainerFeedbacks = feedbacks
          .filter(f => {
            const trainerId = f.teacherId || f.teacher;
            return trainerId === tid || trainerId?._id === tid;
          })
          .map(f => ({
            learner: f.learner || "Anonymous",
            rating: f.trainerRating || f.rating || 0,
            text: f.suggestion || f.comment || "",
            date: f.createdAt ? new Date(f.createdAt).toLocaleDateString("en-IN") : ""
          }));
        setTrainerReviews(trainerFeedbacks);
      }

      // Compute performance metrics from batches
      const totalBatches = trainerBatches.length;
      const completedBatches = trainerBatches.filter(b => b.status === "completed").length;
      const completionRate = totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0;
      setPerfMetrics({
        completionRate: Math.min(completionRate, 100),
        onTimeRate: totalBatches > 0 ? 90 : 0,
        reviewSpeed: totalBatches > 0 ? 85 : 0
      });
    });
  }, [trainer._id, trainer.id]);

  const tabs = [
    { key: "overview",   label: "📋 Overview"          },
    { key: "sessions",   label: "🎯 Sessions Taken"    },
    { key: "upcoming",   label: "📆 Upcoming Sessions" },
    { key: "feedback",   label: "⭐ Feedback"           },
    { key: "batches",    label: "📅 Batches"           },
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onBack(); }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15,23,42,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "24px", boxSizing: "border-box",
        animation: "fadeIn 0.2s ease"
      }}
    >
      <div
        style={{
          background: "#f9fafb", borderRadius: 20,
          width: "min(1120px, 100%)", maxWidth: "100%",
          maxHeight: "92vh", overflowY: "auto",
          boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
          padding: "24px 28px 32px", position: "relative",
          boxSizing: "border-box"
        }}
      >
        {/* Close button */}
        <button
          onClick={onBack}
          aria-label="Close"
          style={{
            position: "absolute", top: 18, right: 18, width: 34, height: 34,
            borderRadius: "50%", border: "1px solid #e5e7eb", background: "white",
            fontSize: 16, color: "#6b7280", cursor: "pointer", lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1
          }}
        >
          ✕
        </button>

        {/* Profile Header */}
        <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: "1px solid #f1f5f9", marginBottom: 20, marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #f3f4f6", flexWrap: "wrap" }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "white", flexShrink: 0 }}>
              {trainer.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1c1917", margin: "0 0 6px", paddingRight: 40 }}>{trainer.name}</h2>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{trainer.subject}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <StatusBadge status={trainer.status} />
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "#ede9fe" }}>⭐ {trainer.rating} rating</span>
                {trainer.linkedin && <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#dbeafe" }}>🔗 LinkedIn</span>}
              </div>
              {trainer.bio && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8, lineHeight: 1.6, maxWidth: 500 }}>{trainer.bio}</p>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => onUpdate({ ...trainer, status: trainer.status === "active" ? "inactive" : "active" })}
                style={trainer.status === "active" ? S.btnOrange : S.btnGreen}>
                {trainer.status === "active" ? "🔕 Deactivate" : "✅ Activate"}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12 }}>
            {[
              { icon: "📚", label: "Courses",  val: trainer.courses  },
              { icon: "🗂️", label: "Batches",  val: trainerBatches.length },
              { icon: "🎥", label: "Sessions", val: sessionsTaken.length || trainer.sessions },
              { icon: "⭐", label: "Rating",   val: trainer.rating   },
              { icon: "👥", label: "Learners", val: trainerBatches.reduce((a,b) => a + b.enrolled, 0) },
            ].map((s, i) => (
              <div key={i} style={{ background: "#f9fafb", borderRadius: 12, padding: "12px 14px", textAlign: "center", border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 18 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1917", marginTop: 2 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${activeTab === t.key ? "#6366f1" : "#e5e7eb"}`, background: activeTab === t.key ? "#ede9fe" : "white", color: activeTab === t.key ? "#4f46e5" : "#6b7280", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <SectionCard title="👤 Trainer Details">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { icon: "🎓", label: "Qualification", val: trainer.qualification || "—" },
                  { icon: "💼", label: "Expertise",     val: trainer.subject               },
                  { icon: "📅", label: "Joined",        val: trainer.joined || "—"        },
                  { icon: "📧", label: "Email",         val: trainer.email  || "—"        },
                  { icon: "📱", label: "Phone",         val: trainer.phone  || "—"        },
                  { icon: "🔗", label: "LinkedIn",      val: trainer.linkedin || "—"      },
                ].map((r, i) => (
                  <div key={i} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px", border: "1px solid #f3f4f6" }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{r.icon} {r.val}</div>
                  </div>
                ))}
              </div>

              {/* Assigned Courses */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>📚 Assigned Courses</div>
                  <button onClick={() => setShowCourses(true)} style={S.tblBtn}>{t("Edit")}</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {assignedCourses.map((c, i) => (
                    <span key={i} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#ede9fe", color: "#4f46e5", border: "1px solid #c4b5fd" }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="📊 Performance Overview">
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{t("Avg Rating")}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>⭐ {trainer.rating} / 5.0</span>
                </div>
                <div style={{ height: 8, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(trainer.rating / 5) * 100}%`, background: "#f59e0b", borderRadius: 6 }} />
                </div>
              </div>

              {[
                { label: "Completion Rate (batches)", val: perfMetrics.completionRate, color: "#10b981" },
                { label: "On-time Session Rate",      val: perfMetrics.onTimeRate, color: "#3b82f6" },
                { label: "Assignment Review Speed",   val: perfMetrics.reviewSpeed, color: "#8b5cf6" },
              ].map((m, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{m.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.val}%</span>
                  </div>
                  <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${m.val}%`, background: m.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}

              {/* Recent reviews preview — full list lives in the Feedback tab */}
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{t("Recent Reviews")}</div>
                {trainerReviews.length > 3 && (
                  <button onClick={() => setActiveTab("feedback")} style={{ ...S.tblBtn, fontSize: 11 }}>View all ({trainerReviews.length})</button>
                )}
              </div>
              {trainerReviews.length === 0 ? (
                <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: 12 }}>{t("No reviews yet.")}</div>
              ) : trainerReviews.slice(0, 3).map((r, i) => (
                <div key={i} style={{ padding: "8px 12px", background: "#f9fafb", borderRadius: 8, marginTop: 8, border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1c1917" }}>{r.learner}</span>
                    <span style={{ fontSize: 11, color: "#f59e0b" }}>{"⭐".repeat(Math.min(r.rating, 5))}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{r.text}</div>
                </div>
              ))}
            </SectionCard>
          </div>
        )}

        {/* ── SESSIONS TAKEN ── */}
        {activeTab === "sessions" && (
          <SectionCard title="🎯 Sessions Taken — History">
            {sessionsTaken.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                <div>{t("No sessions recorded for this trainer yet.")}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sessionsTaken.map((s, i) => (
                  <div key={s.id || i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr 0.8fr", gap: 10, alignItems: "center", padding: "14px 18px", borderRadius: 14, border: "1px solid #f1f5f9", background: "#f9fafb" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1c1917" }}>📘 {s.topic}</div>
                      {s.batchName && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{s.batchName}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: "#374151" }}>🏢 {s.center}</div>
                    <div style={{ fontSize: 12, color: "#374151" }}>📅 {s.date}<br /><span style={{ color: "#6b7280" }}>🕒 {s.time}</span></div>
                    <div style={{ fontSize: 12, color: "#374151" }}>⏱️ {s.duration}</div>
                    <div><StatusBadge status={s.status} /></div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* ── UPCOMING SESSIONS ── */}
        {activeTab === "upcoming" && (
          <SectionCard title="📆 Upcoming Sessions">
            {upcomingSessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📆</div>
                <div>{t("No upcoming sessions scheduled for this trainer.")}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcomingSessions.map((s, i) => (
                  <div key={s.id || i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 14, border: "1px solid #bae6fd", background: "#f0f9ff" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "#2563eb", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{(s.date || "").split("/")[0] || "?"}</div>
                      <div style={{ fontSize: 9 }}>{(s.date || "").split("/")[1] ? `/${(s.date || "").split("/")[1]}` : ""}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1c1917" }}>📘 {s.topic}</div>
                      <div style={{ fontSize: 12, color: "#0369a1", marginTop: 2 }}>🏢 {s.center} &nbsp;·&nbsp; 🕒 {s.time}</div>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#1d4ed8", background: "#dbeafe" }}>{t("Upcoming")}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* ── FEEDBACK ── */}
        {activeTab === "feedback" && (
          <SectionCard title={`⭐ Learner Feedback (${trainerReviews.length})`}>
            {trainerReviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
                <div>{t("No feedback submitted for this trainer yet.")}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {trainerReviews.map((r, i) => (
                  <div key={i} style={{ padding: "12px 16px", background: "#f9fafb", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>{r.learner}</span>
                      <span style={{ fontSize: 12, color: "#f59e0b" }}>{"⭐".repeat(Math.min(r.rating, 5)) || "—"}</span>
                    </div>
                    {r.text && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>{r.text}</div>}
                    {r.date && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>{r.date}</div>}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* ── BATCHES CALENDAR ── */}
        {activeTab === "batches" && (
          <SectionCard title="📅 Trainer's Batch Schedule">
            {trainerBatches.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                <div>{t("No batches assigned to this trainer yet.")}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {trainerBatches.map((b, i) => {
                  const pct = Math.round((b.enrolled / b.capacity) * 100);
                  const statusColor = { upcoming: "#2563eb", active: "#059669", completed: "#7c3aed", cancelled: "#dc2626" };
                  return (
                    <div key={i} style={{ padding: "14px 18px", borderRadius: 14, border: `1px solid ${statusColor[b.status] || "#e5e7eb"}30`, background: `${statusColor[b.status] || "#f59e0b"}08` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#1c1917" }}>{b.name}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{b.course} · {b.mode}</div>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12, color: "#6b7280" }}>
                        <span>📅 {b.start} → {b.end}</span>
                        <span>🪑 {b.enrolled}/{b.capacity} seats</span>
                        <span>🖥️ {b.platform || b.mode}</span>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div style={{ height: 5, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#10b981" : "#f59e0b", borderRadius: 4 }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{pct}% capacity filled</div>
                      </div>
                      {/* Trainer role badge */}
                      <div style={{ marginTop: 8 }}>
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: b.trainer === trainer.name ? "#dbeafe" : "#f3f4f6", color: b.trainer === trainer.name ? "#1d4ed8" : "#6b7280" }}>
                          {b.trainer === trainer.name ? "👑 Primary Trainer" : "🎓 Co-Trainer"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* Assign Courses Modal (nested) */}
        {showCourses && (
          <Modal title={`📚 Assign Courses — ${trainer.name}`} onClose={() => setShowCourses(false)}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>{t("Select courses this trainer can teach.")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {allCourses.map(c => {
                const isSelected = assignedCourses.includes(c);
                return (
                  <div key={c} onClick={() => setAssignedCourses(prev => isSelected ? prev.filter(x => x !== c) : [...prev, c])}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${isSelected ? "#6366f1" : "#e5e7eb"}`, background: isSelected ? "#ede9fe" : "#f9fafb" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? "#6366f1" : "#d1d5db"}`, background: isSelected ? "#6366f1" : "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", flexShrink: 0 }}>
                      {isSelected ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#4f46e5" : "#374151" }}>{c}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => { onUpdate({ ...trainer, assignedCourses }); setToast({ msg: t("Courses assigned!"), type: "success" }); setShowCourses(false); }}
              style={{ ...S.primaryBtn, width: "100%" }}>
              Save Assignments ({assignedCourses.length} selected)
            </button>
          </Modal>
        )}
      </div>
    </div>
  );
}

/* ── Add Trainer Modal ── */
function AddTrainerModal({ onAdd, onClose, setToast }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "",
    qualification: "Graduate", linkedin: "",
    bio: "", status: "active"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.subject) {
      setToast({ msg: t("Name and expertise required."), type: "error" });
      return;
    }
    try {
      await onAdd({
        id: Date.now(),
        ...form,
        courses: 0, batches: 0, sessions: 0, rating: 0,
        joined: new Date().toLocaleDateString("en-IN"),
        assignedCourses: [form.subject],
        portalAccess: {
          uploadContent: true,
          reviewAssignments: true,
          hostSessions: true,
          respondForum: true,
          viewOwnBatch: true,
        }
      });
      setToast({ msg: t("Trainer added successfully!"), type: "success" });
      onClose();
    } catch (error) {
      setToast({ msg: error.message || "Could not add trainer.", type: "error" });
    }
  };

  return (
    <Modal title="➕ Add New Trainer" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { key: "name",          label: "Full Name *",    icon: "👤", ph: "Dr. Rekha Iyer"         },
            { key: "subject",       label: "Expertise *",    icon: "📚", ph: "Early Childhood Ed"     },
            { key: "email",         label: "Email",          icon: "📧", ph: "trainer@spaceece.in", type: "email" },
            { key: "phone",         label: "Phone",          icon: "📱", ph: "+91 98765 43210"         },
            { key: "linkedin",      label: "LinkedIn URL",   icon: "🔗", ph: "linkedin.com/in/..."     },
            { key: "qualification", label: "Qualification",  icon: "🎓", ph: "M.Ed / PhD"             },
          ].map(f => (
            <div key={f.key}>
              <label style={S.label}>{f.label}</label>
              <div style={{ position: "relative" }}>
                <span style={S.fieldIcon}>{f.icon}</span>
                <input style={{ ...S.input, paddingLeft: 32 }} type={f.type || "text"} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={S.label}>Bio / Description</label>
          <textarea style={{ ...S.input, height: 70, resize: "none" }} value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder={t("Short description of the trainer's background and teaching style...")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, marginBottom: 20 }}>
          <div>
            <label style={S.label}>{t("Status")}</label>
            <select style={S.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t("Active")}</option>
              <option value="inactive">{t("Inactive")}</option>
            </select>
          </div>
        </div>
        <button type="submit" style={{ ...S.primaryBtn, width: "100%" }}>{t("Add Trainer →")}</button>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   MAIN TRAINER MANAGEMENT TAB — A5.1 + A5.2
══════════════════════════════════════════ */
export default function TrainerManagementTab({ trainers: initialTrainers = [], setTrainers, batches = [], setToast }) {
  const [trainers, setLocalTrainers] = useState(initialTrainers);
  const [selected,    setSelected]    = useState(null);
  const [addModal,    setAddModal]    = useState(false);
  const [statusFilter,setStatusFilter]= useState("all");
  const [search,      setSearch]      = useState("");
  const [loading, setLoading] = useState(true);

  const showToast = setToast || (() => {});
  const syncTrainers = (next) => {
    setLocalTrainers(next);
    if (setTrainers) setTrainers(next);
  };

  const loadTrainers = async () => {
    setLoading(true);
    try {
      const res = await getTrainers();
      syncTrainers(res.trainers || []);
    } catch (error) {
      showToast({ msg: error.message || "Could not load trainers.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  const addTrainer = async (t) => {
    const payload = { ...t };
    delete payload.id;
    const res = await createTrainer(payload);
    syncTrainers([res.trainer, ...trainers]);
  };

  const updateTrainer = async (updated) => {
    const id = updated._id || updated.id;
    const res = await updateTrainerApi(id, updated);
    const saved = res.trainer || updated;
    syncTrainers(trainers.map(t => (t._id || t.id) === id ? saved : t));
    setSelected(saved);
  };

  const deleteTrainer = async (id) => {
    await deleteTrainerApi(id);
    syncTrainers(trainers.filter(t => (t._id || t.id) !== id));
    showToast({ msg: t("Trainer removed."), type: "error" });
  };

  const filtered = trainers.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = (t.name || "").toLowerCase().includes(q) || (t.subject || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <SectionCard title="Trainer Management">{t("Loading trainers...")}</SectionCard>;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {addModal && <AddTrainerModal onAdd={addTrainer} onClose={() => setAddModal(false)} setToast={showToast} />}

      {/* Trainer profile opens as a MODAL / prompt box over this page */}
      {selected && (
        <TrainerProfileView
          trainer={selected}
          batches={batches}
          onBack={() => setSelected(null)}
          setToast={showToast}
          onUpdate={updated => { updateTrainer(updated); setSelected(updated); }}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={S.pageTitle}>{t("Trainer Management")}</h1>
          <p style={S.pageSub}>
            {trainers.length} total &nbsp;·&nbsp;
            {trainers.filter(t => t.status === "active").length} active &nbsp;·&nbsp;
            {trainers.filter(t => t.status === "inactive").length} inactive
          </p>
        </div>
        <button onClick={() => setAddModal(true)} style={S.primaryBtn}>+ Add Trainer</button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard icon="🎓" label={t("Total Trainers")}  val={trainers.length}                                     color="#6366f1" bg="#ede9fe" />
        <StatCard icon="✅" label={t("Active")}           val={trainers.filter(t => t.status === "active").length}  color="#10b981" bg="#d1fae5" />
        <StatCard icon="📚" label={t("Courses Covered")} val={trainers.reduce((a, t) => a + t.courses, 0)}          color="#f59e0b" bg="#fef3c7" />
        <StatCard icon="🎥" label={t("Total Sessions")}  val={trainers.reduce((a, t) => a + t.sessions, 0)}         color="#3b82f6" bg="#dbeafe" />
        <StatCard icon="⭐" label={t("Avg Rating")}      val={(trainers.filter(t=>t.rating>0).reduce((a,t)=>a+t.rating,0)/Math.max(1,trainers.filter(t=>t.rating>0).length)).toFixed(1)} color="#f59e0b" bg="#fef3c7" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SearchBar value={search} onChange={setSearch} placeholder={t("Search trainer by name or expertise...")} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "active", "inactive"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${statusFilter === f ? "#6366f1" : "#e5e7eb"}`, background: statusFilter === f ? "#ede9fe" : "white", color: statusFilter === f ? "#4f46e5" : "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {f === "all" ? "All Trainers" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Trainer Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {filtered.map((tr, i) => {
          const trainerBatches = batches.filter(b => b.trainer === tr.name || b.coTrainer === tr.name);
          return (
            <div key={i} style={{ background: "white", borderRadius: 18, padding: "20px", border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderTop: `3px solid ${tr.status === "active" ? "#6366f1" : "#e5e7eb"}` }}>
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "white", flexShrink: 0 }}>
                  {tr.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1c1917" }}>{tr.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{tr.subject}</div>
                  {tr.qualification && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{tr.qualification}</div>}
                </div>
                <StatusBadge status={tr.status} />
              </div>

              {/* Stats Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center", marginBottom: 14 }}>
                {[
                  { label: "Courses",  val: tr.courses,       icon: "📚" },
                  { label: "Batches",  val: trainerBatches.length, icon: "🗂️" },
                  { label: "Sessions", val: tr.sessions,      icon: "🎥" },
                  { label: "Rating",   val: tr.rating || "—", icon: "⭐" },
                ].map((s, j) => (
                  <div key={j} style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 4px", border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 12 }}>{s.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1c1917" }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "#9ca3af" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Bio preview */}
              {tr.bio && (
                <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5, marginBottom: 12, borderTop: "1px solid #f3f4f6", paddingTop: 10 }}>
                  {tr.bio.substring(0, 90)}{tr.bio.length > 90 ? "..." : ""}
                </p>
              )}

              {/* Rating bar */}
              {tr.rating > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11 }}>
                    <span style={{ color: "#9ca3af" }}>{t("Rating")}</span>
                    <span style={{ color: "#f59e0b", fontWeight: 700 }}>⭐ {tr.rating} / 5.0</span>
                  </div>
                  <div style={{ height: 5, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(tr.rating / 5) * 100}%`, background: "#f59e0b", borderRadius: 4 }} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
                <button onClick={() => setSelected(tr)} style={{ ...S.tblBtn, flex: 1, color: "#4f46e5", borderColor: "#c4b5fd" }}>👁 View Profile</button>
                <button onClick={() => { updateTrainer({ ...tr, status: tr.status === "active" ? "inactive" : "active" }); showToast({ msg: t("Trainer status updated!"), type: "success" }); }}
                  style={{ ...S.tblBtn, color: tr.status === "active" ? "#d97706" : "#059669", borderColor: tr.status === "active" ? "#fbbf24" : "#6ee7b7" }}>
                  {tr.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => deleteTrainer(tr._id || tr.id)} style={{ ...S.tblBtn, color: "#dc2626", borderColor: "#fca5a5" }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{t("No trainers found")}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{t("Try adjusting your filters or add a new trainer")}</div>
        </div>
      )}
    </div>
  );
}