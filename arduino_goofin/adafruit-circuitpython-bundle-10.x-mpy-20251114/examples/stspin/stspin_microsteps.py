# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""
Microstepping mode test for the Adafruit STSPIN220 stepper motor driver.
"""

import time

import board

import adafruit_stspin

# Define the number of steps per revolution for your stepper motor
# Most steppers are 200 steps per revolution (1.8 degrees per step)
STEPS_PER_REVOLUTION = 200

DIR_PIN = board.D5  # DIRection pin
STEP_PIN = board.D6  # STEP pin
MODE1_PIN = board.D9  # Mode 1 pin (REQUIRED for mode switching)
MODE2_PIN = board.D10  # Mode 2 pin (REQUIRED for mode switching)
EN_FAULT_PIN = board.D11  # Enable/Fault pin (optional)
STBY_RESET_PIN = board.D12  # Standby/Reset pin (REQUIRED for mode switching)

print("Initializing STSPIN220...")
motor = adafruit_stspin.STSPIN(
    STEP_PIN,
    DIR_PIN,
    STEPS_PER_REVOLUTION,
    mode1_pin=MODE1_PIN,
    mode2_pin=MODE2_PIN,
    en_fault_pin=EN_FAULT_PIN,
    stby_reset_pin=STBY_RESET_PIN,
)

print("Adafruit STSPIN220 Microstepping Mode Test")
print("=" * 50)

# Define all available modes with their names for display
MODES = [
    (adafruit_stspin.Modes.STEP_FULL, "Full Step"),
    (adafruit_stspin.Modes.STEP_1_2, "1/2 Step"),
    (adafruit_stspin.Modes.STEP_1_4, "1/4 Step"),
    (adafruit_stspin.Modes.STEP_1_8, "1/8 Step"),
    (adafruit_stspin.Modes.STEP_1_16, "1/16 Step"),
    (adafruit_stspin.Modes.STEP_1_32, "1/32 Step"),
    (adafruit_stspin.Modes.STEP_1_64, "1/64 Step"),
    (adafruit_stspin.Modes.STEP_1_128, "1/128 Step"),
    (adafruit_stspin.Modes.STEP_1_256, "1/256 Step"),
]

BASE_RPM = 60  # Base speed for full step mode

while True:
    for mode, mode_name in MODES:
        print(f"\nTesting {mode_name} mode...")

        try:
            # Set the microstepping mode
            motor.step_mode = mode

            # Get the number of microsteps for this mode
            microsteps = motor.microsteps_per_step
            motor.speed = BASE_RPM

            # Calculate total steps needed for one full revolution
            total_steps = STEPS_PER_REVOLUTION * microsteps
            print(f"  Speed: {motor.speed} RPM")
            print(f"  Microsteps per full step: {microsteps}")
            print(f"  Steps for full revolution: {total_steps}")

            # Check for any faults before moving
            if motor.fault:
                print("  WARNING: Fault detected! Clearing...")
                motor.clear_fault()
                time.sleep(0.1)

            # Perform one full revolution forward
            print(f"  Rotating forward 360°...")
            start_time = time.monotonic()
            motor.step(total_steps)
            rotation_time = time.monotonic() - start_time
            print(f"  Rotation completed in {rotation_time:.2f} seconds")

            # Brief pause to see the position
            time.sleep(0.5)

            # Return to starting position
            print(f"  Returning to start position...")
            motor.step(-total_steps)

            print(f"  {mode_name} test complete!")

        except ValueError as e:
            print(f"  ERROR: Could not set {mode_name} mode - {e}")
            print("  Make sure MODE1, MODE2, and STBY/RESET pins are connected!")

        # Pause between modes
        time.sleep(1.0)

    print("\n" + "=" * 50)
    print("All modes tested! Starting next cycle in 3 seconds...")
    print("=" * 50)
    time.sleep(3.0)
