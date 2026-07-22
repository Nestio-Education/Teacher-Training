import { connectDb, disconnectDb } from "./db.js";
import mongoose from "mongoose";

async function deleteReviews() {
  await connectDb();

  console.log("Completely deleting all course assignment review documents...");

  // Delete all course assignment documents from the collection
  try {
    const assignmentsCol = mongoose.connection.collection("courseassignments");
    const deleteRes = await assignmentsCol.deleteMany({});
    console.log(`Successfully deleted ${deleteRes.deletedCount} CourseAssignment documents.`);
  } catch (err) {
    console.error("Error deleting course assignments:", err.message);
  }

  // Clear all certificates from the database
  try {
    const certCol = mongoose.connection.collection("certificates");
    const deleteCertRes = await certCol.deleteMany({});
    console.log(`Successfully deleted ${deleteCertRes.deletedCount} certificates.`);
  } catch (err) {
    console.log("No certificates collection found or error deleting certificates:", err.message);
  }

  await disconnectDb();
  console.log("Done.");
}

deleteReviews().catch(err => {
  console.error("Error executing delete-reviews:", err);
  process.exit(1);
});
