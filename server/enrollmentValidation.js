// Public enrollment validation runs before any account is written.
export function validateEnrollment(input) {
  const fail = message => { const error = new Error(message); error.status = 400; throw error; };
  const text = value => typeof value === "string" ? value.trim() : "";
  const email = value => text(value).toLowerCase();
  const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validPassword = value => typeof value === "string" && value.length >= 8 && Buffer.byteLength(value, "utf8") <= 72;
  const body = input && typeof input === "object" ? input : {};
  const parentName = text(body.parentName);
  const parentEmail = email(body.parentEmail);
  if (parentName.length < 2 || parentName.length > 120) fail("Renseignez le nom complet du parent ou responsable (2 à 120 caractères).");
  if (!validEmail(parentEmail)) fail("L’adresse email du parent est invalide.");
  if (!validPassword(body.parentPassword)) fail("Le mot de passe parent doit contenir au moins 8 caractères et au plus 72 octets.");
  const parentPhone = text(body.parentPhone);
  if (!/^\+?[\d\s().-]+$/.test(parentPhone) || parentPhone.replace(/\D/g, "").length < 8 || parentPhone.length > 40) fail("Le numéro de téléphone est incomplet ou invalide.");
  const children = Array.isArray(body.children) ? body.children : [{ name: body.childName, email: body.childEmail, password: body.childPassword, level: body.childLevel, subject: body.subject }];
  if (!children.length || children.length > 10) fail("Inscrivez entre 1 et 10 enfants.");
  const emails = new Set([parentEmail]);
  const finalChildren = children.map((child, i) => {
    if (!child || typeof child !== "object") fail(`Le profil de l’enfant ${i + 1} est invalide.`);
    const name = text(child.name), childEmail = email(child.email), level = text(child.level);
    const subject = Array.isArray(child.subject) ? child.subject.map(text).filter(Boolean).join(", ") : text(child.subject);
    if (name.length < 2 || name.length > 120) fail(`Renseignez le nom complet de l’enfant ${i + 1}.`);
    if (!validEmail(childEmail)) fail(`L’adresse email de l’enfant ${i + 1} est invalide.`);
    if (emails.has(childEmail)) fail("Chaque compte parent et enfant doit avoir une adresse email différente.");
    emails.add(childEmail);
    if (!validPassword(child.password)) fail(`Choisissez un mot de passe d’au moins 8 caractères pour l’enfant ${i + 1} (72 octets maximum).`);
    if (!level || level.length > 100 || !subject || subject.length > 120) fail(`Choisissez le niveau et les matières de l’enfant ${i + 1} (120 caractères maximum pour les matières).`);
    return { name, email: childEmail, password: child.password, level, subject };
  });
  const parentGeoLocationId = body.parentGeoLocationId == null ? null : Number(body.parentGeoLocationId);
  if (parentGeoLocationId !== null && (!Number.isSafeInteger(parentGeoLocationId) || parentGeoLocationId < 1)) fail("La localisation sélectionnée est invalide.");
  const parentLocation = text(body.parentLocation);
  if (parentLocation.length > 120) fail("Le nom de votre localisation est trop long (120 caractères maximum).");
  return { parentName, parentEmail, parentPassword: body.parentPassword, parentPhone, parentLocation, parentGeoLocationId, finalChildren };
}
