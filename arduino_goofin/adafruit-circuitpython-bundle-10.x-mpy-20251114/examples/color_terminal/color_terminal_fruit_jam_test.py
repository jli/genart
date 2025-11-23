# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT

import supervisor
from adafruit_fruitjam import peripherals
from displayio import Group
from terminalio import FONT

from adafruit_color_terminal import ColorTerminal

main_group = Group()

display = supervisor.runtime.display
if display is None or peripherals.get_display_config()[2] < 4:
    print(
        "To use ColorTerminal there must be an initialized display with a color depth at least 4."
    )
    print(
        "Initializing display to default size 640x480 with color depth 8, ",
        "if you do not want this configuration then initialize the display ",
        "before running this example.",
    )
    peripherals.request_display_config(640, 480, 8)

font_bb = FONT.get_bounding_box()
screen_size = (display.width // font_bb[0], display.height // font_bb[1])

terminal = ColorTerminal(FONT, screen_size[0], screen_size[1])
main_group.append(terminal.tilegrid)

black = chr(27) + "[30m"
red = chr(27) + "[31m"
green = chr(27) + "[32m"
yellow = chr(27) + "[33m"
blue = chr(27) + "[34m"
magenta = chr(27) + "[35m"
cyan = chr(27) + "[36m"
white = chr(27) + "[37m"
reset = chr(27) + "[0m"


message = f"Hello {green}World{reset} {yellow}ANSI\n"
terminal.write(message)
print(message, end="")

message = f"{magenta}Terminal {red}Colors{reset}"
terminal.write(message)
print(message)

display.root_group = main_group

print(terminal.cursor_x, terminal.cursor_y)

move_cursor = chr(27) + "[10;10H"
terminal.write(f" Something {move_cursor}{cyan} Else{reset}")

while True:
    pass
