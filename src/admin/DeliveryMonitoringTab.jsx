import { useState, useEffect, useMemo } from "react";
import { S, StatCard } from "../components/Shared";
import { t } from "../services/i18n";
import { getAdminLessonMonitoring } from "../services/api";

const cardStyle = {
  background: "#fff",
  borderRadius: 14,
  padding: 20,
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "1px solid #f1f5f9",
  marginBottom: 16,
};

const selectStyle = {
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "inherit",
  background: "#fff",
};

export default function DeliveryMonitoringTab({ setToast }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalAssignments: 0, totalConducted: 0, totalPending: 0, conductedPercent: 0 });
  const [loading, setLoading] = useState(true);

  const [filterMentor, setFilterMentor] = useState("all");
  const [filterCenter, setFilterCenter] = useState("all");
  const [filterClass, setFilterClass] = useState("all");

  const showToast = setToast || (() => {});

  useEffect(() => {
    setLoading(true);
    getAdminLessonMonitoring()
      .then(res => {
        setData(res.monitoring || []);
        setSummary(res.summary || { totalAssignments: 0, totalConducted: 0, totalPending: 0, conductedPercent: 0 });
      })
      .catch(err => {
        console.error("Failed to load delivery monitoring:", err);
        showToast({ msg: "Failed to load monitoring data.", type: "error" });
      })
      .finally(() => setLoading(false));
  }, []);

  const filterOptions = useMemo(() => {
    const mentors = new Map();
    const centers = new Map();
    const classes = new Map();

    data.forEach(item => {
      if (item.mentorId && item.mentorId !== "unknown") mentors.set(item.mentorId, item.mentorName);
      if (item.centerId && item.centerId !== "none") centers.set(item.centerId, item.centerName);
      if (item.classId && item.classId !== "none") classes.set(item.classId, item.className);
    });

    return {
      mentors: Array.from(mentors.entries()).map(([id, name]) => ({ id, name })),
      centers: Array.from(centers.entries()).map(([id, name]) => ({ id, name })),
      classes: Array.from(classes.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchMentor = filterMentor === "all" || item.mentorId === filterMentor;
      const matchCenter = filterCenter === "all" || item.centerId === filterCenter;
      const matchClass = filterClass === "all" || item.classId === filterClass;
      return matchMentor && matchCenter && matchClass;
    });
  }, [data, filterMentor, filterCenter, filterClass]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: "pulse 1.5s infinite" }}>📊</div>
          <div style={{ color: "#6b7280", fontSize: 14 }}>Loading delivery stats…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1c1917", margin: "0 0 8px 0" }}>
          📊 Lesson Plan Delivery Monitoring
        </h2>
        <p style={{ color: "#6b7280", margin: 0, fontSize: 14 }}>
          Track execution of assigned lesson plans across all mentors and centers.
        </p>
      </div>

      {/* Global Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Assigned" value={summary.totalAssignments} icon="📌" color="#3b82f6" />
        <StatCard label="Total Conducted" value={summary.totalConducted} icon="✅" color="#10b981" />
        <StatCard label="Pending" value={summary.totalPending} icon="⏳" color="#f59e0b" />
        <StatCard label="Delivery Rate" value={`${summary.conductedPercent}%`} icon="📈" color="#8b5cf6" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select style={selectStyle} value={filterMentor} onChange={e => setFilterMentor(e.target.value)}>
          <option value="all">All Mentors</option>
          {filterOptions.mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select style={selectStyle} value={filterCenter} onChange={e => setFilterCenter(e.target.value)}>
          <option value="all">All Centers</option>
          {filterOptions.centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select style={selectStyle} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="all">All Classes</option>
          {filterOptions.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Grouped Data */}
      {filteredData.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: "#94a3b8", padding: 40 }}>
          No delivery data found for the selected filters.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filteredData.map(group => {
            const pct = group.total > 0 ? Math.round((group.conducted / group.total) * 100) : 0;
            return (
              <div key={`${group.mentorId}-${group.centerId}-${group.classId}`} style={cardStyle}>
                <div style={{ marginBottom: 12, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1c1917", display: "flex", alignItems: "center", gap: 6 }}>
                    👨‍🏫 {group.mentorName}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    📍 {group.centerName} · 👶 {group.className}
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: "#475569" }}>Delivery Progress</span>
                  <span style={{ fontWeight: 700, color: pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#dc2626" }}>
                    {pct}%
                  </span>
                </div>
                
                <div style={{ width: "100%", height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#dc2626", transition: "width 0.3s ease" }} />
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                  <span><strong style={{ color: "#1c1917" }}>{group.conducted}</strong> conducted</span>
                  <span><strong style={{ color: "#1c1917" }}>{group.pending}</strong> pending</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
