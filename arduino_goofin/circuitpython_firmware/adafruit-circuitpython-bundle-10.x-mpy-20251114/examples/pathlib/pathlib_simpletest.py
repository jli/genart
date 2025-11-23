# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT
import adafruit_pathlib


def print_directory_tree(path: adafruit_pathlib.Path, prefix: str = ""):
    """Recursively prints an ASCII tree of the given directory."""
    if not path.is_dir():
        print(f"{path} is not a directory.")
        return

    entries = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
    for index, entry in enumerate(entries):
        connector = "|-- " if index < len(entries) - 1 else "'-- "
        print(f"{prefix}{connector}{entry.name}")
        if entry.is_dir():
            extension = "|   " if index < len(entries) - 1 else "    "
            print_directory_tree(entry, prefix + extension)


dir_path = adafruit_pathlib.Path("/lib")

print_directory_tree(dir_path)
