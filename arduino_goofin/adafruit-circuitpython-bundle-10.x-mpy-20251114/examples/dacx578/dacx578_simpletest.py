# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

import board

import adafruit_dacx578

i2c = board.I2C()
dac = adafruit_dacx578.DACx578(i2c)

# channels are available with dac.channels[NUM]
# with NUM being 0-7
dac.channels[0].value = 65535  # 3.3V
dac.channels[1].value = int(65535 / 2)  # 1.65V
dac.channels[2].value = int(65535 / 4)  # 0.825V
dac.channels[3].value = 0
