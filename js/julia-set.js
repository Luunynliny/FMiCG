/* ###################### */
/* ### User Interface ### */
/* ###################### */

const NAV_HEIGHT = 40;

/* ################## */
/* ### Processing ### */
/* ################## */

function setup() {
    createCanvas(windowWidth, windowHeight - NAV_HEIGHT);
    background(0);
    pixelDensity(1);
    noLoop();
}

function draw() {
    // Compute offsets to keep julia proportion
    let offset = map(
        windowWidth - windowHeight - NAV_HEIGHT,
        0,
        windowHeight,
        -1.5,
        1.5
    );

    // Julia
    const c = new Complex(0.35, 0),
        A = [
            [-1.5 - offset, 1.5 + offset],
            [-1.5, 1.5]
        ],
        K = 20,
        R = 2;

    julia(c, A, K, R);
}

/* ############# */
/* ### Julia ### */
/* ############# */

function julia(c, A, K, R) {
    loadPixels();

    // Loop through all area point
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            // Get point coordinates
            const z0 = new Complex(
                map(x, 0, width, A[0][0], A[0][1]),
                map(y, 0, height, A[1][0], A[1][1])
            );

            let ic = color(0);

            for (let i = 0; i < K; i++) {
                // Next sequence term
                z0.pow2();
                z0.add(c);

                if (z0.abs() > R) {
                    // Get binary color with escape angle
                    // https://www.mi.sanu.ac.rs/vismath/javier/b4.htm
                    let θ = atan(z0.im / z0.re);
                    θ = degrees(θ);

                    if (0 < θ && θ < 180) {
                        ic = color('#5eb1bf');
                    }

                    break;
                }
            }

            // Color pixel
            const index = (x + y * width) * 4;
            pixels[index] = red(ic);
            pixels[index + 1] = green(ic);
            pixels[index + 2] = blue(ic);
            pixels[index + 3] = 255;
        }
    }

    updatePixels();
}

/* ############### */
/* ### Complex ### */
/* ############### */

class Complex {
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }

    add(c) {
        this.re += c.re;
        this.im += c.im;
    }

    pow2() {
        let re = this.re;
        let im = this.im;

        this.re = re ** 2 - im ** 2;
        this.im = 2 * re * im;
    }

    abs() {
        return sqrt(this.re ** 2 + this.im ** 2)
    }
}