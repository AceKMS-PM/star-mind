---
tags: [system, virtualisation, os, hyperviseur, vm]
---

# Guest OS vs Host OS — la base de la virtualisation (fiche du jour)

> **Définition rookie :** le **Host OS** est le système d'exploitation installé sur la **machine physique** (ta tour, ton serveur). Le **Guest OS** est un système d'exploitation qui tourne **à l'intérieur d'une machine virtuelle** (VM) sur cette même machine. Deux mondes sur une seule machine.

**Analogie :** le Host est l'**immeuble** (fondations, électricité, parties communes), le Guest est un **appartement loué** : le locataire croit avoir toute la maison à lui, mais l'immeuble décide des ressources, des portes, et de qui entre.

## 1. Le tiers qui gère tout : l'hyperviseur

Entre le Host et le Guest, il y a toujours un **hyperviseur** — le régisseur qui alloue CPU/RAM/disque/réseau aux VM et fait tourner leurs processus comme des « vrais » ordinateurs.

| Type | Nom | Exemples |
|------|-----|----------|
| **Type 1 (bare-metal)** | s'installe DIRECTEMENT sur la machine physique, PAS de Host OS en dessous | Proxmox, VMware ESXi, KVM, Hyper-V (mode bare) |
| **Type 2 (hosted)** | s'installe comme un programme DANS le Host OS | VirtualBox, VMware Workstation, UTM |

**Règle à retenir :** en Type 2 (le plus courant pour débuter), tu as `Host OS → hyperviseur → Guest OS`. Le Host reste le patron absolu : il voit tout, il peut tout tuer.

## 2. Comment ça marche (l'illusion du Guest)

Le Guest pense être seul sur la machine — il ne l'est pas :

- **CPU** : le Host partage les cœurs (1 VM = 2 cœurs virtuels ≠ 2 cœurs physiques réservés).
- **RAM** : allouée au Guest, mais récupérable (ballooning) si le Host manque de mémoire.
- **Disque** : le Guest voit un « disque » qui n'est souvent qu'un **fichier** sur le disque du Host (`macos.vdi`, `vm.vmdk`). Ce fichier = toute ta VM.
- **Réseau** : soit **NAT** (le Guest sort via l'IP du Host — invisible de l'extérieur), soit **bridge** (le Guest a sa propre IP sur le LAN — visible), soit **host-only** (isolé, Guest↔Host seulement).
- **Écran/souris/clavier** : via un logiciel de connexion (VirtualBox « affichage », RDP, SSH).

> Snapshot = photo instantanée du fichier disque. On peut revenir en arrière à tout moment — le meilleur ami du débutant ET du pentester.

## 3. Pourquoi on s'en sert

- **Tester sans casser** : installer un OS, le casser, restaurer le snapshot.
- **Isoler des services** : chaque service dans sa VM = une faille dans l'un n'expose pas les autres.
- **Labs de sécurité** : DVWA, WebGoat, machines vulnérables tournent en Guest, pas sur ta machine réelle (voir [[sheets]]).
- **OS multiples** : Windows + Linux sur la même machine, chacun dans sa bulle.

## 4. Sécurité : la frontière la plus importante

C'est LE concept à graver :

- **Isolation** : ce qui se passe dans le Guest (virus, attaque, ransomware) **ne doit pas** atteindre le Host.
- **Host compromis = tout compromis** : le Host peut lire les fichiers disque des VM, capturer leur mémoire, les arrêter. Si le Host tombe, tous les Guests tombent avec lui.
- **Guest compromis ≠ Host compromis** : c'est normal qu'une VM soit attaquée, c'est pour ça qu'elle existe. Par contre une **VM escape** (faille qui sort de la VM vers le Host) est la pire des failles de virtualisation.
- **Les ponts volontaires** : dossier partagé (shared folder), presse-papier partagé, réseau bridge = des **chemins** entre Guest et Host. En lab, on les ferme ou on les surveille.
- **Mises à jour** : un hyperviseur à jour est une frontière saine. Un Host à l'abandon = tous les Guests exposés.

## 5. Comment savoir si tu es dans une VM (Linux)

```bash
systemd-detect-virt          # qemu / kvm / virtualbox / vmware / lxc ...
hostnamectl                 # affiche aussi la virtualisation
dmidecode -s system-manufacturer    # ex: "VMware, Inc." au lieu d'un fabricant réel
cat /proc/cpuinfo | head    # les marqueurs "Hypervisor" en flags CPU
```

En pentest, détecter la virtualisation d'une cible fait partie de la reconnaissance (mêmes commandes).

## 6. Pièges rookie

| Piège | Réalité |
|-------|---------|
| « Le Guest est une machine isolée, personne ne voit dedans » | L'hyperviseur et le Host voient TOUT (mémoire, fichiers, réseau) |
| « 4 VM × 4 cœurs = 16 cœurs nécessaires » | Les cœurs virtuels se partagent ; la machine physique a ses limites |
| « J'ai supprimé la VM, le disque est libéré » | Les fichiers `.vdi`/`.vmdk` restent tant que tu ne les effaces pas |
| « C'est comme un dual-boot » | Non : le dual-boot n'exécute qu'UN OS à la fois ; la VM exécute le Guest PENDANT que le Host tourne |
| Dossier partagé activé « pour la commodité » | C'est une porte Guest→Host ouverte par défaut si tu oublies de la fermer |

## 7. En une ligne

> Le Host est le propriétaire, l'hyperviseur est le régisseur, le Guest est le locataire : il a sa maison, pas les clés de l'immeuble.

*Liens logiques : le réseau du Guest (NAT/bridge) se dépanne comme un vrai réseau → [[troubleshooting]] · les labos de pentest vivent dans des Guests → [[sheets]] · et la version plus légère de l'isolation → [[docker]]*