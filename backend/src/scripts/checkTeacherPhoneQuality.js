import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "../db.js";
import { User } from "../models/User.js";
import { normalizePhoneE164 } from "../services/notificationService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function runAudit() {
  try {
    await connectDb();
    
    console.log("Fetching teachers...");
    const teachers = await User.find({ role: "teacher" }).select("_id name phone").lean();
    
    let missingCount = 0;
    let validCount = 0;
    let unableCount = 0;
    
    const missingList = [];
    const unableList = [];
    
    for (const teacher of teachers) {
      if (!teacher.phone || teacher.phone.trim() === "") {
        missingCount++;
        missingList.push({ id: teacher._id, name: teacher.name });
        continue;
      }
      
      const normalized = normalizePhoneE164(teacher.phone);
      // Validate length roughly (10 digit + 2 country code + '+' = 13 usually, let's say >= 10 for E.164)
      // Actually we just check if it contains letters or is too short.
      const hasLetters = /[a-zA-Z]/.test(normalized);
      const isTooShort = normalized.length < 10;
      
      if (hasLetters || isTooShort || !normalized.startsWith('+')) {
        unableCount++;
        unableList.push({ id: teacher._id, name: teacher.name, originalPhone: teacher.phone });
      } else {
        validCount++;
      }
    }
    
    console.log("\n--- PHONE NUMBER AUDIT REPORT ---");
    console.log(`Total Teachers: ${teachers.length}`);
    console.log(`Valid E.164 Normalizable: ${validCount}`);
    console.log(`Missing Phone: ${missingCount}`);
    console.log(`Unable to Normalize: ${unableCount}`);
    
    if (unableCount > 0) {
      console.log("\n[Unable to Normalize]");
      unableList.forEach(t => {
        console.log(` - ${t.name} (${t.id}): ${t.originalPhone}`);
      });
    }
    
    if (missingCount > 0) {
      console.log("\n[Missing Phone]");
      missingList.forEach(t => {
        console.log(` - ${t.name} (${t.id})`);
      });
    }
    
    console.log("\nAudit complete. No records were modified.");
    process.exit(0);
  } catch (error) {
    console.error("Error running audit:", error);
    process.exit(1);
  }
}

runAudit();
