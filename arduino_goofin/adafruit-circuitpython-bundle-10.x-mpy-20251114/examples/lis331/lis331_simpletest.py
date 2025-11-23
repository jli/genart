# SPDX-FileCopyrightText: 2021 ladyada for Adafruit Industries
# SPDX-License-Identifier: MIT

import time

import board

import adafruit_lis331

i2c = board.I2C()  # uses board.SCL and board.SDA
# i2c = board.STEMMA_I2C()  # For using the built-in STEMMA QT connector on a microcontroller
lis = adafruit_lis331.LIS331HH(i2c)

while True:
    print(
        f"Acceleration : X: {lis.acceleration[0]:.2f}, Y:{lis.acceleration[1]:.2f}, Z:{lis.acceleration[2]:.2f} ms^2"
    )
    time.sleep(0.1)
