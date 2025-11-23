# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT

import time

import supervisor
import terminalio
from displayio import Group, Palette, TileGrid
from terminalio import Terminal

import adafruit_dang as curses


class Window:
    def __init__(self, n_rows, n_cols, row=0, col=0):
        self.n_rows = n_rows
        self.n_cols = n_cols
        self.row = row
        self.col = col

    @property
    def bottom(self):
        return self.row + self.n_rows - 1

    def up(self, cursor):  # pylint: disable=invalid-name
        if cursor.row == self.row - 1 and self.row > 0:
            self.row -= 1

    def down(self, buffer, cursor):
        if cursor.row == self.bottom + 1 and self.bottom < len(buffer) - 1:
            self.row += 1

    def horizontal_scroll(self, cursor, left_margin=5, right_margin=2):
        n_pages = cursor.col // (self.n_cols - right_margin)
        self.col = max(n_pages * self.n_cols - right_margin - left_margin, 0)

    def translate(self, cursor):
        return cursor.row - self.row, cursor.col - self.col


def helloworld_main(stdscr, terminal_tilegrid):
    window = Window(terminal_tilegrid.height, terminal_tilegrid.width)
    stdscr.erase()
    img = [None] * window.n_rows

    user_input = ""
    user_entered_message = ""
    last_key_press = ""

    def setline(row, line):
        if img[row] == line:
            return
        img[row] = line
        line += " " * (window.n_cols - len(line) - 1)
        stdscr.addstr(row, 0, line)

    while True:
        header = "Hello World Adafruit Dang"
        margin = (window.n_cols - 1 - len(header)) // 2
        setline(1, f"{' ' * margin}{header}")

        key_press_message = f"Last key pressed: {last_key_press}"
        margin = (window.n_cols - 1 - len(key_press_message)) // 2
        setline(4, f"{' ' * margin}{key_press_message}")

        last_entered = f"Entered Message: {user_entered_message}"
        margin = (window.n_cols - 1 - len(last_entered)) // 2
        setline(6, f"{' ' * margin}{last_entered}")

        user_input_row = window.n_rows - 2
        if user_input:
            setline(user_input_row, user_input)
        else:
            setline(user_input_row, " " * (window.n_cols - 1))

        status_message_row = terminal_tilegrid.height - 1
        status_message = f" Adafruit Dang | Demo | Fruit Jam | {int(time.monotonic())}"
        status_message += " " * (window.n_cols - len(status_message) - 1)
        line = f"{status_message}"
        setline(status_message_row, line)

        k = stdscr.getkey()
        if k is not None:
            if len(k) == 1 and " " <= k <= "~":
                user_input += k
                last_key_press = k
            elif k == "\n":
                user_entered_message = user_input
                user_input = ""
            elif k in {"KEY_BACKSPACE", "\x7f", "\x08"}:
                user_input = user_input[:-1]


def run_helloworld_main(terminal, terminal_tilegrid):
    return curses.custom_terminal_wrapper(terminal, helloworld_main, terminal_tilegrid)


main_group = Group()
display = supervisor.runtime.display
font = terminalio.FONT
char_size = font.get_bounding_box()
print(f"char_size: {char_size}")
screen_size = (display.width // char_size[0], display.height // char_size[1])

terminal_palette = Palette(2)
terminal_palette[0] = 0x000000
terminal_palette[1] = 0xFFFFFF

terminal_area = TileGrid(
    bitmap=font.bitmap,
    width=screen_size[0],
    height=screen_size[1],
    tile_width=char_size[0],
    tile_height=char_size[1],
    pixel_shader=terminal_palette,
)

main_group.append(terminal_area)
terminal = Terminal(terminal_area, font)

display.root_group = main_group

run_helloworld_main(terminal, terminal_area)
