const defaultConfig = window.WEDDING_CONFIG || {};
const savedConfig = JSON.parse(localStorage.getItem("weddingConfig") || "null");
const project = JSON.parse(localStorage.getItem("temuundang-project") || "null");
const config = { ...defaultConfig, ...(savedConfig || {}) };
if (project) {
  config.names = { ...config.names, groom: project.groom, bride: project.bride, groomFull: project.groom, brideFull: project.bride };
  config.dateText = project.date;
  config.address = project.address;
  config.venue = project.venue;
  config.theme = project.theme || config.theme;
  if (project.groomPhoto) config.groomImage = project.groomPhoto;
  if (project.bridePhoto) config.brideImage = project.bridePhoto;
  if (project.background) config.heroImage = project.background;
  else if (project.photo) config.heroImage = project.photo;
}
const invitationParams = new URLSearchParams(location.search);
const linkedGroom = invitationParams.get("groom");
const linkedBride = invitationParams.get("bride");
const linkedTheme = invitationParams.get("theme");
if (linkedTheme) config.theme = linkedTheme;
if (linkedGroom || linkedBride) {
  config.names = {
    ...config.names,
    groom: linkedGroom || config.names.groom,
    bride: linkedBride || config.names.bride,
    groomFull: linkedGroom || config.names.groomFull,
    brideFull: linkedBride || config.names.brideFull
  };
}

function applyConfig() {
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
    if (value) element.innerHTML = value;
  });
  document.querySelectorAll("[data-config-href]").forEach((element) => {
    const value = config[element.dataset.configHref];
    if (value) element.href = value;
  });

  if (config.heroImage) document.querySelector(".hero-photo").style.backgroundImage = `linear-gradient(110deg, rgba(33,38,31,.12), transparent 55%), url("${config.heroImage}")`;
  if (config.groomImage) document.querySelector(".portrait-arga").style.backgroundImage = `url("${config.groomImage}")`;
  if (config.brideImage) document.querySelector(".portrait-rania").style.backgroundImage = `url("${config.brideImage}")`;
  if (config.eventImage) document.querySelector(".event-bg").style.backgroundImage = `linear-gradient(var(--event-overlay-start, rgba(48,57,46,.78)), var(--event-overlay-end, rgba(48,57,46,.88))), url("${config.eventImage}")`;
}
applyConfig();

const eventDate = new Date(config.dateISO || "2027-06-20T08:00:00+07:00").getTime();

function updateCountdown() {
  const distance = eventDate - Date.now();
  if (distance < 0) {
    document.querySelector(".countdown").innerHTML = '<div style="grid-column:1/-1"><strong style="font-size:32px">Hari Bahagia Telah Tiba</strong></div>';
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

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const form = document.getElementById("rsvp-form");
const toast = document.getElementById("toast");
const guestParam = new URLSearchParams(location.search).get("to");
if (guestParam) {
  const nameField = form.querySelector('[name="name"]');
  if (nameField) nameField.value = guestParam;
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const rsvp = {
    name: data.get("name"),
    attendance: data.get("attendance"),
    guests: data.get("guests"),
    message: data.get("message"),
    submittedAt: new Date().toISOString()
  };
  const responses = JSON.parse(localStorage.getItem("temuundang-rsvp") || "[]");
  responses.push(rsvp);
  localStorage.setItem("temuundang-rsvp", JSON.stringify(responses));
  const guests = JSON.parse(localStorage.getItem("temuundang-guests") || "[]");
  const matchingGuest = guests.find((guest) => guest.name.toLowerCase() === rsvp.name.toLowerCase());
  if (matchingGuest) {
    matchingGuest.status = rsvp.attendance;
    localStorage.setItem("temuundang-guests", JSON.stringify(guests));
  }
  toast.classList.add("show");
  form.reset();
  setTimeout(() => toast.classList.remove("show"), 3200);
});

const musicButton = document.getElementById("music-control");
let audioContext;
let masterGain;
let oscillators = [];

function startMusic() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.025;
  masterGain.connect(audioContext.destination);

  const notes = [261.63, 329.63, 392, 523.25];
  notes.forEach((frequency, index) => {
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

function stopMusic() {
  oscillators.forEach((oscillator) => oscillator.stop());
  oscillators = [];
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

musicButton.addEventListener("click", () => {
  const playing = musicButton.getAttribute("aria-pressed") === "true";
  if (playing) {
    stopMusic();
  } else {
    startMusic();
  }
  musicButton.setAttribute("aria-pressed", String(!playing));
  musicButton.setAttribute("aria-label", playing ? "Putar musik" : "Hentikan musik");
  musicButton.classList.toggle("playing", !playing);
});
