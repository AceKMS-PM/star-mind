---
tags: [network, system, firewall, stateless, stateful, ngfw, security]
---

# Stateless, Stateful & NGFW — les 3 générations de firewalls (fiche du jour)

> **Définition rookie :** un firewall filtre le trafic réseau. La différence entre les générations, c'est **ce qu'il regarde** : le paquet seul (stateless), la connexion (stateful), ou le contenu + l'identité (NGFW). Plus on monte en génération, plus le firewall comprend ce qu'il filtre.

**Analogie :** le firewall stateless, c'est le **portier qui regarde l'étiquette** (adresse, port) et laisse passer ou non. Le stateful, c'est le portier qui **se souvient** des conversations déjà commencées. Le NGFW, c'est le portier qui **lit le contenu** de la lettre et vérifie l'identité de l'expéditeur.

## 1. Stateless (1re génération) — le filtre par paquet

**Principe :** chaque paquet est évalué **indépendamment**, sans mémoire des paquets précédents. Le firewall regarde le 5-tuple (voir [[five-tuple]]) et applique la règle correspondante.

```
Paquet arrive → firewall regarde le 5-tuple → règle match ? → allow/deny
              → aucune mémoire du paquet précédent
```

**Exemple de règle stateless :**
```
ALLOW tcp from 192.168.1.0/24 to any port 443
DENY  all from any to any
```

**Problème :** pour autoriser une connexion TCP, il faut autoriser **les deux directions** (aller + retour) avec des règles séparées. Le firewall ne sait pas si un paquet est une réponse à une connexion initiée de l'intérieur.

| Forces | Faiblesses |
|--------|------------|
| Très rapide (pas de mémoire) | Pas de notion de connexion → règles complexes |
| Simple à comprendre | Vulnérable aux paquets forgés (spoofing) |
| Peu de ressources | Doit autoriser aller + retour explicitement |
| | Ne détecte pas les attaques par fragmentation |

## 2. Stateful (2e génération) — le firewall qui se souvient

**Principe :** le firewall maintient une **table d'état** (state table) qui suit les connexions établies. Quand un paquet arrive, il vérifie s'il appartient à une connexion **déjà connue**.

```
Paquet arrive → firewall vérifie la state table
              → connexion connue ? → allow (automatique)
              → nouvelle connexion ? → vérifier les règles → allow/deny + ajouter à la table
```

**La state table :**
```
PROTO  SRC_IP        SRC_PORT  DST_IP        DST_PORT  STATE
TCP    192.168.1.50  54321     93.184.216.34  443      ESTABLISHED
TCP    192.168.1.50  54322     8.8.8.8       53       ESTABLISHED
UDP    192.168.1.50  12345     8.8.4.4       53       (pas d'état UDP, timeout)
```

**Les états TCP suivis :**
- `SYN_SENT` → `SYN_RECEIVED` → `ESTABLISHED` → `FIN_WAIT` → `CLOSED`

**Avantage clé :** une seule règle suffit :
```
ALLOW tcp from 192.168.1.0/24 to any port 443   → les réponses sont autorisées automatiquement
```

| Forces | Faiblesses |
|--------|------------|
| Règles plus simples (une règle pour aller + retour) | Plus de mémoire (la state table grandit) |
| Détecte les paquets hors connexion (spoofing) | Vulnérable aux attaques de flooding (SYN flood) |
| Suit le cycle de vie TCP | Ne regarde pas le contenu du paquet |
| Standard depuis les années 2000 | Ne détecte pas les attaques applicatives (SQLi, XSS) |

> **UFW est stateful** : `ufw allow 443/tcp` suffit, les réponses sont autorisées automatiquement. Voir [[ufw]].

## 3. 3e génération — le firewall applicatif (proxy)

**Principe :** le firewall agit comme un **proxy** : il termine la connexion côté client, inspecte le contenu, puis établit une nouvelle connexion côté serveur. Il comprend le protocole applicatif (HTTP, FTP, SMTP).

```
Client ──► Firewall (proxy) ──► Serveur
         ↑ termine la connexion
         ↓ inspecte le contenu HTTP
         ↑ établit une nouvelle connexion
```

**Ce qu'il inspecte :**
- Les en-têtes HTTP (User-Agent, Host, etc.)
- Le contenu des requêtes (paramètres, corps POST)
- Les cookies, les sessions

**Forces :** détection des attaques applicatives (SQLi, XSS, path traversal) au niveau du contenu.

**Faiblesses :** lent (deux connexions à gérer), ne gère que les protocoles qu'il connaît, difficile à scaler.

## 4. NGFW — Next-Generation Firewall (4e génération)

**Principe :** le NGFW combine le **stateful** (mémoire des connexions) avec l'**inspection approfondie** (DPI — Deep Packet Inspection) et l'**identité** (qui fait la requête, pas juste d'où elle vient).

```
NGFW = Stateful + DPI + Identité + IPS + Threat Intelligence
```

### Les capacités du NGFW

| Capacité | Description |
|----------|-------------|
| **Stateful inspection** | suit les connexions (comme la 2e génération) |
| **DPI (Deep Packet Inspection)** | inspecte le contenu du paquet (pas juste le 5-tuple) |
| **Identité** | qui fait la requête (utilisateur, appareil, pas juste l'IP) |
| **IPS** (Intrusion Prevention System) | détecte et bloque les attaques connues en temps réel |
| **SSL/TLS inspection** | déchiffre le trafic HTTPS pour l'inspecter (avec un certificat interne) |
| **Threat Intelligence** | intègre des flux d'IOCs (voir [[security-basics]]) |
| **Application awareness** | identifie l'application (pas juste le port) : « c'est du Facebook, pas du HTTPS générique » |
| **User awareness** | politiques basées sur l'utilisateur, pas sur l'IP |

### NGFW vs Stateful — la différence clé

| | Stateful (2e gen) | NGFW (4e gen) |
|--|-------------------|---------------|
| **Ce qu'il regarde** | le 5-tuple + l'état | le 5-tuple + l'état + le contenu + l'identité |
| **Application** | ne sait pas ce que tu fais | sait que c'est du Facebook, du SSH, du SQLi |
| **Utilisateur** | ne sait pas qui tu es (juste l'IP) | sait que c'est Alice, depuis son laptop |
| **Chiffrement** | ne voit pas le contenu HTTPS | déchiffre et inspecte (SSL inspection) |
| **Menaces** | bloque les ports | bloque les attaques applicatives et les malwares |
| **Coût** | faible | élevé |

### Exemples de NGFW

- **Palo Alto Networks** (PA series)
- **Fortinet** (FortiGate)
- **Cisco** (Firepower)
- **Check Point** (Quantum)

## 5. Le tableau récapitulatif des 4 générations

| Génération | Nom | Regarde | Mémoire | Exemples |
|------------|-----|---------|---------|----------|
| **1re** | Stateless | le paquet seul (5-tuple) | non | ACL Cisco, iptables basique |
| **2e** | Stateful | le paquet + l'état de la connexion | oui (state table) | UFW, iptables conntrack, pf |
| **3e** | Applicatif (proxy) | le contenu applicatif | oui | Squid, mod_proxy |
| **4e** | NGFW | contenu + identité + menaces | oui + DPI | Palo Alto, FortiGate, Firepower |

## 6. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Un firewall stateful = un NGFW » | Non : le stateful suit les connexions, le NGFW inspecte le contenu et l'identité |
| « Le NGFW remplace l'IPS » | Non : le NGFW intègre un IPS, mais l'IPS reste un outil distinct |
| « SSL inspection = pas de confidentialité » | Oui et non : le firewall déchiffre pour inspecter, mais le trafic reste chiffré de bout en bout (le firewall est un MITM légitime) |
| « Stateless = inutile » | Non : pour des règles simples et très rapides (ACL sur routeur), le stateless suffit |
| « Un firewall suffit pour la sécurité » | Non : le firewall est une couche, pas la sécurité complète (voir [[perimeter-vs-zerotrust]] : le périmètre seul ne suffit pas) |

## 7. En une ligne

> Le firewall stateless regarde le paquet, le stateful se souvient de la connexion, le NGFW comprend le contenu et l'identité — et passer d'une génération à l'autre, c'est passer de « bloquer des ports » à « bloquer des comportements ».

*Liens logiques : les règles stateful concrètes → [[ufw]] · le 5-tuple que le firewall regarde → [[five-tuple]] · le dépannage réseau → [[troubleshooting]] · le périmètre vs Zero Trust → [[perimeter-vs-zerotrust]] · et les menaces que le NGFW détecte → [[security-basics]] et [[malware]]*