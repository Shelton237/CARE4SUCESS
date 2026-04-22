
const API_BASE = "https://care4success.usra-care.com/api";

async function testTeacherCourses() {
  console.log("🚀 Testing Teacher Course Creation...");

  // 1. Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "prof@care4success.cm", password: "prof123" })
  });
  
  if (!loginRes.ok) throw new Error("Login failed");
  const { token, user } = await loginRes.json();
  console.log("✅ Logged in as:", user.name);

  const headers = { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // 2. Create Online Course
  console.log("📝 Creating Online Course...");
  const course1 = await fetch(`${API_BASE}/courses`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: "Mathématiques BAC (Online)",
      subject: "Mathématiques",
      level: "Terminale",
      mode: "online",
      description: "Cours de révision pour le baccalauréat.",
      createdBy: user.id,
      status: "published"
    })
  });
  if (course1.ok) console.log("✅ Online Course Created!");
  else console.error("❌ Failed to create Online course:", await course1.text());

  // 3. Create Presentiel Course
  console.log("📝 Creating Presentiel Course...");
  const course2 = await fetch(`${API_BASE}/courses`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: "Français Brevet (Présentiel)",
      subject: "Français",
      level: "3ème",
      mode: "presentiel",
      description: "Préparation intensive au brevet des collèges.",
      createdBy: user.id,
      status: "published"
    })
  });
  if (course2.ok) console.log("✅ Presentiel Course Created!");
  else console.error("❌ Failed to create Presentiel course:", await course2.text());

  // 4. Verify list
  const listRes = await fetch(`${API_BASE}/courses?role=teacher&userId=${user.id}`, { headers });
  const courses = await listRes.json();
  console.log("📊 Teacher Courses count:", courses.length);
  courses.forEach(c => console.log(` - [${c.mode}] ${c.title}`));
}

testTeacherCourses().catch(console.error);
