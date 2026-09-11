// 1) Configuracion visual con persistencia
(function () {
  "use strict";
  const TRANSPARENCY_KEY = "uiNoTransparency";
  const ROUNDED_KEY = "uiNoRounded";

  function readBool(key) {
    return localStorage.getItem(key) === "1";
  }

  function writeBool(key, value) {
    localStorage.setItem(key, value ? "1" : "0");
  }

  function initAppearanceToggles() {
    const styleBtn = document.getElementById("toggleStyleBtn");
    if (!styleBtn) return;

    function applyState() {
      const noTransparency = readBool(TRANSPARENCY_KEY);
      const noRounded = readBool(ROUNDED_KEY);
      document.body.classList.toggle("no-transparency", noTransparency);
      document.body.classList.toggle("no-rounded", noRounded);
      const disabled = noTransparency && noRounded;
      styleBtn.textContent = disabled
        ? "Activar transparencia y bordes redondeados"
        : "Desactivar transparencia y bordes redondeados";
    }

    styleBtn.addEventListener("click", function () {
      const disableAll = !(readBool(TRANSPARENCY_KEY) && readBool(ROUNDED_KEY));
      writeBool(TRANSPARENCY_KEY, disableAll);
      writeBool(ROUNDED_KEY, disableAll);
      applyState();
    });

    applyState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAppearanceToggles);
  } else {
    initAppearanceToggles();
  }
})();

// 2) XKCD del dia + link de navegacion
(function () {
  "use strict";
  const XKCD_DAY_KEY = "xkcdDelDia";

  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function hashDate(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i += 1) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  async function fetchJsonWithFallback(url) {
    try {
      const direct = await fetch(url);
      if (direct.ok) return direct.json();
    } catch (e) {}

    const proxied = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
    if (!proxied.ok) throw new Error("No se pudo leer XKCD");
    return proxied.json();
  }

  async function fetchLatestComic() {
    return fetchJsonWithFallback("https://xkcd.com/info.0.json");
  }

  async function getXkcdOfTheDay() {
    const today = todayStr();
    try {
      const saved = JSON.parse(localStorage.getItem(XKCD_DAY_KEY));
      if (saved && saved.fecha === today && Number.isInteger(saved.num) && saved.num > 0) {
        return saved.num;
      }
    } catch (e) {}

    const latest = await fetchLatestComic();
    const maxNum = latest.num;
    const num = (hashDate(today) % maxNum) + 1;
    try {
      localStorage.setItem(XKCD_DAY_KEY, JSON.stringify({ fecha: today, num: num }));
    } catch (e) {}
    return num;
  }

  async function fetchComicByNum(num) {
    return fetchJsonWithFallback("https://xkcd.com/" + num + "/info.0.json");
  }

  async function initXkcdCard() {
    const card = document.getElementById("xkcdCard");
    const nav = document.getElementById("xkcdNavLink");
    if (!card && !nav) return;

    try {
      const num = await getXkcdOfTheDay();
      if (nav) nav.href = "xkcd.html?num=" + num;

      if (!card) return;
      const link = document.getElementById("xkcdLink");
      const thumb = document.getElementById("xkcdThumb");
      const title = document.getElementById("xkcdTitle");
      const idEl = document.getElementById("xkcdId");
      if (link) link.href = "xkcd.html?num=" + num;

      const comic = await fetchComicByNum(num);
      if (title) title.textContent = comic.title;
      if (idEl) idEl.textContent = "#" + comic.num;
      if (thumb) {
        thumb.innerHTML = "";
        const img = document.createElement("img");
        img.src = comic.img;
        img.alt = comic.alt || comic.title;
        thumb.appendChild(img);
      }
    } catch (e) {
      const title = document.getElementById("xkcdTitle");
      if (title) title.textContent = "No disponible";
    }
  }

  async function initXkcdPage() {
    const container = document.getElementById("xkcdPage");
    if (!container) return;

    const params = new URLSearchParams(location.search);
    const fromUrl = parseInt(params.get("num"), 10);
    const num = Number.isInteger(fromUrl) && fromUrl > 0 ? fromUrl : await getXkcdOfTheDay();

    try {
      const comic = await fetchComicByNum(num);
      document.getElementById("xkcdPageTitleMain").textContent = comic.title;
      document.getElementById("xkcdPageMeta").textContent = "#" + comic.num + " - " + comic.day + "/" + comic.month + "/" + comic.year;
      const img = document.getElementById("xkcdPageImg");
      img.src = comic.img;
      img.alt = comic.alt || comic.title;
      document.getElementById("xkcdPageAlt").textContent = comic.alt || "";
      document.getElementById("xkcdPermalink").href = "https://xkcd.com/" + comic.num + "/";
    } catch (e) {
      container.innerHTML = "<section class='card'><h2>Error</h2><p>No se pudo cargar el comic de XKCD.</p></section>";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initXkcdCard();
      initXkcdPage();
    });
  } else {
    initXkcdCard();
    initXkcdPage();
  }
})();

// 3) Fallback visual para assets faltantes
(function () {
  function attachFallback(img) {
    img.addEventListener("error", function () {
      const box = document.createElement("div");
      box.className = "asset";
      box.textContent = img.getAttribute("src") || "asset faltante";
      if (img.width) box.style.width = img.width + "px";
      if (img.height) box.style.height = img.height + "px";
      img.replaceWith(box);
    });
  }

  function initFallbacks() {
    document.querySelectorAll("img").forEach(attachFallback);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFallbacks);
  } else {
    initFallbacks();
  }
})();

// 4) Validacion de formulario + envio real
(function () {
  "use strict";

  function initFooterForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const statusEl = document.getElementById("formStatus");
    const submitBtn = form.querySelector("button[type='submit']");
    const msgInput = form.querySelector("input[name='message']");
    const charCount = form.querySelector(".char-count");
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function inputEl(name) { return form.querySelector("input[name='" + name + "']"); }
    function errorEl(name) { return form.querySelector("[data-error-for='" + name + "']"); }
    function setError(name, msg) { const e = errorEl(name); if (e) e.textContent = msg; }
    function clearError(name) { const e = errorEl(name); if (e) e.textContent = ""; }

    function updateCount(forceShow) {
      if (!charCount || !msgInput) return;
      const max = msgInput.maxLength || 280;
      charCount.textContent = msgInput.value.length + "/" + max;
      charCount.style.display = (forceShow || msgInput.value.length > 0) ? "" : "none";
    }

    function validate() {
      ["name", "email", "message"].forEach(clearError);
      let valid = true;
      const name = inputEl("name").value.trim();
      const email = inputEl("email").value.trim();
      const message = inputEl("message").value.trim();

      if (!name) { setError("name", "Escribi tu nombre."); valid = false; }
      else if (name.length < 2) { setError("name", "Minimo 2 caracteres."); valid = false; }

      if (!email) { setError("email", "Escribi tu email."); valid = false; }
      else if (!EMAIL_RE.test(email)) { setError("email", "Email invalido."); valid = false; }

      if (!message) { setError("message", "Escribi un mensaje."); valid = false; }
      else if (message.length < 10) { setError("message", "Minimo 10 caracteres."); valid = false; }

      return valid;
    }

    ["name", "email", "message"].forEach(function (n) {
      const input = inputEl(n);
      if (!input) return;
      input.addEventListener("input", function () {
        clearError(n);
        if (n === "message") updateCount(true);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.style.color = "#8fffbe";
        statusEl.textContent = "Enviando...";
      }
      submitBtn.disabled = true;
      HTMLFormElement.prototype.submit.call(form);
    });

    updateCount(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFooterForm);
  } else {
    initFooterForm();
  }
})();