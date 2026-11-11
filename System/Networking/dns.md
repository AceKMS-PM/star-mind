---
tags: [network, system, dns, resolver, domaines]
---

# DNS — l'annuaire d'internet (fiche du jour)

> **Définition rookie :** le DNS (Domain Name System) traduit un **nom** (`example.com`) en **IP** (`93.184.216.34`). C'est l'annuaire téléphonique d'internet — personne ne mémorise les numéros, tout le monde mémorise les noms.

**Analogie :** une hôtesse. Tu lui dis « je veux parler au standard de l'entreprise X » ; elle ne connaît pas le numéro par cœur, mais elle sait à **qui demander** — une hiérarchie d'annuaires de plus en plus précis, jusqu'à la fiche exacte.

## 1. Les types de serveurs (ta leçon du jour)

| Serveur | Rôle | Qui le gère |
|---------|------|-------------|
| **Resolver (récursif)** | le premier contacté par TA machine (`/etc/resolv.conf` ou via [[dhcp]]) ; il va chercher la réponse **pour toi** et la **met en cache** | FAI, Cloudflare, Google, `systemd-resolved` |
| **Root servers** | ne connaissent RIEN des domaines, mais savent **qui gère chaque TLD** (`.com`, `.fr`…) | 13 « racines » (A–M), ~1000 instances anycast (ICANN/Verisign…) |
| **TLD servers** (registre) | pour `.com`, c'est Verisign : ils savent qui est **l'autorité** pour `example.com` | registres de TLD |
| **Faisant autorité (authoritative/NS)** | la réponse **finale** pour `example.com` : ses enregistrements A, MX, etc. | le propriétaire du domaine (registrar/hébergeur) |
| **Cache** | toutes les réponses intermédiaires stockées pour accélérer | partout (résolveur, OS, navigateur) |

## 2. La résolution pas-à-pas

```
ta machine → resolver « example.com ? »
resolver  → root « .com ? »      → « demande au serveur .com »
resolver  → .com « example.com ? » → « demande à ns1.example.com »
resolver  → ns1.example.com « ? »   → « 93.184.216.34 »  ✅
resolver  → ta machine (et garde en cache pour le TTL)
```

Sans cache, chaque visite coûterait ~3 aller-retours. Le **TTL** (Time To Live) dit combien de temps une réponse peut être réutilisée — il explique pourquoi un changement de DNS peut mettre des heures à se propager.

## 3. Les enregistrements à connaître

| Record | Signification |
|--------|---------------|
| `A` | nom → IPv4 |
| `AAAA` | nom → IPv6 |
| `CNAME` | alias (www → domaine) |
| `MX` | serveur de messagerie |
| `NS` | délégation de sous-domaine / autorité |
| `TXT` | texte (SPF, DKIM pour le mail, vérifications de domaine) |
| `SOA` | point de départ de la zone (autorité de la zone) |

## 4. Commandes (Linux)

```bash
cat /etc/resolv.conf         # quel resolver j'utilise ?
dig example.com              # réponse + TTL + serveur qui a répondu
dig @8.8.8.8 example.com     # force un resolver différent (test)
dig +trace example.com       # montre la hiérarchie root → TLD → autorité
dig example.com MX           # enregistrements mail
host example.com             # version courte
whois example.com            # registrar, dates, NS (qui possède)
```

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « J'ai modifié /etc/resolv.conf » | NetworkManager/DHCP l'**écrase** au reboot — il faut configurer le gestionnaire réseau |
| « Le DNS a changé mais rien ne bouge » | Cache local (systemd-resolved, navigateur) + TTL des résolveurs en amont |
| « J'ai un domaine chez GoDaddy donc je DNS chez GoDaddy » | Registrar ≠ fournisseur DNS ≠ hébergeur : trois rôles, souvent 3 acteurs |
| `ping: unknown host` | Le resolver ne résout pas (config, réseau coupé, serveur DNS down) — vois [[troubleshooting]] |
| Confondre IP locale et publique | `dig` renvoie l'IP **publique** du domaine, pas ton IP locale |

## 6. Sécurité (le pourquoi)

- **Spoofing / empoisonnement de cache** : fausser une réponse DNS → envoyer l'utilisateur sur un site pirate. Contre-mesures : **DNSSEC** (signature des réponses), DoH/DoT (DNS chiffré).
- **Malware** : beaucoup modifient les resolvers pour détourner le trafic. D'où l'importance de vérifier `/etc/resolv.conf` et les réglages routeur.
- **Split-horizon / DNS interne** : le même nom peut donner une IP interne sur ton réseau et une IP publique dehors — normal et voulu en entreprise.

## 7. En une ligne

> Le DNS est l'annuaire à plusieurs étages : l'hôtesse (resolver) demande à la réception centrale (root), qui oriente vers le bureau du TLD, qui pointe vers la fiche exacte (autorité) — et tout le monde note la réponse pour la prochaine fois.

*Liens logiques : l'adresse du resolver arrive souvent par [[dhcp]] · un nom qui ne résout pas se dépanne avec la méthode → [[troubleshooting]] · c'est le service n°1 à vérifier en sortie de routeur*