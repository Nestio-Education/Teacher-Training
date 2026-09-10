async function checkTeachers() {
  const loginUrl = "https://nestio-preschool-website.onrender.com/api/auth/login";
  const teachersUrl = "https://nestio-preschool-website.onrender.com/api/admin/teachers";

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
      console.error("Login failed");
      return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log("2. Querying /api/admin/teachers on Render...");
    const res = await fetch(teachersUrl, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      console.error("Failed to fetch teachers list:", res.status);
      return;
    }

    const data = await res.json();
    const teachersList = data.teachers || [];
    console.log(`Total teachers in production: ${teachersList.length}`);

    // Search for Sanika
    const sanikaUser = teachersList.find(t => 
      t.name && t.name.toLowerCase().trim() === "sanika prabhawale"
    );

    if (sanikaUser) {
      console.log("Found Sanika Prabhawale in production database!", JSON.stringify(sanikaUser, null, 2));
    } else {
      console.log("Sanika Prabhawale was NOT found in the production teachers list.");
      console.log("Available teachers' names in production:");
      teachersList.forEach(t => console.log(`- ${t.name} (Role: ${t.role}, Email: ${t.email})`));
    }

  } catch (error) {
    console.error("Request failed:", error);
  }
}

checkTeachers();
