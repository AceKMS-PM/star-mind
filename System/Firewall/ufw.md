# UFW - Uncomplicated Firewall - Fiche Mémo

> **Date:** Aujourd'hui | **Niveau:** Rookie-friendly
> **Source:** Notes du jour - remis en forme, vérifié et complété

## 1. Philosophie UFW

UFW = surcouche simple à `iptables`.
Deux politiques par défaut à retenir :

- `default allow outgoing` = **Tout le sortant est autorisé** (ton serveur peut sortir vers internet)
- `default deny incoming` = **Tout l'entrant non spécifié est refusé** (par défaut on bloque tout ce qui entre)

> Rookie: UFW fonctionne avec une liste de règles ordonnées. Première règle qui match = appliquée.

## 2. Commandes de base

### Vérifier l'état

```bash
sudo ufw status
sudo ufw status verbose      # détaillé : politiques par défaut + logging + règles
sudo ufw status numbered     # avec numéros -> indispensable pour delete
sudo ufw show added          # voir les règles telles que tu les as tapées
```

Si `Status: inactive` -> `sudo ufw enable` (attention en SSH : autorise d'abord le port 22 !)

### Politiques par défaut (à faire en premier)

```bash
sudo ufw default allow outgoing
sudo ufw default deny incoming
```

### Autoriser / Refuser

```bash
# Autoriser un port / service
sudo ufw allow 22/tcp
sudo ufw allow 80
sudo ufw allow 443/tcp
sudo ufw allow ssh              # via nom de service connu (/etc/services)
sudo ufw allow 8080/tcp comment "API interne"

# Autoriser depuis une IP source vers un port précis (ton exemple)
sudo ufw allow from 192.168.1.10 to any port 22 proto tcp comment "SSH admin"
sudo ufw allow from IP_SOURCE to any port PORT proto tcp comment "Commentaire"
# ex concret:
sudo ufw allow from 203.0.113.5 to any port 3306 proto tcp comment "MySQL dev only"

# Refuser
sudo ufw deny 8080              # refuse tout accès à 8080 (tcp+udp)
sudo ufw deny 8080/tcp          # plus précis
sudo ufw deny from 1.2.3.4      # bloque une IP
```

### Rate-limit (anti brute-force)

```bash
sudo ufw limit 22/tcp           # rate-limit: max 6 connexions / 30s par IP
sudo ufw limit 22/tcp comment "SSH anti-bruteforce"
```
Rookie: `limit` = `deny` temporaire après 6 tentatives. Idéal pour SSH.

### Supprimer une règle

```bash
sudo ufw status numbered
sudo ufw delete 2               # supprime la règle numéro 2
# ou
sudo ufw delete allow 8080/tcp
```

## 3. Logging

```bash
sudo ufw logging on
sudo ufw logging medium         # niveaux: off, low, medium, high, full
sudo ufw logging off
```

Logs :

```bash
/var/log/ufw.log                # fichier principal
sudo tail -f /var/log/ufw.log
sudo dmesg | grep UFW
```

`medium` = log les paquets bloqués + nouveaux. Parfait au quotidien.

## 4. Workflow Rookie Recommandé

```bash
sudo ufw reset                  # repart à zéro (attention)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment "SSH - garde ton acces"
sudo ufw allow 80,443/tcp comment "Web"
sudo ufw limit 22/tcp
sudo ufw enable                 # active au boot
sudo ufw status verbose
```

## 5. Tableau Mémo

| But | Commande |
|-----|----------|
| Voir status | `sudo ufw status verbose` |
| Voir avec numéros | `sudo ufw status numbered` |
| Voir règle brute | `sudo ufw show added` |
| Autoriser port | `sudo ufw allow PORT/proto` |
| Autoriser service | `sudo ufw allow ssh` |
| Autoriser IP -> port | `sudo ufw allow from IP to any port PORT proto tcp` |
| Bloquer port | `sudo ufw deny 8080/tcp` |
| Limiter | `sudo ufw limit PORT/proto` |
| Supprimer | `sudo ufw delete NUMERO` |
| Logs medium | `sudo ufw logging medium` + `tail -f /var/log/ufw.log` |
| Désactiver | `sudo ufw disable` |

## 6. Erreurs Fréquentes

1. **Tu te bloques en SSH** : Toujours `allow 22/tcp` AVANT `enable`.
2. **`ufw allow 8080` ouvre tcp+udp** : Précise `/tcp` si tu veux seulement tcp.
3. **Ordre des règles compte** : `status numbered` pour vérifier.
4. **Oublier `comment`** : Ajoute toujours un commentaire, tu reliras dans 3 mois.

---
*Prochaine fiche : `iptables` vs `ufw`, `fail2ban + ufw`, ou la méthode complète : [[troubleshooting]]*
