---
tags: [security, architecture, perimeter, zero-trust, network, model]
---

# Secure Perimeter vs Zero Trust — les deux modèles de défense (fiche du jour)

> **Définition rookie :** le **Secure Perimeter Model** (modèle périmétrique) protège en construisant un **mur** autour du réseau : tout ce qui est dedans est de confiance, tout ce qui est dehors est hostile. Le **Zero Trust Model** dit : « ne fais confiance à personne, même à l'intérieur » — chaque accès est vérifié, à chaque fois, pour chaque ressource.

**Analogie :** le modèle périmétrique, c'est le **château fort** avec ses douves : une fois passé le pont-levis, tu es libre de circuler. Le Zero Trust, c'est l'**immeuble de bureaux** : chaque porte demande un badge, même si tu es déjà à l'intérieur — et le badge expire toutes les 5 minutes.

## 1. Le Secure Perimeter Model — le château fort

### Le principe

```
┌─────────────────────────────────────────────┐
│  RÉSEAU INTERNE (de confiance)              │
│  ┌─────┐  ┌─────┐  ┌─────┐                │
│  │ PC  │  │ DB  │  │ App │  ← tout le     │
│  └─────┘  └─────┘  └─────┘     monde est   │
│  ┌─────┐  ┌─────┐               ami         │
│  │ Srv │  │ ... │                            │
│  └─────┘  └─────┘                            │
│                                              │
│  ═══════════════════════════════════════    │  ← firewall = le mur
│  ────────────────────────────────────────    │  ← VPN = le pont-levis
└─────────────────────────────────────────────┘
        ▲
        │ internet (hostile)
```

**Les règles :**
- **Tout ce qui est à l'intérieur** du périmètre est **de confiance** (pas de vérification supplémentaire).
- **Tout ce qui est à l'extérieur** est **hostile** (bloqué par le firewall).
- Pour entrer : VPN, authentification au périmètre, puis libre circulation à l'intérieur.

### Forces

- Simple à comprendre et à mettre en place.
- Efficace quand le réseau est bien délimité (site unique, pas de cloud).
- Les outils existent depuis longtemps (firewalls, VPN, IDS/IPS).

### Faiblesses

- **Une fois à l'intérieur, libre circulation** : un attaquant qui passe le mur (phishing, VPN compromis, insider) accède à TOUT.
- **Le périmètre s'efface** : cloud, télétravail, BYOD (bring your own device) → où est le mur ? Il n'y en a plus un seul.
- **Lateral movement** : une fois dedans, l'attaquant se déplace latéralement sans être détecté (pas de vérification entre machines internes).
- **Le modèle « confiance par défaut »** : il suppose que l'intérieur est sûr — ce qui est faux dès qu'un seul compte est compromis.

## 2. Le Zero Trust Model — ne fais confiance à personne

### Le principe

```
┌─────────────────────────────────────────────┐
│  RÉSEAU (aucune zone de confiance)          │
│                                             │
│  ┌─────┐     ┌─────┐     ┌─────┐           │
│  │ PC  │────►│ DB  │────►│ App │           │
│  └─────┘     └─────┘     └─────┘           │
│     │           │           │               │
│     ▼           ▼           ▼               │
│  [vérif]     [vérif]     [vérif]           │
│  à CHAQUE accès, pour CHAQUE ressource      │
│                                             │
│  Pas de mur. Pas de zone de confiance.      │
│  Tout est vérifié, tout le temps.            │
└─────────────────────────────────────────────┘
```

**Les règles (les 7 principes de Zero Trust) :**

1. **Never trust, always verify** : ne faire confiance à personne, vérifier à chaque fois.
2. **Least privilege** : chaque utilisateur/appareil n'a accès qu'à ce dont il a besoin (pas plus).
3. **Micro-segmentation** : le réseau est divisé en petites zones isolées (pas de libre circulation).
4. **Vérification continue** : l'authentification n'est pas un événement unique, c'est un processus continu (session expire, re-vérification).
5. **Tout est chiffré** : même à l'intérieur du réseau (pas de trafic en clair entre machines).
6. **Collecte et analyse** : logs, comportement, anomalies → détection en temps réel.
7. **Assumer la compromission** : le système est conçu en supposant que l'attaquant est déjà à l'intérieur.

### Forces

- **Résilient** : un compte compromis ne donne accès qu'à une ressource, pas à tout le réseau.
- **Adapté au cloud/télétravail** : pas de périmètre unique, chaque accès est vérifié indépendamment.
- **Détection précoce** : le lateral movement est bloqué par la micro-segmentation.
- **Conforme** aux réglementations modernes (NIST SP 800-207, CISA).

### Faiblesses

- **Complexité** : beaucoup plus difficile à mettre en place (identité, politiques, monitoring).
- **Coût** : nécessite des outils (IAM, SIEM, micro-segmentation, MFA partout).
- **Performance** : vérifier à chaque accès ajoute de la latence.
- **Culture** : changer de « confiance par défaut » à « méfiance par défaut » est un changement d'état d'esprit.

## 3. Comparaison directe

| Critère | Secure Perimeter | Zero Trust |
|---------|-----------------|------------|
| **Modèle de confiance** | confiance par défaut à l'intérieur | méfiance par défaut partout |
| **Frontière** | un mur (firewall) | pas de mur : micro-segmentation |
| **Accès interne** | libre circulation | vérifié à chaque accès |
| **Lateral movement** | facile (une fois dedans) | bloqué (chaque ressource protégée) |
| **Cloud/télétravail** | difficile (pas de périmètre unique) | natif (chaque accès est indépendant) |
| **Complexité** | simple | complexe |
| **Coût** | faible | élevé |
| **Résilience** | faible (un point de défaillance) | élevée (défense en profondeur) |

## 4. Comment on migre vers Zero Trust (les étapes)

1. **Inventorier** : lister tous les utilisateurs, appareils, applications, données.
2. **Identifier les flux** : qui accède à quoi, quand, pourquoi.
3. **Micro-segmenter** : diviser le réseau en petites zones (par application, par données sensibles).
4. **Mettre en place l'identité** : MFA partout, SSO, IAM centralisé (voir [[auth-vulns]]).
5. **Monitorer** : logs, SIEM, détection d'anomalies (voir [[troubleshooting]]).
6. **Itérer** : Zero Trust n'est pas un projet, c'est un processus continu.

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Zero Trust = pas de VPN » | Non : Zero Trust utilise des VPN/SDP modernes, mais pas de confiance aveugle |
| « Le périmètre est mort » | Non : il existe encore dans les réseaux legacy, mais il ne suffit plus |
| « Zero Trust = tout chiffrer » | Le chiffrement est une brique, pas le tout : identité + micro-segmentation + monitoring |
| « Zero Trust = complexe donc inutile » | Pour les PME, un Zero Trust léger (MFA + micro-segmentation basique) vaut mieux que rien |
| Confondre Zero Trust et Zero Access | Zero Trust = vérifier chaque accès ; Zero Access = ne donner aucun accès du tout (trop extrême) |

## 6. En une ligne

> Le périmètre dit « une fois passé le mur, tu es de confiance » ; le Zero Trust dit « je vérifie chaque porte, même à l'intérieur » — et c'est le seul modèle qui survit au cloud, au télétravail et aux insiders.

*Liens logiques : le périmètre durcit le pathway du vecteur d'attaque → [[security-basics]] · l'identité est la base du Zero Trust → [[auth-vulns]] · la micro-segmentation isole les composants → [[system-building]] · le pare-feu périmétrique → [[ufw]] · et les containers sont naturellement micro-segmentés → [[docker]]*