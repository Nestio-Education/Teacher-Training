import { useState, useEffect, useRef } from "react";
import { SectionCard, S, Badge } from "../components/Shared";
import { getTeacherMe, getTeacherChildren, getChildAttendance, saveChildAttendance, deleteChildAttendance, deleteTeacherChild, createTeacherChild, getTeacherClasses, createTeacherChildrenBulk, saveChildAssessment, getActiveQuestionBank, uploadQuestionBank, updateQuestionBankSections } from "../services/api";
import * as XLSX from "xlsx";
//import { ..., updateQuestionBankSections } from "../services/api";
// Prajwal start
import ChildDashboardModal from "./ChildDashboardModal";
import { AGE_GROUPS, SECTIONS_2_3_YEARS, RATING_SCALE_3, computeSectionScores } from "../data/childAssessmentSections";
// Prajwal end
// End: Dnyaneshwari Thorat

const EMAILJS_SERVICE_ID  = "service_ckzt1le";
const EMAILJS_TEMPLATE_ID = "template_xycsvf7";
const EMAILJS_PUBLIC_KEY  = "yPV6fZ9hYl5XpEQ1w";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const generateOTP   = () => String(Math.floor(100000 + Math.random() * 900000));

let emailJsLoaded = false;

export default function AttendanceManager({ user, onRosterChange }) {
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceDict, setAttendanceDict] = useState({});
  const [isSavedRecord, setIsSavedRecord] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  // Start: Dnyaneshwari Thorat
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [excelStudents, setExcelStudents] = useState([]);
  // End: Dnyaneshwari Thorat
  // Prajwal start
  const [viewChild, setViewChild] = useState(null);
  // Prajwal end
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentAge, setNewStudentAge] = useState("");
  const [newStudentGender, setNewStudentGender] = useState("");
  const [newStudentParentName, setNewStudentParentName] = useState("");
  const [newStudentParentPhone, setNewStudentParentPhone] = useState("");
  const [newStudentClassId, setNewStudentClassId] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [rosterVersion, setRosterVersion] = useState(0);

  // OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState("sending"); // "sending"|"input"|"verifying"
  const [otpInput, setOtpInput] = useState(["","","","","",""]);
  const [pendingChange, setPendingChange] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Prajwal start — Bulk Assessment & Question Manager
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentClassId, setAssessmentClassId] = useState("");
  const [assessmentStage, setAssessmentStage] = useState("Baseline");
  const [assessmentClassStudents, setAssessmentClassStudents] = useState([]);
  const [loadingAssessmentRoster, setLoadingAssessmentRoster] = useState(false);

  const [questionBank, setQuestionBank] = useState(null);       // { sections, version, ... } or null
  const [loadingQuestionBank, setLoadingQuestionBank] = useState(false);
  const [qbUploadFile, setQbUploadFile] = useState(null);
  const [qbUploading, setQbUploading] = useState(false);
  const [qbMode, setQbMode] = useState("collect");               // "collect" | "setup" | "update"

  const [assessmentUploadRows, setAssessmentUploadRows] = useState([]);
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);
  const [lastUploadedQbInfo, setLastUploadedQbInfo] = useState(null);

  const [assessmentOption, setAssessmentOption] = useState("upload"); // "upload" | "questions"
  const [editableSections, setEditableSections] = useState([]);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [directScoreStudentId, setDirectScoreStudentId] = useState("");
  const [directScores, setDirectScores] = useState({});

  const selectedAssessmentClass = classes.find(c => (c._id || c.id) === assessmentClassId);
  const assessmentAgeGroup = selectedAssessmentClass?.ageGroup || "";
  // Prajwal end

  const otpRef = useRef(null);
  const cooldownRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Load teacher profile, center, and class on mount
  // Load teacher profile, center, and class on mount or when user updates
  useEffect(() => {
    if (user) {
      setTeacherProfile(user);
      const defaultClassId = (user.teacherProfile?.classes || [])[0]?._id || (user.teacherProfile?.classes || [])[0];
      
      getTeacherClasses()
        .then(classRes => {
          const cls = classRes.classes || [];
          setClasses(cls);
          if (defaultClassId && !selectedClassId) {
            setSelectedClassId(defaultClassId);
          } else if (cls.length > 0 && !selectedClassId) {
            setSelectedClassId(cls[0]._id || cls[0].id);
          }
        })
        .catch(err => {
          console.error("Error fetching teacher classes:", err);
        });
    }
  }, [user]);

  // Fetch children list and attendance for selected date
  useEffect(() => {
    if (!teacherProfile) return;
    const classId = selectedClassId || (teacherProfile?.teacherProfile?.classes || [])[0]?._id || (teacherProfile?.teacherProfile?.classes || [])[0];
    setLoading(true);

    Promise.all([
      getTeacherChildren(classId).catch(err => {
        console.warn("getTeacherChildren notice:", err?.message);
        return { children: [] };
      }),
      getChildAttendance({ date: selectedDate, classId: classId }).catch(err => {
        console.warn("getChildAttendance notice:", err?.message);
        return { sessions: [] };
      })
    ]).then(([childrenRes, attendanceRes]) => {
      const dbChildren = childrenRes?.children || [];
      const currentSelectedClass = classes.find(c => (c._id || c.id) === classId);
      const roster = dbChildren.map(c => ({
        ...c,
        id: c._id || c.id,
        rollNo: c.rollNo || "N/A",
        name: c.fullName || c.name,
        dob: c.dateOfBirth || c.dob,
        age: c.age,
        gender: c.gender,
        className: c.class?.name || currentSelectedClass?.name,
        ageGroup: c.class?.ageGroup || c.ageGroup || currentSelectedClass?.ageGroup,
      }));
      setStudents(roster);

      const sessions = attendanceRes?.sessions || [];
      const classSession = sessions.find(s => {
        const scid = s.class?._id || s.class?.id || s.class;
        return scid === classId;
      });

      if (classSession) {
        const dict = {};
        const statusMap = { present: "P", absent: "A", late: "L" };
        (classSession.records || []).forEach(r => {
          const cid = r.child?._id || r.child?.id || r.child;
          dict[cid] = statusMap[r.status] || "P";
        });
        setAttendanceDict(dict);
        setIsSavedRecord(true);
      } else {
        const dict = {};
        roster.forEach(st => {
          dict[st.id] = "P";
        });
        setAttendanceDict(dict);
        setIsSavedRecord(false);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Error loading roster/attendance:", err);
      setLoading(false);
    });
  }, [selectedDate, teacherProfile, selectedClassId, rosterVersion]);

  // OTP expiry countdown
  useEffect(() => {
    if (!otpExpiry) return;
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(tick);
        setOtpError("OTP has expired. Please request a new one.");
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [otpExpiry]);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  // ── Load roster when class picked ──
  useEffect(() => {
    if (!showAssessmentModal || !assessmentClassId) { setAssessmentClassStudents([]); return; }
    setLoadingAssessmentRoster(true);
    getTeacherChildren(assessmentClassId)
      .then(res => {
        const kids = (res.children || []).map(c => ({
          id: c._id || c.id, rollNo: c.rollNo || "N/A", name: c.fullName || c.name,
        }));
        setAssessmentClassStudents(kids);
      })
      .catch(err => { console.error(err); triggerToast("Failed to load class roster.", true); })
      .finally(() => setLoadingAssessmentRoster(false));
  }, [assessmentClassId, showAssessmentModal]);

  // ── Load (or discover absence of) the active question bank for this age group ──
  useEffect(() => {
    if (!showAssessmentModal || !assessmentAgeGroup) { setQuestionBank(null); setEditableSections([]); return; }
    setLoadingQuestionBank(true);
    setQuestionBank(null);
    const fallbackSections = AGE_GROUPS[assessmentAgeGroup] || SECTIONS_2_3_YEARS;
    getActiveQuestionBank(assessmentAgeGroup)
      .then(res => {
        setQuestionBank(res.questionBank);
        setEditableSections(res.questionBank?.sections ? JSON.parse(JSON.stringify(res.questionBank.sections)) : JSON.parse(JSON.stringify(fallbackSections)));
        setQbMode("collect");
      })
      .catch(err => {
        // 404 = no question bank yet in DB for this age group — use default fallback sections
        const is404 = err?.response?.status === 404 || err?.message?.includes("No question bank found");
        if (is404) {
          setQuestionBank(null);
          setEditableSections(JSON.parse(JSON.stringify(fallbackSections)));
          setQbMode("setup");
        } else {
          console.error("Error loading question bank:", err);
          setEditableSections(JSON.parse(JSON.stringify(fallbackSections)));
        }
      })
      .finally(() => setLoadingQuestionBank(false));
  }, [assessmentAgeGroup, showAssessmentModal]);

  const triggerToast = (msg, isError = false) => {
    if (isError) { setErrorMsg(msg); setTimeout(() => setErrorMsg(""), 4000); }
    else { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 4000); }
  };

  const ensureEmailJs = () =>
    new Promise((resolve, reject) => {
      if (emailJsLoaded && window.emailjs) { resolve(); return; }
      if (window.emailjs) { emailJsLoaded = true; resolve(); return; }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
      script.onload = () => {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
        emailJsLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load EmailJS SDK"));
      document.head.appendChild(script);
    });

  const sendOtpEmail = async (otp, studentName, oldStatus, newStatus) => {
    await ensureEmailJs();
    const label = s => s === "P" ? "Present" : s === "A" ? "Absent" : "Leave";
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: user.email,
      teacher_name: user.name || "Teacher",
      passcode: otp,
      student_name: studentName,
      date: selectedDate,
      old_status: label(oldStatus),
      new_status: label(newStatus),
    });
  };

  const startCooldown = () => {
    clearInterval(cooldownRef.current);
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const doSendOtp = async (studentName, oldStatus, newStatus) => {
    const otp = generateOTP();
    otpRef.current = otp;
    setOtpStep("sending");
    try {
      await sendOtpEmail(otp, studentName, oldStatus, newStatus);
      setOtpExpiry(Date.now() + OTP_EXPIRY_MS);
      setOtpStep("input");
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      startCooldown();
    } catch (err) {
      console.error("EmailJS error:", err);
      setOtpError("Failed to send OTP. Please check your EmailJS configuration.");
      setOtpStep("input");
    }
  };

  // Start: Dnyaneshwari Thorat
  const handleStatusToggle = (childId, targetStatus) => {
    setAttendanceDict(prev => ({ ...prev, [childId]: targetStatus }));
  };
  // End: Dnyaneshwari Thorat

  const handleOtpDigit = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otpInput];
    updated[index] = value.slice(-1);
    setOtpInput(updated);
    setOtpError("");
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpInput[index] && index > 0)
      otpInputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const updated = ["","","","","",""];
    pasted.split("").forEach((ch, i) => { updated[i] = ch; });
    setOtpInput(updated);
    otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const saveAttendanceToDb = (dict) => {
    const centerId = teacherProfile?.teacherProfile?.center?._id || teacherProfile?.teacherProfile?.center;
    const classId = selectedClassId || (teacherProfile?.teacherProfile?.classes || [])[0]?._id || (teacherProfile?.teacherProfile?.classes || [])[0];

    if (!centerId || !classId) {
      return Promise.reject(new Error("Center/Class assignment missing in teacher profile."));
    }

    const recordsPayload = Object.entries(dict).map(([childId, status]) => {
      const statusMap = { P: "present", A: "absent", L: "late" };
      return {
        childId,
        status: statusMap[status] || "present"
      };
    });

    return saveChildAttendance({
      centerId,
      classId,
      attendanceDate: selectedDate,
      records: recordsPayload
    });
  };

  const handleVerifyOtp = () => {
    if (timeLeft === 0) { setOtpError("OTP has expired. Please request a new one."); return; }
    const entered = otpInput.join("");
    if (entered.length < 6) { setOtpError("Please enter all 6 digits."); return; }
    setOtpStep("verifying");
    setTimeout(() => {
      if (entered === otpRef.current) {
        if (pendingChange) {
          const updatedDict = { ...attendanceDict, [pendingChange.childId]: pendingChange.nextStatus };
          setAttendanceDict(updatedDict);
          saveAttendanceToDb(updatedDict)
            .then(() => {
              triggerToast("✅ OTP verified and attendance updated in database!");
              onRosterChange?.();
            })
            .catch(err => {
              console.error("Error saving attendance:", err);
              triggerToast("Failed to save to database: " + err.message, true);
            });
        }
        setShowOtpModal(false);
        setPendingChange(null);
        otpRef.current = null;
      } else {
        setOtpStep("input");
        setOtpError("❌ Incorrect OTP. Please check your email.");
        setOtpInput(["","","","","",""]);
        otpInputRefs.current[0]?.focus();
      }
    }, 800);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !pendingChange) return;
    setOtpInput(["","","","","",""]);
    setOtpError("");
    setOtpExpiry(null);
    setTimeLeft(null);
    await doSendOtp(pendingChange.studentName, pendingChange.currentStatus, pendingChange.nextStatus);
    triggerToast("New OTP sent to your email.");
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setPendingChange(null);
    otpRef.current = null;
    setOtpInput(["","","","","",""]);
    setOtpError("");
    clearInterval(cooldownRef.current);
  };

  // Start: Dnyaneshwari Thorat
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const rows = parsedData.filter(row => row && row.length > 0);
        if (rows.length === 0) {
          triggerToast("The Excel sheet is empty.", true);
          return;
        }
        
        let startIndex = 0;
        let nameIdx = 0, ageIdx = 1, genderIdx = 2, parentNameIdx = 3, parentPhoneIdx = 4;
        
        const firstRow = rows[0].map(c => String(c || "").toLowerCase().trim());
        const hasHeader = firstRow.some(val => val.includes("name") || val.includes("age") || val.includes("gender") || val.includes("parent"));
        
        if (hasHeader) {
          startIndex = 1;
          firstRow.forEach((val, idx) => {
            if (val.includes("parent name") || val.includes("parent_name") || val.includes("guardian name") || val.includes("father") || val.includes("mother")) {
              parentNameIdx = idx;
            } else if (val.includes("phone") || val.includes("contact") || val.includes("mobile") || val.includes("parent phone")) {
              parentPhoneIdx = idx;
            } else if (val.includes("name") || val.includes("student") || val.includes("full name")) {
              nameIdx = idx;
            } else if (val.includes("age") || val.includes("years")) {
              ageIdx = idx;
            } else if (val.includes("gender") || val.includes("sex")) {
              genderIdx = idx;
            }
          });
        }
        
        const parsedStudents = [];
        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const name = row[nameIdx] ? String(row[nameIdx]).trim() : "";
          if (!name) continue;
          
          const age = row[ageIdx] ? parseInt(row[ageIdx], 10) : "";
          let gender = row[genderIdx] ? String(row[genderIdx]).trim() : "Male";
          gender = gender.toLowerCase().startsWith("f") ? "Female" : "Male";
          const parentName = row[parentNameIdx] ? String(row[parentNameIdx]).trim() : "";
          const parentPhone = row[parentPhoneIdx] ? String(row[parentPhoneIdx]).trim() : "";
          
          parsedStudents.push({ name, age, gender, parentName, parentPhone });
        }
        
        if (parsedStudents.length === 0) {
          triggerToast("No students could be parsed from the Excel file.", true);
        } else {
          setExcelStudents(parsedStudents);
          triggerToast(`Parsed ${parsedStudents.length} students from Excel file!`);
        }
      } catch (err) {
        console.error("Excel parse error:", err);
        triggerToast("Failed to parse Excel file. Make sure it is valid.", true);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelBulkSubmit = () => {
    const classId = selectedClassId || (teacherProfile?.teacherProfile?.classes || [])[0]?._id || (teacherProfile?.teacherProfile?.classes || [])[0];
    if (!classId) {
      triggerToast("No class selected.", true);
      return;
    }
    const childrenList = excelStudents.map(st => ({
      fullName: st.name,
      age: st.age ? Number(st.age) : undefined,
      gender: st.gender || "Male",
      guardianName: st.parentName || undefined,
      guardianPhone: st.parentPhone || undefined,
      classId,
      status: "active"
    }));

    createTeacherChildrenBulk(childrenList)
      .then(() => {
        triggerToast(`Bulk enrolled ${childrenList.length} children successfully!`);
        setExcelStudents([]);
        setRosterVersion(v => v + 1);
        onRosterChange?.();
      })
      .catch(err => {
        console.error("Bulk enroll error:", err);
        triggerToast("Failed bulk enrollment: " + err.message, true);
      });
  };
  // End: Dnyaneshwari Thorat

  const handleAddStudent = (e) => {
    e.preventDefault();
    const fallbackClassId = selectedClassId || (teacherProfile?.teacherProfile?.classes || [])[0]?._id || (teacherProfile?.teacherProfile?.classes || [])[0];
    const classId = newStudentClassId || fallbackClassId;

    // Start: Dnyaneshwari Thorat
    if (bulkMode) {
      if (excelStudents.length === 0) {
        triggerToast("Please upload a valid Excel file first.", true);
        return;
      }
      const childrenList = excelStudents.map(st => ({
        fullName: st.name,
        age: st.age ? Number(st.age) : undefined,
        gender: st.gender || "Male",
        guardianName: st.parentName || undefined,
        guardianPhone: st.parentPhone || undefined,
        classId,
        status: "active"
      }));

      createTeacherChildrenBulk(childrenList)
        .then(() => {
          triggerToast(`Bulk enrolled ${childrenList.length} children successfully!`);
          setExcelStudents([]);
          setShowAddModal(false);
          setRosterVersion(v => v + 1);
          onRosterChange?.();
        })
        .catch(err => {
          console.error("Bulk enroll error:", err);
          triggerToast("Failed bulk enrollment: " + err.message, true);
        });
      return;
    }
    // End: Dnyaneshwari Thorat

    if (!newStudentName.trim()) return;

    createTeacherChild({
      fullName: newStudentName.trim(),
      age: newStudentAge ? Number(newStudentAge) : undefined,
      gender: newStudentGender || undefined,
      guardianName: newStudentParentName || undefined,
      guardianPhone: newStudentParentPhone || undefined,
      classId,
      status: "active"
    })
      .then(() => {
        triggerToast("Child enrolled successfully in database!");
        setNewStudentName("");
        setNewStudentAge("");
        setNewStudentGender("");
        setNewStudentParentName("");
        setNewStudentParentPhone("");
        setNewStudentClassId("");
        setShowAddModal(false);
        setRosterVersion(v => v + 1);
        onRosterChange?.();
      })
      .catch(err => {
        console.error("Error adding child:", err);
        triggerToast("Failed to add child: " + err.message, true);
      });
  };

  const handleSaveSheet = () => {
    saveAttendanceToDb(attendanceDict)
      .then(() => {
        setIsSavedRecord(true);
        triggerToast(`Attendance sheet submitted to database for ${selectedDate}`);
        onRosterChange?.();
      })
      .catch(err => {
        console.error("Error saving attendance:", err);
        triggerToast("Failed to submit sheet: " + err.message, true);
      });
  };

  // Start: Dnyaneshwari Thorat
  const handleDeleteSheetRecord = () => {
    const classId = selectedClassId || (teacherProfile?.teacherProfile?.classes || [])[0]?._id || (teacherProfile?.teacherProfile?.classes || [])[0];
    if (!classId) {
      triggerToast("No class selected.", true);
      return;
    }

    if (!window.confirm("Delete this saved attendance record? You can add a new one after this.")) return;

    deleteChildAttendance({ classId, attendanceDate: selectedDate })
      .then(() => {
        const resetDict = {};
        students.forEach(st => { resetDict[st.id] = "P"; });
        setAttendanceDict(resetDict);
        setIsSavedRecord(false);
        setRosterVersion(v => v + 1);
        triggerToast("Attendance record deleted successfully.");
        onRosterChange?.();
      })
      .catch(err => {
        console.error("Error deleting attendance:", err);
        triggerToast("Failed to delete record: " + err.message, true);
      });
  };
  // End: Dnyaneshwari Thorat

  // Start: Dnyaneshwari Thorat
  const handleDeleteChild = (childId, childName) => {
    if (!childId) return;
    if (!window.confirm(`Remove ${childName || "this child"} from the register? This will also remove their attendance record.`)) return;

    deleteTeacherChild(childId)
      .then(() => {
        setRosterVersion(v => v + 1);
        triggerToast(`${childName || "Child"} removed successfully.`);
        onRosterChange?.();
      })
      .catch(err => {
        console.error("Error deleting child:", err);
        triggerToast("Failed to remove child: " + err.message, true);
      });
  };
  // End: Dnyaneshwari Thorat

// ── Upload a new/updated question bank (docx or xlsx) ──
const handleUploadQuestionBank = () => {
  if (!qbUploadFile) { triggerToast("Please choose a file first.", true); return; }
  if (!assessmentAgeGroup) { triggerToast("Please select a class first.", true); return; }

  setQbUploading(true);
  uploadQuestionBank(assessmentAgeGroup, qbUploadFile)
    .then(res => {
      triggerToast(res.message || "Question bank saved.");
      setQuestionBank(res.questionBank);
      setQbMode("collect");
      setQbUploadFile(null);
    })
    .catch(err => {
      console.error("Question bank upload error:", err);
      const msg = err?.response?.data?.message || err.message || "Upload failed.";
      triggerToast(msg, true);
    })
    .finally(() => setQbUploading(false));
};

// ── Download blank answer-sheet template, built from the DB question bank ──
const handleDownloadAssessmentTemplate = () => {
  const activeSections = questionBank?.sections || editableSections;
  if (!activeSections || activeSections.length === 0) { triggerToast("No question bank available yet for this age group.", true); return; }

  const items = activeSections.flatMap(s => s.items);
  const fixedCols = [
    "Roll No", "Student Name",
    "Assessment Date (YYYY-MM-DD)", "Overall Status",
    "Other Status Text", "Recommendation",
    "Next Assessment Date (YYYY-MM-DD)"
  ];
  const headerRow = [...fixedCols, ...items.map(it => it.id)];
  const questionRow = ["", "", "", "", "", "", "", ...items.map(it => it.text)];
  
  const dataRows = (assessmentClassStudents && assessmentClassStudents.length > 0)
    ? assessmentClassStudents.map(st => [st.rollNo || "N/A", st.name, "", "", "", "", "", ...items.map(() => "")])
    : [
        ["101", "Sample Student 1", "", "on_track", "", "", "", ...items.map(() => "")],
        ["102", "Sample Student 2", "", "on_track", "", "", "", ...items.map(() => "")]
      ];

  const scaleOptions = Array.from(new Set(items.flatMap(it => it.ratingScale || RATING_SCALE_3))).join(", ");
  const instructions = [
    ["Assessment Bulk Upload Template"],
    [`Class: ${selectedAssessmentClass?.name || assessmentAgeGroup}`],
    [`Age Group: ${assessmentAgeGroup}`],
    [`Question Bank Version: ${questionBank?.version ? "v" + questionBank.version : "Default"}`],
    [`Stage: ${assessmentStage}`],
    [""],
    ["Instructions:"],
    ["1. Do NOT change the Roll No or Student Name columns."],
    [`2. Fill each question column with one of: ${scaleOptions}`],
    ["3. Overall Status must be one of: on_track, slight_delay, significant_delay, other"],
    ["4. Dates must be in YYYY-MM-DD format."],
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instructions), "Instructions");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headerRow, questionRow, ...dataRows]), "Template");
  XLSX.writeFile(wb, `Assessment_Template_${(selectedAssessmentClass?.name || assessmentAgeGroup || "Class").replace(/\s+/g, "_")}_${assessmentStage}.xlsx`);
  triggerToast(`📥 Downloaded Excel Assessment Template for ${assessmentAgeGroup} (${assessmentStage})!`);
};

// ── Download Word (.doc) Question Bank Template matching user's document structure ──
const handleDownloadWordTemplate = () => {
  const activeSections = questionBank?.sections || editableSections;
  
  let docContent = `Baseline Assessment Questions: ${assessmentAgeGroup || "3-4 Years"}\n`;
  docContent += `Based on SpacECE Curriculum Milestones & LFA Framework\n`;
  docContent += `With Detailed Activity Explanations\n`;
  docContent += `________________________________________\n\n`;

  if (activeSections && activeSections.length > 0) {
    activeSections.forEach((sec, sIdx) => {
      docContent += `DOMAIN ${sec.number || sIdx + 1}: ${String(sec.title || "").toUpperCase().replace(/^DOMAIN\s*\d+:\s*/i, "")}\n`;
      docContent += `${sec.items?.length || 0} Questions\n`;
      docContent += `________________________________________\n\n`;

      sec.items?.forEach((it, qIdx) => {
        docContent += `Question ${qIdx + 1}: ${it.title || "Question Title"}\n`;
        if (it.milestone) docContent += `Milestone: ${it.milestone}\n`;
        docContent += `${it.text || it.title}\n`;
        
        if (it.activities && it.activities.length > 0) {
          docContent += `Activities to observe/implement:\n`;
          it.activities.forEach((act, aIdx) => {
            docContent += `${aIdx + 1}. ${act}\n`;
          });
        }
        docContent += `Rating Scale: 1 (Not yet) ☐ 2 (Emerging) ☐ 3 (Achieved) ☐\n`;
        docContent += `________________________________________\n\n`;
      });
    });
  } else {
    docContent += `DOMAIN 1: PHYSICAL DEVELOPMENT\n`;
    docContent += `________________________________________\n`;
    docContent += `Question 1: Walking with Confidence\n`;
    docContent += `Milestone: Walks forward and backward with confidence (Level 7, Age 3-3.5)\n`;
    docContent += `Does the child demonstrate the ability to walk forward and backward with balance and confidence?\n`;
    docContent += `Activities to observe/implement:\n`;
    docContent += `1. Forward Walk on a Line – Place a straight line of tape or chalk on the floor. Encourage walking forward.\n`;
    docContent += `   Purpose: Assesses balance, coordination, and body awareness.\n`;
    docContent += `2. Backward Step Challenge – Stand behind child and guide 3-4 steps backward.\n`;
    docContent += `   Purpose: Assesses spatial awareness and balance control.\n`;
    docContent += `Rating Scale: 1 (Not yet) ☐ 2 (Emerging) ☐ 3 (Achieved) ☐\n`;
    docContent += `________________________________________\n`;
  }

  const blob = new Blob([docContent], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Baseline_Assessment_Template_${(assessmentAgeGroup || "3-4_Years").replace(/\s+/g, "_")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Option 2 Question Bank Handlers ──
const handleSaveEditedQuestions = () => {
  if (!assessmentAgeGroup) { triggerToast("Please select a class first.", true); return; }
  if (!editableSections || editableSections.length === 0) { triggerToast("No question sections found to save.", true); return; }

  setSavingQuestions(true);
  updateQuestionBankSections(assessmentAgeGroup, editableSections)
    .then(res => {
      triggerToast(res.message || "Question bank updated successfully!");
      if (res.questionBank) {
        setQuestionBank(res.questionBank);
      }
      if (res.questionBank?.sections?.length) {
        setEditableSections(JSON.parse(JSON.stringify(res.questionBank.sections)));
      }
    })
    .catch(err => {
      console.error("Question update error:", err);
      triggerToast(err.message || "Failed to update questions.", true);
    })
    .finally(() => setSavingQuestions(false));
};

const handleAddQuestionItem = (secIdx) => {
  const updated = [...editableSections];
  const sec = updated[secIdx];
  if (!sec) return;
  const newId = `q_${Date.now().toString().slice(-4)}`;
  sec.items.push({
    id: newId,
    title: "New Observation Item",
    text: "Enter observation question text here...",
    milestone: "General",
    ratingScale: ["Not yet", "Emerging", "Achieved"]
  });
  setEditableSections(updated);
};

const handleRemoveQuestionItem = (secIdx, itemIdx) => {
  const updated = [...editableSections];
  updated[secIdx].items.splice(itemIdx, 1);
  setEditableSections(updated);
};

const handleUpdateQuestionItemField = (secIdx, itemIdx, field, val) => {
  const updated = [...editableSections];
  updated[secIdx].items[itemIdx][field] = val;
  setEditableSections(updated);
};

const handleSaveDirectChildAssessment = () => {
  if (!directScoreStudentId) { triggerToast("Please select a student.", true); return; }
  if (Object.keys(directScores).length === 0) { triggerToast("Please rate at least one question.", true); return; }

  const student = assessmentClassStudents.find(s => String(s.id || s._id) === String(directScoreStudentId));
  const activeSections = questionBank?.sections || editableSections;
  const sectionScores = computeSectionScores(directScores, activeSections);

  const record = {
    stage: assessmentStage,
    ageGroup: assessmentAgeGroup,
    answers: directScores,
    overallStatus: "on_track",
    assessmentDate: new Date().toISOString().split("T")[0],
    sectionScores,
    savedAt: new Date().toISOString(),
  };

  saveChildAssessment(directScoreStudentId, record)
    .then(() => {
      triggerToast(`✅ Assessment saved for ${student?.name || "child"}! Viewable in Child Dashboard.`);
      setDirectScores({});
      setDirectScoreStudentId("");
    })
    .catch(err => {
      console.error("Direct assessment save error:", err);
      triggerToast("Failed to save assessment: " + err.message, true);
    });
};

// ── Upload a filled answer sheet (robust multi-sheet array buffer parser) ──
const handleAssessmentTemplateUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: "array" });

      // Find best sheet: prefer "Template", otherwise find sheet containing student data
      let targetSheetName = wb.SheetNames.find(n => n.toLowerCase() === "template");
      if (!targetSheetName) {
        for (const name of wb.SheetNames) {
          if (name.toLowerCase() === "instructions") continue;
          const sheetRows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
          const hasStudentHeader = sheetRows.some(r =>
            r && r.some(cell => {
              const str = String(cell || "").toLowerCase();
              return str.includes("roll") || str.includes("student") || str.includes("name");
            })
          );
          if (hasStudentHeader) {
            targetSheetName = name;
            break;
          }
        }
      }
      if (!targetSheetName) targetSheetName = wb.SheetNames[0];

      const sheet = wb.Sheets[targetSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).filter(r => r && r.length > 0);

      if (rows.length < 2) {
        triggerToast("The selected sheet appears to be empty.", true);
        return;
      }

      // Find header row index
      let headerRowIdx = rows.findIndex(r =>
        r && r.some(c => {
          const str = String(c || "").toLowerCase();
          return str.includes("roll") || str.includes("name") || str.includes("student");
        })
      );
      if (headerRowIdx === -1) headerRowIdx = 0;

      const header = rows[headerRowIdx].map(h => String(h || "").trim());

      // Determine where data rows start (check if row after header is a question text row)
      let dataStartRowIdx = headerRowIdx + 1;
      if (dataStartRowIdx < rows.length) {
        const nextRowFirstCell = String(rows[dataStartRowIdx][0] || "").trim();
        const nextRowSecondCell = String(rows[dataStartRowIdx][1] || "").trim();
        if (!nextRowFirstCell && !nextRowSecondCell) {
          dataStartRowIdx = headerRowIdx + 2;
        }
      }

      const activeSections = questionBank?.sections || editableSections;
      const activeItems = activeSections ? activeSections.flatMap(s => s.items) : [];

      // Determine column mappings for questions
      const fixedColCount = 7;
      let questionColMap = [];

      header.forEach((colName, colIdx) => {
        if (colIdx >= fixedColCount || (!colName.toLowerCase().includes("roll") && !colName.toLowerCase().includes("name") && !colName.toLowerCase().includes("date") && !colName.toLowerCase().includes("status") && !colName.toLowerCase().includes("recommendation"))) {
          const matchedItem = activeItems.find(it => it.id.toLowerCase() === colName.toLowerCase() || it.title.toLowerCase() === colName.toLowerCase());
          if (matchedItem) {
            questionColMap.push({ colIdx, qId: matchedItem.id });
          } else if (colIdx >= fixedColCount) {
            const fallbackItem = activeItems[colIdx - fixedColCount];
            if (fallbackItem) {
              questionColMap.push({ colIdx, qId: fallbackItem.id });
            }
          }
        }
      });

      const parsed = [];
      let studentDataIndex = 0;

      for (let i = dataStartRowIdx; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const rollNo = String(row[0] || "").trim();
        const name = String(row[1] || "").trim();

        if (!rollNo && !name && row.every(cell => cell === undefined || String(cell).trim() === "")) {
          continue;
        }

        let match = null;
        if (rollNo) {
          match = assessmentClassStudents.find(st => st.rollNo !== undefined && st.rollNo !== null && String(st.rollNo).trim().toLowerCase() === rollNo.toLowerCase());
        }
        if (!match && name) {
          match = assessmentClassStudents.find(st => st.name.trim().toLowerCase() === name.toLowerCase()) ||
                  assessmentClassStudents.find(st => st.name.trim().toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(st.name.trim().toLowerCase()));
        }
        if (!match && studentDataIndex < assessmentClassStudents.length) {
          match = assessmentClassStudents[studentDataIndex];
        }

        if (!match) continue;

        const answers = {};
        questionColMap.forEach(({ colIdx, qId }) => {
          const val = row[colIdx];
          if (val !== undefined && String(val).trim() !== "") {
            answers[qId] = String(val).trim();
          }
        });

        parsed.push({
          childId: match.id,
          rollNo: match.rollNo || rollNo || "N/A",
          name: match.name || name || "Child",
          assessmentDate: row[2] ? String(row[2]).trim() : "",
          overallStatus: row[3] ? String(row[3]).trim() : "",
          otherStatusText: row[4] ? String(row[4]).trim() : "",
          recommendation: row[5] ? String(row[5]).trim() : "",
          nextAssessmentDate: row[6] ? String(row[6]).trim() : "",
          answers,
        });

        studentDataIndex++;
      }

      if (parsed.length === 0) {
        triggerToast("Could not parse student rows. Please check that your file matches the class roster.", true);
      } else {
        setAssessmentUploadRows(parsed);
        triggerToast(`✅ Successfully parsed ${parsed.length} student assessment rows! Click Save to DB below.`);
      }
    } catch (err) {
      console.error("Assessment template parse error:", err);
      triggerToast("Failed to parse Excel file. Please use the downloaded template.", true);
    }
  };
  reader.readAsArrayBuffer(file);
};

const handleSubmitBulkAssessment = () => {
  if (assessmentUploadRows.length === 0) { triggerToast("Please upload a filled template first.", true); return; }
  const activeSections = questionBank?.sections || editableSections;
  if (!activeSections || activeSections.length === 0) { triggerToast("No question bank loaded.", true); return; }
  setAssessmentSubmitting(true);

  const requests = assessmentUploadRows.map(row => {
    const sectionScores = computeSectionScores(row.answers, activeSections);
    const record = {
      stage: assessmentStage,
      ageGroup: assessmentAgeGroup,
      answers: row.answers,
      overallStatus: row.overallStatus || "on_track",
      otherStatusText: row.otherStatusText,
      recommendation: row.recommendation,
      nextAssessmentDate: row.nextAssessmentDate || null,
      assessmentDate: row.assessmentDate || new Date().toISOString().split("T")[0],
      sectionScores,
      savedAt: new Date().toISOString(),
    };
    return saveChildAssessment(row.childId, record)
      .then(() => ({ ok: true, name: row.name }))
      .catch(err => ({ ok: false, name: row.name, error: err.message }));
  });

  Promise.all(requests).then(results => {
    const succeeded = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok);
    if (failed.length === 0) triggerToast(`✅ Saved ${assessmentStage} assessments for ${succeeded} children.`);
    else triggerToast(`Saved ${succeeded}, failed for: ${failed.map(f => f.name).join(", ")}`, true);
    setAssessmentUploadRows([]);
    setShowAssessmentModal(false);
    setAssessmentClassId("");
  }).finally(() => setAssessmentSubmitting(false));
};

const closeAssessmentModal = () => {
  setShowAssessmentModal(false);
  setAssessmentClassId("");
  setAssessmentUploadRows([]);
  setAssessmentStage("Baseline");
  setQuestionBank(null);
  setQbUploadFile(null);
  setQbMode("collect");
};

const maskedEmail = user.email
  ? user.email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 5)) + c)
  : "your registered email";

const formatTime = secs => {
  if (secs === null) return "";
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
};

const otpFilled = otpInput.join("").length === 6;

  if (loading && students.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", fontSize: 14, fontWeight: 600, color: "#d97706" }}>
        🔄 Loading Children Roster...
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={S.pageTitle}>Children Attendance</h1>
          <p style={S.pageSub}>Manage rosters and record daily attendance registers.</p>
        </div>
        {/* Prajwal start — Add New Assessment button */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowAssessmentModal(true)} style={S.primaryBtn}>+ Add New Assessment</button>
          <button onClick={() => setShowAddModal(true)} style={S.primaryBtn}>+ Enroll Child</button>
        </div>
        {/* Prajwal end */}
      </div>

      {/* Toast banners */}
      {successMsg && (
        <div style={{ padding: "12px 16px", marginBottom: 16, background: "#d1fae5", color: "#065f46", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: "12px 16px", marginBottom: 16, background: "#fee2e2", color: "#991b1b", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Start: Dnyaneshwari Thorat */}
      <SectionCard title="📁 Excel Bulk Enrollment">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            Upload an Excel or CSV file to enroll multiple children at once. No manual writing required!
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              border: "2px dashed #fbbf24",
              borderRadius: "16px",
              background: "#fffbeb",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "center"
            }}>
              <span style={{ fontSize: "36px", marginBottom: "8px" }}>📊</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#b45309" }}>Upload Excel or CSV spreadsheet</span>
              <span style={{ fontSize: "11px", color: "#d97706", marginTop: "4px" }}>Drag and drop file here, or click to browse</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelUpload}
                style={{ display: "none" }}
              />
            </label>
            {excelStudents.length > 0 && (
              <button
                onClick={handleExcelBulkSubmit}
                style={{
                  ...S.primaryBtn,
                  width: "100%",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  boxShadow: "0 4px 12px rgba(217, 119, 6, 0.2)"
                }}
              >
                🚀 Confirm & Import {excelStudents.length} Students to attendance sheet
              </button>
            )}
          </div>
          
          {excelStudents.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", marginBottom: 8 }}>Parsed Student Cards:</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {excelStudents.map((st, idx) => (
                  <div key={idx} style={{ background: "white", padding: 14, borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => setExcelStudents(prev => prev.filter((_, i) => i !== idx))}
                      style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: "#ef4444", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                      title="Remove"
                    >
                      ✕
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 20 }}>👶</span>
                      <div style={{ fontWeight: 800, fontSize: 13, color: "#1c1917" }}>{st.name}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <Badge children={`${st.age || "?"} Yrs`} color="#059669" bg="#d1fae5" />
                      <Badge children={st.gender} color="#7c3aed" bg="#ede9fe" />
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      <strong>Parent:</strong> {st.parentName || "—"}<br />
                      <strong>Phone:</strong> {st.parentPhone || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>
      {/* End: Dnyaneshwari Thorat */}

      {/* Date picker */}
      <SectionCard title="📅 Daily Register Date & Class Lookup">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label style={{ ...S.label, margin: 0, fontWeight: 700 }}>Select Sheet Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ ...S.input, width: "auto", padding: "8px 12px" }}
            />

            {classes.length > 0 && (
              <>
                <label style={{ ...S.label, margin: 0, fontWeight: 700, marginLeft: 12 }}>Select Class:</label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  style={{ ...S.input, width: "auto", padding: "8px 12px", minWidth: 150 }}
                >
                  {classes.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({c.ageGroup || "All Ages"})</option>
                  ))}
                </select>
              </>
            )}

            {isSavedRecord
              ? <Badge children="📝 Reviewing Saved Sheet History" color="#059669" bg="#d1fae5" />
              : <Badge children="✨ New Unsaved Data Register"     color="#854d0e" bg="#fef9c3" />
            }
          </div>
          {classes.length > 0 && selectedClassId && (
            <Badge children={`Class: ${classes.find(c => (c._id || c.id) === selectedClassId)?.name || "Selected"}`} color="#d97706" bg="#fef3c7" />
          )}
        </div>
      </SectionCard>

      {/* Roster table */}
      <div style={{ marginTop: 20 }}>
        <SectionCard title={`👥 Children Register — Date: ${selectedDate} (${students.length} children)`}>
          {students.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
              No children enrolled in this class yet. Click "+ Enroll Child" above or upload an Excel sheet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Start: Dnyaneshwari Thorat */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {students.map(st => {
                  const status = attendanceDict[st.id] || "P";
                  return (
                    <div
                      key={st.id}
                      style={{
                        background: "white",
                        padding: 16,
                        borderRadius: 16,
                        border: `1px solid ${status === "P" ? "#86efac" : status === "A" ? "#fca5a5" : "#fde68a"}`,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: status === "P" ? "#e8f5e9" : status === "A" ? "#ffebee" : "#fffde7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20
                        }}>
                          👶
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#1c1917" }}>{st.name}</div>
                          <div style={{ fontSize: 11, color: "#d97706", fontWeight: 700 }}>Roll No: {st.rollNo}</div>
                        </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteChild(st.id, st.name)}
                          style={{
                            border: "1px solid #fecaca",
                            background: "#fff1f2",
                            color: "#dc2626",
                            fontSize: 11,
                            fontWeight: 800,
                            borderRadius: 999,
                            padding: "6px 10px",
                            cursor: "pointer",
                            flexShrink: 0
                          }}
                        >
                          Delete
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 6, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(st.id, "P")}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            borderRadius: 8,
                            border: "none",
                            background: status === "P" ? "#22c55e" : "#f1f5f9",
                            color: status === "P" ? "white" : "#64748b",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(st.id, "A")}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            borderRadius: 8,
                            border: "none",
                            background: status === "A" ? "#ef4444" : "#f1f5f9",
                            color: status === "A" ? "white" : "#64748b",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          Absent
                        </button>
                        {/* Prajwal start — Leave button replaced with View button.
                            Clicking it opens the Child Dashboard (Child Profile /
                            Child Assessment / Activity Suggestions) per Module 1 spec. */}
                        <button
                          type="button"
                          onClick={() => setViewChild(st)}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            borderRadius: 8,
                            border: "none",
                            background: "#f1f5f9",
                            color: "#64748b",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          View
                        </button>
                        {/* Prajwal end */}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* End: Dnyaneshwari Thorat */}

              {/* Footer actions */}
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  {isSavedRecord && (
                    <button onClick={handleDeleteSheetRecord} style={{ ...S.exportBtn, color: "#ef4444", border: "1px solid #fca5a5" }}>
                      🗑️ Delete Saved Record
                    </button>
                  )}
                </div>
                <button onClick={handleSaveSheet} style={{ ...S.primaryBtn, padding: "10px 24px" }}>
                  {isSavedRecord ? "💾 Submit Update" : "💾 Submit Attendance Register"}
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* MODAL 1 — Enroll Student */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1c1917", margin: 0 }}>Register New Child</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            {/* Start: Dnyaneshwari Thorat */}
            <div style={{ display: "flex", gap: 12, borderBottom: "1px solid #f1f5f9", marginBottom: 16, paddingBottom: 8 }}>
              <button type="button" onClick={() => setBulkMode(false)} style={{ background: "none", border: "none", fontSize: 13, fontWeight: 700, color: !bulkMode ? "#d97706" : "#6b7280", borderBottom: !bulkMode ? "2px solid #d97706" : "none", paddingBottom: 4, cursor: "pointer" }}>Single Enrollment</button>
              <button type="button" onClick={() => setBulkMode(true)} style={{ background: "none", border: "none", fontSize: 13, fontWeight: 700, color: bulkMode ? "#d97706" : "#6b7280", borderBottom: bulkMode ? "2px solid #d97706" : "none", paddingBottom: 4, cursor: "pointer" }}>Bulk Enrollment</button>
            </div>

            <form onSubmit={handleAddStudent}>
              {bulkMode ? (
                <div>
                  <label style={S.label}>Upload Excel File (.xlsx, .xls, .csv)</label>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelUpload}
                    style={{ ...S.input, marginBottom: 12, padding: "8px 12px" }}
                  />
                  
                  {excelStudents.length > 0 && (
                    <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 10, padding: 8, background: "#f8fafc", marginBottom: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {excelStudents.map((st, idx) => (
                          <div key={idx} style={{ background: "white", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917" }}>{st.name} ({st.age} yrs, {st.gender})</div>
                              <div style={{ fontSize: 10, color: "#64748b" }}>Parent: {st.parentName || "—"} | {st.parentPhone || "—"}</div>
                            </div>
                            <button type="button" onClick={() => setExcelStudents(prev => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 13, cursor: "pointer", padding: "2px 6px" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={excelStudents.length === 0} style={{ ...S.primaryBtn, width: "100%", opacity: excelStudents.length === 0 ? 0.6 : 1, cursor: excelStudents.length === 0 ? "not-allowed" : "pointer" }}>
                    Bulk Enroll {excelStudents.length > 0 ? `(${excelStudents.length} Children)` : ""} →
                  </button>
                </div>
              ) : (
                <div>
                  <label style={S.label}>Assign Class *</label>
                  <select
                    required
                    style={{ ...S.input, marginBottom: 12 }}
                    value={newStudentClassId}
                    onChange={e => setNewStudentClassId(e.target.value)}
                  >
                    <option value="">Select a class…</option>
                    {classes.map(c => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({c.ageGroup || "All Ages"})</option>
                    ))}
                  </select>

                  <label style={S.label}>Student Full Name *</label>
                  <input
                    required
                    style={{ ...S.input, marginBottom: 12 }}
                    placeholder="Enter first and last name…"
                    value={newStudentName}
                    onChange={e => setNewStudentName(e.target.value)}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={S.label}>Age</label>
                      <input
                        type="number"
                        min="1"
                        max="18"
                        style={S.input}
                        placeholder="Age"
                        value={newStudentAge}
                        onChange={e => setNewStudentAge(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={S.label}>Gender</label>
                      <select style={S.input} value={newStudentGender} onChange={e => setNewStudentGender(e.target.value)}>
                        <option value="">Select…</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <label style={S.label}>Parent/Guardian Name</label>
                  <input
                    style={{ ...S.input, marginBottom: 12 }}
                    placeholder="Parent or guardian name"
                    value={newStudentParentName}
                    onChange={e => setNewStudentParentName(e.target.value)}
                  />
                  <label style={S.label}>Parent Phone</label>
                  <input
                    style={{ ...S.input, marginBottom: 20 }}
                    placeholder="Parent phone number"
                    value={newStudentParentPhone}
                    onChange={e => setNewStudentParentPhone(e.target.value)}
                  />
                  <button type="submit" style={{ ...S.primaryBtn, width: "100%" }}>Enroll Child →</button>
                </div>
              )}
            </form>
            {/* End: Dnyaneshwari Thorat */}
          </div>
        </div>
      )}

      {/* MODAL 2 — OTP Verification */}
      {showOtpModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px 28px", width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", position: "relative" }}>
            <button onClick={closeOtpModal} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>✕</button>

            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>
                {otpStep === "sending" ? "📤" : otpStep === "verifying" ? "⏳" : "📧"}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1c1917", margin: "0 0 6px" }}>
                {otpStep === "sending"   ? "Sending OTP…"      :
                 otpStep === "verifying" ? "Verifying OTP…"    :
                                           "Email OTP Verification"}
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                {otpStep === "sending" ? "Checking network parameters..." : `We've sent a 6-digit OTP passcode to ${maskedEmail}.`}
              </p>
              {/* Start: Dnyaneshwari Thorat */}
              {otpRef.current && (
                <div style={{ marginTop: 10, padding: 8, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, fontSize: 11, color: "#b45309", fontWeight: 700 }}>
                  🔑 Local Testing OTP: <span style={{ fontSize: 13, color: "#d97706", fontFamily: "monospace", letterSpacing: 1 }}>{otpRef.current}</span>
                </div>
              )}
              {/* End: Dnyaneshwari Thorat */}
            </div>

            {otpStep !== "sending" && (
              <>
                {timeLeft !== null && timeLeft > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color:      timeLeft > 60 ? "#059669" : timeLeft > 30 ? "#d97706" : "#dc2626",
                      background: timeLeft > 60 ? "#f0fdf4" : timeLeft > 30 ? "#fef3c7" : "#fef2f2",
                      border: `1px solid ${timeLeft > 60 ? "#a7f3d0" : timeLeft > 30 ? "#fde68a" : "#fca5a5"}`,
                      padding: "5px 16px", borderRadius: 20
                    }}>
                      ⏱ Expires in {formatTime(timeLeft)}
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 18 }} onPaste={handleOtpPaste}>
                  {otpInput.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpInputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpDigit(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      style={{
                        width: 46, height: 54,
                        textAlign: "center", fontSize: 22, fontWeight: 800,
                        border: `2px solid ${otpError ? "#ef4444" : digit ? "#f59e0b" : "#e2e8f0"}`,
                        borderRadius: 10, outline: "none",
                        background: digit ? "#fffbf0" : "white",
                        color: "#1c1917",
                        transition: "border-color 0.15s, background 0.15s",
                        caretColor: "#f59e0b"
                      }}
                    />
                  ))}
                </div>

                {otpError && (
                  <div style={{ textAlign: "center", marginBottom: 14, fontSize: 12, color: "#dc2626", fontWeight: 600, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 }}>
                    {otpError}
                  </div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={!otpFilled || timeLeft === 0}
                  style={{
                    width: "100%", padding: 13, marginBottom: 12,
                    background: (!otpFilled || timeLeft === 0) ? "#e2e8f0" : "linear-gradient(135deg,#f59e0b,#d97706)",
                    color:  (!otpFilled || timeLeft === 0) ? "#94a3b8" : "white",
                    border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800,
                    cursor: (!otpFilled || timeLeft === 0) ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  ✅ Verify OTP & Apply Change
                </button>

                <div style={{ textAlign: "center", fontSize: 12, color: "#64748b" }}>
                  Didn't receive it?{" "}
                  {resendCooldown > 0
                    ? <span style={{ color: "#94a3b8", fontWeight: 600 }}>Resend in {resendCooldown}s</span>
                    : <button onClick={handleResendOtp} style={{ background: "none", border: "none", color: "#d97706", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline" }}>Resend OTP</button>
                  }
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL — Add New Assessment (replaces earlier static version)
          Place this alongside your other modals in the JSX return.
      ════════════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════════
          MODAL — Add & Manage Children Assessment (2-Option Flow)
      ════════════════════════════════════════════════════════════ */}
      {showAssessmentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 24, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1c1917", margin: 0 }}>Add & Manage Children Assessment</h3>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0 0" }}>Upload Excel/Doc assessment sheets or edit question banks directly.</p>
              </div>
              <button onClick={closeAssessmentModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>

            {/* Class & Stage Selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14, background: "#f8fafc", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div>
                <label style={{ ...S.label, marginBottom: 4 }}>Select Class *</label>
                <select style={{ ...S.input, padding: "8px 10px" }} value={assessmentClassId}
                  onChange={e => { setAssessmentClassId(e.target.value); setAssessmentUploadRows([]); setDirectScoreStudentId(""); }}>
                  <option value="">Select a class…</option>
                  {classes.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({c.ageGroup || "All Ages"})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ ...S.label, marginBottom: 4 }}>Assessment Stage *</label>
                <select style={{ ...S.input, padding: "8px 10px" }} value={assessmentStage} onChange={e => { setAssessmentStage(e.target.value); setAssessmentUploadRows([]); }}>
                  <option value="Baseline">Baseline</option>
                  <option value="Midline">Midline</option>
                  <option value="Endline">Endline</option>
                </select>
              </div>
            </div>

            {assessmentClassId && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <Badge children={`Age Group: ${assessmentAgeGroup}`} color="#7c3aed" bg="#ede9fe" />
                <Badge children={loadingAssessmentRoster ? "Loading roster…" : `${assessmentClassStudents.length} children`} color="#d97706" bg="#fef3c7" />
                {questionBank ? (
                  <Badge children={`Active QB v${questionBank.version} (${questionBank.sections?.flatMap(s=>s.items).length || 0} items)`} color="#059669" bg="#d1fae5" />
                ) : (
                  <Badge children={`Default QB (${editableSections?.flatMap(s=>s.items).length || 0} items)`} color="#2563eb" bg="#dbeafe" />
                )}
              </div>
            )}

            {assessmentClassId && loadingQuestionBank && (
              <p style={{ fontSize: 13, color: "#d97706", fontWeight: 700, padding: 10 }}>🔄 Loading question bank & roster…</p>
            )}

            {assessmentClassId && !loadingQuestionBank && (
              <>
                {/* 2 Option Tab Switcher */}
                <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: 16 }}>
                  <button
                    onClick={() => setAssessmentOption("upload")}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: assessmentOption === "upload" ? "3px solid #7c3aed" : "none",
                      fontWeight: assessmentOption === "upload" ? 800 : 600,
                      color: assessmentOption === "upload" ? "#7c3aed" : "#64748b",
                      cursor: "pointer",
                      fontSize: 13,
                    }}>
                    📄 Option 1: Upload Doc / Excel
                  </button>
                  <button
                    onClick={() => setAssessmentOption("questions")}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: assessmentOption === "questions" ? "3px solid #7c3aed" : "none",
                      fontWeight: assessmentOption === "questions" ? 800 : 600,
                      color: assessmentOption === "questions" ? "#7c3aed" : "#64748b",
                      cursor: "pointer",
                      fontSize: 13,
                    }}>
                    ✏️ Option 2: Edit Questions & Direct Score
                  </button>
                </div>

                {/* ════════════ OPTION 1: UPLOAD DOC OR EXCEL ════════════ */}
                {assessmentOption === "upload" && (
                  <div>
                    {/* Templates Download Box */}
                    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>📥 Download Templates (Sample Format Guides):</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <button type="button" onClick={handleDownloadAssessmentTemplate}
                          style={{ background: "#0284c7", color: "white", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          📊 Download Excel Sheet Template
                        </button>
                        <button type="button" onClick={handleDownloadWordTemplate}
                          style={{ background: "#4f46e5", color: "white", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          📝 Download Word (.doc) QB Template
                        </button>
                      </div>
                    </div>

                    {/* File Upload Zone */}
                    <div style={{ background: "#fffbeb", border: "2px dashed #f59e0b", borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 16 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
                        Upload Doc / Excel File
                      </p>
                      <p style={{ fontSize: 11, color: "#78350f", marginBottom: 12 }}>
                        Upload filled Excel answer sheet (.xlsx, .csv) to auto-save child assessments to DB, or Word document (.docx) to set up a new Question Bank.
                      </p>
                      
                      <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                        <label style={{ ...S.primaryBtn, background: "#d97706", cursor: "pointer", padding: "10px 18px", fontSize: 13 }}>
                          📂 Select File (.doc, .docx, .xlsx, .csv)
                          <input type="file" accept=".doc,.docx,.xlsx,.xls,.csv" onChange={e => {
                            const f = e.target.files[0];
                            if (!f) return;
                            const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
                            if (ext === ".doc" || ext === ".docx") {
                              if (!assessmentAgeGroup) { triggerToast("Please select a class first.", true); return; }
                              setQbUploading(true);
                              uploadQuestionBank(assessmentAgeGroup, f)
                                .then(res => {
                                  triggerToast(res.message || `✓ Question bank v${res.questionBank?.version || "new"} for ${assessmentAgeGroup} saved and activated!`);
                                  const qb = res.questionBank || {};
                                  setQuestionBank(qb);
                                  const sections = qb.sections ? JSON.parse(JSON.stringify(qb.sections)) : [];
                                  setEditableSections(sections);

                                  const allItems = sections.flatMap(s => s.items || []);
                                  setLastUploadedQbInfo({
                                    version: qb.version || "1",
                                    totalItems: allItems.length,
                                    sectionsCount: sections.length
                                  });

                                  // Automatically build initial assessment rows for active class roster
                                  const defaultAnswers = {};
                                  allItems.forEach(it => {
                                    if (it.id) defaultAnswers[it.id] = "Achieved";
                                  });

                                  const initialRows = (assessmentClassStudents && assessmentClassStudents.length > 0)
                                    ? assessmentClassStudents.map(st => ({
                                        childId: st.id || st._id,
                                        rollNo: st.rollNo || "N/A",
                                        name: st.name,
                                        answers: { ...defaultAnswers },
                                        overallStatus: "on_track",
                                        otherStatusText: "",
                                        recommendation: "Progressing well according to developmental milestones.",
                                        nextAssessmentDate: null,
                                        assessmentDate: new Date().toISOString().split("T")[0]
                                      }))
                                    : [
                                        {
                                          childId: "sample_1",
                                          rollNo: "101",
                                          name: "Sample Student 1",
                                          answers: { ...defaultAnswers },
                                          overallStatus: "on_track",
                                          otherStatusText: "",
                                          recommendation: "Sample assessment record",
                                          nextAssessmentDate: null,
                                          assessmentDate: new Date().toISOString().split("T")[0]
                                        }
                                      ];

                                  setAssessmentUploadRows(initialRows);
                                })
                                .catch(err => {
                                  console.error("Word doc upload error:", err);
                                  const msg = err?.response?.data?.message || err.message || "Failed to parse Word document.";
                                  triggerToast(msg, true);
                                })
                                .finally(() => setQbUploading(false));
                            } else {
                              handleAssessmentTemplateUpload(e);
                            }
                          }} style={{ display: "none" }} />
                        </label>
                      </div>
                    </div>

                    {lastUploadedQbInfo && (
                      <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>
                              ✅ Question Bank v{lastUploadedQbInfo.version} for {assessmentAgeGroup} Uploaded & Activated!
                            </div>
                            <div style={{ fontSize: 12, color: "#15803d", marginTop: 2 }}>
                              {lastUploadedQbInfo.totalItems} questions across {lastUploadedQbInfo.sectionsCount} domains loaded into DB. Initial assessment rows generated below.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAssessmentOption("questions")}
                            style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            ✏️ Edit Questions / Score Children →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Parsed Rows Preview */}
                    {assessmentUploadRows.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6 }}>
                          ✓ Parsed {assessmentUploadRows.length} student assessment rows ready to submit:
                        </div>
                        <div style={{ maxHeight: 160, overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: 8, padding: 8, background: "#f8fafc" }}>
                          {assessmentUploadRows.map((r, idx) => (
                            <div key={idx} style={{ fontSize: 12, padding: "4px 8px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontWeight: 700 }}>{r.name} ({r.rollNo})</span>
                              <span style={{ color: "#059669", fontWeight: 600 }}>{Object.keys(r.answers).length} questions rated</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button onClick={handleSubmitBulkAssessment} disabled={assessmentUploadRows.length === 0 || assessmentSubmitting}
                      style={{ ...S.primaryBtn, width: "100%", padding: 12, fontSize: 14, opacity: assessmentUploadRows.length === 0 ? 0.5 : 1 }}>
                      {assessmentSubmitting ? "Saving to Database…" : `💾 Save ${assessmentUploadRows.length || ""} Assessments to DB (Reflects in Dashboard)`}
                    </button>
                  </div>
                )}

                {/* ════════════ OPTION 2: EDIT QUESTIONS & DIRECT SCORE ════════════ */}
                {assessmentOption === "questions" && (
                  <div>
                    {/* Section 1: Question Bank Items Editor */}
                    <div style={{ background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: "#1f2937", margin: 0 }}>
                          ✏️ Particular Question Bank Items ({assessmentAgeGroup})
                        </h4>
                        <button onClick={handleSaveEditedQuestions} disabled={savingQuestions}
                          style={{ background: "#059669", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          {savingQuestions ? "Saving…" : "💾 Save Question Updates"}
                        </button>
                      </div>

                      {editableSections.length === 0 ? (
                        <p style={{ fontSize: 12, color: "#6b7280" }}>No questions configured yet for this age group.</p>
                      ) : (
                        <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                          {editableSections.map((sec, secIdx) => (
                            <div key={`sec_${sec.id || secIdx}_${secIdx}`} style={{ background: "white", border: "1px solid #cbd5e1", borderRadius: 8, padding: 10 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontWeight: 700, fontSize: 13, color: "#334155" }}>
                                <span>Section {sec.number || secIdx + 1}: {sec.title}</span>
                                <button type="button" onClick={() => handleAddQuestionItem(secIdx)}
                                  style={{ background: "#ede9fe", color: "#6d28d9", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                  + Add Item
                                </button>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {sec.items.map((item, itemIdx) => (
                                  <div key={`item_${sec.id || secIdx}_${item.id || itemIdx}_${itemIdx}`} style={{ display: "flex", gap: 8, alignItems: "center", background: "#f8fafc", padding: 6, borderRadius: 6, border: "1px solid #e2e8f0" }}>
                                    <input
                                      type="text"
                                      value={item.title || ""}
                                      onChange={e => handleUpdateQuestionItemField(secIdx, itemIdx, "title", e.target.value)}
                                      placeholder="Title"
                                      style={{ ...S.input, width: "30%", padding: "4px 8px", fontSize: 12 }}
                                    />
                                    <input
                                      type="text"
                                      value={item.text || ""}
                                      onChange={e => handleUpdateQuestionItemField(secIdx, itemIdx, "text", e.target.value)}
                                      placeholder="Observation text..."
                                      style={{ ...S.input, flex: 1, padding: "4px 8px", fontSize: 12 }}
                                    />
                                    <button type="button" onClick={() => handleRemoveQuestionItem(secIdx, itemIdx)}
                                      style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 4, width: 26, height: 26, cursor: "pointer", fontWeight: 700 }}>
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 2: Direct Scoring for Individual Student */}
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 14 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "#166534", margin: "0 0 10px 0" }}>
                        📝 Direct Student Rating & Assessment Entry
                      </h4>

                      <label style={{ ...S.label, marginBottom: 4 }}>Select Student to Score *</label>
                      <select style={{ ...S.input, marginBottom: 12 }} value={directScoreStudentId} onChange={e => setDirectScoreStudentId(e.target.value)}>
                        <option value="">Select a child from roster…</option>
                        {assessmentClassStudents.map(st => (
                          <option key={st.id || st._id} value={st.id || st._id}>{st.name} (Roll: {st.rollNo})</option>
                        ))}
                      </select>

                      {directScoreStudentId && (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#15803d", marginBottom: 8 }}>
                            Rate Questions for {assessmentClassStudents.find(s => String(s.id || s._id) === String(directScoreStudentId))?.name}:
                          </p>

                          <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                            {(questionBank?.sections || editableSections).flatMap(s => s.items).map((item, itemIdx) => (
                              <div key={`direct_score_${item.id || itemIdx}_${itemIdx}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "6px 10px", borderRadius: 6, border: "1px solid #dcfce7", fontSize: 12 }}>
                                <span style={{ fontWeight: 600, flex: 1, paddingRight: 8 }}>{item.title}: <span style={{ fontWeight: 400, color: "#475569" }}>{item.text}</span></span>
                                <div style={{ display: "flex", gap: 4 }}>
                                  {["Not yet", "Emerging", "Achieved"].map(scale => (
                                    <button
                                      key={scale}
                                      type="button"
                                      onClick={() => setDirectScores(prev => ({ ...prev, [item.id]: scale }))}
                                      style={{
                                        padding: "3px 8px",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        borderRadius: 4,
                                        border: directScores[item.id] === scale ? "2px solid #16a34a" : "1px solid #cbd5e1",
                                        background: directScores[item.id] === scale ? "#dcfce7" : "white",
                                        color: directScores[item.id] === scale ? "#15803d" : "#475569",
                                        cursor: "pointer",
                                      }}>
                                      {scale}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <button type="button" onClick={handleSaveDirectChildAssessment}
                            style={{ ...S.primaryBtn, background: "#16a34a", width: "100%", padding: 10, fontSize: 13 }}>
                            💾 Save Direct Assessment to Database & Dashboard
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {/* Prajwal end */}

      {/* Prajwal start — Child Dashboard modal (View button) */}
      {viewChild && (
        <ChildDashboardModal child={viewChild} onClose={() => setViewChild(null)} />
      )}
      {/* Prajwal end */}
    </div>
  );
}