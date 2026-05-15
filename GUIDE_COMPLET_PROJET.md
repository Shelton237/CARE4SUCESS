e vois # 📘 Guide des Fonctionnalités et Tests - Care4Success

Ce document sert de guide de référence pour l'application **Care4Success**. Il détaille l'ensemble des fonctionnalités par rôle et les protocoles de tests associés.

---

## 👥 1. Rôles et Accès
L'application est structurée autour de 5 rôles distincts :
1.  **Public** : Visiteurs non connectés.
2.  **Parent** : Responsable du suivi et du paiement.
3.  **Élève** : Bénéficiaire des cours.
4.  **Enseignant** : Prestataire pédagogique.
5.  **Tuteur/Administrateur** : Coordinateur et validateur.

---

## 🚀 2. Cartographie des Fonctionnalités

### 🏠 Espace Public
- **Landing Page** : Présentation des services.
- **Formulaire de Contact** : Support et demandes d'information.
- **Portail d'Inscription/Connexion** : Création de compte et authentification sécurisée.

### 👨‍👩‍👧 Espace Parent (Suivi & Finance)
- **Tableau de Bord** : Vue globale sur la progression des enfants.
- **Gestion des Enfants** : Ajout et consultation des profils enfants.
- **Facturation** : Historique des paiements et téléchargement des factures PDF.
- **Messagerie** : Communication avec les enseignants et l'administration.

### 🎓 Espace Élève (Apprentissage)
- **Mon Planning** : Calendrier des sessions de cours.
- **Mes Devoirs** : Liste des travaux à rendre avec supports téléchargeables.
- **Résultats** : Consultation des notes et évaluations.
- **Ressources** : Bibliothèque de fichiers partagés par les profs.

### 👨‍🏫 Espace Enseignant (Pédagogie)
- **Gestion des Élèves** : Fiches de suivi et historique des interactions.
- **Création de Contenu** : Publication de devoirs, cours et ressources.
- **Rapports d'Évaluation** : Saisie des notes et feedbacks après chaque session.
- **Suivi des Gains** : Visualisation des revenus accumulés.
- **Messagerie** : Contact direct avec les parents.

### ⚙️ Espace Administration (Coordination)
- **Recrutement** : Validation des candidatures d'enseignants.
- **Gestion des Utilisateurs (Élèves & Familles)** : Supervision des comptes. *Note : La création d'un compte élève génère automatiquement une demande de bilan.*
- **Demandes de Bilan (Pipeline)** : Suivi des nouveaux prospects. *Note : Alimenté automatiquement par les nouvelles inscriptions.*
- **Gestion des Sessions** : Contrôle de l'intégralité du planning.
- **Facturation Globale** : Émission et suivi des factures.

---

## 🧪 3. Scénarios de Test Ultra-Détaillés (Fiches de Recette)

### 📝 SCÉNARIO 0 : Enregistrement & Onboarding (Nouveaux Acteurs)
*   **Objectif** : Vérifier que chaque type d'utilisateur peut entrer dans le système avec les bons droits initiaux.

| Acteur | Processus & **Champs Obligatoires** | Impact DB | Validation |
| :--- | :--- | :--- | :--- |
| **Enseignant** | **Formulaire Recrutement** : Nom complet, Email, Tel, Matières, Années exp., Dispo, Motivation. | `users.role = 'applicant'` | **OUI** (Admin) |
| **Parent** | **Portail Inscription** : Nom Responsable, Email, Tel, Mot de passe. | `users.role = 'parent'` | **NON** |
| **Élève** | **Sous-formulaire Enfant** : Nom de l'enfant, Niveau scolaire, Matière prioritaire. | `users.role = 'student'` | **NON** |
| **Tuteur** | **Gestion Admin** : Créé par un Administrateur pour gérer le recrutement. | `users.role = 'tutor'` | **SÉCURITÉ** |
| **Admin** | **Interne** : Email, Nom, Mot de passe. | `users.role = 'admin'` | **SÉCURITÉ** |

---

### 🔐 SCÉNARIO A : Authentification & Sécurité
*   **Pré-requis** : Avoir au moins un compte actif par rôle dans la table `users`.
*   **Données de Test** : `email: test@care4success.com`, `pass: Pluton@2015`

| Cas | Étapes Précises | Impact DB / Technique | Cas Limites |
| :--- | :--- | :--- | :--- |
| **A.1 Login** | Saisir identifiants -> Bouton "Connexion". | Check table `users`. Le champ `last_login` doit s'actualiser. | Tester avec un email inconnu ou mot de passe vide. |
| **A.2 Token** | Se connecter -> Fermer l'onglet -> Réouvrir. | Le `localStorage` doit contenir le `auth_token`. | Supprimer le token manuellement -> Doit rediriger vers `/login`. |
| **A.3 RBAC** | Tenter d'accéder à `/admin` avec un compte `student`. | Log d'erreur 403 dans la console API. | Modifier le rôle en DB pendant que l'utilisateur est connecté. |

### 📚 SCÉNARIO B : Cycle Pédagogique
*   **Pré-requis** : Une relation active entre un Prof et un Élève dans `student_teacher_relations`.

| Cas | Étapes Précises | Impact DB / Technique | Cas Limites |
| :--- | :--- | :--- | :--- |
| **B.1 Devoir** | (Prof) Upload fichier -> Choisir Élève -> Valider. | Insert dans table `assignments`. Fichier présent dans `/uploads/`. | Upload un fichier de + de 10Mo. Caractères spéciaux dans le nom. |
| **B.2 Note** | (Prof) Saisir note 18/20 sur session ID #452. | Update table `sessions` (colonne `grade`, `feedback`). | Note supérieure à 20 ou inférieure à 0. |

### 💳 SCÉNARIO C : Finance & Facturation
*   **Pré-requis** : Sessions marquées comme "complétées" pour le calcul du montant.

| Cas | Étapes Précises | Impact DB / Technique | Cas Limites |
| :--- | :--- | :--- | :--- |
| **C.1 Facture** | (Admin) Sélectionner mois -> "Générer Factures". | Insert table `invoices`. Lien `invoice_id` créé sur les sessions. | Facturer un mois déjà facturé (doublon). |
| **C.2 PDF** | (Parent) Cliquer sur l'icône "Téléchargement". | Appel API `/api/invoices/:id/download`. | Télécharger une facture d'un autre parent (sécurité ID). |

### 💬 SCÉNARIO D : Messagerie Temps Réel
*   **Pré-requis** : Système de socket ou polling actif.

| Cas | Étapes Précises | Impact DB / Technique | Cas Limites |
| :--- | :--- | :--- | :--- |
| **D.1 Envoi** | Taper message -> Touche Entrée. | Insert table `messages`. Champ `is_read` = 0. | Message vide ou script XSS (`<script>alert()</script>`). |
| **D.2 Lu** | (Destinataire) Ouvrir la conversation. | Update table `messages` SET `is_read` = 1. | Vérifier si le compteur de notif sur le menu baisse de 1. |

### 🎓 SCÉNARIO E : Recrutement (Tutor)
| Cas | Étapes Précises | Impact DB / Technique | Cas Limites |
| :--- | :--- | :--- | :--- |
| **E.1 Approuver** | (Tuteur) Actions -> "Valider Enseignant". | Table `users` : `role` passe de 'applicant' à 'teacher'. | Valider un profil avec des champs obligatoires vides. |

### 🤝 SCÉNARIO F : Matching Professeur ↔ Élèves
*   **Objectif** : Associer manuellement des élèves à un professeur et vérifier la synchronisation.
*   **Pré-requis** : Comptes `Élève Tech Satur`, `Élève Lesatur` et `Saturin Penlap` créés.

| Cas | Étapes Précises | Impact DB / Technique | Cas Limites |
| :--- | :--- | :--- | :--- |
| **F.1 Association** | (Admin) Dans "Élèves & Familles", sélectionner `Tech Satur` et l'associer à `Saturin Penlap`. | Table `student_teacher_relations` mise à jour. | Élève déjà associé à un autre professeur. |
| **F.2 Répétition** | Faire de même pour `Élève Lesatur`. | Seconde relation créée pour le professeur. | Vérifier la limite de quota d'élèves par prof. |
| **F.3 Dashboard** | Se connecter (Prof) et vérifier la liste des élèves. | API `/api/sessions?role=teacher` retourne les sessions des 2 élèves. | Vérifier si les rapports d'évaluation sont accessibles pour les deux. |

---

## 🏢 4. Analyse des Processus Métier (Expert Audit)

Cette section décrit la logique métier et les points de contrôle critiques pour chaque flux de l'application.

### 🔄 P1 : Recrutement & Qualification (Enseignants)
*   **Objectif** : Garantir la qualité pédagogique et la sécurité des élèves.
*   **Logique** : Tout candidat est initialement en mode "spectateur" (`applicant`). Il subit un audit pédagogique (Entretien/CV).
*   **Point de Contrôle Audit** : Seule l'action délibérée d'un Tuteur/Admin peut activer le compte pour le matching.

### 🎓 P2 : Onboarding & Acquisition (Familles)
*   **Objectif** : Transformer un prospect en client actif avec un suivi personnalisé.
*   **Logique** : Une "Famille" regroupe un responsable financier (Parent) et plusieurs bénéficiaires (Élèves).
*   **Point de Contrôle Audit** : L'inscription ou la création manuelle d'un compte déclenche **automatiquement** une "Demande de bilan" dans le pipeline pour assurer le suivi immédiat par un conseiller.

### 📝 P3 : Delivery Pédagogique (LMS)
*   **Objectif** : Automatiser le suivi des acquis et la preuve de service fait.
*   **Logique** : Le service est rendu lors de la session. La preuve est le compte-rendu d'évaluation (Notes/Feedback).
*   **Point de Contrôle Audit** : Pas de rapport d'évaluation = session non facturable (Garantie de service fait).

### 💰 P4 : Flux Financiers & Earnings
*   **Objectif** : Assurer la solvabilité et la motivation des intervenants.
*   **Logique** : La plateforme collecte les paiements (Facture Parent) et reverse les honoraires (Earnings Enseignant).
*   **Point de Contrôle Audit** : Automatisme de calcul basé sur les taux horaires configurés et les sessions validées.

---

## 🛠 5. Guide Technique & Maintenance

### Accès Serveur
- **IP** : `155.117.46.218`
- **Utilisateur** : `saturnin`
- **Chemin Projet** : `/var/www/CARE4SUCESS`

### Commandes Utiles
- **Vérifier les logs serveur** : `pm2 logs`
- **Redémarrer l'application** : `pm2 restart ecosystem.config.cjs`
- **Vérifier la DB (MySQL)** : `mysql -u care4success -p -D care4success`

### Scripts de Diagnostic (Racine du projet)
- `tmp_check_db.js` : Vérifie la connexion à la base de données.
- `diag.js` : Diagnostic général du système.
- `check_users.js` : Liste les utilisateurs et leurs rôles.

---

## 🎨 6. Design & UX
L'application respecte le système **EUREKA UI** ("Slim & Professional").
- **Police** : Inter / Sans-serif.
- **Code Couleur** : Professionnel, modes clair/sombre supportés.
- **Responsive** : Testé sur Desktop (1920px) et Mobile (375px).

---
*Dernière mise à jour : 14 Mai 2026*
