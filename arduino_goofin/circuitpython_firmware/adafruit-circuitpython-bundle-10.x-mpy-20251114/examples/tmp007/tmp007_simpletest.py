# SPDX-FileCopyrightText: 2021 ladyada for Adafruit Industries
# SPDX-License-Identifier: MIT

#!/usr/bin/python
# Author: Adapted to CircuitPython by Jerry Needell
#     Adafruit_Python_TMP example by Tony DiCola
#

import time

import board
import busio

import adafruit_tmp007


# Define a function to convert celsius to fahrenheit.
def c_to_f(c):
    return c * 9.0 / 5.0 + 32.0


# Create library object using our Bus I2C port
i2c = busio.I2C(board.SCL, board.SDA)
sensor = adafruit_tmp007.TMP007(i2c)


# Initialize communication with the sensor, using the default 16 samples per conversion.
# This is the best accuracy but a little slower at reacting to changes.
# The first sample will be meaningless
while True:
    die_temp = sensor.die_temperature
    print(f"   Die temperature: {die_temp:0.3F}*C / {c_to_f(die_temp):0.3F}*F")
    obj_temp = sensor.temperature
    print(f"Object temperature: {obj_temp:0.3F}*C / {c_to_f(obj_temp):0.3F}*F")
    time.sleep(5.0)
