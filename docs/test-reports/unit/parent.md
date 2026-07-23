# Couverture unitaire — Parent

Périmètre : `docs/CARTOGRAPHIE_FONCTIONNELLE.md`, section Parent.
État : suite intégralement verte — `npm run test:ui -- --run src/pages/parent`
→ 10 fichiers de test, 75 tests, tous passés.

| Capacité (cartographie) | Fichier de test | Statut |
|---|---|---|
| Tableau de bord (sélecteur d'enfant, `fetchParentOverview`, `fetchParentProgress`, `fetchScheduleByRole`) | `src/pages/parent/Dashboard.test.tsx` | ✅ couvert |
| Mes Enfants (`fetchChildrenByParent`, navigation Planning/Cockpit) | `src/pages/parent/Children.test.tsx` | ✅ couvert |
| Équipe Pédagogique ("Discuter" toast, lien `mailto:`) | `src/pages/parent/Team.test.tsx` | ✅ couvert |
| Planning (filtrage par enfant, "Rapport", "Avis" → `POST /api/session-feedback`) | `src/pages/parent/Schedule.test.tsx` | ✅ couvert |
| Devoirs (lecture `fetchHomework("parent")`, `fetchLessonResources("parent")`) | `src/pages/parent/Homework.test.tsx` | ✅ couvert |
| Progression (`fetchParentOverview`, `fetchProgressReport`, "Bilan PDF" `jsPDF`) | `src/pages/parent/Progress.test.tsx` | ✅ couvert |
| Cockpit enfant (`fetchUserProfile`, `fetchParentProgress`, `fetchStudentQuizAttempts`, `fetchStudentHomework`, `fetchStudentEvaluations`) | `src/pages/parent/ChildCockpit.test.tsx` | ✅ couvert |
| Factures (`fetchParentInvoices`, "Télécharger" → `downloadInvoicePDF`) | `src/pages/parent/Invoices.test.tsx` | ✅ couvert |
| Avis profs (`TeacherFeedbackForm` rôle "parent" → `submitTeacherFeedback`, classement `fetchTeacherRatings` via `TeacherRatingsBoard`) | `src/pages/parent/Feedback.test.tsx` | ✅ couvert (nouveau) |
| Messages (`fetchParentContacts`, `fetchMessages`, `sendMessage`, `uploadMessageAttachment`, `markMessageAsRead`) | `src/pages/parent/Messages.test.tsx` | ✅ couvert (nouveau) |

Soit **10/10 capacités de la section Parent** couvertes par des tests unitaires
co-localisés (Vitest + Testing Library, appels réseau systématiquement
mockés via `vi.spyOn(backoffice, ...)`).

## Détail des deux capacités ajoutées dans cette passe

### Avis profs (`Feedback.test.tsx`, 8 tests)
- Succès : affichage du formulaire pré-rempli avec l'enseignant issu du
  planning + classement (`TeacherRatingsBoard`).
- Succès : soumission d'un avis (note + commentaire) via
  `submitTeacherFeedback` avec `reviewerType: "parent"`.
- Succès : la note (étoiles 1-5) est modifiable avant soumission.
- Champs obligatoires : le commentaire est optionnel dans le schéma zod du
  formulaire (`comment: z.string().max(500).optional()`) — la note par
  défaut (5) suffit à soumettre.
- Validation échouée : sans enseignant planifié, le formulaire affiche un
  message et n'appelle jamais l'API.
- Erreur réseau : toast d'erreur si `submitTeacherFeedback` échoue.
- Données vides / erreur réseau sur le classement : `TeacherRatingsBoard`
  dégrade gracieusement (message "Audit de satisfaction non disponible").

### Messages (`Messages.test.tsx`, 11 tests)
- Succès : liste des contacts (enseignants/conseillers) via
  `fetchParentContacts`.
- Succès : sélection d'un contact → chargement du fil (`fetchMessages`) et
  marquage automatique en lu (`markMessageAsRead`) des seuls messages reçus
  non lus (le message déjà lu ou envoyé par le parent n'est pas re-marqué).
- Succès : envoi d'un message texte via `sendMessage`, champ vidé après
  succès.
- Champ obligatoire : un message vide ou uniquement composé d'espaces
  n'appelle pas `sendMessage` (garde côté `handleSend`).
- Succès : envoi d'une pièce jointe (`uploadMessageAttachment` puis
  `sendMessage` avec `attachmentUrl`).
- Erreur réseau : toast d'erreur ("Erreur de téléchargement") si l'upload
  de la pièce jointe échoue, sans appel à `sendMessage`.
- Erreur réseau : dégradation propre si `fetchParentContacts` échoue (liste
  vide affichée).
- Données vides : message d'accueil invitant à sélectionner un contact.
- Boutons non câblés : trois tests dédiés (Appel/Vidéo/Info) vérifiant
  `button.onclick === null` sur les icônes `Phone`, `Video`, `Info` de
  l'en-tête de conversation.

## Boutons non câblés documentés (Parent) — couverts par un test dédié
- "Contacter" (Mes Enfants) — `Children.test.tsx`
- "Contacter un conseiller" (Mes Enfants) — `Children.test.tsx`
- "Contacter Tuteur" (Cockpit, en-tête) — `ChildCockpit.test.tsx`
- "Bilan PDF" (Cockpit, en-tête) — `ChildCockpit.test.tsx`
- "Payer" (Factures) — `Invoices.test.tsx`
- "Régler Maintenant" (Factures) — `Invoices.test.tsx`
- "Rapport Annuel" (Factures) — `Invoices.test.tsx`
- "Moyens de Paiement" (Factures) — `Invoices.test.tsx`
- "Appel" (Messages, icône `Phone`) — `Messages.test.tsx` (nouveau)
- "Vidéo" (Messages, icône `Video`) — `Messages.test.tsx` (nouveau)
- "Info" (Messages, icône `Info`) — `Messages.test.tsx` (nouveau)

Chaque test vérifie l'absence de handler (`onclick === null`) : il échouera
si un handler apparaît un jour sans mise à jour correspondante de
`docs/CARTOGRAPHIE_FONCTIONNELLE.md`.

## Écarts constatés
Aucun écart applicatif rencontré sur les deux capacités ajoutées : le
comportement observé (formulaire d'avis désactivé sans enseignant planifié,
garde sur message vide, absence de handler sur Appel/Vidéo/Info) correspond
exactement à la cartographie. Aucune action hors périmètre Parent n'a été
demandée durant cette passe ; aucun refus n'a donc été nécessaire.

Note technique (sans impact fonctionnel) : les mutations `useMutation`
(`@tanstack/react-query`) invoquent leur `mutationFn` avec un second
argument de contexte interne (`{ client, meta, mutationKey }`). Les
assertions `toHaveBeenCalledWith` ont donc été remplacées par des
vérifications sur `mock.calls[0][0]` (`toMatchObject`) pour cibler
uniquement le payload métier, sans changer la portée fonctionnelle testée.

## Reste à faire
Aucun — les 10 capacités de la section Parent de la cartographie sont
désormais couvertes.
