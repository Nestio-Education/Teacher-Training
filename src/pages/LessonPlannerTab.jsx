import { useState, useEffect } from "react";
import { Modal, S, StatusBadge } from "../components/Shared";
import { generateAILessonPlan, getAIActivities, saveAIActivity, updateAIActivityStatus, deleteAIActivity } from "../services/api";

const AGE_GROUPS = [
  "2–3 years (Toddler)",
  "3–4 years (Nursery)",
  "4–5 years (Junior KG)",
  "5–6 years (Senior KG)",
  "6–8 years (Primary)",
];

const DURATIONS = ["20 minutes", "30 minutes", "45 minutes", "60 minutes", "90 minutes"];

function mapActivityItem(item) {
  const status = item.status === "completed" ? "completed" : "pending";
  return {
    ...item,
    id: item._id || item.id,
    activity: item.activities?.[0] || item.activity,
    teacherName: item.teacher?.name || "Unknown",
    teacherEmail: item.teacher?.email || "",
    creatorRole: item.teacher?.role || "teacher",
    addedAt: item.savedAt || item.createdAt,
    status,
    completedAt: item.completedAt || null,
  };
}

function formatAddedDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Lesson Planner — generate plan, show cards, Add Activity with confirm → saved card list.
 */
export default function LessonPlannerTab({ setToast, user }) {
  const isTeacher = user?.role === "teacher";
  const isAdmin = user?.role === "admin";
  const canMarkComplete = isTeacher || isAdmin;
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[1]);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [generating, setGenerating] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [plan, setPlan] = useState(null);
  const [savedActivities, setSavedActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [pendingActivity, setPendingActivity] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [activityFilter, setActivityFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const res = await getAIActivities();
        const activities = (res.activities || []).map(mapActivityItem);
        setSavedActivities(activities);
      } catch (err) {
        console.error("Failed to load AI activities:", err);
        setToast?.({ msg: "Could not load saved activities.", type: "error" });
      } finally {
        setLoadingActivities(false);
      }
    };
    loadActivities();
  }, [setToast]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setToast?.({ msg: "Please enter a topic.", type: "error" });
      return;
    }
    setGenerating(true);
    try {
      const res = await generateAILessonPlan({
        ageGroup,
        topic: topic.trim(),
        duration,
      });
      const result = res.lessonPlan || res;
      setDraftText(result.draftText || "");
      setPlan({
        ageGroup: result.ageGroup || ageGroup,
        topic: result.topic || topic.trim(),
        duration: result.duration || duration,
        objective: result.objective || "",
        activities: result.activities || [],
        materials: result.materials || [],
        provider: result.provider,
        isLocalFallback: result.isLocalFallback,
        generatedAt: new Date().toISOString(),
      });
      setToast?.({
        msg: result.isLocalFallback
          ? "Draft ready (offline template). Review cards below."
          : "Lesson plan generated! Review the cards below.",
        type: "success",
      });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to generate lesson plan.", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text, label = "Text") => {
    try {
      await navigator.clipboard.writeText(text);
      setToast?.({ msg: `${label} copied.`, type: "success" });
    } catch {
      setToast?.({ msg: "Could not copy to clipboard.", type: "error" });
    }
  };

  const handleDownload = () => {
    if (!draftText.trim()) {
      setToast?.({ msg: "Nothing to download yet.", type: "error" });
      return;
    }
    const safeName = (plan?.topic || topic || "lesson").trim().replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
    const blob = new Blob([draftText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lesson_plan_${safeName || "draft"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setToast?.({ msg: "Lesson plan downloaded.", type: "success" });
  };

  const openAddConfirm = (activityText, index) => {
    if (!plan) return;
    setPendingActivity({
      text: activityText,
      index,
      topic: plan.topic,
      ageGroup: plan.ageGroup,
      duration: plan.duration,
      objective: plan.objective,
      materials: plan.materials,
    });
  };

  const confirmAddActivity = async () => {
    if (!pendingActivity) return;
    try {
      const res = await saveAIActivity({
        topic: pendingActivity.topic,
        ageGroup: pendingActivity.ageGroup,
        duration: pendingActivity.duration,
        objective: pendingActivity.objective,
        activities: [pendingActivity.text],
        materials: pendingActivity.materials || [],
        provider: plan?.provider || "local",
        generatedAt: plan?.generatedAt || new Date().toISOString(),
      });
      const newActivity = mapActivityItem({
        ...res.activity,
        activityIndex: pendingActivity.index,
      });
      setSavedActivities((prev) => [newActivity, ...prev]);
      setPendingActivity(null);
      setToast?.({ msg: "Activity added to your list.", type: "success" });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to save activity.", type: "error" });
    }
  };

  const removeSaved = async (id) => {
    try {
      await deleteAIActivity(id);
      setSavedActivities((prev) => prev.filter((a) => a.id !== id));
      setToast?.({ msg: "Activity removed.", type: "success" });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to remove activity.", type: "error" });
    }
  };

  const confirmMarkComplete = async () => {
    if (!completeTarget) return;
    try {
      await updateAIActivityStatus(completeTarget.id, "completed");
      setSavedActivities((prev) =>
        prev.map((item) =>
          item.id === completeTarget.id
            ? mapActivityItem({
                ...item,
                status: "completed",
                completedAt: new Date().toISOString(),
              })
            : item
        )
      );
      setCompleteTarget(null);
      setToast?.({ msg: "Activity marked as complete.", type: "success" });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to mark activity as complete.", type: "error" });
    }
  };

  const pendingCount = savedActivities.filter((a) => a.status !== "completed").length;
  const completedCount = savedActivities.filter((a) => a.status === "completed").length;

  const teacherOptions = [...new Map(
    savedActivities.map((item) => [
      item.teacherEmail || item.teacherName,
      { name: item.teacherName, email: item.teacherEmail },
    ])
  ).values()];

  const filteredActivities = savedActivities.filter((item) => {
    if (activityFilter === "pending" && item.status === "completed") return false;
    if (activityFilter === "completed" && item.status !== "completed") return false;
    if (isAdmin && teacherFilter !== "all") {
      const key = item.teacherEmail || item.teacherName;
      if (key !== teacherFilter) return false;
    }
    return true;
  });

  const filterBtn = (key, label, count) => (
    <button
      key={key}
      type="button"
      onClick={() => setActivityFilter(key)}
      style={{
        ...S.tblBtn,
        background: activityFilter === key ? "#dbeafe" : "white",
        color: activityFilter === key ? "#1e40af" : "#475569",
        borderColor: activityFilter === key ? "#93c5fd" : "#e2e8f0",
        fontWeight: activityFilter === key ? 700 : 600,
      }}
    >
      {label} ({count})
    </button>
  );

  const handleClearPlan = () => {
    setDraftText("");
    setPlan(null);
  };

  const cardStyle = {
    background: "white",
    borderRadius: 14,
    padding: 18,
    border: "1px solid #f1f5f9",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={S.pageTitle}>✏️ Lesson Planner</h1>
      <p style={S.pageSub}>
        {isAdmin
          ? "Generate lesson plans or review activities saved by teachers — filter by teacher or status below."
          : "Generate a lesson plan, review it as cards, then add activities to your list below."}
      </p>

      <form
        onSubmit={handleGenerate}
        style={{
          ...cardStyle,
          marginBottom: 20,
          maxWidth: 720,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1c1917", marginBottom: 14 }}>
          Plan details
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          <div>
            <label style={S.label}>Age group *</label>
            <select
              style={S.input}
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              disabled={generating}
            >
              {AGE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={S.label}>Duration *</label>
            <select
              style={S.input}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={generating}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={S.label}>Topic *</label>
            <input
              style={S.input}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Colors, Animals, Numbers 1–10"
              disabled={generating}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={generating}
            style={{ ...S.primaryBtn, opacity: generating ? 0.7 : 1 }}
          >
            {generating ? "⏳ Generating..." : "🤖 Generate Lesson Plan"}
          </button>
          {plan && (
            <>
              <button type="button" onClick={handleDownload} style={S.btnGreen}>
                ⬇ Download .txt
              </button>
              <button type="button" onClick={handleClearPlan} style={S.exportBtn}>
                Clear plan
              </button>
            </>
          )}
        </div>
        {plan?.isLocalFallback && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef3c7", border: "1px solid #fbbf24", fontSize: 11, color: "#92400e" }}>
            Using offline template — set MISTRAL_API_KEY for AI drafts.
          </div>
        )}
      </form>

      {/* Generated plan — card layout */}
      {plan && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Generated plan
            </h2>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {plan.topic} · {plan.ageGroup} · {plan.duration}
            </span>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {/* Meta / objective */}
            <div style={{ ...cardStyle, borderTop: "3px solid #3b82f6" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", marginBottom: 6, letterSpacing: "0.4px" }}>
                OBJECTIVE
              </div>
              <div style={{ fontSize: 13, color: "#1c1917", lineHeight: 1.55 }}>{plan.objective}</div>
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  style={S.tblBtn}
                  onClick={() => handleCopy(plan.objective, "Objective")}
                >
                  📋 Copy
                </button>
              </div>
            </div>

            {/* Activity cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {(plan.activities || []).map((act, i) => (
                <div key={i} style={{ ...cardStyle, borderTop: "3px solid #f59e0b", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", marginBottom: 8 }}>
                    ACTIVITY {i + 1}
                  </div>
                  <div style={{ fontSize: 13, color: "#1c1917", lineHeight: 1.55, flex: 1, marginBottom: 14 }}>
                    {act}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" style={S.tblBtn} onClick={() => handleCopy(act, "Activity")}>
                      📋 Copy
                    </button>
                    <button
                      type="button"
                      style={{ ...S.btnGreen, padding: "5px 10px", fontSize: 11 }}
                      onClick={() => openAddConfirm(act, i + 1)}
                    >
                      ＋ Add Activity
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Materials */}
            <div style={{ ...cardStyle, borderTop: "3px solid #10b981" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
                MATERIALS
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#1c1917", lineHeight: 1.6 }}>
                {(plan.materials || []).map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  style={S.tblBtn}
                  onClick={() => handleCopy((plan.materials || []).join("\n"), "Materials")}
                >
                  📋 Copy
                </button>
              </div>
            </div>

            {/* Optional editable full text */}
            <details style={{ ...cardStyle }}>
              <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#475569" }}>
                Edit full draft text
              </summary>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                style={{
                  ...S.input,
                  marginTop: 12,
                  minHeight: 200,
                  resize: "vertical",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  whiteSpace: "pre",
                  background: "#fafafa",
                }}
              />
            </details>
          </div>
        </section>
      )}

      {/* Added activities list */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            {isAdmin ? "All activities" : "Added activities"}
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {isAdmin && teacherOptions.length > 0 && (
              <select
                style={{ ...S.input, width: "auto", minWidth: 180, padding: "6px 10px", fontSize: 12 }}
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
              >
                <option value="all">All teachers</option>
                {teacherOptions.map((t) => {
                  const key = t.email || t.name;
                  return (
                    <option key={key} value={key}>
                      {t.name}
                    </option>
                  );
                })}
              </select>
            )}
            {filterBtn("all", "All", savedActivities.length)}
            {filterBtn("pending", "Pending", pendingCount)}
            {filterBtn("completed", "Completed", completedCount)}
          </div>
        </div>

        {loadingActivities ? (
          <div style={{ ...cardStyle, textAlign: "center", color: "#64748b", fontSize: 13, padding: 28 }}>
            Loading activities...
          </div>
        ) : savedActivities.length === 0 ? (
          <div
            style={{
              ...cardStyle,
              borderStyle: "dashed",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 13,
              padding: 28,
            }}
          >
            {isAdmin
              ? "No teacher activities saved yet. Activities appear here when teachers add them from Lesson Planner."
              : <>No activities added yet. Generate a plan and click <b>Add Activity</b> on a card.</>}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div
            style={{
              ...cardStyle,
              borderStyle: "dashed",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 13,
              padding: 28,
            }}
          >
            {isAdmin ? "No activities match the selected filters." : `No ${activityFilter} activities.`}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {filteredActivities.map((item) => {
              const isCompleted = item.status === "completed";
              return (
              <div
                key={item.id}
                style={{
                  ...cardStyle,
                  borderTop: `3px solid ${isCompleted ? "#10b981" : "#8b5cf6"}`,
                  opacity: isCompleted ? 0.92 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isCompleted ? "#059669" : "#7c3aed" }}>
                      ACTIVITY {item.activityIndex || ""}
                    </span>
                    <StatusBadge status={isCompleted ? "completed" : "pending"} />
                  </div>
                  <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    Added {formatAddedDate(item.addedAt)}
                  </span>
                </div>
                {isAdmin && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                      padding: "8px 10px",
                      background: item.creatorRole === "admin" ? "#fef3c7" : "#eff6ff",
                      border: `1px solid ${item.creatorRole === "admin" ? "#fbbf24" : "#bfdbfe"}`,
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{item.creatorRole === "admin" ? "👤" : "👩‍🏫"}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: item.creatorRole === "admin" ? "#92400e" : "#1e40af" }}>
                        {item.teacherName}
                        <span style={{ fontWeight: 600, marginLeft: 6, fontSize: 10 }}>
                          ({item.creatorRole === "admin" ? "Admin" : "Teacher"})
                        </span>
                      </div>
                      {item.teacherEmail && (
                        <div style={{ fontSize: 10, color: "#64748b" }}>{item.teacherEmail}</div>
                      )}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                  {item.topic}
                </div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.55, marginBottom: 12 }}>
                  {item.activity}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, marginBottom: 12 }}>
                  <div><b>Age group:</b> {item.ageGroup}</div>
                  <div><b>Duration:</b> {item.duration}</div>
                  {isCompleted && item.completedAt && (
                    <div style={{ marginTop: 6, color: "#059669", fontWeight: 600 }}>
                      <b>Completed:</b> {formatAddedDate(item.completedAt)}
                    </div>
                  )}
                  {item.objective && (
                    <div style={{ marginTop: 6 }}><b>Objective:</b> {item.objective}</div>
                  )}
                  {item.materials?.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <b>Materials:</b> {item.materials.join(", ")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" style={S.tblBtn} onClick={() => handleCopy(item.activity, "Activity")}>
                    📋 Copy
                  </button>
                  {canMarkComplete && !isCompleted && (
                    <button
                      type="button"
                      style={{ ...S.btnGreen, padding: "5px 10px", fontSize: 11 }}
                      onClick={() => setCompleteTarget(item)}
                    >
                      ✅ Mark Complete
                    </button>
                  )}
                  <button
                    type="button"
                    style={{ ...S.btnRed, padding: "5px 10px", fontSize: 11 }}
                    onClick={() => removeSaved(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </section>

      {/* Confirm Mark Complete */}
      {completeTarget && (
        <Modal title="Mark Activity Complete" onClose={() => setCompleteTarget(null)}>
          <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, margin: "0 0 16px" }}>
            Do you want to mark this activity as complete?
          </p>
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 10,
              padding: 14,
              fontSize: 13,
              color: "#1c1917",
              lineHeight: 1.55,
              marginBottom: 18,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{completeTarget.topic}</div>
            {completeTarget.activity}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" style={S.exportBtn} onClick={() => setCompleteTarget(null)}>
              No
            </button>
            <button type="button" style={S.primaryBtn} onClick={confirmMarkComplete}>
              Yes, mark complete
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm Add Activity */}
      {pendingActivity && (
        <Modal title="Add Activity" onClose={() => setPendingActivity(null)}>
          <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, margin: "0 0 16px" }}>
            Do you want to add this activity?
          </p>
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 14,
              fontSize: 13,
              color: "#1c1917",
              lineHeight: 1.55,
              marginBottom: 18,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{pendingActivity.topic}</div>
            {pendingActivity.text}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" style={S.exportBtn} onClick={() => setPendingActivity(null)}>
              No
            </button>
            <button type="button" style={S.primaryBtn} onClick={confirmAddActivity}>
              Yes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
