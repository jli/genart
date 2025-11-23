# SPDX-FileCopyrightText: 2025 Scott Shawcroft, written for Adafruit Industries
# SPDX-FileCopyrightText: Copyright (c) 2021 Melissa LeBlanc-Williams for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense

"""Simple test script for 3.52" 340x180 Quad-Color eInk."""

import time

import board
import busio
import displayio
from fourwire import FourWire

import adafruit_jd79667

displayio.release_displays()

spi = busio.SPI(board.EPD_SCK, board.EPD_MOSI)  # Uses SCK and MOSI
epd_cs = board.EPD_CS
epd_dc = board.EPD_DC
epd_reset = board.EPD_RESET
epd_busy = board.EPD_BUSY

display_bus = FourWire(spi, command=epd_dc, chip_select=epd_cs, reset=epd_reset, baudrate=1000000)
time.sleep(1)

display = adafruit_jd79667.JD79667(
    display_bus,
    width=384,
    height=184,
    busy_pin=epd_busy,
    rotation=270,
    colstart=0,
    highlight_color=0xFFFF00,
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
