# Status & Roadmap

Cross-session source of truth for skate_lights. Update this when scope or state
changes. Last verified building: espressif32@7.0.1, FastLED 3.x, PlatformIO
6.1.x via uv.

## Where we are: v0 / MVP (DONE, compiles clean)

The MVP deliberately drops the two hardware inputs from the original bootstrap
(MPU6050 and the button) so the strip can be brought up with just the XIAO + LED
strip + battery. Everything else from Milestone 1 that does not depend on those
two parts is implemented.

Implemented:
- Dual-core FreeRTOS split (the bootstrap's non-negotiable):
  - core 1 `renderTask`: pattern render + `FastLED.show()` only.
  - core 0 `controlTask`: serial input, motion stub, battery, auto-cycle, sleep.
  - Tasks share only `g_controls` (atomics in `state.h`). The render task is the
    sole owner of `leds[]` and the only caller of `show()`, so no lock is needed.
- FastLED init: `NUM_LEDS=48`, `WS2812B`, `GRB`. Hard brightness cap enforced
  every frame in `clampedBrightness()`; patterns never call `setBrightness`.
- 6 patterns (`patterns.cpp`), table-driven:
  - 0 Ambient Breathe, 3 Solid Color, 4 Rainbow Cycle, 5 Comet (non-motion).
  - 1 Stride Reactive, 2 Jump Reactive (motion; render a calm idle look while
    no MPU is present, and are skipped by auto-cycle until one is).
- No-button control: auto-cycle every `AUTO_CYCLE_MS` (skips motion-only
  patterns while the MPU is absent) + a serial console for manual control and
  bench tuning (see README for the key map).
- Battery monitoring (`power.cpp`): A2 divider sampled every 5s, calibrated via
  `analogReadMilliVolts`, SOC from a li-ion voltage LUT. Low (<15%) -> slow red
  blink on LED 0; critical (<5%) -> forced deep sleep. A "battery present" floor
  (`BATT_PRESENT_MIN_V`) prevents false triggers when running from USB on the
  bench with no cell on the divider.
- Deep sleep on `s` command or critical battery (blanks strip, then
  `esp_deep_sleep_start`).
- Serial logging of pattern changes, battery voltage/SOC, events.
- No heap allocation in the render path; `leds[]` is a static global.
- Reproducible toolchain: uv venv pins PlatformIO; `platformio.ini` pins the
  espressif32 platform; `make` drives everything through `uv run`.

Not done / known caveats in v0:
- **Deep sleep cannot wake without the button.** With no wake source configured,
  the board sleeps until reset or USB/charge. This is intentional (protects the
  cell); `ext0` button wake comes with the button in Milestone 1.
- **Sleep does not fully power off the strip.** The MCU blanks it (black frame),
  but the MT3608 boost still idles. A hardware load switch on the strip 5V rail
  would be needed for true off; not in scope.
- Battery SOC LUT and the present/low/critical thresholds are first guesses and
  need empirical tuning once a real cell is attached.
- Runtime (≥4h target) is unmeasured.

## Milestone 1: add MPU6050 + button (NEXT)

These are the two pieces dropped from v0. The code already has the seams:

1. **Button** (D1, INPUT_PULLUP, other side to GND):
   - Implement debounced short/long/double-press in `input.cpp` alongside the
     existing serial handler. They should drive the same `g_controls` fields:
     - short press -> next pattern (mirror `nextPattern()`).
     - long press (>500ms) -> cycle brightness (mirror `stepBrightness`, wrap).
     - double press -> set `g_controls.sleeping` (sleep).
   - Enable `esp_sleep_enable_ext0_wakeup(BUTTON_PIN, 0)` in `enterDeepSleep()`
     (main.cpp) so a press wakes the board.
   - Pin macro placeholder already noted in `config.h`.

2. **MPU6050** (I2C 0x68 on D4/D5):
   - Uncomment the Adafruit MPU + Unified Sensor deps in `platformio.ini`.
   - Implement `motion.cpp`: I2C init in `init()`, periodic reads in `poll()`,
     fill `MotionState{present, strideLevel, jumpEvent}`. Add a small mutex or
     per-field atomics around the cached state since `poll()` (core 0) and
     `get()` (core 1) run on different cores — the v0 stub skips this only
     because it returns a constant.
   - Stride detection: band-pass / cadence estimate on X/Y oscillation (~1-2Hz)
     -> normalize to `strideLevel` 0..1. Jump: Z-axis spike over
     `JUMP_ACCEL_THRESHOLD` -> one-shot `jumpEvent`.
   - Thresholds are already stubbed as constants in `config.h`; uncomment and
     tune. The motion patterns (`pStrideReactive`, `pJumpReactive`) already
     consume `MotionState`, so they come alive with no further pattern changes.
   - Once `motion::present()` returns true, auto-cycle automatically includes the
     motion patterns (see `advanceAuto`).

## Later milestones (architected for, not built)

- OLED SSD1306 (0x3C) on the same I2C bus — bus left free; dep commented in ini.
- BLE control from a phone (phone does music FFT, sends color/effect; ESP32
  renders). External U.FL antenna. Keep BLE on core 0 with the other logic.
- More inputs (rotary encoder), second skate, BLE sync between skates.

## Conventions for future agents

- `config.h` is the one place for pins and tunables. Add new tunables there.
- Keep `main.cpp` thin: orchestration only. Logic lives in the module files.
- Patterns are pure functions of `(leds, n, now, motion)` writing the whole
  strip; persistent per-pattern state is a `static` local (single render task,
  so it is safe). No heap in the render path.
- Anything crossing cores goes through `g_controls` atomics (or add a mutex for
  multi-field state).
- Run `make fmt` before committing; `make build` must stay green.
