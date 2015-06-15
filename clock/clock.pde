// TODO: cleanup digital display, make an option
// TODO: option: draw numbers around face

/* consts */
int size = 600;
int clock_radius = 200;
int clock_center = size/2;
float hand_len_sec = clock_radius * 0.9;
float hand_len_minute = clock_radius * 0.7;
float hand_len_hour = clock_radius * 0.5;
color fg = #dddddd;
color bg = #111111;

int clock_weight = 1;
int hand_weight_sec = 2;
int hand_weight_minute = 4;
int hand_weight_hour = 6;
boolean dbg = true;
boolean dbg_fast_clock = false;

/* options */
// TODO: better name
boolean proportional = true;
boolean are_there_24_hours_in_a_day = true;

/* variable state */
int second = second();
int minute = minute();
int hour = hour();

/* helpers */
int bound(int lower, int upper, int v) {
  return max(lower, min(upper, v));
}

int torusify(int lower, int upper, int v) {
  if (v < lower) return upper;
  else if (v > upper) return lower;
  else return v;
}

PVector clock_hand_position(float proportion, float hand_len) {
  // negation because clockwise rotation is opposite of math convention
  // +PI/2 because start angle is at top (0,1) not to the right (1,0).
  float angle_rad = -proportion * 2*PI + PI/2;
  // negation for y coordinate because graphics grid is upside down (?!)
  return new PVector(clock_center + hand_len * cos(angle_rad),
                     clock_center - hand_len * sin(angle_rad));
}

/* LET'S GO! */
void draw() {
  if (dbg) println("-------------------DRAW!", hour, minute, second);
  background(bg);

  if (dbg_fast_clock) {
    second += 20;
    if (60 == second) {
      second = 0;
      minute += 1;
      if (60 == minute) {
        minute = 0;
        hour = torusify(0, 24, hour + 1);
      }
    }
  } else {
    second = second();
    minute = minute();
    hour = hour();
  }


  fill(255);
  text(hour + ":" + minute + ":" + second, 100, 100);
  strokeWeight(clock_weight);
  fill(0);
  ellipse(clock_center, clock_center, clock_radius * 2, clock_radius * 2);

  strokeWeight(hand_weight_sec);
  float proportion_sec = second / 60.0;
  PVector hand_pos_sec = clock_hand_position(proportion_sec, hand_len_sec);
  line(clock_center, clock_center, hand_pos_sec.x, hand_pos_sec.y);

  strokeWeight(hand_weight_minute);
  float proportion_minute = (minute + (proportional ? proportion_sec : 0)) / 60.0;
  PVector hand_pos_min = clock_hand_position(proportion_minute, hand_len_minute);
  line(clock_center, clock_center, hand_pos_min.x, hand_pos_min.y);

  strokeWeight(hand_weight_hour);
  float proportion_hour = (hour + (proportional ? proportion_minute : 0))
                          / (are_there_24_hours_in_a_day ? 24.0 : 12.0);
  PVector hand_pos_hour = clock_hand_position(proportion_hour, hand_len_hour);
  line(clock_center, clock_center, hand_pos_hour.x, hand_pos_hour.y);

}

void setup() {
  size(size, size);
  frameRate(dbg_fast_clock ? 100 : 1);
  stroke(fg);
}
