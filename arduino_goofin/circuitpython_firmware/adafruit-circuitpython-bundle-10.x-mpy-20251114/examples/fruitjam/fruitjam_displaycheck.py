# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense

import supervisor

from adafruit_fruitjam.peripherals import request_display_config

print(f"Display is None ? {supervisor.runtime.display is None}")
print(f"size: {supervisor.runtime.display.width}, {supervisor.runtime.display.height}")
request_display_config(360, 200)
print(f"size: {supervisor.runtime.display.width}, {supervisor.runtime.display.height}")
