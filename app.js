const marketing=document.getElementById('marketing'),dashboard=document.getElementById('dashboard'),workspace=document.getElementById('workspace'),toast=document.getElementById('toast-app');
function showToast(text){toast.textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}
function openDashboard(view='projects'){marketing.style.display='none';dashboard.classList.add('active');renderView(view)}
document.getElementById('open-dashboard').onclick=()=>openDashboard();document.getElementById('create-project').onclick=()=>openDashboard('editor');
document.getElementById('dashboard-close').onclick=()=>{dashboard.classList.remove('active');marketing.style.display='block'};document.getElementById('back-home').onclick=(e)=>{e.preventDefault();dashboard.classList.remove('active');marketing.style.display='block'};
document.querySelectorAll('.theme-card').forEach(card=>card.onclick=()=>openDashboard('editor'));
document.querySelectorAll('.sidebar button').forEach(button=>button.onclick=()=>{document.querySelectorAll('.sidebar button').forEach(b=>b.classList.remove('active'));button.classList.add('active');renderView(button.dataset.view)});
function renderProjects(){workspace.innerHTML=`<div class="workspace-head"><h1>Proyek Saya</h1><button class="btn" id="new-project">+ Undangan Baru</button></div><div class="project-grid"><article class="project-card"><div class="project-cover"></div><div class="project-info"><h3>Arga & Rania</h3><p>Elegant Sage · Diperbarui hari ini</p><div class="project-actions"><a href="invitation.html" target="_blank">Buka</a><button class="edit-project">Edit</button><button class="copy-link">Salin Tautan</button></div></div></article></div>`;document.getElementById('new-project').onclick=()=>renderView('editor');workspace.querySelector('.edit-project').onclick=()=>renderView('editor');workspace.querySelector('.copy-link').onclick=()=>{navigator.clipboard?.writeText(location.origin+location.pathname.replace(/[^/]*$/,'')+'invitation.html');showToast('Tautan undangan disalin')}}
function renderEditor(){
  const saved=JSON.parse(localStorage.getItem('temuundang-project')||'null')||{};
  workspace.innerHTML=`<div class="workspace-head"><h1>Editor Undangan</h1><button class="btn" id="save-project">Simpan Perubahan</button></div><div class="editor-grid"><div class="form-card"><label>Nama mempelai pria<input id="groom" value="${escapeHtml(saved.groom||'Arga')}"></label><label>Nama mempelai wanita<input id="bride" value="${escapeHtml(saved.bride||'Rania')}"></label><label>Tanggal acara<input id="date" value="${escapeHtml(saved.date||'20 Juni 2027')}"></label><label>Lokasi acara<input id="venue" value="${escapeHtml(saved.venue||'The Glass House')}"></label><label>Alamat<input id="address" value="${escapeHtml(saved.address||'Jl. Melati Raya No. 88, Jakarta Selatan')}"></label>
  <label>Foto pengantin pria<input id="groomPhotoUrl" type="url" placeholder="URL foto atau gunakan unggah" value="${escapeHtml(saved.groomPhoto||'')}"></label><label>Unggah foto pria<input id="groomPhotoFile" type="file" accept="image/*"></label>
  <label>Foto pengantin wanita<input id="bridePhotoUrl" type="url" placeholder="URL foto atau gunakan unggah" value="${escapeHtml(saved.bridePhoto||'')}"></label><label>Unggah foto wanita<input id="bridePhotoFile" type="file" accept="image/*"></label>
  <label>Background undangan<input id="backgroundUrl" type="url" placeholder="URL gambar background" value="${escapeHtml(saved.background||saved.photo||'')}"></label><label>Unggah background<input id="backgroundFile" type="file" accept="image/*"></label>
  <label>Ucapan pembuka<textarea id="opening" rows="3">${escapeHtml(saved.opening||'Dengan penuh sukacita, kami mengundang Anda untuk merayakan hari bahagia kami.')}</textarea></label></div><div class="preview-card"><iframe class="preview-frame" id="preview" src="invitation.html"></iframe></div></div>`;

  function readImage(fieldId, callback){
    const input=document.getElementById(fieldId);
    input.onchange=()=>{const file=input.files&&input.files[0];if(!file)return;if(file.size>3*1024*1024){showToast('Ukuran tiap foto maksimal 3 MB');input.value='';return}const reader=new FileReader();reader.onload=()=>callback(reader.result);reader.readAsDataURL(file)};
  }
  readImage('groomPhotoFile',value=>document.getElementById('groomPhotoUrl').value=value);
  readImage('bridePhotoFile',value=>document.getElementById('bridePhotoUrl').value=value);
  readImage('backgroundFile',value=>document.getElementById('backgroundUrl').value=value);

  document.getElementById('save-project').onclick=()=>{
    const project={
      groom:document.getElementById('groom').value,
      bride:document.getElementById('bride').value,
      date:document.getElementById('date').value,
      venue:document.getElementById('venue').value,
      address:document.getElementById('address').value,
      photo:document.getElementById('backgroundUrl').value,
      groomPhoto:document.getElementById('groomPhotoUrl').value,
      bridePhoto:document.getElementById('bridePhotoUrl').value,
      background:document.getElementById('backgroundUrl').value,
      opening:document.getElementById('opening').value
    };
    try{localStorage.setItem('temuundang-project',JSON.stringify(project));document.getElementById('preview').src='invitation.html?preview='+Date.now();showToast('Foto dan perubahan berhasil disimpan')}catch(e){showToast('Gagal menyimpan: gambar terlalu besar')}
  }
}
function getGuests(){return JSON.parse(localStorage.getItem('temuundang-guests')||'[]')}
function renderGuests(){const guests=getGuests();workspace.innerHTML=`<div class="workspace-head"><h1>Daftar Tamu & RSVP</h1><button class="btn" id="export-guests">Ekspor CSV</button></div><div class="guest-tools"><input id="guest-name" placeholder="Nama tamu"><input id="guest-phone" placeholder="Nomor WhatsApp"><button class="btn" id="add-guest">Tambah</button></div><table class="guest-table"><thead><tr><th>Nama</th><th>WhatsApp</th><th>Status RSVP</th><th>Tautan</th></tr></thead><tbody>${guests.map((g,i)=>`<tr><td>${escapeHtml(g.name)}</td><td>${escapeHtml(g.phone)}</td><td>${escapeHtml(g.status||'Belum mengisi')}</td><td><button class="btn btn-outline copy-guest" data-index="${i}">Salin</button></td></tr>`).join('')}</tbody></table>`;document.getElementById('add-guest').onclick=()=>{const name=document.getElementById('guest-name').value.trim(),phone=document.getElementById('guest-phone').value.trim();if(!name)return;guests.push({name,phone,status:'Belum mengisi'});localStorage.setItem('temuundang-guests',JSON.stringify(guests));renderGuests();showToast('Tamu ditambahkan')};document.querySelectorAll('.copy-guest').forEach(button=>button.onclick=()=>{const g=guests[+button.dataset.index];navigator.clipboard?.writeText(location.origin+location.pathname.replace(/[^/]*$/,'')+'invitation.html?to='+encodeURIComponent(g.name));showToast('Tautan tamu disalin')});document.getElementById('export-guests').onclick=()=>exportCSV(guests)}
function escapeHtml(value=''){const div=document.createElement('div');div.textContent=value;return div.innerHTML}function exportCSV(guests){const csv=['Nama,WhatsApp,Status RSVP',...guests.map(g=>`"${g.name}","${g.phone}","${g.status||''}"`)].join('\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),a=document.createElement('a');a.href=url;a.download='daftar-tamu.csv';a.click();URL.revokeObjectURL(url)}
function renderView(view){if(view==='projects')renderProjects();if(view==='editor')renderEditor();if(view==='guests')renderGuests()}renderProjects();