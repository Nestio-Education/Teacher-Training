async function queryRender() {
  const url = "https://nestio-preschool-website.onrender.com/api/haals/debug-stats?secret=spaceece_haals_sync_secret_token_2026";
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
