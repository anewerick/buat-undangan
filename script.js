const defaultConfig = window.WEDDING_CONFIG || {};
const invitationParams = new URLSearchParams(location.search);
const invitationId = invitationParams.get("invite");
const supabaseSettings = window.SUPABASE_CONFIG || {};
let supabaseClient = null;
let supabaseInitError = "";
if (supabaseSettings.url && supabaseSettings.anonKey) {
  try {
    if (!window.supabase) throw new Error("Supabase SDK gagal dimuat.");
    supabaseClient = window.supabase.createClient(supabaseSettings.url, supabaseSettings.anonKey);
  } catch (error) {
    supabaseInitError = error.message;
  }
}
let config = { ...defaultConfig, names: { ...(defaultConfig.names || {}) } };

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

function showInvitationError(message) {
  document.querySelector("main").hidden = true;
  document.title = "Undangan tidak tersedia | TemuUndang";
  const errorPanel = document.createElement("section");
  errorPanel.setAttribute("role", "alert");
  errorPanel.style.cssText = "min-height:100vh;display:grid;place-items:center;padding:32px;text-align:center;font:16px sans-serif;color:#2f332d;background:#f7f3ec";
  errorPanel.textContent = message;
  document.body.append(errorPanel);
  document.getElementById("music-control").remove();
}

function escapeCssUrl(value) {
  return JSON.stringify(String(value)).replace(/</g, "\\3c ");
}

function mergeProject(project) {
  if (!project) return;
  config.names = {
    ...config.names,
    groom: project.groom || config.names.groom,
    bride: project.bride || config.names.bride,
    groomFull: project.groomFull || project.groom || config.names.groomFull,
    brideFull: project.brideFull || project.bride || config.names.brideFull
  };
  config.dateText = project.date || config.dateText;
  config.dateISO = project.dateISO || config.dateISO;
  if (project.dateISO) {
    const [year, month, day] = project.dateISO.split("T")[0].split("-");
    config.dateShort = `${day} · ${month} · ${year}`;
  }
  config.akadTime = project.akadTime || config.akadTime;
  config.receptionTime = project.receptionTime || config.receptionTime;
  config.rsvpDeadline = project.rsvpDeadline || config.rsvpDeadline;
  config.address = project.address || config.address;
  config.venue = project.venue || config.venue;
  config.mapUrl = project.mapUrl || config.mapUrl;
  config.opening = project.opening || config.opening;
  config.groomParents = project.groomParents || config.groomParents;
  config.brideParents = project.brideParents || config.brideParents;
  config.story = project.story || config.story;
  config.galleryImages = project.galleryImages || config.galleryImages;
  config.musicUrl = project.musicUrl || "";
  config.theme = project.theme || config.theme;
  if (project.groomPhoto) config.groomImage = project.groomPhoto;
  if (project.bridePhoto) config.brideImage = project.bridePhoto;
  if (project.background) config.heroImage = project.background;
}

async function loadInvitation() {
  if (invitationId && supabaseClient) {
    const { data, error } = await supabaseClient
      .from("invitations")
      .select("data")
      .eq("id", invitationId)
      .single();
    if (error) {
      showInvitationError("Undangan belum dapat dimuat. Periksa koneksi atau tautan undangan.");
      return false;
    } else {
      mergeProject(data.data);
    }
  } else if (invitationId) {
    showInvitationError(supabaseInitError || "Data undangan belum terhubung. Pengelola perlu mengatur Supabase.");
    return false;
  } else {
    try {
      mergeProject(JSON.parse(localStorage.getItem("temuundang-project") || "null"));
    } catch (error) {
      showToast("Data pratinjau lokal tidak dapat dibaca.");
    }
  }

  const linkedTheme = invitationParams.get("theme");
  const linkedGroom = invitationParams.get("groom");
  const linkedBride = invitationParams.get("bride");
  if (linkedTheme) config.theme = linkedTheme;
  if (!invitationId && (linkedGroom || linkedBride)) {
    config.names = {
      ...config.names,
      groom: linkedGroom || config.names.groom,
      bride: linkedBride || config.names.bride,
      groomFull: linkedGroom || config.names.groomFull,
      brideFull: linkedBride || config.names.brideFull
    };
  }
  return true;
}

function applyConfig() {
  document.title = `The Wedding of ${config.names.groom} & ${config.names.bride}`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = `Undangan pernikahan ${config.names.groom} & ${config.names.bride}`;
  document.body.dataset.theme = config.theme || "elegant-sage";
  document.querySelectorAll("[data-config]").forEach((element) => {
    const key = element.dataset.config;
    const value = key === "groom" ? config.names.groom
      : key === "bride" ? config.names.bride
      : key === "groomFull" ? config.names.groomFull
      : key === "brideFull" ? config.names.brideFull
      : config[key];
    if (value !== undefined) element.textContent = value;
  });
  document.querySelectorAll("[data-config-html]").forEach((element) => {
    const value = config[element.dataset.configHtml];
    if (value !== undefined) {
      element.textContent = String(value).replace(/<br\s*\/?>/gi, "\n");
      element.style.whiteSpace = "pre-line";
    }
  });
  document.querySelectorAll("[data-config-href]").forEach((element) => {
    const value = config[element.dataset.configHref];
    if (value) {
      try {
        const url = new URL(value, location.href);
        if (url.protocol === "https:" || url.protocol === "http:") element.href = url.href;
      } catch (error) {
        showToast("Tautan lokasi tidak valid.");
      }
    }
  });
  if (Array.isArray(config.story)) {
    document.querySelectorAll(".timeline-item").forEach((element, index) => {
      const story = config.story[index];
      if (!story) return;
      element.querySelector("time").textContent = story.year || "";
      element.querySelector("h3").textContent = story.title || "";
      element.querySelector("p").textContent = story.description || "";
    });
  }
  if (Array.isArray(config.galleryImages)) {
    document.querySelectorAll(".gallery-item").forEach((element, index) => {
      const image = config.galleryImages[index];
      if (image) element.style.backgroundImage = `url(${escapeCssUrl(image)})`;
    });
  }
  const music = document.getElementById("background-music");
  if (config.musicUrl) music.src = config.musicUrl;

  const hero = document.querySelector(".hero-photo");
  if (config.heroImage) hero.style.backgroundImage = `linear-gradient(110deg, rgba(33,38,31,.12), transparent 55%), url(${escapeCssUrl(config.heroImage)})`;
  if (config.groomImage) document.querySelector(".portrait-arga").style.backgroundImage = `url(${escapeCssUrl(config.groomImage)})`;
  if (config.brideImage) document.querySelector(".portrait-rania").style.backgroundImage = `url(${escapeCssUrl(config.brideImage)})`;
  if (config.eventImage) {
    document.querySelector(".event-bg").style.backgroundImage = `linear-gradient(var(--event-overlay-start, rgba(48,57,46,.78)), var(--event-overlay-end, rgba(48,57,46,.88))), url(${escapeCssUrl(config.eventImage)})`;
  }
}

function initCountdown() {
  const eventDate = new Date(config.dateISO || "2027-06-20T08:00:00+07:00").getTime();
  const countdown = document.querySelector(".countdown");
  function updateCountdown() {
    const distance = eventDate - Date.now();
    if (distance < 0) {
      countdown.textContent = "Hari Bahagia Telah Tiba";
      return;
    }
    const day = 1000 * 60 * 60 * 24;
    const hour = 1000 * 60 * 60;
    const minute = 1000 * 60;
    document.getElementById("days").textContent = String(Math.floor(distance / day)).padStart(3, "0");
    document.getElementById("hours").textContent = String(Math.floor((distance % day) / hour)).padStart(2, "0");
    document.getElementById("minutes").textContent = String(Math.floor((distance % hour) / minute)).padStart(2, "0");
    document.getElementById("seconds").textContent = String(Math.floor((distance % minute) / 1000)).padStart(2, "0");
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function initRevealAnimations() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function initRsvp() {
  const form = document.getElementById("rsvp-form");
  const guestName = invitationParams.get("to");
  if (guestName) form.querySelector('[name="name"]').value = guestName;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const rsvp = {
      guest_name: String(data.get("name") || "").trim(),
      attendance: data.get("attendance"),
      guest_count: Number(data.get("guests")),
      message: String(data.get("message") || "").trim()
    };

    if (invitationId) {
      if (!supabaseClient) {
        showToast("RSVP belum tersedia. Pengelola perlu mengatur Supabase.");
        return;
      }
      const { error } = await supabaseClient.from("rsvps").insert({
        invitation_id: invitationId,
        ...rsvp
      });
      if (error) {
        showToast(`RSVP gagal dikirim: ${error.message}`);
        return;
      }
      showToast("Konfirmasi berhasil dikirim");
      form.reset();
      return;
    }

    try {
      const responses = JSON.parse(localStorage.getItem("temuundang-rsvp") || "[]");
      responses.push({ ...rsvp, submitted_at: new Date().toISOString() });
      localStorage.setItem("temuundang-rsvp", JSON.stringify(responses));
      showToast("RSVP pratinjau tersimpan hanya di perangkat ini");
      form.reset();
    } catch (error) {
      showToast("RSVP tidak dapat disimpan di perangkat ini.");
    }
  });
}

function initMusic() {
  const musicButton = document.getElementById("music-control");
  const audio = document.getElementById("background-music");
  let audioContext;
  let oscillators = [];

  function stopMusic() {
    oscillators.forEach((oscillator) => oscillator.stop());
    oscillators = [];
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
  }

  musicButton.addEventListener("click", async () => {
    const playing = musicButton.getAttribute("aria-pressed") === "true";
    if (audio.src) {
      if (playing) {
        audio.pause();
      } else {
        try {
          await audio.play();
        } catch (error) {
          showToast("Musik tidak dapat diputar. Periksa URL file audio.");
          return;
        }
      }
      musicButton.setAttribute("aria-pressed", String(!playing));
      musicButton.setAttribute("aria-label", playing ? "Putar musik" : "Hentikan musik");
      musicButton.classList.toggle("playing", !playing);
      return;
    }
    if (playing) {
      stopMusic();
    } else {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        showToast("Browser ini tidak mendukung pemutar musik.");
        return;
      }
      audioContext = new AudioContext();
      const masterGain = audioContext.createGain();
      masterGain.gain.value = 0.025;
      masterGain.connect(audioContext.destination);
      [261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = index % 2 ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.value = 0.22;
        oscillator.connect(gain);
        gain.connect(masterGain);
        oscillator.start();
        oscillators.push(oscillator);
      });
    }
    musicButton.setAttribute("aria-pressed", String(!playing));
    musicButton.setAttribute("aria-label", playing ? "Putar musik" : "Hentikan musik");
    musicButton.classList.toggle("playing", !playing);
  });
}

async function init() {
  if (!await loadInvitation()) return;
  applyConfig();
  initCountdown();
  initRevealAnimations();
  initRsvp();
  initMusic();
}

init().catch((error) => {
  showInvitationError(`Halaman undangan gagal dimuat: ${error.message}`);
});
