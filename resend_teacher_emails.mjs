import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '/var/www/CARE4SUCESS/.env.local' });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
});

const FROM = process.env.SMTP_FROM;
const teacher = {
  name: 'Saturin Penlap',
  email: 'penlapsaturin@gmail.com',
  password: 'Prof#6980'
};

function tplApplicationReceived({ fullName }) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#0D2D5A;background:#f9fafb;padding:20px;border-radius:16px">
      <div style="background:#0D2D5A;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">Care<span style="color:#F5A623">4</span>Success</h1>
        <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Candidature reçue</p>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:15px">Bonjour <strong>${fullName}</strong>,</p>
        <p>Nous avons bien reçu votre candidature pour rejoindre l'équipe pédagogique de <strong>Care4Success</strong>.</p>
        <p>Notre équipe va étudier votre profil avec attention. Vous recevrez un email dès qu'une décision sera prise.</p>
        <p style="font-size:13px;color:#6b7280;margin-top:20px">L'équipe Care4Success</p>
      </div>
    </div>`;
}

function tplAccountCreated({ name, email, password }) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#0D2D5A;background:#f9fafb;padding:20px;border-radius:16px">
      <div style="background:#0D2D5A;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">Care<span style="color:#F5A623">4</span>Success</h1>
        <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Bienvenue sur votre plateforme d'excellence</p>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:15px">Bonjour <strong>${name}</strong>,</p>
        <p>Votre compte <strong>Professeur</strong> a été créé avec succès sur Care4Success.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:20px;border-radius:8px;margin:24px 0">
          <p style="margin:0 0 10px;font-size:14px">Voici vos identifiants de connexion :</p>
          <p style="margin:0 0 5px;font-size:14px">📧 Email : <strong>${email}</strong></p>
          <p style="margin:0;font-size:14px">🔑 Mot de passe : <strong>${password}</strong></p>
        </div>
        <p style="font-size:14px">Vous pouvez vous connecter dès maintenant sur : <a href="https://care4success.usra-care.com" style="color:#1A6CC8;text-decoration:none;font-weight:bold">https://care4success.usra-care.com</a></p>
        <p style="font-size:13px;color:#6b7280;margin-top:24px">Nous vous recommandons de changer votre mot de passe dès votre première connexion.</p>
        <p style="font-size:13px;color:#6b7280;margin-top:20px">L'équipe Care4Success</p>
      </div>
    </div>`;
}

async function run() {
  console.log('Resending emails to', teacher.email);
  
  await transporter.sendMail({
    from: FROM,
    to: teacher.email,
    subject: 'Confirmation de votre candidature - Care4Success',
    html: tplApplicationReceived({ fullName: teacher.name })
  });
  console.log('Sent: Application Confirmation');

  await transporter.sendMail({
    from: FROM,
    to: teacher.email,
    subject: 'Bienvenue sur Care4Success - Vos identifiants',
    html: tplAccountCreated({ name: teacher.name, email: teacher.email, password: teacher.password })
  });
  console.log('Sent: Welcome Credentials');
}

run().catch(console.error).finally(() => process.exit());
