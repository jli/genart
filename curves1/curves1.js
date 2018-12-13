'use strict';

// TODO:
// - status: % complete
// - control panel: stuff
// - interaction between points, attract/repel

let RIVULETS = [];

const RAND_NUM_RIVS = [2, 8];
const RAND_UPDATE_MAG = [1, 9];
const RAND_UPDATE_MAG_END = [0, .2];
const HUE_SHIFT = [20, 30];

const MAX_FRAMES = 300;
let FCOUNT = 0;  // frameCount, but resettable


// TODO: copied from flocks.
function rand_bound(bounds) { return floor(random(bounds[0], bounds[1] + 1)); }


class Rivulet {
  constructor(start, c1, c2, end, hue) {
    this.start = start; this.c1 = c1; this.c2 = c2; this.end = end;
    this.hue = hue;
  }
  draw() {
    noFill();
    // Over time, decrease saturation, increase brightness, decrease alpha.
    stroke(
      this.hue,
      map(FCOUNT, 0, MAX_FRAMES, 100, 10),
      map(FCOUNT, 0, MAX_FRAMES, 60, 80),
      map(FCOUNT, 0, MAX_FRAMES, .6, .03));
    bezier(this.start.x, this.start.y, this.c1.x, this.c1.y,
      this.c2.x, this.c2.y, this.end.x, this.end.y);
  }
  update() {
    this.c1.add(p5.Vector.random2D().mult(rand_bound(RAND_UPDATE_MAG)));
    this.c2.add(p5.Vector.random2D().mult(rand_bound(RAND_UPDATE_MAG)));
    this.end.add(p5.Vector.random2D().mult(rand_bound(RAND_UPDATE_MAG_END)));
  }
}

function init() {
  background(97);
  FCOUNT = 0;
  RIVULETS = [];

  let hue = random(360);
  const start = createVector(random(0, windowWidth), random(windowHeight * .9,  windowHeight * .95));
  const c1 = createVector(random(windowWidth * .1, windowWidth * .9), random(windowHeight *  .1, windowHeight * .9));
  for (let i = 0; i < rand_bound(RAND_NUM_RIVS); ++i) {
    hue += rand_bound(HUE_SHIFT);
    const c2 = createVector(random(windowWidth * .1, windowWidth * .9), random(windowHeight *  .1, windowHeight * .9));
    const end = createVector(random(windowWidth * .1, windowWidth * .9), random(windowHeight * .05, windowHeight * .1));
    RIVULETS.push(new Rivulet(start, c1.copy(), c2, end, hue));
  }
}

function setup() {
  colorMode(HSB);
  frameRate(60);
  createCanvas(windowWidth, windowHeight);
  init();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function draw() {
  for (const r of RIVULETS) {
    r.draw(); r.update();
  }
  ++FCOUNT;
  if (FCOUNT > MAX_FRAMES * 1.08) {
    init();
  }
}

let PAUSED = false;
function toggle_paused() {
  PAUSED = !PAUSED;
  if (PAUSED) { noLoop(); } else { loop(); }
}

function keyPressed() {
  switch (key) {
    case 'p': toggle_paused(); break;
    case 'r': init(); break;
  }
}
