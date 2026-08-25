import { useState, useRef } from "react";
import { Modal } from "./Shared";
import { uploadFile, submitActivity } from "../services/api";

/* ═══════════════════════════════════════════════════════════════════
   UNIVERSAL ACTIVITY REPORT MODAL
   ───────────────────────────────────────────────────────────────────
   A reusable modal that lets teachers submit a completion report
   for any calendar task — lessons, field visits, PCB sessions,
   PDCA deliverables, self-learning activities, or custom tasks.
   ═══════════════════════════════════════════════════════════════════ */

/* Category metadata — shared with TeacherDashboard calendar */
export const ACTIVITY_CATEGORIES = {
  class_lesson:      { label: "Class Lesson",       icon: "📖", bg: "#dbeafe", border: "#3b82f6", color: "#1e3a8a" },
  field_visit:       { label: "Field Visit",         icon: "🏕️", bg: "#d1fae5", border: "#10b981", color: "#065f46" },
  pcb_session:       { label: "PCB Session",         icon: "🧪", bg: "#fce7f3", border: "#ec4899", color: "#831843" },
  pdca_deliverable:  { label: "PDCA Deliverable",    icon: "📈", bg: "#ede9fe", border: "#8b5cf6", color: "#4c1d95" },
  self_learning:     { label: "Self-Learning",        icon: "🧠", bg: "#fef3c7", border: "#f59e0b", color: "#92400e" },
  custom_task:       { label: "Custom Task",          icon: "📝", bg: "#f1f5f9", border: "#64748b", color: "#1e293b" },
};

/* PDCA phase chips (for pdca_deliverable category) */
const PDCA_PHASES = [
  { key: "plan",  label: "Plan",  color: "#3b82f6", bg: "#dbeafe" },
  { key: "do",    label: "Do",    color: "#10b981", bg: "#d1fae5" },
  { key: "check", label: "Check", color: "#f59e0b", bg: "#fef3c7" },
  { key: "act",   label: "Act",   color: "#ef4444", bg: "#fee2e2" },
];

export default function UniversalActivityReportModal({ task, onClose, onSubmitSuccess, setToast }) {
  const [notes, setNotes] = useState("");
  const [pdcaPhase, setPdcaPhase] = useState("plan");
  const [completionStatus, setCompletionStatus] = useState("completed"); // completed | partial | skipped
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef(null);

  if (!task) return null;

  const catMeta = ACTIVITY_CATEGORIES[task.category] || ACTIVITY_CATEGORIES.custom_task;
  const isPDCA = task.category === "pdca_deliverable";

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setFormError("File size must be under 10MB.");
        return;
      }
      setSelectedFileObj(file);
      setSelectedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
      });
    }
  };

  const handleSubmit = async () => {
    setFormError("");

    if (completionStatus === "completed" && !notes.trim()) {
      setFormError("Please add notes describing what you accomplished.");
      return;
    }

    setSubmitting(true);
    try {
      // Upload file attachment if present
      let uploadedFile = null;
      if (selectedFileObj) {
        const uploadRes = await uploadFile(selectedFileObj);
        if (uploadRes && uploadRes.asset) {
          uploadedFile = {
            asset: uploadRes.asset._id,
            name: uploadRes.asset.originalName || selectedFileObj.name,
            url: uploadRes.asset.publicUrl,
            uploadedAt: new Date().toISOString()
          };
        }
      }

      const reportPayload = {
        taskId: task.id,
        title: task.title,
        category: task.category,
        date: task.date,
        time: task.time,
        completionStatus,
        notes: notes.trim(),
        ...(isPDCA ? { pdcaPhase } : {}),
        ...(uploadedFile ? { attachments: [uploadedFile] } : {}),
        submittedAt: new Date().toISOString()
      };

      await submitActivity(reportPayload);

      if (setToast) {
        setToast({ msg: `✅ Report submitted for "${task.title}"`, type: "success" });
      }

      if (onSubmitSuccess) onSubmitSuccess(task.id, completionStatus);
      onClose();
    } catch (err) {
      setFormError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { key: "completed", label: "✅ Completed", desc: "Task fully done", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    { key: "partial",   label: "🔶 Partially Done", desc: "Needs follow-up", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    { key: "skipped",   label: "⏭️ Skipped", desc: "Could not complete", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  ];

  return (
    <Modal title="📋 Activity Completion Report" onClose={onClose} width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ─── Task Info Banner ─── */}
        <div style={{
          background: catMeta.bg,
          border: `1.5px solid ${catMeta.border}`,
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
          }}>
            {catMeta.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: catMeta.color, lineHeight: 1.3 }}>
              {task.title}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: catMeta.color, opacity: 0.75, marginTop: 2, display: "flex", gap: 10 }}>
              <span>{catMeta.label}</span>
              {task.date && <span>📅 {task.date}</span>}
              {task.time && <span>⏱ {task.time}</span>}
            </div>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 800, textTransform: "uppercase",
            background: catMeta.border, color: "white",
            padding: "3px 8px", borderRadius: 6, letterSpacing: "0.5px"
          }}>
            {catMeta.label}
          </span>
        </div>

        {/* ─── Error ─── */}
        {formError && (
          <div style={{
            padding: "10px 14px", background: "#fef2f2",
            border: "1px solid #fca5a5", borderRadius: 10,
            color: "#991b1b", fontSize: 12, fontWeight: 700, lineHeight: 1.4
          }}>
            {formError}
          </div>
        )}

        {/* ─── Completion Status ─── */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
            Completion Status
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {statusOptions.map(opt => {
              const isSelected = completionStatus === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setCompletionStatus(opt.key)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 10,
                    border: isSelected ? `2px solid ${opt.color}` : `1.5px solid ${opt.border}`,
                    background: isSelected ? opt.bg : "white",
                    cursor: "pointer",
                    transition: "all 0.18s",
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? opt.color : "#64748b" }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", marginTop: 2 }}>
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── PDCA Phase (only for pdca_deliverable) ─── */}
        {isPDCA && (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              PDCA Cycle Phase
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {PDCA_PHASES.map(phase => {
                const isActive = pdcaPhase === phase.key;
                return (
                  <button
                    key={phase.key}
                    onClick={() => setPdcaPhase(phase.key)}
                    style={{
                      flex: 1,
                      padding: "8px 6px",
                      borderRadius: 8,
                      border: isActive ? `2px solid ${phase.color}` : "1.5px solid #e2e8f0",
                      background: isActive ? phase.bg : "white",
                      color: isActive ? phase.color : "#94a3b8",
                      fontSize: 12, fontWeight: isActive ? 800 : 600,
                      cursor: "pointer",
                      transition: "all 0.18s"
                    }}
                  >
                    {phase.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Notes ─── */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            Activity Notes {completionStatus === "completed" && <span style={{ color: "#ef4444" }}>*</span>}
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={
              completionStatus === "skipped"
                ? "Reason for skipping (optional)..."
                : "Describe what was accomplished, key learnings, observations..."
            }
            style={{
              width: "100%", height: 90, padding: "10px 12px",
              borderRadius: 10, border: "1.5px solid #cbd5e1",
              fontSize: 13, outline: "none", resize: "none",
              fontFamily: "inherit", boxSizing: "border-box",
              lineHeight: 1.5
            }}
          />
        </div>

        {/* ─── File Attachment ─── */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            Attach Evidence (Optional)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.mp4"
            style={{ display: "none" }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed #cbd5e1",
              borderRadius: 12,
              padding: "16px",
              textAlign: "center",
              background: selectedFile ? "#f0fdf4" : "#fafafa",
              cursor: "pointer",
              transition: "all 0.18s"
            }}
          >
            {selectedFile ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>📎 File attached</div>
                <div style={{ fontSize: 12, color: "#374151", marginTop: 4, fontWeight: 600, wordBreak: "break-all" }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                  {selectedFile.size} · Click to change
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 22, marginBottom: 4 }}>📎</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                  Click to attach a photo, document, or recording
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                  PDF, DOCX, PPT, Image, or Video · Max 10MB
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── Actions ─── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 18px", background: "#f1f5f9",
              border: "none", borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              cursor: "pointer", color: "#475569"
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "8px 22px",
              background: submitting
                ? "#94a3b8"
                : completionStatus === "completed"
                  ? "linear-gradient(135deg,#10b981,#059669)"
                  : completionStatus === "partial"
                    ? "linear-gradient(135deg,#f59e0b,#d97706)"
                    : "linear-gradient(135deg,#ef4444,#dc2626)",
              border: "none", borderRadius: 8,
              fontSize: 12, fontWeight: 700,
              color: "white", cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
            }}
          >
            {submitting ? "⏳ Submitting..." : "📤 Submit Report"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
