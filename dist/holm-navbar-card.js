/* HOLM Navbar Card — v1
 * Barre de navigation flottante « verre liquide » pour tout le dashboard.
 * - Dock en verre dépoli, bulle active qui glisse d'un onglet à l'autre,
 *   icônes colorées, petit rebond au toucher, retour haptique.
 * - Sous-menus en panneau de tuiles ; tuiles « action » liées à une entité
 *   (état en direct : Garage · Ouvert, Alarme · Armée…).
 * - Pastilles dynamiques (nombre d'entités allumées/ouvertes, valeur).
 * - Config commune : une seule carte « maître » (avec routes) ; les autres
 *   vues posent simplement `type: custom:holm-navbar-card` et la réutilisent.
 * - Barre unique posée sur la page : pas de clignotement en changeant de vue.
 */
(() => {
  const VERSION = "1.5.0";
  const ACTIVE_STATES = ["on", "open", "opening", "unlocked", "playing", "home", "heat", "cool", "heat_cool", "armed_away", "armed_home", "armed_night", "triggered", "detected", "cleaning"];
  const STATE_FR = {
    on: "Allumé", off: "Éteint", open: "Ouvert", closed: "Fermé", opening: "Ouverture…", closing: "Fermeture…",
    locked: "Verrouillé", unlocked: "Déverrouillé", playing: "Lecture", paused: "Pause", idle: "Inactif",
    home: "Maison", not_home: "Absent", armed_away: "Armée", armed_home: "Armée (maison)", armed_night: "Armée (nuit)",
    disarmed: "Désarmée", triggered: "Déclenchée", unavailable: "Indispo.", heat: "Chauffe", cool: "Clim",
  };
  const DEFAULTS = { labels: "active", desktop_position: "bottom", mobile_style: "docked", auto_hide: false, haptic: true, accent: "#26c6da" };
  const store = (window.__holmNavbar = window.__holmNavbar || { cfg: {}, bar: null, owner: null });

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

  // ------------------------------------------------------------------
  //  Barre globale (un seul élément posé sur <body>)
  // ------------------------------------------------------------------
  class HolmNavbarBar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${HolmNavbarBar.css()}</style>
        <div class="scrim" id="scrim"></div>
        <div class="pop" id="pop"><div class="pop-h" id="poph"></div><div class="players" id="players"></div><div class="grid" id="grid"></div></div>
        <div class="music" id="music"></div>
        <nav class="dock" id="dock"><div class="bubble" id="bubble"></div><div class="items" id="items"></div></nav>`;
      this.$ = (id) => this.shadowRoot.getElementById(id);
      this.$("scrim").addEventListener("click", () => this.closePop());
      this._onLoc = () => { this.closePop(); this.render(); this._checkScope(); };
      this._onResize = () => { this._layout(); this._place(); };
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
    connectedCallback() {
      window.addEventListener("location-changed", this._onLoc);
      window.addEventListener("popstate", this._onLoc);
      window.addEventListener("resize", this._onResize);
      document.addEventListener("scroll", this._onScroll, { capture: true, passive: true });
    }
    disconnectedCallback() {
      window.removeEventListener("location-changed", this._onLoc);
      window.removeEventListener("popstate", this._onLoc);
      window.removeEventListener("resize", this._onResize);
      document.removeEventListener("scroll", this._onScroll, { capture: true });
    }
    setup(config, hass, dash) {
      const changed = this.config !== config;
      this.config = config;
      this.dash = dash;
      this.hass = hass;
      if (changed) this._key = null;
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
    }
    _routes() {
      return (this.config.routes || []).filter((r) => userOk(r, this.hass));
    }
    _activeIndex(routes) {
      let idx = routes.findIndex((r) => matches(routeUrl(r)));
      if (idx < 0) idx = routes.findIndex((r) => (r.popup || []).some((p) => matches(routeUrl(p))));
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
          b.innerHTML = `<span class="ic">${vis}<b class="badge"></b></span><span class="lb">${r.label || ""}</span>`;
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
      if (r.popup) return this.openPop(r, el);
    }
    _hold(r, el) {
      haptic(this.config.haptic, "medium");
      const a = r.hold_action;
      if (a && a.action && a.action !== "open-popup") return this._run(a, r, el);
      if (r.popup || r.music) this.openPop(r, el);
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
      if (!r || !r.music) { if (box.firstChild) box.innerHTML = ""; box.hidden = true; return; }
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
        t.innerHTML = `<span class="eq"><i></i><i></i><i></i></span>${list.length ? `En cours de lecture <small>${list.length}</small>` : "Aucune lecture en cours"}`;
        box.appendChild(t);
        if (!customElements.get("holm-music-card")) {
          if (list.length) { const n = document.createElement("div"); n.className = "pl-e"; n.innerHTML = `<ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>Le lecteur <b>HOLM Music Card</b> est nécessaire pour afficher les lecteurs ici. Installe-le depuis HACS (kaaribou/holm-music-card).</span>`; box.appendChild(n); }
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
          n.innerHTML = `<ha-icon icon="mdi:music-note-off-outline"></ha-icon><span>Lance une musique depuis Music Assistant, elle apparaîtra ici.</span>`;
          box.appendChild(n);
        }
      }
      box.querySelectorAll("holm-music-card").forEach((c) => (c.hass = this.hass));
    }
    _run(a, item, el) {
      const h = this.hass;
      const ent = a.entity || item.entity;
      switch (a.action) {
        case "open-popup": return item.popup ? this.openPop(item, el) : null;
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
    openPop(r, el) {
      const items = (r.popup || []).filter((p) => userOk(p, this.hass));
      this._popRoute = r;
      this.$("poph").innerHTML = `<ha-icon icon="${r.icon || "mdi:dots-horizontal"}"></ha-icon><span>${r.label || ""}</span>`;
      this.$("pop").style.setProperty("--c", colorOf(r.color || r.icon_color, this.config.accent));
      const g = this.$("grid");
      g.innerHTML = "";
      g.dataset.n = items.length;
      g.hidden = !items.length;
      this.$("pop").classList.toggle("mus", !!r.music);
      this.$("players")._key = null;
      this._fillPlayers();
      items.forEach((p) => {
        const b = document.createElement("button");
        b.className = "tile" + (matches(routeUrl(p)) ? " here" : "");
        b.style.setProperty("--c", colorOf(p.color || p.icon_color, colorOf(r.color || r.icon_color, this.config.accent)));
        b.dataset.entity = p.entity || "";
        b.innerHTML = `<span class="ti"><ha-icon icon="${p.icon || "mdi:circle-outline"}"></ha-icon></span><span class="tl">${p.label || ""}</span><span class="ts"></span>`;
        this._press(b, () => {
          haptic(this.config.haptic);
          const a = p.tap_action;
          if (a && a.action && a.action !== "navigate") { this._run(a, p, b); if (a.action !== "toggle" && a.action !== "perform-action" && a.action !== "call-service") this.closePop(); return; }
          const url = routeUrl(p);
          if (url) { this.closePop(); navigate(url); }
        }, () => p.entity && this._run({ action: "more-info" }, p, b));
        g.appendChild(b);
      });
      // point d'origine de l'animation
      const d = el.getBoundingClientRect();
      this.$("pop").style.setProperty("--ox", `${d.left + d.width / 2}px`);
      this.classList.add("open");
      this._updateLive();
    }
    closePop() {
      this.classList.remove("open");
      this._popRoute = null;
      clearTimeout(this._plT);
      this._plT = setTimeout(() => { if (!this._popRoute) { const b = this.$("players"); b.innerHTML = ""; b._key = null; } }, 400);
    }
    _count(list) {
      const h = this.hass;
      return list.filter((e) => h.states[e] && ACTIVE_STATES.includes(h.states[e].state)).length;
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
          const ts = t.querySelector(".ts");
          ts.textContent = st ? (STATE_FR[st.state] || st.state) + (st.attributes.unit_of_measurement ? " " + st.attributes.unit_of_measurement : "") : "";
        });
      }
    }

    static css() {
      return `
      :host { position: fixed; inset: 0; pointer-events: none; z-index: 6; --accent: #26c6da; font-family: var(--paper-font-body1_-_font-family, inherit); }
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
      .it { position: relative; flex: 1 1 0; min-width: 0; height: 52px; border-radius: 22px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: rgba(225,238,244,.72); transition: transform .2s, flex-grow .4s cubic-bezier(.34,1.3,.55,1); }
      :host([data-labels="active"][data-pos="bottom"]) .it.active { flex-grow: 2.1; }
      .it.down { transform: scale(.88); }
      .it.pop-anim .ic { animation: boing .5s cubic-bezier(.3,1.6,.5,1); }
      @keyframes boing { 0% { transform: scale(.8); } 60% { transform: scale(1.18) translateY(-2px); } 100% { transform: none; } }
      .ic { position: relative; display: grid; place-items: center; width: 28px; height: 28px; color: var(--c); filter: saturate(.75) brightness(.95); transition: filter .3s, transform .3s; }
      .ic ha-icon { --mdc-icon-size: 24px; }
      .ic img { width: 26px; height: 26px; object-fit: contain; border-radius: 8px; }
      .it.active .ic { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--c) 80%, transparent)) saturate(1.2) brightness(1.15); transform: translateY(-1px); }
      .lb { font-size: 10px; font-weight: 700; letter-spacing: .01em; max-width: 100%; padding: 0 2px; box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
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
      :host([data-pos="left"]) .it, :host([data-pos="right"]) .it { flex: 0 0 auto; height: 58px; }
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
        padding: 12px; border-radius: 26px; pointer-events: none; opacity: 0;
        transform-origin: var(--ox, 50%) 100%; transform: translateX(-50%) translateY(16px) scale(.92);
        background: linear-gradient(180deg, rgba(30,42,52,.78), rgba(12,18,26,.88));
        backdrop-filter: blur(26px) saturate(180%); -webkit-backdrop-filter: blur(26px) saturate(180%);
        border: 1px solid rgba(255,255,255,.09);
        box-shadow: 0 20px 50px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.1), 0 0 0 1px color-mix(in srgb, var(--c) 18%, transparent);
        transition: opacity .22s, transform .38s cubic-bezier(.3,1.35,.5,1);
      }
      :host(.open) .pop { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0) scale(1); }
      :host([data-pos="left"]) .pop, :host([data-pos="right"]) .pop { bottom: auto; top: 50%; transform: translate(-50%, -50%) scale(.92); }
      :host([data-pos="left"].open) .pop, :host([data-pos="right"].open) .pop { transform: translate(-50%, -50%) scale(1); }
      .pop-h { display: flex; align-items: center; gap: 8px; margin: 2px 4px 10px; font-size: 13px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: rgba(225,238,244,.75); }
      .pop-h ha-icon { --mdc-icon-size: 18px; color: var(--c); }
      .players { display: flex; flex-direction: column; gap: 8px; max-height: min(60vh, 520px); overflow-y: auto; scrollbar-width: none; }
      .players[hidden], .grid[hidden] { display: none; }
      .players:not([hidden]) + .grid:not([hidden]) { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.08); }
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
      .tl { font-size: 12.5px; font-weight: 700; color: #fff; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ts { font-size: 11px; color: rgba(225,238,244,.6); margin-top: -4px; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ts:empty { display: none; }
      .tile.here { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c) 70%, transparent); background: color-mix(in srgb, var(--c) 12%, transparent); }
      .tile.on { background: linear-gradient(160deg, color-mix(in srgb, var(--c) 30%, transparent), color-mix(in srgb, var(--c) 10%, transparent)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 55%, transparent), 0 6px 18px -8px var(--c); }
      .tile.on .ti { background: var(--c); color: #fff; }
      .tile.on .ts { color: #fff; }
      @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } .tile { opacity: 1; transform: none; } }`;
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
    static getStubConfig() {
      return {
        type: "custom:holm-navbar-card",
        routes: [
          { label: "Accueil", icon: "mdi:home", url: "/lovelace/0", color: "#26c6da" },
          { label: "Lumières", icon: "mdi:lightbulb-group", url: "/lovelace/1", color: "#ffca28" },
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
      <div class="p"><div class="h"><ha-icon icon="mdi:dock-bottom"></ha-icon>Barre de navigation HOLM<small>${master ? "carte maître" : "config commune"}</small></div>
      <div class="r">${icons || "<i style='opacity:.6'>aucun onglet</i>"}</div>
      <div class="n">${mode === "edit" ? (master ? "Clique sur cette carte (crayon) pour modifier les onglets de toutes les vues." : "Cette vue réutilise la barre définie sur la carte maître (celle qui contient les onglets).") : "La barre s'affiche en bas de l'écran."}</div></div>`;
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

  // ------------------------------------------------------------------
  //  Éditeur visuel
  // ------------------------------------------------------------------
  const ACTIONS = [
    { value: "navigate", label: "Aller à une vue" },
    { value: "toggle", label: "Basculer l'entité" },
    { value: "more-info", label: "Fiche de l'entité" },
    { value: "perform-action", label: "Lancer une action" },
  ];
  class HolmNavbarCardEditor extends HTMLElement {
    constructor() {
      super();
      this._open = new Set();
    }
    setConfig(config) {
      // HA gèle (deepFreeze) la config reçue : on travaille toujours sur une copie
      this._config = JSON.parse(JSON.stringify(config || {}));
      if (!this._self) this._render();
    }
    set hass(hass) {
      this._hass = hass;
      this.querySelectorAll("ha-form").forEach((f) => (f.hass = hass));
      if (!this._done) this._render();
    }
    _update(fn, rerender) {
      const c = JSON.parse(JSON.stringify(this._config));
      fn(c);
      this._config = c;
      this._self = true;
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: JSON.parse(JSON.stringify(c)) }, bubbles: true, composed: true }));
      clearTimeout(this._selfT);
      this._selfT = setTimeout(() => (this._self = false), 400);
      if (rerender) this._render();
    }
    _form(schema, data, onChange, labels) {
      const f = document.createElement("ha-form");
      f.hass = this._hass;
      f.schema = schema;
      f.data = data;
      f.computeLabel = (s) => (labels && labels[s.name]) || s.name;
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
    _panel(key, header) {
      const p = document.createElement("ha-expansion-panel");
      p.outlined = true;
      p.expanded = this._open.has(key);
      p.addEventListener("expanded-changed", (e) => { if (e.target !== p) return; e.detail.expanded ? this._open.add(key) : this._open.delete(key); });
      header.slot = "header";
      p.appendChild(header);
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
      return o; // popup conservé tel quel depuis la config courante
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
      const ref = (it) => (t.innerHTML = `<ha-icon icon="${it.icon || "mdi:circle-outline"}" style="color:${colorOf(it.color || it.icon_color, "#26c6da")}"></ha-icon><span>${it.label || it.url || fallback}</span>${it.popup && it.popup.length ? ` <small>· ${it.popup.length} sous-menu${it.popup.length > 1 ? "s" : ""}</small>` : ""}`);
      ref(item);
      hd.append(t, ...buttons);
      hd._ref = ref;
      return hd;
    }
    _render() {
      if (!this._hass || !this._config) return;
      this._done = true;
      this.innerHTML = `<style>
        .hn-sec{margin:16px 0 6px;font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px}
        .hn-note.warn{background:rgba(255,152,0,.14)}.hn-note a{color:inherit;font-weight:700}
        .hn-note{font-size:13px;opacity:.85;padding:10px 12px;border-radius:10px;background:rgba(38,198,218,.1);margin:8px 0;line-height:1.4}
        .hn-row{display:flex;align-items:center;gap:2px;width:100%}
        .hn-row .t{flex:1;min-width:0;display:flex;align-items:center;gap:8px;font-weight:600}
        .hn-row .t span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hn-row small{opacity:.6;font-weight:500;white-space:nowrap}
        ha-expansion-panel{margin:6px 0;border-radius:12px;display:block}
        .hn-in{padding:4px 2px 8px}
        .hn-sub{margin:10px 0 4px;padding:8px 0 0 10px;border-left:3px solid rgba(38,198,218,.45)}
        .hn-subt{font-weight:700;font-size:13px;margin:0 0 4px}
        .hn-subh{font-size:12px;opacity:.7;margin-bottom:6px}
        .hn-add{display:inline-flex;align-items:center;gap:6px;margin:8px 0;padding:8px 14px;border-radius:10px;border:1px dashed rgba(38,198,218,.6);background:rgba(38,198,218,.08);color:inherit;font:600 13px inherit;cursor:pointer}
        .hn-add.main{border-style:solid;background:rgba(38,198,218,.2)}
      </style>`;
      const c = this._config;
      const L = {
        music_entity: "Mini lecteur Music Assistant (au-dessus de la barre)", music_show: "Afficher le mini lecteur", music_artwork: "Style de pochette dans le lecteur",
        labels: "Libellés", desktop_position: "Position sur ordinateur", mobile_style: "Sur mobile", auto_hide: "Masquer en défilant", haptic: "Vibration", accent: "Couleur principale",
        label: "Libellé", icon: "Icône", url: "Vue à ouvrir", color: "Couleur (#hex ou nom)", image: "Image (remplace l'icône)", entity: "Entité (état affiché sur la tuile)",
        action: "Au toucher", perform_action: "Action (ex. script.bonne_nuit)", badge_entities: "Pastille : compter les entités actives", users: "Visible seulement pour (nom d'utilisateur)",
        music: "Note de musique si lecture en cours + lecteurs à l'appui long", music_players: "Lecteurs surveillés (vide = tous ceux de Music Assistant)",
      };
      this.appendChild(this._form([
        { type: "grid", name: "", schema: [
          { name: "labels", selector: { select: { mode: "dropdown", options: [{ value: "active", label: "Onglet actif" }, { value: "all", label: "Tous" }, { value: "none", label: "Aucun" }] } } },
          { name: "mobile_style", selector: { select: { mode: "dropdown", options: [{ value: "docked", label: "Dockée en bas" }, { value: "floating", label: "Flottante" }] } } },
          { name: "desktop_position", selector: { select: { mode: "dropdown", options: [{ value: "bottom", label: "En bas" }, { value: "left", label: "À gauche" }, { value: "right", label: "À droite" }, { value: "hidden", label: "Masquée" }] } } },
        ] },
        { type: "grid", name: "", schema: [
          { name: "auto_hide", selector: { boolean: {} } },
          { name: "haptic", selector: { boolean: {} } },
          { name: "accent", selector: { text: {} } },
        ] },
      ], { ...DEFAULTS, ...c }, (v) => this._update((cc) => Object.assign(cc, pick(v, ["labels", "desktop_position", "mobile_style", "auto_hide", "haptic", "accent"]))), L));
      if (c.routes && c.routes.length) {
        const mh = document.createElement("div");
        mh.className = "hn-sec";
        mh.innerHTML = `<ha-icon icon="mdi:music-circle-outline"></ha-icon>Mini lecteur de musique`;
        this.appendChild(mh);
        if (!customElements.get("holm-music-card")) {
          const w = document.createElement("div");
          w.className = "hn-note warn";
          w.innerHTML = "⚠️ Les fonctions musique (mini lecteur, note de musique, lecteurs à l'appui long) nécessitent la carte <b>HOLM Music Card</b> et l'intégration <b>Music Assistant</b>. Installe <a href='https://github.com/kaaribou/holm-music-card' target='_blank' rel='noopener'>holm-music-card</a> depuis HACS puis recharge la page.";
          this.appendChild(w);
        }
        this.appendChild(this._form([
          { name: "music_entity", selector: { entity: { filter: { domain: "media_player", integration: "music_assistant" } } } },
          { type: "grid", name: "", schema: [
            { name: "music_show", selector: { select: { mode: "dropdown", options: [{ value: "active", label: "Seulement pendant la lecture" }, { value: "always", label: "Toujours" }] } } },
            { name: "music_artwork", selector: { select: { mode: "dropdown", options: [{ value: "square", label: "Pochette" }, { value: "vinyl", label: "Vinyle" }] } } },
          ] },
          { name: "music_players", selector: { entity: { multiple: true, filter: { domain: "media_player", integration: "music_assistant" } } } },
        ], { music_show: "active", music_artwork: "square", ...pick(c, ["music_entity", "music_show", "music_artwork", "music_players"]) }, (v) => this._update((cc) => {
          if (v.music_players && v.music_players.length) cc.music_players = v.music_players; else delete cc.music_players;
          ["music_entity", "music_show", "music_artwork"].forEach((k) => { if (v[k] == null || v[k] === "") delete cc[k]; else cc[k] = v[k]; });
          if (cc.music_show === "active") delete cc.music_show;
          if (cc.music_artwork === "square") delete cc.music_artwork;
        }), L));
      }

      if (!c.routes || !c.routes.length) {
        const n = document.createElement("div");
        n.className = "hn-note";
        n.innerHTML = "Cette carte réutilise la <b>barre commune</b> définie sur la carte maître (celle qui contient les onglets). Pour modifier les onglets, édite la carte maître.";
        this.appendChild(n);
        return;
      }
      const h = document.createElement("div");
      h.className = "hn-sec";
      h.innerHTML = `<ha-icon icon="mdi:dock-bottom"></ha-icon>Onglets de la barre`;
      this.appendChild(h);
      const tip = document.createElement("div");
      tip.className = "hn-note";
      tip.innerHTML = "Un onglet avec une <b>vue</b> y mène au toucher ; son <b>sous-menu</b> s'ouvre à l'appui long. Un onglet <b>sans vue</b> ouvre directement son sous-menu.";
      this.appendChild(tip);

      const itemSchema = (isSub) => [
        { type: "grid", name: "", schema: [{ name: "label", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }] },
        { name: "url", selector: { navigation: {} } },
        { type: "grid", name: "", schema: [{ name: "color", selector: { text: {} } }, { name: "action", selector: { select: { mode: "dropdown", options: ACTIONS } } }] },
        { type: "expandable", name: "", title: isSub ? "Action / entité (tuile dynamique)" : "Pastille, image, visibilité", schema: isSub
          ? [{ name: "entity", selector: { entity: {} } }, { name: "perform_action", selector: { text: {} } }]
          : [{ name: "music", selector: { boolean: {} } }, { name: "badge_entities", selector: { entity: { multiple: true } } }, { name: "image", selector: { text: {} } }, { name: "users", selector: { text: { multiple: true } } }, { name: "entity", selector: { entity: {} } }, { name: "perform_action", selector: { text: {} } }] },
      ];
      c.routes.forEach((r, i) => {
        const head = this._head(r, "Onglet " + (i + 1), [
          this._btn("mdi:arrow-up", "Monter", () => i > 0 && this._update((cc) => cc.routes.splice(i - 1, 0, cc.routes.splice(i, 1)[0]), true)),
          this._btn("mdi:arrow-down", "Descendre", () => i < c.routes.length - 1 && this._update((cc) => cc.routes.splice(i + 1, 0, cc.routes.splice(i, 1)[0]), true)),
          this._btn("mdi:delete-outline", "Supprimer", () => this._update((cc) => cc.routes.splice(i, 1), true)),
        ]);
        const p = this._panel(`r${i}`, head);
        const inner = document.createElement("div");
        inner.className = "hn-in";
        inner.appendChild(this._form(itemSchema(false), this._formData(r), (v) => {
          this._update((cc) => { cc.routes[i] = this._itemFromForm(v, cc.routes[i]); head._ref(cc.routes[i]); });
        }, L));

        const sub = document.createElement("div");
        sub.className = "hn-sub";
        sub.innerHTML = `<div class="hn-subt">Sous-menu</div><div class="hn-subh">${r.url ? "S'ouvre à l'appui long sur l'onglet." : "S'ouvre au toucher (onglet sans vue)."}</div>`;
        (r.popup || []).forEach((s, j) => {
          const sh = this._head(s, "Élément " + (j + 1), [
            this._btn("mdi:arrow-up", "Monter", () => j > 0 && this._update((cc) => { const a = cc.routes[i].popup; a.splice(j - 1, 0, a.splice(j, 1)[0]); }, true)),
            this._btn("mdi:arrow-down", "Descendre", () => j < r.popup.length - 1 && this._update((cc) => { const a = cc.routes[i].popup; a.splice(j + 1, 0, a.splice(j, 1)[0]); }, true)),
            this._btn("mdi:delete-outline", "Supprimer", () => this._update((cc) => { cc.routes[i].popup.splice(j, 1); if (!cc.routes[i].popup.length) delete cc.routes[i].popup; }, true)),
          ]);
          const sp = this._panel(`r${i}s${j}`, sh);
          const si = document.createElement("div");
          si.className = "hn-in";
          si.appendChild(this._form(itemSchema(true), this._formData(s), (v) => {
            this._update((cc) => { cc.routes[i].popup[j] = this._itemFromForm(v, cc.routes[i].popup[j]); sh._ref(cc.routes[i].popup[j]); });
          }, L));
          sp.appendChild(si);
          sub.appendChild(sp);
        });
        const add = document.createElement("button");
        add.className = "hn-add";
        add.innerHTML = `<ha-icon icon="mdi:plus"></ha-icon>Ajouter au sous-menu`;
        add.addEventListener("click", () => {
          const j = (r.popup || []).length;
          this._open.add(`r${i}`);
          this._open.add(`r${i}s${j}`);
          this._update((cc) => { cc.routes[i].popup = cc.routes[i].popup || []; cc.routes[i].popup.push({ label: "", icon: "mdi:star-outline" }); }, true);
        });
        sub.appendChild(add);
        inner.appendChild(sub);
        p.appendChild(inner);
        this.appendChild(p);
      });
      const addR = document.createElement("button");
      addR.className = "hn-add main";
      addR.innerHTML = `<ha-icon icon="mdi:plus"></ha-icon>Ajouter un onglet`;
      addR.addEventListener("click", () => {
        this._open.add(`r${c.routes.length}`);
        this._update((cc) => cc.routes.push({ label: "", icon: "mdi:star-outline" }), true);
      });
      this.appendChild(addR);
    }
  }

  if (!customElements.get("holm-navbar-card")) customElements.define("holm-navbar-card", HolmNavbarCard);
  if (!customElements.get("holm-navbar-card-editor")) customElements.define("holm-navbar-card-editor", HolmNavbarCardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "holm-navbar-card")) {
    window.customCards.push({ type: "holm-navbar-card", name: "HOLM Navbar", description: "Barre de navigation flottante en verre, animée, commune à toutes les vues.", preview: false });
  }
  console.info(`%c HOLM-NAVBAR %c ${VERSION} `, "background:#26c6da;color:#fff;border-radius:3px 0 0 3px", "background:#123;color:#fff;border-radius:0 3px 3px 0");
})();
