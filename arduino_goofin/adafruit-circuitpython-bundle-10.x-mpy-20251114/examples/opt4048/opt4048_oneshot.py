# SPDX-FileCopyrightText: Copyright (c) 2025 Tim C for Adafruit Industries
# SPDX-License-Identifier: MIT
"""
A basic one shotdemo for using the OPT4048 tristimulus XYZ color sensor

This example reads the sensor values from all four channels (X, Y, Z, W),
demonstrates setting and getting threshold values, and displays the results.

Readints are taken in oneshot mode and then the next one is triggered when
the power down mode status is detected.
"""

import time
from time import sleep

import board

from adafruit_opt4048 import OPT4048, ConversionTime, Mode, Range

timestamp = 0

print("Adafruit OPT4048 Tristimulus XYZ Color Sensor Oneshot Test")

i2c = board.I2C()  # uses board.SCL and board.SDA
# i2c = board.STEMMA_I2C()  # For using the built-in STEMMA QT connector on a microcontroller
sensor = OPT4048(i2c)
print("OPT4048 sensor found!")

sensor.range = Range.AUTO
sensor.conversion_time = ConversionTime.TIME_100MS
sensor.mode = Mode.AUTO_ONESHOT
while True:
    if sensor.mode == Mode.POWERDOWN:
        # ok we finished the reading!
        try:
            CIEx, CIEy, lux = sensor.cie

            print("\nCIE Coordinates:")
            print(f"CIE x:{CIEx}, y:{CIEy}, lux: {lux}", end=" ")

            # Calculate and display color temperature
            color_temp = sensor.calculate_color_temperature(CIEx, CIEy)
            print(f"Color Temperature: {color_temp} K")
            print(f"Time since last read: {time.monotonic() - timestamp} sec")
            timestamp = time.monotonic()
        except RuntimeError:
            print("Error reading sensor data")

        sensor.mode = Mode.AUTO_ONESHOT
