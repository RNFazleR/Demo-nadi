// Pemetaan tingkat status -> kelas Tailwind. Satu tempat supaya warna status konsisten.
// Tailwind butuh nama kelas utuh (bukan string dirangkai), jadi ditulis lengkap.

import tw from '../../tailwind.config.js'

const colors = tw.theme.extend.colors

export const STATUS_STYLES = {
  normal: {
    badge: 'bg-normal-bg text-normal-ink border border-normal-border',
    card: 'bg-normal-bg border-normal-border',
    solid: 'bg-normal-strong text-surface', // teks putih >= 4,5:1
    dot: 'bg-normal',
    text: 'text-normal-ink',
  },
  waspada: {
    badge: 'bg-waspada-bg text-waspada-ink border border-waspada-border',
    card: 'bg-waspada-bg border-waspada-border',
    solid: 'bg-waspada-strong text-surface',
    dot: 'bg-waspada',
    text: 'text-waspada-ink',
    hex: colors.waspada.DEFAULT, // batang grafik Riwayat (Recharts tidak bisa pakai kelas)
    strongHex: colors.waspada.strong, // latar penanda "!" berteks putih di grafik
  },
  darurat: {
    badge: 'bg-darurat-bg text-darurat-ink border border-darurat-border',
    card: 'bg-darurat-bg border-darurat-border',
    solid: 'bg-darurat-strong text-surface',
    dot: 'bg-darurat',
    text: 'text-darurat-ink',
  },
}

// AlertEvent.tingkat memakai 'info'; secara visual disamakan dengan Normal.
export const levelToStatus = {
  info: 'normal',
  waspada: 'waspada',
  darurat: 'darurat',
}
