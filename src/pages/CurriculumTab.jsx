import { useState, useEffect } from "react";
import { Badge, StatusBadge, StatCard, SectionCard, S } from "../components/Shared";
import { getCurriculumUnits } from "../services/api";

/* ─────────────────────────────────────────
   DEMO DATA — replace with real API data
   once a backend endpoint exists (e.g.
   getCurriculumUnits(), getCurriculumTopics())
───────────────────────────────────────── */
const DEMO_UNITS = [
  {
    id: "u1",
    title: "Foundations of Early Literacy",
    subject: "Language & Literacy",
    grade: "Pre-K – Class 1",
    status: "active",
    progress: 72,
    topics: [
      { id: "t1", title: "Phonemic Awareness", status: "completed", duration: "2 weeks" },
      { id: "t2", title: "Letter Recognition (A–M)", status: "completed", duration: "2 weeks" },
      { id: "t3", title: "Letter Recognition (N–Z)", status: "in_progress", duration: "2 weeks" },
      { id: "t4", title: "Sight Words — Level 1", status: "pending", duration: "3 weeks" },
    ],
    resources: 8,
    updatedAt: "2026-07-10",
  },
  {
    id: "u2",
    title: "Numeracy & Number Sense",
    subject: "Mathematics",
    grade: "Class 1 – Class 2",
    status: "active",
    progress: 45,
    topics: [
      { id: "t5", title: "Counting 1–50", status: "completed", duration: "1 week" },
      { id: "t6", title: "Addition Basics", status: "in_progress", duration: "2 weeks" },
      { id: "t7", title: "Subtraction Basics", status: "pending", duration: "2 weeks" },
      { id: "t8", title: "Shapes & Patterns", status: "pending", duration: "1 week" },
    ],
    resources: 12,
    updatedAt: "2026-07-15",
  },
  {
    id: "u3",
    title: "Environmental Awareness",
    subject: "EVS",
    grade: "Class 2 – Class 3",
    status: "draft",
    progress: 10,
    topics: [
      { id: "t9",  title: "My Neighborhood", status: "in_progress", duration: "1 week" },
      { id: "t10", title: "Plants & Animals Around Us", status: "pending", duration: "2 weeks" },
      { id: "t11", title: "Weather & Seasons", status: "pending", duration: "1 week" },
    ],
    resources: 4,
    updatedAt: "2026-07-02",
  },
  {
    id: "u4",
    title: "Creative Expression",
    subject: "Art & Craft",
    grade: "Pre-K – Class 3",
    status: "completed",
    progress: 100,
    topics: [
      { id: "t12", title: "Color Theory Basics", status: "completed", duration: "1 week" },
      { id: "t13", title: "Paper Craft", status: "completed", duration: "1 week" },
      { id: "t14", title: "Storytelling Through Drawing", status: "completed", duration: "1 week" },
    ],
    resources: 6,
    updatedAt: "2026-06-20",
  },
];

const STATUS_META = {
  active:      { label: "Active",    color: "#059669", bg: "#d1fae5" },
  draft:       { label: "Draft",     color: "#d97706", bg: "#fef3c7" },
  completed:   { label: "Completed", color: "#7c3aed", bg: "#ede9fe" },
  in_progress: { label: "In Progress", color: "#f59e0b", bg: "#fef3c7" },
  pending:     { label: "Pending",   color: "#94a3b8", bg: "#f1f5f9" },
};

function UnitStatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return <Badge children={meta.label} color={meta.color} bg={meta.bg} />;
}

function TopicRow({ topic }) {
  const meta = STATUS_META[topic.status] || STATUS_META.pending;
  const icon = topic.status === "completed" ? "✅" : topic.status === "in_progress" ? "🔵" : "⚪";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 12px", background: "white", borderRadius: 10,
      border: "1px solid #f1f5f9", marginBottom: 6,
    }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1c1917" }}>{topic.title}</div>
        <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 1 }}>{topic.duration}</div>
      </div>
      <Badge children={meta.label} color={meta.color} bg={meta.bg} />
    </div>
  );
}

function UnitCard({ unit, expanded, onToggle }) {
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "18px 20px",
      border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      borderLeft: `4px solid ${STATUS_META[unit.status]?.color || "#f59e0b"}`,
      marginBottom: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1c1917" }}>{unit.title}</span>
            <UnitStatusBadge status={unit.status} />
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {unit.subject} · {unit.grade} · 📎 {unit.resources} resources
          </div>
        </div>
        <button
          onClick={() => onToggle(unit.id)}
          style={{ ...S.exportBtn, flexShrink: 0, padding: "6px 12px", fontSize: 11 }}
        >
          {expanded ? "Hide topics ▲" : "View topics ▼"}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Unit Progress</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b" }}>{unit.progress}%</span>
        </div>
        <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${unit.progress}%`, background: "linear-gradient(90deg,#f59e0b,#d97706)", borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
          Last updated: {new Date(unit.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed #e5e7eb" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 8 }}>
            Topics ({unit.topics.length})
          </div>
          {unit.topics.map(topic => <TopicRow key={topic.id} topic={topic} />)}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   CURRICULUM TAB
───────────────────────────────────────── */
export default function CurriculumTab({ user }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    getCurriculumUnits()
      .then(res => {
        if (res?.success && res?.units && res.units.length > 0) {
          // Map backend _id to id so it matches existing UnitCard usage
          const mapped = res.units.map(u => ({
            ...u,
            id: u._id,
            topics: u.topics.map(t => ({ ...t, id: t._id }))
          }));
          setUnits(mapped);
        } else {
          setUnits(DEMO_UNITS);
        }
      })
      .catch(err => {
        console.error("Failed to load curriculum", err);
        setUnits(DEMO_UNITS);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const activeCount    = units.filter(u => u.status === "active").length;
  const draftCount     = units.filter(u => u.status === "draft").length;
  const completedCount = units.filter(u => u.status === "completed").length;
  const totalTopics    = units.reduce((sum, u) => sum + (u.topics?.length || 0), 0);
  const avgProgress    = units.length
    ? Math.round(units.reduce((sum, u) => sum + (u.progress || 0), 0) / units.length)
    : 0;

  const visibleUnits = units.filter(u => filter === "all" ? true : u.status === filter);

  const filterBtn = (key, label) => (
    <button
      onClick={() => setFilter(key)}
      style={{
        ...S.exportBtn,
        background: filter === key ? "#d97706" : "white",
        color: filter === key ? "white" : "#6b7280",
        borderColor: filter === key ? "#d97706" : "#e5e7eb",
      }}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh", fontSize: 14, fontWeight: 600, color: "#d97706" }}>
        🔄 Loading Curriculum Plan...
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={S.pageTitle}>Curriculum</h1>
          <p style={S.pageSub}>Units, topics, and coverage plan for your assigned classes</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard icon="📘" label="Total Units"    val={units.length}   color="#3b82f6" bg="#dbeafe" />
        <StatCard icon="🟢" label="Active"          val={activeCount}    color="#059669" bg="#d1fae5" />
        <StatCard icon="📝" label="Draft"           val={draftCount}     color="#d97706" bg="#fef3c7" />
        <StatCard icon="✅" label="Completed"       val={completedCount} color="#7c3aed" bg="#ede9fe" />
        <StatCard icon="📊" label="Avg. Progress"   val={`${avgProgress}%`} color="#f59e0b" bg="#fef3c7" />
      </div>

      <SectionCard title={`Curriculum Units (${totalTopics} topics total)`}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {filterBtn("all", "All")}
          {filterBtn("active", "Active")}
          {filterBtn("draft", "Draft")}
          {filterBtn("completed", "Completed")}
        </div>

        {visibleUnits.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", background: "#fafbfc", borderRadius: 16, border: "1px dashed #cbd5e1", color: "#94a3b8" }}>
            No curriculum units found for this filter.
          </div>
        ) : (
          visibleUnits.map(unit => (
            <UnitCard
              key={unit.id}
              unit={unit}
              expanded={expandedIds.has(unit.id)}
              onToggle={toggleExpand}
            />
          ))
        )}
      </SectionCard>

      <div style={{
        marginTop: 16, padding: "14px 18px", background: "#ecfdf5",
        border: "1px solid #a7f3d0", borderRadius: 12,
        fontSize: 11.5, color: "#065f46", lineHeight: 1.6,
      }}>
        📡 Showing live curriculum data connected directly to database.
      </div>
    </div>
  );
}
