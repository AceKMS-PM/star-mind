# Concepts C / Clang — Notes de synthèse (pendant de CONCEPTS_RUST.md)

Ce document est le pendant C/Clang de `CONCEPTS_RUST.md`. Contrairement à celui-ci,
il n'est pas né d'un projet concret — c'est un point de départ pour apprendre le C,
écrit pour quelqu'un qui connaît déjà Rust mais découvre le C. Chaque section
essaie d'expliquer *pourquoi* avant *comment*, et de faire le pont avec l'équivalent
Rust quand il existe. À compléter/corriger au fil du premier vrai projet C.

---

## 1. Chaîne de compilation Clang — `clang` = préprocesseur + compilateur + linker

En Rust, `cargo build` fait tout d'un coup et cache la mécanique. En C, il est
utile de comprendre les étapes séparément, parce que les erreurs pointent
souvent vers une étape précise.

```bash
clang main.c utils.c -I./include -Wall -Wextra -O2 -o app
```

1. **Préprocesseur** (`clang -E`) : substitution de texte pure — expand
   `#include`, `#define`, `#ifdef`. Sortie = un seul gros fichier C "à plat",
   sans aucune macro restante. Aucune vérification de syntaxe C à cette étape.
2. **Compilation** (`clang -S`) : C → LLVM IR → assembleur `.s`. C'est ici que
   la syntaxe C est vérifiée et que les erreurs de type apparaissent.
3. **Assemblage** (`clang -c`) : `.s` → fichier objet `.o` (code machine +
   table de symboles). Un `.o` par fichier `.c`, indépendamment des autres.
4. **Édition de liens** (`clang` sans `-c`) : tous les `.o` + les librairies
   sont assemblés en un seul exécutable. C'est à cette étape que "undefined
   reference to `foo`" apparaît si une fonction est déclarée mais jamais
   définie nulle part.

Différence fondamentale avec Rust : `rustc`/`cargo` refusent de compiler du
code dont l'ownership ou les emprunts sont incorrects — le compilateur est un
garde-fou actif. Clang ne fait **aucune** vérification de ce genre : il fait
confiance au programmeur pour la mémoire. Ce n'est pas un détail, c'est la
différence philosophique centrale entre les deux langages, et elle explique
la plupart des sections qui suivent.

Flags utiles à connaître dès le départ :
- `-Wall -Wextra -Wpedantic` : active les warnings (sans ça, Clang reste
  silencieux sur beaucoup de code dangereux).
- `-g` : garde les infos de debug (nécessaire pour `gdb`/`lldb`).
- `-O0` (aucune optimisation, pour développer) vs `-O2` (optimisé, pour
  livrer — mais peut révéler des bugs invisibles en `-O0`, voir §9).
- `-fsanitize=address,undefined` : instrumente le binaire pour détecter les
  bugs mémoire à l'exécution (voir §9).
- `-std=c17` : fixe la version du standard C utilisée.

---

## 2. Préprocesseur — substitution textuelle avant compilation

Le préprocesseur ne connaît **rien** du C : pas de types, pas de portée
(scope), pas de règles de syntaxe. C'est un copier-coller/chercher-remplacer
sur du texte brut, exécuté *avant* que le compilateur ne voie quoi que ce
soit. C'est très différent des macros Rust (`macro_rules!`), qui elles
opèrent sur l'arbre syntaxique et respectent la structure du code.

```c
#define MAX 1024
#include "utils.h"   // littéralement : colle le contenu du fichier ici

#ifdef DEBUG
  #define LOG(x) printf(x)
#else
  #define LOG(x)      // en dehors du mode DEBUG, LOG(x) disparaît complètement
#endif
```

**Le piège classique — absence de parenthèses :**
```c
#define ADD(a, b) a + b
```
`ADD(1, 2) * 3` ne devient pas `(1 + 2) * 3` = 9. Le préprocesseur fait un
copier-coller textuel pur, donc ça devient littéralement `1 + 2 * 3` = 7
(priorité de `*` sur `+`). La macro ne "sait" pas qu'elle doit être groupée.
Remède systématique — toujours tout parenthéser :
```c
#define ADD(a, b) ((a) + (b))
```
Pour voir concrètement ce que le préprocesseur a produit (utile quand un
comportement de macro surprend) : `clang -E main.c | less`.

- `#include <...>` : cherche dans les headers système.
- `#include "..."` : cherche d'abord relativement au fichier courant, puis
  dans les chemins passés via `-I`.

---

## 3. Headers (`.h`) vs sources (`.c`) — déclaration vs définition

C n'a pas de système de modules comme Rust (`mod`, `pub`, `use` — voir
CONCEPTS_RUST.md §4). À la place, une convention manuelle en deux fichiers :

- `.h` (header) : **déclare** ce qui existe — signatures de fonctions,
  définitions de `struct`, `extern`. Un header ne contient (en général)
  aucun code exécutable. Il est `#include`-é dans tous les fichiers qui en
  ont besoin.
- `.c` (source) : **définit** l'implémentation réelle — une seule fois dans
  tout le projet. Compilé en son propre `.o`.

```c
// utils.h — la "signature" visible de tous
#ifndef UTILS_H   // include guard
#define UTILS_H

int add(int a, int b);   // déclaration : "cette fonction existe, voici son type"

#endif

// utils.c — l'implémentation réelle
#include "utils.h"
int add(int a, int b) { return a + b; }  // définition : le vrai code
```

**Pourquoi le "include guard" (`#ifndef`/`#define`/`#endif`) ?** Si deux
fichiers `.c` différents incluent (directement ou indirectement) le même
header deux fois, le préprocesseur va coller son contenu deux fois dans le
même fichier plat — et le compilateur va voir la `struct`/fonction définie
deux fois → erreur *redefinition*. Le guard fait que la deuxième inclusion
est ignorée (`UTILS_H` est déjà défini). Alternative plus courte et
supportée par Clang : `#pragma once` en première ligne du header, qui fait
la même chose sans le triplet manuel.

---

## 4. Pointeurs — l'équivalent (dangereux) des références Rust

En Rust, `&T` est une référence *vérifiée par le compilateur* : elle ne peut
jamais être nulle, ni pointer vers une mémoire déjà libérée (le
borrow-checker l'interdit à la compilation). En C, un pointeur est juste
**une adresse mémoire brute**, sans aucune de ces garanties.

```c
int x = 42;
int *p = &x;   // p contient l'adresse de x (comme &x en Rust, mais sans vérif)
*p = 10;       // déréférencer p : va lire/écrire à cette adresse → modifie x
```

- `&x` = "donne-moi l'adresse de x" (même symbole qu'en Rust, sens proche).
- `*p` = "va lire/écrire à l'adresse contenue dans p" (déréférencement —
  en Rust c'est aussi `*p`, mais le compilateur garantit que `p` est valide;
  en C, rien ne le garantit).

### Le piège du "decay" des tableaux

```c
int arr[3] = {1, 2, 3};
printf("%zu\n", sizeof(arr));  // 12 (3 * sizeof(int)) — arr est un vrai tableau ici

void f(int *a) {
    printf("%zu\n", sizeof(a)); // 8 — a n'est PLUS un tableau, juste un pointeur !
}
f(arr);
```

Ce qui se passe : dès qu'un tableau est passé en argument de fonction, il
**"decay"** (dégénère) en un simple pointeur vers son premier élément. La
fonction ne reçoit *aucune* information sur la longueur d'origine — elle
ne "sait" pas que `arr` avait 3 éléments, juste où il commence. C'est
radicalement différent d'un slice Rust (`&[i32]`), qui transporte toujours
son pointeur **et** sa longueur ensemble (un "fat pointer").

Conséquence pratique : il faut **toujours** passer la taille séparément :
```c
void f(int *a, size_t n) { /* n est la seule source de vérité sur la taille */ }
```
Si tu oublies, la fonction n'a aucun moyen de savoir où le tableau s'arrête
— et lire au-delà est un comportement indéfini (§9).

### Arithmétique de pointeurs

`p + 1` n'avance pas d'un octet, mais de `sizeof(*p)` octets — donc pour
`int *p`, `p + 1` avance de 4 octets (sur la plupart des plateformes). Le
compilateur fait le calcul pour toi en fonction du type pointé.

### `NULL` — pas d'`Option<T>`

En Rust, l'absence de valeur se modélise avec `Option<T>` : `None` est un
état explicite que le compilateur t'oblige à gérer (`match`, `?`, `.ok_or()`
— voir CONCEPTS_RUST.md §12). En C, `NULL` est juste la valeur `0` utilisée
par convention pour dire "ce pointeur ne pointe vers rien de valide". Rien
n'empêche de l'utiliser par erreur :

```c
int *p = NULL;
*p = 5;   // déréférencer NULL → segfault (crash immédiat, si tu as de la chance)
          // ou comportement indéfini plus insidieux (voir §9)
```
Il n'y a pas de vérification automatique — c'est à toi de tester
`if (p != NULL)` avant chaque déréférencement dont tu n'es pas sûr.

---

## 5. Mémoire — stack vs heap, `malloc`/`free`

En Rust, la mémoire heap est gérée automatiquement par l'ownership : quand
la variable propriétaire sort de portée, `drop()` libère la mémoire — c'est
le compilateur qui insère ce code pour toi. En C, il n'existe **rien** de
tel : c'est entièrement manuel.

```
STACK (automatique)                    HEAP (manuelle)
┌─────────────────────┐                ┌─────────────────────┐
│ int x = 5;           │  libéré        │ int *p = malloc(...) │  libéré
│ (dans une fonction)  │  automatique-  │ ...                  │  UNIQUEMENT
│                      │  ment à la     │                      │  par un appel
│                      │  sortie du     │                      │  explicite à
│                      │  bloc { }      │                      │  free(p);
└─────────────────────┘                └─────────────────────┘
```

```c
int *p = malloc(n * sizeof *p);   // demande n * sizeof(int) octets sur le heap
if (p == NULL) {                  // malloc peut échouer (mémoire système épuisée)
    perror("malloc");
    return 1;
}
// ... utiliser p ...
free(p);   // rend la mémoire au système — SANS CET APPEL, fuite mémoire
```

- `malloc(n)` renvoie un `void*` vers `n` octets **non initialisés**
  (contenu indéterminé — pas forcément des zéros), ou `NULL` en cas
  d'échec. Toujours tester le retour.
- `calloc(nmemb, size)` fait la même chose mais met tout à zéro.
- `realloc(p, new_size)` redimensionne un bloc déjà alloué (peut déplacer
  les données ailleurs en mémoire — toujours réassigner le pointeur de
  retour, ne jamais réutiliser l'ancien `p` directement).

**Règle d'or : chaque `malloc` doit avoir exactement un `free`, ni plus ni
moins.**
- Zéro `free` → fuite mémoire (la mémoire reste occupée jusqu'à la fin du
  programme).
- Deux `free` sur le même pointeur (double-free) → comportement indéfini,
  souvent exploitable comme faille de sécurité.

**Dangling pointer** — après `free(p)`, `p` contient toujours la même
adresse numérique, mais cette adresse n'est plus "à toi" : le système peut
la réattribuer à autre chose à tout moment. Réutiliser `p` après `free`
(*use-after-free*) lit/écrit alors dans une mémoire qui ne t'appartient
plus. Bonne pratique systématique :
```c
free(p);
p = NULL;   // p ne pointe plus "par accident" vers une zone invalide
```
`free(NULL)` est explicitement défini comme ne faisant rien (sûr).

Outils pour détecter ces bugs (indispensables en C, puisque le compilateur
ne t'aide pas) : `valgrind --leak-check=full`, et à la compilation
`-fsanitize=address` (détecte use-after-free, double-free, dépassements de
tampon à l'exécution).

---

## 6. Chaînes C — `char*` terminé par `\0`

Rust a un vrai type `String` (heap, avec longueur connue et UTF-8 validé) et
`&str` (slice de texte avec longueur). Le C n'a **aucun type chaîne** : une
"chaîne C" est juste un tableau de `char`, et sa fin est marquée par
convention par un octet `\0` (le caractère nul), pas par une longueur
stockée quelque part.

```c
char s[] = "hello";
// en mémoire : 'h' 'e' 'l' 'l' 'o' '\0'  → 6 octets, pas 5
strlen(s) == 5;   // strlen COMPTE les caractères jusqu'au \0 (ne le compte pas lui-même)
sizeof(s) == 6;   // sizeof donne la taille RÉELLE du tableau, \0 inclus
```

Oublier le `\0` (par exemple en construisant une chaîne "à la main" octet
par octet sans le rajouter) fait que toute fonction qui lit la chaîne
(`strlen`, `printf("%s", ...)`, ...) continue de lire en mémoire **au-delà**
du tableau, jusqu'à tomber par hasard sur un octet zéro ailleurs — c'est un
comportement indéfini classique.

**Piège de sécurité — `strcpy`/`strcat` ne vérifient aucune taille :**
```c
char dest[8];
strcpy(dest, "ceci dépasse largement 8 octets");  // écrit hors des limites de dest !
```
C'est un débordement de tampon (*buffer overflow*) — une des causes
historiques les plus fréquentes de failles de sécurité en C. Préférer des
variantes qui connaissent la taille destination :
```c
snprintf(dest, sizeof dest, "%s", src);  // s'arrête à sizeof(dest)-1 caractères + \0
```

**Piège des littéraux en lecture seule :**
```c
char *s = "hello";   // s pointe vers une zone mémoire en LECTURE SEULE
s[0] = 'H';          // comportement indéfini / souvent un crash

char t[] = "hello";  // t est une VRAIE copie modifiable sur la stack
t[0] = 'H';          // OK
```

---

## 7. Types, tailles et `signed`/`unsigned`

Contrairement à Rust où `i32`, `u8`, `usize` ont une taille garantie et
fixée par le langage, le standard C ne garantit **pas** la taille exacte
de `int`, `long`, etc. — elle dépend de la plateforme/du compilateur.
Solution : utiliser les types à taille fixe de `<stdint.h>` dès que la
taille compte réellement (protocole réseau, format de fichier, etc.) :

- `int32_t`, `uint8_t`, `uint64_t`, ... : taille garantie explicite.
- `size_t` : type (non signé) utilisé pour représenter une taille d'objet
  ou un index de tableau — c'est ce que `sizeof` et `strlen` renvoient.
- `ptrdiff_t` : différence entre deux pointeurs.

`char` peut être signé ou non signé selon la plateforme — si tu manipules
un octet brut (pas du texte), préfère `uint8_t` pour ne pas dépendre de ce
détail d'implémentation.

**Piège de promotion signé/non-signé :**
```c
int a = -1;
unsigned int b = 1;
if (a < b) { /* ... */ }   // FAUX : n'entre jamais dans le if !
```
En C, comparer un `signed` et un `unsigned` force la conversion du `signed`
vers `unsigned` avant la comparaison. `-1` converti en `unsigned int`
devient une très grande valeur positive (à cause du complément à deux),
donc `-1 < 1u` est évalué comme faux. Compiler avec `-Wsign-compare` fait
apparaître ce genre de comparaison comme un warning.

---

## 8. `const`, `static`, `extern`, `volatile`

Ces quatre mots-clés n'ont pas d'équivalent unique en Rust — chacun mérite
d'être isolé :

- `const int *p` : **pointeur vers un `int` constant** — on ne peut pas
  faire `*p = ...` (modifier la valeur pointée), mais on peut réassigner
  `p` vers une autre adresse.
- `int *const p` : **pointeur constant** — l'inverse : on peut modifier
  `*p`, mais pas réassigner `p` lui-même. C'est plus proche d'un `let p`
  Rust non-`mut` appliqué au pointeur, pas à la donnée pointée.
- `const int *const p` : les deux à la fois.
  (Astuce pour lire ces déclarations : lis de droite à gauche à partir du
  nom de la variable.)
- `static` a deux sens **différents** selon le contexte :
  - Dans une fonction : une variable `static` garde sa valeur **entre les
    appels** (initialisée une seule fois, jamais réinitialisée) — pas
    d'équivalent direct en Rust sûr (le plus proche serait une variable
    globale mutable, généralement évitée).
  - Au niveau fichier (hors de toute fonction) : `static` limite la
    visibilité de la fonction/variable **à ce fichier `.c` uniquement** —
    c'est presque l'inverse de `pub` en Rust : par défaut en C tout est
    visible depuis les autres fichiers (via `extern`), et `static` restreint
    cette visibilité, alors qu'en Rust tout est privé par défaut et `pub`
    l'ouvre.
- `extern int x;` : déclare une variable sans la définir — dit "cette
  variable existe, elle est définie ailleurs (probablement un autre `.c`)".
- `volatile` : empêche le compilateur d'optimiser les accès à cette
  variable (par exemple de supposer qu'elle ne change pas entre deux
  lectures). Utilisé pour du matériel (registres) ou des handlers de
  signal — ce n'est **pas** un outil de synchronisation thread-safe (ne
  remplace pas un mutex/atomique).

---

## 9. Undefined Behavior (UB) — le piège central de C

C'est la différence la plus importante avec Rust à intérioriser tôt.
Rust refuse de compiler du code dont la sûreté mémoire ou les emprunts sont
douteux — l'erreur apparaît à la compilation, avant même d'exécuter quoi
que ce soit. En C, ces mêmes situations **compilent sans problème** et le
comportement à l'exécution devient officiellement "indéfini" : le standard
C ne garantit *rien* sur ce qui va se passer — ça peut planter, donner un
résultat faux silencieusement, ou "sembler marcher" pendant des mois avant
de casser dans des conditions différentes.

Exemples classiques d'UB :
- déréférencer `NULL` ou un pointeur déjà `free()`,
- lire/écrire au-delà des limites d'un tableau,
- dépassement (overflow) d'un entier **signé** (`INT_MAX + 1`),
- appeler `free()` deux fois sur le même pointeur,
- lire une variable jamais initialisée,
- accès concurrent non synchronisé à la même donnée depuis plusieurs
  threads (*data race*).

**Pourquoi c'est particulièrement vicieux avec `-O2` :** le compilateur
part du principe que l'UB "n'arrive jamais" dans un programme correct, et
optimise en conséquence — parfois en supprimant purement et simplement du
code qu'il juge "impossible à atteindre" si son exécution impliquerait de
l'UB. Résultat concret : un bug peut être invisible en `-O0` (le
comportement "par hasard" ressemble à ce qu'on attend) et apparaître
seulement en `-O2`, une fois compilé pour la release — le moment le plus
difficile pour le déboguer.

Détection pratique, à activer systématiquement pendant l'apprentissage :
```bash
clang -fsanitize=address,undefined -g -O1 main.c -o app
```
Plus `-Wall -Wextra`, `clang-tidy`, et `scan-build` en amont.

---

## 10. Gestion des erreurs — pas de `Result`, code de retour + `errno`

En Rust, `Result<T, E>` force le compilateur à t'obliger de gérer l'erreur
avant d'accéder à la valeur (voir CONCEPTS_RUST.md §1). En C, il n'existe
aucun mécanisme comparable imposé par le langage — juste une **convention**
que chaque fonction/librairie choisit d'appliquer (ou pas) :

```c
FILE *f = fopen("data.txt", "r");
if (!f) {                    // fopen renvoie NULL en cas d'échec
    perror("fopen");         // affiche un message basé sur errno
    return 1;
}

int *p = malloc(n * sizeof *p);
if (!p) {
    perror("malloc");
    return 1;
}
```

- Convention la plus courante : retour `0` = succès, `-1` ou `NULL` =
  échec, et le détail de l'erreur est disponible dans la variable globale
  `errno` (déclarée dans `<errno.h>`), positionnée par la fonction qui a
  échoué.
- Rien n'oblige à vérifier le retour — si tu ignores le `if (!p)`
  ci-dessus, le programme continue avec un pointeur `NULL` et plante (ou
  pire, UB) plus loin, à un endroit qui ne dit rien sur la cause réelle.
- Pas de `?` pour propager automatiquement : chaque niveau d'appel doit
  vérifier et propager l'erreur explicitement, à la main :
  ```c
  int result = do_something();
  if (result != 0) {
      return result;   // propagation manuelle, ligne par ligne
  }
  ```
- `perror("contexte")` affiche `contexte: <message d'erreur système>`.
  `strerror(errno)` renvoie juste le message texte, pour un usage custom.

---

## 11. `struct`, `union`, `enum`

```c
struct User {
    char name[32];
    uint32_t id;
};

union Value {         // TOUS les champs partagent la MÊME zone mémoire
    int i;
    float f;
};                     // écrire .i puis lire .f donne un résultat sans sens —
                        // à toi de savoir en permanence lequel est "actif"

enum Status { OK = 0, NOT_FOUND = 1, DB_ERROR = 2 };
```

- Une `struct` C n'a **pas de méthodes** — contrairement à Rust où on fait
  `impl User { fn greet(&self) {...} }`. En C, la convention équivalente
  est une fonction libre qui prend un pointeur vers la struct comme premier
  paramètre :
  ```c
  void user_greet(struct User *u) { printf("Bonjour %s\n", u->name); }
  // appel : user_greet(&user);
  ```
  C'est manuellement ce que Rust fait pour toi via `self`.
- **Padding (alignement)** : le compilateur peut insérer des octets de
  "trou" entre les champs pour respecter les contraintes d'alignement
  mémoire de la plateforme — donc `sizeof(struct User)` n'est **pas**
  forcément égal à la somme des `sizeof` de chaque champ. `offsetof(struct
  User, id)` (de `<stddef.h>`) donne la position réelle d'un champ ; `_Alignof`
  donne l'alignement requis.
- `union` : contrairement à un `enum` Rust avec données (qui garde un tag
  caché indiquant quelle variante est active), une `union` C ne garde
  **aucune trace** de quel champ a été écrit en dernier — c'est à toi de le
  savoir par ailleurs (souvent via un champ `enum` séparé à côté, un motif
  appelé "tagged union" fait à la main).
- `typedef struct User User;` évite d'avoir à écrire `struct User` à
  chaque usage — permet d'écrire juste `User` ensuite.

---

## 12. Tooling Clang recommandé

- Formatage : `clang-format -i *.c *.h`
- Lint statique : `clang-tidy --checks='*'`, `scan-build clang ...`
- Debug interactif : compiler avec `clang -g -O0`, puis `lldb` ou `gdb`
- Détection de bugs mémoire à l'exécution : `valgrind --leak-check=full`
  et/ou `clang -fsanitize=address,undefined -g -O1`
- Voir l'arbre syntaxique généré : `clang -Xclang -ast-dump -fsyntax-only main.c`
- Voir l'IR LLVM généré (utile pour comprendre ce que fait vraiment le
  compilateur) : `clang -S -emit-llvm main.c -o -`

---

*À compléter au fil du premier projet C réel — ajoute ici chaque nouveau
piège concrètement rencontré (comme dans CONCEPTS_RUST.md), pas seulement
la théorie.*
