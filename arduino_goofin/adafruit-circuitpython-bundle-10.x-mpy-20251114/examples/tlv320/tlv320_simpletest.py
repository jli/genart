# SPDX-FileCopyrightText: 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

import array
import math
import time

import audiobusio
import audiocore
import board
import digitalio

import adafruit_tlv320

# Reset the DAC before use
reset_pin = digitalio.DigitalInOut(board.D12)
reset_pin.direction = digitalio.Direction.OUTPUT
reset_pin.value = False  # Set low to reset
time.sleep(0.1)  # Pause 100ms
reset_pin.value = True  # Set high to release from reset

i2c = board.I2C()
dac = adafruit_tlv320.TLV320DAC3100(i2c)

# set sample rate & bit depth, use bclk
dac.configure_clocks(sample_rate=44100, bit_depth=16)

# use headphones
dac.headphone_output = True
dac.dac_volume = -10  # dB
# or use speaker
# dac.speaker_output = True
# dac.speaker_volume = -20 # dB

if "I2S_BCLK" and "I2S_WS" in dir(board):
    audio = audiobusio.I2SOut(board.I2S_BCLK, board.I2S_WS, board.I2S_DIN)
else:
    audio = audiobusio.I2SOut(board.D9, board.D10, board.D11)
# generate a sine wave
tone_volume = 0.5
frequency = 440
sample_rate = dac.sample_rate
length = sample_rate // frequency
sine_wave = array.array("h", [0] * length)
for i in range(length):
    sine_wave[i] = int((math.sin(math.pi * 2 * i / length)) * tone_volume * (2**15 - 1))
sine_wave_sample = audiocore.RawSample(sine_wave, sample_rate=sample_rate)

while True:
    audio.stop()
    time.sleep(1)
    audio.play(sine_wave_sample, loop=True)
    time.sleep(1)
