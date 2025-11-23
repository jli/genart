# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""
Simple test example for the STHS34PF80 IR presence and motion sensor
"""

import time

import board

import adafruit_sths34pf80

# Create I2C bus
i2c = board.I2C()

# Create sensor instance
sensor = adafruit_sths34pf80.STHS34PF80(i2c)

print("-" * 40)

while True:
    # wait for new data
    if sensor.data_ready:
        # temperature values
        ambient_temp = sensor.ambient_temperature
        object_temp = sensor.object_temperature
        comp_object_temp = sensor.compensated_object_temperature

        # detection values
        presence_val = sensor.presence_value
        motion_val = sensor.motion_value
        temp_shock_val = sensor.temperature_shock_value

        # detection true/false
        presence = sensor.presence
        motion = sensor.motion
        temp_shock = sensor.temperature_shock

        print(f"Ambient Temp: {ambient_temp:.2f}°C")
        print(f"Object Temp (raw): {object_temp}")
        print(f"Object Temp (compensated): {comp_object_temp}")
        print(f"Presence Value: {presence_val} {'[DETECTED]' if presence else ''}")
        print(f"Motion Value: {motion_val} {'[DETECTED]' if motion else ''}")
        print(f"Temp Shock Value: {temp_shock_val} {'[DETECTED]' if temp_shock else ''}")
        print("-" * 40)
