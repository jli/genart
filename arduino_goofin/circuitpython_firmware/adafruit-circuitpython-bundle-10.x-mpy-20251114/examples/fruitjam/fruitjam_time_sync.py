# SPDX-FileCopyrightText: Copyright (c) 2025 Mikey Sklar for Adafruit Industries
#
# SPDX-License-Identifier: MIT
import time

from adafruit_fruitjam import FruitJam

fj = FruitJam()
now = fj.sync_time()
print("RTC set:", now)
print("Localtime:", time.localtime())
