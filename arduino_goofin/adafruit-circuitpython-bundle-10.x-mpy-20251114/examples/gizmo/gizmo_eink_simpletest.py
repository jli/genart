# SPDX-FileCopyrightText: 2021 ladyada for Adafruit Industries
# SPDX-License-Identifier: MIT

import time

import displayio

from adafruit_gizmo import eink_gizmo

display = eink_gizmo.EInk_Gizmo()
# Use the below line instead for the 200x200 E-Ink Gizmo
# display = eink_gizmo.EInk_HD_Gizmo()

# Create a display group for our screen objects
display_group = displayio.Group()

# Display a ruler graphic from the root directory of the CIRCUITPY drive
picture = displayio.OnDiskBitmap("/display-ruler.bmp")
# Create a Tilegrid with the bitmap and put in the displayio group
sprite = displayio.TileGrid(picture, pixel_shader=picture.pixel_shader)
display_group.append(sprite)

# Place the display group on the screen
display.root_group = display_group

# Refresh the display to have it actually show the image
# NOTE: Do not refresh eInk displays sooner than 180 seconds
display.refresh()
print("refreshed")

time.sleep(180)
