#define BOARD_LED_PIN 13
#define MANUAL_BUTTON_TRIGGER_PIN 0
#define BEEPER_LED_PIN 1
#define FAN_MOSFET_PIN 2
#define ACCEL_PIN 3

// accel movements over this threshold will trigger the deterrence routine
const float ACCEL_THRESH = 10;
// delay at the end of loop()
const int LOOP_DELAY_MS = 100;
const int CYCLES_TO_DISABLE_AFTER_ACTIVATION = 50;
// from 0 to 255
const int MAX_FAN_SPEED = 120;

//// loop values:
// zmove_ewma tracks moving average of accelerometer Z reading changes.
float zmove_ewma = 0;
// previous Z reading to compute movement since last cycle.
int prev_z;
// when deterrence routine is triggered 
int disabled_for_cycles = 0;

void setup() {
  Serial.begin(9600);
  // 2025-11-10: disabled in final build
  // pinMode(MANUAL_BUTTON_TRIGGER_PIN, INPUT_PULLUP);
  pinMode(ACCEL_PIN, INPUT);
  pinMode(BOARD_LED_PIN, OUTPUT);
  pinMode(BEEPER_LED_PIN, OUTPUT);
  pinMode(FAN_MOSFET_PIN, OUTPUT);
  prev_z = analogRead(ACCEL_PIN);
  // start sound
  beep_n_flash(3, 30);
}

void loop() {
  // 2025-11-10: disabled in final build
  // // manual trigger
  // int button_val = digitalRead(MANUAL_BUTTON_TRIGGER_PIN);
  // if (button_val == LOW) {
  //   Serial.println("PRESSED");
  //   deter();
  // }

  // manage disabled time
  if (disabled_for_cycles > 0) {
    --disabled_for_cycles;
    // beep to signal re-enabled
    if (disabled_for_cycles == 0) {
      beep_n_flash(2, 100);
    }
  }

  // check for accel change to trigger deterrence routine
  int accel_z = analogRead(ACCEL_PIN);
  zmove_ewma = zmove_ewma * 0.5 + abs(prev_z - accel_z) * 0.5;
  prev_z = accel_z;
  Serial.println("Z:" + String(accel_z) + "; ewma:" + String(zmove_ewma) + "; disabled_for:" + String(disabled_for_cycles));
  if (zmove_ewma > ACCEL_THRESH && disabled_for_cycles == 0) {
    Serial.println("HIGH ZMOVE");
    deter();
    zmove_ewma = 0;
    disabled_for_cycles = CYCLES_TO_DISABLE_AFTER_ACTIVATION;
  }

  delay(LOOP_DELAY_MS);
}

void beep_n_flash(int n_beeps, int delay_ms) {
  for (int i=0; i < n_beeps; ++i) {
    digitalWrite(BOARD_LED_PIN, HIGH);
    digitalWrite(BEEPER_LED_PIN, HIGH);
    delay(delay_ms);
    digitalWrite(BOARD_LED_PIN, LOW);
    digitalWrite(BEEPER_LED_PIN, LOW);
    delay(delay_ms);
  }
}

void deter() {
  // beep and flash a bunch of times
  beep_n_flash(5, 50);
  // ramp up fan speed
  for (int ramp = 0; ramp <= MAX_FAN_SPEED; ramp+=10) {
    Serial.println("Ramping up: " + String(ramp));
    digitalWrite(BOARD_LED_PIN, HIGH);
    digitalWrite(BEEPER_LED_PIN, HIGH);
    analogWrite(FAN_MOSFET_PIN, ramp);
    delay(75);
    digitalWrite(BOARD_LED_PIN, LOW);
    digitalWrite(BEEPER_LED_PIN, LOW); 
    delay(75);
  }
  for (int ramp = MAX_FAN_SPEED; ramp >= 0; ramp-=10) {
    Serial.println("Ramping down: " + String(ramp));
    digitalWrite(BOARD_LED_PIN, HIGH);
    digitalWrite(BEEPER_LED_PIN, HIGH);
    analogWrite(FAN_MOSFET_PIN, ramp);
    delay(50);
    digitalWrite(BOARD_LED_PIN, LOW);
    digitalWrite(BEEPER_LED_PIN, LOW);
    delay(50);
  }
  analogWrite(FAN_MOSFET_PIN, 0);
} 