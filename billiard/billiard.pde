int W = 500;
int H = 500;
int NUM_INITIAL_NODES = 10;
ArrayList<N> ns = new ArrayList<N>();

float[] SIZE_BOUNDS = {5, 15};

color rand_color() {
  return color(random(0, 255), random(0, 255), random(0, 255));
}

float wrap_dimension(float x, float upper) {
  if (x > upper) { x = x - upper; }
  else if (x < 0) { x = upper - x; }
  return x;
}

void wrap_position(PVector v) {
  v.x = wrap_dimension(v.x, width);
  v.y = wrap_dimension(v.y, height);
}

// Reflects v across normal vector n defining a line that v is bouncing off of.
PVector reflect(PVector v, PVector n) {
  return PVector.sub(v, PVector.mult(n, 2 * v.dot(n)));
}

class N {
  int id;
  PVector pos;
  PVector vel;
  PVector accel;
  color col;
  float rad;
  N(int i, PVector p, PVector v, PVector a, float r) {
    id = i; pos = p; vel = v; accel = a; rad = r;
    col = rand_color();
  }
  N(int i, PVector p) {
    id = i; pos = p;
    vel = new PVector(0, 0); accel = vel.copy();
  }
  // TODO: color.
  N copy() { return new N(id, pos.copy(), vel.copy(), accel.copy(), rad); }
  void print() { println("N:", id, pos, vel, accel); }
  void draw() {
    fill(col); ellipse(pos.x, pos.y, rad*2, rad*2);
    fill(0); text(str(id), pos.x, pos.y);
  }
  void update() {
    //accel.add(PVector.random2D().mult(0.05)); accel.limit(1);
    vel.add(accel); vel.limit(2);
    pos.add(vel); wrap_position(pos);
  }
  void check_collisions(N[] all_nodes) {
    for (N other : all_nodes) {
      if (id == other.id) continue;
      PVector dv = PVector.sub(other.pos, pos);
      float d = dv.mag();
      float required_dist = rad + other.rad;
      float overlap = required_dist - d;
      if (overlap >= 0) {
        println("overlap btwn " + str(id) + "," + str(other.id) + ": " + overlap);
        // Enforce non-overlap.
        pos.sub(dv.copy().normalize().mult(0.5));
        vel = reflect(vel, other.vel.copy().normalize());
        break;
      }
    }
  }
}

N random_node(int i) {
  return new N(i, new PVector(random(0, width), random(0, height)),
               PVector.random2D().mult(random(.25, 1)),
               new PVector(0, 0),
               random(SIZE_BOUNDS[0], SIZE_BOUNDS[1]));
}

void initialize() {
  ns.clear();
  for (int i = 0; i < NUM_INITIAL_NODES; ++i) { ns.add(random_node(i)); }
}

void setup() {
  size(1, 1); surface.setSize(W, H);
  initialize();
}

void draw() {
  background(220);
  for (N n : ns) { n.update(); }
  N[] tmp_ns = {};
  for (N n : ns) { tmp_ns = (N[])append(tmp_ns, n.copy()); }
  for (N n : ns) { n.check_collisions(tmp_ns); }
  for (N n : ns) { n.draw(); }
}

boolean PAUSED = false;
void togglePaused() {
  if (PAUSED) { noLoop(); } else { loop(); }
  PAUSED = !PAUSED;
}
void change_nodes(int dir) {
  if (dir > 0) { ns.add(random_node(ns.size())); }
  else if (ns.size() > 1) { ns.remove(ns.size()-1); }
}
void keyPressed() {
  switch (key) {
    case ' ': togglePaused(); break;
    case '+': change_nodes(1); break;
    case '-': change_nodes(-1); break;
    case 'r': initialize(); break;
  }
}
