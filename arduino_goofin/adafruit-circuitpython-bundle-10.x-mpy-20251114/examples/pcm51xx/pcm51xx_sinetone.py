# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""
Sine tone playback test for the PCM5122 I2S DAC.
"""

import array
import math
import time

import audiobusio
import audiocore
import board
import busio

import adafruit_pcm51xx

# Initialize I2C
i2c = board.I2C()

# Initialize PCM5122
print("Initializing PCM5122...")
pcm = adafruit_pcm51xx.PCM51XX(i2c)
print("Found PCM5122!")

# Set volume to -5dB on both channels
print("\nSetting volume to -5dB")
pcm.volume_db = (-5.0, -5.0)
left_db, right_db = pcm.volume_db
print(f"Volume set to: L={left_db}dB, R={right_db}dB")

# Unmute the DAC
print("\nUnmuting DAC")
pcm.mute = False
print(f"Muted: {pcm.mute}")

audio = audiobusio.I2SOut(board.D9, board.D10, board.D11)

tone_volume = 0.5  # Increase this to increase the volume of the tone.
frequency = 440  # Set this to the Hz of the tone you want to generate.
length = 8000 // frequency
sine_wave = array.array("h", [0] * length)
for i in range(length):
    sine_wave[i] = int((math.sin(math.pi * 2 * i / length)) * tone_volume * (2**15 - 1))
sine_wave_sample = audiocore.RawSample(sine_wave)

while True:
    audio.play(sine_wave_sample, loop=True)
    time.sleep(1)
    audio.stop()
    time.sleep(1)
