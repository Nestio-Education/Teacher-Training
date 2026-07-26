import { useState, useEffect, useMemo } from "react";
import { StatusBadge } from "../components/Shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUS_STYLES = {
  present: { bg: "#d1fae5", color: "#065f46", label: "Present" },
  absent: { bg: "#fee2e2", color: "#dc2626", label: "Absent" },
  late: { bg: "#fef3c7", color: "#92400e", label: "Late" },
  leave: { bg: "#e0e7ff", color: "#4338ca", label: "On Leave" },
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

export default function MentorFellowAttendanceTab({ user, setToast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
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
    return records.filter((r) => {
      const name = (r.teacher?.name || "").toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const stats = useMemo(() => {
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    return { total: records.length, present, absent, late };
  }, [records]);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header banner — matches the "Good morning" hero style */}
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
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>
          📅 Fellow Attendance
        </h1>
        <p style={{ fontSize: 13, opacity: 0.92, margin: "6px 0 0", fontWeight: 600 }}>
          Track daily attendance logs for every fellow assigned to you.
        </p>
      </div>

      {/* Stat summary row */}
      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard icon="📋" label="Total Records" value={stats.total} tint="#f59e0b" />
        <StatCard icon="✅" label="Present" value={stats.present} tint="#10b981" />
        <StatCard icon="⛔" label="Absent" value={stats.absent} tint="#ef4444" />
        <StatCard icon="⏰" label="Late" value={stats.late} tint="#eab308" />
      </div>

      {/* Filters + table card */}
      <div
        style={{
          background: "white",
          borderRadius: 16,
          border: "1px solid #f1f5f9",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            background: "#fffbeb",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: "#92400e", flex: 1, minWidth: 140 }}>
            Attendance Logs
          </div>
          <input
            type="text"
            placeholder="Search by fellow name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #fbbf24",
              fontSize: 12,
              fontWeight: 600,
              outline: "none",
              minWidth: 200,
              fontFamily: "inherit",
              background: "white",
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #fbbf24",
              fontSize: 12,
              fontWeight: 700,
              color: "#92400e",
              outline: "none",
              fontFamily: "inherit",
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="leave">On Leave</option>
          </select>
          <button
            onClick={fetchAttendance}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
              color: "white",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 2px 6px rgba(217,119,6,0.3)",
            }}
          >
            ↻ Refresh
          </button>
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
            <div style={{ fontSize: 13, fontWeight: 600 }}>Loading attendance data…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Fellow Name</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => {
                  const s = STATUS_STYLES[record.status] || { bg: "#f3f4f6", color: "#6b7280", label: record.status || "—" };
                  return (
                    <tr
                      key={record._id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: idx % 2 === 0 ? "white" : "#fffdf7",
                      }}
                    >
                      <td style={tdStyle}>{new Date(record.attendanceDate).toLocaleDateString()}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: "#1c1917" }}>
                        {record.teacher?.name || "—"}
                      </td>
                      <td style={tdStyle}>
                        {STATUS_STYLES[record.status] ? (
                          <span
                            style={{
                              background: s.bg,
                              color: s.color,
                              padding: "4px 12px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 800,
                              display: "inline-block",
                            }}
                          >
                            {s.label}
                          </span>
                        ) : (
                          <StatusBadge status={record.status} />
                        )}
                      </td>
                      <td style={{ ...tdStyle, color: "#9ca3af", fontSize: 12 }}>{record.source || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {search || statusFilter !== "all"
                ? "No records match your filters."
                : "No attendance records found for your fellows."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  padding: "12px 20px",
  borderBottom: "2px solid #fde68a",
  color: "#92400e",
  fontSize: 12,
  fontWeight: 800,
};

const tdStyle = {
  padding: "12px 20px",
  fontSize: 13,
  color: "#374151",
};