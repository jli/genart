# SPDX-FileCopyrightText: Copyright (c) 2025 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: MIT
import array

import usb

import adafruit_usb_host_descriptors

keyboard_interface_index = None
keyboard_endpoint_address = None
keyboard = None

# scan for connected USB devices
for device in usb.core.find(find_all=True):
    # check for boot keyboard endpoints on this device
    keyboard_interface_index, keyboard_endpoint_address = (
        adafruit_usb_host_descriptors.find_boot_keyboard_endpoint(device)
    )
    # if a boot keyboard interface index and endpoint address were found
    if keyboard_interface_index is not None and keyboard_endpoint_address is not None:
        keyboard = device

        # detach device from kernel if needed
        if keyboard.is_kernel_driver_active(0):
            keyboard.detach_kernel_driver(0)

        # set the configuration so the keyboard can be used
        keyboard.set_configuration()

buf = array.array("b", [0] * 8)

while True:
    # try to read data from the keyboard
    try:
        count = keyboard.read(keyboard_endpoint_address, buf, timeout=10)

    # if there is no data it will raise USBTimeoutError
    except usb.core.USBTimeoutError:
        # Nothing to do if there is no data for this keyboard
        continue

    for b in buf:
        print(hex(b), end=" ")
    print()
