import { useState, useEffect, useMemo } from "react";
import { Badge, StatusBadge, SectionCard } from "../components/Shared";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUS_META = {
  present: { color: "#16a34a", bg: "#dcfce7" },
  absent:  { color: "#dc2626", bg: "#fee2e2" },
  late:    { color: "#d97706", bg: "#fef3c7" },
};

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

function avatarColor(name = "") {
  const palette = ["#6366f1", "#0891b2", "#c026d3", "#ea580c", "#0d9488", "#4f46e5"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function SourceDot({ source }) {
  const map = { geo: "#0ea5e9", manual: "#94a3b8", app: "#8b5cf6" };
  const color = map[source?.toLowerCase()] || "#94a3b8";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
      {source || "—"}
    </span>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div
      style={{
        flex: "1 1 140px",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "16px 18px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: color }} />
      <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.4, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function MentorFellowAttendanceTab({ user, setToast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("spaceece_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/mentor/fellows/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch attendance");
      setRecords(data.attendanceRecords || []);
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return records;
    const q = query.trim().toLowerCase();
    return records.filter((r) => r.teacher?.name?.toLowerCase().includes(q));
  }, [records, query]);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status?.toLowerCase() === "present").length;
    const absent = records.filter((r) => r.status?.toLowerCase() === "absent").length;
    const late = records.filter((r) => r.status?.toLowerCase() === "late").length;
    const rate = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, rate };
  }, [records]);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rowIn { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
        .att-row { animation: rowIn 0.35s ease both; }
        .att-row:hover { background: #f8fafc; }
        .att-search:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>Fellow Attendance</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Daily check-ins logged for the fellows you mentor.
          </p>
        </div>
        <input
          className="att-search"
          type="text"
          placeholder="Search by fellow name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: 14,
            width: 220,
            transition: "box-shadow 0.15s ease, border-color 0.15s ease",
          }}
        />
      </div>

      {!loading && records.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <StatCard label="Total Logs" value={stats.total} color="#6366f1" />
          <StatCard label="Present" value={stats.present} color="#16a34a" />
          <StatCard label="Absent" value={stats.absent} color="#dc2626" />
          <StatCard label="Late" value={stats.late} color="#d97706" />
          <StatCard label="Attendance Rate" value={`${stats.rate}%`} color="#0891b2" sub="present / total logs" />
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
          <div
            style={{
              width: 28,
              height: 28,
              margin: "0 auto 12px",
              border: "3px solid #e2e8f0",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading attendance data...
        </div>
      ) : (
        <SectionCard title="Attendance Logs" icon="📅">
          {filtered.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569" }}>
                    <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.3 }}>Date</th>
                    <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.3 }}>Fellow</th>
                    <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.3 }}>Status</th>
                    <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.3 }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record, i) => {
                    const d = new Date(record.attendanceDate);
                    const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
                    const name = record.teacher?.name || "Unknown";
                    return (
                      <tr key={record._id} className="att-row" style={{ borderBottom: "1px solid #e2e8f0", animationDelay: `${i * 40}ms` }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{d.toLocaleDateString()}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>{weekday}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: avatarColor(name),
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {initials(name)}
                            </div>
                            <span style={{ fontWeight: 500, color: "#0f172a" }}>{name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}><StatusBadge status={record.status} /></td>
                        <td style={{ padding: "12px 16px" }}><SourceDot source={record.source} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
              {query ? (
                <>No fellows match "<strong>{query}</strong>". Try a different name.</>
              ) : (
                "No attendance records found for your fellows."
              )}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
