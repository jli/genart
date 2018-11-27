'use strict';
// TODO:
// - behavior:
//   - rethink update() computation.
//   - add mouse/touch interaction: attract, repel
// - display:
//   - better debug display
//   - node color shift based on velocity change
// - misc:
//   - rand_color: convert to HSB, require minimum brightness
//   - figure out color() with object warning
//   - add icon for manifest... https://developers.google.com/web/fundamentals/web-app-manifest/
//
// h/t https://github.com/shiffman/The-Nature-of-Code-Examples/blob/master/chp06_agents/NOC_6_09_Flocking/Boid.pde

let NODE_FLOCKS = [];

const MOBILE = /Mobi|Android/i.test(navigator.userAgent);
const GROUP_SIZE_RANDBOUND = [50, 150];
const NUM_GROUPS_RANDBOUND = [2, 4];
const NODE_SIZE_RANDBOUND = MOBILE ? [3, 8] : [5, 13];

// When increasing/decreasing flock sizes, change by this frac of existing size.
const FLOCK_SIZE_CHANGE_FRAC = 0.1;

// TODO: expose these as controllable things?
let SPEED_LIMIT_MULT = 4;
let RAND_MOVE_FREQ = 0.10;
let RAND_MOVE_DIV = 15;

// Control panel input elements.
let DEBUG_FORCE;
let DEBUG_NEIGHBORS;
let DEBUG_DISTANCE;
let CIRCLES;
let PAUSED = false;
let ZOOM;
let SPEED;
let SPACE_AWARE_MULT;
let SEPARATION_FORCE;
let NF_SEPARATION_FORCE;
let COHESION_FORCE;
let ALIGNMENT_FORCE;
let MAX_FORCE;
let NUM_NEIGHBORS;
let NF_NUM_NEIGHBORS;
let NATURAL_SPEED_WEIGHT;

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
  get zspace_need() { return this.space_need * parseFloat(ZOOM.value()); }
  get debugf() { return DEBUG_FORCE.checked() && this.id == 0; }

  draw_shape() {
    const z = parseFloat(ZOOM.value());
    if (CIRCLES.checked()) { ellipse(this.pos.x, this.pos.y, this.size * z, this.size * z); }
    else { draw_triangle(this.pos, this.vel, this.size * z); }
  }

  draw() {
    noStroke(); fill(this.col);
    if (this.debugf) { fill(255, 255); }
    this.draw_shape();
    if (DEBUG_DISTANCE.checked()) {
      noFill();
      stroke(this.id == 0 ? 250 : 100, 220);
      // Note: this is drawing a diameter of space_need instead of the radius.
      // This works out since with 2 nodes, the 2 bubbles looks like they're
      // bumping against each other.
      ellipse(this.pos.x, this.pos.y, this.zspace_need, this.zspace_need);
      if (this.id == 0) {
        stroke(50, 200, 50, 220);
        // Here, we do properly draw the radius since we're only showing 1 side.
        const s = 2 * SPACE_AWARE_MULT.value() * this.zspace_need;
        ellipse(this.pos.x, this.pos.y, s, s);
        line(this.pos.x, this.pos.y, this.pos.x + s/2, this.pos.y);
      }
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
  // steer_velocity(v2, mult) {
  //   return v2.copy().setMag(this.speed_limit).sub(this.vel).limit(MAX_FORCE.value()).mult(mult);
  //   // return v2.copy().setMag(this.speed_limit).sub(this.vel).mult(mult);
  // }

  update(flocks) {
    const nearby_nodes = this.get_nearest_nodes(flocks);

    let vel_ = this.vel.copy();
    let vel_n = 0;
    let curspeed = this.vel.mag();
    for (const [other, dist] of nearby_nodes) {
      // numerator for separation force computation. with divisor of dist^2,
      // this works out to 1 when other node is zspace_need away.
      const sep_force_num = this.zspace_need * other.zspace_need;
      const same_flock = this.flock_id == other.flock_id;
      const away = p5.Vector.sub(this.pos, other.pos).normalize();
      if (same_flock) {
        vel_.add(away.copy().mult(
          SEPARATION_FORCE.value() * curspeed * sep_force_num / pow(dist, 2)
          - COHESION_FORCE.value() * curspeed * dist / this.zspace_need
        ));
        vel_.add(other.vel.copy().mult(ALIGNMENT_FORCE.value()));
        //vel_.add(other.vel.copy().sub(this.vel).mult(ALIGNMENT_FORCE.value()));
        vel_n += 2;
      } else {
        vel_.add(away.copy().mult(
          NF_SEPARATION_FORCE.value() * curspeed * sep_force_num / pow(dist, 2)));
        ++vel_n;
      }
      if (DEBUG_NEIGHBORS.checked() && (!DEBUG_FORCE.checked() || this.debugf)) {
        if (same_flock) {
          if (dist < this.zspace_need) { stroke(50, 50, 250, 200); strokeWeight(1); }
          else { stroke(150, 150, 150, 150); strokeWeight(1); }
        } else { stroke(235, 0, 0, 200); strokeWeight(1); }
        line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      }
    }

    if (vel_n) {
      vel_.div(vel_n);
      this.vel.lerp(vel_, MAX_FORCE.value());
    }

    if (random(1) < RAND_MOVE_FREQ) {
      //fill(brighten(this.col, 1.3)); this.draw_shape();
      this.vel.add(p5.Vector.random2D().setMag(this.vel.mag()/RAND_MOVE_DIV));
    }

    const nsw = NATURAL_SPEED_WEIGHT.value();
    this.vel.setMag(this.vel.mag() * (1-nsw) + this.natural_speed * nsw);
    this.vel.limit(this.speed_limit);

    this.pos.add(this.vel.copy().mult(parseFloat(SPEED.value())));
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
  const speed = random(2, 5);
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

function setup() {
  frameRate(30);
  createCanvas(windowWidth, windowHeight);
  create_control_panel();
  setTimeout(toggle_control_panel, 1000);
  init_node_flocks();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

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

// TODO: remove entirely (aside from control panel toggle)? or too useful?
function keyPressed() {
  switch (key) {
    case 'p': toggle_paused(); break;
    case 'r': init_node_flocks(); break;
    case ';': toggle_control_panel(); break;
  }
}

function toggle_paused() {
  PAUSED = !PAUSED;
  if (PAUSED) { noLoop(); } else { loop(); }
}

function change_num_flocks(dir) {
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

function change_flock_size(dir) {
  for (const flock of NODE_FLOCKS) {
    if (dir > 0) {
      const num_to_add = max(1, int(flock.length * FLOCK_SIZE_CHANGE_FRAC));
      const orig_length = flock.length;
      for (let i = orig_length; i < orig_length + num_to_add; ++i) {
        const example = flock[int(random(flock.length))];
        const pos = example.pos.copy().add(p5.Vector.random2D().mult(example.space_need));
        const vel = example.vel.copy().rotate(random(2*PI));
        flock.push(new Node(i, example.flock_id, pos, vel, example.space_need, example.col, example.size));
      }
    } else {
      const target_size = max(1, int(flock.length * (1 - FLOCK_SIZE_CHANGE_FRAC)));
      flock.splice(target_size);
    }
  }
}

// Creates slider with label, including display of value.
function make_slider(label, min, max, startval, step, parent) {
  // TODO: nicer display of slider value.
  const container = createDiv().parent(parent);
  const labelelt = createSpan(`${label} [${startval}]`).parent(container);
  const slider = createSlider(min, max, startval, step).parent(container);
  slider.input(() => { labelelt.html(`${label} [${slider.value()}]`) });
  return slider;
}

// Creates number input with label. TODO: make it look nicer..?
function make_number_input(label, min, max, startval, step, size, parent) {
  let container = createDiv().parent(parent);
  createSpan(label + ' ').parent(container);
  const input = createInput(str(startval), 'number').parent(container);
  if (min !== null) input.attribute('min', min);
  if (max !== null) input.attribute('max', max);
  if (step !== null) input.attribute('step', step);
  if (size !== null) input.size(size);
  return input;
}

// Creates button. 'f' is both mousePressed and keydown (space, enter) handle.
function make_button(label, parent, f) {
  const b = createButton(label).parent(parent);
  b.mousePressed(f);
  b.elt.onkeydown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      // TODO: is this needed/useful?
      // e.preventDefault();
      f();
    }
  }
  return b;
}

let CONTROL_PANEL;
let TOGGLE_CONTROL_PANEL_BUTTON;

function toggle_control_panel() {
  if (CONTROL_PANEL.attribute('status') === 'hidden') {
    CONTROL_PANEL.attribute('status', 'shown');
    CONTROL_PANEL.style('translate', 0, 0);
    TOGGLE_CONTROL_PANEL_BUTTON.html('hide');
  } else {
    CONTROL_PANEL.attribute('status', 'hidden');
    const ty = CONTROL_PANEL.size()['height'] + parseInt(CONTROL_PANEL.style('bottom'), 10);
    CONTROL_PANEL.style('translate', 0, ty);
    TOGGLE_CONTROL_PANEL_BUTTON.html('show');
  }
}

// TODO: some other way of hiding/showing besides keyboard? (needed for mobile)
function create_control_panel() {
  CONTROL_PANEL = createDiv().id('controlPanelFull').attribute('status', 'shown');
  TOGGLE_CONTROL_PANEL_BUTTON = make_button('hide', CONTROL_PANEL, toggle_control_panel).id('showControlPanelButton');

  // Holds all the controls. Excludes the toggle button
  const main = createDiv().id('controlPanelMain').parent(CONTROL_PANEL);

  // Basic controls: pause, reinit, change speed, size, # flocks.
  const basic_controls = createDiv().parent(main);
  const br = () => createElement('br').parent(basic_controls);
  make_button('full', basic_controls, toggle_fullscreen); br();
  make_button('pause', basic_controls, toggle_paused); br();
  make_button('reinit flocks', basic_controls, init_node_flocks); br();
  SPEED = make_number_input('speed', 0.1, null, 1, 0.1, 32, basic_controls);
  ZOOM = make_number_input('size', 0.1, null, 1, 0.1, 32, basic_controls);
  createSpan('# flocks').parent(basic_controls);
  make_button('-', basic_controls, () => change_num_flocks(-1));
  make_button('+', basic_controls, () => change_num_flocks(+1));
  br();
  createSpan('flock size').parent(basic_controls);
  make_button('-', basic_controls, () => change_flock_size(-1));
  make_button('-', basic_controls, () => change_flock_size(+1));

  // Debugging tools.
  createElement('hr').parent(basic_controls).size('50%');
  DEBUG_FORCE = createCheckbox('forces', false).parent(basic_controls);
  DEBUG_NEIGHBORS = createCheckbox('links', false).parent(basic_controls);
  DEBUG_DISTANCE = createCheckbox('space need', false).parent(basic_controls);
  // Purely visual options.
  CIRCLES = createCheckbox('circles', false).parent(basic_controls);

  // Sliders for forces and such. TODO: make some of these plain numeric inputs?
  const sliders = createDiv().id('sliders').parent(main);

  NF_SEPARATION_FORCE = make_slider('nf separation', 0, 10, 5, .01, sliders);
  SEPARATION_FORCE    = make_slider('separation',    0, 10, 2, .01, sliders);
  COHESION_FORCE      = make_slider('cohesion',      0, 10, 1, .01, sliders);
  ALIGNMENT_FORCE     = make_slider('alignment',     0, 10, 1, .01, sliders);
  // createElement('hr').parent(sliders).size('10%');
  MAX_FORCE = make_slider('max force', 0, 1, .3, .02, sliders);
  NATURAL_SPEED_WEIGHT = make_slider('nat speed weight', 0, 1, .5, .01, sliders);
  // createElement('hr').parent(sliders).size('10%');
  SPACE_AWARE_MULT = make_slider('space aware mult', 0, 10, 6, .1, sliders);
  NUM_NEIGHBORS = make_slider('# neighbors', 1, 50, 8, 1, sliders);
  NF_NUM_NEIGHBORS = make_slider('# nf neighbors', 1, 50, 3, 1, sliders);
}

// h/t https://developers.google.com/web/fundamentals/native-hardware/fullscreen/
function toggle_fullscreen() {
  const doc = window.document;
  const docEl = doc.documentElement;
  const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  } else {
    cancelFullScreen.call(doc);
  }
}
