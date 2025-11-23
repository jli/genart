# SPDX-FileCopyrightText: Copyright (c) 2025 Tim C for Adafruit Industries
# SPDX-License-Identifier: MIT
"""
A basic interrupt pin demo for using the OPT4048 tristimulus XYZ color sensor

This example waits for the interrupt pin to be triggered,
then reads and displays the sensor values.
"""

import time

import board
import countio
from digitalio import Pull

from adafruit_opt4048 import (
    OPT4048,
    ConversionTime,
    Mode,
    Range,
)

i2c = board.I2C()  # uses board.SCL and board.SDA
# i2c = board.STEMMA_I2C()  # For using the built-in STEMMA QT connector on a microcontroller
sensor = OPT4048(i2c)

sensor.range = Range.AUTO
sensor.conversion_time = ConversionTime.TIME_100MS
sensor.mode = Mode.CONTINUOUS

# counter that will track the pulses on the interrupt pin
pin_counter = countio.Counter(board.D5, edge=countio.Edge.RISE, pull=Pull.UP)

last_read_time = 0
while True:
    try:
        if pin_counter.count > 0:
            pin_counter.reset()
            x, y, lux = sensor.cie
            print(f"CIE x:{x}, y:{y}, lux: {lux}", end=" ")
            print(f"K: {sensor.calculate_color_temperature(x, y)}", end=" ")
            print(f"Read Delay: {time.monotonic() - last_read_time} sec")
            last_read_time = time.monotonic()

    except RuntimeError:
        # error reading data
        pass
