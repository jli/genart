# SPDX-FileCopyrightText: 2017 Scott Shawcroft, written for Adafruit Industries
# SPDX-FileCopyrightText: Copyright (c) 2023 Melissa LeBlanc-Williams for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense
"""
Simple test script for 2.7" 264x176 Tri-Color display
Supported products:
* `Adafruit 2.7" Tri-Color eInk / ePaper Display
with SRAM <https://www.adafruit.com/product/4098>`_

This program only requires the adafruit_ek79686 library in /lib
for CircuitPython 5.0 and above which has displayio support.
"""

import time

import board
import displayio
from fourwire import FourWire

import adafruit_ek79686

# Used to ensure the display is free in CircuitPython
displayio.release_displays()

# Define the pins needed for display use on the Metro
spi = board.SPI()
epd_cs = board.D10
epd_dc = board.D9
epd_reset = board.D5
epd_busy = board.D6

# Create the displayio connection to the display pins
display_bus = FourWire(spi, command=epd_dc, chip_select=epd_cs, reset=epd_reset, baudrate=1000000)
time.sleep(1)  # Wait a bit

# Create the display object - the third color is red (0xff0000)
display = adafruit_ek79686.EK79686(
    display_bus,
    width=264,
    height=176,
    busy_pin=epd_busy,
    highlight_color=0xFF0000,
    rotation=90,
)

# Create a display group for our screen objects
g = displayio.Group()


# Display a ruler graphic from the root directory of the CIRCUITPY drive
pic = displayio.OnDiskBitmap("/display-ruler.bmp")
# Create a Tilegrid with the bitmap and put in the displayio group
t = displayio.TileGrid(pic, pixel_shader=pic.pixel_shader)
g.append(t)

# Place the display group on the screen (does not refresh)
display.root_group = g

# Show the image on the display
display.refresh()

print("refreshed")

# Do Not refresh the screen more often than every 180 seconds
#   for eInk displays! Rapid refreshes will damage the panel.
time.sleep(180)
