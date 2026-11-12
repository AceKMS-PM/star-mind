---
tags: [system, data, architecture, data-fabric, integration, metadata]
---

# Data Fabric — l'architecture unifiée des données (fiche du jour)

> **Définition rookie :** le **Data Fabric** (tissu de données) est une **architecture** qui crée une couche unifiée pour accéder, gérer et intégrer des données réparties sur plusieurs sources, systèmes et environnements (on-premise, cloud, edge). Au lieu de déplacer les données, on crée un **tissu** qui les relie.

**Analogie :** le Data Fabric, c'est le **système nerveux** du corps. Les données sont les organes (dispersés, chacun avec son rôle), et le tissu de données est le réseau de nerfs qui les relie — il transporte l'information là où il faut, sans déplacer les organes.

## 1. Le problème que le Data Fabric résout

Les données modernes sont **éparpillées** :
- Bases de données sur site (on-premise)
- Services cloud (AWS, GCP, Azure)
- Applications SaaS (Salesforce, etc.)
- Fichiers, logs, IoT, edge

**Sans Data Fabric :** chaque source est un silo. Pour analyser ou utiliser les données, il faut les **déplacer** (ETL, pipelines, copies) → coûteux, lent, incohérent.

**Avec Data Fabric :** on ne déplace pas les données. On crée une **couche d'abstraction** qui donne un accès unifié, où qu'elles soient.

```
Sans Data Fabric :                    Avec Data Fabric :
┌────┐ ┌────┐ ┌────┐                ┌─────────────────────┐
│ DB │ │Cloud│ │SaaS│  → copier     │   DATA FABRIC       │
└────┘ └────┘ └────┘   tout         │   (couche unifiée)  │
     ↓                              │   ┌────┐┌────┐┌────┐│
  [Data Lake]                       │   │ DB ││Cloud││SaaS││
  (copie, stale, coûteux)           │   └────┘└────┘└────┘│
                                    └─────────────────────┘
                                      accès unifié, pas de copie
```

## 2. Les composants du Data Fabric

| Composant | Rôle |
|-----------|------|
| **Métadonnées actives** | l'IA analyse les métadonnées pour comprendre où sont les données, leur qualité, leur lineage (provenance) |
| **Catalogue de données** | l'annuaire des données : « où est quoi, qui peut y accéder » |
| **Intégration** | connecteurs vers toutes les sources (DB, cloud, SaaS, fichiers) |
| **Gouvernance** | politiques d'accès, conformité (RGPD), masquage des données sensibles |
| **Orchestration** | automatisation des flux de données selon les règles |
| **Sécurité** | chiffrement, contrôle d'accès, audit (voir [[zero-trust-access-rbac]]) |

## 3. Data Fabric vs Data Lake vs Data Warehouse

| | Data Lake | Data Warehouse | Data Fabric |
|--|-----------|----------------|-------------|
| **Approche** | centraliser (tout copier dans un lac) | centraliser + structurer | **ne pas déplacer** (relier) |
| **Données** | brutes, non structurées | structurées, optimisées | toutes (structurées ou non) |
| **Coût** | stockage massif | coûteux (ETL, compute) | modéré (pas de copie) |
| **Fraîcheur** | stale (données copiées) | stale (batch) | temps réel (accès direct) |
| **Gouvernance** | difficile (tout mélangé) | bonne (structuré) | bonne (métadonnées actives) |

> **La différence clé :** le Data Lake/Warehouse **déplace** les données ; le Data Fabric **les relie** sans les déplacer.

## 4. Les bénéfices

- **Accès unifié** : une seule interface pour toutes les sources.
- **Pas de copie** : les données restent où elles sont (moins de stockage, moins de stale data).
- **Gouvernance centralisée** : politiques d'accès et de conformité appliquées partout.
- **Métadonnées actives** : l'IA découvre et classe les données automatiquement.
- **Agilité** : ajouter une nouvelle source = ajouter un connecteur, pas refaire tout le pipeline.

## 5. Le lien avec Zero Trust et la sécurité

Le Data Fabric s'intègre naturellement avec le Zero Trust (voir [[perimeter-vs-zerotrust]]) :

- **Pas de confiance par défaut** : chaque accès aux données est vérifié (qui, quoi, contexte).
- **Micro-segmentation** : les données sensibles sont isolées (voir [[protect-surface-pam]]).
- **Least privilege** : chaque utilisateur/appareil n'accède qu'aux données nécessaires (voir [[zero-trust-access-rbac]]).
- **Audit** : tout accès est loggé et traçable.

## 6. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Data Fabric = Data Lake » | Non : le Data Lake copie les données ; le Data Fabric les relie sans les déplacer |
| « Pas besoin de gouvernance » | Non : sans gouvernance, le tissu devient un chaos de données non contrôlées |
| « Les métadonnées actives = magie » | Non : c'est de l'IA sur les métadonnées, pas une baguette magique — la qualité des données compte |
| « Un seul outil fait tout » | Non : le Data Fabric est une architecture, pas un produit unique |
| « On peut tout connecter » | Non : les sources legacy sans API sont difficiles à intégrer |

## 7. En une ligne

> Le Data Fabric est le système nerveux des données : il relie toutes les sources sans les déplacer, avec une gouvernance et une sécurité centralisées — l'accès unifié sans la copie.

*Liens logiques : l'architecture qui intègre les données → [[system-building]] · la sécurité de l'accès aux données → [[zero-trust-access-rbac]] · le Protect Surface qui définit quoi protéger → [[protect-surface-pam]] · le Zero Trust qui vérifie chaque accès → [[perimeter-vs-zerotrust]] · et les containers qui hébergent les données → [[docker]]*