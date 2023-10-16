#!/usr/bin/env python3

import time
import subprocess

def read_sentences(fn: str="meditation_with_d.txt") -> list[str]:
    with open(fn) as f:
        return f.readlines()

def say_sentences(xs: list[str]) -> None:
    sentences_since_last_break = 0
    for x in xs:
        if x.strip():
            print("reading", x)
            subprocess.call(["say", "-r", "150", x])
            sentences_since_last_break += 1
            time.sleep(2)
        else:
            print("break", sentences_since_last_break)
            time.sleep(4 * sentences_since_last_break)
            sentences_since_last_break = 0


if __name__ == "__main__":
    say_sentences(read_sentences())
