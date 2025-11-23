# SPDX-FileCopyrightText: 2021 Eva Herrada for Adafruit Industries
# SPDX-License-Identifier: MIT

from os import getenv

import adafruit_connection_manager
import adafruit_minimqtt.adafruit_minimqtt as MQTT
import board
import busio
import neopixel
from adafruit_esp32spi import adafruit_esp32spi, adafruit_esp32spi_wifimanager
from adafruit_io.adafruit_io import IO_MQTT
from digitalio import DigitalInOut, Direction

# Get WiFi details and Adafruit IO keys, ensure these are setup in settings.toml
# (visit io.adafruit.com if you need to create an account, or if you need your Adafruit IO key.)
ssid = getenv("CIRCUITPY_WIFI_SSID")
password = getenv("CIRCUITPY_WIFI_PASSWORD")
aio_username = getenv("ADAFRUIT_AIO_USERNAME")
aio_key = getenv("ADAFRUIT_AIO_KEY")

RELAY = DigitalInOut(board.D10)
RELAY.direction = Direction.OUTPUT

### WiFi ###

# If you are using a board with pre-defined ESP32 Pins:
esp32_cs = DigitalInOut(board.ESP_CS)
esp32_ready = DigitalInOut(board.ESP_BUSY)
esp32_reset = DigitalInOut(board.ESP_RESET)

# If you have an externally connected ESP32:
# esp32_cs = DigitalInOut(board.D13)
# esp32_ready = DigitalInOut(board.D11)
# esp32_reset = DigitalInOut(board.D12)

# Secondary (SCK1) SPI used to connect to WiFi board on Arduino Nano Connect RP2040
if "SCK1" in dir(board):
    spi = busio.SPI(board.SCK1, board.MOSI1, board.MISO1)
else:
    spi = busio.SPI(board.SCK, board.MOSI, board.MISO)

esp = adafruit_esp32spi.ESP_SPIcontrol(spi, esp32_cs, esp32_ready, esp32_reset)

"""Use below for Most Boards"""
status_pixel = neopixel.NeoPixel(board.NEOPIXEL, 1, brightness=0.2)
"""Uncomment below for ItsyBitsy M4"""
# status_pixel = dotstar.DotStar(board.APA102_SCK, board.APA102_MOSI, 1, brightness=0.2)
"""Uncomment below for an externally defined RGB LED (including Arduino Nano Connect)"""
# import adafruit_rgbled
# from adafruit_esp32spi import PWMOut
# RED_LED = PWMOut.PWMOut(esp, 26)
# GREEN_LED = PWMOut.PWMOut(esp, 27)
# BLUE_LED = PWMOut.PWMOut(esp, 25)
# status_pixel = adafruit_rgbled.RGBLED(RED_LED, BLUE_LED, GREEN_LED)

wifi = adafruit_esp32spi_wifimanager.WiFiManager(esp, ssid, password, status_pixel=status_pixel)


# Define callback functions which will be called when certain events happen.
def connected(client):
    client.subscribe("heatindex")


def subscribe(client, userdata, topic, granted_qos):
    # This method is called when the client subscribes to a new feed.
    print(f"Subscribed to {topic} with QOS level {granted_qos}")


def on_hi(client, topic, message):
    if float(message) > 80.0:
        RELAY.value = True
    else:
        RELAY.value = False


# Connect to WiFi
print("Connecting to WiFi...")
wifi.connect()
print("Connected!")

pool = adafruit_connection_manager.get_radio_socketpool(esp)
ssl_context = adafruit_connection_manager.get_radio_ssl_context(esp)

# Initialize a new MQTT Client object
mqtt_client = MQTT.MQTT(
    broker="io.adafruit.com",
    username=aio_username,
    password=aio_key,
    socket_pool=pool,
    ssl_context=ssl_context,
)

# Initialize an Adafruit IO MQTT Client
io = IO_MQTT(mqtt_client)

io.add_feed_callback("heatindex", on_hi)
# Connect the callback methods defined above to Adafruit IO
io.on_connect = connected
io.on_subscribe = subscribe

# Connect to Adafruit IO
print("Connecting to Adafruit IO...")
io.connect()

io.get("heatindex")

while True:
    io.loop()
