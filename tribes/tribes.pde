int W = 800;
int H = 600;
int SIZE = 10;

color C1 = color(10, 20, 250);
color C2 = color(240, 10, 5);

int NUM_NODES = 100;
Node[] nodes = new Node[NUM_NODES];
Node[] tmp_nodes = new Node[NUM_NODES];

int NEARBY = 100;
int TOO_NEAR = 20;

// v is -1 to 1.
color valenceToColor(float v) { return lerpColor(C1, C2, (v + 1) / 2); }

ArrayList<Node> nearby(PVector pos, float dist) {
  ArrayList<Node> nears = new ArrayList<Node>();
  for (int i = 0; i < NUM_NODES; ++i) {
    if (nodes[i].pos.dist(pos) < dist) {
      nears.add(nodes[i]);
    }
  }
  return nears;
}

class Node {
  float valence, extremism;
  PVector pos;
  Node() {
    valence = random(-1, 1);
    extremism = random(0, 1);
    pos = new PVector(random(0, W), random(0, H));
  }
  Node(float v, float e, PVector p) {
    valence = v;
    extremism = e;
    pos = p;
  }
  // float val_dist(Node other) {
  //   float d = abs(valence - other.valence);
  //   float e1 = 10 * max(extremism, 0.05);
  //   float e2 = 10 * max(other.extremism, 0.05);
  //   return 10 * d * (e1 * e2);
  // }
  float phys_dist(Node other) { return pos.dist(other.pos); }
  boolean same_team(Node other) {
    return ((valence < 0 && other.valence < 0)
            || (valence >= 0 && other.valence >= 0));
  }
  void draw() {
    fill(valenceToColor(valence), extremism * 255);
    ellipse(pos.x, pos.y, SIZE, SIZE);
  }
  Node copy() {
    return new Node(valence, extremism, pos);
  }
}

void setup() {
  size(100, 100);
  surface.setSize(W, H);
  stroke(100, 150);
  frameRate(10);
  for (int i = 0; i < NUM_NODES; ++i) { nodes[i] = new Node(); }
}

void draw() {
  background(225);
  for (int i = 0; i < nodes.length; ++i) {
    tmp_nodes[i] = nodes[i].copy();
  }
  for (int i = 0; i < nodes.length; ++i) {
    // Node for which we will sum up forces.
    Node n = nodes[i];
    for (int j = 0; j < nodes.length; ++j) {
      Node m = tmp_nodes[j];
      float d = n.phys_dist(m);
      boolean same = n.same_team(m);
      if (d < NEARBY && d > TOO_NEAR) {
        n.pos.lerp(m.pos, same ? 0.02 : -0.03);
      }
      if (d < TOO_NEAR) {
        float repel = min(1 / d, 10);
        n.pos.lerp(m.pos, same ? -repel : -repel*2);
      }
    }
    n.pos.lerp(new PVector(W/2, H/2), 0.01);
  }
  for (int i = 0; i < NUM_NODES; ++i) {
    Node n = nodes[i];
    // ArrayList<Node> nears = nearby(n.pos, NEARBY);
    // for (int j = 0; j < nears.size(); ++j) {
    //   nears.get(j).pos.lerp(n.pos, 0.005);
    // }
    // ArrayList<Node> too_nears = nearby(n.pos, TOO_NEAR);
    // for (int j = 0; j < too_nears.size(); ++j) {
    //   float dist = too_nears.get(j).pos.dist(n.pos);
    //   float repel = min(1 / dist, 10);
    //   too_nears.get(j).pos.lerp(n.pos, -repel);
    // }
    nodes[i].draw();
    // ellipse(nodes[i].pos.x, nodes[i].pos.y, SIZE, SIZE);
  }
}
