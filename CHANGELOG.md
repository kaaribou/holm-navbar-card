# Changelog

## 1.6.1
- **Éditeur beaucoup plus rapide** : le contenu des onglets, tuiles et cartes n'est construit qu'à leur ouverture ; une modification ne reconstruit plus que l'élément concerné ; les allers-retours de configuration avec Home Assistant ne reconstruisent plus l'éditeur.
- **Sélecteur de cartes rapide** : liste filtrable des cartes Home Assistant et personnalisées, ouverte instantanément ; le sélecteur complet (avec aperçus) reste disponible.
- Le sélecteur et l'éditeur de cartes de Home Assistant sont préchargés à l'ouverture de l'éditeur.

## 1.6.0
- **Libellés sur plusieurs lignes** (#2) : les noms des tuiles ne sont plus coupés ; option *Lignes des libellés* (1, 2, 3 ou illimité). Dans la barre, les libellés de plusieurs mots passent aussi à la ligne.
- **Sous-menus imbriqués** (#4) : une tuile peut avoir son propre sous-menu (appui long, ou toucher si elle n'a ni vue ni action), jusqu'à 3 niveaux ; bouton retour, fil d'Ariane, touche Échap.
- **Cartes Lovelace dans le panneau** (#3) : sur un onglet ou une tuile, au-dessus ou sous les tuiles ; ajout avec le sélecteur de cartes de Home Assistant et réglage avec son éditeur (visuel ou code).
- **Traductions** (#6) : carte et éditeur en français, anglais, allemand, espagnol, italien, néerlandais, portugais et polonais ; option *Langue*. États des tuiles traduits par Home Assistant.
- **Dimensionnement des cartes** : largeur du panneau, 1 à 3 colonnes de cartes, largeur de chaque carte.
- Les actions des cartes du panneau (navigation, fenêtre d'informations…) fonctionnent.
- L'éditeur garde sa position de défilement après une modification.

## 1.5.0
- **Indicateur musique** : note de musique animée sur un onglet quand un lecteur Music Assistant joue (avec le nombre de lecteurs).
- **Lecteurs en cours à l'appui long** : panneau « En cours de lecture » avec un mini lecteur par enceinte (nécessite HOLM Music Card).
- Option **Lecteurs surveillés**.
- Avertissement dans l'éditeur si HOLM Music Card n'est pas installée.
- Première publication sur GitHub, compatible HACS.

## 1.4.0
- Mini lecteur Music Assistant au-dessus de la barre (affiché pendant la lecture ou en permanence).

## 1.0.0 – 1.3.0 (versions privées)
- Dock en verre animé, configuration commune à toutes les vues, sous-menus avec tuiles d'action, pastilles, onglets par utilisateur, images à la place des icônes, éditeur visuel.
