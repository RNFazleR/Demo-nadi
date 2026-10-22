// Paket CSI dari alat lewat UDP (firmware spike_fase0, nanti juga Fase 1).
// Header 24 byte, little-endian:
//   "NADI" | versi u8 | flag u8 | MAC alat (6) | seq u32 | rssi i8 | 0 | timestamp u32 | len u16
// lalu len angka CSI int8 (pasangan [imag, real], sama dengan baris CSI_DATA di serial).

export const CSI_HEADER_LEN = 24
const MAGIC = [0x4e, 0x41, 0x44, 0x49] // "NADI"

export function base64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// Kembalikan paket, atau null bila bukan paket NADI yang utuh.
export function decodeCsiPacket(bytes) {
  if (bytes.length < CSI_HEADER_LEN || MAGIC.some((b, i) => bytes[i] !== b)) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const len = view.getUint16(22, true)
  if (bytes.length !== CSI_HEADER_LEN + len) return null
  return {
    version: bytes[4],
    flags: bytes[5],
    deviceId: Array.from(bytes.subarray(6, 12), (b) => b.toString(16).padStart(2, '0')).join(':'),
    seq: view.getUint32(12, true),
    rssi: view.getInt8(16),
    espTimestamp: view.getUint32(18, true),
    values: new Int8Array(bytes.buffer, bytes.byteOffset + CSI_HEADER_LEN, len),
  }
}
