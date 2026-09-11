// ============================================================
// REPRODUCTOR DE MÚSICA
// ============================================================
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