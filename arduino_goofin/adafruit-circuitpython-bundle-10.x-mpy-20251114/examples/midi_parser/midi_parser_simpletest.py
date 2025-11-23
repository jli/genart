# SPDX-FileCopyrightText: 2025 Liz Clark for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""
Simple example showing how to use the adafruit_midi_parser library
to open a MIDI file and display information about it.
"""

import os

import adafruit_midi_parser

midi_file = "/song.mid"  # Your MIDI file name

print("MIDI File Analyzer")
print("=================")
print(f"Looking for: {midi_file}")
file_list = os.listdir("/")

# Check if the file exists
if midi_file[1:] in file_list:
    print(f"\nFound MIDI file {midi_file}")
    parser = adafruit_midi_parser.MIDIParser()
    print("\nParsing MIDI file...")
    parser.parse(midi_file)
    print("\nMIDI File Information:")
    print("=====================")
    print(f"Format Type: {parser.format_type}")
    print(f"Number of Tracks: {parser.num_tracks}")
    print(f"Ticks per Beat: {parser.ticks_per_beat}")
    print(f"Tempo: {parser.tempo} microseconds per quarter note")
    print(f"BPM: {parser.bpm:.1f}")
    print(f"Total Events: {len(parser.events)}")
    print(f"Note Count: {parser.note_count}")
else:
    print(f"MIDI file {midi_file} not found!")
print("\nDone!")
