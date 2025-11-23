# SPDX-FileCopyrightText: 2021 ladyada for Adafruit Industries
# SPDX-License-Identifier: MIT

"""Simple test script for 2.9" 296x128 grayscale display.

Supported products:
  * Adafruit 2.9" Grayscale
    * https://www.adafruit.com/product/4777
"""

import time

import board
import busio
import displayio
import fourwire

import adafruit_il0373

displayio.release_displays()

# This pinout works on a Feather M4 and may need to be altered for other boards.
spi = busio.SPI(board.SCK, board.MOSI)  # Uses SCK and MOSI
epd_cs = board.D9
epd_dc = board.D10

display_bus = fourwire.FourWire(spi, command=epd_dc, chip_select=epd_cs, baudrate=1000000)
time.sleep(1)

display = adafruit_il0373.IL0373(
    display_bus,
    width=296,
    height=128,
    rotation=270,
    black_bits_inverted=False,
    color_bits_inverted=False,
    grayscale=True,
    refresh_time=1,
)

g = displayio.Group()

pic = displayio.OnDiskBitmap("/display-ruler.bmp")
t = displayio.TileGrid(pic, pixel_shader=pic.pixel_shader)
g.append(t)

display.root_group = g

display.refresh()

print("refreshed")
time.sleep(120)
