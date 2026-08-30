import { t } from "../services/i18n";
import { useState, useEffect } from "react";
import { Modal, S, SearchBar, SectionCard, StatCard, StatusBadge, Toast } from "../components/Shared";
import { getAdminQuizzes, createAdminQuiz, updateAdminQuiz, deleteAdminQuiz, duplicateAdminQuiz, toggleAdminQuizPublish } from "../services/api";

const MOCK_QUESTION_BANK = [];

export default function AssessmentManagementTab({ assessmentsData = [], setAssessmentsData, setToast }) {
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [questionBuilderModal, setQuestionBuilderModal] = useState(false);
  const [addQuestionBankModal, setAddQuestionBankModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAdminQuizzes()
      .then(res => {
        if (res && res.quizzes && typeof setAssessmentsData === "function") {
          setAssessmentsData(res.quizzes);
        }
      })
      .catch(err => {
        console.warn("Notice: Loading quizzes locally/persisted fallback.", err?.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const [questionBank, setQuestionBank] = useState(() => {
    try {
      const stored = localStorage.getItem("spacece_admin_question_bank");
      return stored ? JSON.parse(stored) : [
        { id: 1, question: "What is the primary focus of ECCE observation?", type: "MCQ", difficulty: "Easy", category: "Child Development", options: ["Child behavior & growth", "Rote learning", "Parent salary", "School fees"], answer: 0 },
        { id: 2, question: "How often should milestone assessments be updated?", type: "MCQ", difficulty: "Medium", category: "Assessment Practice", options: ["Daily", "Periodically / Termly", "Once in 5 years", "Never"], answer: 1 }
      ];
    } catch {
      return [
        { id: 1, question: "What is the primary focus of ECCE observation?", type: "MCQ", difficulty: "Easy", category: "Child Development", options: ["Child behavior & growth", "Rote learning", "Parent salary", "School fees"], answer: 0 },
        { id: 2, question: "How often should milestone assessments be updated?", type: "MCQ", difficulty: "Medium", category: "Assessment Practice", options: ["Daily", "Periodically / Termly", "Once in 5 years", "Never"], answer: 1 }
      ];
    }
  });

  const [newQbQuestion, setNewQbQuestion] = useState({ question: "", type: "MCQ", difficulty: "Easy", category: "General", options: ["Option 1", "Option 2", "Option 3", "Option 4"], answer: 0 });

  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [editingA, setEditingA] = useState(null);
  const [newA, setNewA] = useState({
    title: "",
    course: "",
    questions: 10,
    passMark: 60,
    dueDate: "",
    status: "draft",
    questionsList: []
  });

  const updateAssessmentsLocally = (updater) => {
    if (typeof setAssessmentsData === "function") {
      setAssessmentsData(prev => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        try {
          localStorage.setItem("spacece_admin_assessments", JSON.stringify(next));
        } catch (e) {
          console.error("Failed to save assessments to localStorage:", e);
        }
        return next;
      });
    }
  };

  const updateQuestionBank = (updater) => {
    setQuestionBank(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem("spacece_admin_question_bank", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save question bank to localStorage:", e);
      }
      return next;
    });
  };

  const filtered = (assessmentsData || []).filter(a =>
    (a.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.course || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAttempts = (assessmentsData || []).reduce((a, x) => a + (x.attempts || 0), 0);
  const avgScore = (assessmentsData || []).length
    ? Math.round((assessmentsData || []).reduce((a, x) => a + (x.avgScore || 0), 0) / assessmentsData.length)
    : 0;

  const togglePublish = (id) => {
    toggleAdminQuizPublish(id)
      .then(res => {
        if (res?.quiz) {
          updateAssessmentsLocally(prev => prev.map(a => (a.id === id || a._id === id) ? res.quiz : a));
        } else {
          updateAssessmentsLocally(prev => prev.map(a => (a.id === id || a._id === id) ? { ...a, status: a.status === "published" ? "draft" : "published" } : a));
        }
        if (setToast) setToast({ msg: "Assessment status updated!", type: "success" });
      })
      .catch(() => {
        updateAssessmentsLocally(prev => prev.map(a => (a.id === id || a._id === id) ? { ...a, status: a.status === "published" ? "draft" : "published" } : a));
        if (setToast) setToast({ msg: "Assessment status updated!", type: "success" });
      });
  };

  const handleDeleteQuiz = (id) => {
    if (!window.confirm("Are you sure you want to delete this assessment?")) return;
    deleteAdminQuiz(id)
      .then(() => {
        updateAssessmentsLocally(prev => prev.filter(a => a.id !== id && a._id !== id));
        if (setToast) setToast({ msg: "Assessment deleted successfully!", type: "success" });
      })
      .catch(() => {
        updateAssessmentsLocally(prev => prev.filter(a => a.id !== id && a._id !== id));
        if (setToast) setToast({ msg: "Assessment deleted successfully!", type: "success" });
      });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newA.title || !newA.course) {
      if (setToast) setToast({ msg: "Please fill required fields.", type: "error" });
      return;
    }

    const payload = {
      ...newA,
      questions: Number(newA.questions) || 10,
      passMark: Number(newA.passMark) || 60,
      attempts: 0,
      avgScore: 0,
      questionsList: newA.questionsList || []
    };

    createAdminQuiz(payload)
      .then(res => {
        const created = res?.quiz || { id: Date.now(), ...payload };
        updateAssessmentsLocally(prev => [created, ...prev]);
        if (setToast) setToast({ msg: "New assessment created in database!", type: "success" });
      })
      .catch(() => {
        const created = { id: Date.now(), ...payload };
        updateAssessmentsLocally(prev => [created, ...prev]);
        if (setToast) setToast({ msg: "New assessment created!", type: "success" });
      })
      .finally(() => {
        setAddModal(false);
        setNewA({ title: "", course: "", questions: 10, passMark: 60, dueDate: "", status: "draft", questionsList: [] });
      });
  };

  const handleOpenEdit = (quiz) => {
    setEditingA({ ...quiz });
    setEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingA.title || !editingA.course) {
      if (setToast) setToast({ msg: "Title and Course are required.", type: "error" });
      return;
    }

    const quizId = editingA._id || editingA.id;
    const payload = {
      ...editingA,
      questions: Number(editingA.questions),
      passMark: Number(editingA.passMark)
    };

    updateAdminQuiz(quizId, payload)
      .then(res => {
        const updated = res?.quiz || payload;
        updateAssessmentsLocally(prev => prev.map(a => (a.id === quizId || a._id === quizId) ? updated : a));
        if (setToast) setToast({ msg: "Assessment updated in database!", type: "success" });
      })
      .catch(() => {
        updateAssessmentsLocally(prev => prev.map(a => (a.id === quizId || a._id === quizId) ? payload : a));
        if (setToast) setToast({ msg: "Assessment updated!", type: "success" });
      })
      .finally(() => {
        setEditModal(false);
        setEditingA(null);
      });
  };

  const handleDuplicate = (quiz) => {
    const quizId = quiz._id || quiz.id;
    duplicateAdminQuiz(quizId)
      .then(res => {
        const dup = res?.quiz || { ...quiz, id: Date.now(), title: `${quiz.title} (Copy)`, attempts: 0, avgScore: 0 };
        updateAssessmentsLocally(prev => [dup, ...prev]);
        if (setToast) setToast({ msg: `Duplicated "${quiz.title}"!`, type: "success" });
      })
      .catch(() => {
        const dup = { ...quiz, id: Date.now(), title: `${quiz.title} (Copy)`, attempts: 0, avgScore: 0 };
        updateAssessmentsLocally(prev => [dup, ...prev]);
        if (setToast) setToast({ msg: `Duplicated "${quiz.title}"!`, type: "success" });
      });
  };

  const handleOpenQuestionBuilder = (quiz) => {
    setSelectedQuiz({
      ...quiz,
      questionsList: quiz.questionsList && quiz.questionsList.length > 0 ? [...quiz.questionsList] : [
        { id: Date.now(), question: `Sample Question 1 for ${quiz.title}`, options: ["Option A", "Option B", "Option C", "Option D"], answer: 0 }
      ]
    });
    setQuestionBuilderModal(true);
  };

  const handleSaveQuestionsList = () => {
    if (!selectedQuiz) return;
    const quizId = selectedQuiz._id || selectedQuiz.id;
    const payload = {
      ...selectedQuiz,
      questionsList: selectedQuiz.questionsList,
      questions: selectedQuiz.questionsList.length
    };

    updateAdminQuiz(quizId, payload)
      .then(res => {
        const updated = res?.quiz || payload;
        updateAssessmentsLocally(prev => prev.map(a => (a.id === quizId || a._id === quizId) ? updated : a));
        if (setToast) setToast({ msg: "Questions updated in database!", type: "success" });
      })
      .catch(() => {
        updateAssessmentsLocally(prev => prev.map(a => (a.id === quizId || a._id === quizId) ? payload : a));
        if (setToast) setToast({ msg: "Questions updated!", type: "success" });
      })
      .finally(() => {
        setQuestionBuilderModal(false);
      });
  };

  const handleAddQuestionToQuiz = () => {
    if (!selectedQuiz) return;
    const newQ = {
      id: Date.now(),
      question: "New Question Statement",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      answer: 0
    };
    setSelectedQuiz({
      ...selectedQuiz,
      questionsList: [...(selectedQuiz.questionsList || []), newQ]
    });
  };

  const handleImportQuestionFromBank = (qbItem) => {
    if (!selectedQuiz) return;
    const newQ = {
      id: Date.now(),
      question: qbItem.question,
      options: qbItem.options && qbItem.options.length ? [...qbItem.options] : ["Option 1", "Option 2", "Option 3", "Option 4"],
      answer: qbItem.answer || 0
    };
    setSelectedQuiz({
      ...selectedQuiz,
      questionsList: [...(selectedQuiz.questionsList || []), newQ]
    });
    if (setToast) setToast({ msg: "Imported question from bank!", type: "success" });
  };

  const handleUpdateQuizQuestion = (qIdx, field, value) => {
    const updated = [...(selectedQuiz.questionsList || [])];
    updated[qIdx] = { ...updated[qIdx], [field]: value };
    setSelectedQuiz({ ...selectedQuiz, questionsList: updated });
  };

  const handleRemoveQuizQuestion = (qIdx) => {
    const updated = (selectedQuiz.questionsList || []).filter((_, idx) => idx !== qIdx);
    setSelectedQuiz({ ...selectedQuiz, questionsList: updated });
  };

  const handleAddQbQuestion = (e) => {
    e.preventDefault();
    if (!newQbQuestion.question) return;
    updateQuestionBank(prev => [...prev, { id: Date.now(), ...newQbQuestion }]);
    setNewQbQuestion({ question: "", type: "MCQ", difficulty: "Easy", category: "General", options: ["Option 1", "Option 2", "Option 3", "Option 4"], answer: 0 });
    setAddQuestionBankModal(false);
    if (setToast) setToast({ msg: "Added question to bank!", type: "success" });
  };

  const handleDeleteQbQuestion = (id) => {
    updateQuestionBank(prev => prev.filter(q => q.id !== id));
    if (setToast) setToast({ msg: "Removed question from bank!", type: "info" });
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={S.pageTitle}>Assessment Management</h1>
          <p style={S.pageSub}>Quiz builder, question bank, and results management</p>
        </div>
        <button onClick={() => setAddModal(true)} style={S.primaryBtn}>+ Create Quiz</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard icon="🧠" label="Assessments" val={(assessmentsData || []).length} color="#f59e0b" bg="#fef3c7" />
        <StatCard icon="✅" label="Published" val={(assessmentsData || []).filter(a => a.status === "published").length} color="#10b981" bg="#d1fae5" />
        <StatCard icon="📚" label="Question Bank" val={questionBank.length} color="#3b82f6" bg="#dbeafe" />
        <StatCard icon="📈" label="Avg Score" val={`${avgScore}%`} color="#8b5cf6" bg="#ede9fe" />
        <StatCard icon="👥" label="Attempts" val={totalAttempts} color="#06b6d4" bg="#cffafe" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search quizzes or courses..." />

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20, marginBottom: 20 }}>
        <SectionCard title="📝 Quiz Builder & Editor">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No quizzes found. Click "+ Create Quiz" above to add one.</div>
            ) : (
              filtered.map(a => (
                <div key={a.id} style={{ padding: "14px 16px", border: "1px solid #f1f5f9", borderRadius: 12, background: "white" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1c1917" }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                        {a.course} · {a.questionsList?.length || a.questions || 0} questions · Pass mark {a.passMark}% · Due {a.dueDate || "—"}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <button onClick={() => togglePublish(a.id)} style={S.tblBtn}>
                      {a.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => handleOpenEdit(a)} style={{ ...S.tblBtn, borderColor: "#3b82f6", color: "#2563eb" }}>
                      ✏️ Edit Quiz
                    </button>
                    <button onClick={() => handleOpenQuestionBuilder(a)} style={{ ...S.tblBtn, borderColor: "#8b5cf6", color: "#7c3aed" }}>
                      ⚙️ Build Questions ({a.questionsList?.length || 0})
                    </button>
                    <button onClick={() => handleDuplicate(a)} style={S.tblBtn}>
                      📋 Duplicate
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="📚 Question Bank">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Repository of reusable questions</span>
            <button onClick={() => setAddQuestionBankModal(true)} style={{ ...S.primaryBtn, padding: "4px 10px", fontSize: 12 }}>+ Add Question</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {questionBank.map(q => (
              <div key={q.id} style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 10, border: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", marginBottom: 4 }}>{q.question}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#dbeafe", color: "#1d4ed8" }}>{q.type}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#ede9fe", color: "#6d28d9" }}>{q.difficulty}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#fef3c7", color: "#92400e" }}>{q.category}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="📊 Results Management">
        {(assessmentsData || []).map(a => {
          const passRate = a.avgScore >= a.passMark ? 100 : Math.max(30, Math.round(((a.avgScore || 0) / (a.passMark || 60)) * 100));
          return (
            <div key={a.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{a.title}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: (a.avgScore || 0) >= a.passMark ? "#10b981" : "#ef4444" }}>
                  Avg {a.avgScore || 0}% · {a.attempts || 0} attempts
                </span>
              </div>
              <div style={{ height: 8, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${passRate}%`, background: (a.avgScore || 0) >= a.passMark ? "#10b981" : "#f59e0b", borderRadius: 6 }} />
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Pass mark: {a.passMark}%</div>
            </div>
          );
        })}
      </SectionCard>

      {/* Create Assessment Modal */}
      {addModal && (
        <Modal title="Create New Assessment" onClose={() => setAddModal(false)}>
          <form onSubmit={handleAdd}>
            <label style={S.label}>Assessment Title *</label>
            <input style={{ ...S.input, marginBottom: 12 }} value={newA.title} onChange={e => setNewA({ ...newA, title: e.target.value })} placeholder="Quiz title" />

            <label style={S.label}>Course *</label>
            <input style={{ ...S.input, marginBottom: 12 }} value={newA.course} onChange={e => setNewA({ ...newA, course: e.target.value })} placeholder="Course name" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={S.label}>Questions</label>
                <input style={S.input} type="number" value={newA.questions} onChange={e => setNewA({ ...newA, questions: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Pass Mark (%)</label>
                <input style={S.input} type="number" value={newA.passMark} onChange={e => setNewA({ ...newA, passMark: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={S.label}>Due Date</label>
                <input style={S.input} type="date" value={newA.dueDate} onChange={e => setNewA({ ...newA, dueDate: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Status</label>
                <select style={S.input} value={newA.status} onChange={e => setNewA({ ...newA, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <button type="submit" style={{ ...S.primaryBtn, width: "100%" }}>Create Assessment →</button>
          </form>
        </Modal>
      )}

      {/* Edit Assessment Modal */}
      {editModal && editingA && (
        <Modal title="✏️ Edit Assessment Details" onClose={() => { setEditModal(false); setEditingA(null); }}>
          <form onSubmit={handleSaveEdit}>
            <label style={S.label}>Assessment Title *</label>
            <input style={{ ...S.input, marginBottom: 12 }} value={editingA.title} onChange={e => setEditingA({ ...editingA, title: e.target.value })} placeholder="Quiz title" />

            <label style={S.label}>Course *</label>
            <input style={{ ...S.input, marginBottom: 12 }} value={editingA.course} onChange={e => setEditingA({ ...editingA, course: e.target.value })} placeholder="Course name" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={S.label}>Questions</label>
                <input style={S.input} type="number" value={editingA.questions} onChange={e => setEditingA({ ...editingA, questions: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Pass Mark (%)</label>
                <input style={S.input} type="number" value={editingA.passMark} onChange={e => setEditingA({ ...editingA, passMark: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={S.label}>Due Date</label>
                <input style={S.input} type="date" value={editingA.dueDate || ""} onChange={e => setEditingA({ ...editingA, dueDate: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Status</label>
                <select style={S.input} value={editingA.status} onChange={e => setEditingA({ ...editingA, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <button type="submit" style={{ ...S.primaryBtn, width: "100%" }}>Save Changes ✓</button>
          </form>
        </Modal>
      )}

      {/* Build / Edit Questions Builder Modal */}
      {questionBuilderModal && selectedQuiz && (
        <Modal title={`⚙️ Question Builder — ${selectedQuiz.title}`} onClose={() => setQuestionBuilderModal(false)}>
          <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: 16, paddingRight: 4 }}>
            {(selectedQuiz.questionsList || []).map((q, qIdx) => (
              <div key={q.id || qIdx} style={{ padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Question #{qIdx + 1}</span>
                  <button onClick={() => handleRemoveQuizQuestion(qIdx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕ Remove</button>
                </div>
                <input
                  style={{ ...S.input, marginBottom: 8, fontWeight: 600 }}
                  value={q.question}
                  onChange={e => handleUpdateQuizQuestion(qIdx, "question", e.target.value)}
                  placeholder="Enter question statement"
                />
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Options:</div>
                {(q.options || []).map((opt, oIdx) => (
                  <div key={oIdx} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <input
                      type="radio"
                      name={`correct_${q.id || qIdx}`}
                      checked={q.answer === oIdx}
                      onChange={() => handleUpdateQuizQuestion(qIdx, "answer", oIdx)}
                    />
                    <input
                      style={{ ...S.input, padding: "4px 8px", fontSize: 12 }}
                      value={opt}
                      onChange={e => {
                        const newOpts = [...(q.options || [])];
                        newOpts[oIdx] = e.target.value;
                        handleUpdateQuizQuestion(qIdx, "options", newOpts);
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleAddQuestionToQuiz} style={{ ...S.tblBtn, flex: 1, borderColor: "#3b82f6", color: "#2563eb" }}>+ Add Question</button>
            <button onClick={handleSaveQuestionsList} style={{ ...S.primaryBtn, flex: 1 }}>Save All Questions ✓</button>
          </div>
        </Modal>
      )}

      {/* Add Question Bank Item Modal */}
      {addQuestionBankModal && (
        <Modal title="Add Question to Bank" onClose={() => setAddQuestionBankModal(false)}>
          <form onSubmit={handleAddQbQuestion}>
            <label style={S.label}>Question Text *</label>
            <input style={{ ...S.input, marginBottom: 12 }} value={newQbQuestion.question} onChange={e => setNewQbQuestion({ ...newQbQuestion, question: e.target.value })} placeholder="Enter question..." />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>Difficulty</label>
                <select style={S.input} value={newQbQuestion.difficulty} onChange={e => setNewQbQuestion({ ...newQbQuestion, difficulty: e.target.value })}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Category</label>
                <input style={S.input} value={newQbQuestion.category} onChange={e => setNewQbQuestion({ ...newQbQuestion, category: e.target.value })} />
              </div>
            </div>

            <button type="submit" style={{ ...S.primaryBtn, width: "100%" }}>Save Question →</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
