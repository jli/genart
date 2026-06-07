#include "input.h"

#include <Arduino.h>
#include "config.h"
#include "patterns.h"
#include "state.h"

// Serial command set (single-char, no newline needed):
//   n        next pattern (cycles through all, including motion-only)
//   0-9      jump directly to that pattern index
//   + / =    brighter (within the firmware cap)
//   - / _    dimmer
//   l        toggle auto-cycle lock
//   s        request sleep (deep sleep; wakes on reset/charge in v0)
//   b        print battery / status
//   h / ?    help
//
// Any manual pattern selection (n or a digit) disables auto-cycle so the chosen
// pattern stays put; press 'l' to re-enable cycling.

namespace {

void printHelp() {
  Serial.println(F("[input] commands:"));
  Serial.println(F("  n      next pattern"));
  Serial.println(F("  0-9    select pattern by index"));
  Serial.println(F("  + -    brightness up / down (capped)"));
  Serial.println(F("  l      toggle auto-cycle"));
  Serial.println(F("  s      sleep (disabled in v0)"));
  Serial.println(F("  b      battery status"));
  Serial.println(F("  h ?    this help"));
  Serial.flush();  // drain before returning so the dump cannot be truncated
}

void printPattern() {
  uint8_t idx = g_controls.patternIndex.load();
  Serial.printf("[input] pattern %u/%u: %s%s\n", idx, patterns::count() - 1, patterns::name(idx),
                patterns::needsMotion(idx) ? " (needs MPU)" : "");
}

void printBattery() {
  if (!g_controls.batteryPresent.load()) {
    Serial.println(F("[input] battery: not detected (bench/USB power)"));
    return;
  }
  const char* st = "normal";
  switch (g_controls.powerStatus.load()) {
    case PowerStatus::Low:
      st = "LOW";
      break;
    case PowerStatus::Critical:
      st = "CRITICAL";
      break;
    default:
      break;
  }
  Serial.printf("[input] battery: %.2fV  %.0f%%  (%s)\n", g_controls.batteryVolts.load(),
                g_controls.batteryPct.load(), st);
}

void selectPattern(uint8_t idx) {
  if (idx >= patterns::count()) return;
  g_controls.patternIndex.store(idx);
  g_controls.autoCycle.store(false);  // manual selection pins the pattern
  printPattern();
}

void nextPattern() {
  uint8_t idx = (g_controls.patternIndex.load() + 1) % patterns::count();
  selectPattern(idx);
}

void stepBrightness(int delta) {
  int lvl = (int)g_controls.brightnessLevel.load() + delta;
  if (lvl < 0) lvl = 0;
  if (lvl >= NUM_BRIGHTNESS_LEVELS) lvl = NUM_BRIGHTNESS_LEVELS - 1;
  g_controls.brightnessLevel.store((uint8_t)lvl);
  Serial.printf("[input] brightness level %d -> %u (cap %u)\n", lvl, BRIGHTNESS_LEVELS[lvl],
                BRIGHTNESS_CAP);
}

void toggleAutoCycle() {
  bool on = !g_controls.autoCycle.load();
  g_controls.autoCycle.store(on);
  Serial.printf("[input] auto-cycle %s\n", on ? "on" : "off");
}

void handle(char c) {
  if (c >= '0' && c <= '9') {
    selectPattern((uint8_t)(c - '0'));
    return;
  }
  switch (c) {
    case 'n':
      nextPattern();
      break;
    case '+':
    case '=':
      stepBrightness(+1);
      break;
    case '-':
    case '_':
      stepBrightness(-1);
      break;
    case 'l':
      toggleAutoCycle();
      break;
    case 's':
      // Disabled on the bench: no battery to protect, and v0 deep sleep has no
      // wake source, so an accidental press would brick the demo until reset.
      // Re-enable (with button ext0 wake) in Milestone 1.
      Serial.println(F("[input] sleep disabled in v0 (no battery / no wake source)"));
      break;
    case 'b':
      printBattery();
      break;
    case 'h':
    case '?':
      printHelp();
      break;
    case '\r':
    case '\n':
    case ' ':
      break;  // ignore whitespace
    default:
      Serial.printf("[input] unknown '%c' (h for help)\n", c);
      break;
  }
}

}  // namespace

namespace input {

void init() {
  printHelp();
}

void poll() {
  while (Serial.available() > 0) {
    handle((char)Serial.read());
  }
}

}  // namespace input
