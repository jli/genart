# SPDX-FileCopyrightText: 2021 ladyada for Adafruit Industries
# SPDX-License-Identifier: MIT

import time

import board

import adafruit_hts221

i2c = board.I2C()  # uses board.SCL and board.SDA
# i2c = board.STEMMA_I2C()  # For using the built-in STEMMA QT connector on a microcontroller
hts = adafruit_hts221.HTS221(i2c)

data_rate = adafruit_hts221.Rate.label[hts.data_rate]
print(f"Using data rate of: {data_rate:.1f} Hz")
print("")

while True:
    print(f"Relative Humidity: {hts.relative_humidity:.2f} % rH")
    print(f"Temperature: {hts.temperature:.2f} C")
    print("")
    time.sleep(1)
