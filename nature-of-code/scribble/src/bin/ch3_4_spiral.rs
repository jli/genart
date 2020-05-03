use nannou::prelude::*;
// use nannou::ui::prelude::color::Color;

const WIN_SIZE: u32 = 500;
const WIN_SIZEF: f32 = WIN_SIZE as f32;
const MAX_SPIRALS: usize = 4;
const RESET_FRAMES: u32 = 300;

fn main() {
  nannou::app(|_| Model::new())
    .update(|_, m, _| m.update())
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
}

struct Model {
  spirals: Vec<Spiral>,
  frames: u32,
}

impl Model {
  fn new() -> Self {
    Self {
      spirals: (0..random_range(1, MAX_SPIRALS)).map(|_| Spiral::random()).collect(),
      frames: 0,
    }
  }
  fn update(&mut self) {
    self.spirals.iter_mut().for_each(Spiral::update);
    self.frames += 1;
    if self.frames > RESET_FRAMES {
      *self = Self::new();
      // self.frames = 0;
      // self.spirals =
      // self.spirals.iter_mut().for_each(|s| {
      //   *s = Spiral::random();
      // });
    }
  }
}

struct Spiral {
  num_updates: u32,
  initial_theta: f32,
  num_spirals: f32,
  theta_delta: f32,
  dir: Dir,
  color: Srgba,
}

impl Spiral {
  fn random() -> Self {
    Self {
      num_updates: 0,
      initial_theta: random_range(0., TAU),
      num_spirals: random_range(1., 5.),
      theta_delta: random_range(0.005, 0.03),
      dir: if random_f32() > 0.5 { Dir::Pos } else { Dir::Neg },
      color: hsva(0., 0., random_f32(), 0.8).into(),
    }
  }

  fn update(self: &mut Self) {
    self.num_updates += 1;
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

fn view(app: &App, model: &Model, frame: Frame) {
  let draw = app.draw();
  if frame.nth() == 0 {
    draw.background().color(WHITE);
  }
  for s in &model.spirals {
    let points = s.points();
    draw.polyline().points(points).color(s.color);
  }
  draw.to_frame(app, &frame).unwrap();
}
