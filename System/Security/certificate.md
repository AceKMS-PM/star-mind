---
tags: [security, crypto, pki, certificats, x509, tls]
---

# Certificat numérique — les composants et le standard X.509 (fiche du jour)

> **Définition rookie :** un certificat numérique, c'est la **carte d'identité** d'une clé publique. Il dit : « cette clé publique appartient à cette entité, et je (la CA) le garantis ». Sans certificat, une clé publique flottante ne prouve rien.

**Analogie :** le certificat, c'est ton passeport. Il contient ton identité (nom, photo, nationalité), il est signé par une autorité (la mairie/État), il a une date d'expiration, et il peut être révoqué. La clé publique, c'est la « photo » — le certificat, c'est le passeport complet avec le cachet officiel.

## 1. Le standard X.509 — le format universel

**X.509** est le standard international (ITU-T / RFC 5280) qui définit la structure des certificats numériques. Presque tous les certificats web (HTTPS) sont des **certificats X.509 v3**.

```
Un certificat X.509 = une structure ASN.1 encodée en DER (binaire)
                     ou en PEM (texte base64 avec -----BEGIN CERTIFICATE-----)
```

**Le format PEM** (le plus courant) :
```
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
...
-----END CERTIFICATE-----
```

## 2. Les composants d'un certificat X.509

Un certificat contient **7 champs principaux** :

| Champ | Rôle | Exemple |
|-------|------|---------|
| **Version** | version du standard X.509 | v3 (la plus courante) |
| **Serial Number** | numéro unique attribué par la CA | `04:00:00:00:00:01:15:4b:5a:...` |
| **Issuer** | qui a **signé** le certificat (la CA) | `CN=Let's Encrypt R3, O=Let's Encrypt, C=US` |
| **Subject** | à qui appartient le certificat (l'entité) | `CN=example.com, O=Example Inc, C=FR` |
| **Validity** | période de validité (notBefore / notAfter) | `2024-01-01` → `2024-04-01` |
| **Subject Public Key Info** | la clé publique de l'entité + l'algorithme | `rsaEncryption (2048 bits)` + la clé |
| **Signature** | la signature de la CA (preuve d'authenticité) | algorithme utilisé + valeur de la signature |

### 2.1 Les extensions v3 (les ajouts importants)

La version 3 ajoute des **extensions** qui précisent l'usage :

| Extension | Rôle |
|-----------|------|
| **Subject Alternative Name (SAN)** | les domaines couverts (`example.com`, `www.example.com`, `*.example.com`) |
| **Key Usage** | à quoi sert la clé (signature, chiffrement, signature de certificat) |
| **Extended Key Usage** | usage précis : `serverAuth` (TLS serveur), `clientAuth` (TLS client), `codeSigning` |
| **Basic Constraints** | indique si c'est une CA (`CA:TRUE`) ou un certificat feuille (`CA:FALSE`) |
| **Authority Key Identifier** | identifie la clé de la CA qui a signé |
| **Subject Key Identifier** | identifie la clé de l'entité |

> **Le SAN est le champ le plus important aujourd'hui** : c'est lui qui dit quels domaines le certificat couvre. Le `Common Name` (CN) du Subject est devenu secondaire.

## 3. Les types de certificats

| Type | Vérification | Usage |
|------|-------------|-------|
| **DV** (Domain Validation) | prouve qu'on contrôle le domaine (DNS ou fichier) | sites web standard (Let's Encrypt) |
| **OV** (Organization Validation) | vérifie l'organisation (documents, existence légale) | sites d'entreprise |
| **EV** (Extended Validation) | vérification approfondie de l'organisation | banques, sites à haute confiance |
| **Wildcard** | couvre `*.example.com` (tous les sous-domaines) | sites avec de nombreux sous-domaines |
| **Multi-SAN** | liste de domaines explicites dans le SAN | plusieurs domaines dans un seul certificat |
| **Self-signed** | signé par lui-même (pas de CA) | tests, développement, réseaux internes |

## 4. Les commandes (Linux)

```bash
# Inspecter un certificat (tous les champs)
openssl x509 -in cert.pem -text -noout

# Voir seulement le Subject, Issuer, dates
openssl x509 -in cert.pem -noout -subject -issuer -dates

# Voir les SAN
openssl x509 -in cert.pem -noout -ext subjectAltName

# Vérifier la chaîne complète
openssl verify -CAfile ca-chain.pem server.crt

# Récupérer le certificat d'un site web
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | openssl x509 -text -noout

# Convertir PEM → DER (binaire)
openssl x509 -in cert.pem -out cert.der -outform DER

# Convertir DER → PEM
openssl x509 -in cert.der -inform DER -out cert.pem
```

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| Confondre certificat et clé privée | Le certificat contient la clé PUBLIQUE ; la clé privée reste sur le serveur |
| Penser que le CN suffit | Aujourd'hui c'est le SAN qui fait foi ; un CN sans SAN est ignoré par les navigateurs |
| Un certificat expiré = « pas grave » | Le navigateur refuse la connexion → le site est inaccessible |
| Auto-signé = « pas de chiffrement » | Il chiffre bien, mais l'identité n'est pas vérifiée → avertissement navigateur |
| Oublier de renouveler | Les certificats DV durent 90 jours (Let's Encrypt) → automatiser avec certbot |
| Confondre révocation et expiration | Révocation = invalidé avant la date ; expiration = date atteinte naturellement |

## 6. En une ligne

> Un certificat X.509 est la carte d'identité d'une clé publique : il contient l'identité, la clé, la période de validité, et la signature de la CA qui garantit le tout — le SAN étant le champ qui dit quels domaines sont couverts.

*Liens logiques : la PKI qui génère et gère ces certificats → [[pki]] · la cryptographie asymétrique qu'ils certifient → [[cryptography]] · la vérification dans le navigateur → [[dns]] (DNSSEC) et [[ntp]] (heure juste pour la validation) · et un système bien posé intègre les certificats → [[system-building]]*