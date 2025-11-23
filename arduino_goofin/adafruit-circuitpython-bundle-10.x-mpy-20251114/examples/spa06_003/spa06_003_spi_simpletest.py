# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT
import time

import board
from digitalio import DigitalInOut

from adafruit_spa06_003 import SPA06_003

spi = board.SPI()
cs = DigitalInOut(board.D10)

spa = SPA06_003.over_spi(spi, cs)

while True:
    if spa.temperature_data_ready and spa.pressure_data_ready:
        print(f"Temperature: {spa.temperature} °C", end="   ")
        print(f"Pressure: {spa.pressure}  hPa")

    time.sleep(1.0)
