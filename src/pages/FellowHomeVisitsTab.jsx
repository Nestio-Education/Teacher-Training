import { useState, useEffect, useCallback } from "react";
import { StatCard, SectionCard, StatusBadge } from "../components/Shared";
import {
  getFellowHaalsMetrics,
  getHaalsVisits,
  enrollHaalsChild,
  getHaalsEnrolledChildren,
  updateHaalsChild,
  deleteHaalsChild,
  createQuickHaalsVisit
} from "../services/api";

const ENROLLMENT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc148-klphsWJN2kX9Kym4ORljrpfd5v30vNJg56V-JTmz0xw/viewform";
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc148-klphsWJN2kX9Kym4ORljrpfd5v30vNJg56V-JTmz0xw/viewform";

export default function FellowHomeVisitsTab({ user, setToast }) {
  const [activeSubTab, setActiveSubTab] = useState("overview"); // "overview" | "roster"
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

  // Enrolled Children State
  const [enrolledChildren, setEnrolledChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [childSearch, setChildSearch] = useState("");
  const [debouncedChildSearch, setDebouncedChildSearch] = useState("");
  const [childProgramFilter, setChildProgramFilter] = useState("all");
  const [childPage, setChildPage] = useState(1);
  const [childLimit] = useState(10);
  const [totalChildren, setTotalChildren] = useState(0);
  const [totalChildPages, setTotalChildPages] = useState(1);

  // Modals State
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [showSuccessPrompt, setShowSuccessPrompt] = useState(null); // Newly enrolled child object
  const [showQuickVisitModal, setShowQuickVisitModal] = useState(null); // Child object for quick visit
  const [savingQuickVisit, setSavingQuickVisit] = useState(false);
  const [showGoogleFormModal, setShowGoogleFormModal] = useState(null); // Child object for Google Form guide

  // Form State for Enrollment
  const initialEnrollForm = {
    fullName: "",
    age: "",
    ageGroup: "3-5 years",
    gender: "Male",
    village: "",
    program: "HAALS",
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "Mother",
    address: "",
    notes: ""
  };
  const [enrollForm, setEnrollForm] = useState(initialEnrollForm);

  // Form State for Quick Visit
  const initialQuickVisitForm = {
    visitDate: new Date().toISOString().split("T")[0],
    activityName: "Cognitive Shapes & Sorting",
    domain: "Cognitive",
    milestoneStatus: 4,
    engagementLevel: "Highly Engaged",
    caregiverObserved: true,
    caregiverParticipated: true,
    challenges: "None",
    remarks: "Good engagement during the session."
  };
  const [quickVisitForm, setQuickVisitForm] = useState(initialQuickVisitForm);

  // Debounce search input for visits
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce search input for children
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedChildSearch(childSearch);
      setChildPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [childSearch]);

  // Load KPI Metrics
  const loadMetrics = useCallback(async () => {
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
  }, [setToast]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

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
    if (activeSubTab === "overview") {
      fetchVisits();
    }
  }, [activeSubTab, fetchVisits]);

  // Load Enrolled Children
  const fetchChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const res = await getHaalsEnrolledChildren({
        page: childPage,
        limit: childLimit,
        search: debouncedChildSearch,
        program: childProgramFilter !== "all" ? childProgramFilter : undefined
      });
      if (res.success) {
        setEnrolledChildren(res.children || []);
        setTotalChildren(res.pagination?.totalChildren || 0);
        setTotalChildPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load enrolled children", err);
      setToast?.({ msg: "Failed to load children list.", type: "error" });
    } finally {
      setLoadingChildren(false);
    }
  }, [childPage, childLimit, debouncedChildSearch, childProgramFilter, setToast]);

  useEffect(() => {
    if (activeSubTab === "roster") {
      fetchChildren();
    }
  }, [activeSubTab, fetchChildren]);

  // Handle Enroll Child Submit
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollForm.fullName.trim()) {
      setToast?.({ msg: "Please enter child's name.", type: "error" });
      return;
    }

    setEnrolling(true);
    try {
      if (editingChild) {
        const res = await updateHaalsChild(editingChild._id, enrollForm);
        if (res.success) {
          setToast?.({ msg: "Child information updated successfully!", type: "success" });
          setShowEnrollModal(false);
          setEditingChild(null);
          fetchChildren();
        }
      } else {
        const res = await enrollHaalsChild(enrollForm);
        if (res.success) {
          setToast?.({ msg: `Child "${enrollForm.fullName}" enrolled successfully!`, type: "success" });
          setShowEnrollModal(false);
          const newChildObj = res.child;
          setEnrollForm(initialEnrollForm);
          fetchChildren();
          loadMetrics();
          // Prompt to record first home visit
          setShowSuccessPrompt(newChildObj);
        }
      }
    } catch (err) {
      console.error("Enrollment failed", err);
      setToast?.({ msg: err.message || "Failed to enroll child.", type: "error" });
    } finally {
      setEnrolling(false);
    }
  };

  // Handle Quick Visit Submit
  const handleQuickVisitSubmit = async (e) => {
    e.preventDefault();
    if (!showQuickVisitModal) return;

    setSavingQuickVisit(true);
    try {
      const payload = {
        childId: showQuickVisitModal._id,
        childName: showQuickVisitModal.fullName,
        ageGroup: showQuickVisitModal.ageGroup || `${showQuickVisitModal.age || 3} years`,
        village: showQuickVisitModal.village,
        program: showQuickVisitModal.program || "HAALS",
        visitDate: quickVisitForm.visitDate,
        activityName: quickVisitForm.activityName,
        domain: [quickVisitForm.domain],
        milestoneStatus: Number(quickVisitForm.milestoneStatus),
        engagementLevel: quickVisitForm.engagementLevel,
        caregiverObserved: quickVisitForm.caregiverObserved,
        caregiverParticipated: quickVisitForm.caregiverParticipated,
        challenges: quickVisitForm.challenges !== "None" ? [quickVisitForm.challenges] : [],
        remarks: quickVisitForm.remarks
      };

      const res = await createQuickHaalsVisit(payload);
      if (res.success) {
        setToast?.({ msg: `Visit observation recorded for ${showQuickVisitModal.fullName}!`, type: "success" });
        setShowQuickVisitModal(null);
        setQuickVisitForm(initialQuickVisitForm);
        fetchVisits();
        fetchChildren();
        loadMetrics();
      }
    } catch (err) {
      console.error("Quick visit submission failed", err);
      setToast?.({ msg: err.message || "Failed to record visit.", type: "error" });
    } finally {
      setSavingQuickVisit(false);
    }
  };

  // Switch to logs and filter by child
  const handleViewChildLogs = (childName) => {
    setActiveSubTab("overview");
    setSearch(childName);
    setDebouncedSearch(childName);
    setPage(1);
  };

  // Open Edit Child
  const handleOpenEditChild = (child) => {
    setEditingChild(child);
    setEnrollForm({
      fullName: child.fullName || "",
      age: child.age || "",
      ageGroup: child.ageGroup || "3-5 years",
      gender: child.gender || "Male",
      village: child.village || "",
      program: child.program || "HAALS",
      guardianName: child.guardianName || "",
      guardianPhone: child.guardianPhone || "",
      guardianRelation: child.guardianRelation || "Mother",
      address: child.address || "",
      notes: child.notes || ""
    });
    setShowEnrollModal(true);
  };

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
        marginBottom: 20,
        background: "linear-gradient(135deg, #fdf2f8 0%, #fff1f2 50%, #fef2f2 100%)",
        padding: "20px 24px",
        borderRadius: 16,
        border: "1px solid #fecdd3",
        gap: 16
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 26 }}>🏠</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#881337", margin: 0 }}>
              HAALS Home Visit System & Child Management
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#9f1239", maxWidth: 680, lineHeight: 1.5 }}>
            Manage child enrollments, track developmental milestone ratings, review caregiver engagement, and record observations directly or via Google Form sync.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a
            href={ENROLLMENT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "9px 16px",
              background: "linear-gradient(135deg, #e11d48, #be123c)",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 4px 6px -1px rgba(225, 29, 72, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none"
            }}
          >
            <span>📝</span> Enroll via Google Form ↗
          </a>

          <button
            onClick={() => {
              setEditingChild(null);
              setEnrollForm(initialEnrollForm);
              setShowEnrollModal(true);
            }}
            style={{
              padding: "9px 15px",
              background: "#ffffff",
              border: "1px solid #fda4af",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#e11d48",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>➕</span> Add Child (Direct)
          </button>

          <button
            onClick={() => setShowGoogleFormModal({ fullName: "Home Visit Participant" })}
            style={{
              padding: "9px 15px",
              background: "#ffffff",
              border: "1px solid #fda4af",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#e11d48",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>📝</span> Google Form Visit
          </button>

          <button
            onClick={() => {
              setLoadingMetrics(true);
              loadMetrics();
              if (activeSubTab === "overview") fetchVisits();
              if (activeSubTab === "roster") fetchChildren();
            }}
            style={{
              padding: "9px 14px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
        <button
          onClick={() => setActiveSubTab("overview")}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: activeSubTab === "overview" ? "#e11d48" : "transparent",
            color: activeSubTab === "overview" ? "#ffffff" : "#64748b",
            transition: "all 0.15s ease"
          }}
        >
          <span>📊</span> Observations & Analytics ({totalVisits})
        </button>

        <button
          onClick={() => {
            setActiveSubTab("roster");
            fetchChildren();
          }}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: activeSubTab === "roster" ? "#e11d48" : "transparent",
            color: activeSubTab === "roster" ? "#ffffff" : "#64748b",
            transition: "all 0.15s ease"
          }}
        >
          <span>👶</span> Enrolled Children Roster ({totalChildren || "Directory"})
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW & OBSERVATION LOGS */}
      {activeSubTab === "overview" && (
        <div>
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
                  <option value="HAALS">HAALS</option>
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
        </div>
      )}

      {/* SUB-TAB 2: ENROLLED CHILDREN DIRECTORY */}
      {activeSubTab === "roster" && (
        <SectionCard title="👶 Enrolled Children Roster for Home Visits">
          {/* Controls Bar */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
            background: "#f8fafc",
            padding: "14px 18px",
            borderRadius: 12,
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ flex: "1 1 260px", position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: 9, color: "#94a3b8", fontSize: 14 }}>🔍</span>
              <input
                type="text"
                placeholder="Search child by name, village, guardian, phone..."
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

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select
                value={childProgramFilter}
                onChange={(e) => { setChildProgramFilter(e.target.value); setChildPage(1); }}
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
                <option value="HAALS">HAALS</option>
                <option value="PTP">PTP</option>
                <option value="School Readiness">School Readiness</option>
                <option value="FLN">FLN</option>
                <option value="Early Literacy">Early Literacy</option>
              </select>

              <a
                href={ENROLLMENT_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 14px",
                  background: "#e11d48",
                  color: "#ffffff",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>📝</span> Open Google Form ↗
              </a>

              <button
                onClick={() => {
                  setEditingChild(null);
                  setEnrollForm(initialEnrollForm);
                  setShowEnrollModal(true);
                }}
                style={{
                  padding: "8px 14px",
                  background: "#ffffff",
                  color: "#e11d48",
                  border: "1px solid #fda4af",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>➕</span> Direct Entry
              </button>
            </div>
          </div>

          {/* Children List */}
          {loadingChildren ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 13 }}>
              🔄 Loading enrolled children...
            </div>
          ) : enrolledChildren.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", background: "#fdf2f8", borderRadius: 12, border: "1px dashed #fbcfe8" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👶</div>
              <h3 style={{ margin: "0 0 6px 0", color: "#881337", fontSize: 16 }}>No Enrolled Children Found</h3>
              <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#9f1239" }}>
                Enroll children to begin tracking their home visits and developmental milestone progress.
              </p>
              <button
                onClick={() => {
                  setEditingChild(null);
                  setEnrollForm(initialEnrollForm);
                  setShowEnrollModal(true);
                }}
                style={{
                  padding: "9px 18px",
                  background: "#e11d48",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ➕ Enroll First Child
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b", fontWeight: 700, background: "#f8fafc" }}>
                    <th style={{ padding: "10px 12px" }}>Child Name</th>
                    <th style={{ padding: "10px 12px" }}>Age Group</th>
                    <th style={{ padding: "10px 12px" }}>Village / Area</th>
                    <th style={{ padding: "10px 12px" }}>Program</th>
                    <th style={{ padding: "10px 12px" }}>Guardian Contact</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Visits Logged</th>
                    <th style={{ padding: "10px 12px" }}>Last Visit</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
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
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fff1f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 12px", fontWeight: 700, color: "#0f172a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#fbcfe8", color: "#9f1239", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>
                            {child.fullName ? child.fullName.charAt(0).toUpperCase() : "C"}
                          </span>
                          <div>
                            <div>{child.fullName}</div>
                            {child.gender && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{child.gender}</span>}
                          </div>
                        </div>
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
                        <div>{child.guardianName || "—"} <span style={{ fontSize: 11, color: "#94a3b8" }}>({child.guardianRelation || "Parent"})</span></div>
                        {child.guardianPhone && (
                          <a href={`tel:${child.guardianPhone}`} style={{ fontSize: 11, color: "#0284c7", textDecoration: "none", fontWeight: 600 }}>
                            📞 {child.guardianPhone}
                          </a>
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
                      <td style={{ padding: "12px 12px", color: "#64748b", whiteSpace: "nowrap" }}>
                        {child.lastVisitDate ? (
                          <div>
                            <div>{new Date(child.lastVisitDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                            {child.lastScore && <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700 }}>Score: {child.lastScore}/5</div>}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>No visits yet</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            onClick={() => setShowGoogleFormModal(child)}
                            title="Record Home Visit via Google Form"
                            style={{
                              padding: "5px 9px",
                              borderRadius: 6,
                              border: "1px solid #fda4af",
                              background: "#fff1f2",
                              color: "#e11d48",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            📝 Visit Form
                          </button>

                          <button
                            onClick={() => {
                              setShowQuickVisitModal(child);
                              setQuickVisitForm({
                                ...initialQuickVisitForm,
                                activityName: child.program === "PTP" ? "PTP Weekly Activity" : "Structured Cognitive Activity"
                              });
                            }}
                            title="In-Portal Quick Visit Logger"
                            style={{
                              padding: "5px 9px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#0284c7",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            ⚡ Quick Log
                          </button>

                          <button
                            onClick={() => handleViewChildLogs(child.fullName)}
                            title="View all observations for this child"
                            style={{
                              padding: "5px 9px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#475569",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            📜 Logs
                          </button>

                          <button
                            onClick={() => handleOpenEditChild(child)}
                            title="Edit child details"
                            style={{
                              padding: "5px 8px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#64748b",
                              fontSize: 11,
                              cursor: "pointer"
                            }}
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Child Pagination Footer */}
          {totalChildren > 0 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 16,
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

      {/* ── MODAL 1: ENROLL / EDIT CHILD MODAL ── */}
      {showEnrollModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
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
            maxWidth: 600,
            width: "100%",
            maxHeight: "92vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "18px 24px",
              background: "linear-gradient(135deg, #fdf2f8, #fff1f2)",
              borderBottom: "1px solid #fecdd3",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#881337" }}>
                  {editingChild ? "✏️ Edit Enrolled Child" : "👶 Enroll New Child for Home Visits"}
                </h3>
                <div style={{ fontSize: 12, color: "#9f1239", marginTop: 2 }}>
                  Register child details into database for automatic Google Form linkage.
                </div>
              </div>
              <button
                onClick={() => { setShowEnrollModal(false); setEditingChild(null); }}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#9f1239" }}
              >
                ✕
              </button>
            </div>

            {!editingChild && (
              <div style={{
                margin: "14px 24px 0",
                padding: "10px 14px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 8,
                fontSize: 12,
                color: "#1e40af",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>💡 You can also enroll directly using the official Google Form:</span>
                <a
                  href={ENROLLMENT_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#2563eb",
                    fontWeight: 700,
                    textDecoration: "underline",
                    cursor: "pointer"
                  }}
                >
                  Open Google Form ↗
                </a>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleEnrollSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
              {/* Full Name */}
              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                  Child Full Name (Marathi or English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma / अन्वित धागे"
                  value={enrollForm.fullName}
                  onChange={(e) => setEnrollForm({ ...enrollForm, fullName: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              {/* Age & Age Group & Gender */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Age (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="e.g. 3"
                    value={enrollForm.age}
                    onChange={(e) => setEnrollForm({ ...enrollForm, age: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Age Group</label>
                  <select
                    value={enrollForm.ageGroup}
                    onChange={(e) => setEnrollForm({ ...enrollForm, ageGroup: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#ffffff" }}
                  >
                    <option value="1-1.5 years">1 - 1.5 years</option>
                    <option value="1.5-2.5 years">1.5 - 2.5 years</option>
                    <option value="2.5-3 years">2.5 - 3 years</option>
                    <option value="3-5 years">3 - 5 years</option>
                    <option value="5-6 years">5 - 6 years</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Gender</label>
                  <select
                    value={enrollForm.gender}
                    onChange={(e) => setEnrollForm({ ...enrollForm, gender: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#ffffff" }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Village & Program */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Village / Area / Center</label>
                  <input
                    type="text"
                    placeholder="e.g. Khed, Shivaji Nagar"
                    value={enrollForm.village}
                    onChange={(e) => setEnrollForm({ ...enrollForm, village: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Program</label>
                  <select
                    value={enrollForm.program}
                    onChange={(e) => setEnrollForm({ ...enrollForm, program: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#ffffff" }}
                  >
                    <option value="HAALS">HAALS</option>
                    <option value="PTP">PTP (Parent-Teacher-Partner)</option>
                    <option value="School Readiness">School Readiness</option>
                    <option value="FLN">FLN</option>
                    <option value="Early Literacy">Early Literacy</option>
                  </select>
                </div>
              </div>

              {/* Parent / Guardian Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Guardian Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunita Sharma"
                    value={enrollForm.guardianName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, guardianName: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Relation</label>
                  <select
                    value={enrollForm.guardianRelation}
                    onChange={(e) => setEnrollForm({ ...enrollForm, guardianRelation: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#ffffff" }}
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={enrollForm.guardianPhone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, guardianPhone: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Address / Notes */}
              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Home Address / Landmark</label>
                <input
                  type="text"
                  placeholder="House number, landmark, or street"
                  value={enrollForm.address}
                  onChange={(e) => setEnrollForm({ ...enrollForm, address: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Initial Notes / Baseline Observation</label>
                <textarea
                  rows={2}
                  placeholder="Any developmental baseline notes, learning interests, or family background..."
                  value={enrollForm.notes}
                  onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => { setShowEnrollModal(false); setEditingChild(null); }}
                  style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#e11d48",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: enrolling ? "not-allowed" : "pointer"
                  }}
                >
                  {enrolling ? "Saving..." : (editingChild ? "Update Child Details" : "Save & Enroll Child")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: SUCCESS ENROLLMENT PROMPT (Record Visit Trigger) ── */}
      {showSuccessPrompt && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(5px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10000,
          padding: 20
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 20,
            maxWidth: 520,
            width: "100%",
            padding: "28px 24px",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
            border: "1px solid #fecdd3"
          }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
            <h2 style={{ margin: "0 0 8px 0", color: "#881337", fontSize: 20, fontWeight: 800 }}>
              Child Successfully Enrolled!
            </h2>
            <p style={{ margin: "0 0 18px 0", fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
              <strong>{showSuccessPrompt.fullName}</strong> is now registered in the database.
              Future Google Form submissions for this child will automatically link to their profile!
            </p>

            <div style={{ background: "#fff1f2", padding: "14px 18px", borderRadius: 12, border: "1px solid #fecdd3", marginBottom: 20, textAlign: "left", fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: "#9f1239", marginBottom: 4 }}>👶 Child Details:</div>
              <div>• <strong>Name:</strong> {showSuccessPrompt.fullName}</div>
              <div>• <strong>Age Group:</strong> {showSuccessPrompt.ageGroup || "3-5 years"}</div>
              <div>• <strong>Village / Area:</strong> {showSuccessPrompt.village || "—"}</div>
              <div>• <strong>Program:</strong> {showSuccessPrompt.program || "HAALS"}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => {
                  const child = showSuccessPrompt;
                  setShowSuccessPrompt(null);
                  setShowGoogleFormModal(child);
                }}
                style={{
                  padding: "11px 18px",
                  background: "linear-gradient(135deg, #e11d48, #be123c)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                <span>📝</span> Record Home Visit via Google Form
              </button>

              <button
                onClick={() => {
                  const child = showSuccessPrompt;
                  setShowSuccessPrompt(null);
                  setShowQuickVisitModal(child);
                }}
                style={{
                  padding: "10px 18px",
                  background: "#f0f9ff",
                  color: "#0369a1",
                  border: "1px solid #bae6fd",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                ⚡ In-Portal Quick Visit Logger
              </button>

              <button
                onClick={() => setShowSuccessPrompt(null)}
                style={{
                  padding: "9px 18px",
                  background: "transparent",
                  color: "#64748b",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                Done (Back to List)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: GOOGLE FORM VISIT GUIDE MODAL ── */}
      {showGoogleFormModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10000,
          padding: 20
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 16,
            maxWidth: 550,
            width: "100%",
            padding: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#881337", display: "flex", alignItems: "center", gap: 8 }}>
                <span>📝</span> Record Home Visit for {showGoogleFormModal.fullName}
              </h3>
              <button
                onClick={() => setShowGoogleFormModal(null)}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 18, fontSize: 13, color: "#334155" }}>
              <p style={{ margin: "0 0 10px 0", fontWeight: 700, color: "#0f172a" }}>
                📋 Instructions for Google Form:
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Make sure to enter Child Name as: <strong style={{ color: "#e11d48" }}>{showGoogleFormModal.fullName}</strong></li>
                <li>Facilitator Name: <strong>{user?.name || "Your Registered Name"}</strong></li>
                <li>Once submitted, the sheet webhook will automatically sync the visit into this dashboard!</li>
              </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowGoogleFormModal(null)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
              >
                Close
              </button>
              <a
                href={GOOGLE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowGoogleFormModal(null)}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  background: "#e11d48",
                  color: "#ffffff",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                🚀 Open Google Form in New Tab ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: IN-PORTAL QUICK VISIT LOGGER ── */}
      {showQuickVisitModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10000,
          padding: 20
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 16,
            maxWidth: 580,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0369a1", display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚡</span> Quick Home Visit Logger: {showQuickVisitModal.fullName}
              </h3>
              <button
                onClick={() => setShowQuickVisitModal(null)}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickVisitSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Date of Visit *</label>
                  <input
                    type="date"
                    required
                    value={quickVisitForm.visitDate}
                    onChange={(e) => setQuickVisitForm({ ...quickVisitForm, visitDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Domain</label>
                  <select
                    value={quickVisitForm.domain}
                    onChange={(e) => setQuickVisitForm({ ...quickVisitForm, domain: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff" }}
                  >
                    <option value="Cognitive">Cognitive Development</option>
                    <option value="Language & Communication">Language & Communication</option>
                    <option value="Physical & Motor">Physical & Motor</option>
                    <option value="Socio-Emotional">Socio-Emotional</option>
                    <option value="Creative Arts">Creative Arts</option>
                    <option value="Health & Nutrition">Health & Nutrition</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Activity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Number Line Stepping, Story Retelling"
                  value={quickVisitForm.activityName}
                  onChange={(e) => setQuickVisitForm({ ...quickVisitForm, activityName: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Milestone Score (1–5)</label>
                  <select
                    value={quickVisitForm.milestoneStatus}
                    onChange={(e) => setQuickVisitForm({ ...quickVisitForm, milestoneStatus: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff" }}
                  >
                    <option value={5}>5 - Mastered / Excellent</option>
                    <option value={4}>4 - Emerging / Good</option>
                    <option value={3}>3 - Developing / Moderate</option>
                    <option value={2}>2 - Beginning / Needs Support</option>
                    <option value={1}>1 - Attempted</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Child Engagement</label>
                  <select
                    value={quickVisitForm.engagementLevel}
                    onChange={(e) => setQuickVisitForm({ ...quickVisitForm, engagementLevel: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff" }}
                  >
                    <option value="Highly Engaged">Highly Engaged</option>
                    <option value="Moderately Engaged">Moderately Engaged</option>
                    <option value="Passive / Distracted">Passive / Distracted</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 20, background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={quickVisitForm.caregiverObserved}
                    onChange={(e) => setQuickVisitForm({ ...quickVisitForm, caregiverObserved: e.target.checked })}
                  />
                  Caregiver Observed
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={quickVisitForm.caregiverParticipated}
                    onChange={(e) => setQuickVisitForm({ ...quickVisitForm, caregiverParticipated: e.target.checked })}
                  />
                  Caregiver Participated / Assisted
                </label>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Facilitator Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes about child response, parent cooperation, next steps..."
                  value={quickVisitForm.remarks}
                  onChange={(e) => setQuickVisitForm({ ...quickVisitForm, remarks: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowQuickVisitModal(null)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuickVisit}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#0284c7",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: savingQuickVisit ? "not-allowed" : "pointer"
                  }}
                >
                  {savingQuickVisit ? "Saving..." : "Save Observation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: COMPREHENSIVE VISIT DETAILS MODAL ── */}
      {selectedVisit && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div><strong>Facilitator:</strong> {selectedVisit.facilitatorName}</div>
                <div><strong>Village / Area:</strong> {selectedVisit.village || "—"}</div>
                <div><strong>Program Enrolled:</strong> {selectedVisit.program}</div>
                <div><strong>Age Group:</strong> {selectedVisit.childAge || "—"}</div>
                <div><strong>Child Present:</strong> {selectedVisit.childPresent !== false ? "✓ Yes" : "✗ No"}</div>
                <div><strong>Caregiver Available:</strong> {selectedVisit.caregiverAvailable !== false ? "✓ Yes" : "✗ No"}</div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>🏡 Home Environment & Resources:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#475569" }}>
                  <span>Adequate Space: <strong>{selectedVisit.spaceAdequate !== false ? "Yes" : "No"}</strong></span>
                  <span>Household Items as Toys: <strong>{selectedVisit.householdItemsUsable !== false ? "Yes" : "No"}</strong></span>
                  <span>Environment Rating: <strong>{selectedVisit.homeEnvironmentRating || 4} / 5</strong></span>
                </div>
              </div>

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

              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>🤝 Caregiver Engagement & Practice:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, color: "#475569" }}>
                  <span>Caregiver Observed: <strong>{selectedVisit.caregiverObserved !== false ? "✓ Yes" : "No"}</strong></span>
                  <span>Caregiver Participated: <strong>{selectedVisit.caregiverParticipated !== false ? "✓ Yes" : "No"}</strong></span>
                  <span>Can Repeat at Home: <strong>{selectedVisit.canRepeatAtHome !== false ? "✓ Yes" : "No"}</strong></span>
                  <span>Cooperation Rating: <strong>{selectedVisit.parentCooperationRating || 4} / 5</strong></span>
                </div>
              </div>

              {selectedVisit.remarks && (
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>📝 Facilitator Remarks:</div>
                  <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", color: "#334155", fontStyle: "italic" }}>
                    "{selectedVisit.remarks}"
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", textAlign: "right" }}>
              <button
                onClick={() => setSelectedVisit(null)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#e11d48", color: "#ffffff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
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
