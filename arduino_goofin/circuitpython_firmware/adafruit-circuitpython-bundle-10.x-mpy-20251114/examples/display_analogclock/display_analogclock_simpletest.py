# SPDX-FileCopyrightText: 2025 Tim C for Adafruit Industries
# SPDX-License-Identifier: MIT

"""
Demonstration of AnalogClock display widget.
Initialize a clock, show it on the display and set it
to show a specific time.

Intended to run on devices with a built-in display.
"""

import board

from adafruit_display_analogclock import AnalogClock

display = board.DISPLAY

plain_clockface = AnalogClock(
    "green_hour_hand.bmp",
    "green_minute_hand.bmp",
    (120, 120),
    106,
    number_label_scale=2,
    number_label_color=0x00FF00,
)

display.root_group = plain_clockface

plain_clockface.set_time(3, 30)

while True:
    pass
