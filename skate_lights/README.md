# skate_lights

Motion-reactive LED lighting for inline skates. ESP32-S3 driving an addressable
FCOB strip on the skate frame, powered from a single 18650 cell.

**Status: v0 / MVP.** The strip lights and animates, cycles patterns on a timer,
and monitors battery. The accelerometer (MPU6050) and the physical button are
**not** built yet — they are Milestone 1. See [`docs/STATUS.md`](docs/STATUS.md)
for exactly what is done, what is deferred, and where the seams are.

## What v0 does

- Drives 48 WS2812B-compatible LEDs via FastLED on a dedicated render core.
- 6 patterns; 4 are non-motion (Ambient Breathe, Solid Color, Rainbow, Comet)
  and 2 are motion-reactive stubs (Stride, Jump) that render a calm idle look
  until the MPU exists.
- Auto-cycles through the non-motion patterns every 20s (no button yet).
- Serial console (115200) for manual control and bench tuning.
- Battery monitoring on A2: low-battery red blink, critical -> forced deep sleep.
- Hard firmware brightness cap that patterns can never exceed.

## Serial commands (115200 baud)

| Key | Action |
|-----|--------|
| `n` | next pattern (includes motion-only patterns) |
| `0`-`9` | jump to pattern by index |
| `+` / `-` | brightness up / down (within the cap) |
| `l` | toggle auto-cycle |
| `s` | sleep (deep sleep) |
| `b` | print battery / status |
| `h` / `?` | help |

Selecting a pattern manually turns auto-cycle off; press `l` to resume.

## Build & flash

The toolchain (PlatformIO) is pinned in a uv-managed venv so it reproduces on a
fresh machine. You need [`uv`](https://docs.astral.sh/uv/) installed; everything
else is fetched on demand.

```sh
make setup     # create .venv with pinned PlatformIO (one time)
make build     # compile
make upload    # flash a connected XIAO ESP32-S3
make monitor   # serial monitor at 115200
make flash     # upload + monitor
```

`make help` lists all targets. Under the hood every target runs through
`uv run pio ...`, so no global PlatformIO install is required.

## Layout

```
skate_lights/
├── platformio.ini      board, framework, libs (MPU/OLED deps commented out)
├── pyproject.toml      pins PlatformIO for uv
├── Makefile            build/flash/monitor targets via `uv run`
├── src/
│   ├── main.cpp        thin: owns leds[], spawns the two pinned tasks
│   ├── config.h        pins + all tunables (one place to adjust)
│   ├── state.h         cross-core shared control state (atomics)
│   ├── patterns.*      pattern registry + renderers
│   ├── input.*         serial commands (button is Milestone 1)
│   ├── motion.*        motion interface; v0 stub (MPU is Milestone 1)
│   └── power.*         battery sense, SOC, low-battery overlay, sleep trigger
└── docs/
    ├── HARDWARE.md     BOM, wiring, power notes
    └── STATUS.md       milestone tracking + cross-session handoff notes
```

## Hardware

Summary: Seeed XIAO ESP32-S3, BTF FCOB 5V addressable strip (~48 LEDs), MT3608
boost to 5V for the strip, 18650 cell with 1S BMS + TP4056 USB-C charging. Full
bill of materials and wiring in [`docs/HARDWARE.md`](docs/HARDWARE.md).
