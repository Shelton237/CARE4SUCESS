# Infrastructure de test d'intégration — scenario-director

Base de données de test déjà provisionnée, **sans Docker** : instance MySQL
locale existante (WampServer, `C:\wamp64`, MySQL 9.1.0, port 3306), qui héberge
déjà plusieurs bases de projets différents sur cette machine. Une base et un
utilisateur **dédiés et isolés** ont été créés spécifiquement pour ces tests :

- Base : `care4success_test`
- Utilisateur : `care4success_test` (accès limité à cette seule base)
- Identifiants complets : voir `.env.test` à la racine du dépôt (gitignoré)

Le schéma complet (35 tables) a été initialisé en lançant une fois
`server/index.js` avec ces variables d'environnement — le serveur exécute sa
propre routine d'auto-migration (`initDB`, voir `server/index.js`) qui crée
toutes les tables si elles n'existent pas encore. Pour réinitialiser le
schéma après une casse (migration testée, structure modifiée), il suffit de
relancer le serveur une fois pointé sur `.env.test` : il rejoue les
migrations idempotentes (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE` conditionnels).

## Important : `server/index.js` ne charge PAS `.env.test` automatiquement

Le code de chargement d'environnement (`server/index.js`, tout en haut) est
codé en dur sur `.env.local` puis `.env` — il ne connaît pas `.env.test`.
Pour les tests d'intégration, **charge explicitement `.env.test` dans ton
propre fichier de setup de test**, avant tout import de code applicatif, par
exemple :

```js
// server/__tests__/integration/setup.ts (à créer par scenario-director)
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env.test"), override: true });
```

Alternative en ligne de commande (sans fichier de setup dédié) :

```bash
env $(grep -v '^#' .env.test | xargs) node server/index.js
```

## Règles d'usage

- Ne jamais utiliser `care4success_test` pour autre chose que ces tests —
  ne pas y stocker de données réelles, ne pas la confondre avec `care4success`
  (base de dev réelle présente sur la même instance).
- Seed/reset explicite entre suites de scénarios (voir
  `.claude/agents/scenario-director.md`) : chaque scénario doit repartir d'un
  état connu, jamais de pollution entre exécutions.
- Toute modification de schéma découverte pendant les tests doit être
  signalée avant exécution — ne pas modifier `server/index.js` ni
  `server/schema.sql` sans validation humaine explicite.
- Ce port/hôte/utilisateur sont strictement locaux à cette machine de
  développement — ne jamais les utiliser comme référence pour un
  environnement CI/CD distant (à revoir séparément si une CI est mise en place).
