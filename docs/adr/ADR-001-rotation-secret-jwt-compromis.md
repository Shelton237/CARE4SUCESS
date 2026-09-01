# ADR-001 — Traitement du secret JWT versionné et compromis

- Statut : proposé (attente validation humaine)
- Date : 2026-07-22
- Contexte audit : `docs/audits/AUDIT_2026-07-22.md` [B1] · ticket backlog T-01

## Contexte

Le fichier `store.prod.env.fix` est **suivi par git** (confirmé via `git ls-files`,
introduit au commit `fcfa00f`) et contient `JWT_SECRET`, `NEXTAUTH_SECRET`, ainsi que
des clés Stripe/Cloudinary. Le secret est donc dans l'historique : le supprimer
aujourd'hui ne l'efface pas du passé — tout clone conserve le blob.

## Options considérées

1. **Supprimer le fichier du HEAD seulement** — simple, mais le secret reste
   extractible dans l'historique. Insuffisant seul.
2. **Rotation des secrets + suppression du HEAD** — invalide les valeurs fuitées
   (le blob historique devient inexploitable car les secrets ne sont plus valides).
   Rapide, non destructif, sans réécriture d'historique.
3. **Rotation + purge d'historique (BFG / git filter-repo + force-push)** — nettoie
   aussi le passé, mais réécrit tout l'historique : opération **destructive et
   irréversible**, casse les clones/forks existants, nécessite coordination d'équipe.

## Décision

Priorité à l'**option 2** : **rotation immédiate** de tous les secrets présents dans le
fichier (nouveau `JWT_SECRET`/`NEXTAUTH_SECRET` côté serveur PM2, régénération des clés
Stripe/Cloudinary si encore actives), puis retrait du fichier du dépôt et ajout au
`.gitignore`. La rotation neutralise le risque quel que soit l'état de l'historique.

L'**option 3 (purge d'historique)** est recommandée en complément mais **non exécutée
sans confirmation humaine explicite** (contrainte non négociable : force-push =
action destructive). Décision d'exécution laissée à l'utilisateur.

## Conséquences

- Les tokens JWT existants sont invalidés à la rotation → re-login des utilisateurs.
- Tant que la purge n'est pas faite, le secret **fuité mais rotationné** reste visible
  dans l'historique mais inexploitable — acceptable à court terme.
- Vérifier qu'aucun autre service ne réutilise les anciennes valeurs avant rotation.
