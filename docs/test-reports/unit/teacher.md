# Couverture unitaire — Enseignant (mode standard)

Périmètre : `docs/CARTOGRAPHIE_FONCTIONNELLE.md`, section Enseignant.
État : suite intégralement verte (10 fichiers, mode standard `/teacher/*` uniquement
— le mode double rôle tuteur `actingAs: 'tutor-secondary-role'` fait l'objet
d'une passe séparée non couverte ici).

| Page | Fichier de test | Statut |
|---|---|---|
| Tableau de bord | `src/pages/teacher/Dashboard.test.tsx` | ✅ couvert |
| Mon Emploi du Temps | `src/pages/teacher/Schedule.test.tsx` | ✅ couvert |
| Mes Apprenants | `src/pages/teacher/Students.test.tsx` | ✅ couvert |
| Gestion des Devoirs | `src/pages/teacher/Homework.test.tsx` | ✅ couvert |
| Mes Cours | `src/pages/teacher/Courses.test.tsx` | ✅ couvert |
| Messages | `src/pages/teacher/Messages.test.tsx` | ✅ couvert |
| Ressources Pédagogiques | `src/pages/teacher/Resources.test.tsx` | ✅ couvert |
| Mes Revenus | `src/pages/teacher/Earnings.test.tsx` | ✅ couvert |
| Mon Profil | `src/pages/teacher/Profile.test.tsx` | ✅ couvert |
| Classe Virtuelle | `src/pages/common/VirtualClassroom.test.tsx` | ✅ couvert |

## Boutons non câblés documentés
- "Envoyer un message" (Mes Apprenants)
- "Exporter" (Mes Revenus)
- "Activer" 2FA (Mon Profil)
- "Export PDF" (Classe Virtuelle)

## Écarts constatés
Aucun écart applicatif majeur signalé au-delà des boutons non câblés déjà
documentés dans la cartographie.

## Reste à faire
- Passe séparée : mêmes capacités en mode `actingAs: 'tutor-secondary-role'`
  (via `/tutor/enseignant/*`), avec vérification du scoping par `userId`.
