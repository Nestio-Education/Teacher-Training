import { useState, useEffect, useCallback } from "react";
import { StatCard, SectionCard, StatusBadge } from "../components/Shared";
import { getMentorHaalsMetrics, getHaalsVisits, getHaalsEnrolledChildren, triggerHaalsAiReportStub } from "../services/api";

export default function MentorHomeVisitsTab({ user, setToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("overview"); // "overview" | "logs" | "children"
  const [reportingFellowId, setReportingFellowId] = useState(null);

  // Paginated Visit Logs for Mentor
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [totalVisits, setTotalVisits] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Enrolled Children Directory for Mentor
  const [enrolledChildren, setEnrolledChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [childSearch, setChildSearch] = useState("");
  const [debouncedChildSearch, setDebouncedChildSearch] = useState("");
  const [childProgramFilter, setChildProgramFilter] = useState("all");
  const [childFellowFilter, setChildFellowFilter] = useState("all");
  const [childPage, setChildPage] = useState(1);
  const [totalChildren, setTotalChildren] = useState(0);
  const [totalChildPages, setTotalChildPages] = useState(1);

  // Detail Modal
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce child search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedChildSearch(childSearch);
      setChildPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [childSearch]);

  // Load Mentor Rollup Metrics
  const loadMentorMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMentorHaalsMetrics();
      if (res.success) {
        setData(res);
      } else {
        setToast?.({ msg: "Failed to load mentor metrics.", type: "error" });
      }
    } catch (err) {
      console.error("Failed to load mentor metrics", err);
      setToast?.({ msg: err.message || "Failed to load mentor metrics.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [setToast]);

  useEffect(() => {
    loadMentorMetrics();
  }, [loadMentorMetrics]);

  // Load Center-Wide Paginated Visits
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
    if (activeSubTab === "logs") {
      fetchVisits();
    }
  }, [activeSubTab, fetchVisits]);

  // Load Enrolled Children for Mentor
  const fetchChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const res = await getHaalsEnrolledChildren({
        page: childPage,
        limit: 10,
        search: debouncedChildSearch,
        program: childProgramFilter !== "all" ? childProgramFilter : undefined,
        fellowId: childFellowFilter !== "all" ? childFellowFilter : undefined
      });
      if (res.success) {
        setEnrolledChildren(res.children || []);
        setTotalChildren(res.pagination?.totalChildren || 0);
        setTotalChildPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load children", err);
    } finally {
      setLoadingChildren(false);
    }
  }, [childPage, debouncedChildSearch, childProgramFilter, childFellowFilter]);

  useEffect(() => {
    if (activeSubTab === "children") {
      fetchChildren();
    }
  }, [activeSubTab, fetchChildren]);

  const handleGenerateReportStub = async (fellowId, fellowName) => {
    setReportingFellowId(fellowId);
    try {
      const res = await triggerHaalsAiReportStub(fellowId, "Month 1");
      if (res.success) {
        setToast?.({
          msg: `Extension Point Triggered for ${fellowName}! Response: ${res.message}`,
          type: "success"
        });
      } else {
        setToast?.({ msg: "Failed to trigger report extension.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast?.({ msg: err.message || "Failed to trigger AI report stub.", type: "error" });
    } finally {
      setReportingFellowId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "45vh", fontSize: 14, color: "#64748b" }}>
        🔄 Loading Mentor Home Visit Oversight & Rollups...
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalVisits: 0,
    visitsCompleted: 0,
    centerVisitCompletion: 0,
    centerAverageMilestoneScore: 0,
    centerParentParticipationRate: 0,
    flaggedChildrenCount: 0,
    activeFellowsCount: 0
  };

  const fellowComparisonTable = data?.fellowComparisonTable || [];
  const flaggedChildren = data?.flaggedChildren || [];
  const domainDistribution = data?.domainDistribution || [];

  return (
    <div style={{ animation: "fadeIn 0.3s ease", padding: "16px 0" }}>
      {/* Header Banner */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        background: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 50%, #f5d0fe 100%)",
        padding: "20px 24px",
        borderRadius: 16,
        border: "1px solid #f0abfc"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🧭</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#701a75", margin: 0 }}>
              HAALS Mentor Oversight (Home Visits & Child Roster)
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#86198f", maxWidth: 650, lineHeight: 1.5 }}>
            Center-wide home visit coverage, child developmental progress, caregiver engagement trends, and early flags for intervention.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={() => {
              loadMentorMetrics();
              if (activeSubTab === "logs") fetchVisits();
              if (activeSubTab === "children") fetchChildren();
            }}
            style={{
              padding: "8px 14px",
              background: "#ffffff",
              border: "1px solid #e879f9",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              color: "#a21caf",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            🔄 Refresh Rollups
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Centre Visit Completion"
          val={`${kpis.centerVisitCompletion}%`}
          sub={`${kpis.visitsCompleted} completed of ${kpis.totalVisits} logged`}
          color="#f43f5e"
        />
        <StatCard
          label="Avg Milestone Score"
          val={`${kpis.centerAverageMilestoneScore} / 5`}
          sub="Overall child skill progress"
          color="#8b5cf6"
        />
        <StatCard
          label="Caregiver Participation"
          val={`${kpis.centerParentParticipationRate || 85}%`}
          sub="Caregiver involvement rate"
          color="#f59e0b"
        />
        <StatCard
          label="Flagged Children (Attention)"
          val={kpis.flaggedChildrenCount}
          sub="Issues in ≥ 2 visits"
          color="#ef4444"
        />
        <StatCard
          label="Active Field Facilitators"
          val={kpis.activeFellowsCount || fellowComparisonTable.length}
          sub="Logging visits in system"
          color="#10b981"
        />
      </div>

      {/* Sub-Tab Navigation Toggle */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, borderBottom: "2px solid #f1f5f9", paddingBottom: 10 }}>
        <button
          onClick={() => setActiveSubTab("overview")}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: activeSubTab === "overview" ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#f1f5f9",
            color: activeSubTab === "overview" ? "#ffffff" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          👥 Fellow Comparison & Intervention Flags
        </button>

        <button
          onClick={() => setActiveSubTab("logs")}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: activeSubTab === "logs" ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#f1f5f9",
            color: activeSubTab === "logs" ? "#ffffff" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          📋 Center-Wide Visit Log Explorer (All Rows)
        </button>

        <button
          onClick={() => {
            setActiveSubTab("children");
            fetchChildren();
          }}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: activeSubTab === "children" ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#f1f5f9",
            color: activeSubTab === "children" ? "#ffffff" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          👶 Enrolled Children Directory ({totalChildren})
        </button>
      </div>

      {/* View 1: Overview & Fellow Comparison */}
      {activeSubTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
          {/* Per-Fellow Comparison Table */}
          <SectionCard title="Per-Fellow Comparison & Oversight">
            {fellowComparisonTable.length === 0 ? (
              <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: "40px 0" }}>
                No Facilitators or data synchronized yet.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b", fontWeight: 700, background: "#f8fafc" }}>
                      <th style={{ padding: "10px 12px" }}>Facilitator Name</th>
                      <th style={{ padding: "10px 12px" }}>Email</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Scheduled</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Completed</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Completion %</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Avg Score</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Parent Part. %</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Follow-ups</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fellowComparisonTable.map((f, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", color: "#334155" }}>
                        <td style={{ padding: "12px 12px", fontWeight: 700, color: "#0f172a" }}>{f.name}</td>
                        <td style={{ padding: "12px 12px", color: "#64748b" }}>{f.email}</td>
                        <td style={{ padding: "12px 12px", textAlign: "center" }}>{f.visitsScheduled}</td>
                        <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 600 }}>{f.visitsCompleted}</td>
                        <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 700 }}>
                          <span style={{ color: f.completionRate < 70 ? "#dc2626" : "#059669" }}>
                            {f.completionRate}%
                          </span>
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 700 }}>
                          <span style={{ color: f.averageMilestoneScore < 2.5 ? "#dc2626" : "#7c3aed" }}>
                            {f.averageMilestoneScore} / 5
                          </span>
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 600, color: "#f59e0b" }}>
                          {f.parentParticipationRate}%
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 700, color: "#3b82f6" }}>
                          {f.followUpsPending}
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

          {/* Domain Distribution Rollup */}
          {domainDistribution.length > 0 && (
            <SectionCard title="📊 Center-Wide Domain Milestone Rollup">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                {domainDistribution.map((d, idx) => (
                  <div key={idx} style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 12, color: "#334155", marginBottom: 6 }}>
                      <span>{d.domain}</span>
                      <span style={{ color: "#7c3aed" }}>{d.average} / 5</span>
                    </div>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${(d.average / 5) * 100}%`,
                        background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                        borderRadius: 3
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{d.count} session observations</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Children Needing Attention (Flagged Children) */}
          <SectionCard title="🚨 Children Needing Attention (Auto-Flagged Intervention Queue)">
            {flaggedChildren.length === 0 ? (
              <p style={{ fontSize: 13, color: "#059669", textAlign: "center", padding: "30px 0", fontWeight: 600 }}>
                🎉 No children have triggered attention flags in this period.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b", fontWeight: 700, background: "#fff1f2" }}>
                      <th style={{ padding: "10px 12px" }}>Child Name</th>
                      <th style={{ padding: "10px 12px" }}>Assigned Facilitator</th>
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
      )}

      {/* View 2: Center-Wide Paginated Visit Logs Explorer */}
      {activeSubTab === "logs" && (
        <SectionCard title="📋 All Center Home Visit Observation Logs">
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
                placeholder="Search child name, village, facilitator, remarks..."
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
      )}

      {/* View 3: Enrolled Children Directory for Mentor */}
      {activeSubTab === "children" && (
        <SectionCard title="👶 Center Enrolled Children Directory">
          {/* Controls Bar: Search, Filters */}
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
            <div style={{ flex: "1 1 240px", position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: 9, color: "#94a3b8", fontSize: 14 }}>🔍</span>
              <input
                type="text"
                placeholder="Search child by name, village, guardian, program..."
                value={childSearch}
                onChange={(e) => setChildSearch(e.target.value)}
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <select
                value={childFellowFilter}
                onChange={(e) => { setChildFellowFilter(e.target.value); setChildPage(1); }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 12,
                  background: "#ffffff",
                  color: "#334155"
                }}
              >
                <option value="all">All Facilitators / Fellows</option>
                {fellowComparisonTable.map(f => (
                  <option key={f.fellowId} value={f.fellowId}>{f.fellowName}</option>
                ))}
              </select>

              <select
                value={childProgramFilter}
                onChange={(e) => { setChildProgramFilter(e.target.value); setChildPage(1); }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 12,
                  background: "#ffffff",
                  color: "#334155"
                }}
              >
                <option value="all">All Programs</option>
                <option value="HAALS">HAALS</option>
                <option value="PTP">PTP</option>
                <option value="School Readiness">School Readiness</option>
                <option value="FLN">FLN</option>
                <option value="Early Literacy">Early Literacy</option>
              </select>
            </div>
          </div>

          {/* Children Table */}
          {loadingChildren ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 13 }}>
              🔄 Loading enrolled children...
            </div>
          ) : enrolledChildren.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 13 }}>
              No enrolled children found matching your search.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b", fontWeight: 700, background: "#f8fafc" }}>
                    <th style={{ padding: "10px 12px" }}>Child Name</th>
                    <th style={{ padding: "10px 12px" }}>Assigned Facilitator</th>
                    <th style={{ padding: "10px 12px" }}>Age Group</th>
                    <th style={{ padding: "10px 12px" }}>Village / Area</th>
                    <th style={{ padding: "10px 12px" }}>Program</th>
                    <th style={{ padding: "10px 12px" }}>Guardian</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Total Visits</th>
                    <th style={{ padding: "10px 12px" }}>Last Visit Date</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledChildren.map((child) => (
                    <tr
                      key={child._id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        color: "#334155",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 12px", fontWeight: 700, color: "#0f172a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#f3e8ff", color: "#7e22ce", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>
                            {child.fullName ? child.fullName.charAt(0).toUpperCase() : "C"}
                          </span>
                          <div>
                            <div>{child.fullName}</div>
                            {child.gender && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{child.gender}</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 12px", color: "#475569" }}>
                        {child.assignedFellow?.name || "Assigned Fellow"}
                      </td>
                      <td style={{ padding: "12px 12px", color: "#475569" }}>
                        <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {child.ageGroup || (child.age ? `${child.age} yrs` : "3-5 yrs")}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", color: "#475569" }}>
                        {child.village || "—"}
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#0369a1", background: "#e0f2fe" }}>
                          {child.program || "HAALS"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", color: "#475569" }}>
                        <div>{child.guardianName || "—"}</div>
                        {child.guardianPhone && (
                          <div style={{ fontSize: 11, color: "#64748b" }}>📞 {child.guardianPhone}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "center" }}>
                        <span style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 800,
                          background: child.totalVisits > 0 ? "#ecfdf5" : "#fef2f2",
                          color: child.totalVisits > 0 ? "#059669" : "#dc2626",
                          border: child.totalVisits > 0 ? "1px solid #a7f3d0" : "1px solid #fecdd3"
                        }}>
                          {child.totalVisits || 0} Visits
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", color: "#64748b" }}>
                        {child.lastVisitDate ? new Date(child.lastVisitDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>
                        <button
                          onClick={() => {
                            setActiveSubTab("logs");
                            setSearch(child.fullName);
                            setDebouncedSearch(child.fullName);
                            setPage(1);
                          }}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 6,
                            border: "1px solid #e2e8f0",
                            background: "#ffffff",
                            color: "#7c3aed",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          📜 View Visit Logs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalChildren > 0 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 14,
              marginTop: 12,
              borderTop: "1px solid #e2e8f0",
              fontSize: 12,
              color: "#64748b"
            }}>
              <div>Total Enrolled Children: <strong>{totalChildren}</strong></div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  disabled={childPage <= 1}
                  onClick={() => setChildPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: childPage <= 1 ? "#f1f5f9" : "#ffffff",
                    cursor: childPage <= 1 ? "not-allowed" : "pointer"
                  }}
                >
                  ◀ Previous
                </button>
                <span style={{ fontWeight: 700 }}>Page {childPage} of {totalChildPages}</span>
                <button
                  disabled={childPage >= totalChildPages}
                  onClick={() => setChildPage(p => Math.min(totalChildPages, p + 1))}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: childPage >= totalChildPages ? "#f1f5f9" : "#ffffff",
                    cursor: childPage >= totalChildPages ? "not-allowed" : "pointer"
                  }}
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      )}

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

