# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT
import time

from adafruit_fruitjam.peripherals import Peripherals

colors = [0xFF00FF, 0xFFFF00, 0x00FF00]

fruitjam = Peripherals()
fruitjam.neopixels.brightness = 0.1

while True:
    fruitjam.neopixels.fill(colors[0])
    time.sleep(0.3)
    fruitjam.neopixels.fill(colors[1])
    time.sleep(0.3)
    fruitjam.neopixels.fill(colors[2])
    time.sleep(0.3)
    fruitjam.neopixels.fill(0x000000)

    for i in range(5):
        fruitjam.neopixels[i] = colors[i % len(colors)]
        time.sleep(0.1)
