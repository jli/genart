# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT
"""
Simple demonstration of EmojiLabel class
"""

import board
import displayio

from adafruit_display_emoji_text import EmojiLabel

main_group = displayio.Group()
display = board.DISPLAY

emoji_lbl = EmojiLabel("Circuit😎Python\n🌈E🐍m💾o💻j💙i🎉", scale=2)

main_group.append(emoji_lbl)
display.root_group = main_group

while True:
    pass
