// TODO:
// - bindings to reset
// - resizable, fit to screen
// - multithreaded
// X framerate

use std::time::Duration;
use rand;
use nannou::prelude::*;

const GRID_SIZE: usize = 100;
const CELL_WIDTH: usize = 10;

type Grid = Vec<Vec<bool>>;

struct Model {
    grid: Grid,
    prev: Grid,  // stored here for convenience
}

fn main() {
    nannou::app(Model::new)
        .update(Model::update)
        .view(Model::view)
        .run();
}

impl Model {
    fn new(app: &App) -> Model {
        const SIZE: u32 = (GRID_SIZE * CELL_WIDTH) as u32;
        println!("window size will be: {}x{}", SIZE, SIZE);
        app.new_window()
            .size(SIZE, SIZE)
            .build()
            .unwrap();
        app.set_loop_mode(LoopMode::Rate { update_interval: Duration::new(2, 0) } );
        let mut rows = Vec::with_capacity(GRID_SIZE);
        for _r in 0..GRID_SIZE {
            let mut col = Vec::with_capacity(GRID_SIZE);
            for _c in 0..GRID_SIZE {
                // col.push((r + c) % 4 == 0);
                col.push(rand::random());
            }
            rows.push(col);
        }
        let prev = rows.clone();
        Model { grid: rows, prev }
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
                        .x_y((c * CELL_WIDTH) as f32 - xadj, yadj - (r * CELL_WIDTH) as f32)
                        .w_h(CELL_WIDTH as f32, CELL_WIDTH as f32)
                        .color(WHITE).stroke(BLACK);
                }
            }
        }
        draw.to_frame(app, &frame).unwrap();
    }
}

mod helper {
    use super::*;

    pub fn blit(src: &Grid, dst: &mut Grid) {
        for r in 0..src.len() {
            for c in 0..src[0].len() {
                dst[r][c] = src[r][c];
            }
        }
    }
}

fn alive(living: bool, num_neighbors: usize) -> bool {
    match (living, num_neighbors) {
        (true, 2..=3) => true,
        (false, 3) => true,
        _ => false
    }
}

fn neighbor_positions(x: usize, max: usize) -> (usize, usize) {
    if x == 0 { (max - 1, 1) }
    else if x == max - 1 { (max - 2, 0) }
    else { ( x - 1, x + 1) }
}

fn live_neighbors(grid: &Grid, r: usize, c: usize) -> usize {
    let mut n = 0;
    let (r_1, r1) = neighbor_positions(r, grid.len());
    let (c_1, c1) = neighbor_positions(c, grid[0].len());
    if grid[r_1][c_1] { n += 1 }
    if grid[r_1][c] { n += 1 }
    if grid[r_1][c1] { n += 1 }
    if grid[r][c_1] { n += 1 }
    if grid[r][c1] { n += 1 }
    if grid[r1][c_1] { n += 1 }
    if grid[r1][c] { n += 1 }
    if grid[r1][c1] { n += 1 }
    n
}

