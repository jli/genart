'use strict';

// Sand spline rip off. Not as nice though...
// https://inconvergent.net/generative/sand-spline/
// - points instead?
// - b-splines


let SPLINES = [];

const RAND_SPLINES_SPACE = [5, 30];
const RAND_NUM_POINTS = [30, 80];
const RAND_UPDATE_MAG = [0, 1];//[-.05, .05];
const HUE_SHIFT = [80, 120];

const MAX_FRAMES = 600;
let FCOUNT = 0;  // frameCount, but resettable


// TODO: copied from flocks.
function rand_bound(bounds) { return floor(random(bounds[0], bounds[1] + 1)); }


class Spline {
  constructor(points, hue) {
    this.points = points;
    this.hue = hue;
  }
  draw() {
    noFill();
    strokeWeight(.2);
    stroke(this.hue, 100, 70, 0.05);
    let i = 0;
    while (i < this.points.length - 3) {
      curve(
        this.points[i].x, this.points[i].y,
        this.points[i+1].x, this.points[i+1].y,
        this.points[i+2].x, this.points[i+2].y,
        this.points[i+3].x, this.points[i+3].y);
      i += 1;
    }
    //for (let p of this.points) { fill(0); ellipse(p.x, p.y, 2); }
  }
  update(scale) {
    for (let i = 1; i < this.points.length; ++i) {
      this.points[i].add(
        p5.Vector.random2D().mult(
          map(scale, 0, 1, 0.03, 2) * i/this.points.length * rand_bound(RAND_UPDATE_MAG)));
    }
  }
}

function init() {
  background(100);
  FCOUNT = 0;
  SPLINES = [];
  const inc = rand_bound(RAND_SPLINES_SPACE);
  const num_points = rand_bound(RAND_NUM_POINTS);
  const num_splines = ceil(windowHeight / inc);
  const hshift = rand_bound(HUE_SHIFT) / num_splines;

  let hue = random(360);
  for (let i = 0; i < num_splines; ++i) {
    const start = createVector(0, inc*i + inc/2);
    const end = createVector(windowWidth, inc*i + inc/2);
    hue += hshift;
    let points = [start.copy()];
    for (let j = 0; j < num_points; ++j) {
      points.push(start.copy().lerp(end, j / num_points));
    }
    points.push(end.copy());
    points.push(end.copy());
    SPLINES.push(new Spline(points, hue));
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
  for (let i = 0; i < SPLINES.length; ++i) {
    SPLINES[i].draw(); SPLINES[i].update(i / SPLINES.length);
  }
  ++FCOUNT;
  if (FCOUNT > MAX_FRAMES) {
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
