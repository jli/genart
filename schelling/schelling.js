/*
TODO:
- disable step when all happy
- add value labels
- handle changes to pop balance, empty frac, size?
- add random movement for happy people?

Bigger:
- graph of blue/red satisfaction
- graph of amount of blue/red migration

Much bigger:
- use sensible frontend library...?
- more intelligent migration? prefer to move closer?
*/

//// consts

const EMPTY = 0;
const JET = 1;
const SHARK = 2;
const DEBUG = true;
const CANVAS_PARENT = 'sketch';

//// vars

const INIT_DIM = 50;
let GRID_COLS;
let GRID_ROWS;
let CANVAS_SIZE;
let GRID_PIXELS;
function setSize(gridDim) {
  GRID_COLS = gridDim;
  GRID_ROWS = gridDim;
  CANVAS_SIZE = Math.min(windowWidth * 0.8, windowHeight * 0.8);
  GRID_PIXELS = CANVAS_SIZE / GRID_COLS;
}

let JET_SIMILARITY_FRAC = 0.40;
let JET_DIVERSITY = false;
let SHARK_SIMILARITY_FRAC = 0.40;
let SHARK_DIVERSITY = false;
let POP_BALANCE = 0.5;
let EMPTY_FRAC = 0.2;

let INIT_FRAME_RATE = 5;

//// state

let world;


//// impl

function setup() {
  setSize(INIT_DIM);
  colorMode(HSB, 100);
  createCanvas(CANVAS_SIZE, CANVAS_SIZE).parent(CANVAS_PARENT);
  frameRate(INIT_FRAME_RATE);
  initWorld();
  noStroke();
}

function draw() {
  world.draw();
  const allHappy = world.step();
  updateStatus(world.gen, world.satisied);
  if (allHappy) {
    world.draw();  // one last time
    noLoop();
  }
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
  world = new World(GRID_COLS, GRID_ROWS, GRID_PIXELS, POP_BALANCE, EMPTY_FRAC);
  loop();  // in case we're paused
}

class World {
  constructor(
    ncols, nrows, gridPixels, popBalance, emptyFrac) {
    this.ncols = ncols;
    this.nrows = nrows;
    this.gridPixels = gridPixels;
    this.grid = this.randInit(popBalance, emptyFrac);
    this.gen = 0;
    const [unhappys, emptys] = this.computeUnhappyAndEmpty();
    this.satisfied = this.computeSatisfiedFrac(unhappys, emptys);
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
    this.satisied = this.computeSatisfiedFrac(unhappys, emptys);
    return unhappys.length === 0;
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

  computeSatisfiedFrac(unhappys, emptys) {
    const pop = this.ncols * this.nrows - emptys.length;
    return (pop - unhappys.length) / pop;
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
    const sameFrac = numSame / ns.length;
    let threshold, diversity;
    switch (x) {
      case JET:
        threshold = JET_SIMILARITY_FRAC;
        diversity = JET_DIVERSITY;
        break;
      case SHARK:
        threshold = SHARK_SIMILARITY_FRAC;
        diversity = SHARK_DIVERSITY;
        break;
      default: throw new Error(`what is ${x}`);
    }
    return (diversity) ? (1 - sameFrac) >= threshold : sameFrac >= threshold;
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
    case JET: fill(00, 90, 95); break;
    case SHARK: fill(59, 90, 95); break;
    default: console.error(`unknown agent: ${e}`);
  }
}


//// Utilities

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
