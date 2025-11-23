# SPDX-FileCopyrightText: 2021 ladyada for Adafruit Industries
# SPDX-License-Identifier: MIT

from os import getenv

import board
import busio
import neopixel
from adafruit_esp32spi import adafruit_esp32spi
from adafruit_esp32spi.adafruit_esp32spi_wifimanager import WiFiManager
from digitalio import DigitalInOut

import adafruit_lifx

# Get WiFi details and LIFX keys, ensure these are setup in settings.toml
# (to obtain a token, visit: https://cloud.lifx.com/settings)
ssid = getenv("CIRCUITPY_WIFI_SSID")
password = getenv("CIRCUITPY_WIFI_PASSWORD")
lifx_token = getenv("lifx_token")

# ESP32 SPI
esp32_cs = DigitalInOut(board.ESP_CS)
esp32_ready = DigitalInOut(board.ESP_BUSY)
esp32_reset = DigitalInOut(board.ESP_RESET)
spi = busio.SPI(board.SCK, board.MOSI, board.MISO)
esp = adafruit_esp32spi.ESP_SPIcontrol(spi, esp32_cs, esp32_ready, esp32_reset)
status_pixel = neopixel.NeoPixel(board.NEOPIXEL, 1, brightness=0.2)
wifi = WiFiManager(esp, ssid, password, status_pixel=status_pixel)

if lifx_token is None:
    raise KeyError("Please add your lifx token to settings.toml")

# Set this to your LIFX light separator label
# https://api.developer.lifx.com/docs/selectors
lifx_light = "label:Lamp"

# Initialize the LIFX API Client
lifx = adafruit_lifx.LIFX(wifi, lifx_token)

# List all lights
lights = lifx.list_lights()

# Turn on the light
print("Turning on light...")
lifx.toggle_light(lifx_light)

# Set the light's brightness to 50%
light_brightness = 0.5
lifx.set_brightness(lifx_light, light_brightness)

# Cycle the light using the colors of the Python logo
colors = ["yellow", "blue", "white"]
for color in colors:
    print("Setting light to: ", color)
    lifx.set_color(lifx_light, power="on", color=color, brightness=light_brightness)

# Turn off the light
print("Turning off light...")
lifx.toggle_light(lifx_light)
