# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense

from adafruit_argv_file import read_argv

args = read_argv(__file__)
print(args)
