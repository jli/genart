'use strict';

// TODO:
// - behavior:
// - display:
//   - try to make colors more distinct
//   - make hue shift more uniform across hue spectrum
//   - less bleh control panel
// - misc:
//   - module-ify quadtree?
//   - add icon for manifest... https://developers.google.com/web/fundamentals/web-app-manifest/

let FLOCKS = [];

const MOBILE = /Mobi|Android/i.test(navigator.userAgent);
const GROUP_SIZE_RANDBOUND = MOBILE ? [70, 150] : [100, 200];
const NUM_GROUPS_RANDBOUND = MOBILE ? [2, 2] : [2, 3];
const SPEED_RANDBOUND = [2, 5];
const NODE_SIZE_RANDBOUND = MOBILE ? [4, 7] : [6, 12];

// When increasing/decreasing flock sizes, change by this frac of existing size.
const FLOCK_SIZE_CHANGE_FRAC = 0.1;
const SPEED_LIMIT_MULT = 10;
let TOUCH_RAD = 70;

// Control panel input elements.
let PAUSED = false;
let SPEED;
let ZOOM;
let DEBUG_FORCE;
let DEBUG_NEIGHBORS;
let SURROUND_OR_CLOSEST;
let DEBUG_DISTANCE;
let DEBUG_QUADTREE;
let CIRCLES;
let NF_SEPARATION_FORCE;
let SEPARATION_FORCE;
let COHESION_FORCE;
let ALIGNMENT_FORCE;
let MAX_FORCE;
let NATURAL_SPEED_WEIGHT;
let SPACE_AWARE_MULT;
let NUM_NEIGHBORS;
let NF_NUM_NEIGHBORS;
let RAND_MOVE_FREQ;
let RAND_MOVE_MULT;
let MOUSE_REPEL;

function rand_position() { return createVector(random(0, width), random(0, height)); }
// Note: has high saturation and brightness minimums.
function rand_color() { return color(random(0, 360), random(85, 100), random(80, 85)); }

// Plus 1 for int upper bound so that bounds are inclusive.
function rand_bound(bounds) { return floor(random(bounds[0], bounds[1] + 1)); }

function hue_shift(col, mult) {
  return color((hue(col) * mult) % 360, saturation(col), brightness(col));
}
function bright_shift(col, mult) {
  return color(hue(col), saturation(col), constrain(brightness(col) * mult, 0, 100));
}

function draw_triangle(middle, dir, size) {
  dir = dir.copy().setMag(size);
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

// Returns heading from 0 to 2PI instead of 0 to PI and 0 to -PI.
function heading_pos(v) {
  const h = v.heading();
  // heading is weird: goes from 0 to 180, then -180 to 0.
  if (h >= 0) return h;
  return map(h, -PI, 0, PI, 2*PI);
}

class Node {
  constructor(id, flock_id, pos, vel, space_need, col, size) {
    this.id = id; this.flock_id = flock_id;
    this.pos = pos; this.vel = vel;
    this.space_need = space_need;
    this.col = col; this.size = size;
    this.natural_speed = this.vel.mag();
    this.speed_avg = this.natural_speed;
  }
  copy() {
    return new Node(this.id, this.flock_id, this.pos.copy(), this.vel.copy(),
                    this.space_need, this.col, this.size);
  }
  get speed_limit() { return this.natural_speed * SPEED_LIMIT_MULT; }
  get zspace_need() { return this.space_need * ZOOM; }
  get debugf() { return DEBUG_FORCE && this.id === 0; }

  draw_shape() {
    const siz = this.size * ZOOM;
    if (CIRCLES) { ellipse(this.pos.x, this.pos.y, siz, siz); }
    else { draw_triangle(this.pos, this.vel, siz); }
  }

  draw() {
    noStroke();
    if (this.debugf) { fill(100); }
    else {
      const relvel = this.speed_avg / this.natural_speed;
      let hshift = constrain(relvel, 0.9, 1.1);
      let bshift = constrain(relvel, 0.6, 2);
      fill(bright_shift(hue_shift(this.col, hshift), bshift));
    }
    this.draw_shape();
    if (DEBUG_DISTANCE) {
      noFill();
      strokeWeight(0.5);
      stroke(this.id === 0 ? 85 : 35);
      // Note: this is drawing a diameter of space_need instead of the radius.
      // This works out since with 2 nodes, the 2 bubbles looks like they're
      // bumping against each other.
      ellipse(this.pos.x, this.pos.y, this.zspace_need, this.zspace_need);
      if (this.id === 0) {
        stroke(110, 80, 60);
        // Here, we do properly draw the radius since we're only showing 1 side.
        const s = 2 * SPACE_AWARE_MULT * this.zspace_need;
        ellipse(this.pos.x, this.pos.y, s, s);
        line(this.pos.x, this.pos.y, this.pos.x + s/2, this.pos.y);
      }
    }
  }

  get_nearest_nodes(flocks, qt) {
    // same flock and not-same flock
    const nodes_and_dists_sf = [];
    const nodes_and_dists_nf = [];
    const max_dist = SPACE_AWARE_MULT * this.zspace_need;
    const near = qt.queryCenter(this.pos, max_dist, max_dist);
    for (const [other, _] of near) {
      const same_flock = this.flock_id === other.flock_id;
      if (same_flock && this.id === other.id) continue;
      const dist = this.pos.dist(other.pos);
      if (dist < max_dist) {
        if (same_flock) { nodes_and_dists_sf.push([other, dist]); }
        else { nodes_and_dists_nf.push([other, dist]); }
      }
    }
    nodes_and_dists_sf.sort((a, b) => a[1] - b[1]).splice(NUM_NEIGHBORS);
    nodes_and_dists_nf.sort((a, b) => a[1] - b[1]).splice(NF_NUM_NEIGHBORS);
    return nodes_and_dists_sf.concat(nodes_and_dists_nf);
  }

  get_surrounding_nodes(flocks, qt) {
    // HACK: reusing existing sliders...
    const num_segments = NUM_NEIGHBORS;
    const num_per_segment = NF_NUM_NEIGHBORS;
    const rad_per_segment = 2 * PI / num_segments;
    const nodes_and_dists_per_segment = [];
    // Initialize.
    for (let i = 0; i < num_segments; ++i) { nodes_and_dists_per_segment[i] = []; }
    // TODO: previously, used avg of this and other's spaceneed to react. should
    // we still do that? if we don't then neighbors from flocks w/ greater space
    // need react to this node before this node reacts to it. could add some
    // safety factor to account, maybe? bleh.
    const max_dist = SPACE_AWARE_MULT * this.zspace_need;
    const near = qt.queryCenter(this.pos, max_dist, max_dist);
    for (const [other, _] of near) {
      if (this.flock_id === other.flock_id && this.id === other.id) continue;
      const dist = this.pos.dist(other.pos);
      if (dist < max_dist) {
        const to_other = other.pos.copy().sub(this.pos);
        const segment = int(heading_pos(to_other) / rad_per_segment);
        nodes_and_dists_per_segment[segment].push([other, dist]);
      }
    }
    let nodes_and_dists = []
    for (const segment of nodes_and_dists_per_segment) {
      segment.sort((a, b) => a[1] - b[1]).splice(num_per_segment);
      segment.forEach(nd => nodes_and_dists.push(nd));
    }
    return nodes_and_dists;
  }

  update(flocks, qt, mouse_pos) {
    const nearby_nodes = (SURROUND_OR_CLOSEST
                          ? this.get_surrounding_nodes(flocks, qt)
                          : this.get_nearest_nodes(flocks, qt));

    const curspeed = this.vel.mag();
    const max_space_awareness = SPACE_AWARE_MULT * this.zspace_need;
    const sep_force = createVector(); let sep_n = 0;
    const ali_force = createVector(); let ali_n = 0;
    for (const [other, dist] of nearby_nodes) {
      // numerator for separation force computation. with divisor of dist^2,
      // this works out to 1 when other node is zspace_need away.
      const sep_force_num = this.zspace_need * other.zspace_need;
      const same_flock = this.flock_id === other.flock_id;
      const away = p5.Vector.sub(this.pos, other.pos).normalize();
      if (same_flock) {
        sep_force.add(away.copy().mult(
          SEPARATION_FORCE * curspeed * sep_force_num / pow(dist, 2)
          - COHESION_FORCE * curspeed * dist / this.zspace_need
        )); ++sep_n;
        ali_force.add(other.vel); ++ali_n;
      } else {
        sep_force.add(away.copy().mult(
          NF_SEPARATION_FORCE * curspeed * sep_force_num / pow(dist, 2)
        )); ++sep_n;
      }
      if (DEBUG_NEIGHBORS && (!DEBUG_FORCE || this.debugf)) {
        if (same_flock && dist < this.zspace_need) {
          strokeWeight(2);
          stroke(330, 90, map(dist, 3, this.zspace_need, 100, 40));
        } else if (same_flock) {
          strokeWeight(0.5);
          stroke(120, 85, map(dist, this.zspace_need, max_space_awareness, 35, 100));
        } else {
          strokeWeight(1);
          stroke(210, 95, map(dist, 3, max_space_awareness, 100, 20));
        }
        line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      }
    }

    if (mouse_pos) {
      // HACK: some magic numbers here... large repel multiplier to make
      // repelling more dramatic. also using log(dist^2) (as opposed to more
      // usual dist) to lessen attractive force, since it feels a bit more
      // natural. When multiplying just by 'dist', every node just heads
      // straight for the mouse, since we aren't limiting  to only nodes within
      // some radius.
      const away = this.pos.copy().sub(mouse_pos);
      const dist_sq = away.magSq();
      if (MOUSE_REPEL && dist_sq < sq(TOUCH_RAD)) {
        ++sep_n;
        sep_force.add(away.setMag(
          10 * SEPARATION_FORCE * curspeed * TOUCH_RAD * this.zspace_need / dist_sq));
      } else if (!MOUSE_REPEL) {
        ++sep_n;
        sep_force.add(away.setMag(
          -2 * COHESION_FORCE * curspeed * log(dist_sq) / this.zspace_need));
      }
    }

    const tot_force = createVector();
    if (sep_n) { tot_force.add(sep_force.div(sep_n)); }
    if (ali_n) {
      ali_force.div(ali_n).sub(this.vel);
      tot_force.add(ali_force.mult(ALIGNMENT_FORCE));
    }
    if (this.debugf) {
      const dpos = createVector(this.pos.x - 10, this.pos.y + 10);
      fill(0, 90, 90); draw_triangle(dpos, sep_force, sep_force.mag() * 10);
      fill(120, 90, 90); draw_triangle(dpos, ali_force, ali_force.mag() * 10);
    }

    this.vel.add(tot_force.limit(MAX_FORCE));
    if (random(1) < RAND_MOVE_FREQ) {
      this.vel.add(p5.Vector.random2D().setMag(this.vel.mag() * RAND_MOVE_MULT));
    }
    const nsw = NATURAL_SPEED_WEIGHT;
    const mag = min(this.vel.mag() * (1-nsw) + this.natural_speed * nsw, this.speed_limit);
    this.vel.setMag(mag);
    const speed_avg_weight = 0.5;
    this.speed_avg = mag * (1-speed_avg_weight) + this.speed_avg * speed_avg_weight;
    this.pos.add(this.vel.copy().mult(SPEED));
    wrap_vector(this.pos);
  }
}  // Node

function create_random_flock(flock_id) {
  const flock = [];
  const c = rand_color();
  const size = rand_bound(NODE_SIZE_RANDBOUND);
  const space_need = size * 2 * random(0.8, 1.2);
  // TODO: make speed variant match size, with smaller being faster, or vice versa?
  const speed = rand_bound(SPEED_RANDBOUND);
  const pos = rand_position();
  const vel = p5.Vector.random2D().mult(speed);
  for (let i = 0; i < rand_bound(GROUP_SIZE_RANDBOUND); ++i) {
    // TODO: more principled random fuzz amount.
    const posfuzzed = p5.Vector.add(pos, p5.Vector.random2D().mult(random(space_need * 3)));
    // Note: speed set to same value.
    const velfuzzed = p5.Vector.random2D().mult(speed/3).add(vel).setMag(speed);
    flock.push(new Node(i, flock_id, posfuzzed, velfuzzed, space_need,
                        hue_shift(c, random(0.97, 1.03)), size * random(0.8, 1.2)));
  }
  return flock;
}

function init_node_flocks() {
  FLOCKS = [];
  for (let i = 0; i < rand_bound(NUM_GROUPS_RANDBOUND); ++i)
    FLOCKS.push(create_random_flock(i));
  update_count_displays();
}

function copy_flocks_build_quadtree(flocks) {
  const qt = new Quadtree(createVector(0,0), width, height);
  const flocks_copy = flocks.map(f => f.map(n => {
    qt.insert(n, n.pos);
    return n.copy();
  }));
  return [flocks_copy, qt];
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(25);
  colorMode(HSB);

  create_control_panel();
  setTimeout(toggle_control_panel, 1000);
  init_node_flocks();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// Note: we need touchMoved() to return false in order for touch interactions to
// work on mobile. However, this also disables the ability to use the sliders in
// the control panel. Sooo, we toggle this value depending on whether the
// control  panel is shown.
let ALLOW_TOUCH_MOVED = false;
function touchMoved() { return ALLOW_TOUCH_MOVED; }

function draw() {
  background(225, 22, 7);
  let mouse_pos = mouseIsPressed ? createVector(mouseX, mouseY) : null;
  if (touches.length > 0) {
    // HACK: with 2 touches, always attract.
    if (touches.length > 1) {
      MOUSE_REPEL = false; MOUSE_REPEL_CHECKBOX.checked(false);
    }
    mouse_pos = createVector();
    for (const {x,y} of touches) {
      mouse_pos.add(createVector(x, y));
      noStroke(); fill(355, 90, 30, .5); ellipse(x, y, 40, 40);
    }
    mouse_pos.div(touches.length);
  }

  const [tmp_flocks, qt] = copy_flocks_build_quadtree(FLOCKS);
  for (const flock of FLOCKS) {
    for (const node of flock) {
      node.draw();
      node.update(tmp_flocks, qt, mouse_pos);
    }
  }

  if (mouse_pos) {
    strokeWeight(1);
    if (MOUSE_REPEL) {
      stroke(0, 100, 30); fill(350, 90, 60, .10);
      ellipse(mouse_pos.x, mouse_pos.y, TOUCH_RAD*2, TOUCH_RAD*2);
    } else {
      stroke(120, 100, 20); fill(110, 90, 60, .10);
      ellipse(mouse_pos.x, mouse_pos.y, TOUCH_RAD/2, TOUCH_RAD/2);
    }
  }

  if (DEBUG_QUADTREE) draw_quadtree(qt, 0);
}

function draw_quadtree(tree, level) {
  strokeWeight(1);
  stroke(color(level * 55 % 360, 100, 90));
  noFill();
  rect(tree.topleft.x + level, tree.topleft.y + level,
       tree.width-level, tree.height-level);
  if (tree.nw !== null) {
    draw_quadtree(tree.nw, ++level);
    draw_quadtree(tree.ne, level);
    draw_quadtree(tree.se, level);
    draw_quadtree(tree.sw, level);
  }
}

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

function update_count_displays() {
  NUM_FLOCKS_ELT.html(`# flocks [${FLOCKS.length}]`);
  NUM_NODES_ELT.html(`# nodes [${FLOCKS.map(a=>a.length).reduce((a,b)=>a+b, 0)}]`);
}

function change_num_flocks(dir) {
  if (dir > 0) {
    FLOCKS.push(create_random_flock(FLOCKS.length));
  } else if (FLOCKS.length >= 2) {
    const to_remove = floor(random(FLOCKS.length));
    FLOCKS.splice(to_remove, 1);
    // Update flock ids for subsequent flocks to maintain invariant that array
    // index equals flock id.
    for (let i = to_remove; i < FLOCKS.length; ++i)
      for (const n of FLOCKS[i])
        n.flock_id = i;
  }
  update_count_displays();
}

function change_flock_size(dir) {
  for (const flock of FLOCKS) {
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
  update_count_displays();
}

// Creates slider with label, including display of value.
function make_slider(label, min, max, startval, step, parent, updatefn) {
  const container = createDiv().parent(parent);
  const labelelt = createSpan(`${label} [${startval}]`).parent(container);
  const slider = createSlider(min, max, startval, step).parent(container);
  slider.input((e) => {
    const val = e.target.valueAsNumber;
    labelelt.html(`${label} [${val}]`);
    if (updatefn) updatefn(val);
  });
  if (updatefn) updatefn(startval);
  return slider;
}

// Creates number input with label.
function make_number_input(label, min, max, startval, step, size, parent, updatefn) {
  const container = createDiv().parent(parent);
  createSpan(label + ' ').parent(container);
  const input = createInput(str(startval), 'number').parent(container);
  if (min !== null) input.attribute('min', min);
  if (max !== null) input.attribute('max', max);
  if (step !== null) input.attribute('step', step);
  if (size !== null) input.size(size);
  if (updatefn) {
    input.input((e) => { updatefn(e.target.valueAsNumber) });
    updatefn(startval);
  }
  return input;
}

function make_checkbox(label, startval, parent, updatefn) {
  const checkbox = createCheckbox(label, startval).parent(parent);
  if (updatefn) {
    // Note: input() works on desktop (mouse, keyboard), but not mobile :-/.
    checkbox.changed((e) => updatefn(e.target.checked));
    updatefn(startval);
  }
  return checkbox;
}

// Creates button. 'f' is both mousePressed and keydown (space, enter) handle.
function make_button(label, parent, f) {
  const b = createButton(label).parent(parent);
  b.mousePressed(f);
  b.elt.onkeydown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      // e.preventDefault();  // is this needed/useful?
      f();
    }
  }
  return b;
}

let CONTROL_PANEL;
let TOGGLE_CONTROL_PANEL_BUTTON;
let NUM_FLOCKS_ELT, NUM_NODES_ELT, FRAMERATE_ELT, MOUSE_REPEL_CHECKBOX;

function toggle_control_panel() {
  if (CONTROL_PANEL.attribute('status') === 'hidden') {
    CONTROL_PANEL.attribute('status', 'shown');
    CONTROL_PANEL.style('translate', 0, 0);
    TOGGLE_CONTROL_PANEL_BUTTON.html('hide');
    ALLOW_TOUCH_MOVED = true;
  } else {
    CONTROL_PANEL.attribute('status', 'hidden');
    const ty = CONTROL_PANEL.size()['height'] + parseInt(CONTROL_PANEL.style('bottom'), 10);
    CONTROL_PANEL.style('translate', 0, ty);
    TOGGLE_CONTROL_PANEL_BUTTON.html('show');
    ALLOW_TOUCH_MOVED = false;
  }
}

function create_control_panel() {
  CONTROL_PANEL = createDiv().id('controlPanelFull').attribute('status', 'shown');
  TOGGLE_CONTROL_PANEL_BUTTON = make_button('hide', CONTROL_PANEL, toggle_control_panel).id('showControlPanelButton');

  // Holds all the controls. Excludes the toggle button
  const main = createDiv().id('controlPanelMain').parent(CONTROL_PANEL);

  // Basic controls: pause, reinit, change speed, size, # flocks.
  const basic_controls = createDiv().parent(main);
  const br = () => createElement('br').parent(basic_controls);
  if (fullscreen_supported())
    make_button('full', basic_controls, toggle_fullscreen);
  make_button('pause', basic_controls, toggle_paused); br();
  make_button('reinit flocks', basic_controls, init_node_flocks); br();
  const framerate_elt = createDiv().parent(basic_controls);
  setInterval(() => framerate_elt.html(`framerate ${frameRate().toFixed(1)}`), 1000);
  NUM_FLOCKS_ELT = createSpan().parent(basic_controls);
  make_button('-', basic_controls, () => change_num_flocks(-1));
  make_button('+', basic_controls, () => change_num_flocks(+1));
  br();
  NUM_NODES_ELT = createSpan().parent(basic_controls);
  make_button('-', basic_controls, () => change_flock_size(-1));
  make_button('-', basic_controls, () => change_flock_size(+1));
  update_count_displays();
  make_number_input('speed', 0.1, null, 1, 0.1, 32, basic_controls, x=>SPEED=x);
  make_number_input('size', 0.1, null, 1, 0.1, 32, basic_controls, x=>ZOOM=x);

  // Debugging tools.
  MOUSE_REPEL_CHECKBOX = make_checkbox('mouse repel', true, basic_controls, x=>MOUSE_REPEL=x);
  make_checkbox('surround',    true, basic_controls, x=>SURROUND_OR_CLOSEST=x);
  make_checkbox('links',      false, basic_controls, x=>DEBUG_NEIGHBORS=x);
  make_checkbox('space need', false, basic_controls, x=>DEBUG_DISTANCE=x);
  make_checkbox('forces',     false, basic_controls, x=>DEBUG_FORCE=x);
  make_checkbox('quadtree',   false, basic_controls, x=>DEBUG_QUADTREE=x);
  // Purely visual options.
  make_checkbox('circles',    false, basic_controls, x=>CIRCLES=x);

  // Sliders for forces and such.
  const sliders = createDiv().id('sliders').parent(main);

  make_slider('nf separation', 0, 10, 5, .05, sliders, x=>NF_SEPARATION_FORCE=x);
  make_slider('separation',    0, 10, 2, .05, sliders, x=>SEPARATION_FORCE=x);
  make_slider('cohesion',      0, 10, 1, .05, sliders, x=>COHESION_FORCE=x);
  make_slider('alignment',     0, 10, 1, .05, sliders, x=>ALIGNMENT_FORCE=x);

  make_slider('max force',        0, 5, .6, .05, sliders, x=>MAX_FORCE=x);
  make_slider('nat speed weight', 0, 1, .2, .05, sliders, x=>NATURAL_SPEED_WEIGHT=x);

  make_slider('space aware mult', 0, 10, 6, .5, sliders, x=>SPACE_AWARE_MULT=x);
  make_slider('# segments (#nbrs)', 0, 30, 5, 1, sliders, x=>NUM_NEIGHBORS=x);
  make_slider('#/seg (#nf nbrs)',   0, 30, 1, 1, sliders, x=>NF_NUM_NEIGHBORS=x);
  make_slider('rand move freq', 0, 1, .1, .02, sliders, x=>RAND_MOVE_FREQ=x);
  make_slider('rand move mult', 0, 1, .05, .01, sliders, x=>RAND_MOVE_MULT=x);
}

// h/t https://developers.google.com/web/fundamentals/native-hardware/fullscreen/
function fullscreen_junk() {
  const doc = window.document;
  const docEl = doc.documentElement;
  const elt = doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
  const request = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  const cancel = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
  return [elt, request, cancel, doc, docEl];
}
function fullscreen_supported() {
  const [fs_elt, request_fs, cancel_fs] = fullscreen_junk();
  return !(request_fs === undefined || cancel_fs === undefined);
}
function toggle_fullscreen() {
  const [fs_elt, request_fs, cancel_fs, doc, docEl] = fullscreen_junk();
  if (!fs_elt) { request_fs.call(docEl); }
  else { cancel_fs.call(doc); }
}
