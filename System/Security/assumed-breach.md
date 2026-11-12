---
tags: [security, zero-trust, assumed-breach, principe, architecture, defense]
---

# Assumed Breach — le principe de la compromission assumée (fiche du jour)

> **Définition rookie :** le principe de **l'assumed breach** (compromission assumée) consiste à **concevoir son système en supposant que l'attaquant est DÉJÀ à l'intérieur**. On ne se demande plus « comment empêcher l'intrusion ? » mais « comment limiter les dégâts une fois qu'elle a eu lieu ? ».

**Analogie :** le modèle périmétrique (voir [[perimeter-vs-zerotrust]]), c'est la **forteresse** : on construit des murs épais pour empêcher l'entrée. L'assumed breach, c'est l'**immeuble** : on suppose que quelqu'un a déjà la clé du hall, et on conçoit chaque étage pour que le voleur ne puisse pas monter ni ouvrir les portes — même s'il est déjà dans le bâtiment.

## 1. Le principe en une phrase

> **« Assume breach »** = « suppose que l'attaquant a déjà passé la porte, et conçois le système pour que ça ne change rien. »

C'est le **7e principe** du Zero Trust (voir [[perimeter-vs-zerotrust]]) et le cœur de la défense en profondeur moderne.

## 2. Pourquoi ce principe existe

Le modèle périmétrique suppose que l'intérieur est **sûr**. L'assumed breach dit le contraire :

- **Les statistiques** : le temps moyen de détection d'une intrusion est de plusieurs mois (souvent 200+ jours). Pendant ce temps, l'attaquant est déjà dedans.
- **Les insiders** : un employé compromis, un prestataire malveillant, un compte volé — la menace vient de l'intérieur.
- **Le lateral movement** : une fois à l'intérieur, l'attaquant se déplace de machine en machine sans être détecté (voir [[malware]] : botnet, worm).
- **Le « château fort » est mort** : cloud, télétravail, BYOD → le périmètre n'existe plus. Si on ne peut plus définir « l'intérieur », on ne peut plus protéger « l'intérieur ».

## 3. Les 4 piliers de l'assumed breach

```
┌─────────────────────────────────────────────────────┐
│  1. SEGMENTATION          → limiter le mouvement    │
│     (micro-segmentation, voir [[protect-surface-pam]])│
│                                                     │
│  2. LEAST PRIVILEGE       → limiter l'accès         │
│     (chaque compte = minimum nécessaire)             │
│                                                     │
│  3. MONITORING            → détecter la présence    │
│     (logs, SIEM, détection d'anomalies)              │
│                                                     │
│  4. RESPONSE              → réagir rapidement        │
│     (incident response, isolation, révocation)       │
└─────────────────────────────────────────────────────┘
```

### 3.1 Segmentation (micro-segmentation)

Si l'attaquant est dedans, il ne doit **pas** pouvoir se déplacer librement :

- Diviser le réseau en **petites zones isolées** (par application, par données, par utilisateur).
- Chaque zone ne communique qu'avec les zones autorisées.
- **Lateral movement bloqué** : un serveur compromis ne peut pas atteindre la base de données s'il n'y a pas de règle d'autorisation.

### 3.2 Least privilege (moindre privilège)

Chaque compte, chaque service, chaque application n'a accès qu'à **ce dont il a besoin** — ni plus, ni moins :

- **Utilisateur** : accès lecture seule aux données dont il a besoin.
- **Service** : accès uniquement à la base de données qu'il utilise.
- **Compte admin** : utilisé uniquement pour les tâches d'administration, jamais pour le quotidien.

> **La règle** : si un compte est compromis, l'attaquant n'a accès qu'à ce que le compte avait — et si c'est le minimum, les dégâts sont minimes.

### 3.3 Monitoring (surveillance continue)

On suppose que l'attaquant est dedans → on **cherche** activement sa présence :

- **Logs centralisés** : toutes les actions sont enregistrées (voir [[ntp]] : heure juste = logs exploitables).
- **SIEM** (Security Information and Event Management) : corrélation des événements pour détecter les anomalies.
- **Détection comportementale** : un compte qui accède à 1000 fichiers en 5 minutes = alerte.
- **Honeypots** : des leurres (faux serveurs, faux données) pour détecter l'exploration.

### 3.4 Response (réaction)

Quand on détecte l'intrusion, on **réagit vite** :

- **Isolation** : couper le réseau de la machine compromise (micro-segmentation = couper un seul segment).
- **Révocation** : invalider les sessions, les tokens, les certificats compromis (voir [[pki]] : CRL/OCSP).
- **Investigation** : comprendre comment l'attaquant est entré, ce qu'il a touché, ce qu'il a exfiltré.
- **Remédiation** : corriger la faille, renforcer les contrôles, documenter (voir [[troubleshooting]] : la méthode).

## 4. Assumed breach vs les autres principes

| Principe | Position | Réponse à la compromission |
|----------|----------|---------------------------|
| **Secure Perimeter** | « Empêcher l'entrée » | « Si ça casse, c'est fini » |
| **Zero Trust** | « Vérifier chaque accès » | « L'attaquant ne peut pas se déplacer » |
| **Assumed Breach** | « Supposer qu'il est déjà dedans » | « Limiter les dégâts et détecter vite » |

> **Les trois sont complémentaires** : le périmètre empêche l'entrée, le Zero Trust vérifie chaque porte, et l'assumed breach dit « et si malgré tout il est dedans, on limite les dégâts et on détecte ».

## 5. L'assumed breach dans la kill chain (voir [[security-basics]])

La kill chain décrit l'attaque de la reconnaissance à l'exfiltration. L'assumed breach dit : « supposons que l'attaquant a déjà passé les étapes 1-4 (reconnaissance, weaponization, delivery, exploitation) » et concentrons-nous sur les étapes 5-7 :

```
Kill Chain :  1 → 2 → 3 → 4 → 5 → 6 → 7
                                 ↑
Assumed breach : on suppose que 1-4 sont passés, on défend ici
```

- **Installation (5)** : détecter la persistance (nouveaux processus, nouveaux comptes)
- **C2 (6)** : bloquer les communications sortantes vers des domaines suspects
- **Actions on Objectives (7)** : détecter l'exfiltration, le chiffrement, la destruction

## 6. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Assumed breach = on ne protège plus l'entrée » | Non : on protège l'entrée ET on suppose que ça casse — défense en profondeur |
| « Si on assume la compromission, c'est qu'on a abandonné » | Non : c'est le contraire — on se prépare à réagir, on ne capitule pas |
| « L'assumed breach remplace le Zero Trust » | Non : l'assumed breach est un **principe** du Zero Trust, pas un remplaçant |
| « Un SIEM suffit pour détecter » | Non : il faut des logs, des règles, et des analystes — l'outil sans processus ne détecte rien |
| « La micro-segmentation est trop complexe » | Commencer petit : segmenter les données critiques (Protect Surface, voir [[protect-surface-pam]]) |

## 7. En une ligne

> L'assumed breach dit « suppose que l'attaquant est déjà dedans, et conçois le système pour que ça ne change rien » — segmentation, moindre privilège, monitoring et réponse rapide.

*Liens logiques : le Zero Trust qui utilise ce principe → [[perimeter-vs-zerotrust]] · le Protect Surface qui définit quoi protéger → [[protect-surface-pam]] · la kill chain où on se place après l'exploitation → [[security-basics]] · la micro-segmentation qui isole → [[system-building]] · et les containers naturellement isolés → [[docker]]*