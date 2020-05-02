use nannou::prelude::*;
// use nannou::ui::prelude::color::Color;

const WIN_SIZE: u32 = 500;
const WIN_SIZEF: f32 = WIN_SIZE as f32;

fn main() {
  nannou::app(model)
    .update(update)
    .simple_window(view)
    .size(WIN_SIZE, WIN_SIZE)
    .run();
}

enum Dir {
  Pos, Neg
}

impl Dir {
  fn to_float(self: &Self) -> f32 {
    match self {
      Dir::Pos => 1.,
      Dir::Neg => -1.,
    }
  }

  fn fg_bg(self: &Self) -> (rgb::Srgb<u8>, rgb::Srgb<u8>) {
    match self {
      Dir::Pos => (BLACK, WHITE),
      Dir::Neg => (WHITE, BLACK),
    }
  }
}

impl Default for Dir {
  fn default() -> Dir { Dir::Pos }
}

#[derive(Default)]
struct Model {
  num_updates: u32,
  initial_theta: f32,
  num_spirals: f32,
  theta_delta: f32,
  dir: Dir,
  color: Dir,
  new: bool,
}

fn model(_app: &App) -> Model {
  let mut m: Model = Default::default();
  random_model(&mut m);
  m
}

fn random_model(model: &mut Model) {
  model.num_updates = 0;
  model.initial_theta = random_range(0., TAU);
  model.num_spirals = random_range(1., 5.);
  model.theta_delta = random_range(0.02, 0.1);
  model.dir = if random_f32() > 0.5 { Dir::Pos } else { Dir::Neg };
  model.color = if random_f32() > 0.5 { Dir::Pos } else { Dir::Neg };
  model.new = true;
}

fn update(_: &App, mut model: &mut Model, _: Update) {
  model.num_updates += 1;
  if model.num_updates > 1 {
    model.new = false;
  }
  let num_updates_to_completion = TAU / model.theta_delta;
  if model.num_updates as f32 > num_updates_to_completion {
    random_model(&mut model)
  }
}

fn view(app: &App, model: &Model, frame: Frame) {
  let draw = app.draw();
  // draw.background().color(WHITE);
  // if frame.nth() == 0 {
  //   draw.background().color(WHITE);
  // }
  let (fg, bg) = model.color.fg_bg();
  if model.new {
    draw.background().color(bg);
  }

  let num_points = 1000;
  let theta = model.num_updates as f32 * model.theta_delta * model.dir.to_float() + model.initial_theta;
  let points = (0..num_points).map(|i| {
    let r = map_range(i, 0, num_points, 0., WIN_SIZEF / 2.);
    let t = theta + map_range(i as f32, 0., num_points as f32 / model.num_spirals, 0., TAU);
    let x = r * t.cos();
    let y = r * t.sin();
    pt2(x, y)
  });

  draw.polyline().points(points).color(fg);

  draw.to_frame(app, &frame).unwrap();
}
