int W = 500;
int H = 500;
int NUM_INITIAL_NODES = 4;
ArrayList<N> ns = new ArrayList<N>();

float SIZE = 30;

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
  N(int i, PVector p, PVector v, PVector a) {
    id = i; pos = p; vel = v; accel = a;
    col = rand_color();
  }
  N(int i, PVector p) {
    id = i; pos = p;
    vel = new PVector(0, 0); accel = vel.copy();
  }
  // TODO: color.
  N copy() { return new N(id, pos.copy(), vel.copy(), accel.copy()); }
  void print() { println("N:", id, pos, vel, accel); }
}

N random_node(int i) {
  return new N(i, new PVector(random(0, width), random(0, height)),
               PVector.random2D().mult(random(.25, 1)),
               new PVector(0, 0));
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
  N[] tmp_ns = {};
  for (N n : ns) {
    //n.accel.add(PVector.random2D().mult(0.05)); n.accel.limit(1);
    n.vel.add(n.accel); n.vel.limit(2);
    n.pos.add(n.vel); wrap_position(n.pos);
    fill(n.col); ellipse(n.pos.x, n.pos.y, SIZE, SIZE);
    fill(0); text(str(n.id), n.pos.x, n.pos.y);
  }
  for (N n : ns) { tmp_ns = (N[])append(tmp_ns, n.copy()); }
  for (N n : ns) {
    for (N m : tmp_ns) {
      if (n.id == m.id) continue;
      PVector dv = PVector.sub(m.pos, n.pos);
      float d = dv.mag();
      float overlap = SIZE - d;
      if (overlap >= 0) {
        println("overlap btwn " + str(n.id) + "," + str(m.id) + ": " + overlap);
        // Enforce non-overlap.
        n.pos.sub(dv.copy().normalize().mult(0.5));
        n.vel = reflect(n.vel, m.vel.copy().normalize());
        break;
      }
    }
  }
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
