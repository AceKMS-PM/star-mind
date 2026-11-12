---
tags: [security, protocols, ssh, https, smime, ipsec, tls, tls-handshake]
---

# Protocoles de sécurité — SSH, HTTPS, S/MIME, IPsec (fiche du jour)

> **Définition rookie :** un protocole de sécurité, c'est un **ensemble de règles** qui définissent comment deux machines communiquent de façon sécurisée : authentification, chiffrement, intégrité. Chaque protocole protège une couche différente (application, transport, réseau).

**Analogie :** les protocoles, c'est la **langue et les règles de politesse** entre deux personnes. SSH = parler en privé dans un bureau fermé. HTTPS = parler en public mais dans une enveloppe scellée. S/MIME = envoyer une lettre signée et chiffrée. IPsec = blindé le tunnel entier entre deux bâtiments.

## 1. SSH — Secure Shell (couche application)

**Définition :** protocole pour accéder à distance à une machine via un terminal chiffré. Remplace Telnet (qui envoyait tout en clair).

### Le handshake SSH (l'échange de clés)

```
Client ──► Serveur : "Bonjour, je supporte ces algos"
Serveur ──► Client : "Bonjour, voici ma clé publique hôte"
Client ──► Serveur : "Voici ma clé publique (échange Diffie-Hellman)"
    → les deux calculent un secret partagé (clé de session)
Serveur ──► Client : "Authentifie-toi (mot de passe ou clé)"
Client ──► Serveur : "Voici ma clé publique (auth par clé) ou mon mot de passe"
Serveur ──► Client : "OK, session chiffrée ouverte"
```

### Authentification par clé (la méthode sûre)

```bash
# Générer une paire de clés
ssh-keygen -t ed25519 -C "mon@email.com"

# Copier la clé publique sur le serveur
ssh-copy-id user@serveur

# Se connecter (sans mot de passe)
ssh user@serveur
```

**Pourquoi c'est sûr :** la clé privée reste sur le client, la clé publique est sur le serveur. Le serveur vérifie que le client possède la clé privée correspondante (challenge-response) — jamais le mot de passe ne transite.

### Pièges rookie SSH

| Piège | Réalité |
|-------|---------|
| « SSH = Telnet chiffré » | Non : SSH authentifie le serveur (clé hôte) + le client (clé/mot de passe) |
| « Le mot de passe est chiffré » | Oui en transit, mais l'auth par clé est plus sûre (pas de mot de passe à deviner) |
| « SSH ne protège que le terminal » | Non : SSH fait aussi du tunneling (port forwarding) |

## 2. HTTPS / TLS — Secure Web (couche application/transport)

**Définition :** HTTPS = HTTP + TLS. TLS chiffre la communication entre le navigateur et le serveur web. Voir [[certificate]] et [[pki]] pour la PKI derrière.

### Le handshake TLS 1.3 (simplifié)

```
Client ──► Serveur : "ClientHello" (algos supportés, clé publique éphémère)
Serveur ──► Client : "ServerHello" (algo choisi, certificat, clé publique éphémère)
Serveur ──► Client : "Finished" (preuve que le serveur possède la clé privée)
Client ──► Serveur : "Finished" (preuve que le client a bien reçu)
    → les deux calculent le même secret partagé (clé de session)
    → tout le trafic suivant est chiffré en symétrique (AES)
```

**Ce que TLS garantit :**
- **Confidentialité** : le trafic est chiffré.
- **Intégrité** : le trafic n'est pas modifié en route (MAC/HMAC).
- **Authenticité** : le serveur est bien qui il prétend être (certificat signé par une CA).

**TLS 1.2 vs TLS 1.3 :**
- TLS 1.3 : handshake en 1 aller-retour (plus rapide), supprime les algos faibles, chiffre plus tôt.
- TLS 1.2 : handshake en 2 aller-retours, supporte des algos obsolètes (RC4, 3DES).

## 3. S/MIME — Secure Email (couche application)

**Définition :** S/MIME (Secure/Multipurpose Internet Mail Extensions) chiffre et signe les e-mails. Il utilise la PKI (voir [[pki]] et [[certificate]]) pour l'authentification.

### Les deux opérations

| Opération | Ce qu'elle fait | Qui peut vérifier/lire |
|-----------|----------------|------------------------|
| **Signature** | signe le mail avec la clé privée de l'expéditeur | tout le monde avec la clé publique de l'expéditeur |
| **Chiffrement** | chiffre le mail avec la clé publique du destinataire | seul le destinataire avec sa clé privée |

```
Alice veut envoyer un mail signé et chiffré à Bob :
1. Alice signe le mail avec sa clé PRIVÉE → signature
2. Alice chiffre le mail avec la clé PUBLIQUE de Bob → chiffré
3. Bob déchiffre avec sa clé PRIVÉE → mail en clair
4. Bob vérifie la signature avec la clé PUBLIQUE d'Alice → "c'est bien Alice"
```

**Forces :** authentification + confidentialité + intégrité + non-répudiation (voir [[cryptography]] §2).

**Faiblesses :** nécessite une PKI (certificats pour tous), gestion des clés complexe, pas de chiffrement de l'objet ni des métadonnées (seul le corps est chiffré).

## 4. IPsec — Internet Protocol Security (couche réseau)

**Définition :** IPsec chiffre et authentifie le trafic au **niveau IP** (couche 3). Contrairement à TLS (couche application) ou SSH (couche application), IPsec protège **tout le trafic** entre deux points, quel que soit le protocole applicatif.

### Les deux modes

| Mode | Ce qui est protégé | Usage |
|------|-------------------|-------|
| **Transport** | seulement le payload (données) | communication hôte-à-hôte |
| **Tunnel** | tout le paquet IP (en-tête + payload) | VPN site-à-site, VPN client |

```
Mode Tunnel (VPN site-à-site) :
┌─────────────────────────────────────────────┐
│ Nouvel en-tête IP (externe)                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Paquet IP original (chiffré)            │ │
│ │ ┌─────────────────────────────────────┐ │ │
│ │ │ Données (chiffrées)                 │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Les protocoles IPsec

| Protocole | Rôle |
|-----------|------|
| **AH** (Authentication Header) | authentifie le paquet (intégrité) mais ne chiffre pas |
| **ESP** (Encapsulating Security Payload) | chiffre ET authentifie le paquet (le plus utilisé) |
| **IKE** (Internet Key Exchange) | négocie les clés et les paramètres de sécurité |

**IPsec est le standard pour les VPN** : site-à-site (entre deux routeurs) et client-à-site (VPN d'entreprise).

## 5. Comparaison des protocoles

| Protocole | Couche | Protège | Authentifie | Chiffre | Usage typique |
|-----------|--------|---------|-------------|---------|---------------|
| **SSH** | Application | terminal, tunneling | clé/mot de passe | oui | admin serveur |
| **HTTPS/TLS** | Application/Transport | trafic web | certificat (PKI) | oui | navigation web |
| **S/MIME** | Application | e-mail | certificat (PKI) | oui | mail signé/chiffré |
| **IPsec** | Réseau | tout le trafic IP | clé pré-partagée/certificat | oui | VPN, site-à-site |

## 6. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « HTTPS = HTTP chiffré » | Oui, mais TLS authentifie aussi le serveur (certificat) — pas juste le chiffrement |
| « SSH remplace IPsec » | Non : SSH protège une session applicative, IPsec protège tout le trafic réseau |
| « S/MIME chiffre l'objet du mail » | Non : seul le corps est chiffré ; l'objet et les métadonnées restent en clair |
| « IPsec = VPN » | IPsec est un protocole ; le VPN est un service qui utilise souvent IPsec |
| « TLS 1.2 = TLS 1.3 » | Non : TLS 1.3 est plus rapide et plus sûr ; TLS 1.2 supporte des algos obsolètes |

## 7. En une ligne

> SSH protège le terminal, HTTPS/TLS protège le web, S/MIME protège le mail, IPsec protège le réseau — chacun à sa couche, avec la PKI et la cryptographie asymétrique comme fondation commune.

*Liens logiques : la PKI qui certifie les serveurs → [[pki]] et [[certificate]] · la cryptographie asymétrique sous-jacente → [[cryptography]] · les certificats et leur cycle de vie → [[ca-trust]] · et la vérification dans le navigateur → [[dns]] (DNSSEC) et [[ntp]] (heure juste pour TLS)*