# Cara Build Aplikasi Desktop Windows (.exe)

## 📋 Persyaratan

- Node.js v18 atau lebih tinggi
- Git
- Windows OS (untuk build Windows .exe)

## 🚀 Langkah-Langkah Build

### 1. Export Project ke GitHub

1. Klik tombol **"Export to Github"** di Lovable
2. Clone repository ke komputer lokal Anda:
   ```bash
   git clone <url-repository-anda>
   cd tabungan-smk-globin
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Tambahkan Scripts ke package.json

Buka file `package.json` dan tambahkan scripts berikut di bagian `"scripts"`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    
    "electron": "electron .",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  }
}
```

### 4. Update package.json Main Entry

Tambahkan property `"main"` di root level package.json:

```json
{
  "name": "tabungan-smk-globin",
  "main": "electron/main.js",
  ...
}
```

### 5. Build untuk Production

#### Windows (.exe):
```bash
npm run electron:build:win
```

File installer akan tersedia di folder `release/`:
- `TABUNGAN SMK GLOBIN-Setup-{version}.exe` - Installer untuk Windows

#### Mac (.dmg):
```bash
npm run electron:build:mac
```

#### Linux (.AppImage, .deb):
```bash
npm run electron:build:linux
```

### 6. Testing Development Mode

Untuk test aplikasi desktop sebelum build:

```bash
npm run electron:dev
```

## 📦 Hasil Build

Setelah build selesai, file installer akan tersedia di folder `release/`:

- **Windows**: `TABUNGAN SMK GLOBIN-Setup-{version}.exe` (~100-150MB)
- **Mac**: `TABUNGAN SMK GLOBIN-{version}.dmg`
- **Linux**: `TABUNGAN-SMK-GLOBIN-{version}.AppImage`

## 💻 Distribusi Aplikasi

### Cara Install untuk End User:

1. Download file installer
2. Double-click file installer
3. Ikuti wizard instalasi
4. Aplikasi akan ter-install di Program Files
5. Shortcut akan dibuat di Desktop dan Start Menu
6. Aplikasi tetap terhubung ke database online Supabase

## 🔧 Troubleshooting

### Build Error "Cannot find module 'electron'"
```bash
npm install
```

### Build gagal di Windows
Pastikan Anda menjalankan di PowerShell atau Command Prompt dengan hak administrator

### Ukuran file terlalu besar
Ukuran normal untuk Electron app adalah 100-200MB karena include Chromium engine

### Database tidak terhubung
- Pastikan koneksi internet aktif
- Aplikasi tetap memerlukan internet untuk connect ke Supabase
- Offline mode tidak tersedia karena database online

## 📝 Catatan Penting

1. **Database Tetap Online**: Aplikasi desktop tetap memerlukan koneksi internet untuk terhubung ke database Supabase
2. **Auto-Update**: Untuk menambahkan fitur auto-update, bisa menggunakan electron-updater (advanced)
3. **Code Signing**: Untuk distribusi yang lebih professional, pertimbangkan untuk sign aplikasi dengan certificate
4. **Multi-Platform**: Build di Windows hanya bisa menghasilkan .exe, build di Mac untuk .dmg, dst.

## 🎯 Next Steps

Setelah build berhasil:
- Test installer di komputer lain
- Buat dokumentasi user untuk instalasi
- Setup hosting untuk distribusi file installer (Google Drive, website, dll)
- Pertimbangkan auto-update mechanism untuk update otomatis
