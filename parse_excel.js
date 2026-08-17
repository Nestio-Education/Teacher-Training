import * as XLSX from "xlsx";
import * as fs from "fs";

const filepath = "src/pages/docx-source/FLN_English_Lesson_Plan_Month1-6.xlsx";
const buffer = fs.readFileSync(filepath);
const workbook = XLSX.read(buffer, { type: "buffer" });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

const bank = [];

for (const row of data) {
  const planCode = row["Plan Code"];
  if (!planCode) continue;

  // Expected format: FLN-ENG-M1-S1-A01
  const match = planCode.match(/-M(\d+)-S(\d+)-A(\d+)/);
  if (!match) continue;

  const month = parseInt(match[1], 10);
  const set = parseInt(match[2], 10);
  const activityNumber = parseInt(match[3], 10);

  let content = row["Content"] || "";
  let format = row["Subject"] || "";
  
  // Extract (Format: X)
  const formatMatch = content.match(/\(Format:\s*(.+?)\)\s*$/i);
  if (formatMatch) {
    format = formatMatch[1].trim();
    content = content.replace(formatMatch[0], "").trim();
  }

  bank.push({
    category: row["Category"] || "FLN",
    subject: row["Subject"] || "Literacy",
    month,
    set,
    activityNumber,
    title: row["Title"] || "",
    keyConcept: row["Key Concept"] || "",
    content: content,
    format: format
  });
}

// Add a few test cases for Numeracy if they don't exist in the file, just in case?
// No, we just parse what is in the file.

const fileContent = `// Auto-generated from Excel file
const ACADEMIC_ACTIVITY_BANK = ${JSON.stringify(bank, null, 2)};

export default ACADEMIC_ACTIVITY_BANK;
`;

fs.writeFileSync("src/data/academicActivityBank.js", fileContent);
console.log(`Successfully parsed ${bank.length} activities into src/data/academicActivityBank.js`);
