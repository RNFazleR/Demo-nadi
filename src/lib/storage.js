// localStorage yang aman: bisa kosong/terblokir (mode privat, pratinjau), jadi semua akses
// dibungkus try/catch dan app tetap jalan tanpa penyimpanan.
export function readStored(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStored(key, value) {
  try {
    if (value == null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // abaikan: nilai hanya bertahan selama sesi ini
  }
}
