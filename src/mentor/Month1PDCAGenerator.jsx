import { useState } from "react";
import { generatePDCADraft, approvePDCAReport } from "../services/api";

const STATUS_STYLE = {
  met: { icon: "✓", color: "#059669", label: "Met" },
  needs_mentor_review: { icon: "◐", color: "#b45309", label: "Needs review" },
  not_met: { icon: "☐", color: "#94a3b8", label: "Not met" },
};

export default function Month1PDCAGenerator({ mentees = [], setToast, onApproved }) {
  const [selectedFellowId, setSelectedFellowId] = useState("");
  const [report, setReport] = useState(null);
  const [form, setForm] = useState({ plan: "", do: "", check: "", act: "" });
  const [deliverables, setDeliverables] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);

  const selectedFellow = mentees.find((m) => m._id === selectedFellowId);

  const handleGenerate = async () => {
    if (!selectedFellowId) {
      setToast?.({ msg: "Select a fellow first.", type: "error" });
      return;
    }
    setGenerating(true);
    try {
      const res = await generatePDCADraft(selectedFellowId);
      const r = res.report;
      setReport(r);
      setDeliverables(r.deliverablesStatus || []);
      setForm({
        plan: r.sections.plan.mentorText || r.sections.plan.aiText || "",
        do: r.sections.do.mentorText || r.sections.do.aiText || "",
        check: r.sections.check.mentorText || r.sections.check.aiText || "",
        act: r.sections.act.mentorText || r.sections.act.aiText || "",
      });
      setAiAvailable(res.aiAvailable);
      setToast?.({
        msg: res.aiAvailable
          ? "AI draft generated — review and edit before approving."
          : "AI is currently unavailable. A blank Month 1 template is shown below for you to fill in.",
        type: res.aiAvailable ? "info" : "error",
      });
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to generate draft.", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const toggleDeliverable = (id) => {
    setDeliverables((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const order = ["not_met", "needs_mentor_review", "met"];
        const next = order[(order.indexOf(d.status) + 1) % order.length];
        return { ...d, status: next };
      })
    );
  };

  const handleApprove = async () => {
    if (!form.plan.trim() || !form.do.trim() || !form.check.trim() || !form.act.trim()) {
      setToast?.({ msg: "All four PDCA sections are required before approving.", type: "error" });
      return;
    }
    setApproving(true);
    try {
      const res = await approvePDCAReport(selectedFellowId, {
        plan: form.plan,
        doAction: form.do,
        check: form.check,
        act: form.act,
        deliverablesStatus: deliverables,
      });
      setReport(res.report);
      setToast?.({ msg: "Month 1 PDCA report approved and saved to Growth Cycle history.", type: "success" });
      // Let the parent tab know a cycle was just logged so the Fellow
      // Progress panel (and anything else derived from cycle history)
      // refreshes immediately instead of only after a manual reload.
      onApproved?.();
    } catch (err) {
      setToast?.({ msg: err.message || "Failed to approve report.", type: "error" });
    } finally {
      setApproving(false);
    }
  };

  const lowData = report?.lowDataFields || [];

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800 }}>
        AI Month 1 PDCA Report Generator
      </h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        <select
          value={selectedFellowId}
          onChange={(e) => setSelectedFellowId(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
        >
          <option value="">Select a fellow…</option>
          {mentees.map((m) => (
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !selectedFellowId}
          style={{
            padding: "8px 16px", borderRadius: 6, border: "1px solid #c4b5fd",
            background: "#ede9fe", color: "#5b21b6", fontWeight: 700, cursor: "pointer",
          }}
        >
          {generating ? "Generating…" : "✨ Generate Draft"}
        </button>
      </div>

      {!aiAvailable && report && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: 10, borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
          AI service is currently unavailable — the fields below are a blank Month 1 template. Fill them in manually; the deliverables checklist is still computed from real logged data.
        </div>
      )}

      {report && (
        <>
          {["plan", "do", "check", "act"].map((key) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 12, marginBottom: 4, textTransform: "uppercase", color: "#374151" }}>
                {key}
                {lowData.includes(key) && (
                  <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700, textTransform: "none" }}>
                    ⚠ low data — needs your input
                  </span>
                )}
                {report.sections[key]?.isAIDrafted && (
                  <span style={{ background: "#ede9fe", color: "#5b21b6", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700, textTransform: "none" }}>
                    AI-drafted
                  </span>
                )}
              </label>
              <textarea
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", minHeight: 70, padding: 8, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, color: "#374151" }}>
              Month 1 Deliverables Checklist ({deliverables.filter((d) => d.status === "met").length}/{deliverables.length} met) — click to correct
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {deliverables.map((d) => {
                const s = STATUS_STYLE[d.status];
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => toggleDeliverable(d.id)}
                    title="Click to cycle: Not met → Needs review → Met"
                    style={{
                      textAlign: "left", fontSize: 11, color: s.color, background: "none",
                      border: "none", cursor: "pointer", padding: "2px 0",
                    }}
                  >
                    {s.icon} {d.label}
                    {d.mentorOverride && <span style={{ color: "#6366f1" }}> (corrected)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleApprove}
            disabled={approving}
            style={{
              padding: "10px 18px", borderRadius: 6, border: "none",
              background: report.status === "approved" ? "#059669" : "#4f46e5",
              color: "#fff", fontWeight: 700, cursor: "pointer",
            }}
          >
            {approving ? "Saving…" : report.status === "approved" ? "✓ Approved — Re-save to Growth Cycle" : "Approve & Save Growth Cycle"}
          </button>
        </>
      )}

      {!report && (
        <div style={{ color: "#6b7280", fontSize: 13 }}>
          {selectedFellow ? `Ready to generate a Month 1 draft for ${selectedFellow.name}.` : "Select a fellow and click Generate Draft."}
        </div>
      )}
    </div>
  );
}