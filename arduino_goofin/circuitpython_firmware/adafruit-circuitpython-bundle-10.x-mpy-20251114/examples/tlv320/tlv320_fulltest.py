# SPDX-FileCopyrightText: 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""
Full TLV320DAC3100 Test
Demo all features in the library
Shows advanced control for DAC, headphone and speaker
beyond basic headphone_output & speaker_output helpers
in simpletest.
"""

import time

import board
import digitalio

from adafruit_tlv320 import (
    DAC_PATH_MIXED,
    DAC_PATH_NORMAL,
    DAC_PATH_OFF,
    DAC_PATH_SWAPPED,
    DAC_ROUTE_HP,
    DAC_ROUTE_MIXER,
    DAC_ROUTE_NONE,
    GPIO1_CLKOUT,
    GPIO1_DISABLED,
    GPIO1_GPI,
    GPIO1_GPO,
    GPIO1_INPUT_MODE,
    HP_COMMON_1_35V,
    HP_COMMON_1_50V,
    HP_COMMON_1_65V,
    HP_COMMON_1_80V,
    SPK_GAIN_6DB,
    SPK_GAIN_12DB,
    SPK_GAIN_18DB,
    SPK_GAIN_24DB,
    TLV320DAC3100,
    VOL_INDEPENDENT,
    VOL_LEFT_TO_RIGHT,
    VOL_RIGHT_TO_LEFT,
)

# Reset the DAC before use
reset_pin = digitalio.DigitalInOut(board.D12)
reset_pin.direction = digitalio.Direction.OUTPUT
reset_pin.value = False  # Set low to reset
time.sleep(0.1)  # Pause 100ms
reset_pin.value = True  # Set high to release from reset

print("Initializing I2C and TLV320DAC3100...")
i2c = board.I2C()
dac = TLV320DAC3100(i2c)

# Display basic information
print("\n=== Basic Information ===")
print(f"Sample rate: {dac.sample_rate} Hz")
print(f"Bit depth: {dac.bit_depth}-bit")
print(f"Overtemperature condition: {dac.overtemperature}")

# I2S Config
dac.configure_clocks(sample_rate=44000, bit_depth=16)
print(f"Sample rate: {dac.sample_rate} Hz")
print(f"Bit depth: {dac.bit_depth}-bit")
time.sleep(0.2)

# Headphone Output Setup
print("\n=== Headphone Output Setup ===")
print("Setting up headphone output...")
dac.headphone_output = True  # This conveniently sets up multiple parameters
print(f"Headphone output enabled: {dac.headphone_output}")

# Adjust headphone volume (in dB where 0dB is max, negative values reduce volume)
print("\nAdjusting headphone volume...")
print(f"Current headphone volume: {dac.headphone_volume} dB")
dac.headphone_volume = -10  # Set to -10 dB (moderate volume)
print(f"New headphone volume: {dac.headphone_volume} dB")

# Fine-tune left and right channels individually
print("\nAdjusting left and right headphone gain...")
print(f"Left headphone gain: {dac.headphone_left_gain}")
print(f"Right headphone gain: {dac.headphone_right_gain}")
dac.headphone_left_gain = 3  # Increase left channel gain
dac.headphone_right_gain = 3  # Increase right channel gain
print(f"New left headphone gain: {dac.headphone_left_gain}")
print(f"New right headphone gain: {dac.headphone_right_gain}")

# Mute/unmute the headphones
print("\nDemonstrating headphone mute functionality...")
print(f"Left headphone muted: {dac.headphone_left_mute}")
print(f"Right headphone muted: {dac.headphone_right_mute}")
dac.headphone_left_mute = True  # Mute left channel
dac.headphone_right_mute = False  # Ensure right channel is unmuted
print(f"Left headphone now muted: {dac.headphone_left_mute}")
print(f"Right headphone still unmuted: {dac.headphone_right_mute}")
time.sleep(1)  # Listen to right channel only
dac.headphone_left_mute = False  # Unmute left channel
print(f"Left headphone now unmuted: {dac.headphone_left_mute}")
dac.headphone_output = False  # turn off before speaker test

# Speaker Output Setup
print("\n=== Speaker Output Setup ===")
print("Setting up speaker output...")
dac.speaker_output = True  # This conveniently sets up multiple parameters
print(f"Speaker output enabled: {dac.speaker_output}")

# Adjust speaker volume (in dB where 0dB is max, negative values reduce volume)
print("\nAdjusting speaker volume...")
print(f"Current speaker volume: {dac.speaker_volume} dB")
dac.speaker_volume = -6  # Set to -6 dB (louder than headphones)
print(f"New speaker volume: {dac.speaker_volume} dB")

# Set speaker amplifier gain
print("\nAdjusting speaker gain...")
print(f"Current speaker gain: {dac.speaker_gain}")
dac.speaker_gain = SPK_GAIN_12DB  # 12dB amplification
print(f"New speaker gain: {dac.speaker_gain}")

# Mute/unmute the speaker
print("\nDemonstrating speaker mute functionality...")
print(f"Speaker muted: {dac.speaker_mute}")
dac.speaker_mute = True  # Mute speaker
print(f"Speaker now muted: {dac.speaker_mute}")
time.sleep(1)
dac.speaker_mute = False  # Unmute speaker
print(f"Speaker now unmuted: {dac.speaker_mute}")

# DAC Signal Routing
print("\n=== Advanced DAC Signal Routing ===")
print("\nCurrent DAC Status:")
print(f"Left DAC enabled: {dac.left_dac}")
print(f"Right DAC enabled: {dac.right_dac}")
print(f"Left DAC path: {dac.left_dac_path}")
print(f"Right DAC path: {dac.right_dac_path}")

print("\nSetting up swapped stereo (left and right channels swapped)...")
dac.left_dac_path = DAC_PATH_SWAPPED
dac.right_dac_path = DAC_PATH_SWAPPED
print(f"New left DAC path: {dac.left_dac_path}")
print(f"New right DAC path: {dac.right_dac_path}")

print("\nSetting up mono output (mixed left and right channels)...")
dac.left_dac_path = DAC_PATH_MIXED
dac.right_dac_path = DAC_PATH_MIXED
print(f"New left DAC path: {dac.left_dac_path}")
print(f"New right DAC path: {dac.right_dac_path}")

print("\nRestoring normal stereo...")
dac.left_dac_path = DAC_PATH_NORMAL
dac.right_dac_path = DAC_PATH_NORMAL
print(f"New left DAC path: {dac.left_dac_path}")
print(f"New right DAC path: {dac.right_dac_path}")

# DAC Volume Controls
print("\n=== DAC Volume Control Configuration ===")
print(f"Left DAC muted: {dac.left_dac_mute}")
print(f"Right DAC muted: {dac.right_dac_mute}")
print(f"Volume control mode: {dac.dac_volume_control_mode}")

print("\nSetting volume control mode where left channel controls right...")
dac.dac_volume_control_mode = VOL_LEFT_TO_RIGHT
print(f"New volume control mode: {dac.dac_volume_control_mode}")

print("\nSetting independent volume control mode (default)...")
dac.dac_volume_control_mode = VOL_INDEPENDENT
print(f"New volume control mode: {dac.dac_volume_control_mode}")

# DAC Channel Volume
print("\n=== DAC Channel Volume ===")
print(f"Left DAC channel volume: {dac.left_dac_channel_volume} dB")
print(f"Right DAC channel volume: {dac.right_dac_channel_volume} dB")

print("\nSetting different volumes for left and right channels...")
dac.left_dac_channel_volume = -3
dac.right_dac_channel_volume = -9
print(f"New left DAC channel volume: {dac.left_dac_channel_volume} dB")
print(f"New right DAC channel volume: {dac.right_dac_channel_volume} dB")

# Headphone as Line-Out
print("\n=== Configure Headphone as Line-Out ===")
print(f"Headphone configured as line-out: {dac.headphone_lineout}")

# Safety Features
print("\n=== Safety Features ===")
print(f"Reset speaker on short circuit: {dac.reset_speaker_on_scd}")
print(f"Reset headphone on short circuit: {dac.reset_headphone_on_scd}")

# Getting status flags
print("\n=== Status Information ===")
flags = dac.dac_flags
print(f"Left DAC powered: {flags['left_dac_powered']}")
print(f"Right DAC powered: {flags['right_dac_powered']}")
print(f"Headphone left (HPL) powered: {flags['hpl_powered']}")
print(f"Headphone right (HPR) powered: {flags['hpr_powered']}")
print(f"Left Class-D amplifier powered: {flags['left_classd_powered']}")
print(f"Right Class-D amplifier powered: {flags['right_classd_powered']}")
print(f"Left PGA gain OK: {flags['left_pga_gain_ok']}")
print(f"Right PGA gain OK: {flags['right_pga_gain_ok']}")

# Additional status checks via dedicated properties
print("\nStatus via dedicated properties:")
print(f"Speaker shorted: {dac.speaker_shorted}")
print(f"HPL gain fully applied: {dac.hpl_gain_applied}")
print(f"HPR gain fully applied: {dac.hpr_gain_applied}")
print(f"Speaker gain fully applied: {dac.speaker_gain_applied}")

# Higher-level shortcut methods
print("\n=== Using Higher-Level Shortcuts ===")
print("Demonstrating on/off control of primary outputs:")

print("\nTurning off headphone output...")
dac.headphone_output = False
print(f"Headphone output now: {dac.headphone_output}")

print("\nTurning off speaker output...")
dac.speaker_output = True
print(f"Speaker output now: {dac.speaker_output}")

print("\nSwapping outputs...")
dac.speaker_output = False
dac.headphone_output = True
print(f"Headphone output now: {dac.headphone_output}")
print(f"Speaker output now: {dac.speaker_output}")

# Pop Removal Setting
print("\n=== Headphone Pop Removal Settings ===")
dac.configure_headphone_pop(
    wait_for_powerdown=True,  # Wait for amp powerdown before DAC powerdown
    powerup_time=7,  # Power-on time setting (0-11)
    ramp_time=3,  # Ramp-up step time (0-3)
)
print("Headphone pop removal configured")

# External Settings (like GPIO)
print("\n=== GPIO Configuration ===")
print(f"Current GPIO1 mode: {dac.gpio1_mode}")
dac.gpio1_mode = GPIO1_GPO  # Set GPIO1 as general purpose output
print(f"New GPIO1 mode: {dac.gpio1_mode}")
dac.gpio1_mode = GPIO1_DISABLED  # Disable GPIO1
print(f"Disabled GPIO1 mode: {dac.gpio1_mode}")

# Volume Control ADC
print("\n=== Volume Control ADC ===")
print(f"Volume ADC reading: {dac.vol_adc_db} dB")

print("\nAll examples completed!")
