#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "nvs_flash.h"
#include "ping/ping_sock.h"
#include "lwip/ip_addr.h"

#define TAG              "CSI_RX"

/* Kredensial hotspot ada di main/wifi_secrets.h (tidak di-commit / dibagikan).
   Salin wifi_secrets.example.h -> wifi_secrets.h lalu isi. Hotspot WAJIB band 2,4 GHz. */
#include "wifi_secrets.h"

#define PING_INTERVAL_MS 20           // 20 ms = 50 paket/detik
#define CSI_BUF_MAX      512
#define CSI_QUEUE_LEN    32

typedef struct {
    uint32_t seq;
    int8_t   rssi;
    uint32_t ts;
    uint16_t len;
    int8_t   buf[CSI_BUF_MAX];
} csi_pkt_t;

static QueueHandle_t s_csi_queue;
static uint8_t  s_ap_bssid[6];
static bool     s_got_bssid    = false;
static bool     s_ping_started = false;
static uint32_t s_seq = 0;

/* Callback ini jalan di task WiFi: cukup copy data ke queue, jangan printf di sini */
static void wifi_csi_cb(void *ctx, wifi_csi_info_t *info)
{
    if (!info || !info->buf || !s_got_bssid) return;
    if (memcmp(info->mac, s_ap_bssid, 6) != 0) return;   // hanya paket dari hotspot

    csi_pkt_t pkt;
    pkt.seq  = s_seq++;
    pkt.rssi = info->rx_ctrl.rssi;
    pkt.ts   = info->rx_ctrl.timestamp;
    pkt.len  = info->len > CSI_BUF_MAX ? CSI_BUF_MAX : info->len;
    memcpy(pkt.buf, info->buf, pkt.len);
    xQueueSend(s_csi_queue, &pkt, 0);                    // kalau penuh, drop saja
}

/* Task terpisah yang kirim data ke laptop lewat USB serial */
static void csi_print_task(void *arg)
{
    csi_pkt_t pkt;
    while (1) {
        if (xQueueReceive(s_csi_queue, &pkt, portMAX_DELAY)) {
            // format: CSI_DATA,seq,rssi,timestamp,len,v0 v1 v2 ...
            printf("CSI_DATA,%lu,%d,%lu,%u,",
                   (unsigned long)pkt.seq, pkt.rssi,
                   (unsigned long)pkt.ts, pkt.len);
            for (int i = 0; i < pkt.len; i++) printf("%d ", pkt.buf[i]);
            printf("\n");
        }
    }
}

/* Ping gateway (HP) terus-menerus supaya selalu ada paket balasan = CSI.
   Ping ke gateway itu trafik lokal, tidak makan kuota. */
static void start_ping(void)
{
    esp_netif_t *netif = esp_netif_get_handle_from_ifkey("WIFI_STA_DEF");
    esp_netif_ip_info_t ip;
    esp_netif_get_ip_info(netif, &ip);

    ip_addr_t target = {0};
    target.type = IPADDR_TYPE_V4;
    target.u_addr.ip4.addr = ip.gw.addr;

    esp_ping_config_t cfg = ESP_PING_DEFAULT_CONFIG();
    cfg.target_addr = target;
    cfg.count       = ESP_PING_COUNT_INFINITE;
    cfg.interval_ms = PING_INTERVAL_MS;
    cfg.timeout_ms  = 1000;

    esp_ping_callbacks_t cbs = {0};
    esp_ping_handle_t ping;
    ESP_ERROR_CHECK(esp_ping_new_session(&cfg, &cbs, &ping));
    ESP_ERROR_CHECK(esp_ping_start(ping));
    ESP_LOGI(TAG, "Ping ke gateway " IPSTR " tiap %d ms", IP2STR(&ip.gw), PING_INTERVAL_MS);
}

static void wifi_event_handler(void *arg, esp_event_base_t base, int32_t id, void *data)
{
    if (base == WIFI_EVENT && id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (base == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED) {
        wifi_event_sta_disconnected_t *d = (wifi_event_sta_disconnected_t *)data;
        s_got_bssid = false;
        /* reason 201 = hotspot tidak ketemu (cek nama / band 2.4 GHz),
           reason 15/202 = password salah */
        ESP_LOGW(TAG, "Putus/gagal connect (reason %d), reconnect...", d->reason);
        esp_wifi_connect();
    } else if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
        wifi_ap_record_t ap;
        if (esp_wifi_sta_get_ap_info(&ap) == ESP_OK) {
            memcpy(s_ap_bssid, ap.bssid, 6);
            s_got_bssid = true;
            ESP_LOGI(TAG, "Terhubung ke %s, channel %d", (char *)ap.ssid, ap.primary);
        }
        if (!s_ping_started) {
            start_ping();
            s_ping_started = true;
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

    s_csi_queue = xQueueCreate(CSI_QUEUE_LEN, sizeof(csi_pkt_t));
    xTaskCreate(csi_print_task, "csi_print", 4096, NULL, 5, NULL);

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    ESP_ERROR_CHECK(esp_wifi_set_country_code("ID", true));  // channel 1-13 (Indonesia)

    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, wifi_event_handler, NULL));

    wifi_config_t wifi_cfg = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASS,
        },
    };
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_cfg));
    ESP_ERROR_CHECK(esp_wifi_start());
    esp_wifi_set_ps(WIFI_PS_NONE);   // matikan power save biar CSI stabil

    wifi_csi_config_t csi_cfg = {
        .lltf_en           = true,    // hanya LLTF: 64 subcarrier = 128 angka/paket (lebih ringan di serial)
        .htltf_en          = false,
        .stbc_htltf2_en    = false,
        .ltf_merge_en      = false,
        .channel_filter_en = false,
        .manu_scale        = false,
    };
    ESP_ERROR_CHECK(esp_wifi_set_csi_config(&csi_cfg));
    ESP_ERROR_CHECK(esp_wifi_set_csi_rx_cb(wifi_csi_cb, NULL));
    ESP_ERROR_CHECK(esp_wifi_set_csi(true));

    ESP_LOGI(TAG, "CSI Receiver siap, menunggu koneksi ke hotspot...");
}
