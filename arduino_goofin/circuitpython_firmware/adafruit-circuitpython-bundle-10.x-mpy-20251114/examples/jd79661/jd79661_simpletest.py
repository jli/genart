# SPDX-FileCopyrightText: 2025 Scott Shawcroft, written for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense

"""Simple test script for 2.13" Quad Color Display"""

import time

import board
import displayio
from fourwire import FourWire

import adafruit_jd79661

displayio.release_displays()

spi = board.SPI()
epd_cs = board.D9
epd_dc = board.D10
epd_reset = board.D6
epd_busy = board.D5

display_bus = FourWire(spi, command=epd_dc, chip_select=epd_cs, reset=epd_reset, baudrate=1000000)
time.sleep(1)

display = adafruit_jd79661.JD79661(
    display_bus,
    width=250,
    height=122,
    busy_pin=epd_busy,
    rotation=270,
    colstart=0,
    highlight_color=0x00FF00,
    highlight_color2=0xFF0000,
)

g = displayio.Group()

pic = displayio.OnDiskBitmap("/display-ruler-640x360.bmp")
t = displayio.TileGrid(pic, pixel_shader=pic.pixel_shader)
g.append(t)

display.root_group = g

display.refresh()

print("refreshed")

time.sleep(display.time_to_refresh + 5)
# Always refresh a little longer. It's not a problem to refresh
# a few seconds more, but it's terrible to refresh too early
# (the display will throw an exception when if the refresh
# is too soon)
print("waited correct time")


# Keep the display the same
while True:
    time.sleep(10)
