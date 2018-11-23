const DIM = [800, 800];

const GROUP_SIZE_RANDBOUND = [5, 35];
const NUM_GROUPS_RANDBOUND = [3, 8];
const NODE_SIZE_RANDBOUND = [5, 20];

let DEBUG_NEIGHBORS = false;
let DEBUG_DISTANCE = false;
let TRIS_CIRCLES = true;
let ALPHA = false;
let PAUSED = false;
let ZOOM = 1.0;
let SPEED = 1.0;

let SPEED_LIMIT_MULT = 3;
let SPACE_AWARE_MULT = 3;
let SEPARATION_FORCE = 3;
let COHESION_FORCE = 2;
let ALIGNMENT_FORCE = 2;

let MAX_FORCE = 0.1;


let NODE_FLOCKS = [];

function rand_position() { return createVector(random(0, width), random(0, height)); }
function rand_color() { return color(random(0, 255), random(0, 255), random(0, 255)); }

// Plus 1 for int upper bound so that bounds are inclusive.
function rand_bound(bounds) { return floor(random(bounds[0], bounds[1] + 1)); }

function brighten(col, mult) {
  return color(constrain(red(col) * mult, 0, 255),
               constrain(green(col) * mult, 0, 255),
               constrain(blue(col) * mult, 0, 255));
}

function draw_triangle(middle, dir, size) {
  dir = dir.copy().normalize().mult(size);
  const halfdir = dir.copy().mult(.5);
  const v1 = p5.Vector.add(middle, halfdir);
  const base = p5.Vector.sub(middle, halfdir);
  const v2 = p5.Vector.add(base, dir.copy().mult(.3).rotate(HALF_PI));
  const v3 = p5.Vector.add(base, dir.copy().mult(.3).rotate(-HALF_PI));
  triangle(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y);
}

// The distance computation doesn't recognize that nodes on the other side of
// the screen are actually "nearby". This can cause some glitching, with nodes
// hopping back and forth due to forces from neighbors. WRAP_HACK is used so
// that when nodes wrap around the plane, they get some extra buffer to avoid
// the glitching. TODO: fix the distance computation instead?
const WRAP_HACK = 10;

function wrap_dimension(x, upper) {
  if (x > upper) { x = x - upper + WRAP_HACK; }
  else if (x < 0) { x = upper - x - WRAP_HACK; }
  return x;
}

function wrap_vector(v) {
  v.x = wrap_dimension(v.x, width);
  v.y = wrap_dimension(v.y, height);
}

class Node {
  constructor(id, flock_id, pos, vel, space_need, col, size) {
    this.id = id;
    this.flock_id = flock_id;
    this.pos = pos;
    this.vel = vel;
    this.space_need = space_need;
    this.col = col;
    this.size = size;
    this.natural_speed = this.vel.mag();
    // TODO: need natural_speed still?
  }
  copy() {
    return new Node(this.id, this.flock_id, this.pos.copy(), this.vel.copy(),
                    this.space_need, this.col, this.size);
  }
  get speed_limit() { return this.natural_speed * SPEED_LIMIT_MULT; }

  draw_shape() {
    if (TRIS_CIRCLES) { draw_triangle(this.pos, this.vel, this.size * ZOOM); }
    else { ellipse(this.pos.x, this.pos.y, this.size * ZOOM, this.size * ZOOM); }
  }

  draw() {
    noStroke(); fill(this.col, ALPHA ? 200 : 255);
    this.draw_shape();
    if (DEBUG_DISTANCE) {
      stroke(100, 220); noFill();
      ellipse(this.pos.x, this.pos.y, this.zspace_need, this.zspace_need);
    }
  }

  get zspace_need() { return this.space_need * ZOOM; }

  get_nearest_nodes(flocks) {
    const nodes_and_dists = [];
    for (const flock of flocks) {
      for (const other of flock) {
        const same_flock = this.flock_id == other.flock_id;
        if (same_flock && this.id == other.id) continue;
        const dist = this.pos.dist(other.pos);
        // TODO: average space_need with other? add MIN_SEARCH_DISTANCE?
        if (dist < SPACE_AWARE_MULT * this.zspace_need) {
          nodes_and_dists.push([other, dist]);
        }
      }
    }
    return nodes_and_dists.sort((a, b) => a[1] - b[1]);
  }

  update(flocks) {
    const nearby_nodes = this.get_nearest_nodes(flocks);
    const velmag = this.vel.mag();

    let separation_force = createVector(); let separation_count = 0;
    let cohesion_center = createVector(); let cohesion_count = 0;
    let alignment_force = createVector(); let alignment_count = 0;
    for (const [other, dist] of nearby_nodes) {
      const same_flock = this.flock_id == other.flock_id;
      const away = p5.Vector.sub(this.pos, other.pos).normalize();
      // const toward = away.copy().rotate(PI);
      if (same_flock) {
        if (dist < this.zspace_need) {
          separation_force.add(away.copy().div(dist)); ++separation_count;
        }
        cohesion_center.add(other.pos); ++cohesion_count;
        alignment_force.add(other.vel); ++alignment_count;
      }
    }
    let force = createVector();
    if (separation_count > 0) { force.add(separation_force.mult(SEPARATION_FORCE / separation_count)); }
    if (cohesion_count > 0) {
      cohesion_center.div(cohesion_count);
      const towards = p5.Vector.sub(cohesion_center, this.pos);
      force.add(towards.mult(COHESION_FORCE));
    }
    if (alignment_count > 0) { force.add(alignment_force.mult(ALIGNMENT_FORCE / alignment_count)); }
    if (this.flock_id == 0 && this.id == 0 && frameCount % 30 == 0)  {
      console.log('force:', force, ' (', force.mag(), ')');
      console.log('vel:', this.vel, ' (', this.vel.mag(), ')');
    }
    force.limit(MAX_FORCE);
    this.vel.add(force);
    this.vel.setMag(this.vel.mag() * .8 + this.natural_speed * .2);
    this.vel.limit(this.speed_limit);
    this.pos.add(this.vel.copy().mult(SPEED));
    wrap_vector(this.pos);
    if (this.flock_id == 0 && this.id == 0 && frameCount % 30 == 0)  {
      console.log('vel2:', this.vel, ' (', this.vel.mag(), ')');
    }
  }
}  // Node

function create_random_flock(flock_id) {
  const flock = [];
  const c = rand_color();
  const size = rand_bound(NODE_SIZE_RANDBOUND);
  const space_need = size * 2 * random(0.7, 1.3);
  // TODO: pull out constants?
  // TODO: make speed variant match size, with smaller being faster, or vice versa?
  const speed = random(2, 4);
  const pos = rand_position();
  const vel = p5.Vector.random2D().mult(speed);
  for (let i = 0; i < rand_bound(GROUP_SIZE_RANDBOUND); ++i) {
    // TODO: more principled random fuzz amount.
    const posfuzzed = p5.Vector.add(pos, p5.Vector.random2D().mult(random(space_need * 4)));
    const velfuzzed = p5.Vector.add(vel, p5.Vector.random2D().mult(speed/5));
    flock.push(new Node(i, flock_id, posfuzzed, velfuzzed, space_need,
                        brighten(c, random(0.7, 1.3)), size * random(0.8, 1.2)));
  }
  return flock;
}

function init_node_flocks() {
  NODE_FLOCKS = [];
  for (let i = 0; i < rand_bound(NUM_GROUPS_RANDBOUND); ++i)
    NODE_FLOCKS.push(create_random_flock(i));
}

function copy_flocks(flocks) { return flocks.map(f => f.map(n => n.copy())); }

function setup() {
  createCanvas(DIM[0], DIM[1]);
  frameRate(30);
  init_node_flocks();
}

function draw() {
  background(20, 20, 25);
  const tmp_flocks = copy_flocks(NODE_FLOCKS);
  for (const flock of NODE_FLOCKS) {
    for (const node of flock) {
      node.draw();
      node.update(tmp_flocks);
    }
  }
}

function keyPressed() {
  print(key, keyCode);
  switch (key) {
    case 'd': DEBUG_DISTANCE = !DEBUG_DISTANCE; break;
    case 'l': DEBUG_NEIGHBORS = !DEBUG_NEIGHBORS; break;
    case 'a': ALPHA = !ALPHA; break;
    case 'c': TRIS_CIRCLES = !TRIS_CIRCLES; break;
    case ' ': toggle_paused(); break;
    case 'r': init_node_flocks(); break;
    case '+': change_flocks_size(1); break;
    case '-': change_flocks_size(-1); break;
  }
  switch (keyCode) {
    case RIGHT_ARROW: change_speed(0.1); break;
    case LEFT_ARROW: change_speed(-0.1); break;
    case UP_ARROW: change_zoom(0.1); break;
    case DOWN_ARROW: change_zoom(-0.1); break;
  }
}

function change_speed(delta) {
  SPEED = max(SPEED + delta, 0.1);
}

function change_zoom(delta) {
  ZOOM = constrain(ZOOM + delta, 0.2, 5);
}

function toggle_paused() {
  PAUSED = !PAUSED;
  if (PAUSED) { noLoop(); } else { loop(); }
}

function change_flocks_size(dir) {
  if (dir > 0) {
    NODE_FLOCKS.push(create_random_flock(NODE_FLOCKS.length));
  } else if (NODE_FLOCKS.length >= 2) {
    const to_remove = floor(random(NODE_FLOCKS.length));
    NODE_FLOCKS.splice(to_remove, 1);
    // Update flock ids for subsequent flocks to maintain invariant that array
    // index equals flock id.
    for (let i = to_remove; i < NODE_FLOCKS.length; ++i)
      for (const n of NODE_FLOCKS[i])
        n.flock_id = i;
  }
}
