---
tags: [network, system, dhcp, ip, protocole]
---

# DHCP — l'IP à la porte (fiche du jour)

> **Définition rookie :** le DHCP (Dynamic Host Configuration Protocol) distribue **automatiquement** une configuration réseau (IP, masque, passerelle, DNS, NTP) à chaque machine qui se connecte au réseau. Fini l'IP réglée à la main.

**Analogie :** le concierge d'un immeuble. À chaque arrivant, il donne la clé de la chambre (l'IP), le plan du bâtiment (la passerelle), et le numéro de l'annuaire (le DNS). Quand tu repars, il récupère la clé et la redonnera à quelqu'un d'autre.

## 1. Le dialogue DORA (4 messages)

```
Client (broadcast)        Serveur DHCP
    ── "Bonjour, qui peut me donner une IP ?" →  DISCOVER
    ← "Je te propose cette IP pour X minutes"   OFFER
    ── "Je la prends, cette IP-là"            →  REQUEST
    ← "C'est officiel, elle est à toi"          ACK
```

- **Discover** : le client envoie un **broadcast** (`255.255.255.255`) car il ne connaît pas encore le serveur.
- **Offer** : un (ou plusieurs !) serveur propose un **bail** (lease).
- **Request** : le client confirme l'offre retenue.
- **Ack** : le serveur valide. Le client applique la config.

## 2. Le bail (lease) et le renouvellement

L'IP n'est pas pour toujours, elle est **louée** :

- Bail typique : 24 h (configurable dans le **scope**).
- À **50 % du bail (T1)** : le client demande le renouvellement.
- À **87,5 % (T2)** : il réessaie en broadcast si le serveur n'a pas répondu.
- Si aucun serveur ne répond : le client garde l'IP un moment, puis retombe en **APIPA `169.254.x.x`** (lien local).

> **À retenir absolument : une IP en `169.254.x.x` = pas de DHCP qui répond.** C'est le symptôme le plus courant en dépannage → voir [[troubleshooting]].

## 3. Le vocabulaire du serveur

| Terme | Rôle |
|-------|------|
| **Scope / pool** | la plage d'IP distribuable (`192.168.1.100–200`) |
| **Exclusion** | IPs de la plage à NE PAS donner (réservées aux serveurs) |
| **Réservation** | MAC → IP fixe : cette machine aura toujours la même IP |
| **Bail** | durée de location + renouvellement T1/T2 |
| **Options** | infos annexes livrées avec l'IP (3=passerelle, 6=DNS, 42=NTP, 66/67=PXE/amorçage réseau) |
| **Rogue DHCP** | un serveur pirate qui distribue SA passerelle → interception de tout ton trafic (MITM) |

## 4. Côté client (Linux)

```bash
ip a                          # IP actuelle ? en 169.254 ? → pas de DHCP
dhclient -v eth0              # force la demande de bail sur eth0 (verbose)
cat /var/lib/dhcp/dhclient.leases   # l'historique des baux reçus
nmcli device show eth0        # config fournie (via NetworkManager)
journalctl -u systemd-networkd      # logs du service réseau
```

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| `169.254.x.x` = « IP bizarre » | C'est le drapeau rouge : aucun DHCP n'a répondu |
| Deux serveurs DHCP sur le même LAN | Chaos : le premier qui répond gagne, des machines changent d'IP en pleine journée |
| « IP statique = jamais de DHCP » | Sauf que la machine **utilise quand même** le serveur DHCP pour apprendre le DNS/gateway |
| Réservation faite mais IP change | La réservation doit être dans le bon scope et la bonne interface |
| Bail expiré au milieu d'une session | Normal si la machine reste branchée : elle renouvelle avant T1 |

## 6. En une ligne

> Le DHCP est le concierge du réseau : il pose une configuration à la porte, la reprend à la fin du bail, et si personne ne répond, la machine crie en `169.254`.

*Liens logiques : c'est le DHCP qui fournit l'adresse du resolver DNS → [[dns]] · et souvent l'heure → [[ntp]] · dans une VM, le Guest reçoit l'IP de l'hyperviseur → [[guest-host]]*