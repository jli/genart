# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense
import time

import board
from digitalio import DigitalInOut, Direction

from adafruit_bmp5xx import BMP5XX

SEALEVELPRESSURE_HPA = 1013.25

# SPI setup
spi = board.SPI()
cs = DigitalInOut(board.D10)
cs.direction = Direction.OUTPUT
bmp = BMP5XX.over_spi(spi=spi, cs=cs)


bmp.sea_level_pressure = SEALEVELPRESSURE_HPA

while True:
    if bmp.data_ready:
        print(
            f"temp F: {bmp.temperature * (9 / 5) + 32} "
            f"pressure: {bmp.pressure} hPa "
            f"Approx altitude: {bmp.altitude} m"
        )
        time.sleep(1)
