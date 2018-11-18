void random_int_needs_plus_1() {
  // random() for generating int between x and y needs +1 if y should be included.
  for (int i = 0; i < 10; ++i) {
    println(int(random(1, 2+1)));
  }
}

void setup() {
}
