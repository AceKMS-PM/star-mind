---
tags: [network, system, security, mac, switching, sniffing, spoofing, ports]
---

# MAC Spoofing, Sniffing & Sécurisation des switches (fiche du jour)

> **Définition rookie :** au niveau 2 (liaison de données), les machines s'identifient par leur **adresse MAC**. Le **MAC spoofing** c'est usurper une adresse MAC pour se faire passer pour quelqu'un d'autre. Le **MAC sniffing** c'est écouter le trafic sur le réseau pour capturer des MAC (et plus). Et la **sécurisation des switches** c'est empêcher ces attaques en contrôlant qui peut se connecter à quel port.

**Analogie :** l'adresse MAC, c'est le **numéro de série de ta carte d'identité**. Le MAC spoofing, c'est fabriquer une fausse carte avec le numéro de quelqu'un d'autre. Le MAC sniffing, c'est lire les numéros sur les cartes que les gens montrent. Et la sécurisation du switch, c'est le videur qui vérifie que le numéro correspond bien à la personne.

## 1. Rappel : l'adresse MAC

- **MAC** (Media Access Control) = adresse physique de la carte réseau, 48 bits (6 octets) en hexadécimal : `AA:BB:CC:DD:EE:FF`.
- Les 3 premiers octets = **OUI** (Organizationally Unique Identifier) → le fabricant.
- Les 3 derniers = l'identifiant unique de la carte.
- **Non routable** : la MAC ne traverse pas les routeurs (niveau 2 uniquement).

```bash
ip link show eth0           # voir sa MAC sous Linux
ip link set eth0 address 00:11:22:33:44:55   # changer sa MAC (spoofing !)
```

## 2. MAC Spoofing — usurper une identité

**Principe :** changer l'adresse MAC de sa carte réseau pour prendre celle de quelqu'un d'autre (ou d'un appareil autorisé).

**Pourquoi :**
- **Bypasser un filtrage MAC** : le switch n'accepte que certaines MAC → on prend celle d'un appareil autorisé.
- **Se faire passer pour le gateway** : usurper la MAC du routeur → intercepter tout le trafic (MITM).
- **Éviter la détection** : masquer son identité réelle.
- **Accéder à un réseau** : si l'accès est basé sur la MAC (sans authentification réelle).

**Comment ça marche :**
```
1. L'attaquant écoute le réseau (sniffing) pour trouver une MAC autorisée
2. Il change sa MAC pour celle de l'appareil autorisé
3. Le switch met à jour sa table CAM (MAC → port)
4. L'attaquant reçoit le trafic destiné à l'appareil usurpé
```

## 3. MAC Sniffing — écouter le réseau

**Principe :** mettre sa carte réseau en **mode promiscuous** pour capturer tout le trafic qui passe sur le segment réseau, pas seulement celui qui lui est destiné.

**Comment :**
```bash
# Mettre la carte en mode promiscuous
ip link set eth0 promisc on
# Capturer le trafic avec tcpdump
tcpdump -i eth0 -w capture.pcap
# Analyser avec Wireshark
```

**Ce qu'on capture :**
- Les adresses MAC source/destination de chaque trame
- Les protocoles de niveau 2 (ARP, STP, CDP, LLDP)
- Les données non chiffrées (HTTP, FTP, Telnet, DNS non chiffré)
- Les requêtes ARP (qui révèlent les IP/MAC du réseau)

**Le piège** : sur un **switch**, le trafic n'est pas broadcasté à tout le monde (contrairement à un hub). Le switch envoie chaque trame **uniquement au port destinataire**. Donc le sniffing sur un switch nécessite soit :
- Un **port mirroring** (SPAN) configuré par l'admin
- Une attaque **ARP spoofing** pour rediriger le trafic
- Un **hub** (rare aujourd'hui)

## 4. Sécurisation des switches — les contre-mesures

### 4.1 Port Security (sécurité de port)

Le switch **mémorise** les MAC autorisées sur chaque port et bloque les autres.

```bash
# Cisco IOS (exemple de config)
switchport mode access
switchport port-security
switchport port-security maximum 1          # 1 MAC par port
switchport port-security mac-address sticky # apprend et mémorise la MAC
switchport port-security violation shutdown # si violation → port éteint
```

**Modes de violation :**
| Mode | Comportement |
|------|-------------|
| **shutdown** | éteint le port (le plus sûr) |
| **restrict** | bloque le trafic mais garde le port actif + log |
| **protect** | bloque le trafic sans log |

### 4.2 Autres contre-mesures

| Contre-mesure | Rôle |
|---------------|------|
| **DHCP Snooping** | empêche les serveurs DHCP pirates (rogue DHCP) — voir [[dhcp]] |
| **Dynamic ARP Inspection (DAI)** | valide les requêtes ARP pour empêcher l'ARP spoofing |
| **802.1X** | authentification au niveau du port (RADIUS) — voir [[zero-trust-access-rbac]] |
| **VLAN segmentation** | isoler les groupes d'utilisateurs (pas de sniffing inter-VLAN) |
| **MAC filtering** | liste blanche de MAC autorisées (faible, car contournable par spoofing) |
| **Disable unused ports** | éteindre les ports non utilisés (réduire la surface d'attaque) |

### 4.3 802.1X — l'authentification au port

Le **standard 802.1X** authentifie l'appareil avant de lui donner accès au réseau :

```
Appareil ──► Switch (authenticator) ──► Serveur RADIUS (authenticator server)
              "Qui es-tu ?"               "Vérifie les credentials"
              "OK, tu peux passer"         "Validé / Refusé"
```

- L'appareil envoie ses credentials (certificat, username/password) au switch.
- Le switch les transmet au serveur RADIUS.
- Si validé → le port s'ouvre. Sinon → bloqué.

> **C'est le ZTA au niveau 2** (voir [[perimeter-vs-zerotrust]]) : pas de confiance par défaut, chaque port vérifie l'identité.

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Le MAC filtering suffit » | Non : le MAC est facilement spoofable (`ip link set address`) |
| « Le switch protège contre le sniffing » | Non : un switch sans sécurité (port mirroring, ARP spoofing) laisse sniffer |
| « Mode promiscuous = invisible » | Non : le switch peut détecter le mode promiscuous sur certains modèles |
| « MAC = identité fiable » | Non : la MAC n'est qu'une adresse, pas une preuve d'identité (pas de crypto) |
| « Désactiver les ports inutilisés = inutile » | Non : un port ouvert inutilisé = une porte d'entrée potentielle |

## 6. En une ligne

> Le MAC spoofing usurpe une identité niveau 2, le MAC sniffing écoute le trafic, et la sécurisation des switches (port security, 802.1X, DAI) est la défense — mais le MAC n'est pas une preuve d'identité, donc la vraie sécurité est au niveau 3+ (Zero Trust, voir [[zero-trust-access-rbac]]).

*Liens logiques : le réseau se dépanne avec la méthode → [[troubleshooting]] · le 5-tuple que le firewall regarde → [[five-tuple]] · le DHCP qui distribue les IP → [[dhcp]] · et la sécurisation du réseau est une couche du système → [[system-building]]*