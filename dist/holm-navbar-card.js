/* HOLM Navbar Card
 * Barre de navigation flottante « verre liquide » pour tout le dashboard.
 * - Dock en verre dépoli, bulle active qui glisse d'un onglet à l'autre,
 *   icônes colorées, petit rebond au toucher, retour haptique.
 * - Sous-menus en panneau de tuiles ; tuiles « action » liées à une entité
 *   (état en direct : Garage · Ouvert, Alarme · Armée…).
 * - Sous-menus imbriqués (appui long sur une tuile) et cartes Lovelace dans le panneau.
 * - Pastilles dynamiques (nombre d'entités allumées/ouvertes, valeur).
 * - Config commune : une seule carte « maître » (avec routes) ; les autres
 *   vues posent simplement `type: custom:holm-navbar-card` et la réutilisent.
 * - Barre unique posée sur la page : pas de clignotement en changeant de vue.
 * - Interface en 8 langues (fr, en, de, es, it, nl, pt, pl).
 */
(() => {
  const VERSION = "1.6.1";
  const ACTIVE_STATES = ["on", "open", "opening", "unlocked", "playing", "home", "heat", "cool", "heat_cool", "armed_away", "armed_home", "armed_night", "triggered", "detected", "cleaning"];
  const DEFAULTS = { labels: "active", desktop_position: "bottom", mobile_style: "docked", auto_hide: false, haptic: true, accent: "#26c6da", label_lines: 2 };
  const MAX_DEPTH = 3; // panneaux imbriqués : onglet → sous-menu → sous-sous-menu
  const store = (window.__holmNavbar = window.__holmNavbar || { cfg: {}, bar: null, owner: null });

  // ------------------------------------------------------------------
  //  Traductions (fr, en, de, es, it, nl, pt, pl)
  // ------------------------------------------------------------------
  const I18N = {
    fr: {
      f_panel_width: "Largeur du panneau", f_cards_columns: "Cartes par ligne", f_span: "Largeur de la carte", o_pw_auto: "Automatique", o_pw_narrow: "Étroit", o_pw_normal: "Normal", o_pw_large: "Large", o_pw_xlarge: "Très large", o_pw_full: "Toute la largeur de l'écran", o_cols: (n) => `${n} par ligne`, o_span: (n) => `${n} colonne${n > 1 ? "s" : ""}`, o_span_full: "Toute la ligne", size_hint: "Taille : largeur du panneau, nombre de cartes par ligne, et largeur de chaque carte.",
      playing: "En cours de lecture", no_playing: "Aucune lecture en cours",
      need_music: "Le lecteur <b>HOLM Music Card</b> est nécessaire pour afficher les lecteurs ici. Installe-le depuis HACS (kaaribou/holm-music-card).",
      start_music: "Lance une musique depuis Music Assistant, elle apparaîtra ici.",
      back: "Retour", preview_title: "Barre de navigation HOLM", master: "carte maître", common: "config commune", no_tabs: "aucun onglet",
      edit_master: "Clique sur cette carte (crayon) pour modifier les onglets de toutes les vues.",
      edit_common: "Cette vue réutilise la barre définie sur la carte maître (celle qui contient les onglets).",
      preview_note: "La barre s'affiche en bas de l'écran.",
      card_desc: "Barre de navigation flottante en verre, animée, commune à toutes les vues.", home: "Accueil", lights: "Lumières",
      f_music_entity: "Mini lecteur Music Assistant (au-dessus de la barre)", f_music_show: "Afficher le mini lecteur", f_music_artwork: "Style de pochette dans le lecteur",
      f_labels: "Libellés", f_desktop_position: "Position sur ordinateur", f_mobile_style: "Sur mobile", f_auto_hide: "Masquer en défilant", f_haptic: "Vibration", f_accent: "Couleur principale",
      f_label: "Libellé", f_icon: "Icône", f_url: "Vue à ouvrir", f_color: "Couleur (#hex ou nom)", f_image: "Image (remplace l'icône)", f_entity: "Entité (état affiché sur la tuile)",
      f_action: "Au toucher", f_perform_action: "Action (ex. script.bonne_nuit)", f_badge_entities: "Pastille : compter les entités actives", f_users: "Visible seulement pour (nom d'utilisateur)",
      f_music: "Note de musique si lecture en cours + lecteurs à l'appui long", f_music_players: "Lecteurs surveillés (vide = tous ceux de Music Assistant)",
      f_label_lines: "Lignes des libellés", f_language: "Langue", f_cards_position: "Position des cartes",
      o_active: "Onglet actif", o_all: "Tous", o_none: "Aucun", o_docked: "Dockée en bas", o_floating: "Flottante", o_bottom: "En bas", o_left: "À gauche", o_right: "À droite", o_hidden: "Masquée",
      o_only_playing: "Seulement pendant la lecture", o_always: "Toujours", o_cover: "Pochette", o_vinyl: "Vinyle",
      o_lines1: "1 ligne", o_lines2: "2 lignes", o_lines3: "3 lignes", o_lines0: "Illimité", o_auto: "Automatique (langue de Home Assistant)", o_top: "Au-dessus des tuiles", o_below: "Sous les tuiles",
      a_navigate: "Aller à une vue", a_toggle: "Basculer l'entité", a_more_info: "Fiche de l'entité", a_perform: "Lancer une action",
      sec_music: "Mini lecteur de musique", sec_tabs: "Onglets de la barre",
      warn_music: "⚠️ Les fonctions musique (mini lecteur, note de musique, lecteurs à l'appui long) nécessitent la carte <b>HOLM Music Card</b> et l'intégration <b>Music Assistant</b>. Installe <a href='https://github.com/kaaribou/holm-music-card' target='_blank' rel='noopener'>holm-music-card</a> depuis HACS puis recharge la page.",
      note_common: "Cette carte réutilise la <b>barre commune</b> définie sur la carte maître (celle qui contient les onglets). Pour modifier les onglets, édite la carte maître.",
      tip_tabs: "Un onglet avec une <b>vue</b> y mène au toucher ; son <b>sous-menu</b> s'ouvre à l'appui long. Un onglet <b>sans vue</b> ouvre directement son sous-menu. Les tuiles d'un sous-menu peuvent elles aussi avoir un sous-menu et des cartes.",
      up: "Monter", down: "Descendre", del: "Supprimer", add_sub: "Ajouter au sous-menu", add_tab: "Ajouter un onglet",
      sub_title: "Sous-menu", sub_hold_tab: "S'ouvre à l'appui long sur l'onglet.", sub_tap_tab: "S'ouvre au toucher (onglet sans vue).",
      sub_hold_tile: "S'ouvre à l'appui long sur la tuile.", sub_tap_tile: "S'ouvre au toucher (tuile sans vue ni action).",
      tab_n: (n) => `Onglet ${n}`, item_n: (n) => `Élément ${n}`, n_sub: (n) => `${n} sous-menu${n > 1 ? "s" : ""}`, n_cards: (n) => `${n} carte${n > 1 ? "s" : ""}`,
      exp_tile: "Action / entité (tuile dynamique)", exp_tab: "Pastille, image, visibilité",
      cards_title: "Cartes", cards_hint: "Cartes Lovelace affichées dans le panneau (thermostat, caméra, graphique…).",
      add_card: "Ajouter une carte", pick_card: "Choisis le type de carte :", cancel: "Annuler", code_editor: "Éditeur de code", visual_editor: "Éditeur visuel",
      pk_search: "Rechercher une carte…", pk_ha: "Cartes Home Assistant", pk_custom: "Cartes personnalisées", pk_previews: "Afficher les aperçus (plus lent)", pk_none: "Aucune carte trouvée",
      loading: "Chargement de l'éditeur de cartes…",
    },
    en: {
      f_panel_width: "Panel width", f_cards_columns: "Cards per row", f_span: "Card width", o_pw_auto: "Automatic", o_pw_narrow: "Narrow", o_pw_normal: "Normal", o_pw_large: "Wide", o_pw_xlarge: "Extra wide", o_pw_full: "Full screen width", o_cols: (n) => `${n} per row`, o_span: (n) => `${n} column${n > 1 ? "s" : ""}`, o_span_full: "Whole row", size_hint: "Size: panel width, number of cards per row and width of each card.",
      playing: "Now playing", no_playing: "Nothing playing",
      need_music: "The <b>HOLM Music Card</b> player is needed to show players here. Install it from HACS (kaaribou/holm-music-card).",
      start_music: "Start some music from Music Assistant and it will appear here.",
      back: "Back", preview_title: "HOLM navigation bar", master: "main card", common: "shared config", no_tabs: "no tabs",
      edit_master: "Click this card (pencil) to edit the tabs of every view.",
      edit_common: "This view reuses the bar defined on the main card (the one holding the tabs).",
      preview_note: "The bar is shown at the bottom of the screen.",
      card_desc: "Floating, animated glass navigation bar shared by every view.", home: "Home", lights: "Lights",
      f_music_entity: "Music Assistant mini player (above the bar)", f_music_show: "Show the mini player", f_music_artwork: "Artwork style in the player",
      f_labels: "Labels", f_desktop_position: "Position on desktop", f_mobile_style: "On mobile", f_auto_hide: "Hide on scroll", f_haptic: "Vibration", f_accent: "Main colour",
      f_label: "Label", f_icon: "Icon", f_url: "View to open", f_color: "Colour (#hex or name)", f_image: "Image (replaces the icon)", f_entity: "Entity (state shown on the tile)",
      f_action: "On tap", f_perform_action: "Action (e.g. script.good_night)", f_badge_entities: "Badge: count active entities", f_users: "Only visible to (user name)",
      f_music: "Music note while playing + players on long press", f_music_players: "Watched players (empty = all Music Assistant players)",
      f_label_lines: "Label lines", f_language: "Language", f_cards_position: "Cards position",
      o_active: "Active tab", o_all: "All", o_none: "None", o_docked: "Docked at the bottom", o_floating: "Floating", o_bottom: "Bottom", o_left: "Left", o_right: "Right", o_hidden: "Hidden",
      o_only_playing: "Only while playing", o_always: "Always", o_cover: "Cover", o_vinyl: "Vinyl",
      o_lines1: "1 line", o_lines2: "2 lines", o_lines3: "3 lines", o_lines0: "Unlimited", o_auto: "Automatic (Home Assistant language)", o_top: "Above the tiles", o_below: "Below the tiles",
      a_navigate: "Go to a view", a_toggle: "Toggle the entity", a_more_info: "Entity details", a_perform: "Run an action",
      sec_music: "Music mini player", sec_tabs: "Bar tabs",
      warn_music: "⚠️ Music features (mini player, music note, players on long press) need the <b>HOLM Music Card</b> and the <b>Music Assistant</b> integration. Install <a href='https://github.com/kaaribou/holm-music-card' target='_blank' rel='noopener'>holm-music-card</a> from HACS, then reload the page.",
      note_common: "This card reuses the <b>shared bar</b> defined on the main card (the one holding the tabs). To change the tabs, edit the main card.",
      tip_tabs: "A tab with a <b>view</b> opens it on tap; its <b>submenu</b> opens on long press. A tab <b>without a view</b> opens its submenu directly. Submenu tiles can have their own submenu and cards too.",
      up: "Move up", down: "Move down", del: "Delete", add_sub: "Add to submenu", add_tab: "Add a tab",
      sub_title: "Submenu", sub_hold_tab: "Opens on long press on the tab.", sub_tap_tab: "Opens on tap (tab without a view).",
      sub_hold_tile: "Opens on long press on the tile.", sub_tap_tile: "Opens on tap (tile without a view or action).",
      tab_n: (n) => `Tab ${n}`, item_n: (n) => `Item ${n}`, n_sub: (n) => `${n} submenu item${n > 1 ? "s" : ""}`, n_cards: (n) => `${n} card${n > 1 ? "s" : ""}`,
      exp_tile: "Action / entity (live tile)", exp_tab: "Badge, image, visibility",
      cards_title: "Cards", cards_hint: "Lovelace cards shown in the panel (thermostat, camera, graph…).",
      add_card: "Add a card", pick_card: "Pick a card type:", cancel: "Cancel", code_editor: "Code editor", visual_editor: "Visual editor",
      pk_search: "Search a card…", pk_ha: "Home Assistant cards", pk_custom: "Custom cards", pk_previews: "Show previews (slower)", pk_none: "No card found",
      loading: "Loading the card editor…",
    },
    de: {
      f_panel_width: "Panelbreite", f_cards_columns: "Karten pro Zeile", f_span: "Kartenbreite", o_pw_auto: "Automatisch", o_pw_narrow: "Schmal", o_pw_normal: "Normal", o_pw_large: "Breit", o_pw_xlarge: "Sehr breit", o_pw_full: "Volle Bildschirmbreite", o_cols: (n) => `${n} pro Zeile`, o_span: (n) => `${n} Spalte${n > 1 ? "n" : ""}`, o_span_full: "Ganze Zeile", size_hint: "Größe: Panelbreite, Anzahl der Karten pro Zeile und Breite jeder Karte.",
      playing: "Läuft gerade", no_playing: "Keine Wiedergabe",
      need_music: "Die Karte <b>HOLM Music Card</b> wird benötigt, um die Player hier anzuzeigen. Installiere sie über HACS (kaaribou/holm-music-card).",
      start_music: "Starte Musik in Music Assistant, sie erscheint dann hier.",
      back: "Zurück", preview_title: "HOLM-Navigationsleiste", master: "Hauptkarte", common: "gemeinsame Konfiguration", no_tabs: "keine Tabs",
      edit_master: "Klicke auf diese Karte (Stift), um die Tabs aller Ansichten zu bearbeiten.",
      edit_common: "Diese Ansicht verwendet die Leiste der Hauptkarte (die mit den Tabs).",
      preview_note: "Die Leiste wird unten am Bildschirm angezeigt.",
      card_desc: "Schwebende, animierte Glas-Navigationsleiste für alle Ansichten.", home: "Start", lights: "Licht",
      f_music_entity: "Music-Assistant-Miniplayer (über der Leiste)", f_music_show: "Miniplayer anzeigen", f_music_artwork: "Cover-Stil im Player",
      f_labels: "Beschriftungen", f_desktop_position: "Position am Computer", f_mobile_style: "Auf dem Handy", f_auto_hide: "Beim Scrollen ausblenden", f_haptic: "Vibration", f_accent: "Hauptfarbe",
      f_label: "Beschriftung", f_icon: "Symbol", f_url: "Zu öffnende Ansicht", f_color: "Farbe (#hex oder Name)", f_image: "Bild (ersetzt das Symbol)", f_entity: "Entität (Zustand auf der Kachel)",
      f_action: "Beim Tippen", f_perform_action: "Aktion (z. B. script.gute_nacht)", f_badge_entities: "Plakette: aktive Entitäten zählen", f_users: "Nur sichtbar für (Benutzername)",
      f_music: "Musiknote bei Wiedergabe + Player bei langem Drücken", f_music_players: "Überwachte Player (leer = alle von Music Assistant)",
      f_label_lines: "Zeilen der Beschriftung", f_language: "Sprache", f_cards_position: "Position der Karten",
      o_active: "Aktiver Tab", o_all: "Alle", o_none: "Keine", o_docked: "Unten angedockt", o_floating: "Schwebend", o_bottom: "Unten", o_left: "Links", o_right: "Rechts", o_hidden: "Ausgeblendet",
      o_only_playing: "Nur während der Wiedergabe", o_always: "Immer", o_cover: "Cover", o_vinyl: "Vinyl",
      o_lines1: "1 Zeile", o_lines2: "2 Zeilen", o_lines3: "3 Zeilen", o_lines0: "Unbegrenzt", o_auto: "Automatisch (Sprache von Home Assistant)", o_top: "Über den Kacheln", o_below: "Unter den Kacheln",
      a_navigate: "Ansicht öffnen", a_toggle: "Entität umschalten", a_more_info: "Entitätsdetails", a_perform: "Aktion ausführen",
      sec_music: "Musik-Miniplayer", sec_tabs: "Tabs der Leiste",
      warn_music: "⚠️ Die Musikfunktionen (Miniplayer, Musiknote, Player bei langem Drücken) benötigen die <b>HOLM Music Card</b> und die Integration <b>Music Assistant</b>. Installiere <a href='https://github.com/kaaribou/holm-music-card' target='_blank' rel='noopener'>holm-music-card</a> über HACS und lade die Seite neu.",
      note_common: "Diese Karte verwendet die <b>gemeinsame Leiste</b> der Hauptkarte (die mit den Tabs). Um die Tabs zu ändern, bearbeite die Hauptkarte.",
      tip_tabs: "Ein Tab mit einer <b>Ansicht</b> öffnet sie beim Tippen; sein <b>Untermenü</b> öffnet sich bei langem Drücken. Ein Tab <b>ohne Ansicht</b> öffnet direkt sein Untermenü. Auch Kacheln eines Untermenüs können ein Untermenü und Karten haben.",
      up: "Nach oben", down: "Nach unten", del: "Löschen", add_sub: "Zum Untermenü hinzufügen", add_tab: "Tab hinzufügen",
      sub_title: "Untermenü", sub_hold_tab: "Öffnet sich bei langem Drücken auf den Tab.", sub_tap_tab: "Öffnet sich beim Tippen (Tab ohne Ansicht).",
      sub_hold_tile: "Öffnet sich bei langem Drücken auf die Kachel.", sub_tap_tile: "Öffnet sich beim Tippen (Kachel ohne Ansicht oder Aktion).",
      tab_n: (n) => `Tab ${n}`, item_n: (n) => `Element ${n}`, n_sub: (n) => `${n} Untermenü-Element${n > 1 ? "e" : ""}`, n_cards: (n) => `${n} Karte${n > 1 ? "n" : ""}`,
      exp_tile: "Aktion / Entität (dynamische Kachel)", exp_tab: "Plakette, Bild, Sichtbarkeit",
      cards_title: "Karten", cards_hint: "Lovelace-Karten im Panel (Thermostat, Kamera, Diagramm…).",
      add_card: "Karte hinzufügen", pick_card: "Kartentyp wählen:", cancel: "Abbrechen", code_editor: "Code-Editor", visual_editor: "Visueller Editor",
      pk_search: "Karte suchen…", pk_ha: "Home-Assistant-Karten", pk_custom: "Benutzerdefinierte Karten", pk_previews: "Vorschauen anzeigen (langsamer)", pk_none: "Keine Karte gefunden",
      loading: "Karteneditor wird geladen…",
    },
    es: {
      f_panel_width: "Ancho del panel", f_cards_columns: "Tarjetas por fila", f_span: "Ancho de la tarjeta", o_pw_auto: "Automático", o_pw_narrow: "Estrecho", o_pw_normal: "Normal", o_pw_large: "Ancho", o_pw_xlarge: "Muy ancho", o_pw_full: "Todo el ancho de la pantalla", o_cols: (n) => `${n} por fila`, o_span: (n) => `${n} columna${n > 1 ? "s" : ""}`, o_span_full: "Toda la fila", size_hint: "Tamaño: ancho del panel, número de tarjetas por fila y ancho de cada tarjeta.",
      playing: "Reproduciendo ahora", no_playing: "Nada en reproducción",
      need_music: "Se necesita la tarjeta <b>HOLM Music Card</b> para mostrar los reproductores aquí. Instálala desde HACS (kaaribou/holm-music-card).",
      start_music: "Pon música desde Music Assistant y aparecerá aquí.",
      back: "Volver", preview_title: "Barra de navegación HOLM", master: "tarjeta principal", common: "configuración común", no_tabs: "sin pestañas",
      edit_master: "Haz clic en esta tarjeta (lápiz) para editar las pestañas de todas las vistas.",
      edit_common: "Esta vista reutiliza la barra definida en la tarjeta principal (la que contiene las pestañas).",
      preview_note: "La barra se muestra en la parte inferior de la pantalla.",
      card_desc: "Barra de navegación flotante de cristal, animada, común a todas las vistas.", home: "Inicio", lights: "Luces",
      f_music_entity: "Mini reproductor de Music Assistant (encima de la barra)", f_music_show: "Mostrar el mini reproductor", f_music_artwork: "Estilo de carátula en el reproductor",
      f_labels: "Etiquetas", f_desktop_position: "Posición en ordenador", f_mobile_style: "En el móvil", f_auto_hide: "Ocultar al desplazar", f_haptic: "Vibración", f_accent: "Color principal",
      f_label: "Etiqueta", f_icon: "Icono", f_url: "Vista que abrir", f_color: "Color (#hex o nombre)", f_image: "Imagen (sustituye al icono)", f_entity: "Entidad (estado mostrado en el mosaico)",
      f_action: "Al tocar", f_perform_action: "Acción (p. ej. script.buenas_noches)", f_badge_entities: "Indicador: contar entidades activas", f_users: "Visible solo para (nombre de usuario)",
      f_music: "Nota musical si hay reproducción + reproductores con pulsación larga", f_music_players: "Reproductores vigilados (vacío = todos los de Music Assistant)",
      f_label_lines: "Líneas de las etiquetas", f_language: "Idioma", f_cards_position: "Posición de las tarjetas",
      o_active: "Pestaña activa", o_all: "Todas", o_none: "Ninguna", o_docked: "Fija abajo", o_floating: "Flotante", o_bottom: "Abajo", o_left: "A la izquierda", o_right: "A la derecha", o_hidden: "Oculta",
      o_only_playing: "Solo durante la reproducción", o_always: "Siempre", o_cover: "Carátula", o_vinyl: "Vinilo",
      o_lines1: "1 línea", o_lines2: "2 líneas", o_lines3: "3 líneas", o_lines0: "Sin límite", o_auto: "Automático (idioma de Home Assistant)", o_top: "Encima de los mosaicos", o_below: "Debajo de los mosaicos",
      a_navigate: "Ir a una vista", a_toggle: "Alternar la entidad", a_more_info: "Ficha de la entidad", a_perform: "Ejecutar una acción",
      sec_music: "Mini reproductor de música", sec_tabs: "Pestañas de la barra",
      warn_music: "⚠️ Las funciones de música (mini reproductor, nota musical, reproductores con pulsación larga) necesitan la tarjeta <b>HOLM Music Card</b> y la integración <b>Music Assistant</b>. Instala <a href='https://github.com/kaaribou/holm-music-card' target='_blank' rel='noopener'>holm-music-card</a> desde HACS y recarga la página.",
      note_common: "Esta tarjeta reutiliza la <b>barra común</b> definida en la tarjeta principal (la que contiene las pestañas). Para cambiar las pestañas, edita la tarjeta principal.",
      tip_tabs: "Una pestaña con una <b>vista</b> la abre al tocar; su <b>submenú</b> se abre con una pulsación larga. Una pestaña <b>sin vista</b> abre directamente su submenú. Los mosaicos de un submenú también pueden tener su propio submenú y tarjetas.",
      up: "Subir", down: "Bajar", del: "Eliminar", add_sub: "Añadir al submenú", add_tab: "Añadir una pestaña",
      sub_title: "Submenú", sub_hold_tab: "Se abre con una pulsación larga en la pestaña.", sub_tap_tab: "Se abre al tocar (pestaña sin vista).",
      sub_hold_tile: "Se abre con una pulsación larga en el mosaico.", sub_tap_tile: "Se abre al tocar (mosaico sin vista ni acción).",
      tab_n: (n) => `Pestaña ${n}`, item_n: (n) => `Elemento ${n}`, n_sub: (n) => `${n} elemento${n > 1 ? "s" : ""} de submenú`, n_cards: (n) => `${n} tarjeta${n > 1 ? "s" : ""}`,
      exp_tile: "Acción / entidad (mosaico dinámico)", exp_tab: "Indicador, imagen, visibilidad",
      cards_title: "Tarjetas", cards_hint: "Tarjetas Lovelace mostradas en el panel (termostato, cámara, gráfico…).",
      add_card: "Añadir una tarjeta", pick_card: "Elige el tipo de tarjeta:", cancel: "Cancelar", code_editor: "Editor de código", visual_editor: "Editor visual",
      pk_search: "Buscar una tarjeta…", pk_ha: "Tarjetas de Home Assistant", pk_custom: "Tarjetas personalizadas", pk_previews: "Mostrar vistas previas (más lento)", pk_none: "Ninguna tarjeta encontrada",
      loading: "Cargando el editor de tarjetas…",
    },
    it: {
      f_panel_width: "Larghezza del pannello", f_cards_columns: "Schede per riga", f_span: "Larghezza della scheda", o_pw_auto: "Automatica", o_pw_narrow: "Stretto", o_pw_normal: "Normale", o_pw_large: "Largo", o_pw_xlarge: "Molto largo", o_pw_full: "Tutta la larghezza dello schermo", o_cols: (n) => `${n} per riga`, o_span: (n) => `${n} colonn${n > 1 ? "e" : "a"}`, o_span_full: "Tutta la riga", size_hint: "Dimensioni: larghezza del pannello, numero di schede per riga e larghezza di ogni scheda.",
      playing: "In riproduzione", no_playing: "Nessuna riproduzione",
      need_music: "Serve la scheda <b>HOLM Music Card</b> per mostrare qui i lettori. Installala da HACS (kaaribou/holm-music-card).",
      start_music: "Avvia della musica da Music Assistant e comparirà qui.",
      back: "Indietro", preview_title: "Barra di navigazione HOLM", master: "scheda principale", common: "configurazione comune", no_tabs: "nessuna scheda",
      edit_master: "Fai clic su questa scheda (matita) per modificare le schede di tutte le viste.",
      edit_common: "Questa vista riutilizza la barra definita sulla scheda principale (quella con le schede).",
      preview_note: "La barra viene mostrata in fondo allo schermo.",
      card_desc: "Barra di navigazione fluttuante in vetro, animata, comune a tutte le viste.", home: "Home", lights: "Luci",
      f_music_entity: "Mini lettore Music Assistant (sopra la barra)", f_music_show: "Mostra il mini lettore", f_music_artwork: "Stile della copertina nel lettore",
      f_labels: "Etichette", f_desktop_position: "Posizione su computer", f_mobile_style: "Su smartphone", f_auto_hide: "Nascondi scorrendo", f_haptic: "Vibrazione", f_accent: "Colore principale",
      f_label: "Etichetta", f_icon: "Icona", f_url: "Vista da aprire", f_color: "Colore (#hex o nome)", f_image: "Immagine (sostituisce l'icona)", f_entity: "Entità (stato mostrato sul riquadro)",
      f_action: "Al tocco", f_perform_action: "Azione (es. script.buonanotte)", f_badge_entities: "Badge: conta le entità attive", f_users: "Visibile solo per (nome utente)",
      f_music: "Nota musicale durante la riproduzione + lettori con pressione lunga", f_music_players: "Lettori monitorati (vuoto = tutti quelli di Music Assistant)",
      f_label_lines: "Righe delle etichette", f_language: "Lingua", f_cards_position: "Posizione delle schede",
      o_active: "Scheda attiva", o_all: "Tutte", o_none: "Nessuna", o_docked: "Ancorata in basso", o_floating: "Fluttuante", o_bottom: "In basso", o_left: "A sinistra", o_right: "A destra", o_hidden: "Nascosta",
      o_only_playing: "Solo durante la riproduzione", o_always: "Sempre", o_cover: "Copertina", o_vinyl: "Vinile",
      o_lines1: "1 riga", o_lines2: "2 righe", o_lines3: "3 righe", o_lines0: "Illimitate", o_auto: "Automatica (lingua di Home Assistant)", o_top: "Sopra i riquadri", o_below: "Sotto i riquadri",
      a_navigate: "Vai a una vista", a_toggle: "Commuta l'entità", a_more_info: "Dettagli dell'entità", a_perform: "Esegui un'azione",
      sec_music: "Mini lettore musicale", sec_tabs: "Schede della barra",
      warn_music: "⚠️ Le funzioni musicali (mini lettore, nota musicale, lettori con pressione lunga) richiedono la scheda <b>HOLM Music Card</b> e l'integrazione <b>Music Assistant</b>. Installa <a href='https://github.com/kaaribou/holm-music-card' target='_blank' rel='noopener'>holm-music-card</a> da HACS e ricarica la pagina.",
      note_common: "Questa scheda riutilizza la <b>barra comune</b> definita sulla scheda principale (quella con le schede). Per modificare le schede, modifica la scheda principale.",
      tip_tabs: "Una scheda con una <b>vista</b> la apre al tocco; il suo <b>sottomenu</b> si apre con una pressione lunga. Una scheda <b>senza vista</b> apre direttamente il sottomenu. Anche i riquadri di un sottomenu possono avere un sottomenu e delle schede.",
      up: "Su", down: "Giù", del: "Elimina", add_sub: "Aggiungi al sottomenu", add_tab: "Aggiungi una scheda",
      sub_title: "Sottomenu", sub_hold_tab: "Si apre con una pressione lunga sulla scheda.", sub_tap_tab: "Si apre al tocco (scheda senza vista).",
      sub_hold_tile: "Si apre con una pressione lunga sul riquadro.", sub_tap_tile: "Si apre al tocco (riquadro senza vista né azione).",
      tab_n: (n) => `Scheda ${n}`, item_n: (n) => `Elemento ${n}`, n_sub: (n) => `${n} element${n > 1 ? "i" : "o"} di sottomenu`, n_cards: (n) => `${n} sched${n > 1 ? "e" : "a"}`,
      exp_tile: "Azione / entità (riquadro dinamico)", exp_tab: "Badge, immagine, visibilità",
      cards_title: "Schede", cards_hint: "Schede Lovelace mostrate nel pannello (termostato, telecamera, grafico…).",
      add_card: "Aggiungi una scheda", pick_card: "Scegli il tipo di scheda:", cancel: "Annulla", code_editor: "Editor di codice", visual_editor: "Editor visivo",
      pk_search: "Cerca una scheda…", pk_ha: "Schede di Home Assistant", pk_custom: "Schede personalizzate", pk_previews: "Mostra anteprime (più lento)", pk_none: "Nessuna scheda trovata",
      loading: "Caricamento dell'editor delle schede…",
    },
    nl: {
      f_panel_width: "Breedte van het paneel", f_cards_columns: "Kaarten per rij", f_span: "Breedte van de kaart", o_pw_auto: "Automatisch", o_pw_narrow: "Smal", o_pw_normal: "Normaal", o_pw_large: "Breed", o_pw_xlarge: "Extra breed", o_pw_full: "Volledige schermbreedte", o_cols: (n) => `${n} per rij`, o_span: (n) => `${n} kolom${n > 1 ? "men" : ""}`, o_span_full: "Hele rij", size_hint: "Grootte: breedte van het paneel, aantal kaarten per rij en breedte van elke kaart.",
      playing: "Nu aan het spelen", no_playing: "Er speelt niets",
      need_music: "De kaart <b>HOLM Music Card</b> is nodig om hier spelers te tonen. Installeer hem via HACS (kaaribou/holm-music-card).",
      start_music: "Start muziek in Music Assistant, dan verschijnt die hier.",
      back: "Terug", preview_title: "HOLM-navigatiebalk", master: "hoofdkaart", common: "gedeelde configuratie", no_tabs: "geen tabbladen",
      edit_master: "Klik op deze kaart (potlood) om de tabbladen van alle weergaven te bewerken.",
      edit_common: "Deze weergave gebruikt de balk van de hoofdkaart (die met de tabbladen).",
      preview_note: "De balk verschijnt onderaan het scherm.",
      card_desc: "Zwevende, geanimeerde glazen navigatiebalk voor alle weergaven.", home: "Start", lights: "Lampen",
      f_music_entity: "Music Assistant-minispeler (boven de balk)", f_music_show: "Minispeler tonen", f_music_artwork: "Hoesstijl in de speler",
      f_labels: "Labels", f_desktop_position: "Positie op computer", f_mobile_style: "Op mobiel", f_auto_hide: "Verbergen bij scrollen", f_haptic: "Trilling", f_accent: "Hoofdkleur",
      f_label: "Label", f_icon: "Pictogram", f_url: "Te openen weergave", f_color: "Kleur (#hex of naam)", f_image: "Afbeelding (vervangt het pictogram)", f_entity: "Entiteit (status op de tegel)",
      f_action: "Bij tikken", f_perform_action: "Actie (bijv. script.welterusten)", f_badge_entities: "Badge: actieve entiteiten tellen", f_users: "Alleen zichtbaar voor (gebruikersnaam)",
      f_music: "Muzieknoot tijdens afspelen + spelers bij lang indrukken", f_music_players: "Gevolgde spelers (leeg = alle van Music Assistant)",
      f_label_lines: "Regels van de labels", f_language: "Taal", f_cards_position: "Positie van de kaarten",
      o_active: "Actief tabblad", o_all: "Alle", o_none: "Geen", o_docked: "Onderaan vast", o_floating: "Zwevend", o_bottom: "Onderaan", o_left: "Links", o_right: "Rechts", o_hidden: "Verborgen",
      o_only_playing: "Alleen tijdens afspelen", o_always: "Altijd", o_cover: "Hoes", o_vinyl: "Vinyl",
      o_lines1: "1 regel", o_lines2: "2 regels", o_lines3: "3 regels", o_lines0: "Onbeperkt", o_auto: "Automatisch (taal van Home Assistant)", o_top: "Boven de tegels", o_below: "Onder de tegels",
      a_navigate: "Naar een weergave", a_toggle: "Entiteit omschakelen", a_more_info: "Details van de entiteit", a_perform: "Actie uitvoeren",
      sec_music: "Muziek-minispeler", sec_tabs: "Tabbladen van de balk",
      warn_music: "⚠️ De muziekfuncties (minispeler, muzieknoot, spelers bij lang indrukken) vereisen de <b>HOLM Music Card</b> en de integratie <b>Music Assistant</b>. Installeer <a href='https://github.com/kaaribou/holm-music-card' target='_blank' rel='noopener'>holm-music-card</a> via HACS en herlaad de pagina.",
      note_common: "Deze kaart gebruikt de <b>gedeelde balk</b> van de hoofdkaart (die met de tabbladen). Bewerk de hoofdkaart om de tabbladen te wijzigen.",
      tip_tabs: "Een tabblad met een <b>weergave</b> opent die bij tikken; het <b>submenu</b> opent bij lang indrukken. Een tabblad <b>zonder weergave</b> opent meteen het submenu. Tegels in een submenu kunnen ook een eigen submenu en kaarten hebben.",
      up: "Omhoog", down: "Omlaag", del: "Verwijderen", add_sub: "Toevoegen aan submenu", add_tab: "Tabblad toevoegen",
      sub_title: "Submenu", sub_hold_tab: "Opent bij lang indrukken op het tabblad.", sub_tap_tab: "Opent bij tikken (tabblad zonder weergave).",
      sub_hold_tile: "Opent bij lang indrukken op de tegel.", sub_tap_tile: "Opent bij tikken (tegel zonder weergave of actie).",
      tab_n: (n) => `Tabblad ${n}`, item_n: (n) => `Item ${n}`, n_sub: (n) => `${n} submenu-item${n > 1 ? "s" : ""}`, n_cards: (n) => `${n} kaart${n > 1 ? "en" : ""}`,
      exp_tile: "Actie / entiteit (dynamische tegel)", exp_tab: "Badge, afbeelding, zichtbaarheid",
      cards_title: "Kaarten", cards_hint: "Lovelace-kaarten in het paneel (thermostaat, camera, grafiek…).",
      add_card: "Kaart toevoegen", pick_card: "Kies het type kaart:", cancel: "Annuleren", code_editor: "Code-editor", visual_editor: "Visuele editor",
      pk_search: "Kaart zoeken…", pk_ha: "Home Assistant-kaarten", pk_custom: "Aangepaste kaarten", pk_previews: "Voorbeelden tonen (trager)", pk_none: "Geen kaart gevonden",
      loading: "Kaarteditor laden…",
    },
    pt: {
      f_panel_width: "Largura do painel", f_cards_columns: "Cartões por linha", f_span: "Largura do cartão", o_pw_auto: "Automática", o_pw_narrow: "Estreito", o_pw_normal: "Normal", o_pw_large: "Largo", o_pw_xlarge: "Muito largo", o_pw_full: "Toda a largura do ecrã", o_cols: (n) => `${n} por linha`, o_span: (n) => `${n} coluna${n > 1 ? "s" : ""}`, o_span_full: "Linha inteira", size_hint: "Tamanho: largura do painel, número de cartões por linha e largura de cada cartão.",
      playing: "A tocar agora", no_playing: "Nada a tocar",
      need_music: "É necessário o cartão <b>HOLM Music Card</b> para mostrar aqui os leitores. Instala-o a partir do HACS (kaaribou/holm-music-card).",
      start_music: "Põe música no Music Assistant e ela aparecerá aqui.",
      back: "Voltar", preview_title: "Barra de navegação HOLM", master: "cartão principal", common: "configuração comum", no_tabs: "sem separadores",
      edit_master: "Clica neste cartão (lápis) para editar os separadores de todas as vistas.",
      edit_common: "Esta vista reutiliza a barra definida no cartão principal (o que contém os separadores).",
      preview_note: "A barra é mostrada na parte inferior do ecrã.",
      card_desc: "Barra de navegação flutuante em vidro, animada, comum a todas as vistas.", home: "Início", lights: "Luzes",
      f_music_entity: "Mini leitor do Music Assistant (acima da barra)", f_music_show: "Mostrar o mini leitor", f_music_artwork: "Estilo da capa no leitor",
      f_labels: "Etiquetas", f_desktop_position: "Posição no computador", f_mobile_style: "No telemóvel", f_auto_hide: "Ocultar ao deslizar", f_haptic: "Vibração", f_accent: "Cor principal",
      f_label: "Etiqueta", f_icon: "Ícone", f_url: "Vista a abrir", f_color: "Cor (#hex ou nome)", f_image: "Imagem (substitui o ícone)", f_entity: "Entidade (estado mostrado no mosaico)",
      f_action: "Ao tocar", f_perform_action: "Ação (ex. script.boa_noite)", f_badge_entities: "Indicador: contar entidades ativas", f_users: "Visível apenas para (nome de utilizador)",
      f_music: "Nota musical durante a reprodução + leitores com toque longo", f_music_players: "Leitores vigiados (vazio = todos os do Music Assistant)",
      f_label_lines: "Linhas das etiquetas", f_language: "Idioma", f_cards_position: "Posição dos cartões",
      o_active: "Separador ativo", o_all: "Todos", o_none: "Nenhum", o_docked: "Fixa em baixo", o_floating: "Flutuante", o_bottom: "Em baixo", o_left: "À esquerda", o_right: "À direita", o_hidden: "Oculta",
      o_only_playing: "Só durante a reprodução", o_always: "Sempre", o_cover: "Capa", o_vinyl: "Vinil",
      o_lines1: "1 linha", o_lines2: "2 linhas", o_lines3: "3 linhas", o_lines0: "Ilimitado", o_auto: "Automático (idioma do Home Assistant)", o_top: "Acima dos mosaicos", o_below: "Abaixo dos mosaicos",
      a_navigate: "Ir para uma vista", a_toggle: "Alternar a entidade", a_more_info: "Detalhes da entidade", a_perform: "Executar uma ação",
      sec_music: "Mini leitor de música", sec_tabs: "Separadores da barra",
      warn_music: "⚠️ As funções de música (mini leitor, nota musical, leitores com toque longo) requerem o cartão <b>HOLM Music Card</b> e a integração <b>Music Assistant</b>. Instala <a href='https://github.com/kaaribou/holm-music-card' target='_blank' rel='noopener'>holm-music-card</a> a partir do HACS e recarrega a página.",
      note_common: "Este cartão reutiliza a <b>barra comum</b> definida no cartão principal (o que contém os separadores). Para mudar os separadores, edita o cartão principal.",
      tip_tabs: "Um separador com uma <b>vista</b> abre-a ao tocar; o seu <b>submenu</b> abre com um toque longo. Um separador <b>sem vista</b> abre diretamente o submenu. Os mosaicos de um submenu também podem ter o seu próprio submenu e cartões.",
      up: "Subir", down: "Descer", del: "Eliminar", add_sub: "Adicionar ao submenu", add_tab: "Adicionar um separador",
      sub_title: "Submenu", sub_hold_tab: "Abre com um toque longo no separador.", sub_tap_tab: "Abre ao tocar (separador sem vista).",
      sub_hold_tile: "Abre com um toque longo no mosaico.", sub_tap_tile: "Abre ao tocar (mosaico sem vista nem ação).",
      tab_n: (n) => `Separador ${n}`, item_n: (n) => `Elemento ${n}`, n_sub: (n) => `${n} elemento${n > 1 ? "s" : ""} de submenu`, n_cards: (n) => `${n} cart${n > 1 ? "ões" : "ão"}`,
      exp_tile: "Ação / entidade (mosaico dinâmico)", exp_tab: "Indicador, imagem, visibilidade",
      cards_title: "Cartões", cards_hint: "Cartões Lovelace mostrados no painel (termóstato, câmara, gráfico…).",
      add_card: "Adicionar um cartão", pick_card: "Escolhe o tipo de cartão:", cancel: "Cancelar", code_editor: "Editor de código", visual_editor: "Editor visual",
      pk_search: "Procurar um cartão…", pk_ha: "Cartões do Home Assistant", pk_custom: "Cartões personalizados", pk_previews: "Mostrar pré-visualizações (mais lento)", pk_none: "Nenhum cartão encontrado",
      loading: "A carregar o editor de cartões…",
    },
    pl: {
      f_panel_width: "Szerokość panelu", f_cards_columns: "Kart w wierszu", f_span: "Szerokość karty", o_pw_auto: "Automatycznie", o_pw_narrow: "Wąski", o_pw_normal: "Normalny", o_pw_large: "Szeroki", o_pw_xlarge: "Bardzo szeroki", o_pw_full: "Cała szerokość ekranu", o_cols: (n) => `${n} w wierszu`, o_span: (n) => `kolumny: ${n}`, o_span_full: "Cały wiersz", size_hint: "Rozmiar: szerokość panelu, liczba kart w wierszu i szerokość każdej karty.",
      playing: "Teraz odtwarzane", no_playing: "Nic nie jest odtwarzane",
      need_music: "Do wyświetlania odtwarzaczy potrzebna jest karta <b>HOLM Music Card</b>. Zainstaluj ją z HACS (kaaribou/holm-music-card).",
      start_music: "Włącz muzykę w Music Assistant, a pojawi się tutaj.",
      back: "Wstecz", preview_title: "Pasek nawigacji HOLM", master: "karta główna", common: "wspólna konfiguracja", no_tabs: "brak zakładek",
      edit_master: "Kliknij tę kartę (ołówek), aby edytować zakładki wszystkich widoków.",
      edit_common: "Ten widok używa paska zdefiniowanego na karcie głównej (tej z zakładkami).",
      preview_note: "Pasek jest wyświetlany na dole ekranu.",
      card_desc: "Pływający, animowany szklany pasek nawigacji wspólny dla wszystkich widoków.", home: "Start", lights: "Światła",
      f_music_entity: "Miniodtwarzacz Music Assistant (nad paskiem)", f_music_show: "Pokaż miniodtwarzacz", f_music_artwork: "Styl okładki w odtwarzaczu",
      f_labels: "Etykiety", f_desktop_position: "Pozycja na komputerze", f_mobile_style: "Na telefonie", f_auto_hide: "Ukryj podczas przewijania", f_haptic: "Wibracje", f_accent: "Kolor główny",
      f_label: "Etykieta", f_icon: "Ikona", f_url: "Widok do otwarcia", f_color: "Kolor (#hex lub nazwa)", f_image: "Obraz (zastępuje ikonę)", f_entity: "Encja (stan na kafelku)",
      f_action: "Po dotknięciu", f_perform_action: "Akcja (np. script.dobranoc)", f_badge_entities: "Plakietka: licz aktywne encje", f_users: "Widoczne tylko dla (nazwa użytkownika)",
      f_music: "Nuta podczas odtwarzania + odtwarzacze po długim naciśnięciu", f_music_players: "Obserwowane odtwarzacze (puste = wszystkie z Music Assistant)",
      f_label_lines: "Wiersze etykiet", f_language: "Język", f_cards_position: "Pozycja kart",
      o_active: "Aktywna zakładka", o_all: "Wszystkie", o_none: "Brak", o_docked: "Zadokowany na dole", o_floating: "Pływający", o_bottom: "Na dole", o_left: "Po lewej", o_right: "Po prawej", o_hidden: "Ukryty",
      o_only_playing: "Tylko podczas odtwarzania", o_always: "Zawsze", o_cover: "Okładka", o_vinyl: "Winyl",
      o_lines1: "1 wiersz", o_lines2: "2 wiersze", o_lines3: "3 wiersze", o_lines0: "Bez limitu", o_auto: "Automatycznie (język Home Assistant)", o_top: "Nad kafelkami", o_below: "Pod kafelkami",
      a_navigate: "Przejdź do widoku", a_toggle: "Przełącz encję", a_more_info: "Szczegóły encji", a_perform: "Uruchom akcję",
      sec_music: "Miniodtwarzacz muzyki", sec_tabs: "Zakładki paska",
      warn_music: "⚠️ Funkcje muzyczne (miniodtwarzacz, nuta, odtwarzacze po długim naciśnięciu) wymagają karty <b>HOLM Music Card</b> i integracji <b>Music Assistant</b>. Zainstaluj <a href='https://github.com/kaaribou/holm-music-card' target='_blank' rel='noopener'>holm-music-card</a> z HACS i odśwież stronę.",
      note_common: "Ta karta używa <b>wspólnego paska</b> zdefiniowanego na karcie głównej (tej z zakładkami). Aby zmienić zakładki, edytuj kartę główną.",
      tip_tabs: "Zakładka z <b>widokiem</b> otwiera go po dotknięciu; jej <b>podmenu</b> otwiera się po długim naciśnięciu. Zakładka <b>bez widoku</b> od razu otwiera podmenu. Kafelki podmenu też mogą mieć własne podmenu i karty.",
      up: "W górę", down: "W dół", del: "Usuń", add_sub: "Dodaj do podmenu", add_tab: "Dodaj zakładkę",
      sub_title: "Podmenu", sub_hold_tab: "Otwiera się po długim naciśnięciu zakładki.", sub_tap_tab: "Otwiera się po dotknięciu (zakładka bez widoku).",
      sub_hold_tile: "Otwiera się po długim naciśnięciu kafelka.", sub_tap_tile: "Otwiera się po dotknięciu (kafelek bez widoku i akcji).",
      tab_n: (n) => `Zakładka ${n}`, item_n: (n) => `Element ${n}`, n_sub: (n) => `elementy podmenu: ${n}`, n_cards: (n) => `karty: ${n}`,
      exp_tile: "Akcja / encja (dynamiczny kafelek)", exp_tab: "Plakietka, obraz, widoczność",
      cards_title: "Karty", cards_hint: "Karty Lovelace wyświetlane w panelu (termostat, kamera, wykres…).",
      add_card: "Dodaj kartę", pick_card: "Wybierz typ karty:", cancel: "Anuluj", code_editor: "Edytor kodu", visual_editor: "Edytor wizualny",
      pk_search: "Szukaj karty…", pk_ha: "Karty Home Assistant", pk_custom: "Karty niestandardowe", pk_previews: "Pokaż podglądy (wolniej)", pk_none: "Nie znaleziono karty",
      loading: "Ładowanie edytora kart…",
    },
  };
  const LANG_NAMES = { fr: "Français", en: "English", de: "Deutsch", es: "Español", it: "Italiano", nl: "Nederlands", pt: "Português", pl: "Polski" };
  const langOf = (cfg, hass) => {
    let l = cfg && cfg.language && cfg.language !== "auto" ? cfg.language
      : (hass && ((hass.locale && hass.locale.language) || hass.language)) || document.documentElement.lang || navigator.language || "en";
    l = String(l).slice(0, 2).toLowerCase();
    return I18N[l] ? l : "en";
  };
  const tr = (lang, key, ...args) => {
    const v = (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key;
    return typeof v === "function" ? v(...args) : v;
  };

  const colorOf = (c, fallback) => {
    if (!c) return fallback;
    if (c.startsWith("#") || c.startsWith("rgb") || c.startsWith("hsl") || c.startsWith("var(")) return c;
    return `var(--${c}-color, ${c})`;
  };
  const dashOf = (path) => (path || location.pathname).split("/")[1] || "lovelace";
  const norm = (u) => (u || "").replace(/\/+$/, "").toLowerCase();
  const routeUrl = (r) => r.url || (r.tap_action && r.tap_action.action === "navigate" && r.tap_action.navigation_path) || null;
  const matches = (url) => {
    if (!url) return false;
    const p = norm(decodeURI(location.pathname)), u = norm(url);
    return p === u || p.startsWith(u + "/");
  };
  const anyMatch = (items, depth = 0) => (items || []).some((p) => matches(routeUrl(p)) || (depth < MAX_DEPTH && anyMatch(p.popup, depth + 1)));
  const hasLevel = (it) => !!((it.popup && it.popup.length) || (it.cards && it.cards.length));
  const userOk = (item, hass) => {
    if (!item.users || !item.users.length) return true;
    const u = hass && hass.user;
    if (!u) return true;
    return item.users.some((x) => [u.id, (u.name || "").toLowerCase()].includes(String(x).toLowerCase()) || String(x) === u.id);
  };
  const haptic = (on, type = "light") => on && window.dispatchEvent(new CustomEvent("haptic", { detail: type }));
  const navigate = (path, replace = false) => {
    if (/^https?:/.test(path)) return window.open(path, "_blank");
    history[replace ? "replaceState" : "pushState"](null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace } }));
  };
  const linesOf = (c) => {
    const n = c && c.label_lines != null ? parseInt(c.label_lines, 10) : 2;
    return isNaN(n) || n < 0 ? 2 : n;
  };

  // ------------------------------------------------------------------
  //  Barre globale (un seul élément posé sur <body>)
  // ------------------------------------------------------------------
  class HolmNavbarBar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${HolmNavbarBar.css()}</style>
        <div class="scrim" id="scrim"></div>
        <div class="pop" id="pop"><div class="pop-h" id="poph"></div>
          <div class="body" id="body"><div class="players" id="players"></div><div class="cards" id="cards"></div><div class="grid" id="grid"></div></div></div>
        <div class="music" id="music"></div>
        <nav class="dock" id="dock"><div class="bubble" id="bubble"></div><div class="items" id="items"></div></nav>`;
      this.$ = (id) => this.shadowRoot.getElementById(id);
      this.$("scrim").addEventListener("click", () => this.closePop());
      // les cartes du panneau vivent hors de l'arbre de Home Assistant : on relaie leurs évènements
      // (actions au toucher, fiches d'entité, boîtes de dialogue…) vers <home-assistant>
      ["hass-action", "hass-more-info", "show-dialog", "hass-notification", "ll-custom", "hass-toggle"].forEach((type) => {
        this.$("cards").addEventListener(type, (e) => {
          if (e.__holmFwd) return;
          const ha = document.querySelector("home-assistant");
          if (!ha) return;
          e.stopPropagation();
          const ne = new CustomEvent(type, { bubbles: true, composed: true, cancelable: e.cancelable, detail: e.detail });
          ne.__holmFwd = true;
          ha.dispatchEvent(ne);
        });
      });
      this._stack = [];
      this._cardCache = new Map();
      this._onLoc = () => { this.closePop(); this.render(); this._checkScope(); };
      this._onResize = () => { this._layout(); this._place(); };
      this._onKey = (e) => { if (e.key === "Escape" && this.classList.contains("open")) { if (this._stack.length > 1) this._back(); else this.closePop(); } };
      this._lastY = 0;
      this._onScroll = (e) => {
        if (!this.config || !this.config.auto_hide) return;
        const t = e.target && e.target !== document ? e.target : document.scrollingElement;
        const y = t && typeof t.scrollTop === "number" ? t.scrollTop : window.scrollY;
        if (Math.abs(y - this._lastY) < 8) return;
        this.classList.toggle("hidden", y > this._lastY && y > 80);
        this._lastY = y;
      };
    }
    t(key, ...a) { return tr(langOf(this.config, this.hass), key, ...a); }
    connectedCallback() {
      window.addEventListener("location-changed", this._onLoc);
      window.addEventListener("popstate", this._onLoc);
      window.addEventListener("resize", this._onResize);
      window.addEventListener("keydown", this._onKey);
      document.addEventListener("scroll", this._onScroll, { capture: true, passive: true });
    }
    disconnectedCallback() {
      window.removeEventListener("location-changed", this._onLoc);
      window.removeEventListener("popstate", this._onLoc);
      window.removeEventListener("resize", this._onResize);
      window.removeEventListener("keydown", this._onKey);
      document.removeEventListener("scroll", this._onScroll, { capture: true });
    }
    setup(config, hass, dash) {
      const changed = this.config !== config;
      this.config = config;
      this.dash = dash;
      this.hass = hass;
      if (changed) { this._key = null; this._cardCache.clear(); }
      this.render();
      this._music();
      this._checkScope();
    }
    set hassUpdate(hass) {
      this.hass = hass;
      this._updateLive();
      this._music();
    }
    _music() {
      const box = this.$("music"), c = this.config || {}, h = this.hass;
      const ent = c.music_entity;
      if (!ent || !h || !customElements.get("holm-music-card")) {
        if (box.firstChild) box.innerHTML = "";
        this._setMusic(false);
        if (ent && !customElements.get("holm-music-card") && !this._waitMusic) {
          this._waitMusic = true;
          customElements.whenDefined("holm-music-card").then(() => { this._waitMusic = false; this._music(); });
        }
        return;
      }
      let card = box.firstElementChild;
      const cfgKey = ent + "|" + (c.music_artwork || "") + "|" + (c.music_ma_url || "");
      if (!card || card._navKey !== cfgKey) {
        box.innerHTML = "";
        card = document.createElement("holm-music-card");
        const mc = { type: "custom:holm-music-card", entity: ent, mode: "mini" };
        if (c.music_artwork) mc.artwork = c.music_artwork;
        if (c.music_ma_url) mc.ma_url = c.music_ma_url;
        if (c.music_ma_token) mc.ma_token = c.music_ma_token;
        card.setConfig(mc);
        card._navKey = cfgKey;
        box.appendChild(card);
      }
      card.hass = h;
      const st = h.states[ent];
      const show = !!st && (c.music_show === "always" ? st.state !== "unavailable" : ["playing", "paused", "buffering"].includes(st.state) && !!st.attributes.media_title);
      this._setMusic(show);
    }
    _setMusic(on) {
      if (this._musicOn === on) return;
      this._musicOn = on;
      this.toggleAttribute("data-music", on);
      this._pad(this.style.display !== "none");
    }
    _checkScope() {
      const inDash = dashOf() === this.dash && !store.editing && !new URLSearchParams(location.search).has("edit");
      this.style.display = inDash ? "" : "none";
      this._pad(inDash);
      if (!inDash) this.closePop();
    }
    _pad(on) {
      try {
        const ha = document.querySelector("home-assistant");
        const main = ha && ha.shadowRoot.querySelector("home-assistant-main");
        const ppr = main && main.shadowRoot.querySelector("partial-panel-resolver");
        const panel = ppr && ppr.querySelector("ha-panel-lovelace");
        const root = panel && panel.shadowRoot.querySelector("hui-root");
        const view = root && root.shadowRoot.querySelector("#view");
        if (!view) return;
        const desk = this._desktop();
        const pos = this.config.desktop_position;
        const extra = this._musicOn ? 74 : 0;
        view.style.paddingBottom = on && (!desk || pos === "bottom") ? (!desk && (this.config.mobile_style || "docked") === "docked" ? `calc(env(safe-area-inset-bottom) + ${80 + extra}px)` : `calc(env(safe-area-inset-bottom) + ${96 + extra}px)`) : on && extra ? `${extra + 16}px` : "";
        view.style.paddingLeft = on && desk && pos === "left" ? "92px" : "";
        view.style.paddingRight = on && desk && pos === "right" ? "92px" : "";
      } catch (e) { /* ignore */ }
    }
    _desktop() {
      return window.innerWidth >= 1024;
    }
    _layout() {
      const pos = this._desktop() ? this.config.desktop_position : "bottom";
      this.dataset.pos = pos;
      this.dataset.labels = this.config.labels || "active";
      this.dataset.docked = !this._desktop() && (this.config.mobile_style || "docked") === "docked" ? "1" : "0";
      const n = linesOf(this.config);
      this.style.setProperty("--tl-lines", n === 0 ? "99" : String(n));
      this.style.setProperty("--lb-lines", n === 0 ? "3" : String(Math.min(n, 2)));
      this.setAttribute("lang", langOf(this.config, this.hass));
    }
    _routes() {
      return (this.config.routes || []).filter((r) => userOk(r, this.hass));
    }
    _activeIndex(routes) {
      let idx = routes.findIndex((r) => matches(routeUrl(r)));
      if (idx < 0) idx = routes.findIndex((r) => anyMatch(r.popup));
      return idx;
    }
    render() {
      if (!this.config) return;
      this._layout();
      const routes = this._routes();
      const key = JSON.stringify(routes) + (this.hass && this.hass.user ? this.hass.user.id : "");
      const items = this.$("items");
      if (this._key !== key) {
        this._key = key;
        items.innerHTML = "";
        routes.forEach((r, i) => {
          const b = document.createElement("button");
          b.className = "it";
          b.style.setProperty("--c", colorOf(r.color || r.icon_color, this.config.accent));
          const vis = r.image ? `<img src="${r.image}" alt="">` : `<ha-icon icon="${r.icon || "mdi:circle-outline"}"></ha-icon>`;
          b.innerHTML = `<span class="ic">${vis}<b class="badge"></b></span><span class="lb${/\s/.test((r.label || "").trim()) ? " w" : ""}">${r.label || ""}</span>`;
          b.setAttribute("aria-label", r.label || routeUrl(r) || "");
          this._press(b, () => this._tap(r, b), () => this._hold(r, b));
          items.appendChild(b);
        });
      }
      const idx = this._activeIndex(routes);
      [...items.children].forEach((el, i) => el.classList.toggle("active", i === idx));
      this._active = idx;
      const t0 = performance.now();
      const loop = () => { this._place(); if (performance.now() - t0 < 520) requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      this._updateLive();
    }
    _place() {
      const items = this.$("items");
      const bub = this.$("bubble");
      const el = items.children[this._active];
      if (!el) { bub.style.opacity = "0"; return; }
      const d = this.$("dock").getBoundingClientRect();
      const r = el.getBoundingClientRect();
      bub.style.opacity = "1";
      bub.style.width = `${r.width}px`;
      bub.style.height = `${r.height}px`;
      bub.style.transform = `translate(${r.left - d.left}px, ${r.top - d.top}px)`;
      bub.style.setProperty("--c", getComputedStyle(el).getPropertyValue("--c"));
    }
    _press(el, tap, hold) {
      let t = null, held = false;
      el.addEventListener("pointerdown", () => {
        held = false;
        el.classList.add("down");
        t = setTimeout(() => { held = true; el.classList.remove("down"); hold && hold(); }, 480);
      });
      const end = () => { clearTimeout(t); el.classList.remove("down"); };
      el.addEventListener("pointerup", end);
      el.addEventListener("pointerleave", end);
      el.addEventListener("pointercancel", end);
      el.addEventListener("contextmenu", (e) => e.preventDefault());
      el.addEventListener("click", (e) => { e.stopPropagation(); if (!held) tap(); });
    }
    _tap(r, el) {
      haptic(this.config.haptic);
      el.classList.remove("pop-anim"); void el.offsetWidth; el.classList.add("pop-anim");
      const a = r.tap_action;
      if (a && a.action && a.action !== "navigate") return this._run(a, r, el);
      const url = routeUrl(r);
      if (url) return navigate(url);
      if (hasLevel(r)) return this.openPop(r, el);
    }
    _hold(r, el) {
      haptic(this.config.haptic, "medium");
      const a = r.hold_action;
      if (a && a.action && a.action !== "open-popup") return this._run(a, r, el);
      if (hasLevel(r) || r.music) this.openPop(r, el);
    }
    // --- lecteurs Music Assistant en cours
    _maPlayers() {
      const h = this.hass;
      const list = this.config.music_players && this.config.music_players.length ? this.config.music_players
        : Object.keys(h.states).filter((e) => e.startsWith("media_player.") && h.entities && h.entities[e] && h.entities[e].platform === "music_assistant");
      return list.filter((e) => h.states[e]);
    }
    _playing(withPaused) {
      const h = this.hass;
      const ok = withPaused ? ["playing", "paused", "buffering"] : ["playing", "buffering"];
      const act = this._maPlayers().filter((e) => ok.includes(h.states[e].state) && (h.states[e].state !== "paused" || h.states[e].attributes.media_title));
      // groupes : on garde le lecteur principal, pas ses membres
      const out = act.filter((e) => {
        const g = h.states[e].attributes.group_members || [];
        return !(g.length > 1 && g[0] !== e && act.includes(g[0]));
      });
      const rank = (e) => (h.states[e].state === "paused" ? 1 : 0);
      return out.sort((a, b) => rank(a) - rank(b));
    }
    _fillPlayers() {
      const box = this.$("players"), r = this._popRoute;
      if (!r || !r.music || this._stack.length > 1) { if (box.firstChild) { box.innerHTML = ""; box._key = null; } box.hidden = true; return; }
      box.hidden = false;
      const list = this._playing(true);
      const key = list.join(",") + "|" + !!customElements.get("holm-music-card");
      if (box._key !== key) {
        box._key = key;
        const keep = {};
        box.querySelectorAll("holm-music-card").forEach((c) => (keep[c._ent] = c));
        box.innerHTML = "";
        const t = document.createElement("div");
        t.className = "pl-t";
        t.innerHTML = `<span class="eq"><i></i><i></i><i></i></span>${list.length ? `${this.t("playing")} <small>${list.length}</small>` : this.t("no_playing")}`;
        box.appendChild(t);
        if (!customElements.get("holm-music-card")) {
          if (list.length) { const n = document.createElement("div"); n.className = "pl-e"; n.innerHTML = `<ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${this.t("need_music")}</span>`; box.appendChild(n); }
          customElements.whenDefined("holm-music-card").then(() => this._fillPlayers());
        } else {
          list.forEach((e) => {
            let c = keep[e];
            if (!c) {
              c = document.createElement("holm-music-card");
              const mc = { type: "custom:holm-music-card", entity: e, mode: "mini" };
              if (this.config.music_artwork) mc.artwork = this.config.music_artwork;
              if (this.config.music_ma_url) mc.ma_url = this.config.music_ma_url;
              if (this.config.music_ma_token) mc.ma_token = this.config.music_ma_token;
              c.setConfig(mc);
              c._ent = e;
            }
            box.appendChild(c);
          });
        }
        if (!list.length) {
          const n = document.createElement("div");
          n.className = "pl-e";
          n.innerHTML = `<ha-icon icon="mdi:music-note-off-outline"></ha-icon><span>${this.t("start_music")}</span>`;
          box.appendChild(n);
        }
      }
      box.querySelectorAll("holm-music-card").forEach((c) => (c.hass = this.hass));
    }
    _run(a, item, el) {
      const h = this.hass;
      const ent = a.entity || item.entity;
      switch (a.action) {
        case "open-popup": return hasLevel(item) ? (this.classList.contains("open") ? this._push(item) : this.openPop(item, el)) : null;
        case "navigate": return navigate(a.navigation_path);
        case "url": return window.open(a.url_path, "_blank");
        case "more-info": {
          const ha = document.querySelector("home-assistant");
          if (ha && ent) ha.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: ent }, bubbles: true, composed: true }));
          return;
        }
        case "toggle": return ent && h.callService("homeassistant", "toggle", { entity_id: ent });
        case "perform-action":
        case "call-service": {
          const [d, s] = (a.perform_action || a.service || "").split(".");
          if (d && s) h.callService(d, s, a.data || a.service_data || {}, a.target);
          return;
        }
      }
    }
    // --- panneau (sous-menus imbriqués)
    openPop(r, el) {
      this._stack = [r];
      this._popRoute = r;
      clearTimeout(this._plT);
      const d = el.getBoundingClientRect();
      this.$("pop").style.setProperty("--ox", `${d.left + d.width / 2}px`);
      this._renderLevel("");
      this.classList.add("open");
    }
    _push(item) {
      if (this._stack.length >= MAX_DEPTH) return;
      haptic(this.config.haptic, "medium");
      this._stack.push(item);
      this._renderLevel("fwd");
    }
    _back() {
      if (this._stack.length < 2) return this.closePop();
      haptic(this.config.haptic);
      this._stack.pop();
      this._renderLevel("back");
    }
    _levelColor() {
      let c = this.config.accent;
      this._stack.forEach((it) => { c = colorOf(it.color || it.icon_color, c); });
      return c;
    }
    _renderLevel(dir) {
      const lv = this._stack[this._stack.length - 1];
      const depth = this._stack.length;
      const pop = this.$("pop");
      const color = this._levelColor();
      pop.style.setProperty("--c", color);
      // en-tête : retour + fil d'Ariane
      const h = this.$("poph");
      if (depth > 1) {
        const crumbs = this._stack.map((it, i) => `<span class="${i === depth - 1 ? "cur" : "crumb"}" data-i="${i}">${it.label || ""}</span>`).join(`<i class="sep">›</i>`);
        h.innerHTML = `<button class="bk" aria-label="${this.t("back")}"><ha-icon icon="mdi:chevron-left"></ha-icon></button><ha-icon icon="${lv.icon || "mdi:dots-horizontal"}"></ha-icon><div class="crumbs">${crumbs}</div>`;
        h.querySelector(".bk").addEventListener("click", (e) => { e.stopPropagation(); this._back(); });
        h.querySelectorAll(".crumb").forEach((c) => c.addEventListener("click", (e) => {
          e.stopPropagation();
          const i = +c.dataset.i;
          this._stack = this._stack.slice(0, i + 1);
          this._renderLevel("back");
        }));
      } else {
        h.innerHTML = `<ha-icon icon="${lv.icon || "mdi:dots-horizontal"}"></ha-icon><span>${lv.label || ""}</span>`;
      }
      const body = this.$("body");
      body.classList.remove("fwd", "back");
      if (dir) { void body.offsetWidth; body.classList.add(dir); }
      body.scrollTop = 0;
      pop.classList.toggle("mus", depth === 1 && !!lv.music);
      pop.dataset.cpos = lv.cards_position === "bottom" ? "bottom" : "top";
      pop.dataset.pw = ["narrow", "normal", "large", "xlarge", "full"].includes(lv.panel_width) ? lv.panel_width : "auto";
      // lecteurs (niveau 1 seulement)
      this.$("players")._key = null;
      this._fillPlayers();
      // cartes Lovelace
      this._fillCards(lv.cards || [], lv.cards_size || [], Math.max(1, Math.min(3, parseInt(lv.cards_columns, 10) || 1)));
      pop.classList.toggle("has-cards", !!(lv.cards && lv.cards.length));
      // tuiles
      const items = (lv.popup || []).filter((p) => userOk(p, this.hass));
      const g = this.$("grid");
      g.innerHTML = "";
      g.dataset.n = items.length;
      g.hidden = !items.length;
      items.forEach((p) => {
        const b = document.createElement("button");
        const sub = hasLevel(p) && depth < MAX_DEPTH;
        b.className = "tile" + (matches(routeUrl(p)) ? " here" : "") + (sub ? " sub" : "");
        b.style.setProperty("--c", colorOf(p.color || p.icon_color, color));
        b.dataset.entity = p.entity || "";
        b.innerHTML = `<span class="ti"><ha-icon icon="${p.icon || "mdi:circle-outline"}"></ha-icon></span><span class="tl">${p.label || ""}</span><span class="ts"></span>${sub ? `<ha-icon class="chev" icon="mdi:chevron-right"></ha-icon>` : ""}`;
        this._press(b, () => {
          haptic(this.config.haptic);
          const a = p.tap_action;
          if (a && a.action && a.action !== "navigate") {
            this._run(a, p, b);
            if (!["toggle", "perform-action", "call-service", "open-popup"].includes(a.action)) this.closePop();
            return;
          }
          const url = routeUrl(p);
          if (url) { this.closePop(); navigate(url); return; }
          if (sub) this._push(p);
        }, () => {
          const ha = p.hold_action;
          if (ha && ha.action && ha.action !== "open-popup") return this._run(ha, p, b);
          if (sub) return this._push(p);
          if (p.entity) this._run({ action: "more-info" }, p, b);
        });
        g.appendChild(b);
      });
      this._updateLive();
    }
    async _fillCards(list, sizes = [], cols = 1) {
      const box = this.$("cards");
      box.style.setProperty("--ccols", String(cols));
      const token = (this._cardsToken = (this._cardsToken || 0) + 1);
      box.innerHTML = "";
      box.hidden = !list.length;
      if (!list.length) return;
      if (!this._helpers) {
        try { this._helpers = await window.loadCardHelpers(); } catch (e) { return; }
      }
      if (token !== this._cardsToken) return;
      list.forEach((cfg, k) => {
        const key = JSON.stringify(cfg);
        let el = this._cardCache.get(key);
        if (!el) {
          try { el = this._helpers.createCardElement(cfg); } catch (e) { el = this._helpers.createCardElement({ type: "error", error: String(e), origConfig: cfg }); }
          this._cardCache.set(key, el);
          if (this._cardCache.size > 40) this._cardCache.delete(this._cardCache.keys().next().value);
        }
        el.hass = this.hass;
        const w = document.createElement("div");
        w.className = "cw";
        const sp = sizes[k] && sizes[k].span;
        if (sp === "full" || (sp && +sp >= cols)) w.style.gridColumn = "1 / -1";
        else if (sp && +sp > 1) w.style.gridColumn = `span ${+sp}`;
        w.appendChild(el);
        box.appendChild(w);
      });
    }
    closePop() {
      this.classList.remove("open");
      this._popRoute = null;
      clearTimeout(this._plT);
      this._plT = setTimeout(() => {
        if (this._popRoute) return;
        const b = this.$("players"); b.innerHTML = ""; b._key = null;
        this.$("cards").innerHTML = ""; // détache les cartes (caméras, graphiques…)
        this._stack = [];
      }, 400);
    }
    _count(list) {
      const h = this.hass;
      return list.filter((e) => h.states[e] && ACTIVE_STATES.includes(h.states[e].state)).length;
    }
    _stateText(st) {
      const h = this.hass;
      try { if (h.formatEntityState) return h.formatEntityState(st); } catch (e) { /* ancien HA */ }
      return st.state + (st.attributes.unit_of_measurement ? " " + st.attributes.unit_of_measurement : "");
    }
    _updateLive() {
      const h = this.hass;
      if (!h || !this.config) return;
      const routes = this._routes();
      const items = this.$("items").children;
      routes.forEach((r, i) => {
        const el = items[i];
        if (!el) return;
        const bd = el.querySelector(".badge");
        const b = r.badge || {};
        let txt = null;
        if (b.entities && b.entities.length) {
          const n = this._count(b.entities);
          txt = n > 0 ? String(n) : null;
        } else if (b.entity && h.states[b.entity]) {
          const s = h.states[b.entity].state;
          txt = ACTIVE_STATES.includes(s) ? "" : !isNaN(parseFloat(s)) && parseFloat(s) > 0 ? String(Math.round(parseFloat(s))) : null;
        }
        let mus = 0;
        if (r.music) mus = this._playing(false).length;
        if (mus) {
          if (!bd.classList.contains("mnote")) bd.innerHTML = `<ha-icon icon="mdi:music-note"></ha-icon><em></em>`;
          bd.classList.add("mnote", "show");
          bd.classList.remove("dot");
          bd.querySelector("em").textContent = mus > 1 ? String(mus) : "";
          bd.style.background = "";
          return;
        }
        if (bd.classList.contains("mnote")) { bd.classList.remove("mnote"); bd.innerHTML = ""; }
        bd.textContent = txt || "";
        bd.classList.toggle("show", txt !== null);
        bd.classList.toggle("dot", txt === "");
        bd.style.background = b.color ? colorOf(b.color) : "";
      });
      if (this._popRoute && this._popRoute.music && this.classList.contains("open")) this._fillPlayers();
      if (this.classList.contains("open")) {
        this.shadowRoot.querySelectorAll(".tile").forEach((t) => {
          const e = t.dataset.entity;
          const st = e && h.states[e];
          t.classList.toggle("on", !!st && ACTIVE_STATES.includes(st.state));
          t.querySelector(".ts").textContent = st ? this._stateText(st) : "";
        });
        this.$("cards").querySelectorAll(".cw > *").forEach((c) => (c.hass = h));
      }
    }

    static css() {
      return `
      :host { position: fixed; inset: 0; pointer-events: none; z-index: 6; --accent: #26c6da; --tl-lines: 2; --lb-lines: 2; font-family: var(--paper-font-body1_-_font-family, inherit); }
      button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
      .dock {
        position: absolute; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 10px); transform: translateX(-50%);
        width: min(calc(100vw - 16px), 640px); box-sizing: border-box; padding: 6px;
        border-radius: 28px; pointer-events: auto;
        background: linear-gradient(180deg, rgba(34,46,56,.62), rgba(14,20,28,.72));
        backdrop-filter: blur(22px) saturate(180%); -webkit-backdrop-filter: blur(22px) saturate(180%);
        border: 1px solid rgba(255,255,255,.09);
        box-shadow: 0 14px 40px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.1), inset 0 -1px 0 rgba(0,0,0,.25);
        transition: transform .35s cubic-bezier(.3,1.4,.5,1), opacity .3s;
      }
      .dock::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
        background: radial-gradient(120% 140% at 50% -40%, rgba(255,255,255,.12), transparent 55%); }
      :host(.hidden) .dock { transform: translate(-50%, calc(100% + 30px)); opacity: 0; }
      .items { position: relative; display: flex; align-items: stretch; gap: 2px; }
      .bubble {
        position: absolute; left: 0; top: 0; border-radius: 22px; pointer-events: none; opacity: 0;
        background: radial-gradient(90% 90% at 50% 0%, color-mix(in srgb, var(--c) 45%, transparent), color-mix(in srgb, var(--c) 16%, transparent));
        box-shadow: 0 0 18px color-mix(in srgb, var(--c) 45%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--c) 55%, transparent), inset 0 1px 0 rgba(255,255,255,.25);
        transition: transform .45s cubic-bezier(.34,1.45,.55,1), width .35s, height .35s, opacity .3s, background .4s, box-shadow .4s;
      }
      .it { position: relative; flex: 1 1 0; min-width: 0; min-height: 52px; padding: 4px 0; box-sizing: border-box; border-radius: 22px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: rgba(225,238,244,.72); transition: transform .2s, flex-grow .4s cubic-bezier(.34,1.3,.55,1); }
      :host([data-labels="active"][data-pos="bottom"]) .it.active { flex-grow: 2.1; }
      .it.down { transform: scale(.88); }
      .it.pop-anim .ic { animation: boing .5s cubic-bezier(.3,1.6,.5,1); }
      @keyframes boing { 0% { transform: scale(.8); } 60% { transform: scale(1.18) translateY(-2px); } 100% { transform: none; } }
      .ic { position: relative; display: grid; place-items: center; width: 28px; height: 28px; flex: none; color: var(--c); filter: saturate(.75) brightness(.95); transition: filter .3s, transform .3s; }
      .ic ha-icon { --mdc-icon-size: 24px; }
      .ic img { width: 26px; height: 26px; object-fit: contain; border-radius: 8px; }
      .it.active .ic { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--c) 80%, transparent)) saturate(1.2) brightness(1.15); transform: translateY(-1px); }
      .lb { font-size: 10px; font-weight: 700; line-height: 1.15; letter-spacing: .01em; max-width: 100%; padding: 0 3px; box-sizing: border-box; text-align: center; color: #fff;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .lb.w { white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--lb-lines); }
      :host([data-labels="none"]) .lb, :host([data-labels="active"]) .it:not(.active) .lb { display: none; }
      .lb:empty { display: none; }
      .badge { position: absolute; top: -5px; right: -9px; min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box; border-radius: 8px; font-size: 10px; font-weight: 800; line-height: 16px; text-align: center; color: #fff; background: #ef4444; box-shadow: 0 0 0 2px rgba(14,20,28,.9); transform: scale(0); transition: transform .3s cubic-bezier(.3,1.6,.5,1); }
      .badge.show { transform: scale(1); }
      .badge.dot { min-width: 9px; width: 9px; height: 9px; padding: 0; top: -2px; right: -4px; animation: pulse 1.8s ease-in-out infinite; }
      .badge.mnote { min-width: 20px; height: 20px; top: -8px; right: -12px; padding: 0 3px; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 1px;
        background: linear-gradient(135deg, var(--accent), #a855f7); box-shadow: 0 0 0 2px rgba(14,20,28,.9), 0 0 10px color-mix(in srgb, var(--accent) 60%, transparent); }
      .badge.mnote.show { animation: note 1.6s ease-in-out infinite; }
      .badge.mnote ha-icon { --mdc-icon-size: 13px; display: flex; color: #fff; }
      .badge.mnote em { font-style: normal; font-size: 10px; line-height: 1; }
      .badge.mnote em:empty { display: none; }
      @keyframes note { 0%, 100% { transform: scale(1) translateY(0) rotate(0); } 25% { transform: scale(1.08) translateY(-2px) rotate(-10deg); } 50% { transform: scale(1) translateY(0) rotate(0); } 75% { transform: scale(1.08) translateY(-2px) rotate(10deg); } }
      @keyframes pulse { 50% { box-shadow: 0 0 0 2px rgba(14,20,28,.9), 0 0 0 5px rgba(239,68,68,.35); } }

      /* mobile : barre dockée tout en bas */
      :host([data-docked="1"]) .dock {
        left: 0; right: 0; bottom: 0; width: 100%; transform: none;
        padding: 6px 6px calc(env(safe-area-inset-bottom) + 6px);
        border-radius: 22px 22px 0 0; border-width: 1px 0 0 0;
        box-shadow: 0 -8px 30px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.1);
      }
      :host([data-docked="1"].hidden) .dock { transform: translateY(calc(100% + 10px)); }
      :host([data-docked="1"]) .pop { bottom: calc(env(safe-area-inset-bottom) + 74px); }
      /* bureau : rail latéral */
      :host([data-pos="left"]) .dock, :host([data-pos="right"]) .dock { left: 12px; right: auto; top: 50%; bottom: auto; transform: translateY(-50%); width: 72px; padding: 6px; }
      :host([data-pos="right"]) .dock { left: auto; right: 12px; }
      :host([data-pos="left"]) .items, :host([data-pos="right"]) .items { flex-direction: column; }
      :host([data-pos="left"]) .it, :host([data-pos="right"]) .it { flex: 0 0 auto; min-height: 58px; }
      :host([data-pos="left"].hidden) .dock, :host([data-pos="right"].hidden) .dock { transform: translateY(-50%); opacity: 1; }
      :host([data-pos="hidden"]) .dock { display: none; }
      @media (min-width: 1024px) { :host([data-pos="bottom"]) .dock { width: auto; min-width: 520px; } :host([data-pos="bottom"]) .it, :host([data-pos="bottom"]) .it.active { flex: 0 0 76px; } }

      /* mini lecteur Music Assistant */
      .music { position: absolute; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 84px); transform: translate(-50%, 24px) scale(.96); width: min(calc(100vw - 16px), 520px); pointer-events: none; opacity: 0; transition: opacity .35s, transform .45s cubic-bezier(.3,1.4,.5,1); }
      :host([data-music]) .music { pointer-events: auto; opacity: 1; transform: translate(-50%, 0); }
      .music holm-music-card { display: block; filter: drop-shadow(0 12px 28px rgba(0,0,0,.45)); }
      :host([data-docked="1"]) .music { bottom: calc(env(safe-area-inset-bottom) + 78px); }
      :host(.hidden) .music { transform: translate(-50%, 140px); }
      :host([data-pos="left"]) .music, :host([data-pos="right"]) .music, :host([data-pos="hidden"]) .music { left: auto; right: 16px; bottom: 16px; width: 380px; transform: translateY(24px); }
      :host([data-pos="right"]) .music { right: 100px; }
      :host([data-music][data-pos="left"]) .music, :host([data-music][data-pos="right"]) .music, :host([data-music][data-pos="hidden"]) .music { transform: none; }
      @media (min-width: 1024px) { :host([data-pos="bottom"]) .music { width: 460px; } }
      /* sous-menu */
      .scrim { position: absolute; inset: 0; background: rgba(4,8,12,.35); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); opacity: 0; transition: opacity .25s; }
      :host(.open) .scrim { opacity: 1; pointer-events: auto; }
      .pop {
        position: absolute; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 76px); width: min(calc(100vw - 20px), 460px); box-sizing: border-box;
        padding: 12px; border-radius: 26px; pointer-events: none; opacity: 0; display: flex; flex-direction: column;
        transform-origin: var(--ox, 50%) 100%; transform: translateX(-50%) translateY(16px) scale(.92);
        background: linear-gradient(180deg, rgba(30,42,52,.78), rgba(12,18,26,.88));
        backdrop-filter: blur(26px) saturate(180%); -webkit-backdrop-filter: blur(26px) saturate(180%);
        border: 1px solid rgba(255,255,255,.09);
        box-shadow: 0 20px 50px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.1), 0 0 0 1px color-mix(in srgb, var(--c) 18%, transparent);
        transition: opacity .22s, transform .38s cubic-bezier(.3,1.35,.5,1), width .3s;
      }
      :host(.open) .pop { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0) scale(1); }
      :host([data-pos="left"]) .pop, :host([data-pos="right"]) .pop { bottom: auto; top: 50%; transform: translate(-50%, -50%) scale(.92); }
      :host([data-pos="left"].open) .pop, :host([data-pos="right"].open) .pop { transform: translate(-50%, -50%) scale(1); }
      .pop-h { display: flex; align-items: center; gap: 8px; margin: 2px 4px 10px; min-height: 22px; font-size: 13px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: rgba(225,238,244,.75); }
      .pop-h > ha-icon { --mdc-icon-size: 18px; color: var(--c); flex: none; }
      .pop-h .bk { flex: none; width: 30px; height: 30px; margin: -4px 0 -4px -4px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.08); color: #fff; transition: background .2s, transform .2s; }
      .pop-h .bk:hover { background: rgba(255,255,255,.16); }
      .pop-h .bk:active { transform: scale(.9); }
      .pop-h .bk ha-icon { --mdc-icon-size: 20px; }
      .crumbs { display: flex; align-items: center; gap: 4px; min-width: 0; overflow: hidden; white-space: nowrap; }
      .crumbs .crumb { opacity: .55; cursor: pointer; overflow: hidden; text-overflow: ellipsis; flex-shrink: 2; }
      .crumbs .crumb:hover { opacity: .85; }
      .crumbs .cur { color: #fff; overflow: hidden; text-overflow: ellipsis; }
      .crumbs .sep { font-style: normal; opacity: .4; flex: none; }
      .body { display: flex; flex-direction: column; max-height: calc(100vh - 190px); overflow-y: auto; overflow-x: hidden; scrollbar-width: none; margin: 0 -4px; padding: 0 4px; }
      .body::-webkit-scrollbar { display: none; }
      .body.fwd { animation: lvlF .34s cubic-bezier(.3,1.2,.5,1); }
      .body.back { animation: lvlB .34s cubic-bezier(.3,1.2,.5,1); }
      @keyframes lvlF { from { opacity: 0; transform: translateX(36px); } }
      @keyframes lvlB { from { opacity: 0; transform: translateX(-36px); } }
      .players { order: 1; display: flex; flex-direction: column; gap: 8px; max-height: min(60vh, 520px); overflow-y: auto; scrollbar-width: none; }
      .cards { order: 2; display: grid; grid-template-columns: repeat(var(--ccols, 1), minmax(0, 1fr)); gap: 10px; align-items: start; }
      @media (max-width: 520px) { .cards { gap: 8px; } }
      .grid { order: 3; }
      .pop[data-cpos="bottom"] .cards { order: 4; }
      .players[hidden], .grid[hidden], .cards[hidden] { display: none; }
      .players:not([hidden]) ~ .grid:not([hidden]), .players:not([hidden]) ~ .cards:not([hidden]) { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.08); }
      .pop[data-cpos="top"] .cards:not([hidden]) ~ .grid:not([hidden]) { margin-top: 12px; }
      .pop[data-cpos="bottom"] .grid:not([hidden]) ~ .cards:not([hidden]) { margin-top: 12px; }
      .cw { opacity: 0; transform: translateY(8px); }
      :host(.open) .cw { animation: tin .4s cubic-bezier(.3,1.3,.5,1) forwards; }
      ${Array.from({ length: 8 }, (_, i) => `:host(.open) .cw:nth-child(${i + 1}) { animation-delay: ${i * 40}ms; }`).join("\n")}
      .cw > * { display: block; --ha-card-border-radius: 18px; }
      .pop.has-cards { width: min(calc(100vw - 20px), 520px); }
      .pop[data-pw="narrow"] { width: min(calc(100vw - 20px), 360px); }
      .pop[data-pw="normal"] { width: min(calc(100vw - 20px), 460px); }
      .pop[data-pw="large"] { width: min(calc(100vw - 20px), 640px); }
      .pop[data-pw="xlarge"] { width: min(calc(100vw - 20px), 860px); }
      .pop[data-pw="full"] { width: calc(100vw - 20px); }
      :host([data-pos="left"]) .pop[data-pw="full"], :host([data-pos="right"]) .pop[data-pw="full"] { width: calc(100vw - 120px); }
      .players holm-music-card { display: block; opacity: 0; transform: translateY(8px); }
      :host(.open) .players holm-music-card { animation: tin .4s cubic-bezier(.3,1.3,.5,1) forwards; }
      ${Array.from({ length: 8 }, (_, i) => `:host(.open) .players holm-music-card:nth-of-type(${i + 1}) { animation-delay: ${40 + i * 50}ms; }`).join("\n")}
      .pl-t { display: flex; align-items: center; gap: 8px; margin: 0 4px 2px; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: rgba(225,238,244,.6); }
      .pl-t small { padding: 1px 7px; border-radius: 8px; background: color-mix(in srgb, var(--accent) 25%, transparent); color: #fff; font-size: 11px; }
      .eq { display: inline-flex; align-items: flex-end; gap: 2px; height: 12px; }
      .eq i { width: 3px; height: 100%; border-radius: 2px; background: var(--accent); animation: eq 1s ease-in-out infinite; transform-origin: bottom; }
      .eq i:nth-child(2) { animation-delay: -.35s; } .eq i:nth-child(3) { animation-delay: -.7s; }
      @keyframes eq { 0%, 100% { transform: scaleY(.3); } 50% { transform: scaleY(1); } }
      .pl-e { display: flex; align-items: center; gap: 10px; padding: 14px; border-radius: 18px; font-size: 13px; color: rgba(225,238,244,.7); background: rgba(255,255,255,.04); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
      .pl-e ha-icon { --mdc-icon-size: 26px; color: var(--accent); opacity: .8; }
      .pop.mus { width: min(calc(100vw - 20px), 520px); }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .grid[data-n="2"], .grid[data-n="4"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .tile {
        position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0; padding: 10px; border-radius: 18px; text-align: left;
        background: linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.03)); box-shadow: inset 0 0 0 1px rgba(255,255,255,.07), inset 0 1px 0 rgba(255,255,255,.06);
        opacity: 0; transform: translateY(8px); transition: transform .2s, background .3s, box-shadow .3s;
      }
      :host(.open) .tile { animation: tin .4s cubic-bezier(.3,1.3,.5,1) forwards; }
      ${Array.from({ length: 16 }, (_, i) => `:host(.open) .tile:nth-child(${i + 1}) { animation-delay: ${i * 25}ms; }`).join("\n")}
      @keyframes tin { to { opacity: 1; transform: none; } }
      .tile.down { transform: scale(.94) !important; }
      .ti { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; color: var(--c); background: color-mix(in srgb, var(--c) 18%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 30%, transparent); transition: background .3s, color .3s; }
      .ti ha-icon { --mdc-icon-size: 21px; }
      .tl { font-size: 12.5px; font-weight: 700; line-height: 1.22; color: #fff; max-width: 100%;
        display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--tl-lines); overflow: hidden; overflow-wrap: break-word; hyphens: auto; -webkit-hyphens: auto; }
      .ts { font-size: 11px; color: rgba(225,238,244,.6); margin-top: -4px; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ts:empty { display: none; }
      .chev { position: absolute; top: 9px; right: 7px; --mdc-icon-size: 18px; color: rgba(255,255,255,.45); transition: transform .2s, color .2s; }
      .tile.sub:hover .chev { transform: translateX(2px); color: var(--c); }
      .tile.here { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c) 70%, transparent); background: color-mix(in srgb, var(--c) 12%, transparent); }
      .tile.on { background: linear-gradient(160deg, color-mix(in srgb, var(--c) 30%, transparent), color-mix(in srgb, var(--c) 10%, transparent)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 55%, transparent), 0 6px 18px -8px var(--c); }
      .tile.on .ti { background: var(--c); color: #fff; }
      .tile.on .ts, .tile.on .chev { color: #fff; }
      @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } .tile, .cw { opacity: 1; transform: none; } }`;
    }
  }
  if (!customElements.get("holm-navbar-bar")) customElements.define("holm-navbar-bar", HolmNavbarBar);

  // ------------------------------------------------------------------
  //  Carte (posée dans chaque vue)
  // ------------------------------------------------------------------
  class HolmNavbarCard extends HTMLElement {
    static getConfigElement() {
      return document.createElement("holm-navbar-card-editor");
    }
    static getStubConfig(hass) {
      const l = langOf(null, hass);
      return {
        type: "custom:holm-navbar-card",
        routes: [
          { label: tr(l, "home"), icon: "mdi:home", url: "/lovelace/0", color: "#26c6da" },
          { label: tr(l, "lights"), icon: "mdi:lightbulb-group", url: "/lovelace/1", color: "#ffca28" },
        ],
      };
    }
    setConfig(config) {
      this._config = { ...config };
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this._routesKey = null;
      this._syncMode();
      this._apply();
    }
    getCardSize() {
      return 0;
    }
    getGridOptions() {
      return { columns: 12, rows: "auto" };
    }
    set hass(hass) {
      this._hass = hass;
      if (store.bar && store.owner === this) store.bar.hassUpdate = hass;
      this._syncMode();
      if (!this._applied) this._apply();
    }
    set editMode(v) {
      this._editFlag = v;
      this._syncMode();
    }
    connectedCallback() {
      this._syncMode();
      this._apply();
      this._poll = setInterval(() => this._syncMode(), 800);
    }
    disconnectedCallback() {
      clearInterval(this._poll);
      if (store.owner === this) store.owner = null;
    }
    _isPreview() {
      let n = this;
      for (let i = 0; i < 14 && n; i++) {
        if (n.tagName && /card-preview|hui-dialog-edit-card|card-editor|hui-card-picker/i.test(n.tagName)) return true;
        n = n.parentNode || n.host;
      }
      return !!this.preview;
    }
    _isEditing() {
      if (this._editFlag) return true;
      let n = this;
      for (let i = 0; i < 60 && n; i++) {
        if (n.tagName === "HUI-ROOT") return !!(n.lovelace && n.lovelace.editMode);
        n = n.parentNode || n.host;
      }
      return false;
    }
    _syncMode() {
      if (!this.shadowRoot || !this._config) return;
      const mode = this._isPreview() ? "preview" : this._isEditing() ? "edit" : "live";
      if (mode !== "preview") store.editing = mode === "edit";
      if (store.bar) store.bar._checkScope();
      if (mode === this._mode && this._routesKey === JSON.stringify(this._config.routes || null)) return;
      this._mode = mode;
      this._routesKey = JSON.stringify(this._config.routes || null);
      this._renderSelf();
    }
    _renderSelf() {
      const mode = this._mode || "live";
      if (mode === "live") {
        this.shadowRoot.innerHTML = `<style>:host{display:block;height:0;margin:0!important}</style>`;
        return;
      }
      const master = this._config && this._config.routes && this._config.routes.length;
      const src = master ? this._config : store.cfg[dashOf()] || {};
      const l = langOf(src, this._hass);
      const icons = (src.routes || []).map((r) => `<span style="color:${colorOf(r.color || r.icon_color, "#26c6da")}">${r.image ? `<img src="${r.image}">` : `<ha-icon icon="${r.icon || "mdi:circle-outline"}"></ha-icon>`}</span>`).join("");
      this.shadowRoot.innerHTML = `<style>
        :host{display:block}
        .p{padding:12px 14px;border-radius:20px;background:linear-gradient(180deg,rgba(34,46,56,.8),rgba(14,20,28,.9));border:1px dashed rgba(38,198,218,.55);color:#e6f2f5;font:600 13px system-ui,sans-serif}
        .h{display:flex;align-items:center;gap:8px;margin-bottom:8px}.h ha-icon{color:#26c6da;--mdc-icon-size:20px}
        .h small{font-weight:500;opacity:.65;margin-left:auto}
        .r{display:flex;gap:10px;flex-wrap:wrap;padding:8px 10px;border-radius:16px;background:rgba(255,255,255,.05)}
        .r ha-icon{--mdc-icon-size:20px}.r img{width:20px;height:20px;object-fit:contain}
        .n{margin-top:8px;font-weight:500;font-size:12px;opacity:.7}
      </style>
      <div class="p"><div class="h"><ha-icon icon="mdi:dock-bottom"></ha-icon>${tr(l, "preview_title")}<small>${master ? tr(l, "master") : tr(l, "common")}</small></div>
      <div class="r">${icons || `<i style='opacity:.6'>${tr(l, "no_tabs")}</i>`}</div>
      <div class="n">${mode === "edit" ? (master ? tr(l, "edit_master") : tr(l, "edit_common")) : tr(l, "preview_note")}</div></div>`;
    }
    async _resolve(dash) {
      if (this._config.routes && this._config.routes.length) {
        store.cfg[dash] = { ...this._config, ts: Date.now() };
        return this._config;
      }
      const c = store.cfg[dash];
      if (c && Date.now() - c.ts < 60000) return c;
      if (!this._hass) return c || null;
      try {
        const lc = await this._hass.callWS({ type: "lovelace/config", url_path: dash === "lovelace" ? null : dash });
        const stack = [lc];
        let found = null;
        for (let i = 0; i < 200000 && stack.length && !found; i++) {
          const n = stack.pop();
          if (Array.isArray(n)) n.forEach((x) => stack.push(x));
          else if (n && typeof n === "object") {
            if (n.type === "custom:holm-navbar-card" && Array.isArray(n.routes) && n.routes.length) found = n;
            else Object.values(n).forEach((x) => x && typeof x === "object" && stack.push(x));
          }
        }
        if (found) store.cfg[dash] = { ...found, ts: Date.now() };
        if (!this._sub && this._hass.connection) {
          this._sub = true;
          this._hass.connection.subscribeEvents(() => { Object.keys(store.cfg).forEach((k) => (store.cfg[k].ts = 0)); if (store.owner) store.owner._apply(true); }, "lovelace_updated").catch(() => {});
        }
        return store.cfg[dash] || null;
      } catch (e) {
        return c || null;
      }
    }
    async _apply(force) {
      if (!this._config || !this.isConnected || this._isPreview()) return;
      const dash = dashOf();
      const cfg = await this._resolve(dash);
      if (!cfg || !this.isConnected) return;
      this._applied = true;
      const full = { ...DEFAULTS, ...cfg, ...(this._config.routes ? {} : pick(this._config, ["labels", "desktop_position", "mobile_style", "auto_hide"])) };
      if (!store.bar) {
        store.bar = document.createElement("holm-navbar-bar");
        document.body.appendChild(store.bar);
      }
      store.owner = this;
      const prevKey = store.bar._cfgKey;
      const key = JSON.stringify(full);
      if (force || prevKey !== key) {
        store.bar._cfgKey = key;
        store.bar.setup(full, this._hass, dash);
      } else {
        store.bar.hass = this._hass;
        store.bar.render();
        store.bar._checkScope();
      }
    }
  }
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
  const getAt = (o, path) => path.reduce((a, k) => (a == null ? a : a[k]), o);

  // ------------------------------------------------------------------
  //  Éditeur visuel
  // ------------------------------------------------------------------
  class HolmNavbarCardEditor extends HTMLElement {
    constructor() {
      super();
      this._open = new Set();
      this._picker = null; // chemin de l'élément dont le sélecteur de carte est ouvert
    }
    t(key, ...a) { return tr(langOf(this._config, this._hass), key, ...a); }
    setConfig(config) {
      // HA gèle (deepFreeze) la config reçue : on travaille toujours sur une copie
      const j = JSON.stringify(config || {});
      if (j === this._sent) return; // écho de notre propre modification : rien à reconstruire
      this._config = JSON.parse(j);
      this._sent = j;
      if (!this._self) this._render();
    }
    set hass(hass) {
      this._hass = hass;
      this.querySelectorAll("ha-form, hui-card-element-editor, hui-card-picker").forEach((f) => (f.hass = hass));
      if (!this._done) this._render();
    }
    set lovelace(l) {
      // HA passe la LovelaceConfig du tableau de bord ; le sélecteur de cartes a besoin de .views
      this._lovelace = l && Array.isArray(l.views) ? l : l && l.config && Array.isArray(l.config.views) ? l.config : { views: [] };
      this.querySelectorAll("hui-card-element-editor, hui-card-picker").forEach((f) => (f.lovelace = l));
    }
    // rerender : true = tout l'éditeur ; un chemin (["routes", 1, …]) = seulement le panneau de cet élément
    _update(fn, rerender) {
      const c = JSON.parse(JSON.stringify(this._config));
      fn(c);
      this._config = c;
      this._sent = JSON.stringify(c);
      this._self = true;
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: JSON.parse(this._sent) }, bubbles: true, composed: true }));
      clearTimeout(this._selfT);
      this._selfT = setTimeout(() => (this._self = false), 400);
      if (Array.isArray(rerender)) this._refresh(rerender);
      else if (rerender) this._render();
    }
    // reconstruit uniquement le panneau d'un onglet / d'une tuile (beaucoup plus rapide que tout l'éditeur)
    _refresh(path) {
      if (path.length < 2) return this._render();
      const old = this._panels && this._panels.get(path.join("."));
      const parent = getAt(this._config, path.slice(0, -1));
      const idx = path[path.length - 1];
      if (!old || !old.isConnected || !Array.isArray(parent) || !parent[idx]) return this._render();
      const frag = document.createDocumentFragment();
      this._itemPanel(frag, path, parent[idx], (path.length - 2) / 2, idx, parent.length);
      old.replaceWith(frag);
    }
    _form(schema, data, onChange) {
      const f = document.createElement("ha-form");
      f.hass = this._hass;
      f.schema = schema;
      f.data = data;
      f.computeLabel = (s) => (s.name ? this.t("f_" + s.name) : "");
      f.addEventListener("value-changed", (ev) => { ev.stopPropagation(); f.data = ev.detail.value; onChange(ev.detail.value); });
      return f;
    }
    _btn(icon, title, fn) {
      const b = document.createElement("ha-icon-button");
      b.label = title;
      b.innerHTML = `<ha-icon icon="${icon}"></ha-icon>`;
      b.addEventListener("click", (e) => { e.stopPropagation(); fn(); });
      return b;
    }
    // panneau repliable dont le contenu n'est construit qu'à la première ouverture
    _panel(key, header, build) {
      const p = document.createElement("ha-expansion-panel");
      p.outlined = true;
      p.expanded = this._open.has(key);
      let built = false;
      const fill = () => { if (built || !build) return; built = true; const el = build(); if (el) p.appendChild(el); };
      p.addEventListener("expanded-changed", (e) => {
        if (e.target !== p) return;
        if (e.detail.expanded) { this._open.add(key); fill(); } else this._open.delete(key);
      });
      header.slot = "header";
      p.appendChild(header);
      if (p.expanded) fill();
      return p;
    }
    _itemFromForm(v, old) {
      const o = { ...old };
      ["label", "icon", "url", "entity", "color", "image"].forEach((k) => { if (v[k] === "" || v[k] == null) delete o[k]; else o[k] = v[k]; });
      const act = v.action || "navigate";
      if (act === "navigate") delete o.tap_action;
      else o.tap_action = act === "perform-action" ? { action: act, perform_action: v.perform_action || "" } : { action: act };
      if ("badge_entities" in v) {
        if (v.badge_entities && v.badge_entities.length) o.badge = { ...(old.badge || {}), entities: v.badge_entities };
        else if (o.badge) { delete o.badge.entities; if (!Object.keys(o.badge).length) delete o.badge; }
      }
      if ("music" in v) { if (v.music) o.music = true; else delete o.music; }
      if ("users" in v) { if (v.users && v.users.length) o.users = v.users; else delete o.users; }
      delete o.icon_color;
      return o; // sous-menu et cartes conservés tels quels depuis la config courante
    }
    _formData(it) {
      return {
        label: it.label || "", icon: it.icon || "", url: it.url || "", entity: it.entity || "", image: it.image || "",
        color: it.color || it.icon_color || "",
        action: (it.tap_action && it.tap_action.action) || "navigate",
        perform_action: (it.tap_action && it.tap_action.perform_action) || "",
        badge_entities: (it.badge && it.badge.entities) || [],
        users: it.users || [],
        music: !!it.music,
      };
    }
    _head(item, fallback, buttons) {
      const hd = document.createElement("div");
      hd.className = "hn-row";
      const t = document.createElement("div");
      t.className = "t";
      const ref = (it) => {
        const extra = [];
        if (it.popup && it.popup.length) extra.push(this.t("n_sub", it.popup.length));
        if (it.cards && it.cards.length) extra.push(this.t("n_cards", it.cards.length));
        t.innerHTML = `<ha-icon icon="${it.icon || "mdi:circle-outline"}" style="color:${colorOf(it.color || it.icon_color, "#26c6da")}"></ha-icon><span>${it.label || it.url || fallback}</span>${extra.length ? ` <small>· ${extra.join(" · ")}</small>` : ""}`;
      };
      ref(item);
      hd.append(t, ...buttons);
      hd._ref = ref;
      return hd;
    }
    async _ensureCardEditors() {
      if (customElements.get("hui-card-element-editor") && customElements.get("hui-card-picker")) return true;
      if (this._loadingEditors) return false;
      this._loadingEditors = true;
      try {
        // l'éditeur de la carte « pile verticale » charge le sélecteur et l'éditeur de cartes de HA
        const helpers = await window.loadCardHelpers();
        const stack = await helpers.createCardElement({ type: "vertical-stack", cards: [] });
        if (stack && stack.constructor.getConfigElement) await stack.constructor.getConfigElement();
        await Promise.race([
          Promise.all([customElements.whenDefined("hui-card-element-editor"), customElements.whenDefined("hui-card-picker")]),
          new Promise((r) => setTimeout(r, 4000)),
        ]);
      } catch (e) { /* éditeur YAML seul */ }
      this._loadingEditors = false;
      if (this._waitingEditors) { this._waitingEditors = false; this._render(); }
      return true;
    }
    _itemSchema(isSub) {
      const ACTIONS = [
        { value: "navigate", label: this.t("a_navigate") }, { value: "toggle", label: this.t("a_toggle") },
        { value: "more-info", label: this.t("a_more_info") }, { value: "perform-action", label: this.t("a_perform") },
      ];
      return [
        { type: "grid", name: "", schema: [{ name: "label", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }] },
        { name: "url", selector: { navigation: {} } },
        { type: "grid", name: "", schema: [{ name: "color", selector: { text: {} } }, { name: "action", selector: { select: { mode: "dropdown", options: ACTIONS } } }] },
        { type: "expandable", name: "", title: isSub ? this.t("exp_tile") : this.t("exp_tab"), schema: isSub
          ? [{ name: "entity", selector: { entity: {} } }, { name: "perform_action", selector: { text: {} } }]
          : [{ name: "music", selector: { boolean: {} } }, { name: "badge_entities", selector: { entity: { multiple: true } } }, { name: "image", selector: { text: {} } }, { name: "users", selector: { text: { multiple: true } } }, { name: "entity", selector: { entity: {} } }, { name: "perform_action", selector: { text: {} } }] },
      ];
    }
    // un onglet (depth 0) ou une tuile de sous-menu (depth ≥ 1), avec son sous-menu et ses cartes
    _itemPanel(container, path, item, depth, idx, count) {
      const key = path.join(".");
      const parentPath = path.slice(0, -1);
      const scope = depth > 0 ? parentPath.slice(0, -1) : true; // tuile : on reconstruit l'élément parent ; onglet : tout
      const move = (d) => this._update((cc) => { const a = getAt(cc, parentPath); const j = idx + d; if (j < 0 || j >= a.length) return; a.splice(j, 0, a.splice(idx, 1)[0]); }, scope);
      const head = this._head(item, depth === 0 ? this.t("tab_n", idx + 1) : this.t("item_n", idx + 1), [
        this._btn("mdi:arrow-up", this.t("up"), () => idx > 0 && move(-1)),
        this._btn("mdi:arrow-down", this.t("down"), () => idx < count - 1 && move(1)),
        this._btn("mdi:delete-outline", this.t("del"), () => this._update((cc) => {
          const a = getAt(cc, parentPath); a.splice(idx, 1);
          if (depth > 0 && !a.length) delete getAt(cc, parentPath.slice(0, -1)).popup;
        }, scope)),
      ]);
      const p = this._panel(key, head, () => this._itemBody(path, depth, head));
      (this._panels = this._panels || new Map()).set(key, p);
      container.appendChild(p);
    }
    _itemBody(path, depth, head) {
      const key = path.join(".");
      const parentPath = path.slice(0, -1);
      const idx = path[path.length - 1];
      const item = getAt(this._config, path) || {};
      const inner = document.createElement("div");
      inner.className = "hn-in";
      inner.appendChild(this._form(this._itemSchema(depth > 0), this._formData(item), (v) => {
        this._update((cc) => { const parent = getAt(cc, parentPath); parent[idx] = this._itemFromForm(v, parent[idx]); head._ref(parent[idx]); });
      }));
      if (depth < MAX_DEPTH) {
        const sub = document.createElement("div");
        sub.className = "hn-sub";
        const opens = depth === 0 ? (item.url ? this.t("sub_hold_tab") : this.t("sub_tap_tab"))
          : (item.url || (item.tap_action && item.tap_action.action) ? this.t("sub_hold_tile") : this.t("sub_tap_tile"));
        sub.innerHTML = `<div class="hn-subt"><ha-icon icon="mdi:view-grid-outline"></ha-icon>${this.t("sub_title")}</div><div class="hn-subh">${opens}</div>`;
        (item.popup || []).forEach((s, j) => this._itemPanel(sub, path.concat("popup", j), s, depth + 1, j, item.popup.length));
        const add = document.createElement("button");
        add.className = "hn-add";
        add.innerHTML = `<ha-icon icon="mdi:plus"></ha-icon>${this.t("add_sub")}`;
        add.addEventListener("click", () => {
          const j = (item.popup || []).length;
          this._open.add(key);
          this._open.add(path.concat("popup", j).join("."));
          this._update((cc) => { const it = getAt(cc, path); it.popup = it.popup || []; it.popup.push({ label: "", icon: "mdi:star-outline" }); }, path);
        });
        sub.appendChild(add);
        inner.appendChild(sub);
      }
      inner.appendChild(this._cardsEditor(path, item));
      return inner;
    }
    // cartes Lovelace du panneau, avec le sélecteur et l'éditeur de cartes de Home Assistant
    _cardsEditor(path, item) {
      const key = path.join(".");
      const box = document.createElement("div");
      box.className = "hn-sub hn-cards";
      box.innerHTML = `<div class="hn-subt"><ha-icon icon="mdi:cards-outline"></ha-icon>${this.t("cards_title")}</div><div class="hn-subh">${this.t("cards_hint")}</div>`;
      const cards = item.cards || [];
      const ready = customElements.get("hui-card-element-editor") && customElements.get("hui-card-picker");
      if (!ready && (cards.length || this._picker === key)) {
        const w = document.createElement("div");
        w.className = "hn-note";
        w.textContent = this.t("loading");
        box.appendChild(w);
        this._waitingEditors = true;
        this._ensureCardEditors();
      }
      if (cards.length) {
        const cols = Math.max(1, Math.min(3, parseInt(item.cards_columns, 10) || 1));
        const schema = [{ type: "grid", name: "", schema: [
          { name: "panel_width", selector: { select: { mode: "dropdown", options: ["auto", "narrow", "normal", "large", "xlarge", "full"].map((v) => ({ value: v, label: this.t("o_pw_" + v) })) } } },
          { name: "cards_columns", selector: { select: { mode: "dropdown", options: [1, 2, 3].map((n) => ({ value: String(n), label: this.t("o_cols", n) })) } } },
        ] }];
        if (item.popup && item.popup.length) schema.push({ name: "cards_position", selector: { select: { mode: "dropdown", options: [{ value: "top", label: this.t("o_top") }, { value: "bottom", label: this.t("o_below") }] } } });
        const hint = document.createElement("div");
        hint.className = "hn-subh";
        hint.textContent = this.t("size_hint");
        box.appendChild(hint);
        box.appendChild(this._form(schema,
          { panel_width: item.panel_width || "auto", cards_columns: String(cols), cards_position: item.cards_position === "bottom" ? "bottom" : "top" },
          (v) => {
            const colsChanged = String(v.cards_columns || "1") !== String(cols);
            this._update((cc) => {
              const it = getAt(cc, path);
              if (v.cards_position === "bottom") it.cards_position = "bottom"; else delete it.cards_position;
              if (v.panel_width && v.panel_width !== "auto") it.panel_width = v.panel_width; else delete it.panel_width;
              const n = parseInt(v.cards_columns, 10);
              if (n > 1) it.cards_columns = n; else { delete it.cards_columns; delete it.cards_size; }
            }, colsChanged ? path : false);
          }));
      }
      const cols = Math.max(1, Math.min(3, parseInt(item.cards_columns, 10) || 1));
      const sizeOps = (cc, fn) => { const it = getAt(cc, path); if (!it.cards_size) return; fn(it.cards_size); while (it.cards_size.length && !it.cards_size[it.cards_size.length - 1]) it.cards_size.pop(); if (!it.cards_size.some(Boolean)) delete it.cards_size; };
      cards.forEach((cfg, k) => {
        const ckey = `${key}.c${k}`;
        const move = (d) => this._update((cc) => {
          const a = getAt(cc, path).cards; const j = k + d; if (j < 0 || j >= a.length) return;
          a.splice(j, 0, a.splice(k, 1)[0]);
          sizeOps(cc, (sz) => { while (sz.length < a.length) sz.push(null); sz.splice(j, 0, sz.splice(k, 1)[0]); });
        }, path);
        const hd = document.createElement("div");
        hd.className = "hn-row";
        const tt = document.createElement("div");
        tt.className = "t";
        tt.innerHTML = `<ha-icon icon="mdi:card-outline" style="color:#26c6da"></ha-icon><span>${String(cfg.type || "?").replace(/^custom:/, "")}</span>${cfg.title || cfg.name ? ` <small>· ${cfg.title || cfg.name}</small>` : ""}`;
        let ed = null;
        const mode = this._btn("mdi:code-braces", this.t("code_editor"), () => {
          if (!ed || !ed.toggleMode) return;
          ed.toggleMode();
        });
        hd.append(tt, mode,
          this._btn("mdi:arrow-up", this.t("up"), () => k > 0 && move(-1)),
          this._btn("mdi:arrow-down", this.t("down"), () => k < cards.length - 1 && move(1)),
          this._btn("mdi:delete-outline", this.t("del"), () => this._update((cc) => {
            const it = getAt(cc, path); it.cards.splice(k, 1);
            sizeOps(cc, (sz) => sz.splice(k, 1));
            if (!it.cards.length) { ["cards", "cards_position", "cards_columns", "cards_size", "panel_width"].forEach((x) => delete it[x]); }
          }, path)));
        // l'éditeur de la carte (coûteux) n'est créé qu'à l'ouverture de son panneau
        const p = this._panel(ckey, hd, () => {
        const inner = document.createElement("div");
        inner.className = "hn-in";
        if (cols > 1) {
          const cur = (item.cards_size && item.cards_size[k] && item.cards_size[k].span) || 1;
          const opts = [];
          for (let n = 1; n < cols; n++) opts.push({ value: String(n), label: this.t("o_span", n) });
          opts.push({ value: "full", label: this.t("o_span_full") });
          inner.appendChild(this._form([{ name: "span", selector: { select: { mode: "dropdown", options: opts } } }],
            { span: cur === "full" || +cur >= cols ? "full" : String(cur) },
            (v) => this._update((cc) => {
              const it = getAt(cc, path);
              it.cards_size = it.cards_size || [];
              while (it.cards_size.length <= k) it.cards_size.push(null);
              it.cards_size[k] = v.span && v.span !== "1" ? { span: v.span === "full" ? "full" : +v.span } : null;
              sizeOps(cc, () => {});
            })));
        }
        if (customElements.get("hui-card-element-editor")) {
          ed = document.createElement("hui-card-element-editor");
          ed.hass = this._hass;
          ed.lovelace = this._lovelace || { views: [] };
          ed.value = JSON.parse(JSON.stringify(cfg));
          ed.addEventListener("config-changed", (e) => {
            e.stopPropagation();
            const nc = e.detail && e.detail.config;
            if (!nc) return;
            this._update((cc) => { getAt(cc, path).cards[k] = nc; });
          });
          ed.addEventListener("GUImode-changed", (e) => {
            e.stopPropagation();
            mode.label = e.detail && e.detail.guiMode === false ? this.t("visual_editor") : this.t("code_editor");
            mode.innerHTML = `<ha-icon icon="${e.detail && e.detail.guiMode === false ? "mdi:list-box-outline" : "mdi:code-braces"}"></ha-icon>`;
          });
          inner.appendChild(ed);
        }
        return inner;
        });
        box.appendChild(p);
      });
      const addCard = (nc) => {
        const n = (getAt(this._config, path).cards || []).length;
        this._picker = null;
        this._open.add(key);
        this._open.add(`${key}.c${n}`);
        this._update((cc) => { const it = getAt(cc, path); it.cards = it.cards || []; it.cards.push(nc); }, path);
      };
      const addBtn = () => {
        const add = document.createElement("button");
        add.className = "hn-add";
        add.innerHTML = `<ha-icon icon="mdi:plus"></ha-icon>${this.t("add_card")}`;
        add.addEventListener("click", () => { this._picker = key; picker = this._fastPicker(key, addCard, () => { this._picker = null; picker.replaceWith(addBtn()); }); add.replaceWith(picker); });
        return add;
      };
      let picker = null;
      if (this._picker === key) { picker = this._fastPicker(key, addCard, () => { this._picker = null; picker.replaceWith(addBtn()); }); box.appendChild(picker); }
      else box.appendChild(addBtn());
      return box;
    }
    // sélecteur de cartes rapide : liste filtrable des types (sans aperçus), avec repli sur le sélecteur complet de HA
    _fastPicker(key, onPick, onCancel) {
      const wrap = document.createElement("div");
      wrap.className = "hn-pick";
      const top = document.createElement("div");
      top.className = "hn-row";
      const lb = document.createElement("div");
      lb.className = "t";
      lb.textContent = this.t("pick_card");
      top.append(lb, this._btn("mdi:close", this.t("cancel"), onCancel));
      const q = document.createElement("input");
      q.className = "hn-q";
      q.placeholder = this.t("pk_search");
      const list = document.createElement("div");
      list.className = "hn-types";
      const loc = (k) => { try { return (this._hass && this._hass.localize && this._hass.localize(k)) || ""; } catch (e) { return ""; } };
      const builtin = ["tile", "entities", "entity", "button", "area", "heading", "gauge", "glance", "sensor", "thermostat", "humidifier", "light", "media-control",
        "weather-forecast", "history-graph", "statistics-graph", "statistic", "calendar", "todo-list", "logbook", "map", "markdown", "picture", "picture-entity",
        "picture-glance", "picture-elements", "alarm-panel", "plant-status", "iframe", "vertical-stack", "horizontal-stack", "grid", "conditional"]
        .map((t) => ({ type: t, name: loc(`ui.panel.lovelace.editor.card.${t}.name`) || t, desc: loc(`ui.panel.lovelace.editor.card.${t}.description`) }));
      const custom = (window.customCards || []).filter((c) => c && c.type && c.type !== "holm-navbar-card")
        .map((c) => ({ type: "custom:" + c.type, name: c.name || c.type, desc: c.description || "" }));
      const pick = async (t) => {
        list.innerHTML = `<div class="hn-note">${this.t("loading")}</div>`;
        let cfg = { type: t };
        try {
          const ents = Object.keys(this._hass.states);
          let cls = null;
          if (t.startsWith("custom:")) { await Promise.race([customElements.whenDefined(t.slice(7)), new Promise((r) => setTimeout(r, 2000))]); cls = customElements.get(t.slice(7)); }
          else {
            const h = await window.loadCardHelpers();
            await h.createCardElement({ type: t });
            const tag = `hui-${t}-card`;
            await Promise.race([customElements.whenDefined(tag), new Promise((r) => setTimeout(r, 2000))]);
            cls = customElements.get(tag);
          }
          if (cls && cls.getStubConfig) { const st = await cls.getStubConfig(this._hass, ents, ents); if (st) cfg = { ...st, type: t }; }
        } catch (e) { /* configuration minimale */ }
        onPick(cfg);
      };
      const item = (c) => { const b = document.createElement("button"); b.className = "hn-type"; b.title = c.desc || ""; b.innerHTML = `<b></b><small></small>`; b.querySelector("b").textContent = c.name; b.querySelector("small").textContent = c.type.replace(/^custom:/, ""); b.addEventListener("click", () => pick(c.type)); return b; };
      const draw = () => {
        const f = q.value.trim().toLowerCase();
        const m = (c) => !f || c.name.toLowerCase().includes(f) || c.type.toLowerCase().includes(f);
        list.replaceChildren();
        [[this.t("pk_ha"), builtin.filter(m)], [this.t("pk_custom"), custom.filter(m)]].forEach(([title, arr]) => {
          if (!arr.length) return;
          const h = document.createElement("div"); h.className = "hn-subt"; h.textContent = title; list.appendChild(h);
          const g = document.createElement("div"); g.className = "hn-grid"; arr.forEach((c) => g.appendChild(item(c))); list.appendChild(g);
        });
        if (!list.children.length) list.innerHTML = `<div class="hn-subh">${this.t("pk_none")}</div>`;
      };
      q.addEventListener("input", draw);
      draw();
      const full = document.createElement("button");
      full.className = "hn-link";
      full.textContent = this.t("pk_previews");
      full.addEventListener("click", () => {
        if (!customElements.get("hui-card-picker")) return;
        const pk = document.createElement("hui-card-picker");
        pk.hass = this._hass;
        pk.lovelace = this._lovelace || { views: [] };
        pk.addEventListener("config-changed", (e) => { e.stopPropagation(); if (e.detail && e.detail.config) onPick(e.detail.config); });
        q.remove(); full.remove(); list.replaceWith(pk);
      });
      wrap.append(top, q, list, full);
      setTimeout(() => q.focus(), 50);
      return wrap;
    }
    _render() {
      if (!this._hass || !this._config) return;
      this._done = true;
      this._panels = new Map();
      // préchargement discret du sélecteur et de l'éditeur de cartes de HA, pour qu'ils soient prêts au premier clic
      if (!this._prewarm) { this._prewarm = true; setTimeout(() => this._ensureCardEditors(), 300); }
      const out = document.createDocumentFragment();
      const st = document.createElement("style");
      out.appendChild(st);
      st.textContent = `
        .hn-sec{margin:16px 0 6px;font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px}
        .hn-note.warn{background:rgba(255,152,0,.14)}.hn-note a{color:inherit;font-weight:700}
        .hn-note{font-size:13px;opacity:.85;padding:10px 12px;border-radius:10px;background:rgba(38,198,218,.1);margin:8px 0;line-height:1.4}
        .hn-row{display:flex;align-items:center;gap:2px;width:100%}
        .hn-row .t{flex:1;min-width:0;display:flex;align-items:center;gap:8px;font-weight:600}
        .hn-row .t span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hn-row small{opacity:.6;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        ha-expansion-panel{margin:6px 0;border-radius:12px;display:block}
        .hn-in{padding:4px 2px 8px}
        .hn-sub{margin:10px 0 4px;padding:8px 0 0 10px;border-left:3px solid rgba(38,198,218,.45)}
        .hn-cards{border-left-color:rgba(168,85,247,.5)}
        .hn-subt{font-weight:700;font-size:13px;margin:0 0 4px;display:flex;align-items:center;gap:6px}
        .hn-subt ha-icon{--mdc-icon-size:18px;opacity:.75}
        .hn-subh{font-size:12px;opacity:.7;margin-bottom:6px}
        .hn-add{display:inline-flex;align-items:center;gap:6px;margin:8px 0;padding:8px 14px;border-radius:10px;border:1px dashed rgba(38,198,218,.6);background:rgba(38,198,218,.08);color:inherit;font:600 13px inherit;cursor:pointer}
        .hn-add.main{border-style:solid;background:rgba(38,198,218,.2)}
        .hn-pick{margin:8px 0;padding:8px;border-radius:12px;border:1px solid rgba(168,85,247,.45);background:rgba(168,85,247,.06)}
        .hn-pick hui-card-picker{display:block;max-height:60vh;overflow:auto;margin-top:6px}
        .hn-q{width:100%;box-sizing:border-box;margin:6px 0;padding:9px 12px;border-radius:10px;border:1px solid var(--divider-color,#4446);background:var(--card-background-color,transparent);color:inherit;font:inherit}
        .hn-types{max-height:50vh;overflow:auto;padding-right:2px}
        .hn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;margin-bottom:10px}
        .hn-type{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:8px 10px;border-radius:10px;border:1px solid var(--divider-color,#4446);background:rgba(127,127,127,.06);color:inherit;cursor:pointer;font:inherit}
        .hn-type:hover{border-color:rgba(168,85,247,.7);background:rgba(168,85,247,.1)}
        .hn-type b{font-size:13px;font-weight:600}.hn-type small{font-size:11px;opacity:.6;word-break:break-all}
        .hn-link{background:none;border:none;color:var(--primary-color,#26c6da);cursor:pointer;font:600 12px inherit;padding:4px 0}
      `;
      const c = this._config;
      const langs = [{ value: "auto", label: this.t("o_auto") }, ...Object.entries(LANG_NAMES).map(([value, label]) => ({ value, label }))];
      out.appendChild(this._form([
        { type: "grid", name: "", schema: [
          { name: "labels", selector: { select: { mode: "dropdown", options: [{ value: "active", label: this.t("o_active") }, { value: "all", label: this.t("o_all") }, { value: "none", label: this.t("o_none") }] } } },
          { name: "mobile_style", selector: { select: { mode: "dropdown", options: [{ value: "docked", label: this.t("o_docked") }, { value: "floating", label: this.t("o_floating") }] } } },
          { name: "desktop_position", selector: { select: { mode: "dropdown", options: [{ value: "bottom", label: this.t("o_bottom") }, { value: "left", label: this.t("o_left") }, { value: "right", label: this.t("o_right") }, { value: "hidden", label: this.t("o_hidden") }] } } },
        ] },
        { type: "grid", name: "", schema: [
          { name: "label_lines", selector: { select: { mode: "dropdown", options: [{ value: "1", label: this.t("o_lines1") }, { value: "2", label: this.t("o_lines2") }, { value: "3", label: this.t("o_lines3") }, { value: "0", label: this.t("o_lines0") }] } } },
          { name: "language", selector: { select: { mode: "dropdown", options: langs } } },
        ] },
        { type: "grid", name: "", schema: [
          { name: "auto_hide", selector: { boolean: {} } },
          { name: "haptic", selector: { boolean: {} } },
          { name: "accent", selector: { text: {} } },
        ] },
      ], { ...DEFAULTS, language: "auto", ...c, label_lines: String(linesOf(c)) }, (v) => this._update((cc) => {
        Object.assign(cc, pick(v, ["labels", "desktop_position", "mobile_style", "auto_hide", "haptic", "accent"]));
        const n = parseInt(v.label_lines, 10);
        if (isNaN(n) || n === 2) delete cc.label_lines; else cc.label_lines = n;
        const langChanged = (cc.language || "auto") !== (v.language || "auto");
        if (!v.language || v.language === "auto") delete cc.language; else cc.language = v.language;
        if (langChanged) setTimeout(() => this._render(), 0);
      })));
      if (c.routes && c.routes.length) {
        const mh = document.createElement("div");
        mh.className = "hn-sec";
        mh.innerHTML = `<ha-icon icon="mdi:music-circle-outline"></ha-icon>${this.t("sec_music")}`;
        out.appendChild(mh);
        if (!customElements.get("holm-music-card")) {
          const w = document.createElement("div");
          w.className = "hn-note warn";
          w.innerHTML = this.t("warn_music");
          out.appendChild(w);
        }
        out.appendChild(this._form([
          { name: "music_entity", selector: { entity: { filter: { domain: "media_player", integration: "music_assistant" } } } },
          { type: "grid", name: "", schema: [
            { name: "music_show", selector: { select: { mode: "dropdown", options: [{ value: "active", label: this.t("o_only_playing") }, { value: "always", label: this.t("o_always") }] } } },
            { name: "music_artwork", selector: { select: { mode: "dropdown", options: [{ value: "square", label: this.t("o_cover") }, { value: "vinyl", label: this.t("o_vinyl") }] } } },
          ] },
          { name: "music_players", selector: { entity: { multiple: true, filter: { domain: "media_player", integration: "music_assistant" } } } },
        ], { music_show: "active", music_artwork: "square", ...pick(c, ["music_entity", "music_show", "music_artwork", "music_players"]) }, (v) => this._update((cc) => {
          if (v.music_players && v.music_players.length) cc.music_players = v.music_players; else delete cc.music_players;
          ["music_entity", "music_show", "music_artwork"].forEach((k) => { if (v[k] == null || v[k] === "") delete cc[k]; else cc[k] = v[k]; });
          if (cc.music_show === "active") delete cc.music_show;
          if (cc.music_artwork === "square") delete cc.music_artwork;
        })));
      }

      if (!c.routes || !c.routes.length) {
        const n = document.createElement("div");
        n.className = "hn-note";
        n.innerHTML = this.t("note_common");
        out.appendChild(n);
        this.replaceChildren(out);
        return;
      }
      const h = document.createElement("div");
      h.className = "hn-sec";
      h.innerHTML = `<ha-icon icon="mdi:dock-bottom"></ha-icon>${this.t("sec_tabs")}`;
      out.appendChild(h);
      const tip = document.createElement("div");
      tip.className = "hn-note";
      tip.innerHTML = this.t("tip_tabs");
      out.appendChild(tip);
      c.routes.forEach((r, i) => this._itemPanel(out, ["routes", i], r, 0, i, c.routes.length));
      const addR = document.createElement("button");
      addR.className = "hn-add main";
      addR.innerHTML = `<ha-icon icon="mdi:plus"></ha-icon>${this.t("add_tab")}`;
      addR.addEventListener("click", () => {
        this._open.add(`routes.${c.routes.length}`);
        this._update((cc) => cc.routes.push({ label: "", icon: "mdi:star-outline" }), true);
      });
      out.appendChild(addR);
      this.replaceChildren(out);
    }
  }

  if (!customElements.get("holm-navbar-card")) customElements.define("holm-navbar-card", HolmNavbarCard);
  if (!customElements.get("holm-navbar-card-editor")) customElements.define("holm-navbar-card-editor", HolmNavbarCardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "holm-navbar-card")) {
    window.customCards.push({ type: "holm-navbar-card", name: "HOLM Navbar", description: tr(langOf(null, null), "card_desc"), preview: false });
  }
  console.info(`%c HOLM-NAVBAR %c ${VERSION} `, "background:#26c6da;color:#fff;border-radius:3px 0 0 3px", "background:#123;color:#fff;border-radius:0 3px 3px 0");
})();
