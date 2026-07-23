# Couverture unitaire — Conseiller

Périmètre : `docs/CARTOGRAPHIE_FONCTIONNELLE.md`, section Conseiller.
État : suite intégralement verte (7 fichiers, toutes les pages du rôle).

| Page | Fichier de test | Statut |
|---|---|---|
| Tableau de bord | `src/pages/advisor/Dashboard.test.tsx` | ✅ couvert |
| Mes familles (Notes/Diagnostic/Plan/Matching) | `src/pages/advisor/Families.test.tsx` | ✅ couvert |
| Matching | `src/pages/advisor/Matching.test.tsx` | ✅ couvert |
| Candidatures profs | `src/pages/advisor/TeacherApplications.test.tsx` | ✅ couvert |
| Bilans pédagogiques | `src/pages/advisor/Reports.test.tsx` | ✅ couvert |
| Messagerie | `src/pages/advisor/Messages.test.tsx` | ✅ couvert |
| Tâches & RDV | `src/pages/advisor/Schedule.test.tsx` | ✅ couvert |

## Boutons non câblés documentés (page Bilans)
- "Nouveau bilan"
- "Modifier le bilan" / "Continuer la rédaction"
- "Envoyer au parent"
- "Traiter" (demande de bilan à traiter)

## Corrections effectuées lors de la reprise (fichiers de test uniquement)
- `Matching.test.tsx` : correction d'un test de désélection (mock/sélecteur).
- `Messages.test.tsx` : correction des tests d'envoi de message texte et de
  pièce jointe (timing/mise à jour optimiste).
- `Reports.test.tsx` : test du bouton non câblé "Continuer la rédaction"
  corrigé pour documenter fidèlement l'absence de handler.

## Écarts constatés
Aucun écart applicatif au-delà des boutons non câblés déjà documentés dans
la cartographie.
