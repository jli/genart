use image::{GrayImage};
use mandelbrot::mandelbrot::escape_iters;
use num_complex::Complex64;

fn map_pixels_to_complex(x: u32, y: u32, width: u32, height: u32) -> Complex64 {
    let a = (x as f64) / (width as f64) * 4. - 2.;
    let b = -(y as f64) / (height as f64) * 4. + 2.;
    Complex64::new(a, b)
}

fn map_iters_to_color(num_iters: u32, max_iters: u32) -> u8 {
    if num_iters == max_iters {
        return 0;
    }
    return ((num_iters as f64) / (max_iters as f64) * 155.) as u8 + 100;
}

mod test {
    #[allow(unused_imports)]
    use super::*;
    #[test]
    fn pixels_to_complex() {
        assert_eq!(map_pixels_to_complex(0, 0, 100, 100), Complex64::new(-2., 2.));
        assert_eq!(map_pixels_to_complex(100, 100, 100, 100), Complex64::new(2., -2.));
        assert_eq!(map_pixels_to_complex(50, 50, 100, 100), Complex64::new(0., -0.));
    }
}

fn make_image(width: u32, height: u32, max_iters: u32) -> GrayImage {
    let mut img = image::GrayImage::new(width, height);
    for (x, y, p) in img.enumerate_pixels_mut() {
        let c = map_pixels_to_complex(x, y, width, height);
        let num_iters = escape_iters(c, max_iters);
        let color = map_iters_to_color(num_iters, max_iters);
        // println!("{},{}={} iters={}, color={}", x, y, c, num_iters, color);
        p[0] = color;
    }
    return img
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    make_image(1024, 1024, 1000).save("blah.png")?;
    Ok(())
}
