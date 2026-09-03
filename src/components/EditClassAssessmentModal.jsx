import React, { useState, useRef } from "react";
import { updateClass, updateTeacherClassAssessment, uploadQuestionBank, updateQuestionBankSections } from "../services/api";
import { parseClientDocx } from "../utils/docxClientParser";

export const ECE_ASSESSMENT_TEMPLATES = [
  {
    id: "age_1_2",
    name: "👶 1 to 2 Years Baseline",
    title: "1-2 Years Child Developmental Assessment",
    subject: "Physical & Adaptive Milestones",
    passMark: 60,
    instructions: "Observe walking stability, furniture climbing, toy manipulation, and basic self-help skills.",
    questions: [
      {
        question: "Gross Motor - Walking: Does the child walk independently with few falls?",
        options: ["1 (Not yet)", "2 (Emerging)", "3 (Achieved)"],
        correctAnswer: "3 (Achieved)"
      },
      {
        question: "Gross Motor - Climbing: Does the child climb onto low furniture independently?",
        options: ["1 (Not yet)", "2 (Emerging)", "3 (Achieved)"],
        correctAnswer: "3 (Achieved)"
      },
      {
        question: "Fine Motor - Pincer Grasp: Picks up small food items or toys using thumb and index finger?",
        options: ["1 (Not yet)", "2 (Emerging)", "3 (Achieved)"],
        correctAnswer: "3 (Achieved)"
      },
      {
        question: "Adaptive Skill: Attempts to feed self using fingers or spoon?",
        options: ["1 (Not yet)", "2 (Emerging)", "3 (Achieved)"],
        correctAnswer: "3 (Achieved)"
      }
    ]
  },
  {
    id: "age_2_3",
    name: "🧒 2 to 3 Years Baseline",
    title: "2-3 Years Child Developmental Assessment",
    subject: "Physical, Cognitive & Social",
    passMark: 60,
    instructions: "Evaluate running path control, two-foot jumping, object sorting, and simple social responses.",
    questions: [
      {
        question: "Running & Turning: Runs smoothly, stops, and turns direction on signal without falling?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Jumping Skill: Jumps with both feet off the ground together?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Cognitive Sorting: Sorts toys or blocks by basic primary colors?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Social Interaction: Engages in parallel play next to peers with interest?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      }
    ]
  },
  {
    id: "age_3_4",
    name: "🎨 3 to 4 Years Baseline",
    title: "3-4 Years Child Developmental Assessment",
    subject: "Physical, Language & Cognitive",
    passMark: 65,
    instructions: "Assess line walking, backward stepping, sentence structure, and color/shape recognition.",
    questions: [
      {
        question: "Balance Walk: Walks forward along a straight line for 4+ steps without losing balance?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Backward Step: Takes 3-4 steps backward safely when guided or prompted?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Language: Speaks in full 3-4 word sentences to communicate needs?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Counting: Counts 3-4 objects accurately using one-to-one correspondence?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      }
    ]
  },
  {
    id: "age_4_5",
    name: "🎒 4 to 5 Years Baseline",
    title: "4-5 Years Child Developmental Assessment",
    subject: "Physical & Emotional Regulation",
    passMark: 70,
    instructions: "Evaluate one-foot hopping, alternating foot skipping, story retelling, and emotional control.",
    questions: [
      {
        question: "One-Foot Hopping: Hops on one foot 5 consecutive times while maintaining balance?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Rhythmic Skipping: Skips using alternating feet with rhythm and coordination?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Phonics & Vocabulary: Identifies initial sounds of familiar words and names 5+ letters?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Self-Regulation: Expresses emotions verbally rather than through physical outbursts?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      }
    ]
  },
  {
    id: "age_5_6",
    name: "🎓 5 to 6 Years (School Readiness)",
    title: "5-6 Years School Readiness Assessment",
    subject: "School Readiness & Advanced Cognitive",
    passMark: 70,
    instructions: "Assess stair climbing with alternating feet, phonics blending, number operations, and peer collaboration.",
    questions: [
      {
        question: "Stair Navigation: Walks up and down stairs using alternating feet without holding handrail?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Early Math: Performs simple single-digit addition and subtraction using objects?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Reading Readiness: Blends 3-letter CVC words (e.g. C-A-T) and recognizes rhyming pairs?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      },
      {
        question: "Classroom Readiness: Follows 3-step instructions independently and completes tasks?",
        options: ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"],
        correctAnswer: "3 (Does Independently)"
      }
    ]
  }
];

export default function EditClassAssessmentModal({
  classData,
  allClasses = [],
  isTeacher = false,
  onClose,
  onSave,
  setToast = () => {}
}) {
  const [activeTab, setActiveTab] = useState("settings"); // "settings" | "questions"
  const [scope, setScope] = useState("single"); // "single" | "all_centers"

  // Count matching center classes with the same name
  const matchingClasses = allClasses.filter(c => c && c.name && classData && classData.name && c.name.trim().toLowerCase() === classData.name.trim().toLowerCase());
  const centerNames = matchingClasses.map(c => c.center?.name || c.centerName || "Center").filter(Boolean);
  const uniqueCenterNames = Array.from(new Set(centerNames));

  const defaultQuestions = [
    {
      question: "Sample Question 1: Identify the letter 'A' sound.",
      options: ["Apple", "Ball", "Cat", "Dog"],
      correctAnswer: "Apple",
    },
    {
      question: "Sample Question 2: Which number is greater?",
      options: ["4", "9", "2", "1"],
      correctAnswer: "9",
    },
  ];

  const initialQuestions = (classData?.assessmentQuestionsList && classData.assessmentQuestionsList.length > 0)
    ? classData.assessmentQuestionsList
    : defaultQuestions;

  const [form, setForm] = useState({
    title: classData?.assessmentTitle || `${classData?.name || "Class"} Assessment`,
    subject: classData?.assessmentSubject || "General Assessment",
    passMark: classData?.assessmentPassMark || 60,
    instructions: classData?.assessmentInstructions || "Complete all questions carefully.",
    status: classData?.assessmentStatus || "active",
  });
  const [questionsList, setQuestionsList] = useState(initialQuestions);
  const [editingQIndex, setEditingQIndex] = useState(null); // index or "new"
  const [qForm, setQForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const downloadSampleTemplate = () => {
    const csvContent =
      "Question,Option A,Option B,Option C,Option D,Correct Answer,Domain Category\n" +
      '"Gross Motor - Walking: Does the child walk independently with few falls?",1 (Not yet),2 (Emerging),3 (Achieved),,3 (Achieved),Physical Development\n' +
      '"Gross Motor - Running & Turning: Runs smoothly, stops, and turns direction on signal?",1 (Can\'t do),2 (Emerging),3 (Does Independently),,3 (Does Independently),Physical Development\n' +
      '"Cognitive - Color Sorting: Sorts toys or blocks by basic primary colors?",1 (Can\'t do),2 (Emerging),3 (Does Independently),,3 (Does Independently),Cognitive Development\n' +
      '"Language - Sentences: Speaks in full 3-4 word sentences to communicate needs?",1 (Can\'t do),2 (Emerging),3 (Does Independently),,3 (Does Independently),Language & Communication\n' +
      '"Self-Help: Able to wash and dry hands independently?",Fully Independent,Needs Prompting,Requires Assistance,Cannot Perform,Fully Independent,Adaptive Skills\n';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ECE_Assessment_Template_${(classData?.name || "Format").replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ msg: "Downloaded ECE Assessment Template (.csv)!", type: "success" });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      let extractedQuestions = [];
      let fileTitle = "";
      let fileSubject = "";

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          extractedQuestions = json;
        } else if (json.questions && Array.isArray(json.questions)) {
          extractedQuestions = json.questions;
          if (json.title) fileTitle = json.title;
          if (json.subject) fileSubject = json.subject;
        }
      } else if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) {
          throw new Error("Uploaded CSV file appears empty or only contains headers.");
        }

        const header = lines[0].toLowerCase();
        const startIndex = header.includes("question") ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
          const cleanCols = columns.map(c => c.replace(/^"|"$/g, "").trim());

          if (cleanCols.length >= 2) {
            const qText = cleanCols[0];
            const opts = cleanCols.slice(1, 5).filter(Boolean);
            const cAns = cleanCols[5] || opts[0] || "";
            const cat = cleanCols[6] || "";

            if (qText && opts.length >= 2) {
              extractedQuestions.push({
                question: qText,
                options: opts,
                correctAnswer: cAns
              });
              if (cat && !fileSubject) fileSubject = cat;
            }
          }
        }
      } else if (file.name.endsWith(".docx") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".doc")) {
        try {
          const res = await uploadQuestionBank(classData?.name || "3-4", file);
          if (res && res.questionBank && res.questionBank.sections) {
            const apiQuestions = [];
            res.questionBank.sections.forEach(sec => {
              const qList = sec.questions || sec.items || [];
              qList.forEach(q => {
                const qText = q.questionText || q.text || q.title || q.question || "";
                const opts = q.options || q.ratingScale || ["1 (Not yet)", "2 (Emerging)", "3 (Achieved)"];
                const cAns = q.correctAnswer || (opts ? opts[opts.length - 1] : "3 (Achieved)");
                if (qText) {
                  apiQuestions.push({
                    question: qText,
                    options: opts,
                    correctAnswer: cAns,
                    domain: sec.title || "General Assessment"
                  });
                }
              });
            });
            extractedQuestions = apiQuestions;
          }
        } catch (err) {
          // Client-side fallback if server endpoint is 404 or fails
          try {
            const buffer = await file.arrayBuffer();
            const clientParsed = await parseClientDocx(buffer);
            if (clientParsed && clientParsed.length > 0) {
              extractedQuestions = clientParsed;
            } else {
              throw err;
            }
          } catch (fallbackErr) {
            throw new Error(err.message || "Failed to parse document.");
          }
        }
      }

      if (extractedQuestions.length === 0) {
        throw new Error("No valid questions found in uploaded file. Please use the sample template format.");
      }

      setQuestionsList(extractedQuestions);
      setForm(prev => ({
        ...prev,
        title: fileTitle || `${classData?.name || "Class"} — Uploaded Assessment (${file.name})`,
        subject: fileSubject || prev.subject || "Uploaded Assessment"
      }));

      setToast({
        msg: `Successfully loaded ${extractedQuestions.length} questions from "${file.name}"! Click "Save Assessment" to update database.`,
        type: "success"
      });
    } catch (err) {
      setToast({ msg: err.message || "Error reading uploaded file.", type: "error" });
    } finally {
      setUploadingFile(false);
      if (event.target) event.target.value = "";
    }
  };

  const applyTemplate = (templateId) => {
    const tpl = ECE_ASSESSMENT_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    setForm(prev => ({
      ...prev,
      title: `${classData?.name || "Class"} — ${tpl.title}`,
      subject: tpl.subject,
      passMark: tpl.passMark,
      instructions: tpl.instructions
    }));
    setQuestionsList(tpl.questions);
    setToast({ msg: `Applied "${tpl.name}" template with ${tpl.questions.length} questions!`, type: "success" });
  };

  const openAddQuestion = () => {
    setQForm({
      question: "",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
    });
    setEditingQIndex("new");
  };

  const openEditQuestion = (index) => {
    const q = questionsList[index];
    setQForm({
      question: q.question || "",
      options: q.options && q.options.length ? [...q.options] : ["", "", "", ""],
      correctAnswer: q.correctAnswer || (q.options ? q.options[0] : ""),
    });
    setEditingQIndex(index);
  };

  const saveQuestion = () => {
    if (!qForm.question.trim()) {
      setToast({ msg: "Question text is required.", type: "error" });
      return;
    }
    const cleanOptions = qForm.options.map(o => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setToast({ msg: "Please provide at least 2 options.", type: "error" });
      return;
    }
    const finalQuestion = {
      question: qForm.question.trim(),
      options: cleanOptions,
      correctAnswer: qForm.correctAnswer || cleanOptions[0],
    };

    if (editingQIndex === "new") {
      setQuestionsList(prev => [...prev, finalQuestion]);
    } else {
      setQuestionsList(prev => prev.map((q, idx) => idx === editingQIndex ? finalQuestion : q));
    }
    setEditingQIndex(null);
    setToast({ msg: "Question saved!", type: "success" });
  };

  const deleteQuestion = (index) => {
    setQuestionsList(prev => prev.filter((_, idx) => idx !== index));
    setToast({ msg: "Question removed.", type: "info" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        assessmentTitle: form.title,
        assessmentSubject: form.subject,
        assessmentQuestions: questionsList.length,
        assessmentPassMark: Number(form.passMark),
        assessmentInstructions: form.instructions,
        assessmentStatus: form.status,
        assessmentQuestionsList: questionsList,
        applyToAllCenters: scope === "all_centers"
      };

      const classId = classData._id || classData.id;
      if (isTeacher) {
        await updateTeacherClassAssessment(classId, payload);
      } else {
        await updateClass(classId, payload);
      }

      // Sync active question bank in QuestionBank collection for class name and ageGroup with domain grouping
      const domainGroups = {};
      questionsList.forEach(q => {
        let dTitle = q.domain || q.category || "";
        if (!dTitle && q.milestone && !q.milestone.includes("Level")) dTitle = q.milestone;
        if (!dTitle) {
          const qText = q.question || "";
          if (/physical|motor|hopping|climbing|walking|running|jumping/i.test(qText)) dTitle = "Physical Development";
          else if (/cognitive|sorting|math|counting|shape|color/i.test(qText)) dTitle = "Cognitive Development";
          else if (/social|peer|play|turn|share|friend/i.test(qText)) dTitle = "Social-Emotional Development";
          else if (/language|word|sentence|talk|speak|phonics|reading/i.test(qText)) dTitle = "Language & Communication";
          else if (/adaptive|self-help|wash|feed|dress|toilet/i.test(qText)) dTitle = "Adaptive (Self-Help) Skills";
          else if (/sensory|aesthetic|art|draw|music|sing/i.test(qText)) dTitle = "Sensory & Aesthetic Development";
          else dTitle = form.subject || "Class Assessment";
        }
        if (!domainGroups[dTitle]) domainGroups[dTitle] = [];
        domainGroups[dTitle].push(q);
      });

      const sectionPayload = Object.keys(domainGroups).map((dTitle, dIdx) => ({
        id: `sec_${dIdx + 1}`,
        number: dIdx + 1,
        title: dTitle,
        questions: domainGroups[dTitle].map(q => ({
          questionText: q.question,
          question: q.question,
          options: q.options || ["1 (Not yet)", "2 (Emerging)", "3 (Achieved)"],
          correctAnswer: q.correctAnswer || (q.options ? q.options[q.options.length - 1] : "3 (Achieved)")
        })),
        items: domainGroups[dTitle].map((q, qIdx) => ({
          id: `q_${dIdx + 1}_${qIdx + 1}`,
          title: q.question,
          text: q.question,
          milestone: q.milestone || dTitle,
          ratingScale: q.options || ["1 (Not yet)", "2 (Emerging)", "3 (Achieved)"]
        }))
      }));

      if (classData?.name) {
        await updateQuestionBankSections(classData.name, sectionPayload).catch(() => {});
      }
      if (classData?.ageGroup && classData.ageGroup !== classData.name) {
        await updateQuestionBankSections(classData.ageGroup, sectionPayload).catch(() => {});
      }

      const scopeText = (scope === "all_centers" && uniqueCenterNames.length > 1)
        ? `across ${uniqueCenterNames.length} centers!`
        : `for ${classData.name}!`;

      setToast({
        msg: `Assessment for ${classData.name} saved with ${questionsList.length} questions ${scopeText}`,
        type: "success"
      });

      if (onSave) onSave();
      onClose();
    } catch (err) {
      setToast({ msg: "Failed to update assessment: " + err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const lastUpdated = classData?.lastUpdatedBy;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        width: "100%",
        maxWidth: 780,
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #e2e8f0"
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 24px",
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📝 Edit Assessment — {classData?.name}</span>
              {isTeacher && <span style={{ background: "rgba(255,255,255,0.2)", fontSize: 11, padding: "2px 8px", borderRadius: 12 }}>Teacher View</span>}
            </h3>
            {lastUpdated && lastUpdated.name && (
              <p style={{ margin: "4px 0 0 0", fontSize: 11, opacity: 0.85 }}>
                Last updated by <strong>{lastUpdated.name}</strong> ({lastUpdated.role}) on {new Date(lastUpdated.updatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "white",
              fontSize: 18,
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Step Tabs */}
        <div style={{ display: "flex", gap: 6, borderBottom: "2px solid #f1f5f9", background: "#f8fafc", padding: "8px 24px 0 24px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: activeTab === "settings" ? "3px solid #7c3aed" : "3px solid transparent",
              background: activeTab === "settings" ? "#ffffff" : "transparent",
              color: activeTab === "settings" ? "#6d28d9" : "#64748b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              borderRadius: "8px 8px 0 0"
            }}
          >
            📋 Assessment Details & Templates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: activeTab === "questions" ? "3px solid #7c3aed" : "3px solid transparent",
              background: activeTab === "questions" ? "#ffffff" : "transparent",
              color: activeTab === "questions" ? "#6d28d9" : "#64748b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>❓ Question Bank</span>
            <span style={{ background: "#7c3aed", color: "white", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>
              {questionsList.length}
            </span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          <form onSubmit={handleSubmit}>
            {activeTab === "settings" && (
              <div>
                {/* SCOPE SELECTION CARD */}
                {!isTeacher && (
                  <div style={{
                    background: scope === "all_centers" ? "linear-gradient(135deg, #eff6ff, #dbeafe)" : "#f8fafc",
                    border: scope === "all_centers" ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                    transition: "all 0.2s ease"
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: scope === "all_centers" ? "#1e40af" : "#334155", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                      🎯 TARGET UPDATE SCOPE
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="updateScope"
                          value="single"
                          checked={scope === "single"}
                          onChange={() => setScope("single")}
                          style={{ accentColor: "#7c3aed", width: 16, height: 16 }}
                        />
                        <span>🎯 Apply to this center only (<strong>{classData?.center?.name || classData?.centerName || "Current Center"}</strong> — {classData?.name})</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="updateScope"
                          value="all_centers"
                          checked={scope === "all_centers"}
                          onChange={() => setScope("all_centers")}
                          style={{ accentColor: "#7c3aed", width: 16, height: 16 }}
                        />
                        <span>🌐 Apply to <strong>"{classData?.name}"</strong> across ALL centers {uniqueCenterNames.length > 0 && `(${uniqueCenterNames.length} centers found: ${uniqueCenterNames.slice(0, 3).join(", ")}${uniqueCenterNames.length > 3 ? "..." : ""})`}</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Download Template & File Upload Card */}
                <div style={{
                  background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                  border: "1.5px solid #ddd6fe",
                  borderRadius: 14,
                  padding: "16px",
                  marginBottom: 18,
                  boxShadow: "0 2px 8px rgba(124, 58, 237, 0.06)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>📥 ASSESSMENT FILE TEMPLATE & UPLOAD HUB</span>
                        <span style={{ background: "#7c3aed", color: "white", fontSize: 10, padding: "2px 7px", borderRadius: 10 }}>Auto-Parse</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "#6d28d9", marginTop: 2 }}>
                        Download the sample template file to create questions in Excel/Word/CSV, or upload your finished document:
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={downloadSampleTemplate}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        border: "1.5px solid #7c3aed",
                        background: "white",
                        color: "#6d28d9",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        transition: "all 0.15s ease"
                      }}
                    >
                      📥 Download Sample Template (.csv)
                    </button>
                  </div>

                  {/* Select File to Upload Box */}
                  <div style={{
                    background: "white",
                    border: "2px dashed #a78bfa",
                    borderRadius: 10,
                    padding: "14px",
                    textAlign: "center",
                    marginBottom: 12
                  }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .xlsx, .xls, .docx, .doc, .json, .txt"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                      id="class-assessment-file-upload"
                    />
                    <label
                      htmlFor="class-assessment-file-upload"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 18px",
                        borderRadius: 8,
                        background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        color: "white",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: uploadingFile ? "wait" : "pointer",
                        boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)"
                      }}
                    >
                      <span>📁</span>
                      <span>{uploadingFile ? "Uploading & Parsing Questions..." : "Select My File to Upload"}</span>
                    </label>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                      Supported formats: Excel (.xlsx, .csv), Word (.docx), JSON, Text. Questions are automatically extracted into the Question Bank.
                    </div>
                  </div>

                  {/* Quick ECE Preset Templates */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6d28d9", marginBottom: 6, textTransform: "uppercase" }}>
                      Or Quick Load Pre-Built ECE Templates:
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {ECE_ASSESSMENT_TEMPLATES.map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyTemplate(tpl.id)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 6,
                            border: "1px solid #c4b5fd",
                            background: "white",
                            color: "#6d28d9",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Assessment Title *
                  </label>
                  <input
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box"
                    }}
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Nursery A End-of-Term Assessment"
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Subject / Category
                    </label>
                    <input
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Early Literacy & Numeracy"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Status
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Total Questions Count
                    </label>
                    <input
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        background: "#f1f5f9",
                        boxSizing: "border-box"
                      }}
                      value={questionsList.length}
                      disabled
                    />
                    <span style={{ fontSize: 10.5, color: "#64748b", marginTop: 2, display: "block" }}>
                      Managed automatically via Question Bank tab.
                    </span>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Passing Mark (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                      value={form.passMark}
                      onChange={e => setForm({ ...form, passMark: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Instructions
                  </label>
                  <textarea
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      resize: "vertical",
                      boxSizing: "border-box"
                    }}
                    value={form.instructions}
                    onChange={e => setForm({ ...form, instructions: e.target.value })}
                    placeholder="Complete all questions carefully..."
                  />
                </div>
              </div>
            )}

            {activeTab === "questions" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                      Question Bank ({questionsList.length})
                    </h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "#64748b" }}>
                      Questions configured here will be presented to children during assessment.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddQuestion}
                    style={{
                      background: "#7c3aed",
                      color: "white",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    ➕ Add Question
                  </button>
                </div>

                {/* Question Editor Inline Form */}
                {editingQIndex !== null && (
                  <div style={{
                    background: "#f8fafc",
                    border: "2px solid #7c3aed",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16
                  }}>
                    <h5 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700, color: "#6d28d9" }}>
                      {editingQIndex === "new" ? "➕ Add New Question" : `✏️ Edit Question #${editingQIndex + 1}`}
                    </h5>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                        Question Text *
                      </label>
                      <input
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                        value={qForm.question}
                        onChange={e => setQForm({ ...qForm, question: e.target.value })}
                        placeholder="e.g. Which number comes after 3?"
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      {qForm.options.map((opt, idx) => (
                        <div key={idx}>
                          <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "#64748b", marginBottom: 2 }}>
                            Option {String.fromCharCode(65 + idx)}
                          </label>
                          <input
                            style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                            value={opt}
                            onChange={e => {
                              const newOpts = [...qForm.options];
                              newOpts[idx] = e.target.value;
                              setQForm({ ...qForm, options: newOpts });
                            }}
                            placeholder={`Option ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                        Correct Answer
                      </label>
                      <select
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                        value={qForm.correctAnswer}
                        onChange={e => setQForm({ ...qForm, correctAnswer: e.target.value })}
                      >
                        {qForm.options.map((opt, idx) => (
                          <option key={idx} value={opt || `Option ${idx + 1}`}>
                            Option {String.fromCharCode(65 + idx)}: {opt || `(Empty)`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setEditingQIndex(null)}
                        style={{ background: "#e2e8f0", color: "#475569", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveQuestion}
                        style={{ background: "#7c3aed", color: "white", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Save Question
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Questions */}
                {questionsList.length === 0 ? (
                  <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13, background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                    No questions added yet. Click "+ Add Question" or select a Quick Template above.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {questionsList.map((q, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          padding: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start"
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                            {idx + 1}. {q.question}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                            {q.options && q.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  background: opt === q.correctAnswer ? "#dcfce7" : "#f1f5f9",
                                  color: opt === q.correctAnswer ? "#15803d" : "#475569",
                                  border: opt === q.correctAnswer ? "1px solid #86efac" : "1px solid #e2e8f0",
                                  fontWeight: opt === q.correctAnswer ? 700 : 500
                                }}
                              >
                                {opt === q.correctAnswer ? "✓ " : ""}{opt}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => openEditQuestion(idx)}
                            style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(idx)}
                            style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid #e2e8f0"
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "9px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)"
                }}
              >
                {saving ? "Saving Assessment..." : `Save Assessment ✓`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
