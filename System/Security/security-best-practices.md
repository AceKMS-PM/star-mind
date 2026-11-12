---
tags: [security, best-practices, defense, hardening, architecture, methodologie]
---

# Security Best Practices — les bonnes pratiques de sécurité (fiche du jour)

> **Définition rookie :** les **best practices de sécurité** sont les règles et habitudes qui réduisent la surface d'attaque et limitent les dégâts. Ce n'est pas une liste de produits à acheter — c'est une **discipline** : faire les bons choix par défaut, tout le temps, partout.

**Analogie :** la sécurité, c'est comme l'hygiène. On ne se lave pas les mains parce qu'on a vu un microbe — on le fait par habitude, tous les jours, sans exception. Les best practices, c'est l'hygiène numérique.

## 1. Les principes fondamentaux (à graver)

| Principe | En une phrase |
|----------|---------------|
| **Least privilege** | chaque compte/service n'a accès qu'au strict nécessaire |
| **Defense in depth** | plusieurs couches de défense (si l'une casse, les autres tiennent) |
| **Assume breach** | suppose que l'attaquant est déjà dedans (voir [[assumed-breach]]) |
| **Zero Trust** | ne fais confiance à personne, vérifie chaque accès (voir [[perimeter-vs-zerotrust]]) |
| **Secure by default** | la config par défaut doit être sécurisée, pas l'inverse |
| **Fail secure** | en cas d'erreur, refuser (pas autoriser) |
| **Need to know** | accès aux données uniquement si nécessaire au travail |
| **Separation of duties** | une personne seule ne peut pas tout faire (pas de super-admin tout-puissant) |

## 2. Identité & accès (le premier pilier)

- **MFA partout** : authentification multi-facteurs obligatoire pour tous les comptes (voir [[auth-vulns]]).
- **Mots de passe forts** : longueur > 12, pas de réutilisation, gestionnaire de mots de passe.
- **Least privilege** : rôles RBAC (voir [[zero-trust-access-rbac]]), pas de compte admin pour le quotidien.
- **Révocation rapide** : désactiver un compte en < 1 minute (départ, compromission).
- **Pas de comptes partagés** : chaque personne a son propre compte (traçabilité).
- **Rotation des secrets** : clés API, tokens, mots de passe changés régulièrement.
- **Pas de secrets dans le code** : `.env` ignoré par git, gestionnaire de secrets (Vault, etc.).

## 3. Réseau (le deuxième pilier)

- **Segmentation** : diviser le réseau en zones isolées (voir [[protect-surface-pam]]).
- **Firewall** : stateful minimum, NGFW si possible (voir [[firewall-generations]]).
- **Micro-segmentation** : chaque service dans sa propre zone (voir [[docker]] : containers isolés).
- **VPN/Zero Trust** : accès distant vérifié, pas de confiance aveugle (voir [[perimeter-vs-zerotrust]]).
- **DNS sécurisé** : DNSSEC, résolveurs fiables (voir [[dns]]).
- **Chiffrement en transit** : TLS partout (HTTPS, voir [[security-protocols]]).
- **Désactiver les ports inutiles** : réduire la surface d'attaque (voir [[mac-security]]).

## 4. Applications (le troisième pilier)

- **Validation des entrées** : ne jamais faire confiance à l'input utilisateur (SQLi, XSS, voir [[sheets]]).
- **Requêtes paramétrées** : pas de concaténation SQL (voir [[sheets]] §1).
- **Encodage des sorties** : échapper les données avant affichage (voir [[sheets]] §2).
- **Authentification côté serveur** : jamais côté client (voir [[auth-vulns]]).
- **Autorisation par objet** : vérifier le droit sur CHAQUE objet (anti-[[idor]]).
- **Mises à jour** : patcher les dépendances et le framework (CVE).
- **Headers de sécurité** : CSP, HSTS, X-Frame-Options, X-Content-Type-Options (voir [[sheets]] §12).
- **Pas de secrets dans le code** : `.env`, gestionnaire de secrets.

## 5. Données (le quatrième pilier)

- **Chiffrement au repos** : données sensibles chiffrées sur disque (AES-256).
- **Chiffrement en transit** : TLS partout (voir [[security-protocols]]).
- **Minimisation** : ne collecter que ce qui est nécessaire (RGPD).
- **Sauvegardes** : régulières, testées, hors site (3-2-1 : 3 copies, 2 supports, 1 hors site).
- **Classification** : marquer les données par sensibilité (public, interne, confidentiel, secret).
- **Rétention** : supprimer les données quand elles ne sont plus nécessaires.
- **Masquage** : masquer les données sensibles dans les logs et les environnements non-prod.

## 6. Monitoring & réponse (le cinquième pilier)

- **Logs centralisés** : tout est loggé, tout est traçable.
- **Heure synchronisée** : NTP sur tous les systèmes (voir [[ntp]] — des logs à la mauvaise heure = enquête impossible).
- **SIEM** : corrélation des événements, détection d'anomalies.
- **Alertes** : sur les événements critiques (échecs d'auth répétés, accès inhabituels).
- **Incident response plan** : procédure écrite pour réagir (voir [[troubleshooting]] : identifier → théorie → tester → résoudre → documenter).
- **Exercices** : tester le plan d'incident response régulièrement (tabletop exercises).
- **Honeypots** : des leurres pour détecter l'exploration.

## 7. Configuration & patching (le sixième pilier)

- **Durcir la configuration** : désactiver les services inutiles, changer les mots de passe par défaut, désactiver les ports inutilisés.
- **Patch management** : mettre à jour l'OS, les logiciels, les dépendances (CVE).
- **Baseline** : une configuration de référence sécurisée pour chaque type de serveur.
- **Infrastructure as Code** : la configuration est dans le code (versionné, auditable).
- **Audit régulier** : vérifier la configuration avec des outils (nmap, nikto, lynis).
- **Pas de secrets dans le code** : `.env` ignoré par git, gestionnaire de secrets.

## 8. Le cycle de vie (vue d'ensemble)

```
Conception → Développement → Déploiement → Exploitation → Décommission
    │              │              │              │              │
    ▼              ▼              ▼              ▼              ▼
  threat         secure code    hardening      monitoring      suppression
  modeling       review         patching       incident        des données
  architecture   SAST/DAST      config         response        et des accès
```

## 9. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « La sécurité, c'est l'IT » | Non : c'est tout le monde (développeurs, admins, utilisateurs) |
| « Un firewall suffit » | Non : le firewall est une couche, pas la sécurité complète |
| « On patchera plus tard » | Non : les CVE exploitées en production sont souvent connues depuis des mois |
| « Les backups, c'est pour les paranos » | Non : ransomware, erreur humaine, panne disque — les backups sauvent |
| « Les logs, c'est pour les audits » | Non : les logs sont pour la détection en temps réel |
| « La sécurité ralentit le développement » | Non : une vulnérabilité en prod coûte 100x plus cher qu'en dev |
| « On n'est pas une cible » | Non : tout le monde est une cible (automatisée, pas ciblée) |

## 10. En une ligne

> Les best practices de sécurité, c'est l'hygiène numérique : least privilege, defense in depth, assume breach, Zero Trust, patching, monitoring, et sauvegardes — appliqués tous les jours, sans exception, par tout le monde.

*Liens logiques : le Zero Trust qui guide tout → [[perimeter-vs-zerotrust]] · l'assumed breach → [[assumed-breach]] · le Protect Surface → [[protect-surface-pam]] · l'identité et l'accès → [[zero-trust-access-rbac]] et [[auth-vulns]] · le dépannage → [[troubleshooting]] · les failles à éviter → [[sheets]] · et la mise en place système → [[system-building]]*