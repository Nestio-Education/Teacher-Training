import { useState, useEffect } from "react";
import { S, StatusBadge } from "../components/Shared";
import { getCourseNotes } from "../services/api";

/* ══════════════════════════════════════════════════════════════
   TEACHER "MY COURSES" — Notes Reader (replaces the video player)
   - Every course is a set of admin-authored notes, fetched from
     the SAME Course Notes API the admin uses to create them
     (getCourseNotes/createCourseNote/etc in CurriculumTrainingTab).
   - Each note = one "topic" in the reader. Reading a topic marks
     it "read"; completion % = topics read / total topics, saved
     through the SAME onMarkDone callback used previously for video
     progress, so admin tracking keeps working unchanged.
   - Once 100% of a course's notes are read, a banner invites the
     teacher to take that course's Assessment.
══════════════════════════════════════════════════════════════ */

// Start: Dnyaneshwari Thorat
function normalizeId(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

// Start: Dnyaneshwari Thorat
function isCompletedAssignment(assignment) {
  return assignment?.status === "completed" ||
    assignment?.status === "approved" ||
    assignment?.status === "reviewed" ||
    assignment?.progressPercent === 100;
}

function isTopicRead(assignment, topicId) {
  if (isCompletedAssignment(assignment)) return true;
  const normalizedTopicId = normalizeId(topicId);
  return (assignment?.completedContent || []).map(normalizeId).includes(normalizedTopicId);
}
// End: Dnyaneshwari Thorat

export default function TeacherCourseNotes({ assignments = [], onMarkDone, onGoToAssessment, onRestartCourse, onRemoveCourse }) {
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);

  // notesByCourseId: { [courseId]: { loading, topics: [{_id, title, notes}] } }
  const [notesByCourseId, setNotesByCourseId] = useState({});

  const getCourseId = (assignment) => assignment?.course?._id || assignment?.course?.id || assignment?.course;

  // Load note counts for every assignment up front, so the overview
  // cards can show accurate "X/Y topics read" + completion %.
  useEffect(() => {
    assignments.forEach((a) => {
      const courseId = getCourseId(a);
      if (!courseId || notesByCourseId[courseId]) return;
      setNotesByCourseId((prev) => ({ ...prev, [courseId]: { loading: true, topics: [] } }));
      getCourseNotes(courseId)
        .then((res) => {
          // Start: Dnyaneshwari Thorat
          // Always prefer module contents (10 topics) as the source of truth.
          // Admin-authored notes are merged IN ADDITION to module topics.
          let moduleTopics = [];
          if (a.course && a.course.modules) {
            a.course.modules.forEach(mod => {
              (mod.contents || []).forEach(content => {
                moduleTopics.push({
                  _id: normalizeId(content._id),
                  title: content.title,
                  notes: content.detailedLearningContent || content.notes || content.description,
                });
              });
            });
          }

          // Merge any admin-authored notes that are not already covered by module topics
          const adminNotes = (res.notes || []).map(n => ({
            _id: normalizeId(n._id || n.id),
            title: n.title,
            notes: n.content,
          }));
          const moduleIds = new Set(moduleTopics.map(t => t._id));
          const extraNotes = adminNotes.filter(n => !moduleIds.has(n._id));

          const topics = moduleTopics.length > 0
            ? [...moduleTopics, ...extraNotes]
            : adminNotes;   // fallback if no modules at all
          // End: Dnyaneshwari Thorat

          setNotesByCourseId((prev) => ({ ...prev, [courseId]: { loading: false, topics } }));
        })
        .catch((err) => {
          console.error("Failed to load course notes:", err);
          setNotesByCourseId((prev) => ({ ...prev, [courseId]: { loading: false, topics: [] } }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments]);

  const activeAssignment = assignments.find((a) => a._id === activeAssignmentId);
  const activeCourseId = activeAssignment ? getCourseId(activeAssignment) : null;
  const topics = activeCourseId ? notesByCourseId[activeCourseId]?.topics || [] : [];
  const activeTopic = topics[activeTopicIdx];

  const markTopicRead = (assignment, topicId) => {
    if (!assignment || isTopicRead(assignment, topicId)) return;
    // Start: Dnyaneshwari Thorat
    const completedContent = [...(assignment.completedContent || []).map(normalizeId), normalizeId(topicId)];
    const allTopics = notesByCourseId[getCourseId(assignment)]?.topics || [];
    const progressPercent = allTopics.length > 0 ? Math.round((completedContent.length / allTopics.length) * 100) : 0;
    onMarkDone && onMarkDone(assignment._id, {
      completedContent,
      progressPercent,
      status: progressPercent === 100 ? "completed" : "in_progress",
    });
    // End: Dnyaneshwari Thorat
  };

  /* ── Course list view ── */
  if (!activeAssignmentId) {
    const displayAssignments = assignments.filter((a) => {
      if (!a.course) return false;
      const title = a.course.title || "";
      return !title.toLowerCase().includes("ai testing");
    });

    const cardAccents = ["#f59e0b", "#eab308", "#10b981", "#6366f1"];

    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.3px" }}>My Courses</h1>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Continue your professional development courses</p>
          </div>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{ padding: "8px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#059669,#10b981)", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.25)" }}
          >
            + Browse Training
          </button>
        </div>

        {displayAssignments.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", background: "white", borderRadius: 20, border: "1px dashed #cbd5e1", color: "#94a3b8" }}>
            No courses assigned yet. Your admin will assign courses from the Course Library.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {displayAssignments.map((c, idx) => {
              const courseId = getCourseId(c);
              const entry = notesByCourseId[courseId];
              const allTopics = entry?.topics || [];
              const notesLoading = entry?.loading;
              const done = isCompletedAssignment(c) ? allTopics.length : allTopics.filter((t) => isTopicRead(c, t._id)).length;
              const progress = isCompletedAssignment(c)
                ? 100
                : allTopics.length ? Math.round((done / allTopics.length) * 100) : (c.progressPercent || 0);
              const isLocked = c.locked === true;
              const accent = cardAccents[idx % cardAccents.length];

              return (
                <div
                  key={c._id}
                  style={{
                    background: "white",
                    borderRadius: 20,
                    padding: 22,
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    borderTop: `4px solid ${isLocked ? "#cbd5e1" : accent}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: isLocked ? "#f1f5f9" : "#ffedd5", color: isLocked ? "#64748b" : "#c2410c" }}>
                        {isLocked ? "Locked" : progress === 100 ? "Completed" : "In Progress"}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: accent }}>{progress}%</span>
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>{c.course?.title}</h3>
                    <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: "0 0 14px" }}>
                      {(c.course?.description || "Comprehensive professional training module designed for early childhood educators.").slice(0, 90)}...
                    </p>
                  </div>

                  <div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
                      <div style={{ height: "100%", width: `${progress}%`, background: isLocked ? "#cbd5e1" : accent, borderRadius: 3, transition: "width 0.8s ease" }} />
                    </div>

                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
                      <span>⏱ 4 Hours · {notesLoading ? "Loading..." : `${allTopics.length} Topics`}</span>
                      <span>{done}/{allTopics.length} Read</span>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {progress === 100 && allTopics.length > 0 && onGoToAssessment && !isLocked && (
                        <button onClick={() => onGoToAssessment(c)} style={{ flex: 1, padding: "8px 12px", borderRadius: 12, border: "1px solid #10b981", background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          📝 Assessment
                        </button>
                      )}
                      {onRestartCourse && !isLocked && (progress > 0 || isCompletedAssignment(c)) && (
                        <button onClick={() => onRestartCourse(c)} style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid #fca5a5", background: "#fef2f2", color: "#ef4444", fontSize: 11, cursor: "pointer" }} title="Restart Course">
                          🔄
                        </button>
                      )}
                      {onRemoveCourse && !isLocked && (
                        <button onClick={() => onRemoveCourse(c)} style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid #fca5a5", background: "#fef2f2", color: "#ef4444", fontSize: 11, cursor: "pointer" }} title="Remove Course">
                          🗑
                        </button>
                      )}
                      {isLocked ? (
                        <button disabled style={{ flex: 1, padding: "8px 12px", borderRadius: 12, border: "none", background: "#f1f5f9", color: "#94a3b8", fontSize: 12, fontWeight: 700, cursor: "not-allowed" }}>
                          🔒 Locked
                        </button>
                      ) : (
                        <button
                          onClick={() => { setActiveAssignmentId(c._id); setActiveTopicIdx(0); }}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: 12, border: "none", background: progress === 100 ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.2)" }}
                        >
                          {progress > 0 ? "Continue Reading →" : "Start Reading →"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── Notes reader view ── */
  const notesLoading = activeCourseId ? notesByCourseId[activeCourseId]?.loading : false;
  const readCount = isCompletedAssignment(activeAssignment) ? topics.length : topics.filter((t) => isTopicRead(activeAssignment, t._id)).length;
  const overallProg = isCompletedAssignment(activeAssignment)
    ? 100
    : topics.length ? Math.round((readCount / topics.length) * 100) : 0;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setActiveAssignmentId(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151" }}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ ...S.pageTitle, margin: 0 }}>📖 {activeAssignment?.course?.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 4, overflow: "hidden", maxWidth: 300 }}>
              <div style={{ height: "100%", width: `${overallProg}%`, background: "#f59e0b", borderRadius: 4, transition: "width 0.6s" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b" }}>{overallProg}% complete</span>
          </div>
        </div>
        {overallProg === 100 && topics.length > 0 && onGoToAssessment && (
          <button onClick={() => onGoToAssessment(activeAssignment)} style={{ ...S.primaryBtn, background: "linear-gradient(135deg,#10b981,#059669)" }}>📝 Take Assessment →</button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
        {/* Topic list sidebar */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "14px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1c1917" }}>Course Topics</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{topics.length} topics · {readCount} read</div>
          </div>
          <div style={{ overflowY: "auto", maxHeight: 600 }}>
            {topics.map((topic, i) => {
              const topicId = topic._id;
              const read = isTopicRead(activeAssignment, topicId);
              const isActive = i === activeTopicIdx;
              return (
                <div key={topicId || i} onClick={() => setActiveTopicIdx(i)}
                  style={{ padding: "12px 16px", background: isActive ? "#fef3c7" : "white", borderBottom: "1px solid #f9fafb", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${isActive ? "#f59e0b" : "transparent"}` }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: read ? "#10b981" : isActive ? "#f59e0b" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", flexShrink: 0 }}>
                    {read ? "✓" : i + 1}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "#92400e" : "#374151", lineHeight: 1.3 }}>{topic.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes content */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {notesLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 14 }}>Loading notes…</div>
            </div>
          ) : activeTopic ? (
            <div style={{ padding: "24px 28px" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, marginBottom: 6 }}>TOPIC {activeTopicIdx + 1} OF {topics.length}</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#1c1917", marginBottom: 18 }}>{activeTopic.title}</div>
              {/* Start: Dnyaneshwari Thorat */}
              <div 
                style={{ fontSize: 14, color: "#374151", lineHeight: 1.9, marginBottom: 24 }}
                dangerouslySetInnerHTML={{ __html: activeTopic.notes ? activeTopic.notes.replace(/\n/g, '<br />') : '<span style="color: #9ca3af; font-style: italic;">No content was added for this note.</span>' }}
              />
              {/* End: Dnyaneshwari Thorat */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                <button
                  disabled={activeTopicIdx === 0}
                  onClick={() => setActiveTopicIdx((i) => Math.max(0, i - 1))}
                  style={{ ...S.tblBtn, opacity: activeTopicIdx === 0 ? 0.4 : 1 }}
                >← Previous Topic</button>

                {isTopicRead(activeAssignment, activeTopic._id) ? (
                  <span style={{ background: "#d1fae5", color: "#065f46", padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 800 }}>✓ Marked as Read</span>
                ) : (
                  <button
                    onClick={() => markTopicRead(activeAssignment, activeTopic._id)}
                    style={{ ...S.primaryBtn }}
                  >
                    ✅ Mark as Read & Continue
                  </button>
                )}

                <button
                  disabled={activeTopicIdx === topics.length - 1}
                  onClick={() => {
                    markTopicRead(activeAssignment, activeTopic._id);
                    setActiveTopicIdx((i) => Math.min(topics.length - 1, i + 1));
                  }}
                  style={{ ...S.primaryBtn, opacity: activeTopicIdx === topics.length - 1 ? 0.4 : 1 }}
                >Next Topic →</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
              <div style={{ fontSize: 14 }}>No notes found for this course yet. Ask your admin to add notes in Course Management.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
