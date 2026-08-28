import { useState, useEffect } from "react";
import { StatCard, SectionCard, StatusBadge } from "../components/Shared";
import { getMentorHaalsMetrics, triggerHaalsAiReportStub } from "../services/api";

export default function MentorHomeVisitsTab({ user, setToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportingFellowId, setReportingFellowId] = useState(null);

  useEffect(() => {
    async function loadMentorMetrics() {
      try {
        const res = await getMentorHaalsMetrics();
        if (res.success) {
          setData(res);
        } else {
          setToast({ msg: "Failed to load mentor metrics.", type: "error" });
        }
      } catch (err) {
        console.error("Failed to load mentor metrics", err);
        setToast({ msg: err.message || "Failed to load mentor metrics.", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    loadMentorMetrics();
  }, [setToast]);

  const handleGenerateReportStub = async (fellowId, fellowName) => {
    setReportingFellowId(fellowId);
    try {
      const res = await triggerHaalsAiReportStub(fellowId, "Month 1");
      if (res.success) {
        setToast({
          msg: `Extension Point Triggered for ${fellowName}! Response: ${res.message}`,
          type: "success"
        });
      } else {
        setToast({ msg: "Failed to trigger report extension.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ msg: err.message || "Failed to trigger AI report stub.", type: "error" });
    } finally {
      setReportingFellowId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh", fontSize: 14, color: "#64748b" }}>
        🔄 Loading Mentor Home Visit Rollups...
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

  const { kpis, fellowComparisonTable, flaggedChildren } = data;

  return (
    <div style={{ animation: "fadeIn 0.3s ease", padding: "16px 0" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1c1917", margin: "0 0 4px" }}>HAALS Mentor Oversight (Home Visits)</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Monitor community visit coverage, developmental milestone progress, and flag children needing intervention.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Centre-wide Visit Completion" val={`${kpis.centerVisitCompletion}%`} sub="Overall completion rate" color="#f43f5e" />
        <StatCard label="Avg Milestone Score" val={`${kpis.centerAverageMilestoneScore} / 5`} sub="Overall child progress" color="#8b5cf6" />
        <StatCard label="Flagged Children (Attention Needed)" val={kpis.flaggedChildrenCount} sub="Children with issues in >= 2 visits" color="#ef4444" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        {/* Fellow Comparison Table */}
        <SectionCard title="Per-Fellow Comparison & Oversight">
          {fellowComparisonTable.length === 0 ? (
            <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: "40px 0" }}>
              No Fellows assigned or no data synchronized.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b", fontWeight: 700 }}>
                    <th style={{ padding: "10px 12px" }}>Fellow Name</th>
                    <th style={{ padding: "10px 12px" }}>Email</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Scheduled</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Completed</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Completion Rate</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Avg Milestone Score</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fellowComparisonTable.map((f, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", color: "#334155" }}>
                      <td style={{ padding: "12px 12px", fontWeight: 700 }}>{f.name}</td>
                      <td style={{ padding: "12px 12px", color: "#64748b" }}>{f.email}</td>
                      <td style={{ padding: "12px 12px", textAlign: "center" }}>{f.visitsScheduled}</td>
                      <td style={{ padding: "12px 12px", textAlign: "center" }}>{f.visitsCompleted}</td>
                      <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 600 }}>
                        <span style={{ color: f.completionRate < 70 ? "#dc2626" : "#059669" }}>
                          {f.completionRate}%
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 600 }}>
                        <span style={{ color: f.averageMilestoneScore < 2.5 ? "#dc2626" : "#059669" }}>
                          {f.averageMilestoneScore} / 5
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>
                        <button
                          disabled={reportingFellowId !== null}
                          onClick={() => handleGenerateReportStub(f.fellowId, f.name)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                            color: "white",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            opacity: reportingFellowId === f.fellowId ? 0.7 : 1
                          }}
                        >
                          {reportingFellowId === f.fellowId ? "Drafting..." : "📝 Draft AI Report"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Children Needing Attention (Flagged Children) */}
        <SectionCard title="Children Needing Attention (Auto-Flagged)">
          {flaggedChildren.length === 0 ? (
            <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: "40px 0" }}>
              🎉 No children have triggered attention flags in this period.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b", fontWeight: 700 }}>
                    <th style={{ padding: "10px 12px" }}>Child Name</th>
                    <th style={{ padding: "10px 12px" }}>Assigned Fellow</th>
                    <th style={{ padding: "10px 12px" }}>Domain</th>
                    <th style={{ padding: "10px 12px" }}>Flag Reason</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedChildren.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", color: "#334155" }}>
                      <td style={{ padding: "12px 12px", fontWeight: 700, color: "#dc2626" }}>{c.childName}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 600 }}>{c.fellowName}</td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#7c3aed",
                          background: "#f5f3ff",
                          border: "1px solid #ddd6fe"
                        }}>
                          {c.domain}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", color: "#64748b" }}>{c.reason}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>
                        <StatusBadge status="flagged" />
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
  );
}
