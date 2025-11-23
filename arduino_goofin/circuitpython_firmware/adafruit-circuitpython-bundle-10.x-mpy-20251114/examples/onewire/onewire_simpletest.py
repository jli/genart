# SPDX-FileCopyrightText: 2021 ladyada for Adafruit Industries
# SPDX-License-Identifier: MIT

import board

from adafruit_onewire.bus import OneWireBus

# Create the 1-Wire Bus
# Use whatever pin you've connected to on your board
ow_bus = OneWireBus(board.D2)

# Reset and check for presence pulse.
# This is basically - "is there anything out there?"
print("Resetting bus...", end="")
if ow_bus.reset():
    print("OK.")
else:
    raise RuntimeError("Nothing found on bus.")

# Run a scan to get all of the device ROM values
print("Scanning for devices...", end="")
devices = ow_bus.scan()
print("OK.")
print(f"Found {len(devices)} device(s).")

# For each device found, print out some info
for i, d in enumerate(devices):
    print(f"Device {i:>3}")
    print("\tSerial Number = ", end="")
    for byte in d.serial_number:
        print(f"0x{byte:02x} ", end="")
    print(f"\n\tFamily = 0x{d.family_code:02x}")

# Usage beyond this is device specific. See a CircuitPython library for a 1-Wire
# device for examples and how OneWireDevice is used.
