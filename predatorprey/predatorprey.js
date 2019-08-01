const GRID_SIZE = 8;
const GRID_ROWS = 100;
const GRID_COLS = 100;

const INIT_PREY_FRAC = .04;
const INIT_PREDATOR_FRAC = .03;

// js's settings:
// const PREDATOR_FEED_CYCLE = 3;
// const PREDATOR_BREED_CYCLE = 7;
// const PREY_BREED_CYCLE = 3;
const PREDATOR_FEED_CYCLE = 5;
const PREDATOR_BREED_CYCLE = 10;
const PREY_BREED_CYCLE = 3;
const PREY_BREED_NEED_CYCLE = 1000;

// De-syncs the pulses a bit. Maybe should use a different randomization method.
const PREDATOR_BIRTH_PROB = 0.6;
const PREY_BIRTH_PROB = 0.8;

const PREY_MOVES = true;
const PREY_NEEDS_PARTNER_TO_BREED = false;

const WRAPAROUND_WORLD = false;
const DRAW_RECT = true;
const RATE = 15;

const CELL_EMPTY = 0;
const CELL_PREDATOR = 2;
const CELL_PREY = 1;

let WORLD;

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

function array2d(num_rows, num_cols, init_val) {
  let arr = new Array(num_rows);
  for (let r = 0; r < num_rows; ++r) {
    arr[r] = new Array(num_cols);
    arr[r].fill(init_val);
  }
  return arr;
}

function index_wrap(i, max_val) {
  let i2 = i;
  if (i < 0) { i2 = i + max_val; }
  else if (i >= max_val) { i2 = i - max_val; }
  return i2;
}

function for2d(arr, f) {
  for (const [row_num, row] of arr.entries()) {
    for (const [col_num, cell] of row.entries()) {
      f(row_num, col_num, cell);
    }
  }
}

class Cell {
  constructor(type) {
    this.t = type;
    this.birth = frameCount;
    this.last_update = 0;
    this.last_breed = frameCount;
    this.last_feed = frameCount;  // predator-only field
  }
  draw(r, c) {
    let col;
    switch (this.t) {
      case CELL_EMPTY: return;
      case CELL_PREDATOR:
        // predators get darker the longer they don't eat
        const hunger = frameCount - this.last_feed;
        const feed_mult = map(hunger, 0, PREDATOR_FEED_CYCLE, 1, .2);
        col = color(0, 100, 100 * feed_mult);
        break;
      case CELL_PREY:
        // new prey are brighter
        const age = frameCount - this.birth;
        const age_mult = map(age, 0, 100, 2, .5);
        col = color(120, 50, 50 * age_mult);
        break;
    }
    fill(col);
    if (DRAW_RECT) rect(r * GRID_SIZE, c * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    else ellipse(r * GRID_SIZE + GRID_SIZE/2, c * GRID_SIZE + GRID_SIZE/2, GRID_SIZE, GRID_SIZE);
  }
}

class World {
  constructor(num_rows, num_cols, predator_frac, prey_frac) {
    this.num_rows = num_rows;
    this.num_cols = num_cols;
    this.grid = array2d(num_rows, num_cols);
    this.random_init(predator_frac, prey_frac);
  }

  random_init(predator_frac, prey_frac) {
    for (const [r, row] of this.grid.entries()) {
      for (let c = 0; c < row.length; ++c) {
        let t = CELL_EMPTY;
        if (Math.random() < prey_frac) t = CELL_PREY;
        else if (Math.random() < predator_frac) t = CELL_PREDATOR;
        this.grid[r][c] = new Cell(t);
      }
    }
  }

  draw() {
    for2d(this.grid, (r, c, x) => x.draw(r, c));
  }

  update() {
    let changed = [false];
    const change_cb = () => changed[0] = true;
    for2d(this.grid, (r, c, cell) => {
      if (cell.last_update === frameCount) return;
      switch (cell.t) {
        case CELL_PREDATOR: this.predator_action(r, c, cell, change_cb); break;
        case CELL_PREY: this.prey_action(r, c, cell, change_cb); break;
      }
      cell.last_update = frameCount;
    });
    return changed[0];
  }

  predator_action(r, c, pred, changed_cb) {
    const prey_pos = find_cell(this.grid, r, c, CELL_PREY);
    if (prey_pos) {
      // move and eat prey
      this.grid[prey_pos[0]][prey_pos[1]] = pred;
      this.grid[r][c] = new Cell(CELL_EMPTY);
      pred.last_feed = frameCount;
      changed_cb();
    } else if (frameCount - pred.last_feed > PREDATOR_FEED_CYCLE) {
      // die
      this.grid[r][c] = new Cell(CELL_EMPTY);
      changed_cb();
      return;
    } else {
      // move to random empty cell
      const pos = find_cell(this.grid, r, c, CELL_EMPTY);
      if (pos) {
        this.grid[pos[0]][pos[1]] = pred;
        this.grid[r][c] = new Cell(CELL_EMPTY);
        changed_cb();
      }
    }
    if (frameCount - pred.last_breed > PREDATOR_BREED_CYCLE
        && Math.random() < PREDATOR_BIRTH_PROB) {
      // Prefer to spawn into empty space, but spawn over a prey cell if necessary.
      let pos = find_cell(this.grid, r, c, CELL_EMPTY);
      if (!pos) { pos = find_cell(this.grid, r, c, CELL_PREY); }
      if (pos) {
        this.grid[pos[0]][pos[1]] = new Cell(CELL_PREDATOR);
        pred.last_breed = frameCount;
        changed_cb();
      }
    }
  }

  prey_action(r, c, prey, changed_cb) {
    const prey_pos = find_cell(this.grid, r, c, CELL_PREY);
    const empty_pos = find_cell(this.grid, r, c, CELL_EMPTY);
    if (frameCount - prey.last_breed > PREY_BREED_CYCLE && empty_pos
        && Math.random() < PREY_BIRTH_PROB
        && (prey_pos || !PREY_NEEDS_PARTNER_TO_BREED)) {
      // breed
      this.grid[empty_pos[0]][empty_pos[1]] = new Cell(CELL_PREY);
      prey.last_breed = frameCount;
      changed_cb();
    } else if (frameCount - prey.last_breed > PREY_BREED_NEED_CYCLE) {
      // die
      this.grid[r][c] = new Cell(CELL_EMPTY);
      changed_cb();
    } else if (empty_pos && PREY_MOVES) {
      this.grid[empty_pos[0]][empty_pos[1]] = prey;
      this.grid[r][c] = new Cell(CELL_EMPTY);
      changed_cb();
    }
  }
}

const NEIGHBOR_DIRS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [0, 1],
  [-1, 1], [0, 1], [1, 1],
];

function find_cell(grid, r, c, type) {
  const dirs = shuffle(NEIGHBOR_DIRS);
  for (const [rd, cd] of dirs) {
    let r2 = rd + r;
    let c2 = cd + c;
    if (!WRAPAROUND_WORLD && (r2 < 0 || r2 >= GRID_ROWS || c2 < 0 || c2 >= GRID_ROWS)) {
      continue;
    }
    r2 = index_wrap(r2, GRID_ROWS);
    c2 = index_wrap(c2, GRID_COLS);
    const cell = grid[r2][c2];
    if (cell.t === type) return [r2, c2];
  }
  return null;
}

function init() {
  WORLD = new World(GRID_ROWS, GRID_COLS, INIT_PREDATOR_FRAC, INIT_PREY_FRAC);
}

function setup() {
  colorMode(HSB);
  frameRate(RATE);
  noStroke();
  createCanvas(windowWidth, windowHeight);
  init();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

let last_change = 0;

async function draw() {
  background(0);
  const changed = WORLD.update();
  WORLD.draw();
  if (changed) last_change = frameCount;
  if (frameCount - last_change > 10) {
    console.log('resetting...');
    init();
  }
}
