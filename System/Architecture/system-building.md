---
tags: [system, architecture, conception, backend, methodologie]
---

# Mettre en place un système — la méthode (fiche du jour)

> **Définition rookie :** mettre en place un système, c'est **décider AVANT de coder** : ce que le système fait, comment il est découpé en composants, quelles sont ses constantes de base, et par où commencer. Un bon chantier a un plan ; une bonne app a une architecture.

**Analogie :** construire une maison. On ne coule pas les murs avant le plan d'architecte. Et dans un système, l'équivalent des fondations s'appelle l'**authentification** : c'est LE premier mur à poser.

## 1. L'ordre recommandé (vue d'ensemble)

```
1. Le domaine  → 2. Le schéma des composants → 3. Les constantes cœur
       ↓
4. L'AUTHENTIFICATION (les fondations)
       ↓
5. La structure du projet → 6. Le modèle de données → 7. Tests
       ↓
8. Mise en production (VM, config, sauvegardes)
```

## 2. Étape 1 — Le domaine (les features)

Avant toute ligne de code : **ce que le système fait, pour qui, et en une phrase**.

```text
Features (en une ligne chacune) :
- un utilisateur crée un compte et se connecte
- un utilisateur lit/écrit ses notes (les siennes uniquement)
- un admin voit les statistiques
```

Chaque feature = une **couche de vérification** plus tard (« qui a le droit ? »). C'est ici que tu découpes en **modules** (auth, notes, admin…) — chaque module deviendra un dossier du projet.

## 3. Étape 2 — Le schéma des composants (l'architecture)

Le **schéma clair** dont tu parles : comment les briques se parlent. Un schéma simple en couches, du dehors vers le dedans :

```text
[Client] (navigateur/appli)
   │  HTTPS
   ▼
[API / Routeur]   ← reçoit les requêtes, vérifie l'auth
   │
   ▼
[Services]        ← la logique métier (features)
   │
   ├─────► [Accès données / Modèles]  ← SQL, requêtes
   │              │
   │              ▼
   │           [Base de données]
   │
   └─────► [Infra]  ← envoi mail, stockage fichiers, logs
```

Règles de base :
- **Chaque flèche traverse une frontière vérifiée** : le routeur vérifie « qui ? », le service vérifie « a-t-il le droit ? » (c'est là que vit l'anti-[[idor]]).
- **Les couches ne remontent pas** : le service ne parle jamais au client directement.
- **Un composant = une responsabilité** : si tu ne peux pas expliquer une brique en une phrase, elle fait trop de choses.

## 4. Étape 3 — Les constantes cœur

À décider **avant** de coder, car elles sont câblées partout :

| Catégorie | Exemples | Où les mettre |
|-----------|----------|---------------|
| **Config** | port, URL de la base, timeouts, limites (taille max, tentatives max) | code + `.env` |
| **Secrets** | clé de session/JWT, mot de passe DB, clés API | **jamais** dans le code, uniquement `.env` / gestionnaire de secrets |
| **Valeurs métier** | durée d'une session, verrouillage après N essais, formats (dates, locales) | une constante nommée, pas un chiffre magique |

```python
# BAD : des chiffres magiques éparpillés
if tentatives > 5: bloquer()

# GOOD : des constantes nommées au même endroit
MAX_TENTATIVES = 5
SESSION_DUREE = "2h"
if tentatives > MAX_TENTATIVES: bloquer()
```

Règle du 12-factor app : config = environnement, jamais du code. Un secret dans le git = compromission (cf. les scans de secrets en [[sheets]]).

## 5. Étape 4 — L'authentification EN PREMIER (les fondations)

Pourquoi en premier ? Parce que **tout le reste en dépend** : chaque requête, chaque feature, chaque rôle s'appuie sur « qui est cet utilisateur ? ».

Le socle minimum :

```text
1. Modèle User        (id, email, mot_de_passe_hashé, rôles, actif)
2. Hash du mot de passe  (argon2/bcrypt — JAMAIS en clair, JAMAIS md5/sha1)
3. Connexion          (vérifie hash → délivre une session/token)
4. Middleware d'auth  (chaque requête protégée passe par « qui es-tu ? »)
5. Rôles/autorisations (« as-tu le droit ? » — la porte de l'[[idor]])
```

```python
# Le contrat minimal d'un système sécurisé :
#  Authentifier  →  Autoriser  →  Agir
if not requete.est_authentifiee(): return 401   # qui es-tu ?
if not user.role in requete.permissions(): return 403  # as-tu le droit ?
```

L'exemple réel que tu as construit : le cœur d'auth du projet Rust → voir [[CONCEPTS_RUST]].

## 6. Étape 5 — La structure du projet

Une arborescence simple et parlante (par modules, pas par fichiers en vrac) :

```text
mon-systeme/
├── config/            # constantes + chargement du .env
├── modules/           # UN dossier par feature
│   ├── auth/          #   login, sessions, rôles
│   ├── notes/         #   le métier
│   └── admin/
├── db/                # schéma, migrations
├── tests/
└── docs/
```

Règle : **un nouveau dossier = une frontière** ; si tu n'as pas de dossier pour une responsabilité, elle va s'incruster dans un autre.

## 7. Étape 6-7 — Données et tests

- **Le modèle de données se dessine dès le début** : les tables suivent les modules (users, sessions, notes…), avec les relations. Une table par concept, des contraintes (`UNIQUE` sur l'email), pas de données dupliquées.
- **Tests dès le premier jour** : au minimum 1 test par règle de sécurité (auth refusée sans token, [[idor]] refusé, rôle non autorisé refusé). Un test qui protège l'auth vaut tous les autres.

## 8. Étape 8 — Mise en production

- Le système tourne dans une **machine virtuelle/container** isolée → [[guest-host]]
- La config vient de l'environnement (pas du code), les secrets d'un gestionnaire
- Sauvegardes de la base + **snapshots** de la VM avant chaque déploiement
- Logs centralisés + synchronisation de l'heure → [[ntp]] (des logs à la mauvaise heure, c'est une enquête impossible)
- Après déploiement : on dépannne avec la méthode → [[troubleshooting]]

## 9. La checklist complète (à photocopier)

- [ ] Features listées en une phrase chacune (avec « qui a le droit ? »)
- [ ] Schéma des composants dessiné (client → API → services → DB)
- [ ] Constantes cœur nommées + secrets hors du code
- [ ] Auth posée en premier : hash fort, session, middleware, rôles
- [ ] Structure du projet par modules
- [ ] Modèle de données + migrations dès le départ
- [ ] Tests des règles de sécurité au minimum
- [ ] Déploiement en VM + sauvegardes + logs horodatés

## 10. Pièges rookie

| Piège | Réalité |
|-------|---------|
| Coder les features d'abord, « l'auth on verra après » | Tout le code doit être retouché pour brancher l'auth ensuite — refonte garantie |
| Pas de schéma, on code direct | Six mois plus tard, personne (même toi) ne sait où vivent les briques |
| Secrets en dur « pour gagner du temps » | Un commit dans un repo public = fuite réelle. Un .env ignoré par git dès le jour 1 |
| Une grosse classe « Service » qui fait tout | Impossible à tester, impossible à remplacer → un composant = une responsabilité |
| Oublier l'autorisation (« c'est authentifié donc c'est bon ») | AuthN ≠ AuthZ — c'est exactement le bug [[idor]] |

## 11. En une ligne

> Un système, ça se **dessine** avant de se coder : le domaine donne les modules, le schéma donne les frontières, les constantes donnent les réglages, et l'authentification pose les fondations sur lesquelles tout le reste s'assied.

*Liens logiques : le cœur d'auth réel du projet → [[CONCEPTS_RUST]] · les failles d'autorisation à éviter → [[sheets]] · le déploiement vit dans une VM → [[guest-host]] · et tout se dépannne avec la méthode → [[troubleshooting]]*