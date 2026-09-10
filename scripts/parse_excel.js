import * as XLSX from "xlsx";
import * as fs from "fs";

const SOURCES = [
  "src/pages/docx-source/FLN_English_Lesson_Plan_Month1-6.xlsx",
  "src/pages/docx-source/FLN_Remedial_Lesson_Plan_Month1-6-2.xlsx",
  "src/pages/docx-source/FLN_Library_Lesson_Plan_Month1-6-2.xlsx",
];

const bank = [];
const stats = {
  "FLN": 0,
  "Remedial": 0,
  "Library": 0,
  "skipped": 0
};

// Use a Set to dedupe by planCode
const seenPlanCodes = new Set();

for (const filepath of SOURCES) {
  if (!fs.existsSync(filepath)) {
    console.warn(`File not found: ${filepath}`);
    continue;
  }
  const buffer = fs.readFileSync(filepath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  let fileCount = 0;

  for (const row of data) {
    const planCode = row["Plan Code"];
    if (!planCode) continue;

    if (seenPlanCodes.has(planCode)) continue;

    // Support e.g. FLN-ENG-M1-W1-A01 or -M1-S1-A01
    const match = planCode.match(/-M(\d+)-([A-Z])(\d+)-A(\d+)/);
    if (!match) {
      console.warn(`Skipped unrecognized Plan Code: ${planCode}`);
      stats.skipped++;
      continue;
    }

    seenPlanCodes.add(planCode);

    const [, monthStr, unitLetter, setStr, activityStr] = match;
    const month = parseInt(monthStr, 10);
    const set = parseInt(setStr, 10);
    const activityNumber = parseInt(activityStr, 10);

    let content = row["Content"] || "";
    let format = row["Subject"] || "";
    
    // Extract (Format: X)
    const formatMatch = content.match(/\(Format:\s*(.+?)\)\s*$/i);
    if (formatMatch) {
      format = formatMatch[1].trim();
      content = content.replace(formatMatch[0], "").trim();
    }

    const category = row["Category"] || "FLN";
    
    if (stats[category] !== undefined) {
      stats[category]++;
    } else {
      stats[category] = 1;
    }
    fileCount++;

    bank.push({
      category,
      subject: row["Subject"] || "Literacy",
      language: row["Language"] || "English",
      unitLetter,
      month,
      set,
      activityNumber,
      title: row["Title"] || "",
      keyConcept: row["Key Concept"] || "",
      content: content,
      format: format
    });
  }
}

console.log(`Parsed FLN: ${stats.FLN} | Remedial: ${stats.Remedial} | Library: ${stats.Library} (skipped: ${stats.skipped})`);

// Add a few test cases for Numeracy if they don't exist in the file, just in case?
// No, we just parse what is in the file.

const fileContent = `// Auto-generated from Excel file
const ACADEMIC_ACTIVITY_BANK = ${JSON.stringify(bank, null, 2)};

export default ACADEMIC_ACTIVITY_BANK;
`;

fs.writeFileSync("src/data/academicActivityBank.js", fileContent);
console.log(`Successfully parsed ${bank.length} activities into src/data/academicActivityBank.js`);
