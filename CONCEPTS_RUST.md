# Concepts Rust — Notes de synthèse (projet Rausth)

Ce document regroupe les mécanismes de syntaxe et les choix d'implémentation
rencontrés pendant la construction du cœur d'authentification. Objectif :
un aide-mémoire à relire, pas un cours complet.

---

## 1. Gestion des erreurs — `Result`, `?`, `match`, `.map_err()`, `.expect()`

### Le type `Result<T, E>`
Un `enum` à deux variantes : `Ok(T)` (succès, contient la valeur) ou `Err(E)`
(échec, contient l'erreur). Une valeur de ce type est **toujours** l'un des
deux, jamais les deux en même temps, jamais "pas encore décidé".

Tant qu'une valeur est de type `Result<T, E>`, le compilateur **interdit**
d'accéder directement aux champs de `T` — il faut d'abord "déballer" le
`Result`, d'une des façons ci-dessous.

### `match` — le déballage explicite
```rust
let user = match repo.find_by_email(&email).await {
    Ok(u) => u,
    Err(e) => return Err(e.into()),
};
```
Force à gérer les deux cas (`Ok`/`Err`) explicitement. Peut aussi matcher
des combinaisons imbriquées en une seule fois :
```rust
match query_result {
    Ok(Some(user)) => Ok(user),
    Ok(None) => Err(RepositoryError::NotFound),
    Err(e) => Err(RepositoryError::Database(e.to_string())),
}
```

### `?` — propagation d'erreur / early return (desugaring + conversion `From`)
```rust
let user = repo.find_by_email(&email).await?;
```
Ce n'est pas juste un "déballage" : c'est un `match` + `return` prématuré qui **termine toute la fonction** en cas d'erreur. Le `?` se désucre exactement en :
```rust
let user = match repo.find_by_email(&email).await {
    Ok(valeur) => valeur,
    Err(e) => return Err(From::from(e)), // conversion via le trait `From`
};
```
- Si `Ok(valeur)` → `valeur` est extraite, le `Ok` disparaît, l'exécution **continue** à la ligne suivante avec `user: User`.
- Si `Err(e)` → la fonction s'arrête **immédiatement** à cette ligne et renvoie `Err(From::from(e))` à son appelant. Le code en dessous n'est **jamais** exécuté.

**Deux conditions impératives pour que ça compile :**
1. La fonction qui contient le `?` doit elle-même renvoyer un `Result` (ou un `Option` — voir ci-dessous). On ne peut pas utiliser `?` dans une fonction qui renvoie `()` ou `Json<T>` directement.
2. Le type d'erreur dans `Err(e)` doit être convertible via `From` vers le type d'erreur de la fonction. Sinon : erreur *"couldn't convert the error to ..."*.
→ Piège rencontré : un handler déclaré `Result<Json<T>, (StatusCode, String)>` ne peut pas utiliser `?` sur une erreur `RepositoryError` sans conversion explicite. Solution : déclarer directement `Result<Json<T>, RepositoryError>` dans la signature du handler (et implémenter `IntoResponse` pour ce type, cf. §7).

`?` fonctionne aussi sur `Option` (même mécanisme, autre type) :
```rust
let v = opt?; // Some(v) → v et on continue ; None → return None immédiatement
```
→ Le type de retour de la fonction doit alors être `Option`. On ne peut pas mélanger `Result` et `Option` avec `?` dans la même fonction sans convertir explicitement — d'où `.ok_or()` (§12) pour passer de l'un à l'autre.

Différence avec `.unwrap()`/`.expect()` : `?` **propage** proprement l'erreur à l'appelant (qui décidera quoi en faire) ; `unwrap()`/`expect()` **panique** (crash/task abort).

### `.map_err(|e| NouvelleErreur)` 
Transforme le type d'erreur **avant** que `?` n'intervienne, quand aucune
conversion `From` automatique n'existe :
```rust
.await
.map_err(|e| RepositoryError::Database(e.to_string()))?;
```

### `.expect("message")` — dangereux, réservé aux cas quasi impossibles
Déballe un `Result`/`Option` : panique (crash) si `Err`/`None`.
**Règle appliquée dans le projet** : `.expect()` seulement quand l'échec est
quasiment impossible en usage normal (ex: `hash_password` — Argon2 n'échoue
que si le système manque de mémoire). Dès qu'une erreur est plausible
(DB down, token expiré, email déjà pris...) → `match`/`?`, jamais `.expect()`.

Dans un serveur async (tokio/axum), un panic peut être isolé à la tâche/
requête concernée plutôt que crasher tout le serveur — mais ce n'est pas
une garantie à exploiter volontairement, juste un filet de sécurité.

---

## 2. Traits — le contrat abstrait

Un `trait` décrit *ce qu'on peut faire* sans dire *comment*. Utilisé pour
découpler le cœur métier (`core/`) de son implémentation concrète
(`adapters/`) :

```rust
pub trait UserRepository {
    async fn find_by_email(&self, email: &str) -> Result<User, RepositoryError>;
    async fn save(&self, user: &User) -> Result<(), RepositoryError>;
}
```

`core/` ne connaît que ce trait. `adapters/web/db.rs` fournit
l'implémentation réelle (`SqliteUserRepository`). Avantage : remplacer
SQLite par Postgres, ou ajouter un adaptateur embarqué plus tard, ne
change jamais le cœur — seule une nouvelle implémentation du trait est
ajoutée.

`async fn` dans un trait est supporté nativement depuis Rust 1.75+
(avant, nécessitait la crate `async-trait`).

---

## 3. `Copy` vs référence — pourquoi `Uuid` mais `&User`/`&str`

Règle de passage de paramètres :
- Types **`Copy`** (petits, taille fixe : `Uuid`, `u32`, `bool`,
  `DateTime`...) → passés **par valeur**. Les dupliquer est aussi
  coûteux que les référencer, donc pas de `&`.
  → `async fn revoke(&self, id: Uuid)`
- Types **non-`Copy`**, potentiellement volumineux (`String`, `Vec<T>`,
  structs complexes) → passés **par référence** (`&str`, `&User`) pour
  éviter de copier des données lourdes à chaque appel.
  → `async fn save(&self, user: &User)`

---

## 4. Modules, `pub`, et imports (`use`)

Rien n'est visible entre modules par défaut. Deux obligations :
- Déclarer un fichier comme faisant partie de l'arborescence, en cascade,
  depuis `main.rs` :
  ```rust
  // main.rs
  mod core;
  mod adapters;
  // core/mod.rs
  pub mod identity;
  pub mod repository;
  // adapters/mod.rs
  pub mod web;
  // adapters/web/mod.rs
  pub mod db;
  pub mod routes;
  ```
  Sans ça : warning *"file not included in module tree"* (rust-analyzer
  ne peut pas t'aider dessus) et le code n'est pas compilé du tout.
- Rendre `pub` ce qu'on veut exposer (structs, champs, fonctions), et
  `use crate::chemin::vers::Type;` pour l'importer ailleurs.

`pub` sur les structs de requête/réponse (`LoginRequest`, etc.) : pas
strictement obligatoire si utilisées dans le même fichier que leur
handler, mais bonne pratique pour rester cohérent et éviter des surprises
si elles sont réutilisées ailleurs (tests, autres routes) plus tard.

---

## 5. `Arc<T>` — partage entre requêtes concurrentes

Un serveur axum traite plusieurs requêtes **en même temps** (tâches async
concurrentes, potentiellement sur différents threads). Une donnée
"normale" en Rust n'a qu'un seul propriétaire à la fois — impossible de
la partager telle quelle entre plusieurs requêtes.

`Arc<T>` (*Atomically Reference Counted*) permet à plusieurs parties du
programme de posséder la **même donnée en mémoire** simultanément :
```rust
let state = Arc::new(AppState { ... });
let state_pour_une_requete = Arc::clone(&state); // ne duplique PAS AppState,
                                                   // duplique juste un compteur
                                                   // de références léger
```
Toutes les copies pointent vers la même instance réelle ; un compteur
atomique (sûr même avec accès concurrent multi-thread) garde trace du
nombre de propriétaires actifs. Libéré de la mémoire quand ce compteur
atteint zéro.

`Rc<T>` est l'équivalent non thread-safe (mono-thread uniquement) — jamais
utilisable dans un contexte async/serveur web.

---

## 6. Le pool de connexions (`SqlitePool`)

- **Une seule vraie connexion physique est ouverte**, une fois, dans
  `main.rs` : `SqlitePool::connect(&database_url).await`.
- `.clone()` sur un pool **ne rouvre pas de connexion** — comme `Arc`,
  c'est un handle léger vers le même pool physique partagé.
- Chaque repository (`SqliteUserRepository`, etc.) stocke juste ce handle.
- Le pool n'est réellement *utilisé* qu'au moment des requêtes SQL
  (`.fetch_optional(&self.pool)`, `.execute(&self.pool)`) : sqlx emprunte
  une connexion disponible, exécute, la rend au pool pour réutilisation.
- Un pool (plutôt qu'une connexion unique) permet de traiter plusieurs
  requêtes HTTP concurrentes sans qu'elles se bloquent entre elles.

---

## 7. `IntoResponse` — le pont entre erreurs métier et HTTP

Axum exige que tout ce qu'un handler renvoie implémente `IntoResponse`
(le trait qu'axum utilise pour fabriquer une vraie réponse HTTP à partir
de ce que retourne le handler). Pour un `Result<T, E>`, **T et E doivent
chacun l'implémenter**.

Nos types métier (`RepositoryError`, `AuthError`) n'implémentent pas
`IntoResponse` nativement (le cœur ne doit rien savoir de HTTP). Solution :
un `impl IntoResponse` écrit **une seule fois**, centralisé, dans
`adapters/web/` (jamais dans `core/`) :
```rust
impl IntoResponse for RepositoryError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            RepositoryError::NotFound => (StatusCode::NOT_FOUND, "..."),
            RepositoryError::AlreadyExists => (StatusCode::CONFLICT, "..."),
            RepositoryError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "..."),
        };
        (status, message).into_response()
    }
}
```
Une fois cet `impl` écrit, chaque handler peut déclarer directement
`Result<Json<T>, RepositoryError>` et utiliser `?` sans traduction
manuelle répétée à chaque appel — la conversion finale vers une réponse
HTTP est faite automatiquement par axum, une seule fois pour tout le
projet, à la fin de l'exécution du handler.

**Deux vérifications séparées à retenir** :
1. `?` — le type d'erreur doit correspondre à celui déclaré dans la
   signature de la fonction (mécanisme `From`, local).
2. Axum — ce type d'erreur déclaré doit implémenter `IntoResponse` pour
   que le handler soit acceptable dans le routeur (mécanisme séparé,
   vérifié à l'enregistrement de la route).

---

## 8. Extractors personnalisés — `FromRequestParts`

Un extractor est un type qui sait se construire à partir d'une requête
HTTP entrante. `Json<T>`, `State<T>`, `Path<T>` sont fournis par axum ;
on peut créer les siens.

`FromRequestParts` travaille uniquement sur les **métadonnées** de la
requête (méthode, URI, **headers**, extensions) — jamais sur le body
(`Parts` n'a pas de champ body, volontairement).

```rust
pub struct AuthenticatedUser {
    pub user_id: Uuid,
}

impl FromRequestParts<Arc<AppState>> for AuthenticatedUser {
    type Rejection = AuthError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts.headers.get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or(AuthError::InvalidCredentials)?;

        let token = auth_header.strip_prefix("Bearer ")
            .ok_or(AuthError::InvalidCredentials)?;

        let user_id = verify_access_token(token, &state.jwt_secret)
            .map_err(|_| AuthError::InvalidCredentials)?;

        Ok(AuthenticatedUser { user_id })
    }
}
```

Principe clé : toute la vérification (extraction du header, parsing du
préfixe `"Bearer "`, vérification de signature JWT) se fait **avant**
que le handler ne s'exécute. Si ça échoue, le handler n'est **jamais**
appelé — axum court-circuite directement vers la réponse d'erreur.
Le handler reçoit ensuite un `user_id` **déjà garanti fiable**, sans
avoir à retraiter le token lui-même.

`"Bearer"` n'est pas une donnée qu'on va chercher quelque part : c'est un
préfixe textuel, littéralement écrit dans la chaîne du header
`Authorization`, ajouté par le client à partir de la convention transmise
au login (`token_type: "Bearer"` dans `LoginResponse`). Il n'a aucun lien
avec le contenu encodé dans le JWT lui-même.

### `FromRef<S>` — généralisation (pas toujours nécessaire)
Version générique permettant à un extractor de fonctionner avec
n'importe quel type d'état `S`, tant qu'on sait en extraire le sous-état
dont on a besoin (`Arc<AppState>: FromRef<S>`). **Pas une mesure de
sécurité** — uniquement de la flexibilité de typage, utile si plusieurs
formes d'état coexistent dans un projet plus large. Pour un projet avec
un seul `AppState`, la version simple et directe (`FromRequestParts<Arc<AppState>>`)
suffit et reste plus lisible.

---

## 9. `AppState` — état partagé entre tous les handlers

Regroupe tout ce dont les handlers ont besoin en commun (repositories,
secret JWT). Construit **une seule fois** au démarrage (`main.rs`),
enveloppé dans `Arc`, injecté via `.with_state(state)`.

```
.env (lu une fois) → variables d'env → construction de AppState → Arc →
   → injecté dans le Router → accessible dans CHAQUE handler, à chaque requête
```

Différence avec `.env` : `.env` est une **source de configuration lue une
fois au démarrage** ; `AppState` est le **cache en mémoire** qui découle
de cette lecture, partagé ensuite pendant toute la durée de vie du
serveur — jamais retouché au fichier disque après le démarrage.

---

## 10. JWT — `encode`/`decode` (crate `jsonwebtoken`)

```rust
encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))
decode::<Claims>(token, &DecodingKey::from_secret(secret.as_bytes()), &Validation::default())
```
- `Claims` = struct sérialisée dans le payload du JWT. Champs standardisés
  par la RFC JWT : `sub` (subject, id du propriétaire), `exp` (expiration,
  timestamp Unix).
- `encode` signe (HMAC-SHA256 par défaut, HS256) — jamais de chiffrement,
  le contenu reste lisible en décodant le payload (base64), seule la
  falsification est empêchée par la signature.
- `decode` vérifie **automatiquement** signature + expiration via
  `Validation::default()` avant de renvoyer les claims.
- Un seul secret partagé (variable d'env) suffit à plusieurs serveurs
  derrière un load balancer pour vérifier indépendamment n'importe quel
  token, sans coordination ni base de données partagée (contrairement à
  des sessions serveur classiques) — c'est tout l'intérêt du "stateless".

**Où vit le token** : jamais stocké côté serveur. Généré une fois au
login, envoyé au client, qui le renvoie ensuite à chaque requête. Le
serveur ne "se souvient" de rien — il redécode et revérifie à chaque
requête, comme si c'était la première fois.

---

## 11. Hashage — Argon2 (mots de passe) vs SHA-256 (refresh tokens)

- **Argon2** (mots de passe) : volontairement lent, avec salt aléatoire
  généré à chaque hashage — résiste au brute-force sur des mots de passe
  humains potentiellement faibles. `verify_password` réextrait le salt
  déjà encodé dans le hash stocké pour recalculer et comparer — jamais de
  déchiffrement, le hashage reste à sens unique.
- **SHA-256** (refresh tokens) : rapide, sans salt — suffisant car le
  refresh token est déjà une chaîne aléatoire à haute entropie (générée
  par le serveur, pas choisie par un humain), pas besoin de la lenteur
  volontaire d'Argon2.

---

## 12. `.ok_or()` / `.ok_or_else()` — pont `Option<T>` → `Result<T, E>`

Signatures (méthodes de `Option<T>`, consomment l'`Option`) :
```rust
fn ok_or<E>(self, err: E) -> Result<T, E>
fn ok_or_else<E, F>(self, f: F) -> Result<T, E> where F: FnOnce() -> E
```
- `Some(v)` → `Ok(v)` (la valeur est déplacée telle quelle).
- `None` → `Err(err)` avec l'erreur **que vous fournissez**.

Pourquoi ce pont est nécessaire ? `?` ne peut propager qu'un seul type à la fois : soit `Result`, soit `Option`. Mais beaucoup d'APIs (ex: `sqlx::query_as(...).fetch_optional(&pool).await`) renvoient `Result<Option<T>, E>` : `Err` = erreur technique (DB down), `Ok(None)` = "pas trouvé" (cas métier normal), `Ok(Some(v))` = trouvé. Pour unifier le tout en un seul `Result<T, E>` utilisable avec `?` et `IntoResponse`, il faut convertir le `None` en `Err` :

```rust
// Étape 1 : gérer l'erreur technique sqlx::Error → RepositoryError
let maybe_user: Option<User> = sqlx::query_as!(...)
    .fetch_optional(&pool).await
    .map_err(|e| RepositoryError::Database(e.to_string()))?;
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//  Result<Option<User>, sqlx::Error> → Result<Option<User>, RepositoryError>
//  puis `?` : Err → return Err(...), Ok(opt) → on continue avec opt

// Étape 2 : transformer l'absence métier en erreur
let user: User = maybe_user.ok_or(RepositoryError::NotFound)?;
//               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Some(user) → Ok(user) → `?` extrait user et continue
// None       → Err(NotFound) → `?` fait return Err(NotFound) immédiatement
```

Enchaînement compact (même logique en une ligne) :
```rust
let user = sqlx::query_as!(...).fetch_optional(&pool).await
    .map_err(|e| RepositoryError::Database(e.to_string()))?
    .ok_or(RepositoryError::NotFound)?;
```

`.ok_or(err)` vs `.ok_or_else(|| err)` :
- `.ok_or(RepositoryError::NotFound)` : `err` est évaluée **avant** l'appel, même si c'est `Some` (ok si c'est juste un variant d'enum sans allocation).
- `.ok_or_else(|| RepositoryError::Database(format!("user {} not found", id)))` : la closure n'est exécutée que si `None` — à préférer si construire l'erreur coûte (allocation `String`, `format!`, appel fonction).

Inverse : `.ok()` fait `Result<T, E>` → `Option<T>` (`Ok(v)` → `Some(v)`, `Err(_)` → `None` en **perdant** l'erreur — à utiliser seulement quand le détail de l'erreur n'a pas d'importance).

---

## 13. `sqlx::query!` vs `sqlx::query_as!`

- `query!` → résultat sous forme de struct **anonyme** générée à la
  volée. Pratique pour des actions (`INSERT`, `UPDATE`) où on ne
  reconstruit pas une entité métier réutilisable.
- `query_as!` → mappe directement vers une struct Rust **déjà définie**
  (ex: `User`). Utilisé quand on veut une entité complète et réutilisable.

Les deux vérifient la requête **à la compilation** (pas juste à
l'exécution) en se connectant à la vraie base via `DATABASE_URL` — d'où
la nécessité d'un fichier `.env` local et d'une base à jour avant de
compiler.

Annotations de type dans le SQL :
- `as "colonne!: _"` → force un type **non-optionnel** (utile car SQLite
  ne garantit pas `NOT NULL` sur une clé primaire `TEXT`, contrairement à
  Postgres).
- `as "colonne: _"` (sans `!`) → laisse le type **optionnel**
  (`Option<T>`), nécessaire pour une colonne réellement nullable (ex:
  `revoked_at`).

---

## 14. Migrations — versionnées, jamais réécrites après application

Chaque changement de structure de base = un nouveau fichier SQL horodaté
dans `migrations/`, jamais modifié après avoir été appliqué (sqlx détecte
la modification via un hash et désynchronise sinon). Pour corriger une
erreur sur une base encore locale/vide et jamais partagée : soit corriger
directement le fichier + `sqlx database drop && create && migrate run`,
soit ajouter une migration corrective (`ALTER TABLE ...`) si déjà partagée.

---

## 15. Access token vs Refresh token — le compromis retenu

| | Access token (JWT) | Refresh token |
|---|---|---|
| Stocké côté serveur | Jamais | Hash seulement (SHA-256), en base |
| Durée de vie | Courte (15 min) | Longue (7 jours) |
| Révocation | **Impossible** avant expiration | Possible (`revoked_at`) |
| Usage | Chaque requête protégée | Uniquement pour `/refresh` |

- L'access token expire toujours en premier par construction. Le refresh
  token n'expire "en premier" que si l'utilisateur reste inactif plus
  longtemps que sa propre durée de vie — dans ce cas, retour à un login
  complet.
- Si un access token est volé, aucune action serveur ne peut l'invalider
  avant expiration naturelle — la courte durée de vie est le seul levier
  de défense disponible, d'où le compromis sécurité/fréquence de refresh.
- **Rotation** : à chaque `/refresh`, l'ancien refresh token est révoqué
  et un nouveau est émis. Un refresh déjà révoqué qui est réutilisé est
  un signal de vol détectable — pas un lien logique entre access et
  refresh token (ils ne partagent qu'un `user_id` en commun, jamais un
  identifiant croisé stocké).
- Valeurs recommandées (OWASP / pratique industrielle) : access token
  5–15 min, refresh token 7–30 jours selon la sensibilité de l'app.

---

## 16. Secrets — `.env`, jamais en dur, jamais commité

`JWT_SECRET` et `DATABASE_URL` vivent dans `.env` (ajouté au
`.gitignore`), chargés une fois au démarrage via `dotenvy::dotenv()`.
Un `.env.example` (sans vraies valeurs) documente les variables
attendues pour quiconque clone le projet. Génération d'un secret sûr :
`openssl rand -base64 64`.

---

## 17. Références, `&`/`*`, et le sucre syntaxique du `.`

- `v = valeur` (sans `Copy`, cf. §3) → `v` est le **propriétaire** de la
  donnée.
- `r = &v` (ou `&mut v`) → `r` contient l'**adresse mémoire** de `v`, pas
  une copie de la valeur. C'est une référence : le compilateur garantit
  qu'elle reste toujours valide (contrairement à un pointeur C brut, cf.
  CONCEPTS_CLANG.md §4).
- `*r` → **déréférencement** : accède directement à la valeur située à
  cette adresse, nécessaire pour la lire ou la remplacer avec `=`.

Le point `.` est effectivement du sucre syntaxique, mais il agit **dans
les deux sens**, pas seulement en déréférençant :
- **Auto-déréférencement** : `r.champ` / `r.methode()` devient
  `(*r).champ` / `(*r).methode()` — évite d'écrire l'astérisque à chaque
  accès.
- **Auto-référencement** : à l'appel d'une méthode, le compilateur ajoute
  automatiquement `&`, `&mut`, ou `*` selon ce qu'exige la signature
  (`&self`, `&mut self`, ou `self`) — c'est pour ça que `vec.push(x)`
  s'écrit pareil que `vec` soit `Vec<T>` ou `&mut Vec<T>` : le `.`
  s'ajuste automatiquement des deux côtés.

Ce mécanisme (regroupé sous le nom *auto-ref/auto-deref*) ne se limite pas
aux références `&`/`&mut` : tout type qui implémente le trait `Deref`
(`Box<T>`, `Rc<T>`, `Arc<T>` — cf. §5) en bénéficie aussi via `.`, ce qui
explique qu'on appelle des méthodes de `T` directement sur un
`Arc<T>` sans jamais écrire `(*arc).methode()`.
