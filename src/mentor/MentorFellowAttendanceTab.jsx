import { useState, useEffect } from "react";
import { Badge, StatusBadge, SectionCard } from "../components/Shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function MentorFellowAttendanceTab({ user, setToast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("spaceece_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/mentor/fellows/attendance`, {
        headers: { "Authorization": `Bearer ${token}` }
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
  }, []);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 24 }}>Fellow Attendance</h2>
      
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading attendance data...</div>
      ) : (
        <SectionCard title="Attendance Logs" icon="📅">
          {records.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569" }}>
                    <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0" }}>Date</th>
                    <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0" }}>Fellow Name</th>
                    <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0" }}>Status</th>
                    <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0" }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px 16px" }}>{new Date(record.attendanceDate).toLocaleDateString()}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0f172a" }}>{record.teacher?.name}</td>
                      <td style={{ padding: "12px 16px" }}><StatusBadge status={record.status} /></td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 13 }}>{record.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>No attendance records found for your fellows.</div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
