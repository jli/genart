// TODO: cleanup digital display, make an option
// TODO: option: draw numbers around face
// TODO: think about how to make elements more customizable for easy live tweaking.. d3.js instead?

// design stuff
// TODO: coloring denoting sunrise/set times on clockface
// TODO: hour numbers inset at hour hand radius, minute/second numbers at second hand radius? or too much?
// TODO: full opacity for arcs. no monochrome.


/* consts */
// NOTE: change the size() call manually. processing.js :(
int size_w = 1000;
int size_h = 500;
int clock_radius = int(size_h * .48);
int clock_center_x_year = size_h/2;
int clock_center_x = size_w - size_h/2;
int clock_center_y = size_h / 2;
int text_size = 12;
float hand_len_sec = clock_radius * 0.85 *2;
float hand_len_minute = clock_radius * 0.65 *2;
float hand_len_hour = clock_radius * 0.4 *2;
float hand_len_day = clock_radius * 0.8 *2;
float hand_len_month = clock_radius * 0.5 *2;

boolean show_clock_circle = false;

color fg = #cccccc;
color bg = #111111;
int text_alpha = 200;
color hand_color_sec = #333333;
color hand_color_minute = #555555;
color hand_color_hour = #aaaaaa;
color hand_color_day = #777777;
color hand_color_month = #bbbbbb;


int clock_weight = 2;
/*
int hand_weight_sec = 2;
int hand_weight_minute = 7;
int hand_weight_hour = 12;
int hand_weight_day = 15;
int hand_weight_month = 20;
*/
int hand_weight_sec = 6;
int hand_weight_minute = 6;
int hand_weight_hour = 6;
int hand_weight_day = 4;
int hand_weight_month = 4;

boolean dbg = false;
boolean dbg_fast_clock = false;

/* options */
// TODO: better name
boolean proportional = true;
boolean are_there_24_hours_in_a_day = true;
boolean milli_precision = false;

/* variable state */
int gMilli = millis();
int gMilli_prev_sec = millis(); // needed to calculate gMilli
int gSecond = second();
int gMinute = minute();
int gHour = hour();
int gDay = day();
int gMonth = month();


/* helpers */
int bound(int lower, int upper, int v) {
  return max(lower, min(upper, v));
}

int torusify(int lower, int upper, int v) {
  if (v < lower) return upper;
  else if (v > upper) return lower;
  else return v;
}

boolean divides(int x, int y) {
  return (y % x == 0);
}

int days_in_month(int year, int month) {
  switch(month) {
    case 1: case 3: case 5: case 7:
    case 8: case 10: case 12:
      return 31;
    case 2:
      if (divides(400, year)
          || (divides(4, year) && !divides(100, year)))
        return 29;
      else return 28;
    default:
      return 30;
  }
}

String month_name(int month) {
  switch(month) {
    case 1: return "jan";
    case 2: return "feb";
    case 3: return "mar";
    case 4: return "apr";
    case 5: return "may";
    case 6: return "jun";
    case 7: return "jul";
    case 8: return "aug";
    case 9: return "sep";
    case 10: return "oct";
    case 11: return "nov";
    case 12: return "dec";
    default: return "WTF";
  }
}

PVector clock_hand_position(float proportion) {
  // negation because clockwise rotation is opposite of math convention
  // +PI/2 because start angle is at top (0,1) not to the right (1,0).
  float angle_rad = -proportion * 2*PI + PI/2;
  // negation for y coordinate because graphics grid is upside down (?!)
  return new PVector(cos(angle_rad), -sin(angle_rad));
}

void draw_hand(float proportion, PVector center, color c, int weight, float hand_len) {
  stroke(c);
  strokeWeight(2);
  PVector hand_position = clock_hand_position(proportion);
  /*
  line(center.x, center.y,
       center.x + hand_len * hand_position.x,
       center.y + hand_len * hand_position.y);
       */
  fill(c);
//  arc(center.x, center.y, hand_len, hand_len, -HALF_PI, proportion * TWO_PI - HALF_PI, PIE);
  arc(center.x, center.y, hand_len, hand_len, -HALF_PI, proportion * TWO_PI - HALF_PI);
}

void advance_clock() {
  gMonth = month();
  gDay = day();

  if (dbg_fast_clock) {
    gSecond += 20;
    if (60 <= gSecond) {
      gMinute += 1;
      gSecond = 0;
      if (60 <= gMinute) {
        gMinute = 0;
        gHour = torusify(0, 23, gHour + 1);
      }
    }
  } else {
    gHour = hour();
    gMinute = minute();

    if (!milli_precision) {
      gSecond = second();
    } else {
      int second2 = second();
      if (second2 != gSecond) {
        gSecond = second2;
        // new second, so reset millis.
        gMilli = 0;
        gMilli_prev_sec = millis();
      } else {
        gMilli = millis() - gMilli_prev_sec;
      }
    }
  }
}

/* LET'S GO! */
void draw() {
  //// update time
  advance_clock();

  if (dbg) println("-------DRAW!", gHour, gMinute, gSecond, gMilli);

  int num_hours = are_there_24_hours_in_a_day ? 24 : 12;

  background(bg);
  stroke(fg, 255);

  //// digital display
  fill(fg, text_alpha);
  // TODO: cleanup: positioning. constantify.
  // text(hour + ":" + minute + ":" + second + ":" + millis, 90, 15);
  //text(gMonth + "-" + gDay + " " + gHour + ":" + gMinute + ":" + gSecond, size_w/2, 15);
  text(nf(gMonth,2) + "-" + nf(gDay,2) + " " + nf(gHour,2) + ":" + nf(gMinute,2) + ":" + nf(gSecond,2), size_w/2, 15);

  //// year clock, numbers
  PVector year_clock_center = new PVector(clock_center_x_year, clock_center_y);
  // circle
  fill(bg);
  if (show_clock_circle) {
    strokeWeight(clock_weight);
    ellipse(year_clock_center.x, year_clock_center.y, clock_radius * 2, clock_radius * 2);
  }

  // hands
  float proportion_day = gDay * 1.0 / days_in_month(gMonth, year());
  float proportion_month = (gMonth-1 + (proportional ? proportion_day : 0)) / 12.0;
  draw_hand(proportion_day, year_clock_center, hand_color_day, hand_weight_day, hand_len_day);
  draw_hand(proportion_month, year_clock_center, hand_color_month, hand_weight_month, hand_len_month);

  // months
  fill(fg, text_alpha);
  for (int i = 1; i <= 12; ++i) {
    // -1 so jan is "noon"
    float month_num_proportion = float(i - 1) / 12;
    // TODO: hacky. make it better?
    float len = clock_radius * 0.93;
    PVector position = clock_hand_position(month_num_proportion);
    position.mult(len);
    position.add(year_clock_center);
    text(month_name(i), position.x, position.y);
  }

  //// day clock circle, numbers, hash marks
  PVector day_clock_center = new PVector(clock_center_x, clock_center_y);
  // circle
  fill(bg);
  if (show_clock_circle) {
    strokeWeight(clock_weight);
    ellipse(day_clock_center.x, day_clock_center.y, clock_radius * 2, clock_radius * 2);
  }

  // hours
  fill(fg, text_alpha);
  for (int i = 0; i < num_hours; ++i) {
    float hour_num_proportion = float(i) / num_hours;
    // TODO: hacky. make it better?
    float len = clock_radius * (i < 10 ? 0.96 : 0.95);
    PVector position = clock_hand_position(hour_num_proportion);
    position.mult(len);
    position.add(day_clock_center);
    text(i, position.x, position.y);
  }

  // 5 min hash marks
  /*
  stroke(fg);  // reset opacity
  PVector center = new PVector(clock_center_x, clock_center_y);
  for (int i = 0; i < 60; i += 5) {
    strokeWeight((i % 15 == 0) ? 4 : 2);
    PVector edge_pos = clock_hand_position(float(i) / 60);
    edge_pos.mult(clock_radius);
    edge_pos.add(day_clock_center);
    PVector inner_pos = PVector.lerp(edge_pos, center, 0.08);
    line(inner_pos.x, inner_pos.y, edge_pos.x, edge_pos.y);
  }
  */

  // hands
  float proportion_millis = gMilli / 1000.0;
  float proportion_sec = (gSecond + proportion_millis) / 60.0;
  float proportion_minute = (gMinute + (proportional ? proportion_sec : 0)) / 60.0;
  float proportion_hour = (gHour + (proportional ? proportion_minute : 0)) / float(num_hours);
  draw_hand(proportion_sec, day_clock_center, hand_color_sec, hand_weight_sec, hand_len_sec);
  draw_hand(proportion_minute, day_clock_center, hand_color_minute, hand_weight_minute, hand_len_minute);
  draw_hand(proportion_hour, day_clock_center, hand_color_hour, hand_weight_hour, hand_len_hour);
}

void setup() {
  //size(size_w, size_h);
  size(1000, 500);
  frameRate(dbg_fast_clock ? 100 : (milli_precision ? 15 : 1));
  textSize(text_size);
  textAlign(CENTER, CENTER);
}
