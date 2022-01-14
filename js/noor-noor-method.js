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
    const ROOTS = [
        new Complex(-0.5, sqrt(3) / 2),
        new Complex(-0.5, -sqrt(3) / 2),
        new Complex(1, 0)
    ];

    const COLORS = [
        color('#fa3232'),
        color('#58db84'),
        color('#103e9c')
    ];

    // Schröder
    const A = [
            [-2.5, 2.5],
            [-2.5, 2.5]
        ],
        K = 15,
        T = 0.000001;

    noorNoor(A, K, T, ROOTS, COLORS);
}

/* ################# */
/* ### Noor-Noor ### */
/* ################# */

// https://en.wikipedia.org/wiki/Newton_fractal#Implementation
function noorNoor(A, K, T, ROOTS, COLORS) {
    // Functions
    // http://www.3d-meier.de/tut20/Noor-Noor/Seite1.html
    const f = z => z.pow(3).sub(new Complex(1, 0));
    const fd = z => z.pow(2).mult(new Complex(3, 0));

    const yn = z => z.sub(f(z).div(fd(z)));
    const vn = z => f(yn(z)).div(fd(z)).mult(new Complex(-1, 0));

    loadPixels();

    // Loop through all area point
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            // Get point coordinates
            const z = new Complex(
                map(x, 0, width, A[0][0], A[0][1]),
                map(y, 0, height, A[1][0], A[1][1])
            );

            let ic = color(0);
            let z0 = z;

            for (let i = 0; i < K; i++) {
                // Next sequence term
                // zn - a - b form
                const a = f(z0).div(fd(z0));
                const b = f(yn(z0).add(vn(z0))).div(fd(z0));

                const z1 = z0.sub(a).sub(b);

                // Compute on roots
                for (let j = 0; j < ROOTS.length; j++) {
                    const root = ROOTS[j]

                    // Check if close enough to root
                    const diff = z0.sub(root);
                    if (abs(diff.re) < T && abs(diff.im) < T) {
                        // Set pixel color
                        ic = COLORS[j];
                    }
                }

                z0 = z1;
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
        return new Complex(
            this.re + c.re,
            this.im + c.im
        );
    }

    sub(c) {
        return new Complex(
            this.re - c.re,
            this.im - c.im
        );
    }

    mult(c) {
        return new Complex(
            this.re * c.re - this.im * c.im,
            this.re * c.im + this.im * c.re,
        );
    }

    div(c) {
        return new Complex(
            (this.re * c.re + this.im * c.im) / (c.re ** 2 + c.im ** 2),
            (this.im * c.re - this.re * c.im) / (c.re ** 2 + c.im ** 2)
        );
    }

    pow(n) {
        let c = this;

        for (let i = 0; i < n - 1; i++) {
            c = c.mult(this);
        }

        return c;
    }

    abs() {
        return sqrt(this.re ** 2 + this.im ** 2);
    }

    dot(c) {
        return this.re * c.re + this.im * c.im;
    }

    dist(c) {
        return sqrt((this.re - c.re) ** 2 + (this.im - c.im) ** 2);
    }
}