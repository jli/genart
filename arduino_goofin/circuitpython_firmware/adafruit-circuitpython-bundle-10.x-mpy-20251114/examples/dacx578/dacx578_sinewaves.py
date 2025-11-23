# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT
import math
import time

import board

import adafruit_dacx578

# Initialize I2C and DAC
i2c = board.I2C()
dac = adafruit_dacx578.DACx578(i2c)

MAX_VALUE = 65535  # 16-bit value
BASE_FREQ = 1.0  # frequency in Hz
SAMPLE_RATE = 100  # samples per second

FREQ_MULTIPLIERS = [
    1.0,  # Channel 0: 1 Hz
    2.0,  # Channel 1: 2 Hz
    3.0,  # Channel 2: 3 Hz
    4.0,  # Channel 3: 4 Hz
    5.0,  # Channel 4: 5 Hz
    6.0,  # Channel 5: 6 Hz
    7.0,  # Channel 6: 7 Hz
    8.0,  # Channel 7: 8 Hz
]


def calculate_sinewave(frequency, time_point):
    angle = 2 * math.pi * frequency * time_point
    return int((math.sin(angle) + 1) * (MAX_VALUE / 2))


start_time = time.monotonic()

while True:
    current_time = time.monotonic() - start_time

    for channel_num in range(8):
        frequency = BASE_FREQ * FREQ_MULTIPLIERS[channel_num]
        value = calculate_sinewave(frequency, current_time)
        dac.channels[channel_num].value = value

    time.sleep(1 / SAMPLE_RATE)
