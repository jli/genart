use num_complex::Complex64;

fn mandelbrot_fn(z: Complex64, c: Complex64) -> Complex64 {
    return z.powu(2) + c;
}

pub fn escape_iters(c: Complex64, iter_limit: u32) -> u32 {
    let mut z = Complex64::new(0., 0.);
    let mut iter = 0;
    while z.re.powi(2) + z.im.powi(2) <= 4. && iter < iter_limit {
        z = mandelbrot_fn(z, c);
        iter += 1;
    }
    return iter;
}
