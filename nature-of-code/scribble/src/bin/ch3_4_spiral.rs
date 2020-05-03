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

struct Model {
  num_updates: u32,
  initial_theta: f32,
  num_spirals: f32,
  theta_delta: f32,
  dir: Dir,
  color: Dir,
  new: bool,
}

impl Model {
  fn random() -> Self {
    Model {
      num_updates: 0,
      initial_theta: random_range(0., TAU),
      num_spirals: random_range(1., 5.),
      theta_delta: random_range(0.02, 0.1),
      dir: if random_f32() > 0.5 { Dir::Pos } else { Dir::Neg },
      color: if random_f32() > 0.5 { Dir::Pos } else { Dir::Neg },
      new: true,
    }
  }

  fn update(self: &mut Self) {
    self.num_updates += 1;
    if self.num_updates > 1 {
      self.new = false;
    }
    let num_updates_to_completion = TAU / self.theta_delta;
    if self.num_updates as f32 > num_updates_to_completion {
      *self = Model::random();
    }
  }

  fn points<'a>(self: &'a Self) -> impl Iterator<Item = Point2> + 'a {
    let num_points = 1000;
    let theta = self.num_updates as f32 * self.theta_delta * self.dir.to_float() + self.initial_theta;
    (0..num_points).map(move |i| {
      let r = map_range(i, 0, num_points, 0., WIN_SIZEF / 2.);
      let t = theta + map_range(i as f32, 0., num_points as f32 / self.num_spirals, 0., TAU);
      let x = r * t.cos();
      let y = r * t.sin();
      pt2(x, y)
    })
  }
}

fn model(_app: &App) -> Model {
  Model::random()
}

fn update(_: &App, model: &mut Model, _: Update) {
  model.update()
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

  let points = model.points();
  //

  draw.polyline().points(points).color(fg);

  draw.to_frame(app, &frame).unwrap();
}
