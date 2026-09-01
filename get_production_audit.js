async function getAudit() {
  const loginUrl = "https://nestio-preschool-website.onrender.com/api/auth/login";
  const auditUrl = "https://nestio-preschool-website.onrender.com/api/haals/admin/audit";

  console.log("1. Authenticating as Admin on Render production server...");
  try {
    const loginRes = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@spaceece.com",
        password: "Admin@123"
      })
    });

    if (!loginRes.ok) {
      const errText = await loginRes.text();
      console.error("Login failed:", errText);
      return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Authentication successful! Token received.");

    console.log("2. Fetching audit statistics from production /api/haals/admin/audit...");
    const auditRes = await fetch(auditUrl, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!auditRes.ok) {
      const errText = await auditRes.text();
      console.error("Audit fetch failed:", errText);
      return;
    }

    const auditData = await auditRes.json();
    console.log("\n=== Production Audit Results ===");
    console.log(JSON.stringify(auditData, null, 2));

  } catch (error) {
    console.error("Request failed:", error);
  }
}

getAudit();
