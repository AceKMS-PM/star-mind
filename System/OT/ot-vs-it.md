---
tags: [system, ot, it, infrastructure, iiot, scada, ics, operational-technology]
---

# OT vs IT — Technologie Opérationnelle vs Technologie de l'Information (fiche du jour)

> **Définition rookie :** l'**IT** (Information Technology) gère les **données** : traitement, stockage, communication, sécurité (confidentialité, intégrité). L'**OT** (Operational Technology) gère les **processus physiques** : machines, capteurs, actionneurs, infrastructures critiques. L'IT pense en **informations**, l'OT pense en **actions physiques**.

**Analogie :** l'IT, c'est le **bureau** (e-mails, bases de données, rapports). L'OT, c'est l'**usine** (les machines qui fabriquent, les vannes qui s'ouvrent, les turbines qui tournent). Le bureau peut s'arrêter 5 minutes sans conséquence ; l'usine qui s'arrête 5 minutes = perte de production, danger, ou catastrophe.

## 1. IT vs OT — la comparaison fondamentale

| Critère | IT | OT |
|---------|----|----|
| **Objectif** | traiter l'information (données, communications) | contrôler des processus physiques (machines, infrastructures) |
| **Priorité n°1** | confidentialité, intégrité des données | **disponibilité**, fiabilité, sécurité physique |
| **Tolérance au downtime** | minutes/heures acceptable | **secondes** = catastrophe (arrêt de production, danger) |
| **Mise à jour** | fréquente (patchs, upgrades) | rare (un arrêt = perte de production) |
| **Cycle de vie** | 3-5 ans | 15-25 ans (équipements industriels) |
| **Environnement** | climatisé, propre | poussiéreux, humide, vibrations, températures extrêmes |
| **Sécurité** | CIA (voir [[security-basics]]) | disponibilité avant tout, puis intégrité, puis confidentialité |
| **Protocoles** | TCP/IP, HTTP, DNS, TLS | Modbus, DNP3, OPC-UA, Profinet, EtherNet/IP |

## 2. Les composants de l'OT

### 2.1 L'IIoT (Industrial IoT)

Les capteurs et actionneurs connectés qui mesurent et agissent sur le monde physique :

- **Capteurs** : température, pression, débit, vibration, niveau, position
- **Actionneurs** : vannes, moteurs, relais, pompes
- **Passerelles** : convertissent les protocoles industriels en IP (Modbus → Ethernet)

### 2.2 Les systèmes de contrôle (ICS — Industrial Control Systems)

| Système | Rôle | Exemple |
|---------|------|---------|
| **SCADA** (Supervisory Control And Data Acquisition) | supervise et collecte les données de tout le process | gestion d'un réseau électrique, d'un pipeline |
| **DCS** (Distributed Control System) | contrôle distribué dans une usine | raffinerie, usine chimique |
| **PLC** (Programmable Logic Controller) | automate programmable qui contrôle une machine | robot d'assemblage, convoyeur |
| **RTU** (Remote Terminal Unit) | terminal distant qui collecte et transmet | station de pompage isolée |
| **HMI** (Human-Machine Interface) | l'écran où l'opérateur voit et contrôle le process | tableau de bord de l'usine |

```
Capteurs/Actionneurs (niveau terrain)
        │
        ▼
PLC / RTU (niveau contrôle)
        │
        ▼
SCADA / DCS (niveau supervision)
        │
        ▼
HMI (niveau opérateur)
        │
        ▼
Réseau d'entreprise (IT) — le pont dangereux
```

### 2.3 Le réseau OT — les protocoles industriels

| Protocole | Usage | Caractéristique |
|-----------|-------|-----------------|
| **Modbus** | communication série/Ethernet | simple, pas de sécurité native |
| **DNP3** | SCADA (électricité, eau) | robuste, utilisé dans les infrastructures critiques |
| **OPC-UA** | interopérabilité industrielle | le plus moderne, supporte le chiffrement |
| **Profinet** | automatisation (Siemens) | temps réel, Ethernet industriel |
| **EtherNet/IP** | automatisation (Allen-Bradley) | CIP sur Ethernet |
| **BACnet** | bâtiment (HVAC, éclairage) | domotique industrielle |

> **Le piège** : la plupart de ces protocoles ont été conçus **sans sécurité** (pas de chiffrement, pas d'authentification). Ils datent des années 70-80 quand le réseau était isolé (air gap).

## 3. Le problème de sécurité de l'OT

### 3.1 L'air gap qui n'existe plus

Autrefois, les systèmes OT étaient **isolés** (air gap) : pas de connexion à internet, pas de risque. Aujourd'hui :

- L'IIoT connecte les machines au cloud.
- La convergence IT/OT : les données OT remontent dans les systèmes IT (reporting, analytics).
- Le télétravail et la maintenance à distance (VPN vers l'OT).
- Les mises à jour logicielles nécessitent une connexion.

**Résultat :** les systèmes OT, conçus sans sécurité, sont maintenant **accessibles depuis internet**.

### 3.2 Les menaces OT spécifiques

| Menace | Impact OT |
|--------|-----------|
| **Ransomware** | arrêt de production (voir [[malware]]) |
| **Manipulation de process** | ouvrir une vanne, arrêter une turbine → danger physique |
| **Espionnage industriel** | vol de recettes, de paramètres de production |
| **Sabotage** | destruction d'équipements (Stuxnet : centrifugeuses iraniennes) |
| **Déni de service** | arrêt de la production, perte financière |

### 3.3 Les incidents célèbres

- **Stuxnet (2010)** : ver qui cible les PLC Siemens → détruit les centrifugeuses nucléaires iraniennes. Premier malware OT avéré.
- **Colonial Pipeline (2021)** : ransomware → arrêt du pipeline de carburant sur la côte Est américaine.
- **Ukraine power grid (2015/2016)** : cyberattaque → coupure d'électricité pour 230 000 personnes.

## 4. La sécurité OT — les principes

### 4.1 La disponibilité avant tout

En IT, la CIA s'applique (voir [[security-basics]]). En OT, l'ordre change :

```
IT : Confidentialité → Intégrité → Disponibilité
OT : Disponibilité → Intégrité → Confidentialité
```

- **Disponibilité** : la machine doit tourner (arrêt = danger/perte).
- **Intégrité** : les commandes envoyées doivent être exactes (une vanne qui s'ouvre au mauvais moment = catastrophe).
- **Confidentialité** : importante, mais secondaire (les données de production sont moins sensibles que les données clients).

### 4.2 Le modèle Purdue (l'architecture OT)

Le modèle Purdue divise le réseau en **niveaux** :

```
Niveau 5 : Entreprise (IT) — ERP, e-mail, reporting
Niveau 4 : Site (IT) — bases de données, historiens
─────────── frontière IT/OT ───────────
Niveau 3 : Opérations (OT) — SCADA, MES, historiens de process
Niveau 2 : Contrôle (OT) — HMI, supervision
Niveau 1 : Contrôle (OT) — PLC, RTU, contrôleurs
Niveau 0 : Terrain (OT) — capteurs, actionneurs, machines
```

**La frontière IT/OT** (entre niveaux 3 et 4) est le point critique : c'est là que les deux mondes se rencontrent, et c'est là que la sécurité doit être la plus forte.

### 4.3 Les contre-mesures OT

| Contre-mesure | Rôle |
|---------------|------|
| **Segmentation (Purdue)** | isoler les niveaux, ne pas mélanger IT et OT |
| **Diode de données (unidirectional gateway)** | flux en sens unique : OT → IT (jamais l'inverse) |
| **Patch management OT** | mettre à jour sans arrêter la production (fenêtres de maintenance) |
| **Monitoring OT** | détecter les anomalies de process (pas juste réseau) |
| **Backup des configurations PLC** | restaurer rapidement après incident |
| **Accès à distance sécurisé** | VPN + MFA + jump server (voir [[zero-trust-access-rbac]]) |

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « L'OT, c'est juste de l'IT industrielle » | Non : priorités inversées (disponibilité > confidentialité), cycles de vie différents, protocoles sans sécurité |
| « Les systèmes OT sont isolés donc sûrs » | Non : l'IIoT et la convergence IT/OT ont détruit l'air gap |
| « On peut patcher l'OT comme l'IT » | Non : un patch peut arrêter une production critique — il faut des fenêtres de maintenance |
| « Les protocoles OT sont sécurisés » | Non : Modbus, DNP3 n'ont pas de chiffrement ni d'authentification native |
| « L'OT et l'IT ont les mêmes menaces » | Non : en OT, le ransomware arrête une usine ; en IT, il arrête un bureau |

## 6. En une ligne

> L'OT contrôle les machines et les processus physiques (disponibilité d'abord), l'IT gère les données et les communications (confidentialité d'abord) — et la convergence des deux a créé un nouveau champ de bataille : la sécurité industrielle.

*Liens logiques : la sécurité qui change de priorité → [[security-basics]] (CIA vs DAD) · la disponibilité se dépanne avec la méthode → [[troubleshooting]] · l'assumed breach qui s'applique aux deux → [[assumed-breach]] · les containers qui isolent les services → [[docker]] · et les protocoles industriels sans sécurité se protègent par segmentation → [[perimeter-vs-zerotrust]] et [[protect-surface-pam]]*