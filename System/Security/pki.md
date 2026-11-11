---
tags: [security, crypto, pki, certificats, ca, tls, x509]
---

# PKI — Public Key Infrastructure (fiche du jour)

> **Définition rookie :** la PKI est l'**infrastructure** qui gère le cycle de vie des clés publiques : création, distribution, vérification, révocation. Sans elle, la cryptographie asymétrique (voir [[cryptography]]) n'est qu'une boîte à outils sans annuaire ni confiance — personne ne sait qui est qui.

**Analogie :** la cryptographie asymétrique, c'est la serrure et la clé. La PKI, c'est **l'état civil + la mairie + le registre des actes** : elle certifie que la clé publique de Bob appartient bien à Bob, et elle gère toute sa vie (naissance, renouvellement, mort).

## 1. L'écosystème — 6 composants

La PKI s'organise autour de **politiques, règles, protocoles, entités, matériels et logiciels** :

| Composant | Rôle |
|-----------|------|
| **Politiques (CP / CPS)** | les règles : qui peut avoir un certificat, comment, pour quoi (Certificate Policy / Certification Practice Statement) |
| **Protocoles** | comment on demande/vérifie/révoque : SCEP, EST, CMP, OCSP, CRL, ACME |
| **Entités** | CA, RA, serveur de registre, l'utilisateur (l'entité finale) |
| **Matériel** | HSM (Hardware Security Module) : la boîte physique qui protège les clés privées des CA |
| **Logiciel** | les outils : `openssl`, `certbot`, `step-ca`, `vault` |

## 2. Les 4 entités principales — expliquées

Les 4 entités, dans l'ordre où elles interviennent — comme un **guichet d'état civil** :

**1. L'Entité** (toi, ton serveur, ton navigateur)
C'est le demandeur. Elle crée sa propre paire de clés (publique + privée) et veut un certificat pour prouver « cette clé publique m'appartient ». Elle envoie une **CSR** (Certificate Signing Request) = « voici ma clé publique, mon nom, et une signature prouvant que je possède la clé privée ».

**2. La RA** (Registration Authority) — l'agent de guichet
Elle reçoit la CSR et **vérifie l'identité** : est-ce que la personne est bien qui elle dit être ? (vérification de documents, d'e-mail, de domaine). Elle ne signe RIEN — elle fait juste la vérification, comme un officier d'état civil qui contrôle ton passeport avant de délivrer l'acte.

**3. La CA** (Certificate Authority) — le maire qui signe
Une fois l'identité validée par la RA, la CA **signe le certificat** avec sa propre clé privée. C'est le tampon officiel : « je, la CA, certifie que cette clé publique appartient à cette entité ». Sa clé privée est le **trésor le plus protégé** de tout le système (dans un HSM, hors ligne pour le Root CA).

**4. Le Serveur de registre** (Repository) — le bureau des archives
Il **publie** les certificats signés pour que tout le monde puisse les consulter, et il répond aux questions : « ce certificat est-il encore valide, ou a-t-il été révoqué ? » (via OCSP ou CRL). C'est l'annuaire public.

### La chaîne en une ligne

```
Entité crée sa clé → envoie une CSR → RA vérifie l'identité → CA signe → Registre publie → tout le monde peut vérifier
```

### La séparation des rôles

La CA ne vérifie jamais l'identité (elle fait confiance à la RA), et la RA ne signe jamais (elle n'a pas la clé). Si une seule entité faisait les deux, une compromission suffirait à tout casser.

### Cas concret : la navigation web (HTTPS)

Dans la navigation web, **les 4 entités sont toutes présentes**, mais réparties différemment :

| Entité PKI | Qui joue le rôle | Exemple web |
|------------|------------------|-------------|
| **Entité** | le **serveur web** (et le navigateur côté client) | `example.com` présente son certificat au navigateur |
| **RA** | l'**autorité** qui vérifie que tu possèdes bien le domaine | Let's Encrypt vérifie que tu contrôles `example.com` (via DNS ou fichier) |
| **CA** | l'**autorité** qui signe le certificat | Let's Encrypt / DigiCert / Sectigo signe le certificat de `example.com` |
| **Serveur de registre** | l'**OCSP responder** + **CRL** + **logs de transparence** | le navigateur demande « ce certificat est-il révoqué ? » à l'OCSP responder |

Et le **navigateur** (ton Chrome/Firefox) fait office de **vérificateur** : il vérifie toute la chaîne jusqu'à un Root CA qui est dans sa liste de confiance (les Root CA sont pré-installés dans le navigateur/OS).

### Le cycle complet : avant et pendant la navigation

**Phase 1 — AVANT (la mise en place, une seule fois) :**

```
1. Serveur (entité) génère sa paire de clés (privée + publique)
2. Serveur envoie une CSR à la CA (via la RA qui vérifie l'identité du domaine)
3. CA signe le certificat (après validation RA)
4. Certificat publié au registre (OCSP/CRL)
5. Serveur installe le certificat (clé publique) + garde la clé privée
```

**Phase 2 — PENDANT chaque visite HTTPS (à chaque connexion) :**

```
1. Navigateur demande https://example.com
2. Serveur envoie son certificat (clé publique signée par la CA)
3. Navigateur vérifie la chaîne : cert → signé par Intermediate → signé par Root → Root dans ma liste de confiance ?
4. Navigateur demande au registre : "ce certificat est-il révoqué ?" → réponse OCSP
5. Si tout est valide → TLS handshake : navigateur chiffre la clé de session avec la clé PUBLIQUE du serveur
6. Serveur déchiffre avec sa clé PRIVÉE → il a la clé de session
7. Tout le trafic suivant est chiffré en symétrique avec cette clé de session
```

**En résumé :**
- **Avant** : la CA (après validation RA) génère et signe le certificat → il est publié au registre.
- **Pendant** : le navigateur vérifie le certificat (chaîne + révocation) → puis l'utilise pour chiffrer la clé de session avec la clé publique → le serveur déchiffre avec sa clé privée.

La clé privée ne quitte **jamais** le serveur. Le navigateur ne fait que **vérifier** le certificat et **utiliser** la clé publique pour chiffrer — il ne déchiffre jamais avec la clé privée.

**La navigation web n'est qu'un cas d'usage** — la PKI sert aussi pour :
- **E-mail** (S/MIME : chiffrer/signer des mails)
- **Code signing** (signer un logiciel pour prouver son origine)
- **VPN / 802.1X** (authentifier des machines sur un réseau)
- **Documents** (signatures électroniques légales)

Dans tous ces cas, les **4 entités** sont présentes : une entité demande, une RA vérifie, une CA signe, un registre publie/vérifie.

## 3. Le cycle de vie d'un certificat (les 5 étapes)

```
1. GÉNÉRATION    →  l'entité crée sa paire de clés (publique + privée)
2. DEMANDE       →  l'entité envoie une CSR (Certificate Signing Request) à la RA/CA
3. ÉMISSION      →  la CA vérifie (via RA) et signe le certificat
4. UTILISATION   →  le certificat sert pour TLS, signature, chiffrement
5. RÉVOCATION    →  avant expiration : révocation (compromission, perte) → CRL / OCSP
```

- **CSR** (Certificate Signing Request) : demande formelle contenant la clé publique + l'identité + une signature prouvant la possession de la clé privée.
- **Émission** : la CA signe le certificat avec sa clé privée → le certificat est **fiable** car signé par une autorité de confiance.
- **Révocation** : si la clé privée fuite ou l'entité est compromise, le certificat est révoqué **avant** sa date d'expiration — sinon il resterait valide jusqu'à échéance.

## 4. La chaîne de confiance (chain of trust)

Les certificats forment une **hiérarchie** :

```
Root CA (auto-signé, hors ligne, très protégé)
  └── Intermediate CA (signé par Root, en ligne)
        └── Certificat serveur (signé par Intermediate)
              └── ton navigateur vérifie toute la chaîne jusqu'à Root
```

- **Root CA** : le sommet, auto-signé (il signe lui-même). Sa clé privée ne sort jamais d'un HSM.
- **Intermediate CA** : signée par le Root, elle fait le travail quotidien (émettre les certificats). Si elle est compromise, on la révoque sans toucher au Root.
- **Certificat feuille (leaf)** : celui de ton serveur web, signé par l'Intermediate.

Le navigateur vérifie : « ce certificat est signé par X → X est signé par Root → Root est dans ma liste de confiance ? » → si oui, la chaîne est valide.

## 5. Vérifier un certificat : OCSP vs CRL

| Méthode | Comment | Forces/Faiblesses |
|---------|---------|-------------------|
| **CRL** (Certificate Revocation List) | liste de tous les certificats révoqués, téléchargée périodiquement | simple, mais la liste peut être énorme et pas à jour |
| **OCSP** (Online Certificate Status Protocol) | requête en ligne : « ce certificat précis est-il révoqué ? » | à jour, mais dépend du serveur (et révèle quels sites tu visites) |
| **OCSP Stapling** | le serveur web attache la réponse OCSP à son certificat | meilleure perf + meilleure confidentialité |

## 6. Les commandes (Linux)

```bash
# Voir le certificat d'un site
openssl s_client -connect example.com:443 -showcerts

# Inspecter un certificat local
openssl x509 -in cert.pem -text -noout

# Créer une clé privée + CSR
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr

# Auto-signer (pour les tests, pas la prod)
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes

# Vérifier la chaîne
openssl verify -CAfile ca.pem server.crt
```

## 7. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Un certificat auto-signé = pas sécurisé » | Il chiffre bien, mais personne ne vérifie l'identité → le navigateur avertit |
| « La CA vérifie tout manuellement » | La RA vérifie l'identité ; la CA signe. Deux rôles différents |
| « Révoquer = supprimer » | Révoquer = marquer comme invalide (CRL/OCSP) ; le certificat existe toujours |
| « Un certificat = une clé privée » | Non : le certificat contient la clé PUBLIQUE + l'identité ; la clé privée reste chez l'entité |
| « Le Root CA est en ligne » | Le Root CA est HORS LIGNE (HSM) ; seuls les Intermediate sont en ligne |
| Confondre CA et RA | CA = signe ; RA = vérifie l'identité (séparation des rôles) |

## 8. En une ligne

> La PKI est l'état civil des clés publiques : la CA signe, la RA vérifie l'identité, le registre publie, et l'entité détient sa clé — le tout gouverné par des politiques et protégé par des HSM.

*Liens logiques : la cryptographie asymétrique que la PKI certifie → [[cryptography]] · les certificats TLS protègent les communications → [[dns]] (DNSSEC) et [[ntp]] (heure juste pour la validation) · et un système bien posé intègre la PKI → [[system-building]]*