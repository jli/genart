// TODOs:
// - behavior:
//   - tweak behavior to work well across scales
//   - smoother changes w/ accel variable to change vel over time?
//   - tweak velocity instead of position in interactions
// - graphics/interactions:
//   - indication when nodes lerp velocities. better indication for vel bump.
//   - mouse interaction to create new nodes? or move nodes around?
// - bleh:
//   - gets weird at edges. consider bounding at edges, or making distance
//     computation work across edges.

import java.util.Map;

// FULL determines if sketch is started in fullscreen mode. If false, uses DIM.
// "F" toggles pseudo-fullscreen mode, using FULL_DIM values. Menu/title bar
// remain visible though.
boolean FULL = false;
int[] DIM = {800, 800};
int[] FULL_DIM = {1680, 1008};

int MIN_GROUPS = FULL ? 7: 3;
int MAX_GROUPS = FULL ? 20 : 10;
int MIN_GROUP_SIZE = FULL ? 10 : 5;
int MAX_GROUP_SIZE = FULL ? 75 : 50;
int MAX_NODE_SIZE = FULL ? 25 : 20;

// Input state variables.
boolean DEBUG_NEIGHBORS = false;
boolean DEBUG_DISTANCE = false;
boolean TRIS_CIRCLES = true;  // false for circles.
boolean ALPHA = false;
boolean PAUSED = false;
float ZOOM = 1.0;

// Primary state.
ArrayList<Node[]> NODE_FLOCKS = new ArrayList<Node[]>();

PVector rand_position() {
  return new PVector(random(0, width), random(0, height));
}

color rand_color() {
  return color(random(0, 255), random(0, 255), random(0, 255));
}

// The distance computation doesn't recognize that nodes on the other side of
// the screen are actually "nearby". This can cause some glitching, with nodes
// hopping back and forth due to forces from neighbors. WRAP_HACK is used so
// that when nodes wrap around the plane, they get some extra buffer to avoid
// the glitching. TODO: fix the distance computation instead?
float WRAP_HACK = 10;

float wrap_dimension(float x, float upper) {
  if (x > upper) { x = x - upper + WRAP_HACK; }
  else if (x < 0) { x = upper - x - WRAP_HACK; }
  return x;
}

void wrap_vector(PVector v) {
  v.x = wrap_dimension(v.x, width);
  v.y = wrap_dimension(v.y, height);
}

// TODO: maybe make v1 the middle instead of the tip?
void draw_triangle(PVector v1, PVector dir, float size) {
  dir = dir.copy().normalize().mult(size);
  PVector base = PVector.sub(v1, dir);
  PVector v2 = PVector.add(base, dir.copy().mult(.5).rotate(HALF_PI));
  PVector v3 = PVector.add(base, dir.copy().mult(.5).rotate(-HALF_PI));
  triangle(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y);
}

color brighten(color c, float mult) {
  float r = red(c); float g = green(c); float b = blue(c);
  return color(constrain(red(c) * mult, 0, 255),
               constrain(green(c) * mult, 0, 255),
               constrain(blue(c) * mult, 0, 255));
}


class Node {
  // Limits on interactions with nearby flock and non-flock neighbors.
  int N_NEIGHBORS = 4;
  int N_NONFLOCK_NEIGHBORS = 2;
  // Multipliers for space_need
  // - SPACE_CLOSE_MULT: push away when another node within this distance
  // - SPACE_FAR_MULT: attract when another node outside this distance
  // - SPACE_TOO_FAR_MULT: ignore nodes outside this distance
  float SPACE_CLOSE_MULT = 0.75;
  float SPACE_FAR_MULT = 1.7;
  float SPACE_TOO_FAR_MULT = 5;

  int id;
  int flock_id;
  PVector pos;
  PVector vel;
  String typ;
  float space_need;
  color col;
  float size;  // TODO: rename to non-reserved word?

  Node(int i, int fi, PVector p, PVector v, float space, color c, float siz) {
    id = i;
    flock_id = fi;
    pos = p;
    vel = v;
    space_need = space;
    col = c;
    size = siz;
  }
  Node copy() { return new Node(id, flock_id, pos, vel, space_need, col, size); }

  void draw_shape() {
    if (TRIS_CIRCLES) { draw_triangle(pos, vel, size * ZOOM); }
    else { ellipse(pos.x, pos.y, size * ZOOM, size * ZOOM); }
  }

  void draw() {
    noStroke();
    fill(col, ALPHA ? 200 : 255);
    draw_shape();
    if (DEBUG_DISTANCE) {
      float close_diam = space_need * ZOOM * SPACE_CLOSE_MULT;
      float far_diam = space_need * ZOOM * SPACE_FAR_MULT;
      float too_far_diam = space_need * ZOOM * SPACE_TOO_FAR_MULT;
      stroke(100, 80);
      fill(100,25,25,10); ellipse(pos.x, pos.y, close_diam, close_diam);
      fill(25,100,25,10); ellipse(pos.x, pos.y, far_diam, far_diam);
      fill(25,25,100,10); ellipse(pos.x, pos.y, too_far_diam, too_far_diam);
    }
  }

  void update(ArrayList<Node[]> all) {
    float zspace_need = space_need * ZOOM;
    // Map from distances to neighbors.
    HashMap<Float, Node> dist_node = new HashMap<Float, Node>();
    for (Node[] flock : all) {
      for (Node other : flock) {
        boolean same_flock = other.flock_id == flock_id;
        if (same_flock && other.id == id) { continue; }
        float d = pos.dist(other.pos);
        // For non-flock neighbors, we only repel, so we just check that
        // distance is less than space need. We use the average of the pair's
        // space needs. Otherwise, flocks with smaller space needs tend to bunch
        // together and not deflect much, which looks bad.
        if ((same_flock && d < zspace_need * SPACE_TOO_FAR_MULT)
            || (!same_flock && d < (zspace_need + ZOOM*other.space_need)/2)) {
          dist_node.put(d, other);
        }
      }
    }
    // Sort.
    float[] dists = {};
    for (float k : dist_node.keySet()) { dists = append(dists, k); }
    dists = sort(dists);

    int flock_neighbors = 0;
    int nonflock_neighbors = 0;
    for (int i = 0; i < dists.length; ++i) {
      float dist = dists[i];
      Node other = dist_node.get(dist);
      boolean same_flock = other.flock_id == flock_id;
      // Keep separate count of interactions with flock and non-flock. Nodes are
      // often much closer with flockmates, so keeping separate interaction
      // limits guarantees responsiveness to close non-flock neighbors.
      if (same_flock) {
        if (flock_neighbors > N_NEIGHBORS) continue;
        ++flock_neighbors;
      } else {
        if (nonflock_neighbors > N_NONFLOCK_NEIGHBORS) continue;
        ++nonflock_neighbors;
      }
      PVector away = PVector.sub(pos, other.pos).normalize();
      if (DEBUG_NEIGHBORS) {
        if (same_flock) { stroke(150, 150); strokeWeight(1); }
        else { stroke(color(235,0,0), 200); strokeWeight(2); }
        line(pos.x, pos.y, other.pos.x, other.pos.y);
      }
      // TODO: tweak vel instead of pos.
      if (same_flock) {
        if (dist < zspace_need * SPACE_CLOSE_MULT) { pos.add(away); }
        else if (dist > zspace_need * SPACE_FAR_MULT) { pos.lerp(other.pos, 0.005); }
        // Occasionally make velocity more similar to other.
        if (random(1) < 0.10) { vel.lerp(other.vel, 0.10); }
      } else {  // not same flock
        pos.add(PVector.mult(away, 1.5));
      }
    }
    // Very occasionally add random smallish component to velocity.
    if (random(1) < 0.05) { vel.add(PVector.mult(PVector.random2D(), vel.mag()/10)); }
    // Even more occasionally make random largish change to velocity.
    if (random(1) < 0.001) {
      vel.add(PVector.mult(PVector.random2D(), vel.mag()/5));
      fill(brighten(col, 1.3)); draw_shape();
    }
    pos.add(vel);
    wrap_vector(pos);
  }  // update
}  // Node


Node[] create_random_flock(int flock_id) {
  Node[] flock = new Node[int(random(MIN_GROUP_SIZE, MAX_GROUP_SIZE))];
  color c = rand_color();
  float size = random(3, MAX_NODE_SIZE);
  float space_need = size * 2 * random(0.7, 1.3);
  // TODO: pull out constants?
  float speed = random(2, 4);
  PVector pos = rand_position();
  PVector vel = PVector.random2D().mult(speed);
  for (int i = 0; i < flock.length; ++i) {
    // TODO: more principled random fuzz amount.
    PVector posfuzzed = PVector.add(pos, PVector.random2D().mult(random(space_need * 4)));
    PVector velfuzzed = PVector.add(vel, PVector.random2D().mult(speed/5));
    flock[i] = new Node(i, flock_id, posfuzzed, velfuzzed, space_need,
                        brighten(c, random(0.6, 1.4)), size * random(0.7, 1.3));
  }
  return flock;
}

void init_node_flocks() {
  NODE_FLOCKS.clear();
  for (int i = 0; i < random(MIN_GROUPS, MAX_GROUPS); ++i)
    NODE_FLOCKS.add(create_random_flock(i));
}

ArrayList<Node[]> copy_flocks(ArrayList<Node[]> flocks) {
  ArrayList<Node[]> flocks2 = new ArrayList<Node[]>();
  for (Node[] flock : flocks) {
    Node[] f2 = new Node[flock.length];
    for (int i = 0; i < flock.length; ++i)
      f2[i] = flock[i].copy();
    flocks2.add(f2);
  }
  return flocks;
}

// Separate settings function in order to make.
void settings() {
  if (FULL) { fullScreen(); }
  else { size(DIM[0], DIM[1]); }
}

void setup() {
  frameRate(30);
  surface.setResizable(true);
  init_node_flocks();
}

void draw() {
  background(20, 20, 25);
  ArrayList<Node[]> tmp_flocks = copy_flocks(NODE_FLOCKS);
  for (Node[] flock : NODE_FLOCKS) {
    for (Node d : flock) {
      d.draw();
      d.update(tmp_flocks);
    }
  }
}

void change_flocks_size(int delta) {
  if (delta > 0) {
    NODE_FLOCKS.add(create_random_flock(NODE_FLOCKS.size()));
  } else {
    if (NODE_FLOCKS.size() > 1) {
      NODE_FLOCKS.remove(int(random(NODE_FLOCKS.size())));
    }
  }
}

void toggleFillscreen() {
  // We hijack existing FULL and DIMS variables for state. Meh, whatevs.
  if (FULL) {
    surface.setSize(DIM[0], DIM[1]);
    surface.setLocation(FULL_DIM[0]/2, 0);  // Move to right half.
  } else {
    DIM[0] = width; DIM[1] = height;  // Save current dimensions.
    surface.setSize(FULL_DIM[0], FULL_DIM[1]);
    surface.setLocation(0, 0);
  }
  FULL = !FULL;
}

void togglePaused() {
  if (PAUSED) { noLoop(); } else { loop(); }
  PAUSED = !PAUSED;
}

void keyPressed() {
  switch (key) {
    case 'd': DEBUG_DISTANCE = !DEBUG_DISTANCE; break;
    case 'l': DEBUG_NEIGHBORS = !DEBUG_NEIGHBORS; break;
    case 'a': ALPHA = !ALPHA; break;
    case 'c': TRIS_CIRCLES = !TRIS_CIRCLES; break;
    case 'r': init_node_flocks(); break;
    case '+': change_flocks_size(1); break;
    case '-': change_flocks_size(-1); break;
    case 'f': toggleFillscreen(); break;
    case ' ': togglePaused(); break;
  }
}

void mouseWheel(MouseEvent event) {
  if (event.getCount() < 0) {
    ZOOM = min(ZOOM + 0.1, 5.);
  } else {
    ZOOM = max(ZOOM - 0.1, 0.2);
  }
}
