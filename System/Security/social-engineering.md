---
tags: [security, social-engineering, phishing, insider, influence, fraude]
---

# Social Engineering — l'attaque qui n'exploite pas un bug (fiche du jour)

> **Définition rookie :** l'ingénierie sociale, c'est **manipuler des personnes** pour qu'elles fassent ce que l'attaquant veut — au lieu d'exploiter une vulnérabilité technique. Le « bug » exploité, c'est la confiance, l'urgence et la politesse.

**Analogie :** le cambrioleur peut forcer le coffre (technique) ou persuader le vigile de lui ouvrir (social). Deuxième option : plus facile, pas de trace, et le vigile ne se souvient même pas de lui. L'humain est **le** maillon le plus faible de la chaîne — c'est le maillon *Delivery* de la kill chain (voir [[security-basics]]).

## 1. Les techniques principales

| Technique | Comment | Exemple |
|-----------|---------|---------|
| **Phishing** | faux message qui imite une entité de confiance | faux e-mail « votre compte va être suspendu » (voir [[auth-vulns]]) |
| **Spear phishing** | phishing **ciblé** sur une personne précise | mail perso nommant ton vrai projet |
| **Whaling** | la version « gros poissons » : les dirigeants | « le CEO demande un virement urgent » |
| **Waterholing** | empoisonner le **point d'eau** : le site que la cible fréquente | infecter le site du club de sport des employés de la banque voisine |
| **Pretexting** | inventer un **prétexte** crédible pour soutirer une info/action | « je suis du support, votre compte a une alerte, confirmez-moi votre code » |
| **Baiting** | tendre un **appât** | clé USB « oubliée » dans le parking, offre trop belle |
| **Tailgating** | suivre quelqu'un à travers une porte sécurisée (entrer dans son sillage) | « j'ai oublié mon badge » ou juste passer derrière en faisant mine d'être connu |
| **Quid pro quo** | un service contre une faveur | « je répare votre PC » puis « ah, j'ai besoin de votre mot de passe pour valider » |

**Le point commun** : on déclenche l'une des 3 cordes — **l'urgence** (« vite, ça expire »), **l'autorité** (« c'est la direction »), **l'appât du gain** (« vous avez gagné »).

## 2. Les insider threats — quand la menace est DANS la maison

Un initié (insider, déjà présent dans §acteurs de [[security-basics]]) peut être de trois types :

| Type | Agit | Motif |
|------|------|-------|
| **Malicious insider** | **volontairement** contre l'entreprise | argent, vengeance, pression extérieure |
| **Manipulated insider** | **sans le vouloir**, piégé par du social engineering | prétexting, chantage, ingénierie (la victime EST l'arme) |
| **Négligent** | par **inattention** | oubli, click sur un lien, post-it sur l'écran |

> **Le fait le plus important de la journée :** les trois voient la même chose — mais seul le *malicious* a l'intention. Le *manipulated* est une **arme involontaire** : on a retourné un employé légitime contre son propre système. D'où l'importance de la sensibilisation : un employé bien formé ne se laisse pas armer.

## 3. Les influence campaigns — l'ingénierie sociale de masse

Quand on manipule non plus une personne mais **une population** :

| Outil | Description |
|-------|-------------|
| **Désinformation / fausses nouvelles** | infos fausses ou décontextualisées diffusées pour orienter les opinions |
| **Astroturfing** | de fausses « bases populaires » : des milliers de faux avis, de faux soutiens |
| **Bots / réseaux de comptes** | des comptes automatisés qui amplifient un message, le font paraître majoritaire |
| **Amplification** | orchestrer la viralité pour imposer un récit ou noyer le vrai |

**Le principe commun avec le phishing** : créer un **sentiment** (peur, indignation, adhésion) pour que la cible agisse sans vérifier. La cible n'est pas une boîte mail mais une opinion publique.

## 4. Frauds and scams — les escroqueries

L'objectif final de beaucoup de manipulations : **l'argent ou les données**.

| Arnaque | Le piège |
|---------|----------|
| **Faux support technique** | « votre PC est infecté » → accès à distance → il « répare » en volant |
| **Arnaque au président / aux fournisseurs** | faux mail d'un dirigeant → virement d'urgence (le whaling) |
| **Avance de frais** | « payez une petite somme pour débloquer le gros lot » (l'appât) |
| **Romance scam** | une relation en ligne → un « imprévu » → un envoi d'argent |
| **Faux service public** | « impôt non payé, payez maintenant ou amende » (l'urgence + l'autorité) |

## 5. La défense — pourquoi les outils ne suffisent pas

Les firewalls [[ufw]] et les antivirus ne bloquent pas un employé qui donne son mot de passe. Les contre-mesures sont **humaines** :

- **Vérifier hors canal** : un mail/sms/appel suspect → rappeler sur un numéro OFFICIEL (jamais celui du message)
- **Ne jamais donner un code/secret à celui qui le demande** : un vrai support ne demande jamais ton mot de passe (c'est la règle n°1)
- **La double vérification** pour les actions à risque (virement) : appeler le vrai destinataire
- **MFA obligatoire** : même identifiants volés → il manque la 2e preuve (voir [[auth-vulns]])
- **Sensibilisation + exercices** : tester ses équipes avec des faux phishing pour entraîner le réflexe
- **Procédure anti-tailgating** : badge systématique, porter un inconnu à la sécurité (poliment mais fermement)

## 6. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « L'ingénierie sociale = le phishing » | Le phishing n'est qu'une technique parmi 8 (waterholing, pretexting, baiting…) |
| « C'est technique, un antivirus suffit » | Le vecteur est l'humain : aucun antivirus ne bloque un employé convaincu |
| « Les initiés sont des traîtres » | La majorité des incidents internes vient de la **négligence** ou de la **manipulation**, pas de la trahison |
| « Ça m'arrivera pas à moi » | L'urgence + l'autorité font baisser la garde de 99 % des gens — c'est le métier de l'attaquant |
| Vérifier en répondant au même canal | Reconfirmer sur le numéro du message = parler à l'attaquant. Toujours un canal OFFICIEL séparé |

## 7. En une ligne

> L'ingénierie sociale ne pirate pas une machine, elle pirate **une conversation** : urgence, autorité, appât — et si ça ne marche pas sur toi, c'est peut-être qu'elle essayait sur ton collègue.

*Liens logiques : le maillon humain de la kill chain → [[security-basics]] · le phishing qui alimente l'attaque de credentials → [[auth-vulns]] · la fraude et les fuites vues côté web → [[sheets]] · et pourquoi la sensibilisation est une couche du système → [[system-building]]*