# SPDX-FileCopyrightText: 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT
"""
Simple example showing how to use the adafruit_midi_parser library
to play a MIDI file with the built-in LED blinking on notes.
"""

import os
import time

import board
import digitalio

import adafruit_midi_parser

# Setup the built-in LED
led = digitalio.DigitalInOut(board.LED)
led.direction = digitalio.Direction.OUTPUT

# Path to your MIDI file
midi_file = "/song.mid"


# Create a custom player class
class Custom_Player(adafruit_midi_parser.MIDIPlayer):
    def on_note_on(self, note, velocity, channel):  # noqa: PLR6301
        print(f"Note On: {note}, velocity: {velocity}")
        led.value = True

    def on_note_off(self, note, velocity, channel):  # noqa: PLR6301
        print(f"Note Off: {note}")
        led.value = False

    def on_end_of_track(self, track):  # noqa: PLR6301
        print(f"End of track {track}")
        time.sleep(5)

    def on_playback_complete(self):  # noqa: PLR6301
        print("Playback complete, restarting...")
        # Flash LED to indicate end of sequence
        for _ in range(3):
            led.value = True
            time.sleep(0.05)
            led.value = False
            time.sleep(0.05)


print("MIDI File Player")
print("===============")

# Check if the file exists
if midi_file[1:] in os.listdir("/"):
    print(f"Found MIDI file {midi_file}")

    # Create a MIDIParser instance
    parser = adafruit_midi_parser.MIDIParser()

    # Parse the file
    parser.parse(midi_file)
    print(f"Successfully parsed! Found {len(parser.events)} events.")
    print(f"BPM: {parser.bpm:.1f}")
    print(f"Note Count: {parser.note_count}")

    # Create our player and enable looping
    player = Custom_Player(parser)

    # Start playback
    print("Starting playback...")

    # Main loop
    while True:
        # Update the player (process events)
        player.play(loop=True)
else:
    print(f"MIDI file {midi_file} not found")
