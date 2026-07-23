# Bibliothèque de scénarios — jeu de rôle multi-agents

Chaque fichier `NN-<slug>.yaml` décrit un scénario dérouché par
`scenario-director` (voir `.claude/agents/scenario-director.md`). Source de
vérité fonctionnelle : `docs/CARTOGRAPHIE_FONCTIONNELLE.md`.

## Schéma

```yaml
id: string                       # identifiant unique, préfixé par le numéro
titre: string
reference_cartographie: [string] # sections exactes de la cartographie concernées
description: string

seed:                            # état de données à préparer avant le scénario
  - entite: string
    ...

etapes:
  - numero: int
    acteur: actor-<role>          # agent-acteur qui exécute cette étape
    variante_alternative_acteur: actor-<role>  # optionnel, si plusieurs rôles peuvent jouer l'étape
    parametre: string             # optionnel, ex: "actingAs: tutor-secondary-role"
    action: string                # ce qui est exécuté, avec le handler/endpoint réel
    resultat_attendu: string
    verifier_ensuite:             # rôles à invoquer en LECTURE SEULE après l'étape
      - role: actor-<role>
        endroit: string           # page/composant où vérifier
        attendu: string

echec_type: [string]              # symptômes concrets qui constituent un échec
ticket_hotfix_si_echec:
  titre: string                   # peut contenir des {placeholders}
  inclure: [string]               # champs à joindre au ticket hotfix-bugfix-dev
```

## Règles

- Un scénario ne doit jamais faire jouer à un acteur une capacité absente de
  sa section dans la cartographie — si le scénario spécifié semble
  l'exiger, c'est le scénario qui est faux, pas l'acteur qui doit improviser.
- `verifier_ensuite` est toujours en lecture seule : aucune écriture lors de
  la vérification croisée.
- Toute étape touchant un schéma MySQL doit être signalée par
  `scenario-director` avant exécution, jamais exécutée seule.
