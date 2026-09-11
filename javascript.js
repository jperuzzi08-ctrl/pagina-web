// ============================================================
// javascript.js
// Todo el JavaScript del sitio:
//   1) Pokémon del día (el mismo durante todo el día, localStorage)
//   2) Formulario del footer (validaciones + envío por email)
//   3) Reproductor de música
// ============================================================

/* ============================================================
   1) POKÉMON DEL DÍA — el mismo durante todo el día (localStorage)
   ============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "pokeDelDia";
  const MAX_ID = 1010; // genera 1..1010

  // Fecha local en formato YYYY-MM-DD
  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  window.getPokeDelDia = function () {
    const today = todayStr();

    // Si ya guardamos uno para HOY, lo reusamos (mismo todo el día)
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.fecha === today && saved.id >= 1 && saved.id <= MAX_ID) {
        return saved.id;
      }
    } catch (e) {
      /* localStorage puede no estar disponible (modo privado, sandbox) */
    }

    // Es un día nuevo (o no hay nada guardado): elegimos uno y lo guardamos
    const id = Math.floor(Math.random() * MAX_ID) + 1;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fecha: today, id }));
    } catch (e) {
      /* sin localStorage usamos un random igual */
    }
    return id;
  };
})();

/* ============================================================
   2) FORMULARIO DEL FOOTER — validaciones + envío por email
   ============================================================ */
(function () {
  "use strict";

  function initFooterForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const statusEl  = document.getElementById("formStatus");
    const submitBtn = form.querySelector('button[type="submit"]');
    const msgInput  = form.querySelector('input[name="message"]');
    const charCount = form.querySelector(".char-count");

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function errorEl(name) { return form.querySelector('[data-error-for="' + name + '"]'); }
    function inputEl(name) { return form.querySelector('input[name="' + name + '"]'); }

    function setError(name, msg) {
      const el = errorEl(name);
      if (el) el.textContent = msg;
      inputEl(name).classList.add("invalid");
    }

    function clearError(name) {
      const el = errorEl(name);
      if (el) el.textContent = "";
      inputEl(name).classList.remove("invalid");
    }

    function setStatus(text, ok) {
      if (!statusEl) return;
      statusEl.style.display = "block";
      statusEl.textContent = text;
      statusEl.style.color = ok === true ? "limegreen"
                          : ok === false ? "#ff6b6b"
                          : "var(--muted, #9aa5b1)";
    }

    function updateCharCount(forceShow) {
      if (!charCount || !msgInput) return;
      const max = msgInput.maxLength || 280;
      charCount.textContent = msgInput.value.length + "/" + max;
      charCount.style.display = (forceShow || msgInput.value.length > 0) ? "" : "none";
      charCount.classList.toggle("limit", msgInput.value.length >= max);
    }

    function validate() {
      ["name", "email", "message"].forEach(clearError);
      let firstInvalid = null;

      const name = inputEl("name").value.trim();
      if (!name)                 setError("name", "Escribí tu nombre.");
      else if (name.length < 2)  setError("name", "El nombre debe tener al menos 2 caracteres.");
      else if (name.length > 60) setError("name", "Máximo 60 caracteres.");

      const email = inputEl("email").value.trim();
      if (!email)                     setError("email", "Escribí tu email.");
      else if (!EMAIL_RE.test(email)) setError("email", "Email inválido (ej: nombre@dominio.com).");

      const message = msgInput.value.trim();
      if (!message)                  setError("message", "Escribí un mensaje.");
      else if (message.length < 10)  setError("message", "El mensaje es muy corto (mínimo 10 caracteres).");
      else if (message.length > 280) setError("message", "Máximo 280 caracteres.");

      ["name", "email", "message"].forEach(n => {
        if (!firstInvalid && errorEl(n).textContent) firstInvalid = n;
      });
      if (firstInvalid) {
        inputEl(firstInvalid).focus();
        return false;
      }
      return true;
    }

    ["name", "email", "message"].forEach(n => {
      inputEl(n).addEventListener("input", () => {
        clearError(n);
        if (n === "message") updateCharCount(true);
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (statusEl) statusEl.style.display = "none";

      if (!validate()) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });

        if (response.ok) {
          setStatus("¡Gracias! Tu mensaje se envió correctamente.", true);
          form.reset();
          updateCharCount();
        } else {
          const result = await response.json().catch(() => null);
          const msg = result && result.errors
            ? result.errors.map(err => err.message).join(", ")
            : "Ups, hubo un problema al enviar el mensaje.";
          setStatus(msg, false);
        }
      } catch (err) {
        setStatus("Error de conexión. Intentá de nuevo más tarde.", false);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Enviar";
      }
    });

    updateCharCount();
  }

  // Esperamos a que el DOM esté listo (el form está en el footer)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFooterForm);
  } else {
    initFooterForm();
  }
})();

/* ============================================================
   3) REPRODUCTOR DE MÚSICA
   ============================================================ */
const TRACK_SETS = [
  [
    { title: "Replica Auténtica",    src: "assets/music/replica-autentica.flac" },
    { title: "El exilio del bonsai", src: "assets/music/exilio-del-bonsai.flac" },
  ],
  [
    { title: "Witches",   src: "assets/music/witches.flac" },
    { title: "Alchemist", src: "assets/music/alchemist.flac" },
  ],
];

const ARTISTS = [
  {
    title:  "Riki",
    cover:  "assets/music/riki.jpg",
    tracks: TRACK_SETS[0],
  },
  {
    title:  "Good Kid",
    cover:  "assets/music/goodkid2.jpg",
    tracks: TRACK_SETS[1],
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const albumGrid = document.getElementById("albumGrid");
  const trackList = document.getElementById("trackList");
  const audio     = document.getElementById("audio");
  const nowCover  = document.getElementById("nowCover");
  const nowAlbum  = document.getElementById("nowAlbum");
  const nowTrack  = document.getElementById("nowTrack");

  // Solo inicializar reproductor si existe en la página
  if (!albumGrid) return;

  let currentArtistIndex = -1;
  let currentTrackIndex  = -1;

  function renderArtists() {
    albumGrid.innerHTML = "";

    ARTISTS.forEach((artist, i) => {
      const btn = document.createElement("button");
      btn.type      = "button";
      btn.className = "album";
      btn.setAttribute("aria-label", `Abrir ${artist.title}`);
      btn.innerHTML = `
        <img src="${artist.cover}" alt="Portada de ${artist.title}">
        <div class="album-title">${artist.title}</div>
      `;
      btn.addEventListener("click", () => selectArtist(i));
      albumGrid.appendChild(btn);
    });
  }

  function selectArtist(i) {
    currentArtistIndex = i;
    currentTrackIndex  = -1;

    const artist    = ARTISTS[i];
    nowCover.src    = artist.cover;
    nowCover.alt    = `Portada de ${artist.title}`;
    nowAlbum.textContent = artist.title;
    nowTrack.textContent = "";

    renderTracklist(artist);
    if (artist.tracks.length) playTrack(0);
  }

  function renderTracklist(artist) {
    trackList.innerHTML = "";
    artist.tracks.forEach((t, idx) => {
      const li = document.createElement("li");
      const b  = document.createElement("button");
      b.type        = "button";
      b.className   = "track";
      b.textContent = t.title;
      b.addEventListener("click", () => playTrack(idx));
      li.appendChild(b);
      trackList.appendChild(li);
    });
  }

  function playTrack(idx) {
    const artist = ARTISTS[currentArtistIndex];
    if (!artist) return;
    const track = artist.tracks[idx];
    if (!track)  return;

    currentTrackIndex    = idx;
    nowTrack.textContent = track.title;
    audio.src            = track.src;
    audio.play().catch(() => {});

    trackList.querySelectorAll(".track").forEach((el, i) => {
      el.classList.toggle("active", i === idx);
    });
  }

  audio.addEventListener("ended", () => {
    const artist = ARTISTS[currentArtistIndex];
    if (!artist) return;
    const next = currentTrackIndex + 1;
    if (next < artist.tracks.length) playTrack(next);
  });

  renderArtists();
});
