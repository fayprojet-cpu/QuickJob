# 📦 Livrables

Ce dossier centralise **tout ce que je produis pour toi**. Chaque
sous-dossier correspond à un **thème** ; à l'intérieur, chaque **projet**
a son propre dossier.

## Organisation

| Dossier         | Contenu                                                          |
|-----------------|------------------------------------------------------------------|
| `sites-web/`    | Sites internet : landing pages, sites vitrines, front-ends       |
| `applications/` | Outils, scripts, automatisations                                 |
| `youtube/`      | Briefs vidéos, scripts, hooks, calendrier éditorial              |
| `cabinet/`      | Livrables pour le cabinet de conseil **Chatflow**                |
| `ecole/`        | Livrables pour **Adreneur Académie**                             |

## Le flux : inputs → livrables

- **Inputs** — les documents que **tu me fournis** (briefs, notes, exports,
  captures, accès…) → `context/import/<thème>/<projet>/`
- **Livrables** — ce que **je produis pour toi** →
  `livrables/<thème>/<projet>/`

Autrement dit : tu déposes la matière première dans `context/import/`, je te
rends le résultat fini dans `livrables/`, dans le même thème et sous le même
nom de projet, pour que les deux se répondent.

## Convention de nommage des projets

Un dossier par projet, nommé ainsi :

```
AAAA-MM_nom-du-projet
```

- `AAAA-MM` — année et mois de démarrage (ex. `2026-09`)
- `nom-du-projet` — court, en minuscules, mots séparés par des tirets
  (kebab-case), **sans accents ni espaces**

Exemples :

- `livrables/sites-web/2026-09_landing-chatflow/`
- `livrables/youtube/2026-09_serie-lancement/`
- `livrables/cabinet/2026-09_audit-process-client-x/`

Le dossier d'inputs correspondant porte exactement le même nom :

- `context/import/sites-web/2026-09_landing-chatflow/`

## Contenu type d'un dossier projet

```
2026-09_nom-du-projet/
├── README.md      # objectif, statut, historique des versions
└── ...            # les fichiers livrés
```

Garde des versions lisibles (`v1`, `v2`, `final`) plutôt que d'écraser
silencieusement les fichiers.
