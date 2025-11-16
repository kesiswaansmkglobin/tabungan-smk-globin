# 📜 Panduan Code Signing untuk Windows

Code signing menghilangkan warning Windows SmartScreen dan membuat aplikasi lebih dipercaya oleh pengguna.

## 🎯 Mengapa Code Signing Penting?

Tanpa code signing, Windows akan menampilkan warning:
- ❌ "Windows protected your PC"
- ❌ "Unknown publisher"
- ❌ User harus klik "More info" → "Run anyway"

Dengan code signing:
- ✅ Tidak ada SmartScreen warning
- ✅ Menampilkan nama publisher (SMK Globin)
- ✅ User langsung bisa install tanpa warning
- ✅ Lebih professional dan terpercaya

## 🛒 Cara Mendapatkan Code Signing Certificate

### Opsi 1: Certificate dari Certificate Authority (Recommended)

**Provider Terpercaya:**

1. **Sectigo (Comodo)** - $84-199/tahun
   - Website: https://sectigo.com/ssl-certificates-tls/code-signing
   - Paling populer untuk developer

2. **DigiCert** - $474-599/tahun
   - Website: https://www.digicert.com/signing/code-signing-certificates
   - Premium, trusted brand

3. **GlobalSign** - $249/tahun
   - Website: https://www.globalsign.com/en/code-signing-certificate
   - Balance antara harga dan reputasi

4. **Certum** - €86/tahun (~Rp 1.5 juta)
   - Website: https://www.certum.eu/certum/cert,offer_en_open_source_cs.xml
   - Lebih murah untuk open source

**Persyaratan Umum:**
- Dokumen perusahaan/organisasi (NPWP, Akta, SK, dll)
- Verifikasi email dan nomor telepon
- Kadang perlu video call verification
- Proses: 1-7 hari kerja

**File yang Anda Dapatkan:**
- File `.pfx` atau `.p12` (certificate + private key)
- Password untuk unlock certificate

### Opsi 2: Self-Signed Certificate (Gratis, Tapi Tetap Ada Warning)

⚠️ **Warning**: Self-signed certificate TIDAK menghilangkan SmartScreen warning. Hanya untuk testing internal.

```powershell
# Buat self-signed certificate (PowerShell Admin)
$cert = New-SelfSignedCertificate `
  -Type CodeSigningCert `
  -Subject "CN=SMK Globin, O=SMK Globin, C=ID" `
  -KeyUsage DigitalSignature `
  -FriendlyName "SMK Globin Code Signing" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}") `
  -NotAfter (Get-Date).AddYears(3)

# Export ke .pfx
$password = ConvertTo-SecureString -String "your-password" -Force -AsPlainText
$cert | Export-PfxCertificate -FilePath "$env:USERPROFILE\Desktop\smkglobin.pfx" -Password $password

# Copy file ke project
# New-Item -ItemType Directory -Force -Path ".\certificates"
# Copy-Item "$env:USERPROFILE\Desktop\smkglobin.pfx" -Destination ".\certificates\cert.pfx"
```

## 🔧 Setup Code Signing di Project

### 1. Simpan Certificate di Project

```bash
# Buat folder certificates
mkdir certificates

# Copy file .pfx ke folder
# certificates/cert.pfx
```

⚠️ **JANGAN** commit certificate ke Git! Tambahkan ke `.gitignore`:

```gitignore
# .gitignore
certificates/
*.pfx
*.p12
```

### 2. Konfigurasi electron-builder.json

File `electron-builder.json` sudah dikonfigurasi. Update bagian ini:

```json
{
  "win": {
    "certificateFile": "./certificates/cert.pfx",
    "certificatePassword": "",  // Atau gunakan environment variable
    "verifyUpdateCodeSignature": false,
    "signingHashAlgorithms": ["sha256"]
  }
}
```

### 3. Set Password via Environment Variable (Recommended)

Jangan hardcode password di config! Gunakan environment variable:

**Windows (PowerShell):**
```powershell
$env:CSC_KEY_PASSWORD="your-certificate-password"
npm run electron:build:win
```

**Windows (CMD):**
```cmd
set CSC_KEY_PASSWORD=your-certificate-password
npm run electron:build:win
```

**Atau buat file `.env` (jangan commit!):**
```env
CSC_KEY_PASSWORD=your-certificate-password
```

Kemudian update `electron-builder.json`:
```json
{
  "win": {
    "certificateFile": "./certificates/cert.pfx",
    "certificatePassword": "${CSC_KEY_PASSWORD}"
  }
}
```

## 🚀 Build dengan Code Signing

```bash
# Set password
$env:CSC_KEY_PASSWORD="your-password"

# Build
npm run electron:build:win

# Atau sekaligus:
$env:CSC_KEY_PASSWORD="your-password"; npm run electron:build:win
```

File installer yang dihasilkan akan ter-sign secara otomatis.

## ✅ Verifikasi Code Signing

### Cara 1: Properties Windows

1. Klik kanan file `.exe` → Properties
2. Tab "Digital Signatures"
3. Harus ada signature dari publisher Anda

### Cara 2: PowerShell

```powershell
Get-AuthenticodeSignature ".\release\TABUNGAN SMK GLOBIN-Setup-2.1.0.exe"
```

Output harus:
- `Status: Valid`
- `SignerCertificate: CN=SMK Globin`

### Cara 3: signtool (Windows SDK)

```cmd
signtool verify /pa ".\release\TABUNGAN SMK GLOBIN-Setup-2.1.0.exe"
```

## 📊 Perbandingan Certificate Providers

| Provider | Harga/Tahun | Proses | Reputasi | Rekomendasi |
|----------|-------------|--------|----------|-------------|
| Sectigo | $84-199 | 1-3 hari | ⭐⭐⭐⭐ | ✅ Best Value |
| DigiCert | $474-599 | 1-2 hari | ⭐⭐⭐⭐⭐ | Premium |
| GlobalSign | $249 | 2-5 hari | ⭐⭐⭐⭐ | Good |
| Certum | €86 | 3-7 hari | ⭐⭐⭐ | Budget |
| Self-Signed | Gratis | Instant | ⭐ | Testing only |

## 🎓 Tips & Best Practices

### 1. Timestamp Server

Tambahkan timestamp agar signature tetap valid setelah certificate expire:

```json
{
  "win": {
    "certificateFile": "./certificates/cert.pfx",
    "certificatePassword": "${CSC_KEY_PASSWORD}",
    "signingHashAlgorithms": ["sha256"],
    "rfc3161TimeStampServer": "http://timestamp.digicert.com"
  }
}
```

**Timestamp Servers:**
- DigiCert: `http://timestamp.digicert.com`
- Sectigo: `http://timestamp.sectigo.com`
- GlobalSign: `http://timestamp.globalsign.com`

### 2. Build Reputation

Even dengan certificate valid, installer baru mungkin masih ada warning karena belum punya "reputation". Build reputation dengan:
- Distribusi konsisten dari publisher yang sama
- Banyak user yang download & install tanpa masalah
- Waktu (1-2 minggu hingga reputation terbuild)

### 3. Security

- ✅ **DO**: Simpan certificate di lokasi aman
- ✅ **DO**: Gunakan password yang kuat
- ✅ **DO**: Backup certificate (.pfx) di tempat aman
- ❌ **DON'T**: Commit certificate ke Git
- ❌ **DON'T**: Share certificate password di public
- ❌ **DON'T**: Gunakan certificate yang sama untuk semua project

### 4. Extended Validation (EV) Certificate

Untuk reputation instant tanpa SmartScreen warning:
- EV Code Signing Certificate ($300-600/tahun)
- Butuh USB token/hardware security module
- No warning sejak install pertama kali
- Lebih mahal tapi worth it untuk distribusi besar

## 🔍 Troubleshooting

### Error: "Cannot find certificate file"
```bash
# Pastikan path benar
ls ./certificates/cert.pfx
```

### Error: "Invalid password"
```bash
# Test password dengan signtool
certutil -dump -p "your-password" ./certificates/cert.pfx
```

### Warning masih muncul meskipun signed
- Normal untuk installer baru (perlu build reputation)
- Pastikan timestamp server digunakan
- Cek certificate masih valid (belum expire)

### Build error di CI/CD
```bash
# Encrypt certificate untuk CI/CD
base64 ./certificates/cert.pfx > cert.pfx.base64

# Di CI/CD, decode kembali
echo $CERTIFICATE_BASE64 | base64 -d > ./certificates/cert.pfx
```

## 📚 Resources

- **Electron Builder Docs**: https://www.electron.build/code-signing
- **Microsoft Code Signing**: https://learn.microsoft.com/windows/win32/seccrypto/cryptography-tools
- **SmartScreen FAQ**: https://learn.microsoft.com/windows/security/threat-protection/windows-defender-smartscreen/windows-defender-smartscreen-overview

## 💰 Budget Workflow (Tanpa Code Signing)

Jika belum bisa beli certificate:

1. **Distribusi via Website Terpercaya**
   - Upload ke website sekolah dengan HTTPS
   - User cenderung percaya jika dari domain official

2. **Dokumentasi User Guide**
   - Buat panduan lengkap dengan screenshot
   - Jelaskan bahwa warning normal untuk aplikasi baru
   - "Klik More Info → Run Anyway"

3. **Build Reputation Secara Manual**
   - Distribute ke komunitas terpercaya dulu
   - Minta feedback positif
   - Setelah banyak download, reputation akan meningkat

4. **Hash Verification**
   - Provide SHA256 hash dari installer
   - User bisa verify integrity file
   ```powershell
   Get-FileHash "TABUNGAN SMK GLOBIN-Setup-2.1.0.exe" -Algorithm SHA256
   ```

---

**Next Step**: Setelah setup code signing, update `BUILD_INSTRUCTIONS.md` dan test build dengan certificate.
