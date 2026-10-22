/* Uji Fase 0 (spike, dibuang setelah Fase 1).
   Menjawab: (1) apakah HP yang menjadi hotspot menerima UDP dari ESP32, (2) apakah BLE yang
   menyala menurunkan laju CSI, (3) apakah app bisa memasang alat lewat BLE (kirim nama & sandi).

   Alur: BLE "NADI-XXXX" menunggu nama & sandi hotspot (karakteristik wifi, format "nama\tsandi")
   -> disimpan di NVS -> tersambung ke hotspot -> ping gateway 20 ms -> tiap paket CSI dari hotspot
   dikirim lewat UDP ke gateway:5005. Terminal mencetak baris STAT tiap detik.
   Perintah terminal: b = matikan BLE (sampai restart), f = lupakan hotspot, c = cetak CSI_DATA on/off. */
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
#include "esp_heap_caps.h"
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

#define TAG              "SPIKE"
#define UDP_PORT         5005
#define PING_INTERVAL_MS 20
#define CSI_MIN_GAP_US   18000      // batas laju: <= ~55 paket CSI per detik
#define CSI_BUF_MAX      128        // LLTF saja = 64 subcarrier x 2
#define CSI_QUEUE_LEN    32
#define HDR_LEN          24

/* UUID 128-bit "NADI": 4e414449-0000-4000-8000-00000000a00X (urutan byte little-endian) */
#define NADI_UUID(x) BLE_UUID128_INIT(x, 0xa0, 0, 0, 0, 0, 0, 0x80, 0, 0x40, 0, 0, 0x49, 0x44, 0x41, 0x4e)
static const ble_uuid128_t SVC_UUID    = NADI_UUID(0x00);
static const ble_uuid128_t STATUS_UUID = NADI_UUID(0x01);
static const ble_uuid128_t WIFI_UUID   = NADI_UUID(0x02);

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
static int      s_last_reason = 0;
static uint32_t s_seq = 0, s_last_ts = 0;
static volatile bool s_print_csi = false;

/* Penghitung per detik (di-reset oleh stats_task) */
static volatile uint32_t n_csi_ap, n_csi_kept, n_udp_ok, n_udp_err, n_q_drop;

/* BLE */
static volatile bool s_ble_on = false;
static uint8_t  s_own_addr_type;
static uint16_t s_conn = BLE_HS_CONN_HANDLE_NONE;
static uint16_t s_status_handle;
static char     s_status[160] = "menunggu";

/* ---------- WiFi ---------- */

static bool load_creds(wifi_config_t *cfg)
{
    nvs_handle_t h;
    if (nvs_open("nadi", NVS_READONLY, &h) != ESP_OK) return false;
    size_t ls = sizeof cfg->sta.ssid, lp = sizeof cfg->sta.password;
    bool ok = nvs_get_str(h, "ssid", (char *)cfg->sta.ssid, &ls) == ESP_OK &&
              nvs_get_str(h, "pass", (char *)cfg->sta.password, &lp) == ESP_OK;
    nvs_close(h);
    return ok;
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

static void forget_creds(void)
{
    nvs_handle_t h;
    if (nvs_open("nadi", NVS_READWRITE, &h) != ESP_OK) return;
    nvs_erase_all(h);
    nvs_commit(h);
    nvs_close(h);
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
    ESP_LOGI(TAG, "Menyambung ke hotspot \"%s\"", ssid);
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
        s_got_ip = false;
        s_last_reason = ((wifi_event_sta_disconnected_t *)data)->reason;
        wifi_config_t cfg;
        if (esp_wifi_get_config(WIFI_IF_STA, &cfg) == ESP_OK && cfg.sta.ssid[0]) esp_wifi_connect();
    } else if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *e = (ip_event_got_ip_t *)data;
        s_ip = e->ip_info.ip;
        s_gw = e->ip_info.gw;
        wifi_ap_record_t ap;
        if (esp_wifi_sta_get_ap_info(&ap) == ESP_OK) memcpy(s_ap_bssid, ap.bssid, 6);
        s_last_reason = 0;
        s_got_ip = true;
        ESP_LOGI(TAG, "IP " IPSTR ", gateway (HP) " IPSTR, IP2STR(&s_ip), IP2STR(&s_gw));
        if (!s_ping_started) {
            start_ping();
            s_ping_started = true;
        }
    }
}

/* ---------- CSI -> UDP ---------- */

static void wifi_csi_cb(void *ctx, wifi_csi_info_t *info)
{
    if (!info || !info->buf || !s_got_ip) return;
    if (memcmp(info->mac, s_ap_bssid, 6) != 0) return;
    n_csi_ap++;
    uint32_t ts = info->rx_ctrl.timestamp;
    if (s_last_ts && (uint32_t)(ts - s_last_ts) < CSI_MIN_GAP_US) return;
    s_last_ts = ts;

    csi_pkt_t pkt;
    pkt.seq  = s_seq++;
    pkt.rssi = info->rx_ctrl.rssi;
    pkt.ts   = ts;
    pkt.len  = info->len > CSI_BUF_MAX ? CSI_BUF_MAX : info->len;
    memcpy(pkt.buf, info->buf, pkt.len);
    n_csi_kept++;
    if (xQueueSend(s_queue, &pkt, 0) != pdTRUE) n_q_drop++;
}

static void put32(uint8_t *p, uint32_t v) { p[0] = v; p[1] = v >> 8; p[2] = v >> 16; p[3] = v >> 24; }

static void udp_task(void *arg)
{
    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    uint8_t out[HDR_LEN + CSI_BUF_MAX];
    csi_pkt_t pkt;
    while (1) {
        if (!xQueueReceive(s_queue, &pkt, portMAX_DELAY)) continue;
        if (!s_got_ip) continue;

        /* Header 24 byte: "NADI" | versi | flag | MAC alat (6) | seq u32 | rssi i8 | 0 | ts u32 | len u16 */
        memcpy(out, "NADI", 4);
        out[4] = 1;
        out[5] = 0;
        memcpy(out + 6, s_mac, 6);
        put32(out + 12, pkt.seq);
        out[16] = (uint8_t)pkt.rssi;
        out[17] = 0;
        put32(out + 18, pkt.ts);
        out[22] = pkt.len;
        out[23] = pkt.len >> 8;
        memcpy(out + HDR_LEN, pkt.buf, pkt.len);

        struct sockaddr_in to = {
            .sin_family = AF_INET,
            .sin_port = htons(UDP_PORT),
            .sin_addr.s_addr = s_gw.addr,
        };
        if (sendto(sock, out, HDR_LEN + pkt.len, 0, (struct sockaddr *)&to, sizeof to) > 0) n_udp_ok++;
        else n_udp_err++;

        if (s_print_csi) {
            printf("CSI_DATA,%lu,%d,%lu,%u,", (unsigned long)pkt.seq, pkt.rssi, (unsigned long)pkt.ts, pkt.len);
            for (int i = 0; i < pkt.len; i++) printf("%d ", pkt.buf[i]);
            printf("\n");
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
    if (ctxt->op == BLE_GATT_ACCESS_OP_WRITE_CHR) {
        char buf[100] = {0};
        uint16_t len = 0;
        if (OS_MBUF_PKTLEN(ctxt->om) >= sizeof buf) return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
        if (ble_hs_mbuf_to_flat(ctxt->om, buf, sizeof buf - 1, &len) != 0) return BLE_ATT_ERR_UNLIKELY;
        char *tab = strchr(buf, '\t');
        if (!tab || tab == buf || strlen(buf) > 32 + 1 + 64) return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
        *tab = '\0';
        save_creds(buf, tab + 1);
        connect_with(buf, tab + 1);
        return 0;
    }
    return BLE_ATT_ERR_UNLIKELY;
}

static const struct ble_gatt_svc_def gatt_svcs[] = {
    {
        .type = BLE_GATT_SVC_TYPE_PRIMARY,
        .uuid = &SVC_UUID.u,
        .characteristics = (struct ble_gatt_chr_def[]) {
            { .uuid = &STATUS_UUID.u, .access_cb = chr_access,
              .flags = BLE_GATT_CHR_F_READ | BLE_GATT_CHR_F_NOTIFY, .val_handle = &s_status_handle },
            { .uuid = &WIFI_UUID.u, .access_cb = chr_access, .flags = BLE_GATT_CHR_F_WRITE },
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
    char name[12];
    snprintf(name, sizeof name, "NADI-%02X%02X", s_mac[4], s_mac[5]);
    ESP_ERROR_CHECK(nimble_port_init());
    ble_hs_cfg.sync_cb = ble_on_sync;
    ble_svc_gap_init();
    ble_svc_gatt_init();
    ble_gatts_count_cfg(gatt_svcs);
    ble_gatts_add_svcs(gatt_svcs);
    ble_svc_gap_device_name_set(name);
    s_ble_on = true;
    nimble_port_freertos_init(ble_host_task);
    ESP_LOGI(TAG, "BLE menyala sebagai %s", name);
}

static void ble_stop(void)
{
    if (!s_ble_on) return;
    s_ble_on = false;
    nimble_port_stop();
    nimble_port_deinit();
    s_conn = BLE_HS_CONN_HANDLE_NONE;
    esp_wifi_set_ps(WIFI_PS_NONE);   // tanpa BLE, power save boleh mati seperti firmware utama
    ESP_LOGI(TAG, "BLE dimatikan (nyala lagi setelah restart), power save WiFi mati");
}

/* ---------- Statistik & perintah terminal ---------- */

static void stats_task(void *arg)
{
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(1000));
        uint32_t ap = n_csi_ap, kept = n_csi_kept, ok = n_udp_ok, err = n_udp_err, drop = n_q_drop;
        n_csi_ap = n_csi_kept = n_udp_ok = n_udp_err = n_q_drop = 0;

        char wifi[64];
        if (s_got_ip) snprintf(wifi, sizeof wifi, "tersambung ip=" IPSTR " gw=" IPSTR, IP2STR(&s_ip), IP2STR(&s_gw));
        else if (s_last_reason) snprintf(wifi, sizeof wifi, "gagal:%d", s_last_reason);
        else snprintf(wifi, sizeof wifi, "menunggu");

        printf("STAT wifi=%s csi_ap=%lu csi_kirim=%lu udp_ok=%lu udp_err=%lu antre_buang=%lu ble=%s heap=%lu\n",
               wifi, (unsigned long)ap, (unsigned long)kept, (unsigned long)ok, (unsigned long)err,
               (unsigned long)drop,
               !s_ble_on ? "mati" : s_conn != BLE_HS_CONN_HANDLE_NONE ? "terhubung" : "iklan",
               (unsigned long)heap_caps_get_free_size(MALLOC_CAP_DEFAULT));

        snprintf(s_status, sizeof s_status, "%s csi=%lu udp=%lu", wifi, (unsigned long)kept, (unsigned long)ok);
        if (s_ble_on && s_conn != BLE_HS_CONN_HANDLE_NONE) ble_gatts_chr_updated(s_status_handle);
    }
}

static void console_task(void *arg)
{
    while (1) {
        int c = getchar();
        if (c == 'b') ble_stop();
        else if (c == 'f') {
            forget_creds();
            esp_wifi_disconnect();
            wifi_config_t empty = {0};
            esp_wifi_set_config(WIFI_IF_STA, &empty);
            ESP_LOGI(TAG, "Hotspot dilupakan; kirim lagi lewat BLE");
        } else if (c == 'c') {
            s_print_csi = !s_print_csi;
        } else if (c == EOF) {
            vTaskDelay(pdMS_TO_TICKS(50));
        }
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

    /* stdin dari USB Serial/JTAG supaya perintah b/f/c dari terminal laptop terbaca */
    usb_serial_jtag_driver_config_t usb_cfg = USB_SERIAL_JTAG_DRIVER_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(usb_serial_jtag_driver_install(&usb_cfg));
    usb_serial_jtag_vfs_use_driver();
    setvbuf(stdin, NULL, _IONBF, 0);

    s_queue = xQueueCreate(CSI_QUEUE_LEN, sizeof(csi_pkt_t));

    ESP_ERROR_CHECK(esp_netif_init());   // wajib sebelum socket() di udp_task
    xTaskCreate(udp_task, "udp", 4096, NULL, 5, NULL);
    xTaskCreate(stats_task, "stats", 4096, NULL, 3, NULL);
    xTaskCreate(console_task, "console", 3072, NULL, 3, NULL);

    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    ESP_ERROR_CHECK(esp_wifi_set_country_code("ID", true));
    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_start());
    /* Power save WiFi wajib menyala bila BLE aktif (coexistence); dimatikan saat BLE mati di Fase 1 */
    esp_wifi_set_ps(WIFI_PS_MIN_MODEM);

    wifi_csi_config_t csi_cfg = { .lltf_en = true };
    ESP_ERROR_CHECK(esp_wifi_set_csi_config(&csi_cfg));
    ESP_ERROR_CHECK(esp_wifi_set_csi_rx_cb(wifi_csi_cb, NULL));
    ESP_ERROR_CHECK(esp_wifi_set_csi(true));

    wifi_config_t saved = {0};
    if (load_creds(&saved)) connect_with((char *)saved.sta.ssid, (char *)saved.sta.password);
    else ESP_LOGI(TAG, "Belum ada hotspot tersimpan; kirim lewat BLE dari app");

    ble_start();
}
