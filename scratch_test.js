/**
 * TEST SCÉNARIO B : CYCLE PÉDAGOGIQUE
 * 
 * Ce script simule les actions d'un professeur après validation :
 * 1. Authentification
 * 2. Création d'un devoir (Homework)
 * 3. Saisie d'une note sur une séance (Session Report)
 */

import axios from 'axios';

const API_URL = 'http://localhost:4000/api'; // Ajuster si test sur prod
const TEACHER_EMAIL = 'prof@care4success.cm';
const TEACHER_PASS = 'prof123';

async function runScenarioB() {
  console.log("🚀 Lancement du Scénario B...");

  try {
    // 1. Authentification
    console.log("🔐 Branchement du professeur...");
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: TEACHER_EMAIL,
      password: TEACHER_PASS
    });
    const token = loginRes.data.token;
    const teacherId = loginRes.data.user.id;
    const authHeaders = { Authorization: `Bearer ${token}` };

    console.log(`✅ Connecté en tant que : ${loginRes.data.user.name}`);

    // 2. Récupération du planning
    console.log("📅 Récupération du planning...");
    const sessionsRes = await axios.get(`${API_URL}/sessions`, {
      params: { role: 'teacher', userId: teacherId },
      headers: authHeaders
    });
    const sessions = sessionsRes.data;

    if (sessions.length === 0) {
      console.log("⚠️ Aucune séance trouvée. Vérifiez le seed de la DB ou le mode fallback.");
      return;
    }

    const targetSession = sessions[0];
    console.log(`📍 Séance cible : ${targetSession.subject} avec ${targetSession.student}`);

    // 3. Création d'un devoir (B.1)
    console.log("📝 B.1 : Création d'un devoir...");
    const hwRes = await axios.post(`${API_URL}/homework`, {
      teacherId: teacherId,
      studentId: targetSession.studentId,
      sessionId: targetSession.id,
      title: "Exercices d'entraînement - Fonctions",
      description: "Faire les exercices 1 à 5 de la fiche jointe.",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subject: targetSession.subject,
      fileUrl: "https://care4success.usra-care.com/storage/resources/math_ex1.pdf"
    }, { headers: authHeaders });

    console.log(`✅ Devoir créé avec succès ! ID: ${hwRes.data.id}`);

    // 4. Saisie d'une note / Rapport (B.2)
    console.log("⭐ B.2 : Saisie d'un rapport et d'une note (18/20)...");
    await axios.post(`${API_URL}/sessions/${targetSession.id}/report`, {
      reportText: "Koffi a très bien compris la notion de dérivée. Exercices réussis.",
      understandingScore: 18,
      lessonId: targetSession.lesson_id,
      courseId: targetSession.course_id
    }, { headers: authHeaders });

    console.log("✅ Rapport et note enregistrés !");
    console.log("\n🏆 SCÉNARIO B REUSSI !");

  } catch (error) {
    console.error("❌ ÉCHEC DU SCÉNARIO B :");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
  }
}

runScenarioB();
