# TemuUndang — Platform Undangan Digital

TemuUndang menyediakan katalog tema, editor undangan, beberapa proyek per akun, tautan publik sesuai nama mempelai, daftar tamu, ekspor CSV, dan RSVP yang dapat dilihat pemilik dari dashboard. Situs statis di-host gratis melalui GitHub Pages; Supabase menyimpan data bersama antar perangkat.

## Hubungkan Supabase

1. Buat proyek di [Supabase](https://supabase.com/).
2. Buka **SQL Editor**, jalankan seluruh isi `supabase/schema.sql`.
3. Dari **Project Settings > API**, salin **Project URL** dan **anon/public key**. Jangan pernah memakai atau mempublikasikan `service_role` key.
4. `config.js` sudah diisi dengan Project URL dan publishable key proyek ini. Jika memakai proyek berbeda, ganti nilainya di `window.SUPABASE_CONFIG`. Kunci publik memang digunakan di browser; keamanan data bergantung pada Row Level Security yang dibuat oleh skema SQL.
5. Di **Authentication > URL Configuration**, set **Site URL** ke alamat GitHub Pages, misalnya `https://anewerick.github.io/buat-undangan/`.
6. Di **Authentication > Providers > Email**, aktifkan email/password. Pengguna membuat akun dari dashboard; bila konfirmasi email aktif, konfirmasi email sebelum masuk.
7. Deploy seluruh file ke GitHub Pages. Setelah itu pemilik masuk ke dashboard, membuat undangan, lalu membagikan tautan publik dari halaman proyek.

Konfigurasi Supabase browser tidak berisi rahasia service-role. Jangan mengubah atau menonaktifkan policy RLS. RSVP publik hanya boleh membuat kiriman; daftar RSVP dan nomor tamu hanya dapat dibaca pemilik undangan.

## Fitur dan batasan saat ini

- Data undangan dan RSVP tersimpan terpusat di Supabase, bukan localStorage pengunjung.
- Setiap akun dapat mengelola beberapa undangan, tema, tanggal/jam WIB, lokasi, foto pasangan, ucapan, tiga bagian cerita, empat foto galeri melalui URL, musik latar melalui URL, serta daftar tamu.
- Tautan khusus tamu mengisi nama penerima pada formulir RSVP.
- Foto yang diunggah disimpan sebagai data gambar dalam data undangan; ukuran tiap file dibatasi 3 MB. Untuk banyak/berkas besar, gunakan URL gambar publik agar penggunaan database tetap ringan.
- RSVP terbuka untuk pengunjung melalui tautan undangan. Kebijakan database memvalidasi format data, tetapi proteksi spam/captcha belum disediakan; pantau kiriman RSVP dan tambahkan verifikasi bila undangan dibuka untuk audiens besar.
- Label tema "Premium" hanya bersifat katalog; pembayaran dan pembatasan akses tema belum diterapkan.
- Undangan lama yang tersimpan di localStorage tidak otomatis dipindahkan. Masuk ke akun Supabase dan buat/simpan ulang undangan dari editor.

## Hosting gratis dengan GitHub Pages

1. Buat repository GitHub publik.
2. Unggah file proyek ke branch `main`.
3. Buka **Settings > Pages**.
4. Pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu **Save**.
5. Gunakan URL `https://USERNAME.github.io/NAMA-REPOSITORY/` sebagai Site URL Supabase dan buka dashboard dari URL tersebut.
