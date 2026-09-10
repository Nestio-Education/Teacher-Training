import * as XLSX from "xlsx";
import * as fs from "fs";

const filepath = "src/pages/docx-source/FLN_English_Lesson_Plan_Month1-6.xlsx";
const buffer = fs.readFileSync(filepath);
const workbook = XLSX.read(buffer, { type: "buffer" });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Headers:", data[0]);
console.log("First 3 Rows:");
for (let i = 1; i < Math.min(4, data.length); i++) {
  console.log(data[i]);
}
