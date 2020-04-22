// TODO:
// - multithreaded
// - mouse clicks to toggle cells, drop gliders
// - controls to change cell size
// X controls to pan in the torus world
// X colors for lifetime
// X resizable
// X bindings to reset
// X fit to screen
// X framerate

use nannou::prelude::*;
use rand;
use std::convert::TryInto;

const CELL_WIDTH: u32 = 6;
const CELL_WIDTHF: f32 = CELL_WIDTH as f32;

type Grid<T> = Vec<Vec<T>>;

struct Model {
    grid: Grid<u32>,
    prev: Grid<u32>, // stored here for convenience
    // hue values
    start_h: f32,
    end_h: f32,
    // pan values
    pan_x: u32,
    pan_y: u32,
    updating: bool,
}

fn main() {
    nannou::app(Model::new)
        .update(Model::update)
        .view(Model::view)
        .event(event)
        .run();
}

impl Model {
    fn new(app: &App) -> Model {
        let (mw, mh) = helper::primary_monitor_points(app);
        let (ww, wh) = (mw / 2, mh / 2);
        let (num_cols, num_rows) = (ww / CELL_WIDTH, wh / CELL_WIDTH);
        app.new_window().size(ww, wh).build().unwrap();
        let grid = helper::new_grid(
            num_rows.try_into().unwrap(),
            num_cols.try_into().unwrap(),
            0,
        );
        let prev = grid.clone();
        let mut this = Model {
            grid,
            prev,
            start_h: 0.0,
            end_h: 0.0,
            pan_x: 0,
            pan_y: 0,
            updating: true,
        };
        this.reinit();
        this
    }

    fn update(_app: &App, model: &mut Model, _update: Update) {
        if !model.updating {
            return;
        }
        helper::blit(&model.grid, &mut model.prev);
        for (r, row) in model.prev.iter().enumerate() {
            for (c, val) in row.iter().enumerate() {
                model.grid[r][c] = alive(*val, live_neighbors(&model.prev, r, c));
            }
        }
    }

    fn view(app: &App, model: &Model, frame: Frame) {
        if app.elapsed_frames() % 30 == 0 {
            println!("v: {:.1} fps, {} frames", app.fps(), app.elapsed_frames());
        }
        let (ww, wh) = app.main_window().inner_size_points();
        let xadj: f32 = ww as f32 / 2.0 - CELL_WIDTHF / 2.0;
        let yadj: f32 = wh as f32 / 2.0 - CELL_WIDTHF / 2.0;
        let draw = app.draw();
        draw.background().color(BLACK);
        for (r, row) in model.grid.iter().enumerate() {
            for (c, val) in row.iter().enumerate() {
                if *val > 0 {
                    let (h, s, v) = age_hsv(*val, model.start_h, model.end_h);
                    // TODO: ugh
                    let x = ((c as u32 + model.pan_x) % model.grid[0].len() as u32 * CELL_WIDTH)
                        as f32
                        - xadj;
                    let y = yadj
                        - ((r as u32 + model.pan_y) % model.grid.len() as u32 * CELL_WIDTH) as f32;
                    draw.rect()
                        .x_y(x, y)
                        .w_h(CELL_WIDTHF, CELL_WIDTHF)
                        .hsv(h, s, v)
                        .stroke(BLACK);
                }
            }
        }
        draw.to_frame(app, &frame).unwrap();
    }

    fn reinit(&mut self) {
        for row in self.grid.iter_mut() {
            for c in 0..row.len() {
                row[c] = if rand::random() { 1 } else { 0 };
            }
        }
        self.start_h = random_f32();
        self.end_h = random_f32();
    }

    fn resize(&mut self, ww: f32, wh: f32) {
        println!("resize: {},{}", ww, wh);
        let (num_cols, num_rows) = (
            (ww as u32 / CELL_WIDTH).try_into().unwrap(),
            (wh as u32 / CELL_WIDTH).try_into().unwrap(),
        );
        helper::resize_grid(&mut self.grid, num_rows, num_cols, 0);
        helper::resize_grid(&mut self.prev, num_rows, num_cols, 0);
    }

    fn toggle_updates(&mut self) {
        self.updating = !self.updating;
    }

    fn pan(&mut self, xd: i32, yd: i32) {
        // TODO: ugh
        let xd = (if xd < 0 { xd + self.grid[0].len() as i32 } else { xd }) as u32;
        let yd = (if yd < 0 { yd + self.grid.len() as i32 } else { yd }) as u32;
        self.pan_x = (self.pan_x + xd) % self.grid[0].len() as u32;
        self.pan_y = (self.pan_y + yd) % self.grid.len() as u32;
        println!("panned: {},{}, now {},{}", xd, yd, self.pan_x, self.pan_y);
    }
}

fn event(app: &App, model: &mut Model, event: Event) {
    let mut win_event = |wevent| {
        let mult = if app.keys.mods.shift() { 10 } else { 1 };
        match wevent {
            KeyPressed(Key::R) => model.reinit(),
            KeyPressed(Key::Space) => model.toggle_updates(),
            KeyPressed(Key::Left) => model.pan(1 * mult, 0),
            KeyPressed(Key::Right) => model.pan(-1 * mult, 0),
            KeyPressed(Key::Up) => model.pan(0, 1 * mult),
            KeyPressed(Key::Down) => model.pan(0, -1 * mult),
            Resized(Vector2 { x, y }) => model.resize(x, y),
            _ => (),
        }
    };
    match event {
        Event::WindowEvent {
            simple: Some(w), ..
        } => win_event(w),
        _ => (),
    }
}

mod helper {
    use super::*;

    // f32 doesn't implement Ord :( soooo safe
    // pub fn bounded<T: Ord>(x: T, a: T, b: T) -> T {
    //     let min = a.min(b);
    //     let max = a.max(b);
    //     x.min(max).max(min)
    // }

    pub fn blit<T: Copy>(src: &Grid<T>, dst: &mut Grid<T>) {
        for r in 0..src.len() {
            for c in 0..src[0].len() {
                dst[r][c] = src[r][c];
            }
        }
    }

    pub fn new_grid<T: Copy>(num_rows: usize, num_cols: usize, x: T) -> Grid<T> {
        let mut rows = Vec::with_capacity(num_rows);
        for _r in 0..num_rows {
            rows.push(vec![x; num_cols]);
        }
        rows
    }

    pub fn resize_grid<T: Copy>(grid: &mut Grid<T>, num_rows: usize, num_cols: usize, x: T) {
        for col in grid.iter_mut() {
            col.resize(num_cols, x);
        }
        grid.resize_with(num_rows, || vec![x; num_cols]);
    }

    pub fn primary_monitor_points(app: &App) -> (u32, u32) {
        let mon = app.primary_monitor();
        let size = mon.size();
        let scale = mon.scale_factor();
        (
            (size.width as f64 / scale) as u32,
            (size.height as f64 / scale) as u32,
        )
    }
}

fn age_hsv(age: u32, start_h: f32, end_h: f32) -> (f32, f32, f32) {
    // let h = map_range((age as f32).log2(), 1.0, 7.0, 0.0, -0.4).max(-0.4);
    // TODO: should bound this value...
    let h = map_range(age, 1, 500, start_h, end_h);
    let v = map_range(age, 1, 10, 1.0, 0.3).max(0.3);
    (h, 1.0, v)
}

fn alive(cell: u32, num_neighbors: usize) -> u32 {
    match (cell > 0, num_neighbors) {
        (true, 2..=3) => cell + 1,
        (false, 3) => 1,
        _ => 0,
    }
}

fn neighbor_positions(x: usize, max: usize) -> (usize, usize) {
    if x == 0 {
        (max - 1, 1)
    } else if x == max - 1 {
        (max - 2, 0)
    } else {
        (x - 1, x + 1)
    }
}

fn live_neighbors(grid: &Grid<u32>, r: usize, c: usize) -> usize {
    let mut n = 0;
    let (r_1, r1) = neighbor_positions(r, grid.len());
    let (c_1, c1) = neighbor_positions(c, grid[0].len());
    if grid[r_1][c_1] > 0 {
        n += 1
    }
    if grid[r_1][c] > 0 {
        n += 1
    }
    if grid[r_1][c1] > 0 {
        n += 1
    }
    if grid[r][c_1] > 0 {
        n += 1
    }
    if grid[r][c1] > 0 {
        n += 1
    }
    if grid[r1][c_1] > 0 {
        n += 1
    }
    if grid[r1][c] > 0 {
        n += 1
    }
    if grid[r1][c1] > 0 {
        n += 1
    }
    n
}
