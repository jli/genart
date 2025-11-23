# SPDX-FileCopyrightText: 2020 Bryan Siepert, written for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense
import time

import board
import busio

from adafruit_bno08x_rvc import BNO08x_RVC

uart = busio.UART(board.TX, board.RX, baudrate=115200, receiver_buffer_size=2048)

# uncomment and comment out the above for use with Raspberry Pi
# import serial
# uart = serial.Serial("/dev/serial0", 115200)

# for a USB Serial cable:
# import serial
# uart = serial.Serial("/dev/ttyUSB0", baudrate=115200)

rvc = BNO08x_RVC(uart)

while True:
    yaw, pitch, roll, x_accel, y_accel, z_accel = rvc.heading
    print(f"Yaw: {yaw:.2f} Pitch: {pitch:.2f} Roll: {roll:.2f} Degrees")
    print(f"Acceleration X: {x_accel:.2f} Y: {y_accel:.2f} Z: {z_accel:.2f} m/s^2")
    print("")
    time.sleep(0.1)
