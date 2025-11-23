# SPDX-FileCopyrightText: 2025 Tim Cocks, written for Adafruit Industries
#
# SPDX-License-Identifier: MIT

# NOTE: Make sure you've created your settings.toml file before running this example
# https://learn.adafruit.com/adafruit-pyportal/create-your-settings-toml-file

from adafruit_fruitjam import FruitJam

# Set a data source URL
TEXT_URL = "http://wifitest.adafruit.com/testwifi/index.html"

# Create the PyPortal object
fruitjam = FruitJam(url=TEXT_URL, text_position=(10, 20))
fruitjam.neopixels.brightness = 0.1

# Go get that data
print("Fetching text from", TEXT_URL)
data = fruitjam.fetch()

# Print out what we got
print("-" * 40)
print(data)
print("-" * 40)

while True:
    pass
