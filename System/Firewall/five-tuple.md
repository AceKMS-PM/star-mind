---
tags: [network, system, firewall, 5-tuple, rules, filtering]
---

# Le 5-tuple — la clé de toute règle de firewall (fiche du jour)

> **Définition rookie :** le **5-tuple** est le quintuplet qui identifie **uniquement** un flux réseau. C'est la « carte d'identité » d'une connexion : source, destination, ports, protocole. Toute règle de firewall s'écrit en fonction de ces 5 champs.

**Analogie :** un courrier postal. L'adresse de l'expéditeur (IP source), l'adresse du destinataire (IP destination), le numéro de l'appartement chez l'expéditeur (port source), le numéro chez le destinataire (port destination), et le mode d'envoi (lettre recommandée = TCP, carte postale = UDP). Le 5-tuple, c'est l'étiquette complète du courrier.

## 1. Les 5 champs

```
┌─────────────────────────────────────────────────────────────┐
│  5-TUPLE                                                    │
│                                                             │
│  1. Source IP        →  qui envoie ?                        │
│  2. Destination IP   →  qui reçoit ?                        │
│  3. Source Port      →  quel service chez l'expéditeur ?     │
│  4. Destination Port →  quel service chez le destinataire ?  │
│  5. Protocol         →  TCP / UDP / ICMP                    │
└─────────────────────────────────────────────────────────────┘
```

| Champ | Rôle | Exemple |
|-------|------|---------|
| **Source IP** | l'adresse de l'expéditeur | `192.168.1.50` |
| **Destination IP** | l'adresse du destinataire | `93.184.216.34` |
| **Source Port** | le port d'origine (souvent éphémère, > 1024) | `54321` |
| **Destination Port** | le port du service visé | `443` (HTTPS), `22` (SSH), `53` (DNS) |
| **Protocol** | le protocole de transport | `TCP`, `UDP`, `ICMP` |

## 2. Pourquoi c'est la clé des firewalls

Une règle de firewall dit : « pour ce **5-tuple** (ou une partie), **autorise** ou **refuse** ». Le firewall regarde chaque paquet et compare ces 5 champs aux règles.

**Exemples de règles en 5-tuple :**

| Règle | 5-tuple | Action |
|-------|---------|--------|
| « Autorise le web sortant » | `any → any : 443 / tcp` | ALLOW |
| « Bloque SSH depuis l'extérieur » | `any → any : 22 / tcp` (entrant) | DENY |
| « Autorise DNS » | `any → any : 53 / udp` | ALLOW |
| « Bloque tout le reste » | `any → any : any / any` | DENY (règle par défaut) |

**En UFW** (voir [[ufw]]), ça se traduit directement :
```bash
ufw allow from 192.168.1.0/24 to any port 22 proto tcp
#       ↑ source IP   ↑ dest IP  ↑ dest port ↑ protocole
#       le source port est implicite (any)
```

## 3. Les ports — le champ le plus parlant

Le port de destination dit **quel service** on vise. Les ports bien connus :

| Port | Service | Protocole |
|------|---------|-----------|
| 22 | SSH | TCP |
| 53 | DNS | UDP (et TCP) |
| 80 | HTTP | TCP |
| 443 | HTTPS | TCP |
| 3306 | MySQL | TCP |
| 5432 | PostgreSQL | TCP |
| 6379 | Redis | TCP |
| 8080 | HTTP alternatif / dev | TCP |

Le **port source** est souvent un port **éphémère** (> 1024) choisi par l'OS du client. On ne filtre presque jamais dessus (trop variable) — c'est pourquoi les règles se basent sur le **port de destination**.

## 4. TCP vs UDP — le 5e champ qui change tout

| | TCP | UDP |
|--|-----|-----|
| **Connexion** | établie (3-way handshake) | sans connexion |
| **Fiabilité** | garantie (retransmission) | pas de garantie |
| **Usage** | web, SSH, mail, BDD | DNS, NTP, streaming, gaming |
| **Firewall** | suit l'état de la connexion (stateful) | pas d'état → règle par paquet |

**Stateful vs Stateless :**
- **Stateful** : le firewall retient les connexions établies → il autorise les réponses automatiquement (pas besoin de règle « allow retour »).
- **Stateless** : chaque paquet est évalué indépendamment → il faut des règles dans les deux sens.

> UFW est **stateful** par défaut : `ufw allow 443/tcp` suffit, les réponses sont autorisées automatiquement.

## 5. Le 5-tuple dans le dépannage réseau

Quand un flux ne passe pas, on décompose le 5-tuple pour trouver le maillon cassé (voir [[troubleshooting]]) :

```
1. Source IP     → l'IP est-elle correcte ? (DHCP ? voir [[dhcp]])
2. Destination IP → la résolution DNS a-t-elle fonctionné ? (voir [[dns]])
3. Source Port    → rarement le problème (port éphémère)
4. Destination Port → le bon service écoute-t-il ? (ss -tulpn)
5. Protocol       → TCP ou UDP ? (un firewall peut bloquer l'un et pas l'autre)
```

**Exemple** : « je ne peux pas accéder à mon site »
- IP source OK, IP destination OK (DNS résout)
- Port destination 443 → le service écoute ?
- Protocole TCP → le firewall laisse passer le TCP ?
- Si tout est OK côté 5-tuple → c'est peut-être le service applicatif (HTTP 500, TLS expiré, etc.)

## 6. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Je filtre sur le port source » | Le port source est éphémère et change à chaque connexion — on filtre sur le port **destination** |
| « Bloquer le port 80 suffit » | Le trafic peut passer en 443, 8080, 8443… la surface est plus large que le port 80 |
| « TCP et UDP sont pareils pour le firewall » | Un firewall stateful gère le TCP (connexions suivies) différemment de l'UDP (paquets indépendants) |
| « L'IP source est fiable » | L'IP source peut être **spoofée** (forgée) — c'est pour ça qu'on ne fait pas confiance au périmètre (voir [[perimeter-vs-zerotrust]]) |
| « Le 5-tuple couvre tout » | Non : il ne dit rien du **contenu** du paquet (payload) — d'où les firewalls applicatifs (WAF) |

## 7. En une ligne

> Le 5-tuple (source IP, destination IP, source port, destination port, protocole) est la carte d'identité d'un flux réseau — toute règle de firewall s'écrit en fonction de ces 5 champs, et savoir les décomposer est la base du dépannage réseau.

*Liens logiques : les règles de firewall concrètes → [[ufw]] · le dépannage réseau → [[troubleshooting]] · la résolution DNS qui fournit l'IP destination → [[dns]] · et la surface d'attaque se mesure en ports ouverts → [[malware]] (attack surface)*