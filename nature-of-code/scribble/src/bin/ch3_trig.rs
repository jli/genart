use nannou::prelude::*;

const SIZE: u32 = 800;
const SIZEF: f32 = SIZE as f32;
const CIRCLE_SIZE: u32 = 40;
const CIRCLE_SIZEF: f32 = CIRCLE_SIZE as f32;
const NUM_CIRCLES_1D: u32 = SIZE / CIRCLE_SIZE;
const NUM_ARMS: usize = 8;

fn main() {
  nannou::sketch(view).size(SIZE, SIZE).run();
}

fn shuffle_arm(x: usize) -> usize {
  match x {
    0 => 3,
    1 => 1,
    2 => 5,
    3 => 7,
    4 => 0,
    5 => 6,
    6 => 2,
    7 => 4,
    _ => panic!("yoops")
  }
}

fn view(app: &App, frame: Frame) {
  let draw = app.draw();
  draw.background().color(BLACK);

  let start_angle = frame.nth() as f32 / 50.;

  for arm_num in 0..NUM_ARMS {
    let angle = arm_num as f32 * TAU / NUM_ARMS as f32;
    let arm_frac = map_range(shuffle_arm(arm_num), 0, NUM_ARMS, 1., 2.) ;
    for i in 0..NUM_CIRCLES_1D {
      let r = i as f32 / 2. * CIRCLE_SIZEF;
    let mag = map_range(i, 0, NUM_CIRCLES_1D, 0., SIZEF / 4.);
      let y = (start_angle + i as f32 / NUM_CIRCLES_1D as f32 * 2. * arm_frac).cos()
        * (start_angle * 1.4 * arm_frac.pow(1.5) + i as f32 / NUM_CIRCLES_1D as f32 * 3.).cos()
        * (start_angle * 2.2 * arm_frac + i as f32 / NUM_CIRCLES_1D as f32 * 5.).cos();
      draw.rotate(angle)
        .ellipse()
        .x_y(r, y * mag)
        .w_h(CIRCLE_SIZEF, CIRCLE_SIZEF)
        .hsva(0., 0., 0.5, 0.2);
    }
  }

  draw.to_frame(app, &frame).unwrap();
}
