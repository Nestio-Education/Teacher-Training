import xlsx from "xlsx";
import crypto from "crypto";
import mongoose from "mongoose";
import ActivityBank from "../models/ActivityBank.js";
import { normalizeLevel, getClassInfoByLevel } from "../config/classLevelConfig.js";

const cleanText = (value) => String(value || "").trim().replace(/\s+/g, " ");

const getValue = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }
  return "";
};

const parseDayNumber = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

export const importActivitiesFromExcel = async (filePath, userId = null) => {
  const workbook = xlsx.readFile(filePath);
  const importBatchId = crypto.randomUUID();
  const allActivities = [];

  const targetHeaders = [
    "activity name", "activity", "task", "topic", "milestone", 
    "how to conduct", "materials required", "learning objectives", 
    "expected learning outcomes", "expected output", "developmental domain",
    "purpose of activity", "no.", "day", "class name", "level"
  ];

  // Find target sheet based on keywords
  let sheetName = workbook.SheetNames.find(name => {
    const n = name.toLowerCase();
    return n.includes("physical") && n.includes("level 1");
  });

  if (!sheetName) {
    sheetName = workbook.SheetNames.find(name => {
      const n = name.toLowerCase();
      return n.includes("aesthetic") && n.includes("level 2");
    });
  }

  if (!sheetName) {
    sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes("aesthetic"));
  }

  if (!sheetName) {
    sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes("physical"));
  }

  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
  }

  console.log(`==> Importing single sheet: ${sheetName}`);
  const sheet = workbook.Sheets[sheetName];
  const rowsAOA = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (!rowsAOA || rowsAOA.length === 0) {
    throw new Error(`Sheet ${sheetName} is empty.`);
  }

  let headerRowIndex = 0;
  let foundHeader = false;
  for (let i = 0; i < Math.min(rowsAOA.length, 10); i++) {
    const row = rowsAOA[i];
    if (Array.isArray(row)) {
      const matches = row.filter(cell => {
        const val = String(cell || "").toLowerCase().trim();
        if (!val) return false;
        return targetHeaders.some(h => val.includes(h) || h.includes(val));
      }).length;
      
      if (matches >= 2) {
        headerRowIndex = i;
        foundHeader = true;
        break;
      }
    }
  }

  if (!foundHeader) {
    throw new Error(`Could not find header row in sheet ${sheetName}`);
  }

  const headers = rowsAOA[headerRowIndex].map(h => String(h || "").trim());
  const dataRows = rowsAOA.slice(headerRowIndex + 1);
  const rows = dataRows.map((r) => {
    const obj = {};
    headers.forEach((h, colIndex) => {
      if (h) {
        obj[h] = r[colIndex] !== undefined ? r[colIndex] : "";
      }
    });
    return obj;
  }).filter(obj => Object.values(obj).some(val => String(val).trim() !== ""));

  const activities = rows.map((row, index) => {
    const rawKeys = Object.keys(row);

    const dayNumber = parseDayNumber(
      getValue(row, ["Day", "Day Number", "Day No", "Day #", "DayNo", "Day_Number", "Lesson Day", "Schedule Day"])
    );

    const activityName = getValue(row, [
      "Activity Name", "Task", "Task Name", "Topic", "Lesson",
      "Lesson Title", "Day Title", "Title", "Description", "Activity"
    ]) || (dayNumber ? `Day ${dayNumber} - Activity` : `Activity ${index + 1}`);

    const level = normalizeLevel(getValue(row, ["Level", "Class Name", "Class", "Grade"]) || "General");
    const className = getValue(row, ["Class Name", "Class", "Grade", "Section"]) || "General";

    const learningObjectives = cleanText(getValue(row, [
      "Learning Objectives", "Objective", "Objectives", "Learning Objective",
      "Goal", "Goals", "Learning Goals"
    ]));

    const activitiesVal = cleanText(getValue(row, [
      "Activities", "Activity Plan", "Planned Activities", "Class Activities",
      "Student Activities", "What to Do", "Plan"
    ]));

    const resources = cleanText(getValue(row, [
      "Resources", "Materials", "Materials Required", "Teaching Materials",
      "Resources Required", "Supplies", "Equipment"
    ]));

    const instructions = cleanText(getValue(row, [
      "Instructions", "How to Conduct", "How to Conduct (Detailed)",
      "Teaching Instructions", "Procedure", "Steps", "Method",
      "Detailed Instructions", "Teaching Method"
    ]));

    const expectedOutput = cleanText(getValue(row, [
      "Expected Output", "Expected Learning Outcomes", "Expected Outcomes",
      "Learning Outcomes", "Outcomes", "Expected Result", "Success Criteria"
    ]));

    const notes = cleanText(getValue(row, [
      "Notes", "Additional Notes", "Description", "Remarks",
      "Additional Description", "Comments", "Extra Info", "Note"
    ]));

    const duration = cleanText(getValue(row, ["Duration", "Time", "Time Duration", "Period"]));
    const ageGroup = cleanText(getValue(row, ["Age Group", "Age", "Age Range"]));
    const facilitatorRole = cleanText(getValue(row, ["Facilitator's Role", "Facilitator Role", "Teacher Role", "Role"]));
    const milestone = cleanText(getValue(row, ["Milestone", "Milestones"]));
    const developmentalDomain = cleanText(getValue(row, ["Developmental Domain", "Domain", "Type", "Category"]));

    const howToConduct = instructions || cleanText(getValue(row, [
      "How to Conduct", "How to Conduct (Detailed)", "Procedure"
    ]));

    const purposeOfActivity = cleanText(getValue(row, [
      "Purpose of Activity", "Purpose", "Goal", "Objective"
    ])) || learningObjectives;

    const materialsRequired = resources || cleanText(getValue(row, [
      "Materials Required", "Materials", "Supplies"
    ]));

    const expectedLearningOutcomes = expectedOutput || cleanText(getValue(row, [
      "Expected Learning Outcomes", "Learning Outcomes", "Outcomes"
    ]));

    return {
      activityId: `ACT-${level.replace(/\s+/g, "")}-${String(index + 1).padStart(4, "0")}-${Date.now().toString().slice(-4)}-${sheetName.substring(0,3).toUpperCase()}`,
      sourceRowNumber: index + 2,
      milestone,
      activityName: cleanText(activityName),
      duration: duration || "30 min",
      materialsRequired,
      developmentalDomain: developmentalDomain || "General",
      purposeOfActivity,
      howToConduct,
      facilitatorRole,
      expectedLearningOutcomes,
      level,
      type: developmentalDomain || "General",
      className: cleanText(className),
      ageGroup,
      dayNumber,
      learningObjectives: learningObjectives || purposeOfActivity,
      activities: activitiesVal || activityName,
      resources: resources || materialsRequired,
      instructions: instructions || howToConduct,
      expectedOutput: expectedOutput || expectedLearningOutcomes,
      notes,
      status: "Active",
      importBatchId,
      createdBy: (userId && mongoose.Types.ObjectId.isValid(userId)) ? new mongoose.Types.ObjectId(userId) : undefined
    };
  }).filter((activity) => activity.activityName);

  if (activities.length === 0) {
    throw new Error("No valid activities found in the Excel file.");
  }

  // Get existing activity names for this user (e.g. completed ones we kept) to avoid duplicating them
  const existingActivities = await ActivityBank.find({ createdBy: userId }).lean();
  const existingNames = new Set(existingActivities.map(a => a.activityName.toLowerCase().trim()));

  const uniqueNewActivities = activities.filter(a => !existingNames.has(a.activityName.toLowerCase().trim()));

  if (uniqueNewActivities.length) {
    const insertRes = await ActivityBank.insertMany(uniqueNewActivities);
    console.log("INSERT RES:", insertRes.length);
  }

  const summary = await ActivityBank.aggregate([
    { $group: { _id: { className: "$className", level: "$level", type: "$type" }, count: { $sum: 1 } } },
    { $sort: { "_id.className": 1, "_id.level": 1, "_id.type": 1 } }
  ]);

  return {
    imported: uniqueNewActivities.length,
    importBatchId,
    sheetName,
    summary
  };
};

export default importActivitiesFromExcel;
