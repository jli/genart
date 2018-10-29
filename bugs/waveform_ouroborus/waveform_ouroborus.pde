int w = 500;
int h = 500;
color bg = color(#CCCCCC);

void setup() {
  size(100, 100);
  surface.setSize(w, h);
  frameRate(30);
}

int steps = 200;
float theta_step = TWO_PI/steps;
float theta = 0;
float ouro_rad = w/5;

float sig(float p) {
  return (sin(p*3) + sin(p*7) + sin(p*12));
}

/* BUG! lines are messed up! looks like lines start from origin
   instead of previous point? kind of interesting effect though :)
*/
void draw() {
  background(bg);

  strokeWeight(2);
  float t = 0;
  for (int step = 0; step < steps; ++step) {
    t+=theta_step;
    float r1 = t;
    float r2 = t + theta;
    float perc = (float)step / steps;
    float alpha = lerp(0, 255, perc);

    // circle
    stroke(225, 10, 10, alpha);
    line(w/2 + ouro_rad*cos(r1), h/2 - ouro_rad*sin(r1),
         w/2 + ouro_rad*cos(r2), h/2 - ouro_rad*sin(r2));

    // signal
    PVector vsig = new PVector(20*(sig(r1)+5), 0, 0);
    PVector vsig2 = new PVector(20*(sig(r2)+5), 0, 0);
    vsig.rotate(r1);
    vsig2.rotate(r2);
    stroke(10, 225, 10, alpha);
    line(w/2 + vsig.x, h/2 - vsig.y,
         w/2 + vsig2.x, h/2 - vsig2.y);

    // background
    stroke(10, 10, 225, alpha);
    line(perc*w, h/2 - sig(r1) * 100,
         (step+1.)/steps*w, h/2 - sig(r2) * 100);
  }
  theta = (theta + theta_step) % TWO_PI;
}
