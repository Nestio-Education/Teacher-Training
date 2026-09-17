/**
 * Calculates Haversine distance in meters between two lat/lon coordinates.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371e3; // Earth radius in meters
  const p1 = (Number(lat1) * Math.PI) / 180;
  const p2 = (Number(lat2) * Math.PI) / 180;
  const dp = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dl = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Parses time string (e.g. "09:30 AM" or "09:30" or "09:30:00") into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const str = String(timeStr).trim().toUpperCase();

  const isPM = str.includes("PM");
  const isAM = str.includes("AM");
  const clean = str.replace(/[^\d:]/g, "");
  const parts = clean.split(":").map(Number);
  if (parts.length === 0 || isNaN(parts[0])) return null;

  let hours = parts[0];
  const minutes = parts[1] || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * ── Weighted Risk-Scoring Engine ──
 * 
 * Weights:
 * - Location Geofence: 40%
 * - Time & EXIF: 30%
 * - Image Quality & Duplicate Detection: 30%
 */
export function evaluateAttendanceRisk({
  actualLat,
  actualLon,
  targetLat,
  targetLon,
  geofenceRadius = 200,
  locationName = "Assigned Location",
  checkInTime,
  expectedTimeStart,
  expectedTimeEnd,
  imageFeatures = {},
  duplicateMatch = {}
}) {
  let riskScore = 0;
  const reasons = [];

  // 1. Geofence Evaluation (Weight: 40)
  let distanceMeters = null;
  let locationResult = "N/A";

  if (actualLat != null && actualLon != null && targetLat != null && targetLon != null) {
    distanceMeters = calculateHaversineDistance(actualLat, actualLon, targetLat, targetLon);
    const radius = Number(geofenceRadius) || 200;

    if (distanceMeters <= radius) {
      locationResult = "PASS";
    } else {
      locationResult = "FAIL";
      if (distanceMeters <= radius * 2) {
        riskScore += 20;
      } else {
        riskScore += 40;
      }
      const distKm = (distanceMeters / 1000).toFixed(1);
      const distStr = distanceMeters >= 1000 ? `${distKm} km` : `${distanceMeters}m`;
      reasons.push(`Wrong Location (${distStr} away from ${locationName})`);
    }
  }

  // 2. Time & EXIF Evaluation (Weight: 30)
  let timeResult = "N/A";
  if (checkInTime && expectedTimeStart) {
    const actualMin = parseTimeToMinutes(checkInTime);
    const expectedMin = parseTimeToMinutes(expectedTimeStart);

    if (actualMin != null && expectedMin != null) {
      const graceMinutes = 5; // 5-minute grace period
      if (actualMin <= expectedMin + graceMinutes) {
        timeResult = "PASS";
      } else {
        timeResult = "LATE";
        const minsLate = actualMin - expectedMin;
        if (minsLate <= 30) {
          riskScore += 15;
        } else {
          riskScore += 25;
        }
        reasons.push(`Late Arrival (${minsLate} mins late, arrived at ${checkInTime})`);
      }
    }
  }

  // EXIF sub-check
  let exifStatus = imageFeatures.exif?.status || "N/A";
  if (imageFeatures.exif?.status === "TAMPERED") {
    riskScore += 10;
    reasons.push("EXIF Timestamp Mismatch");
  }

  // 3. Image Quality & Duplicate Evaluation (Weight: 30)
  let qualityResult = "PASS";

  if (imageFeatures.isInvalidPhoto) {
    qualityResult = "FAIL";
    riskScore += 25;
    reasons.push("Invalid Photo (Unclear / Black Screen)");
  } else {
    if (imageFeatures.blur && !imageFeatures.blur.pass) {
      qualityResult = "FAIL";
      riskScore += 15;
      reasons.push("Blurry Photo");
    }

    if (imageFeatures.brightness && !imageFeatures.brightness.pass) {
      qualityResult = "FAIL";
      riskScore += 10;
      const desc = imageFeatures.brightness.level === "TOO_DARK" ? "Low Lighting / Dark Photo" : "Overexposed / Flash Glare";
      reasons.push(desc);
    }
  }

  if (duplicateMatch && duplicateMatch.isDuplicate) {
    riskScore += 30;
    reasons.push("Duplicate Photo (Previously Used Photo)");
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine Verification Status
  const isNeedsReview = riskScore >= 25 || locationResult === "FAIL" || timeResult === "LATE" || duplicateMatch?.isDuplicate || qualityResult === "FAIL";
  const verificationStatus = isNeedsReview ? "NEEDS_REVIEW" : "APPROVED";

  const reviewReason = reasons.length > 0
    ? reasons.join("; ")
    : "All criteria passed (on-time, within geofence, clear photo).";

  return {
    verificationStatus,
    riskScore,
    reviewReason,
    reasons,
    distanceMeters,
    locationResult,
    timeResult,
    qualityResult,
    exifStatus,
    pHash: imageFeatures.pHash || "",
    blurScore: imageFeatures.blur?.score ?? null,
    brightnessScore: imageFeatures.brightness?.score ?? null
  };
}
