# About Page

Halaman About untuk aplikasi Our Paths yang menampilkan informasi tentang platform, developer, dan fitur komentar.

## Fitur

### 1. Hero Section
- Banner hero dengan gradient background
- Judul dan subtitle yang menarik
- Animasi fade-in saat load

### 2. About Website Section
- Deskripsi platform Our Paths
- Grid fitur dengan 4 kartu:
  - Location Tagging
  - Photo Sharing
  - Community
  - Privacy First

### 3. Developer Profile Section
- Foto profil developer
- Informasi personal (nama, NIM, kelas)
- Social media links (GitHub, LinkedIn, Instagram, Letterboxd)
- Deskripsi tentang developer
- Skills & Technologies tags

### 4. Comments Section
- Form untuk submit komentar (nama, email, pesan)
- Daftar komentar yang tersimpan di localStorage
- Toast notification saat berhasil submit
- Animasi smooth scroll

## Teknologi

- Vanilla JavaScript (ES6+)
- CSS3 dengan CSS Variables
- Font Awesome icons
- LocalStorage untuk menyimpan komentar
- Intersection Observer API untuk animasi scroll

## Struktur File

```
src/scripts/pages/about/
├── about-page.js       # Main component
└── README.md          # Dokumentasi
```

## Cara Kerja

1. **Render**: Menampilkan HTML struktur halaman
2. **afterRender**: Inisialisasi animasi, form handler, dan display comments
3. **Comments**: Disimpan di localStorage dengan key 'aboutComments'
4. **Animations**: Menggunakan Intersection Observer untuk fade-in effect

## Responsive Design

- Desktop: Grid layout untuk features dan profile
- Tablet: Adjusted spacing dan font sizes
- Mobile: Single column layout, stacked elements
