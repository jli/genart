let I_GRID_SIZE;
// if these are falsey, rows/cols are determined based on window size.
let I_GRID_ROWS;
let I_GRID_COLS;

let I_RATE;
let I_INIT_PREY_FRAC;
let I_INIT_PREDATOR_FRAC;
let I_WRAPAROUND;
let I_DRAW_RECT;

let I_PREDATOR_BREED_CYCLE;
let I_PREDATOR_FEED_CYCLE;
let I_PREY_BREED_CYCLE;
let I_PREY_BREED_REQ;

// De-syncs the pulses a bit. Maybe should use a different randomization method.
let I_PREDATOR_BREED_PROB;
let I_PREY_BREED_PROB;

let I_PREY_MOVES;
let I_PREY_BREED_ASEXUALLY;

const CELL_EMPTY = 0;
const CELL_PREDATOR = 2;
const CELL_PREY = 1;
const NEIGHBOR_DIRS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [0, 1],
  [-1, 1], [0, 1], [1, 1],
];

let WORLD;

let PREDATOR_HUE;
let PREY_HUE;
let RAND_HUE = 0;
function rand_hue() {
  RAND_HUE = (RAND_HUE + random(80, 160)) % 360;
  return RAND_HUE;
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
        const feed_mult = map(hunger, 0, I_PREDATOR_FEED_CYCLE.value, 1, .3);
        col = color(PREDATOR_HUE, 100 * max(feed_mult, 0.7), 100 * feed_mult);
        break;
      case CELL_PREY:
        // new prey are brighter
        const age = frameCount - this.birth;
        const age_mult = map(age, 0, 100, 1, .4, true);
        col = color(PREY_HUE, 100 * max(age_mult, 0.7), 100 * age_mult);
        break;
    }
    fill(col);
    const grid = I_GRID_SIZE.value;
    if (I_DRAW_RECT.value) rect(c * grid, r * grid, grid, grid);
    else ellipse(c * grid + grid/2, r * grid + grid/2, grid, grid);
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

  resize(num_rows, num_cols) {
    const old_grid = this.grid;
    const old_nr = this.num_rows;
    const old_nc = this.num_cols;
    this.num_rows = num_rows;
    this.num_cols = num_cols;
    this.grid = array2d(num_rows, num_cols);
    for2d(this.grid, (r, c, _) => {
      if (r >= old_nr || c >= old_nc) {
        this.grid[r][c] = new Cell(CELL_EMPTY);
      } else {
        this.grid[r][c] = old_grid[r][c];
      }
    });
  }

  draw() {
    for2d(this.grid, (r, c, x) => x.draw(r, c));
  }

  find_cell(r, c, type) {
    const dirs = shuffle(NEIGHBOR_DIRS);
    for (const [rd, cd] of dirs) {
      let r2 = rd + r;
      let c2 = cd + c;
      if (!I_WRAPAROUND.value && (r2 < 0 || r2 >= this.num_rows || c2 < 0 || c2 >= this.num_cols)) {
        continue;
      }
      r2 = index_wrap(r2, this.num_rows);
      c2 = index_wrap(c2, this.num_cols);
      const cell = this.grid[r2][c2];
      if (cell.t === type) return [r2, c2];
    }
    return null;
  }

  step() {
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
    const prey_pos = this.find_cell(r, c, CELL_PREY);
    if (prey_pos) {
      // move and eat prey
      this.grid[prey_pos[0]][prey_pos[1]] = pred;
      this.grid[r][c] = new Cell(CELL_EMPTY);
      pred.last_feed = frameCount;
      changed_cb();
    } else if (frameCount - pred.last_feed > I_PREDATOR_FEED_CYCLE.value) {
      // die
      this.grid[r][c] = new Cell(CELL_EMPTY);
      changed_cb();
      return;
    } else {
      // move to random empty cell
      const pos = this.find_cell(r, c, CELL_EMPTY);
      if (pos) {
        this.grid[pos[0]][pos[1]] = pred;
        this.grid[r][c] = new Cell(CELL_EMPTY);
        changed_cb();
      }
    }
    if (frameCount - pred.last_breed > I_PREDATOR_BREED_CYCLE.value
        && Math.random() < I_PREDATOR_BREED_PROB.value) {
      // Prefer to spawn into empty space, but spawn over a prey cell if necessary.
      let pos = this.find_cell(r, c, CELL_EMPTY);
      if (!pos) { pos = this.find_cell(r, c, CELL_PREY); }
      if (pos) {
        this.grid[pos[0]][pos[1]] = new Cell(CELL_PREDATOR);
        pred.last_breed = frameCount;
        changed_cb();
      }
    }
  }

  prey_action(r, c, prey, changed_cb) {
    const prey_pos = this.find_cell(r, c, CELL_PREY);
    const empty_pos = this.find_cell(r, c, CELL_EMPTY);
    if (frameCount - prey.last_breed > I_PREY_BREED_CYCLE.value && empty_pos
        && Math.random() < I_PREY_BREED_PROB.value
        && (prey_pos || I_PREY_BREED_ASEXUALLY.value)) {
      // breed
      this.grid[empty_pos[0]][empty_pos[1]] = new Cell(CELL_PREY);
      prey.last_breed = frameCount;
      changed_cb();
    } else if (frameCount - prey.last_breed > I_PREY_BREED_REQ.value) {
      // die
      this.grid[r][c] = new Cell(CELL_EMPTY);
      changed_cb();
    } else if (empty_pos && I_PREY_MOVES.value) {
      this.grid[empty_pos[0]][empty_pos[1]] = prey;
      this.grid[r][c] = new Cell(CELL_EMPTY);
      changed_cb();
    }
  }
}

function init_world() {
  PREDATOR_HUE = rand_hue();
  PREY_HUE = rand_hue();
  const [rows, cols] = get_rows_cols();
  WORLD = new World(rows, cols, I_INIT_PREDATOR_FRAC.value, I_INIT_PREY_FRAC.value);
}

function get_rows_cols() {
  if (I_GRID_ROWS.value && I_GRID_COLS.value) {
    return [I_GRID_ROWS.value, I_GRID_COLS.value];
  } else {
    return [Math.floor(windowHeight / I_GRID_SIZE.value),
            Math.floor(windowWidth / I_GRID_SIZE.value)];
  }
}

function setup() {
  // needs to happen early so values like framerate and rows/cols are set.
  create_control_panel();
  toggle_control_panel();
  createCanvas(windowWidth, windowHeight);

  colorMode(HSB);
  frameRate(I_RATE.value);
  noStroke();

  init_world();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  const [rows, cols] = get_rows_cols();
  WORLD.resize(rows, cols);
}

let last_change = 0;

function draw() {
  // boundaries of the world
  background(10);
  fill(0);
  rect(0, 0, WORLD.num_cols * I_GRID_SIZE.value, WORLD.num_rows * I_GRID_SIZE.value);

  const changed = WORLD.step();
  WORLD.draw();

  // reset
  if (changed) last_change = frameCount;
  if (frameCount - last_change > 10) {
    console.log('resetting...');
    init_world();
  }
}

function keyPressed() {
  switch (key) {
    case 'p': toggle_paused(); break;
    case 'r': init_world(); break;
    case ';': toggle_control_panel(); break;
  }
}

let PAUSED = false;
function toggle_paused() {
  PAUSED = !PAUSED;
  if (PAUSED) { noLoop(); } else { loop(); }
}

const CONTROL_PANEL_MAIN_ID = 'controlPanelMain';

function toggle_control_panel() {
  const panel_main = select('#'+CONTROL_PANEL_MAIN_ID);
  if (panel_main.attribute('status') === 'hidden') {
    panel_main.attribute('status', 'shown');
    panel_main.style('display', 'flex');
  } else {
    panel_main.attribute('status', 'hidden');
    panel_main.style('display', 'none');
  }
}

let SLIDERS = [];
function create_control_panel() {
  const panel_full = createDiv().id('controlPanelFull');
  const toggle_div =     createDiv().parent(panel_full).id('showControlPanelButtonContainer').attribute('status', 'shown');
  make_button('controls', toggle_div, toggle_control_panel);

  // Holds all the controls. Excludes the toggle button.
  const panel_main = createDiv().id(CONTROL_PANEL_MAIN_ID).parent(panel_full);

  // Basic controls.
  const basic_controls = createDiv().parent(panel_main);
  const br = () => createElement('br').parent(basic_controls);
  const framerate_elt = createDiv().parent(basic_controls);
  setInterval(() => framerate_elt.html(`framerate ${frameRate().toFixed(1)}`), 1000);
  make_button('reinit', basic_controls, init_world); br();
  I_RATE = new NumInput('frate', 1, 100, 5, 1, 32, basic_controls);
  I_RATE.onchange((rate) => frameRate(rate));
  I_GRID_SIZE = new NumInput('cell size', 1, 100, 15, 1, 32, basic_controls);
  I_GRID_ROWS = new NumInput('rows', 0, null, 0, null, 32, basic_controls);
  I_GRID_COLS = new NumInput('cols', 0, null, 0, null, 32, basic_controls);
  I_GRID_SIZE.onchange(r => windowResized());
  I_GRID_ROWS.onchange(r => windowResized());
  I_GRID_COLS.onchange(r => windowResized());
  I_DRAW_RECT = new Checkbox('rect/circle', true, basic_controls);
  I_WRAPAROUND = new Checkbox('wraparound', false, basic_controls);
  I_PREY_MOVES = new Checkbox('prey move', true, basic_controls);
  I_PREY_BREED_ASEXUALLY = new Checkbox('prey asex', true, basic_controls);

  // Sliders for main parameters.
  const sliders = createDiv().id('sliders').parent(panel_main);
  make_button('reset', sliders, () => { for (const s of SLIDERS) s.reset(); });

  createDiv('predator').parent(sliders);
  I_PREDATOR_BREED_CYCLE = new Slider('breed every', 1, 30, 10, 1, sliders);
  I_PREDATOR_FEED_CYCLE = new Slider('feed every', 1, 30, 5, 1, sliders);
  I_PREDATOR_BREED_PROB = new Slider('breed prob', 0, 1, 0.8, 0.05, sliders);
  I_INIT_PREDATOR_FRAC = new Slider('init %', 0, 1, 0.04, 0.01, sliders);
  createSpan('prey').parent(sliders);
  I_PREY_BREED_CYCLE = new Slider('breed every', 1, 30, 3, 1, sliders);
  I_PREY_BREED_REQ = new Slider('breed req', 1, 1000, 500, 1, sliders);
  I_PREY_BREED_PROB = new Slider('breed prob', 0, 1, 0.7, 0.05, sliders);
  I_INIT_PREY_FRAC = new Slider('init %', 0, 1, 0.03, 0.01, sliders);
  SLIDERS = [
    I_PREDATOR_BREED_CYCLE, I_PREDATOR_FEED_CYCLE, I_PREDATOR_BREED_PROB, I_INIT_PREDATOR_FRAC,
    I_PREY_BREED_CYCLE, I_PREY_BREED_REQ, I_PREY_BREED_PROB, I_INIT_PREY_FRAC
  ];
}
