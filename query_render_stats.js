async function queryRender() {
  const secret = process.env.HAALS_SYNC_SECRET || process.argv[2] || "";
  const url = `https://nestio-preschool-website.onrender.com/api/haals/debug-stats?secret=${encodeURIComponent(secret)}`;
  console.log("Fetching stats from production Render server...");
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`HTTP Error ${response.status}:`, errText);
      return;
    }
    const data = await response.json();
    console.log("=== Production Sync Statistics ===");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Fetch request failed:", error);
  }
}

queryRender();
