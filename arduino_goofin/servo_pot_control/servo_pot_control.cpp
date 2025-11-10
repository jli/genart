// the setup function runs once when you press reset or power the board

// void setup() {
//   // initialize digital pin 13 as an output.
//   pinMode(13, OUTPUT);
// }

// // the loop function runs over and over again forever
// void loop() {
//   digitalWrite(13, HIGH);   // turn the LED on (HIGH is the voltage level)
//   delay(50);              // wait for a second
//   digitalWrite(13, LOW);    // turn the LED off by making the voltage LOW
//   delay(150);              // wait for a second
// }
#include <Arduino.h>
#include <Servo.h>


#define ANALOGPIN      A1
#define SERVOPIN       3   // Servo control line (orange) on Trinket Pin #0
Servo servo;

int delayval = 100;        // delay for half a second

void control_servo(int pot_value) {
  int angle = pot_value /6;
  Serial.println(angle);
  if (angle <= 15) {
    servo.write(15);
  } else {
    servo.write(angle);
  }
}

void blink(int d) {
   digitalWrite(13, HIGH);   // turn the LED on (HIGH is the voltage level)
   delay(d);              // wait for a second
   digitalWrite(13, LOW);    // turn the LED off by making the voltage LOW
   delay(d);              // wait for a second
}

void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);   // open the serial port at 9600 bps
  servo.attach(SERVOPIN);
}

void loop() {
  int value = analogRead(ANALOGPIN); // analog read of potentiometer
  Serial.println(value);   // print value
  // servo.write(angle);
  control_servo(value);
  delay(delayval);         // Delay for a period of time (in milliseconds).
  // blink(value);

}
