# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT
import time

import displayio
import supervisor
from audiocore import WaveFile

from adafruit_fruitjam.peripherals import Peripherals

colors = [0xFF00FF, 0xFFFF00, 0x00FF00]

fruitjam = Peripherals()
fruitjam.neopixels.brightness = 0.1
fruitjam.neopixels.fill(0xFF00FF)

time.sleep(2)
fruitjam.neopixels.fill(0x000000)
fruitjam.volume = 0.65
wave_file = open("/wav/ada_fruitjam_boot_jingle.wav", "rb")
wave = WaveFile(wave_file)
fruitjam.audio.play(wave)

display = supervisor.runtime.display
empty_group = displayio.Group()
display.root_group = empty_group

audio_finished = False

while True:
    if fruitjam.button1:
        print("Button 1 pressed")
        fruitjam.neopixels.fill(colors[0])
    if fruitjam.button2:
        print("Button 2 pressed")
        fruitjam.neopixels.fill(colors[1])
    if fruitjam.button3:
        print("Button 3 pressed")
        fruitjam.neopixels.fill(colors[2])

    if not fruitjam.audio.playing and not audio_finished:
        audio_finished = True
        print("Audio playback complete")

    time.sleep(0.01)
