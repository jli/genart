# SPDX-FileCopyrightText: Copyright (c) 2022 Alec Delaney for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense

import ssl
from os import getenv

import adafruit_requests as requests
import socketpool
import wifi

from adafruit_pastebin.pastebin import ExpirationSetting, PasteBin, PrivacySetting

# Get WiFi details and PasteBin keys, ensure these are setup in settings.toml
ssid = getenv("CIRCUITPY_WIFI_SSID")
password = getenv("CIRCUITPY_WIFI_PASSWORD")
auth_key = getenv("auth_key")

wifi.radio.connect(ssid, password)
pool = socketpool.SocketPool(wifi.radio)
session = requests.Session(pool, ssl.create_default_context())

pastebin = PasteBin(session, auth_key)
paste_url = pastebin.paste(
    "This is a test paste!",
    name="My Test Paste",
    expiration=ExpirationSetting.ONE_DAY,
    privacy=PrivacySetting.UNLISTED,
)
print(paste_url)
