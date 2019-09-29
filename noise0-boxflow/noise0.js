// TODO:
// - tweak stroke drawing
// - try deviations from exact direction (gaussian, private noise?), or more momentum?
// - make new boxes smaller.
// - make old boxes shrink to 0 instead of just removing?
// - use gui library


var TARGET_NUM_BOXES = 5000;
let BOX_SIZE;
let NUM_ROWS, NUM_COLS;
var OPACITY = 0.2;
var STROKE_OPACITY = 0.0;
var DRAW_STROKE = true;
var SPEED_MULT = 1.0;

var ACC_LIMIT = 2.5;
var VEL_LIMIT = 4.0;
var DRAG = 0.3;
var FLOW_NOISE_POS_MULT = 0.005;
var FLOW_NOISE_TIME_MULT = 0.003;
var SIZE_NOISE_MULT = 0.03;
var SIZE_MULT_MINL = 0.5;
var SIZE_MULT_MAXL = 1.5;

var NUM_REFRESHED_THINGS_PER_FRAME = 0;
var RESET_EVERY_FRAMECOUNT = 2000;
var NOISE_EVERY_N_FRAME = 10;
let THINGS = [];

let gui;

function wrap(x, mx) {
  if (x < -BOX_SIZE/2) return mx;
  if (x > mx+BOX_SIZE/2) return 0;
  return x;
}

function wrap_x(x) { return wrap(x, windowWidth); }
function wrap_y(y) { return wrap(y, windowHeight); }

class Thing {
  constructor(pos, vel, acc) {
    this.pos = pos || createVector(random(0, windowWidth),
                                   random(0, windowHeight));
    this.vel = vel || createVector();
    this.acc = acc || createVector();
    this.size_mult = 1.0;
  }

  draw(col) {
    fill(col, OPACITY);
    if (DRAW_STROKE) {
      let stroke_bright = col > 50 ? 0 : 40;
      stroke(stroke_bright, STROKE_OPACITY);
      // stroke(col, 0.2);
    }
    rect(this.pos.x, this.pos.y,
      BOX_SIZE * this.size_mult, BOX_SIZE * this.size_mult);
  }

  update() {
    let flow = createVector();
    if (count % NOISE_EVERY_N_FRAME === 0) {
      this.size_mult = constrain(
        this.size_mult * map(
            noise(this.pos.x * SIZE_NOISE_MULT, this.pos.y * SIZE_NOISE_MULT),
            0, 1, 0.8, 1.2),
        SIZE_MULT_MINL, SIZE_MULT_MAXL);
      flow = createVector(
          map(noise(this.pos.x * FLOW_NOISE_POS_MULT,
                    this.pos.y * FLOW_NOISE_POS_MULT,
                    frameCount * FLOW_NOISE_TIME_MULT),
              0, 1, -ACC_LIMIT, ACC_LIMIT),
          map(noise(this.pos.x * FLOW_NOISE_POS_MULT + 10000,
                    this.pos.y * FLOW_NOISE_POS_MULT + 10000,
                    frameCount * FLOW_NOISE_TIME_MULT),
              0, 1, -ACC_LIMIT, ACC_LIMIT));
    }
    //this.acc.add(flow).limit(ACC_LIMIT);
    this.acc.add(flow);//.limit(ACC_LIMIT);
    this.acc.mult(1 - DRAG);
    //this.vel.mult(1-VEL_DRAG);
    this.vel.add(this.acc).limit(VEL_LIMIT);
    //this.vel = flow.limit(VEL_LIMIT);
    this.pos.add(this.vel.mult(SPEED_MULT));
    this.pos.x = wrap_x(this.pos.x);
    this.pos.y = wrap_y(this.pos.y);
  }
}

function setup_geometry() {
  const pix_per_box = (windowHeight * windowWidth) / TARGET_NUM_BOXES;
  BOX_SIZE = Math.sqrt(pix_per_box);
  NUM_ROWS = floor(windowHeight/BOX_SIZE);
  NUM_COLS = floor(windowWidth/BOX_SIZE);
  console.log(BOX_SIZE, NUM_ROWS, NUM_COLS);
}

function setup() {
  colorMode(HSB);
  noStroke();
  createCanvas(windowWidth, windowHeight);
  init_world();
  background(0);

  gui = createGui('settings');
  sliderRange(100, 50000, 50);
  gui.addGlobals('TARGET_NUM_BOXES');
  sliderRange(0, 1, 0.005);
  gui.addGlobals('OPACITY', 'STROKE_OPACITY');
  sliderRange(0.1, 1.0, 0.01);
  gui.addGlobals('SIZE_MULT_MINL');
  sliderRange(1.0, 5.0, 0.05);
  gui.addGlobals('SIZE_MULT_MAXL');
  sliderRange(0.05, 5, 0.05);
  gui.addGlobals('SPEED_MULT');
  sliderRange(0.1, 10, 0.1);
  gui.addGlobals('ACC_LIMIT', 'VEL_LIMIT');
  sliderRange(0.01, 1.0, 0.01);
  gui.addGlobals('DRAG');
  sliderRange(0.00001, 0.1, 0.0001);
  gui.addGlobals('FLOW_NOISE_POS_MULT', 'FLOW_NOISE_TIME_MULT', 'SIZE_NOISE_MULT');
  sliderRange(0, 100, 1);
  gui.addGlobals('NUM_REFRESHED_THINGS_PER_FRAME');
  sliderRange(100, 10000, 50);
  gui.addGlobals('RESET_EVERY_FRAMECOUNT');
  sliderRange(1, 100, 1);
  gui.addGlobals('NOISE_EVERY_N_FRAME');
  gui.toggleCollapsed();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function init_world() {
  setup_geometry();  // in case window size changed
  THINGS = [];
  let i = 0;
  for (let r = 0; r < NUM_ROWS; ++r) {
    for (let c = 0; c < NUM_COLS; ++c) {
      const pos = createVector(c * BOX_SIZE, r * BOX_SIZE);
      THINGS.push(new Thing(pos));
    }
  }
}

function random_int(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function refresh_random_thing() {
  THINGS.splice(random_int(THINGS.length), 1);
  THINGS.push(new Thing());
}

let dir = 1;
let count = 0;
function draw() {
  for (let i = 0; i < NUM_REFRESHED_THINGS_PER_FRAME; ++i) refresh_random_thing();

  let bg;
  if (dir > 0) {
    bg = map(count/RESET_EVERY_FRAMECOUNT, 0, 1, 0, 35);
  } else {
    bg = map(count/RESET_EVERY_FRAMECOUNT, 0, 1, 100, 65);
  }
  const fg = 100 - bg;

  background(bg);
  for (let t of THINGS) {
    t.update();
    t.draw(fg);
  }

  ++count;
  if (count >= RESET_EVERY_FRAMECOUNT) {
    count = 0;
    dir *= -1;
    init_world();
  }
  // noLoop();
}

function keyPressed() {
  switch (key) {
    case 'p': toggle_paused(); break;
    case 'r': init_world(); break;
    case ';': gui.toggleCollapsed(); break;
  }
}

let PAUSED = false;
function toggle_paused() {
  PAUSED = !PAUSED;
  if (PAUSED) { noLoop(); } else { loop(); }
}
