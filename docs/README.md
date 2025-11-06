# Panduan Pengisian - Setup Instructions

## Download PDF Guide

Untuk menggunakan fitur "Panduan Pengisian", Anda perlu mendownload file PDF dari Google Drive dan menempatkannya di folder ini.

### Langkah-langkah:

1. **Download PDF dari Google Drive:**
   - Kunjungi: https://drive.google.com/file/d/1So8z1qhSa2QSWMNsYoqFmjWmLtoT8Rv9/view?usp=drive_link
   - Klik tombol "Download" atau "Unduh"
   - Simpan file dengan nama: `panduan-pengisian.pdf`

2. **Tempatkan file di folder docs:**
   - Pindahkan file `panduan-pengisian.pdf` ke folder `docs/` ini
   - Pastikan nama file sesuai: `panduan-pengisian.pdf`

3. **Struktur folder yang benar:**
   ```
   CATAT V.2/
   ├── docs/
   │   ├── panduan-pengisian.pdf  ← File PDF harus ada di sini
   │   └── README.md
   ├── css/
   ├── js/
   └── index.html
   ```

### Catatan:
- Jika file PDF tidak ditemukan, modal akan menampilkan pesan error dengan link ke Google Drive
- Pastikan nama file sesuai dengan yang diharapkan oleh sistem: `panduan-pengisian.pdf`
- File PDF akan ditampilkan dalam popup modal di website, tidak membuka tab baru

### Troubleshooting:
- Jika PDF tidak muncul, periksa console browser untuk error
- Pastikan server web mendukung serving file PDF
- Jika menggunakan `file://` protocol, beberapa browser mungkin memblokir loading PDF