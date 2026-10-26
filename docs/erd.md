# ERD - Akuntansi Pendapatan dan Piutang Satu Hotel

Sistem ini melayani satu hotel. Tabel `properties` tetap menjadi record konfigurasi hotel dan kunci relasi untuk RLS, tetapi database membatasi tabel tersebut hanya memiliki satu baris; tidak ada pemilih cabang.

## Alur bisnis

1. Tamu membuat reservasi; reservasi dapat ditautkan ke perusahaan untuk kebutuhan corporate billing.
2. Pendapatan kamar dicatat sebagai baris folio selama tamu menginap.
3. Saat checkout atau proses billing, folio diterbitkan menjadi faktur. Faktur menyimpan snapshot pelanggan, mata uang, pajak, tanggal jatuh tempo, dan rincian pendapatan.
4. Faktur yang belum lunas menjadi piutang usaha. Penerimaan kas dapat dibayar sebagian atau penuh dan dialokasikan ke satu atau beberapa faktur.
5. Faktur dan pembayaran yang sudah diposting membentuk jurnal berpasangan: debit piutang/kas dan kredit pendapatan/pajak keluaran. Pembayaran mengurangi piutang tanpa mengubah pendapatan.

## ERD

```mermaid
erDiagram
    PROPERTIES ||--o{ RESERVATIONS : hosts
    PROPERTIES ||--o{ FOLIOS : owns
    PROPERTIES ||--o{ INVOICES : issues
    PROPERTIES ||--o{ PAYMENTS : receives
    PROPERTIES ||--o{ JOURNAL_ENTRIES : records
    GUESTS ||--o{ RESERVATIONS : books
    COMPANIES o|--o{ RESERVATIONS : sponsors
    RESERVATIONS ||--o| FOLIOS : opens
    GUESTS ||--o{ FOLIOS : owns
    COMPANIES o|--o{ FOLIOS : billed_to
    FOLIOS ||--o{ FOLIO_ITEMS : contains
    FOLIO_ITEMS o|--o| INVOICE_ITEMS : billed_as
    INVOICES ||--|{ INVOICE_ITEMS : details
    GUESTS o|--o{ INVOICES : billed_to
    COMPANIES o|--o{ INVOICES : billed_to
    INVOICES ||--o{ PAYMENT_ALLOCATIONS : settled_by
    PAYMENTS ||--|{ PAYMENT_ALLOCATIONS : allocates
    ACCOUNTS ||--o{ INVOICE_ITEMS : recognizes
    ACCOUNTS ||--o{ JOURNAL_LINES : posts
    JOURNAL_ENTRIES ||--|{ JOURNAL_LINES : balances

    PROPERTIES {
        uuid id PK
        text name "single hotel"
        text currency
        text timezone
    }
    GUESTS {
        uuid id PK
        text full_name
        text email
        text phone
    }
    COMPANIES {
        uuid id PK
        text legal_name
        text tax_id
        text billing_email
    }
    RESERVATIONS {
        uuid id PK
        uuid property_id FK
        uuid guest_id FK
        uuid company_id FK
        text confirmation_code
        date check_in
        date check_out
        text status
    }
    FOLIOS {
        uuid id PK
        uuid reservation_id FK
        uuid guest_id FK
        uuid company_id FK
        text folio_number
        text status
    }
    FOLIO_ITEMS {
        uuid id PK
        uuid folio_id FK
        text description
        numeric quantity
        numeric unit_price
        numeric tax_rate
        date service_date
    }
    INVOICES {
        uuid id PK
        uuid property_id FK
        uuid folio_id FK
        uuid guest_id FK
        uuid company_id FK
        text invoice_number
        date issued_at
        date due_at
        text status
        text currency
    }
    INVOICE_ITEMS {
        uuid id PK
        uuid invoice_id FK
        uuid folio_item_id FK
        uuid revenue_account_id FK
        text description
        numeric quantity
        numeric unit_price
        numeric tax_rate
    }
    PAYMENTS {
        uuid id PK
        uuid property_id FK
        text receipt_number
        date received_at
        text method
        numeric amount
    }
    PAYMENT_ALLOCATIONS {
        uuid id PK
        uuid payment_id FK
        uuid invoice_id FK
        numeric amount
    }
    ACCOUNTS {
        uuid id PK
        text code
        text name
        text account_type
    }
    JOURNAL_ENTRIES {
        uuid id PK
        uuid property_id FK
        uuid source_invoice_id FK
        uuid source_payment_id FK
        date entry_date
        text status
        text audit_checksum "SHA-256"
    }
    JOURNAL_LINES {
        uuid id PK
        uuid journal_entry_id FK
        uuid account_id FK
        numeric debit
        numeric credit
    }
```

## Aturan integritas utama

- Faktur ditautkan ke satu folio; folio dapat belum ditagih atau menghasilkan faktur.
- Penerima tagihan adalah tamu atau perusahaan. Snapshot nama/alamat tagihan tetap disimpan di faktur agar histori tidak berubah saat master pelanggan diperbarui.
- Jumlah faktur dihitung dari rincian: subtotal + pajak. Saldo piutang = total faktur - total alokasi pembayaran.
- Alokasi pembayaran tidak boleh melebihi nilai pembayaran, dan total alokasi ke faktur tidak boleh melebihi nilai faktur.
- Baris jurnal yang diposting harus seimbang (total debit = total kredit). Faktur yang diposting mendebit piutang serta mengkredit pendapatan dan pajak; pembayaran mendebit kas serta mengkredit piutang.
- Jurnal yang telah diposting dan barisnya bersifat immutable. Checksum SHA-256 memuat data header dan baris; `verify_journal_entry_checksum(uuid)` memeriksa integritasnya untuk anggota hotel.
- Semua transaksi memiliki `property_id` yang menunjuk ke satu hotel. Nilai ini dipertahankan untuk integritas relasi dan RLS; bukan pemisah cabang.
- Akses pengguna dibatasi lewat keanggotaan hotel pada `property_members`, kebijakan RLS, dan peran owner/manager/accountant/viewer. Hanya owner/manager yang dapat membatalkan faktur; viewer bersifat read-only.
