---
tags: [security, zero-trust, protect-surface, pam, kipling, architecture, methodologie]
---

# PAM, Protect Surface & méthode Kipling — la démarche Zero Trust (fiche du jour)

> **Définition rookie :** le **Protect Surface** (la surface à protéger) est le cœur du Zero Trust : au lieu de protéger un périmètre entier, on protège **uniquement ce qui compte**. La méthode **PAM** (Protect, Analyze, Monitor/Maintain) et la **méthode Kipling** (les 6 questions) sont les outils pour y arriver.

**Analogie :** le modèle périmétrique (voir [[perimeter-vs-zerotrust]]), c'est protéger toute la ville avec un mur. Le Protect Surface, c'est protéger **seulement la banque, l'hôpital et la centrale** — et ignorer le reste. On ne défend pas tout, on défend **ce qui compte**.

## 1. Le Protect Surface — protéger l'essentiel

### Le concept

Au lieu de protéger un réseau entier (la surface d'attaque complète), on identifie **la surface à protéger** : les données, applications, assets et services (DAAS) qui sont réellement critiques.

```
Surface d'attaque (tout le réseau)          Protect Surface (l'essentiel)
┌─────────────────────────────┐            ┌─────────────┐
│  printers, IoT, guest wifi, │            │  DB clients │
│  dev servers, test env,     │  ──►       │  API prod   │
│  marketing laptops, ...     │            │  secrets    │
└─────────────────────────────┘            └─────────────┘
      tout protéger = impossible              ciblé = faisable
```

**DAAS — les 4 choses à protéger :**

| Lettre | Signification | Exemples |
|--------|--------------|----------|
| **D** | Data | données clients, secrets, PII, propriété intellectuelle |
| **A** | Applications | apps critiques, API, services métier |
| **A** | Assets | serveurs, bases de données, équipements |
| **S** | Services | DNS, authentification, paiement, messagerie |

> **La règle d'or :** on ne protège pas le réseau, on protège **ce qui a de la valeur**. Tout le reste est considéré comme non critique (et donc non défendu avec le même niveau).

## 2. La méthode PAM — Protect, Analyze, Monitor

PAM est la démarche en 3 étapes pour mettre en place le Protect Surface :

### Étape 1 — Protect (identifier et protéger)

1. **Identifier le Protect Surface** : lister les DAAS critiques.
2. **Définir les limites** : où commence et finit la surface à protéger.
3. **Mettre en place la micro-segmentation** : isoler chaque composant du Protect Surface (voir [[perimeter-vs-zerotrust]]).
4. **Appliquer les politiques** : qui peut accéder à quoi, quand, comment.

### Étape 2 — Analyze (comprendre les flux)

1. **Cartographier les flux** : qui parle à qui, quel protocole, quel port, quelle fréquence.
2. **Identifier les dépendances** : quels services dépendent d'autres.
3. **Détecter les anomalies** : flux inhabituels, accès suspects.

### Étape 3 — Monitor/Maintain (surveiller et maintenir)

1. **Monitorer en continu** : logs, SIEM, détection d'anomalies.
2. **Maintenir les politiques** : mettre à jour les règles selon l'évolution.
3. **Recommencer** : le Protect Surface évolue (nouvelles données, nouvelles apps) → re-identifier, re-analyser.

```
Protect ──► Analyze ──► Monitor/Maintain ──► Protect (recommencer)
   │          │              │                    │
   ▼          ▼              ▼                    ▼
identifier  cartographier   surveiller         re-identifier
protéger    les flux       maintenir          re-protéger
```

## 3. La méthode Kipling — les 6 questions

La méthode Kipling vient du poème de **Rudyard Kipling** (« I keep six honest serving-men ») : les 6 questions qui permettent de **tout** comprendre. En Zero Trust, on les utilise pour définir le Protect Surface et les flux.

```
I keep six honest serving-men
(They taught me all I knew);
Their names are What and Why and When
And How and Where and Who.
```

| Question | En Zero Trust, on demande… | Exemple |
|----------|---------------------------|---------|
| **Who** (Qui) | qui accède ? | l'utilisateur, le service, l'appareil |
| **What** (Quoi) | à quoi accède-t-il ? | la base de données clients, l'API de paiement |
| **When** (Quand) | à quel moment ? | pendant les heures de bureau, en dehors |
| **Where** (Où) | depuis où ? | bureau, télétravail, cloud |
| **Why** (Pourquoi) | pour quel besoin ? | consultation, modification, export |
| **How** (Comment) | par quel moyen ? | HTTPS, SSH, API REST, VPN |

### L'application concrète

Pour chaque flux dans le Protect Surface, on répond aux 6 questions :

```
Flux : accès à la base de données clients
  Who   : le service d'authentification (pas les humains directement)
  What  : table "clients" en lecture seule
  When  : 24/7 (service automatisé)
  Where : réseau interne (pas depuis internet)
  Why   : vérifier l'identité lors du login
  How   : TCP/5432 (PostgreSQL) chiffré en TLS
```

> **Le piège** : si tu ne peux pas répondre aux 6 questions pour un flux, c'est que tu ne comprends pas ton propre système — et tu ne peux pas le protéger.

## 4. Le Protect Surface vs la surface d'attaque (rappel)

| | Surface d'attaque | Protect Surface |
|--|-------------------|-----------------|
| **C'est quoi** | tout ce qui est exposé (ports, services, utilisateurs) | ce qui a de la **valeur** (DAAS) |
| **Objectif** | la réduire (fermer les portes) | la protéger (mettre un gardien devant) |
| **Approche** | défensive (bloquer) | ciblée (protéger l'essentiel) |
| **Résultat** | moins de cibles | meilleure protection des cibles critiques |

**Les deux sont complémentaires :** on réduit la surface d'attaque (fermer les ports inutiles) ET on protège la surface à protéger (micro-segmentation + politiques).

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Protect Surface = protéger tout le réseau » | Non : seulement le DAAS critique. Le reste n'est pas protégé avec le même niveau |
| « La méthode Kipling = un questionnaire » | Non : c'est une méthode de **compréhension** des flux, pas un formulaire à remplir |
| « PAM = une fois et c'est fini » | Non : Monitor/Maintain = recommencer en continu. Le Protect Surface évolue |
| « Zero Trust = pas de périmètre » | Non : Zero Trust a un périmètre, mais c'est le Protect Surface, pas le réseau entier |
| « Analyser les flux = faire un audit réseau » | L'audit est ponctuel ; l'analyse PAM est continue et ciblée sur le Protect Surface |

## 6. En une ligne

> Le Protect Surface dit « protège ce qui compte, pas tout » ; PAM donne la démarche (identifier → analyser → surveiller) ; et la méthode Kipling (les 6 questions) est l'outil pour comprendre chaque flux — le tout au service du Zero Trust.

*Liens logiques : le Zero Trust qui utilise le Protect Surface → [[perimeter-vs-zerotrust]] · la micro-segmentation qui isole le Protect Surface → [[system-building]] · les flux réseau analysés via le 5-tuple → [[five-tuple]] · les containers naturellement micro-segmentés → [[docker]] · et le pare-feu qui protège la surface → [[ufw]]*