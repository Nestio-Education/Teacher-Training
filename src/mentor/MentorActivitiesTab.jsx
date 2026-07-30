import { useState, useEffect, useMemo } from "react";
import { StatusBadge } from "../components/Shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUS_META = {
  pending: { bg: "#fef3c7", color: "#92400e", label: "Pending", tint: "#f59e0b" },
  approved: { bg: "#d1fae5", color: "#065f46", label: "Approved", tint: "#10b981" },
  flagged: { bg: "#ffedd5", color: "#c2410c", label: "Needs Rework", tint: "#f97316" },
  rejected: { bg: "#fee2e2", color: "#dc2626", label: "Rejected", tint: "#ef4444" },
};

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
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${tint}1a`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
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

function ActivityCard({ act, reviewingId, setReviewingId, reviewStatus, setReviewStatus, adminComments, setAdminComments, handleReview }) {
  const meta = STATUS_META[act.status] || { bg: "#f3f4f6", color: "#6b7280", label: act.status, tint: "#94a3b8" };

  return (
    <div
      style={{
        padding: "18px 20px",
        marginBottom: 14,
        borderRadius: 16,
        background: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        border: "1px solid #f1f5f9",
        borderLeft: `4px solid ${meta.tint}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
        <div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: 15, fontWeight: 800, color: "#1c1917" }}>
            {act.activityName || "Activity Submission"}
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
            By <strong style={{ color: "#6b7280" }}>{act.teacher?.name}</strong> · {new Date(act.activityDate).toLocaleDateString()}
          </p>
        </div>
        <span
          style={{
            background: meta.bg,
            color: meta.color,
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {meta.label}
        </span>
      </div>

      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 12 }}>
        <strong style={{ color: "#1c1917" }}>Description: </strong>
        {act.description}
      </div>

      {act.files && act.files.length > 0 && (
        <div style={{ marginBottom: 12, fontSize: 12, color: "#92400e", fontWeight: 700 }}>
          📎 {act.files.length} file{act.files.length > 1 ? "s" : ""} attached
        </div>
      )}

      {act.adminComments && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fffbeb",
            borderRadius: 10,
            fontSize: 12.5,
            color: "#78350f",
            borderLeft: "3px solid #f59e0b",
            marginBottom: 4,
          }}
        >
          <strong>Mentor Remarks:</strong> {act.adminComments}
        </div>
      )}

      {act.status === "pending" && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
          {reviewingId === act._id ? (
            <form onSubmit={(e) => handleReview(e, act._id)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px solid #fbbf24",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#92400e",
                  fontFamily: "inherit",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="approved">✅ Approve</option>
                <option value="flagged">🚩 Needs Rework (Flag)</option>
                <option value="rejected">⛔ Reject</option>
              </select>
              <textarea
                placeholder="Leave remarks or feedback for the fellow..."
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                rows={3}
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px solid #fbbf24",
                  resize: "vertical",
                  fontSize: 12.5,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setReviewingId(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    background: "#f3f4f6",
                    color: "#6b7280",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: "inherit",
                    boxShadow: "0 2px 6px rgba(217,119,6,0.3)",
                  }}
                >
                  Submit Review
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                setReviewingId(act._id);
                setReviewStatus("approved");
                setAdminComments("");
              }}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                background: "#fffbeb",
                color: "#92400e",
                border: "1px solid #fcd34d",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12,
                fontFamily: "inherit",
              }}
            >
              📝 Review Submission
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function MentorActivitiesTab({ user, setToast }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("approved");
  const [adminComments, setAdminComments] = useState("");
  const [tab, setTab] = useState("pending");

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("spaceece_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/mentor/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch activities");
      setActivities(data.activities || []);
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReview = async (e, id) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("spaceece_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/mentor/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: reviewStatus, adminComments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to review activity");
      setToast({ msg: "Activity reviewed successfully", type: "success" });
      setReviewingId(null);
      setAdminComments("");
      fetchActivities();
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    }
  };

  const pending = activities.filter((a) => a.status === "pending");
  const approved = activities.filter((a) => a.status === "approved");
  const flagged = activities.filter((a) => a.status === "flagged");
  const rejected = activities.filter((a) => a.status === "rejected");
  const reviewed = activities.filter((a) => a.status !== "pending");

  const cardProps = { reviewingId, setReviewingId, reviewStatus, setReviewStatus, adminComments, setAdminComments, handleReview };

  const visibleList = tab === "pending" ? pending : reviewed;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header banner */}
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
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>📝 Fellow Activities</h1>
        <p style={{ fontSize: 13, opacity: 0.92, margin: "6px 0 0", fontWeight: 600 }}>
          Review activity submissions from your assigned fellows and leave feedback.
        </p>
      </div>

      {/* Stat summary row */}
      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard icon="⏳" label="Pending Review" value={pending.length} tint="#f59e0b" />
        <StatCard icon="✅" label="Approved" value={approved.length} tint="#10b981" />
        <StatCard icon="🚩" label="Needs Rework" value={flagged.length} tint="#f97316" />
        <StatCard icon="⛔" label="Rejected" value={rejected.length} tint="#ef4444" />
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>
          <div
            style={{
              width: 28,
              height: 28,
              margin: "0 auto 12px",
              border: "3px solid #fef3c7",
              borderTopColor: "#f59e0b",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div style={{ fontSize: 13, fontWeight: 600 }}>Loading activities…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #f1f5f9",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {/* Tab switcher */}
          <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", background: "#fffbeb" }}>
            <button
              onClick={() => setTab("pending")}
              style={{
                flex: 1,
                padding: "14px 16px",
                border: "none",
                background: tab === "pending" ? "white" : "transparent",
                borderBottom: tab === "pending" ? "3px solid #f59e0b" : "3px solid transparent",
                color: tab === "pending" ? "#92400e" : "#9ca3af",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.18s",
              }}
            >
              ⏳ Pending Review ({pending.length})
            </button>
            <button
              onClick={() => setTab("reviewed")}
              style={{
                flex: 1,
                padding: "14px 16px",
                border: "none",
                background: tab === "reviewed" ? "white" : "transparent",
                borderBottom: tab === "reviewed" ? "3px solid #f59e0b" : "3px solid transparent",
                color: tab === "reviewed" ? "#92400e" : "#9ca3af",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.18s",
              }}
            >
              ✅ Reviewed ({reviewed.length})
            </button>
          </div>

          <div style={{ padding: 20 }}>
            {visibleList.length > 0 ? (
              visibleList.map((act) => <ActivityCard key={act._id} act={act} {...cardProps} />)
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>{tab === "pending" ? "🎉" : "📭"}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {tab === "pending" ? "No pending activities to review." : "No reviewed activities yet."}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}