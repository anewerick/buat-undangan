# TemuUndang — Platform Undangan Digital

Halaman utama berfungsi sebagai landing page dan katalog tema. Tombol **Dashboard** membuka area pengelolaan undangan, editor data, pratinjau template, serta daftar tamu dan tautan personal.

Undangan lengkap tersedia pada `invitation.html` dan dapat dibagikan dengan parameter tamu, misalnya:

`invitation.html?to=Budi%20Santoso`

# Undangan Pernikahan

## Edit undangan

1. Buka website dan klik tombol **Edit**.
2. Ubah nama, tanggal, venue, alamat, tautan Google Maps, dan foto utama.
3. Klik **Simpan & Pratinjau**. Perubahan tersimpan pada browser.
4. Untuk menjadikannya permanen, klik **Unduh config.js**, lalu ganti file `config.js` di folder proyek.

Anda juga dapat mengedit langsung `config.js`.

## Hosting gratis dengan GitHub Pages

1. Buat repository GitHub publik.
2. Unggah seluruh file proyek ke branch `main`.
3. Buka **Settings > Pages**.
4. Pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu **Save**.
5. Tunggu beberapa menit. URL akan tersedia sebagai `https://USERNAME.github.io/NAMA-REPOSITORY/`.
