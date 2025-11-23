# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT
import time

import synthio

import adafruit_fruitjam

pobj = adafruit_fruitjam.peripherals.Peripherals(audio_output="headphone")

synth = synthio.Synthesizer(sample_rate=44100)
pobj.audio.play(synth)
VOLUMES = [0.25, 0.35, 0.50, 0.55, 0.60]
C_major_scale = [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60]
while True:
    print("\n=== Synthio Test ===")
    for vol in VOLUMES:
        pobj.volume = vol
        print(f"Volume: {vol}")
        for note in C_major_scale:
            synth.press(note)
            time.sleep(0.1)
            synth.release(note)
            time.sleep(0.05)

    time.sleep(1.0)
