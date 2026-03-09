import fetch, { FormData, File } from "node-fetch";
import fs from "fs";

async function testUpload() {
    const formData = new FormData();
    formData.append("fullName", "Upload Tester");
    formData.append("email", "upload@test.com");
    formData.append("phone", "12345678");
    formData.append("subjects", "Maths, Physique");
    formData.append("experienceYears", "4");
    formData.append("availability", "Always");
    formData.append("motivation", "Testing the file upload logic...");

    const fileBuffer = fs.readFileSync("mon_super_cv.pdf");
    const file = new File([fileBuffer], "mon_super_cv.pdf", { type: "application/pdf" });
    formData.append("cv", file);

    const res = await fetch("http://localhost:4000/api/teacher-applications", {
        method: "POST",
        body: formData,
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
}

testUpload().catch(console.error);
