// skate_lights v0 - Seeed XIAO ESP32-S3 + FCOB addressable strip.
//
// main.cpp is deliberately thin: it owns the LED buffer and the shared control
// state, then splits work across the two cores per the bootstrap spec.
//   core 1 (renderTask):  pattern render + FastLED.show() only
//   core 0 (controlTask): serial input, motion (stub), battery, auto-cycle
// Tasks communicate only through g_controls (atomics in state.h). The render
// task is the sole owner of the leds[] buffer and the only caller of show(),
// which keeps the buffer race-free without a lock.
//
// See docs/STATUS.md for what is implemented vs. deferred to Milestone 1.

#include <Arduino.h>
#include <FastLED.h>
#include <esp_sleep.h>

#include "config.h"
#include "input.h"
#include "motion.h"
#include "patterns.h"
#include "power.h"
#include "state.h"

Controls g_controls;

namespace {

CRGB leds[NUM_LEDS];

uint8_t clampedBrightness() {
  uint8_t lvl = g_controls.brightnessLevel.load();
  if (lvl >= NUM_BRIGHTNESS_LEVELS) lvl = NUM_BRIGHTNESS_LEVELS - 1;
  uint8_t b = BRIGHTNESS_LEVELS[lvl];
  return b < BRIGHTNESS_CAP ? b : BRIGHTNESS_CAP;  // never exceed the firmware cap
}

void renderTask(void*) {
  const TickType_t frame = pdMS_TO_TICKS(1000 / TARGET_FPS);
  TickType_t last = xTaskGetTickCount();
  for (;;) {
    if (g_controls.sleeping.load()) {
      // Control task is about to deep-sleep; blank the strip first.
      fill_solid(leds, NUM_LEDS, CRGB::Black);
      FastLED.show();
    } else {
      uint32_t now = millis();
      MotionState m = motion::get();
      patterns::render(g_controls.patternIndex.load(), leds, NUM_LEDS, now, m);
      power::applyOverlay(leds, NUM_LEDS, now);
      FastLED.setBrightness(clampedBrightness());
      FastLED.show();
    }
    vTaskDelayUntil(&last, frame);
  }
}

void enterDeepSleep() {
  g_controls.sleeping.store(true);
  vTaskDelay(pdMS_TO_TICKS(80));  // let the render task draw a black frame
  Serial.println(
      F("[power] entering deep sleep (wake: reset or charge; button wake is Milestone 1)"));
  Serial.flush();
  // No wake source configured: with no button in v0 the safest behavior is to
  // stay asleep until the cell is charged / the board is reset. ext0 button
  // wake gets enabled here in Milestone 1.
  esp_deep_sleep_start();
}

void controlTask(void*) {
  power::init();
  motion::init();
  input::init();

  uint32_t lastBatt = 0;
  uint32_t lastCycle = millis();
  for (;;) {
    uint32_t now = millis();
    input::poll();
    motion::poll();

    if (now - lastBatt >= BATT_SAMPLE_MS) {
      power::poll();
      lastBatt = now;
    }

    if (g_controls.autoCycle.load() && (now - lastCycle >= AUTO_CYCLE_MS)) {
      patterns::advanceAuto();
      Serial.printf("[auto] -> %u: %s\n", g_controls.patternIndex.load(),
                    patterns::name(g_controls.patternIndex.load()));
      lastCycle = now;
    }

    if (g_controls.sleeping.load() || power::isCritical()) {
      enterDeepSleep();  // does not return
    }

    vTaskDelay(pdMS_TO_TICKS(CONTROL_TICK_MS));
  }
}

}  // namespace

void setup() {
  // Native USB-CDC has a 256B default TX FIFO; a burst larger than that (the
  // help dump is ~240B) silently drops the overflow, garbling output. Enlarge
  // it before begin(). Must be set before Serial.begin to take effect.
  Serial.setTxBufferSize(1024);
  Serial.begin(115200);
  delay(50);
  Serial.println(F("\n[skate_lights] v0 boot"));

  FastLED.addLeds<LED_TYPE, LED_DATA_PIN, COLOR_ORDER>(leds, NUM_LEDS);
  FastLED.setBrightness(clampedBrightness());
  FastLED.clear(true);

  xTaskCreatePinnedToCore(renderTask, "render", 4096, nullptr, 2, nullptr, 1);
  xTaskCreatePinnedToCore(controlTask, "control", 8192, nullptr, 1, nullptr, 0);
}

void loop() {
  // All work happens in the pinned tasks; keep the Arduino loop idle.
  vTaskDelay(pdMS_TO_TICKS(1000));
}
