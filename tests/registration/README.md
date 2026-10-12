# Vérification du parcours d’inscription

La suite utilise uniquement MySQL local et la base `care4success_test` définie dans `.env.test`. Les emails SMTP sont désactivés. Les comptes de test, leurs liens et leurs demandes sont supprimés après chaque exécution.

Dans deux terminaux depuis la racine du projet :

```powershell
node tests/registration/start-api.mjs
npm run dev -- --host 127.0.0.1 --port 8085
```

Puis, avec Playwright ou playwright-core disponible :

```powershell
# Facultatif si Playwright est déjà une dépendance installée :
$env:PLAYWRIGHT_PACKAGE='chemin/vers/node_modules/playwright-core'
node tests/registration/verify.mjs
npx vitest run src/pages/Inscription.test.tsx --exclude '.worktrees/**'
```

La suite vérifie le parcours dans un navigateur avec une API Express et une base MySQL réelles : validations, doublons parent/enfant, ajout et suppression d’un enfant, conservation des informations au retour, panne temporaire puis nouvel envoi, création des comptes, mots de passe personnels, connexion parent et élève, accès aux synthèses, rattachement familial et demande pédagogique avec le niveau et les matières. Elle teste aussi une famille avec deux enfants et deux inscriptions concurrentes sans comptes partiels.

Les quatre écrans (parent, enfant, confirmation, succès) sont contrôlés à 320, 375, 390, 768, 1024 et 1440 px. Les captures sont écrites dans le dossier temporaire Windows. Les tests Google vérifient le refus d’un jeton invalide ; une authentification réelle Google et la livraison des emails nécessitent les services externes configurés.
