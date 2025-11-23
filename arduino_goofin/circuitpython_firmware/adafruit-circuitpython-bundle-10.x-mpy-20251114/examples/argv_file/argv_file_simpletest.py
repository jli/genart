# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense

import supervisor

from adafruit_argv_file import write_argv

write_argv("argv_file_otherfile.py", [42, "CircuitPython is Cool", None, [1, 2, 3]])

print("Launching: argv_file_otherfile.py")
supervisor.set_next_code_file("argv_file_otherfile.py")
supervisor.reload()
