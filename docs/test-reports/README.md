# Rapports de couverture — jeu de rôle multi-agents

- `unit/<role>.md` — un fichier par agent-acteur (`admin`, `advisor`,
  `parent`, `student`, `teacher`, `teacher-as-tutor`, `tutor`), tableau
  fonction × statut (couvert / partiel / manquant), produit à l'issue de la
  phase unitaire.
- `RAPPORT_GLOBAL.md` — consolidation finale : couverture par rôle,
  scénarios d'intégration couverts/manquants (`scenario-director`), failles
  de sécurité priorisées (`security-boundary-tester`), tickets ouverts pour
  `hotfix-bugfix-dev`.

Ce dossier est généré par l'équipe d'agents-testeurs ; ne pas éditer les
fichiers `unit/*.md` à la main, ils sont écrasés à chaque exécution.
