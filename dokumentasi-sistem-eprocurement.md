# Dokumentasi Sistem E-Procurement
### Aplikasi Web Tugas Akhir — High-Level Module Documentation

---

## Daftar Modul

1. [Autentikasi (Auth)](#1-autentikasi-auth)
2. [Dashboard](#2-dashboard)
3. [Vessel Request](#3-vessel-request)
4. [MOC — Memo of Comparison](#4-moc--memo-of-comparison)
5. [Purchase Order (PO)](#5-purchase-order-po)
6. [Good Receipt (GR)](#6-good-receipt-gr)
7. [Master Data](#7-master-data)
8. [Settings](#8-settings)
9. [API Token](#9-api-token)
10. [Ringkasan Sistem](#ringkasan-sistem)

---

## 1. Autentikasi (Auth)

**Tujuan:** Mengelola sesi pengguna berbasis API token. Menggunakan mekanisme token statis (tidak session/JWT) yang diikatkan ke user saat login.

**Aktor:** Semua pengguna sistem (Admin, Manager, Staff, Crew).

**Kapabilitas:**
- Registrasi akun baru (membutuhkan API token yang sudah ada)
- Login — mengikatkan API token ke user yang terautentikasi
- Logout — melepas ikatan API token dari user

**Alur Utama:**
1. Client mengirim request dengan API token di header
2. Middleware memvalidasi token (cek hash + expiry di DB)
3. Login → `userId` di-update ke record token aktif
4. Logout → `userId` di-set `null` pada token aktif

**Output:**
- Status sesi aktif/tidak aktif pada record `api_tokens`
- `userId` terikat/terlepas dari token

**Status Implementasi:** ✅ Lengkap — login, logout, register berfungsi penuh.

---

## 2. Dashboard

**Tujuan:** Menyediakan ringkasan statistik sistem dan aktivitas terbaru sebagai halaman utama setelah login.

**Aktor:** Semua pengguna yang memiliki akses dashboard.

**Kapabilitas:**
- Melihat statistik agregat: total items, active vendors, active vessels, pending requests
- Melihat 5 vessel request terbaru (beserta nama kapal & requester)

**Alur Utama:**
1. User membuka dashboard
2. API mengambil data agregat secara paralel dari 4 tabel
3. API mengambil 5 vessel request terbaru dengan join ke `users` dan `mst_vessels`
4. Data ditampilkan sebagai kartu statistik + tabel aktivitas

**Output:** Data statistik real-time (read-only, tidak ada state change).

**Status Implementasi:** ✅ Lengkap — statistik dasar dan recent activity tersedia.

---

## 3. Vessel Request

**Tujuan:** Mengelola pengajuan permintaan barang/sparepart dari kapal kepada tim procurement. Merupakan titik masuk utama alur pengadaan.

**Aktor:**
- **Crew/Staff** — membuat vessel request
- **Manager** — me-review dan menyetujui/menolak request

**Kapabilitas:**
- Membuat vessel request dengan satu atau lebih item
- Validasi pre-submit: cek duplikasi item (30 hari terakhir), cek max stock, cek prioritas vs stok aktual, cek kebaruan laporan stok
- Auto-approve request jika semua item lulus validasi tanpa warning
- Review request (approve/reject per item, dengan penyesuaian `qtyApproved`)
- Lihat list request dengan filter status & pagination
- Generate PDF vessel request (dapat per item atau seluruh request)

**Alur Utama:**
1. User memilih kapal dan item yang diminta (qty, unit, priority, justification)
2. Sistem menjalankan validasi: history 30 hari, standar stok kapal, stok aktual, kebaruan data stok
3. Jika semua item lulus → status otomatis `Approved by system`
4. Jika ada warning → status `Waiting`, menunggu review manual oleh Manager
5. Manager me-review: approve (isi `qtyApproved`) atau reject (isi `rejectReason`)
6. Request yang approved dapat dicetak sebagai PDF

**Output:**
- Record `vessel_requests` + `vessel_request_items` di DB
- Status: `Approved by system` | `Waiting` | `Approved` | `Rejected`
- Field `reviewedBy`, `reviewedAt`, `rejectReason` terisi saat review
- File PDF vessel request

**Status Implementasi:** ✅ Lengkap — create, validate, review, PDF, dan listing berfungsi penuh.

---

## 4. MOC — Memo of Comparison

**Tujuan:** Mengelola proses perbandingan penawaran dari beberapa vendor untuk satu item yang sudah di-approve dalam vessel request. MOC menjadi dasar pemilihan vendor terbaik secara objektif menggunakan algoritma SAW.

**Aktor:**
- **Staff Procurement** — membuat dan mengelola MOC
- **Manager** — sebagai konteks dari vessel request yang sudah diapprove

**Kapabilitas:**
- Membuat MOC terikat pada `vessel_request_item` yang sudah approved
- Menambahkan 1–N vendor beserta detail penawaran: unit price, available qty, warranty, discount, remarks
- Menjalankan kalkulasi SAW (Simple Additive Weighting) untuk menentukan vendor terbaik
- Melihat breakdown scoring SAW: nilai normalisasi, nilai terbobot, rank
- Update MOC (ganti status, ganti vendor, edit penawaran)
- Hapus MOC (cascade delete vendor entries)

**Alur Utama:**
1. Staff membuat MOC dan memilih `vessel_request_item` yang akan dibandingkan
2. Staff mengisi data penawaran dari minimal 2 vendor
3. Staff menjalankan scoring SAW → sistem menghitung score tiap vendor:
   - Bobot: Harga 40% (cost — lower is better), Qty 25%, Garansi 20%, Diskon 15%
   - Normalisasi relatif → kalkulasi weighted score
   - Vendor dengan score tertinggi ditandai `isSelected = true`
4. Staff menetapkan vendor terpilih → MOC diubah ke status `Completed`
5. MOC siap dijadikan dasar pembuatan Purchase Order

**Output:**
- Record `mocs` + `moc_vendors` dengan `saw_score` dan `is_selected`
- Status MOC: `Draft` | `Completed` | `Approved`
- Breakdown SAW tersimpan di field `sawScore` per vendor

**Status Implementasi:** ✅ Lengkap — CRUD MOC, kalkulasi SAW, dan breakdown scoring tersedia.

---

## 5. Purchase Order (PO)

**Tujuan:** Membuat dokumen pembelian resmi berdasarkan MOC yang sudah selesai. PO menentukan vendor, harga, dan jumlah yang akan dibeli, serta bisa otomatis diapprove jika di bawah threshold.

**Aktor:**
- **Staff Procurement** — membuat PO
- **Manager** — menyetujui atau menolak PO yang memerlukan approval manual

**Kapabilitas:**
- Membuat PO dari MOC yang berstatus `Completed`
- Auto-approve PO jika unit price di bawah `po_threshold` item (dari `vessel_item_standard`)
- Approval manual PO oleh Manager (jika status `Pending Approval`)
- Penolakan PO oleh Manager dengan alasan
- Lihat list PO dengan filter status & search (PO number, vendor, item name)
- Generate PDF Purchase Order

**Alur Utama:**
1. Staff memilih MOC yang sudah `Completed` lalu membuat PO
2. Sistem mengambil `po_threshold` dari `vessel_item_standard` item terkait
3. Jika `unit_price < threshold` → status PO `Auto Approved` (tidak perlu approval)
4. Jika tidak ada threshold atau harga ≥ threshold → status `Pending Approval`
5. Manager mereview PO: approve (`Approved`) atau reject (`Rejected` + alasan)
6. Saat PO dibuat, status MOC terkait otomatis diubah ke `Approved`
7. PO dapat dicetak sebagai dokumen PDF

**Output:**
- Record `purchase_orders` dengan nomor PO otomatis (format: `PO-YYYYMMDD-XXXX`)
- Status PO: `Auto Approved` | `Pending Approval` | `Approved` | `Rejected`
- Status MOC terkait diubah ke `Approved`
- Field `approved_by`, `approved_at`, `rejection_reason` terisi
- File PDF Purchase Order

**Status Implementasi:** ✅ Lengkap — create, auto-approve, manual approval/rejection, PDF, dan listing berfungsi.

---

## 6. Good Receipt (GR)

**Tujuan:** Mencatat penerimaan barang di kapal berdasarkan PO yang sudah diapprove. GR mengkonfirmasi kesesuaian barang yang diterima dan secara otomatis memperbarui stok kapal jika barang diterima.

**Aktor:**
- **Crew/Staff di kapal** — membuat Good Receipt setelah barang tiba

**Kapabilitas:**
- Lihat daftar PO yang sudah approved dan belum memiliki GR (pending for receipt)
- Membuat GR terikat pada PO approved
- Menandai apakah barang yang diterima sesuai (`isSameItem`)
- Mencatat alasan ketidaksesuaian jika barang tidak sama
- Otomatis update stok kapal (`vessel_stocks`) saat GR diterima (status `Accepted`)
- Lihat list GR dengan filter status & search

**Alur Utama:**
1. Barang tiba di kapal; staff membuka halaman GR
2. Sistem menampilkan daftar PO yang sudah Approved/Auto Approved dan belum ada GR-nya
3. Staff memilih PO dan mengisi form:
   - `isSameItem`: apakah barang sesuai dengan order?
   - Jika tidak sesuai → isi `discrepancyReason`
4. Sistem membuat GR dengan nomor otomatis (format: `GR-YYYYMMDD-XXXX`)
5. Jika `isSameItem = true` → status `Accepted`:
   - `vessel_stocks` diperbarui: jika sudah ada → `stockOnHand += po.qty`; jika belum ada → insert record baru
6. Jika `isSameItem = false` → status `Rejected` (stok tidak berubah)

**Output:**
- Record `good_receipts` tersimpan
- Status GR: `Accepted` | `Rejected`
- `vessel_stocks` diperbarui otomatis (jika Accepted)
- Nomor GR otomatis

**Status Implementasi:** ✅ Lengkap — create GR, auto-update stok, dan listing berfungsi.

---

## 7. Master Data

**Tujuan:** Mengelola data referensi yang digunakan di seluruh alur pengadaan.

**Aktor:** **Admin** — mengelola semua master data.

### Sub-modul Master Data:

| Sub-modul | Entitas | Kapabilitas |
|---|---|---|
| **Items** | `mst_items`, `mst_item_categories` | CRUD item & kategori, filter status Publish/Unpublish |
| **Vendors** | `mst_vendors` | CRUD vendor, kategori: Jasa/Sparepart/Fuel/Engine |
| **Vessels** | `mst_vessels` | CRUD kapal, status Publish/Unpublish |
| **Vessel Stocks** | `vessel_stocks` | Input/update laporan stok per kapal per item |
| **Vessel Item Standards** | `vessel_item_standard` | Konfigurasi min/max stock, periode, PO threshold per item per kapal |
| **Cities** | `cities` | CRUD data kota (referensi alamat vendor) |
| **Category Items** | `mst_item_categories` | CRUD kategori item |

**Output:** Data referensi yang digunakan sebagai dependensi modul lain (vessel request validation, SAW scoring, PO threshold, dll.).

**Status Implementasi:** ✅ Lengkap untuk semua sub-modul di backend. Frontend tersedia untuk vessel, vessel stocks, item standards.

---

## 8. Settings

**Tujuan:** Mengelola konfigurasi sistem: manajemen pengguna dan kontrol akses modul per role.

**Aktor:** **Admin** — satu-satunya yang memiliki akses penuh ke Settings.

### 8.1 User Management

**Kapabilitas:**
- CRUD pengguna sistem
- Validasi keunikan username & email
- Password di-hash sebelum disimpan
- Soft delete → status user diubah ke `Leave` (bukan dihapus permanen)
- Filter pengguna by type (Admin/Staff/Manager/Crew), department, status

**Output:** Record `users` tersimpan/diperbarui dengan status dan data lengkap.

### 8.2 Module Access Control

**Kapabilitas:**
- Melihat pemetaan modul mana yang bisa diakses oleh setiap `userType`
- Menambah atau menghapus akses modul per role
- Proteksi: Admin tidak dapat kehilangan akses ke modul Settings

**Alur Utama:**
1. Admin membuka halaman Module Access
2. Sistem menampilkan matrix: userType × moduleSlug
3. Admin mengaktifkan/menonaktifkan akses
4. Saat user login, frontend memanggil `GET /module-access/my-modules` untuk mengetahui modul mana yang bisa diakses user tersebut

**Output:**
- Record `role_modules` (pasangan `user_type` + `module_slug`)
- Sidebar/navigasi frontend dikontrol secara dinamis berdasarkan permissions ini

**Status Implementasi:** ✅ Lengkap — user management dan module access control berfungsi penuh.

---

## 9. API Token

**Tujuan:** Mengelola token autentikasi yang digunakan sebagai mekanisme identifikasi sesi.

**Aktor:** **Admin** — membuat dan mengelola token.

**Kapabilitas:**
- Generate API token baru (disimpan sebagai hash)
- Melihat daftar token aktif
- Token dapat memiliki expiry date

**Catatan:** Token tidak menggunakan JWT. Sistem menyimpan hash token di DB dan memvalidasi per request. Token diikatkan ke `userId` saat login.

**Output:** Record `api_tokens` dengan hash token, expiry, dan `userId` (nullable).

**Status Implementasi:** ✅ Lengkap — token generation dan manajemen tersedia.

---
---

## Ringkasan Sistem

### Gambaran Umum

Sistem ini adalah aplikasi web e-procurement untuk industri pelayaran. Alur pengadaan dimulai dari permintaan barang oleh kapal, diproses oleh tim procurement melalui perbandingan vendor, penerbitan PO, hingga konfirmasi penerimaan barang yang secara otomatis memperbarui stok kapal.

### Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Vue.js (SPA), Vite |
| Backend | Node.js, Express.js, TypeScript |
| Database | MySQL via Drizzle ORM |
| Auth | API Token (hash-based, stateful) |
| Monorepo | Turborepo |

---

### Aktor Sistem

| Aktor | Role | Akses Utama |
|---|---|---|
| **Admin** | Superuser | Settings, Master Data, semua modul |
| **Manager** | Approver | Review Vessel Request, Approve/Reject PO |
| **Staff** | Operator | Vessel Request, MOC, Purchase Order |
| **Crew** | Requester | Vessel Request, Good Receipt |

> Akses modul dikontrol secara dinamis via tabel `role_modules` — Admin dapat mengubah hak akses per role kapan saja.

---

### Alur Pengadaan End-to-End

```
[Crew/Staff]          [Manager]         [Staff Procurement]       [Crew/Staff]
     │                    │                      │                      │
     ▼                    │                      │                      │
Vessel Request ──────────►│                      │                      │
(Submit item)    Review & Approve                │                      │
                  (atau auto-approve)            │                      │
                          │                      │                      │
                          ▼                      │                      │
                   Request Approved ────────────►│                      │
                                           Buat MOC                     │
                                    (input penawaran vendor)            │
                                           Run SAW Score                │
                                    (pilih vendor terbaik)              │
                                                 │                      │
                                                 ▼                      │
                                          Buat PO ──────────────────────│
                                    (dari MOC Completed)                │
                                    Auto-approve jika                   │
                                    harga < PO threshold                │
                                          │                             │
                                          ▼                             │
                                   [Manager review]                     │
                                   (jika Pending Approval)              │
                                          │                             │
                                          ▼                             │
                                      PO Approved ─────────────────────►│
                                                                  Good Receipt
                                                              (konfirmasi penerimaan)
                                                                        │
                                                                        ▼
                                                                 Stok Kapal
                                                               otomatis update
```

---

### Titik Otomasi Utama

| Titik Otomasi | Trigger | Aksi Sistem |
|---|---|---|
| **Auto-approve Vessel Request** | Semua item lulus validasi (tidak ada warning) | Status request & items langsung → `Approved by system` tanpa perlu review manual |
| **SAW Vendor Scoring** | Staff klik "Run SAW Scoring" | Sistem menghitung normalized + weighted score, menandai `isSelected` pada vendor terbaik |
| **Auto-approve PO** | Unit price < `po_threshold` item | Status PO langsung → `Auto Approved` tanpa perlu approval Manager |
| **MOC Status Update** | PO berhasil dibuat | Status MOC terkait otomatis → `Approved` |
| **Stock Update** | GR dibuat dengan `isSameItem = true` | `vessel_stocks.stockOnHand` otomatis bertambah sebesar `po.qty` |
| **Nomor Dokumen Otomatis** | Create VR / PO / GR | Kode unik otomatis: `VR-{timestamp}`, `PO-YYYYMMDD-XXXX`, `GR-YYYYMMDD-XXXX` |
| **Validasi Pre-submit Request** | Submit Vessel Request | Cek 4 kondisi: duplikasi 30 hari, max stock, prioritas vs stok, kebaruan data stok — generate warnings per item |

---

### Dependensi Antar Modul

```
Master Data (Items, Vendors, Vessels, Standards, Stocks)
    │
    ├──► Vessel Request  ──► MOC  ──► Purchase Order  ──► Good Receipt
    │         │                              │                   │
    │     (validasi)                  (auto-approve)       (update stok)
    │
    └──► Settings (Users, Module Access)
              │
          (kontrol siapa yang bisa akses modul apa)
```

---

*Dokumen ini dihasilkan berdasarkan eksplorasi kodebase per 27 Mei 2026.*
