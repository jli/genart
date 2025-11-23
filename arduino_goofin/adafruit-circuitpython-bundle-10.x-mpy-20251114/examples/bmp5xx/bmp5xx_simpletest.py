# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense
import time

import board

from adafruit_bmp5xx import BMP5XX

SEALEVELPRESSURE_HPA = 1013.25

# I2C setup
i2c = board.I2C()  # uses board.SCL and board.SDA
# i2c = board.STEMMA_I2C()  # For using the built-in STEMMA QT connector on a microcontroller

bmp = BMP5XX.over_i2c(i2c)

bmp.sea_level_pressure = SEALEVELPRESSURE_HPA

while True:
    if bmp.data_ready:
        print(
            f"temp F: {bmp.temperature * (9 / 5) + 32} "
            f"pressure: {bmp.pressure} hPa "
            f"Approx altitude: {bmp.altitude} m"
        )
        time.sleep(1)
