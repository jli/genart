# SPDX-FileCopyrightText: 2021 ladyada for Adafruit Industries
# SPDX-License-Identifier: MIT

import ssl
from os import getenv

import adafruit_requests
import socketpool
import wifi

import adafruit_lifx

# Get WiFi details and LIFX keys, ensure these are setup in settings.toml
# (to obtain a token, visit: https://cloud.lifx.com/settings)
ssid = getenv("CIRCUITPY_WIFI_SSID")
password = getenv("CIRCUITPY_WIFI_PASSWORD")
lifx_token = getenv("lifx_token")

# Set up ESP32-S2 and adafruit_requests session
wifi.radio.connect(ssid=ssid, password=password)
pool = socketpool.SocketPool(wifi.radio)
http_session = adafruit_requests.Session(pool, ssl.create_default_context())

# Set this to your LIFX light separator label
# https://api.developer.lifx.com/docs/selectors
lifx_light = "label:Lamp"

# Initialize the LIFX API Client
lifx = adafruit_lifx.LIFX(http_session, lifx_token)

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
