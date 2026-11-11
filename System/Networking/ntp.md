---
tags: [network, system, ntp, temps, protocole]
---

# NTP — remettre l'heure à l'heure (fiche du jour)

> **Définition rookie :** le NTP (Network Time Protocol) synchronise **l'horloge de ta machine** avec des serveurs de temps très précis. Une machine à la mauvaise heure, c'est des logs inexploitables, des certificats TLS refusés et des tickets d'authentification qui expirent.

**Analogie :** l'horloge de la gare. Tout le monde règle sa montre dessus. Si chacun avait sa montre libre, personne ne pourrait comparer les heures de départ — en informatique, comparer les heures, c'est **tout** (les logs, les transactions, les mises à jour).

## 1. La hiérarchie (stratum)

```
Stratum 0   horloges atomiques (césium) — le temps de référence
Stratum 1   serveurs connectés DIRECTEMENT à une horloge atomique
Stratum 2/3 serveurs synchronisés entre eux (fr.pool.ntp.org, time.google.com)
Clients     ta machine, tes serveurs, tes VM
```

Serveurs publics usuels : `fr.pool.ntp.org`, `pool.ntp.org`, `time.google.com` (Chrome/Android), `time.cloudflare.com`.

## 2. Comment ça marche (pas un simple « règle ta montre »)

- Le client demande l'heure et mesure le **délai aller-retour** (round-trip).
- Il calcule son **offset** (décalage) par rapport au serveur.
- Il **corrige par petits ajustements** progressifs — jamais un saut brutal (sinon les timestamps du système sautent).
- Il corrige aussi la **dérive** (drift) : l'horloge matérielle avance/retarde naturellement, NTP la remet sur le rail en continu.

> Port : **UDP 123**. Les secondes intercalaires (leap seconds) existent pour compenser la rotation terrestre — le NTP les gère (avec les débats qu'on imagine).

## 3. NTP vs SNTP

| | NTP | SNTP |
|-|-----|------|
| Précision | sub-milliseconde, algorithme complet | version simplifiée, ~10–100 ms |
| Usage | serveurs, infra critique | appareils simples, résolveurs, embarqué |
| Client typique | `chronyd`, `ntpd` | certains routeurs, IoT |

## 4. Côté Linux

```bash
timedatectl                     # heure locale, UTC, synchronisée ? (oui/non)
timedatectl set-ntp true        # active la synchro NTP
timedatectl timesync-status     # détails : serveur, offset, dernière synchro
chronyc sources                 # serveurs configurés (chrony)
chronyc tracking                # suivi et précision de chaque source
ntpq -p                         # si tu utilises ntpd classique
```

Implantations courantes : **systemd-timesyncd** (défaut sur beaucoup de distros, simple), **chrony** (précis et résilient — parfait pour machines virtualisées ou avec des coupures réseau), **ntpd** (le classique historique).

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « L'heure est décalée de 2 h, c'est le NTP » | 2 h = fuseau horaire (TZ), pas NTP. NTP règle l'UTC, la TZ décide l'affichage |
| Port 123 bloqué au pare-feu | Pas de synchro, et l'horloge dérive lentement sans qu'on le voie — vois [[ufw]] |
| VM qui dérive sans arrêt | Les machines virtuelles sont les pires : l'horloge hôte saute → voir [[guest-host]] ; chrony les gère mieux |
| « J'ai mis l'heure à la main, c'est réglé » | Non : la dérive revient, et une heure réglée à la main n'a aucune précision |
| RTC configurée en heure locale | Compatible Windows, mauvais pour Linux (qui attend l'UTC) → double dérive |

## 6. Sécurité (le pourquoi)

- **Faux serveur NTP** : faire croire à la machine qu'il est 5 ans dans le passé → certificats TLS refusés, tickets Kerberos expirés, time-based tokens invalides.
- **Amplification NTP** : des serveurs mal configurés servent de vecteur de DDoS (réflexion). D'où : sources officielles, NTPsec/authNTP, et restreindre qui peut interroger ton serveur.
- L'heure exacte est un **prérequis de sécurité silencieux** : Kerberos, TLS, DNSSEC, TOFU… tout dépend de l'horloge.

## 7. En une ligne

> NTP, c'est l'horloge de la gare pour les machines : petits ajustements continus, jamais de saut brutal, et si personne ne répond (UDP 123 bloqué), ta montre dérive sans que tu t'en rendes compte.

*Liens logiques : en dépannage, une heure fausse peut tout fausser → [[troubleshooting]] · la config de l'heure arrive aussi par [[dhcp]] (option 42) · et les VM doivent se resynchroniser → [[guest-host]]*