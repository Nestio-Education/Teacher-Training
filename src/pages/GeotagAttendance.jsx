import { useState, useEffect, useRef, useCallback } from "react";
import { getTeacherAttendance, saveTeacherAttendance, getSelfMentorAttendance, saveSelfMentorAttendance } from "../services/api";

export default function GeotagAttendance({ user }) {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [coords, setCoords] = useState(null);
  const [statusReport, setStatusReport] = useState(null);
  const [errorAlert, setErrorAlert] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const isMentor = user?.role?.toLowerCase() === "mentor";

  const CAMPUS_LAT = 18.6675;
  const CAMPUS_LNG = 73.8961;

  const today = new Date();
  const todayDate = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthName = today.toLocaleString("en-IN", { month: "long" });

  // Calendar navigation state
  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [viewYear, setViewYear] = useState(currentYear);

  const viewMonthName = new Date(viewYear, viewMonth, 1).toLocaleString("en-IN", { month: "long" });
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

  const isViewingCurrentMonth = viewMonth === currentMonth && viewYear === currentYear;

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    // Don't go beyond current month
    if (isViewingCurrentMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isWeekend = (day) => {
    const d = new Date(currentYear, currentMonth, day).getDay();
    return d === 0 || d === 6;
  };

  const [attendanceMap, setAttendanceMap] = useState({});
  const todayKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(todayDate).padStart(2, "0")}`;
  const todayRecord = attendanceMap[todayKey] || {};

  const [historyLogs, setHistoryLogs] = useState([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const data = isMentor ? await getSelfMentorAttendance() : await getTeacherAttendance();
        if (data && data.records) {
          const map = {};
          const logs = [];
          data.records.forEach(record => {
            const dateObj = new Date(record.attendanceDate);
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
            let parsedNote = {};
            try { if (record.note) parsedNote = JSON.parse(record.note); }
            catch (e) { parsedNote = { noteText: record.note }; }
            map[dateKey] = {
              status: record.status || "present",
              verificationStatus: record.verificationStatus || "APPROVED",
              rejectionReason: record.rejectionReason || "",
              reviewReason: record.reviewReason || "",
              checkedIn: record.checkedIn ?? (parsedNote.checkedIn || (record.status === "present" || record.status === "pending_review")),
              checkedOut: record.checkedOut ?? (parsedNote.checkedOut || false),
              checkInTime: record.checkInTime || parsedNote.checkInTime || (record.status === "present" ? "09:00 AM" : ""),
              checkOutTime: record.checkOutTime || parsedNote.checkOutTime || "",
              snapshot: record.snapshot || parsedNote.snapshot || null,
              distanceOffset: record.distanceOffset ?? (parsedNote.distanceOffset || 0)
            };
            const dateStr = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
            if (map[dateKey].checkInTime) {
              logs.push({ id: `GEO-${record._id}-in`, type: "checkin", date: dateStr, time: map[dateKey].checkInTime, coords: parsedNote.coords || `${record.latitude || CAMPUS_LAT}, ${record.longitude || CAMPUS_LNG}`, snapshot: map[dateKey].snapshot, distanceOffset: map[dateKey].distanceOffset, status: record.status, rejectionReason: record.rejectionReason });
            }
            if (map[dateKey].checkOutTime) {
              logs.push({ id: `GEO-${record._id}-out`, type: "checkout", date: dateStr, time: map[dateKey].checkOutTime, coords: parsedNote.coords || `${record.latitude || CAMPUS_LAT}, ${record.longitude || CAMPUS_LNG}`, snapshot: record.snapshotOut || parsedNote.snapshotOut || map[dateKey].snapshot, distanceOffset: record.distanceOffsetOut ?? (parsedNote.distanceOffsetOut || map[dateKey].distanceOffset), status: record.status });
            }
            if (!map[dateKey].checkInTime && record.status === "present") {
              logs.push({ id: `GEO-${record._id}`, type: "checkin", date: dateStr, time: "09:00 AM", coords: `${record.latitude || CAMPUS_LAT}, ${record.longitude || CAMPUS_LNG}`, snapshot: null, distanceOffset: 0, status: record.status });
            }
          });
          setAttendanceMap(map);
          setHistoryLogs(logs.sort((a, b) => b.id.localeCompare(a.id)));
        }
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setErrorAlert("Failed to load attendance records from database.");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [user, isMentor]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setErrorAlert("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (_err) {
      setErrorAlert("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  useEffect(() => {
    if (cameraActive) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [cameraActive, startCamera, stopCamera]);

  const captureSnapshot = () => {
    if (!canvasRef.current) return null;
    const ctx = canvasRef.current.getContext("2d");
    const width = videoRef.current?.videoWidth || 640;
    const height = videoRef.current?.videoHeight || 480;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    if (videoRef.current && videoRef.current.readyState >= 2) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px sans-serif";
      ctx.fillText("Attendance Snapshot", 20, height / 2);
    }
    return canvasRef.current.toDataURL("image/jpeg", 0.85);
  };

  const [previewState, setPreviewState] = useState(null);
  const [refetchingGps, setRefetchingGps] = useState(false);
  const [recapturingPhoto, setRecapturingPhoto] = useState(false);
  const [previewFeedback, setPreviewFeedback] = useState("");

  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getTargetCoords = () => {
    const center = isMentor ? user?.mentorProfile?.center : user?.teacherProfile?.center;
    const policy = isMentor ? (user?.mentorProfile?.attendancePolicy || {}) : (user?.teacherProfile?.attendancePolicy || {});
    const targetLat = policy.latitude != null ? policy.latitude : ((center && center.latitude) ? center.latitude : CAMPUS_LAT);
    const targetLng = policy.longitude != null ? policy.longitude : ((center && center.longitude) ? center.longitude : CAMPUS_LNG);
    const locationName = policy.assignedLocationName || center?.name || "Assigned Center";
    const geofenceRadius = Number(policy.geofenceRadius) || 200;
    return { targetLat, targetLng, locationName, geofenceRadius };
  };

  // Step 1: Initiate Punch (Take snapshot & acquire GPS for user review)
  const handleInitiatePunch = (type) => {
    if (!cameraActive) { setErrorAlert("Please activate the camera first before marking attendance."); return; }
    if (type === "checkout" && !todayRecord.checkedIn) { setErrorAlert("You must check in before you can check out."); return; }
    if (type === "checkin" && todayRecord.checkedIn) { setErrorAlert("You have already checked in today."); return; }
    if (type === "checkout" && todayRecord.checkedOut) { setErrorAlert("You have already checked out today."); return; }
    
    setLoading(true);
    setActionType(type);
    setStatusReport(null);
    setErrorAlert("");
    setPreviewFeedback("");

    if (!navigator.geolocation) {
      setLoading(false);
      setActionType(null);
      setErrorAlert("Geolocation is not available on this device/browser.");
      return;
    }

    const tryPosition = (options, isFallback = false) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const { targetLat, targetLng, locationName, geofenceRadius } = getTargetCoords();
          const dist = calcDistance(lat, lng, targetLat, targetLng);
          const snapshot = captureSnapshot();
          const now = new Date();
          const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
          const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          
          setCoords(coordStr);
          setPreviewState({
            type,
            snapshot,
            lat,
            lng,
            dist: Math.round(dist),
            timeStr,
            dateStr,
            coordStr,
            accuracy: Math.round(pos.coords.accuracy || 10),
            locationName,
            geofenceRadius
          });
          setLoading(false);
          setActionType(null);
        },
        (error) => {
          if (!isFallback) {
            tryPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }, true);
          } else {
            setLoading(false);
            setActionType(null);
            setErrorAlert(error.message || "Location permission denied. Please allow GPS access.");
          }
        },
        options
      );
    };

    tryPosition({ enableHighAccuracy: true, timeout: 7000, maximumAge: 0 });
  };

  // Option to retake snapshot if photo was blurry or bad lighting
  const handleRecaptureSnapshot = () => {
    setRecapturingPhoto(true);
    const newSnapshot = captureSnapshot();
    if (newSnapshot && previewState) {
      setPreviewState(prev => ({ ...prev, snapshot: newSnapshot }));
      setPreviewFeedback("📸 Selfie recaptured successfully!");
      setTimeout(() => setPreviewFeedback(""), 3000);
    }
    setRecapturingPhoto(false);
  };

  // Option to re-fetch GPS coordinates if initial fix was imprecise
  const handleRefetchLocationTime = () => {
    if (!navigator.geolocation) return;
    setRefetchingGps(true);
    setPreviewFeedback("📍 Acquiring fresh high-precision GPS...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const { targetLat, targetLng } = getTargetCoords();
        const dist = calcDistance(lat, lng, targetLat, targetLng);
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        
        setCoords(coordStr);
        setPreviewState(prev => prev ? ({
          ...prev,
          lat,
          lng,
          dist: Math.round(dist),
          timeStr,
          coordStr,
          accuracy: Math.round(pos.coords.accuracy || 10)
        }) : null);
        setRefetchingGps(false);
        setPreviewFeedback("✅ GPS Location & Time updated!");
        setTimeout(() => setPreviewFeedback(""), 3000);
      },
      (err) => {
        setRefetchingGps(false);
        setPreviewFeedback(`⚠️ GPS refresh failed: ${err.message}`);
        setTimeout(() => setPreviewFeedback(""), 3000);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Step 2: Final Confirm & Submit Attendance
  const handleConfirmSubmit = async () => {
    if (!previewState) return;
    const { type, lat, lng, dist, snapshot, timeStr, dateStr, coordStr } = previewState;
    setLoading(true);
    setActionType(type);
    setErrorAlert("");

    try {
      const recordToday = attendanceMap[todayKey] || {};
      let updatedRecord = {};
      if (type === "checkin") {
        updatedRecord = {
          checkedIn: true,
          checkedOut: false,
          checkInTime: timeStr,
          checkOutTime: "",
          coords: coordStr,
          snapshot,
          distanceOffset: dist
        };
      } else {
        updatedRecord = {
          checkedIn: recordToday.checkedIn || true,
          checkedOut: true,
          checkInTime: recordToday.checkInTime || "09:00 AM",
          checkOutTime: timeStr,
          coords: coordStr,
          snapshot: recordToday.snapshot || null,
          snapshotOut: snapshot,
          distanceOffset: recordToday.distanceOffset || 0,
          distanceOffsetOut: dist
        };
      }

      const saveApi = isMentor ? saveSelfMentorAttendance : saveTeacherAttendance;
      const response = await saveApi({
        source: "geo",
        latitude: lat,
        longitude: lng,
        checkInTime: updatedRecord.checkInTime,
        checkOutTime: updatedRecord.checkOutTime,
        checkedIn: updatedRecord.checkedIn,
        checkedOut: updatedRecord.checkedOut,
        distanceOffset: updatedRecord.distanceOffset,
        distanceOffsetOut: updatedRecord.distanceOffsetOut,
        snapshot: updatedRecord.snapshot,
        snapshotOut: updatedRecord.snapshotOut,
        note: JSON.stringify({ coords: coordStr })
      });

      const serverRecord = response?.record || {};
      const riskEvaluation = response?.riskEvaluation || {};
      const updatedMap = { ...attendanceMap };

      updatedMap[todayKey] = {
        checkedIn: updatedRecord.checkedIn,
        checkedOut: updatedRecord.checkedOut,
        checkInTime: updatedRecord.checkInTime,
        checkOutTime: updatedRecord.checkOutTime,
        status: serverRecord.status || "present",
        verificationStatus: serverRecord.verificationStatus || "VALID",
        reviewReason: serverRecord.reviewReason || "",
        riskScore: serverRecord.riskScore || 0,
        faceMatchScore: serverRecord.faceMatchScore ?? riskEvaluation.faceMatchScore ?? null,
        faceVerificationResult: serverRecord.faceVerificationResult || riskEvaluation.faceVerificationResult || "N/A"
      };

      setAttendanceMap(updatedMap);
      setHistoryLogs(prev => [
        {
          id: `GEO-${Date.now()}`,
          type,
          date: dateStr,
          time: timeStr,
          coords: coordStr,
          snapshot,
          distanceOffset: dist,
          status: serverRecord.status || "present",
          faceMatchScore: serverRecord.faceMatchScore
        },
        ...prev
      ]);

      const faceNote = serverRecord.faceMatchScore != null
        ? ` · 👤 Face Match: ${serverRecord.faceMatchScore}%`
        : "";
      const reviewInfo = serverRecord.verificationStatus === "NEEDS_REVIEW"
        ? ` ⚠️ Flagged for review: ${serverRecord.reviewReason || "Risk detected"}`
        : "";

      setStatusReport({
        success: true,
        type,
        message: `${type === "checkin" ? "Check-in" : "Check-out"} recorded at ${timeStr}. Distance: ${dist}m${faceNote}.${reviewInfo}`
      });

      setPreviewState(null);
    } catch (err) {
      console.error("Error saving attendance:", err);
      setErrorAlert("Failed to save attendance to backend database.");
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };


  const getViewDayKey = (day) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isPresent = (rec) => rec && (rec.status === "present" || rec.status === "late" || (rec.checkedIn && rec.status !== "absent" && rec.status !== "pending_review"));
  const isPendingReview = (rec) => rec && (rec.status === "pending_review" || rec.verificationStatus === "NEEDS_REVIEW");
  const isAbsent = (rec) => rec && (rec.status === "absent" || rec.verificationStatus === "REJECTED");

  const isViewWeekend = (day) => {
    const d = new Date(viewYear, viewMonth, day).getDay();
    return d === 0 || d === 6;
  };

  const getDayStatus = (day) => {
    const rec = attendanceMap[getViewDayKey(day)];
    if (isViewWeekend(day)) {
      if (isAbsent(rec)) return "absent";
      if (isPendingReview(rec)) return "review";
      return isPresent(rec) ? "extra" : "holiday";
    }
    const cellDate = new Date(viewYear, viewMonth, day);
    const todayMidnight = new Date(currentYear, currentMonth, todayDate);
    if (cellDate > todayMidnight) return "upcoming";

    if (isAbsent(rec)) return "absent";
    if (isPendingReview(rec)) return "review";
    if (isPresent(rec)) return "present";
    if (isViewingCurrentMonth && day === todayDate) return "today";
    return "absent";
  };

  const getTileStyle = (status) => {
    switch (status) {
      case "present": return { background: "#f0fdf4", border: "1.5px solid #86efac", color: "#166534" };
      case "review": return { background: "#fffbeb", border: "1.5px solid #fde68a", color: "#92400e" };
      case "extra": return { background: "#f5f3ff", border: "1.5px solid #c4b5fd", color: "#5b21b6" };
      case "absent": return { background: "#fef2f2", border: "1.5px solid #fca5a5", color: "#991b1b" };
      case "today": return { background: "#eff6ff", border: "2px solid #60a5fa", color: "#1d4ed8", fontWeight: "800" };
      case "holiday": return { background: "#fefce8", border: "1.5px solid #fde68a", color: "#92400e" };
      default: return { background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#94a3b8" };
    }
  };

  const viewMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-`;
  const extraWorkingDays = Object.entries(attendanceMap).filter(([key, r]) => { if (!key.startsWith(viewMonthPrefix) || !isPresent(r)) return false; const day = parseInt(key.split("-")[2], 10); return isViewWeekend(day); }).length;
  const presentDays = Object.entries(attendanceMap).filter(([key, r]) => { if (!key.startsWith(viewMonthPrefix) || !isPresent(r)) return false; const day = parseInt(key.split("-")[2], 10); return !isViewWeekend(day); }).length;
  // For past months count all workdays; for current month count up to today
  const lastDay = isViewingCurrentMonth ? todayDate : daysInMonth;
  const totalWorkdays = Array.from({ length: lastDay }, (_, i) => i + 1).filter(d => !isViewWeekend(d)).length;
  const absentDays = Math.max(0, totalWorkdays - presentDays);

  const centerName = (() => {
    const center = isMentor ? user?.mentorProfile?.center : user?.teacherProfile?.center;
    if (center?.name) return `${center.name}${center.city ? `, ${center.city}` : ""}`;
    return user?.workingCenter || "Center not assigned";
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "inherit" }}>

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px", letterSpacing: "-0.3px" }}>
            Geotag Attendance
          </h1>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            Mark attendance with GPS location and camera verification.
          </p>
        </div>
        <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Today</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#334155" }}>{todayDate} {monthName} {currentYear}</div>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 10 }}>
        {[
          { label: "Present Days", val: presentDays, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "Absent Days", val: absentDays, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
          { label: "Working Days", val: totalWorkdays, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "Extra Days", val: extraWorkingDays, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
        ].map(({ label, val, color, bg, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color, minWidth: 24 }}>{val}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", lineHeight: 1.3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20, alignItems: "start" }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Punch Card */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "13px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15 }}>📍</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Live Location Check-In</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Camera + GPS required</div>
              </div>
            </div>

            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Campus & Timing Policy info — teachers only */}
              {!isMentor && (
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🏫</span>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px" }}>Assigned Location</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#1e293b" }}>
                          {user?.teacherProfile?.attendancePolicy?.assignedLocationName || centerName}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "2px 6px" }}>
                      ≤ {user?.teacherProfile?.attendancePolicy?.geofenceRadius || 200}m
                    </span>
                  </div>

                  {user?.teacherProfile?.attendancePolicy?.expectedTimeStart && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 6, borderTop: "1px dashed #e2e8f0" }}>
                      <span style={{ fontSize: 16 }}>⏰</span>
                      <div style={{ fontSize: 11, color: "#475569" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>Allowed Hours: </span>
                        {user.teacherProfile.attendancePolicy.expectedTimeStart} – {user.teacherProfile.attendancePolicy.expectedTimeEnd || "05:00 PM"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Banner for Today */}
              {todayRecord.checkedIn && (
                todayRecord.status === "absent" || todayRecord.verificationStatus === "REJECTED" ? (
                  <div style={{ padding: "12px 14px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#991b1b", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>❌</span> Attendance Status: Absent (Rejected by Admin)
                    </div>
                    <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4, lineHeight: 1.4 }}>
                      <strong>Reason:</strong> {todayRecord.rejectionReason || todayRecord.reviewReason || "Check-in rejected by administrator"}
                    </div>
                  </div>
                ) : todayRecord.status === "pending_review" || todayRecord.verificationStatus === "NEEDS_REVIEW" ? (
                  <div style={{ padding: "12px 14px", background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>⏳</span> Attendance Under Review
                    </div>
                    <div style={{ fontSize: 11, color: "#a16207", marginTop: 3, lineHeight: 1.4 }}>
                      {todayRecord.reviewReason ? `Flagged: ${todayRecord.reviewReason}. ` : ""}
                      Your attendance is awaiting admin/mentor review.
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>✅</span> Attendance Verified: {todayRecord.status === "late" ? "Late" : "Present"}
                    </div>
                  </div>
                )
              )}

              {/* Alerts */}
              {errorAlert && (
                <div style={{ padding: "9px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>
                  ⚠️ {errorAlert}
                </div>
              )}
              {statusReport?.success && (
                <div style={{ padding: "9px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                  ✅ {statusReport.message}
                </div>
              )}

              <canvas ref={canvasRef} style={{ display: "none" }} />

              {/* Camera Feed or Interactive Preview Card */}
              {previewState ? (
                <div style={{ background: "#f8fafc", borderRadius: 12, border: "2px solid #3b82f6", padding: 14, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 4px 12px rgba(59,130,246,0.12)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "#1e3a8a" }}>
                      <span>🔍</span> Step 2: Review Snapshot & Location
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: previewState.type === "checkin" ? "#dcfce7" : "#fee2e2", color: previewState.type === "checkin" ? "#166534" : "#991b1b" }}>
                      {previewState.type === "checkin" ? "Check-In Preview" : "Check-Out Preview"}
                    </span>
                  </div>

                  {previewFeedback && (
                    <div style={{ padding: "6px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#1d4ed8", textAlign: "center" }}>
                      {previewFeedback}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {/* Captured Selfie Thumbnail */}
                    <div style={{ width: 100, height: 100, borderRadius: 10, overflow: "hidden", border: "2px solid #94a3b8", flexShrink: 0, position: "relative", background: "#0f172a" }}>
                      {previewState.snapshot ? (
                        <img src={previewState.snapshot} alt="Captured Snapshot" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 11 }}>No Image</div>
                      )}
                      <div style={{ position: "absolute", bottom: 2, right: 2, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 8, padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>
                        Selfie
                      </div>
                    </div>

                    {/* Snapshot Metadata Details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, fontSize: 11 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b", fontWeight: 600 }}>Distance:</span>
                        <span style={{
                          fontWeight: 800,
                          color: previewState.dist <= (previewState.geofenceRadius || 200) ? "#16a34a" : "#dc2626",
                          background: previewState.dist <= (previewState.geofenceRadius || 200) ? "#f0fdf4" : "#fef2f2",
                          padding: "1px 6px", borderRadius: 4
                        }}>
                          {previewState.dist <= (previewState.geofenceRadius || 200) ? `✅ ${previewState.dist}m (Within Radius)` : `⚠️ ${previewState.dist}m (Outside Radius)`}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b", fontWeight: 600 }}>Captured Time:</span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>⏰ {previewState.timeStr}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b", fontWeight: 600 }}>GPS Accuracy:</span>
                        <span style={{ fontWeight: 700, color: "#475569" }}>±{previewState.accuracy}m</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b", fontWeight: 600 }}>Coordinates:</span>
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#2563eb" }}>{previewState.coordStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recapture & Re-fetch Controls */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 4, borderTop: "1px dashed #cbd5e1" }}>
                    <button
                      onClick={handleRecaptureSnapshot}
                      disabled={recapturingPhoto || loading}
                      style={{
                        padding: "7px 10px", borderRadius: 8, border: "1.5px solid #cbd5e1", background: "white",
                        color: "#334155", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit"
                      }}
                      title="Retake camera selfie"
                    >
                      <span>🔄</span> {recapturingPhoto ? "Capturing…" : "Recapture Selfie"}
                    </button>
                    <button
                      onClick={handleRefetchLocationTime}
                      disabled={refetchingGps || loading}
                      style={{
                        padding: "7px 10px", borderRadius: 8, border: "1.5px solid #cbd5e1", background: "white",
                        color: "#334155", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit"
                      }}
                      title="Re-query GPS coordinates"
                    >
                      <span>📍</span> {refetchingGps ? "Locating…" : "Re-fetch Location"}
                    </button>
                  </div>

                  {/* Final Submit and Cancel Buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                    <button
                      onClick={handleConfirmSubmit}
                      disabled={loading}
                      style={{
                        flex: 1, padding: "10px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 800,
                        background: previewState.type === "checkin" ? "#16a34a" : "#dc2626", color: "white",
                        cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        opacity: loading ? 0.7 : 1, fontFamily: "inherit", boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                      }}
                    >
                      {loading ? "Verifying & Submitting…" : `🚀 Confirm & Submit ${previewState.type === "checkin" ? "Check-In" : "Check-Out"}`}
                    </button>
                    <button
                      onClick={() => setPreviewState(null)}
                      disabled={loading}
                      style={{
                        padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f1f5f9",
                        color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Camera Feed */}
                  <div style={{ width: "100%", height: 200, background: "#1e293b", borderRadius: 10, overflow: "hidden", position: "relative", border: "1px solid #334155" }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraActive ? "block" : "none" }} />
                    {!cameraActive && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 16 }}>
                        <span style={{ fontSize: 28, opacity: 0.45 }}>📷</span>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", textAlign: "center", maxWidth: 200, lineHeight: 1.5 }}>
                          Camera verification required before marking attendance.
                        </p>
                        <button
                          onClick={() => setCameraActive(true)}
                          style={{ padding: "8px 18px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Activate Camera
                        </button>
                      </div>
                    )}
                    {cameraActive && (
                      <>
                        <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(15,23,42,0.7)", color: "#fff", padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%", display: "inline-block" }} />
                          Live Camera
                        </div>
                        <button onClick={() => setCameraActive(false)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(220,38,38,0.75)", border: "none", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, cursor: "pointer", fontFamily: "inherit" }}>
                          Stop
                        </button>
                      </>
                    )}
                  </div>

                  {/* Today status */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Check-In", time: todayRecord.checkInTime, done: todayRecord.checkedIn },
                      { label: "Check-Out", time: todayRecord.checkOutTime, done: todayRecord.checkedOut },
                    ].map(({ label, time, done }) => (
                      <div key={label} style={{ background: done ? "#f0fdf4" : "#f8fafc", border: `1px solid ${done ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 8, padding: "9px 12px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: done ? "#15803d" : "#94a3b8" }}>{time || "—"}</div>
                      </div>
                    ))}
                  </div>

                  {/* Punch Buttons (Step 1: Capture & Review) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button
                      onClick={() => handleInitiatePunch("checkin")}
                      disabled={loading || todayRecord.checkedIn}
                      style={{
                        padding: "11px 8px", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 700,
                        cursor: (loading || todayRecord.checkedIn) ? "not-allowed" : "pointer", fontFamily: "inherit",
                        background: todayRecord.checkedIn ? "#d1fae5" : loading && actionType === "checkin" ? "#94a3b8" : "#16a34a",
                        color: todayRecord.checkedIn ? "#166534" : "white",
                        opacity: loading && actionType === "checkin" ? 0.7 : 1
                      }}
                    >
                      {todayRecord.checkedIn ? "✅ Checked In" : loading && actionType === "checkin" ? "Reading GPS…" : "Capture & Check In"}
                    </button>
                    <button
                      onClick={() => handleInitiatePunch("checkout")}
                      disabled={loading || !todayRecord.checkedIn || todayRecord.checkedOut}
                      style={{
                        padding: "11px 8px", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 700,
                        cursor: (loading || !todayRecord.checkedIn || todayRecord.checkedOut) ? "not-allowed" : "pointer", fontFamily: "inherit",
                        background: todayRecord.checkedOut ? "#d1fae5" : !todayRecord.checkedIn ? "#f1f5f9" : loading && actionType === "checkout" ? "#94a3b8" : "#dc2626",
                        color: todayRecord.checkedOut ? "#166534" : !todayRecord.checkedIn ? "#94a3b8" : "white",
                        opacity: loading && actionType === "checkout" ? 0.7 : 1
                      }}
                    >
                      {todayRecord.checkedOut ? "✅ Checked Out" : loading && actionType === "checkout" ? "Reading GPS…" : "Capture & Check Out"}
                    </button>
                  </div>

                  <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", padding: "6px 10px", background: "#f8fafc", borderRadius: 7, border: "1px dashed #e2e8f0" }}>
                    Attendance can only be marked for <strong style={{ color: "#64748b" }}>today</strong>. You can review photo and GPS before submitting.
                  </div>

                  {coords && (
                    <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8" }}>
                      Last coords: <span style={{ fontFamily: "monospace", color: "#2563eb" }}>{coords}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Log History */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Session Log History</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{historyLogs.length} logs</span>
                {historyLogs.length > 0 && (
                  <button onClick={() => { if (window.confirm("Clear all session logs?")) setHistoryLogs([]); }}
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 7, maxHeight: 240, overflowY: "auto" }}>
              {historyLogs.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: 8, color: "#94a3b8", fontSize: 12 }}>
                  No logs yet. Check in to start recording.
                </div>
              ) : historyLogs.map(log => {
                const logDateObj = new Date(log.date.replace(/(\d+) (\w+) (\d+)/, "$2 $1, $3"));
                const logIsWeekend = !isNaN(logDateObj.getTime()) && (logDateObj.getDay() === 0 || logDateObj.getDay() === 6);
                return (
                  <div key={log.id} style={{ padding: "8px 11px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 8, display: "flex", gap: 9, alignItems: "center" }}>
                    {log.snapshot && <img src={log.snapshot} alt="Snapshot" style={{ width: 34, height: 34, borderRadius: 5, objectFit: "cover", border: "1px solid #e2e8f0", flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, marginBottom: 2, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>{log.date} — {log.time}</span>
                        <div style={{ display: "flex", gap: 3 }}>
                          {logIsWeekend && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "#f5f3ff", color: "#7c3aed" }}>Extra</span>}
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: log.type === "checkin" ? "#f0fdf4" : "#fefce8", color: log.type === "checkin" ? "#16a34a" : "#a16207" }}>
                            {log.type === "checkin" ? "In" : "Out"}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>📍 {log.coords}</div>
                      {log.distanceOffset !== undefined && (
                        <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 1 }}>{log.distanceOffset}m from campus</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Calendar */}
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Prev month */}
              <button onClick={goToPrevMonth} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>‹</button>
              <div style={{ textAlign: "center", minWidth: 120 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>{viewMonthName} {viewYear}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{isViewingCurrentMonth ? "Current month" : "Past month"}</div>
              </div>
              {/* Next month */}
              <button onClick={goToNextMonth} disabled={isViewingCurrentMonth} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, width: 28, height: 28, cursor: isViewingCurrentMonth ? "not-allowed" : "pointer", fontSize: 13, color: isViewingCurrentMonth ? "#cbd5e1" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>›</button>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: 7 }}>
              {presentDays} present · {absentDays} absent
            </span>
          </div>

          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Legend */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px" }}>
              {[
                { bg: "#f0fdf4", border: "#86efac", label: "Present" },
                { bg: "#fffbeb", border: "#fde68a", label: "Under Review" },
                { bg: "#fef2f2", border: "#fca5a5", label: "Absent" },
                { bg: "#eff6ff", border: "#93c5fd", label: "Today", bold: true },
                { bg: "#fefce8", border: "#fde68a", label: "Weekend" },
                { bg: "#f5f3ff", border: "#c4b5fd", label: "Extra Day" },
                { bg: "#f8fafc", border: "#e2e8f0", label: "Upcoming" },
              ].map(({ bg, border, label, bold }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: `1.5px solid ${border}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: bold ? 700 : 500, color: "#64748b" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center", paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: i >= 5 ? "#a78bfa" : "#94a3b8" }}>{d}</span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const status = getDayStatus(day);
                const tile = getTileStyle(status);
                const isToday = isViewingCurrentMonth && day === todayDate;
                return (
                  <div key={day} style={{ ...tile, height: 46, borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "5px", boxSizing: "border-box", outline: isToday ? "2px solid #60a5fa" : "none", outlineOffset: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 600 }}>{day}</span>
                    {status === "present" && <span style={{ alignSelf: "flex-end", fontSize: 7, background: "#16a34a", color: "white", padding: "1px 3px", borderRadius: 2, fontWeight: 800 }}>✓</span>}
                    {status === "review" && <span style={{ alignSelf: "flex-end", fontSize: 7, background: "#d97706", color: "white", padding: "1px 3px", borderRadius: 2, fontWeight: 800 }}>⏳</span>}
                    {status === "extra" && <span style={{ alignSelf: "flex-end", fontSize: 7, background: "#7c3aed", color: "white", padding: "1px 3px", borderRadius: 2, fontWeight: 800 }}>✓</span>}
                    {status === "absent" && <span style={{ alignSelf: "flex-end", fontSize: 7, background: "#dc2626", color: "white", padding: "1px 3px", borderRadius: 2, fontWeight: 800 }}>✗</span>}
                    {status === "today" && <span style={{ alignSelf: "flex-end", fontSize: 6, background: "#3b82f6", color: "white", padding: "1px 3px", borderRadius: 2, fontWeight: 800 }}>NOW</span>}
                    {status === "holiday" && <span style={{ alignSelf: "flex-end", fontSize: 7, background: "#d1d5db", color: "white", padding: "1px 3px", borderRadius: 2 }}>—</span>}
                  </div>
                );
              })}
            </div>

            {/* Monthly summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Present", value: presentDays, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                { label: "Absent", value: absentDays, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                { label: "Work Days", value: totalWorkdays, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {extraWorkingDays > 0 && (
              <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#7c3aed" }}>{extraWorkingDays}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#6d28d9", marginTop: 2 }}>Extra Working Days (Weekends)</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
