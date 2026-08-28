import express from "express";
import { VisitObservation } from "../models/VisitObservation.js";
import { User } from "../models/User.js";
import { Child } from "../models/Child.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

// Helper to escape regex special characters
function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// ── Webhook Row Parser ──
function mapRawRowToSchema(row) {
  const normalizedRow = {};
  for (const key of Object.keys(row)) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    normalizedRow[normKey] = row[key];
  }

  function getVal(keysList, defaultValue = undefined) {
    for (const key of keysList) {
      const norm = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normalizedRow[norm] !== undefined) {
        return normalizedRow[norm];
      }
    }
    return defaultValue;
  }

  function getBool(keysList, defaultValue = false) {
    const val = getVal(keysList);
    if (val === undefined || val === null) return defaultValue;
    if (typeof val === "boolean") return val;
    const str = String(val).toLowerCase().trim();
    return str === "yes" || str === "true" || str === "1" || str === "y";
  }

  function getNum(keysList, defaultValue = undefined) {
    const val = getVal(keysList);
    if (val === undefined || val === null) return defaultValue;
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  }

  function getArray(keysList) {
    const val = getVal(keysList);
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      return val.split(/[;,]/).map(s => s.trim()).filter(Boolean);
    }
    return [String(val)];
  }

  const rawDate = getVal(["visitdate", "dateofvisit", "timestamp", "date"]);
  const visitDate = rawDate ? new Date(rawDate) : new Date();

  const facilitatorNameRaw = getVal(["nameoffieldfacilitator", "facilitatorname", "facilitator", "fieldfacilitatorname", "fieldfacilitator"], "");
  const village = getVal(["villagearea", "village", "area", "address"], "");
  const childName = getVal(["childsname", "childname", "child"], "");
  const ageGroup = getVal(["childsage", "agegroup", "age"], "");
  const program = getVal(["programenrolled", "program"], "");

  const childPresent = getBool(["ischildpresent", "childpresent", "childpresent?"], true);
  const caregiverAvailable = getBool(["iscaregiveravailable", "caregiveravailable", "caregiveravailable?"], true);
  const childWillingness = getBool(["ischildwillingtoparticipate", "childwillingtoparticipate", "childwillingness", "childwilling?"], true);

  const spaceAdequate = getBool(["spaceadequacy", "spaceadequate", "isspaceadequate?"], undefined);
  const materialsAvailable = getArray(["materialsavailable", "materialsavailable?", "materials"]);
  const householdItemsUsable = getBool(["householditemssubstitutefortoys", "householditemsusable", "arehouseholditemsusable?"], undefined);

  const caregiverObserved = getBool(["didthecaregiverobserve", "caregiverobserved", "caregiverobserved?"], undefined);
  const caregiverParticipated = getBool(["didthecaregiverparticipate", "caregiverparticipated", "caregiverparticipated?"], undefined);
  const canRepeatAtHome = getBool(["cantheyrepeatitathome", "canrepeatathome", "canrepeat?"], undefined);
  const helpFactors = getArray(["whathelped", "helpfactors"]);
  const challenges = getArray(["whatchallengescameup", "challenges"]);
  const isFollowUp = getBool(["followuponlastweeksactivity", "isfollowup", "followup?"], undefined);
  const didLastWeekActivity = getBool(["didtheydolastweeksactivity", "didlastweekactivity", "didlastweekactivity?"], undefined);
  const lastWeekCompletionCount = getNum(["lastweekcompletioncount", "howmanytimescompleted", "completioncount"]);
  const lastWeekDifficulties = getVal(["lastweekdifficulties", "difficultieslastweek"], "");
  const homeActivitiesAssigned = getBool(["homeactivitiesassigned", "activitiesassigned"], undefined);

  const recommendedAction = getVal(["recommendednextaction", "recommendedaction", "nextaction"], "");

  const childParticipationRating = getNum(["childparticipationrating", "childparticipation", "ratingchildparticipation"]);
  const parentCooperationRating = getNum(["parentcooperationrating", "parentcooperation", "ratingparentcooperation"]);
  const homeEnvironmentRating = getNum(["homeenvironmentrating", "homeenvironment", "ratinghomeenvironment"]);
  const remarks = getVal(["facilitatorremarks", "remarks", "additionalremarks", "notes"], "");
  const photos = getArray(["photos", "evidencephotos", "photourls"]);

  const activities = [];
  
  const act1Name = getVal(["nameoftheactivity1", "activityname1", "activity1name", "activity1"]);
  if (act1Name) {
    activities.push({
      activityName: act1Name,
      milestoneSource: getVal(["milestonesource1", "activity1milestonesource"], ""),
      domain: getArray(["domain1", "activity1domain", "domain"]),
      engagementLevel: getVal(["engagementlevel1", "activity1engagementlevel", "engagement1"], ""),
      attempted: getBool(["attempted1", "activity1attempted"], true),
      completed: getBool(["completed1", "activity1completed"], false),
      supportNeeded: getBool(["supportneeded1", "activity1supportneeded"], false),
      milestoneStatus: getNum(["milestonestatus1", "milestonescore1", "activity1milestonescore", "milestone1"])
    });
  }

  const act2Name = getVal(["nameoftheactivity2", "activityname2", "activity2name", "activity2"]);
  if (act2Name) {
    activities.push({
      activityName: act2Name,
      milestoneSource: getVal(["milestonesource2", "activity2milestonesource"], ""),
      domain: getArray(["domain2", "activity2domain"]),
      engagementLevel: getVal(["engagementlevel2", "activity2engagementlevel", "engagement2"], ""),
      attempted: getBool(["attempted2", "activity2attempted"], true),
      completed: getBool(["completed2", "activity2completed"], false),
      supportNeeded: getBool(["supportneeded2", "activity2supportneeded"], false),
      milestoneStatus: getNum(["milestonestatus2", "milestonescore2", "activity2milestonescore", "milestone2"])
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
    caregiverObserved,
    caregiverParticipated,
    canRepeatAtHome,
    helpFactors,
    challenges,
    isFollowUp,
    didLastWeekActivity,
    lastWeekCompletionCount,
    lastWeekDifficulties,
    homeActivitiesAssigned,
    recommendedAction,
    childParticipationRating,
    parentCooperationRating,
    homeEnvironmentRating,
    remarks,
    photos
  };
}

async function findAndAssignIds(parsedData) {
  let facilitatorId = null;
  let childId = null;

  if (parsedData.facilitatorNameRaw) {
    const rawName = parsedData.facilitatorNameRaw.trim();
    const facilitator = await User.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(rawName)}$`, "i") },
      role: { $in: ["fellow", "teacher"] }
    });
    if (facilitator) {
      facilitatorId = facilitator._id;
    }
  }

  if (parsedData.childName) {
    const rawChildName = parsedData.childName.trim();
    if (facilitatorId) {
      const facilitator = await User.findById(facilitatorId).lean();
      const centerId = facilitator.teacherProfile?.center;
      const classIds = facilitator.teacherProfile?.classes || [];
      
      let child = null;
      if (classIds.length > 0) {
        child = await Child.findOne({
          fullName: { $regex: new RegExp(`^${escapeRegex(rawChildName)}$`, "i") },
          class: { $in: classIds }
        });
      }
      if (!child && centerId) {
        child = await Child.findOne({
          fullName: { $regex: new RegExp(`^${escapeRegex(rawChildName)}$`, "i") },
          center: centerId
        });
      }
      if (child) {
        childId = child._id;
      }
    }

    if (!childId) {
      const child = await Child.findOne({
        fullName: { $regex: new RegExp(`^${escapeRegex(rawChildName)}$`, "i") }
      });
      if (child) {
        childId = child._id;
      }
    }
  }

  return { facilitatorId, childId };
}

// ── 1. Webhook Sync / Backfill Endpoint ──
// Accepts a single row object or an array of row objects
router.post("/visits", async (req, res, next) => {
  try {
    // Secret sync token check (mandatory)
    const expectedSecret = process.env.HAALS_SYNC_SECRET || "spaceece_haals_sync_secret_token_2026";
    const clientSecret = req.headers["x-sync-secret"] || req.query.secret;
    if (!clientSecret || clientSecret !== expectedSecret) {
      return res.status(401).json({ success: false, message: "Unauthorized sync attempt." });
    }

    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, message: "Empty request payload." });
    }

    const rows = Array.isArray(payload) ? payload : [payload];
    const results = [];

    for (const row of rows) {
      const parsedData = mapRawRowToSchema(row);
      const { facilitatorId, childId } = await findAndAssignIds(parsedData);
      
      const query = {
        visitDate: parsedData.visitDate,
        childName: parsedData.childName,
        facilitatorNameRaw: parsedData.facilitatorNameRaw
      };

      const updatedDoc = await VisitObservation.findOneAndUpdate(
        query,
        { ...parsedData, facilitatorId, childId },
        { upsert: true, new: true }
      );
      results.push(updatedDoc);
    }

    res.json({
      success: true,
      processedCount: rows.length,
      syncedCount: results.length,
      sample: results.slice(0, 5)
    });
  } catch (err) {
    next(err);
  }
});

// ── 2. Fellow Dashboard Metrics ──
router.get("/fellow/metrics", requireAuth, async (req, res, next) => {
  try {
    let fellowId = req.user.id;
    
    // Mentor/Admin can view specific fellow metrics
    if (["admin", "mentor", "super_admin"].includes(req.user.role) && req.query.fellowId) {
      fellowId = req.query.fellowId;
    } else if (!["fellow", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access Denied. Fellow role required." });
    }

    const visits = await VisitObservation.find({ facilitatorId: fellowId })
      .sort({ visitDate: -1 })
      .lean();

    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => v.childPresent && v.caregiverAvailable && v.childWillingness);
    const completedCount = completedVisits.length;
    const completionRate = totalVisits > 0 ? Math.round((completedCount / totalVisits) * 100) : 0;

    // Calculate average milestone and domain metrics
    let totalMilestoneSum = 0;
    let milestoneCount = 0;
    const domainScores = {};

    completedVisits.forEach(v => {
      v.activities.forEach(act => {
        if (act.milestoneStatus !== undefined && act.milestoneStatus !== null) {
          const score = act.milestoneStatus;
          totalMilestoneSum += score;
          milestoneCount++;

          const domains = act.domain && act.domain.length > 0 ? act.domain : ["General"];
          domains.forEach(d => {
            if (!domainScores[d]) {
              domainScores[d] = { sum: 0, count: 0 };
            }
            domainScores[d].sum += score;
            domainScores[d].count++;
          });
        }
      });
    });

    const averageMilestoneScore = milestoneCount > 0 ? Math.round((totalMilestoneSum / milestoneCount) * 10) / 10 : 0;

    const milestoneByDomain = Object.keys(domainScores).map(d => ({
      domain: d,
      average: Math.round((domainScores[d].sum / domainScores[d].count) * 10) / 10,
      count: domainScores[d].count
    }));

    const visitsWithParentParticipation = completedVisits.filter(v => v.caregiverParticipated);
    const parentParticipationRate = completedCount > 0 ? Math.round((visitsWithParentParticipation.length / completedCount) * 100) : 0;

    const followUpsPending = completedVisits.filter(v => {
      const action = String(v.recommendedAction || "").trim().toLowerCase();
      return action && action !== "none" && action !== "no action" && action !== "no_action";
    }).length;

    const challengeCounts = {};
    completedVisits.forEach(v => {
      (v.challenges || []).forEach(ch => {
        if (ch) {
          challengeCounts[ch] = (challengeCounts[ch] || 0) + 1;
        }
      });
    });

    const commonChallenges = Object.keys(challengeCounts)
      .map(ch => ({ challenge: ch, count: challengeCounts[ch] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentVisits = visits.slice(0, 10).map(v => ({
      _id: v._id,
      childName: v.childName,
      visitDate: v.visitDate,
      activities: v.activities.map(a => a.activityName).join(", ") || "No activities logged",
      engagementLevel: v.activities.map(a => a.engagementLevel).filter(Boolean).join(", ") || "N/A",
      status: (v.childPresent && v.caregiverAvailable && v.childWillingness) ? "Completed" : "Incomplete",
      remarks: v.remarks
    }));

    res.json({
      success: true,
      kpis: {
        visitsCompleted: completedCount,
        visitsScheduled: totalVisits,
        completionRate,
        averageMilestoneScore,
        parentParticipationRate,
        followUpsPending
      },
      milestoneByDomain,
      recentVisits,
      commonChallenges
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
    if (req.user.role === "mentor") {
      const mentor = await User.findById(req.user.id).lean();
      fellowIds = mentor?.mentorProfile?.assignedTeachers || [];
    } else {
      // Admins see all fellows in active center, or all fellows globally
      const fellows = await User.find({ role: { $in: ["fellow", "teacher"] } }).select("_id").lean();
      fellowIds = fellows.map(f => f._id);
    }

    const visits = await VisitObservation.find({ facilitatorId: { $in: fellowIds } })
      .sort({ visitDate: -1 })
      .populate("facilitatorId", "name email")
      .lean();

    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => v.childPresent && v.caregiverAvailable && v.childWillingness);
    const completedCount = completedVisits.length;
    const centerVisitCompletion = totalVisits > 0 ? Math.round((completedCount / totalVisits) * 100) : 0;

    let totalMilestoneSum = 0;
    let milestoneCount = 0;
    completedVisits.forEach(v => {
      v.activities.forEach(act => {
        if (act.milestoneStatus !== undefined && act.milestoneStatus !== null) {
          totalMilestoneSum += act.milestoneStatus;
          milestoneCount++;
        }
      });
    });
    const centerAverageMilestoneScore = milestoneCount > 0 ? Math.round((totalMilestoneSum / milestoneCount) * 10) / 10 : 0;

    // Per-fellow comparison table
    const fellowStats = {};
    for (const fId of fellowIds) {
      const fUser = await User.findById(fId).lean();
      if (fUser) {
        fellowStats[fId.toString()] = {
          fellowId: fId.toString(),
          name: fUser.name,
          email: fUser.email,
          visitsScheduled: 0,
          visitsCompleted: 0,
          completionRate: 0,
          averageMilestoneScore: 0,
          milestoneSum: 0,
          milestoneCount: 0
        };
      }
    }

    for (const v of visits) {
      const fid = v.facilitatorId?._id?.toString() || v.facilitatorId?.toString();
      if (fid && fellowStats[fid]) {
        const stat = fellowStats[fid];
        stat.visitsScheduled++;
        const isCompleted = v.childPresent && v.caregiverAvailable && v.childWillingness;
        if (isCompleted) {
          stat.visitsCompleted++;
          v.activities.forEach(act => {
            if (act.milestoneStatus !== undefined && act.milestoneStatus !== null) {
              stat.milestoneSum += act.milestoneStatus;
              stat.milestoneCount++;
            }
          });
        }
      }
    }

    const fellowComparisonTable = Object.values(fellowStats).map(stat => {
      stat.completionRate = stat.visitsScheduled > 0 ? Math.round((stat.visitsCompleted / stat.visitsScheduled) * 100) : 0;
      stat.averageMilestoneScore = stat.milestoneCount > 0 ? Math.round((stat.milestoneSum / stat.milestoneCount) * 10) / 10 : 0;
      delete stat.milestoneSum;
      delete stat.milestoneCount;
      return stat;
    });

    // Flagged children logic
    const childVisits = {};
    for (const v of visits) {
      const cName = v.childName || "Unknown Child";
      const cId = v.childId ? v.childId.toString() : `raw-${cName}`;
      if (!childVisits[cId]) {
        childVisits[cId] = {
          childId: v.childId || null,
          childName: cName,
          fellowName: v.facilitatorId?.name || v.facilitatorNameRaw || "Unknown Fellow",
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
          const isIssue = !act.completed || 
                          ["low", "needs support", "needs_support", "not interested", "not_interested", "poor"].includes(String(act.engagementLevel).toLowerCase().trim()) ||
                          act.milestoneStatus <= 1;
          
          if (isIssue) {
            const domains = act.domain || ["General"];
            for (const dom of domains) {
              if (!domainIssues[dom]) {
                domainIssues[dom] = new Set();
              }
              domainIssues[dom].add(v.visitDate.toDateString());
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
            reason: `≥ 2 visits showing Low Engagement or Not Completed in domain: ${dom}`
          });
          break;
        }
      }
    }

    res.json({
      success: true,
      kpis: {
        centerVisitCompletion,
        centerAverageMilestoneScore,
        flaggedChildrenCount: flaggedChildren.length
      },
      fellowComparisonTable,
      flaggedChildren
    });
  } catch (err) {
    next(err);
  }
});

// ── 4. AI Report Generation Stub (Section 7 Extension Point) ──
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

// ── 5. Debug Stats for Ingestion Audit ──
router.get("/debug-stats", async (req, res, next) => {
  try {
    const expectedSecret = process.env.HAALS_SYNC_SECRET || "spaceece_haals_sync_secret_token_2026";
    const clientSecret = req.query.secret || req.headers["x-sync-secret"];
    if (!clientSecret || clientSecret !== expectedSecret) {
      return res.status(401).json({ success: false, message: "Unauthorized debug check." });
    }

    const totalCount = await VisitObservation.countDocuments();
    const nullChildCount = await VisitObservation.countDocuments({ childId: null });
    const nullFacilitatorCount = await VisitObservation.countDocuments({ facilitatorId: null });

    // Look for Sanika Prabhawale
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

export default router;
