// Pemetaan tingkat status -> kelas Tailwind. Satu tempat supaya warna status konsisten.
// Tailwind butuh nama kelas utuh (bukan string dirangkai), jadi ditulis lengkap.

import tw from '../../tailwind.config.js'

const colors = tw.theme.extend.colors

export const STATUS_STYLES = {
  normal: {
    badge: 'bg-normal-bg text-normal-ink border border-normal-border',
    card: 'bg-normal-bg border-normal-border',
    solid: 'bg-normal text-surface',
    dot: 'bg-normal',
    text: 'text-normal-ink',
    hex: colors.normal.DEFAULT, // untuk Recharts (tidak bisa pakai kelas)
  },
  waspada: {
    badge: 'bg-waspada-bg text-waspada-ink border border-waspada-border',
    card: 'bg-waspada-bg border-waspada-border',
    solid: 'bg-waspada text-surface',
    dot: 'bg-waspada',
    text: 'text-waspada-ink',
    hex: colors.waspada.DEFAULT,
  },
  darurat: {
    badge: 'bg-darurat-bg text-darurat-ink border border-darurat-border',
    card: 'bg-darurat-bg border-darurat-border',
    solid: 'bg-darurat text-surface',
    dot: 'bg-darurat',
    text: 'text-darurat-ink',
    hex: colors.darurat.DEFAULT,
  },
}

// AlertEvent.tingkat memakai 'info'; secara visual disamakan dengan Normal.
export const levelToStatus = {
  info: 'normal',
  waspada: 'waspada',
  darurat: 'darurat',
}
