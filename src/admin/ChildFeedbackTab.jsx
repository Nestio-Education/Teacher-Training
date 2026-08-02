import { useState, useEffect } from "react";
import { getAllChildFeedback, updateChildFeedbackStatus } from "../services/api";

// Some older records store the AI fields nested under "finalFeedback" instead of top-level.
// This helper checks both locations so all feedback displays correctly.
const getField = (fb, name) => fb[name] || fb.finalFeedback?.[name] || "";

export default function ChildFeedbackTab() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllChildFeedback()
      .then((data) => setFeedbacks(data.feedbacks || []))
      .catch((err) => setError(err.message || "Failed to load feedback"))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkReviewed = async (fb) => {
    setUpdatingId(fb._id);
    try {
      const nextStatus = fb.reviewStatus === "reviewed" ? "pending" : "reviewed";
      const res = await updateChildFeedbackStatus(fb._id, { reviewStatus: nextStatus });
      const updated = res.feedback;
      setFeedbacks((prev) => prev.map((f) => (f._id === fb._id ? { ...f, reviewStatus: updated.reviewStatus } : f)));
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const styles = {
    container: { padding: "24px", maxWidth: "1100px", margin: "0 auto" },
    header: { marginBottom: "24px" },
    title: { fontSize: "26px", fontWeight: "800", color: "#1a1a2e", margin: 0 },
    sub: { fontSize: "13px", color: "#888", marginTop: "4px" },
    sectionTitle: { fontSize: "15px", fontWeight: "800", color: "#1a1a2e", margin: "28px 0 14px", display: "flex", alignItems: "center", gap: 8 },

    kpiRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" },
    kpiCard: (color) => ({
      background: "#fff", borderRadius: "16px", padding: "18px 20px",
      border: "1px solid #f0f0f0", boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
      borderTop: `4px solid ${color}`, display: "flex", alignItems: "center", gap: 14,
    }),
    kpiIcon: (color) => ({
      width: 46, height: 46, borderRadius: 13, background: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
    }),
    kpiNum: { fontSize: "24px", fontWeight: "800", color: "#1a1a2e", lineHeight: 1.1 },
    kpiLabel: { fontSize: "12px", color: "#9ca3af", marginTop: "2px", fontWeight: 600 },

    areaCard: { display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #fde68a", borderLeft: "4px solid #f59e0b", borderRadius: "12px", padding: "12px 16px", marginBottom: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" },
    areaAvatar: { width: 38, height: 38, borderRadius: "50%", background: "#fef3c7", color: "#92400e", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    areaChildName: { fontSize: 13, fontWeight: 800, color: "#1a1a2e", marginBottom: 2 },
    areaText: { fontSize: 12.5, color: "#6b7280", lineHeight: 1.4 },
    areaBadge: { fontSize: 11, fontWeight: 700, color: "#92400e", background: "#fef3c7", borderRadius: 20, padding: "3px 11px", flexShrink: 0, whiteSpace: "nowrap" },

    attentionCard: { background: "#fff", border: "1px solid #fecaca", borderLeft: "4px solid #ef4444", borderRadius: "12px", padding: "12px 16px", marginBottom: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 12 },
    attentionAvatar: { width: 34, height: 34, borderRadius: "50%", background: "#fee2e2", color: "#991b1b", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    attentionName: { fontSize: 13, fontWeight: 700, color: "#1a1a2e" },
    attentionMeta: { fontSize: 11, color: "#9ca3af", marginTop: 1 },

    card: { background: "#fff", borderRadius: "14px", padding: "18px 20px", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "14px" },
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
    childName: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e" },
    meta: { fontSize: "11px", color: "#9ca3af", marginTop: "2px", marginBottom: "12px" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
    box: { borderRadius: "10px", padding: "10px 14px" },
    boxLabel: { fontSize: "11px", fontWeight: "700", marginBottom: "4px" },
    boxText: { fontSize: "12px" },
    recBox: { marginTop: "10px", borderRadius: "10px", padding: "10px 14px", background: "#eff6ff", border: "1px solid #bfdbfe" },
    empty: { textAlign: "center", padding: "40px 20px", color: "#999" },

    statusBadge: (reviewed) => ({
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      background: reviewed ? "#d1fae5" : "#fef3c7", color: reviewed ? "#065f46" : "#92400e",
    }),
    reviewBtn: (reviewed) => ({
      marginTop: 12, padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
      fontSize: 12, fontWeight: 700, fontFamily: "inherit",
      background: reviewed ? "#f3f4f6" : "#6c63ff", color: reviewed ? "#6b7280" : "#fff",
    }),
  };

  if (loading) return <div style={styles.container}><div style={styles.empty}>Loading feedback...</div></div>;
  if (error) return <div style={styles.container}><div style={styles.empty}>Error: {error}</div></div>;

  // ── INSIGHTS CALCULATIONS ──
  const totalFeedback = feedbacks.length;
  const pendingCount = feedbacks.filter(fb => fb.reviewStatus !== "reviewed").length;
  const teacherCounts = {};
  feedbacks.forEach(fb => {
    const name = fb.teacherName || fb.teacher?.name || "Unknown Teacher";
    teacherCounts[name] = (teacherCounts[name] || 0) + 1;
  });
  const teacherEntries = Object.entries(teacherCounts).sort((a, b) => b[1] - a[1]);
  const mostActiveTeacher = teacherEntries[0]?.[0] || "—";

  // Common Areas — grouped, shows child name + avatar, text truncated
  const areaGroups = {};
  feedbacks.forEach(fb => {
    const text = getField(fb, "areasNeedingSupport").trim();
    if (!text) return;
    const childName = fb.childName || fb.child?.fullName || "Unnamed Child";
    if (!areaGroups[text]) areaGroups[text] = { text, children: new Set() };
    areaGroups[text].children.add(childName);
  });
  const topAreas = Object.values(areaGroups)
    .sort((a, b) => b.children.size - a.children.size)
    .slice(0, 5);

  const truncate = (text, len = 90) => (text.length > len ? text.slice(0, len).trim() + "…" : text);

  const childAreaMap = {};
  feedbacks.forEach(fb => {
    const childId = fb.child?._id || fb.child;
    const childName = fb.childName || fb.child?.fullName || "Unnamed Child";
    const text = getField(fb, "areasNeedingSupport").trim();
    if (!childId || !text) return;
    if (!childAreaMap[childId]) childAreaMap[childId] = { name: childName, count: 0 };
    childAreaMap[childId].count += 1;
  });
  const childrenNeedingAttention = Object.values(childAreaMap).filter(c => c.count >= 2);
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const q = search.toLowerCase();
    const childName = (fb.childName || fb.child?.fullName || "").toLowerCase();
    const teacherName = (fb.teacherName || fb.teacher?.name || "").toLowerCase();
    return !q || childName.includes(q) || teacherName.includes(q);
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🧒 Child Feedback (AI)</h2>
        <p style={styles.sub}>Structured, AI-processed feedback submitted by teachers.</p>
      </div>

      {totalFeedback > 0 && (
        <>
          {/* KPI CARDS */}
          <div style={styles.kpiRow}>
            <div style={styles.kpiCard("#6c63ff")}>
              <div style={styles.kpiIcon("#6c63ff")}>📋</div>
              <div>
                <div style={styles.kpiNum}>{totalFeedback}</div>
                <div style={styles.kpiLabel}>TOTAL FEEDBACK ENTRIES</div>
              </div>
            </div>
            <div style={styles.kpiCard("#ef4444")}>
  <div style={styles.kpiIcon("#ef4444")}>⏳</div>
  <div>
    <div style={styles.kpiNum}>{pendingCount}</div>
    <div style={styles.kpiLabel}>PENDING REVIEW</div>
  </div>
</div>
            <div style={styles.kpiCard("#f59e0b")}>
              <div style={styles.kpiIcon("#f59e0b")}>👩‍🏫</div>
              <div>
                <div style={{ ...styles.kpiNum, fontSize: 16 }}>{mostActiveTeacher}</div>
                <div style={styles.kpiLabel}>MOST ACTIVE TEACHER</div>
              </div>
            </div>
          </div>

          {/* COMMON AREAS NEEDING SUPPORT */}
          {topAreas.length > 0 && (
            <>
              <div style={styles.sectionTitle}>⚠️ Common Areas Needing Support</div>
              {topAreas.map((area, i) => {
                const namesArr = [...area.children];
                return (
                  <div key={i} style={styles.areaCard}>
                    <div style={styles.areaAvatar}>{namesArr[0][0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.areaChildName}>{namesArr.join(", ")}</div>
                      <div style={styles.areaText}>{truncate(area.text)}</div>
                    </div>
                    <div style={styles.areaBadge}>{namesArr.length} {namesArr.length === 1 ? "child" : "children"}</div>
                  </div>
                );
              })}
            </>
          )}

          {/* CHILDREN NEEDING ATTENTION */}
          {childrenNeedingAttention.length > 0 && (
            <>
              <div style={styles.sectionTitle}>🚩 Children Needing Attention</div>
              {childrenNeedingAttention.map((c, i) => (
                <div key={i} style={styles.attentionCard}>
                  <div style={styles.attentionAvatar}>{c.name[0]}</div>
                  <div>
                    <div style={styles.attentionName}>{c.name}</div>
                    <div style={styles.attentionMeta}>{c.count} feedback entries mention support needed — recurring concern</div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={styles.sectionTitle}>📋 All Feedback Entries</div>
        </>
      )}

      {/* FEEDBACK LIST */}
      {feedbacks.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🧒</div>
          No feedback submitted yet. Teacher-submitted feedback will appear here.
        </div>
      ) : (
        feedbacks.map((fb) => {
          const isReviewed = fb.reviewStatus === "reviewed";
          const strengths = getField(fb, "strengths");
          const areasNeedingSupport = getField(fb, "areasNeedingSupport");
          const recommendation = getField(fb, "recommendation");
          return (
            <div key={fb._id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.childName}>{fb.childName || fb.child?.fullName || "Unnamed Child"}</div>
                <span style={styles.statusBadge(isReviewed)}>{isReviewed ? "✓ Reviewed" : "Pending Review"}</span>
              </div>
              <div style={styles.meta}>
                By {fb.teacherName || fb.teacher?.name || "Unknown Teacher"} · {new Date(fb.createdAt).toLocaleDateString()}
              </div>
              <div style={styles.grid}>
                <div style={{ ...styles.box, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <div style={{ ...styles.boxLabel, color: "#166534" }}>✅ Strengths Observed</div>
                  <div style={{ ...styles.boxText, color: "#166534" }}>{strengths || "—"}</div>
                </div>
                <div style={{ ...styles.box, background: "#fef3c7", border: "1px solid #fde68a" }}>
                  <div style={{ ...styles.boxLabel, color: "#92400e" }}>⚠️ Areas Needing Support</div>
                  <div style={{ ...styles.boxText, color: "#92400e" }}>{areasNeedingSupport || "—"}</div>
                </div>
              </div>
              <div style={styles.recBox}>
                <div style={{ ...styles.boxLabel, color: "#1d4ed8" }}>💡 Teacher's Recommendation</div>
                <div style={{ ...styles.boxText, color: "#1d4ed8" }}>{recommendation || "—"}</div>
              </div>
              <button
                disabled={updatingId === fb._id}
                onClick={() => handleMarkReviewed(fb)}
                style={{ ...styles.reviewBtn(isReviewed), opacity: updatingId === fb._id ? 0.6 : 1 }}
              >
                {updatingId === fb._id ? "Updating..." : isReviewed ? "↺ Mark as Pending" : "✓ Mark as Reviewed"}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
