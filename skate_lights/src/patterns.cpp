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
  uint8_t breath = scale8(sin8(now / 12), 150) + 20;  // ~20..170
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
    uint8_t v = scale8(sin8(phase + i * 12), amp);
    leds[i] = CHSV(hue, 200, v);
  }
}

// 2: Jump Reactive - bright white flash on a Z spike, fading out over a dim base
// glow. Without the MPU there are no jumps, so it holds a faint purple glow.
void pJumpReactive(CRGB* leds, uint16_t n, uint32_t now, const MotionState& m) {
  static uint8_t flash = 0;
  if (m.jumpEvent) flash = 255;
  flash = qsub8(flash, 12);  // ~1.5s fade at 60fps

  fill_solid(leds, n, CHSV(192, 200, 10));  // dim purple base
  if (flash) {
    CRGB white = CHSV(0, 0, flash);
    for (uint16_t i = 0; i < n; i++) leds[i] += white;
  }
}

// 3: Solid Color - fixed color sanity check.
void pSolidColor(CRGB* leds, uint16_t n, uint32_t, const MotionState&) {
  fill_solid(leds, n, CRGB(SOLID_R, SOLID_G, SOLID_B));
}

// 4: Rainbow Cycle - classic moving rainbow.
void pRainbowCycle(CRGB* leds, uint16_t n, uint32_t now, const MotionState&) {
  uint8_t hue = now / 20;
  uint8_t deltaHue = (uint8_t)(255 / n) + 1;
  fill_rainbow(leds, n, hue, deltaHue);
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
    {"Rainbow Cycle",   false, pRainbowCycle},
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
