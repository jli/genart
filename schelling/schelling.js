//// consts

const EMPTY = 0;
const JET = 1;
const SHARK = 2;
const DEBUG = true;

//// vars

let GRID_COLS = 4;
let GRID_ROWS = 3;
let GRID_PIXELS = 10;

let EMPTY_FRAC = 0.2;
let SIMILARITY_FRAC = 0.25;

let FRAME_RATE = 10;

//// state

let world = null;


//// impl

function setup() {
  colorMode(HSB, 100);
  createCanvas(GRID_COLS * GRID_PIXELS, GRID_ROWS * GRID_PIXELS);
  frameRate(FRAME_RATE);
  world = new World(GRID_COLS, GRID_ROWS, GRID_PIXELS, EMPTY_FRAC, SIMILARITY_FRAC);
}

// function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function draw() {
  world.draw();
  if (world.gen === 0) {
    world.step();
  }
}

//// World

class World {
  constructor(
    ncols, nrows, gridPixels, emptyFrac, similarFrac) {
    this.gen = 0;
    this.ncols = ncols;
    this.nrows = nrows;
    this.gridPixels = gridPixels;
    this.similarFrac = similarFrac;

    this.grid = this.randInit(emptyFrac);
  }

  randInit(emptyFrac) {
    const w = new Array(this.ncols * this.nrows);
    for (let i = 0; i < w.length; ++i) {
      w[i] = randomAgent(emptyFrac);
    };
    return w;
  }

  draw() {
    this.grid.forEach((x, i) => {
      const [c, r] = convert1d2d(i, this.ncols);
      agentColor(x);
      rect(c * this.gridPixels, r * this.gridPixels, this.gridPixels, this.gridPixels);
    });
  }

  step() {
    const old = [...this.grid];
    const emptys = [];
    const unhappys = [];
    old.forEach((x, i) => {
      if (x === EMPTY) { emptys.push(i); }
      else if (!this.isAgentHappy(x, i)) { unhappys.push(i); }
    });
    ++this.gen;
    // console.log(`${this.gen}: emptys:`, emptys, emptys.map(x => convert1d2d(x, this.ncols)),
    //  '\nunhappys:', unhappys.map(i => convert1d2d(i, this.ncols)));
  }

  isAgentHappy(x, i) {
    const ns = this.getNeighbors(i);
    if (ns.length === 0) { return true; }
    let numSame = 0;
    ns.forEach(y => { if (x === y) { ++numSame; } });
    // const ret =  numSame / ns.length >= this.similarFrac;
    // if (!ret) {
    //   console.log(`agent ${i}(${x}) unhappy:`);
    //   console.log('  neighbors:', ns);
    //   console.log('  numSame:', numSame);
    // }
    return numSame / ns.length >= this.similarFrac;
  }

  // Gets non-empty neighbors.
  getNeighbors(i) {
    const is = neighborIndices(i, this.ncols, this.nrows);
    // console.log(`gN(${i}): indices:`, is);
    const ns = [];
    is.forEach(i => {
      const n = this.grid[i];
      if (n !== EMPTY) { ns.push(n); }
    });
    return ns;
  }
}

//// Agent functions

function randomAgent(emptyFrac) {
  const f = Math.random();
  if (f < emptyFrac) {
    return EMPTY;
  }
  return Math.random() < 0.5 ? JET : SHARK;
}

function agentColor(e) {
  switch (e) {
    case EMPTY: fill(0, 0, 90); break;
    case JET: fill(0, 100, 95); break;
    case SHARK: fill(50, 100, 95); break;
    default: console.error(`unknown agent: ${e}`);
  }
}

//// Utilities

function convert1d2d(i, ncols) {
   const col = i % ncols;
   const row = Math.floor(i / ncols);
   return [col, row];
}

function convert2d1d(ic, ir, ncols) {
  return ic + ir * ncols;
}

const NEIGHBOR_DIRS = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0], /*    */ [1,  0],
  [-1,  1], [0,  1], [1,  1],
];

function neighborIndices(i, ncols, nrows) {
  const [c, r] = convert1d2d(i, ncols);
  const nis = [];
  NEIGHBOR_DIRS.forEach(([cd, rd]) => {
    const nc = c + cd, nr = r + rd;
    if (0 <= nc && nc < ncols && 0 <= nr && nr < nrows) {
      // console.log(`nI: (${i}=${c},${r} + ${cd},${rd})`)
      nis.push(convert2d1d(nc, nr, ncols));
    }
  });
  return nis;
}
