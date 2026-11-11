---
tags: [ai, agent, engineering, outils, workflows, mcp, boucle]
---

# Agent Engineering — piloter l'IA en confiance (fiche du jour)

> **Définition rookie :** l'Agent Engineering, c'est **l'art de mettre en place un agent IA fiable** : lui donner les bons outils (erreurs, logs, navigation), des schémas de validation, et surtout une **boucle de vérification** pour qu'il ne fasse pas n'importe quoi. En résumé : transformer un « chatbot qui cause » en « collègue qui livre ».

**Analogie :** l'agent, c'est un stagiaire ultra-motivé mais qui hallucine parfois. L'agent engineering, c'est son encadrement : un bureau (interface), des outils de contrôle sur son poste (erreurs/logs), des feuilles d'instructions (skill.md) et un rituel de relecture avant chaque livrable (les boucles).

## 1. Les interfaces : où vit l'agent

| Interface | Exemple | Pourquoi |
|-----------|---------|----------|
| **Desktop** | app graphique (comme notre [[concepts]]-lecteur, VSCode/GPT assistants) | visuel, souris, tâches lourdes |
| **Web** | interface navigateur, SaaS | accessible, déploiement distant, partagé |
| **TUI** (Terminal UI) | `opencode`, `aider`, agents CLI | économe (ton choix !), scriptable, `.md` natif |

Le même agent peut exister sur plusieurs interfaces. Le choix est une question de **ressources et de contexte** : le TUI est le plus léger, c'est celui de la bibliothèque.

## 2. L'environnement vérifié : les outils de contrôle d'erreur

Un agent qui écrit mais **ne vérifie jamais** est un danger. On lui donne donc des outils de **preuve** en boucle :

```text
outils de check_erreur :
├── linter (lint)          → style/erreurs grossières (ruff, eslint, clippy)
├── error checker          → test de démarrage (ast.parse, mypy, node --check)
├── logs                   → observer l'exécution réelle (notre /tmp/*.log)
├── scripts de vérif       → nos verif.sh, boot-test.js (une commande = verdict)
├── navigation             → lire/parcourir les fichiers avant d'écrire
└── MCP                    → les serveurs d'outils standardisés (voir §3.1)
```

**Le principe** : avant de considérer une tâche faite, l'agent **lance la preuve** — et si elle échoue, il corrige et re-teste. C'est exactement notre `verif.sh` dans la bibliothèque.

### 3.1 Le MCP en vitesse

**MCP** (Model Context Protocol) = un standard qui connecte une IA à des outils/ressources (système de fichiers, base de données, navigateur, web) via des petits **serveurs d'outils**. Au lieu d'un connecteur maison par outil, un protocole commun : l'agent découvre les outils disponibles, les appelle, lit leurs retours. C'est le « port USB » des agents — une prise unique pour tous les périphériques.

## 3. Les schémas de validation

Un agent libre de tout choix produit du n'importe-quoi. On **contraint** les sorties importantes avec des schémas :

```json
// exemple de schéma (JSON Schema) imposé à l'agent
{
  "type": "object",
  "required": ["composant", "risque", "fix"],
  "properties": {
    "composant":  { "type": "string" },
    "risque":     { "enum": ["faible", "moyen", "eleve", "critique"] },
    "fix":        { "type": "string" }
  }
}
```

Règle : **toute sortie qui devient une entrée** (structurée, lue par un autre outil) passe par un schéma. Le texte libre est réservé au chat ; les données vont dans le moule.

## 4. Les boucles (loops) — le cœur de l'agent

Un agent n'est pas un coup de prompt : c'est une **boucle** jusqu'à verdict vert :

```text
1. PLAN         → comprendre la tâche, lire le contexte
2. AGIR         → modifier les fichiers / exécuter
3. VÉRIFIER     → linter, error checker, logs, scripts (la PREUVE)
4. CORRIGER     → si rouge : diagnostiquer, ajuster
5. RECOMMENCER  → jusqu'au verdict vert (avec une limite !)

PLUS de boucle = répéter 3-4 jusqu'à succès, jamais indéfiniment.
```

C'est la même logique que la méthode de dépannage → [[troubleshooting]]. Sans boucle : l'agent livre des erreurs avec assurance. Avec boucle : il livre des erreurs **corrigées**.

## 5. `skill.md` — les procédures réutilisables

Une **skill** = un fichier Markdown (parfois + des scripts) qui documente **comment** accomplir une tâche type. L'agent la charge au besoin.

```
.skills/
├── verif-systeme/skill.md      # "avant de livrer : lancer verif.sh, node --check…"
├── creation-fiche/skill.md     # "pour créer une fiche du jour : structure type"
└── release/skill.md            # "étapes de mise en production en ordre"
```

skill.md = la **mémoire procédurale** de l'agent : pas besoin de ré-expliquer à chaque fois, il « sait » déjà comment tu travailles. Comme AGENTS.md pour les projets, les skills vivent **dans ton dépôt** et voyagent avec lui.

## 6. Routines / loops pour les tâches répétitives

Les tâches répétitives deviennent des **routines** : un même enchaînement lancé à chaque fois identiquement.

```
routine(GENERER_FICHE) =
  1. lire la structure d'une fiche existante (modèle)
  2. recopier le squelette (frontmatter, sections)
  3. remplir avec le contenu du jour
  4. vérifier : fences équilibrées + rendu serveur + noeud dans le graphe
  5. relire et relier ([[wikilinks]])
```

Pourquoi : une routine **standardise le résultat** (le même moule à chaque fiche) et **réduit les erreurs** (on ne réinvente pas le processus à chaque fois). Le cerveau reconnaît les fiches au premier coup d'œil.

## 7. Le contexte AVANT la méthode de création

Le secret le plus cité : **préparer le contexte avant de laisser écrire quoi que ce soit**.

```
avant de créer/écrire :
  ✅ lis l'existant (structure, style)     → la règle : mimiquer les conventions
  ✅ parfois aussi des agents dédiés       → voir §8
  ✅ pose les limites et la portée         → quoi NE PAS toucher
  ✅ fournis le modèle/la cible            → un exemple de sortie attendue
  ↔ lancement de la phase de création      → l'agent produit au bon format
```

Contexte manquant = l'agent invente les règles → il faut tout refaire. Contexte posé = il produit du conforme **du premier coup** — et la boucle devient un filet, plus un travail de recommencement.

## 8. Remote control / multi-agents

Des projets complexes se découpent en **agents spécialisés** qui s'envoient des tâches :

```
[planificateur] ──► [agent 1 : analyse]
        │             [agent 2 : implémentation]
        └────────────► [agent 3 : vérification / tests]
```

Le remote control permet : déléguer des tâches parallèles, monter/suivre un agent sur une machine distante, un chef d'orchestre qui supervise les résultats. Le tout : **chaque agent rend un livrable qu'un autre vérifie** — la confiance s'obtient par chaîne de contrôle, pas par foi.

## 9. Documentation — le contrat silencieux

- **AGENTS.md / skill.md** : les règles du projet que l'agent doit suivre (c'est lui qui les lit).
- **Journal** : ce que l'agent a fait, pourquoi, les retournements — pour toi dans 3 mois, et pour les futurs agents.
- **Le README du processus** : comment relancer la routine, où sont les verifs, quelle est la structure.

Penser : « si quelqu'un/une IA reprend ce projet demain, peut-elle savoir COMENT refaire sans un coup de fil ? » → c'est la documentation qui répond, pas la mémoire.

## 10. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Fais-le » sans contexte ni modèle | L'agent invente le style, la structure, les règles → à refaire |
| Pas de vérification en boucle | Une erreur livrée avec assurance pèse 2 fois plus lourd |
| Boucle illimitée (l'agent tourne en rond) | Toujours un **budget d'itérations** : au-delà, arrêter et reposer le problème |
| Schéma facultatif | Sortie structurée non validée = données cassées en aval |
| Skill jamais mise à jour | Une routine obsolète reproduit fidèlement… la mauvaise méthode |
| Un seul gros agent pour tout | Multi-agents + vérification croisée gagnent sur les projets complexes |
| Ignorer les logs du travail | Les logs sont la preuve de ce qui s'est passé : on vérifie ce qu'on n'a pas vu faire |

## 11. En une ligne

> L'agent engineering = **donner au stagiaire l'IA une chaise (interface), des notes (contexte), un mètre (schémas), des règles de métier (skills) et un inspecteur (boucles de vérif)** — alors, et alors seulement, il livre.

*Liens logiques : les bases de l'agent (outils + boucle) → [[concepts]] · la boucle identifier/tester/résoudre → [[troubleshooting]] · l'architecture que l'agent doit respecter → [[system-building]] · et la preuve d'exécution se relit dans les logs → [[ntp]] (une heure juste, des logs exploitables)*