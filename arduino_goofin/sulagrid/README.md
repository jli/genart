# sulagrid

8×8 WS2812 NeoPixel display with 13 animated patterns, driven by an Adafruit Trinket M0.
Rotary encoder selects pattern; potentiometer controls brightness; encoder button cycles color palette.

## Patterns

| # | Name | Description |
|---|------|-------------|
| 0 | checker | Fading checkerboard |
| 1 | breathe | Full-grid color pulse |
| 2 | sweep | Bouncing column sweep |
| 3 | rings | Expanding rings from center |
| 4 | sparkle | Slow random sparkles |
| 5 | face | Blinking pixel face |
| 6 | rainbow | Diagonal rainbow wipe |
| 7 | spiral | Spiral fill/unfill |
| 8 | snake | Autonomous greedy snake with death explosion |
| 9 | balls | Bouncing balls with trails |
| 10 | lissajous | Drifting Lissajous tracer |

Encoder button cycles 4 palettes: **warm** · **cool** · **red** · **rainbow**.
Onboard DotStar reflects current palette color.

## Wiring

```
      USB
  ┌───┴───┐
  │       │
  ├─VBAT  VBUS─┤  (5V from USB)
  ├─GND   3V3──┼──────────────────────────────┐
  ├─D4────┼────┼── pot wiper (A4)             │
  ├─D3────┼────┼── WS2812 DIN                 │
  │       D2───┼── encoder SW (btn) ── GND    │
  │       D1───┼── encoder DT  (B)            │
  │       D0───┼── encoder CLK (A)            │
  └───────┘                                   │
                                              │
  Rotary encoder (viewed from front, shaft pointing at you):

  ┌─────────────────────────────┐
  │  3-pin side   │  2-pin side │
  │  (rotation)   │  (button)   │
  │               │             │
  │  CLK ── D0    │  SW ── D2   │
  │  GND ── GND   │  GND ─ GND  │
  │  DT  ── D1    │             │
  └─────────────────────────────┘

  ┌── Potentiometer (10k) ──┐
  │ end 1 ──────────── 3V3  │
  │ wiper ──────────── D4   │
  │ end 2 ──────────── GND  │
  └─────────────────────────┘

  ┌── WS2812 8×8 Panel ──┐
  │ DIN ──────────── D3  │
  │ 5V  ──────────── 5V  │  (USB 5V or external supply)
  │ GND ──────────── GND │
  └──────────────────────┘
```

**Trinket M0 physical pinout** (USB at top, left/right as oriented face-up):

```
         [USB]
    VBAT      VBUS
     GND       3V3
      D4        D2
      D3        D1
                D0
        [RESET]
```

> **Power note:** Firmware caps brightness at 50/255 (~20%). At that level the panel draws
> ~750mA worst case, which USB 3.0 (900mA) handles fine. USB 2.0 (500mA) is marginal — an
> external 5V supply is safer if you push brightness higher.

## Libraries

Install via Arduino Library Manager:
- `Adafruit NeoPixel`
- `Adafruit DotStar`

## Build

```sh
# one-time setup
arduino-cli config add board_manager.additional_urls https://adafruit.github.io/arduino-board-index/package_adafruit_index.json
arduino-cli core update-index
arduino-cli core install adafruit:samd

# compile + upload (double-tap reset button on board first to enter bootloader)
make

# serial monitor for debug output
make monitor
```

See `Makefile` for targets: `compile`, `upload`, `monitor`, `all`.
