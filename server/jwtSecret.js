// Résolution du secret JWT — aucune valeur par défaut faible n'est fournie.
// Le serveur doit refuser de démarrer si JWT_SECRET n'est pas défini en environnement.
export function resolveJwtSecret(env = process.env) {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET manquant : définissez la variable d'environnement JWT_SECRET avant de démarrer le serveur (aucun secret par défaut n'est fourni pour des raisons de sécurité)."
    );
  }
  return secret;
}
