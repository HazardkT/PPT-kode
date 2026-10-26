# Palma Ledger

[Buka web app Palma Ledger](https://hazardkt.github.io/Palma/frontend/)

Saat dibuka, aplikasi berjalan dalam mode demo. Untuk terhubung ke database Supabase, silakan login terlebih dahulu.
untuk login klik logo AR di pojok kanan atas dan gunakan:

**email owner: palma@hotel.com**
**password: palma123.**

**email accountant: palma@accountant.com**
**password: palma321.**

Palma Ledger adalah aplikasi akuntansi pendapatan kamar dan piutang usaha untuk **satu hotel**. Antarmuka saat ini dibuat dengan HTML, CSS, dan JavaScript; Supabase menyediakan autentikasi, PostgreSQL, Row Level Security (RLS), serta fungsi transaksi akuntansi.

## Fitur

- Ringkasan pendapatan kamar, kas diterima, piutang terbuka, dan umur piutang.
- Daftar faktur dengan pencarian, filter status, ekspor CSV untuk Excel, dan urutan berdasarkan jatuh tempo.
- Pemilihan lima tipe kamar dengan tarif per malam: Standard Room, Superior Room, Deluxe Room, Suite Room, dan Presidential Suite. Jumlah malam menghitung subtotal otomatis.
- Penerbitan faktur kredit atau faktur **langsung lunas**, termasuk pilihan metode pembayaran.
- Pencatatan pembayaran sebagian/penuh dan alokasi pembayaran ke faktur.
- Buku Jurnal Umum dengan filter akun, total debit/kredit, cetak PDF melalui dialog cetak browser, dan ekspor Excel.
- Pembatalan faktur dengan alasan. Untuk faktur yang sudah dibayar, pengguna wajib mengonfirmasi bahwa refund telah dilakukan terlebih dahulu.
- Mode demo dan koneksi Supabase. Logout mengembalikan aplikasi ke data demo.

## Logika Akuntansi

Pendapatan hanya berasal dari kamar dan memakai akun `4101 Pendapatan Kamar`. Nilai pendapatan adalah subtotal kamar sebelum pajak. Subtotal dihitung dari tarif per malam dikali jumlah malam. Pajak faktur mengikuti persentase yang dipilih pada formulir.

| Kejadian | Debit | Kredit |
| --- | --- | --- |
| Faktur kredit diterbitkan | Piutang Usaha (`1201`) sebesar total faktur | Pendapatan Kamar (`4101`) sebesar subtotal dan Pajak Keluaran (`2101`) sebesar pajak |
| Faktur langsung lunas | Kas/Bank (`1101`) sebesar total faktur | Pendapatan Kamar (`4101`) dan Pajak Keluaran (`2101`) |
| Pembayaran faktur kredit | Kas/Bank (`1101`) | Piutang Usaha (`1201`) |
| Pembatalan faktur | Pendapatan Kamar dan Pajak Keluaran | Piutang Usaha sebagai pembalik faktur |
| Refund pembayaran | Piutang Usaha sebagai akun kliring refund | Kas/Bank |

Saldo faktur dihitung dari total baris faktur dikurangi alokasi pembayaran. Penerimaan mengunci faktur saat saldo dihitung sehingga dua permintaan bersamaan tidak dapat mengalokasikan lebih dari sisa tagihan. Jurnal yang diposting harus seimbang dan memiliki checksum SHA-256 atas header serta baris jurnal. Jurnal dan barisnya tidak dapat diubah atau dihapus setelah diposting; `verify_journal_entry_checksum(uuid)` memeriksa checksum entri bagi anggota hotel.

Pembatalan tidak menghapus faktur atau jurnal asli: sistem menandai faktur `void`, mencatat jurnal pembalik, dan—bila ada pembayaran—mencatat refund. Refund uang dilakukan di luar aplikasi; konfirmasi di aplikasi adalah catatan pengguna, bukan bukti transfer. Sistem juga tidak terhubung ke bank/payment gateway dan tidak dapat memastikan uang fisik benar-benar diterima. Verifikasi dana tetap memerlukan pencocokan kuitansi, mutasi bank, atau rekonsiliasi kas oleh petugas.

Akun kas dan pajak tetap diperlukan untuk jurnal berpasangan meskipun Buku Jurnal Umum memiliki filter akun inti Piutang Usaha dan Pendapatan Kamar.

## Alur ERD

Diagram lengkap ada di [docs/erd.md](docs/erd.md). Ringkasan prosesnya:

1. Tamu atau perusahaan ditautkan ke reservasi.
2. Folio menyimpan rincian kamar selama masa inap.
3. Folio diterbitkan sebagai faktur yang menyimpan snapshot pelanggan, kamar, tarif, pajak, dan tanggal jatuh tempo.
4. Pembayaran dapat dialokasikan sebagian atau penuh ke faktur. Saldo dan umur piutang dihitung dari alokasi.
5. Faktur dan penerimaan membentuk jurnal debit-kredit.
6. Pembatalan membentuk jurnal pembalik dan, bila pembayaran telah diterima, catatan refund. Riwayat transaksi tetap tersimpan.

Sistem dikonfigurasi untuk satu hotel. `property_id` tetap digunakan sebagai kunci relasi dan pemeriksaan akses RLS, bukan sebagai pemilih cabang.

## Struktur Folder

```text
frontend/
  index.html
  css/styles.css
  js/app.js
backend/
  supabase/schema.sql
  supabase/seed.example.sql
  supabase/room_revenue_only.sql
  supabase/single_hotel_only.sql
  supabase/direct_paid_invoice.sql
  supabase/invoice_cancellation.sql
  supabase/role_and_audit_controls.sql
docs/
  erd.md
README.md
```

`schema.sql` adalah schema utama untuk project Supabase baru. Berkas SQL migrasi lainnya digunakan secara selektif untuk project lama; jangan jalankan ulang migrasi yang sudah diterapkan.

## Menjalankan Mode Demo

Mode demo tidak memerlukan akun atau database. Data contoh dapat digunakan untuk mencoba faktur, pembayaran, pembatalan, Buku Jurnal Umum, pencarian, filter, dan ekspor. Perubahan demo hanya tersimpan selama sesi halaman; muat ulang atau logout akan mengembalikan data contoh.

1. Buka folder proyek di VS Code dan buka `frontend/index.html`.
2. Klik **Go Live** di kanan bawah, atau klik kanan file lalu pilih **Open with Live Server**.
3. Jika ekstensi Live Server belum tersedia, pasang ekstensi tersebut. Alternatifnya, jalankan server Python lokal bila Python sudah terpasang:

```powershell
py -m http.server 5500 --directory frontend
```

Kemudian buka `http://localhost:5500`. PowerShell tidak perlu diinstal; terminal bawaan Windows/VS Code dapat digunakan.

## Menghubungkan Supabase

### Project Baru

1. Buat project di Supabase.
2. Buka **SQL Editor → New query**, jalankan seluruh [backend/supabase/schema.sql](backend/supabase/schema.sql), dan pastikan selesai tanpa error.
3. Buat pengguna di **Authentication → Users**. Pengguna harus dibuat sebelum menjalankan seed.
4. Buka [backend/supabase/seed.example.sql](backend/supabase/seed.example.sql), ganti email contoh dengan email pengguna Auth Anda, lalu jalankan seed. Seed membuat hotel, keanggotaan role `owner`, dan akun awal.
5. Salin **Project URL** dan **publishable/anon key** dari Supabase. Isi `url` dan `anonKey` pada `PALMA_SUPABASE` di [frontend/js/app.js](frontend/js/app.js). Jangan pernah menaruh `service_role key` di frontend.
6. Jalankan frontend lewat Live Server atau server lokal, lalu klik avatar Admin dan masuk menggunakan kredensial Supabase Auth.
7. Jika autentikasi memerlukan callback, tambahkan URL lokal yang digunakan (misalnya `http://localhost:5500`) ke **Authentication → URL Configuration → Redirect URLs**.

### Project Lama

Jalankan hanya migrasi yang belum diterapkan melalui SQL Editor:

1. [room_revenue_only.sql](backend/supabase/room_revenue_only.sql) untuk pembatasan akun pendapatan kamar `4101`.
2. [single_hotel_only.sql](backend/supabase/single_hotel_only.sql) untuk membatasi database ke satu hotel. Migrasi gagal jika masih ada beberapa record hotel; konsolidasikan data secara eksplisit terlebih dahulu. Migrasi tidak menghapus data.
3. [direct_paid_invoice.sql](backend/supabase/direct_paid_invoice.sql) untuk jurnal faktur langsung lunas.
4. [invoice_cancellation.sql](backend/supabase/invoice_cancellation.sql) untuk pembatalan faktur, jurnal pembalik, dan pencatatan refund.
5. Setelah membuat backup, [role_and_audit_controls.sql](backend/supabase/role_and_audit_controls.sql) untuk pembatasan peran, checksum SHA-256, dan perlindungan jurnal immutable.

Setelah migrasi yang diperlukan berhasil, login melalui aplikasi menggunakan pengguna yang terdaftar di `property_members`.

### Peran dan Kontrol Akses

- `owner` dan `manager` dapat membuat/menerbitkan faktur, mencatat penerimaan, serta membatalkan faktur.
- `accountant` dapat membuat/menerbitkan faktur dan mencatat penerimaan, tetapi tidak dapat membatalkan faktur atau mengelola bagan akun.
- `viewer` hanya dapat membaca data.
- Hak ini ditegakkan oleh RLS dan fungsi RPC, bukan hanya dengan menyembunyikan tombol di frontend. Perubahan untuk project baru sudah ada di `schema.sql`; untuk project yang sudah berjalan, jalankan migrasi `role_and_audit_controls.sql` setelah backup. Jangan jalankan ulang skema awal.

## Keamanan dan Catatan Operasional

- RLS membatasi data berdasarkan keanggotaan hotel. Jangan menonaktifkan RLS untuk mempermudah koneksi.
- Jurnal yang diposting bersifat append-only pada lapisan aplikasi/database dan memiliki SHA-256 untuk pemeriksaan integritas. Administrator database dengan hak superuser tetap dapat melewati trigger; checksum bukan pengganti backup, kontrol akses database, atau audit independen.
- Frontend saat ini masih Vanilla JavaScript; migrasi ke React/Vue untuk memenuhi rubrik framework merupakan pekerjaan lanjutan dan belum tercakup dalam perubahan kontrol akses ini.
- Hanya anon/publishable key yang boleh berada di frontend; `service_role key` harus dirahasiakan.
- Pembatalan faktur yang sudah dibayar mensyaratkan refund nyata telah dilakukan. Sistem tidak mengirim uang atau mengintegrasikan payment gateway.
- Sebelum penggunaan produksi, tinjau aturan pajak, persetujuan pembatalan, backup, serta prosedur audit bersama akuntan hotel.
