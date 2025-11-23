# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""Simple test example for MLX90632 sensor"""

import time

import board

import adafruit_mlx90632

# Create I2C bus
i2c = board.I2C()  # uses board.SCL and board.SDA

# Create MLX90632 instance
mlx = adafruit_mlx90632.MLX90632(i2c)

# Print sensor information
print(f"Product ID: 0x{mlx.product_id:012X}")
print(f"Product Code: 0x{mlx.product_code:04X}")
print(f"EEPROM Version: 0x{mlx.eeprom_version:04X}")

# Set measurement mode to continuous
mlx.mode = adafruit_mlx90632.MODE_CONTINUOUS

# Set refresh rate to 2Hz
mlx.refresh_rate = adafruit_mlx90632.REFRESH_2HZ

print("\nReading temperatures...")

while True:
    # Check if new data is available
    if mlx.data_ready:
        # Read temperatures
        ambient_temp = mlx.ambient_temperature
        object_temp = mlx.object_temperature

        print(f"Ambient: {ambient_temp:.2f}°C, Object: {object_temp:.2f}°C")

        # Reset new data flag
        mlx.reset_data_ready()

    time.sleep(0.1)
