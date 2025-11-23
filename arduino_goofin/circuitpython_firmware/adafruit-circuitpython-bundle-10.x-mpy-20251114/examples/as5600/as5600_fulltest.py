# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""
Full library testing example for the Adafruit AS5600 CircuitPython library

This example tests all functionality of the AS5600 magnetic angle sensor
"""

import time

import board

import adafruit_as5600

# Initialize I2C and AS5600
i2c = board.I2C()  # uses board.SCL and board.SDA
as5600 = adafruit_as5600.AS5600(i2c)

print("Adafruit AS5600 Full Test")
print("AS5600 found!")
print()

# Test zm_count property
zm_count = as5600.zm_count
print(f"ZM Count (burn count): {zm_count}")

# Test z_position property
z_pos = as5600.z_position
print(f"Z Position: {z_pos}")

# Test setting z_position (XOR current value with 0xADA to change it)
test_pos = (z_pos ^ 0xADA) & 0x0FFF  # XOR with 0xADA and keep within 12-bit range
print(f"Setting Z Position to {test_pos} (0x{test_pos:03X})... ")
try:
    as5600.z_position = test_pos
    print("Success")
    new_z_pos = as5600.z_position
    print(f"New Z Position: {new_z_pos} (0x{new_z_pos:03X})")
except Exception as e:
    print(f"Failed: {e}")

# Test m_position property
m_pos = as5600.m_position
print(f"M Position: {m_pos}")

# Test setting m_position (XOR current value with 0xBEE)
test_m_pos = (m_pos ^ 0xBEE) & 0x0FFF
print(f"Setting M Position to {test_m_pos} (0x{test_m_pos:03X})... ")
try:
    as5600.m_position = test_m_pos
    print("Success")
    new_m_pos = as5600.m_position
    print(f"New M Position: {new_m_pos} (0x{new_m_pos:03X})")
except Exception as e:
    print(f"Failed: {e}")

# Test max_angle property
max_angle = as5600.max_angle
print(f"Max Angle: {max_angle}")

# Test setting max_angle (XOR current value with 0xCAB)
test_max_angle = (max_angle ^ 0xCAB) & 0x0FFF
print(f"Setting Max Angle to {test_max_angle} (0x{test_max_angle:03X})... ")
try:
    as5600.max_angle = test_max_angle
    print("Success")
    new_max_angle = as5600.max_angle
    print(f"New Max Angle: {new_max_angle} (0x{new_max_angle:03X})")
except Exception as e:
    print(f"Failed: {e}")

# Test watchdog property
print("Turning on watchdog... ")
try:
    as5600.watchdog = True
    print("Success")
    print(f"Watchdog status: {'ENABLED' if as5600.watchdog else 'DISABLED'}")
except Exception as e:
    print(f"Failed: {e}")

print("Turning off watchdog...")
try:
    as5600.watchdog = False
    print("Success")
    print(f"Watchdog status: {'ENABLED' if as5600.watchdog else 'DISABLED'}")
except Exception as e:
    print(f"Failed: {e}")

# Test power_mode property
print("Setting power mode...")
try:
    as5600.power_mode = adafruit_as5600.POWER_MODE_NOM
    print("Success")
    mode = as5600.power_mode
    print("Power mode: ")
    if mode == adafruit_as5600.POWER_MODE_NOM:
        print("Normal")
    elif mode == adafruit_as5600.POWER_MODE_LPM1:
        print("Low Power Mode 1")
    elif mode == adafruit_as5600.POWER_MODE_LPM2:
        print("Low Power Mode 2")
    elif mode == adafruit_as5600.POWER_MODE_LPM3:
        print("Low Power Mode 3")
except Exception as e:
    print(f"Failed: {e}")

# Test hysteresis property
print("Setting hysteresis...")
try:
    as5600.hysteresis = adafruit_as5600.HYSTERESIS_OFF
    print("Success")
    hysteresis = as5600.hysteresis
    print("Hysteresis: ")
    if hysteresis == adafruit_as5600.HYSTERESIS_OFF:
        print("OFF")
    elif hysteresis == adafruit_as5600.HYSTERESIS_1LSB:
        print("1 LSB")
    elif hysteresis == adafruit_as5600.HYSTERESIS_2LSB:
        print("2 LSB")
    elif hysteresis == adafruit_as5600.HYSTERESIS_3LSB:
        print("3 LSB")
except Exception as e:
    print(f"Failed: {e}")

# Test output_stage property
print("Setting output stage...")
try:
    as5600.output_stage = adafruit_as5600.OUTPUT_STAGE_ANALOG_FULL
    print("Success")
    output_stage = as5600.output_stage
    print("Output stage: ")
    if output_stage == adafruit_as5600.OUTPUT_STAGE_ANALOG_FULL:
        print("Analog Full (0% to 100%)")
    elif output_stage == adafruit_as5600.OUTPUT_STAGE_ANALOG_REDUCED:
        print("Analog Reduced (10% to 90%)")
    elif output_stage == adafruit_as5600.OUTPUT_STAGE_DIGITAL_PWM:
        print("Digital PWM")
    elif output_stage == adafruit_as5600.OUTPUT_STAGE_RESERVED:
        print("Reserved")
except Exception as e:
    print(f"Failed: {e}")

# Test pwm_frequency property
print("Setting PWM frequency...")
try:
    as5600.pwm_frequency = adafruit_as5600.PWM_FREQ_115HZ
    print("Success")
    pwm_freq = as5600.pwm_frequency
    print("PWM frequency: ")
    if pwm_freq == adafruit_as5600.PWM_FREQ_115HZ:
        print("115 Hz")
    elif pwm_freq == adafruit_as5600.PWM_FREQ_230HZ:
        print("230 Hz")
    elif pwm_freq == adafruit_as5600.PWM_FREQ_460HZ:
        print("460 Hz")
    elif pwm_freq == adafruit_as5600.PWM_FREQ_920HZ:
        print("920 Hz")
except Exception as e:
    print(f"Failed: {e}")

# Test slow_filter property
print("Setting slow filter to 16x (options: 16X=0, 8X=1, 4X=2, 2X=3)... ")
try:
    as5600.slow_filter = adafruit_as5600.SLOW_FILTER_16X
    print("Success")
    slow_filter = as5600.slow_filter
    print("Slow filter: ")
    if slow_filter == adafruit_as5600.SLOW_FILTER_16X:
        print("16x")
    elif slow_filter == adafruit_as5600.SLOW_FILTER_8X:
        print("8x")
    elif slow_filter == adafruit_as5600.SLOW_FILTER_4X:
        print("4x")
    elif slow_filter == adafruit_as5600.SLOW_FILTER_2X:
        print("2x")
except Exception as e:
    print(f"Failed: {e}")

# Test fast_filter_threshold property
print("Setting fast filter threshold... ")
try:
    as5600.fast_filter_threshold = adafruit_as5600.FAST_FILTER_SLOW_ONLY
    print("Success")
    fast_thresh = as5600.fast_filter_threshold
    print("Fast filter threshold: ", end="")
    if fast_thresh == adafruit_as5600.FAST_FILTER_SLOW_ONLY:
        print("Slow filter only")
    elif fast_thresh == adafruit_as5600.FAST_FILTER_6LSB:
        print("6 LSB")
    elif fast_thresh == adafruit_as5600.FAST_FILTER_7LSB:
        print("7 LSB")
    elif fast_thresh == adafruit_as5600.FAST_FILTER_9LSB:
        print("9 LSB")
    elif fast_thresh == adafruit_as5600.FAST_FILTER_18LSB:
        print("18 LSB")
    elif fast_thresh == adafruit_as5600.FAST_FILTER_21LSB:
        print("21 LSB")
    elif fast_thresh == adafruit_as5600.FAST_FILTER_24LSB:
        print("24 LSB")
    elif fast_thresh == adafruit_as5600.FAST_FILTER_10LSB:
        print("10 LSB")
except Exception as e:
    print(f"Failed: {e}")

# Reset position settings to defaults
print("\nResetting position settings to defaults...")
as5600.z_position = 0
as5600.m_position = 4095
as5600.max_angle = 4095

print("\nStarting continuous angle reading...")
print("=" * 80)

# Continuously read and display angle values
while True:
    # Get angle readings
    raw_angle = as5600.raw_angle
    angle = as5600.angle

    # Build output string
    output = f"Raw: {raw_angle:4d} (0x{raw_angle:03X}) | Scaled: {angle:4d} (0x{angle:03X})"

    # Check status conditions
    if as5600.magnet_detected:
        output += " | Magnet: YES"
    else:
        output += " | Magnet: NO "

    if as5600.min_gain_overflow:
        output += " | MH: magnet too strong"

    if as5600.max_gain_overflow:
        output += " | ML: magnet too weak"

    # Get AGC and Magnitude values
    agc = as5600.agc
    magnitude = as5600.magnitude
    output += f" | AGC: {agc:3d} | Mag: {magnitude:4d}"

    print(output)
    time.sleep(2)
