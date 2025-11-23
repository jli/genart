# SPDX-FileCopyrightText: 2021 ladyada for Adafruit Industries
# SPDX-License-Identifier: MIT

import time

import adt7410
import board

i2c = board.I2C()  # uses board.SCL and board.SDA
adt = adt7410.ADT7410(i2c)

adt.low_temperature = 18
adt.high_temperature = 29
adt.critical_temperature = 35
adt.hysteresis_temperature = 2

print(f"High limit: {adt.high_temperature}C")
print(f"Low limit: {adt.low_temperature}C")
print(f"Critical limit: {adt.critical_temperature}C")

adt.comparator_mode = adt7410.COMP_ENABLED

while True:
    print(f"Temperature: {adt.temperature:.2f}C")
    alert_status = adt.alert_status
    if alert_status.high_alert:
        print("Temperature above high set limit!")
    if alert_status.low_alert:
        print("Temperature below low set limit!")
    if alert_status.critical_alert:
        print("Temperature above critical set limit!")
    time.sleep(1)
