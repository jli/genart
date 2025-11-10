#include <Arduino.h>
#include <Adafruit_DotStar.h>

#define POT1 A2
#define POT2 A0
#define POT3 A1

Adafruit_DotStar strip = Adafruit_DotStar(1, INTERNAL_DS_DATA, INTERNAL_DS_CLK, DOTSTAR_BGR);

void setup() {
  strip.begin();
}

void loop() {
  int p1 = analogRead(POT1);
  int p2 = analogRead(POT2);
  int p3 = analogRead(POT3);

  strip.setPixelColor(0, p1/4, p2/4, p3/4);
  strip.show();
  delay(100);
}
