# Documentation Complète des Workflows - Care4Success

Cette documentation détaille le fonctionnement technique et fonctionnel de la plateforme Care4Success. Elle est destinée tant aux administrateurs qu'aux développeurs souhaitant comprendre le cycle de vie des données.

---

## 1. Workflows Métiers (Business Processes)

Ces processus constituent le cœur de métier de la plateforme : de l'acquisition d'un prospect au suivi pédagogique de l'élève.

### A. Flux d'Acquisition : Inscriptions et Demandes Familles
Ce workflow gère l'entrée des prospects dans le système.

| Étape | Acteur | Action Technique | Résultat |
| :--- | :--- | :--- | :--- |
| **1. Saisie** | Parent | Soumission du formulaire `TeacherApplicationForm` ou contact. | `POST /api/parents/enroll` |
| **2. Persistance** | API | Création d'entrées dans `users` (parent + élève) et `requests`. | Utilisateurs créés, statut requête = `reçu`. |
| **3. Qualification** | Admin | Analyse de la demande dans le dashboard `/admin/requests`. | Visualisation des données parent/élève. |
| **4. Déclenchement** | Admin | Passage du statut de la requête à `en traitement`. | **Trigger** : Création automatique d'un enregistrement dans `assignments`. |

### B. Flux de Matching : Attribution Enseignant
Une fois la demande qualifiée, elle entre dans la phase de recherche de l'enseignant idéal.

1.  **Apparition** : Le conseiller voit la demande dans `/advisor/matching`.
2.  **Sélection** : Le conseiller choisit un professeur (liste `candidates` en JSON).
3.  **Confirmation** (`PATCH /api/assignments/:id`) :
    *   Mise à jour de `assignments` (statut `confirmed`, `selected_teacher` défini).
    *   Mise à jour de `requests` (statut `assigné`).
    *   **Génération de Planning** : Création automatique des premières entrées dans la table `sessions`.

### C. Flux de Recrutement : Candidatures Enseignants
Gestion de l'onboarding des nouveaux professeurs.

1.  **Dépôt** : Le candidat remplit le formulaire public (`POST /api/teacher-applications`).
2.  **Notification** : Les admins/conseillers reçoivent une alerte de nouvelle candidature.
3.  **Revue** (`PATCH /api/teacher-applications/:id`) :
    *   L'Admin examine le CV et les motivations.
    *   Décision (Approuvé/Refusé) avec commentaire de revue.
    *   Si approuvé, le professeur devient sélectionnable dans le module de matching.

### D. Flux Pédagogique (LMS & Évaluations)
Gestion de l'enseignement et du suivi des progrès.

- **Construction de Cours** : L'Admin crée un `course`, ajoute des `course_lessons` et des `quizzes`.
- **Engagement Élève** : L'élève accède au cours, visionne les leçons et soumet ses quiz (`quiz_attempts`).
- **Feedback & Notation** :
    - **Session** : À la fin d'un cours, le prof remplit un compte-rendu dans `sessions`.
    - **Avis Parent** : Après une session, le parent peut noter le prof (`teacher_feedback`).
    - **Progression** : L'API agrège les scores de quiz et les notes de sessions dans `student_progress_points` pour les graphiques du dashboard.

---

## 2. Workflows Techniques (Developer & DevOps)

Ces processus assurent la stabilité, la qualité et le déploiement continu de l'application.

### A. Setup et Initialisation de l'Environnement
Procédure standard pour un nouveau développeur.

1.  **Dépendances** : `npm install` (Installe Vite, Express, Tailwind 4, Shadcn).
2.  **Base de données** :
    *   Configuration du `.env.local` avec les accès MySQL.
    *   Exécution de `server/schema.sql` (Structure) puis `server/seed.sql` (Données de test).
3.  **Démarrage** : `npm run dev:full` pour lancer le proxy API et le serveur de dev.

### B. Maintenance Automatisée de la Donnée
Scripts utilitaires pour résoudre les problèmes récurrents :

- **Correction Encodage** (`node patch_collation.js`) : Aligne toutes les tables sur la collation `utf8mb4_0900_ai_ci` pour éviter les erreurs de comparaison MySQL.
- **Réinitialisation Accès** (`node reset_passwords.js`) : Génère de nouveaux hashs bcrypt pour les comptes de démo.
- **Migration Profs** (`node migrate_teachers.js`) : Synchronise les données des professeurs entre les différentes tables de profil.

### C. Qualité et Tests Automatisés
- **Tests Unitaires/E2E API** : `node server/test_workflow.js`.
    - *Ce script est crucial* : il simule une transaction complète en base de données, permettant de vérifier que l'automatisation du matching et de la création de sessions fonctionne sans erreur.
- **Linting** : `npm run lint` (Vérification des standards TypeScript/React).

### D. Pipeline de Déploiement (Production)
Le déploiement est orchestré par le script `deploy.sh`.

```bash
# Séquence de déploiement type :
git pull origin main                      # Récupération du code
npm install                               # Mise à jour des packages
npm run build                             # Compilation Frontend (Vite -> dist)
pm2 startOrRestart ecosystem.config.cjs   # Redémarrage Backend avec PM2
```

---

## 3. Workflow de Sécurité et Autorisations

La plateforme utilise un système d'autorisations basé sur les rôles (`role` dans la table `users`).

| Rôle | Accès aux Workflows |
| :--- | :--- |
| **Admin** | Tout (Gestion users, cours, requêtes, candidatures). |
| **Conseiller** | Matching, Validation candidatures enseignants. |
| **Enseignant** | Planning sessions, gestion de contenu de cours, feedback élèves. |
| **Parent** | Consultation demandes, notes de sessions, facturation. |
| **Élève** | Accès aux cours, rendu de quiz, dashboard progression. |

---

## Annexe : Statuts des Demandes (`requests`)
- `reçu` : Nouveaux prospects non encore traités.
- `en traitement` : Demande qualifiée par un Admin (en attente de matching).
- `assigné` : Professeur trouvé et planning généré.
- `clôturé` : Dossier archivé ou service terminé.
