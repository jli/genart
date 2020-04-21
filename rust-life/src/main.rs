// TODO:
// - colors for lifetime
// - multithreaded
// X resizable
// X bindings to reset
// X fit to screen
// X framerate

use nannou::prelude::*;
use rand;
use std::convert::TryInto;

const CELL_WIDTH: u32 = 4;

type Grid<T> = Vec<Vec<T>>;

struct Model {
    grid: Grid<bool>,
    prev: Grid<bool>, // stored here for convenience
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
            false,
        );
        let prev = grid.clone();
        let mut this = Model { grid, prev };
        this.reinit();
        this
    }

    fn update(_app: &App, model: &mut Model, _update: Update) {
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
        let xadj: f32 = ww as f32 / 2.0 - CELL_WIDTH as f32 / 2.0;
        let yadj: f32 = wh as f32 / 2.0 - CELL_WIDTH as f32 / 2.0;
        let draw = app.draw();
        draw.background().color(BLACK);
        for (r, row) in model.grid.iter().enumerate() {
            for (c, val) in row.iter().enumerate() {
                if *val {
                    draw.rect()
                        .x_y(
                            (c as u32 * CELL_WIDTH) as f32 - xadj,
                            yadj - (r as u32 * CELL_WIDTH) as f32,
                        )
                        .w_h(CELL_WIDTH as f32, CELL_WIDTH as f32)
                        .color(WHITE)
                        .stroke(BLACK);
                }
            }
        }
        draw.to_frame(app, &frame).unwrap();
    }

    fn reinit(&mut self) {
        for row in self.grid.iter_mut() {
            for c in 0..row.len() {
                row[c] = rand::random();
            }
        }
    }

    fn resize(&mut self, ww: f32, wh: f32) {
        println!("resize: {},{}", ww, wh);
        let (num_cols, num_rows) = (
            (ww as u32 / CELL_WIDTH).try_into().unwrap(),
            (wh as u32 / CELL_WIDTH).try_into().unwrap(),
        );
        helper::resize_grid(&mut self.grid, num_rows, num_cols, false);
        helper::resize_grid(&mut self.prev, num_rows, num_cols, false);
    }
}

fn event(_app: &App, model: &mut Model, event: Event) {
    fn win_event(model: &mut Model, wevent: WindowEvent) {
        match wevent {
            KeyReleased(Key::R) => model.reinit(),
            Resized(Vector2 { x, y }) => model.resize(x, y),
            _ => (),
        }
    }
    match event {
        Event::WindowEvent {
            simple: Some(w), ..
        } => win_event(model, w),
        _ => (),
    }
}

mod helper {
    use super::*;

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

fn alive(living: bool, num_neighbors: usize) -> bool {
    match (living, num_neighbors) {
        (true, 2..=3) => true,
        (false, 3) => true,
        _ => false,
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

fn live_neighbors(grid: &Grid<bool>, r: usize, c: usize) -> usize {
    let mut n = 0;
    let (r_1, r1) = neighbor_positions(r, grid.len());
    let (c_1, c1) = neighbor_positions(c, grid[0].len());
    if grid[r_1][c_1] {
        n += 1
    }
    if grid[r_1][c] {
        n += 1
    }
    if grid[r_1][c1] {
        n += 1
    }
    if grid[r][c_1] {
        n += 1
    }
    if grid[r][c1] {
        n += 1
    }
    if grid[r1][c_1] {
        n += 1
    }
    if grid[r1][c] {
        n += 1
    }
    if grid[r1][c1] {
        n += 1
    }
    n
}
