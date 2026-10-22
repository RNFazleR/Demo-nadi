idf_component_register(SRCS "spike.c"
                       INCLUDE_DIRS "."
                       PRIV_REQUIRES esp_wifi esp_netif esp_event nvs_flash lwip log bt esp_driver_usb_serial_jtag)
