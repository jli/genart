# SPDX-FileCopyrightText: 2025 Tim Cocks for Adafruit Industries
# SPDX-License-Identifier: MIT
"""
This example is made for a basic boot mouse with
two buttons and a wheel that can be pressed.
"""

import supervisor
import terminalio
from adafruit_display_text.bitmap_label import Label
from displayio import Group

from adafruit_usb_host_mouse import find_and_init_boot_mouse

display = supervisor.runtime.display

# group to hold visual elements
main_group = Group()

# make the group visible on the display
display.root_group = main_group

mouse = find_and_init_boot_mouse()
if mouse is None:
    raise RuntimeError("No mouse found connected to USB Host")

# text label to show the x, y coordinates on the screen
output_lbl = Label(terminalio.FONT, text=f"{mouse.x},{mouse.y}", color=0xFFFFFF, scale=1)

# move it to the upper left corner
output_lbl.anchor_point = (0, 0)
output_lbl.anchored_position = (1, 1)

# add it to the main group
main_group.append(output_lbl)

# add the mouse tile grid to the main group
main_group.append(mouse.tilegrid)

# main loop
while True:
    # update mouse
    pressed_btns = mouse.update()

    # string with updated coordinates for the text label
    out_str = f"{mouse.x},{mouse.y}"

    # add pressed buttons to out str
    if pressed_btns is not None and len(pressed_btns) > 0:
        out_str += f" {" ".join(pressed_btns)}"

    # update the text label with the new coordinates
    # and buttons being pressed
    output_lbl.text = out_str
