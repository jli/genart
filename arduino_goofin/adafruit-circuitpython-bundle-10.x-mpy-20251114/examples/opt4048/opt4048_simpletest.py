# SPDX-FileCopyrightText: Copyright (c) 2025 Tim C for Adafruit Industries
# SPDX-License-Identifier: MIT
"""
A basic demo for using the OPT4048 tristimulus XYZ color sensor

This example reads the sensor values from all four channels (X, Y, Z, W),
demonstrates setting and getting threshold values, and displays the results.
"""

import time
from time import sleep

import board

from adafruit_opt4048 import OPT4048, ConversionTime, Mode, Range

i2c = board.I2C()  # uses board.SCL and board.SDA
# i2c = board.STEMMA_I2C()  # For using the built-in STEMMA QT connector on a microcontroller
sensor = OPT4048(i2c)

sensor.range = Range.AUTO
sensor.conversion_time = ConversionTime.TIME_100MS
sensor.mode = Mode.CONTINUOUS
while True:
    try:
        x, y, lux = sensor.cie
        print(f"CIE x:{x}, y:{y}, lux: {lux}", end=" ")
        print(f"K: {sensor.calculate_color_temperature(x,y)}")
        time.sleep(1)
    except RuntimeError:
        # CRC check failed while reading data
        pass
