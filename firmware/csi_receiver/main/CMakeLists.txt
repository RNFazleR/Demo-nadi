idf_component_register(SRCS "csi_receiver.c"
                       INCLUDE_DIRS "."
                       PRIV_REQUIRES esp_wifi esp_netif esp_event esp_timer nvs_flash lwip log bt esp_driver_usb_serial_jtag)
