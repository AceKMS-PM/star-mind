---
tags: [security, zero-trust, zta, rbac, access-control, iam, roles]
---

# Zero Trust Access & RBAC — accès vérifié, rôles, un à la fois (fiche du jour)

> **Définition rookie :** le **Zero Trust Access (ZTA)** est l'application concrète du Zero Trust à l'**accès** : chaque requête d'accès est vérifiée individuellement, indépendamment de l'origine. Le **RBAC** (Role-Based Access Control) est le mécanisme le plus courant pour décider **qui a le droit de faire quoi** : on attribue des **rôles** aux utilisateurs, et les rôles portent les permissions.

**Analogie :** le ZTA, c'est le videur qui vérifie ton identité à **chaque porte**, même si tu es déjà à l'intérieur. Le RBAC, c'est le **badge d'accès** : ton badge « employé » ouvre certaines portes, le badge « admin » en ouvre plus. Et « un à la fois » = on ne vérifie qu'un seul accès à la fois, jamais en lot.

## 1. Zero Trust Access (ZTA) — le principe

Le ZTA repose sur une idée simple : **aucun accès n'est accordé par défaut**, même pour quelqu'un qui est déjà dans le réseau.

### Les 3 questions du ZTA (à chaque requête)

```
1. QUI demande ?        → identité de l'utilisateur/appareil
2. À QUOI accède-t-il ? → la ressource visée
3. Dans QUEL contexte ?  → appareil, lieu, heure, comportement
```

Si les 3 réponses sont valides → accès accordé. Sinon → refusé. Et ça se **répète** à chaque requête (pas un événement unique).

### ZTA vs le modèle périmétrique

| | Modèle périmétrique | Zero Trust Access |
|--|---------------------|-------------------|
| **Vérification** | à l'entrée du réseau (une fois) | à chaque accès, pour chaque ressource |
| **Confiance** | confiance par défaut à l'intérieur | méfiance par défaut partout |
| **Accès** | libre circulation à l'intérieur | minimum nécessaire, réévalué en continu |
| **Contexte** | ignoré (si tu es dedans, c'est bon) | pris en compte (appareil, lieu, heure, comportement) |

## 2. RBAC — Role-Based Access Control

### Le principe

Au lieu d'attribuer des permissions **directement** à chaque utilisateur (trop lourd, trop fragile), on crée des **rôles** et on attribue les permissions aux rôles.

```
Utilisateur ──► Rôle ──► Permissions ──► Ressources
```

**Exemple concret :**

| Rôle | Permissions | Ressources |
|------|-------------|------------|
| **viewer** | lecture | consulter les notes |
| **editor** | lecture + écriture | consulter et modifier les notes |
| **admin** | lecture + écriture + suppression + gestion users | tout + administration |

```python
# L'implémentation minimale
class User:
    def __init__(self, nom, role):
        self.nom = nom
        self.role = role

def peut_acceder(user, permission):
    return permission in ROLES[user.role]

ROLES = {
    "viewer":  {"lire"},
    "editor":  {"lire", "ecrire"},
    "admin":   {"lire", "ecrire", "supprimer", "gerer_users"},
}

ada = User("Ada", "editor")
peut_acceder(ada, "ecrire")   # True
peut_acceder(ada, "supprimer") # False
```

### Les 3 composants du RBAC

1. **Utilisateurs** : les personnes ou services qui demandent l'accès.
2. **Rôles** : les groupes de permissions (viewer, editor, admin).
3. **Permissions** : les actions autorisées (lire, écrire, supprimer).

### L'attribution

```
Utilisateur  ──►  Rôle  ──►  Permission  ──►  Ressource
   ada           editor      ecrire         notes/
   lin           admin       gerer_users    users/
```

## 3. « Un à la fois » — la vérification unitaire

Le principe du ZTA dit : **chaque accès est vérifié individuellement**. On ne vérifie pas « l'utilisateur est connecté donc il a accès à tout » — on vérifie **chaque requête** :

```
Requête 1 : Ada veut lire la note "idor.md"
  → Qui ? Ada (authentifiée ✅)
  → À quoi ? note "idor.md" (ressource existante ✅)
  → Contexte ? appareil connu, heure normale, lieu habituel ✅
  → Rôle ? editor → permission "lire" ✅
  → RÉSULTAT : accès accordé

Requête 2 : Ada veut supprimer la note "idor.md"
  → Qui ? Ada ✅
  → À quoi ? note "idor.md" ✅
  → Contexte ? ✅
  → Rôle ? editor → permission "supprimer" ❌
  → RÉSULTAT : accès refusé (403)
```

**Même utilisateur, même session, deux résultats différents** — parce que chaque accès est évalué indépendamment. C'est ça, « un à la fois ».

## 4. RBAC vs ABAC vs ReBAC

| Modèle | Décision basée sur | Exemple |
|--------|-------------------|---------|
| **RBAC** | le **rôle** de l'utilisateur | « editor peut écrire » |
| **ABAC** (Attribute-Based) | les **attributs** (user, ressource, environnement) | « l'utilisateur du département X peut lire les données de sensibilité Y pendant les heures de bureau » |
| **ReBAC** (Relationship-Based) | les **relations** entre entités | « Ada peut lire les notes de Bob parce qu'elle est dans le même groupe » |

- **RBAC** = simple, facile à gérer, suffit pour 90 % des cas.
- **ABAC** = flexible, mais complexe (beaucoup d'attributs à gérer).
- **ReBAC** = moderne (Google Zanzibar), idéal pour les partages collaboratifs.

> **La règle** : commencer par RBAC, passer à ABAC/ReBAC seulement si les rôles ne suffisent plus.

## 5. Les pièges du RBAC

| Piège | Réalité |
|-------|---------|
| **Role explosion** | trop de rôles (un par utilisateur) → on retombe dans les permissions directes |
| **Rôle trop large** | un rôle « superadmin » qui fait tout = le moindre privilège violé |
| **Rôles statiques** | les rôles ne s'adaptent pas au contexte (heure, lieu, appareil) → ajouter des attributs (ABAC) |
| **Oublier la révocation** | un rôle retiré doit être effectif immédiatement, pas au prochain login |
| **Confondre auth et autorisation** | l'auth dit « qui es-tu ? », l'autorisation dit « as-tu le droit ? » (voir [[idor]]) |

## 6. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « L'utilisateur est connecté donc il a accès » | Non : connecté ≠ autorisé. L'auth (qui) ≠ l'autorisation (quoi) |
| « Un rôle = un utilisateur » | Non : un rôle regroupe des permissions, plusieurs utilisateurs peuvent avoir le même rôle |
| « RBAC suffit pour tout » | Non : pour des règles complexes (attributs, relations), il faut ABAC ou ReBAC |
| « Les permissions sont fixes » | Non : elles évoluent avec les besoins métier — revoir régulièrement |
| « Le ZTA vérifie une fois et c'est bon » | Non : « un à la fois » = chaque requête est vérifiée individuellement |

## 7. En une ligne

> Le Zero Trust Access vérifie chaque accès individuellement (qui, quoi, contexte), et le RBAC décide des permissions par rôle — le tout avec le principe « un à la fois » : même utilisateur, même session, chaque requête est évaluée indépendamment.

*Liens logiques : l'identité et l'autorisation dans un système → [[auth-vulns]] et [[idor]] · l'architecture qui intègre l'accès → [[system-building]] · le Protect Surface qui définit quoi protéger → [[protect-surface-pam]] · le Zero Trust qui utilise le ZTA → [[perimeter-vs-zerotrust]] · et l'assumed breach qui suppose l'intrusion → [[assumed-breach]]*