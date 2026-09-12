import { useState, useEffect } from "react";
import { S, SearchBar, StatCard } from "../components/Shared";
import {
  getCourses, createCourse, updateCourse, deleteCourse as deleteCourseApi,
  getCourseAssignments, getCourseNotes, createCourseNote
} from "../services/api";
import { NotesPreviewModal, AssessmentPreviewModal, AssignCourseModal, CourseTrackingModal } from "../admin/CurriculumTrainingTab";
import { CourseFormModal, CoursePreviewModal } from "../admin/CourseManagementTab";
import { CourseLibraryPickerModal } from "../admin/CurriculumTrainingTab";
import AICourseGenerator from "../admin/AICourseGenerator";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const getCourseId = (course) => course?._id || course?.id;

/* Helper: count topics/lessons in a course's modules */
function getTopicCount(course) {
  return (course.modules || []).reduce((a, m) => a + (m.contents?.length || m.lessons?.length || 0), 0);
}

/* Map a raw API course object into the shape the UI expects */
function mapCourseFromApi(c) {
  const id = c._id || c.id;
  return {
    ...c,
    id,
    title: c.title || "Untitled Course",
    category: c.category || "Uncategorized",
    level: c.level || "Beginner",
    duration: c.durationText || c.duration || "",
    description: c.description || "",
    status: c.status || "draft",
    modules: c.modules || [],
    assignedCount: c.assignedCount || 0,
    completedCount: c.completedCount || 0,
    completion: c.completion || 0,
  };
}

const LEVEL_COLORS = {
  Beginner: { bg: "#d1fae5", color: "#065f46" },
  Intermediate: { bg: "#dbeafe", color: "#1d4ed8" },
  Advanced: { bg: "#ede9fe", color: "#5b21b6" },
};

const CATEGORIES = [
  "all",
  "Foundation",
  "Montessori",
  "Psychology",
  "Policy",
  "Planning",
  "Leadership",
  "Special Ed",
  "Digital",
  "Foundations of ECE",
  "Curriculum Planning",
  "Instructional Strategies",
  "Assessment & Evaluation",
  "Classroom Management",
  "Health, Safety & Nutrition",
];

/* ══════════════════════════════════════════════════════════════
   MENTOR COURSE MANAGEMENT TAB — Full Functionality
   Features: Course library, AI generation, file upload, CRUD,
   publish/unpublish, archive, soft-delete with deleted section
══════════════════════════════════════════════════════════════ */
export default function MentorCourseManagementTab({ user, setToast }) {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active"); // "active" | "deleted" | "all"
  const [activeDropdown, setActiveDropdown] = useState(null);

  /* Modals */
  const [libraryModal, setLibraryModal] = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [watchCourse, setWatchCourse] = useState(null);
  const [previewCourse, setPreviewCourse] = useState(null);
  const [assessmentCourse, setAssessmentCourse] = useState(null);
  const [assignCourse, setAssignCourse] = useState(null);
  const [trackCourse, setTrackCourse] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewProgress, setPreviewProgress] = useState({});

  const assignedTeachers = (user?.mentorProfile?.assignedTeachers || []).map(t => ({ ...t, status: "approved" }));

  /* ── Data Loading ── */
  const loadData = () => {
    setLoading(true);
    Promise.all([
      getCourses().catch(err => { console.error("getCourses failed:", err); return { courses: [] }; }),
      getCourseAssignments().catch(err => { console.error("getCourseAssignments failed:", err); return { assignments: [] }; }),
    ])
      .then(([coursesRes, assignmentsRes]) => {
        setAssignments(assignmentsRes.assignments || []);
        const mapped = (coursesRes.courses || []).map(c => mapCourseFromApi(c));
        setCourses(mapped);
      })
      .catch(err => setToast?.({ msg: `Load failed: ${err.message}`, type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line

  /* ── Filters ── */
  const activeCourses = courses.filter(c => c.status !== "deleted");
  const deletedCourses = courses.filter(c => c.status === "deleted");
  const displayCourses = statusFilter === "deleted" ? deletedCourses : activeCourses;

  const uniqueCategories = [...new Set(courses.map(c => c.category).filter(Boolean))];

  const filtered = displayCourses.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.title.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
    const matchCat = catFilter === "all" || c.category === catFilter;
    return matchSearch && matchCat;
  });

  /* ── Course CRUD ── */
  const handleSave = (saved) => {
    if (editCourse) {
      const id = getCourseId(editCourse);
      updateCourse(id, saved)
        .then(res => {
          const updated = { ...res.course, id: res.course._id || res.course.id };
          setCourses(prev => prev.map(c => getCourseId(c) === id ? mapCourseFromApi(updated) : c));
          setToast?.({ msg: "Course updated!", type: "success" });
        })
        .catch(err => setToast?.({ msg: err.message, type: "error" }));
    } else {
      if (saved._id) {
        setCourses(prev => [mapCourseFromApi({ ...saved, id: saved._id }), ...prev.filter(c => getCourseId(c) !== saved._id)]);
        setToast?.({ msg: "Course added!", type: "success" });
      } else {
        createCourse(saved)
          .then(res => {
            const created = { ...res.course, id: res.course._id || res.course.id };
            setCourses(prev => [mapCourseFromApi(created), ...prev]);
            setToast?.({ msg: "Course created!", type: "success" });
          })
          .catch(err => setToast?.({ msg: err.message, type: "error" }));
      }
    }
    setFormModal(false);
    setEditCourse(null);
  };

  const toggleStatus = (id) => {
    const course = courses.find(c => getCourseId(c) === id);
    if (!course) return;
    const nextStatus = course.status === "published" ? "draft" : "published";
    updateCourse(id, { ...course, status: nextStatus })
      .then(res => {
        const updated = { ...res.course, id: res.course._id || res.course.id };
        setCourses(prev => prev.map(c => getCourseId(c) === id ? mapCourseFromApi(updated) : c));
        setToast?.({ msg: `Course ${nextStatus}!`, type: "success" });
      })
      .catch(err => setToast?.({ msg: err.message, type: "error" }));
  };

  const archiveCourse = (id) => {
    const course = courses.find(c => getCourseId(c) === id);
    if (!course) return;
    updateCourse(id, { ...course, status: "archived" })
      .then(res => {
        const updated = { ...res.course, id: res.course._id || res.course.id };
        setCourses(prev => prev.map(c => getCourseId(c) === id ? mapCourseFromApi(updated) : c));
        setToast?.({ msg: "Course archived.", type: "success" });
      })
      .catch(err => setToast?.({ msg: err.message, type: "error" }));
  };

  const softDeleteCourse = (id) => {
    if (!window.confirm("Move this course to Deleted? You can view it in the Deleted section.")) return;
    deleteCourseApi(id)
      .then(() => {
        setCourses(prev => prev.map(c => getCourseId(c) === id ? { ...c, status: "deleted" } : c));
        setToast?.({ msg: "Course moved to Deleted.", type: "success" });
      })
      .catch(err => setToast?.({ msg: err.message, type: "error" }));
  };

  const restoreCourse = (id) => {
    updateCourse(id, { status: "draft" })
      .then(res => {
        const updated = { ...res.course, id: res.course._id || res.course.id };
        setCourses(prev => prev.map(c => getCourseId(c) === id ? mapCourseFromApi(updated) : c));
        setToast?.({ msg: "Course restored as draft!", type: "success" });
      })
      .catch(err => setToast?.({ msg: err.message, type: "error" }));
  };

  /* ── AI File Upload ── */
  const handleUploadMaterial = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setToast?.({ msg: "Uploading and processing... This may take a minute.", type: "info" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("spaceece_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/admin/upload-material`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (!res.ok) {
        let errorMsg = `Upload failed (Status ${res.status})`;
        try { const errData = await res.json(); errorMsg = errData.message || errorMsg; } catch {}
        throw new Error(errorMsg);
      }
      await res.json();
      setToast?.({ msg: "Course & Assessment generated successfully!", type: "success" });
      loadData();
    } catch (err) {
      setToast?.({ msg: err.message, type: "error" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  /* ── Stats ── */
  const published = activeCourses.filter(c => c.status === "published").length;
  const drafts = activeCourses.filter(c => c.status === "draft").length;
  const archived = activeCourses.filter(c => c.status === "archived").length;
  const totalAssigned = activeCourses.reduce((a, c) => a + c.assignedCount, 0);
  const totalCompleted = activeCourses.reduce((a, c) => a + c.completedCount, 0);
  const overallPct = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  /* ── Mock categories for CourseFormModal ── */
  const formCategories = uniqueCategories.map((name, i) => ({ id: i + 1, name }));
  if (formCategories.length === 0) {
    formCategories.push({ id: 1, name: "Foundation" });
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh", fontSize: 14, fontWeight: 600, color: "#6366f1" }}>
        🔄 Loading Courses...
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>

      {/* ── Modals ── */}
      {libraryModal && (
        <CourseLibraryPickerModal onClose={() => setLibraryModal(false)} onCreated={loadData} setToast={setToast} />
      )}
      {formModal && (
        <CourseFormModal
          course={editCourse}
          onSave={handleSave}
          onClose={() => { setFormModal(false); setEditCourse(null); }}
          categories={formCategories}
          setToast={setToast}
        />
      )}
      {watchCourse && (
        <CoursePreviewModal
          course={watchCourse}
          onProgress={(pct) => {
            const courseId = getCourseId(watchCourse);
            setPreviewProgress(prev => ({ ...prev, [courseId]: Math.max(prev[courseId] || 0, pct) }));
            setCourses(prev => prev.map(course => {
              if (getCourseId(course) !== courseId) return course;
              return { ...course, completion: Math.max(course.completion || 0, pct) };
            }));
          }}
          onClose={() => setWatchCourse(null)}
        />
      )}
      {previewCourse && (
        <NotesPreviewModal course={previewCourse} onClose={() => setPreviewCourse(null)} />
      )}
      {assessmentCourse && (
        <AssessmentPreviewModal course={assessmentCourse} onClose={() => setAssessmentCourse(null)} setToast={setToast} />
      )}
      {assignCourse && (
        <AssignCourseModal
          course={assignCourse}
          teachers={assignedTeachers}
          onClose={() => setAssignCourse(null)}
          onAssigned={loadData}
          setToast={setToast}
        />
      )}
      {trackCourse && (
        <CourseTrackingModal
          course={trackCourse}
          assignments={assignments}
          assessmentResults={[]}
          onClose={() => setTrackCourse(null)}
          setToast={setToast}
        />
      )}

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={S.pageTitle}>Course Management</h1>
          <p style={S.pageSub}>{published} published · {drafts} drafts · {archived} archived · {overallPct}% fellow completion</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* AI Upload */}
          <div style={{ position: "relative" }}>
            <input
              type="file"
              accept=".pdf,.docx,.xlsx"
              onChange={handleUploadMaterial}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              disabled={uploading}
            />
            <button style={{ ...S.exportBtn, background: "#8b5cf6", color: "white", borderColor: "#7c3aed" }} disabled={uploading}>
              {uploading ? "⏳ Processing AI..." : "🤖 Auto-Generate from File"}
            </button>
          </div>
          {/* Library */}
          <button onClick={() => setLibraryModal(true)} style={S.primaryBtn}>📚 From Library</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard icon="📚" label="Total Courses" val={activeCourses.length} color="#f59e0b" bg="#fef3c7" />
        <StatCard icon="✅" label="Published" val={published} color="#10b981" bg="#d1fae5" />
        <StatCard icon="📝" label="Drafts" val={drafts} color="#6b7280" bg="#f3f4f6" />
        <StatCard icon="🗄️" label="Archived" val={archived} color="#8b5cf6" bg="#ede9fe" />
        <StatCard icon="👥" label="Fellow Assignments" val={totalAssigned} color="#3b82f6" bg="#dbeafe" />
        <StatCard icon="📊" label="Completion" val={`${overallPct}%`} color="#06b6d4" bg="#cffafe" />
      </div>

      {/* ── Filters ── */}
      <div style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by course name or category..." />
          </div>
          {/* Status toggle */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "active", label: "📋 Active" },
              { key: "deleted", label: "🗑️ Deleted" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={{
                  padding: "7px 12px", borderRadius: 8,
                  border: `1.5px solid ${statusFilter === f.key ? "#6366f1" : "#e5e7eb"}`,
                  background: statusFilter === f.key ? "#eef2ff" : "white",
                  color: statusFilter === f.key ? "#4338ca" : "#6b7280",
                  fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {f.label} {f.key === "deleted" && deletedCourses.length > 0 ? `(${deletedCourses.length})` : ""}
              </button>
            ))}
          </div>
          {/* Category filter */}
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...S.input, width: 180, marginBottom: 0 }}>
            <option value="all">All Categories</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(catFilter !== "all" || search) && (
            <button onClick={() => { setSearch(""); setCatFilter("all"); }} style={{ ...S.tblBtn, color: "#ef4444", borderColor: "#fca5a5" }}>✕ Clear</button>
          )}
        </div>
      </div>

      {/* ── Result Count ── */}
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
        Showing {filtered.length} of {displayCourses.length} {statusFilter === "deleted" ? "deleted " : ""}courses
      </div>

      {/* ── Deleted Section Banner ── */}
      {statusFilter === "deleted" && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#991b1b" }}>
          🗑️ These courses have been soft-deleted. They are hidden from the active catalog but preserved in the database. You can restore any course back to draft status.
        </div>
      )}

      {/* ── Course Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 20 }}>
        {filtered.map(c => {
          const lc = LEVEL_COLORS[c.level] || LEVEL_COLORS.Beginner;
          const pct = c.assignedCount > 0 ? Math.round((c.completedCount / c.assignedCount) * 100) : 0;
          const topicCount = getTopicCount(c);
          const isStale = topicCount === 0;
          const isDeleted = c.status === "deleted";
          const progress = typeof c.completion === "number" ? c.completion : (previewProgress[getCourseId(c)] || 0);

          return (
            <div key={getCourseId(c)} style={{
              background: isDeleted ? "#fafafa" : "white",
              borderRadius: 14,
              border: isDeleted ? "1px solid #fca5a5" : isStale ? "1px solid #fde68a" : "1px solid #f1f5f9",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              opacity: isDeleted ? 0.75 : 1,
            }}>
              <div style={{ padding: "16px 18px 0" }}>
                {/* Badges */}
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#fef3c7", color: "#d97706" }}>
                    {c.category || "Uncategorized"}
                  </span>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: lc.bg, color: lc.color }}>
                    {c.level}
                  </span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: c.status === "published" ? "#d1fae5" : c.status === "draft" ? "#f3f4f6" : c.status === "archived" ? "#ede9fe" : "#fee2e2",
                    color: c.status === "published" ? "#065f46" : c.status === "draft" ? "#374151" : c.status === "archived" ? "#5b21b6" : "#dc2626",
                  }}>
                    {c.status === "published" ? "✅ Published" : c.status === "draft" ? "📝 Draft" : c.status === "archived" ? "🗄️ Archived" : "🗑️ Deleted"}
                  </span>
                  {isStale && !isDeleted && (
                    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#fee2e2", color: "#dc2626" }}>⚠️ No topics</span>
                  )}
                  {!isStale && (
                    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#f3f4f6", color: "#6b7280" }}>
                      📖 {topicCount} topics
                    </span>
                  )}
                </div>

                {/* Title */}
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1c1917", marginBottom: 6, lineHeight: 1.4 }}>{c.title}</div>

                {/* Info */}
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
                  <span>⏱️ {c.duration || "N/A"}</span>
                  <span>👥 {c.assignedCount} assigned</span>
                </div>

                {/* Description */}
                <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 10px", lineHeight: 1.5 }}>
                  {(c.description || "").length > 110 ? c.description.substring(0, 110) + "..." : c.description || "No description available."}
                </p>
              </div>

              {/* Progress bars */}
              {!isDeleted && (
                <div style={{ padding: "0 18px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                    <span>FELLOW COMPLETION</span><span>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct >= 75 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444", borderRadius: 4 }} />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ padding: "0 18px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                {isDeleted ? (
                  /* Deleted course: only restore button */
                  <button onClick={() => restoreCourse(getCourseId(c))} style={{ ...S.tblBtn, flex: 1, color: "#059669", borderColor: "#6ee7b7" }}>
                    ♻️ Restore
                  </button>
                ) : (
                  /* Active course: full action set */
                  <>
                    <button onClick={() => setPreviewCourse(c)} style={{ ...S.tblBtn, flex: 1, color: "#7c3aed", borderColor: "#c4b5fd" }}>📖 Notes</button>
                    <button onClick={() => setAssessmentCourse(c)} style={{ ...S.tblBtn, flex: 1, color: "#4f46e5", borderColor: "#c7d2fe" }}>📝 Assessment</button>
                    <button onClick={() => setAssignCourse(c)} disabled={isStale} style={{ ...S.tblBtn, flex: 1, color: isStale ? "#9ca3af" : "#059669", borderColor: isStale ? "#e5e7eb" : "#6ee7b7", cursor: isStale ? "not-allowed" : "pointer" }}>📋 Assign</button>
                    <button onClick={() => setTrackCourse(c)} style={{ ...S.tblBtn, flex: 1, color: "#2563eb", borderColor: "#bfdbfe" }}>📊 Track</button>
                    
                    {/* Settings Dropdown */}
                    <div style={{ position: "relative" }}>
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === getCourseId(c) ? null : getCourseId(c))} 
                        style={{ ...S.tblBtn, padding: "6px 10px", color: "#4b5563", borderColor: "#d1d5db" }}
                      >
                        ⚙️
                      </button>
                      {activeDropdown === getCourseId(c) && (
                        <div style={{ 
                          position: "absolute", bottom: "100%", right: 0, marginBottom: 8, 
                          background: "white", border: "1px solid #e5e7eb", borderRadius: 8, 
                          boxShadow: "0 4px 15px rgba(0,0,0,0.1)", zIndex: 10, minWidth: 160, padding: 6,
                          display: "flex", flexDirection: "column", gap: 4
                        }}>
                          <button onClick={() => { setWatchCourse(c); setActiveDropdown(null); }} style={{ ...S.tblBtn, justifyContent: "flex-start", border: "none", background: "transparent" }}>🎬 Watch videos</button>
                          <button onClick={() => { setEditCourse(c); setFormModal(true); setActiveDropdown(null); }} style={{ ...S.tblBtn, justifyContent: "flex-start", border: "none", background: "transparent" }}>✏️ Edit course</button>
                          <button onClick={() => { toggleStatus(getCourseId(c)); setActiveDropdown(null); }} style={{ ...S.tblBtn, justifyContent: "flex-start", border: "none", background: "transparent", color: c.status === "published" ? "#dc2626" : "#059669" }}>
                            {c.status === "published" ? "⏸ Unpublish" : "▶ Publish"}
                          </button>
                          {c.status !== "archived" && (
                            <button onClick={() => { archiveCourse(getCourseId(c)); setActiveDropdown(null); }} style={{ ...S.tblBtn, justifyContent: "flex-start", border: "none", background: "transparent", color: "#6b7280" }}>🗄️ Archive</button>
                          )}
                          <div style={{ height: 1, background: "#e5e7eb", margin: "2px 0" }} />
                          <button onClick={() => { softDeleteCourse(getCourseId(c)); setActiveDropdown(null); }} style={{ ...S.tblBtn, justifyContent: "flex-start", border: "none", background: "transparent", color: "#dc2626" }}>🗑️ Delete</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {statusFilter === "deleted" ? "No deleted courses" : "No courses found"}
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {statusFilter === "deleted"
              ? "Deleted courses will appear here."
              : "Create a course from the library, use AI generation, or add one manually."
            }
          </div>
        </div>
      )}
    </div>
  );
}
