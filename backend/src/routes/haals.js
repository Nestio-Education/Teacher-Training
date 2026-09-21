import express from "express";
import { VisitObservation } from "../models/VisitObservation.js";
import { User } from "../models/User.js";
import { Child } from "../models/Child.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

// Helper to escape regex special characters
function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

// ── Enhanced Webhook Row Parser ──
function mapRawRowToSchema(row) {
  const normalizedRow = {};
  for (const key of Object.keys(row)) {
    const normKey = String(key).toLowerCase().replace(/[\s_\-–—:/?!.,()[\]{}"'\\\/]/g, "");
    normalizedRow[normKey] = row[key];
  }

  function getVal(keysList, defaultValue = undefined) {
    // 1. Exact match on normalized keys
    for (const key of keysList) {
      const norm = String(key).toLowerCase().replace(/[\s_\-–—:/?!.,()[\]{}"'\\\/]/g, "");
      if (normalizedRow[norm] !== undefined && normalizedRow[norm] !== null && normalizedRow[norm] !== "") {
        return normalizedRow[norm];
      }
    }
    // 2. Fuzzy substring match fallback
    for (const key of keysList) {
      const norm = String(key).toLowerCase().replace(/[\s_\-–—:/?!.,()[\]{}"'\\\/]/g, "");
      if (norm.length >= 4) {
        for (const [rKey, rVal] of Object.entries(normalizedRow)) {
          if ((rKey.includes(norm) || norm.includes(rKey)) && rVal !== undefined && rVal !== null && rVal !== "") {
            return rVal;
          }
        }
      }
    }
    return defaultValue;
  }

  function getBool(keysList, defaultValue = false) {
    const val = getVal(keysList);
    if (val === undefined || val === null || val === "") return defaultValue;
    if (typeof val === "boolean") return val;
    const str = String(val).toLowerCase().trim();
    if (
      str === "yes" ||
      str === "true" ||
      str === "1" ||
      str === "y" ||
      str === "available" ||
      str === "observed" ||
      str === "participated" ||
      str === "completed" ||
      str === "adequate" ||
      str === "assisted" ||
      str === "willing"
    ) {
      return true;
    }
    if (
      str === "no" ||
      str === "false" ||
      str === "0" ||
      str === "n" ||
      str === "not available" ||
      str === "not present" ||
      str === "inadequate" ||
      str === "not willing"
    ) {
      return false;
    }
    return defaultValue;
  }

  function getNum(keysList, defaultValue = undefined) {
    const val = getVal(keysList);
    if (val === undefined || val === null || val === "") return defaultValue;
    if (typeof val === "number") return isNaN(val) ? defaultValue : val;
    const str = String(val).trim();
    const directNum = Number(str);
    if (!isNaN(directNum)) return directNum;

    // Match leading or contained number e.g. "4 - Emerging", "Level 3", "Rating: 5/5"
    const match = str.match(/\b([0-5](?:\.\d+)?)\b/);
    if (match) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed)) return parsed;
    }

    // Qualitative milestone mappings
    const lower = str.toLowerCase();
    if (lower.includes("mastered") || lower.includes("advanced") || lower.includes("excellent")) return 5;
    if (lower.includes("proficient") || lower.includes("high") || lower.includes("good")) return 4;
    if (lower.includes("developing") || lower.includes("emerging") || lower.includes("moderate")) return 3;
    if (lower.includes("beginning") || lower.includes("attempted") || lower.includes("low") || lower.includes("needs support")) return 2;
    if (lower.includes("not attempted") || lower.includes("poor") || lower.includes("none")) return 1;
    return defaultValue;
  }

  function getArray(keysList) {
    const val = getVal(keysList);
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      return val.split(/[;,|]/).map(s => s.trim()).filter(Boolean);
    }
    return [String(val)];
  }

  const rawDate = getVal(["visitdate", "dateofvisit", "timestamp", "date", "datevisit", "visit_date"]);
  const visitDate = rawDate ? new Date(rawDate) : new Date();

  const facilitatorNameRaw = getVal([
    "nameoffieldfacilitator",
    "facilitatorname",
    "facilitator",
    "fieldfacilitatorname",
    "fieldfacilitator",
    "teachername",
    "fellowname",
    "name"
  ], "");

  const village = getVal(["villagearea", "village", "area", "address", "community", "location", "center"], "");
  const childName = getVal(["childsname", "childname", "child", "nameofchild", "childfullname", "studentname"], "");
  const ageGroup = getVal(["childsage", "agegroup", "age", "childage", "agebracket"], "");
  const program = getVal(["programenrolled", "program", "enrolledprogram", "course", "project"], "");

  const childPresent = getBool(["ischildpresent", "childpresent", "childpresentyesno", "present"], true);
  const caregiverAvailable = getBool(["iscaregiveravailable", "caregiveravailable", "caregiveravailableyesno", "caregiverpresent"], true);
  const childWillingness = getBool(["ischildwillingtoparticipate", "childwillingtoparticipate", "childwillingness", "childwilling", "willingness"], true);

  const spaceAdequate = getBool(["spaceadequacy", "spaceadequate", "isspaceadequate", "spaceavailability", "roomspace"], undefined);
  const materialsAvailable = getArray(["materialsavailable", "materialsavailableyesno", "materials", "toysstationeryavailable", "learningmaterials"]);
  const householdItemsUsable = getBool(["householditemssubstitutefortoys", "householditemsusable", "arehouseholditemsusable", "householditemsused", "householditems"], undefined);

  const caregiverObserved = getBool(["didthecaregiverobserve", "didcaregiverobserve", "caregiverobserved", "caregiverobservation", "parentobserved"], undefined);
  const caregiverParticipated = getBool([
    "didthecaregiverparticipate",
    "didcaregiverparticipate",
    "didthecaregiverparticipateassist",
    "caregiverparticipated",
    "parentparticipation",
    "parentparticipated",
    "caregiverengagement"
  ], undefined);
  const canRepeatAtHome = getBool(["cantheyrepeatitathome", "canrepeatathome", "cantheyrepeat", "canrepeat", "repeatabilityathome", "repeatathome"], undefined);
  const helpFactors = getArray(["whathelped", "whathelpedduringthesession", "helpfactors", "positives", "facilitators"]);
  const challenges = getArray(["whatchallengescameup", "challenges", "challengescameup", "difficulties", "barriers", "issuesfaced"]);
  const isFollowUp = getBool(["followuponlastweeksactivity", "isfollowup", "followup", "isthisafollowupvisit"], undefined);
  const didLastWeekActivity = getBool(["didtheydolastweeksactivity", "didlastweekactivity", "didparentdolastweekactivity", "lastweekactivitydone"], undefined);
  const lastWeekCompletionCount = getNum(["lastweekcompletioncount", "howmanytimescompleted", "completioncount", "frequencyofactivity"]);
  const lastWeekDifficulties = getVal(["lastweekdifficulties", "difficultieslastweek", "issuesinlastweekactivity"], "");
  const homeActivitiesAssigned = getBool(["homeactivitiesassigned", "activitiesassigned", "assignedhomeactivities", "homeworkassigned"], undefined);

  const recommendedAction = getVal([
    "recommendednextaction",
    "recommendedaction",
    "nextaction",
    "nextsteps",
    "followupaction",
    "recommendedfollowup",
    "actionrequired"
  ], "");

  const childParticipationRating = getNum([
    "childparticipationrating",
    "childparticipationrating15",
    "childparticipation",
    "ratingchildparticipation",
    "childengagementrating",
    "childrating"
  ]);
  const parentCooperationRating = getNum([
    "parentcooperationrating",
    "parentcooperationrating15",
    "parentcooperation",
    "ratingparentcooperation",
    "parentcooperationengagement",
    "parentrating"
  ]);
  const homeEnvironmentRating = getNum([
    "homeenvironmentrating",
    "homeenvironmentrating15",
    "homeenvironment",
    "ratinghomeenvironment",
    "environmentrating"
  ]);
  const remarks = getVal(["facilitatorremarks", "remarks", "additionalremarks", "notes", "comments", "facilitatorfeedback", "generalnotes"], "");
  const photos = getArray(["photos", "evidencephotos", "photourls", "uploadphoto", "photosurl", "imageurl"]);

  const activities = [];

  // Activity 1
  const act1Name = getVal(["nameoftheactivity1", "activityname1", "activity1name", "activity1", "nameoftheactivity", "activityname"]);
  if (act1Name) {
    const act1Domain = getArray(["domain1", "activity1domain", "domain"]);
    const act1Engagement = getVal(["engagementlevel1", "activity1engagementlevel", "engagement1", "engagementlevel", "childengagement"], "");
    const act1Score = getNum([
      "milestonestatus1",
      "milestonescore1",
      "milestonescore115",
      "activity1milestonescore",
      "milestone1",
      "milestonestatus",
      "milestonescore",
      "milestonescore15",
      "score1",
      "score"
    ], childParticipationRating);

    activities.push({
      activityName: act1Name,
      milestoneSource: getVal(["milestonesource1", "activity1milestonesource", "milestonesource"], ""),
      domain: act1Domain.length > 0 ? act1Domain : ["Cognitive & Motor"],
      engagementLevel: act1Engagement || (childParticipationRating && childParticipationRating >= 4 ? "Highly Engaged" : "Moderately Engaged"),
      attempted: getBool(["attempted1", "activity1attempted", "attempted"], true),
      completed: getBool(["completed1", "activity1completed", "completed"], true),
      supportNeeded: getBool(["supportneeded1", "activity1supportneeded", "supportneeded"], false),
      milestoneStatus: act1Score !== undefined ? act1Score : (childParticipationRating || 4)
    });
  }

  // Activity 2
  const act2Name = getVal(["nameoftheactivity2", "activityname2", "activity2name", "activity2"]);
  if (act2Name) {
    const act2Domain = getArray(["domain2", "activity2domain"]);
    const act2Engagement = getVal(["engagementlevel2", "activity2engagementlevel", "engagement2"], "");
    const act2Score = getNum([
      "milestonestatus2",
      "milestonescore2",
      "milestonescore215",
      "activity2milestonescore",
      "milestone2",
      "score2"
    ], childParticipationRating);

    activities.push({
      activityName: act2Name,
      milestoneSource: getVal(["milestonesource2", "activity2milestonesource"], ""),
      domain: act2Domain.length > 0 ? act2Domain : ["Language & Communication"],
      engagementLevel: act2Engagement || (childParticipationRating && childParticipationRating >= 4 ? "Highly Engaged" : "Moderately Engaged"),
      attempted: getBool(["attempted2", "activity2attempted"], true),
      completed: getBool(["completed2", "activity2completed"], true),
      supportNeeded: getBool(["supportneeded2", "activity2supportneeded"], false),
      milestoneStatus: act2Score !== undefined ? act2Score : (childParticipationRating || 4)
    });
  }

  // If no activities array but we have visit participation ratings, construct baseline activity
  if (activities.length === 0 && (childParticipationRating || program)) {
    activities.push({
      activityName: program ? `${program} Home Observation Activity` : "Structured Developmental Activity",
      milestoneSource: "HAALS Framework",
      domain: ["General Development"],
      engagementLevel: (childParticipationRating && childParticipationRating >= 4) ? "Highly Engaged" : "Moderately Engaged",
      attempted: true,
      completed: true,
      supportNeeded: false,
      milestoneStatus: childParticipationRating || 4
    });
  }

  return {
    visitDate,
    facilitatorNameRaw,
    village,
    childName,
    ageGroup,
    program,
    childPresent,
    caregiverAvailable,
    childWillingness,
    spaceAdequate,
    materialsAvailable,
    householdItemsUsable,
    activities,
    caregiverObserved: caregiverObserved !== undefined ? caregiverObserved : (parentCooperationRating !== undefined ? parentCooperationRating >= 3 : true),
    caregiverParticipated: caregiverParticipated !== undefined ? caregiverParticipated : (parentCooperationRating !== undefined ? parentCooperationRating >= 3 : true),
    canRepeatAtHome,
    helpFactors,
    challenges,
    isFollowUp,
    didLastWeekActivity,
    lastWeekCompletionCount,
    lastWeekDifficulties,
    homeActivitiesAssigned,
    recommendedAction,
    childParticipationRating: childParticipationRating || 4,
    parentCooperationRating: parentCooperationRating || 4,
    homeEnvironmentRating: homeEnvironmentRating || 4,
    remarks,
    photos
  };
}

// ── Optimized Cached ID Resolver & Bulk Ingestion ──
async function resolveIdsForBatch(parsedRows) {
  const facilitatorCache = new Map();
  const childCache = new Map();

  for (const item of parsedRows) {
    let facilitatorId = null;
    let childId = null;

    // 1. Resolve Facilitator with cache
    if (item.facilitatorNameRaw) {
      const rawName = item.facilitatorNameRaw.trim();
      const normFacName = rawName.toLowerCase();
      if (!facilitatorCache.has(normFacName)) {
        const facilitator = await User.findOne({
          name: { $regex: new RegExp(`^${escapeRegex(rawName)}$`, "i") },
          role: { $in: ["fellow", "teacher", "admin", "mentor"] }
        }).lean();
        facilitatorCache.set(normFacName, facilitator || null);
      }
      const cachedFac = facilitatorCache.get(normFacName);
      if (cachedFac) {
        facilitatorId = cachedFac._id;
      }
    }

    // 2. Resolve Child with cache
    if (item.childName) {
      const rawChildName = item.childName.trim();
      const normChildName = rawChildName.toLowerCase();
      const childCacheKey = `${normChildName}_${facilitatorId || "nofac"}`;

      if (!childCache.has(childCacheKey)) {
        let foundChild = null;

        if (facilitatorId) {
          const cachedFac = facilitatorCache.get(item.facilitatorNameRaw.trim().toLowerCase());
          const centerId = cachedFac?.teacherProfile?.center;
          const classIds = cachedFac?.teacherProfile?.classes || [];

          if (classIds && classIds.length > 0) {
            foundChild = await Child.findOne({
              fullName: { $regex: new RegExp(`^${escapeRegex(rawChildName)}$`, "i") },
              class: { $in: classIds }
            }).lean();
          }
          if (!foundChild && centerId) {
            foundChild = await Child.findOne({
              fullName: { $regex: new RegExp(`^${escapeRegex(rawChildName)}$`, "i") },
              center: centerId
            }).lean();
          }
        }

        if (!foundChild) {
          foundChild = await Child.findOne({
            fullName: { $regex: new RegExp(`^${escapeRegex(rawChildName)}$`, "i") }
          }).lean();
        }

        childCache.set(childCacheKey, foundChild ? foundChild._id : null);
      }

      childId = childCache.get(childCacheKey);
    }

    item.facilitatorId = facilitatorId;
    item.childId = childId;
  }
}

// ── 1. Webhook Sync / Backfill Endpoint ──
// Accepts a single row object or an array of row objects
router.post("/visits", async (req, res, next) => {
  try {
    // Secret sync token check
    const expectedSecret = process.env.HAALS_SYNC_SECRET || "62088284c5af1efe970f1eb7789a2063b41814765e81f6fe6ff3c08307b40477";
    const clientSecret = req.headers["x-sync-secret"] || req.query.secret;
    if (!clientSecret || clientSecret !== expectedSecret) {
      return res.status(401).json({ success: false, message: "Unauthorized sync attempt." });
    }

    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, message: "Empty request payload." });
    }

    const rows = Array.isArray(payload) ? payload : [payload];
    if (rows.length === 0) {
      return res.json({ success: true, processedCount: 0, syncedCount: 0 });
    }

    const parsedRows = rows.map(mapRawRowToSchema);
    await resolveIdsForBatch(parsedRows);

    const bulkOps = parsedRows.map((doc) => ({
      updateOne: {
        filter: {
          visitDate: doc.visitDate,
          childName: doc.childName,
          facilitatorNameRaw: doc.facilitatorNameRaw
        },
        update: { $set: doc },
        upsert: true
      }
    }));

    const bulkRes = await VisitObservation.bulkWrite(bulkOps, { ordered: false });

    res.json({
      success: true,
      processedCount: rows.length,
      syncedCount: (bulkRes.upsertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.matchedCount || 0),
      upsertedCount: bulkRes.upsertedCount || 0,
      modifiedCount: bulkRes.modifiedCount || 0,
      matchedCount: bulkRes.matchedCount || 0
    });
  } catch (err) {
    next(err);
  }
});

// ── 2. Fellow Dashboard Metrics ──
router.get("/fellow/metrics", requireAuth, async (req, res, next) => {
  try {
    let query = {};

    // Mentor/Admin can view specific fellow metrics
    if (["admin", "mentor", "super_admin"].includes(req.user.role) && req.query.fellowId) {
      const targetUser = await User.findById(req.query.fellowId).lean();
      const targetName = targetUser?.name || "";
      query = {
        $or: [
          { facilitatorId: req.query.fellowId },
          ...(targetName ? [{ facilitatorNameRaw: { $regex: new RegExp(`^${escapeRegex(targetName)}$`, "i") } }] : [])
        ]
      };
    } else if (["fellow", "teacher"].includes(req.user.role)) {
      const userName = req.user.name || "";
      query = {
        $or: [
          { facilitatorId: req.user.id },
          ...(userName ? [{ facilitatorNameRaw: { $regex: new RegExp(`^${escapeRegex(userName)}$`, "i") } }] : [])
        ]
      };
    } else {
      // Super admin / admin global overview without specific fellowId
      query = {};
    }

    const visits = await VisitObservation.find(query)
      .sort({ visitDate: -1 })
      .populate("facilitatorId", "name email")
      .lean();

    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => v.childPresent !== false && v.caregiverAvailable !== false);
    const completedCount = completedVisits.length;
    const completionRate = totalVisits > 0 ? Math.round((completedCount / totalVisits) * 100) : 0;

    // Calculate average milestone and domain metrics
    let totalMilestoneSum = 0;
    let milestoneCount = 0;
    const domainScores = {};

    completedVisits.forEach(v => {
      let visitHasScore = false;
      (v.activities || []).forEach(act => {
        if (act.milestoneStatus !== undefined && act.milestoneStatus !== null && !isNaN(act.milestoneStatus) && act.milestoneStatus > 0) {
          const score = Number(act.milestoneStatus);
          totalMilestoneSum += score;
          milestoneCount++;
          visitHasScore = true;

          const domains = (act.domain && act.domain.length > 0) ? act.domain : ["Cognitive"];
          domains.forEach(d => {
            const cleanDomain = d.trim();
            if (!domainScores[cleanDomain]) {
              domainScores[cleanDomain] = { sum: 0, count: 0 };
            }
            domainScores[cleanDomain].sum += score;
            domainScores[cleanDomain].count++;
          });
        }
      });

      // Fallback if no activity score was recorded but closing ratings exist
      if (!visitHasScore && v.childParticipationRating && v.childParticipationRating > 0) {
        const score = Number(v.childParticipationRating);
        totalMilestoneSum += score;
        milestoneCount++;
        const dom = v.program || "Cognitive";
        if (!domainScores[dom]) {
          domainScores[dom] = { sum: 0, count: 0 };
        }
        domainScores[dom].sum += score;
        domainScores[dom].count++;
      }
    });

    const averageMilestoneScore = milestoneCount > 0 ? Math.round((totalMilestoneSum / milestoneCount) * 10) / 10 : 0;

    const milestoneByDomain = Object.keys(domainScores).map(d => ({
      domain: d,
      average: Math.round((domainScores[d].sum / domainScores[d].count) * 10) / 10,
      count: domainScores[d].count
    })).sort((a, b) => b.count - a.count);

    // Parent Participation Rate
    const visitsWithParentParticipation = completedVisits.filter(v => {
      return (
        v.caregiverParticipated === true ||
        v.caregiverObserved === true ||
        (v.parentCooperationRating && v.parentCooperationRating >= 3) ||
        (v.helpFactors && v.helpFactors.length > 0)
      );
    });
    const parentParticipationRate = completedCount > 0 ? Math.round((visitsWithParentParticipation.length / completedCount) * 100) : 0;

    // Follow-ups Pending
    const followUpsPending = completedVisits.filter(v => {
      const action = String(v.recommendedAction || "").trim().toLowerCase();
      const hasAction = action && !["none", "no action", "no_action", "n/a", "nil"].includes(action);
      return hasAction || v.isFollowUp === true || v.homeActivitiesAssigned === true;
    }).length;

    // Child Engagement Rate
    const highlyEngagedVisits = completedVisits.filter(v => {
      if (v.childParticipationRating && v.childParticipationRating >= 3) return true;
      if (v.childWillingness !== false) return true;
      return (v.activities || []).some(a => ["highly engaged", "engaged", "moderate", "active"].includes(String(a.engagementLevel || "").toLowerCase()));
    });
    const childEngagementRate = completedCount > 0 ? Math.round((highlyEngagedVisits.length / completedCount) * 100) : 0;

    // Adequate Home Environment Rate
    const adequateEnvVisits = completedVisits.filter(v => {
      return v.spaceAdequate === true || (v.homeEnvironmentRating && v.homeEnvironmentRating >= 3) || (v.materialsAvailable && v.materialsAvailable.length > 0);
    });
    const adequateHomeEnvironmentRate = completedCount > 0 ? Math.round((adequateEnvVisits.length / completedCount) * 100) : 0;

    // Common Challenges
    const challengeCounts = {};
    completedVisits.forEach(v => {
      (v.challenges || []).forEach(ch => {
        const clean = String(ch).trim();
        if (clean && !["none", "nil", "no", "na", "n/a"].includes(clean.toLowerCase())) {
          challengeCounts[clean] = (challengeCounts[clean] || 0) + 1;
        }
      });
    });

    const commonChallenges = Object.keys(challengeCounts)
      .map(ch => ({ challenge: ch, count: challengeCounts[ch] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Help Factors
    const helpCounts = {};
    completedVisits.forEach(v => {
      (v.helpFactors || []).forEach(hf => {
        const clean = String(hf).trim();
        if (clean && !["none", "nil", "no", "na", "n/a"].includes(clean.toLowerCase())) {
          helpCounts[clean] = (helpCounts[clean] || 0) + 1;
        }
      });
    });

    const helpFactors = Object.keys(helpCounts)
      .map(hf => ({ factor: hf, count: helpCounts[hf] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentVisits = visits.slice(0, 10).map(v => {
      const isCompleted = v.childPresent !== false && v.caregiverAvailable !== false;
      const acts = v.activities || [];
      const actNames = acts.map(a => a.activityName).filter(Boolean).join(", ");
      const engagement = acts.map(a => a.engagementLevel).filter(Boolean).join(", ") || (v.childParticipationRating ? `Rating: ${v.childParticipationRating}/5` : "Good");
      
      let milestoneDisplay = "N/A";
      const validScores = acts.map(a => a.milestoneStatus).filter(s => s !== undefined && s !== null && !isNaN(s));
      if (validScores.length > 0) {
        const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        milestoneDisplay = `${Math.round(avg * 10) / 10} / 5`;
      } else if (v.childParticipationRating) {
        milestoneDisplay = `${v.childParticipationRating} / 5`;
      }

      return {
        _id: v._id,
        childName: v.childName || "Unknown Child",
        childAge: v.ageGroup || "N/A",
        visitDate: v.visitDate,
        facilitatorName: v.facilitatorId?.name || v.facilitatorNameRaw || "Assigned Fellow",
        village: v.village || "N/A",
        program: v.program || "HAALS",
        activities: actNames || "Developmental Activity",
        activitiesList: acts,
        milestoneScoreDisplay: milestoneDisplay,
        engagementLevel: engagement,
        caregiverParticipated: v.caregiverParticipated,
        caregiverObserved: v.caregiverObserved,
        parentCooperationRating: v.parentCooperationRating,
        childParticipationRating: v.childParticipationRating,
        homeEnvironmentRating: v.homeEnvironmentRating,
        spaceAdequate: v.spaceAdequate,
        materialsAvailable: v.materialsAvailable || [],
        challenges: v.challenges || [],
        helpFactors: v.helpFactors || [],
        recommendedAction: v.recommendedAction || "",
        status: isCompleted ? "Completed" : "Incomplete",
        remarks: v.remarks || ""
      };
    });

    res.json({
      success: true,
      kpis: {
        visitsCompleted: completedCount,
        visitsScheduled: totalVisits,
        completionRate,
        averageMilestoneScore,
        parentParticipationRate,
        followUpsPending,
        childEngagementRate,
        adequateHomeEnvironmentRate
      },
      milestoneByDomain,
      recentVisits,
      commonChallenges,
      helpFactors
    });
  } catch (err) {
    next(err);
  }
});

// ── 3. Mentor Dashboard Metrics (Rolled Up) ──
router.get("/mentor/metrics", requireAuth, async (req, res, next) => {
  try {
    if (!["mentor", "admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access Denied. Mentor/Admin role required." });
    }

    let fellowIds = [];
    let fellowNames = [];
    if (req.user.role === "mentor") {
      const mentor = await User.findById(req.user.id).lean();
      fellowIds = mentor?.mentorProfile?.assignedTeachers || [];
      const assignedUsers = await User.find({ _id: { $in: fellowIds } }).select("name").lean();
      fellowNames = assignedUsers.map(u => u.name).filter(Boolean);
    } else {
      // Admins see all fellows
      const fellows = await User.find({ role: { $in: ["fellow", "teacher"] } }).select("_id name").lean();
      fellowIds = fellows.map(f => f._id);
      fellowNames = fellows.map(f => f.name).filter(Boolean);
    }

    const query = (fellowIds.length > 0 || fellowNames.length > 0) ? {
      $or: [
        ...(fellowIds.length > 0 ? [{ facilitatorId: { $in: fellowIds } }] : []),
        ...(fellowNames.length > 0 ? [{ facilitatorNameRaw: { $in: fellowNames.map(n => new RegExp(`^${escapeRegex(n)}$`, "i")) } }] : [])
      ]
    } : {};

    const visits = await VisitObservation.find(query)
      .sort({ visitDate: -1 })
      .populate("facilitatorId", "name email")
      .lean();

    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => v.childPresent !== false && v.caregiverAvailable !== false);
    const completedCount = completedVisits.length;
    const centerVisitCompletion = totalVisits > 0 ? Math.round((completedCount / totalVisits) * 100) : 0;

    let totalMilestoneSum = 0;
    let milestoneCount = 0;
    const domainScores = {};

    completedVisits.forEach(v => {
      let visitHasScore = false;
      (v.activities || []).forEach(act => {
        if (act.milestoneStatus !== undefined && act.milestoneStatus !== null && !isNaN(act.milestoneStatus) && act.milestoneStatus > 0) {
          const score = Number(act.milestoneStatus);
          totalMilestoneSum += score;
          milestoneCount++;
          visitHasScore = true;

          const domains = (act.domain && act.domain.length > 0) ? act.domain : ["Cognitive"];
          domains.forEach(d => {
            const cleanDomain = d.trim();
            if (!domainScores[cleanDomain]) {
              domainScores[cleanDomain] = { sum: 0, count: 0 };
            }
            domainScores[cleanDomain].sum += score;
            domainScores[cleanDomain].count++;
          });
        }
      });

      if (!visitHasScore && v.childParticipationRating && v.childParticipationRating > 0) {
        const score = Number(v.childParticipationRating);
        totalMilestoneSum += score;
        milestoneCount++;
        const dom = v.program || "Cognitive";
        if (!domainScores[dom]) {
          domainScores[dom] = { sum: 0, count: 0 };
        }
        domainScores[dom].sum += score;
        domainScores[dom].count++;
      }
    });

    const centerAverageMilestoneScore = milestoneCount > 0 ? Math.round((totalMilestoneSum / milestoneCount) * 10) / 10 : 0;

    // Parent Participation Center-wide
    const visitsWithParentParticipation = completedVisits.filter(v => {
      return (
        v.caregiverParticipated === true ||
        v.caregiverObserved === true ||
        (v.parentCooperationRating && v.parentCooperationRating >= 3)
      );
    });
    const centerParentParticipationRate = completedCount > 0 ? Math.round((visitsWithParentParticipation.length / completedCount) * 100) : 0;

    // Per-fellow comparison table
    const fellowStats = {};
    for (const fId of fellowIds) {
      const fUser = await User.findById(fId).lean();
      if (fUser) {
        fellowStats[fUser.name.toLowerCase().trim()] = {
          fellowId: fId.toString(),
          name: fUser.name,
          email: fUser.email,
          visitsScheduled: 0,
          visitsCompleted: 0,
          completionRate: 0,
          averageMilestoneScore: 0,
          parentParticipationRate: 0,
          followUpsPending: 0,
          milestoneSum: 0,
          milestoneCount: 0,
          parentPartCount: 0
        };
      }
    }

    for (const v of visits) {
      const facName = (v.facilitatorId?.name || v.facilitatorNameRaw || "Unknown Facilitator").toLowerCase().trim();
      if (!fellowStats[facName]) {
        fellowStats[facName] = {
          fellowId: v.facilitatorId?._id?.toString() || null,
          name: v.facilitatorId?.name || v.facilitatorNameRaw || "Field Facilitator",
          email: v.facilitatorId?.email || "field@spaceece.org",
          visitsScheduled: 0,
          visitsCompleted: 0,
          completionRate: 0,
          averageMilestoneScore: 0,
          parentParticipationRate: 0,
          followUpsPending: 0,
          milestoneSum: 0,
          milestoneCount: 0,
          parentPartCount: 0
        };
      }

      const stat = fellowStats[facName];
      stat.visitsScheduled++;
      const isCompleted = v.childPresent !== false && v.caregiverAvailable !== false;
      if (isCompleted) {
        stat.visitsCompleted++;
        if (v.caregiverParticipated === true || v.caregiverObserved === true || (v.parentCooperationRating && v.parentCooperationRating >= 3)) {
          stat.parentPartCount++;
        }
        const action = String(v.recommendedAction || "").trim().toLowerCase();
        if (action && !["none", "no action", "no_action", "n/a", "nil"].includes(action)) {
          stat.followUpsPending++;
        }

        let scored = false;
        (v.activities || []).forEach(act => {
          if (act.milestoneStatus !== undefined && act.milestoneStatus !== null && !isNaN(act.milestoneStatus) && act.milestoneStatus > 0) {
            stat.milestoneSum += Number(act.milestoneStatus);
            stat.milestoneCount++;
            scored = true;
          }
        });
        if (!scored && v.childParticipationRating && v.childParticipationRating > 0) {
          stat.milestoneSum += Number(v.childParticipationRating);
          stat.milestoneCount++;
        }
      }
    }

    const fellowComparisonTable = Object.values(fellowStats).map(stat => {
      stat.completionRate = stat.visitsScheduled > 0 ? Math.round((stat.visitsCompleted / stat.visitsScheduled) * 100) : 0;
      stat.averageMilestoneScore = stat.milestoneCount > 0 ? Math.round((stat.milestoneSum / stat.milestoneCount) * 10) / 10 : 0;
      stat.parentParticipationRate = stat.visitsCompleted > 0 ? Math.round((stat.parentPartCount / stat.visitsCompleted) * 100) : 0;
      delete stat.milestoneSum;
      delete stat.milestoneCount;
      delete stat.parentPartCount;
      return stat;
    });

    // Flagged children logic
    const childVisits = {};
    for (const v of visits) {
      const cName = v.childName || "Unknown Child";
      const cId = v.childId ? v.childId.toString() : `raw-${cName.toLowerCase().trim()}`;
      if (!childVisits[cId]) {
        childVisits[cId] = {
          childId: v.childId || null,
          childName: cName,
          fellowName: v.facilitatorId?.name || v.facilitatorNameRaw || "Assigned Fellow",
          visits: []
        };
      }
      childVisits[cId].visits.push(v);
    }

    const flaggedChildren = [];
    for (const cId of Object.keys(childVisits)) {
      const childInfo = childVisits[cId];
      const domainIssues = {};

      for (const v of childInfo.visits) {
        for (const act of v.activities || []) {
          const isIssue =
            !act.completed ||
            ["low", "needs support", "needs_support", "not interested", "not_interested", "poor"].includes(String(act.engagementLevel).toLowerCase().trim()) ||
            (act.milestoneStatus && act.milestoneStatus <= 1);

          if (isIssue) {
            const domains = act.domain || ["General"];
            for (const dom of domains) {
              if (!domainIssues[dom]) {
                domainIssues[dom] = new Set();
              }
              domainIssues[dom].add(new Date(v.visitDate).toDateString());
            }
          }
        }
      }

      for (const dom of Object.keys(domainIssues)) {
        if (domainIssues[dom].size >= 2) {
          flaggedChildren.push({
            childId: childInfo.childId,
            childName: childInfo.childName,
            fellowName: childInfo.fellowName,
            domain: dom,
            reason: `≥ 2 visits showing Low Engagement or Incomplete in domain: ${dom}`
          });
          break;
        }
      }
    }

    const domainDistribution = Object.keys(domainScores).map(d => ({
      domain: d,
      average: Math.round((domainScores[d].sum / domainScores[d].count) * 10) / 10,
      count: domainScores[d].count
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      kpis: {
        totalVisits,
        visitsCompleted: completedCount,
        centerVisitCompletion,
        centerAverageMilestoneScore,
        centerParentParticipationRate,
        flaggedChildrenCount: flaggedChildren.length,
        activeFellowsCount: fellowComparisonTable.length
      },
      fellowComparisonTable,
      flaggedChildren,
      domainDistribution
    });
  } catch (err) {
    next(err);
  }
});

// ── 4. Paginated & Filtered Visit Logs Endpoint ──
router.get("/visits", requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { search, program, status, fellowId, village, sortBy = "visitDate", sortOrder = "desc" } = req.query;

    const query = {};

    // Role-based scoping
    if (["fellow", "teacher"].includes(req.user.role)) {
      const userName = req.user.name || "";
      query.$or = [
        { facilitatorId: req.user.id },
        ...(userName ? [{ facilitatorNameRaw: { $regex: new RegExp(`^${escapeRegex(userName)}$`, "i") } }] : [])
      ];
    } else if (req.user.role === "mentor") {
      const mentor = await User.findById(req.user.id).lean();
      const assignedFellowIds = mentor?.mentorProfile?.assignedTeachers || [];
      const assignedUsers = await User.find({ _id: { $in: assignedFellowIds } }).select("name").lean();
      const names = assignedUsers.map(u => u.name).filter(Boolean);
      query.$or = [
        ...(assignedFellowIds.length > 0 ? [{ facilitatorId: { $in: assignedFellowIds } }] : []),
        ...(names.length > 0 ? [{ facilitatorNameRaw: { $in: names.map(n => new RegExp(`^${escapeRegex(n)}$`, "i")) } }] : [])
      ];
    } else if (fellowId) {
      const targetUser = await User.findById(fellowId).lean();
      const targetName = targetUser?.name || "";
      query.$or = [
        { facilitatorId: fellowId },
        ...(targetName ? [{ facilitatorNameRaw: { $regex: new RegExp(`^${escapeRegex(targetName)}$`, "i") } }] : [])
      ];
    }

    if (program && program !== "all") {
      query.program = { $regex: new RegExp(`^${escapeRegex(program)}$`, "i") };
    }

    if (village && village !== "all") {
      query.village = { $regex: new RegExp(`^${escapeRegex(village)}$`, "i") };
    }

    if (status === "completed") {
      query.childPresent = { $ne: false };
      query.caregiverAvailable = { $ne: false };
    } else if (status === "incomplete") {
      query.$or = [{ childPresent: false }, { caregiverAvailable: false }, { childWillingness: false }];
    } else if (status === "followup") {
      query.$or = [
        { isFollowUp: true },
        { homeActivitiesAssigned: true },
        { recommendedAction: { $exists: true, $ne: "" } }
      ];
    }

    if (search && search.trim()) {
      const sRegex = { $regex: new RegExp(escapeRegex(search.trim()), "i") };
      const searchCondition = {
        $or: [
          { childName: sRegex },
          { facilitatorNameRaw: sRegex },
          { village: sRegex },
          { program: sRegex },
          { remarks: sRegex },
          { "activities.activityName": sRegex }
        ]
      };
      if (query.$or) {
        query.$and = [{ $or: query.$or }, searchCondition];
        delete query.$or;
      } else {
        query.$and = [searchCondition];
      }
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === "asc" ? 1 : -1;

    const totalVisits = await VisitObservation.countDocuments(query);
    const visits = await VisitObservation.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("facilitatorId", "name email")
      .populate("childId", "fullName class center")
      .lean();

    const formattedVisits = visits.map(v => {
      const isCompleted = v.childPresent !== false && v.caregiverAvailable !== false;
      const acts = v.activities || [];
      const actNames = acts.map(a => a.activityName).filter(Boolean).join(", ");
      const engagement = acts.map(a => a.engagementLevel).filter(Boolean).join(", ") || (v.childParticipationRating ? `Rating: ${v.childParticipationRating}/5` : "Good");

      let milestoneDisplay = "N/A";
      const validScores = acts.map(a => a.milestoneStatus).filter(s => s !== undefined && s !== null && !isNaN(s) && s > 0);
      if (validScores.length > 0) {
        const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        milestoneDisplay = `${Math.round(avg * 10) / 10} / 5`;
      } else if (v.childParticipationRating) {
        milestoneDisplay = `${v.childParticipationRating} / 5`;
      }

      return {
        _id: v._id,
        visitDate: v.visitDate,
        childName: v.childName || "Unknown Child",
        childAge: v.ageGroup || "N/A",
        facilitatorName: v.facilitatorId?.name || v.facilitatorNameRaw || "Assigned Fellow",
        village: v.village || "N/A",
        program: v.program || "HAALS",
        activities: actNames || "Developmental Activity",
        activitiesList: acts,
        milestoneScoreDisplay: milestoneDisplay,
        engagementLevel: engagement,
        childPresent: v.childPresent,
        caregiverAvailable: v.caregiverAvailable,
        childWillingness: v.childWillingness,
        caregiverParticipated: v.caregiverParticipated,
        caregiverObserved: v.caregiverObserved,
        canRepeatAtHome: v.canRepeatAtHome,
        spaceAdequate: v.spaceAdequate,
        materialsAvailable: v.materialsAvailable || [],
        householdItemsUsable: v.householdItemsUsable,
        challenges: v.challenges || [],
        helpFactors: v.helpFactors || [],
        recommendedAction: v.recommendedAction || "",
        isFollowUp: v.isFollowUp,
        homeActivitiesAssigned: v.homeActivitiesAssigned,
        lastWeekDifficulties: v.lastWeekDifficulties || "",
        childParticipationRating: v.childParticipationRating,
        parentCooperationRating: v.parentCooperationRating,
        homeEnvironmentRating: v.homeEnvironmentRating,
        remarks: v.remarks || "",
        photos: v.photos || [],
        status: isCompleted ? "Completed" : "Incomplete"
      };
    });

    res.json({
      success: true,
      visits: formattedVisits,
      pagination: {
        totalVisits,
        page,
        limit,
        totalPages: Math.ceil(totalVisits / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── 5. Single Visit Details Endpoint ──
router.get("/visits/:id", requireAuth, async (req, res, next) => {
  try {
    const visit = await VisitObservation.findById(req.params.id)
      .populate("facilitatorId", "name email role")
      .populate("childId", "fullName class center")
      .lean();
    if (!visit) {
      return res.status(404).json({ success: false, message: "Visit observation not found." });
    }
    res.json({ success: true, visit });
  } catch (err) {
    next(err);
  }
});

// ── 6. AI Report Generation Stub (Section 7 Extension Point) ──
router.post("/reports/generate-stub", requireAuth, async (req, res, next) => {
  try {
    const { fellowId, month } = req.body;
    res.json({
      success: true,
      message: "AI Report generation is configured as an extension point (Section 7 stub). AI logic is not executed in this pass.",
      inputStub: { fellowId, month }
    });
  } catch (err) {
    next(err);
  }
});

// ── 7. Debug Stats for Ingestion Audit ──
router.get("/debug-stats", async (req, res, next) => {
  try {
    const expectedSecret = process.env.HAALS_SYNC_SECRET || "62088284c5af1efe970f1eb7789a2063b41814765e81f6fe6ff3c08307b40477";
    const clientSecret = req.query.secret || req.headers["x-sync-secret"];
    if (!clientSecret || clientSecret !== expectedSecret) {
      return res.status(401).json({ success: false, message: "Unauthorized debug check." });
    }

    const totalCount = await VisitObservation.countDocuments();
    const nullChildCount = await VisitObservation.countDocuments({ childId: null });
    const nullFacilitatorCount = await VisitObservation.countDocuments({ facilitatorId: null });

    const sanikaVisits = await VisitObservation.find({
      facilitatorNameRaw: { $regex: new RegExp(`^Sanika Prabhawale$`, "i") }
    }).select("visitDate childName childId facilitatorId").lean();

    const sanikaUser = await User.findOne({
      name: { $regex: new RegExp(`^Sanika Prabhawale$`, "i") }
    }).select("name role email status").lean();

    res.json({
      success: true,
      totalCount,
      childMatch: {
        matched: totalCount - nullChildCount,
        unmatched: nullChildCount,
        rate: totalCount > 0 ? `${Math.round(((totalCount - nullChildCount) / totalCount) * 100)}%` : "0%"
      },
      facilitatorMatch: {
        matched: totalCount - nullFacilitatorCount,
        unmatched: nullFacilitatorCount,
        rate: totalCount > 0 ? `${Math.round(((totalCount - nullFacilitatorCount) / totalCount) * 100)}%` : "0%"
      },
      sanikaDetails: {
        rawVisitsCount: sanikaVisits.length,
        userFound: sanikaUser ? {
          id: sanikaUser._id,
          name: sanikaUser.name,
          role: sanikaUser.role,
          status: sanikaUser.status
        } : null,
        visitsSample: sanikaVisits.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── Helper: Map Raw Row from Child Enrollment Google Form ──
function mapRawChildEnrollmentRowToSchema(row) {
  const normalizedRow = {};
  for (const key of Object.keys(row)) {
    // Preserve Devanagari and alphanumeric characters, strip punctuation and whitespace
    const normKey = String(key).toLowerCase().replace(/[\s_\-–—:/?!.,()[\]{}"'\\\/]/g, "");
    normalizedRow[normKey] = row[key];
  }

  function getVal(keysList, defaultValue = "") {
    for (const key of keysList) {
      const norm = String(key).toLowerCase().replace(/[\s_\-–—:/?!.,()[\]{}"'\\\/]/g, "");
      if (normalizedRow[norm] !== undefined && normalizedRow[norm] !== null && normalizedRow[norm] !== "") {
        return normalizedRow[norm];
      }
    }
    for (const key of keysList) {
      const norm = String(key).toLowerCase().replace(/[\s_\-–—:/?!.,()[\]{}"'\\\/]/g, "");
      if (norm.length >= 3) {
        for (const [rKey, rVal] of Object.entries(normalizedRow)) {
          if ((rKey.includes(norm) || norm.includes(rKey)) && rVal !== undefined && rVal !== null && rVal !== "") {
            return rVal;
          }
        }
      }
    }
    return defaultValue;
  }

  function getNum(keysList, defaultValue = undefined) {
    const val = getVal(keysList);
    if (!val) return defaultValue;
    const match = String(val).match(/\d+(\.\d+)?/);
    if (match) {
      const num = parseFloat(match[0]);
      return isNaN(num) ? defaultValue : num;
    }
    return defaultValue;
  }

  const fullName = String(getVal([
    "childsfullname", "childfullname", "childsname", "childname", "nameofchild",
    "nameofstudent", "studentname", "child", "mulachenaav", "mulachenav", "fullname", "name",
    "मुलाचेनाव", "मुलाचेपूर्णनाव", "बालकाचेनाव", "विद्यार्थ्याचेनाव"
  ])).trim();

  const rawAge = getNum(["childsage", "childage", "age", "vay", "ageinyears", "वय", "वर्ष"]);
  const ageGroup = getVal([
    "agegroup", "agebracket", "childsagegroup", "childagegroup", "agecategory", "वयोगट"
  ], rawAge ? `${rawAge} years` : "3-5 years");

  const rawGender = String(getVal(["gender", "sex", "ling", "लिंग"])).toLowerCase();
  let gender = "Male";
  if (rawGender.startsWith("f") || rawGender.includes("female") || rawGender.includes("स्त्री") || rawGender.includes("मुल्गी") || rawGender.includes("महिला")) {
    gender = "Female";
  } else if (rawGender.includes("other") || rawGender.includes("इतर")) {
    gender = "Other";
  }

  const village = getVal([
    "villagearea", "village", "area", "community", "center", "address",
    "location", "ward", "gaav", "gav", "wasti", "slum", "neighborhood",
    "गाव", "वस्ती", "परिसर", "गावकिंवापरिसर"
  ]);

  const program = getVal(["programenrolled", "program", "course", "project", "initiative", "प्रकल्प", "उपक्रम"], "HAALS");

  const guardianName = getVal([
    "parentsname", "parentname", "guardianname", "mothersname", "fathersname",
    "mothername", "fathername", "caregivername", "palkachenaav", "guardian",
    "पालकाचेनाव", "आईचेनाव", "वडिलांचेनाव"
  ]);

  const guardianPhone = String(getVal([
    "parentsphonenumber", "parentphone", "guardianphone", "contactnumber",
    "mobilenumber", "phone", "mobile", "phonenumber", "phoneno", "contact",
    "फोननंबर", "मोबाईल", "संपर्कनंबर"
  ])).trim();

  const guardianRelation = getVal([
    "guardianrelation", "relationwithchild", "relation", "caregiverrelation", "palkanchenate",
    "नाते", "पालकांचेनाते"
  ], "Mother");

  const address = getVal([
    "homeaddress", "address", "landmark", "residentialaddress", "locationaddress", "houseaddress",
    "पत्ता", "घरक्रमांक"
  ]);

  const notes = getVal([
    "notes", "remarks", "initialobservation", "baselinenotes", "comments", "additionalnotes", "developmentnotes",
    "शेरा", "नोंद"
  ]);

  const facilitatorNameRaw = getVal([
    "nameoffieldfacilitator", "facilitatorname", "teachername", "facilitator",
    "fieldfacilitator", "fellowname", "recordedby", "enrolledby", "fieldfellow",
    "कार्यकर्त्याचेनाव", "शिक्षकाचेनाव"
  ]);

  return {
    fullName,
    age: rawAge,
    ageGroup,
    gender,
    village,
    program: program || "HAALS",
    guardianName,
    guardianPhone,
    guardianRelation: guardianRelation || "Mother",
    address,
    notes,
    facilitatorNameRaw
  };
}

// ── 8. Child Enrollment for Home Visits ──

// POST /api/haals/children/sync - Webhook for Google Form Child Enrollment Sync
router.post("/children/sync", async (req, res, next) => {
  try {
    const expectedSecret = process.env.HAALS_SYNC_SECRET || "62088284c5af1efe970f1eb7789a2063b41814765e81f6fe6ff3c08307b40477";
    const clientSecret = req.headers["x-sync-secret"] || req.query.secret;
    if (!clientSecret || clientSecret !== expectedSecret) {
      return res.status(401).json({ success: false, message: "Unauthorized sync attempt." });
    }

    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, message: "Empty request payload." });
    }

    const rows = Array.isArray(payload) ? payload : [payload];
    if (rows.length === 0) {
      return res.json({ success: true, processedCount: 0, syncedCount: 0 });
    }

    const parsedRows = rows.map(mapRawChildEnrollmentRowToSchema).filter(r => r.fullName && r.fullName.length > 0);

    // Resolve facilitators in batch
    const facilitatorCache = new Map();
    for (const item of parsedRows) {
      let facilitatorId = null;
      let centerId = undefined;

      if (item.facilitatorNameRaw) {
        const rawName = item.facilitatorNameRaw.trim().toLowerCase();
        if (!facilitatorCache.has(rawName)) {
          const facilitator = await User.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(item.facilitatorNameRaw.trim())}$`, "i") },
            role: { $in: ["fellow", "teacher", "admin", "mentor"] }
          }).lean();
          facilitatorCache.set(rawName, facilitator || null);
        }
        const cached = facilitatorCache.get(rawName);
        if (cached) {
          facilitatorId = cached._id;
          centerId = cached.teacherProfile?.center;
        }
      }

      item.assignedFellow = facilitatorId;
      item.center = centerId;
    }

    const bulkOps = parsedRows.map(doc => ({
      updateOne: {
        filter: {
          fullName: doc.fullName,
          ...(doc.village ? { village: doc.village } : {})
        },
        update: {
          $set: {
            fullName: doc.fullName,
            age: doc.age,
            ageGroup: doc.ageGroup,
            gender: doc.gender,
            village: doc.village,
            program: doc.program,
            guardianName: doc.guardianName,
            guardianPhone: doc.guardianPhone,
            guardianRelation: doc.guardianRelation,
            address: doc.address,
            notes: doc.notes,
            enrollmentType: "home_visit",
            status: "active",
            ...(doc.assignedFellow ? { assignedFellow: doc.assignedFellow } : {}),
            ...(doc.center ? { center: doc.center } : {})
          }
        },
        upsert: true
      }
    }));

    const bulkRes = await Child.bulkWrite(bulkOps, { ordered: false });

    res.json({
      success: true,
      processedCount: rows.length,
      syncedCount: parsedRows.length,
      upsertedCount: bulkRes.upsertedCount || 0,
      modifiedCount: bulkRes.modifiedCount || 0,
      matchedCount: bulkRes.matchedCount || 0
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/haals/children - In-portal direct child enrollment
router.post("/children", requireAuth, async (req, res, next) => {
  try {
    const {
      fullName,
      age,
      ageGroup,
      gender,
      village,
      program = "HAALS",
      guardianName,
      guardianPhone,
      guardianRelation = "Mother",
      address,
      notes,
      fellowId
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: "Child's full name is required." });
    }

    // Determine assigned fellow
    let assignedFellow = req.user.id;
    if (["admin", "mentor", "super_admin"].includes(req.user.role) && fellowId) {
      assignedFellow = fellowId;
    }

    // Get fellow's profile center if available
    const fellowUser = await User.findById(assignedFellow).lean();
    const centerId = fellowUser?.teacherProfile?.center || undefined;

    const newChild = await Child.create({
      fullName: fullName.trim(),
      age: age ? Number(age) : undefined,
      ageGroup: ageGroup ? ageGroup.trim() : (age ? `${age} years` : "3-5 years"),
      gender: gender || "",
      village: village ? village.trim() : "",
      program: program ? program.trim() : "HAALS",
      guardianName: guardianName ? guardianName.trim() : "",
      guardianPhone: guardianPhone ? guardianPhone.trim() : "",
      guardianRelation: guardianRelation || "Mother",
      address: address ? address.trim() : "",
      notes: notes ? notes.trim() : "",
      enrollmentType: "home_visit",
      assignedFellow,
      center: centerId,
      status: "active",
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Child successfully enrolled for Home Visits!",
      child: newChild
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/haals/children - List enrolled children with visit counts and history status
router.get("/children", requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const program = req.query.program ? String(req.query.program).trim() : "";
    const fellowId = req.query.fellowId ? String(req.query.fellowId).trim() : "";

    const filter = { status: "active" };

    // Role-based scoping
    if (["fellow", "teacher"].includes(req.user.role)) {
      const fellowUser = await User.findById(req.user.id).lean();
      const fellowCenter = fellowUser?.teacherProfile?.center;

      filter.$or = [
        { assignedFellow: req.user.id },
        { createdBy: req.user.id },
        { assignedFellow: null },
        { assignedFellow: { $exists: false } },
        ...(fellowCenter ? [{ center: fellowCenter }] : [])
      ];
    } else if (fellowId && ["admin", "mentor", "super_admin"].includes(req.user.role)) {
      filter.$or = [
        { assignedFellow: fellowId },
        { createdBy: fellowId }
      ];
    }

    if (program && program !== "all") {
      filter.program = { $regex: new RegExp(`^${escapeRegex(program)}$`, "i") };
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { fullName: searchRegex },
          { village: searchRegex },
          { guardianName: searchRegex },
          { guardianPhone: searchRegex },
          { program: searchRegex }
        ]
      });
    }

    const totalChildren = await Child.countDocuments(filter);
    const childrenDocs = await Child.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("assignedFellow", "name email phone")
      .lean();

    // Enrich each child with real-time visit count and last visit date
    const enrichedChildren = await Promise.all(
      childrenDocs.map(async (child) => {
        const childNameRegex = new RegExp(`^${escapeRegex(child.fullName)}$`, "i");
        const visitQuery = {
          $or: [
            { childId: child._id },
            { childName: { $regex: childNameRegex } }
          ]
        };

        const totalVisits = await VisitObservation.countDocuments(visitQuery);
        const lastVisit = await VisitObservation.findOne(visitQuery)
          .sort({ visitDate: -1 })
          .select("visitDate activities childParticipationRating")
          .lean();

        return {
          ...child,
          totalVisits,
          lastVisitDate: lastVisit ? lastVisit.visitDate : null,
          lastScore: lastVisit?.activities?.[0]?.milestoneStatus || lastVisit?.childParticipationRating || null
        };
      })
    );

    res.json({
      success: true,
      children: enrichedChildren,
      pagination: {
        totalChildren,
        totalPages: Math.ceil(totalChildren / limit) || 1,
        page,
        limit
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/haals/children/:id - Update an enrolled child
router.put("/children/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.createdBy;

    const updatedChild = await Child.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    if (!updatedChild) {
      return res.status(404).json({ success: false, message: "Child not found." });
    }

    res.json({
      success: true,
      message: "Child details updated successfully.",
      child: updatedChild
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/haals/children/:id - Archive / delete enrolled child
router.delete("/children/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const child = await Child.findByIdAndUpdate(id, { $set: { status: "inactive" } }, { new: true });
    if (!child) {
      return res.status(404).json({ success: false, message: "Child not found." });
    }

    res.json({
      success: true,
      message: "Child removed from active enrollment."
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/haals/quick-visit - Record a direct Home Visit observation from portal
router.post("/quick-visit", requireAuth, async (req, res, next) => {
  try {
    const {
      childId,
      childName,
      visitDate = new Date(),
      village,
      program = "HAALS",
      ageGroup,
      activityName,
      domain = ["Cognitive"],
      milestoneStatus = 4,
      engagementLevel = "Highly Engaged",
      caregiverObserved = true,
      caregiverParticipated = true,
      childPresent = true,
      caregiverAvailable = true,
      spaceAdequate = true,
      materialsAvailable = ["Household items", "Flashcards"],
      challenges = [],
      helpFactors = [],
      recommendedAction = "Continue home activities",
      remarks = ""
    } = req.body;

    if (!childName && !childId) {
      return res.status(400).json({ success: false, message: "Child name or ID is required." });
    }

    let finalChildName = childName;
    let resolvedChildId = childId || null;

    if (childId && !finalChildName) {
      const childDoc = await Child.findById(childId).lean();
      if (childDoc) {
        finalChildName = childDoc.fullName;
        resolvedChildId = childDoc._id;
      }
    }

    const newVisit = await VisitObservation.create({
      visitDate: new Date(visitDate),
      facilitatorId: req.user.id,
      facilitatorNameRaw: req.user.name || "Facilitator",
      childId: resolvedChildId,
      childName: finalChildName,
      ageGroup: ageGroup || "3-5 years",
      program: program || "HAALS",
      village: village || "",
      childPresent: Boolean(childPresent),
      caregiverAvailable: Boolean(caregiverAvailable),
      childWillingness: true,
      spaceAdequate: Boolean(spaceAdequate),
      materialsAvailable: Array.isArray(materialsAvailable) ? materialsAvailable : [materialsAvailable],
      householdItemsUsable: true,
      activities: [
        {
          activityName: activityName || "Structured Home Developmental Activity",
          milestoneSource: "HAALS Framework",
          domain: Array.isArray(domain) ? domain : [domain],
          engagementLevel: engagementLevel || "Highly Engaged",
          attempted: true,
          completed: true,
          supportNeeded: false,
          milestoneStatus: Number(milestoneStatus) || 4
        }
      ],
      caregiverObserved: Boolean(caregiverObserved),
      caregiverParticipated: Boolean(caregiverParticipated),
      canRepeatAtHome: true,
      helpFactors: Array.isArray(helpFactors) ? helpFactors : (helpFactors ? [helpFactors] : []),
      challenges: Array.isArray(challenges) ? challenges : (challenges ? [challenges] : []),
      isFollowUp: false,
      recommendedAction: recommendedAction || "Continue home activities",
      childParticipationRating: Number(milestoneStatus) || 4,
      parentCooperationRating: caregiverParticipated ? 5 : 4,
      homeEnvironmentRating: 4,
      remarks: remarks || "Logged directly from portal."
    });

    res.status(201).json({
      success: true,
      message: "Home Visit Observation logged successfully!",
      visit: newVisit
    });
  } catch (err) {
    next(err);
  }
});

export default router;

