---
tags: [security, crypto, pki, ca, trust, assurance, crl, policies]
---

# CA et fondements de la confiance — l'écosystème de confiance (fiche du jour)

> **Définition rookie :** la CA (Certificate Authority) est la **racine de confiance** de tout l'écosystème. C'est elle qui signe les certificats, publie les politiques, gère les révocations (CRL/OCSP), et décide du **niveau d'assurance** (high vs low). Sans CA de confiance, aucun certificat n'est fiable — c'est le sommet de la pyramide.

**Analogie :** la CA, c'est l'**État civil**. Elle délivre les passeports (certificats), vérifie ton identité (RA), publie la liste des passeports annulés (CRL), et décide si tu as droit à un passeport simple (faible assurance) ou un passeport diplomatique (haute assurance). L'État civil est la racine : tout le monde lui fait confiance par défaut.

## 1. La CA — ce qu'elle fait

La CA est l'entité qui **signe** les certificats et garantit « cette clé publique appartient bien à cette entité ». Elle fait 4 choses :

1. **Émet** les certificats (signe les CSR après validation par la RA).
2. **Publie** les politiques (CP/CPS) qui disent comment elle travaille.
3. **Gère la révocation** : publie les CRL et répond aux requêtes OCSP.
4. **Définit le niveau d'assurance** : DV (faible) vs OV (moyen) vs EV (haute).

## 2. L'écosystème de confiance — les composants

```
┌──────────────────────────────────────────────────────┐
│  POLITIQUES (CP / CPS)                              │
│  ── les règles : qui peut avoir un cert, comment,   │
│     pour quoi, avec quel niveau de vérification      │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│  CA (Root + Intermediate)                            │
│  ── signe les certificats                            │
│  ── délivre aussi : CRL, OCSP, politiques            │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│  RA (Registration Authority)                         │
│  ── vérifie l'identité (documents, domaine, orga)    │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│  SERVEUR DE REGISTRE                                 │
│  ── publie les certificats + CRL + répond OCSP       │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│  ENTITÉ (serveur, utilisateur, device)              │
│  ── détient la clé privée + le certificat            │
└──────────────────────────────────────────────────────┘
```

## 3. Les politiques — CP et CPS

La CA ne fait pas n'importe quoi : elle publie des **politiques** qui définissent les règles du jeu.

| Document | Rôle |
|----------|------|
| **CP** (Certificate Policy) | **QUOI** : quels types de certificats sont délivrés, pour qui, avec quel niveau de vérification |
| **CPS** (Certification Practice Statement) | **COMMENT** : les procédures techniques et opérationnelles de la CA |

Exemple : le CP dit « on délivre des certificats DV pour tout domaine validé par DNS ». Le CPS dit « la validation se fait par challenge DNS-01 ou HTTP-01, la clé est RSA 2048 bits minimum, le certificat dure 90 jours ».

> **Les navigateurs vérifient les politiques** : si une CA ne respecte pas sa propre CP/CPS, elle peut être retirée de la liste de confiance (comme WoSign en 2016).

## 4. High vs Low assurance — le niveau de confiance

La CA délivre des certificats avec des **niveaux d'assurance** différents :

| Niveau | Type de certificat | Vérification | Confiance |
|--------|-------------------|--------------|-----------|
| **Faible** | **DV** (Domain Validation) | preuve de contrôle du domaine (DNS/fichier) | « quelqu'un contrôle ce domaine » |
| **Moyen** | **OV** (Organization Validation) | documents légaux + vérification de l'organisation | « cette organisation existe et contrôle ce domaine » |
| **Haute** | **EV** (Extended Validation) | vérification approfondie (documents, existence légale, personne physique) | « cette organisation est bien celle qu'elle prétend être » |

**La différence en pratique :**
- DV = Let's Encrypt : gratuit, automatique, 90 jours → parfait pour un site web standard.
- OV = certificat d'entreprise : vérification manuelle, plus cher, plus long.
- EV = certificat bancaire : vérification très stricte, le plus cher, le plus long.

> **Le piège** : « EV = plus sécurisé ». Non — EV = plus de **vérification d'identité**, pas plus de **chiffrement**. Un certificat DV chiffre exactement pareil qu'un EV. La différence est dans la **confiance** accordée à l'identité, pas dans la crypto.

## 5. L'écosystème de confiance — comment ça tient

La confiance repose sur une **liste de confiance** (trust store) : les navigateurs et OS pré-installent une liste de Root CA qu'ils considèrent comme fiables.

```
Trust store du navigateur (Chrome, Firefox, Safari)
  ├── Root CA 1 (DigiCert, VeriSign, Let's Encrypt...)
  ├── Root CA 2
  ├── Root CA 3
  └── ... (~100-200 Root CA)
```

- Si un certificat est signé par une CA dont le Root est dans le trust store → **fiable**.
- Si le Root n'est pas dans le trust store → **avertissement** (certificat non reconnu).
- Si la CA est compromise ou ne respecte pas ses politiques → **retrait du trust store** (comme WoSign en 2016, ou Symantec en 2018).

**La confiance est donc :**
- **Hiérarchique** : Root → Intermediate → certificat feuille.
- **Déléguée** : le navigateur fait confiance au Root, qui fait confiance à l'Intermediate, qui fait confiance à l'entité.
- **Révocable** : si une CA est compromise, on la retire du trust store → tous ses certificats deviennent invalides.

## 6. La CA délivre aussi...

La CA ne se contente pas de signer des certificats. Elle délivre aussi :

| Élément | Rôle |
|---------|------|
| **CRL** (Certificate Revocation List) | la liste de tous les certificats révoqués (téléchargée périodiquement) |
| **OCSP responder** | répond en ligne : « ce certificat précis est-il révoqué ? » |
| **Politiques (CP/CPS)** | les règles du jeu (qui peut avoir un cert, comment, pour quoi) |
| **Chaîne de confiance** | le chemin Root → Intermediate → certificat feuille |

## 7. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « EV = plus de chiffrement » | EV = plus de vérification d'identité, même chiffrement qu'un DV |
| « La CA vérifie l'identité » | La RA vérifie l'identité ; la CA signe. Deux rôles séparés |
| « Le Root CA est en ligne » | Le Root est hors ligne (HSM) ; seuls les Intermediate sont en ligne |
| « Un certificat révoqué = supprimé » | Révoqué = marqué invalide (CRL/OCSP) ; le certificat existe toujours |
| « Toutes les CA sont équivalentes » | Non : les politiques (CP/CPS) et le niveau d'assurance diffèrent |
| « Le trust store est fixe » | Non : il est mis à jour régulièrement (retrait de CA compromises) |

## 8. En une ligne

> La CA est la racine de confiance : elle signe les certificats selon des politiques (CP/CPS), délivre les CRL/OCSP pour la révocation, et définit le niveau d'assurance (DV/OV/EV) — le tout dans un écosystème où la confiance est hiérarchique, déléguée et révocable.

*Liens logiques : la PKI qui organise tout ça → [[pki]] · les certificats que la CA signe → [[certificate]] · la cryptographie asymétrique certifiée → [[cryptography]] · et la vérification dans le navigateur → [[dns]] (DNSSEC) et [[ntp]] (heure juste)*