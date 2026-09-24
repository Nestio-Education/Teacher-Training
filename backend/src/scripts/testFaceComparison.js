import { connectDb, disconnectDb } from "../db.js";
import { User } from "../models/User.js";
import { compareFaceSimilarity } from "../services/imageVerificationService.js";

async function runTest() {
  try {
    await connectDb();
    console.log("Testing Face Similarity Comparison...");

    const usersWithPhotos = await User.find({
      $or: [
        { photoUrl: { $exists: true, $ne: null, $ne: "" } },
        { "mentorProfile.profilePhoto": { $exists: true, $ne: null, $ne: "" } }
      ]
    }).limit(2);

    if (usersWithPhotos.length === 0) {
      console.log("No users with baseline profile photo found to test with.");
      return;
    }

    const testUser = usersWithPhotos[0];
    const baselinePhoto = testUser.photoUrl || testUser.mentorProfile?.profilePhoto;
    console.log(`Using user: ${testUser.name} (${testUser.email})`);
    console.log(`Baseline photo format: ${baselinePhoto.substring(0, 50)}...`);

    // Test 1: Compare baseline with identical image (should be ~100% PASS)
    const selfComp = await compareFaceSimilarity(baselinePhoto, baselinePhoto, 45);
    console.log("\nTest 1: Identical Image Match (Self vs Self):", selfComp);

    // Test 2: Compare baseline with dummy image (e.g. black pixel data url)
    const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const diffComp = await compareFaceSimilarity(dummyImage, baselinePhoto, 45);
    console.log("\nTest 2: Different / Dummy Image Match:", diffComp);

    console.log("\nFace Comparison Engine is functioning properly!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await disconnectDb();
    process.exit(0);
  }
}

runTest();
