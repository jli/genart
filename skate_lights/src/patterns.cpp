#include "patterns.h"

#include "config.h"
#include "state.h"

// Pattern functions fill the whole strip each frame at full color scale; the
// render task applies global brightness (clamped to the cap) before show(), so
// patterns never touch FastLED.setBrightness. A few patterns keep static state
// across frames (comet position, jump flash decay); that is safe because only
// the single render task ever calls render().

namespace {

using PatternFn = void (*)(CRGB*, uint16_t, uint32_t, const MotionState&);

// 0: Ambient Breathe - slow hue drift with a gentle low-intensity breath.
void pAmbientBreathe(CRGB* leds, uint16_t n, uint32_t now, const MotionState&) {
  uint8_t hue = (now / 60) & 0xFF;
  uint8_t breath = scale8(sin8(now / 12), 140) + 60;  // ~60..200, never fully off
  fill_solid(leds, n, CHSV(hue, 200, breath));
}

// 1: Stride Reactive - intensity and speed scale with stride cadence.
// Without the MPU, strideLevel is 0 and this settles into a calm teal scan so
// the pattern is still selectable/testable.
void pStrideReactive(CRGB* leds, uint16_t n, uint32_t now, const MotionState& m) {
  uint8_t level = (uint8_t)(m.strideLevel * 255.0f);
  uint8_t speed = 6 + scale8(level, 30);        // wave speed rises with cadence
  uint8_t amp = qadd8(40, scale8(level, 200));  // wave amplitude rises with cadence
  uint8_t hue = 120 + (now / 80);               // teal -> green drift
  uint16_t phase = now * speed / 8;
  for (uint16_t i = 0; i < n; i++) {
    uint8_t v = qadd8(30, scale8(sin8(phase + i * 12), amp));  // floor keeps it lit
    leds[i] = CHSV(hue, 200, v);
  }
}

// 2: Jump Reactive - a calm violet wave breathes along the strip, then bursts
// bright and shifts toward hot pink with a white flash on a Z-axis stomp before
// decaying back. Without the MPU there are no jumps, so the wave runs on its own
// as a standalone ambient pattern.
void pJumpReactive(CRGB* leds, uint16_t n, uint32_t now, const MotionState& m) {
  static uint8_t flash = 0;
  if (m.jumpEvent) flash = 255;
  flash = qsub8(flash, 10);  // ~1.7s decay at 60fps

  uint8_t hue = 192 + scale8(flash, 32);             // purple -> pink with energy
  uint8_t breath = scale8(sin8(now / 16), 80) + 30;  // ~30..110 idle brightness
  uint8_t boost = scale8(flash, 120);                // stomp lifts overall level
  for (uint16_t i = 0; i < n; i++) {
    uint8_t wave = sin8((now / 6) + i * 16);                    // traveling wave along the strip
    uint8_t v = qadd8(30, qadd8(scale8(wave, breath), boost));  // floor keeps it lit
    leds[i] = CHSV(hue, 220, v);
  }

  // Stomp: bright white flash layered on top, fading out.
  if (flash) {
    CRGB white = CHSV(0, 0, scale8(flash, 220));
    for (uint16_t i = 0; i < n; i++) leds[i] += white;
  }
}

// 3: Solid Color - fixed color sanity check.
void pSolidColor(CRGB* leds, uint16_t n, uint32_t, const MotionState&) {
  fill_solid(leds, n, CRGB(SOLID_R, SOLID_G, SOLID_B));
}

// 4: Smooth Cycle - a two-color gradient spans the whole strip (one full sine
// wave, scaled to however many LEDs are present) and scrolls slowly along it,
// so both colors are visible at once. The pair holds steady for ~12 s, then over
// ~6 s the hues migrate a golden angle around the wheel to a fresh, harmonious
// pair, and hold again. Hue is interpolated on the wheel (not mixed through
// gray), so every pixel stays vivid and it never goes black.
void pSmoothCycle(CRGB* leds, uint16_t n, uint32_t now, const MotionState&) {
  static const uint32_t kHoldMs = 24000;          // dwell on the current pair
  static const uint32_t kDriftMs = 12000;         // migrate to the next pair
  static const uint32_t kScrollPeriodMs = 6000;  // time for the wave to scroll once across
  static const uint8_t kBaseHue = 150;            // starting anchor hue
  static const uint8_t kDriftStep = 97;           // golden angle on the 0-255 wheel
  static const uint8_t kSpread = 64;              // wheel distance between the two hues
  static const uint8_t kSat = 235;

  // Hue A holds the current pair, then eases a golden step to the next pair.
  const uint32_t epochMs = kHoldMs + kDriftMs;
  uint32_t epoch = now / epochMs;
  uint32_t into = now % epochMs;
  uint8_t hueStart = (uint8_t)(kBaseHue + epoch * kDriftStep);
  uint8_t hueA = hueStart;
  if (into >= kHoldMs) {
    uint8_t t = (uint8_t)((into - kHoldMs) * 255u / kDriftMs);
    hueA = hueStart + scale8(ease8InOutCubic(t), kDriftStep);
  }

  // One full sine wave of the A<->B gradient across the strip, scrolling slowly.
  // scroll is a 0-255 phase mapped onto one scroll period (256 = one wave width).
  uint8_t scroll = (uint8_t)((now % kScrollPeriodMs) * 256u / kScrollPeriodMs);
  for (uint16_t i = 0; i < n; i++) {
    uint8_t pos = (uint8_t)((uint16_t)i * 256u / n);
    uint8_t f = sin8(pos + scroll);
    leds[i] = CHSV(hueA + scale8(f, kSpread), kSat, 255);
  }
}

// 5: Comet - a bright dot bouncing along the strip with a fading trail.
void pComet(CRGB* leds, uint16_t n, uint32_t now, const MotionState&) {
  static uint16_t pos = 0;
  static int8_t dir = 1;
  static uint32_t lastMove = 0;

  fadeToBlackBy(leds, n, 40);
  if (now - lastMove > 25) {
    if (pos == 0)
      dir = 1;
    else if (pos >= n - 1)
      dir = -1;
    pos += dir;
    lastMove = now;
  }
  leds[pos] = CHSV(now / 16, 255, 255);

  // Lift the whole strip off pure black with a faint base glow.
  for (uint16_t i = 0; i < n; i++) leds[i] += CHSV(160, 200, 22);
}

struct PatternDef {
  const char* name;
  bool needsMotion;
  PatternFn fn;
};

// Indices 0-3 are the spec patterns; 4+ are non-motion demo extras.
// clang-format off
const PatternDef kPatterns[] = {
    {"Ambient Breathe", false, pAmbientBreathe},
    {"Stride Reactive", true,  pStrideReactive},
    {"Jump Reactive",   true,  pJumpReactive},
    {"Solid Color",     false, pSolidColor},
    {"Smooth Cycle",    false, pSmoothCycle},
    {"Comet",           false, pComet},
};
// clang-format on
constexpr uint8_t kCount = sizeof(kPatterns) / sizeof(kPatterns[0]);

}  // namespace

namespace patterns {

uint8_t count() {
  return kCount;
}

const char* name(uint8_t idx) {
  return idx < kCount ? kPatterns[idx].name : "?";
}

bool needsMotion(uint8_t idx) {
  return idx < kCount && kPatterns[idx].needsMotion;
}

void render(uint8_t idx, CRGB* leds, uint16_t n, uint32_t now, const MotionState& m) {
  if (idx >= kCount) idx = 0;
  kPatterns[idx].fn(leds, n, now, m);
}

void advanceAuto() {
  uint8_t cur = g_controls.patternIndex.load();
  bool haveMotion = motion::present();
  for (uint8_t step = 1; step <= kCount; step++) {
    uint8_t cand = (cur + step) % kCount;
    if (haveMotion || !kPatterns[cand].needsMotion) {
      g_controls.patternIndex.store(cand);
      return;
    }
  }
}

}  // namespace patterns
