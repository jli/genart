# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT
import time

import adafruit_fruitjam

pobj = adafruit_fruitjam.peripherals.Peripherals(audio_output="headphone")

FILES = ["wav/beep.wav", "wav/dip.wav", "wav/rise.wav"]
VOLUMES = [0.25, 0.35, 0.50, 0.55, 0.60]

while True:
    print("\n=== Headphones Test ===")
    for vol in VOLUMES:
        pobj.volume = vol
        print(f"Headphones volume: {vol}")
        for f in FILES:
            print(f"  -> {f}")
            pobj.play_file(f)
            time.sleep(0.2)
    time.sleep(1.0)
