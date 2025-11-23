# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT
from adafruit_pathlib import Path

p = Path("/lib")

for file in p.glob("adafruit_*"):
    print(file)
