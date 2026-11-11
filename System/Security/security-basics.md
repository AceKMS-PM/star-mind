---
tags: [security, threat-intel, cia, dad, acteurs, attaques, stix, taxii]
---

# Security Foundations — threat intel, CIA/DAD, acteurs, attaques, vecteurs (fiche du jour)

> **Ce que tu as appris aujourd'hui en une page** : comment on décrit les menaces (threat intelligence + STIX/TAXII/OpenCTI), les 3 objectifs de sécurité (CIA) et leurs 3 échecs (DAD), qui sont les acteurs malveillants, les attaques courantes, et l'anatomie d'un vecteur d'attaque.

---

## 1. Threat Intelligence — la connaissance des menaces

**Définition rookie :** collecter, analyser et partager des infos sur les **menaces** pour anticiper les attaques au lieu de les subir.

**Analogie :** les renseignements pour une ville qui craint un cambriolage : on sait quelles bandes existent (acteurs), quelles portes elles visent (TTP), et on renforce AVANT l'effraction.

Le cycle de base : **collecte → analyse → diffusion → réaction** (et on recommence).

### Les 3 critères : une info ET = threat intelligence (RAC)

Une information brute n'est (presque) jamais de l'intelligence. Pour mériter le titre, elle doit être :

| Critère | Question | Exemple |
|---------|----------|---------|
| **Relevant** | me concerne-t-elle ? | une IP malveillante listée dans MON périmètre plutôt que dans n'importe quel datacenter |
| **Actionable** | puis-je agir dessus ? | une règle à créer / un blocage à faire, pas juste un constat sans suite |
| **Contextual** | sait-on dans QUEL contexte ? | l'IP liée à un acteur, une TTP, une cible — pas un chiffre flottant |

> **Une liste d'IP sans contexte ni action = une liste. Ajoute le contexte (qui, quoi, quelle TTP) + la réaction possible (quelle règle) et elle devient de la threat intelligence.** Le « nutella et », c'est le trio RAC.

### Les termes clés

| Terme | C'est quoi |
|-------|------------|
| **Indicateur (IOC)** | une preuve observable (IP, hash, domaine malveillant) |
| **TTP** | Tactic, Technique, Procedure — *quoi* fait l'attaquant et *comment* |
| **Intelligence** | du brut transformé en **recommandation actionnable** (pas juste une liste d'IP) |
| **CTI** | Cyber Threat Intelligence — la discipline |

## 2. Les outils du métier : STIX, TAXII, OpenCTI

Trois briques de l'écosystème standard :

| Outil | Type | Rôle |
|-------|------|------|
| **STIX** (Structured Threat Information eXpression) | un **langage** (format JSON) | décrire du malveillant de façon **structurée et partageable** : indicateurs, TTP, campagnes, acteurs, malwares — avec leurs relations |
| **TAXII** (Trusted Automated eXchange of Intelligence Information) | un **protocole** (HTTPS/REST) | **transporter** des flux STIX entre plateformes/communautés (le facteur qui livre les colis STIX) |
| **OpenCTI** | une **plateforme** open source | stocker, lier et analyser tout ça : graphe d'entités (un malware → lié à son acteur → lié à ses indicateurs) |

**En une phrase** : *STIX est la langue, TAXII est le facteur, OpenCTI est la bibliothèque où tout est rangé et relié.*

## 3. La triade CIA — les 3 objectifs de sécurité

**C**onfidentiality · **I**ntegrity · **A**vailability — les trois piliers que toute défense cherche à garantir :

| Pilier | Question | Exemple de garantie |
|--------|----------|---------------------|
| **Confidentialité** | qui a le droit de VOIR ? | seuls toi et le destinataire lisent le message |
| **Intégrité** | le contenu est-il AUTHENTIQUE et intact ? | la transaction n'a pas été modifiée en route |
| **Disponibilité** | le service répond-il QUAND on en a besoin ? | le site reste accessible même en forte charge |

### Son inverse : la triade DAD (les 3 échecs)

| Défaut | Inverse de | Ce que l'attaquant cherche |
|--------|-----------|---------------------------|
| **Disclosure** (divulgation) | Confidentialité | VOIR ce qui est privé → par ex. une fuite de données, un [[idor]] |
| **Alteration** (altération) | Intégrité | MODIFIER ce qui devait être intact → injection, défiguration |
| **Denial** (refus) | Disponibilité | EMPÊCHER l'accès → un DDoS, un crash |

> **Retenir :** plateforme de gauche = ce qu'on protège (CIA), plateau de droite = ce que l'attaquant casse (DAD). Pécher l'un, c'est attaquer l'autre.

## 4. Les acteurs malveillants — QUI attaque ?

| Acteur | Motif | Profil |
|--------|-------|--------|
| **Cybercriminel** | **argent** | ransomware, escroqueries, vol de données revendues |
| **Hacktiviste** | **idéologie / réputation** | défiguration, fuite de données militante ; veut être VU |
| **Cyberterroriste** | **peur / chaos** | frapper des infrastructures pour intimider |
| **Explorateur / script kiddie** | **curiosité / notoriété** | utilise des outils tout faits, peu de technique |
| **Cyberguerrier (étatique / APT)** | **espionnage / puissance** | discret, patient, très outillé, financé par un État (Advanced Persistent Threat) |
| **Initier (insider)** | variable (argent, vengeance) | est DÉJÀ à l'intérieur : privilèges d'accès |

## 5. Les attaques du jour (vite fait)

- **Phishing (hameçonnage)** : un faux e-mail/piège qui imite une entité de confiance pour voler identifiants ou piéger un clic → l'humain est le vecteur (voir [[auth-vulns]]).
- **Brute force** : essayer des combinaisons jusqu'à trouver la bonne → le mot de passe faible en est la condition (déchiffré dans [[auth-vulns]]).
- **DDoS (Distributed Denial of Service)** : submerger un service de requêtes pour le rendre indisponible → il casse la **Disponibilité** (le `D` de DAD).

## 6. Le concept d'ATTACK VECTOR — l'anatomie d'une attaque

Un vecteur d'attaque = **le chemin** par lequel l'attaquant atteint sa cible. Il se décompose en 3 briques :

```
VULNÉRABILITÉ  ──►  MÉCANISME  ──►  PATHWAY  →  l'attaque aboutit
   (la faiblesse)    (comment on l'exploite)     (le chemin d'accès)
```

| Brique | Question | Exemple (SQLi) |
|--------|----------|----------------|
| **Vulnérabilité** | la faiblesse existe-t-elle ? | la requête SQL concatène l'input utilisateur |
| **Mécanisme** | comment l'exploiter ? | injection `' OR 1=1--` (ou un outil comme sqlmap) |
| **Pathway** | par quel chemin atteint-on la l'endroit ? | le formulaire de login accessible depuis internet |

**Pourquoi c'est utile :** bloquer UNE SEULE brique casse tout le vecteur :
- corriger la **vulnérabilité** (requête paramétrée) = l'attaque ne passe plus du tout
- durcir le **mécanisme** (limit de tentatives) = l'exploitation échoue
- restreindre le **pathway** (firewall = [[ufw]], accès limité) = l'attaquant n'atteint pas la cible

C'est le modèle que notre fiche [[system-building]] applique : défendre en couches, une brique par porte.

## 7. La Cyber Kill Chain — les 7 étapes d'une attaque

**Définition rookie :** le modèle de Lockheed Martin qui décrit une attaque comme une **chaîne de 7 maillons**, de la première observation jusqu'à l'objectif final. Chaque maillon doit réussir pour que la suivante existe.

**Analogie :** le braquage d'une banque. Repérer la banque → fabriquer le pied-de-biche → se faire passer par un livreur → forcer le coffre → se cacher dans l'établissement → garder contact avec le complice → sortir avec l'argent.

| # | Étape | L'attaquant… | Contre-mesure (casser LE maillon) |
|---|-------|--------------|----------------------------------|
| 1 | **Reconnaissance** | repère la cible (ports ouverts, technos, employés, e-mails) | minimiser la surface, surveiller les scans, pas d'infos utiles en public |
| 2 | **Weaponization** | fabrique l'arme sur mesure du vecteur trouvé (malware, document piégé) | durcir le mécanisme d'exploitation, tenir les patches |
| 3 | **Delivery** | livre l'arme : e-mail de **phishing**, USB, site piégé | filtrage mails, sensibilisation (le maillon humain) |
| 4 | **Exploitation** | déclenche l'exploit contre une **vulnérabilité** | corriger les vulnérabilités connues (patch management) |
| 5 | **Installation** | s'installe durablement (backdoor, persistance) | détection de comportement, surveillance des nouveaux processus |
| 6 | **Command & Control (C2)** | établit le canal de commande (exfil de commandes, botnet) | blocage des domaines C2 connus, monitoring des sorties réseau |
| 7 | **Actions on Objectives** | exécute le but : **exfiltration**, chiffrement, destruction, espionnage | sauvegardes, détection de fuites, réponse à incident |

### Deux leçons qui découlent

1. **Casser UN maillon suffit** : si la livraison échoue ou le C2 est bloqué, l'attaque s'arrête — même si les autres étapes sont prêtes. Défense en profondeur (le même principe que le vecteur §6).
2. **Plus on détecte tôt, moins ça coûte** : stopper à la *reconnaissance* ou à la *livraison* coûte peu ; stopper à *Actions on Objectives* veut dire qu'on a déjà perdu.

> **L'héritier moderne : MITRE ATT&CK.** La kill chain donne le squelette en 7 étapes ; ATT&CK détaille chaque étape en **TTP précises** (les « Tactiques et Techniques » de la §1) — c'est la bibliothèque des actions adverses, et c'est exactement ce que STIX/OpenCTI décrivent avec leur vocabulaire.

## 8. Le fil rouge de la journée

> **Tout se tient** : la triade CIA/DAD dit QUOI protéger, les acteurs disent QUI menace, les attaques montrent COMMENT, le vecteur assemble le tout (vulnérabilité + mécanisme + chemin), et la **kill chain** raconte l'histoire complète du premier repérage jusqu'à l'exfiltration. La threat intelligence (STIX/TAXII/OpenCTI) est le langage commun pour raconter ces attaques à l'échelle.

*Liens logiques : les failles concrètes du web → [[sheets]] · l'attaque auth par excellence → [[auth-vulns]] · la disponibilité se dépannne → [[troubleshooting]] · un système bien posé implémente la CIA → [[system-building]] · l'isolation renforce CIA → [[guest-host]] · le pare-feu durcit le pathway → [[ufw]]*