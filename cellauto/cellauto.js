let I_GRID_SIZE = 25;
// if these are falsey, rows/cols are determined based on window size.
let I_GRID_ROWS = 16;
let I_GRID_COLS = 16;

let I_RATE = 10;

let WORLD;

function array2d(num_rows, num_cols, init_val) {
  let arr = new Array(num_rows);
  for (let r = 0; r < num_rows; ++r) {
    arr[r] = new Array(num_cols);
    arr[r].fill(init_val);
  }
  return arr;
}


function for2d(arr, f) {
  for (const [row_num, row] of arr.entries()) {
    for (const [col_num, cell] of row.entries()) {
      f(row_num, col_num, cell);
    }
  }
}

MAPPING_90 = new Map([
  [111, 0],
  [110, 1],
  [101, 0],
  [100, 1],
  [11, 1],
  [10, 0],
  [1, 1],
  [0, 0],
]);
MAPPING_30 = new Map([
  [111, 0],
  [110, 0],
  [101, 0],
  [100, 1],
  [11, 1],
  [10, 1],
  [1, 1],
  [0, 0],
]);

MAPPING = MAPPING_90;

class World {
  constructor(num_rows, num_cols) {
    this.num_rows = num_rows;
    this.num_cols = num_cols;
    this.grid = array2d(num_rows, num_cols, 0);
    this.next_row = 0;
    this.random_init();
  }

  random_init(predator_frac, prey_frac) {
    for (let i = 0; i < I_GRID_COLS; ++i) {
      this.grid[0][i] = (Math.random() > 0.6) ? 1 : 0;
    }
    this.next_row = 1;
  }

  draw() {
    console.log(this.next_row)
    for2d(this.grid, (r, c, x) => {
      fill(color((x === 1 ? 100 : 0)));
      rect(c * I_GRID_SIZE, r * I_GRID_SIZE, I_GRID_SIZE - 2, I_GRID_SIZE - 2);
    });
  }

  step() {
    const prev_row = this.grid[this.next_row - 1];
    let next_row = this.grid[this.next_row];

    for (let i = 1; i < I_GRID_COLS-1; ++i) {
      const prev_pat = prev_row[i-1] * 100 + prev_row[i] * 10 + prev_row[i+1];
      next_row[i] = MAPPING.get(prev_pat);
    }
    this.next_row += 1;
    if (this.next_row === I_GRID_ROWS) {
      for (let i = 1; i < I_GRID_ROWS; ++i) {
        this.grid[i-1] = this.grid[i];
      }
      const bot_row = new Array(I_GRID_COLS);
      bot_row.fill(0);
      this.grid[I_GRID_ROWS-1] = bot_row
      this.next_row = I_GRID_ROWS - 1;
    }
  }
}

function init_world() {
  const [rows, cols] = get_rows_cols();
  WORLD = new World(rows, cols);
}

function get_rows_cols() {
  if (I_GRID_ROWS && I_GRID_COLS) {
    return [I_GRID_ROWS, I_GRID_COLS];
  } else {
    return [Math.floor(windowHeight / I_GRID_SIZE),
            Math.floor(windowWidth / I_GRID_SIZE)];
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  frameRate(I_RATE);
  noStroke();
  init_world();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(15);
  WORLD.draw();
  WORLD.step();
}

function keyPressed() {
  switch (key) {
    case 'p': toggle_paused(); break;
    case 'r': init_world(); break;
  }
}

let PAUSED = false;
function toggle_paused() {
  PAUSED = !PAUSED;
  if (PAUSED) { noLoop(); } else { loop(); }
}
