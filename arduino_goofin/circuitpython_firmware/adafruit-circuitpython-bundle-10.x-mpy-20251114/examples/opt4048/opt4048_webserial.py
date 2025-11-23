# SPDX-FileCopyrightText: Copyright (c) 2025 Tim C for Adafruit Industries
# SPDX-License-Identifier: MIT
"""
This example reads color data from the OPT4048 sensor and outputs it
in a format suitable for displaying on a web page using Web Serial API.

It continuously measures CIE x,y coordinates, lux, and color temperature.

This example works with the web interface in the /webserial directory of the
gh-pages branch of the Arduino driver repo: https://github.com/adafruit/Adafruit_OPT4048/tree/gh-pages,
which can be accessed at: https://adafruit.github.io/Adafruit_OPT4048/webserial/
"""

import time
from time import sleep

import board

from adafruit_opt4048 import OPT4048, ConversionTime, Mode, Range

READ_INTERVAL = 0.1  # seconds

i2c = board.I2C()  # uses board.SCL and board.SDA
# i2c = board.STEMMA_I2C()  # For using the built-in STEMMA QT connector on a microcontroller
sensor = OPT4048(i2c)

sensor.range = Range.AUTO
sensor.conversion_time = ConversionTime.TIME_100MS
sensor.mode = Mode.CONTINUOUS

last_read_time = 0
while True:
    if time.monotonic() > last_read_time + READ_INTERVAL:
        try:
            last_read_time = time.monotonic()
            x, y, lux = sensor.cie
            print("---CIE Data---")
            print(f"CIE x: {x}")
            print(f"CIE y: {y}")
            print(f"Lux: {lux}")
            print(f"Color Temperature: {sensor.calculate_color_temperature(x,y)} K")
            print("-------------")
        except RuntimeError:
            # CRC check failed while reading data
            pass
