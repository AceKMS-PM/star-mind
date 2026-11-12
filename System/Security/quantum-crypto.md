---
tags: [security, crypto, quantum, pqc, post-quantum, shor, grover, nist]
---

# Cryptographie quantique — risques, apports, PQC (fiche du jour)

> **Définition rookie :** l'informatique quantique exploite les propriétés de la mécanique quantique (superposition, intrication) pour résoudre certains problèmes **exponentiellement plus vite** que nos ordinateurs classiques. En cryptographie, ça change tout : certaines protections deviennent inutiles, et de nouvelles apparaissent.

**Analogie :** la cryptographie classique, c'est un coffre-fort dont la serrure est si complexe qu'il faudrait des millions d'années pour essayer toutes les clés. L'informatique quantique, c'est la machine qui essaie toutes les clés **en même temps** — le coffre s'ouvre en quelques heures.

## 1. Les deux algorithmes qui cassent tout

### 1.1 Algorithme de Shor (1994) — casse le asymétrique

Shor permet de **factoriser des grands nombres** et de résoudre le **logarithme discret** en temps polynomial sur un ordinateur quantique.

**Ce qui casse :**
- **RSA** : basé sur la factorisation de grands nombres → Shor le casse
- **ECC** (Elliptic Curve) : basé sur le logarithme discret → Shor le casse
- **Diffie-Hellman** : même principe → cassé

**Ce qui NE casse PAS :**
- **Le symétrique** (AES) : Shor ne s'applique pas → résiste (mais voir Grover)
- **Le hashing** (SHA-256) : Shor ne s'applique pas → résiste (mais voir Grover)

### 1.2 Algorithme de Grover (1996) — affaiblit le symétrique

Grover permet de **chercher dans une base non structurée** en √N au lieu de N. C'est une accélération quadratique, pas exponentielle.

**Conséquence :**
- AES-128 → sécurité effective de 64 bits (Grover divise par 2 l'espace de recherche)
- AES-256 → sécurité effective de 128 bits → **encore sûr**
- SHA-256 → sécurité de 128 bits (collisions) → **encore sûr**

> **La règle d'or :** Shor = casse le asymétrique (exponentiel). Grover = affaiblit le symétrique (quadratique). Doubler la taille de clé symétrique suffit à compenser Grover.

## 2. Le risque — « harvest now, decrypt later »

Le danger le plus concret n'est pas l'ordinateur quantique d'aujourd'hui (il n'existe pas encore à grande échelle), mais **la collecte anticipée** :

```
Aujourd'hui : l'attaquant enregistre ton trafic HTTPS (chiffré en RSA/ECC)
Demain      : l'ordinateur quantique déchiffre tout ce qu'il a stocké
Résultat    : tes secrets d'aujourd'hui sont compromis dans 10-20 ans
```

**Ce qui est menacé :**
- Communications chiffrées (HTTPS, VPN, SSH) → exfiltration rétroactive
- Certificats TLS (voir [[certificate]]) → compromission de l'identité
- Signatures numériques (voir [[cryptography]]) → fausses signatures acceptées
- Données à longue durée de vie (secrets d'État, santé, financier)

**Ce qui n'est PAS menacé :**
- Le symétrique avec clés ≥ 256 bits (AES-256)
- Le hashing (SHA-256 et au-dessus)
- Les secrets déjà compromis (pas de pire)

## 3. L'apport quantique — la cryptographie quantique

Le quantique n'apporte pas que des risques : il offre aussi de nouvelles protections.

### 3.1 QKD (Quantum Key Distribution)

**Définition :** distribuer une clé symétrique en utilisant des propriétés quantiques. Si quelqu'un écoute, la mesure quantique perturbe l'état → l'écoute est **détectée**.

**Analogie :** envoyer un message dans une boîte de verre scellée. Si quelqu'un ouvre la boîte pour lire, le sceau se brise → on sait que quelqu'un a lu.

**Protocoles :** BB84 (le premier, 1984), E91, SARG04.

**Limites :** nécessite une ligne physique (fibre), distance limitée (~100 km sans répéteur quantique), coûteux, pas scalable pour l'internet.

### 3.2 QRNG (Quantum Random Number Generators)

Les générateurs de nombres aléatoires quantiques exploitent le hasard fondamental de la mécanique quantique — pas de pseudo-aléatoire, du **vrai** hasard. Utile pour générer des clés, des nonces, des sels.

## 4. PQC — Post-Quantum Cryptography (la vraie solution)

**Définition :** des algorithmes cryptographiques **classiques** (pas quantiques) qui résistent aux attaques quantiques (Shor et Grover). Ils tournent sur nos ordinateurs actuels.

**Le processus NIST (2016-2024) :** le NIST a lancé un concours pour standardiser les algorithmes PQC. Résultat en août 2024 :

| Standard | Nom | Type | Remplace |
|----------|-----|------|----------|
| **ML-KEM** (FIPS 203) | CRYSTALS-Kyber | Encapsulation de clé (échange) | RSA, ECDH |
| **ML-DSA** (FIPS 204) | CRYSTALS-Dilithium | Signature numérique | RSA, ECDSA |
| **SLH-DSA** (FIPS 205) | SPHINCS+ | Signature (hash-based) | RSA, ECDSA |
| **FALCON** (en cours) | FALCON | Signature (compacte) | RSA, ECDSA |

### 4.1 Les familles d'algorithmes PQC

| Famille | Principe | Exemples |
|---------|----------|----------|
| **Réseaux euclidiens (lattice)** | problèmes sur des réseaux de points (LWE, SVP) | Kyber, Dilithium, FALCON |
| **Hash-based** | signatures basées sur des fonctions de hash | SPHINCS+, XMSS |
| **Code-based** | codes correcteurs d'erreurs | McEliece (très ancien, très sûr) |
| **Multivariate** | systèmes d'équations polynomiales | Rainbow (cassé) |
| **Isogeny-based** | courbes elliptiques isogènes | SIKE (cassé en 2022) |

### 4.2 Migration — l'approche hybride

On ne bascule pas d'un coup. L'approche recommandée : **hybride** = classique + PQC en parallèle.

```
TLS hybride = X25519 (classique) + Kyber (PQC)
→ si le quantique casse X25519, Kyber protège encore
→ si Kyber a un bug, X25519 protège encore
```

**Le planning :**
- **2024** : standards NIST publiés (FIPS 203/204/205)
- **2025-2030** : migration des infrastructures (TLS, VPN, signatures)
- **~2030-2035** : ordinateurs quantiques suffisamment puissants pour casser RSA-2048
- **Deadline NIST** : abandonner RSA/ECC d'ici 2035

### 4.3 Les 4 approches (familles) de la PQC

Les **4 familles** d'algorithmes post-quantiques, telles que retenues par le NIST :

| # | Famille | Principe | Exemples | Statut |
|---|---------|----------|----------|--------|
| 1 | **Lattice-based** (réseaux euclidiens) | problèmes sur des réseaux de points (LWE, SVP) | Kyber (ML-KEM), Dilithium (ML-DSA), FALCON | **Standard NIST** (FIPS 203/204) |
| 2 | **Hash-based** | signatures basées sur des fonctions de hash | SPHINCS+ (SLH-DSA), XMSS | **Standard NIST** (FIPS 205) |
| 3 | **Code-based** | codes correcteurs d'erreurs | McEliece (très ancien, très sûr) | Pas encore standardisé (en attente) |
| 4 | **Multivariate** | systèmes d'équations polynomiales | Rainbow (cassé en 2022) | **Éliminé** du processus NIST |

**En résumé :**
- **Lattice** = la famille dominante (Kyber pour l'échange de clés, Dilithium pour les signatures)
- **Hash-based** = la plus sûre (SPHINCS+), mais signatures longues
- **Code-based** = la plus ancienne (McEliece, 1978), clés énormes mais très sûre
- **Multivariate** = la plus fragile (Rainbow cassé, éliminée)

**Bonus :** il y avait une 5e famille, les **isogeny-based** (SIKE), cassée en 2022 en quelques heures — éliminée du processus.

## 5. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Les ordinateurs quantiques existent déjà et cassent tout » | Non : les machines actuelles sont trop petites (quelques centaines de qubits bruités) pour Shor sur RSA-2048 |
| « PQC = cryptographie quantique » | Non : PQC = algorithmes classiques résistants au quantique ; la crypto quantique (QKD) utilise le quantique |
| « Le symétrique est cassé par le quantique » | Non : Grover divise par 2, mais AES-256 reste sûr (128 bits effectifs) |
| « Il faut attendre l'ordinateur quantique pour migrer » | Non : « harvest now, decrypt later » → migrer AVANT, pas après |
| Confondre QKD et PQC | QKD = physique quantique (ligne dédiée) ; PQC = mathématiques classiques (tourne sur nos machines) |

## 6. En une ligne

> Le quantique casse l'asymétrique (Shor) et affaiblit le symétrique (Grover) — la réponse est la PQC (algorithmes classiques résistants) standardisés par le NIST en 2024, à déployer en hybride avant que l'ordinateur quantique arrive.

*Liens logiques : la cryptographie asymétrique menacée → [[cryptography]] · les certificats TLS à migrer → [[certificate]] et [[pki]] · la CA qui signe avec ces algos → [[ca-trust]] · et l'urgence de migrer fait partie de la mise en place système → [[system-building]]*