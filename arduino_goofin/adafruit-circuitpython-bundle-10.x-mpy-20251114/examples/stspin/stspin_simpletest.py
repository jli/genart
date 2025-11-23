# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""
Basic example for the Adafruit STSPIN220 stepper motor driver library.
"""

import time

import board

import adafruit_stspin

STEPS_PER_REVOLUTION = 200

DIR_PIN = board.D5
STEP_PIN = board.D6

# Create stepper object with full pin configuration
# Defaults to 1/16 microsteps
motor = adafruit_stspin.STSPIN(STEP_PIN, DIR_PIN, STEPS_PER_REVOLUTION)

# Set the speed to 60 RPM
motor.speed = 60

print(f"Microstepping mode set to 1/{motor.microsteps_per_step} at {motor.speed} RPM")

while True:
    # Calculate total microsteps for one full revolution
    total_microsteps = STEPS_PER_REVOLUTION * motor.microsteps_per_step

    print(f"Stepping forward one revolution ({total_microsteps} microsteps)...")
    motor.step(total_microsteps)
    time.sleep(1.0)

    print(f"Stepping backward one revolution ({total_microsteps} microsteps)...")
    motor.step(-total_microsteps)
    time.sleep(1.0)
