"""
Shared IR remote codes for all remotes.
Add new codes by running ir_receiver_decode.py and pressing buttons.
"""

TEALIGHTS_COMMAND_TO_CODE = {
    "on": (0, 255, 0, 255),
    "off": (0, 255, 64, 191),
    "2h": (0, 255, 32, 223),
    "4h": (0, 255, 96, 159),
    "6h": (0, 255, 16, 239),
    "8h": (0, 255, 80, 175),
    "candle_mode": (0, 255, 48, 207),
    "light_mode": (0, 255, 112, 143),
    "light_less": (0, 255, 8, 247),
    "light_more": (0, 255, 72, 183),
}

ROKU_COMMAND_TO_CODE = {
    "back": (87, 67, 102, 153),
    "home": (87, 67, 192, 63),
    "up": (87, 67, 152, 103),
    "down": (87, 67, 204, 51),
    "left": (87, 67, 120, 135),
    "right": (87, 67, 180, 75),
    "ok": (87, 67, 84, 171),
    "reset": (87, 67, 30, 225),
    "star": (87, 67, 134, 121),
    "rewind": (87, 67, 44, 211),
    "play_pause": (87, 67, 50, 205),
    "ffw": (87, 67, 170, 85),
    "netflix": (87, 67, 210, 45),
    "amazon": (87, 67, 8, 247),
    "rdio": (87, 67, 2, 253),
    "sling": (87, 67, 228, 27),
}

TV_COMMAND_TO_CODE = {
    "source": (32, 223, 244, 11),
    "power": (32, 223, 16, 239),
    "up": (32, 223, 162, 93),
    "down": (32, 223, 98, 157),
    "left": (32, 223, 226, 29),
    "right": (32, 223, 18, 237),
    "ok": (32, 223, 34, 221),
    "vol_up": (32, 223, 64, 191),
    "vol_down": (32, 223, 192, 63),
}

# Build reverse lookup dictionaries
TEALIGHTS_CODE_TO_COMMAND = {v: k for k, v in TEALIGHTS_COMMAND_TO_CODE.items()}
ROKU_CODE_TO_COMMAND = {v: k for k, v in ROKU_COMMAND_TO_CODE.items()}
TV_CODE_TO_COMMAND = {v: k for k, v in TV_COMMAND_TO_CODE.items()}

REMOTES_COMMAND_TO_CODE = {
    "tealight": TEALIGHTS_COMMAND_TO_CODE,
    "roku": ROKU_COMMAND_TO_CODE,
    "tv": TV_COMMAND_TO_CODE,
}

REMOTES_CODE_TO_COMMAND = {
    "tealight": TEALIGHTS_CODE_TO_COMMAND,
    "roku": ROKU_CODE_TO_COMMAND,
    "tv": TV_CODE_TO_COMMAND,
}
