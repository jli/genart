'use strict';
// TODO:
// - behavior:
//   - separation is odd, causes "quivering"
//   - steering computation is odd. a single node counts as much as several?
//   - rigid: flocks can look static
//   - add mouse interaction: attract, repel
// - display:
//   - clean up sliders display
//   - add status display (# flocks, # nodes, zoom, speed, etc)
//   - better debug display
//   - node color shift based on velocity change
// - misc:
//   -  rand_color: convert to HSB, require minimum brightness
//
// h/t https://github.com/shiffman/The-Nature-of-Code-Examples/blob/master/chp06_agents/NOC_6_09_Flocking/Boid.pde

const GROUP_SIZE_RANDBOUND = [50, 150];
const NUM_GROUPS_RANDBOUND = [2, 3];
const NODE_SIZE_RANDBOUND = [6, 13];

let DEBUG_NEIGHBORS = false;
let DEBUG_DISTANCE = false;
let DEBUG_FORCE = false;
let TRIS_CIRCLES = true;
let ALPHA = false;
let PAUSED = false;
let ZOOM = 1.0;
let SPEED = 1.0;

let SPEED_LIMIT_MULT = 3;
let RAND_MOVE_FREQ = 0.05;
let RAND_MOVE_DIV = 10;

let CONTROLS;
let SPACE_AWARE_MULT;
let SEPARATION_FORCE;
let NF_SEPARATION_FORCE;
let COHESION_FORCE;
let ALIGNMENT_FORCE;
let MAX_FORCE;
let NUM_NEIGHBORS;
let NF_NUM_NEIGHBORS;
let NATURAL_SPEED_WEIGHT;

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
    this.id = id; this.flock_id = flock_id;
    this.pos = pos; this.vel = vel;
    this.space_need = space_need;
    this.col = col; this.size = size;
    this.natural_speed = this.vel.mag();
  }
  copy() {
    return new Node(this.id, this.flock_id, this.pos.copy(), this.vel.copy(),
                    this.space_need, this.col, this.size);
  }
  get speed_limit() { return this.natural_speed * SPEED_LIMIT_MULT; }
  get zspace_need() { return this.space_need * ZOOM; }
  get debugf() { return DEBUG_FORCE && this.id == 0; }

  draw_shape() {
    if (TRIS_CIRCLES) { draw_triangle(this.pos, this.vel, this.size * ZOOM); }
    else { ellipse(this.pos.x, this.pos.y, this.size * ZOOM, this.size * ZOOM); }
  }

  draw() {
    noStroke(); fill(this.col, ALPHA ? 200 : 255);
    if (this.debugf) { fill(255, 255); }
    this.draw_shape();
    if (DEBUG_DISTANCE) {
      stroke(100, 220); noFill();
      // Note: this is drawing a diameter of space_need instead of the radius.
      // This works out since with 2 nodes, the 2 bubbles looks like they're
      // bumping against each other.
      ellipse(this.pos.x, this.pos.y, this.zspace_need, this.zspace_need);
    }
  }

  get_nearest_nodes(flocks) {
    // same flock and not-same flock
    const nodes_and_dists_sf = [];
    const nodes_and_dists_nf = [];
    for (const flock of flocks) {
      for (const other of flock) {
        const same_flock = this.flock_id == other.flock_id;
        if (same_flock && this.id == other.id) continue;
        const dist = this.pos.dist(other.pos);
        if (dist < SPACE_AWARE_MULT.value() * (this.zspace_need + other.zspace_need) / 2) {
          if (same_flock) { nodes_and_dists_sf.push([other, dist]); }
          else { nodes_and_dists_nf.push([other, dist]); }
        }
      }
    }
    const sf = nodes_and_dists_sf.sort((a, b) => a[1] - b[1]).splice(0, NUM_NEIGHBORS.value());
    const nf = nodes_and_dists_nf.sort((a, b) => a[1] - b[1]).splice(0, NF_NUM_NEIGHBORS.value());
    return sf.concat(nf);
  }

  // TODO: don't think i like this.
  steer_velocity(v2, mult) {
    return v2.copy().setMag(this.speed_limit).sub(this.vel).mult(mult);
  }

  update(flocks) {
    const nearby_nodes = this.get_nearest_nodes(flocks);

    let vel2 = this.vel.copy();
    let curspeed =  this.vel.mag();
    let n = 0;

    let separation_force = createVector(); let separation_count = 0;
    let nf_separation_force = createVector(); let nf_separation_count = 0;
    let cohesion_center = createVector(); let cohesion_count = 0;
    let alignment_force = createVector(); let alignment_count = 0;
    const sep_force_num = pow(this.zspace_need, 2);
    for (const [other, dist] of nearby_nodes) {
      const same_flock = this.flock_id == other.flock_id;
      const away = p5.Vector.sub(this.pos, other.pos).normalize();
      if (same_flock) {
        //if (dist < this.zspace_need) {
          // separation_force.add(away.copy().mult(sep_force_num / pow(dist, 2))); ++separation_count;
        //}
        // cohesion_center.add(other.pos); ++cohesion_count;
        // alignment_force.add(other.vel); ++alignment_count;
        if (dist < this.zspace_need * 0.8) {
          vel2.add(away.copy().mult(SEPARATION_FORCE.value() * curspeed * sep_force_num / pow(dist, 2)),);
          ++n;
        } else if (this.zspace_need * 1.2 < dist){
          vel2.add(away.copy().rotate(PI).mult(COHESION_FORCE.value() * curspeed * dist / this.zspace_need));
          ++n;
        }
        vel2.add(other.vel.copy().mult(ALIGNMENT_FORCE.value()));
        ++n;
      } else {
        vel2.add(away.copy().mult(NF_SEPARATION_FORCE.value() * curspeed * this.zspace_need * other.zspace_need / pow(dist, 2)));
        ++n;
        //nf_separation_force.add(away.copy().mult(sep_force_num /  pow(dist, 2))); ++nf_separation_count;
      }
      if (DEBUG_NEIGHBORS && (!DEBUG_FORCE || this.debugf)) {
        if (same_flock) {
          if (dist < this.zspace_need) { stroke(50, 50, 250, 200); strokeWeight(1); }
          else { stroke(150, 150, 150, 150); strokeWeight(1); }
        } else { stroke(235, 0, 0, 200); strokeWeight(1); }
        line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      }
    }



    // let tot_force = createVector();
    // let towards;
    // if (cohesion_count > 0) {
    //   cohesion_center.div(cohesion_count);
    //   towards = p5.Vector.sub(cohesion_center, this.pos);
    //   // towards = this.steer_velocity(towards, COHESION_FORCE.value())
    //   // TODO: how to scale
    //   // towards.setMag(map(towards.mag(),
    //   //                    this.zspace_need, this.zspace_need * SPACE_AWARE_MULT.value(),
    //   //                    0, this.speed_limit));
    //   // towards.sub(this.vel).mult(COHESION_FORCE.value());
    //   towards = this.steer_velocity(towards, COHESION_FORCE.value());
    //   tot_force.add(towards);
    //   if (this.debugf) {
    //     fill(255, 100); ellipse(cohesion_center.x, cohesion_center.y, 10, 10);
    //     fill(50, 50, 255, 200); draw_triangle(p5.Vector.lerp(cohesion_center, this.pos, 0.5), towards, towards.magSq());
    //   }
    // }
    // if (separation_count > 0) {
    //   separation_force.div(separation_count);
    //   separation_force = this.steer_velocity(separation_force, SEPARATION_FORCE.value());
    //   // separation_force.sub(this.vel).mult(SEPARATION_FORCE.value());
    //   tot_force.add(separation_force);
    //   if (this.debugf) {
    //     fill(255, 0, 0, 200); draw_triangle(cohesion_center, separation_force, separation_force.magSq());
    //   }
    // }
    // if (nf_separation_count > 0) {
    //   nf_separation_force.div(nf_separation_count);
    //   nf_separation_force = this.steer_velocity(nf_separation_force, NF_SEPARATION_FORCE.value());
    //   // nf_separation_force.sub(this.vel).mult(NF_SEPARATION_FORCE.value());
    //   tot_force.add(nf_separation_force);
    //   if (this.debugf) {
    //     fill(255, 0, 0, 200); draw_triangle(cohesion_center, nf_separation_force, nf_separation_force.magSq());
    //   }
    // }
    // if (alignment_count > 0) {
    //   alignment_force.div(alignment_count);
    //   alignment_force = this.steer_velocity(alignment_force, ALIGNMENT_FORCE.value());
    //   // alignment_force.sub(this.vel).mult(ALIGNMENT_FORCE.value());
    //   tot_force.add(alignment_force);
    //   if (this.debugf) {
    //     fill(0, 255, 0, 200); draw_triangle(cohesion_center, alignment_force, alignment_force.magSq());
    //   }
    // }
    // if (this.debugf && this.flock_id === 0 && frameCount % 30 === 0) {
    //   console.log(`\nvel: ${degrees(this.vel.heading())} (${this.vel.mag()})`);
    //   console.log(`sep: ${degrees(separation_force.heading())} (${separation_force.mag()})`);
    //   console.log(`coh: ${degrees(towards.heading())} (${towards.mag()})`);
    //   console.log(`ali: ${degrees(alignment_force.heading())} (${alignment_force.mag()})`);
    //   console.log(`tot: ${degrees(tot_force.heading())} (${tot_force.mag()})`);
    // }
    // tot_force.limit(MAX_FORCE.value());
    // this.vel.add(tot_force);

    //this.vel.setMag(this.vel.mag() * .8 + this.natural_speed * .2);
    //this.vel.limit(this.speed_limit);
    if (n > 0) {
      vel2.div(n);
    }
    this.vel.lerp(vel2, MAX_FORCE.value());

    if (random(1) < RAND_MOVE_FREQ) {
      //fill(brighten(this.col, 1.3)); this.draw_shape();
      this.vel.add(p5.Vector.random2D().setMag(this.vel.mag()/RAND_MOVE_DIV));
    }

    const nsw = NATURAL_SPEED_WEIGHT.value();
    this.vel.setMag(this.vel.mag() * (1-nsw) + this.natural_speed * nsw);

    this.pos.add(this.vel.copy().mult(SPEED));
    wrap_vector(this.pos);
  }
}  // Node

function create_random_flock(flock_id) {
  const flock = [];
  const c = rand_color();
  const size = rand_bound(NODE_SIZE_RANDBOUND);
  const space_need = size * 2.5 * random(0.8, 1.2);
  // TODO: pull out constants?
  // TODO: make speed variant match size, with smaller being faster, or vice versa?
  const speed = random(1.5, 4);
  const pos = rand_position();
  const vel = p5.Vector.random2D().mult(speed);
  for (let i = 0; i < rand_bound(GROUP_SIZE_RANDBOUND); ++i) {
    // TODO: more principled random fuzz amount.
    const posfuzzed = p5.Vector.add(pos, p5.Vector.random2D().mult(random(space_need * 4)));
    // Note: speed set to same value.
    const velfuzzed = p5.Vector.random2D().mult(speed/5).add(vel).setMag(speed);
    flock.push(new Node(i, flock_id, posfuzzed, velfuzzed, space_need,
                        brighten(c, random(0.7, 1.3)), size * random(0.85, 1.15)));
  }
  return flock;
}

function init_node_flocks() {
  NODE_FLOCKS = [];
  for (let i = 0; i < rand_bound(NUM_GROUPS_RANDBOUND); ++i)
    NODE_FLOCKS.push(create_random_flock(i));
}

function copy_flocks(flocks) { return flocks.map(f => f.map(n => n.copy())); }

function make_slider(label, min, max, startval, step, parent) {
  // TODO: nicer display of slider value.
  let container = createDiv().parent(parent);
  let slider = createSlider(min, max, startval, step);
  slider.parent(container);
  let labelelt = createSpan(`${startval} / ${label}`)
  labelelt.parent(container);
  slider.input(() => { labelelt.html(`${slider.value()} / ${label}`) });
  return slider;
}

function setup() {
  frameRate(30);
  createCanvas(windowWidth, windowHeight);

  CONTROLS = createDiv();
  CONTROLS.id('controlsContainer');
  SPACE_AWARE_MULT = make_slider('space aware mult', 0, 10, 4, .1, CONTROLS);
  NATURAL_SPEED_WEIGHT = make_slider('natural speed weight', 0, 1, .5, .01, CONTROLS);

  // SEPARATION_FORCE = make_slider('separation', 0, 10, 1.5, .1, CONTROLS);
  // NF_SEPARATION_FORCE = make_slider('nf separation', 0, 10, 6, .1, CONTROLS);
  // COHESION_FORCE = make_slider('cohesion', 0, 10, 1, .1, CONTROLS);
  // ALIGNMENT_FORCE = make_slider('alignment', 0, 10, 1, .1, CONTROLS);
  SEPARATION_FORCE    = make_slider('separation',    0, 10, 1, .01, CONTROLS);
  NF_SEPARATION_FORCE = make_slider('nf separation', 0, 10, 1, .01, CONTROLS);
  COHESION_FORCE      = make_slider('cohesion',      0, 10, 1, .01, CONTROLS);
  ALIGNMENT_FORCE     = make_slider('alignment',     0, 10, 1, .01, CONTROLS);

  MAX_FORCE = make_slider('max force', 0, 1, .1, .02, CONTROLS);
  NUM_NEIGHBORS = make_slider('# neighbors', 1, 50, 10, 1, CONTROLS);
  NF_NUM_NEIGHBORS = make_slider('# nf neighbors', 1, 50, 10, 1, CONTROLS);

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

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function toggle_controls() {
  // Initially status is 'null', and so falls into 2nd branch for hiding.
  const status = CONTROLS.attribute('status');
  if (status === 'hidden') {
    CONTROLS.attribute('status', 'shown');
    CONTROLS.style('translate', 0, 0);
  } else {
    CONTROLS.attribute('status', 'hidden');
    const ty = CONTROLS.size()['height'] + parseInt(CONTROLS.style('bottom'), 10);
    CONTROLS.style('translate', 0, ty);
  }
}

function keyPressed() {
  switch (key) {
    case 'd': DEBUG_DISTANCE = !DEBUG_DISTANCE; break;
    case 'l': DEBUG_NEIGHBORS = !DEBUG_NEIGHBORS; break;
    case 'f': DEBUG_FORCE = !DEBUG_FORCE; break;
    case 'a': ALPHA = !ALPHA; break;
    case 'c': TRIS_CIRCLES = !TRIS_CIRCLES; break;
    case ' ': toggle_paused(); break;
    case 'r': init_node_flocks(); break;
    case '+': change_flocks_size(1); break;
    case '-': change_flocks_size(-1); break;
    case ';': toggle_controls(); break;
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
