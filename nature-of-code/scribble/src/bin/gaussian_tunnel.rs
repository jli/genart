use nannou::prelude::*;
use rand::prelude::*;
use rand_distr::StandardNormal;

fn main() {
    nannou::sketch(view).run();
}

fn view(app: &App, frame: Frame) {
    let draw = app.draw();
    if frame.nth() == 0 {
        draw.background().color(WHITE);
    }
    let (ww, wh) = app.main_window().inner_size_points();
    let mut rng = thread_rng();
    for _ in 0..100 {
        let rx: f32 = rng.sample(StandardNormal);
        let ry: f32 = rng.sample(StandardNormal);
        draw.rect()
            // .x_y(rx * ww / 10.0, ry * wh / 10.0)
            .x_y(clamp(rx * ww / 10.0, -200.0, 200.0),
                 clamp(ry * wh / 10.0, -200.0, 200.0))
            .w_h(rx.abs().max(0.001) * 10.0, ry.abs().max(0.001) * 10.0)
            .hsva(0.0, 0.0, 0.0, 0.05);
    }
    draw.to_frame(app, &frame).unwrap();
}
