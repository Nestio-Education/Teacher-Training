async function checkPdca() {
  const loginUrl = "https://nestio-preschool-website.onrender.com/api/auth/login";
  const progressUrl = "https://nestio-preschool-website.onrender.com/api/pdca/fellow/progress";

  console.log("1. Authenticating as Teacher on Render production server...");
  try {
    const loginRes = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "dnyaneshwarit27@gmail.com",
        password: "Teacher@123"
      })
    });

    if (!loginRes.ok) {
      console.error("Login failed");
      return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log("2. Querying /api/pdca/fellow/progress on Render...");
    const res = await fetch(progressUrl, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("PDCA Response status:", res.status);
    const data = await res.json();
    console.log("PDCA Response:", JSON.stringify(data, null, 2));

  } catch (error) {
    console.error("Request failed:", error);
  }
}

checkPdca();
