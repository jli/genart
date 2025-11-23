# SPDX-FileCopyrightText: Copyright (c) 2022 Alec Delaney for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense

import socket
import ssl
from os import getenv

import adafruit_requests as requests

from adafruit_pastebin.gist import Gist

# Get PasteBin keys, ensure these are setup in your environment
auth_key = getenv("auth_key")

session = requests.Session(socket, ssl_context=ssl.create_default_context())

pastebin = Gist(session, auth_key)
paste_url = pastebin.paste(
    "This is a test paste!",
    filename="test.txt",
)
print(paste_url)
