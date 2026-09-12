import React, { useState, useEffect } from "react";
import { S, StatusBadge } from "../components/Shared";

const API_BASE_URL = "http://localhost:5000";

function CurriculumTab({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [allPhases, setAllPhases] = useState([]);
  const token = localStorage.getItem("spaceece_auth_token");

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/curriculum/my-curriculum`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        setAllPhases(data.allPhases || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (assignments.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
        <div style={{ fontSize: "40px", marginBottom: "15px" }}>📚</div>
        <h3 style={{ margin: "0 0 10px 0", color: "#374151" }}>No Curriculum Assigned</h3>
        <p>Your mentor has not assigned a curriculum plan to you yet.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={S.pageTitle}>My Curriculum</h2>

      {assignments.map(assignment => {
        const planPhases = allPhases.filter(p => p.plan === assignment.plan._id);
        const activePhaseIndex = planPhases.findIndex(p => p._id === assignment.activePhase._id);

        return (
          <div key={assignment._id} style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0", color: "#1f2937", fontSize: "20px" }}>{assignment.plan.title}</h3>
                <span style={{ fontSize: "13px", color: "#6b7280", background: "#f3f4f6", padding: "4px 8px", borderRadius: "4px" }}>
                  {assignment.plan.durationType === "1yr" ? "1-Year Plan" : "2-Year Plan"}
                </span>
              </div>
            </div>

            <div style={{ position: "relative", marginLeft: "10px" }}>
              <div style={{ position: "absolute", left: "15px", top: 0, bottom: 0, width: "2px", background: "#e5e7eb" }}></div>
              
              {planPhases.map((phase, idx) => {
                const isUnlocked = idx <= activePhaseIndex;
                const isCurrent = idx === activePhaseIndex;

                return (
                  <div key={phase._id} style={{ position: "relative", paddingLeft: "40px", marginBottom: "30px", opacity: isUnlocked ? 1 : 0.6 }}>
                    <div style={{ 
                      position: "absolute", 
                      left: "9px", 
                      top: "5px", 
                      width: "14px", 
                      height: "14px", 
                      borderRadius: "50%", 
                      background: isUnlocked ? "#f97316" : "#e5e7eb", 
                      border: "3px solid #fff", 
                      boxShadow: `0 0 0 1px ${isUnlocked ? "#f97316" : "#d1d5db"}` 
                    }}></div>
                    
                    <div style={{ background: "#fff", padding: "15px", borderRadius: "8px", border: `1px solid ${isCurrent ? "#f97316" : "#e5e7eb"}`, boxShadow: isCurrent ? "0 2px 5px rgba(249,115,22,0.1)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <div>
                          <h4 style={{ margin: "0 0 5px 0", color: "#1f2937", fontSize: "16px" }}>Phase {phase.phaseNumber}: {phase.title}</h4>
                          <div style={{ fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>{phase.semester}</div>
                        </div>
                        {!isUnlocked && (
                          <div style={{ background: "#f3f4f6", color: "#6b7280", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                            🔒 Coming Soon
                          </div>
                        )}
                        {isCurrent && (
                          <div style={{ background: "#fff7ed", color: "#f97316", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", border: "1px solid #ffedd5" }}>
                            Current Phase
                          </div>
                        )}
                      </div>

                      {isUnlocked && phase.topics?.length > 0 && (
                        <div style={{ marginTop: "15px", borderTop: "1px dashed #e5e7eb", paddingTop: "15px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {phase.topics.map((topic, tIdx) => (
                              <div key={tIdx} style={{ fontSize: "13px", background: "#f9fafb", padding: "12px", borderRadius: "6px" }}>
                                <div style={{ fontWeight: "600", color: "#374151", marginBottom: "5px", fontSize: "14px" }}>{topic.title}</div>
                                {topic.description && <div style={{ color: "#4b5563", marginBottom: "10px" }}>{topic.description}</div>}
                                
                                {topic.materials?.length > 0 && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {topic.materials.map((mat, mIdx) => (
                                      <a 
                                        key={mIdx} 
                                        href={mat.fileUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f97316", textDecoration: "none", background: "#fff", padding: "6px 10px", borderRadius: "4px", border: "1px solid #ffedd5" }}
                                      >
                                        <span style={{ textTransform: "uppercase", fontSize: "10px", fontWeight: "bold", background: "#f97316", color: "#fff", padding: "2px 4px", borderRadius: "3px" }}>{mat.type}</span>
                                        {mat.title || "View Material"}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CurriculumTab;
