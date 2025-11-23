# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT
"""AS5600 Simple Test"""

import time

import board

import adafruit_as5600

i2c = board.I2C()
sensor = adafruit_as5600.AS5600(i2c)

while True:
    # Read angle values
    if sensor.magnet_detected:
        if sensor.max_gain_overflow is True:
            print("Magnet is too weak")
        if sensor.min_gain_overflow is True:
            print("Magnet is too strong")
        print(f"Raw angle: {sensor.raw_angle}")
        print(f"Scaled angle: {sensor.angle}")
        print(f"Magnitude: {sensor.magnitude}")
    else:
        print("Waiting for magnet..")
    print()
    time.sleep(2)
