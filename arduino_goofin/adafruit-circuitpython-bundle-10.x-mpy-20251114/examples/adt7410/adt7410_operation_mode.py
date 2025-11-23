# SPDX-FileCopyrightText: Copyright (c) 2023 Jose D. Montoya
#
# SPDX-License-Identifier: MIT

import time

import adt7410
import board

i2c = board.I2C()
adt = adt7410.ADT7410(i2c)

adt.operation_mode = adt7410.SPS

while True:
    for operation_mode in adt7410.operation_mode_values:
        print("Current Operation mode setting: ", adt.operation_mode)
        for _ in range(10):
            print(f"Temperature: {adt.temperature:.2f}C")
            time.sleep(0.5)
        adt.operation_mode = operation_mode
