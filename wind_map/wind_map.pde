/* @pjs globalKeyEvents="true"; */

// FIXME pjs: displayWidth and displayHeight undefined
boolean fullscreen = false;
boolean ghostride = true;
int w = 800; // pixel bounds. overwritten if fullscreen
int h = 600;
int gap = 30; // must evenly divide w and h
int wn; // index bounds
int hn;
PVector[][] vs;
PVector[][] tmp_vs;

int max_tracers; // on the order of wn*hn
PVector[] tracer_pos;
PVector[] tracer_vel;
int ntracers = 0;

float update_self_weight = 0.75; // higher -> slower neighbor averaging
float rot_considered_change = 0.002; // lower -> longer runs before randomizing
float tracer_size = gap/5;
float tracer_speed_mult = 10;
float tracer_vel_self_weight = 0.8; // higher -> slower acceleration
float max_tracer_red_vel = 12; // velocity when tracer is most red
int max_arrow_weight = gap/10;
float max_arrow_weight_rad = 0.05; // weight tops out for this rotation
float max_arrow_red_rad = 0.005; // max redness for this rotation

PVector copy_vector(PVector v) { return(new PVector(v.x, v.y, v.z)); }

void stroke_red(int r) { stroke(r, 100, 230); }

int round_down(int x, int mult) { return x - (x % mult); }

// FIXME pjs: no random2D!
PVector random_vector() {
  //PVector.random2D();
  PVector v = new PVector(random(-1, 1), random(-1, 1), 0.);
  v.limit(1);
  return v;
}

void randomize_tracers(int n) {
  // i only used for running the loop
  for (int i = 0; i < n; ++i) {
    tracer_pos[ntracers] = new PVector(random(0, w), random(0, h));
    tracer_vel[ntracers] = new PVector(0, 0);
    ntracers = (ntracers + 1) % max_tracers;
  }
}

void redo() {
  for (int ix = 0; ix < wn; ++ix)
    for (int iy = 0; iy < hn; ++iy)
      vs[ix][iy] = random_vector();

  if (ghostride) {
    randomize_tracers(max_tracers);
  } else {
    ntracers = 0;
    for (int i=0; i<max_tracers; ++i) {
      tracer_pos[i] = null;
      tracer_vel[i] = null;
    }
  }
}

void setup() {
  w = round_down(fullscreen ? displayWidth : w, gap);
  h = round_down(fullscreen ? displayHeight : h, gap);
  wn = w/gap;
  hn = h/gap;
  vs = new PVector[wn][hn];
  tmp_vs = new PVector[wn][hn];
  max_tracers = wn*hn / 4;
  tracer_pos = new PVector[max_tracers];
  tracer_vel = new PVector[max_tracers];
  size(w, h);
  frameRate(30);
  redo();
}

int torusify(int x, int min, int max) {
  if (x < min) { return max + x; }
  else if (x >= max) { return min + x - max; }
  else return x;
}

// gap/2 is to move vectors off the top and left edges
float index_to_world(int i) {
  return i * gap + gap/2;
}

// index of vector closest to world coordinates, torusified
int world_to_index(float x, int min, int max) {
  return torusify(round((x - gap/2) / gap), min, max);
}

PVector torus_index(PVector[][] vs, int ix, int iy) {
  ix = torusify(ix, 0, wn);
  iy = torusify(iy, 0, hn);
  return vs[ix][iy];
}

PVector[] neighbors(int ix, int iy, PVector[][] vs) {
  PVector[] res = {
    torus_index(vs, ix-1, iy-1),
    torus_index(vs, ix-1, iy),
    torus_index(vs, ix-1, iy+1),
    torus_index(vs, ix, iy-1),
    torus_index(vs, ix, iy+1),
    torus_index(vs, ix+1, iy-1),
    torus_index(vs, ix+1, iy),
    torus_index(vs, ix+1, iy+1)
  };
  return(res);
}

// average vector with neighbors
void average(int ix, int iy, PVector[][] dst, PVector[][] src) {
  // 9 neighbors plus self. weight self by update_self_weight, split rest for neighbors
  float neighbor_weight = (1 - update_self_weight) / 9;
  dst[ix][iy].limit(update_self_weight);
  // FIXME pjs: when "ns" named "neighbors", failtime
  PVector[] ns = neighbors(ix, iy, src);
  for (int i = 0; i < ns.length; ++i) {
    PVector n = ns[i];
    dst[ix][iy].add(n.x * neighbor_weight, n.y * neighbor_weight, 0);
  }
}

// FIXME pjs: no .rotate
// R = [cos  -sin]
//     [sin   cos]
PVector rotate(PVector v, float rads) {
  float c = cos(rads);
  float s = sin(rads);
  return new PVector(c*v.x - s*v.y, s*v.x + c*v.y);
}

void arrow(float x, float y, PVector dir) {
  float arm_angle = PI/4;
  float mult = gap/5;
  float pointx = x + dir.x*mult;
  float pointy = y + dir.y*mult;
  //PVector arm1 = new PVector(dir.x, dir.y);
  //PVector arm2 = new PVector(dir.x, dir.y);
  //arm1.rotate(arm_angle);
  //arm2.rotate(-arm_angle);
  PVector arm1 = rotate(dir, arm_angle);
  PVector arm2 = rotate(dir, -arm_angle);
  line(x - dir.x*mult, y - dir.y*mult, pointx, pointy);
  line(pointx, pointy, pointx - arm1.x*mult, pointy - arm1.y*mult);
  line(pointx, pointy, pointx - arm2.x*mult, pointy - arm2.y*mult);
}

void draw() {
  boolean changed = false;
  background(5, 10, 20);

  // average vectors with neighbors, using tmp copy
  for (int ix = 0; ix < wn; ++ix)
    for (int iy = 0; iy < hn; ++iy)
      tmp_vs[ix][iy] = copy_vector(vs[ix][iy]);
  for (int ix = 0; ix < wn; ++ix)
    for (int iy = 0; iy < hn; ++iy)
      average(ix, iy, vs, tmp_vs);

  // draw
  for (int ix = 0; ix < wn; ++ix) {
    for (int iy = 0; iy < hn; ++iy) {
      PVector p = vs[ix][iy];
      PVector prev_p = tmp_vs[ix][iy];
      float rads = PVector.angleBetween(p, prev_p);
      if (rads > rot_considered_change) { changed = true; }
      strokeWeight(map(min(rads, max_arrow_weight_rad),
                       0, max_arrow_weight_rad, 1, max_arrow_weight));
      stroke_red(floor(map(rads, 0, max_arrow_red_rad, 0, 255)));
      arrow(index_to_world(ix), index_to_world(iy), p);
    }
  }

  // tracers
  if (ghostride) { randomize_tracers(1); }
  for (int i = 0; i < max_tracers; ++i) {
    if (tracer_pos[i] == null) { continue; }
    else {
      PVector pos = tracer_pos[i];
      PVector vel = tracer_vel[i];
      PVector dir = copy_vector(vs[world_to_index(pos.x, 0, wn)][world_to_index(pos.y, 0, hn)]);
      dir.mult(tracer_speed_mult * (1-tracer_vel_self_weight));
      vel.mult(tracer_vel_self_weight);
      PVector rand = random_vector();
      rand.mult(2);
      vel.add(dir);
      vel.add(rand);
      pos.add(vel);
      pos.x = torusify(round(pos.x), 0, w);
      pos.y = torusify(round(pos.y), 0, h);
      strokeWeight(2);
      stroke_red(floor(map(vel.mag(), 0, max_tracer_red_vel, 0, 255)));
      ellipse(pos.x, pos.y, tracer_size, tracer_size);
    }
  }

  // switch when stabilized
  if (!changed) { redo(); }
}

void mouse() {
  tracer_pos[ntracers] = new PVector(mouseX, mouseY);
  tracer_vel[ntracers] = new PVector(0, 0);
  ntracers = (ntracers + 1) % max_tracers;
}

void mousePressed() { mouse(); }
void mouseDragged() { mouse(); }

void keyPressed() {
  switch(key) {
    case 'r':
      redo();
      break;
    case 'p':
      randomize_tracers(max_tracers);
      break;
  }
}
