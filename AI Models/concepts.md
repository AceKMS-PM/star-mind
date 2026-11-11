# AI / LLM — Concepts de base (fiche rookie)

> Objectif : comprendre le vocabulaire qu'on croise partout (agent, token, transformer, EOS, base vs instruct, chat template) avec des analogies simples + le strict minimum technique.

---

## 1. Agent (IA) — définition

Un **modèle** prédit du texte. Un **agent** agit en boucle :

```
objectif -> pense (LLM) -> choisit un outil -> observe le résultat -> recommence
```

Ingrédients minimaux d'un agent :
1. **Cerveau** : un LLM (ex. Muse, Llama).
2. **Outils (tools)** : fonctions qu'il peut appeler (`rechercher_web`, `lire_fichier`, `executer_code`).
3. **Mémoire** : historique de conversation + éventuellement notes / base vectorielle.
4. **Boucle** : tant que l'objectif n'est pas atteint, il raisonne → agit → observe.

```python
# Pseudo-code d'un agent
while not tache_finie:
    pensee = llm(messages + outils_disponibles)
    if pensee.appelle_outil:
        resultat = executer(pensee.outil)
        messages.append(resultat)   # observation
    else:
        repondre(pensee.texte)
```

> Rookie : sans outils, c'est un chatbot. Avec outils + boucle, c'est un agent. Le danger = l'agent peut faire de vraies actions → toujours valider / sandboxer.

---

## 2. Token + autorégression — comment le modèle "écrit"

### Token = unité de lecture

Le modèle ne voit pas des lettres ni des mots, mais des **tokens** (morceaux de mots). Tokenisation (Byte-Pair Encoding) :

- `"chat"` → 1 token
- `"anticonstitutionnellement"` → plusieurs tokens (`anti`, `constitution`, `nelle`, `ment`...)
- 1 token ≈ 4 caractères en anglais, ≈ ¾ de mot. 1000 tokens ≈ 750 mots.

Chaque token a un **id** (nombre) dans un vocabulaire (ex. 32k, 128k tokens).

### Autorégression = prédire le token suivant, en boucle

Le modèle ne fait QU'UNE chose : `P(token_suivant | tokens_précédents)`.

```
"Le ciel est" -> prédit "bleu" (proba 0.7), "gris" (0.2), ...
on choisit "bleu" -> "Le ciel est bleu" -> prédit le suivant -> ...
```

C'est **autorégressif** : sa propre sortie devient son entrée pour le tour suivant. Il ne "réfléchit" pas puis écrit — il écrit token par token, gauche → droite.

Paramètres qui changent le choix :
- **temperature** : 0 = toujours le plus probable (déterministe), 1+ = créatif/aléatoire.
- **top-p / top-k** : ne garde que les meilleurs candidats avant tirage.

> Rookie : s'il "invente" (hallucine), c'est normal — il prédit du plausible, pas du vrai. D'où RAG / outils pour ancrer au réel.

---

## 3. Encoder / Decoder / Transformer

Le **Transformer** (2017, "Attention Is All You Need") est l'architecture de quasi tous les LLM. Brique clé : **l'attention** = chaque token regarde les autres tokens pour comprendre le contexte (`"il"` se réfère à quoi ?).

Trois saveurs :

| Type | Lit comment ? | Sert à quoi ? | Exemples |
|------|---------------|---------------|----------|
| **Encoder** (bidirectionnel) | tout le texte d'un coup, gauche+droite | comprendre / classifier (pas générer) | BERT, embeddings |
| **Decoder** (autorégressif) | gauche → droite, masqué | générer du texte | GPT, Llama, Mistral, Muse |
| **Encoder-Decoder** | lit tout puis génère | traduction, résumé seq2seq | T5, BART, Whisper |

```
Encoder :  "Ce film est nul" -> [0.9 négatif]   (comprend)
Decoder :  "Il était une" -> "fois..."          (génère)
Enc-Dec :  "Hello" -> encode -> decode "Bonjour" (transforme)
```

Quand on dit "LLM" aujourd'hui = 99% du temps un **decoder-only transformer**.

---

## 4. EOS + vocabulaire — quand s'arrêter ?

- **BOS** (Begin Of Sequence) : token de début, optionnel.
- **EOS** (End Of Sequence) : token spécial (ex. `<eos>`, `<|endoftext|>`, `</s>`) que le modèle prédit quand il a fini. La génération s'arrête quand EOS sort (ou quand `max_tokens` est atteint).
- **Tokens spéciaux** : `<pad>`, `<unk>`, tokens de rôle (voir §6 chat template).

```python
vocab = ["bonjour", "le", "monde", "<eos>"]
# génération : "bonjour" -> "le" -> "monde" -> "<eos>" STOP
```

> Rookie : si la réponse est coupée en plein milieu, c'est souvent `max_tokens` atteint AVANT que le modèle ait prédit EOS.

---

## 5. Base model vs Instruct — cru vs éduqué

- **Base model** : entraîné sur prédiction brute (compléter du texte web). Il *continue*, il n'obéit pas.
  ```
  Prompt: "La capitale de la France est"
  Base -> " Paris, qui compte..." (continue)
  ```
- **Instruct / Chat model** : base + **fine-tuning** sur paires (instruction → bonne réponse) : SFT (Supervised Fine-Tuning) puis souvent RLHF / DPO (préférences humaines). Il *suit des consignes*, dit "je ne sais pas", refuse certains contenus.

```
Base    = élève qui a tout lu mais n'écoute pas
Instruct = même élève après dressage : poli, utile, formaté
```

En pratique on utilise toujours un **instruct** (ex. `llama-3-8b-instruct`, pas `llama-3-8b`). Le prix : un peu de créativité/capacités brutes perdues (alignment tax).

---

## 6. Chat template — comment on parle au modèle instruct

Un modèle instruct ne prend pas du texte libre : il attend un format avec **rôles** :

- `system` : consigne persistante ("Tu es un assistant utile...")
- `user` : ce que demande l'utilisateur
- `assistant` : réponses précédentes du modèle (+ à générer)
- parfois `tool` : résultat d'un outil

Le **chat template** (souvent Jinja) convertit la liste de messages en UNE chaîne avec des tokens spéciaux :

```
<|system|>Tu es utile.<|end|>
<|user|>2+2 ?<|end|>
<|assistant|>
```

Exemple réel (Llama-3) :
```
<|begin_of_text|><|start_header_id|>system<|end_header_id|>
Tu es un assistant.<|eot_id|><|start_header_id|>user<|end_header_id|>
Bonjour<|eot_id|><|start_header_id|>assistant<|end_header_id|>
```

```python
# Avec HuggingFace transformers
from transformers import AutoTokenizer
tok = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B-Instruct")
prompt = tok.apply_chat_template([
    {"role": "system", "content": "Tu es utile."},
    {"role": "user", "content": "2+2 ?"},
], tokenize=False, add_generation_prompt=True)
```

> Rookie — 3 erreurs classiques :
> 1. Oublier le `system` → comportement par défaut imprévisible.
> 2. Mélanger les rôles (mettre une instruction système en `user`) → moins bien suivi.
> 3. Changer de modèle sans changer de template → tokens spéciaux inconnus = réponses bizarres.

---

## 7. Le Transformer en détail — pourquoi ça marche (vu du jour)

Rappel §3 : papier *"Attention Is All You Need"* (2017). L'idée qui tue : au lieu de lire mot à mot dans l'ordre (comme les RNN), **chaque token regarde tous les autres et décide lesquels comptent** pour comprendre le contexte. D'où `"il"` = le chat ou le chien selon la phrase.

### Q, K, V — l'analogie qui retient tout

Pour chaque token, le modèle fabrique 3 vecteurs (simples projections linéaires apprises) :

- **Query** : « moi, token X, je cherche quoi ? » (ex. le pronom `"il"` cherche son antécédent)
- **Key** : l'étiquette que chaque autre token affiche (« moi je suis un nom masculin singulier »)
- **Value** : le contenu réel transporté si on est sélectionné

Score = compatibilité `Query · Key`, normalisé par `softmax` → moyenne pondérée des `Value`. En une phrase : *chaque token aspire le sens des tokens pertinents*.

### Multi-têtes et blocs

- **Multi-head** : 8 à 128 attentions en parallèle, chacune spécialisée (sujet-verbe, temps, coréférence, position...). On concatène.
- **Un bloc** = attention + réseau feed-forward (MLP, la « mémoire » des faits) + connexions résiduelles + normalisation. On empile : 12 (petits) à 80+ (Llama-70B) blocs.
- **Masque causal** (decoder) : un token ne voit que le passé → c'est exactement ce qui rend la génération **autorégressive** (§2).
- **KV-cache** : en génération, on mémorise les K/V déjà calculés au lieu de tout recalculer → la RAM explose avec la longueur du contexte. D'où : grand contexte = cher.

> Retenir : attention = routage du sens, MLP = stockage des connaissances, profondeur = raisonnement.

---

## 8. Tokenizers — pourquoi ça varie par modèle (vu du jour)

Le tokenizer fait `texte ↔ ids`. Chaque modèle a **son propre vocabulaire** (la matrice d'embeddings en dépend directement) → **tokenizers non interchangeables**. Compter les tokens de GPT avec le tokenizer de Llama = faux.

### Les 3 familles

| Algo | Principe | Qui l'utilise |
|------|----------|---------------|
| **BPE** | Part des caractères, fusionne les paires les + fréquentes (`" t"+"he"` → `" the"`) | GPT-2/3/4, RoBERTa |
| **WordPiece** | Comme BPE, morceaux marqués `##` (`"playing"` → `"play"+"##ing"`) | BERT |
| **SentencePiece / Unigram** | Travaille sur texte brut, espace explicite `▁` (`"▁bonjour"`) | Llama, Mistral, Gemma |

### Tailles de vocabulaires (à connaître)

| Modèle | Vocab | Notes |
|--------|-------|-------|
| BERT | ~30k | WordPiece, cased/uncased |
| GPT-2 | ~50k | BPE, `tiktoken p50k` |
| GPT-3.5 / GPT-4 | ~100k | `cl100k_base`, chiffres découpés par 3 |
| Llama-2 / Mistral-7B | 32k | SentencePiece |
| Llama-3 | 128k | gros vocab multilingue |
| Gemma | 256k | énorme, texte + code |

### Conséquences pratiques (le piège rookie)

1. **Même phrase, nb de tokens différent** selon le modèle → coût, latence et % de contexte utilisé varient. Toujours compter avec **le tokenizer du modèle déployé** (`tiktoken`, `transformers.AutoTokenizer`, compteur du provider).
2. **Fertility** : nb moyen de tokens par mot. Anglais ≈ 1.3, français ≈ 2, langues rares/code : bien pire → même tâche = plus cher hors anglais.
3. **Chiffres et maths fragiles** : `"1234"` peut devenir `"12"+"34"` ou `"1"+"2"+"3"+"4"` selon le modèle — le modèle ne « voit » jamais le nombre entier. D'où erreurs d'arithmétique.
4. **Espaces et `▁`** : `" bonjour"` (avec espace) ≠ `"bonjour"` — deux ids différents. Les prompts sensibles aux espaces peuvent changer le comportement.
5. **Spéciaux** : `BOS/EOS/PAD/UNK` + tokens de chat (§4, §6) gonflent le compte réel vs ton texte.

```python
# La règle d'or : un tokenizer par modèle
from transformers import AutoTokenizer
tok = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1")  # PAS celui de Llama !
print(tok.encode("Bonjour le monde"))  # ids spécifiques à Mistral
print(len(tok.encode(long_text)))      # seul vrai compteur de contexte/coût
```

> Retenir : le tokenizer, c'est la paire de lunettes du modèle — change de modèle, change de lunettes, change de vision du même texte.

---

## Carte mémo

| Mot | En une phrase |
|-----|---------------|
| Agent | LLM en boucle pense → outil → observe |
| Token | morceau de mot, unité du modèle (~4 lettres) |
| Autorégressif | prédit le token suivant, recommence |
| Transformer | archi à attention ; LLM = decoder-only |
| EOS | token "j'ai fini", arrête la génération |
| Base | continue du texte, n'obéit pas |
| Instruct | obéit (SFT + RLHF/DPO) |
| Chat template | mise en forme system/user/assistant + tokens spéciaux |
| Attention QKV | chaque token aspire le sens pertinent (Q cherche, K étiquette, V transporte) |
| Tokenizer | texte ↔ ids, propre à chaque modèle (BPE/WordPiece/SentencePiece) |
| Fertility | tokens par mot — varie par langue et modèle (= coût) |

*Prochaine fiche : temperature/top-p en pratique, KV-cache et fenêtre de contexte, RAG vs fine-tuning ?*
