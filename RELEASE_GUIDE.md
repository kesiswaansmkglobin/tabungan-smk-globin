# Release Guide - TABUNGAN SMK GLOBIN

Panduan lengkap untuk merilis versi baru aplikasi secara otomatis menggunakan GitHub Actions.

## 📋 Prasyarat

### 1. Setup Code Signing Certificate (Opsional tapi Direkomendasikan)

Code signing menghilangkan warning Windows SmartScreen dan meningkatkan kepercayaan pengguna.

#### Mendapatkan Certificate:
- **Sectigo**: ~$84-169/tahun - [sectigo.com](https://sectigo.com/ssl-certificates-tls/code-signing)
- **DigiCert**: ~$474/tahun - [digicert.com](https://www.digicert.com/code-signing)
- **Certum**: ~$86/tahun - [certum.eu](https://www.certum.eu/en/code-signing-certificates/)

Anda akan menerima file `.pfx` atau `.p12` dan password.

#### Setup GitHub Secrets:

1. **Encode certificate ke Base64:**
   ```bash
   # Windows PowerShell
   $bytes = [System.IO.File]::ReadAllBytes("path\to\certificate.pfx")
   [System.Convert]::ToBase64String($bytes) | Out-File certificate-base64.txt
   ```

2. **Tambahkan secrets ke GitHub:**
   - Buka: `https://github.com/kesiswaansmkglobin/tabungan-smk-globin/settings/secrets/actions`
   - Klik "New repository secret"
   - Tambahkan 2 secrets:
     - `WINDOWS_CERTIFICATE`: Paste isi file `certificate-base64.txt`
     - `WINDOWS_CERTIFICATE_PASSWORD`: Password certificate Anda

### 2. Setup GitHub Token (Otomatis)

GitHub Actions sudah menyediakan `GITHUB_TOKEN` secara otomatis untuk publish releases.

---

## 🚀 Cara Release Versi Baru

### Metode 1: Menggunakan Release Script (Recommended)

Release script otomatis melakukan:
- ✅ Increment version number di `package.json`
- ✅ Commit perubahan version
- ✅ Buat git tag dengan format `v1.0.0`
- ✅ Push ke GitHub (trigger build otomatis)

#### Commands:

```bash
# Release PATCH version (1.0.0 → 1.0.1)
# Untuk bug fixes dan perubahan kecil
npm run release

# atau
npm run release:patch
```

```bash
# Release MINOR version (1.0.0 → 1.1.0)
# Untuk fitur baru yang backward compatible
npm run release:minor
```

```bash
# Release MAJOR version (1.0.0 → 2.0.0)
# Untuk breaking changes
npm run release:major
```

#### Proses Otomatis:
1. ✅ Script memeriksa uncommitted changes
2. ✅ Increment version di package.json
3. ✅ Commit: "chore: bump version to x.x.x"
4. ✅ Buat tag: `vx.x.x`
5. ✅ Push ke GitHub
6. ✅ GitHub Actions otomatis build installer
7. ✅ Installer di-upload ke GitHub Releases dengan auto-update enabled

### Metode 2: Manual

```bash
# 1. Update version di package.json secara manual
# Edit: "version": "1.0.1"

# 2. Commit perubahan
git add package.json
git commit -m "chore: bump version to 1.0.1"

# 3. Buat tag
git tag -a v1.0.1 -m "Release v1.0.1"

# 4. Push ke GitHub
git push
git push --tags
```

---

## 📦 Versioning Scheme (Semantic Versioning)

Format: `MAJOR.MINOR.PATCH`

| Type | Kapan Digunakan | Contoh |
|------|-----------------|--------|
| **PATCH** | Bug fixes, security patches | 1.0.0 → 1.0.1 |
| **MINOR** | Fitur baru (backward compatible) | 1.0.0 → 1.1.0 |
| **MAJOR** | Breaking changes | 1.0.0 → 2.0.0 |

### Contoh Penggunaan:

- ✅ Fix bug transaksi → `release:patch`
- ✅ Tambah fitur export PDF → `release:minor`
- ✅ Ubah struktur database → `release:major`

---

## 🔍 Monitoring Build

### 1. Cek GitHub Actions
```
https://github.com/kesiswaansmkglobin/tabungan-smk-globin/actions
```

### 2. Status Build
- ✅ **Success**: Installer berhasil dibuat dan di-upload
- ❌ **Failed**: Cek logs untuk error details

### 3. Download Hasil Build

Setelah build selesai:

**GitHub Releases** (Official):
```
https://github.com/kesiswaansmkglobin/tabungan-smk-globin/releases
```

**Actions Artifacts** (Development):
```
https://github.com/kesiswaansmkglobin/tabungan-smk-globin/actions
→ Pilih workflow run terakhir
→ Download "windows-installer" artifact
```

---

## 🔐 Code Signing Benefits

### Tanpa Code Signing:
- ⚠️ Windows SmartScreen warning: "Unknown Publisher"
- ⚠️ User harus klik "More info" → "Run anyway"
- ⚠️ Mengurangi kepercayaan pengguna

### Dengan Code Signing:
- ✅ Instalasi langsung tanpa warning
- ✅ Menampilkan nama organisasi Anda
- ✅ Meningkatkan kepercayaan pengguna
- ✅ Lebih profesional

---

## 🎯 Auto-Update Flow

1. User install aplikasi v1.0.0
2. Anda release v1.0.1 menggunakan script
3. GitHub Actions build installer baru
4. Installer di-upload ke GitHub Releases
5. Aplikasi user otomatis cek update di background
6. Notifikasi update muncul di aplikasi
7. User klik "Update" → Download dan install otomatis

---

## 🛠️ Troubleshooting

### Build gagal dengan error "CSC_LINK not found"

**Solusi**: Code signing certificate belum di-setup atau manual dispatch dipilih.
- Untuk tagged releases: Setup `WINDOWS_CERTIFICATE` secret
- Untuk development builds: Build akan berjalan tanpa code signing

### Tag sudah ada

```bash
# Hapus tag lokal
git tag -d v1.0.1

# Hapus tag remote
git push --delete origin v1.0.1

# Buat tag baru
git tag -a v1.0.1 -m "Release v1.0.1"
git push --tags
```

### Release script error: "uncommitted changes"

```bash
# Commit semua perubahan dulu
git add .
git commit -m "feat: your changes"

# Baru jalankan release
npm run release
```

---

## 📝 Release Notes Template

GitHub Actions otomatis generate release notes, tapi Anda bisa edit di GitHub Releases:

```markdown
## 🎉 What's New in v1.1.0

### ✨ Features
- Added PDF export functionality
- New theme: Midnight Blue
- Enhanced dashboard charts

### 🐛 Bug Fixes
- Fixed transaction date picker
- Resolved student authentication issue

### 🔧 Improvements
- Faster report generation
- Better mobile responsiveness

### 📦 Installation
Download `TABUNGAN-SMK-GLOBIN-Setup-1.1.0.exe` below and run.

Existing users will receive auto-update notification.
```

---

## 🎓 Quick Reference

```bash
# Development workflow
git add .
git commit -m "feat: add new feature"
git push

# Release workflow
npm run release              # Patch (recommended)
npm run release:minor        # Minor version
npm run release:major        # Major version

# Check results
https://github.com/kesiswaansmkglobin/tabungan-smk-globin/actions
https://github.com/kesiswaansmkglobin/tabungan-smk-globin/releases
```

---

## 💰 Budget Workflow (Without Code Signing)

Jika belum ada budget untuk certificate:

1. Release tetap berjalan normal tanpa code signing
2. User akan melihat SmartScreen warning
3. Instruksikan user: "More info" → "Run anyway"
4. Setelah aplikasi digunakan banyak orang, Windows reputation akan meningkat
5. Warning akan berkurang secara bertahap
6. Pertimbangkan beli certificate di masa depan

**Catatan**: GitHub Actions tetap akan build installer, hanya skip code signing step.
