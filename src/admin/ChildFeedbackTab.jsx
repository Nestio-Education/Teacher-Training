import { useState, useEffect } from "react";
import { getAllChildFeedback } from "../services/api";

export default function ChildFeedbackTab() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllChildFeedback()
      .then((data) => setFeedbacks(data.feedbacks || []))
      .catch((err) => setError(err.message || "Failed to load feedback"))
      .finally(() => setLoading(false));
  }, []);

  const styles = {
    container: { padding: "24px", maxWidth: "1000px", margin: "0 auto" },
    header: { marginBottom: "24px" },
    title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
    sub: { fontSize: "13px", color: "#888", marginTop: "4px" },
    searchWrap: { position: "relative", marginBottom: "20px" },
    searchInput: { width: "100%", padding: "10px 14px 10px 38px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px", boxSizing: "border-box" },
    searchIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9ca3af" },
    card: { background: "#fff", borderRadius: "14px", padding: "18px 20px", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "14px" },
    childName: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e" },
    meta: { fontSize: "11px", color: "#9ca3af", marginTop: "2px", marginBottom: "12px" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
    box: { borderRadius: "10px", padding: "10px 14px" },
    boxLabel: { fontSize: "11px", fontWeight: "700", marginBottom: "4px" },
    boxText: { fontSize: "12px" },
    recBox: { marginTop: "10px", borderRadius: "10px", padding: "10px 14px", background: "#eff6ff", border: "1px solid #bfdbfe" },
    empty: { textAlign: "center", padding: "60px 20px", color: "#999" },
  };

  if (loading) return <div style={styles.container}><div style={styles.empty}>Loading feedback...</div></div>;
  if (error) return <div style={styles.container}><div style={styles.empty}>Error: {error}</div></div>;

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const q = search.toLowerCase();
    const childName = (fb.childName || fb.child?.fullName || "").toLowerCase();
    const teacherName = (fb.teacherName || fb.teacher?.name || "").toLowerCase();
    return !q || childName.includes(q) || teacherName.includes(q);
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>👤Child Feedback</h2>
        <p style={styles.sub}>Structured, AI-processed feedback submitted by teachers.</p>
      </div>

      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by child or teacher name..."
        />
      </div>

      {filteredFeedbacks.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎒</div>
          {search ? "No feedback matches your search." : "No feedback submitted yet. Teacher-submitted feedback will appear here."}
        </div>
      ) : (
        filteredFeedbacks.map((fb) => (
          <div key={fb._id} style={styles.card}>
            <div style={styles.childName}>{fb.childName || fb.child?.fullName || "Unnamed Child"}</div>
            <div style={styles.meta}>
              By {fb.teacherName || fb.teacher?.name || "Unknown Teacher"} · {new Date(fb.createdAt).toLocaleDateString()}
            </div>
            <div style={styles.grid}>
              <div style={{ ...styles.box, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div style={{ ...styles.boxLabel, color: "#166534" }}>✅ Strengths Observed</div>
                <div style={{ ...styles.boxText, color: "#166534" }}>{fb.finalFeedback?.strengths || fb.strengths || "—"}</div>
              </div>
              <div style={{ ...styles.box, background: "#fef3c7", border: "1px solid #fde68a" }}>
                <div style={{ ...styles.boxLabel, color: "#92400e" }}>⚠️ Areas Needing Support</div>
                <div style={{ ...styles.boxText, color: "#92400e" }}>{fb.finalFeedback?.areasNeedingSupport || fb.areasNeedingSupport || "—"}</div>
              </div>
            </div>
            <div style={styles.recBox}>
              <div style={{ ...styles.boxLabel, color: "#1d4ed8" }}>💡 Teacher's Recommendation</div>
              <div style={{ ...styles.boxText, color: "#1d4ed8" }}>{fb.finalFeedback?.recommendation || fb.recommendation || "—"}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}