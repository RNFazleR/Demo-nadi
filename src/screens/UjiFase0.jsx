// Uji Fase 0: alat bantu pengembang untuk mengecek apakah HP ini bisa menjadi HP Pusat
// (terima UDP dari alat, pasang alat lewat BLE, Firebase di WebView, layar tetap menyala).
// Dibuka dari layar Masuk (Fitur demo). Dibuang setelah Fase 1.
import { useEffect, useRef, useState } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { BleClient, dataViewToText, textToDataView } from '@capacitor-community/bluetooth-le'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { copy } from '../data/copy.js'
import { base64ToBytes, decodeCsiPacket } from '../lib/csiPacket.js'
import { firebaseConfig, isFirebaseConfigured } from '../lib/firebase.js'
import { formatNumber } from '../lib/format.js'
import Icon from '../components/Icon.jsx'

const t = copy.uji
const isNative = Capacitor.isNativePlatform()
const UdpReceiver = registerPlugin('UdpReceiver')
const UDP_PORT = 5005

// Layanan BLE "NADI" di firmware spike_fase0
const BLE_SERVICE = '4e414449-0000-4000-8000-00000000a000'
const BLE_STATUS = '4e414449-0000-4000-8000-00000000a001'
const BLE_WIFI = '4e414449-0000-4000-8000-00000000a002'
const SCAN_MS = 10000

const FIELD =
  'block min-h-tap w-full rounded-btn border-2 border-line bg-surface px-4 text-body-lg text-ink focus:border-brand-600'
const PRIMARY =
  'flex min-h-tap w-full items-center justify-center rounded-btn bg-brand-600 px-5 text-body-lg font-bold text-surface hover:bg-brand-700 disabled:opacity-60'
const SECONDARY =
  'flex min-h-tap w-full items-center justify-center rounded-btn border-2 border-line px-5 text-body-lg font-bold text-ink'

export default function UjiFase0({ onBack }) {
  return (
    <div className="flex flex-1 flex-col gap-5 px-gutter pb-10 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-tap items-center gap-2 self-start rounded-btn px-2 text-body-lg font-semibold text-brand-700"
      >
        <Icon name="chevronLeft" className="h-5 w-5" strokeWidth={2.4} />
        {t.back}
      </button>
      <div>
        <span className="rounded-full bg-surface-muted px-3 py-0.5 text-body text-ink-soft">{t.demoTag}</span>
        <h1 className="mt-3 text-heading text-ink">{t.title}</h1>
        <p className="mt-2 text-body-lg text-ink-soft">{t.intro}</p>
      </div>
      <UdpTest />
      <BleTest />
      <FirebaseTest />
      <KeepAwakeTest />
    </div>
  )
}

function Card({ title, body, pass, children }) {
  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <h2 className="text-title text-ink">{title}</h2>
      {body && <p className="mt-1 text-body text-ink-soft">{body}</p>}
      <div className="mt-4 flex flex-col gap-3">{children}</div>
      <p className="mt-4 border-t border-dashed border-line pt-3 text-body text-ink-soft">
        <span className="font-bold text-ink">{t.passLabel}</span> {pass}
      </p>
    </section>
  )
}

function Stats({ rows }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-body">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-ink-soft">{label}</dt>
          <dd className="text-right font-bold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Message({ children }) {
  return (
    <p role="status" className="text-body font-semibold text-ink">
      {children}
    </p>
  )
}

/* 1. UDP: paket dari alat, laju per detik, celah nomor urut */
function UdpTest() {
  const [state, setState] = useState({ kind: 'idle' })
  const [stats, setStats] = useState(null)
  const acc = useRef(null)

  useEffect(() => {
    if (state.kind !== 'listening') return undefined
    const timer = setInterval(() => {
      const a = acc.current
      setStats({ ...a, rate: a.sinceTick })
      a.sinceTick = 0
    }, 1000)
    return () => clearInterval(timer)
  }, [state.kind])

  useEffect(() => () => {
    if (isNative) UdpReceiver.stop()
  }, [])

  const start = async () => {
    acc.current = { total: 0, sinceTick: 0, lost: 0, invalid: 0, lastSeq: null, from: null, device: null, rssi: null }
    setStats({ ...acc.current, rate: 0 })
    await UdpReceiver.removeAllListeners()
    await UdpReceiver.addListener('packets', ({ packets, from }) => {
      const a = acc.current
      a.from = from
      for (const b64 of packets) {
        const pkt = decodeCsiPacket(base64ToBytes(b64))
        if (!pkt) {
          a.invalid += 1
          continue
        }
        // Nomor urut mundur = alat restart -> mulai hitung celah dari awal
        if (a.lastSeq != null && pkt.seq > a.lastSeq) a.lost += pkt.seq - a.lastSeq - 1
        a.lastSeq = pkt.seq
        a.total += 1
        a.sinceTick += 1
        a.device = pkt.deviceId
        a.rssi = pkt.rssi
      }
    })
    try {
      await UdpReceiver.start({ port: UDP_PORT })
      setState({ kind: 'listening' })
    } catch (e) {
      setState({ kind: 'error', message: e.message })
    }
  }

  const stop = async () => {
    await UdpReceiver.stop()
    await UdpReceiver.removeAllListeners()
    setState({ kind: 'idle' })
  }

  const lostPct = stats && stats.total + stats.lost > 0 ? (stats.lost / (stats.total + stats.lost)) * 100 : 0

  return (
    <Card title={t.udp.title} body={t.udp.body} pass={t.udp.pass}>
      {!isNative ? (
        <Message>{t.onlyApk}</Message>
      ) : (
        <>
          <Message>
            {state.kind === 'error' ? t.udp.state.error(state.message) : t.udp.state[state.kind]}
          </Message>
          {stats && (
            <Stats
              rows={[
                [t.udp.rate, formatNumber(stats.rate, 0)],
                [t.udp.total, formatNumber(stats.total, 0)],
                [t.udp.lost, t.udp.lostValue(formatNumber(stats.lost, 0), formatNumber(lostPct, 1))],
                [t.udp.invalid, formatNumber(stats.invalid, 0)],
                [t.udp.from, stats.from ?? t.udp.none],
                [t.udp.device, stats.device ?? t.udp.none],
                [t.udp.rssi, stats.rssi != null ? t.udp.rssiValue(stats.rssi) : t.udp.none],
              ]}
            />
          )}
          {state.kind === 'listening' ? (
            <button type="button" onClick={stop} className={SECONDARY}>
              {t.udp.stop}
            </button>
          ) : (
            <button type="button" onClick={start} className={PRIMARY}>
              {t.udp.start}
            </button>
          )}
        </>
      )}
    </Card>
  )
}

/* 2. BLE: cari NADI-XXXX, sambungkan, baca/notify status, kirim nama & sandi hotspot */
function BleTest() {
  const [phase, setPhase] = useState('idle') // idle | scanning | connecting | connected
  const [devices, setDevices] = useState([])
  const [device, setDevice] = useState(null)
  const [deviceStatus, setDeviceStatus] = useState('')
  const [ssid, setSsid] = useState('')
  const [pass, setPass] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => () => {
    if (device) BleClient.disconnect(device.deviceId).catch(() => {})
  }, [device])

  const fail = (e) => setNote(t.ble.error(e.message ?? String(e)))

  const scan = async () => {
    setNote('')
    setDevices([])
    try {
      await BleClient.initialize({ androidNeverForLocation: true })
      setPhase('scanning')
      await BleClient.requestLEScan({ namePrefix: 'NADI-' }, (result) => {
        const found = { deviceId: result.device.deviceId, name: result.device.name ?? result.localName }
        setDevices((list) => (list.some((d) => d.deviceId === found.deviceId) ? list : [...list, found]))
      })
      setTimeout(async () => {
        // Tetap kembali ke "idle" walau stopLEScan gagal, supaya tidak tertahan di "Mencari…"
        await BleClient.stopLEScan().catch(() => {})
        setPhase((p) => (p === 'scanning' ? 'idle' : p))
      }, SCAN_MS)
    } catch (e) {
      setPhase('idle')
      fail(e)
    }
  }

  const connect = async (d) => {
    setNote('')
    setPhase('connecting')
    try {
      await BleClient.stopLEScan().catch(() => {})
      await BleClient.connect(d.deviceId, () => {
        setDevice(null)
        setPhase('idle')
      })
      setDevice(d)
      setDeviceStatus(dataViewToText(await BleClient.read(d.deviceId, BLE_SERVICE, BLE_STATUS)))
      await BleClient.startNotifications(d.deviceId, BLE_SERVICE, BLE_STATUS, (v) => setDeviceStatus(dataViewToText(v)))
      setPhase('connected')
    } catch (e) {
      setPhase('idle')
      fail(e)
    }
  }

  const disconnect = async () => {
    if (device) await BleClient.disconnect(device.deviceId).catch(() => {})
    setDevice(null)
    setPhase('idle')
  }

  const send = async (e) => {
    e.preventDefault()
    setNote('')
    try {
      await BleClient.write(device.deviceId, BLE_SERVICE, BLE_WIFI, textToDataView(`${ssid.trim()}\t${pass}`))
      setPass('')
      setNote(t.ble.sent)
    } catch (err) {
      fail(err)
    }
  }

  return (
    <Card title={t.ble.title} body={t.ble.body} pass={t.ble.pass}>
      {!isNative ? (
        <Message>{t.onlyApk}</Message>
      ) : phase === 'connected' ? (
        <>
          <Message>{t.ble.connected(device.name)}</Message>
          <Stats rows={[[t.ble.deviceStatus, deviceStatus || t.udp.none]]} />
          <form onSubmit={send} className="flex flex-col gap-3">
            <label className="text-body-lg font-bold text-ink">
              {t.ble.ssid}
              <input value={ssid} onChange={(e) => setSsid(e.target.value)} autoCapitalize="none" className={`mt-1 ${FIELD}`} />
            </label>
            <label className="text-body-lg font-bold text-ink">
              {t.ble.password}
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className={`mt-1 ${FIELD}`} />
            </label>
            <button type="submit" disabled={!ssid.trim()} className={PRIMARY}>
              {t.ble.send}
            </button>
          </form>
          <button type="button" onClick={disconnect} className={SECONDARY}>
            {t.ble.disconnect}
          </button>
        </>
      ) : (
        <>
          {phase === 'scanning' && <Message>{t.ble.scanning}</Message>}
          {phase === 'connecting' && <Message>{t.ble.connecting}</Message>}
          {phase === 'idle' && devices.length === 0 && note === '' && <Message>{t.ble.none}</Message>}
          {devices.map((d) => (
            <button key={d.deviceId} type="button" onClick={() => connect(d)} className={SECONDARY}>
              {t.ble.connect(d.name)}
            </button>
          ))}
          <button type="button" onClick={scan} disabled={phase !== 'idle'} className={PRIMARY}>
            {t.ble.scan}
          </button>
        </>
      )}
      {note && <Message>{note}</Message>}
    </Card>
  )
}

/* 3. Firebase: login email/sandi akun uji, tulis lalu baca ulang, ukur waktunya */
function FirebaseTest() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [result, setResult] = useState('')
  const [running, setRunning] = useState(false)

  const run = async (e) => {
    e.preventDefault()
    setRunning(true)
    setResult('')
    try {
      // Dimuat hanya saat uji dijalankan, supaya Firebase tidak memperbesar app utama
      const [{ initializeApp, getApps }, { getAuth, signInWithEmailAndPassword, signOut }, { getDatabase, ref, set, get }] =
        await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/database')])
      const app = getApps()[0] ?? initializeApp(firebaseConfig)
      const auth = getAuth(app)
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), pass)
      const db = getDatabase(app)
      const started = performance.now()
      const node = ref(db, `uji/${user.uid}`)
      await set(node, { mark: Math.round(started) })
      await get(node)
      setResult(t.firebase.ok(formatNumber(performance.now() - started, 0)))
      await signOut(auth)
    } catch (err) {
      setResult(t.firebase.failed(err.code ?? err.message))
    } finally {
      setPass('')
      setRunning(false)
    }
  }

  return (
    <Card title={t.firebase.title} pass={t.firebase.pass}>
      {!isFirebaseConfigured ? (
        <Message>{t.firebase.notConfigured}</Message>
      ) : (
        <form onSubmit={run} className="flex flex-col gap-3">
          <label className="text-body-lg font-bold text-ink">
            {t.firebase.email}
            <input
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 ${FIELD}`}
            />
          </label>
          <label className="text-body-lg font-bold text-ink">
            {t.firebase.password}
            <input
              type="password"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className={`mt-1 ${FIELD}`}
            />
          </label>
          <button type="submit" disabled={running || !email.trim() || !pass} className={PRIMARY}>
            {running ? t.firebase.running : t.firebase.run}
          </button>
        </form>
      )}
      {result && <Message>{result}</Message>}
    </Card>
  )
}

/* 4. Keep-awake: layar dijaga menyala, catat jeda terlama antar detik (WebView tertahan?) */
function KeepAwakeTest() {
  const [supported, setSupported] = useState(null)
  const [on, setOn] = useState(false)
  const [run, setRun] = useState({ elapsed: 0, longestGap: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    KeepAwake.isSupported()
      .then(({ isSupported }) => setSupported(isSupported))
      .catch(() => setSupported(false))
  }, [])

  useEffect(() => {
    if (!on) return undefined
    const started = performance.now()
    let last = started
    let longest = 0
    const timer = setInterval(() => {
      const now = performance.now()
      longest = Math.max(longest, now - last)
      last = now
      setRun({ elapsed: now - started, longestGap: longest })
    }, 1000)
    return () => clearInterval(timer)
  }, [on])

  useEffect(() => () => {
    KeepAwake.allowSleep().catch(() => {})
  }, [])

  const toggle = async () => {
    setError('')
    try {
      if (on) await KeepAwake.allowSleep()
      else {
        await KeepAwake.keepAwake()
        setRun({ elapsed: 0, longestGap: 0 })
      }
      setOn(!on)
    } catch (e) {
      setError(t.keepAwake.failed(e.message))
    }
  }

  const totalSec = Math.floor(run.elapsed / 1000)

  return (
    <Card title={t.keepAwake.title} pass={t.keepAwake.pass}>
      {supported === false ? (
        <Message>{t.keepAwake.unsupported}</Message>
      ) : (
        <>
          <Stats
            rows={[
              [t.keepAwake.elapsed, t.keepAwake.duration(Math.floor(totalSec / 60), totalSec % 60)],
              [t.keepAwake.longestGap, t.keepAwake.gapValue(formatNumber(run.longestGap / 1000, 1))],
            ]}
          />
          <button type="button" onClick={toggle} disabled={supported == null} className={on ? SECONDARY : PRIMARY}>
            {on ? t.keepAwake.off : t.keepAwake.on}
          </button>
          {error && <Message>{error}</Message>}
        </>
      )}
    </Card>
  )
}
