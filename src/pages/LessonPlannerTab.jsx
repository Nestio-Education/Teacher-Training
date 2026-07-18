import { useState, useEffect } from "react";
import { Modal, S } from "../components/Shared";
import { generateAILessonPlan } from "../services/api";

const AGE_GROUPS = [
  "2–3 years (Toddler)",
  "3–4 years (Nursery)",
  "4–5 years (Junior KG)",
  "5–6 years (Senior KG)",
  "6–8 years (Primary)",
];

const DURATIONS = ["20 minutes", "30 minutes", "45 minutes", "60 minutes", "90 minutes"];
const STORAGE_KEY = "spaceece_lesson_planner_activities";

function loadSavedActivities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
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
export default function LessonPlannerTab({ setToast }) {
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[1]);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [generating, setGenerating] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [plan, setPlan] = useState(null);
  const [savedActivities, setSavedActivities] = useState(loadSavedActivities);
  const [pendingActivity, setPendingActivity] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedActivities));
  }, [savedActivities]);

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

  const confirmAddActivity = () => {
    if (!pendingActivity) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      activity: pendingActivity.text,
      activityIndex: pendingActivity.index,
      topic: pendingActivity.topic,
      ageGroup: pendingActivity.ageGroup,
      duration: pendingActivity.duration,
      objective: pendingActivity.objective,
      materials: pendingActivity.materials || [],
      addedAt: new Date().toISOString(),
    };
    setSavedActivities((prev) => [entry, ...prev]);
    setPendingActivity(null);
    setToast?.({ msg: "Activity added to your list.", type: "success" });
  };

  const removeSaved = (id) => {
    setSavedActivities((prev) => prev.filter((a) => a.id !== id));
    setToast?.({ msg: "Activity removed.", type: "success" });
  };

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
        Generate a lesson plan, review it as cards, then add activities to your list below.
      </p>

      {/* Form */}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Added activities
          </h2>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
            {savedActivities.length} saved
          </span>
        </div>

        {savedActivities.length === 0 ? (
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
            No activities added yet. Generate a plan and click <b>Add Activity</b> on a card.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {savedActivities.map((item) => (
              <div key={item.id} style={{ ...cardStyle, borderTop: "3px solid #8b5cf6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>
                    ACTIVITY {item.activityIndex || ""}
                  </span>
                  <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    Added {formatAddedDate(item.addedAt)}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                  {item.topic}
                </div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.55, marginBottom: 12 }}>
                  {item.activity}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, marginBottom: 12 }}>
                  <div><b>Age group:</b> {item.ageGroup}</div>
                  <div><b>Duration:</b> {item.duration}</div>
                  {item.objective && (
                    <div style={{ marginTop: 6 }}><b>Objective:</b> {item.objective}</div>
                  )}
                  {item.materials?.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <b>Materials:</b> {item.materials.join(", ")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" style={S.tblBtn} onClick={() => handleCopy(item.activity, "Activity")}>
                    📋 Copy
                  </button>
                  <button
                    type="button"
                    style={{ ...S.btnRed, padding: "5px 10px", fontSize: 11 }}
                    onClick={() => removeSaved(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
