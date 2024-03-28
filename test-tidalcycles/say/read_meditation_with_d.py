#!/usr/bin/env python3

import argparse
import time
import subprocess


def read_sentences(fn: str) -> list[str]:
    with open(fn) as f:
        return f.readlines()


def say_sentences(xs: list[str], voice: str) -> None:
    sentences_since_last_break = 0
    for x in xs:
        if x.strip():
            print("reading", x)
            subprocess.call(["say", "-r", "150", "-v", voice, x])
            sentences_since_last_break += 1
            # time.sleep(2)
        else:
            print("break", sentences_since_last_break)
            # time.sleep(4 * sentences_since_last_break)
            # time.sleep(1 * sentences_since_last_break)
            time.sleep(2)
            sentences_since_last_break = 0


def main() -> None:
    p = argparse.ArgumentParser()
    # Whisper, Zarvox, Trinoids
    p.add_argument("-v", "--voice", default="Samantha")
    p.add_argument("-f", "--file", default="meditation_with_d.txt")
    args = p.parse_args()
    say_sentences(read_sentences(args.file), args.voice)


if __name__ == "__main__":
    main()
