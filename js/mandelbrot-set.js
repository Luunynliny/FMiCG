/* ######################## */
/* ### Global variables ### */
/* ######################## */

const FILEPATH = '../assets/colormaps/glass.map';
let filedata;

/* ###################### */
/* ### User Interface ### */
/* ###################### */

const NAV_HEIGHT = 40;

/* ################## */
/* ### Processing ### */
/* ################## */

function preload() {
    filedata = loadStrings(FILEPATH);
}

function setup() {
    createCanvas(windowWidth, windowHeight - NAV_HEIGHT);
    background(0);
    pixelDensity(1);
    noLoop();
}

function draw() {
    // Mandelbrot
    const A = [
        [-2, 1],
        [-1.5,1.5]
    ];
    const colormap = loadColormap(filedata)

    mandelbrot(A, 20, colormap);
}

/* ################## */
/* ### Mandelbrot ### */
/* ################## */

function mandelbrot(A, K, colormap) {
    loadPixels();

    // Loop through all area point
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            // Get point coordinates
            const c = new Complex(
                map(x, 0, width, A[0][0], A[0][1]),
                map(y, 0, height, A[1][0], A[1][1])
            );

            let R = 4;
            let z = new Complex(0, 0);
            let ic = color(0);

            for (let i = 0; i < K; i++) {
                // Next sequence term
                z.pow2();
                z.add(c);

                if (z.abs() > R) {
                    // Anti-aliasing (smooth) color index from the map
                    // https://linas.org/art-gallery/escape/escape.html
                    // https://linas.org/art-gallery/escape/smooth.html
                    // https://stackoverflow.com/questions/70107312/issue-with-mandelbrot-smooth-coloring/70108817#70108817
                    let mu = i - log(log(z.abs())) / log(2);
                    let mapIndex = floor((colormap.length - 1) * mu / K);
                    let interval = (colormap.length - 1) * mu / K - mapIndex;

                    if (mapIndex < colormap.length - 1) {
                        // Lerp between the current color and the next color by interval
                        ic = lerpColor(
                            colormap[mapIndex],
                            colormap[mapIndex + 1],
                            interval
                        );
                    } else {
                        // Retieve color from map
                        ic = colormap[mapIndex];
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
    constructor(r, im) {
        this.r = r;
        this.im = im;
    }

    add(c) {
        this.r += c.r;
        this.im += c.im;
    }

    pow2() {
        let r = this.r;
        let im = this.im;

        this.r = r ** 2 - im ** 2;
        this.im = 2 * r * im;
    }

    abs() {
        return sqrt(this.r ** 2 + this.im ** 2)
    }
}

/* ####################### */
/* ### Colormap loader ### */
/* ####################### */

function loadColormap(filedata) {
    let map = [];

    // Loop trought colors
    filedata.forEach(line => {
        let split = line.split(' ');

        map.push(color(
            parseInt(split[0]),
            parseInt(split[1]),
            parseInt(split[2]),
        ));
    });

    return map;
}