# SPDX-FileCopyrightText: Copyright (c) 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""QMC5333P Simple Test"""

import time

import board

import adafruit_qmc5883p

i2c = board.I2C()
# i2c = board.STEMMA_I2C()

sensor = adafruit_qmc5883p.QMC5883P(i2c)

# configure sensor settings
# defaults to MODE_NORMAL, ODR_50HZ, RANGE_8G

# sensor.mode = adafruit_qmc5883p.MODE_CONTINUOUS
# sensor.data_rate = adafruit_qmc5883p.ODR_10HZ
# sensor.range = adafruit_qmc5883p.RANGE_2G

print("QMC5883P Magnetometer Test")
print("-" * 40)

while True:
    mag_x, mag_y, mag_z = sensor.magnetic

    print(f"X:{mag_x:2.3f}, Y:{mag_y:2.3f}, Z:{mag_z:2.3f} G")

    time.sleep(1)
