#pragma once

// Pattern registry and renderer.
//
// Patterns are a flat table (see patterns.cpp). Indices 0-3 match the bootstrap
// spec so Milestone 1 motion work slots straight in:
//   0 Ambient Breathe   1 Stride Reactive*   2 Jump Reactive*   3 Solid Color
// Patterns marked * need motion and render a calm idle look until the MPU is
// present. Indices 4+ are extra non-motion eye-candy so the v0 demo looks alive
// without a sensor.

#include <FastLED.h>
#include "motion.h"

namespace patterns {
// Number of registered patterns.
uint8_t count();
// Display name for a pattern index (for serial logging).
const char* name(uint8_t idx);
// Whether a pattern needs motion data to be interesting.
bool needsMotion(uint8_t idx);

// Render pattern `idx` into `leds`. No heap allocation; safe to call every frame
// from the render task. `now` is millis(); `m` is the latest motion snapshot.
void render(uint8_t idx, CRGB* leds, uint16_t n, uint32_t now, const MotionState& m);

// Advance g_controls.patternIndex to the next pattern, skipping motion-only
// patterns while no sensor is present. Used by the no-button auto-cycle.
void advanceAuto();
}  // namespace patterns
