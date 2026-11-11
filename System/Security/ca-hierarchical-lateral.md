---
tags: [security, crypto, pki, ca, hierarchy, cross-certification, trust]
---

# CA hiérarchique vs latérale — les deux architectures de confiance (fiche du jour)

> **Définition rookie :** une CA peut être organisée de deux façons : en **hiérarchie** (un arbre avec un sommet unique) ou en **latéral** (des CA qui se font confiance mutuellement). La hiérarchie, c'est la norme ; la latérale, c'est le pont entre deux hiérarchies qui ne se connaissent pas.

**Analogie :** la hiérarchie, c'est une **entreprise** : un PDG (Root CA) qui délègue à des managers (Intermediate CA) qui supervisent des employés (certificats feuilles). La latérale, c'est **deux entreprises qui signent un accord de partenariat** : chacune garde son PDG, mais elles se reconnaissent mutuellement.

## 1. CA hiérarchique — l'arbre (le standard)

La hiérarchie est la structure classique : un **Root CA** au sommet, des **Intermediate CA** en dessous, et les **certificats feuilles** à la base.

```
                    ┌─────────────┐
                    │  Root CA    │  ← auto-signé, hors ligne, le sommet absolu
                    │  (offline)  │
                    └──────┬──────┘
                           │ signe
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Inter CA │ │ Inter CA │ │ Inter CA │  ← en ligne, font le travail quotidien
        │  (web)   │ │ (email)  │ │ (code)   │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             ▼            ▼            ▼
        ┌────────┐   ┌────────┐   ┌────────┐
        │ cert   │   │ cert   │   │ cert   │  ← certificats feuilles (serveurs, users)
        │ feuille│   │ feuille│   │ feuille│
        └────────┘   └────────┘   └────────┘
```

### Pourquoi cette structure

- **Séparation des risques** : le Root est hors ligne (HSM), les Intermediate sont en ligne. Si un Intermediate est compromis, on le révoque sans toucher au Root.
- **Délégation** : chaque Intermediate a une spécialité (web, e-mail, code signing) → moindre privilège.
- **Scalabilité** : le Root ne signe que les Intermediate (quelques-uns), pas des milliers de certificats feuilles.

### La vérification dans une hiérarchie

Le navigateur remonte la chaîne :

```
certificat feuille → signé par Intermediate → signé par Root → Root dans mon trust store ?
```

Si **toute** la chaîne remonte à un Root de confiance → ✅. Si un maillon manque (Intermediate non présent) → ❌ (erreur de chaîne incomplète).

## 2. CA latérale — la cross-certification (le pont)

**Définition rookie :** deux CA **indépendantes** qui se signent **mutuellement** leurs certificats. Chacune garde son Root, mais elles se font confiance — un **pont** entre deux hiérarchies séparées.

```
Hiérarchie A                          Hiérarchie B
┌─────────────┐                      ┌─────────────┐
│  Root CA A  │◄──── cross-cert ────►│  Root CA B  │
│  (offline)  │                      │  (offline)  │
└──────┬──────┘                      └──────┬──────┘
       │                                    │
       ▼                                    ▼
  ┌──────────┐                        ┌──────────┐
  │ Inter A  │                        │ Inter B  │
  └────┬─────┘                        └────┬─────┘
       │                                    │
       ▼                                    ▼
  ┌────────┐                            ┌────────┐
  │ cert A │                            │ cert B │
  └────────┘                            └────────┘
```

### Comment ça marche

1. La CA A signe le certificat de la CA B (avec sa clé privée) → « je fais confiance à B ».
2. La CA B signe le certificat de la CA A → « je fais confiance à A ».
3. Résultat : un utilisateur de A peut vérifier un certificat de B (et vice versa) en remontant la chaîne jusqu'au Root de A, puis en traversant le pont vers B.

### Quand l'utiliser

- **Fusion d'entreprises** : deux PKI existantes qui doivent se faire confiance sans tout reconstruire.
- **Partenariat inter-organisations** : deux entités qui échangent des données chiffrées/signées.
- **Migration** : passer d'une ancienne CA à une nouvelle sans casser l'existant.

### Les risques de la latérale

- **Surface d'attaque étendue** : si la CA B est compromise, la CA A l'est aussi (par le pont).
- **Complexité de la chaîne** : la vérification traverse deux hiérarchies → plus de chances d'erreur (chaîne incomplète, Root manquant).
- **Confiance aveugle** : cross-certifier = faire confiance à TOUTE la hiérarchie de l'autre. On ne peut pas choisir.

## 3. Hiérarchique vs Latérale — comparaison

| | Hiérarchique | Latérale (cross-cert) |
|-|-------------|----------------------|
| **Structure** | arbre unique, un sommet | deux (ou plus) arbres reliés par un pont |
| **Confiance** | déléguée de haut en bas | mutuelle entre CA de même niveau |
| **Complexité** | simple, linéaire | complexe, chaînes croisées |
| **Usage** | standard (99 % des cas) | fusions, partenariats, migrations |
| **Risque** | compromission d'un Intermediate = localisé | compromission d'une CA = propagation à l'autre |
| **Vérification** | une seule chaîne | plusieurs chemins possibles |

## 4. Les commandes (Linux)

```bash
# Voir la chaîne de confiance d'un site
openssl s_client -connect example.com:443 -showcerts

# Vérifier une chaîne avec un Root spécifique
openssl verify -CAfile root-ca.pem -untrusted intermediate.pem server.crt

# Créer un certificat cross-signed (la CA A signe la CA B)
openssl x509 -req -in ca-b.csr -CA ca-a.crt -CAkey ca-a.key \
  -CAcreateserial -out ca-b-cross.crt -days 365

# Inspecter le Basic Constraints (CA:TRUE ou CA:FALSE)
openssl x509 -in cert.pem -noout -text | grep -A2 "Basic Constraints"
```

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Cross-certifier = fusionner les CA » | Non : chacune garde son Root, on crée juste un pont de confiance |
| « La hiérarchie est la seule option » | Non : la cross-certification existe pour les cas inter-organisations |
| « Un Intermediate peut signer un Root » | Non : la hiérarchie va du Root (sommet) vers les feuilles, jamais l'inverse |
| Confondre chaîne incomplète et certificat invalide | Chaîne incomplète = Intermediate manquant (pas une erreur de signature) |
| « Plus d'Intermediate = plus de sécurité » | Non : plus de maillons = plus de chances d'erreur et de compromission |

## 6. En une ligne

> La CA hiérarchique est un arbre (Root → Intermediate → feuille) pour déléguer et isoler ; la CA latérale est un pont entre deux arbres indépendants pour permettre la confiance mutuelle — au prix d'une complexité et d'une surface d'attaque accrues.

*Liens logiques : la PKI qui organise tout ça → [[pki]] · les certificats que la CA signe → [[certificate]] · la cryptographie asymétrique certifiée → [[cryptography]] · et la vérification dans le navigateur → [[dns]] (DNSSEC) et [[ntp]] (heure juste)*