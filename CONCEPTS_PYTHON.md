# Python — Bases Rookie (variables, if, docstring, fonctions)

> Niveau : vrai débutant. Objectif : comprendre ce que fait chaque ligne, pas juste la recopier.
> Testé avec : Python 3.10+ (`python3 --version`)

---

## 1. Variables — des étiquettes sur des boîtes

Une variable = un nom qui **pointe** vers une valeur. Pas de déclaration de type, le type est déduit.

```python
nom = "Ada"        # str (chaîne)
age = 36           # int (entier)
taille = 1.65      # float (décimal)
est_admin = True   # bool (True / False)
rien = None        # None = "pas de valeur" (comme NULL)
```

### Règles à retenir

1. **Typage dynamique** : le type suit la valeur, il peut changer.
   ```python
   x = 5      # int
   x = "cinq" # maintenant str — autorisé, mais évite en pratique
   ```
2. **Nommage** : `snake_case`, pas d'espace, pas de chiffre en premier, pas de mot-clé (`if`, `for`, `def`...).
   ```python
   bon_nom = 1
   # 1mauvais = 2   # SyntaxError
   ```
3. **Affectation multiple** :
   ```python
   a, b = 1, 2
   x = y = 0
   ```
4. **Vérifier le type** :
   ```python
   type(age)      # <class 'int'>
   isinstance(age, int)  # True — préfère ça à type() ==
   ```

### Types de base à connaître

| Type | Exemple | Note |
|------|---------|------|
| `int` | `42` | entier, taille illimitée |
| `float` | `3.14` | décimal, attention `0.1 + 0.2 != 0.3` |
| `str` | `"salut"` | immuable, `f"{nom}"` pour interpoler |
| `bool` | `True`/`False` | `and`, `or`, `not` |
| `None` | `None` | tester avec `is None`, jamais `== None` |
| `list` | `[1, 2, 3]` | muable, ordonnée |
| `tuple` | `(1, 2)` | immuable |
| `dict` | `{"cle": "val"}` | clé -> valeur |
| `set` | `{1, 2}` | sans doublons |

```python
# f-string : la façon moderne d'afficher
print(f"{nom} a {age} ans")  # Ada a 36 ans
```

> Piège rookie : `=` affecte, `==` compare. `if age = 18:` plante, `if age == 18:` compare.

---

## 2. `if` — prendre des décisions (et l'indentation !)

Python n'a pas d'accolades : c'est **l'indentation (4 espaces)** qui délimite les blocs.

```python
age = 20

if age >= 18:
    print("majeur")      # <-- indenté = dans le if
elif age >= 13:
    print("ado")
else:
    print("enfant")

print("fini")  # <-- désindenté = hors du if, toujours exécuté
```

### Opérateurs

```python
==  # égal
!=  # différent
> < >= <=
and or not
in        # appartenance : "a" in "chat", 2 in [1,2,3]
is        # identité : x is None
```

### Valeurs "fausses" (falsy)

`False`, `None`, `0`, `""`, `[]`, `{}` sont fausses dans un `if`. Tout le reste est vrai.

```python
pseudo = ""
if pseudo:          # "" = falsy -> ne rentre pas
    print("ok")
else:
    print("pseudo vide")  # affiché

if pseudo == "":    # équivalent mais plus explicite pour un rookie
    print("pseudo vide")
```

> Piège : `if x == True:` est moche. Écris `if x:` ou `if x is True:` si tu veux être strict.

---

## 3. Fonctions — des machines réutilisables

`def` définit, `return` renvoie. Sans `return`, la fonction renvoie `None`.

```python
def saluer(nom):
    """Retourne une phrase de salutation."""
    return f"Bonjour {nom}"

msg = saluer("Ada")
print(msg)  # Bonjour Ada
```

### Arguments : positionnels, défaut, keyword

```python
def connecter(hote, port=443, ssl=True):
    print(hote, port, ssl)

connecter("example.com")              # 443, True par défaut
connecter("example.com", 80)          # port=80
connecter("example.com", ssl=False)   # keyword argument
connecter(port=8080, hote="x.com")    # ordre libre en keywords
```

Règle : les paramètres **sans défaut d'abord**, ceux avec défaut après.

### `*args` / `**kwargs` — nombre variable d'arguments

```python
def somme(*nombres):          # * = tuple
    return sum(nombres)

somme(1, 2, 3)  # 6

def afficher(**infos):        # ** = dict
    print(infos)

afficher(nom="Ada", age=36)  # {'nom': 'Ada', 'age': 36}
```

### Portée (scope) — LEGB

```python
x = "global"

def f():
    x = "local"   # crée une NOUVELLE variable locale, ne touche pas la globale
    print(x)      # local

f()
print(x)  # global — inchangée
```

Pour modifier une globale (évite en pratique) : `global x`.

---

## 4. Docstring — la documentation intégrée au code

Triple guillemets juste sous `def` / `class` / en haut de fichier. Lue par `help()`.

```python
def aire_rectangle(longueur, largeur):
    """Calcule l'aire d'un rectangle.

    Args:
        longueur (float): longueur du rectangle.
        largeur (float): largeur du rectangle.

    Returns:
        float: l'aire.
    """
    return longueur * largeur

help(aire_rectangle)  # affiche la docstring
print(aire_rectangle.__doc__)
```

Conventions :
- 1ère ligne : résumé impératif court (`"Calcule..."`, pas `"Calcule..."` au hasard — une ligne).
- Puis détails `Args:` / `Returns:` (style Google, le plus lisible pour rookie).
- Commentaire `#` = pourquoi / intention. Docstring = quoi / comment utiliser.

```python
# BAD : commente l'évidence
x = x + 1  # ajoute 1 à x

# GOOD : explique le pourquoi
x = x + 1  # +1 car l'API compte à partir de 1
```

---

## 5. Bonus — boucles + collections (l'autre sujet indispensable)

### `for` — répéter sur chaque élément

```python
for prenom in ["Ada", "Linus", "Grace"]:
    print(prenom)

for i in range(3):      # 0, 1, 2 (stop exclu !)
    print(i)

for cle, val in {"a": 1, "b": 2}.items():
    print(cle, val)
```

### `while` — répéter tant que vrai

```python
n = 3
while n > 0:
    print(n)
    n -= 1   # SANS ça = boucle infinie !
```

`break` sort, `continue` saute au tour suivant.

### List / dict — les 2 structures à maîtriser

```python
fruits = ["pomme", "banane"]
fruits.append("kiwi")   # ajoute
fruits[0]               # pomme (index 0 !)
fruits[-1]              # kiwi (dernier)

user = {"nom": "Ada", "age": 36}
user["nom"]             # Ada
user.get("email")       # None au lieu de planter (préfère .get)
user["email"] = "a@x.com"
```

### Compréhension de liste (idiome pythonique)

```python
carres = [x*x for x in range(5)]  # [0, 1, 4, 9, 16]
pairs = [x for x in range(10) if x % 2 == 0]
```

---

## 6. `import` + modules + `ast` (vu en verif du lecteur)

### `import` — emprunter du code existant

Un **module** = un fichier `.py` (ou intégré) avec des fonctions déjà écrites. `import` le charge.

```python
import json              # module standard : JSON
import pathlib           # chemins de fichiers
from pathlib import Path # importe UN nom précis depuis le module
import json as j         # alias : j.dumps(...) au lieu de json.dumps(...)
```

Règles rookie :
- `import` en haut du fichier, un par ligne.
- `from x import y` = ne prend que `y` (pratique, mais évite `from x import *` : on ne sait plus d'où vient quoi).
- `python3 -c "code"` = exécute un mini-code sans fichier (c'est ce que fait `verif.sh` étape 1).
- Chercher un module : Python regarde `sys.path` (dossier courant + stdlib). Erreur `ModuleNotFoundError` = nom fautif ou lib non installée.

```python
# Exécuté seulement si on lance CE fichier (pas si on l'importe)
if __name__ == "__main__":
    main()
```

### `ast` — vérifier le code sans l'exécuter

`ast` (Abstract Syntax Tree) = le module qui comprend la **grammaire** Python. `ast.parse()` lit du code et dit « syntaxe OK / KO » sans rien exécuter — idéal en verif.

```python
import ast

code = open("reader.py").read()
ast.parse(code)   # lève SyntaxError si ":" ou indentation invalide
print("syntax OK")
```

C'est exactement la commande utilisée dans `verif.sh` :
```bash
python3 -c "import ast; ast.parse(open('reader.py').read())"
# -c = "exécute ce qui suit entre guillemets"
# import ast  -> charge le vérificateur de grammaire
# ast.parse(...) -> plante si syntaxe KO, silencieux si OK
```

Aller plus loin (optionnel) :
```python
arbre = ast.parse("x = 1 + 2")
print(ast.dump(arbre, indent=2))  # voir l'arbre : Module > Assign > BinOp...
```

> Retenir : `import` = réutiliser, `ast.parse` = relire sans exécuter. `&&` en bash = « continue seulement si l'étape précédente a réussi », d'où `syntax OK && lancement serveur` dans la verif.

---

## 7. Strings — les chaînes de caractères

Immuables : on ne modifie jamais une chaîne, on en **fabrique une nouvelle**.

```python
nom = "  Ada Lovelace  "

nom.strip()          # "Ada Lovelace"        (enlève espaces début/fin)
nom.lower()          # "  ada lovelace  "
nom.upper()          # "  ADA LOVELACE  "
nom.split()          # ['Ada', 'Lovelace']   (découpe sur les espaces)
"a,b,c".split(",")   # ['a', 'b', 'c']
"-".join(["a","b"])  # "a-b"                 (l'inverse de split)
nom.replace("Ada", "Grace")   # remplace
len(nom)             # longueur
"ada" in nom.lower() # True  (appartenance)
```

### Slicing — découper (marche aussi sur les listes)

```python
s = "Bonjour"
s[0]     # "B"    (index 0 !)
s[-1]    # "r"    (dernier)
s[1:4]   # "onj"  (de l'index 1 inclus à 4 EXCLU)
s[:3]    # "Bon"  (début → 3)
s[::2]   # "Bnor" (un caractère sur 2)
```

> **Le piège n°1 : les index commencent à 0 et la fin est TOUJOURS exclue** (`s[1:4]` ne contient jamais l'index 4). Même logique que `range(4)` → 0,1,2,3.

### f-strings (déjà vues §1) : la manière moderne d'assembler

```python
age = 36
print(f"Ada a {age} ans et 2 ans plus tard : {age + 2}")
```

---

## 8. Nombres — entiers et flottants

```python
int  = 42            # entier, taille illimitée
float = 3.14         # décimal
complex = 1j         # (bonus, rarement utile au début)
```

### Opérateurs : les 3 divisions à connaître

```python
7 / 2    # 3.5   (division classique → toujours float)
7 // 2   # 3     (division entière : on jette la virgule)
7 % 2    # 1     (reste de la division = modulo)
2 ** 3   # 8     (puissance)
round(3.14159, 2)   # 3.14
int("42")           # 42    (string → int)
float("3.5")        # 3.5
str(42)             # "42"
```

### Le piège des flottants : `0.1 + 0.2 != 0.3`

```python
0.1 + 0.2   # 0.30000000000000004  (binaire ≠ décimal parfait)
```

C'est normal (représentation binaire), mais **jamais** `==` sur des flottants :

```python
# BAD
if prix_a + prix_b == 10.0: ...
# GOOD : on compare avec une tolérance
if abs((prix_a + prix_b) - 10.0) < 1e-9: ...
```

Pour l'argent, on utilise `Decimal` (pas de flottants) :
```python
from decimal import Decimal
prix = Decimal("9.99") + Decimal("0.01")   # Decimal("10.00"), exact
```

---

## 9. Collections — listes, tuples, dicts (approfondi)

### Liste `[ ]` — muable, ordonnée

```python
fruits = ["pomme", "banane"]
fruits.append("kiwi")        # ajoute à la fin
fruits.extend(["citron", "lime"])  # ajoute plusieurs
fruits.insert(1, "poire")    # insère à l'index 1
fruits[0] = "abricot"        # remplace (la liste est muable !)
fruits.pop()                 # enlève et renvoie le dernier
fruits.remove("banane")      # enlève par VALEUR (1re occurrence)
sorted(fruits)               # retourne une copie triée (ne modifie pas)
fruits.sort()                # trie SUR PLACE
len(fruits); "kiwi" in fruits
```

### Tuple `( )` — IMMUABLE, ordonné

```python
point = (10, 20)
point[0]       # 10
point[0] = 5   # ❌ TypeError : un tuple ne se modifie pas
```

Pourquoi l'utiliser ? **Immuable = sûr** : une coordonnée, une date, des constantes qu'on ne doit pas casser par accident. Et ça sert à **déballer** (unpacking) :

```python
x, y = (10, 20)     # x=10, y=20  (fonctionne aussi avec les listes)
a, b = b, a         # échange de variables, classique en Python
```

> En résumé : liste = « panier modifiable », tuple = « colis scellé ».

### Dict `{ }` — clé → valeur, rapide, non ordonné (ordre d'insertion)

```python
user = {"nom": "Ada", "age": 36}

user["email"] = "ada@x.com"     # ajoute
del user["age"]                 # supprime
"nom" in user                   # True (test sur les CLÉS)
user.get("taille")              # None au lieu de planter (préfère .get)
user.get("taille", 0)           # 0 par défaut si absent
user.setdefault("pays", "FR")   # met si absent, renvoie la valeur

for cle, val in user.items():   # parcourir clés+valeurs
    print(cle, val)
list(user.keys())               # ['nom', ...]
list(user.values())
```

### Structures imbriquées (le vrai quotidien)

```python
equipe = {
    "ada":  {"role": "dev",  "stack": ["py", "sql"]},
    "lin":  {"role": "ops",  "stack": ["bash", "docker"]},
}
equipe["ada"]["stack"][0]        # "py"
for nom, info in equipe.items():
    print(nom, info["role"], ", ".join(info["stack"]))
```

---

## 10. POO — Programmation Orientée Objet (LE gros morceau)

**Ce que c'est :** regrouper **des données** (attributs) et **des fonctions qui les manipulent** (méthodes) dans une **classe**, puis créer des **objets** (instances) à partir de ce moule.

**Analogie :** la classe est le **plan de la maison**, l'objet est **la maison construite**. Un plan ne te loge pas ; il fabrique autant de maisons qu'on veut, chacune avec son adresse.

### 10.1 La classe de base

```python
class User:
    """Un utilisateur de l'app."""
    def __init__(self, nom, age):    # constructeur : appelé à la création
        self.nom = nom               # self = "cet objet-là"
        self.age = age
        self.actif = True            # valeur par défaut

    def anniversaire(self):          # méthode = fonction de l'objet
        self.age += 1

    def saluer(self):
        return f"Bonjour, je suis {self.nom}."


ada = User("Ada", 36)      # ← crée l'objet (appelle __init__)
lin = User("Linus", 55)
ada.saluer()               # "Bonjour, je suis Ada."
ada.anniversaire()         # ada.age passe à 37
ada.age                    # 37  (l'attribut est lisible)
```

Règles en or :
- `__init__` s'appelle **automatiquement** à la création (pas besoin de l'appeler).
- `self` est **toujours le premier paramètre** d'une méthode : il désigne l'objet courant. On passe `ada` implicitement quand on écrit `ada.anniversaire()`.
- Chaque objet a **ses propres attributs** : `ada.age` et `lin.age` sont indépendants.

### 10.2 `__str__` — ce qu'on voit quand on print

```python
class User:
    ...
    def __str__(self):
        return f"User({self.nom}, {self.age})"

print(ada)        # User(Ada, 37)   au lieu de <__main__.User object at 0x...>
```

Sans `__str__`, `print(objet)` affiche une adresse mémoire inutile. **Toujours** définir `__str__` sur tes classes.

### 10.3 Les méthodes « magiques » (dunder, double underscore)

`__init__` et `__str__` en font partie. D'autres utiles :

| Méthode | Rôle |
|---------|------|
| `__init__(self, ...)` | construit l'objet |
| `__str__(self)` | `str(obj)` / `print(obj)` |
| `__repr__(self)` | représentation de débogage (technique, exacte) |
| `__len__(self)` | `len(obj)` |
| `__eq__(self, other)` | `obj1 == obj2` (sinon comparaison d'identité mémoire !) |
| `__lt__(self, other)` | `obj1 < obj2` (triable) |

```python
class Note:
    def __init__(self, titre, contenu=""):
        self.titre, self.contenu = titre, contenu
    def __eq__(self, other):
        return self.titre == other.titre
    def __repr__(self):
        return f"Note({self.titre!r})"

n1, n2 = Note("IDOR"), Note("IDOR")
n1 == n2          # True (sans __eq__ : False, objets différents !)
```

### 10.4 Encapsulation — protéger les données

Python n'a pas de vrai `private`, mais par convention **`_` devant = privé** (« ne touche pas de dehors ») :

```python
class Compte:
    def __init__(self):
        self._solde = 0            # _ = interne

    def deposer(self, montant):
        if montant <= 0: raise ValueError("montant positif requis")
        self._solde += montant

    @property                          # getter : lecture contrôlée
    def solde(self):
        return self._solde

c = Compte()
c.deposer(100)
c.solde              # 100  (lecture propre, sans parenthèse)
# c._solde = -9999   # techniquement possible, mais c'est violer la convention
```

Pourquoi ? On **contrôle** ce qui entre et sort (vérification, log) au lieu d'exposer `solde` comme un terrain vague.

### 10.5 Héritage — réutiliser et spécialiser

```python
class Animal:
    def __init__(self, nom):
        self.nom = nom
    def parler(self):
        return "..."

class Chien(Animal):          # Chien HÉRITE de Animal
    def parler(self):         # redéfinit (override) la méthode
        return "Wouf"

class Chat(Animal):
    def parler(self):
        return "Miaou"


animaux = [Chien("Rex"), Chat("Félix")]
for a in animaux:
    print(a.nom, a.parler())   # Rex Wouf / Félix Miaou  (polymorphisme)
```

`super()` appelle la méthode du parent (ex. prolonger `__init__`) :
```python
class Chien(Animal):
    def __init__(self, nom, race):
        super().__init__(nom)      # fait tourner Animal.__init__
        self.race = race
```

`isinstance(objet, Classe)` teste l'appartenance : `isinstance(Rex, Animal)` → `True`.

### 10.6 Le pattern complet récap (tout ensemble)

```python
class Fiche:
    """Une note de la bibliothèque."""
    def __init__(self, titre, tags=None):
        self.titre = titre
        self.tags = tags or []          # piège : jamais [] en paramètre par défaut !
        self._vues = 0

    def ajouter_tag(self, tag):
        if tag not in self.tags:
            self.tags.append(tag)

    def vue(self):
        self._vues += 1
        return self._vues

    @property
    def nb_vues(self):
        return self._vues

    def __repr__(self):
        return f"Fiche({self.titre!r}, #{len(self.tags)})"


class FicheSecurite(Fiche):
    """Spécialisation pour les fiches sécurité."""
    def __init__(self, titre, ref_owasp):
        super().__init__(titre, tags=["securite"])
        self.ref_owasp = ref_owasp

f = FicheSecurite("SSRF", "A10")
f.ajouter_tag("web")
print(f)        # FicheSecurite... en fait `repr` → Fiche('SSRF', #2)
```

### 10.7 Pièges rookie POO

| Piège | Correction |
|-------|------------|
| Oublier `self` en premier paramètre | `TypeError: prendre() takes 1 positional argument but 2 were given` |
| `[]` comme paramètre par défaut | **Jamais** : l'état est partagé entre les objets → utiliser `tags=None` puis `tags or []` |
| Oublier `__str__` | Des `<object at 0x...>` illisibles partout |
| `==` qui ne marche pas comme prévu | Sans `__eq__`, `==` compare l'identité mémoire, pas le contenu |
| Modifier un attribut directement sans méthode | Contourne l'encapsulation et la validation |
| Confondre classe et instance | `User.saluer()` (sans objet) ne marche pas : il faut `ada.saluer()` |

---

## 11. Exceptions — `try / except / else / finally`

**Ce que c'est :** quand une fonction rencontre un problème, elle **lève une exception** et le programme s'arrête. `try/except` permet d'**intercepter** l'erreur et de continuer proprement.

**Analogie :** le détecteur de fumée. Sans lui, un feu → tout brûle. Avec lui : feu détecté → alerte → on agit. L'exception est l'alerte ; le `except` est la main qui éteint.

### 11.1 La structure de base

```python
try:
    nombre = int(input("Un nombre : "))   # "abc" → lève ValueError
    print(10 / nombre)                     # 0 → lève ZeroDivisionError
except ValueError:
    print("Ce n'est pas un nombre.")
except ZeroDivisionError:
    print("Division par zéro interdite.")
```

- **Une seule ligne du `try` déclenche l'exception → on saute DIRECTEMENT au `except` correspondant**, le reste du bloc est ignoré.
- **L'ordre des `except` compte** : du plus **spécifique** au plus **général** (sinon le général attrape tout avant).

### 11.2 Attraper plusieurs + récupérer le message

```python
try:
    f = open("fichier.txt")
except (FileNotFoundError, PermissionError) as e:   # tuple = plusieurs types
    print("Impossible d'ouvrir :", e)                # e = le message

# Plusieurs types → on distingue :
except FileNotFoundError:
    ...
except PermissionError:
    ...
```

### 11.3 `else` et `finally` — les deux cousins

```python
try:
    fichier = open("notes.txt")
except FileNotFoundError:
    print("Fichier absent.")
else:
    # s'exécute SEULEMENT si AUCUNE exception
    print("Contenu :", fichier.read())
finally:
    # s'exécute TOUJOURS (exception ou pas)
    print("Fermeture.")
    try: fichier.close()
    except NameError: pass
```

| Bloc | Quand |
|------|-------|
| `try` | le code à risque |
| `except` | si une erreur du type listé survient |
| `else` | si **aucune** erreur (souvent oublié, très utile) |
| `finally` | **toujours** — nettoyage (fermer un fichier, libérer une ressource) |

> Retenir : `else` = « tout s'est bien passé », `finally` = « quoi qu'il arrive, range ta chambre ».

### 11.4 Lever ses propres exceptions — `raise`

```python
def deposer(solde, montant):
    if montant <= 0:
        raise ValueError("Le montant doit être positif")
    if montant > solde:
        raise ValueError("Solde insuffisant")
    return solde - montant
```

`raise` interrompt la fonction et remonte l'erreur à l'appelant — qui décidera de l'attraper ou non. C'est la bonne façon de dire « je ne peux pas faire ce qu'on me demande ».

### 11.5 Les exceptions built-in à connaître

| Exception | Quand |
|-----------|-------|
| `ValueError` | valeur du bon type mais illogique (`int("abc")`) |
| `TypeError` | mauvais type (`"a" + 5`) |
| `KeyError` | clé absente d'un dict |
| `IndexError` | index hors liste |
| `FileNotFoundError` | fichier inexistant |
| `ZeroDivisionError` | division par zéro |
| `ConnectionError` | réseau/service injoignable |
| `AttributeError` | méthode/attribut inexistant |
| `ImportError` / `ModuleNotFoundError` | module introuvable (voir §6) |

> **Le piège : `except:` nu attrape TOUT — y compris `KeyboardInterrupt` (Ctrl+C) et les bugs système.** En pratique, on écrit `except Exception:` au pire, jamais nu, et on évite d'avaler les erreurs en silence.

### 11.6 Les exceptions personnalisées (custom) — lien avec le POO (§10)

Une exception custom = une **classe** qui hérite d'`Exception` :

```python
class SoldeInsuffisant(Exception):      # hérite d'Exception (§10.5)
    """Notre propre type d'erreur."""

def deposer(solde, montant):
    if montant > solde:
        raise SoldeInsuffisant(f"Il manque {montant - solde} €")

try:
    deposer(100, 250)
except SoldeInsuffisant as e:
    print("Paiement refusé :", e)        # on attrape NOTRE erreur, pas ValueError
```

Pourquoi ? `except SoldeInsuffisant` est **précis** : tu n'attrapes que ton erreur métier, et tu peux ajouter des attributs utiles (`e.montant_manquant`) pour que l'appelant décide.

### 11.7 La hiérarchie (pour comprendre)

```
BaseException
 └─ KeyboardInterrupt, SystemExit   (rarement à attraper)
 └─ Exception                        ← la base de 99 % des erreurs
     ├─ ValueError, TypeError, ...
     └─ tes exceptions custom
```

Règle : **lève** des erreurs précises, **attrape** au niveau où tu peux agir, et laisse remonter ce que tu ne sais pas gérer.

### 11.8 Pièges rookie

| Piège | Correction |
|-------|------------|
| `except:` nu | Attrape tout (même Ctrl+C) → écrire `except Exception` ou un type précis |
| Avaler l'erreur sans rien faire | `except: pass` = bugs invisibles. Au minimum un `print`/`log` |
| Mettre le `except` avant les plus spécifiques | Le général intercepte avant le spécifique → ordre : du précis au large |
| `try` trop grand | Un bloc `try` qui englobe 10 lignes cache OÙ l'erreur est venue → viser la ligne à risque |
| Confondre `else` et `finally` | `else` = pas d'erreur · `finally` = toujours |
| Lever `Exception` générique | Utilise `ValueError`/custom : le message seul ne suffit pas à trier |

---

## 12. Type annotations + mypy — décrire et vérifier les types

**Ce que c'est :** **annoter** = déclarer le type attendu sur les variables, paramètres et retours. **mypy** = le vérificateur qui relit ton code et signale les incohérences **sans l'exécuter** (comme `ast.parse` §6, mais pour les types).

**Analogie :** l'étiquette sur une prise électrique. Elle ne change pas le courant, mais elle t'évite de brancher le mauvais appareil. Et mypy, c'est le contrôleur qui passe derrière et vérifie que tout le monde a branché le bon truc.

### 12.1 La syntaxe de base

```python
age: int = 36
nom: str = "Ada"
prix: float = 19.99
actif: bool = True
rien: None = None

def saluer(nom: str, fois: int = 1) -> str:   # -> str = le type de retour
    return f"Bonjour {nom} " * fois
```

- Les annotations **ne changent rien à l'exécution** : Python les ignore (ce n'est pas du Java).
- Elles **documentent** le code ET permettent à mypy (et aux éditeurs) de vérifier.

### 12.2 Les types composés (collections)

```python
from typing import Optional, Union

noms: list[str] = ["Ada", "Linus"]          # Python 3.9+ : list[str] au lieu de List[str]
user: dict[str, int] = {"age": 36}
point: tuple[float, float] = (10.0, 20.0)
options: set[str] = {"dev", "ops"}
```

### 12.3 Le type optionnel — le plus utile

```python
def trouver(user_id: int) -> dict | None:    # Python 3.10+ : | au lieu de Union
    """Renvoie le dict utilisateur, ou None s'il n'existe pas."""
    ...

# ancienne écriture (toujours valable) :
from typing import Optional
def trouver(user_id: int) -> Optional[dict]:
    ...
```

**Le type `None` dans les retours :**
```python
def enregistrer(nom: str) -> None:      # ne renvoie rien (c'est le but)
    print("sauvé")
```

### 12.4 `Any` — l'échappatoire à éviter

```python
def chose(x: Any) -> Any: ...   # = "pas de type" : mypy ne vérifie RIEN ici
```

`Any` propage le vide : si `chose()` entre dans une fonction typée, le contrôle repart de zéro. On l'utilise pour du code hérité / des libs non typées, pas par flemme.

### 12.5 Alias et types personnalisés

```python
ID = int                            # alias
UserDict = dict[str, str]

def charge(user_id: ID) -> UserDict: ...

# Une classe EST un type : parfait avec le POO (§10)
class User:
    def __init__(self, nom: str, age: int) -> None:
        self.nom = nom
        self.age = age

def saluer(u: User) -> str:
    return f"Bonjour {u.nom}"
```

### 12.6 Les fonctions comme types

```python
from typing import Callable

# une fonction qui prend (str -> int) comme argument
def appliquer(f: Callable[[str], int], x: str) -> int:
    return f(x)
```

### 12.7 Les types avancés (ceux du code réel)

**`dict` / `Dict`** — deux écritures pour la même chose :
```python
from typing import Dict, Mapping, MutableMapping, Protocol, NamedTuple, Final

config: Dict[str, int] = {"max": 5}    # ancienne écriture (typing)
config: dict[str, int] = {"max": 5}    # 3.9+ : la moderne, à préférer
```

**`Mapping` vs `MutableMapping`** — LIRE vs MODIFIER :
```python
def lire(conf: Mapping[str, int]) -> int:    # on ne fait que LIRE
    return conf["max"]

def maj(conf: MutableMapping[str, int]) -> None:   # on MODIFIE
    conf["max"] = 10
```
Pourquoi s'embêter ? Si ta fonction ne modifie pas le dict, accepte `Mapping` : tu acceptes aussi les objets en lecture seule, et tu **documentes l'intention** — le lecteur sait que tu ne vas pas muter son dict.

**`Protocol`** — le typage structurel (duck typing formalisé) :
```python
class Tirable(Protocol):
    def tirer(self) -> str: ...

class Arc:
    def tirer(self) -> str: return "flèche"
class Canon:
    def tirer(self) -> str: return "boulet"

def actionner(a: Tirable) -> str:
    return a.tirer()

actionner(Arc()); actionner(Canon())   # OK : les deux ont .tirer()
```
Contrairement à l'héritage (§10.5), `Protocol` **n'exige pas d'hériter** : tout objet qui a la bonne méthode est accepté. C'est « si ça a un `.tirer()`, c'est un Tirable » — le canard typé.

**`NamedTuple`** — un tuple avec des champs nommés (mini-structure légère) :
```python
class Point(NamedTuple):
    x: float
    y: float

p = Point(10.0, 20.0)
p.x        # 10.0   (champ nommé — lisible)
p[0]       # 10.0   (reste un tuple — indexable)
x, y = p   # 10.0, 20.0   (déballage)
# p.x = 5  # ❌ TypeError : un NamedTuple est immuable
```
Immuable + lisible + léger. Parfait pour une coordonnée, une date, une paire. Pour une vraie structure avec méthodes → dataclass ou classe (§10).

**`Final`** — les VRAIES constantes (mypy refuse la réassignation) :
```python
MAX_TENTATIVES: Final = 5
MAX_TENTATIVES = 6   # mypy : error: Cannot assign to final name "MAX_TENTATIVES"
```
Le chaînon manquant de la fiche [[system-building]] : les constantes nommées, désormais **protégées par le vérificateur** — impossible de les écraser par accident.

### 12.8 mypy — le vérificateur

```bash
pip install mypy
mypy mon_fichier.py            # signale les incohérences de types
mypy --strict mon_fichier.py   # mode sévère : exige l'annotation partout
```

```python
# mypy sait débusquer les bugs AVANT l'exécution :
def moitié(n: int) -> float:
    return n / 2

moitié("dix")          # mypy : Argument 1 has incompatible type "str"
                       #        expected "int"  (le code s'exécute quand même !)
```

**Pourquoi c'est précieux** : les bugs de type (ex. passer un `str` là où il faut un `int`) sont détectés à la compilation, pas en production. Comme `ast.parse` vérifie la **syntaxe**, mypy vérifie les **types** — deux filets, deux verifs, avant le `python3` de prod.

### 12.9 Pièges rookie

| Piège | Correction |
|-------|------------|
| Croire que les annotations changent le comportement | Non : pure documentation + vérification, l'exécution est inchangée |
| `list[int]` qui plante sur vieux Python | Nécessite 3.9+ ; sinon `from typing import List` |
| Oublier le type de retour | Le plus utile à annoter, surtout pour les fonctions à `None`/`Optional` |
| Mettre `Any` partout | Tu neutralises mypy sur tout le fichier |
| Ignorer les warnings mypy | C'est exactement les bugs que tu retrouveras en prod |
| Confondre annotation et valeur par défaut | `nom: str = "Ada"` : type APRÈS les deux points, valeur APRÈS le `=` |

> Retenir : annoter, c'est écrire un **contrat** lisible par toi, ton éditeur et mypy — et faire tourner `mypy` avant chaque `commit`, comme `ast.parse` avant de lancer le serveur (voir [[troubleshooting]]).

---

## Mémo erreurs rookie

| Erreur | Cause |
|--------|-------|
| `IndentationError` | mélange espaces/tab ou bloc pas indenté après `:` |
| `NameError` | variable non définie / faute de frappe |
| `TypeError: ... NoneType` | fonction sans `return` utilisée comme valeur |
| `IndexError` | index hors liste (`liste[5]` sur 3 éléments) |
| `KeyError` | clé absente du dict (utilise `.get()`) |
| `AttributeError: 'X' object has no attribute 'y'` | méthode/attribut inexistant ou mal orthographié |
| `TypeError: ... takes 1 positional argument but 2 were given` | oubli de `self` en premier paramètre d'une méthode |
| `0.30000000000000004` | flottant : ne compare JAMAIS avec `==`, utilise une tolérance |
| `except: pass` silencieux | Erreur avalée sans trace → loguer, jamais passer en silence |
| `except:` nu | Attrape tout (même Ctrl+C) → cibler `Exception` ou un type précis |
| `Any` partout | Neutralise mypy : annoter précisément, `Any` seulement pour l'héritage |
| `dict` partout dans les signatures | Si tu ne lis que, préfère `Mapping` : accepte plus de choses et documente l'intention |
| Modifier un `NamedTuple` | Immuable par conception : pour muter, utiliser une classe/dataclass |
| `Protocol` là où un simple type suffit | Réservé aux « comportements » (méthodes) ; pour une simple valeur, annoter le type direct |

*Prochaine fiche : `open()/with` (fichiers), les décorateurs `@`, les générateurs `yield` ?*
