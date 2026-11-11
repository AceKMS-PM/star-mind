---
tags: [network, system, troubleshooting, methodologie, linux]
---

# Troubleshooting Réseau — la méthode en 6 étapes (fiche du jour)

> **Définition rookie :** le troubleshooting, c'est **résoudre un problème de façon méthodique et reproductible** — pas au hasard. On suit une boucle : on observe, on suppose, on teste, on corrige, on note, et on recommence jusqu'à ce que ce soit réglé. Ça marche pour le réseau, mais aussi pour tout problème technique.

**Analogie :** tu es un détective. Le symptôme est l'indice, ta théorie est le suspect, le test est l'interrogatoire, et le rapport final est ce qui évite au prochain crime (le même bug) de se reproduire.

## 1. La boucle en 6 étapes

```
        ┌──────────── 6. Recommencer (si le problème persiste)
        ▼
  1. IDENTIFIER le problème ──► 2. ÉTABLIR une théorie ──► 3. TESTER la théorie
        ▲                                                       │
        └──────────── 5. DOCUMENTER et revue ◄─── 4. RÉSOUDRE ◄─┘
```

| # | Étape | Règle d'or |
|---|-------|------------|
| 1 | **Identifier** | Décris le SYMPTÔME (quoi ? qui ? quand ? depuis quand ?), **sans diagnostiquer**. « Pas de web » ≠ « le DNS est cassé » — c'est une théorie, pas l'observation |
| 2 | **Établir une théorie** | Une hypothèse à la fois, la plus probable d'abord, classée de la plus simple à la plus complexe |
| 3 | **Tester la théorie** | Une commande qui peut la PROUVER **ou la détruire**. Un test qui ne peut pas échouer ne teste rien |
| 4 | **Résoudre** | Appliquer le fix (ou un workaround temporaire) |
| 5 | **Documenter et revue** | Ce qu'on a fait, pourquoi, les preuves → pour toi dans 3 mois |
| 6 | **Recommencer** | Le symptôme persiste ? → retour étape 2 avec une autre théorie |

## 2. Pourquoi tester UNE théorie à la fois

Si tu changes 3 choses et que « ça remarche », tu ne sais pas **laquelle** a marché → le bug reviendra. Une seule variable à la fois = un test propre.

## 3. Les commandes par étape (Linux, rien à installer)

### Identifier (voir l'état)
```bash
ip a                        # interfaces + IP (en panne ? sans IP ?)
ip route                    # table de routage (la passerelle existe ?)
ping -c 3 8.8.8.8           # ping IP publique (le réseau sort ?)
ping -c 3 mon-domaine.com   # ping par nom (le DNS résout ?)
curl -v https://example.com # HTTP avec détails (connexion, TLS, statut)
dig mon-domaine.com         # réponse DNS
ss -tulpn                   # quels ports écoutent
systemctl status mon-service
```

### Tester (traverser les couches)
```bash
traceroute -n 8.8.8.8       # où la route casse
dig @1.1.1.1 mon-domaine    # DNS avec un résolveur différent
nc -vz 192.168.1.1 443      # le port répond-il ? (connect)
ss -tn state established    # connexions réellement ouvertes
sudo tcpdump -i eth0 -n port 53   # voir les requêtes DNS partir
```

### Résoudre (exemples)
```bash
sudo systemctl restart networking   # ou le service concerné
sudo ip route add default via 192.168.1.1
sudo ufw status numbered            # un pare-feu qui bloque ? → voir [[ufw]]
echo "nameserver 1.1.1.1" | sudo tee /etc/resolv.conf   # DNS cassé
sudo systemctl reload NetworkManager
```

## 4. Exemple complet pas-à-pas : « je n'ai pas internet »

**1. Identifier** : navigateur → « site injoignable », ça marche pas depuis tout à l'heure. (Observation : pas de web du tout.)

**2-3. Théories testées dans l'ordre (du plus simple au plus complexe, en éliminant des couches) :**

| Théorie | Test | Résultat |
|---------|------|----------|
| Carte réseau HS | `ip a` → eth0 down | ✅ down → **coupable** |
| (sinon) Pas de passerelle | `ip route` → pas de défaut | → coupable |
| (sinon) IP privée réservée | `ip route` vers mauvais gateway | → coupable |
| (sinon) Le pare-feu bloque | `ufw status` + `ping 8.8.8.8` | → coupable |
| (sinon) DNS cassé | `ping 8.8.8.8` OK mais `ping domaine` non | → coupable |
| (sinon) Sortie ISP | `ping 8.8.8.8` KO, `ip a` OK → le modem/ISP | → coupable |

**4. Résoudre** : `sudo ip link set eth0 up` (et la vraie cause : le service réseau avait planté → `systemctl restart networking`).

**5. Documenter** : « eth0 down après mise en veille → restart networking. Cause racine : NetworkManager désactivé au boot. Fix durable : enable NetworkManager. »

**6. Vérifier** : `ping -c 3 8.8.8.8` → OK. **Pas fini** : on teste aussi le web et le DNS pour confirmer que tout est vert.

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| Sauter à une solution sans identifier | On change des trucs au hasard, on n'apprend rien |
| Diagnostiquer au lieu d'observer | « C'est le DNS » dit avant d'avoir pingé n'importe quoi |
| Plusieurs théories en parallèle | Si ça remarche, tu ne sais pas pourquoi |
| Changer plusieurs variables à la fois | Même résultat : fix non compris, non durable |
| Arrêter à « ça remarche » sans documenter | Le bug reviendra au prochain reboot et tu repartiras de zéro |
| Ignorer la cause racine | Un workaround sans fix = une bombe à retardement |

## 6. La règle d'or en une ligne

> **Observer avant de supposer, une hypothèse à la fois, et écrire ce que tu as appris — c'est ça qui transforme une galère en compétence.**

*Voir le pare-feu qui fait partie des suspects : [[ufw]] — et le tableau de bord : [[sheets]]*