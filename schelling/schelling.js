//// consts

const EMPTY = 0;
const JET = 1;
const SHARK = 2;
const DEBUG = true;

//// vars

let GRID_COLS = 35;
let GRID_ROWS = 35;
let GRID_PIXELS = 10;

let SIMILARITY_FRAC = 0.30;
let POP_BALANCE = 0.5;
let EMPTY_FRAC = 0.1;

let FRAME_RATE = 5;

//// state

let world;


//// impl

function setup() {
  colorMode(HSB, 100);
  createCanvas(GRID_COLS * GRID_PIXELS, GRID_ROWS * GRID_PIXELS);
  frameRate(FRAME_RATE);
  initWorld();
}

function draw() {
  world.draw();
  world.step();
}

function keyPressed() {
  switch (key) {
    case 'p': togglePaused(); break;
    case 'r': initWorld(); break;
  }
}

let PAUSED = false;
function togglePaused() {
  PAUSED = !PAUSED;
  if (PAUSED) { noLoop(); } else { loop(); }
}

// function windowResized() { resizeCanvas(windowWidth, windowHeight); }

//// World
function initWorld() {
  world = new World(GRID_COLS, GRID_ROWS, GRID_PIXELS, SIMILARITY_FRAC, POP_BALANCE, EMPTY_FRAC);
}

class World {
  constructor(
    ncols, nrows, gridPixels, similarFrac, popBalance, emptyFrac) {
    this.gen = 0;
    this.ncols = ncols;
    this.nrows = nrows;
    this.gridPixels = gridPixels;
    this.similarFrac = similarFrac;

    this.grid = this.randInit(popBalance, emptyFrac);
  }

  randInit(popBalance, emptyFrac) {
    const w = new Array(this.ncols * this.nrows);
    for (let i = 0; i < w.length; ++i) {
      w[i] = randomAgent(popBalance, emptyFrac);
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
    const [unhappys, emptys] = this.computeUnhappyAndEmpty();
    this.moveUnhappys(unhappys, emptys);
    ++this.gen;
  }

  computeUnhappyAndEmpty() {
    let unhappys = [];
    let emptys = [];
    this.grid.forEach((x, i) => {
      if (x === EMPTY) { emptys.push(i); }
      else if (!this.isAgentHappy(x, i)) { unhappys.push(i); }
    });
    // TODO: could have most unhappy agents move first instead.
    // TODO: wtf?? how does this not shuffle in-place?
    unhappys = shuffle(unhappys);
    emptys = shuffle(emptys);
    return [unhappys, emptys];
  }

  moveUnhappys(unhappys, emptys) {
    unhappys.forEach(i => {
      if (emptys.length) {
        this.grid[emptys.pop()] = this.grid[i];
        this.grid[i] = EMPTY;
      }
    });
  }

  isAgentHappy(x, i) {
    const ns = this.getNeighbors(i);
    if (ns.length === 0) { return true; }
    let numSame = 0;
    ns.forEach(y => { if (x === y) { ++numSame; } });
    return numSame / ns.length >= this.similarFrac;
  }

  // Gets non-empty neighbors.
  getNeighbors(i) {
    const is = neighborIndices(i, this.ncols, this.nrows);
    const ns = [];
    is.forEach(i => {
      const n = this.grid[i];
      if (n !== EMPTY) { ns.push(n); }
    });
    return ns;
  }
}

//// Agent functions

function randomAgent(popBalance, emptyFrac) {
  const f = Math.random();
  if (f < emptyFrac) {
    return EMPTY;
  }
  return Math.random() < popBalance ? JET : SHARK;
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

function coordStr(i, ncols) {
  const [c, r] = convert1d2d(i, ncols);
  return `${c},${r}`;
}

// sigh.
function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
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
