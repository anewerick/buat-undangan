const marketing = document.getElementById("marketing");
const dashboard = document.getElementById("dashboard");
const workspace = document.getElementById("workspace");
const authGate = document.getElementById("auth-gate");
const dashboardShell = document.getElementById("dashboard-shell");
const authMessage = document.getElementById("auth-message");
const toast = document.getElementById("toast-app");
const settings = window.SUPABASE_CONFIG || {};
let supabaseClient = null;
let supabaseInitError = "";
if (settings.url && settings.anonKey) {
  try {
    if (!window.supabase) throw new Error("Supabase SDK gagal dimuat.");
    supabaseClient = window.supabase.createClient(settings.url, settings.anonKey);
  } catch (error) {
    supabaseInitError = error.message;
  }
}
const themes = {
  "elegant-sage": "Elegant Sage",
  "garden-romance": "Garden Romance",
  "classic-ivory": "Classic Ivory",
  "forest-gold": "Forest & Gold",
  "modern-bloom": "Modern Bloom",
  "soft-minimal": "Soft Minimal"
};
const defaultStory = [
  { year: "2019", title: "Pertemuan Pertama", description: "Sebuah percakapan singkat menjadi awal dari kisah yang tak pernah kami duga." },
  { year: "2023", title: "Memutuskan Bersama", description: "Di bawah langit senja, kami berjanji untuk melangkah bersama menuju masa depan." },
  { year: "2027", title: "Hari Bahagia", description: "Menjadi pasangan hidup adalah bab baru yang paling indah untuk kami tuliskan." }
];
let currentUser = null;
let invitations = [];
let currentInvitation = null;
let recoveryMode = false;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

function escapeHtml(value = "") {
  const element = document.createElement("div");
  element.textContent = String(value);
  return element.innerHTML;
}

function getThemeName(theme) {
  return themes[theme] || themes["elegant-sage"];
}

function getSavedProject() {
  try {
    return JSON.parse(localStorage.getItem("temuundang-project") || "null") || { groom: "Arga", bride: "Rania" };
  } catch (error) {
    showToast("Data undangan lokal tidak dapat dibaca; gunakan data awal atau buat undangan baru.");
    return { groom: "Arga", bride: "Rania" };
  }
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getInvitationUrl(project, guestName, invitationId, slug) {
  const baseUrl = location.hostname === "anewerick.github.io"
    ? "https://anewerick.github.io/buat-undangan/"
    : new URL("./", location.href).href;
  const url = new URL("invitation.html", baseUrl);
  const coupleSlug = slug || [slugify(project.groom), slugify(project.bride)].filter(Boolean).join("-") || "undangan";
  url.searchParams.set("couple", coupleSlug);
  if (invitationId) url.searchParams.set("invite", invitationId);
  if (project.groom) url.searchParams.set("groom", project.groom);
  if (project.bride) url.searchParams.set("bride", project.bride);
  if (project.theme) url.searchParams.set("theme", project.theme);
  if (guestName) url.searchParams.set("to", guestName);
  return url.href;
}

function updateOpenWebsiteLink() {
  const link = document.getElementById("open-public-invitation");
  const project = currentInvitation ? currentInvitation.data : getSavedProject();
  link.href = getInvitationUrl(project, null, currentInvitation && currentInvitation.id, currentInvitation && currentInvitation.slug);
}

function showAuthGate(message) {
  authGate.hidden = false;
  dashboardShell.hidden = true;
  document.getElementById("account-email").hidden = true;
  document.getElementById("sign-out").hidden = true;
  document.getElementById("open-public-invitation").hidden = true;
  authMessage.textContent = message;
}

async function loadInvitations() {
  const { data, error } = await supabaseClient
    .from("invitations")
    .select("id, slug, data, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  invitations = data || [];
  if (currentInvitation) {
    currentInvitation = invitations.find((item) => item.id === currentInvitation.id) || null;
  }
}

async function openDashboard(view = "projects") {
  marketing.style.display = "none";
  dashboard.classList.add("active");
  document.title = "Dashboard Undangan | TemuUndang";

  if (!supabaseClient) {
    showAuthGate(supabaseInitError || "Supabase belum dikonfigurasi. Isi URL dan anon key Supabase di config.js setelah menjalankan skema database.");
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      showAuthGate("Masuk atau buat akun untuk mengelola undangan dan RSVP.");
      return;
    }

    currentUser = data.session.user;
    authGate.hidden = true;
    dashboardShell.hidden = false;
    document.getElementById("account-email").textContent = currentUser.email || "";
    document.getElementById("account-email").hidden = false;
    document.getElementById("sign-out").hidden = false;
    document.getElementById("open-public-invitation").hidden = false;
    await loadInvitations();
    renderView(view);
  } catch (error) {
    showAuthGate(`Gagal memuat dashboard: ${error.message}`);
  }
}

function closeDashboard(event) {
  if (event) event.preventDefault();
  dashboard.classList.remove("active");
  marketing.style.display = "block";
  document.title = "TemuUndang — Undangan Digital";
}

document.getElementById("open-dashboard").onclick = () => openDashboard();
document.getElementById("create-project").onclick = () => openDashboard("editor");
document.getElementById("dashboard-close").onclick = closeDashboard;
document.getElementById("back-home").onclick = closeDashboard;

document.querySelectorAll(".theme-card").forEach((card) => {
  const choose = () => {
    const project = getSavedProject();
    project.theme = card.dataset.theme;
    localStorage.setItem("temuundang-project", JSON.stringify(project));
    currentInvitation = null;
    openDashboard("editor");
    showToast(`${getThemeName(project.theme)} dipilih`);
  };
  card.onclick = choose;
  card.onkeydown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose();
    }
  };
});

document.querySelectorAll(".sidebar button").forEach((button) => {
  button.onclick = async () => {
    document.querySelectorAll(".sidebar button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    try {
      await loadInvitations();
      renderView(button.dataset.view);
    } catch (error) {
      showToast(`Gagal memuat data: ${error.message}`);
    }
  };
});

document.getElementById("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) return;
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  if (recoveryMode) {
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) {
      authMessage.textContent = `Gagal memperbarui kata sandi: ${error.message}`;
      return;
    }
    recoveryMode = false;
    document.querySelector('#auth-form [type="submit"]').textContent = "Masuk";
    document.getElementById("sign-up").hidden = false;
    document.getElementById("reset-password").hidden = false;
    await openDashboard();
    return;
  }
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    authMessage.textContent = `Gagal masuk: ${error.message}`;
    return;
  }
  await openDashboard();
});

document.getElementById("sign-up").onclick = async () => {
  if (!supabaseClient) return;
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  if (!email || password.length < 8) {
    authMessage.textContent = "Masukkan email dan kata sandi minimal 8 karakter.";
    return;
  }
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    authMessage.textContent = `Gagal membuat akun: ${error.message}`;
    return;
  }
  if (!data.session) {
    authMessage.textContent = "Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.";
    return;
  }
  await openDashboard();
};

document.getElementById("reset-password").onclick = async () => {
  if (!supabaseClient) return;
  const email = document.getElementById("auth-email").value.trim();
  if (!email) {
    authMessage.textContent = "Masukkan email akun untuk menerima tautan reset kata sandi.";
    return;
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: new URL("./", location.href).href });
  authMessage.textContent = error
    ? `Gagal mengirim tautan reset: ${error.message}`
    : "Jika email terdaftar, tautan reset akan dikirim. Periksa kotak masuk Anda.";
};

document.getElementById("sign-out").onclick = async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    showToast(`Gagal keluar: ${error.message}`);
    return;
  }
  currentUser = null;
  invitations = [];
  currentInvitation = null;
  showAuthGate("Anda sudah keluar. Masuk kembali untuk mengelola undangan.");
};

function renderProjects() {
  updateOpenWebsiteLink();
  const cards = invitations.map((invitation) => {
    const project = invitation.data || {};
    const url = getInvitationUrl(project, null, invitation.id, invitation.slug);
    return `<article class="project-card"><div class="project-cover"></div><div class="project-info"><h3>${escapeHtml(project.groom || "Mempelai Pria")} &amp; ${escapeHtml(project.bride || "Mempelai Wanita")}</h3><p>${escapeHtml(getThemeName(project.theme))} · Diperbarui ${new Date(invitation.updated_at).toLocaleDateString("id-ID")}</p><div class="project-actions"><a href="${escapeHtml(url)}" target="_blank" rel="noopener">Buka</a><button class="edit-project" data-id="${escapeHtml(invitation.id)}">Edit</button><button class="copy-link" data-id="${escapeHtml(invitation.id)}">Salin Tautan</button><button class="delete-project" data-id="${escapeHtml(invitation.id)}" aria-label="Hapus undangan">Hapus</button></div></div></article>`;
  }).join("");

  workspace.innerHTML = `<div class="workspace-head"><h1>Proyek Saya</h1><button class="btn" id="new-project">+ Undangan Baru</button></div>${cards ? `<div class="project-grid">${cards}</div>` : '<p class="empty-state">Belum ada undangan. Buat undangan pertama Anda.</p>'}`;
  document.getElementById("new-project").onclick = () => {
    currentInvitation = null;
    renderView("editor");
  };
  workspace.querySelectorAll(".edit-project").forEach((button) => {
    button.onclick = () => {
      currentInvitation = invitations.find((item) => item.id === button.dataset.id) || null;
      renderView("editor");
    };
  });
  workspace.querySelectorAll(".copy-link").forEach((button) => {
    button.onclick = async () => {
      const invitation = invitations.find((item) => item.id === button.dataset.id);
      if (!invitation) return;
      await copyText(getInvitationUrl(invitation.data, null, invitation.id, invitation.slug), "Tautan undangan disalin");
    };
  });
  workspace.querySelectorAll(".delete-project").forEach((button) => {
    button.onclick = async () => {
      const invitation = invitations.find((item) => item.id === button.dataset.id);
      if (!invitation || !window.confirm(`Hapus undangan ${invitation.data.groom || ""} & ${invitation.data.bride || ""}? Tamu dan RSVP terkait juga akan dihapus.`)) return;
      const { error } = await supabaseClient.from("invitations").delete().eq("id", invitation.id);
      if (error) {
        showToast(`Gagal menghapus undangan: ${error.message}`);
        return;
      }
      invitations = invitations.filter((item) => item.id !== invitation.id);
      if (currentInvitation && currentInvitation.id === invitation.id) currentInvitation = null;
      updateOpenWebsiteLink();
      renderProjects();
      showToast("Undangan dihapus");
    };
  });
}

function renderEditor() {
  const saved = currentInvitation ? currentInvitation.data : getSavedProject();
  const themeOptions = Object.entries(themes).map(([id, name]) =>
    `<option value="${id}" ${saved.theme === id ? "selected" : ""}>${name}</option>`
  ).join("");
  const dateValue = String(saved.dateISO || "2027-06-20T08:00").slice(0, 16);
  const story = defaultStory.map((item, index) => ({ ...item, ...((saved.story || [])[index] || {}) }));
  const storyFields = story.map((item, index) => `<fieldset class="story-editor"><legend>Cerita ${index + 1}</legend><label>Tahun<input id="story-year-${index}" value="${escapeHtml(item.year)}"></label><label>Judul<input id="story-title-${index}" value="${escapeHtml(item.title)}"></label><label>Cerita<textarea id="story-description-${index}" rows="2">${escapeHtml(item.description)}</textarea></label></fieldset>`).join("");
  const galleryFields = Array.from({ length: 4 }, (_, index) => `<label>Foto galeri ${index + 1} (URL)<input id="gallery-${index}" type="url" value="${escapeHtml((saved.galleryImages || [])[index] || "")}" placeholder="https://..."></label>`).join("");
  const previewUrl = getInvitationUrl(saved, null, currentInvitation && currentInvitation.id, currentInvitation && currentInvitation.slug);
  workspace.innerHTML = `<div class="workspace-head"><h1>Editor Undangan</h1><button class="btn" id="save-project">Simpan Perubahan</button></div><div class="editor-grid"><div class="form-card">
    <label>Nama mempelai pria<input id="groom" value="${escapeHtml(saved.groom || "Arga")}" required></label>
    <label>Nama mempelai wanita<input id="bride" value="${escapeHtml(saved.bride || "Rania")}" required></label>
    <label>Nama lengkap mempelai pria<input id="groomFull" value="${escapeHtml(saved.groomFull || saved.groom || "Arga Wijaya")}"></label>
    <label>Nama lengkap mempelai wanita<input id="brideFull" value="${escapeHtml(saved.brideFull || saved.bride || "Rania Putri")}"></label>
    <label>Orang tua mempelai pria<textarea id="groomParents" rows="2">${escapeHtml(saved.groomParents || "Putra pertama dari\nBapak Hadi Wijaya & Ibu Maya Sari")}</textarea></label>
    <label>Orang tua mempelai wanita<textarea id="brideParents" rows="2">${escapeHtml(saved.brideParents || "Putri kedua dari\nBapak Dimas Pratama & Ibu Lina Kartika")}</textarea></label>
    <label>Tema undangan<select id="theme">${themeOptions}</select></label>
    <label>Tanggal dan waktu acara<input id="dateISO" type="datetime-local" value="${escapeHtml(dateValue)}" required></label>
    <label>Waktu akad<input id="akadTime" value="${escapeHtml(saved.akadTime || "08.00 – 10.00 WIB")}"></label>
    <label>Waktu resepsi<input id="receptionTime" value="${escapeHtml(saved.receptionTime || "11.00 – 14.00 WIB")}"></label>
    <label>Batas konfirmasi RSVP<input id="rsvpDeadline" value="${escapeHtml(saved.rsvpDeadline || "10 Juni 2027")}"></label>
    <label>Lokasi acara<input id="venue" value="${escapeHtml(saved.venue || "The Glass House")}"></label>
    <label>Alamat<input id="address" value="${escapeHtml(saved.address || "Jl. Melati Raya No. 88, Jakarta Selatan")}"></label>
    <label>Tautan Google Maps<input id="mapUrl" type="url" value="${escapeHtml(saved.mapUrl || "https://maps.google.com")}"></label>
    <label>Foto pengantin pria<input id="groomPhotoUrl" type="url" placeholder="URL foto atau gunakan unggah" value="${escapeHtml(saved.groomPhoto || "")}"></label>
    <label>Unggah foto pria<input id="groomPhotoFile" type="file" accept="image/*"></label>
    <label>Foto pengantin wanita<input id="bridePhotoUrl" type="url" placeholder="URL foto atau gunakan unggah" value="${escapeHtml(saved.bridePhoto || "")}"></label>
    <label>Unggah foto wanita<input id="bridePhotoFile" type="file" accept="image/*"></label>
    <label>Background undangan<input id="backgroundUrl" type="url" placeholder="URL gambar background" value="${escapeHtml(saved.background || saved.photo || "")}"></label>
    <label>Unggah background<input id="backgroundFile" type="file" accept="image/*"></label>
    <label>Ucapan pembuka<textarea id="opening" rows="3">${escapeHtml(saved.opening || "Dengan penuh sukacita, kami mengundang Anda untuk merayakan hari bahagia kami.")}</textarea></label>
    ${storyFields}
    <h2>Foto Galeri</h2>${galleryFields}
    <label>URL musik latar (opsional)<input id="musicUrl" type="url" value="${escapeHtml(saved.musicUrl || "")}" placeholder="URL file audio MP3"></label>
  </div><div class="preview-card"><iframe title="Pratinjau undangan" class="preview-frame" id="preview" src="${escapeHtml(previewUrl)}"></iframe></div></div>`;

  function readImage(fieldId, targetId) {
    const input = document.getElementById(fieldId);
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showToast("Pilih file gambar yang valid");
        input.value = "";
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        showToast("Ukuran tiap foto maksimal 3 MB");
        input.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => showToast("Gagal membaca file gambar");
      reader.onload = () => { document.getElementById(targetId).value = reader.result; };
      reader.readAsDataURL(file);
    };
  }
  readImage("groomPhotoFile", "groomPhotoUrl");
  readImage("bridePhotoFile", "bridePhotoUrl");
  readImage("backgroundFile", "backgroundUrl");

  document.getElementById("save-project").onclick = async () => {
    const groom = document.getElementById("groom").value.trim();
    const bride = document.getElementById("bride").value.trim();
    const dateInput = document.getElementById("dateISO").value;
    if (!groom || !bride || !dateInput) {
      showToast("Nama mempelai dan tanggal acara wajib diisi");
      return;
    }
    const dateISO = `${dateInput}:00+07:00`;
    const project = {
      groom,
      bride,
      groomFull: document.getElementById("groomFull").value.trim(),
      brideFull: document.getElementById("brideFull").value.trim(),
      groomParents: document.getElementById("groomParents").value.trim(),
      brideParents: document.getElementById("brideParents").value.trim(),
      theme: document.getElementById("theme").value,
      dateISO,
      date: new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "Asia/Jakarta" }).format(new Date(dateISO)),
      akadTime: document.getElementById("akadTime").value.trim(),
      receptionTime: document.getElementById("receptionTime").value.trim(),
      rsvpDeadline: document.getElementById("rsvpDeadline").value.trim(),
      venue: document.getElementById("venue").value.trim(),
      address: document.getElementById("address").value.trim(),
      mapUrl: document.getElementById("mapUrl").value.trim(),
      groomPhoto: document.getElementById("groomPhotoUrl").value.trim(),
      bridePhoto: document.getElementById("bridePhotoUrl").value.trim(),
      background: document.getElementById("backgroundUrl").value.trim(),
      opening: document.getElementById("opening").value.trim(),
      story: defaultStory.map((item, index) => ({
        year: document.getElementById(`story-year-${index}`).value.trim(),
        title: document.getElementById(`story-title-${index}`).value.trim(),
        description: document.getElementById(`story-description-${index}`).value.trim()
      })),
      galleryImages: Array.from({ length: 4 }, (_, index) => document.getElementById(`gallery-${index}`).value.trim()),
      musicUrl: document.getElementById("musicUrl").value.trim()
    };
    const slug = `${slugify(groom)}-${slugify(bride)}-${Math.random().toString(36).slice(2, 7)}`;
    let response;
    if (currentInvitation) {
      response = await supabaseClient.from("invitations").update({ slug, data: project }).eq("id", currentInvitation.id).select("id, slug, data, created_at, updated_at").single();
    } else {
      response = await supabaseClient.from("invitations").insert({ owner_id: currentUser.id, slug, data: project }).select("id, slug, data, created_at, updated_at").single();
    }
    if (response.error) {
      showToast(`Gagal menyimpan undangan: ${response.error.message}`);
      return;
    }
    currentInvitation = response.data;
    const savedIndex = invitations.findIndex((item) => item.id === response.data.id);
    if (savedIndex < 0) invitations.unshift(response.data);
    else invitations[savedIndex] = response.data;
    updateOpenWebsiteLink();
    const nextPreviewUrl = new URL(getInvitationUrl(project, null, currentInvitation.id, currentInvitation.slug));
    nextPreviewUrl.searchParams.set("preview", Date.now());
    document.getElementById("preview").src = nextPreviewUrl.href;
    showToast("Undangan berhasil disimpan");
  };
}

async function renderGuests() {
  if (!currentInvitation && invitations.length) currentInvitation = invitations[0];
  const projectPicker = invitations.map((item) => {
    const project = item.data || {};
    return `<option value="${escapeHtml(item.id)}" ${currentInvitation && currentInvitation.id === item.id ? "selected" : ""}>${escapeHtml(project.groom || "Mempelai Pria")} &amp; ${escapeHtml(project.bride || "Mempelai Wanita")}</option>`;
  }).join("");
  workspace.innerHTML = `<div class="workspace-head"><h1>Daftar Tamu & RSVP</h1><button class="btn" id="export-guests">Ekspor CSV</button></div>${invitations.length ? `<label class="invitation-picker">Pilih undangan<select id="guest-invitation">${projectPicker}</select></label><div class="guest-tools"><input id="guest-name" placeholder="Nama tamu" aria-label="Nama tamu"><input id="guest-phone" type="tel" placeholder="Nomor WhatsApp" aria-label="Nomor WhatsApp"><button class="btn" id="add-guest">Tambah</button></div><div id="guest-data"></div>` : '<p class="empty-state">Buat undangan terlebih dahulu untuk menambahkan tamu.</p>'}`;
  if (!invitations.length) return;
  document.getElementById("guest-invitation").onchange = (event) => {
    currentInvitation = invitations.find((item) => item.id === event.target.value) || null;
    updateOpenWebsiteLink();
    renderGuests();
  };
  const { data: guests, error: guestError } = await supabaseClient
    .from("guests")
    .select("id, name, phone, created_at")
    .eq("invitation_id", currentInvitation.id)
    .order("created_at", { ascending: true });
  if (guestError) {
    showToast(`Gagal memuat daftar tamu: ${guestError.message}`);
    return;
  }
  const { data: rsvps, error: rsvpError } = await supabaseClient
    .from("rsvps")
    .select("id, guest_name, attendance, guest_count, message, submitted_at")
    .eq("invitation_id", currentInvitation.id)
    .order("submitted_at", { ascending: false });
  if (rsvpError) {
    showToast(`Gagal memuat RSVP: ${rsvpError.message}`);
    return;
  }
  const responseByName = new Map();
  (rsvps || []).forEach((rsvp) => {
    const key = rsvp.guest_name.toLocaleLowerCase();
    if (!responseByName.has(key)) responseByName.set(key, rsvp);
  });
  document.getElementById("guest-data").innerHTML = `<h2>Tamu Undangan</h2><table class="guest-table"><thead><tr><th>Nama</th><th>WhatsApp</th><th>Status RSVP</th><th>Tautan</th><th>Aksi</th></tr></thead><tbody>${(guests || []).map((guest) => {
    const response = responseByName.get(guest.name.toLocaleLowerCase());
    return `<tr><td>${escapeHtml(guest.name)}</td><td>${escapeHtml(guest.phone || "")}</td><td>${escapeHtml(response ? response.attendance : "Belum mengisi")}</td><td><button class="btn btn-outline copy-guest" data-id="${escapeHtml(guest.id)}">Salin</button></td><td><button class="btn btn-outline delete-guest" data-id="${escapeHtml(guest.id)}">Hapus</button></td></tr>`;
  }).join("")}</tbody></table><h2>RSVP Masuk (${(rsvps || []).length})</h2><div class="rsvp-list">${(rsvps || []).map((rsvp) => `<article class="rsvp-item"><strong>${escapeHtml(rsvp.guest_name)}</strong><span>${escapeHtml(rsvp.attendance)} · ${escapeHtml(rsvp.guest_count)} tamu</span><p>${escapeHtml(rsvp.message || "Tanpa pesan")}</p><small>${escapeHtml(new Date(rsvp.submitted_at).toLocaleString("id-ID"))}</small></article>`).join("") || '<p>Belum ada RSVP masuk.</p>'}</div>`;
  document.getElementById("add-guest").onclick = async () => {
    const name = document.getElementById("guest-name").value.trim();
    const phone = document.getElementById("guest-phone").value.trim();
    if (!name) {
      showToast("Nama tamu wajib diisi");
      return;
    }
    const { error } = await supabaseClient.from("guests").insert({
      invitation_id: currentInvitation.id,
      owner_id: currentUser.id,
      name,
      phone
    });
    if (error) {
      showToast(`Gagal menambahkan tamu: ${error.message}`);
      return;
    }
    showToast("Tamu ditambahkan");
    renderGuests();
  };
  document.querySelectorAll(".copy-guest").forEach((button) => {
    button.onclick = async () => {
      const guest = (guests || []).find((item) => item.id === button.dataset.id);
      if (guest) await copyText(getInvitationUrl(currentInvitation.data, guest.name, currentInvitation.id, currentInvitation.slug), `Tautan ${guest.name} disalin`);
    };
  });
  document.querySelectorAll(".delete-guest").forEach((button) => {
    button.onclick = async () => {
      const guest = (guests || []).find((item) => item.id === button.dataset.id);
      if (!guest || !window.confirm(`Hapus ${guest.name} dari daftar tamu?`)) return;
      const { error } = await supabaseClient.from("guests").delete().eq("id", guest.id);
      if (error) {
        showToast(`Gagal menghapus tamu: ${error.message}`);
        return;
      }
      showToast("Tamu dihapus");
      renderGuests();
    };
  });
  document.getElementById("export-guests").onclick = () => exportCSV(guests || [], rsvps || []);
}

async function copyText(value, successMessage) {
  try {
    await navigator.clipboard.writeText(value);
    showToast(successMessage);
  } catch (error) {
    showToast("Tidak dapat menyalin tautan. Salin alamat undangan secara manual.");
  }
}

function exportCSV(guests, rsvps) {
  const cell = (value) => {
    let text = String(value || "");
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const rows = [
    ["Nama", "WhatsApp", "Status RSVP", "Jumlah Tamu", "Ucapan"],
    ...guests.map((guest) => {
      const response = rsvps.find((item) => item.guest_name.toLocaleLowerCase() === guest.name.toLocaleLowerCase());
      return [guest.name, guest.phone, response ? response.attendance : "Belum mengisi", response ? response.guest_count : "", response ? response.message : ""];
    }),
    ...rsvps.filter((response) => !guests.some((guest) => guest.name.toLocaleLowerCase() === response.guest_name.toLocaleLowerCase()))
      .map((response) => [response.guest_name, "", response.attendance, response.guest_count, response.message])
  ];
  const blob = new Blob(["\uFEFF", rows.map((row) => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "daftar-tamu.csv";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderView(view) {
  updateOpenWebsiteLink();
  if (view === "projects") renderProjects();
  if (view === "editor") renderEditor();
  if (view === "guests") renderGuests();
}

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      recoveryMode = true;
      marketing.style.display = "none";
      dashboard.classList.add("active");
      document.title = "Atur Ulang Kata Sandi | TemuUndang";
      showAuthGate("Masukkan kata sandi baru (minimal 8 karakter).");
      document.querySelector('#auth-form [type="submit"]').textContent = "Simpan Kata Sandi";
      document.getElementById("sign-up").hidden = true;
      document.getElementById("reset-password").hidden = true;
      document.getElementById("auth-email").value = session && session.user.email || "";
      document.getElementById("auth-password").value = "";
      document.getElementById("auth-password").autocomplete = "new-password";
      return;
    }
    if (!session && dashboard.classList.contains("active")) {
      currentUser = null;
      invitations = [];
      currentInvitation = null;
      showAuthGate("Sesi berakhir. Masuk kembali untuk mengelola undangan.");
    }
  });
}
