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
//
// UI:
//   Button       — advance to next sketch
//   Encoder      — left/right input for interactive sketches (snake, tetris)
//                  In snake/tetris, any encoder turn takes control from the AI
//                  until the game ends (snake dies, tetris tops out).
//   Onboard dot  — green while user has control, palette color otherwise.

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
#define NUM_PATTERNS 13
#define NUM_PALETTES 3
#define MAX_BRIGHT     50
#define DEFAULT_PATTERN 8  // 0=checker 1=breathe 2=sweep 3=rings 4=sparkle 5=face 6=rainbow 7=spiral 8=snake 9=balls 10=lissajous 11=ripple 12=tetris
#define DEFAULT_BRIGHT 10
#define TICK_MS        10
#define DEBUG_BAUD     115200
#define DEBUG_INTERVAL (10000 / TICK_MS)

// Set to 1 to use pot for speed control (middle = default speed, brightness fixed).
// Set to 0 for normal brightness control.
#define POT_SPEED_MODE 1

// Convert a millisecond duration to a tick count
#define MS_TO_TICKS(ms)  ((ms) / TICK_MS)

// Pattern timing — all in ms; divide by TICK_MS at use site via MS_TO_TICKS()
#define CHECKER_FADE_MS         3200   // brightness oscillation period
#define CHECKER_HUE_STEP_MS      160   // ms per hue index step

#define BREATHE_PERIOD_MS       2400   // inhale/exhale period
#define BREATHE_HUE_STEP_MS      160

#define SWEEP_ROT_SPEED         2.0f   // rad/sec
#define SWEEP_HUE_STEP_MS        120
#define SWEEP_PING_MS            220   // short-press flash duration (white halo decay)

#define RINGS_STEP_MS            200   // ms per ring expansion step
#define RINGS_HUE_STEP_MS        400
#define RINGS_BOOM_MS            350   // short-press: all rings full-bright, fade together

#define SPARKLE_FADE_PER_SEC     100   // brightness units/sec
// Compile-time per-tick fade amount; minimum 1 so trails always clear
#define SPARKLE_FADE_AMT  (SPARKLE_FADE_PER_SEC * TICK_MS / 1000 + \
                           (SPARKLE_FADE_PER_SEC * TICK_MS / 1000 == 0))
#define SPARKLE_SPAWN_MS         320

#define FACE_BLINK_PERIOD_MS    2000
#define FACE_EYES_OPEN_MS       1880   // open portion of blink period
#define FACE_EXPR_MS            4000   // ms per expression
#define FACE_WINK_MS             450   // short-press: force ;) expression briefly

#define RAINBOW_STEP_MS   20   // ms per 1-unit hue advance (~5s full cycle)

#define SPIRAL_STEP_MS           120   // ms per spiral advance step
#define SPIRAL_HOLD_STEPS          8   // hold duration in spiral-steps (not ticks)  (legacy)
#define SPIRAL_CYCLE_LEN  (NUM_LEDS * 2 + SPIRAL_HOLD_STEPS * 2)                     // legacy
#define SPIRAL_RESET_MS          600   // total ms for endpoint reset animation (white flash → black)

#define SNAKE_STEP_MS            120   // ms per snake move
#define EXPLOSION_EXPAND_MS       80   // ms per explosion radius step
#define APPLE_BLINK_MS            80   // ms per apple blink half-period
#define SNAKE_REVEAL_MS           80   // ms per pixel revealed in length display
#define SNAKE_HOLD_MS           3000   // ms to hold length display after fill
#define SNAKE_PULSE_MS           600   // ms per brightness pulse cycle during hold

// User-takeover transition: snake holds still while flashing white, then
// resumes moving with pulsing red.  The pause gives the user a beat to orient
// before the snake actually responds to their input.
#define SNAKE_USER_PAUSE_MS      700   // duration of the takeover hold
#define SNAKE_USER_BLINK_MS      120   // ms per white-flash half-period during pause
#define SNAKE_USER_BODY_PULSE_MS 700   // ms per red-pulse cycle while moving

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


#define RIPPLE_LIFETIME_MS   7000     // ms a ripple lasts
#define RIPPLE_SPEED_PPS     1.8f     // wave expansion, pixels/sec
#define RIPPLE_WAVELENGTH    4.0f     // pixels between ring crests (wider = fewer rings visible at once)
#define RIPPLE_FADE_DIST     3.5f     // visible wake behind wavefront, pixels


#define TETRIS_FALL_MS         150   // ms per gravity step
#define TETRIS_ROTATE_GRACE_MS 600   // extra delay added on top of TETRIS_FALL_MS after a user rotation
#define TETRIS_FLASH_MS         80   // ms per line-clear blink half-period
#define TETRIS_CLEAR_MS        600   // ms for line-clear flash
#define TETRIS_BLINK_HALF_MS   250   // game-over: half-period per gentle blink
#define TETRIS_BLINK_COUNT       2   // game-over: number of on/off blink cycles
#define TETRIS_EXPLODE_MS     1500   // game-over: ms for pieces to fly outward
#define TETRIS_BLINK_MS       (TETRIS_BLINK_COUNT * 2 * TETRIS_BLINK_HALF_MS)
#define TETRIS_GAMEOVER_MS    (TETRIS_BLINK_MS + TETRIS_EXPLODE_MS)

static const char *PATTERN_NAMES[NUM_PATTERNS] = {
  "checker", "breathe", "sweep", "rings", "sparkle", "face",
  "rainbow", "spiral", "snake", "balls", "lissajous", "ripple", "tetris"
};
static const char *PALETTE_NAMES[NUM_PALETTES] = {
  "warm", "cool", "rainbow"
};

#define ENC_COUNTS_PER_DETENT 4

Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_DotStar onboardDot(1, DOTSTAR_DATA, DOTSTAR_CLK, DOTSTAR_BGR);

volatile int      encPos     = 0;
// Debug counters incremented inside the ISR — can't Serial.print from there,
// so we read these in the main loop under noInterrupts().
volatile uint16_t encCW      = 0;  // valid CW transitions (table returned +1)
volatile uint16_t encCCW     = 0;  // valid CCW transitions (table returned -1)
volatile uint16_t encBounced = 0;  // rejected by debounce timer (too soon after last edge)
volatile uint16_t encNoise   = 0;  // passed timer but table returned 0 (impossible transition)

// Circular trace buffer: every ISR call is logged here — including bounced ones —
// so you can see the exact timing and state sequence around any turn.  This is
// purely a debug aid; flip ENC_TRACE_ENABLED to 0 in production to skip the
// per-fire memory writes inside the ISR (4–6 bytes plus an index calc).
#define ENC_TRACE_ENABLED 0
#define ENC_TRACE_LEN 32  // must be power of 2
#if ENC_TRACE_ENABLED
struct EncEvent {
  uint16_t dt;     // microseconds since previous ISR call, capped at 65535
  uint8_t  state;  // encState & 0x0F after update (prevBA in bits 3:2, currBA in 1:0)
                   // 0xFF for bounce-rejected entries (state machine not updated)
  int8_t   result; // +1 CW, -1 CCW, 0 noise, -128 bounce-rejected
};
EncEvent          encTrace[ENC_TRACE_LEN];  // read under noInterrupts()
volatile uint8_t  encTraceHead = 0;         // index of next write slot (wraps via & mask)
#endif
int currentPattern = DEFAULT_PATTERN;
int currentPalette = 2;  // rainbow
unsigned long lastBtnPress = 0;
unsigned long tick = 0;
unsigned long redLedOff = 0;

// --- Game input (encoder → left/right) ---
// Each detent is ~4 raw counts but bounce/missed-edges make that unreliable.
// We register one input as soon as the raw delta crosses GAME_INPUT_THRESHOLD,
// then advance the anchor by a full ENC_COUNTS_PER_DETENT — so a single click
// produces exactly one input even when it lands at 3, 4, or 5 raw counts.
#define GAME_INPUT_THRESHOLD 3
int  inputAnchor  = 0;   // raw encPos at last consumed input event
int  pendingInput = 0;   // signed: +1 per CW detent, -1 per CCW
bool userControl  = false;  // a game pattern has received user input — disables AI until game ends
unsigned long userTakeoverTick = 0;  // tick at which userControl flipped to true (for transition animations)

// User-activity flag: true while the user has touched encoder or button recently.
// Set on every input event, auto-cleared after the per-pattern timeout (decay
// happens at the top of loop()), and explicitly cleared on pattern change so a
// new sketch always starts in autonomous mode regardless of prior input timing.
//
// Visual patterns auto-resume animating quickly after a scrub.  Game patterns
// keep the flag effectively pinned for the duration of a play session — though
// note that snake/tetris read userControl, not this flag, so this is mostly
// for signalling consistency.
unsigned long lastInputTick   = 0;
bool          userActiveFlag  = false;
#define USER_ACTIVITY_VIS_MS   1500   // visual patterns: short timeout
#define USER_ACTIVITY_GAME_MS 60000   // snake / tetris: ~1 min, effectively until game-over
static inline bool userActive() { return userActiveFlag; }
static inline unsigned long userActivityWindowTicks() {
  return (currentPattern == 8 || currentPattern == 12)
    ? MS_TO_TICKS(USER_ACTIVITY_GAME_MS)
    : MS_TO_TICKS(USER_ACTIVITY_VIS_MS);
}

// --- Button input ---
// Short press (release before BTN_HOLD_MS) → btnAction one-shot consumed by the
// active pattern (e.g. tetris rotates the falling piece).  Long press / hold past
// BTN_HOLD_MS skips to the next sketch.
#define BTN_HOLD_MS 500
bool btnAction = false;  // one-shot: pattern clears it after consuming

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

  if (elapsed < ENC_DEBOUNCE_US) {
#if ENC_TRACE_ENABLED
    uint8_t slot = encTraceHead & (ENC_TRACE_LEN - 1);
    encTrace[slot].dt = (elapsed > 65535) ? 65535 : (uint16_t)elapsed;
    // Compute what the state nibble would have been without rejection,
    // so the trace can show the would-be transition.
    encTrace[slot].state  = ((encState << 2) | (digitalRead(ENC_B) << 1) | digitalRead(ENC_A)) & 0x0F;
    encTrace[slot].result = -128;   // sentinel: bounce-rejected
    encTraceHead++;
#endif
    encBounced++;
    return;
  }
  encLastUs = now;

  encState <<= 2;
  encState |= (digitalRead(ENC_B) << 1) | digitalRead(ENC_A);
  int8_t delta = encTable[encState & 0x0F];
  encPos += delta;

#if ENC_TRACE_ENABLED
  uint8_t slot = encTraceHead & (ENC_TRACE_LEN - 1);
  encTrace[slot].dt     = (elapsed > 65535) ? 65535 : (uint16_t)elapsed;
  encTrace[slot].state  = encState & 0x0F;
  encTrace[slot].result = delta;
  encTraceHead++;
#endif

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
  uint32_t c = userControl ? 0x00FF40                           // green: user has control
                           : palettes[currentPalette].indicatorColor;
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
  // Encoder scrubs both the brightness oscillation phase and the hue cycle.
  // Each detent ≈ 1/32 of the fade period — a full sweep takes ~16 clicks.
  static long          checkerTs   = 0;
  static unsigned long checkerLast = 0;
  if (pendingInput != 0) {
    checkerTs += (long)pendingInput * (MS_TO_TICKS(CHECKER_FADE_MS) / 32);
    pendingInput = 0;
  }
  if (!userActive()) { checkerTs += (long)(tick - checkerLast); }
  checkerLast = tick;

  const long fadePer = MS_TO_TICKS(CHECKER_FADE_MS);
  long       phasen  = ((checkerTs % fadePer) + fadePer) % fadePer;
  float      phase   = (float)phasen / fadePer * 2.0f * PI;
  float      blend   = (sin(phase) + 1.0f) / 2.0f;
  const long huePer  = MS_TO_TICKS(CHECKER_HUE_STEP_MS);
  uint8_t    hueVal  = (uint8_t)((((checkerTs / huePer) % 256) + 256) % 256);

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
  // Encoder scrubs the breath — forward = inhale/exhale faster, backward rewinds.
  static long          breatheTs   = 0;
  static unsigned long breatheLast = 0;
  if (pendingInput != 0) {
    breatheTs += (long)pendingInput * (MS_TO_TICKS(BREATHE_PERIOD_MS) / 24);
    pendingInput = 0;
  }
  if (!userActive()) { breatheTs += (long)(tick - breatheLast); }
  breatheLast = tick;

  const long per    = MS_TO_TICKS(BREATHE_PERIOD_MS);
  long       phasen = ((breatheTs % per) + per) % per;
  float      phase  = (float)phasen / per * 2.0f * PI;
  uint8_t    brightness = (uint8_t)(127.5f + 127.5f * sin(phase));
  const long hp     = MS_TO_TICKS(BREATHE_HUE_STEP_MS);
  uint8_t    hueVal = (uint8_t)((((breatheTs / hp) % 256) + 256) % 256);
  strip.fill(paletteColor(hueVal, 255, brightness));
}

// =============================================================
// Pattern 2: Rotating radar sweep — encoder aims the beam, idle auto-rotates
// =============================================================
void patternSweep() {
  clearGrid();
  float cx = 3.5f, cy = 3.5f;
  static float         sweepAngle = 0.0f;
  static unsigned long pingUntil  = 0;  // short-press: white halo overlay decays to here

  if (pendingInput != 0) {
    sweepAngle += pendingInput * (PI / 8.0f);  // 22.5° per detent — a full turn is 16 clicks
    pendingInput = 0;
  }
  if (btnAction) {
    pingUntil = tick + MS_TO_TICKS(SWEEP_PING_MS);
    btnAction = false;
  }
  if (!userActive()) {
    sweepAngle += SWEEP_ROT_SPEED * TICK_MS / 1000.0f;
  }
  sweepAngle = fmodf(sweepAngle, 2.0f * PI);
  if (sweepAngle < 0.0f) sweepAngle += 2.0f * PI;

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
      if (diff >= -0.1f && diff <= 0.1f) {
        bright = 255;
      } else if (diff < -0.1f && diff > -0.9f) {
        bright = (uint8_t)(255.0f * (0.9f + diff) / 0.8f);
      }

      if (bright > 0)
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, bright));
    }
  }

  // Ping overlay: additive white flash on every pixel, decaying over SWEEP_PING_MS.
  if (pingUntil > tick) {
    float frac = (float)(pingUntil - tick) / (float)MS_TO_TICKS(SWEEP_PING_MS);
    uint8_t add = (uint8_t)(180.0f * frac);
    for (uint16_t i = 0; i < NUM_LEDS; i++) {
      uint32_t c = strip.getPixelColor(i);
      uint8_t r = (c >> 16) & 0xFF;
      uint8_t g = (c >>  8) & 0xFF;
      uint8_t b =  c        & 0xFF;
      r = (r + add > 255) ? 255 : r + add;
      g = (g + add > 255) ? 255 : g + add;
      b = (b + add > 255) ? 255 : b + add;
      strip.setPixelColor(i, r, g, b);
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
  // Encoder steps one ring per detent; idle advances at the original rate.
  static long          ringsStep = 0;
  static unsigned long ringsLast = 0;
  static unsigned long boomUntil = 0;  // short-press: every ring blooms full-bright together
  if (pendingInput != 0) {
    ringsStep += pendingInput;
    pendingInput = 0;
  }
  if (btnAction) {
    boomUntil = tick + MS_TO_TICKS(RINGS_BOOM_MS);
    btnAction = false;
  }
  if (!userActive()) {
    if (tick - ringsLast >= MS_TO_TICKS(RINGS_STEP_MS)) {
      ringsStep++;
      ringsLast = tick;
    }
  } else {
    ringsLast = tick;
  }
  uint8_t ring   = (uint8_t)((((ringsStep  % (maxDist + 2)) + (maxDist + 2)) % (maxDist + 2)));
  uint8_t hueVal = (uint8_t)((((ringsStep / 2 % 256) + 256) % 256));  // hue drifts half as fast

  // Boom overrides normal ring rendering: every ring (every cell) lit at fading brightness.
  if (boomUntil > tick) {
    float frac = (float)(boomUntil - tick) / (float)MS_TO_TICKS(RINGS_BOOM_MS);
    uint8_t b = (uint8_t)(255.0f * frac);
    for (uint8_t y = 0; y < GRID_H; y++)
      for (uint8_t x = 0; x < GRID_W; x++)
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, b));
    return;
  }

  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      float dx = abs((float)x - cx);
      float dy = abs((float)y - cy);
      uint8_t dist = (uint8_t)(max(dx, dy) + 0.5);
      if (dist == ring) {
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, 255));
      } else if (ring > 0 && dist == ring - 1) {
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, 150));
      } else if (ring > 1 && dist == ring - 2) {
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

  // Each encoder detent spawns one sparkle immediately — tactile "fizz".  Direction
  // doesn't matter; both CW and CCW spawn because you can't un-sparkle.
  if (pendingInput != 0) {
    int n = (pendingInput > 0) ? pendingInput : -pendingInput;
    if (n > 8) n = 8;
    for (int i = 0; i < n; i++) {
      uint8_t slot = random(8);
      sparklePixels[slot] = random(NUM_LEDS);
      sparkleHues[slot]   = random(256);
      sparkleBright[slot] = 255;
    }
    pendingInput = 0;
  }

  // Short-press → full burst: all 8 slots fresh at full brightness.
  if (btnAction) {
    for (uint8_t i = 0; i < 8; i++) {
      sparklePixels[i] = random(NUM_LEDS);
      sparkleHues[i]   = random(256);
      sparkleBright[i] = 255;
    }
    btnAction = false;
  }

  // Autonomous spawn still fires on the original schedule when the user isn't driving.
  if (!userActive() && (tick % MS_TO_TICKS(SPARKLE_SPAWN_MS)) == 0) {
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

  // Encoder flips through expressions; idle auto-cycles on the original schedule.
  static long          faceScrub = 0;
  static unsigned long winkUntil = 0;  // short-press forces ;) expression until this tick
  if (pendingInput != 0) {
    faceScrub += pendingInput;
    pendingInput = 0;
  }
  if (btnAction) {
    winkUntil = tick + MS_TO_TICKS(FACE_WINK_MS);
    btnAction = false;
  }
  uint8_t expr;
  if (tick < winkUntil) {
    expr = 1;  // ;)
  } else if (userActive()) {
    expr = (uint8_t)((((faceScrub % NUM_EXPRS) + NUM_EXPRS) % NUM_EXPRS));
  } else {
    expr = (uint8_t)((tick / MS_TO_TICKS(FACE_EXPR_MS)) % NUM_EXPRS);
  }

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
  // Encoder scrolls the rainbow: each detent advances the hue offset by 8 units
  // (~3% of a full cycle).  Idle advances at the original RAINBOW_STEP_MS cadence.
  static long          rainbowTs   = 0;
  static unsigned long rainbowLast = 0;
  if (pendingInput != 0) {
    rainbowTs += (long)pendingInput * 8;
    pendingInput = 0;
  }
  if (!userActive()) {
    if (tick - rainbowLast >= MS_TO_TICKS(RAINBOW_STEP_MS)) {
      rainbowTs += (long)((tick - rainbowLast) / MS_TO_TICKS(RAINBOW_STEP_MS));
      rainbowLast = tick;
    }
  } else {
    rainbowLast = tick;
  }
  uint8_t offset = (uint8_t)(((rainbowTs % 256) + 256) % 256);
  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      uint8_t val = (x + y) * 16 + offset;
      strip.setPixelColor(xy(x, y), paletteColor(val, 255, 200));
    }
  }
}

// =============================================================
// Pattern 7: Spiral fill from center, then unwind
// =============================================================
// Packed coords: (y << 3) | x — stored in build order so rotations can be applied
// at lookup time rather than rebuilding the path for each of the 4 rotations.
uint8_t spiralOrder[NUM_LEDS];
bool spiralBuilt = false;

void buildSpiral() {
  if (spiralBuilt) return;
  int top = 0, bottom = GRID_H - 1, left = 0, right = GRID_W - 1;
  uint8_t idx = 0;

  while (top <= bottom && left <= right) {
    for (int x = left;  x <= right;  x++) spiralOrder[idx++] = (top    << 3) | x;
    top++;
    for (int y = top;   y <= bottom; y++) spiralOrder[idx++] = (y      << 3) | right;
    right--;
    if (top <= bottom) {
      for (int x = right; x >= left; x--) spiralOrder[idx++] = (bottom << 3) | x;
      bottom--;
    }
    if (left <= right) {
      for (int y = bottom; y >= top; y--) spiralOrder[idx++] = (y      << 3) | left;
      left++;
    }
  }
  spiralBuilt = true;
}

// i-th pixel in fill order, with rotation (rot 0..3 → start corner TL/TR/BR/BL) and
// inward flag (true = outer→center, false = center→outer).
uint8_t spiralAt(uint8_t i, bool inward, uint8_t rot) {
  uint8_t p = spiralOrder[inward ? i : NUM_LEDS - 1 - i];
  uint8_t x = p & 0x7;
  uint8_t y = (p >> 3) & 0x7;
  uint8_t rx, ry;
  switch (rot & 0x3) {
    case 1:  rx = GRID_W - 1 - y; ry = x;                break;  // TR
    case 2:  rx = GRID_W - 1 - x; ry = GRID_H - 1 - y;   break;  // BR
    case 3:  rx = y;              ry = GRID_H - 1 - x;   break;  // BL
    default: rx = x;              ry = y;                break;  // TL
  }
  return xy(rx, ry);
}

static long          spiralTs       = 0;   // [0, NUM_LEDS] — how many pixels of the path are lit
static uint8_t       spiralRot      = 0;   // 0..3: start corner
static bool          spiralInward   = true;
static int8_t        spiralAutoDir  = 1;   // +1 fills, -1 empties; flips randomly on reset
static bool          spiralInReset  = false;
static unsigned long spiralResetAt  = 0;
static unsigned long spiralLastAuto = 0;
static bool          spiralSeeded   = false;

static void spiralReroll() {
  spiralRot      = random(4);
  spiralInward   = random(2);
  spiralAutoDir  = random(2) ? 1 : -1;
  spiralTs       = (spiralAutoDir > 0) ? 0 : NUM_LEDS;
  spiralLastAuto = tick;
}

void patternSpiral() {
  clearGrid();

  if (!spiralSeeded) {
    spiralReroll();
    spiralSeeded = true;
  }

  // Short-press → kick endpoint reset right now (white flash + reroll).
  if (btnAction && !spiralInReset) {
    spiralInReset = true;
    spiralResetAt = tick;
    btnAction = false;
  }

  // Endpoint reset: full-grid white that fades to black, then re-roll and continue.
  if (spiralInReset) {
    unsigned long elapsed = tick - spiralResetAt;
    if (elapsed < MS_TO_TICKS(SPIRAL_RESET_MS)) {
      float frac = (float)elapsed / MS_TO_TICKS(SPIRAL_RESET_MS);
      uint8_t b  = (uint8_t)(255.0f * (1.0f - frac));
      strip.fill(strip.Color(b, b, b));
      return;
    }
    spiralReroll();
    spiralInReset = false;
    // fall through: render fresh spiral in this frame
  }

  long oldTs = spiralTs;
  if (pendingInput != 0) {
    spiralTs += pendingInput;
    pendingInput = 0;
  }
  if (!userActive()) {
    if (tick - spiralLastAuto >= MS_TO_TICKS(SPIRAL_STEP_MS)) {
      spiralTs += spiralAutoDir;
      spiralLastAuto = tick;
    }
  } else {
    spiralLastAuto = tick;
  }
  if (spiralTs < 0)         spiralTs = 0;
  if (spiralTs > NUM_LEDS)  spiralTs = NUM_LEDS;

  // Render current path: pixels [0, spiralTs) lit in rainbow, spiralTs is white tracer
  // (skipped when at an endpoint — full/empty has no tracer).
  for (long i = 0; i < spiralTs; i++)
    strip.setPixelColor(spiralAt(i, spiralInward, spiralRot), paletteColor(i * 4, 255, 255));
  if (spiralTs > 0 && spiralTs < NUM_LEDS)
    strip.setPixelColor(spiralAt(spiralTs, spiralInward, spiralRot), strip.Color(255, 255, 255));

  // Trigger endpoint reset on arrival (not on startup, since spiralTs already sat there).
  bool hitEnd = (spiralTs == 0        && oldTs > 0)
             || (spiralTs == NUM_LEDS && oldTs < NUM_LEDS);
  if (hitEnd) {
    spiralInReset = true;
    spiralResetAt = tick;
  }
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
  userControl = false;     // AI drives until user touches the encoder
  pendingInput = 0;
  updateOnboardDot();
}

// Apply at most one queued turn — sign of pendingInput. Right turn (CW from above):
// (dx,dy) → (-dy, dx).  Left turn (CCW): (dx,dy) → (dy, -dx).  We collapse multiple
// queued events to a single 90° rotation so a noisy double-click can't flip the snake
// 180° into its own neck.
void snakeApplyUserTurn() {
  int net = pendingInput;
  pendingInput = 0;
  if (net == 0) return;
  if (net > 0) {
    int8_t nx = -snakeDirY, ny = snakeDirX;
    snakeDirX = nx; snakeDirY = ny;
  } else {
    int8_t nx = snakeDirY, ny = -snakeDirX;
    snakeDirX = nx; snakeDirY = ny;
  }
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

// BFS flood-fill from (startX, startY).
// Time-aware flood fill from (startX, startY).
//
// Body segment [i] vacates its cell at step (snakeLen-1-i):
//   tail (i=snakeLen-1) → step 0  (free immediately)
//   body[i]             → step snakeLen-1-i
//
// When expanding to a neighbor at BFS depth d, body[i] at that cell is a wall only
// if d < snakeLen-1-i (it hasn't moved yet).  Longer paths can thread through cells
// that the tail will have vacated by the time the snake arrives.
//
// Returns reachable cell count; sets tailReach and appleDist via the dist[] array.
uint8_t snakeFloodFill(int8_t startX, int8_t startY, bool &tailReach, uint8_t &appleDist) {
  // freeAt[idx]: step at which the occupying body segment vacates (-1 = already free).
  int8_t freeAt[NUM_LEDS];
  memset(freeAt, -1, NUM_LEDS);
  for (uint8_t i = 0; i < snakeLen; i++) {
    uint8_t idx = snakeY[i] * GRID_W + snakeX[i];
    freeAt[idx] = (int8_t)(snakeLen - 1 - i);  // tail→0, neck→1, …
  }

  // dist[idx] = minimum BFS steps to reach cell (255 = unreached).
  // Each cell is enqueued at most once, so queue[NUM_LEDS] is sufficient.
  uint8_t dist[NUM_LEDS];
  memset(dist, 255, NUM_LEDS);
  uint8_t queue[NUM_LEDS];
  uint8_t qhead = 0, qtail = 0;

  uint8_t startIdx = startY * GRID_W + startX;
  dist[startIdx] = 0;
  queue[qtail++] = startIdx;

  static const int8_t dx[] = { 1, -1,  0,  0 };
  static const int8_t dy[] = { 0,  0,  1, -1 };
  uint8_t count = 0;

  while (qhead != qtail) {
    uint8_t cur = queue[qhead++];
    int8_t  cx  = cur % GRID_W, cy = cur / GRID_W;
    uint8_t cd  = dist[cur];
    count++;
    for (uint8_t d = 0; d < 4; d++) {
      int8_t nx = cx + dx[d], ny = cy + dy[d];
      if (!snakeInBounds(nx, ny)) continue;
      uint8_t nidx = ny * GRID_W + nx;
      if (dist[nidx] != 255) continue;          // already reached
      int8_t fa = freeAt[nidx];
      // fa == -1: empty cell (always passable)
      // fa == 0:  tail (vacates immediately, always passable)
      // fa >  0:  body segment; passable only once fa <= arrival time
      if (fa > 0 && fa > (int8_t)(cd + 1)) continue;
      dist[nidx] = cd + 1;
      queue[qtail++] = nidx;
    }
  }

  uint8_t tailIdx = snakeY[snakeLen - 1] * GRID_W + snakeX[snakeLen - 1];
  tailReach = (dist[tailIdx] != 255);
  appleDist = dist[appleY * GRID_W + appleX];
  return count;
}

void snakeChooseDir() {
  int8_t dirs[3][2] = {
    {  snakeDirX,              snakeDirY },
    { (int8_t)-snakeDirY,      snakeDirX },
    {  snakeDirY,    (int8_t)-snakeDirX },
  };

  // Tier 1: tail reachable + apple reachable → go toward apple (safe).
  //   tailReach is the real safety guarantee: if the tail is reachable we can
  //   always survive by chasing it.
  // Tier 2: apple reachable + ≥½ available space → go toward apple (risky).
  // Tier 3: no apple path                        → chase own tail to unwind.
  // Fallback: most open direction.
  //
  // Both tailReach and appleDist now come from the time-aware flood fill, which
  // treats body[i] as a wall only until step (snakeLen-1-i) — the step at which
  // it naturally vacates.  This lets the snake plan paths that thread through
  // cells its tail will have cleared by the time it arrives.
  int8_t  t1X = -1, t1Y = -1;
  int8_t  t2X = -1, t2Y = -1;
  int8_t  survX = -1, survY = -1;
  int8_t  fallX = -1, fallY = -1;
  int t1Dist = 999, t2Dist = 999, survDist = 999;
  uint8_t t1Space = 0, t2Space = 0, fallSpace = 0;
  bool anyValid = false;
  uint8_t freeTotal = NUM_LEDS - (snakeLen - 1);

  for (uint8_t d = 0; d < 3; d++) {
    int8_t nx = snakeX[0] + dirs[d][0];
    int8_t ny = snakeY[0] + dirs[d][1];
    if (!snakeInBounds(nx, ny)) continue;
    if (snakeHitsSelf(nx, ny))  continue;
    anyValid = true;

    bool    tailReach = false;
    uint8_t appleDist = 255;
    uint8_t space     = snakeFloodFill(nx, ny, tailReach, appleDist);
    int     tDist     = abs(nx - snakeX[snakeLen-1]) + abs(ny - snakeY[snakeLen-1]);

    if (tailReach && appleDist < 255) {
      if (appleDist < t1Dist || (appleDist == t1Dist && space > t1Space))
        { t1Dist = appleDist; t1Space = space; t1X = nx; t1Y = ny; }
    } else if (appleDist < 255 && space * 2 >= freeTotal) {
      if (appleDist < t2Dist || (appleDist == t2Dist && space > t2Space))
        { t2Dist = appleDist; t2Space = space; t2X = nx; t2Y = ny; }
    }
    if (tDist < survDist)   { survDist = tDist;   survX = nx; survY = ny; }
    if (space > fallSpace)  { fallSpace = space;  fallX = nx; fallY = ny; }
  }

  if (!anyValid) { snakeDie(); return; }

  int8_t chosenX, chosenY;
  if      (t1X >= 0)   { chosenX = t1X;   chosenY = t1Y;   }
  else if (t2X >= 0)   { chosenX = t2X;   chosenY = t2Y;   }
  else if (survX >= 0) { chosenX = survX; chosenY = survY; }
  else                 { chosenX = fallX; chosenY = fallY; }

  snakeDirX = chosenX - snakeX[0];
  snakeDirY = chosenY - snakeY[0];
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

  bool userPaused = userControl && (tick - userTakeoverTick) < MS_TO_TICKS(SNAKE_USER_PAUSE_MS);

  if (!userPaused && (tick % MS_TO_TICKS(SNAKE_STEP_MS)) == 0) {
    if (userControl) snakeApplyUserTurn();
    else             snakeChooseDir();
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

    // AI mode validates pre-move in snakeChooseDir, so this only fires in user mode.
    if (userControl) {
      for (uint8_t i = 1; i < snakeLen; i++) {
        if (snakeX[i] == snakeX[0] && snakeY[i] == snakeY[0]) {
          snakeDie();
          return;
        }
      }
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

  // Pre-compute user-mode body color factors (only used when userControl).
  // Pause: hard white flash on/off — clear "system handed over" cue.
  // Active: red body with sin-wave brightness pulse and a tiny hue spread along the
  // body (red→amber) so it still feels alive instead of dead-flat.
  bool userFlashOn = false;
  uint8_t userPulseBright = 0;
  if (userControl) {
    if (userPaused) {
      userFlashOn = ((tick / MS_TO_TICKS(SNAKE_USER_BLINK_MS)) % 2) != 0;
    } else {
      float ph = (float)(tick % MS_TO_TICKS(SNAKE_USER_BODY_PULSE_MS))
                 / MS_TO_TICKS(SNAKE_USER_BODY_PULSE_MS) * 2.0f * PI;
      userPulseBright = 80 + (uint8_t)(87.5f * (1.0f + sinf(ph)));  // 80..255
    }
  }

  for (uint8_t i = 0; i < snakeLen; i++) {
    uint32_t c;
    if (userControl) {
      if (userPaused) {
        uint8_t b = userFlashOn ? 255 : 30;
        c = strip.Color(b, b, b);
      } else if (i == 0) {
        c = strip.Color(255, 255, 255);
      } else {
        uint16_t hue = (uint16_t)(i * 3) << 8;     // 0 → ~21 (red → amber)
        c = strip.ColorHSV(hue, 255, userPulseBright);
      }
    } else {
      uint8_t hueVal = i * (256 / snakeLen);
      uint8_t bright = (i == 0) ? 255 : 180;
      c = paletteColor(hueVal, 255, bright);
    }
    strip.setPixelColor(xy(snakeX[i], snakeY[i]), c);
  }
}

// =============================================================
// Pattern 9: Bouncing balls with trails
// =============================================================
// NUM_BALLS is the capacity; ballsActive starts at NUM_BALLS_INITIAL and grows
// on short-press up to capacity, then wraps round-robin (replaces oldest).
#define NUM_BALLS         6
#define NUM_BALLS_INITIAL 2

float ballX[NUM_BALLS], ballY[NUM_BALLS];
float ballVX[NUM_BALLS], ballVY[NUM_BALLS];
uint8_t ballHue[NUM_BALLS];
uint8_t ballTrailBright[NUM_LEDS];
uint8_t ballTrailHue[NUM_LEDS];
bool    ballsInited  = false;
uint8_t ballsActive  = 0;
uint8_t ballNextSlot = 0;  // round-robin replacement index once at capacity

static void ballSpawn(uint8_t slot, uint8_t hue) {
  ballX[slot]  = 2.0f + random(4);  // 2–5: away from all edges/corners
  ballY[slot]  = 2.0f + random(4);
  // Non-overlapping ranges guarantee |VX| != |VY|, breaking diagonal lock
  float spdX = (0.20f + random(4) * 0.10f) * BALL_SPEED_SCALE;
  float spdY = (0.25f + random(4) * 0.10f) * BALL_SPEED_SCALE;
  ballVX[slot] = spdX * (random(2) ? 1.0f : -1.0f);
  ballVY[slot] = spdY * (random(2) ? 1.0f : -1.0f);
  ballHue[slot] = hue;
}

void ballsInit() {
  ballsActive  = NUM_BALLS_INITIAL;
  ballNextSlot = 0;
  for (uint8_t i = 0; i < NUM_BALLS_INITIAL; i++) ballSpawn(i, i * 128);  // opposite hues
  memset(ballTrailBright, 0, NUM_LEDS);
  ballsInited = true;
}

void patternBalls() {
  if (!ballsInited) ballsInit();

  // Each detent nudges every ball's horizontal velocity — fast spin = fast balls.
  // Clamped so we don't run past the per-tick stability of the bounce step.
  if (pendingInput != 0) {
    float kick = (float)pendingInput * 0.05f * BALL_SPEED_SCALE;
    for (uint8_t i = 0; i < ballsActive; i++) {
      ballVX[i] += kick;
      if (ballVX[i] >  0.7f * BALL_SPEED_SCALE) ballVX[i] =  0.7f * BALL_SPEED_SCALE;
      if (ballVX[i] < -0.7f * BALL_SPEED_SCALE) ballVX[i] = -0.7f * BALL_SPEED_SCALE;
    }
    pendingInput = 0;
  }

  // Short-press → spawn a new ball; round-robin replace once at capacity.
  if (btnAction) {
    uint8_t slot;
    if (ballsActive < NUM_BALLS) {
      slot = ballsActive++;
    } else {
      slot = ballNextSlot;
      ballNextSlot = (ballNextSlot + 1) % NUM_BALLS;
    }
    ballSpawn(slot, random(256));
    btnAction = false;
  }

  for (uint8_t i = 0; i < NUM_LEDS; i++) {
    if (ballTrailBright[i] > BALL_TRAIL_FADE) ballTrailBright[i] -= BALL_TRAIL_FADE;
    else ballTrailBright[i] = 0;
  }

  for (uint8_t i = 0; i < ballsActive; i++) {
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
  for (uint8_t i = 0; i < ballsActive; i++) {
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

  // Encoder tunes the a-ratio directly (tiny turns → big visual change).
  // Idle → fall back to the slow auto-drift so the pattern stays alive.
  static float userA = 2.0f;
  if (pendingInput != 0) {
    userA += pendingInput * 0.08f;
    if (userA < 0.5f) userA = 0.5f;
    if (userA > 4.5f) userA = 4.5f;
    pendingInput = 0;
  }
  float a = userActive()
    ? userA
    : 2.0f + 0.7f * sinf(tick * (LISS_DRIFT_SPEED * TICK_MS / 1000.0f));
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
// Pattern 11: Ripple (stone-drop water rings)
// One ripple at a time.  The encoder scrubs its age — forward extends the wavefront
// outward; backward pulls it back toward the drop point.  On forward wrap past
// lifetime, a new ripple spawns at a random location with the next hue.  Backward
// clamps at age 0 (you can't rewind past the drop).  Idle auto-advances at the
// original wave speed.
static float         ripCx       = 3.5f;
static float         ripCy       = 3.5f;
static uint8_t       ripHue      = 0;
static long          ripAge      = 0;   // in ticks; [0, lifetime]
static bool          rippleInited = false;

static void rippleRespawn() {
  ripCx  = (float)random(GRID_W);
  ripCy  = (float)random(GRID_H);
  ripHue = (ripHue + 64) & 0xFF;  // cycle red/green/cyan/magenta so consecutive ripples contrast
  ripAge = 0;
}

void patternRipple() {
  const long lifetimeTicks = MS_TO_TICKS(RIPPLE_LIFETIME_MS);

  if (!rippleInited) {
    ripCx  = (float)random(GRID_W);
    ripCy  = (float)random(GRID_H);
    ripHue = (uint8_t)random(256);
    ripAge = 0;
    rippleInited = true;
  }

  // User scrub: each detent = ~1/16 of the lifetime (smooth hand-over-hand pacing).
  if (pendingInput != 0) {
    ripAge += (long)pendingInput * (lifetimeTicks / 16);
    pendingInput = 0;
  }
  // Short-press → drop a fresh stone at a new random spot, immediately.
  if (btnAction) {
    rippleRespawn();
    btnAction = false;
  }
  // Idle: auto-advance at one tick per tick (matches RIPPLE_SPEED_PPS timing).
  if (!userActive()) ripAge++;

  // Forward wrap → new ripple; preserve overshoot so fast scrubbing glides through.
  while (ripAge >= lifetimeTicks) {
    ripAge -= lifetimeTicks;
    rippleRespawn();
  }
  if (ripAge < 0) ripAge = 0;

  // Render — single-ripple wavefront with wake fade and age envelope (same math as before).
  clearGrid();
  const float wavePerTick = RIPPLE_SPEED_PPS * TICK_MS / 1000.0f;
  float waveFront = ripAge * wavePerTick;
  float ageFrac   = (float)ripAge / (float)lifetimeTicks;
  float ageEnv    = (ageFrac < 0.70f) ? 1.0f : (1.0f - ageFrac) / 0.30f;

  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      float dx = (float)x - ripCx;
      float dy = (float)y - ripCy;
      float dist = sqrtf(dx*dx + dy*dy);
      float fromFront = dist - waveFront;
      if (fromFront > 0.5f || fromFront < -RIPPLE_FADE_DIST) continue;

      float phase     = (fromFront / RIPPLE_WAVELENGTH) * (2.0f * PI);
      float ringVal   = cosf(phase);
      float wakeDecay = 1.0f - (-fromFront / RIPPLE_FADE_DIST);
      float brightness = fabsf(ringVal * wakeDecay * ageEnv) * 220.0f;

      if (brightness > 1.0f) {
        uint8_t b = (brightness > 255.0f) ? 255 : (uint8_t)brightness;
        strip.setPixelColor(xy(x, y), paletteColor(ripHue, 225, b));
      }
    }
  }
}

// =============================================================
// Pattern 12: Tetris (autonomous AI demo)
// =============================================================

// [type][rotation][cell] = {dx, dy} from bounding-box top-left; y grows downward
static const int8_t TPIECES[7][4][4][2] = {
  // I
  {{{0,0},{1,0},{2,0},{3,0}}, {{0,0},{0,1},{0,2},{0,3}},
   {{0,0},{1,0},{2,0},{3,0}}, {{0,0},{0,1},{0,2},{0,3}}},
  // O
  {{{0,0},{1,0},{0,1},{1,1}}, {{0,0},{1,0},{0,1},{1,1}},
   {{0,0},{1,0},{0,1},{1,1}}, {{0,0},{1,0},{0,1},{1,1}}},
  // T
  {{{0,0},{1,0},{2,0},{1,1}}, {{0,0},{0,1},{1,1},{0,2}},
   {{1,0},{0,1},{1,1},{2,1}}, {{1,0},{0,1},{1,1},{1,2}}},
  // S
  {{{1,0},{2,0},{0,1},{1,1}}, {{0,0},{0,1},{1,1},{1,2}},
   {{1,0},{2,0},{0,1},{1,1}}, {{0,0},{0,1},{1,1},{1,2}}},
  // Z
  {{{0,0},{1,0},{1,1},{2,1}}, {{1,0},{0,1},{1,1},{0,2}},
   {{0,0},{1,0},{1,1},{2,1}}, {{1,0},{0,1},{1,1},{0,2}}},
  // J
  {{{0,0},{0,1},{1,1},{2,1}}, {{0,0},{1,0},{0,1},{0,2}},
   {{0,0},{1,0},{2,0},{2,1}}, {{1,0},{1,1},{0,2},{1,2}}},
  // L
  {{{2,0},{0,1},{1,1},{2,1}}, {{0,0},{0,1},{0,2},{1,2}},
   {{0,0},{1,0},{2,0},{0,1}}, {{0,0},{1,0},{1,1},{1,2}}},
};

// Non-zero hues (0 means empty in tetBoard)
static const uint8_t TPIECE_HUES[7] = { 128, 42, 192, 85, 4, 170, 16 };

uint8_t       tetBoard[GRID_H][GRID_W];
int8_t        tetPX, tetPY;
uint8_t       tetPType, tetPRot, tetPHue;
int8_t        tetTX;            // AI target column
uint8_t       tetState;         // 0=active  1=clearing  2=gameover
uint16_t      tetTick;          // ticks since state entry
uint8_t       tetClearMask;     // rows being cleared (bitmask, bit 0 = row 0)
unsigned long tetNextFallAt;    // tick at which the next gravity step is allowed
bool          tetInited = false;

bool tetValid(int8_t px, int8_t py, uint8_t type, uint8_t rot) {
  for (uint8_t c = 0; c < 4; c++) {
    int8_t x = px + TPIECES[type][rot][c][0];
    int8_t y = py + TPIECES[type][rot][c][1];
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return false;
    if (tetBoard[y][x]) return false;
  }
  return true;
}

// Drop piece to lowest valid Y from y=0; returns -1 if y=0 is already blocked
int8_t tetDropY(int8_t px, uint8_t type, uint8_t rot) {
  if (!tetValid(px, 0, type, rot)) return -1;
  int8_t py = 0;
  while (tetValid(px, py + 1, type, rot)) py++;
  return py;
}

// Score board after simulating a placement; clears full rows in tmp before scoring.
// Precondition: all cells (px+dx, py+dy) are in bounds — guaranteed by tetDropY caller.
// Weights tuned toward Dellacherie/El-Tetris findings: holes are severely punished,
// aggregate height moderately, bumpiness lightly.
int tetEval(int8_t px, int8_t py, uint8_t type, uint8_t rot) {
  uint8_t tmp[GRID_H][GRID_W];
  memcpy(tmp, tetBoard, sizeof(tetBoard));
  for (uint8_t c = 0; c < 4; c++)
    tmp[py + TPIECES[type][rot][c][1]][px + TPIECES[type][rot][c][0]] = 1;

  int lines = 0;
  for (int8_t y = GRID_H - 1; y >= 0; y--) {
    bool full = true;
    for (uint8_t x = 0; x < GRID_W; x++) { if (!tmp[y][x]) { full = false; break; } }
    if (full) {
      lines++;
      for (int8_t r = y; r > 0; r--) memcpy(tmp[r], tmp[r-1], GRID_W);
      memset(tmp[0], 0, GRID_W);
      y++;
    }
  }

  int colH[GRID_W] = {};
  int aggregate_h = 0, max_h = 0, holes = 0, hole_depth = 0;
  for (uint8_t x = 0; x < GRID_W; x++) {
    bool found = false;
    int depth = 0;
    for (uint8_t y = 0; y < GRID_H; y++) {
      if (tmp[y][x]) {
        if (!found) { colH[x] = GRID_H - y; aggregate_h += colH[x]; if (colH[x] > max_h) max_h = colH[x]; found = true; }
        depth++;
      } else if (found) {
        holes++;
        hole_depth += depth;
      }
    }
  }
  int bumpiness = 0;
  for (uint8_t x = 0; x < GRID_W - 1; x++)
    bumpiness += abs(colH[x] - colH[x + 1]);
  return lines * 800 - aggregate_h * 50 - max_h * 30 - holes * 320 - hole_depth * 40 - bumpiness * 18;
}

void tetRunAI() {
  int bestScore = -30000;
  tetTX = tetPX;

  for (uint8_t rot = 0; rot < 4; rot++) {
    // All piece cell offsets are >= 0, so minDX is always 0 and px starts at 0
    int8_t maxDX = 0;
    for (uint8_t c = 0; c < 4; c++)
      if (TPIECES[tetPType][rot][c][0] > maxDX) maxDX = TPIECES[tetPType][rot][c][0];
    for (int8_t px = 0; px <= GRID_W - 1 - maxDX; px++) {
      int8_t py = tetDropY(px, tetPType, rot);
      if (py < 0) continue;
      int score = tetEval(px, py, tetPType, rot);
      if (score > bestScore) {
        bestScore = score;
        tetTX     = px;
        tetPRot   = rot;
      }
    }
  }
}

void tetSpawn() {
  tetPType = random(7);
  tetPHue  = TPIECE_HUES[tetPType];
  tetPRot  = 0;

  int8_t maxDX = 0;
  for (uint8_t c = 0; c < 4; c++)
    if (TPIECES[tetPType][0][c][0] > maxDX) maxDX = TPIECES[tetPType][0][c][0];
  tetPX = (GRID_W - maxDX - 1) / 2;
  tetPY = 0;

  if (userControl) {
    // No AI: piece spawns centered with rot 0; encoder just translates it.
    tetTX = tetPX;
  } else {
    tetRunAI();      // sets tetPRot, tetTX
    tetPX = tetTX;   // spawn directly at target column
  }

  if (!tetValid(tetPX, tetPY, tetPType, tetPRot)) {
    tetState = 2; tetTick = 0;
    return;
  }
  tetState = 0; tetTick = 0;
  tetNextFallAt = tick + MS_TO_TICKS(TETRIS_FALL_MS);
}

void patternTetris() {
  if (!tetInited) {
    memset(tetBoard, 0, sizeof(tetBoard));
    tetState = 0; tetTick = 0;
    userControl = false;
    pendingInput = 0;
    updateOnboardDot();
    tetSpawn();
    tetInited = true;
  }

  // Drain queued encoder input as horizontal piece moves (only while a piece is falling).
  // Each pending unit is one cell — multiple units stacked between frames let the user
  // slide the piece across the board fast.
  if (tetState == 0 && pendingInput != 0) {
    int dir = (pendingInput > 0) ? 1 : -1;
    int steps = (pendingInput > 0) ? pendingInput : -pendingInput;
    for (int i = 0; i < steps; i++) {
      if (tetValid(tetPX + dir, tetPY, tetPType, tetPRot)) tetPX += dir;
      else break;
    }
    pendingInput = 0;
    tetTX = tetPX;  // keep AI target in sync so it doesn't fight the user if mode flips
  }

  // Short-press → rotate falling piece CW with a 1-cell wall-kick (in-place, then ±1 x).
  // Each successful rotation also pushes the next gravity step out by
  // TETRIS_ROTATE_GRACE_MS so the user gets time to reorient without burning rows.
  if (tetState == 0 && btnAction) {
    uint8_t newRot = (tetPRot + 1) & 0x3;
    bool rotated = false;
    if      (tetValid(tetPX,     tetPY, tetPType, newRot))  { tetPRot = newRot; rotated = true; }
    else if (tetValid(tetPX - 1, tetPY, tetPType, newRot))  { tetPX--; tetPRot = newRot; rotated = true; }
    else if (tetValid(tetPX + 1, tetPY, tetPType, newRot))  { tetPX++; tetPRot = newRot; rotated = true; }
    tetTX = tetPX;
    if (rotated) tetNextFallAt = tick + MS_TO_TICKS(TETRIS_FALL_MS) + MS_TO_TICKS(TETRIS_ROTATE_GRACE_MS);
    if (!userControl) { userControl = true; userTakeoverTick = tick;
      updateOnboardDot(); Serial.println("user takes control"); }
    btnAction = false;
  }

  tetTick++;
  bool fallStep = (tetState == 0) && (tick >= tetNextFallAt);

  if (tetState == 0 && fallStep) {
    tetNextFallAt = tick + MS_TO_TICKS(TETRIS_FALL_MS);
    if (!userControl) {
      if (tetPX < tetTX && tetValid(tetPX + 1, tetPY, tetPType, tetPRot)) tetPX++;
      else if (tetPX > tetTX && tetValid(tetPX - 1, tetPY, tetPType, tetPRot)) tetPX--;
    }

    if (tetValid(tetPX, tetPY + 1, tetPType, tetPRot)) {
      tetPY++;
    } else {
      for (uint8_t c = 0; c < 4; c++) {
        uint8_t bx = tetPX + TPIECES[tetPType][tetPRot][c][0];
        uint8_t by = tetPY + TPIECES[tetPType][tetPRot][c][1];
        tetBoard[by][bx] = tetPHue;
      }
      Serial.print("tetris lock type="); Serial.print(tetPType);
      Serial.print(" rot="); Serial.print(tetPRot);
      Serial.print(" x="); Serial.print(tetPX);
      Serial.print(" y="); Serial.println(tetPY);

      uint8_t mask = 0;
      for (uint8_t y = 0; y < GRID_H; y++) {
        bool full = true;
        for (uint8_t x = 0; x < GRID_W; x++) { if (!tetBoard[y][x]) { full = false; break; } }
        if (full) mask |= (1 << y);
      }
      if (mask) {
        tetClearMask = mask; tetState = 1; tetTick = 0;
        Serial.print("tetris clear mask=0x"); Serial.println(mask, HEX);
      } else {
        tetSpawn();
      }
    }

  } else if (tetState == 1) {
    if (tetTick >= MS_TO_TICKS(TETRIS_CLEAR_MS)) {
      uint8_t newBoard[GRID_H][GRID_W];
      memset(newBoard, 0, sizeof(newBoard));
      int8_t dst = GRID_H - 1;
      for (int8_t src = GRID_H - 1; src >= 0; src--) {
        if (!(tetClearMask & (1 << src))) {
          memcpy(newBoard[dst], tetBoard[src], GRID_W);
          dst--;
        }
      }
      memcpy(tetBoard, newBoard, sizeof(tetBoard));
      tetClearMask = 0;
      tetSpawn();
    }

  } else if (tetState == 2) {
    if (tetTick >= MS_TO_TICKS(TETRIS_GAMEOVER_MS)) {
      memset(tetBoard, 0, sizeof(tetBoard));
      userControl = false;       // game over: AI takes back over for the next round
      pendingInput = 0;
      updateOnboardDot();
      tetSpawn();
    }
  }

  clearGrid();

  for (uint8_t y = 0; y < GRID_H; y++) {
    bool clearing = (tetState == 1) && (tetClearMask & (1 << y));
    for (uint8_t x = 0; x < GRID_W; x++) {
      if (!tetBoard[y][x]) continue;
      uint8_t bright;
      if (clearing) {
        bright = ((tetTick / MS_TO_TICKS(TETRIS_FLASH_MS)) % 2) ? 255 : 40;
      } else if (tetState == 2) {
        if (tetTick >= MS_TO_TICKS(TETRIS_BLINK_MS)) continue;      // explode phase: drawn below
        if ((tetTick / MS_TO_TICKS(TETRIS_BLINK_HALF_MS)) % 2) continue;  // blink off
        bright = 90;
      } else {
        bright = 180;
      }
      strip.setPixelColor(xy(x, y), paletteColor(tetBoard[y][x], 255, bright));
    }
  }

  if (tetState == 0) {
    uint32_t pieceColor = userControl ? strip.Color(255, 255, 255)
                                      : paletteColor(tetPHue, 255, 255);
    for (uint8_t c = 0; c < 4; c++) {
      int8_t x = tetPX + TPIECES[tetPType][tetPRot][c][0];
      int8_t y = tetPY + TPIECES[tetPType][tetPRot][c][1];
      if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H)
        strip.setPixelColor(xy(x, y), pieceColor);
    }
  }

  if (tetState == 2 && tetTick >= MS_TO_TICKS(TETRIS_BLINK_MS)) {
    uint16_t explodeTick = tetTick - MS_TO_TICKS(TETRIS_BLINK_MS);
    uint16_t explodeDur  = MS_TO_TICKS(TETRIS_EXPLODE_MS);
    float    tSec        = explodeTick * (TICK_MS / 1000.0f);
    for (uint8_t by = 0; by < GRID_H; by++) {
      for (uint8_t bx = 0; bx < GRID_W; bx++) {
        if (!tetBoard[by][bx]) continue;
        float dx  = (float)bx - 3.5f;
        float dy  = (float)by - 3.5f;
        float mag = sqrtf(dx*dx + dy*dy);
        float nx  = bx + (dx / mag) * 18.0f * tSec;
        float ny  = by + (dy / mag) * 18.0f * tSec;
        int8_t px = (int8_t)floorf(nx + 0.5f);
        int8_t py = (int8_t)floorf(ny + 0.5f);
        if (px < 0 || px >= GRID_W || py < 0 || py >= GRID_H) continue;
        uint16_t elapsed    = min(explodeTick, explodeDur);
        uint8_t  fadeBright = (uint8_t)(200UL * (explodeDur - elapsed) / explodeDur);
        if (fadeBright > 0)
          strip.setPixelColor(xy(px, py), paletteColor(tetBoard[by][bx], 255, fadeBright));
      }
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

#if ENC_TRACE_ENABLED
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
#endif

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
  onboardDot.setBrightness(200);   // bright enough to be obvious under room light
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
#if POT_SPEED_MODE
    Serial.println("POT_SPEED_MODE=1  pot controls speed, brightness fixed at DEFAULT_BRIGHT");
#endif
  }

  // Auto-timeout: drop back to autonomous mode after the per-pattern silence window.
  if (userActiveFlag && (tick - lastInputTick) >= userActivityWindowTicks()) {
    userActiveFlag = false;
    Serial.println("user inactive (timeout)");
  }

#if POT_SPEED_MODE
  // --- Potentiometer → speed (dev mode) ---
  // Middle position (pot≈512) = TICK_MS (default speed).
  // Left half (0–511): 100ms → 10ms  Right half (512–1023): 10ms → 1ms
  uint16_t potVal = analogRead(POT_PIN);
  uint16_t tickDelayMs;
  if (potVal <= 511) {
    tickDelayMs = 100 - (uint16_t)potVal * 90 / 511;
  } else {
    tickDelayMs = 10 - (uint16_t)(potVal - 512) * 8 / 511;
  }
  if (tickDelayMs < 1) tickDelayMs = 1;
  strip.setBrightness(DEFAULT_BRIGHT);
  static uint16_t lastReportedDelay = 0;
  if ((uint16_t)abs((int)tickDelayMs - (int)lastReportedDelay) > 1) {
    Serial.print("tick_ms="); Serial.println(tickDelayMs);
    lastReportedDelay = tickDelayMs;
  }
#else
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
#endif

  // --- Encoder → game input (left/right) ---
  // Read raw position and ISR debug counters in one critical section.
  static int lastLogPos = 0;

  noInterrupts();
  int      pos     = encPos;
  uint16_t cw      = encCW;
  uint16_t ccw     = encCCW;
  uint16_t bounced = encBounced;
  uint16_t noise   = encNoise;
  interrupts();

  if (pos != lastLogPos) {
    Serial.print("enc pos="); Serial.print(pos);
    Serial.print(" delta="); Serial.print(pos - lastLogPos);
    if (pos % ENC_COUNTS_PER_DETENT != 0) Serial.print(" [partial]");
    Serial.println();
    lastLogPos = pos;
  }

  // Convert raw count delta to discrete input events.  Threshold 3 catches a click
  // that lost one edge; anchor advances by a full detent so a click that produced
  // 5 raw counts still registers as exactly one input.
  bool gamePattern = (currentPattern == 8) || (currentPattern == 12);
  int rawDelta = pos - inputAnchor;
  while (rawDelta >= GAME_INPUT_THRESHOLD) {
    pendingInput++;
    inputAnchor += ENC_COUNTS_PER_DETENT;
    rawDelta = pos - inputAnchor;
    lastInputTick  = tick;
    userActiveFlag = true;
    if (gamePattern && !userControl) { userControl = true; userTakeoverTick = tick;
      updateOnboardDot(); Serial.println("user takes control"); }
  }
  while (rawDelta <= -GAME_INPUT_THRESHOLD) {
    pendingInput--;
    inputAnchor -= ENC_COUNTS_PER_DETENT;
    rawDelta = pos - inputAnchor;
    lastInputTick  = tick;
    userActiveFlag = true;
    if (gamePattern && !userControl) { userControl = true; userTakeoverTick = tick;
      updateOnboardDot(); Serial.println("user takes control"); }
  }
  // Patterns that don't consume pendingInput just leave it; it's cleared on pattern change.

  // --- Button: short-press = action (consumed by pattern), hold = next sketch ---
  // Hold path fires once when the threshold is crossed, mid-press; release after that
  // is a no-op.  Release-before-threshold sets btnAction for the active pattern.
  static int           lastBtnLevel = HIGH;
  static unsigned long btnDownAt    = 0;
  static bool          btnLongFired = false;
  int btnLevel = digitalRead(ENC_BTN);
  unsigned long nowMs = millis();

  if (lastBtnLevel == HIGH && btnLevel == LOW && nowMs - lastBtnPress > 50) {
    lastBtnPress = nowMs;
    btnDownAt    = nowMs;
    btnLongFired = false;
  }
  if (btnLevel == LOW && !btnLongFired && nowMs - btnDownAt >= BTN_HOLD_MS) {
    btnLongFired = true;
    currentPattern = (currentPattern + 1) % NUM_PATTERNS;
    clearGrid();
    strip.show();
    blinkRedLed();
    snakeInited   = false;
    exploding     = false;
    showingLength = false;
    ballsInited   = false;
    rippleInited  = false;
    tetInited     = false;
    userControl    = false;
    userActiveFlag = false;  // new sketch starts in autonomous mode
    pendingInput   = 0;
    btnAction      = false;
    inputAnchor    = pos;    // ignore any drift from previous pattern
    // Clear trail arrays so leftover pixels don't flicker on re-entry
    memset(sparkleBright, 0, sizeof(sparkleBright));
    memset(lissTrail,     0, sizeof(lissTrail));
    updateOnboardDot();
    Serial.print("pattern -> "); Serial.print(currentPattern);
    Serial.print(" ("); Serial.print(PATTERN_NAMES[currentPattern]);
    Serial.print(") cw="); Serial.print(cw);
    Serial.print(" ccw="); Serial.print(ccw);
    Serial.print(" bnc="); Serial.print(bounced);
    Serial.print(" nse="); Serial.println(noise);
  }
  if (lastBtnLevel == LOW && btnLevel == HIGH && !btnLongFired) {
    btnAction      = true;
    lastInputTick  = tick;
    userActiveFlag = true;
    Serial.println("btn action");
  }
  lastBtnLevel = btnLevel;

  // --- Red LED: solid-on while user has game control; transient blinks otherwise ---
  bool redSolid = userControl;
  bool redTransient = (redLedOff > 0 && millis() < redLedOff);
  digitalWrite(RED_LED_PIN, (redSolid || redTransient) ? HIGH : LOW);
  if (redLedOff > 0 && millis() >= redLedOff) redLedOff = 0;

  // --- Run current pattern ---
  switch (currentPattern) {
    case 0:  patternCheckerboard(); break;
    case 1:  patternBreathe();      break;
    case 2:  patternSweep();        break;
    case 3:  patternRings();        break;
    case 4:  patternSparkle();      break;
    case 5:  patternFace();         break;
    case 6:  patternRainbow();      break;
    case 7:  patternSpiral();       break;
    case 8:  patternSnake();        break;
    case 9:  patternBalls();        break;
    case 10: patternLissajous();    break;
    case 11: patternRipple();       break;
    case 12: patternTetris();       break;
  }
  // Drop any unconsumed short-press so it doesn't fire spuriously on a later frame
  // or after a pattern change.  btnAction is strictly a same-tick event.
  btnAction = false;
  strip.show();

  if (tick % DEBUG_INTERVAL == 0) {
    Serial.print("tick="); Serial.print(tick);
    Serial.print(" pat="); Serial.print(PATTERN_NAMES[currentPattern]);
    Serial.print(" pal="); Serial.print(PALETTE_NAMES[currentPalette]);
#if POT_SPEED_MODE
    Serial.print(" tick_ms="); Serial.println(tickDelayMs);
#else
    Serial.print(" bright="); Serial.println(bright);
#endif
  }

  tick++;
#if POT_SPEED_MODE
  delay(tickDelayMs);
#else
  delay(TICK_MS);
#endif
}
