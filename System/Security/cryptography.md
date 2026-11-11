---
tags: [security, crypto, encryption, hashing, asymetric, symetric, keys]
---

# Cryptographie — clés, chiffrement, hashing (fiche du jour)

> **Définition rookie :** la cryptographie, c'est transformer un message en quelque chose d'illisible pour ceux qui ne devraient pas le lire, et le retransformer en clair pour ceux qui ont le droit. Le tout sans que personne ne sache si le message a été touché en route.

**Analogie :** une enveloppe scellée avec un cadenas. Seul le détenteur de la clé ouvre. Et si le sceau est brisé, on le voit — on sait que quelqu'un a lu/modifié.

## 1. Chiffrer / déchiffrer — les bases

- **Encrypt (chiffrer)** : transformer le clair → le chiffré (illisible) avec une **clé**.
- **Decrypt (déchiffrer)** : retransformer le chiffré → le clair avec la **clé**.
- **Clé** : une chaîne secrète (ou une paire) qui fait la transformation. Sans la clé, le chiffré est incompréhensible.

```
clair "hello" + clé K  ──encrypt──►  chiffré "X7q!9z"  ──decrypt──►  "hello" (avec K)
```

## 2. Les 4 propriétés qu'apporte une clé numérique

| Propriété | Question | Garantie |
|-----------|----------|----------|
| **Confidentialité (Privacy)** | qui peut LIRE ? | seul le détenteur de la clé lit le message |
| **Intégrité** | le message a-t-il été TOUCHÉ ? | le chiffré est lié au contenu ; toute modif casse le déchiffrement |
| **Authenticité** | qui a ENVOYÉ ? | la signature prouve l'identité de l'expéditeur |
| **Non-répudiation** | l'expéditeur peut-il nier ? | la signature est liée à sa clé privée : il ne peut pas dire « ce n'est pas moi » |

> Ces 4 propriétés sont le fondement de toute la sécurité moderne — et le cœur de la triade CIA (voir [[security-basics]]).

## 3. Chiffrement symétrique — UNE clé pour tout

**Une seule clé** sert à la fois pour chiffrer ET déchiffrer. Les deux parties doivent partager le secret.

```
Alice : clé K → chiffre "hello" → "X7q!9z" → Bob déchiffre avec K → "hello"
```

**Exemples :** AES (le standard actuel), ChaCha20, 3DES (obsolète).

| Forces | Faiblesses |
|--------|------------|
| Très rapide | Le problème du partage : comment transmettre K sans qu'elle soit interceptée ? |
| Simple à implémenter | Si K fuite, tout est compromis (pas de non-répudiation) |
| Idéal pour de gros volumes | Pas d'authenticité : on ne sait pas QUI a chiffré |

## 4. Chiffrement asymétrique — DEUX clés (publique/privée)

Chaque partie a une **paire** : une clé **publique** (partagée à tout le monde) et une clé **privée** (gardée secrète).

- **Chiffrer avec la clé publique** → seul le détenteur de la clé **privée** déchiffre.
- **Signer avec la clé privée** → tout le monde vérifie avec la clé **publique**.

```
Alice chiffre "hello" avec la clé PUBLIQUE de Bob → "X7q!9z"
Bob déchiffre avec sa clé PRIVÉE → "hello"

Bob signe un message avec sa clé PRIVÉE → signature
Alice vérifie avec la clé PUBLIQUE de Bob → "c'est bien Bob"
```

**Exemples :** RSA, ECC (Elliptic Curve Cryptography), Diffie-Hellman (échange de clés).

| Forces | Faiblesses |
|--------|------------|
| Pas de partage de secret : la clé publique peut être envoyée en clair | Beaucoup plus lent que le symétrique |
| Authentique et non-répudiable (signature) | Les clés sont plus longues (2048+ bits) |
| Résout le problème de distribution | Pas idéal pour de gros volumes |

## 5. Le mélange — le chiffrement hybride (ce qui est utilisé en vrai)

En pratique, on **combine les deux** : l'asymétrique pour échanger une clé symétrique, puis le symétrique pour le gros volume.

```
1. Alice génère une clé symétrique K (rapide, jetable)
2. Alice chiffre K avec la clé PUBLIQUE de Bob (asymétrique) → K_chiffré
3. Alice chiffre le message avec K (symétrique) → message_chiffré
4. Alice envoie K_chiffré + message_chiffré à Bob
5. Bob déchiffre K_chiffré avec sa clé PRIVÉE → K
6. Bob déchiffre message_chiffré avec K → "hello"
```

**C'est exactement ce que fait TLS/HTTPS** : le handshake asymétrique échange une clé de session symétrique, puis tout le trafic est chiffré en symétrique (AES). C'est la raison pour laquelle HTTPS est à la fois **sécurisé** (asymétrique) et **rapide** (symétrique).

## 6. Le hashing — l'empreinte numérique

**Définition rookie :** le hashing transforme une donnée de **taille quelconque** en une **empreinte de taille fixe** (le hash, ou digest). C'est une **fonction à sens unique** : on ne peut pas revenir de l'empreinte au message.

**Analogie :** l'empreinte digitale. Chaque personne a une empreinte unique ; on ne peut pas reconstruire la personne à partir de l'empreinte. Et si deux personnes ont la même empreinte → collision (très rare en théorie, dangereuse en pratique).

```
hash("hello")  →  "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"  (SHA-256)
hash("hello")  →  "2cf24dba..."  (TOUJOURS le même résultat pour la même entrée)
hash("Hello")  →  "185f8db3..."  (un seul bit change → tout change, effet avalanche)
```

### 6.1 Les caractéristiques du hashing

| Propriété | Signification |
|-----------|---------------|
| **Déterministe** | même entrée → même hash (toujours) |
| **Sens unique** | on ne peut pas revenir du hash au message |
| **Effet avalanche** | un seul bit change → le hash change complètement |
| **Rapide** | calculable en temps raisonnable |
| **Résistant aux collisions** | deux messages différents ne donnent pas le même hash |

### 6.2 Les exemples de hash

| Algo | Taille | Statut |
|------|--------|--------|
| **MD5** | 128 bits | **Cassé** (collisions trouvées) — ne plus utiliser |
| **SHA-1** | 160 bits | **Cassé** (collisions pratiques) — obsolète |
| **SHA-256** | 256 bits | Standard actuel, sûr |
| **SHA-3** | variable | Alternative, résistant aux attaques quantiques |
| **bcrypt / argon2** | variable | Lents volontairement → pour les mots de passe (voir §6.4) |

### 6.3 Les faiblesses du hashing

- **Brute force** : essayer toutes les entrées possibles jusqu'à trouver celle qui donne le hash. Rapide pour les mots de passe courts/faibles.
- **Rainbow tables** : tables pré-calculées de hash → lookup instantané. Contre-mesure : **salt** (ajouter un sel aléatoire avant le hash).
- **Collisions** : trouver deux messages différents avec le même hash (MD5/SHA-1 sont cassés sur ce point).
- **Pas de confidentialité** : le hash n'est pas du chiffrement — il ne cache rien, il **prouve** l'intégrité.

### 6.4 Le sel (salt) et le hashing des mots de passe

```python
# BAD : hash sans sel → rainbow table possible
hash("monmotdepasse") → "abc123..."

# GOOD : sel aléatoire ajouté avant le hash
sel = os.urandom(16)            # sel unique par utilisateur
hash(sel + "monmotdepasse") → "def456..."   # le sel est stocké avec le hash
```

- Le sel rend les rainbow tables **inutiles** (chaque utilisateur a un sel différent).
- Pour les mots de passe, on utilise des fonctions **lentes volontairement** : bcrypt, argon2, scrypt — pour ralentir le brute force (voir [[auth-vulns]]).

## 7. Pièges rookie

| Piège | Réalité |
|-------|---------|
| Confondre hash et chiffrement | Le hash est à sens unique (pas de déchiffrement) ; le chiffrement est réversible avec la clé |
| Utiliser MD5/SHA-1 pour la sécurité | Cassés : collisions trouvées, ne plus utiliser pour rien de sensible |
| Hasher un mot de passe sans sel | Rainbow tables → brute force instantané |
| Utiliser SHA-256 pour les mots de passe | Trop rapide → brute force facile ; utiliser bcrypt/argon2 |
| Croire que la clé publique est « secrète » | Elle est PUBLIQUE par définition — c'est la privée qui est secrète |
| Symétrique = rapide donc « mieux » | Le partage de la clé est le problème ; l'asymétrique résout ça mais est lent |

## 8. En une ligne

> La cryptographie donne 4 propriétés (confidentialité, intégrité, authenticité, non-répudiation) via des clés symétriques (rapides, un secret partagé) et asymétriques (lentes, pas de secret partagé) — et le hashing prouve l'intégrité sans révéler le contenu, à condition d'utiliser des algos sûrs et un sel pour les mots de passe.

*Liens logiques : les clés sont le fondement de l'auth → [[auth-vulns]] · l'intégrité des données dans un système → [[system-building]] · les failles crypto sont des vulnérabilités → [[sheets]] · et la cryptographie protège les communications réseau → [[dns]] (DNSSEC) et [[ntp]]*