// TODO: cleanup digital display, make an option
// TODO: option: draw numbers around face

// TODO: design: solid arcs tracing from 0 to current clock hands. different colors.
// TODO: design: coloring denoting sunrise/set times on clockface
// TODO: design: hour numbers inset at hour hand radius, minute/second numbers at second hand radius? or too much?

/* consts */
int size = 600;
int clock_radius = 200;
int clock_center = size/2;
float hand_len_sec = clock_radius * 0.75;
float hand_len_minute = clock_radius * 0.65;
float hand_len_hour = clock_radius * 0.4;
color fg = #dddddd;
color bg = #222222;

int clock_weight = 3;
int hand_weight_sec = 2;
int hand_weight_minute = 5;
int hand_weight_hour = 8;
boolean dbg = true;
boolean dbg_fast_clock = false;

/* options */
// TODO: better name
boolean proportional = true;
boolean are_there_24_hours_in_a_day = true;
boolean milli_precision = true;

/* variable state */
int millis = 0;
int global_millis_prev_sec = millis(); // need this to calculate millis
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
  if (dbg) println("-------DRAW!", hour, minute, second, millis);

  //// update time

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
    hour = hour();
    minute = minute();
    
    if (!milli_precision) {
      second = second();
    } else {
      int second2 = second();
      if (second2 != second) {
        second = second2;
        // new second, so reset millis.
        millis = 0;
        global_millis_prev_sec = millis();
      } else {
        millis = millis() - global_millis_prev_sec;
      }
    }
  }

  int num_hours = are_there_24_hours_in_a_day ? 24 : 12;

  background(bg);
  stroke(fg, 255);

  //// clock circle and numbers

  // circle
  fill(bg);
  strokeWeight(clock_weight);
  ellipse(clock_center, clock_center, clock_radius * 2, clock_radius * 2);

  // digital display
  fill(fg);
  // TODO: cleanup: positioning. constantify.
  // text(hour + ":" + minute + ":" + second + ":" + millis, 90, 15);
  text(hour + ":" + minute + ":" + second, 90, 15);
 
  // numbers
  for (int i = 0; i < num_hours; ++i) {
    float hour_num_proportion = float(i) / num_hours;
    PVector position = clock_hand_position(hour_num_proportion, clock_radius*0.85);
    text(i, position.x, position.y);
  }

  // 5 min hash marks
  PVector center = new PVector(clock_center, clock_center);
  for (int i = 0; i < 60; i += 5) {
    strokeWeight((i % 15 == 0) ? 3 : 1);
    PVector edge_pos = clock_hand_position(float(i) / 60, clock_radius);
    PVector inner_pos = PVector.lerp(edge_pos, center, 0.05);
    line(inner_pos.x, inner_pos.y, edge_pos.x, edge_pos.y);
  }
  

  //// draw hands
  stroke(fg, 100);
  strokeWeight(hand_weight_sec);
  float proportion_millis = (millis) / 1000.0;
  float proportion_sec = (second + proportion_millis) / 60.0;
  PVector hand_pos_sec = clock_hand_position(proportion_sec, hand_len_sec);
  line(clock_center, clock_center, hand_pos_sec.x, hand_pos_sec.y);

  stroke(fg, 150);
  strokeWeight(hand_weight_minute);
  float proportion_minute = (minute + (proportional ? proportion_sec : 0)) / 60.0;
  PVector hand_pos_min = clock_hand_position(proportion_minute, hand_len_minute);
  line(clock_center, clock_center, hand_pos_min.x, hand_pos_min.y);

  stroke(fg, 200);
  strokeWeight(hand_weight_hour);
  float proportion_hour = (hour + (proportional ? proportion_minute : 0)) / float(num_hours);
  PVector hand_pos_hour = clock_hand_position(proportion_hour, hand_len_hour);
  line(clock_center, clock_center, hand_pos_hour.x, hand_pos_hour.y);
}

void setup() {
  size(size, size);
  frameRate(dbg_fast_clock ? 100 : (milli_precision ? 30 : 1));
  // TODO: cleanup: constantify
  textSize(20);
  textAlign(CENTER, CENTER);
}
