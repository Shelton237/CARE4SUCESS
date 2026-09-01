# Care4Success — Cartographie fonctionnelle par rôle

Inventaire exhaustif des fonctions disponibles pour chacun des six rôles de
l'application, extrait directement du code source (composants React, appels
API, gestionnaires d'action) — établi le 2026-07-23.

Les fonctions marquées *(non câblé)* désignent des boutons présents dans
l'interface mais sans gestionnaire d'action câblé dans le code à ce jour.

## Sommaire

- [Admin](#admin) — 11 pages
- [Conseiller](#conseiller) — 7 pages
- [Parent](#parent) — 9 pages
- [Élève](#élève) — 10 pages
- [Enseignant](#enseignant) — 9 pages + classe virtuelle
- [Tuteur](#tuteur) — 11 pages/routes

---

## Admin

Pilotage global de la plateforme — enseignants, cours, finances, géographie, paramètres.

### Tableau de bord — `/admin`
`src/pages/admin/Dashboard.tsx`

**KPIs affichés**
- Enseignants actifs, élèves suivis, demandes en attente, CA du mois (avec tendance vs mois précédent)
- Taux d'occupation (barre de progression), profs mobilisés ce mois, satisfaction moyenne, nouveaux leads du mois

**Visualisations**
- Graphique en barres du chiffre d'affaires mensuel (6 derniers mois)
- Graphique circulaire de répartition du CA par matière
- Liste des 5 dernières demandes de bilan (statut coloré)
- Classement des notes enseignants (`TeacherRatingsBoard`)

**Actions**
- Rafraîchir les statistiques en cas d'erreur de chargement (`refetch`)

Données via `fetchAdminDashboard`.

### Enseignants — `/admin/teachers`
`src/pages/admin/Teachers.tsx`

**Liste**
- Tableau : enseignant, matières, niveaux, note, nombre d'élèves, ville, statut, actions
- Recherche par nom ou matière
- Filtre par statut (tous / actifs / inactifs-suspendus)

**Créer un enseignant (modale)**
- Formulaire : nom complet*, email*, matière principale, niveaux, ville d'intervention
- `createTeacher` — envoi automatique d'un email d'invitation

**Actions par ligne**
- Consulter le profil → `/admin/profiles/:id?role=teacher`
- Modifier les spécialités (modale, sélection multiple niveaux/matières) → `updateTeacherSpecialties`, invalide aussi le cache du matching
- Suspendre / Réactiver le compte → `updateTeacherStatus`

### Cours & Quiz — `/admin/courses`
`src/pages/admin/Courses.tsx`

**Consultation**
- Liste des cours, pagination (4/page)
- Sélection d'un cours : description, matière, niveau, statut brouillon/publié, nombre de leçons
- Sélection d'une leçon : contenu, ordre, quiz associé (titre, consignes, points totaux)

> Mode admin en lecture uniquement : création/édition de cours, leçon, quiz, question et assignation élève sont masquées pour ce rôle (réservées aux responsables pédagogiques).

### Candidatures profs — `/admin/applications`
`src/pages/admin/TeacherApplications.tsx` (via `TeacherApplicationsBoard`)

**Filtres et recherche**
- Filtres par statut : en attente / validées / refusées / toutes (badge compteur sur « en attente »)
- Recherche par nom, email ou matière

**Fiche candidature**
- Email, téléphone, années d'expérience, disponibilité, matières, lien CV, note interne existante

**Décision**
- Valider / Refuser → modale de confirmation avec note interne optionnelle
- Si validation : choix du type de tarif (horaire / forfait mensuel) et montant négocié (FCFA)
- `reviewTeacherApplication` (statut, notes, tarif, rôle du réviseur = admin)
- Si succès : identifiants générés affichés (email + mot de passe temporaire) avec bouton « Copier pour envoyer »

### Élèves & Familles — `/admin/students`
`src/pages/admin/Students.tsx`

**Tableau des familles**
- Famille (parent), élève, localisation, niveau, matière, enseignant assigné, prochain cours, statut

**Actions par ligne**
- Modifier niveau scolaire et matières suivies (modale) → `updateFamilyDetails`
- Réinitialiser l'accès élève (prompt nouveau mot de passe ou défaut) → `resetUserPassword`, envoi d'un email avec les nouveaux identifiants

Données via `fetchAdvisorFamilies`.

### Demandes de bilan — `/admin/requests`
`src/pages/admin/Requests.tsx`

**Vue Kanban (Reçu / En traitement / Assigné / Clôturé)**
- KPIs : total, nouvelles, en traitement, assignées
- Recherche élève/parent/matière, filtres rapides par statut

**Gestion des cartes**
- Glisser-déposer entre colonnes → `updateRequestStatus`
- Changement de statut via menu déroulant
- Appel téléphonique direct (`tel:`)
- « Lancer le matching » (si « en traitement ») → redirige vers `/admin/matching` avec contexte

**Créer une demande (modale)**
- Parent, élève, niveau, matière, téléphone → `createRequest`

### Matching — `/admin/matching`
`src/pages/advisor/Matching.tsx` (composant conseiller réutilisé)

- Liste des élèves en attente d'affectation : besoins, créneaux, localisation
- Enseignants compatibles par élève : note, disponibilité, ville, indicateur « Zone ✓ » — tri automatique par proximité géographique
- Sélection d'un enseignant candidat (uniquement si disponible)
- Confirmer l'assignation → `confirmAssignment`, toast succès/erreur
- Bannière contextuelle + scroll auto si arrivée depuis « Demandes », bouton retour
- Rafraîchir la liste en cas d'erreur

### Profils utilisateurs — `/admin/profiles`
`src/pages/admin/ProfileManager.tsx`

**Liste**
- Onglets par rôle (Admin / Conseiller / Parent / Élève / Tuteur) avec compteur
- Recherche par nom ou email

**Création — `registerUser`**
- Rôle, nom complet*, email*, mot de passe* (min. 8 car.), téléphone, fuseau horaire, langue, initiales/avatar, localisation (`GeoSelector`), bio
- Préférences de notification (email / SMS / WhatsApp) par switches
- Liaisons initiales selon le rôle : enfants (parent), parents + tuteurs (élève), élèves suivis (tuteur)

**Édition — `updateUserProfile`**
- Nom, téléphone, fuseau, langue, initiales, localisation, bio, préférences notification
- Gestion des relations (ajout/retrait par chips, diff calculé) : parent ↔ enfants, élève ↔ parents/tuteurs, tuteur ↔ élèves suivis
- Sauvegarde du profil + synchronisation des liaisons en une soumission

### Finance & Paie — `/admin/finance`
`src/pages/admin/Finance.tsx`

**KPIs**
- Volume facturé, revenus encaissés, dépenses tuteurs (payroll estimé), marge brute (%)

**Actions**
- Actualiser les données (`refetch`)
- Générer les factures du mois → `generateManualInvoices` (toast avec nombre généré)

**Tableau de paie enseignants**
- Enseignant, mode de rémunération, montant du mois, total cumulé
- Bouton « Exporter » présent mais sans gestionnaire câblé *(non câblé)*

**Visualisation**
- Graphique circulaire dépenses tuteurs / marge nette
- Bloc « Santé Plateforme » (% marge brute)

### Géographie & Zones — `/admin/geography`
`src/pages/admin/Geography.tsx`

- Liste des suggestions de zones en attente (nom, type, zone parente, auteur, date) — rafraîchie toutes les 30s
- Valider une suggestion → `validateGeoLocation` (rend la zone disponible dans toute la plateforme)
- Rejeter une suggestion (supprime la suggestion)
- Section informative : hiérarchie géographique et calcul du score de proximité pour le matching

### Paramètres — `/admin/settings`
`src/pages/admin/Settings.tsx`

**Tarifs horaires par matière**
- Ajouter, modifier en ligne (matière/tarif standard/tarif premium), supprimer

**Centres et antennes**
- Ajouter (nom, ville, adresse, activation immédiate), modifier en ligne, activer/désactiver, supprimer

**Notifications**
- Activer/désactiver chaque préférence de notification automatique

**Sécurité & Accès**
- Délai d'expiration de session (30 min / 1h / 4h / 24h)
- Politique de mot de passe (standard / fort)
- Double authentification (2FA) pour les comptes admin
- Indicateur d'état système

**Action globale**
- « Enregistrer » → `savePlatformSettings`

---

## Conseiller

Suivi pédagogique des familles, matching, bilans et messagerie.

### Tableau de bord — `/advisor`
`src/pages/advisor/Dashboard.tsx`

- 4 KPI : familles assignées, demandes en attente, matchings en cours, bilans réalisés ce mois (avec tendance)
- Indicateur « Temps moyen de réponse aux familles » vs objectif plateforme (≤ 24h)
- Liste « Mes familles — aperçu » : enfant, niveau, enseignant assigné, statut
- Liste « Dernières demandes reçues » : enfant, niveau, matière, date, statut

> Page en lecture seule. Données via `fetchAdvisorDashboard(user.id)`.

### Mes familles — `/advisor/families`
`src/pages/advisor/Families.tsx`

**Liste**
- Recherche par nom de parent ou d'élève
- Liste (`fetchAdvisorFamilies`) : avatar, parent, élève, tuteur assigné, date du dernier bilan
- Sélection → fiche détail (moyenne, assiduité, tuteur actuel)

**Onglet Notes**
- Liste des observations conseiller (`GET /advisor-notes/:studentId`)
- Ajout d'une note typée (observation / recommandation / alerte / positif) → `POST /advisor-notes`
- Suppression d'une note → `DELETE /advisor-notes/:id`

**Onglet Diagnostic**
- Consultation du dernier diagnostic (scores par matière, points forts/faibles) → `GET /students/:id/diagnostic`
- Création d'un nouveau diagnostic (curseurs 0–10 par matière + points forts/à renforcer) → `POST /students/:id/diagnostic`

**Onglet Plan**
- Consultation du plan pédagogique actif (semaines, objectifs, matières, statut) → `GET /students/:id/academic-plan`
- Création d'un plan (titre, date de début, semaines ajoutables/supprimables, objectif et matières par semaine) → `POST /students/:id/academic-plan`

**Onglet Matching**
- Tuteurs recommandés pour l'élève (score, note, tarif, matières à renforcer) → `GET /advisor/match/:studentId`

> Section Dossier académique intégrée en lecture (composant `AcademicFile`). Boutons « Contacter la famille » / « Bilan Conseil » présents mais non câblés.

### Matching — `/advisor/matching`
`src/pages/advisor/Matching.tsx`

- Liste des élèves en attente d'affectation (`fetchAdvisorAssignments`), compteur « en attente »
- Bannière contextuelle + scroll auto si arrivée depuis Familles, bouton retour
- Bannière d'erreur avec bouton « Réessayer »
- Par élève : besoins, créneau, zone géographique
- Enseignants compatibles : note, disponibilité, ville, indicateur « Zone ✓ », tri par zone
- Sélection d'un candidat (clic pour sélectionner/désélectionner, désactivé si indisponible)
- « Confirmer le matching » → `confirmAssignment(matchId, teacherName)`, toast succès/erreur

### Candidatures profs — `/advisor/applications`
`src/pages/advisor/TeacherApplications.tsx` (via `TeacherApplicationsBoard`)

- Filtres par statut (en attente / validées / refusées / toutes), recherche nom/email/matière
- Fiche candidature : email, téléphone, expérience, disponibilité, matières, lien CV, note interne
- Valider / Refuser → modale (note interne, tarif horaire ou forfait + montant si validation)
- `reviewTeacherApplication(id, { status, reviewNotes, reviewerRole:"advisor", rateType, negotiatedRate })`
- Affichage des identifiants générés après validation, bouton « Copier pour envoyer »

### Bilans pédagogiques — `/advisor/reports`
`src/pages/advisor/Reports.tsx`

- 3 compteurs : bilans rédigés, en cours, à rédiger
- « Nouveau bilan » affiché sans handler câblé *(non câblé)*
- Liste des bilans : enfant, niveau, type (mensuel / mi-parcours / fin de trimestre), date, statut
- Clic sur un bilan → accordéon (parent, enseignant, type, synthèse texte)
- « Modifier le bilan » / « Continuer la rédaction » / « Envoyer au parent » affichés sans handler câblé *(non câblé)*
- Section « Demandes de bilan à traiter » (hors statut clôturé) avec bouton « Traiter » *(non câblé)*
- Bannière d'erreur avec « Réessayer »

### Messagerie — `/advisor/messages`
`src/pages/advisor/Messages.tsx`

- Liste des contacts (`fetchAdvisorContacts`), recherche par nom, filtre par rôle (Tous / Profs / Parents)
- Tri automatique par dernier message, badge de non-lus par contact
- Fil de discussion rafraîchi toutes les 5s (`fetchMessages`)
- Marquage automatique des messages reçus comme lus (`markMessageAsRead`)
- Envoi de message texte avec mise à jour optimiste (`sendMessage`)
- Envoi de pièce jointe (upload, aperçu image, lien « Ouvrir le fichier ») → `uploadMessageAttachment`
- Pré-sélection d'un contact si navigation depuis une autre page

### Tâches & RDV — `/advisor/schedule`
`src/pages/advisor/Schedule.tsx`

- Bannière contextuelle si arrivée depuis Familles (famille pré-remplie), bouton retour
- Formulaire « Nouveau rendez-vous » : famille/contact, type (bilan initial, suivi régulier, rencontre prof, résolution de problème), date, heure
- « Confirmer le rendez-vous » → `createAdvisorAppointment(user.id, payload)`, toast succès/erreur, réinitialisation du formulaire
- Liste « Mes prochains rendez-vous » (`fetchAdvisorAppointments`) : famille, heure, date, type, statut

---

## Parent

Suivi des enfants, planning, devoirs, facturation et retours pédagogiques.

### Tableau de bord — `/parent`
`src/pages/parent/Dashboard.tsx`

- Sélecteur d'enfant (onglets) filtrant toutes les données affichées
- 4 indicateurs : moyenne, séances du mois, prochaine séance, budget payé ce mois
- Graphique d'évolution des notes (Maths/Français)
- Derniers résultats (4 dernières évaluations)
- Aperçu du planning (3 prochaines séances), lien « Tout » vers le planning complet
- Bannière facture en attente avec bouton « RÉGLER »
- Raccourcis « Gestion Family » et « Facturation »

### Mes Enfants — `/parent/children`
`src/pages/parent/Children.tsx`

- Cartes par enfant : moyenne/20, heures de cours, taux d'assiduité, enseignant principal + matière
- « Planning » → planning filtré de l'enfant
- « Cockpit » → fiche individuelle détaillée
- « Contacter » l'enseignant et « Contacter un conseiller » sans action câblée visible *(non câblé)*

### Équipe Pédagogique — `/parent/team`
`src/pages/parent/Team.tsx`

- Liste des enseignants reconstruite depuis les séances planifiées, avec sessions terminées/à venir et enfants suivis
- « Discuter » → toast de confirmation (demande transmise au conseiller pédagogique)
- Icône mail → ouvre le client mail (`mailto:`)

### Planning — `/parent/schedule`
`src/pages/parent/Schedule.tsx`

- Filtrage par enfant via l'URL, bouton retour si filtré
- Vue hebdomadaire (grille 6 jours) + vue liste (historique complet)
- « Rapport » (séance effectuée) → modale « Bilan de séance »
- « Avis » (séance effectuée) → modale de feedback : notation 1-5 étoiles + commentaire → `POST /api/session-feedback`

### Devoirs — `/parent/homework`
`src/pages/parent/Homework.tsx`

- Sélecteur multi-enfants filtrant devoirs et ressources
- Compteurs « À faire » / « Corrigés »
- Onglet « Travaux de l'élève » : accordéon par devoir (statut, matière, enseignant, échéance, consignes, appréciation, fichier rendu via `FilePreview`)
- Onglet « Fiches & Supports » : ressources de cours avec bouton « Ouvrir »

### Progression — `/parent/progress`
`src/pages/parent/Progress.tsx`

- 4 indicateurs : moyenne globale, assiduité, heures de cours, progression (%)
- Graphique d'évolution des notes + radar de répartition des compétences
- « Bilan Mensuel Automatique » : commentaires, points faibles, recommandations
- Sections « Matières Maîtrisées » (≥14) et « Objectifs de Progression » (<14)
- « Bilan PDF » → génération et téléchargement d'un rapport complet (`jsPDF`)

### Cockpit enfant — `/parent/children/:id`
`src/pages/parent/ChildCockpit.tsx`

- Fiche : avatar, email, niveau, moyenne, sessions du mois, matière de focus
- « Dossier Académique Complet » → `/parent/academic-file`
- Graphique d'évolution des notes, 5 dernières évaluations/quiz, 5 derniers devoirs
- « Conseils & Observations Pédagogiques » : avis des enseignants (étoiles + commentaires)
- « Contacter Tuteur » et « Bilan PDF » (en-tête) sans handler câblé visible *(non câblé)*

### Factures — `/parent/invoices`
`src/pages/parent/Invoices.tsx`

- 4 indicateurs : total réglé, solde en attente, volume de factures, nombre d'enfants inscrits
- Tableau des factures (référence, date, description, montant, statut)
- « Télécharger » (facture payée) → PDF détaillé (`jsPDF`, `downloadInvoicePDF`)
- « Payer », « Régler Maintenant », « Rapport Annuel », « Moyens de Paiement » sans handler câblé visible *(non câblé)*

### Avis profs — `/parent/feedback`
`src/pages/parent/Feedback.tsx`

- Dépôt d'avis (`TeacherFeedbackForm`) : sélection de l'enseignant, notation, commentaire
- Palmarès des enseignants (`TeacherRatingsBoard`), mise en évidence de l'enseignant de l'enfant

### Messages — `/parent/messages`
`src/pages/parent/Messages.tsx`

- Liste des contacts avec recherche, sélection pour ouvrir la conversation
- Rafraîchissement automatique toutes les 5s, marquage lu automatique
- Envoi de texte et de pièce jointe (aperçu image ou lien document)
- Boutons Appel / Vidéo / Info décoratifs (sans handler câblé) *(non câblé)*

---

## Élève

Cours, devoirs, quiz, progression et échange avec les enseignants.

### Tableau de bord — `/student`
`src/pages/student/Dashboard.tsx`

- Moyenne générale, objectif visé, niveau scolaire, sessions du mois
- Gamification : grade actuel, XP courant/prochain palier, barre de progression
- Graphique d'évolution des notes
- 3 prochains cours avec « Rejoindre » → `/virtual-class/:id`
- Raccourcis : « Agenda complet », « Ma leçon », « Lancer un Quiz »
- Classement « Champions » (leaderboard élèves par XP)
- Bloc « Mot du Tuteur » → « Message » vers la messagerie

### Mon Planning — `/student/schedule`
`src/pages/student/Schedule.tsx`

- Recherche des sessions par matière ou enseignant
- Agenda : jour, date, heure, matière, enseignant, lieu
- « Rejoindre » (session en ligne à venir) → `/virtual-class/:id`
- « Résumé » (session passée) → modale de compte-rendu, avec « Télécharger » en PDF (`jsPDF`)
- Widget « Volume horaire » de la semaine

### Mes Professeurs — `/student/teachers`
`src/pages/student/Teachers.tsx`

- Liste des tuteurs/enseignants assignés (badge « Tuteur Référent »), sessions effectuées, note moyenne, coordonnées
- « Discuter » → messagerie avec contact pré-sélectionné

### Mes Messages — `/student/messages`
`src/pages/student/Messages.tsx`

- Contacts (enseignants + historique), recherche, filtres par rôle (Tous / Enseignant / Conseiller)
- Fil de discussion, pièces jointes, marquage lu automatique
- Envoi texte (Entrée ou bouton), rafraîchissement auto (10s)

### Mes Devoirs — `/student/homework`
`src/pages/student/Homework.tsx`

- Recherche par titre/matière ; compteurs À faire / En attente / Terminés
- « Déposer » un devoir (drag & drop ou clic, PDF/PNG/JPG max 10 Mo) → `uploadHomeworkFile`
- « Correction » (devoir corrigé) → modale avec consigne, fichier déposé, retour du professeur
- « Ouvrir le chat » → messagerie

### Tests & Quiz — `/student/quizzes`
`src/pages/student/Quizzes.tsx`

- Recherche par titre/matière ; liste des quiz issus des cours, meilleur score obtenu
- Lecteur de quiz (`QuizPlayer`) : sélection de réponse, navigation, confirmation d'abandon, soumission finale → `submitQuizAttempt`
- « Derniers résultats » (5 dernières tentatives)

### Mes Cours — `/student/courses`
`src/pages/student/Courses.tsx`

- Recherche, filtres par onglet (Tous / En cours / Terminés / Favoris)
- Ajout/retrait en favoris → `addCourseBookmark` / `removeCourseBookmark`
- Bloc « Reprendre » la dernière activité
- Lecteur de cours (`CourseViewer`) : navigation entre leçons, progression enregistrée (`updateCourseProgress`), « Marquer comme terminée », « Passer le Test », « Rejoindre la Classe » (mode en ligne)

### Progression Académique — `/student/progress`
`src/pages/student/Progress.tsx`

- Moyenne trimestrielle, graphique d'évolution par matière
- Historique des évaluations avec « Contester » par ligne → modale motif + `submitGradeDispute`
- Résumé global (participation, assiduité, devoirs), objectif du mois
- Diagnostic initial et plan pédagogique (si disponibles), en lecture

### Historique des cours — `/student/history`
`src/pages/student/History.tsx`

> Page purement consultative : date, matière, enseignant, horaires, rapport du professeur, note de compréhension (étoiles), devoir associé. Aucune action d'écriture.

### Bibliothèque — `/student/resources`
`src/pages/student/Resources.tsx`

- Recherche, filtres par matière et par niveau
- Ouverture/téléchargement (incrémente le compteur) → `PATCH /api/resources/:id/download`
- Métadonnées : type (PDF/vidéo/lien/image), matière, niveau, description, professeur, nombre d'ouvertures

---

## Enseignant

Cours, planning, devoirs, classe virtuelle et revenus.

### Tableau de bord — `/teacher`
`src/pages/teacher/Dashboard.tsx`

- KPIs : heures du mois, apprenants actifs, moyenne globale, note moyenne, sessions totales
- « Actions Prioritaires » : corrections en attente et rapports de séance en attente (cliquables)
- 3 prochaines séances, apprenants récents
- Raccourcis : Agenda, Nouveau Devoir, Gérer mes Cours, Profil Tuteur, Statistiques Gains

Données via `fetchTeacherDashboard(userId)`.

### Mon Emploi du Temps — `/teacher/schedule`
`src/pages/teacher/Schedule.tsx`

- Vue hebdomadaire + historique complet
- « Nouvelle séance » : élèves (multi), matière, cours rattaché (obligatoire), date/heure, type présentiel (adresse) ou en ligne (lien Jitsi auto), récurrence hebdomadaire (1-12 séances) → `createSession`
- « Démarrer » (check-in) → `sessionCheckIn` ; « Clôturer » (check-out) → `sessionCheckOut`
- Modale de clôture : rapport de cours (obligatoire), leçon abordée, note de compréhension (1-5 émoji), devoir lié optionnel → `POST /sessions/:id/report` puis `POST /homework`
- « Rejoindre » une classe virtuelle → `/virtual-class/:sessionId`
- Consultation du bilan d'une séance terminée (lecture)

### Mes Apprenants — `/teacher/students`
`src/pages/teacher/Students.tsx`

- Recherche par nom ; liste avec niveau, moyenne, date de dernière séance
- Détail : assiduité, nombre de devoirs, coordonnées
- « Voir le dossier » → modale `AcademicFile` (dossier académique complet)
- « Envoyer un message » sans handler câblé dans ce composant *(non câblé)*

### Gestion des Devoirs — `/teacher/homework`
`src/pages/teacher/Homework.tsx`

- Stats : assignés, à faire, rendus, en retard ; recherche et filtres par statut
- « Créer un devoir » : élève, matière, titre, description, échéance → `POST /homework`
- Marquer « rendu » directement depuis la liste
- Corriger un devoir rendu (commentaire obligatoire) → `PATCH /homework/:id` (statut corrigé + feedback)
- Indicateur « lié à une séance » si issu d'une clôture de séance live

### Mes Cours — `/teacher/courses`
`src/pages/teacher/Courses.tsx`

- Recherche, création, édition (clic sur la carte)
- Onglet Informations : titre, matière, niveau, mode (présentiel/en ligne/hybride), tarif horaire, durée, description
- Onglet Leçons : ajout/suppression, édition (titre, contenu/objectifs, lien vidéo optionnel)
- Enregistrer en brouillon ou Publier → `createCourse` / `updateCourse` + synchro des leçons
- Supprimer un cours (avec confirmation) → `deleteCourse`

### Messages — `/teacher/messages`
`src/pages/teacher/Messages.tsx`

- Contacts (élèves/parents) avec recherche, fil de messages avec polling 5s
- Envoi de texte et de pièce jointe (aperçu image), marquage lu automatique

### Ressources Pédagogiques — `/teacher/resources`
`src/pages/teacher/Resources.tsx`

- Filtrage par matière ; « Mes ressources » (suppression possible) vs « Bibliothèque partagée » (lecture seule)
- Ajouter une ressource (titre, description, matière, niveau, type, upload ou URL) → `POST /resources`
- Ouvrir/télécharger (incrémente le compteur) → `PATCH /resources/:id/download` ; supprimer → `DELETE /resources/:id`

### Mes Revenus — `/teacher/earnings`
`src/pages/teacher/Earnings.tsx`

- Total perçu, graphique de l'historique mensuel des gains
- Barème (tarif standard, sessions validées, mode de calcul), tableau des transactions
- « Exporter » présent mais sans handler câblé *(non câblé)*

### Mon Profil — `/teacher/profile`
`src/pages/teacher/Profile.tsx`

- Upload avatar → `uploadUserAvatar`
- Onglet Infos Personnelles : nom, téléphone, localisation, bio
- Onglet Paiement & RIB : établissement/Mobile Money, coordonnées
- Onglet Sécurité & Accès : information changement mot de passe, 2FA *(bouton non câblé)*
- « Enregistrer » → `updateUserProfile`

### Classe Virtuelle — `/virtual-class/:sessionId`
`src/pages/common/VirtualClassroom.tsx` — route non restreinte par rôle

- Visioconférence Jitsi Meet : audio/vidéo, partage d'écran, chat, lever la main, mosaïque, plein écran, participants
- Check-in / check-out automatique à la connexion/déconnexion (enseignant) → `sessionCheckIn` / `sessionCheckOut`, ouvre le rapport de session au départ
- Notes collaboratives en temps réel (synchro debouncée)
- Tableau blanc collaboratif (dessin, gomme, couleurs), synchronisé
- Éditeur de code partagé (« Sandbox »), synchronisé
- « Terminer » la session manuellement (enseignant)
- « Assigner un devoir » (enseignant) → modale titre/description/échéance → `createHomework`
- Modale « Rapport de Session » : leçon dispensée, rapport, note de compréhension (/20), note d'assiduité (étoiles), commentaire → `submitSessionReport`
- « Export PDF » présent (`jsPDF` importé) mais sans handler câblé *(non câblé)*

---

## Tuteur

Recrutement et évaluation des candidats enseignants — avec, si double rôle, l'accès complet à l'espace Enseignant.

### Tableau de bord — `/tutor`
`src/pages/tutor/Dashboard.tsx`

- 4 cartes : candidatures en attente, entretiens planifiés, approuvés, évaluations
- Tableau « Candidatures récentes » : candidat, matières, expérience, statut, date

> Lecture seule. Données via `GET /tutor/dashboard`.

### Candidatures profs — `/tutor/applications`
`src/pages/tutor/TeacherApplications.tsx`

**Onglet Entretien**
- Formulaire date/heure + notes préparatoires → `PATCH /teacher-applications/:id/interview`
- Affichage de l'entretien déjà planifié

**Onglet Rapport d'évaluation**
- 3 scores 1-5 : Pédagogie, Ponctualité, Communication
- Classification niveau/matière (cases Primaire/Collège/Lycée par matière déclarée)
- Recommandation finale : Approuver / Formation / Refuser → statut mis à jour automatiquement (`PATCH /teacher-applications/:id`)
- Champ observations, « Soumettre l'évaluation » → `POST /tutor-evaluations`

### Espace Enseignant — `/tutor/enseignant/*`
Réutilise exactement les composants de `src/pages/teacher/`

Si l'utilisateur porte le `secondaryRole` « teacher », le menu affiche une
seconde section « Espace Enseignant » qui pointe vers les mêmes 8 composants
physiques que le rôle Enseignant — aucune duplication de code. Toutes les
fonctions sont identiques à celles listées dans la section
[Enseignant](#enseignant) ci-dessus.

- `enseignant` → Dashboard
- `enseignant/schedule` → Planning + création de séance + clôture pédagogique
- `enseignant/students` → Mes élèves + dossier académique
- `enseignant/homework` → Devoirs (création, correction)
- `enseignant/courses` → Cours & Quiz (création, édition, publication)
- `enseignant/messages` → Messagerie
- `enseignant/resources` → Ressources pédagogiques
- `enseignant/earnings` → Revenus

### Profil — `/tutor/profile`
`src/pages/tutor/Profile.tsx` → ré-export direct de `src/pages/teacher/Profile.tsx`

- Mêmes fonctions que le profil enseignant (avatar, infos personnelles, paiement/RIB, sécurité)
- Badge dynamique : « Tuteur Vérifié » + « Enseignant » si double rôle, sinon badge simple selon le rôle réel

> Route accessible directement par URL, absente du menu de navigation.
