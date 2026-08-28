import mongoose from "mongoose";

const visitObservationSchema = new mongoose.Schema(
  {
    visitDate: Date,
    facilitatorId: mongoose.Schema.Types.ObjectId,
    facilitatorNameRaw: String,
    childId: mongoose.Schema.Types.ObjectId,
    childName: String,
    activities: Array
  },
  { collection: "visitobservations" }
);

const userSchema = new mongoose.Schema({
  name: String,
  role: String
}, { collection: "users" });

async function checkLocalDb() {
  const uri = "mongodb://127.0.0.1:27017/teacher_training_portal";
  console.log("Connecting to local MongoDB at:", uri);
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    const VisitObservation = mongoose.model("VisitObservation", visitObservationSchema);
    const User = mongoose.model("User", userSchema);

    // Total records
    const totalCount = await VisitObservation.countDocuments();
    console.log("Total VisitObservation records:", totalCount);

    if (totalCount === 0) {
      console.log("No records found in local database. Data might have been backfilled to the production Render database.");
      
      // Let's check if Sanika is in the local Users list
      const sanikaUser = await User.findOne({
        name: { $regex: new RegExp(`^Sanika Prabhawale$`, "i") }
      });
      console.log("Sanika Prabhawale in local database User check:", sanikaUser);
      
      await mongoose.disconnect();
      return;
    }

    // Null childId count
    const nullChildCount = await VisitObservation.countDocuments({ childId: null });
    
    // Null facilitatorId count
    const nullFacilitatorCount = await VisitObservation.countDocuments({ facilitatorId: null });

    console.log(`Matched childId count: ${totalCount - nullChildCount} / ${totalCount} (${Math.round((totalCount - nullChildCount)/totalCount * 100)}%)`);
    console.log(`Matched facilitatorId count: ${totalCount - nullFacilitatorCount} / ${totalCount} (${Math.round((totalCount - nullFacilitatorCount)/totalCount * 100)}%)`);

    // Details for Sanika Prabhawale
    const sanikaVisits = await VisitObservation.find({
      facilitatorNameRaw: { $regex: new RegExp(`^Sanika Prabhawale$`, "i") }
    }).lean();

    console.log(`Sanika Prabhawale Raw Visits Count: ${sanikaVisits.length}`);
    if (sanikaVisits.length > 0) {
      console.log(`Sanika Prabhawale facilitatorId status in visits:`, sanikaVisits.map(v => v.facilitatorId));
    }

    const sanikaUser = await User.findOne({
      name: { $regex: new RegExp(`^Sanika Prabhawale$`, "i") }
    });
    console.log("User search for Sanika Prabhawale:", sanikaUser);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

checkLocalDb();
