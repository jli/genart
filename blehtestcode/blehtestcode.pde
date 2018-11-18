void random_int_needs_plus_1() {
  // random() for generating int between x and y needs +1 if y should be included.
  for (int i = 0; i < 10; ++i) {
    println(int(random(1, 2+1)));
  }
}

// Always between 0 and 180.
void angleBetweenRange(){
  PVector a = new PVector(1, 0);
  for (int i = -180; i < 360+180; i += 30) {
    PVector b = PVector.fromAngle(radians(i));
    println("angle for", i, degrees(PVector.angleBetween(a, b)));
  }

}

void setup() {
  angleBetweenRange();
}
