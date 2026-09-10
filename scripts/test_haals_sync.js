async function runTest() {
  const sampleRow = {
    "Timestamp": "2026-08-27T14:00:00.000Z",
    "Date of Visit": "2026-08-27",
    "Name of Field Facilitator": "Dnyaneshwari Thorat",
    "Village/Area": "Village A",
    "Child's Name": "Aarav Mehta",
    "Child's Age": "4 years",
    "Program Enrolled": "PTP",
    "Is Child Present?": "Yes",
    "Is Caregiver Available?": "Yes",
    "Is Child Willing to Participate?": "Yes",
    "Space adequacy": "Yes",
    "Materials available": "Toys, Books",
    "household items substitute for toys": "Yes",
    "Name of the Activity - 1": "Sensory Sorting",
    "Domain - 1": "Cognitive",
    "Milestone Score 1": "4",
    "Engagement Level - 1": "Highly Engaged",
    "Attempted - 1": "Yes",
    "Completed - 1": "Yes",
    "Did caregiver observe?": "Yes",
    "Did caregiver participate?": "Yes",
    "Can they repeat it at home?": "Yes",
    "What challenges came up": "None",
    "Recommended next action": "Progress milestone",
    "Child participation rating": "5",
    "Parent cooperation rating": "5",
    "Home environment rating": "4",
    "Remarks": "Very good session, parent was highly cooperative."
  };

  console.log("Sending simulated form response row matching seeded entities to webhook...");
  try {
    const response = await fetch("http://localhost:5000/api/haals/visits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": process.env.HAALS_SYNC_SECRET || process.argv[2] || ""
      },
      body: JSON.stringify(sampleRow)
    });

    const result = await response.json();
    console.log("Webhook response status:", response.status);
    console.log("Sync Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Sync Request Failed:", error);
  }
}

runTest();
