# SPDX-FileCopyrightText: Copyright (c) 2021 Kattni Rembor for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense
"""Display the microcontroller CPU temperature in C and F on a display."""

import microcontroller

from adafruit_simple_text_display import SimpleTextDisplay

temperature_data = SimpleTextDisplay(title="Temperature Data!", title_scale=2)

while True:
    temperature_data[0].text = f"Temperature: {microcontroller.cpu.temperature:.2f} degrees C"
    temperature_data[
        1
    ].text = f"Temperature: {microcontroller.cpu.temperature * (9 / 5) + 32:.2f} degrees F"
    temperature_data.show()
