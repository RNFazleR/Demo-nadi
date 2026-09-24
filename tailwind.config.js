/**
 * Design tokens NADI.
 * Nuansa: hangat & menenangkan (krem, sage, peach), bukan putih-biru rumah sakit.
 * Semua warna/ukuran di komponen WAJIB pakai token di sini, jangan hex/px lepas.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Latar & permukaan
        canvas: '#FBF6EF', // latar aplikasi, krem hangat
        surface: {
          DEFAULT: '#FFFFFF', // kartu
          muted: '#F5EDE3', // kartu sekunder, input
          sunken: '#EFE4D6', // divider tebal, track progress
        },
        line: '#E7DCCD', // border & garis grafik

        // Teks (kontras >= 4.5:1 terhadap canvas)
        ink: {
          DEFAULT: '#2F2A25', // teks utama
          soft: '#5C534A', // teks sekunder
          faint: '#857A6E', // hanya untuk teks >= 18px / ikon
        },

        // Warna brand
        brand: {
          50: '#EEF5F0',
          100: '#D7E8DD',
          300: '#94BFA4',
          500: '#4F8A6E', // sage, warna utama NADI
          600: '#3F7259',
          700: '#315A46',
        },
        accent: {
          100: '#FCE6D8',
          300: '#F2B48E',
          500: '#E08A5B', // peach/terracotta lembut untuk sorotan
        },

        // Tiga tingkat status — pakai HANYA lewat token ini
        normal: {
          bg: '#E6F2EA',
          border: '#B9D9C4',
          DEFAULT: '#3F8A5F',
          ink: '#24583A',
        },
        waspada: {
          bg: '#FDF1DC',
          border: '#F1D29A',
          DEFAULT: '#D48A1F',
          ink: '#8A5510',
        },
        darurat: {
          bg: '#FBE4DF',
          border: '#EDB3A6',
          DEFAULT: '#C4513A',
          ink: '#8C2F1E',
        },
      },

      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', 'Segoe UI', 'sans-serif'],
      },

      // Skala huruf semantik. Minimum teks isi = 16px (body).
      // `caption` (14px) hanya untuk label sumbu grafik / keterangan kecil non-esensial.
      fontSize: {
        caption: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        body: ['1rem', { lineHeight: '1.5rem' }], // 16px
        'body-lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        title: ['1.375rem', { lineHeight: '1.875rem', fontWeight: '700' }], // 22px
        heading: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '800' }], // 28px
        display: ['2.25rem', { lineHeight: '2.625rem', fontWeight: '800' }], // 36px
        // Khusus layar lansia: minimum 24px
        'elder-body': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }], // 24px
        'elder-btn': ['1.75rem', { lineHeight: '2.125rem', fontWeight: '800' }], // 28px
        'elder-title': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '800' }], // 36px
        'elder-count': ['4rem', { lineHeight: '4rem', fontWeight: '800' }], // 64px
      },

      borderRadius: {
        chip: '0.625rem', // 10px
        btn: '0.875rem', // 14px
        card: '1.25rem', // 20px
        sheet: '1.75rem', // 28px, bottom sheet / frame HP
      },

      boxShadow: {
        card: '0 1px 2px rgba(80, 60, 40, 0.06), 0 4px 16px rgba(80, 60, 40, 0.06)',
        raised: '0 8px 28px rgba(80, 60, 40, 0.12)',
        phone: '0 24px 60px rgba(80, 60, 40, 0.18)',
      },

      maxWidth: {
        phone: '26.875rem', // 430px — batas lebar konten di layar besar
      },

      spacing: {
        gutter: '1.25rem', // 20px, padding samping layar
      },

      minHeight: {
        tap: '3rem', // 48px, target sentuh minimum
        'tap-elder': '5.5rem', // 88px, tombol di layar lansia
      },
    },
  },
  plugins: [],
}
