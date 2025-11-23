# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""
Simple test for the PCM5122 I2S DAC.
"""

import board
import busio

import adafruit_pcm51xx

# Initialize I2C
i2c = board.I2C()

# Initialize PCM5122
print("Initializing PCM5122...")
pcm = adafruit_pcm51xx.PCM51XX(i2c)
print("Found PCM5122!")

# Set volume to -10dB on both channels
print("\nSetting volume to 0dB")
pcm.volume_db = (0.0, 0.0)
left_db, right_db = pcm.volume_db
print(f"Volume set to: L={left_db}dB, R={right_db}dB")

# Unmute the DAC
print("\nUnmuting DAC")
pcm.mute = False
print(f"Muted: {pcm.mute}")
