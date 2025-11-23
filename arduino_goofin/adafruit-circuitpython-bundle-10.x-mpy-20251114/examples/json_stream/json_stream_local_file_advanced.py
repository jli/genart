# SPDX-FileCopyrightText: Copyright (c) 2023 Scott Shawcroft for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense

import sys
import time

import adafruit_json_stream as json_stream

# import json_stream


class FakeResponse:
    def __init__(self, file):
        self.file = file

    def iter_content(self, chunk_size):
        while True:
            yield self.file.read(chunk_size)


f = open(sys.argv[1], "rb")
obj = json_stream.load(FakeResponse(f).iter_content(32))


def find_keys(haystack, keys):
    """If we don't know the order in which the keys are,
    go through all of them and pick the ones we want"""
    out = {}
    # iterate on the items of an object
    for key in haystack:
        if key in keys:
            # retrieve the value only if needed
            value = haystack[key]
            # if it's a sub object, get it all
            if hasattr(value, "as_object"):
                value = value.as_object()
            out[key] = value
    return out


months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]


def time_to_date(stamp):
    tt = time.localtime(stamp)
    month = months[tt.tm_mon]
    return f"{tt.tm_mday:2d}th of {month}"


def ftoc(temp):
    return (temp - 32) * 5 / 9


currently = obj["currently"]
print("Currently:")
print(" ", time_to_date(currently["time"]))
print(" ", currently["icon"])

# iterate on the content of a list
for i, day in enumerate(obj["daily"]["data"]):
    day_items = find_keys(day, ("time", "summary", "temperatureHigh"))
    date = time_to_date(day_items["time"])
    print(
        f'On {date}: {day_items["summary"]},',
        f'Max: {int(day_items["temperatureHigh"])}F',
        f'({int(ftoc(day_items["temperatureHigh"]))}C)',
    )

    if i > 4:
        break
