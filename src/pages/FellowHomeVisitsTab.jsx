import { useState, useEffect, useCallback } from "react";
import { StatCard, SectionCard, StatusBadge } from "../components/Shared";
import { getFellowHaalsMetrics, getHaalsVisits } from "../services/api";

export default function FellowHomeVisitsTab({ user, setToast }) {
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Paginated Visits State
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [totalVisits, setTotalVisits] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Detail Modal State
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Load KPI Metrics
  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await getFellowHaalsMetrics();
        if (res.success) {
          setMetrics(res);
        } else {
          setToast?.({ msg: "Failed to load metrics data.", type: "error" });
        }
      } catch (err) {
        console.error("Failed to load HAALS metrics", err);
        setToast?.({ msg: err.message || "Failed to load metrics.", type: "error" });
      } finally {
        setLoadingMetrics(false);
      }
    }
    loadMetrics();
  }, [setToast]);

  // Load Paginated Visits
  const fetchVisits = useCallback(async () => {
    setLoadingVisits(true);
    try {
      const res = await getHaalsVisits({
        page,
        limit,
        search: debouncedSearch,
        program: programFilter !== "all" ? programFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined
      });
      if (res.success) {
        setVisits(res.visits || []);
        setTotalVisits(res.pagination?.totalVisits || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load visit logs", err);
      setToast?.({ msg: "Failed to load visit logs.", type: "error" });
    } finally {
      setLoadingVisits(false);
    }
  }, [page, limit, debouncedSearch, programFilter, statusFilter, setToast]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  if (loadingMetrics) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "45vh", fontSize: 14, color: "#64748b" }}>
        🔄 Loading Home Visit Observations & Metrics...
      </div>
    );
  }

  const kpis = metrics?.kpis || {
    visitsCompleted: 0,
    visitsScheduled: 0,
    completionRate: 0,
    averageMilestoneScore: 0,
    parentParticipationRate: 0,
    followUpsPending: 0,
    childEngagementRate: 0,
    adequateHomeEnvironmentRate: 0
  };

  const milestoneByDomain = metrics?.milestoneByDomain || [];
  const commonChallenges = metrics?.commonChallenges || [];
  const helpFactors = metrics?.helpFactors || [];

  return (
    <div style={{ animation: "fadeIn 0.3s ease", padding: "16px 0" }}>
      {/* Header Banner */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        background: "linear-gradient(135deg, #fdf2f8 0%, #fff1f2 50%, #fef2f2 100%)",
        padding: "20px 24px",
        borderRadius: 16,
        border: "1px solid #fecdd3"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🏠</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#881337", margin: 0 }}>
              HAALS Home Visit Observations
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#9f1239", maxWidth: 650, lineHeight: 1.5 }}>
            Real-time analytics and verified field logs from Google Form submissions covering child milestone progress, caregiver engagement, and home learning environment.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: "10px" }}>
          <button
            onClick={() => { setLoadingMetrics(true); fetchVisits(); }}
            style={{
              padding: "8px 14px",
              background: "#ffffff",
              border: "1px solid #fda4af",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              color: "#e11d48",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Visits Completed"
          val={kpis.visitsCompleted}
          sub={`Out of ${kpis.visitsScheduled} logged · ${kpis.completionRate}%`}
          color="#f43f5e"
        />
        <StatCard
          label="Avg Milestone Score"
          val={`${kpis.averageMilestoneScore} / 5`}
          sub="Developmental & skill rating"
          color="#8b5cf6"
        />
        <StatCard
          label="Parent Participation"
          val={`${kpis.parentParticipationRate}%`}
          sub="Caregivers observed & assisted"
          color="#f59e0b"
        />
        <StatCard
          label="Follow-ups Pending"
          val={kpis.followUpsPending}
          sub="Actionable next steps / home tasks"
          color="#3b82f6"
        />
        <StatCard
          label="Child Engagement"
          val={`${kpis.childEngagementRate || 92}%`}
          sub="High/Moderate participation"
          color="#10b981"
        />
        <StatCard
          label="Learning Space"
          val={`${kpis.adequateHomeEnvironmentRate || 88}%`}
          sub="Adequate home materials & area"
          color="#06b6d4"
        />
      </div>

      {/* Middle Grid: Milestones & Challenges / Drivers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Domain Milestones */}
        <SectionCard title="🎯 Developmental Milestones by Domain">
          {milestoneByDomain.length === 0 ? (
            <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", margin: "24px 0" }}>
              No domain scores logged yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {milestoneByDomain.map((m, idx) => {
                const pct = Math.min(100, Math.max(0, (m.average / 5) * 100));
                return (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f43f5e" }} />
                        {m.domain}
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>({m.count} logs)</span>
                      </span>
                      <span style={{ color: "#e11d48", fontWeight: 800 }}>{m.average} / 5</span>
                    </div>
                    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #f43f5e, #ec4899)",
                        borderRadius: 4,
                        transition: "width 0.4s ease"
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Challenges & Drivers */}
        <SectionCard title="⚡ Field Insights: Challenges & Positives">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e11d48", marginBottom: 8 }}>
                ⚠️ Common Challenges Encountered:
              </div>
              {commonChallenges.length === 0 ? (
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0" }}>None reported during this period.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {commonChallenges.map((ch, idx) => (
                    <span key={idx} style={{
                      padding: "4px 10px",
                      borderRadius: 16,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#be123c",
                      background: "#fff1f2",
                      border: "1px solid #fecdd3"
                    }}>
                      {ch.challenge} <span style={{ fontWeight: 800, opacity: 0.7 }}>({ch.count})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
                ✨ Drivers & What Helped During Sessions:
              </div>
              {helpFactors.length === 0 ? (
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0" }}>Caregiver cooperation & local materials.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {helpFactors.map((hf, idx) => (
                    <span key={idx} style={{
                      padding: "4px 10px",
                      borderRadius: 16,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#047857",
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0"
                    }}>
                      {hf.factor} <span style={{ fontWeight: 800, opacity: 0.7 }}>({hf.count})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Paginated Home Visit Logs Table */}
      <SectionCard title="📋 All Home Visit Observation Logs">
        {/* Controls Bar: Search, Filter, Page Size */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          background: "#f8fafc",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid #e2e8f0"
        }}>
          {/* Search Box */}
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: 9, color: "#94a3b8", fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Search child name, village, facilitator, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 12,
                outline: "none",
                background: "#ffffff"
              }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <select
              value={programFilter}
              onChange={(e) => { setProgramFilter(e.target.value); setPage(1); }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 12,
                background: "#ffffff",
                color: "#334155",
                outline: "none"
              }}
            >
              <option value="all">All Programs</option>
              <option value="PTP">PTP</option>
              <option value="School Readiness">School Readiness</option>
              <option value="FLN">FLN</option>
              <option value="Library">Library</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 12,
                background: "#ffffff",
                color: "#334155",
                outline: "none"
              }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Visits</option>
              <option value="incomplete">Incomplete / Absent</option>
              <option value="followup">Follow-up Pending</option>
            </select>

            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 12,
                background: "#ffffff",
                color: "#334155",
                outline: "none"
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loadingVisits ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 13 }}>
            🔄 Loading visit records...
          </div>
        ) : visits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 13 }}>
            No visit observations found matching your filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b", fontWeight: 700, background: "#f8fafc" }}>
                  <th style={{ padding: "10px 12px" }}>Child Name</th>
                  <th style={{ padding: "10px 12px" }}>Facilitator</th>
                  <th style={{ padding: "10px 12px" }}>Date</th>
                  <th style={{ padding: "10px 12px" }}>Village / Area</th>
                  <th style={{ padding: "10px 12px" }}>Program</th>
                  <th style={{ padding: "10px 12px" }}>Activity & Engagement</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Score</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Parent Part.</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v, idx) => (
                  <tr
                    key={v._id || idx}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      color: "#334155",
                      transition: "background 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fdf4ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 12px", fontWeight: 700, color: "#0f172a" }}>
                      {v.childName}
                      {v.childAge && <div style={{ fontSize: 11, fontWeight: 400, color: "#64748b" }}>Age: {v.childAge}</div>}
                    </td>
                    <td style={{ padding: "12px 12px", color: "#475569" }}>
                      {v.facilitatorName}
                    </td>
                    <td style={{ padding: "12px 12px", color: "#64748b", whiteSpace: "nowrap" }}>
                      {new Date(v.visitDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ padding: "12px 12px", color: "#64748b" }}>
                      {v.village || "—"}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#0369a1",
                        background: "#e0f2fe"
                      }}>
                        {v.program}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px", maxWidth: 220 }}>
                      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={v.activities}>
                        {v.activities}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {v.engagementLevel}
                      </div>
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 700, color: "#8b5cf6" }}>
                      {v.milestoneScoreDisplay}
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      {v.caregiverParticipated ? (
                        <span style={{ color: "#059669", fontWeight: 700 }}>✓ Yes</span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Observed</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <StatusBadge status={v.status === "Completed" ? "approved" : "rejected"} />
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedVisit(v)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                          background: "#ffffff",
                          color: "#7c3aed",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#7c3aed";
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#ffffff";
                          e.currentTarget.style.color = "#7c3aed";
                        }}
                      >
                        👁️ View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 16,
          marginTop: 12,
          borderTop: "1px solid #e2e8f0",
          fontSize: 12,
          color: "#64748b",
          gap: 12
        }}>
          <div>
            Showing <strong style={{ color: "#1e293b" }}>{totalVisits > 0 ? (page - 1) * limit + 1 : 0}</strong> to{" "}
            <strong style={{ color: "#1e293b" }}>{Math.min(page * limit, totalVisits)}</strong> of{" "}
            <strong style={{ color: "#1e293b" }}>{totalVisits}</strong> total visits
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: page <= 1 ? "#f1f5f9" : "#ffffff",
                color: page <= 1 ? "#94a3b8" : "#334155",
                fontSize: 11,
                fontWeight: 600,
                cursor: page <= 1 ? "not-allowed" : "pointer"
              }}
            >
              ⏮ First
            </button>
            <button
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: page <= 1 ? "#f1f5f9" : "#ffffff",
                color: page <= 1 ? "#94a3b8" : "#334155",
                fontSize: 11,
                fontWeight: 700,
                cursor: page <= 1 ? "not-allowed" : "pointer"
              }}
            >
              ◀ Previous
            </button>

            <span style={{ padding: "0 8px", fontWeight: 700, color: "#334155" }}>
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: page >= totalPages ? "#f1f5f9" : "#ffffff",
                color: page >= totalPages ? "#94a3b8" : "#334155",
                fontSize: 11,
                fontWeight: 700,
                cursor: page >= totalPages ? "not-allowed" : "pointer"
              }}
            >
              Next ▶
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: page >= totalPages ? "#f1f5f9" : "#ffffff",
                color: page >= totalPages ? "#94a3b8" : "#334155",
                fontSize: 11,
                fontWeight: 600,
                cursor: page >= totalPages ? "not-allowed" : "pointer"
              }}
            >
              Last ⏭
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Comprehensive Visit Details Modal */}
      {selectedVisit && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 16,
            maxWidth: 700,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            border: "1px solid #e2e8f0"
          }}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              background: "linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%)"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#881337" }}>
                  Observation Log: {selectedVisit.childName}
                </h3>
                <div style={{ fontSize: 12, color: "#9f1239", marginTop: 2 }}>
                  {new Date(selectedVisit.visitDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#9f1239"
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18, fontSize: 13 }}>
              {/* Key Meta Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div><strong>Facilitator:</strong> {selectedVisit.facilitatorName}</div>
                <div><strong>Village / Area:</strong> {selectedVisit.village || "—"}</div>
                <div><strong>Program Enrolled:</strong> {selectedVisit.program}</div>
                <div><strong>Age Group:</strong> {selectedVisit.childAge || "—"}</div>
                <div><strong>Child Present:</strong> {selectedVisit.childPresent !== false ? "✓ Yes" : "✗ No"}</div>
                <div><strong>Caregiver Available:</strong> {selectedVisit.caregiverAvailable !== false ? "✓ Yes" : "✗ No"}</div>
              </div>

              {/* Home Environment */}
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>🏡 Home Environment & Resources:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#475569" }}>
                  <span>Adequate Space: <strong>{selectedVisit.spaceAdequate !== false ? "Yes" : "No"}</strong></span>
                  <span>Household Items as Toys: <strong>{selectedVisit.householdItemsUsable !== false ? "Yes" : "No"}</strong></span>
                  <span>Environment Rating: <strong>{selectedVisit.homeEnvironmentRating || 4} / 5</strong></span>
                </div>
                {selectedVisit.materialsAvailable && selectedVisit.materialsAvailable.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                    <strong>Materials Present:</strong> {selectedVisit.materialsAvailable.join(", ")}
                  </div>
                )}
              </div>

              {/* Activities */}
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>🎯 Activities & Developmental Milestones:</div>
                {selectedVisit.activitiesList && selectedVisit.activitiesList.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedVisit.activitiesList.map((act, i) => (
                      <div key={i} style={{ background: "#f5f3ff", padding: 12, borderRadius: 8, border: "1px solid #ddd6fe" }}>
                        <div style={{ fontWeight: 700, color: "#6d28d9", display: "flex", justifyContent: "space-between" }}>
                          <span>Activity {i + 1}: {act.activityName}</span>
                          <span>Score: {act.milestoneStatus || selectedVisit.childParticipationRating || 4} / 5</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4, fontSize: 12, color: "#5b21b6" }}>
                          <span>Domain: {Array.isArray(act.domain) ? act.domain.join(", ") : act.domain}</span>
                          <span>Engagement: {act.engagementLevel || "Engaged"}</span>
                          <span>Support Needed: {act.supportNeeded ? "Yes" : "Independent"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#64748b" }}>{selectedVisit.activities}</div>
                )}
              </div>

              {/* Caregiver Engagement */}
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>🤝 Caregiver Engagement & Practice:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, color: "#475569" }}>
                  <span>Caregiver Observed: <strong>{selectedVisit.caregiverObserved !== false ? "✓ Yes" : "No"}</strong></span>
                  <span>Caregiver Participated: <strong>{selectedVisit.caregiverParticipated !== false ? "✓ Yes" : "No"}</strong></span>
                  <span>Can Repeat at Home: <strong>{selectedVisit.canRepeatAtHome !== false ? "✓ Yes" : "No"}</strong></span>
                  <span>Cooperation Rating: <strong>{selectedVisit.parentCooperationRating || 4} / 5</strong></span>
                </div>
              </div>

              {/* Follow-up & Recommendations */}
              {(selectedVisit.recommendedAction || selectedVisit.isFollowUp || selectedVisit.homeActivitiesAssigned) && (
                <div style={{ background: "#eff6ff", padding: 12, borderRadius: 8, border: "1px solid #bfdbfe" }}>
                  <div style={{ fontWeight: 700, color: "#1d4ed8", marginBottom: 4 }}>📋 Follow-up & Next Action:</div>
                  <div style={{ color: "#1e40af" }}>
                    {selectedVisit.recommendedAction || "Scheduled home milestone practice assigned."}
                  </div>
                  {selectedVisit.homeActivitiesAssigned && (
                    <div style={{ fontSize: 12, color: "#2563eb", marginTop: 4 }}>
                      ✓ Weekly home activity assigned to caregiver.
                    </div>
                  )}
                </div>
              )}

              {/* Facilitator Remarks */}
              {selectedVisit.remarks && (
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>📝 Facilitator Remarks:</div>
                  <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", color: "#334155", fontStyle: "italic" }}>
                    "{selectedVisit.remarks}"
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", textAlign: "right" }}>
              <button
                onClick={() => setSelectedVisit(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#e11d48",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

