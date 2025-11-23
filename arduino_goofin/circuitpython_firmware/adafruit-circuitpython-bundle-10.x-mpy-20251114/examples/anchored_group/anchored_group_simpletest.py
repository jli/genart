# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense

import supervisor
import terminalio
from adafruit_display_text.bitmap_label import Label
from displayio import Bitmap, Group, Palette, TileGrid

from adafruit_anchored_group import AnchoredGroup

display = supervisor.runtime.display

main_group = Group()

display.root_group = main_group

anchored_group = AnchoredGroup()

icon_bmp = Bitmap(30, 30, 1)
icon_palette = Palette(1)
icon_palette[0] = 0xFF00FF
icon_tg = TileGrid(bitmap=icon_bmp, pixel_shader=icon_palette)

lbl = Label(terminalio.FONT, text="Something")
lbl.anchor_point = (0, 0.5)
lbl.anchored_position = (
    icon_tg.x + (icon_tg.width * icon_tg.tile_width) + 6,
    (icon_tg.y + (icon_tg.height * icon_tg.tile_height)) // 2,
)


anchored_group.append(icon_tg)
anchored_group.append(lbl)
print(f"group size: {anchored_group.size}")

anchored_group.anchor_point = (1.0, 0)
anchored_group.anchored_position = (display.width - 4, 0)

main_group.append(anchored_group)

while True:
    pass
