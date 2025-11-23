# SPDX-FileCopyrightText: 2023 Jose D. Montoya
# SPDX-License-Identifier: MIT

import time

import board

import adafruit_mlx90393

i2c = board.I2C()  # uses board.SCL and board.SDA
# i2c = board.STEMMA_I2C()  # For using the built-in STEMMA QT connector on a microcontroller
try:
    SENSOR = adafruit_mlx90393.MLX90393(i2c, gain=adafruit_mlx90393.GAIN_1X)
except ValueError:
    SENSOR = adafruit_mlx90393.MLX90393(i2c, gain=adafruit_mlx90393.GAIN_1X, address=0x18)


while True:
    temp = SENSOR.temperature

    print(f"Temperature: {temp} °C")

    # Display the status field if an error occurred, etc.
    if SENSOR.last_status > adafruit_mlx90393.STATUS_OK:
        SENSOR.display_status()
    time.sleep(1.0)
