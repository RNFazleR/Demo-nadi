/* Firmware NADI (ESP32-S3), Fase 1.

   Pemasangan: BLE "NADI-XXXX" menerima nama & sandi hotspot HP Pusat (karakteristik wifi,
   "nama\tsandi") -> disimpan di NVS. BLE hanya menyala saat belum tersambung; 5 dtk setelah
   tersambung BLE dimatikan (BLE aktif memaksa power save WiFi -> laju CSI turun ke ±22/dtk,
   uji Fase 0). Bila hotspot hilang > 30 dtk, BLE menyala lagi supaya bisa dipasang ulang.

   Data: ping gateway (= HP Pusat) tiap 20 ms -> CSI tiap balasan -> UDP ke gateway:5005
   (header lihat src/lib/csiPacket.js) + baris CSI_DATA di USB untuk terminal laptop.

   Perintah (baris teks lewat USB dari csi_bridge.py, atau karakteristik cmd lewat BLE):
     PAUSE / RESUME  jeda / lanjut pemantauan (saat jeda dikirim paket kosong ber-flag tiap 1 dtk)
     RECAL           minta kalibrasi ulang (nomor sesi kalibrasi di header UDP naik)
     FORGET          lupakan hotspot, BLE menyala lagi */
#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_mac.h"
#include "esp_netif.h"
#include "esp_timer.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "ping/ping_sock.h"
#include "lwip/sockets.h"
#include "driver/usb_serial_jtag.h"
#include "driver/usb_serial_jtag_vfs.h"
#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"
#include "host/ble_hs.h"
#include "host/util/util.h"
#include "services/gap/ble_svc_gap.h"
#include "services/gatt/ble_svc_gatt.h"

/* Kredensial cadangan untuk pengembangan (opsional, tidak di-commit). Produk memakai BLE -> NVS. */
#if __has_include("wifi_secrets.h")
#include "wifi_secrets.h"
#endif

#define TAG              "NADI"
#define UDP_PORT         5005
#define PING_INTERVAL_MS 20
#define CSI_PERIOD_US    20000      // rata-rata maks 50 paket/dtk ...
#define CSI_BURST_US     60000      // ... tapi boleh 3 berdekatan (jitter), tidak dibuang
#define CSI_BUF_MAX      128        // LLTF saja = 64 subcarrier x 2
#define CSI_QUEUE_LEN    32
#define HDR_LEN          24
#define BLE_OFF_AFTER_MS 5000       // beri waktu app membaca status "tersambung" lewat BLE
#define BLE_ON_AFTER_MS  30000      // hotspot hilang selama ini -> BLE menyala lagi

#define FLAG_PAUSED      0x01

/* UUID 128-bit "NADI": 4e414449-0000-4000-8000-00000000a00X (urutan byte little-endian) */
#define NADI_UUID(x) BLE_UUID128_INIT(x, 0xa0, 0, 0, 0, 0, 0, 0x80, 0, 0x40, 0, 0, 0x49, 0x44, 0x41, 0x4e)
static const ble_uuid128_t SVC_UUID    = NADI_UUID(0x00);
static const ble_uuid128_t STATUS_UUID = NADI_UUID(0x01);
static const ble_uuid128_t WIFI_UUID   = NADI_UUID(0x02);
static const ble_uuid128_t CMD_UUID    = NADI_UUID(0x03);

typedef struct {
    uint32_t seq;
    int8_t   rssi;
    uint32_t ts;
    uint16_t len;
    int8_t   buf[CSI_BUF_MAX];
} csi_pkt_t;

static QueueHandle_t s_queue;
static uint8_t  s_mac[6];
static uint8_t  s_ap_bssid[6];
static volatile bool s_got_ip = false;
static esp_ip4_addr_t s_ip, s_gw;
static bool     s_ping_started = false;
static volatile int s_last_reason = 0;
static volatile int64_t s_lost_since = 0;   // esp_timer saat hotspot hilang (0 = tersambung/belum pernah)
static volatile int64_t s_got_ip_at = 0;
static uint32_t s_seq = 0, s_last_ts = 0, s_credit_us = CSI_BURST_US;
static volatile bool    s_paused = false;
static volatile uint8_t s_recal = 0;

/* BLE */
static volatile bool s_ble_on = false;
static uint8_t  s_own_addr_type;
static uint16_t s_conn = BLE_HS_CONN_HANDLE_NONE;
static uint16_t s_status_handle;
static char     s_status[64] = "menunggu";

static void ble_start(void);
static void ble_stop(void);

/* ---------- WiFi ---------- */

static bool load_creds(char *ssid, size_t ls, char *pass, size_t lp)
{
    nvs_handle_t h;
    if (nvs_open("nadi", NVS_READONLY, &h) == ESP_OK) {
        bool ok = nvs_get_str(h, "ssid", ssid, &ls) == ESP_OK && nvs_get_str(h, "pass", pass, &lp) == ESP_OK;
        nvs_close(h);
        if (ok) return true;
    }
#ifdef WIFI_SSID
    strlcpy(ssid, WIFI_SSID, ls);
    strlcpy(pass, WIFI_PASS, lp);
    return true;
#else
    return false;
#endif
}

static void save_creds(const char *ssid, const char *pass)
{
    nvs_handle_t h;
    if (nvs_open("nadi", NVS_READWRITE, &h) != ESP_OK) return;
    nvs_set_str(h, "ssid", ssid);
    nvs_set_str(h, "pass", pass);
    nvs_commit(h);
    nvs_close(h);
}

static void set_status(const char *text)
{
    strlcpy(s_status, text, sizeof s_status);
    if (s_ble_on && s_conn != BLE_HS_CONN_HANDLE_NONE) ble_gatts_chr_updated(s_status_handle);
}

static void connect_with(const char *ssid, const char *pass)
{
    wifi_config_t cfg = {0};
    strlcpy((char *)cfg.sta.ssid, ssid, sizeof cfg.sta.ssid);
    strlcpy((char *)cfg.sta.password, pass, sizeof cfg.sta.password);
    s_got_ip = false;
    esp_wifi_disconnect();
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &cfg));
    esp_wifi_connect();
    set_status("menyambung");
    ESP_LOGI(TAG, "Menyambung ke hotspot \"%s\"", ssid);
}

static void forget_creds(void)
{
    nvs_handle_t h;
    if (nvs_open("nadi", NVS_READWRITE, &h) == ESP_OK) {
        nvs_erase_all(h);
        nvs_commit(h);
        nvs_close(h);
    }
    s_got_ip = false;
    s_lost_since = 0;
    wifi_config_t empty = {0};
    esp_wifi_disconnect();
    esp_wifi_set_config(WIFI_IF_STA, &empty);
    set_status("menunggu");
    ESP_LOGI(TAG, "Hotspot dilupakan; pasang ulang lewat BLE");
    ble_start();
}

static void start_ping(void)
{
    ip_addr_t target = {0};
    target.type = IPADDR_TYPE_V4;
    target.u_addr.ip4.addr = s_gw.addr;
    esp_ping_config_t cfg = ESP_PING_DEFAULT_CONFIG();
    cfg.target_addr = target;
    cfg.count       = ESP_PING_COUNT_INFINITE;
    cfg.interval_ms = PING_INTERVAL_MS;
    cfg.timeout_ms  = 1000;
    esp_ping_callbacks_t cbs = {0};
    esp_ping_handle_t ping;
    ESP_ERROR_CHECK(esp_ping_new_session(&cfg, &cbs, &ping));
    ESP_ERROR_CHECK(esp_ping_start(ping));
}

static void wifi_event_handler(void *arg, esp_event_base_t base, int32_t id, void *data)
{
    if (base == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED) {
        int reason = ((wifi_event_sta_disconnected_t *)data)->reason;
        if (s_got_ip || reason != s_last_reason) {
            /* reason 201 = hotspot tidak ketemu (mati / 5 GHz / nama salah), 15/202 = sandi salah */
            ESP_LOGW(TAG, "Putus/gagal connect (reason %d), mencoba lagi", reason);
        }
        if (s_got_ip || !s_lost_since) s_lost_since = esp_timer_get_time();
        s_got_ip = false;
        s_last_reason = reason;
        char st[24];
        snprintf(st, sizeof st, "gagal:%d", reason);
        set_status(st);
        wifi_config_t cfg;
        if (esp_wifi_get_config(WIFI_IF_STA, &cfg) == ESP_OK && cfg.sta.ssid[0]) esp_wifi_connect();
    } else if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *e = (ip_event_got_ip_t *)data;
        s_ip = e->ip_info.ip;
        s_gw = e->ip_info.gw;
        wifi_ap_record_t ap;
        if (esp_wifi_sta_get_ap_info(&ap) == ESP_OK) {
            memcpy(s_ap_bssid, ap.bssid, 6);
            ESP_LOGI(TAG, "Terhubung ke %s, channel %d", (char *)ap.ssid, ap.primary);
        }
        s_last_reason = 0;
        s_lost_since = 0;
        s_got_ip_at = esp_timer_get_time();
        s_got_ip = true;
        char st[64];
        snprintf(st, sizeof st, "tersambung ip=" IPSTR " gw=" IPSTR, IP2STR(&s_ip), IP2STR(&s_gw));
        set_status(st);
        ESP_LOGI(TAG, "IP " IPSTR ", mengirim ke HP Pusat " IPSTR ":%d", IP2STR(&s_ip), IP2STR(&s_gw), UDP_PORT);
        if (!s_ping_started) {
            start_ping();
            s_ping_started = true;
        }
    }
}

/* ---------- CSI -> UDP + USB ---------- */

static void wifi_csi_cb(void *ctx, wifi_csi_info_t *info)
{
    if (!info || !info->buf || !s_got_ip || s_paused) return;
    if (memcmp(info->mac, s_ap_bssid, 6) != 0) return;   // hanya paket dari hotspot

    /* Batas laju "token bucket": rata-rata <= 50/dtk, tapi paket ping yang datang berdekatan
       karena jitter tetap diterima (batas jarak 18 ms membuang ±7/dtk di uji Fase 0). */
    uint32_t ts = info->rx_ctrl.timestamp;
    if (s_last_ts) {
        s_credit_us += ts - s_last_ts;
        if (s_credit_us > CSI_BURST_US) s_credit_us = CSI_BURST_US;
    }
    s_last_ts = ts;
    if (s_credit_us < CSI_PERIOD_US) return;
    s_credit_us -= CSI_PERIOD_US;

    csi_pkt_t pkt;
    pkt.seq  = s_seq++;
    pkt.rssi = info->rx_ctrl.rssi;
    pkt.ts   = ts;
    pkt.len  = info->len > CSI_BUF_MAX ? CSI_BUF_MAX : info->len;
    memcpy(pkt.buf, info->buf, pkt.len);
    if (info->first_word_invalid) memset(pkt.buf, 0, pkt.len < 4 ? pkt.len : 4);  // 4 byte awal tidak valid
    xQueueSend(s_queue, &pkt, 0);                                                   // penuh -> dibuang (celah seq)
}

static void put32(uint8_t *p, uint32_t v) { p[0] = v; p[1] = v >> 8; p[2] = v >> 16; p[3] = v >> 24; }

static void send_udp(int sock, const csi_pkt_t *pkt)
{
    /* Header 24 byte: "NADI" | versi | flag | MAC alat (6) | seq u32 | rssi i8 | sesi kalibrasi u8 | ts u32 | len u16 */
    uint8_t out[HDR_LEN + CSI_BUF_MAX];
    memcpy(out, "NADI", 4);
    out[4] = 1;
    out[5] = s_paused ? FLAG_PAUSED : 0;
    memcpy(out + 6, s_mac, 6);
    put32(out + 12, pkt->seq);
    out[16] = (uint8_t)pkt->rssi;
    out[17] = s_recal;
    put32(out + 18, pkt->ts);
    out[22] = pkt->len;
    out[23] = pkt->len >> 8;
    memcpy(out + HDR_LEN, pkt->buf, pkt->len);
    struct sockaddr_in to = { .sin_family = AF_INET, .sin_port = htons(UDP_PORT), .sin_addr.s_addr = s_gw.addr };
    sendto(sock, out, HDR_LEN + pkt->len, 0, (struct sockaddr *)&to, sizeof to);
}

static void csi_send_task(void *arg)
{
    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    csi_pkt_t pkt;
    while (1) {
        if (!xQueueReceive(s_queue, &pkt, pdMS_TO_TICKS(1000))) {
            /* Saat jeda: paket kosong ber-flag tiap 1 dtk supaya HP tahu alat sengaja dijeda, bukan mati */
            if (s_paused && s_got_ip) {
                csi_pkt_t beat = { .seq = s_seq, .len = 0 };
                send_udp(sock, &beat);
            }
            continue;
        }
        if (s_got_ip) send_udp(sock, &pkt);   // UDP dulu: USB bisa tertahan sejenak bila laptop tidak membaca
        // format terminal (csi_bridge.py): CSI_DATA,seq,rssi,timestamp,len,v0 v1 v2 ...
        printf("CSI_DATA,%lu,%d,%lu,%u,", (unsigned long)pkt.seq, pkt.rssi, (unsigned long)pkt.ts, pkt.len);
        for (int i = 0; i < pkt.len; i++) printf("%d ", pkt.buf[i]);
        printf("\n");
    }
}

/* ---------- Perintah (USB & BLE) ---------- */

static void run_command(const char *cmd)
{
    if (strcmp(cmd, "PAUSE") == 0) {
        s_paused = true;
        ESP_LOGI(TAG, "Pemantauan dijeda");
    } else if (strcmp(cmd, "RESUME") == 0) {
        s_paused = false;
        ESP_LOGI(TAG, "Pemantauan dilanjutkan");
    } else if (strcmp(cmd, "RECAL") == 0) {
        s_recal++;
        ESP_LOGI(TAG, "Kalibrasi ulang diminta (sesi %u)", s_recal);
    } else if (strcmp(cmd, "FORGET") == 0) {
        forget_creds();
    } else if (cmd[0]) {
        ESP_LOGW(TAG, "Perintah tidak dikenal: %s", cmd);
    }
}

static void console_task(void *arg)
{
    char line[32];
    size_t n = 0;
    while (1) {
        int c = getchar();
        if (c == EOF) {
            vTaskDelay(pdMS_TO_TICKS(50));
        } else if (c == '\n' || c == '\r') {
            line[n] = '\0';
            run_command(line);
            n = 0;
        } else if (n < sizeof line - 1) {
            line[n++] = (char)c;
        }
    }
}

/* ---------- BLE (NimBLE) ---------- */

static void ble_advertise(void);

static int chr_access(uint16_t conn, uint16_t attr, struct ble_gatt_access_ctxt *ctxt, void *arg)
{
    if (ctxt->op == BLE_GATT_ACCESS_OP_READ_CHR) {
        return os_mbuf_append(ctxt->om, s_status, strlen(s_status)) == 0 ? 0 : BLE_ATT_ERR_INSUFFICIENT_RES;
    }
    if (ctxt->op != BLE_GATT_ACCESS_OP_WRITE_CHR) return BLE_ATT_ERR_UNLIKELY;

    char buf[100] = {0};
    uint16_t len = 0;
    if (OS_MBUF_PKTLEN(ctxt->om) >= sizeof buf) return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
    if (ble_hs_mbuf_to_flat(ctxt->om, buf, sizeof buf - 1, &len) != 0) return BLE_ATT_ERR_UNLIKELY;

    if (ble_uuid_cmp(ctxt->chr->uuid, &CMD_UUID.u) == 0) {
        run_command(buf);
        return 0;
    }
    char *tab = strchr(buf, '\t');
    if (!tab || tab == buf || tab - buf > 32 || strlen(tab + 1) > 64) return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
    *tab = '\0';
    save_creds(buf, tab + 1);
    connect_with(buf, tab + 1);
    return 0;
}

static const struct ble_gatt_svc_def gatt_svcs[] = {
    {
        .type = BLE_GATT_SVC_TYPE_PRIMARY,
        .uuid = &SVC_UUID.u,
        .characteristics = (struct ble_gatt_chr_def[]) {
            { .uuid = &STATUS_UUID.u, .access_cb = chr_access,
              .flags = BLE_GATT_CHR_F_READ | BLE_GATT_CHR_F_NOTIFY, .val_handle = &s_status_handle },
            { .uuid = &WIFI_UUID.u, .access_cb = chr_access, .flags = BLE_GATT_CHR_F_WRITE },
            { .uuid = &CMD_UUID.u, .access_cb = chr_access, .flags = BLE_GATT_CHR_F_WRITE },
            { 0 },
        },
    },
    { 0 },
};

static int gap_event(struct ble_gap_event *event, void *arg)
{
    switch (event->type) {
    case BLE_GAP_EVENT_CONNECT:
        if (event->connect.status == 0) s_conn = event->connect.conn_handle;
        else ble_advertise();
        break;
    case BLE_GAP_EVENT_DISCONNECT:
        s_conn = BLE_HS_CONN_HANDLE_NONE;
        ble_advertise();
        break;
    case BLE_GAP_EVENT_ADV_COMPLETE:
        ble_advertise();
        break;
    }
    return 0;
}

static void ble_advertise(void)
{
    if (!s_ble_on) return;
    struct ble_hs_adv_fields fields = {0};
    const char *name = ble_svc_gap_device_name();
    fields.flags = BLE_HS_ADV_F_DISC_GEN | BLE_HS_ADV_F_BREDR_UNSUP;
    fields.name = (uint8_t *)name;
    fields.name_len = strlen(name);
    fields.name_is_complete = 1;
    ble_gap_adv_set_fields(&fields);
    struct ble_gap_adv_params params = {0};
    params.conn_mode = BLE_GAP_CONN_MODE_UND;
    params.disc_mode = BLE_GAP_DISC_MODE_GEN;
    ble_gap_adv_start(s_own_addr_type, NULL, BLE_HS_FOREVER, &params, gap_event, NULL);
}

static void ble_on_sync(void)
{
    ble_hs_util_ensure_addr(0);
    ble_hs_id_infer_auto(0, &s_own_addr_type);
    ble_advertise();
}

static void ble_host_task(void *param)
{
    nimble_port_run();
    nimble_port_freertos_deinit();
}

static void ble_start(void)
{
    if (s_ble_on) return;
    char name[12];
    snprintf(name, sizeof name, "NADI-%02X%02X", s_mac[4], s_mac[5]);
    esp_wifi_set_ps(WIFI_PS_MIN_MODEM);   // wajib saat BLE aktif (coexistence)
    if (nimble_port_init() != ESP_OK) {
        ESP_LOGE(TAG, "BLE gagal dinyalakan");
        return;
    }
    ble_hs_cfg.sync_cb = ble_on_sync;
    ble_svc_gap_init();
    ble_svc_gatt_init();
    ble_gatts_count_cfg(gatt_svcs);
    ble_gatts_add_svcs(gatt_svcs);
    ble_svc_gap_device_name_set(name);
    s_ble_on = true;
    nimble_port_freertos_init(ble_host_task);
    ESP_LOGI(TAG, "BLE menyala sebagai %s (siap dipasang dari HP Pusat)", name);
}

static void ble_stop(void)
{
    if (!s_ble_on) return;
    s_ble_on = false;
    nimble_port_stop();
    nimble_port_deinit();
    s_conn = BLE_HS_CONN_HANDLE_NONE;
    esp_wifi_set_ps(WIFI_PS_NONE);        // tanpa BLE: power save mati, CSI stabil
    ESP_LOGI(TAG, "BLE dimatikan (alat sudah tersambung)");
}

/* BLE mati setelah tersambung; menyala lagi bila hotspot hilang lama */
static void ble_manager_task(void *arg)
{
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(1000));
        int64_t now = esp_timer_get_time();
        if (s_got_ip && s_ble_on && now - s_got_ip_at > BLE_OFF_AFTER_MS * 1000LL) ble_stop();
        else if (!s_got_ip && !s_ble_on && s_lost_since && now - s_lost_since > BLE_ON_AFTER_MS * 1000LL) ble_start();
    }
}

void app_main(void)
{
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ESP_ERROR_CHECK(nvs_flash_init());
    }
    esp_read_mac(s_mac, ESP_MAC_WIFI_STA);

    /* stdin dari USB Serial/JTAG supaya perintah dari laptop terbaca. Bila laptop tidak membaca,
       tulisan ke USB dibuang setelah 50 ms (bawaan driver), jadi pengiriman UDP tidak ikut macet. */
    usb_serial_jtag_driver_config_t usb_cfg = USB_SERIAL_JTAG_DRIVER_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(usb_serial_jtag_driver_install(&usb_cfg));
    usb_serial_jtag_vfs_use_driver();
    setvbuf(stdin, NULL, _IONBF, 0);

    s_queue = xQueueCreate(CSI_QUEUE_LEN, sizeof(csi_pkt_t));
    ESP_ERROR_CHECK(esp_netif_init());   // wajib sebelum socket() di csi_send_task
    xTaskCreate(csi_send_task, "csi_send", 4096, NULL, 5, NULL);
    xTaskCreate(console_task, "console", 3072, NULL, 3, NULL);

    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    ESP_ERROR_CHECK(esp_wifi_set_country_code("ID", true));  // channel 1-13 (Indonesia)
    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_start());

    wifi_csi_config_t csi_cfg = { .lltf_en = true };   // hanya LLTF: 64 subcarrier = 128 angka/paket
    ESP_ERROR_CHECK(esp_wifi_set_csi_config(&csi_cfg));
    ESP_ERROR_CHECK(esp_wifi_set_csi_rx_cb(wifi_csi_cb, NULL));
    ESP_ERROR_CHECK(esp_wifi_set_csi(true));

    char ssid[33] = {0}, pass[65] = {0};
    if (load_creds(ssid, sizeof ssid, pass, sizeof pass)) connect_with(ssid, pass);
    else ESP_LOGI(TAG, "Belum dipasang: kirim nama & sandi hotspot lewat BLE dari HP Pusat");

    ble_start();   // selalu menyala saat boot; dimatikan 5 dtk setelah tersambung
    xTaskCreate(ble_manager_task, "ble_mgr", 3072, NULL, 2, NULL);
}
