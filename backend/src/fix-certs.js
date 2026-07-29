import { connectDb, disconnectDb } from "./db.js";
import { Certificate } from "./models/Certificate.js";
import { CourseAssignment } from "./models/CourseAssignment.js";

function calculateGrade(score, maxScore, fallbackGrade) {
  let initial = fallbackGrade;
  if (initial === "F") initial = "Fail";
  if (initial === "D") initial = "Pass";
  
  if (initial && ["A+", "A", "B+", "B", "C", "Pass", "Fail"].includes(initial)) {
    return initial;
  }
  
  if (score === null || score === undefined) return "Pass";
  const total = maxScore !== undefined && maxScore !== null ? maxScore : 100;
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  return "Pass";
}

async function run() {
  try {
    await connectDb();
    const certs = await Certificate.find();
    console.log(`Found ${certs.length} certificates to process.`);

    let updatedCount = 0;

    for (const cert of certs) {
      if (cert.assignment) {
        const assignment = await CourseAssignment.findById(cert.assignment);
        if (assignment) {
          const expectedGrade = calculateGrade(
            cert.score !== undefined ? cert.score : assignment.score,
            assignment.assessmentTotal,
            assignment.grade || assignment.assessmentGrade
          );

          if (cert.grade !== expectedGrade || (cert.score === undefined && assignment.score !== null)) {
            const oldGrade = cert.grade;
            cert.grade = expectedGrade;
            if (cert.score === undefined && assignment.score !== null) {
              cert.score = assignment.score;
            }
            await cert.save();
            console.log(`Updated Certificate ${cert.certificateNumber}: Grade changed from "${oldGrade}" to "${expectedGrade}" (Score: ${cert.score}/${assignment.assessmentTotal || 100})`);
            updatedCount++;
          }
        }
      } else {
        // Fallback for certs without assignment link
        if (cert.score !== undefined && cert.score !== null) {
          const maxScore = cert.score <= 10 ? 10 : 100;
          const expectedGrade = calculateGrade(cert.score, maxScore, cert.grade);
          if (cert.grade !== expectedGrade) {
            const oldGrade = cert.grade;
            cert.grade = expectedGrade;
            await cert.save();
            console.log(`Updated Certificate ${cert.certificateNumber} (no assignment link): Grade changed from "${oldGrade}" to "${expectedGrade}" (Score: ${cert.score}/${maxScore})`);
            updatedCount++;
          }
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} certificates.`);
  } catch (error) {
    console.error("Error fixing certificates:", error);
  } finally {
    await disconnectDb();
  }
}

run();
