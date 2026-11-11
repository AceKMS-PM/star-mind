---
tags: [system, docker, containers, devops, image, compose]
---

# Docker — images, containers, Dockerfile, compose (fiche du jour)

> **Définition rookie :** Docker exécute des applications dans des **containers** : des environnements isolés et légers, construits à partir d'**images** (des « photos » prêtes à l'emploi). Même app, mêmes dépendances, sur n'importe quelle machine.

**Analogie :** une **image** = le moule / la disquette source (immuable) ; un **container** = la machine qui tourne à partir du moule (l'instance vivante). Un moule peut produire 100 machines identiques, chacune dans sa bulle.

## 1. Image vs Container — LA distinction

| | Image | Container |
|-|-------|-----------|
| Nature | modèle **immuable** (lecture seule) | une **instance qui tourne** (lecture/écriture) |
| Durée | permanente (tant qu'on ne la supprime pas) | éphémère (stop, supprime, on relance) |
| Partage | une image → plein de containers | chaque container a sa petite couche d'écriture |

```bash
docker build -t mon-app:1.0 .   # crée une IMAGE
docker run mon-app:1.0          # lance un CONTAINER depuis l'image
```

## 2. Le Dockerfile — la recette de l'image

Le Dockerfile est une suite d'instructions **ligne par ligne**, chaque `RUN`/`COPY` ajoute une **couche** (et une mise en cache).

```dockerfile
FROM node:20              # l'image de BASE (à partir de quoi)
WORKDIR /app              # le dossier de travail (se place ici avant chaque RUN)
COPY package.json .       # copie des fichiers HÔTE → image
RUN npm install           # exécute des commandes au BUILD (installer, compiler)
COPY . .                  # copie le reste du code
CMD ["node", "server.js"] # la commande lancée au DÉMARRAGE du container
```

| Instruction | Rôle |
|-------------|------|
| `FROM` | l'image de base (obligatoire, la 1re) |
| `WORKDIR` | change le dossier de travail courant |
| `COPY` | copie fichiers hôte → image (avant le RUN) |
| `RUN` | exécute au **build** (crée une couche) |
| `CMD` | la commande **par défaut** au lancement (remplaçable par `docker run ... cmd`) |
| `EXPOSE` | annonce le port (documentation, pas un ouvrage) |
| `ENV` | définit une variable d'environnement |
| `ENTRYPOINT` | la commande **fixe** (contrairement à CMD) |

**L'ordre compte** : Docker met en cache par couche. On met ce qui change **rarement** (dépendances) AVANT ce qui change souvent (le code) → rebuilds rapides.

## 3. build + run avec les flags

```bash
# build : crée l'image à partir du Dockerfile
docker build -t mon-app:1.0 .

# run : lance un container avec des options
docker run -d --name web \
  -p 8080:80 \          # MAP de port : hôte(8080) → container(80)
  -v ./data:/data \     # VOLUME : dossier hôte → dossier container (persistant)
  mon-app:1.0
```

| Flag | Rôle |
|------|------|
| `-d` | détaché (tourne en arrière-plan) |
| `--name` | donne un nom au container |
| `-p hôte:container` | expose un port du container sur l'hôte (sinon il est isolé) |
| `-v hôte:container` | monte un volume → les données **survivent** à la suppression du container |
| `-it` | mode interactif avec terminal |

**Le fil** : `Dockerfile → docker build → image → docker run → container`.

## 4. Les commandes du jour

```bash
docker ps                  # containers EN COURS
docker ps -a               # tous (même arrêtés)
docker images              # les images locales
docker run image           # crée ET lance un container
docker start / stop nom    # allume / éteint un container existant
docker rm nom              # supprime un CONTAINER
docker rmi image           # supprime une IMAGE
docker logs nom            # les logs du container
docker exec -it nom bash   # entre dans le container (pour dépanner)
docker system prune        # nettoie ce qui ne sert plus (attention !)
```

> Ne pas confondre : `docker rm` (container) vs `docker rmi` (image). Le `m` = **m**achin à supprimer : `rm` = container, `rmi` = **i**mage.

## 5. docker-compose — structurer tout le stack

Au lieu de 5 `docker run` à la main, **un seul fichier** décrit tous les services.

```yaml
services:
  web:                       # un container nommé "web"
    build:                   # le construire depuis le Dockerfile
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"            # mapping hôte:container
    volumes:
      - ./data:/data         # volume persistant
    environment:             # variables d'environnement (ou env_file:)
      - DATABASE_URL=postgres://db/app
    depends_on:              # le réseau/ordre : db démarre avant web
      - db
    restart: unless-stopped  # redémarre si ça plante

  db:
    image: postgres:16       # pas de build : on PULL une image existante
    ports:
      - "5432:5432"
    volumes:
      - dbdata:/var/lib/postgresql/data

volumes:
  dbdata:
```

```bash
docker compose up -d     # démarre tout le stack (en arrière-plan)
docker compose down      # arrête et retire (données gardées dans les volumes)
docker compose ps        # état des services
docker compose logs web  # logs d'un service
```

| Clé | Rôle |
|-----|------|
| `services` | la liste des containers |
| `build.context` / `build.dockerfile` | où chercher le Dockerfile pour construire |
| `image` | une image à pull (pas de build) |
| `ports` / `volumes` | même rôle que `-p` / `-v` |
| `environment` / `env_file` | les variables d'environnement |
| `depends_on` | l'ordre de démarrage (pas une garantie d'état prêt) |
| `restart` | la politique de redémarrage |

## 6. Container vs VM (le pont avec [[guest-host]])

| | VM ([[guest-host]]) | Container (Docker) |
|-|---------------------|---------------------|
| Isolation | un OS complet **par** VM (via hyperviseur) | partage le **noyau** de l'hôte, isolé par processus (namespaces/cgroups) |
| Poids | lourd (Go par VM) | léger (Mo) |
| Démarrage | minutes | secondes |
| Frontière | très forte (l'OS est un mur) | plus fine (même noyau → surface d'attaque plus grande) |

En une phrase : une VM est une maison séparée avec son propre sol ; un container est une pièce du même immeuble, délimitée par des cloisons. Les deux sont isolés — mais pas au même niveau.

## 7. Pièges rookie

| Piège | Réalité |
|-------|---------|
| Confondre `rm` et `rmi` | `rm` = container, `rmi` = image (le `i` pour **i**mage) |
| `docker ps` vide alors qu'on a lancé un truc | S'il est arrêté, il faut `docker ps -a` |
| Un `RUN` oublié de copier les sources | L'ordre du Dockerfile : dépendances avant code, sinon cache inutile |
| Le container supprimé = données perdues | Sauf dans un **volume** (`-v`) : c'est pour ça qu'on monte les volumes |
| « Port exposé = accessible » | Un port n'est accessible que si on le **publie** (`-p`) ; `EXPOSE` seul ne suffit pas |
| `depends_on` = « service prêt » | Il garantit l'**ordre** de démarrage, pas que la base est opérationnelle |
| Modifier un fichier dans le container | Ça meurt au `rm` : pour du durable, dossier/volume monté ou rebuild |

## 8. En une ligne

> Docker = une **image** (le moule), des **containers** (les machines allumées), un **Dockerfile** (la recette), et **compose** (le plan du chantier entier) — le tout isolé, léger et reproductible.

*Liens logiques : la frontière container vs VM → [[guest-host]] · un container qui ne répond pas se dépanne avec la méthode → [[troubleshooting]] · et le déploiement par containers est une couche de la mise en place système → [[system-building]]*