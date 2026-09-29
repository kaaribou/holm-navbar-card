# 🧭 HOLM Navbar Card

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/)
![Version](https://img.shields.io/github/v/release/kaaribou/holm-navbar-card)
![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2025.1%2B-03a9f4)

**Une barre de navigation en verre dépoli pour tout votre tableau de bord Home Assistant : animée, vivante, et réglée entièrement à la souris.**

HOLM Navbar Card pose en bas de l'écran (ou sur le côté, sur ordinateur) un **dock flottant façon « verre liquide »** qui relie toutes les vues de votre dashboard. Une bulle lumineuse glisse d'un onglet à l'autre, les icônes rebondissent au toucher, des **pastilles** comptent ce qui est allumé ou ouvert, un **appui long** ouvre un panneau de raccourcis… et si de la musique joue dans la maison, **une petite note de musique** vous le dit.

> ✨ **Zéro YAML.** On ajoute la carte depuis le sélecteur de cartes, on crée ses onglets dans l'éditeur visuel (icône, couleur, vue, sous-menus, pastilles…) et **la même barre apparaît sur toutes les vues**.

### En bref

- 🫧 **Dock en verre animé** : bulle active qui glisse, icônes colorées, rebond et vibration au toucher.
- 🗂️ **Une seule configuration pour tout le dashboard** : une carte « maître » contient les onglets, les autres vues posent juste la carte, sans rien régler.
- 🚀 **Pas de clignotement** : la barre reste posée sur la page quand on change de vue.
- 📂 **Sous-menus** à l'appui long : un panneau de tuiles pour aller vers d'autres vues ou **lancer une action** (script, scène, basculer une lumière…), avec **l'état en direct** de l'entité (Garage · Ouvert, Alarme · Armée…).
- 🔴 **Pastilles dynamiques** : nombre de lumières allumées, de volets ouverts, valeur d'un capteur…
- 🎵 **Musique** : une note animée sur l'onglet quand un lecteur joue, **les lecteurs en cours à l'appui long**, et un **mini lecteur** au-dessus de la barre *(nécessite [HOLM Music Card](https://github.com/kaaribou/holm-music-card), voir [Prérequis](#prérequis))*.
- 📱💻 **Mobile et ordinateur** : dockée ou flottante sur téléphone ; en bas, à gauche, à droite ou masquée sur grand écran.
- 👤 **Onglets par utilisateur** : un onglet peut n'être visible que pour certaines personnes.
- 🙈 **Masquage au défilement** (optionnel) pour laisser toute la place au contenu.

![Barre](docs/images/barre.png)

| Sous-menu (appui long) | Lecteurs en cours (appui long sur Accueil) |
|---|---|
| ![Sous-menu](docs/images/sous-menu.png) | ![Lecteurs en cours](docs/images/lecteurs-en-cours.png) |

---

## Sommaire

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Mise en place en 2 minutes](#mise-en-place-en-2-minutes)
- [Les onglets](#les-onglets)
- [Sous-menus](#sous-menus)
- [Pastilles](#pastilles)
- [Musique](#musique)
- [Options générales](#options-générales)
- [Exemple YAML complet](#exemple-yaml-complet)
- [FAQ / dépannage](#faq--dépannage)

---

## Prérequis

- **Home Assistant 2025.1** ou plus récent.
- **Pour les fonctions musique uniquement** (note de musique, lecteurs en cours, mini lecteur) :

> [!IMPORTANT]
> Les fonctions musique de la barre **utilisent le lecteur [HOLM Music Card](https://github.com/kaaribou/holm-music-card)** : c'est lui qui s'affiche dans le panneau « En cours de lecture » et dans le mini lecteur.
> **Il doit donc être installé**, ainsi que l'intégration **[Music Assistant](https://music-assistant.io/)** dans Home Assistant.
> HACS ne peut pas installer une carte « dépendante » automatiquement : installez les deux cartes, puis rechargez la page.
>
> Sans HOLM Music Card, la barre fonctionne normalement ; seules les fonctions musique restent inactives (l'éditeur vous le signale).

---

## Installation

### Avec HACS (recommandé)

1. HACS → menu ⋮ → **Dépôts personnalisés**.
2. Ajoutez `https://github.com/kaaribou/holm-navbar-card`, catégorie **Tableau de bord** (*Dashboard / Plugin*).
3. Recherchez **HOLM Navbar Card** → **Télécharger**.
4. *(Pour la musique)* faites de même avec `https://github.com/kaaribou/holm-music-card`.
5. Rechargez la page (Ctrl + F5).

HACS ajoute la ressource automatiquement et vous prévient des nouvelles versions.

### Manuellement

1. Copiez `dist/holm-navbar-card.js` dans `config/www/community/holm-navbar-card/`.
2. **Paramètres → Tableaux de bord → ⋮ → Ressources → Ajouter** : `/local/community/holm-navbar-card/holm-navbar-card.js`, type **Module JavaScript**.
3. Rechargez la page.

---

## Mise en place en 2 minutes

1. Ouvrez la vue principale de votre dashboard (par exemple *Accueil*) → **Modifier** → **Ajouter une carte** → **HOLM Navbar**.
2. Créez vos onglets dans l'éditeur (libellé, icône, couleur, vue à ouvrir). Cette carte devient la **carte maître**.
3. Dans **chacune des autres vues**, ajoutez aussi la carte **HOLM Navbar**, **sans rien régler** : elle retrouve toute seule la configuration de la carte maître.

```yaml
# dans les autres vues, c'est tout :
type: custom:holm-navbar-card
```

En mode édition, la carte s'affiche comme un petit aperçu (« carte maître » ou « config commune ») ; en utilisation normale elle est invisible et **la barre apparaît en bas de l'écran**. Toute modification de la carte maître est appliquée partout, instantanément.

> 💡 Une vue « secondaire » peut tout de même changer localement `labels`, `desktop_position`, `mobile_style` ou `auto_hide`.

---

## Les onglets

| Réglage | Description |
|---|---|
| **Libellé** | Texte sous l'icône (affiché selon l'option *Libellés*). |
| **Icône** / **Image** | Une icône `mdi:` ou une image (`/local/…png`) qui la remplace. |
| **Couleur** | `#hex`, `rgb(…)` ou un nom de couleur de thème (`red`, `amber`…). Colore l'icône et la bulle. |
| **Vue à ouvrir** | Le chemin de la vue (`/lovelace/lumieres`). L'onglet s'allume quand on est sur cette vue **ou** sur une vue de son sous-menu. |
| **Au toucher** | Aller à une vue (par défaut), basculer l'entité, ouvrir sa fiche, lancer une action… |
| **Pastille** | Entités à compter (voir [Pastilles](#pastilles)). |
| **Note de musique…** | Active l'indicateur musique et la liste des lecteurs à l'appui long (voir [Musique](#musique)). |
| **Visible seulement pour** | Noms d'utilisateurs Home Assistant. Vide = tout le monde. |

Un onglet **avec une vue** y mène au toucher et ouvre son sous-menu à l'appui long. Un onglet **sans vue** ouvre directement son sous-menu.

---

## Sous-menus

Chaque onglet peut contenir des **tuiles** affichées dans un panneau en verre à l'appui long :

- une tuile avec une **vue** y emmène ;
- une tuile avec une **action** (`perform-action` : `script.bonne_nuit`, `light.turn_off`…) l'exécute sans fermer le panneau ;
- une tuile liée à une **entité** affiche **son état en direct** et s'illumine quand elle est active ; un appui long ouvre sa fiche.

![Sous-menu Énergie](docs/images/sous-menu-energie.png)

---

## Pastilles

- **Compter des entités** : choisissez plusieurs entités ; la pastille affiche combien sont *actives* (allumées, ouvertes, en lecture, déverrouillées, alarme armée…).
- **Une valeur** (YAML) : `badge: { entity: sensor.xxx }` affiche la valeur si elle est positive, ou un point pulsant si l'entité est active.
- **Couleur** (YAML) : `badge: { color: amber }`.

---

## Musique

> [!IMPORTANT]
> Nécessite **[HOLM Music Card](https://github.com/kaaribou/holm-music-card)** + l'intégration **Music Assistant**.

### 🎵 La note de musique sur un onglet

Activez **« Note de musique si lecture en cours + lecteurs à l'appui long »** sur l'onglet de votre choix (par exemple *Accueil*) :

- dès qu'**un lecteur Music Assistant joue**, une **note de musique animée** apparaît sur l'onglet ;
- s'il y en a plusieurs, elle affiche leur **nombre** (♪ 2) ;
- des enceintes **regroupées** (multiroom) ne comptent que pour un lecteur.

### 🎧 Les lecteurs en cours à l'appui long

Un **appui long** sur cet onglet ouvre le panneau **« En cours de lecture »** : un **mini lecteur** par enceinte qui joue (ou en pause), avec pochette, progression et lecture/pause. **Un toucher sur un mini lecteur ouvre le lecteur complet** (file d'attente, bibliothèque, enceintes…). Si l'onglet a aussi des tuiles de sous-menu, elles s'affichent en dessous.

![Lecteurs en cours](docs/images/lecteurs-en-cours.png)

### 📻 Le mini lecteur au-dessus de la barre

Dans la section **Mini lecteur de musique** de la carte maître :

| Réglage | Description |
|---|---|
| **Mini lecteur Music Assistant** | Le lecteur affiché en permanence au-dessus de la barre. |
| **Afficher le mini lecteur** | *Seulement pendant la lecture* (par défaut) ou *Toujours*. |
| **Style de pochette** | Pochette carrée ou vinyle qui tourne. |
| **Lecteurs surveillés** | Les lecteurs pris en compte par la note de musique et le panneau. Vide = **tous** les lecteurs Music Assistant. |

---

## Options générales

| Option | Valeurs | Par défaut |
|---|---|---|
| `labels` | `active` (onglet actif), `all`, `none` | `active` |
| `mobile_style` | `docked` (collée en bas), `floating` | `docked` |
| `desktop_position` | `bottom`, `left`, `right`, `hidden` | `bottom` |
| `auto_hide` | masquer la barre en faisant défiler | `false` |
| `haptic` | vibration au toucher (application mobile) | `true` |
| `accent` | couleur principale | `#26c6da` |
| `music_entity` | lecteur du mini lecteur | — |
| `music_show` | `active`, `always` | `active` |
| `music_artwork` | `square`, `vinyl` | `square` |
| `music_players` | liste de lecteurs surveillés | tous |

---

## Exemple YAML complet

```yaml
type: custom:holm-navbar-card
labels: active
mobile_style: docked
desktop_position: bottom
music_entity: media_player.salon
music_show: active
routes:
  - label: Accueil
    icon: mdi:home
    url: /lovelace/accueil
    color: "#26c6da"
    music: true
  - label: Lumières
    icon: mdi:lightbulb-group
    url: /lovelace/lumieres
    color: "#ffca28"
    badge:
      entities: [light.salon, light.cuisine, light.bureau]
  - label: Divers
    icon: mdi:dots-horizontal
    color: "#ab47bc"
    popup:
      - label: Garage
        icon: mdi:garage
        entity: cover.garage
        tap_action: { action: toggle }
      - label: Bonne nuit
        icon: mdi:weather-night
        tap_action:
          action: perform-action
          perform_action: script.bonne_nuit
      - label: Météo
        icon: mdi:weather-partly-cloudy
        url: /lovelace/meteo
  - label: Admin
    icon: mdi:tools
    url: /lovelace/maintenance
    users: [olivier]
```

---

## FAQ / dépannage

| Problème | Solution |
|---|---|
| La barre n'apparaît pas sur une vue | Ajoutez la carte `custom:holm-navbar-card` dans cette vue (sans réglage). La carte maître doit être dans **le même dashboard**. |
| La barre cache le bas de la page | La carte ajoute automatiquement une marge en bas de la vue ; rechargez la page si besoin. |
| Pas de note de musique / panneau vide avec un message | Installez **HOLM Music Card** et **Music Assistant**, puis rechargez la page (Ctrl + F5). |
| Un lecteur n'est pas pris en compte | Seuls les lecteurs de l'intégration **Music Assistant** sont surveillés ; vérifiez la liste *Lecteurs surveillés*. |
| La nouvelle version ne s'affiche pas | Videz le cache (Ctrl + F5, ou « Recharger les ressources » dans l'application mobile). |

---

## Un petit merci ?

La barre vous plaît ? Vous pouvez m'offrir une bière 🍺

[![Offrez-moi une bière](https://img.shields.io/badge/Offrez--moi_une_bi%C3%A8re-PayPal-0070ba?logo=paypal&logoColor=white)](https://paypal.me/kaaribou)

---

## Licence

Code sous licence **MIT** — © kaaribou. Voir le [CHANGELOG](CHANGELOG.md).

Fait partie de la collection **HOLM** : [HOLM Music Card](https://github.com/kaaribou/holm-music-card) · [Carburant HOLM](https://github.com/kaaribou/carburant-holm).
