# 🚀 Panduan Publish & Distribution

Panduan lengkap untuk publish update dan distribusi aplikasi desktop.

## 📦 Metode Distribusi

### Opsi 1: GitHub Releases + Auto-Update (Recommended)

**Keuntungan:**
- ✅ Auto-update untuk semua user
- ✅ Hosting gratis unlimited
- ✅ Version management built-in
- ✅ Changelog tracking
- ✅ Download statistics

**Setup:**

1. **Buat GitHub Repository** (jika belum):
   ```bash
   # Via Lovable: Export to GitHub button
   # Atau manual:
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/tabungan-smk-globin.git
   git push -u origin main
   ```

2. **Generate GitHub Personal Access Token**:
   - Buka: https://github.com/settings/tokens/new
   - Token name: `electron-builder-publish`
   - Expiration: No expiration (atau sesuai kebutuhan)
   - Pilih scopes:
     - ✅ `repo` (Full control of private repositories)
   - Generate token
   - **COPY TOKEN** (tidak akan muncul lagi!)

3. **Set Environment Variable**:
   
   **Windows (PowerShell) - Temporary:**
   ```powershell
   $env:GH_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```
   
   **Windows (PowerShell) - Permanent:**
   ```powershell
   [System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_xxxxx', 'User')
   ```
   
   **Windows (CMD):**
   ```cmd
   set GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Update electron-builder.json**:
   ```json
   {
     "publish": {
       "provider": "github",
       "owner": "your-github-username",
       "repo": "tabungan-smk-globin",
       "releaseType": "release"
     }
   }
   ```

5. **Update Version di package.json**:
   ```json
   {
     "version": "2.1.0"
   }
   ```

6. **Build & Publish**:
   ```bash
   # Set token (jika belum)
   $env:GH_TOKEN="your-token"
   
   # Build dan publish sekaligus
   npm run electron:build:win -- --publish always
   ```

7. **Hasil**:
   - File installer ter-upload ke GitHub Releases
   - Auto-create release dengan changelog
   - User dengan app versi lama akan otomatis dapat notif update
   - Check di: `https://github.com/your-username/tabungan-smk-globin/releases`

### Opsi 2: Manual Distribution

Jika tidak mau setup GitHub releases atau untuk distribusi internal:

**A. Google Drive**
```bash
# Build
npm run electron:build:win

# Upload file dari release/ ke Google Drive
# Share link dengan setting "Anyone with the link can view"
```

**B. Dropbox**
```bash
# Build
npm run electron:build:win

# Upload ke Dropbox
# Get shared link
```

**C. Website Internal**
```bash
# Build
npm run electron:build:win

# Upload ke hosting sekolah via FTP/cPanel
# URL: https://smkglobin.sch.id/downloads/tabungan-setup.exe
```

**D. File Server/NAS Internal**
```bash
# Build
npm run electron:build:win

# Copy ke network drive
# \\server\software\TABUNGAN SMK GLOBIN-Setup-2.1.0.exe
```

⚠️ **Note**: Dengan metode manual, auto-update TIDAK akan bekerja. User harus download versi baru secara manual.

## 🔄 Workflow Update

### Release Update Baru

1. **Update Code**:
   - Buat perubahan di aplikasi
   - Test secara lokal
   - Commit changes

2. **Update Version**:
   ```json
   // package.json
   {
     "version": "2.2.0"  // Increment version
   }
   ```

3. **Build & Publish**:
   ```bash
   $env:GH_TOKEN="your-token"
   npm run electron:build:win -- --publish always
   ```

4. **Create Release Notes** (otomatis):
   - GitHub akan create release dengan tag `v2.2.0`
   - Atau manual edit release notes di GitHub

5. **User Auto-Update**:
   - User dengan app versi lama akan dapat notif dalam 6 jam
   - Atau bisa manual "Cek Update" dari menu Help
   - Download + install otomatis

### Versioning Scheme

Gunakan Semantic Versioning (SemVer):

- **MAJOR.MINOR.PATCH** (e.g., 2.1.0)
  - **MAJOR**: Breaking changes (2.0.0 → 3.0.0)
  - **MINOR**: New features backward-compatible (2.1.0 → 2.2.0)
  - **PATCH**: Bug fixes (2.1.0 → 2.1.1)

Examples:
```
2.1.0 → 2.1.1  # Bug fix
2.1.1 → 2.2.0  # New feature
2.2.0 → 3.0.0  # Breaking change
```

### Pre-release Versions

Untuk beta testing:

```json
{
  "version": "2.2.0-beta.1"
}
```

```bash
# Publish sebagai pre-release
npm run electron:build:win -- --publish always
```

Di GitHub, tandai sebagai "Pre-release" agar user stable tidak dapat update beta.

## 📊 Monitoring & Analytics

### GitHub Insights

Check download statistics:
- Buka: `https://github.com/your-username/tabungan-smk-globin/releases`
- Setiap release menampilkan download count per asset

### Custom Analytics (Optional)

Track update adoption dengan menambahkan analytics:

```javascript
// electron/main.js
const { net } = require('electron');

// Log app launch
function logAppLaunch() {
  const request = net.request({
    method: 'POST',
    protocol: 'https:',
    hostname: 'your-analytics-endpoint.com',
    path: '/track',
  });
  
  request.write(JSON.stringify({
    event: 'app_launch',
    version: app.getVersion(),
    platform: process.platform,
    timestamp: new Date().toISOString()
  }));
  
  request.end();
}

app.whenReady().then(() => {
  logAppLaunch();
  // ... rest of code
});
```

## 🔐 Security Best Practices

### 1. Secure Token Storage

**NEVER commit tokens ke Git!**

```bash
# Check if .gitignore includes:
.env
.env.*
```

### 2. GitHub Token Permissions

Minimum required permissions:
- `repo` scope only
- Regularly rotate tokens (every 90 days)

### 3. Release Verification

Always provide checksums untuk verify integrity:

```bash
# Generate SHA256 checksum
certutil -hashfile "TABUNGAN SMK GLOBIN-Setup-2.1.0.exe" SHA256

# Include checksum in release notes
```

### 4. Code Signing

Lihat **CODE_SIGNING_GUIDE.md** untuk setup code signing certificate.

## 📱 Multi-Platform Distribution

Jika perlu build untuk platform lain:

### macOS:
```bash
npm run electron:build:mac -- --publish always
```

### Linux:
```bash
npm run electron:build:linux -- --publish always
```

### All Platforms:
```bash
npm run electron:build -- --publish always -wml  # Windows, Mac, Linux
```

⚠️ **Note**: 
- macOS build requires macOS with Xcode
- Linux build works on Windows/Mac via Docker
- Windows build works on all platforms

## 🎓 Distribution Checklist

Sebelum publish release baru:

- [ ] Update version di `package.json`
- [ ] Test build lokal berfungsi
- [ ] Update CHANGELOG.md dengan perubahan
- [ ] Test di komputer lain (fresh install)
- [ ] Verify auto-update bekerja
- [ ] Code signing certificate valid (jika ada)
- [ ] GitHub token masih valid
- [ ] Create backup installer file
- [ ] Update dokumentasi user (jika ada perubahan UI)
- [ ] Notifikasi user via email/WhatsApp/website

## 📝 Release Notes Template

Contoh release notes yang baik:

```markdown
## Version 2.2.0 - 2025-01-15

### ✨ New Features
- Tambah fitur export laporan ke PDF
- Integrasi WhatsApp notification untuk transaksi

### 🐛 Bug Fixes
- Fix error saat import data siswa dengan NIS duplikat
- Fix tampilan tidak responsive di layar 1366x768

### 🔧 Improvements
- Percepat loading dashboard 50%
- Update tema warna untuk kontras lebih baik

### 📦 Installation
Download installer dari link di bawah. Jika sudah menginstall versi sebelumnya, aplikasi akan auto-update.

**Download**: [TABUNGAN-SMK-GLOBIN-Setup-2.2.0.exe](url)

**SHA256 Checksum**:
```
abc123...xyz789
```

**System Requirements**:
- Windows 10/11 (64-bit)
- 4GB RAM minimum
- 200MB disk space
- Internet connection
```

## 🆘 Troubleshooting

### "Failed to publish artifacts" error

```bash
# Check token validity
curl -H "Authorization: token $GH_TOKEN" https://api.github.com/user

# Regenerate token if expired
```

### "Release already exists" error

```bash
# Delete existing release
gh release delete v2.1.0

# Or increment version and rebuild
```

### Auto-update not working

1. Check GitHub releases ada dan public
2. Verify `electron-builder.json` publish config correct
3. Check app dapat akses internet
4. Check firewall tidak block electron-updater
5. Verify latest.yml file ter-generate

### "Cannot find latest.yml"

```bash
# Ensure --publish always flag digunakan
npm run electron:build:win -- --publish always

# Check release/ folder untuk latest.yml
ls release/
```

## 📚 Resources

- **Electron Builder**: https://www.electron.build/
- **electron-updater**: https://www.electron.build/auto-update
- **GitHub Releases**: https://docs.github.com/en/repositories/releasing-projects-on-github
- **Semantic Versioning**: https://semver.org/

---

**Questions?** Check BUILD_INSTRUCTIONS.md dan CODE_SIGNING_GUIDE.md untuk detail lebih lanjut.
