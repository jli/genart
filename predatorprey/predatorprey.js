const GRID_SIZE = 10;
const GRID_ROWS = 20;
const GRID_COLS = 20;

const EMPTY = 0;
const PREY = 1;
const PREDATOR = 2;

let grid;

function array2d_copy(a) {
  let a2 = new Array(a.length);
  for (const [r, row] of a.entries()) {
    a2[r] = row.slice();
  }
  return a2;
}

function index_wrap(i, max_val) {
  let i2 = i;
  if (i < 0) { i2 = i + max_val; }
  else if (i >= max_val) { i2 = i - max_val; }
  return i2;
}

function neighbors(r, c, grid) {
  const wr = (r) => index_wrap(r, GRID_ROWS);
  const wc = (c) => index_wrap(c, GRID_COLS);
  return [
    grid[wr(r-1)][wc(c-1)],
    grid[wr(r)][wc(c-1)],
    grid[wr(r+1)][wc(c-1)],
    grid[wr(r-1)][wc(c)],
    grid[wr(r+1)][wc(c)],
    grid[wr(r-1)][wc(c+1)],
    grid[wr(r)][wc(c+1)],
    grid[wr(r+1)][wc(c+1)],
  ];
}

class Grid {
  constructor(num_rows, num_cols, frac_prey, frac_pred) {
    this.grid = new Array(num_rows);
    for (let r = 0; r < num_rows; ++r) {
      this.grid[r] = new Array(num_cols);
      //this.grid[r].fill(EMPTY);
      for (let c = 0; c < num_cols; ++c) {
        let val = EMPTY;
        if (Math.random() < frac_prey) { val = PREY; }
        else if (Math.random() < frac_pred) { val = PREDATOR; }
        this.grid[r][c] = val;
      }
    }
  }
  step() {
    let grid2 = array2d_copy(this.grid);
    for (let [r, row] of grid2.entries()) {
      for (let [c, val] of row.entries()) {
        const ns = neighbors(r, c, grid2);
        let num_prey_ns = 0;
        let num_pred_ns = 0;
        for (const n of ns) {
          if (n === PREY) ++num_prey_ns;
          if (n === PREDATOR) ++num_pred_ns;
        }
        let val2 = EMPTY;
        switch (val) {
          case EMPTY:
            if (num_prey_ns > 1 && num_pred_ns < 1) val2 = PREY;
            else val2 = EMPTY;
            break;
          case PREY:
            if (num_pred_ns > 1) val2 = EMPTY;
            else val2 = PREY;
            break;
          case PREDATOR:
            if (num_prey_ns > 0) val2 = PREDATOR;
            else val2 = EMPTY;
            break;
        }
        this.grid[r][c] = val2;
      }
    }
  }
  draw() {
    for (let [r, row] of this.grid.entries()) {
      for (let [c, val] of row.entries()) {
        let colr;
        switch (val) {
          case EMPTY: colr = 250; break;
          case PREY: colr = color(120, 50, 80); break;
          case PREDATOR: colr = color(0, 80, 90); break;
        }
        fill(colr);
        rect(r * GRID_SIZE, c * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }
    }
  }
}

function setup() {
  colorMode(HSB);
  createCanvas(windowWidth, windowHeight);
  grid = new Grid(GRID_ROWS, GRID_COLS, 0.2, 0.1);
  frameRate(1);
  // noLoop();

}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function draw() {
  grid.draw();
  grid.step();
}
