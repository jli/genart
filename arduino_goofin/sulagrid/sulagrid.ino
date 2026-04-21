// 8x8 WS2812 Baby Pattern Display — Trinket M0
//
// Wiring:
//   Pin 0 — Encoder A (CLK)
//   Pin 1 — Encoder B (DT)
//   Pin 2 — Encoder button (SW) — wire to GND
//   Pin 3 — WS2812 data in
//   Pin 4 — Potentiometer wiper (pot ends to 3.3V and GND)
//   Encoder common pins to GND
//   WS2812 power to external 5V (not USB)

#include <Adafruit_NeoPixel.h>
#include <Adafruit_DotStar.h>

// Wiring
#define ENC_A       0
#define ENC_B       1
#define ENC_BTN     2
#define LED_PIN     3
#define POT_PIN     A4  // board pin 4
// Built-in LEDs
#define DOTSTAR_DATA  INTERNAL_DS_DATA
#define DOTSTAR_CLK   INTERNAL_DS_CLK
#define RED_LED_PIN   13

// Grid
#define GRID_W      8
#define GRID_H      8
#define NUM_LEDS    GRID_W * GRID_H

// Config
#define NUM_PATTERNS 11
#define NUM_PALETTES 3
#define MAX_BRIGHT     50
#define DEFAULT_PATTERN 8  // 0=checker 1=breathe 2=sweep 3=rings 4=sparkle 5=face 6=rainbow 7=spiral 8=snake 9=balls 10=lissajous
#define DEFAULT_BRIGHT 10
#define TICK_MS        10
#define DEBUG_BAUD     115200
#define DEBUG_INTERVAL (10000 / TICK_MS)

// Convert a millisecond duration to a tick count
#define MS_TO_TICKS(ms)  ((ms) / TICK_MS)

// Pattern timing — all in ms; divide by TICK_MS at use site via MS_TO_TICKS()
#define CHECKER_FADE_MS         3200   // brightness oscillation period
#define CHECKER_HUE_STEP_MS      160   // ms per hue index step

#define BREATHE_PERIOD_MS       2400   // inhale/exhale period
#define BREATHE_HUE_STEP_MS      160

#define SWEEP_ROT_SPEED         2.0f   // rad/sec
#define SWEEP_HUE_STEP_MS        120

#define RINGS_STEP_MS            200   // ms per ring expansion step
#define RINGS_HUE_STEP_MS        400

#define SPARKLE_FADE_PER_SEC     100   // brightness units/sec
// Compile-time per-tick fade amount; minimum 1 so trails always clear
#define SPARKLE_FADE_AMT  (SPARKLE_FADE_PER_SEC * TICK_MS / 1000 + \
                           (SPARKLE_FADE_PER_SEC * TICK_MS / 1000 == 0))
#define SPARKLE_SPAWN_MS         320

#define FACE_BLINK_PERIOD_MS    2000
#define FACE_EYES_OPEN_MS       1880   // open portion of blink period
#define FACE_EXPR_MS            4000   // ms per expression

#define RAINBOW_HUE_RATE  (80 / TICK_MS)   // hue units/tick (2 at 40ms, 8 at 10ms)

#define SPIRAL_STEP_MS           120   // ms per spiral advance step
#define SPIRAL_HOLD_STEPS          8   // hold duration in spiral-steps (not ticks)
#define SPIRAL_CYCLE_LEN  (NUM_LEDS * 2 + SPIRAL_HOLD_STEPS * 2)

#define SNAKE_STEP_MS            120   // ms per snake move
#define EXPLOSION_EXPAND_MS       80   // ms per explosion radius step
#define APPLE_BLINK_MS            80   // ms per apple blink half-period
#define SNAKE_REVEAL_MS           80   // ms per pixel revealed in length display
#define SNAKE_HOLD_MS           3000   // ms to hold length display after fill
#define SNAKE_PULSE_MS           600   // ms per brightness pulse cycle during hold

#define BALL_TRAIL_FADE_PER_SEC  450
#define BALL_TRAIL_FADE  (BALL_TRAIL_FADE_PER_SEC * TICK_MS / 1000 + \
                          (BALL_TRAIL_FADE_PER_SEC * TICK_MS / 1000 == 0))
#define BALL_SPEED_SCALE  ((float)TICK_MS / 40.0f)

#define LISS_TRAIL_FADE_PER_SEC  250
#define LISS_TRAIL_FADE  (LISS_TRAIL_FADE_PER_SEC * TICK_MS / 1000 + \
                          (LISS_TRAIL_FADE_PER_SEC * TICK_MS / 1000 == 0))
#define LISS_DRIFT_SPEED        0.1f   // ratio drift, rad/sec
#define LISS_PHASE_SPEED        2.5f   // phase advance, rad/sec
#define LISS_HUE_STEP_MS          80

static const char *PATTERN_NAMES[NUM_PATTERNS] = {
  "checker", "breathe", "sweep", "rings", "sparkle", "face",
  "rainbow", "spiral", "snake", "balls", "lissajous"
};
static const char *PALETTE_NAMES[NUM_PALETTES] = {
  "warm", "cool", "rainbow"
};

#define ENC_COUNTS_PER_DETENT 4

Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_DotStar onboardDot(1, DOTSTAR_DATA, DOTSTAR_CLK, DOTSTAR_BGR);

volatile int      encPos     = DEFAULT_PATTERN * ENC_COUNTS_PER_DETENT;
// Debug counters incremented inside the ISR — can't Serial.print from there,
// so we read these in the main loop under noInterrupts().
volatile uint16_t encCW      = 0;  // valid CW transitions (table returned +1)
volatile uint16_t encCCW     = 0;  // valid CCW transitions (table returned -1)
volatile uint16_t encBounced = 0;  // rejected by debounce timer (too soon after last edge)
volatile uint16_t encNoise   = 0;  // passed timer but table returned 0 (impossible transition)

// Circular trace buffer: every ISR call is logged here — including bounced ones —
// so you can see the exact timing and state sequence around any turn.
// Read this from the main loop under noInterrupts() with memcpy.
#define ENC_TRACE_LEN 32  // must be power of 2
struct EncEvent {
  uint16_t dt;     // microseconds since previous ISR call, capped at 65535
  uint8_t  state;  // encState & 0x0F after update (prevBA in bits 3:2, currBA in 1:0)
                   // 0xFF for bounce-rejected entries (state machine not updated)
  int8_t   result; // +1 CW, -1 CCW, 0 noise, -128 bounce-rejected
};
EncEvent          encTrace[ENC_TRACE_LEN];  // read under noInterrupts()
volatile uint8_t  encTraceHead = 0;         // index of next write slot (wraps via & mask)
int currentPattern = DEFAULT_PATTERN;
int currentPalette = 0;
unsigned long lastBtnPress = 0;
unsigned long tick = 0;
unsigned long redLedOff = 0;

// --- Pixel index from (x, y) — straight wiring ---
uint8_t xy(uint8_t x, uint8_t y) {
  return (GRID_H - 1 - y) * GRID_W + (GRID_W - 1 - x);
}

// --- Encoder ISR (gray code / quadrature state machine) ---
//
// HOW QUADRATURE ENCODERS WORK
// ─────────────────────────────
// The encoder has two output pins (A and B). As the shaft turns, each
// pin produces a square wave. The two waves are 90° out of phase — hence
// "quadrature". With pull-up resistors, both pins idle HIGH between clicks.
//
// One full detent (click) produces exactly 4 signal edges:
//
//   CW  rotation:   A ‾|_|‾    B _|‾|_    (A leads B)
//   CCW rotation:   A _|‾|_    B ‾|_|‾    (B leads A)
//
// Each edge fires our ISR (CHANGE interrupts on both pins). We pack the
// previous and current states of both pins into a 4-bit index:
//
//   bits 3:2 = (prevB, prevA)  — the reading from last ISR call
//   bits 1:0 = (currB, currA)  — just read
//
// encTable[index] maps that 4-bit pattern to +1 (CW), -1 (CCW), or 0
// (invalid / noise). Over one full detent we accumulate ±4 counts; dividing
// by ENC_COUNTS_PER_DETENT converts that to ±1 pattern step.
//
// Table layout (rows = prevBA, cols = currBA):
//        curr 00  01  10  11
//   prev 00:   0  -1  +1   0
//   prev 01:  +1   0   0  -1
//   prev 10:  -1   0   0  +1
//   prev 11:   0  +1  -1   0
//
// The zeros on the diagonal (no change) and on the anti-diagonal (two bits
// changed simultaneously — physically impossible in one step) both map to 0.
//
// WHY IT GETS WONKY
// ─────────────────
// 1. Contact bounce: mechanical encoders don't make clean transitions.
//    A single detent can trigger 10–20 ISR calls. The state table discards
//    impossible transitions (the 0-entries), but if bounce creates an even
//    number of spurious valid-looking transitions they can cancel a real
//    step or inject a phantom one.
//
// 2. ISR latency: digitalRead() is relatively slow. If A and B change
//    within a few microseconds of each other (common at the start of a
//    detent), the second ISR call may see a state that has already moved
//    past the intermediate value — recording a jump of two bits, which
//    maps to 0 (discarded). That's a lost step.
//
// 3. ENC_COUNTS_PER_DETENT mismatch: some encoders produce only 2 edges
//    per detent, not 4. If every other click is silently ignored, try
//    changing ENC_COUNTS_PER_DETENT to 2.
//
// DEBUGGING STRATEGY
// ──────────────────
// encCW / encCCW count valid transitions. encBounced counts edges rejected
// by the debounce timer. encNoise counts edges that passed the timer but
// produced an impossible state-table entry (two bits changed at once —
// sign of ISR latency).
//
//   High encBounced → contact bounce. Fix: RC filter (100 Ω + 10 nF to
//   GND on each encoder pin). ENC_DEBOUNCE_US can reduce symptom in
//   software but risks eating real edges on fast turns.
//
//   High encNoise → ISR latency. A and B changed so close together that
//   the second ISR read an already-settled state, skipping the intermediate.
//   RC filter helps here too by slowing the edge transitions.
//
//   "[partial]" in the log → encPos landed between detents (lost edge).
//   Persistent partials after adding RC filter: try lowering ENC_DEBOUNCE_US.
//
//   Both counters are reported on every pattern change alongside the trace.

static const int8_t encTable[16] = {
   0, -1,  1,  0,
   1,  0,  0, -1,
  -1,  0,  0,  1,
   0,  1, -1,  0
};
volatile uint8_t encState = 0;
volatile uint32_t encLastUs = 0;  // timestamp of last accepted transition

// Minimum microseconds between accepted edges. Bounce typically settles
// in <1 ms; a fast human turn still produces edges >2 ms apart.
// If turns feel sluggish or miss at high speed, lower this value.
// If bounce persists, raise it.
#define ENC_DEBOUNCE_US 500

void encoderISR() {
  uint32_t now     = micros();
  uint32_t elapsed = now - encLastUs;
  uint16_t dt      = elapsed > 65535 ? 65535 : (uint16_t)elapsed;

  uint8_t slot = encTraceHead & (ENC_TRACE_LEN - 1);
  encTrace[slot].dt = dt;

  if (elapsed < ENC_DEBOUNCE_US) {
    // Compute what the state nibble would have been without rejection,
    // so the trace can show the would-be transition.
    uint8_t wouldBe = ((encState << 2) | (digitalRead(ENC_B) << 1) | digitalRead(ENC_A)) & 0x0F;
    encTrace[slot].state  = wouldBe;
    encTrace[slot].result = -128;   // sentinel: bounce-rejected
    encTraceHead++;
    encBounced++;
    return;
  }
  encLastUs = now;

  encState <<= 2;
  encState |= (digitalRead(ENC_B) << 1) | digitalRead(ENC_A);
  int8_t delta = encTable[encState & 0x0F];
  encPos += delta;

  encTrace[slot].state  = encState & 0x0F;
  encTrace[slot].result = delta;
  encTraceHead++;

  if      (delta > 0) encCW++;
  else if (delta < 0) encCCW++;
  else                encNoise++;   // passed timer but impossible state — ISR latency glitch
}

// --- Color palettes ---
struct Palette {
  uint8_t hueLo;
  uint8_t hueHi;
  bool fullRainbow;
  uint32_t indicatorColor;
};

Palette palettes[NUM_PALETTES] = {
  {  0,  40, false, 0xFF4400 },  // warm
  { 96, 160, false, 0x0044FF },  // cool
  {  0, 255, true,  0xFF00FF },  // full rainbow
};

uint16_t paletteHue(uint8_t val) {
  Palette &p = palettes[currentPalette];
  if (p.fullRainbow) return (uint16_t)val << 8;
  uint8_t hue = p.hueLo + ((uint16_t)(p.hueHi - p.hueLo) * val / 255);
  return (uint16_t)hue << 8;
}

uint32_t paletteColor(uint8_t val, uint8_t sat, uint8_t bright) {
  return strip.ColorHSV(paletteHue(val), sat, bright);
}

void clearGrid() {
  strip.clear();
}

// --- Status LED helpers ---
void updateOnboardDot() {
  uint32_t c = palettes[currentPalette].indicatorColor;
  uint8_t r = (c >> 16) & 0xFF;
  uint8_t g = (c >> 8) & 0xFF;
  uint8_t b = c & 0xFF;
  onboardDot.setPixelColor(0, r, g, b);
  onboardDot.show();
}

void blinkRedLed() {
  digitalWrite(RED_LED_PIN, HIGH);
  redLedOff = millis() + 150;
}

// =============================================================
// Pattern 0: Fading checkerboard
// =============================================================
void patternCheckerboard() {
  float phase = (float)(tick % MS_TO_TICKS(CHECKER_FADE_MS)) / MS_TO_TICKS(CHECKER_FADE_MS) * 2.0 * PI;
  float blend = (sin(phase) + 1.0) / 2.0;
  uint8_t hueVal = (tick / MS_TO_TICKS(CHECKER_HUE_STEP_MS)) % 256;

  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      if ((x + y) & 1) {
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, (uint8_t)(blend * 255)));
      } else {
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, (uint8_t)((1.0 - blend) * 255)));
      }
    }
  }
}

// =============================================================
// Pattern 1: Color breathing pulse
// =============================================================
void patternBreathe() {
  float phase = (float)(tick % MS_TO_TICKS(BREATHE_PERIOD_MS)) / MS_TO_TICKS(BREATHE_PERIOD_MS) * 2.0 * PI;
  uint8_t brightness = (uint8_t)(127.5 + 127.5 * sin(phase));
  uint8_t hueVal = (tick / MS_TO_TICKS(BREATHE_HUE_STEP_MS)) % 256;
  strip.fill(paletteColor(hueVal, 255, brightness));
}

// =============================================================
// Pattern 2: Rotating radar sweep
// =============================================================
void patternSweep() {
  clearGrid();
  float cx = 3.5f, cy = 3.5f;
  float sweepAngle = fmodf(tick * (SWEEP_ROT_SPEED * TICK_MS / 1000.0f), 2.0f * PI);
  uint8_t hueVal = (tick / MS_TO_TICKS(SWEEP_HUE_STEP_MS)) % 256;

  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      float dx = x - cx;
      float dy = y - cy;
      float angle = atan2f(dy, dx);
      float diff = angle - sweepAngle;
      if (diff >  PI) diff -= 2.0f * PI;
      if (diff < -PI) diff += 2.0f * PI;

      uint8_t bright = 0;
      if (diff >= -0.2f && diff <= 0.2f) {
        bright = 255;
      } else if (diff < -0.2f && diff > -1.8f) {
        bright = (uint8_t)(255.0f * (1.8f + diff) / 1.6f);
      }

      if (bright > 0)
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, bright));
    }
  }
}

// =============================================================
// Pattern 3: Expanding rings from center
// =============================================================
void patternRings() {
  clearGrid();
  float cx = 3.5, cy = 3.5;
  uint8_t maxDist = 5;
  uint8_t ring = (tick / MS_TO_TICKS(RINGS_STEP_MS)) % (maxDist + 2);
  uint8_t hueVal = (tick / MS_TO_TICKS(RINGS_HUE_STEP_MS)) % 256;

  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      float dx = abs((float)x - cx);
      float dy = abs((float)y - cy);
      uint8_t dist = (uint8_t)(max(dx, dy) + 0.5);
      if (dist == ring) {
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, 255));
      } else if (ring > 0 && dist == ring - 1) {
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, 60));
      }
    }
  }
}

// =============================================================
// Pattern 4: Slow sparkle
// =============================================================
uint8_t sparklePixels[8];
uint8_t sparkleHues[8];
uint8_t sparkleBright[8];

void patternSparkle() {
  for (uint8_t i = 0; i < 8; i++) {
    if (sparkleBright[i] > SPARKLE_FADE_AMT) sparkleBright[i] -= SPARKLE_FADE_AMT;
    else sparkleBright[i] = 0;
  }

  if ((tick % MS_TO_TICKS(SPARKLE_SPAWN_MS)) == 0) {
    uint8_t slot = random(8);
    sparklePixels[slot] = random(NUM_LEDS);
    sparkleHues[slot] = random(256);
    sparkleBright[slot] = 255;
  }

  clearGrid();
  for (uint8_t i = 0; i < 8; i++) {
    if (sparkleBright[i] > 0) {
      strip.setPixelColor(sparklePixels[i],
        paletteColor(sparkleHues[i], 255, sparkleBright[i]));
    }
  }
}

// =============================================================
// Pattern 5: Simple face with blinking eyes
// =============================================================
// :)  ;)  :D  :P  :O
static const char *EXPR_NAMES[] = { ":)", ";)", ":D", ":P", ":O" };
#define NUM_EXPRS 5

void patternFace() {
  clearGrid();

  static uint8_t lastExpr = 255;
  static bool lastBlink = false;

  uint32_t eyeC   = strip.Color(255, 255, 255);
  uint32_t mouthC = paletteColor(0, 255, 220);

  uint8_t blinkPhase = tick % MS_TO_TICKS(FACE_BLINK_PERIOD_MS);
  bool eyesFull = blinkPhase < MS_TO_TICKS(FACE_EYES_OPEN_MS);
  bool eyesHalf = blinkPhase == MS_TO_TICKS(FACE_EYES_OPEN_MS);

  uint8_t expr = (tick / MS_TO_TICKS(FACE_EXPR_MS)) % NUM_EXPRS;

  if (expr != lastExpr) {
    Serial.print("face -> "); Serial.println(EXPR_NAMES[expr]);
    lastExpr = expr;
  }
  bool blinking = !eyesFull && !eyesHalf;
  if (blinking && !lastBlink) Serial.println("face blink");
  lastBlink = blinking;

  // --- Eyes ---
  switch (expr) {
    case 1: // ;) wink — left closed dash, right open 2×2
      strip.setPixelColor(xy(1, 2), eyeC); strip.setPixelColor(xy(2, 2), eyeC);
      strip.setPixelColor(xy(5, 1), eyeC); strip.setPixelColor(xy(6, 1), eyeC);
      strip.setPixelColor(xy(5, 2), eyeC); strip.setPixelColor(xy(6, 2), eyeC);
      break;

    case 4: // :O surprised — wide open, no blink
      strip.setPixelColor(xy(1, 1), eyeC); strip.setPixelColor(xy(2, 1), eyeC);
      strip.setPixelColor(xy(5, 1), eyeC); strip.setPixelColor(xy(6, 1), eyeC);
      strip.setPixelColor(xy(1, 2), eyeC); strip.setPixelColor(xy(2, 2), eyeC);
      strip.setPixelColor(xy(5, 2), eyeC); strip.setPixelColor(xy(6, 2), eyeC);
      break;

    default: // :) :D :P — normal 2×2 with blink
      if (eyesFull) {
        strip.setPixelColor(xy(1, 1), eyeC); strip.setPixelColor(xy(2, 1), eyeC);
        strip.setPixelColor(xy(5, 1), eyeC); strip.setPixelColor(xy(6, 1), eyeC);
        strip.setPixelColor(xy(1, 2), eyeC); strip.setPixelColor(xy(2, 2), eyeC);
        strip.setPixelColor(xy(5, 2), eyeC); strip.setPixelColor(xy(6, 2), eyeC);
      } else if (eyesHalf) {
        strip.setPixelColor(xy(1, 2), eyeC); strip.setPixelColor(xy(2, 2), eyeC);
        strip.setPixelColor(xy(5, 2), eyeC); strip.setPixelColor(xy(6, 2), eyeC);
      }
      break;
  }

  // --- Mouth ---
  switch (expr) {
    case 0: // :) smile
    case 1: // ;) wink
      // . M . . . . M .
      strip.setPixelColor(xy(1, 5), mouthC); strip.setPixelColor(xy(6, 5), mouthC);
      // . . M M M M . .
      strip.setPixelColor(xy(2, 6), mouthC); strip.setPixelColor(xy(3, 6), mouthC);
      strip.setPixelColor(xy(4, 6), mouthC); strip.setPixelColor(xy(5, 6), mouthC);
      break;

    case 2: // :D open grin — D shape
      // . M M M M M M .
      strip.setPixelColor(xy(1, 5), mouthC); strip.setPixelColor(xy(2, 5), mouthC);
      strip.setPixelColor(xy(3, 5), mouthC); strip.setPixelColor(xy(4, 5), mouthC);
      strip.setPixelColor(xy(5, 5), mouthC); strip.setPixelColor(xy(6, 5), mouthC);
      // . M . . . . M .
      strip.setPixelColor(xy(1, 6), mouthC); strip.setPixelColor(xy(6, 6), mouthC);
      // . . M M M M . .
      strip.setPixelColor(xy(2, 7), mouthC); strip.setPixelColor(xy(3, 7), mouthC);
      strip.setPixelColor(xy(4, 7), mouthC); strip.setPixelColor(xy(5, 7), mouthC);
      break;

    case 3: // :P flat mouth + tongue hanging from right side
      // . M M M M M M .
      strip.setPixelColor(xy(1, 5), mouthC); strip.setPixelColor(xy(2, 5), mouthC);
      strip.setPixelColor(xy(3, 5), mouthC); strip.setPixelColor(xy(4, 5), mouthC);
      strip.setPixelColor(xy(5, 5), mouthC); strip.setPixelColor(xy(6, 5), mouthC);
      // . . . . M   M .
      strip.setPixelColor(xy(4, 6), mouthC);
      strip.setPixelColor(xy(6, 6), mouthC);
      // . . . . M M M .
      strip.setPixelColor(xy(4, 7), mouthC);
      strip.setPixelColor(xy(5, 7), mouthC);
      strip.setPixelColor(xy(6, 7), mouthC);
      break;

    case 4: // :O rounded O
      // . . . M M . . .
      strip.setPixelColor(xy(3, 4), mouthC); strip.setPixelColor(xy(4, 4), mouthC);
      // . . M . . M . .
      strip.setPixelColor(xy(2, 5), mouthC); strip.setPixelColor(xy(5, 5), mouthC);
      // . . M . . M . .
      strip.setPixelColor(xy(2, 6), mouthC); strip.setPixelColor(xy(5, 6), mouthC);
      // . . . M M . . .
      strip.setPixelColor(xy(3, 7), mouthC); strip.setPixelColor(xy(4, 7), mouthC);
      break;
  }
}

// =============================================================
// Pattern 6: Slow diagonal rainbow wipe
// =============================================================
void patternRainbow() {
  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      uint8_t val = (x + y) * 16 + tick * RAINBOW_HUE_RATE;
      strip.setPixelColor(xy(x, y), paletteColor(val, 255, 200));
    }
  }
}

// =============================================================
// Pattern 7: Spiral fill from center, then unwind
// =============================================================
uint8_t spiralOrder[NUM_LEDS];
bool spiralBuilt = false;

void buildSpiral() {
  if (spiralBuilt) return;
  int top = 0, bottom = GRID_H - 1, left = 0, right = GRID_W - 1;
  uint8_t idx = 0;

  while (top <= bottom && left <= right) {
    for (int x = left;  x <= right;  x++) spiralOrder[idx++] = xy(x, top);
    top++;
    for (int y = top;   y <= bottom; y++) spiralOrder[idx++] = xy(right, y);
    right--;
    if (top <= bottom) {
      for (int x = right; x >= left; x--) spiralOrder[idx++] = xy(x, bottom);
      bottom--;
    }
    if (left <= right) {
      for (int y = bottom; y >= top; y--) spiralOrder[idx++] = xy(left, y);
      left++;
    }
  }
  spiralBuilt = true;
}

// Returns the i-th pixel in fill order: inward = outside→center, outward = center→outside
uint8_t spiralAt(uint8_t i, bool inward) {
  return inward ? spiralOrder[i] : spiralOrder[NUM_LEDS - 1 - i];
}

void patternSpiral() {
  clearGrid();
  unsigned long ts = tick / MS_TO_TICKS(SPIRAL_STEP_MS);
  uint8_t cycle = ts % SPIRAL_CYCLE_LEN;
  bool inward = (ts / SPIRAL_CYCLE_LEN) % 2 == 0;

  if (cycle < NUM_LEDS) {
    // Phase 1: fill — pixels 0..cycle-1 lit, cycle is white tracer
    for (uint8_t i = 0; i < cycle; i++)
      strip.setPixelColor(spiralAt(i, inward), paletteColor(i * 4, 255, 255));
    strip.setPixelColor(spiralAt(cycle, inward), strip.Color(255, 255, 255));

  } else if (cycle < NUM_LEDS + SPIRAL_HOLD_STEPS) {
    // Phase 2: hold full
    for (uint8_t i = 0; i < NUM_LEDS; i++)
      strip.setPixelColor(spiralAt(i, inward), paletteColor(i * 4, 255, 255));

  } else if (cycle < NUM_LEDS * 2 + SPIRAL_HOLD_STEPS) {
    // Phase 3: erase in same order — eraseIdx is white tracer, pixels after remain lit
    uint8_t eraseIdx = cycle - (NUM_LEDS + SPIRAL_HOLD_STEPS);
    for (uint8_t i = eraseIdx + 1; i < NUM_LEDS; i++)
      strip.setPixelColor(spiralAt(i, inward), paletteColor(i * 4, 255, 255));
    strip.setPixelColor(spiralAt(eraseIdx, inward), strip.Color(255, 255, 255));
  }
  // Phase 4: hold empty — clearGrid() already handled it
}

// =============================================================
// Pattern 8: Autonomous snake (no wrapping, death explosion)
// =============================================================
#define SNAKE_INIT_LEN 2

int8_t snakeX[NUM_LEDS];
int8_t snakeY[NUM_LEDS];
uint8_t snakeLen;
int8_t snakeDirX, snakeDirY;
int8_t appleX, appleY;
bool snakeInited = false;

bool exploding = false;
uint8_t explosionTick = 0;
int8_t explosionX, explosionY;
uint32_t deathFrame[NUM_LEDS];

bool showingLength = false;
uint16_t showLengthTick = 0;
uint8_t finalSnakeLen = 0;

void placeApple() {
  for (uint8_t attempts = 0; attempts < 100; attempts++) {
    appleX = random(GRID_W);
    appleY = random(GRID_H);
    bool onSnake = false;
    for (uint8_t i = 0; i < snakeLen; i++) {
      if (snakeX[i] == appleX && snakeY[i] == appleY) {
        onSnake = true;
        break;
      }
    }
    if (!onSnake) return;
  }
}

void snakeInit() {
  snakeLen = SNAKE_INIT_LEN;
  for (uint8_t i = 0; i < snakeLen; i++) {
    snakeX[i] = 3 - i;
    snakeY[i] = 3;
  }
  snakeDirX = 1;
  snakeDirY = 0;
  placeApple();
  snakeInited = true;
}

bool snakeInBounds(int8_t x, int8_t y) {
  return x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;
}

bool snakeHitsSelf(int8_t x, int8_t y) {
  for (uint8_t i = 0; i < snakeLen - 1; i++) {
    if (snakeX[i] == x && snakeY[i] == y) return true;
  }
  return false;
}

void snakeDie() {
  Serial.print("snake died len="); Serial.print(snakeLen);
  Serial.print(" at ("); Serial.print(snakeX[0]); Serial.print(","); Serial.print(snakeY[0]); Serial.println(")");
  for (uint8_t i = 0; i < NUM_LEDS; i++) {
    deathFrame[i] = strip.getPixelColor(i);
  }
  explosionX = snakeX[0];
  explosionY = snakeY[0];
  if (explosionX < 0) explosionX = 0;
  if (explosionX >= GRID_W) explosionX = GRID_W - 1;
  if (explosionY < 0) explosionY = 0;
  if (explosionY >= GRID_H) explosionY = GRID_H - 1;
  finalSnakeLen = snakeLen;
  exploding = true;
  explosionTick = 0;
}

// BFS flood-fill from (startX, startY). Returns number of reachable cells.
// Treats the snake body as walls, except the tail (which vacates next tick).
// Queue and visited fit on the stack: 64 + 8 bytes, well within SAMD21 limits.
uint8_t snakeFloodFill(int8_t startX, int8_t startY) {
  uint8_t visited[8] = {};  // 64-bit bitfield, one bit per cell
  uint8_t queue[NUM_LEDS];
  uint8_t head = 0, tail = 0;

  // Block all body segments except the tail (tail vacates on next move)
  for (uint8_t i = 0; i < snakeLen - 1; i++) {
    uint8_t idx = snakeY[i] * GRID_W + snakeX[i];
    visited[idx >> 3] |= (1 << (idx & 7));
  }

  uint8_t startIdx = startY * GRID_W + startX;
  visited[startIdx >> 3] |= (1 << (startIdx & 7));
  queue[tail++] = startIdx;

  static const int8_t dx[] = { 1, -1, 0,  0 };
  static const int8_t dy[] = { 0,  0, 1, -1 };
  uint8_t count = 0;

  while (head != tail) {
    uint8_t cur = queue[head++];
    int8_t  cx  = cur % GRID_W;
    int8_t  cy  = cur / GRID_W;
    count++;
    for (uint8_t d = 0; d < 4; d++) {
      int8_t nx = cx + dx[d];
      int8_t ny = cy + dy[d];
      if (!snakeInBounds(nx, ny)) continue;
      uint8_t nidx = ny * GRID_W + nx;
      if (visited[nidx >> 3] & (1 << (nidx & 7))) continue;
      visited[nidx >> 3] |= (1 << (nidx & 7));
      queue[tail++] = nidx;
    }
  }
  return count;
}

void snakeChooseDir() {
  int8_t dirs[][2] = {
    { snakeDirX, snakeDirY },
    { (int8_t)-snakeDirY, snakeDirX },
    { snakeDirY, (int8_t)-snakeDirX },
  };

  // Safe: flood-fill >= snakeLen. Among safe dirs pick closest to apple.
  // Fallback (all unsafe): pick most open direction.
  int8_t safeDX = 0, safeDY = 0, fallDX = 0, fallDY = 0;
  int    safeDist = 999;
  uint8_t fallSpace = 0;
  bool   anySafe = false, anyValid = false;

  for (uint8_t d = 0; d < 3; d++) {
    int8_t nx = snakeX[0] + dirs[d][0];
    int8_t ny = snakeY[0] + dirs[d][1];

    if (!snakeInBounds(nx, ny)) continue;
    if (snakeHitsSelf(nx, ny))  continue;
    anyValid = true;

    uint8_t space = snakeFloodFill(nx, ny);
    int     dist  = abs(nx - appleX) + abs(ny - appleY);

    if (space > fallSpace) {
      fallSpace = space;
      fallDX = dirs[d][0]; fallDY = dirs[d][1];
    }
    if (space >= snakeLen && (!anySafe || dist < safeDist)) {
      anySafe  = true;
      safeDist = dist;
      safeDX   = dirs[d][0]; safeDY = dirs[d][1];
    }
  }

  if (!anyValid) { snakeDie(); return; }

  if (anySafe) {
    snakeDirX = safeDX; snakeDirY = safeDY;
  } else {
    snakeDirX = fallDX; snakeDirY = fallDY;
  }
}

void patternSnake() {
  if (exploding) {
    clearGrid();
    uint8_t radius = explosionTick / MS_TO_TICKS(EXPLOSION_EXPAND_MS);
    uint8_t maxRadius = GRID_W + GRID_H;

    for (uint8_t y = 0; y < GRID_H; y++) {
      for (uint8_t x = 0; x < GRID_W; x++) {
        uint8_t dist = abs(x - explosionX) + abs(y - explosionY);
        if (dist > radius) {
          strip.setPixelColor(xy(x, y), deathFrame[xy(x, y)]);
        } else if (dist == radius) {
          strip.setPixelColor(xy(x, y), strip.Color(255, 255, 255));
        }
      }
    }

    explosionTick++;
    if (radius > maxRadius) {
      exploding = false;
      showingLength = true;
      showLengthTick = 0;
    }
    return;
  }

  if (showingLength) {
    clearGrid();
    uint16_t fillEnd  = (uint16_t)finalSnakeLen * MS_TO_TICKS(SNAKE_REVEAL_MS);
    uint8_t  litCount = (showLengthTick / MS_TO_TICKS(SNAKE_REVEAL_MS) < finalSnakeLen)
                        ? showLengthTick / MS_TO_TICKS(SNAKE_REVEAL_MS) : finalSnakeLen;

    uint8_t bright  = 200;
    uint8_t hueOff  = 0;
    if (showLengthTick >= fillEnd) {
      uint16_t holdTick    = showLengthTick - fillEnd;
      uint16_t pulsePeriod = MS_TO_TICKS(SNAKE_PULSE_MS);
      uint16_t phase       = holdTick % pulsePeriod;
      // Triangle wave 60..255
      bright = (phase < pulsePeriod / 2)
               ? 60  + (uint8_t)(195UL * phase / (pulsePeriod / 2))
               : 255 - (uint8_t)(195UL * (phase - pulsePeriod / 2) / (pulsePeriod / 2));
      hueOff = (uint8_t)holdTick;  // slow hue drift ~1 unit/tick
    }

    for (uint8_t i = 0; i < litCount; i++) {
      uint8_t row = i / GRID_W;
      uint8_t col = i % GRID_W;
      uint8_t x   = (row % 2 == 0) ? col : (GRID_W - 1 - col);
      strip.setPixelColor(xy(x, row), paletteColor((uint8_t)(i * 4 + hueOff), 255, bright));
    }
    showLengthTick++;
    if (showLengthTick > fillEnd + MS_TO_TICKS(SNAKE_HOLD_MS)) {
      showingLength = false;
      snakeInited   = false;
    }
    return;
  }

  if (!snakeInited) snakeInit();

  if ((tick % MS_TO_TICKS(SNAKE_STEP_MS)) == 0) {
    snakeChooseDir();
    if (exploding) return;

    for (int i = snakeLen - 1; i > 0; i--) {
      snakeX[i] = snakeX[i - 1];
      snakeY[i] = snakeY[i - 1];
    }
    snakeX[0] += snakeDirX;
    snakeY[0] += snakeDirY;

    if (!snakeInBounds(snakeX[0], snakeY[0])) {
      snakeDie();
      return;
    }

    if (snakeX[0] == appleX && snakeY[0] == appleY) {
      snakeLen++;
      snakeX[snakeLen - 1] = snakeX[snakeLen - 2];
      snakeY[snakeLen - 1] = snakeY[snakeLen - 2];
      Serial.print("snake apple len="); Serial.println(snakeLen);
      placeApple();
    }
  }

  clearGrid();
  uint8_t appleBright = 150 + 105 * ((tick / MS_TO_TICKS(APPLE_BLINK_MS)) % 2);
  strip.setPixelColor(xy(appleX, appleY), strip.Color(appleBright, appleBright, appleBright));

  for (uint8_t i = 0; i < snakeLen; i++) {
    uint8_t hueVal = i * (256 / snakeLen);
    uint8_t bright = (i == 0) ? 255 : 180;
    strip.setPixelColor(xy(snakeX[i], snakeY[i]), paletteColor(hueVal, 255, bright));
  }
}

// =============================================================
// Pattern 9: Bouncing balls with trails
// =============================================================
#define NUM_BALLS 2

float ballX[NUM_BALLS], ballY[NUM_BALLS];
float ballVX[NUM_BALLS], ballVY[NUM_BALLS];
uint8_t ballHue[NUM_BALLS];
uint8_t ballTrailBright[NUM_LEDS];
uint8_t ballTrailHue[NUM_LEDS];
bool ballsInited = false;

void ballsInit() {
  for (uint8_t i = 0; i < NUM_BALLS; i++) {
    ballX[i]  = 2.0f + random(4);  // 2–5: away from all edges/corners
    ballY[i]  = 2.0f + random(4);
    // Non-overlapping ranges guarantee |VX| != |VY|, breaking diagonal lock
    float spdX = (0.20f + random(4) * 0.10f) * BALL_SPEED_SCALE;
    float spdY = (0.25f + random(4) * 0.10f) * BALL_SPEED_SCALE;
    ballVX[i] = spdX * (random(2) ? 1.0f : -1.0f);
    ballVY[i] = spdY * (random(2) ? 1.0f : -1.0f);
    ballHue[i] = i * 128;  // opposite sides of color wheel
  }
  memset(ballTrailBright, 0, NUM_LEDS);
  ballsInited = true;
}

void patternBalls() {
  if (!ballsInited) ballsInit();

  for (uint8_t i = 0; i < NUM_LEDS; i++) {
    if (ballTrailBright[i] > BALL_TRAIL_FADE) ballTrailBright[i] -= BALL_TRAIL_FADE;
    else ballTrailBright[i] = 0;
  }

  for (uint8_t i = 0; i < NUM_BALLS; i++) {
    ballX[i] += ballVX[i];
    ballY[i] += ballVY[i];

    if (ballX[i] < 0.0f)          { ballX[i] = 0.0f;          ballVX[i] = -ballVX[i]; }
    if (ballX[i] > GRID_W - 1.0f) { ballX[i] = GRID_W - 1.0f; ballVX[i] = -ballVX[i]; }
    if (ballY[i] < 0.0f)          { ballY[i] = 0.0f;          ballVY[i] = -ballVY[i]; }
    if (ballY[i] > GRID_H - 1.0f) { ballY[i] = GRID_H - 1.0f; ballVY[i] = -ballVY[i]; }

    uint8_t px = (uint8_t)(ballX[i] + 0.5f);
    uint8_t py = (uint8_t)(ballY[i] + 0.5f);
    if (px >= GRID_W) px = GRID_W - 1;
    if (py >= GRID_H) py = GRID_H - 1;
    ballTrailBright[xy(px, py)] = 255;
    ballTrailHue[xy(px, py)]    = ballHue[i];
  }

  clearGrid();
  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      if (ballTrailBright[xy(x, y)] > 0)
        strip.setPixelColor(xy(x, y),
          paletteColor(ballTrailHue[xy(x, y)], 255, ballTrailBright[xy(x, y)]));
    }
  }
  for (uint8_t i = 0; i < NUM_BALLS; i++) {
    uint8_t px = (uint8_t)(ballX[i] + 0.5f);
    uint8_t py = (uint8_t)(ballY[i] + 0.5f);
    if (px >= GRID_W) px = GRID_W - 1;
    if (py >= GRID_H) py = GRID_H - 1;
    strip.setPixelColor(xy(px, py), paletteColor(ballHue[i], 200, 255));
  }
}

// =============================================================
// Pattern 10: Lissajous tracer
// =============================================================
uint8_t lissTrail[NUM_LEDS];

void patternLissajous() {
  for (uint8_t i = 0; i < NUM_LEDS; i++) {
    if (lissTrail[i] > LISS_TRAIL_FADE) lissTrail[i] -= LISS_TRAIL_FADE;
    else lissTrail[i] = 0;
  }

  float a  = 2.0f + 0.7f * sinf(tick * (LISS_DRIFT_SPEED * TICK_MS / 1000.0f));
  float t0 = (tick - 1) * (LISS_PHASE_SPEED * TICK_MS / 1000.0f);
  float t1 = tick       * (LISS_PHASE_SPEED * TICK_MS / 1000.0f);
  for (uint8_t s = 0; s <= 8; s++) {
    float t  = t0 + (t1 - t0) * s / 8.0f;
    float xf = sinf(a * t);
    float yf = sinf(3.0f * t + 1.2f);
    uint8_t px = (uint8_t)((xf + 1.0f) * 0.5f * (GRID_W - 1) + 0.5f);
    uint8_t py = (uint8_t)((yf + 1.0f) * 0.5f * (GRID_H - 1) + 0.5f);
    if (px >= GRID_W) px = GRID_W - 1;
    if (py >= GRID_H) py = GRID_H - 1;
    lissTrail[xy(px, py)] = 255;
  }

  clearGrid();
  uint8_t hueShift = tick / MS_TO_TICKS(LISS_HUE_STEP_MS);
  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      if (lissTrail[xy(x, y)] > 0)
        strip.setPixelColor(xy(x, y),
          paletteColor(hueShift + x * 16 + y * 8, 255, lissTrail[xy(x, y)]));
    }
  }
}

// =============================================================
// Encoder trace dump
// =============================================================
// Prints the last ENC_TRACE_LEN ISR calls in chronological order.
// Each line: time since previous ISR call, the state transition (prevBA->currBA),
// and the outcome. Read like a strip-chart of the encoder signal.
//
// Example of a clean CW detent (4 edges, ~500us apart, all valid):
//   +  512us  11->01  CW  +1
//   +  508us  01->00  CW  +1
//   +  511us  00->10  CW  +1
//   +  506us  10->11  CW  +1
//
// Example of a bouncy edge (fast spurious edges before settling):
//   +  510us  11->01  CW  +1
//   +   38us  BOUNCE          ← rejected: 38us < ENC_DEBOUNCE_US
//   +   22us  BOUNCE
//   +  490us  01->00  CW  +1
//
// Example of ISR latency eating an edge (NOISE = valid timing, impossible state):
//   +  505us  11->01  CW  +1
//   +  498us  01->11  NOISE 0  ← two bits flipped simultaneously, step lost

void dumpEncTrace() {
  static uint8_t lastHead = 0;

  noInterrupts();
  uint8_t      head = encTraceHead;
  EncEvent     buf[ENC_TRACE_LEN];
  memcpy(buf, encTrace, sizeof(encTrace));
  interrupts();

  uint8_t count    = head < ENC_TRACE_LEN ? head : ENC_TRACE_LEN;
  // How many of those events arrived since the last dump (capped at what's in the buffer).
  uint8_t newCount = (uint8_t)(head - lastHead);
  if (newCount > count) newCount = count;
  uint8_t oldCount = count - newCount;

  Serial.print("enc trace ("); Serial.print(count);
  Serial.print(" events, "); Serial.print(newCount); Serial.println(" new, oldest first):");

  for (uint8_t i = 0; i < count; i++) {
    uint8_t    idx = (uint8_t)(head - count + i) & (ENC_TRACE_LEN - 1);
    EncEvent  &e   = buf[idx];

    // "* " marks events that are new since the last dump; "  " are carry-over context
    Serial.print(i >= oldCount ? "* " : "  ");

    // Right-align dt so columns line up
    Serial.print("+");
    if (e.dt < 10000) Serial.print(" ");
    if (e.dt < 1000)  Serial.print(" ");
    if (e.dt < 100)   Serial.print(" ");
    Serial.print(e.dt); Serial.print("us  ");

    // Unpack prevBA (bits 3:2) and currBA (bits 1:0), print as binary digits.
    // For BOUNCE events this is the would-be transition (pins read but not committed).
    uint8_t prev = (e.state >> 2) & 0x3;
    uint8_t curr = e.state & 0x3;
    Serial.print((prev >> 1) & 1); Serial.print(prev & 1);
    Serial.print("->");
    Serial.print((curr >> 1) & 1); Serial.print(curr & 1);
    Serial.print("  ");
    if      (e.result == -128) Serial.println("BOUNCE");
    else if (e.result > 0)     Serial.println("CW  +1");
    else if (e.result < 0)     Serial.println("CCW -1");
    else                       Serial.println("NOISE 0");
  }

  lastHead = head;
}

// =============================================================
// Main
// =============================================================

void setup() {
  pinMode(ENC_A, INPUT_PULLUP);
  pinMode(ENC_B, INPUT_PULLUP);
  pinMode(ENC_BTN, INPUT_PULLUP);
  pinMode(RED_LED_PIN, OUTPUT);

  encState = (digitalRead(ENC_B) << 1) | digitalRead(ENC_A);
  attachInterrupt(digitalPinToInterrupt(ENC_A), encoderISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENC_B), encoderISR, CHANGE);

  strip.begin();
  strip.setBrightness(DEFAULT_BRIGHT);
  strip.show();

  onboardDot.begin();
  onboardDot.setBrightness(80);
  updateOnboardDot();

  randomSeed(analogRead(A4));

  buildSpiral();

  Serial.begin(DEBUG_BAUD);
}

void loop() {
  // Print startup banner once — deferred so monitor can connect after upload
  static bool startupPrinted = false;
  if (!startupPrinted && Serial) {
    startupPrinted = true;
    Serial.print("sulagrid ready  patterns="); Serial.print(NUM_PATTERNS);
    Serial.print(" palettes="); Serial.print(NUM_PALETTES);
    Serial.print(" maxbright="); Serial.println(MAX_BRIGHT);
    Serial.print("startup: DEFAULT_PATTERN="); Serial.print(DEFAULT_PATTERN);
    Serial.print(" currentPattern="); Serial.print(currentPattern);
    Serial.print(" encPos="); Serial.println(encPos);
  }

  // --- Potentiometer → brightness ---
  static uint8_t lastReportedBright = 0;
  uint16_t potVal = analogRead(POT_PIN);
  uint8_t bright = map(potVal, 0, 1023, 0, MAX_BRIGHT);
  if (bright < 1) bright = 1;
  strip.setBrightness(bright);
  if (abs((int)bright - (int)lastReportedBright) > 2) {
    Serial.print("bright="); Serial.println(bright);
    lastReportedBright = bright;
  }

  // --- Encoder → pattern selection ---
  // Read pos and all debug counters in one critical section so they're
  static int lastLogPos = DEFAULT_PATTERN * ENC_COUNTS_PER_DETENT;

  noInterrupts();
  int      pos     = encPos;
  uint16_t cw      = encCW;
  uint16_t ccw     = encCCW;
  uint16_t bounced = encBounced;
  uint16_t noise   = encNoise;
  interrupts();

  // Log raw position on every change. [partial] = landed between detents,
  // meaning an edge was lost. If you see persistent partials after adding
  // the RC filter, try lowering ENC_DEBOUNCE_US.
  if (pos != lastLogPos) {
    Serial.print("enc pos="); Serial.print(pos);
    Serial.print(" delta="); Serial.print(pos - lastLogPos);
    if (pos % ENC_COUNTS_PER_DETENT != 0) Serial.print(" [partial]");
    Serial.println();
    lastLogPos = pos;
  }

  int newPattern = ((pos / ENC_COUNTS_PER_DETENT) % NUM_PATTERNS + NUM_PATTERNS) % NUM_PATTERNS;
  if (newPattern != currentPattern) {
    currentPattern = newPattern;
    clearGrid();
    strip.show();
    blinkRedLed();
    snakeInited = false;
    exploding = false;
    showingLength = false;
    ballsInited = false;
    Serial.print("pattern -> "); Serial.print(currentPattern);
    Serial.print(" ("); Serial.print(PATTERN_NAMES[currentPattern]);
    Serial.print(") encPos="); Serial.print(pos);
    Serial.print(" cw="); Serial.print(cw);
    Serial.print(" ccw="); Serial.print(ccw);
    Serial.print(" bnc="); Serial.print(bounced);
    Serial.print(" nse="); Serial.println(noise);
    dumpEncTrace();
  }

  // --- Button → cycle color palette ---
  if (digitalRead(ENC_BTN) == LOW) {
    if (millis() - lastBtnPress > 300) {
      currentPalette = (currentPalette + 1) % NUM_PALETTES;
      lastBtnPress = millis();
      updateOnboardDot();
      blinkRedLed();
      Serial.print("palette -> "); Serial.print(currentPalette);
      Serial.print(" ("); Serial.print(PALETTE_NAMES[currentPalette]); Serial.println(")");
    }
  }

  // --- Turn off red LED after blink duration ---
  if (redLedOff > 0 && millis() >= redLedOff) {
    digitalWrite(RED_LED_PIN, LOW);
    redLedOff = 0;
  }

  // --- Run current pattern ---
  switch (currentPattern) {
    case 0: patternCheckerboard(); break;
    case 1: patternBreathe();      break;
    case 2: patternSweep();        break;
    case 3: patternRings();        break;
    case 4: patternSparkle();      break;
    case 5: patternFace();         break;
    case 6: patternRainbow();      break;
    case 7: patternSpiral();       break;
    case 8:  patternSnake();      break;
    case 9:  patternBalls();      break;
    case 10: patternLissajous();  break;
  }
  strip.show();

  if (tick % DEBUG_INTERVAL == 0) {
    Serial.print("tick="); Serial.print(tick);
    Serial.print(" pat="); Serial.print(PATTERN_NAMES[currentPattern]);
    Serial.print(" pal="); Serial.print(PALETTE_NAMES[currentPalette]);
    Serial.print(" bright="); Serial.println(bright);
  }

  tick++;
  delay(TICK_MS);
}
