# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT

import time

import board

from adafruit_spa06_003 import SPA06_003

i2c = board.I2C()
# i2c = board.STEMMA_I2C()

# Initialize with default I2C Address
spa = SPA06_003.over_i2c(i2c)

# Initialize with alternate I2C Address
# from adafruit_spa06_003 import SPA06_003_ALTERNATE_ADDR
# spa = SPA06_003.over_i2c(i2c, address=SPA06_003_ALTERNATE_ADDR)

while True:
    if spa.temperature_data_ready and spa.pressure_data_ready:
        print(f"Temperature: {spa.temperature} °C", end="   ")
        print(f"Pressure: {spa.pressure}  hPa")

    time.sleep(1.0)
