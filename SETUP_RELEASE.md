# Setup Release Scripts

Untuk mengaktifkan release automation, tambahkan scripts berikut ke `package.json`:

## Scripts yang Perlu Ditambahkan

Buka `package.json` dan tambahkan di bagian `"scripts"`:

```json
{
  "scripts": {
    "release": "node scripts/release.js patch",
    "release:patch": "node scripts/release.js patch",
    "release:minor": "node scripts/release.js minor",
    "release:major": "node scripts/release.js major"
  }
}
```

## Verifikasi Setup

Setelah menambahkan scripts, verifikasi dengan:

```bash
npm run release -- --help
```

Jika muncul usage instructions, setup berhasil!

## Penggunaan

```bash
# Patch release (bug fixes)
npm run release

# Minor release (new features)
npm run release:minor

# Major release (breaking changes)
npm run release:major
```

## Catatan Penting

- ✅ **File `scripts/release.js` sudah dibuat** - tidak perlu edit
- ✅ **GitHub Actions workflow sudah dikonfigurasi** - otomatis
- ⚠️ **Hanya perlu tambah 4 lines di package.json** - lihat di atas
- ⚠️ **Setup GitHub Secrets untuk code signing** - lihat RELEASE_GUIDE.md

## Next Steps

1. ✅ Tambah scripts ke package.json (di atas)
2. 📖 Baca [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) untuk setup code signing
3. 🚀 Jalankan `npm run release` untuk release pertama!
