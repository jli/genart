# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""
PCM5122 CircuitPython Test Example
Basic test example for the Adafruit PCM51xx CircuitPython library
"""

import time

import board
import busio

import adafruit_pcm51xx

print("Adafruit PCM51xx Test")

# Initialize I2C
i2c = board.I2C()

# Initialize PCM51xx (I2C mode only in CircuitPython)
try:
    pcm = adafruit_pcm51xx.PCM51XX(i2c)
    print("PCM51xx initialized successfully!")
except Exception as e:
    print(f"Could not find PCM51xx, check wiring! Error: {e}")
    while True:
        time.sleep(0.01)

# Set I2S format to I2S
print("Setting I2S format")
pcm.i2s_format = adafruit_pcm51xx.I2S_FORMAT_I2S

# Read and display current format
format_val = pcm.i2s_format
print("Current I2S format:", end=" ")
if format_val == adafruit_pcm51xx.I2S_FORMAT_I2S:
    print("I2S")
elif format_val == adafruit_pcm51xx.I2S_FORMAT_TDM:
    print("TDM/DSP")
elif format_val == adafruit_pcm51xx.I2S_FORMAT_RTJ:
    print("Right Justified")
elif format_val == adafruit_pcm51xx.I2S_FORMAT_LTJ:
    print("Left Justified")
else:
    print("Unknown")

# Set I2S word length to 16-bit
print("Setting I2S word length")
pcm.i2s_size = adafruit_pcm51xx.I2S_SIZE_16BIT

# Read and display current word length
size_val = pcm.i2s_size
print("Current I2S word length:", end=" ")
if size_val == adafruit_pcm51xx.I2S_SIZE_16BIT:
    print("16 bits")
elif size_val == adafruit_pcm51xx.I2S_SIZE_20BIT:
    print("20 bits")
elif size_val == adafruit_pcm51xx.I2S_SIZE_24BIT:
    print("24 bits")
elif size_val == adafruit_pcm51xx.I2S_SIZE_32BIT:
    print("32 bits")
else:
    print("Unknown")

# Set error detection bits
print("Configuring error detection")
try:
    pcm.ignore_fs_detect = True
    pcm.ignore_bck_detect = True
    pcm.ignore_sck_detect = True
    pcm.ignore_clock_halt = True
    pcm.ignore_clock_missing = True
    pcm.disable_clock_autoset = False
    pcm.ignore_pll_unlock = True
    print("Error detection configured successfully")
except Exception as e:
    print(f"Error detection failed to configure: {e}")

# Enable PLL
print("Enabling PLL")
pcm.pll_enabled = True

# Check PLL status
pll_enabled = pcm.pll_enabled
print(f"PLL enabled: {'Yes' if pll_enabled else 'No'}")

# Set PLL reference to BCK
print("Setting PLL reference")
pcm.pll_reference = adafruit_pcm51xx.PLL_REF_BCK

# Read and display current PLL reference
pll_ref = pcm.pll_reference
print("Current PLL reference:", end=" ")
if pll_ref == adafruit_pcm51xx.PLL_REF_SCK:
    print("SCK")
elif pll_ref == adafruit_pcm51xx.PLL_REF_BCK:
    print("BCK")
elif pll_ref == adafruit_pcm51xx.PLL_REF_GPIO:
    print("GPIO")
else:
    print("Unknown")

# Set DAC clock source to PLL
print("Setting DAC source")
pcm.dac_source = adafruit_pcm51xx.DAC_CLK_PLL

# Read and display current DAC source
dac_source = pcm.dac_source
print("Current DAC source:", end=" ")
if dac_source == adafruit_pcm51xx.DAC_CLK_MASTER:
    print("Master clock (auto-select)")
elif dac_source == adafruit_pcm51xx.DAC_CLK_PLL:
    print("PLL clock")
elif dac_source == adafruit_pcm51xx.DAC_CLK_SCK:
    print("SCK clock")
elif dac_source == adafruit_pcm51xx.DAC_CLK_BCK:
    print("BCK clock")
else:
    print("Unknown")

# Test auto mute (default turn off)
print("Setting auto mute")
pcm.auto_mute = False

# Read and display current auto mute status
auto_mute_enabled = pcm.auto_mute
print(f"Auto mute: {'Enabled' if auto_mute_enabled else 'Disabled'}")

# Test mute (default do not mute)
print("Setting mute")
pcm.mute = False

# Read and display current mute status
mute_enabled = pcm.mute
print(f"Mute: {'Enabled' if mute_enabled else 'Disabled'}")

# Check DSP boot status and power state
print(f"DSP boot done: {'Yes' if pcm.dsp_boot else 'No'}")

power_state = pcm.power_state
print("Power state:", end=" ")
if power_state == adafruit_pcm51xx.POWER_POWERDOWN:
    print("Powerdown")
elif power_state == adafruit_pcm51xx.POWER_WAIT_CP_VALID:
    print("Wait for CP voltage valid")
elif power_state in {adafruit_pcm51xx.POWER_CALIBRATION_1, adafruit_pcm51xx.POWER_CALIBRATION_2}:
    print("Calibration")
elif power_state == adafruit_pcm51xx.POWER_VOLUME_RAMP_UP:
    print("Volume ramp up")
elif power_state == adafruit_pcm51xx.POWER_RUN_PLAYING:
    print("Run (Playing)")
elif power_state == adafruit_pcm51xx.POWER_LINE_SHORT:
    print("Line output short / Low impedance")
elif power_state == adafruit_pcm51xx.POWER_VOLUME_RAMP_DOWN:
    print("Volume ramp down")
elif power_state == adafruit_pcm51xx.POWER_STANDBY:
    print("Standby")
else:
    print("Unknown")

# Check PLL lock status
pll_locked = pcm.pll_locked
print(f"PLL locked: {'Yes' if pll_locked else 'No'}")

# Set volume to -6dB on both channels
print("Setting volume")
pcm.volume_db = (-6.0, -6.0)

# Read and display current volume
left_vol, right_vol = pcm.volume_db
print(f"Current volume - Left: {left_vol:.1f}dB, Right: {right_vol:.1f}dB")

# Test GPIO pins (CircuitPython bonus!)
print("\n--- GPIO Pin Test ---")
# Test pin 1 as output
print("Testing pin1 as output")
pcm.pin1.switch_to_output(True)
print(f"Pin1 value: {pcm.pin1.value}")
pcm.pin1.value = False
print(f"Pin1 value after setting low: {pcm.pin1.value}")

# Test pin 2 as input
print("Testing pin2 as input")
pcm.pin2.switch_to_input()
print(f"Pin2 value: {pcm.pin2.value}")

print("\nTest complete!")
