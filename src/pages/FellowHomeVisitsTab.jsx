import { useState, useEffect } from "react";
import { StatCard, SectionCard, StatusBadge } from "../components/Shared";
import { getFellowHaalsMetrics } from "../services/api";

export default function FellowHomeVisitsTab({ user, setToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await getFellowHaalsMetrics();
        if (res.success) {
          setData(res);
        } else {
          setToast({ msg: "Failed to load metrics data.", type: "error" });
        }
      } catch (err) {
        console.error("Failed to load HAALS metrics", err);
        setToast({ msg: err.message || "Failed to load metrics.", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [setToast]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh", fontSize: 14, color: "#64748b" }}>
        🔄 Loading Home Visit Metrics...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
        No Home Visit Observation data available.
      </div>
    );
  }

  const { kpis, milestoneByDomain, recentVisits, commonChallenges } = data;

  return (
    <div style={{ animation: "fadeIn 0.3s ease", padding: "16px 0" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1c1917", margin: "0 0 4px" }}>HAALS Home Visit Observations</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Track community home visits, child developmental milestones, and caregiver engagement.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Visits Completed" val={kpis.visitsCompleted} sub={`Out of ${kpis.visitsScheduled} scheduled`} color="#f43f5e" />
        <StatCard label="Completion Rate" val={`${kpis.completionRate}%`} sub="Target: 90% or higher" color="#10b981" />
        <StatCard label="Avg Milestone Score" val={`${kpis.averageMilestoneScore} / 5`} sub="Developmental rating" color="#8b5cf6" />
        <StatCard label="Parent Participation" val={`${kpis.parentParticipationRate}%`} sub="Caregiver observed/assisted" color="#f59e0b" />
        <StatCard label="Follow-ups Pending" val={kpis.followUpsPending} sub="Actionable next steps" color="#3b82f6" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Left Column: Milestones & Challenges */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionCard title="Milestones by Domain">
            {milestoneByDomain.length === 0 ? (
              <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", margin: "20px 0" }}>No milestone scores logged.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {milestoneByDomain.map((m, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                      <span>{m.domain}</span>
                      <span style={{ color: "#f43f5e" }}>{m.average} / 5</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${(m.average / 5) * 100}%`,
                        background: "linear-gradient(90deg, #f43f5e, #ec4899)",
                        borderRadius: 3
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Common Challenges">
            {commonChallenges.length === 0 ? (
              <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", margin: "20px 0" }}>No challenges logged this period.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {commonChallenges.map((ch, idx) => (
                  <span key={idx} style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#e11d48",
                    background: "#fff1f2",
                    border: "1px solid #fecdd3"
                  }}>
                    {ch.challenge} <span style={{ fontWeight: 800, marginLeft: 2, opacity: 0.6 }}>({ch.count})</span>
                  </span>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right Column: Recent Visits */}
        <div>
          <SectionCard title="Recent Home Visit Logs">
            {recentVisits.length === 0 ? (
              <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: "40px 0" }}>
                No recent visit observations found. Sync responses to load data.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b", fontWeight: 700 }}>
                      <th style={{ padding: "8px 12px" }}>Child</th>
                      <th style={{ padding: "8px 12px" }}>Date</th>
                      <th style={{ padding: "8px 12px" }}>Activity</th>
                      <th style={{ padding: "8px 12px" }}>Engagement</th>
                      <th style={{ padding: "8px 12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentVisits.map((v, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", color: "#334155" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>{v.childName}</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>
                          {new Date(v.visitDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td style={{ padding: "10px 12px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={v.activities}>
                          {v.activities}
                        </td>
                        <td style={{ padding: "10px 12px" }}>{v.engagementLevel || "N/A"}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <StatusBadge status={v.status === "Completed" ? "approved" : "rejected"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
