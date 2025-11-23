# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT
import time

import board
from digitalio import DigitalInOut, Direction

from adafruit_bmp5xx import BMP5XX

SEALEVELPRESSURE_HPA = 1013.25

# SPI setup
spi = board.SPI()

# first sensor setup
cs1 = DigitalInOut(board.D10)
cs1.direction = Direction.OUTPUT
bmp1 = BMP5XX.over_spi(spi=spi, cs=cs1)

# second sensor setup, different CS pin, same SPI bus
cs2 = DigitalInOut(board.D11)
cs2.direction = Direction.OUTPUT
bmp2 = BMP5XX.over_spi(spi=spi, cs=cs2)

bmp1.sea_level_pressure = SEALEVELPRESSURE_HPA
bmp2.sea_level_pressure = SEALEVELPRESSURE_HPA

while True:
    if bmp1.data_ready:
        print(
            f"BMP1 temp F: {bmp1.temperature * (9 / 5) + 32} "
            f"pressure: {bmp1.pressure} hPa "
            f"Approx altitude: {bmp1.altitude} m"
        )

    if bmp2.data_ready:
        print(
            f"BMP2 temp F: {bmp2.temperature * (9 / 5) + 32} "
            f"pressure: {bmp2.pressure} hPa "
            f"Approx altitude: {bmp2.altitude} m"
        )
    print("-----")
    time.sleep(1)
