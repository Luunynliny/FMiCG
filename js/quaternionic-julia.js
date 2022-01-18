/* ######################## */
/* ### Global variables ### */
/* ######################## */

const MAX_ITERATION = 10;
const ACCURACY = 0.001;

// Lighting
const AMBIENT_RGB = [40, 50, 110];
const DIFFUSE_RGB = [100, 25, 25];
const SPECULAR_RGB = [10, 10, 50];

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
    // Camera
    const eye = createVector(0, 0, 2.5);
    const center = createVector(0, 0, 0);
    const up = createVector(0, 1, 0);
    const fovY = radians(70);

    // Light
    const light = createVector(1, 0, 0);

    // Julia sets
    const JULIAS = [
        new Quaternion(-0.591, -0.399, 0.399, 0.437),
        new Quaternion(-0.5, 0.4, 0.4, 0.2),
        new Quaternion(-1, 0.2, 0, 0),
        new Quaternion(0, 1, 0.1, 0.2)
    ];

    quaternionicJulia(eye, center, up, fovY, JULIAS[1], light);
}

/* ########################## */
/* ### Quaternionic Julia ### */
/* ########################## */

function quaternionicJulia(
    cameraEye, cameraCenter, cameraUp, cameraFovY,
    c, light
) {
    loadPixels();

    // Loop through all area point
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            // Julia computations
            let rayDir = rayThroughPixel(
                cameraEye, cameraCenter, cameraUp, cameraFovY,
                x, y
            );

            const [p, d] = intersect(cameraEye, rayDir, c);

            // Coloring
            let ic = color('black');
            if (d < ACCURACY) {
                const n = estimateNormal(p, c);
                ic = phongShading(p, n, cameraEye, light);
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

/* ######################## */
/* ### Ray intersection ### */
/* ######################## */

function rayThroughPixel(
    cameraEye, cameraCenter, cameraUp, cameraFovY,
    x, y
) {
    // Camera system
    const wt = p5.Vector.sub(cameraEye, cameraCenter);
    const camW = p5.Vector.div(wt, wt.mag());

    const ut = p5.Vector.cross(cameraUp, camW);
    const camU = p5.Vector.div(ut, ut.mag());

    const camV = p5.Vector.cross(camW, camU);

    // Pixel center
    const xc = x + 0.5;
    const yc = y + 0.5;

    // Alpha-beta coordinates
    const fovX = (width / height) * tan(cameraFovY / 2);
    const alpha = (xc - (width / 2)) / (width / 2) * tan(fovX / 2);
    const beta = ((height / 2) - yc) / (height / 2) * tan(cameraFovY / 2);

    // Ray direction
    const a1 = p5.Vector.mult(camU, alpha);
    const a2 = p5.Vector.mult(camV, beta);
    const a3 = p5.Vector.add(a1, a2);
    const a = p5.Vector.sub(a3, camW);

    const dir = p5.Vector.div(a, a.mag());

    return dir;
}

function intersect(r0, direction, c) {
    let d = Infinity;
    let p = r0.copy();

    while (true) {
        let z = new Quaternion(p.x, p.y, p.z, 0);
        let zp = new Quaternion(1, 0, 0, 0);

        for (let i = 0; i < MAX_ITERATION; i++) {
            zp = z.mult(zp).scal(2);
            z = z.mult(z).add(c);

            if (z.mag() ** 2 > 10) {
                break;
            }
        }

        d = (z.mag() / (2 * zp.mag())) * log(z.mag());
        p = p5.Vector.add(
            p,
            p5.Vector.mult(direction, max(d, ACCURACY))
        );

        if (d < ACCURACY || p.mag() > 3) {
            break;
        }
    }

    return [p, d];
}

/* ############## */
/* ### Normal ### */
/* ############## */

function estimateNormal(p, c) {
    // Point p extend to quaternion
    const q = new Quaternion(p.x, p.y, p.z, 0);
    const delta = 0.001;

    let qa = q.add(new Quaternion(delta, 0, 0, 0));
    let qb = q.add(new Quaternion(-delta, 0, 0, 0));
    let qc = q.add(new Quaternion(0, delta, 0, 0));
    let qd = q.add(new Quaternion(0, -delta, 0, 0));
    let qe = q.add(new Quaternion(0, 0, delta, 0));
    let qf = q.add(new Quaternion(0, 0, -delta, 0));

    for (let i = 0; i < MAX_ITERATION; i++) {
        qa = qa.mult(qa).add(c);
        qb = qb.mult(qb).add(c);
        qc = qc.mult(qc).add(c);
        qd = qd.mult(qd).add(c);
        qe = qe.mult(qe).add(c);
        qf = qf.mult(qf).add(c);
    }

    const g = createVector(
        Math.log2(qa.mag() ** 2) - Math.log2(qb.mag() ** 2),
        Math.log2(qc.mag() ** 2) - Math.log2(qd.mag() ** 2),
        Math.log2(qe.mag() ** 2) - Math.log2(qf.mag() ** 2)
    );

    return g.normalize();
}

/* ################ */
/* ### Lighting ### */
/* ################ */

// https://cs.nyu.edu/~perlin/courses/fall2005ugrad/phong.html
// https://www.robots.ox.ac.uk/~att/index.html
function phongShading(point, normal, eye, light) {
    // Unit vector between point and light
    const lt = p5.Vector.sub(point, light);
    const L = p5.Vector.div(lt, lt.mag());

    // Unit vector between point and view
    const vt = p5.Vector.sub(point, eye);
    const V = p5.Vector.div(vt, vt.mag());

    // light reflection unit vector (mirror of L about N)
    // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
    const R = p5.Vector.sub(
        light,
        p5.Vector.cross(light, normal).mult(p5.Vector.mult(normal, 2))
    );

    // Diffuse component
    const diffuse = p5.Vector.dot(normal, L);

    // Spectral component
    const e = 4;
    const spectral = R.dot(V) ** e;

    // Phong color
    const phong = color(
        AMBIENT_RGB[0] + DIFFUSE_RGB[0] * diffuse + SPECULAR_RGB[0] * spectral,
        AMBIENT_RGB[1] + DIFFUSE_RGB[1] * diffuse + SPECULAR_RGB[1] * spectral,
        AMBIENT_RGB[2] + DIFFUSE_RGB[2] * diffuse + SPECULAR_RGB[2] * spectral
    );

    return phong;
}

/* ################## */
/* ### Quaternion ### */
/* ################## */

// https://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/arithmetic/index.htm
class Quaternion {
    constructor(w, x, y, z) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(q) {
        return new Quaternion(
            this.w + q.w,
            this.x + q.x,
            this.y + q.y,
            this.z + q.z
        );
    }

    scal(s) {
        return new Quaternion(
            this.w * s,
            this.x * s,
            this.y * s,
            this.z * s
        );
    }

    mult(q) {
        const a = this.w;
        const b = this.x;
        const c = this.y;
        const d = this.z;
        const e = q.w;
        const f = q.x;
        const g = q.y;
        const h = q.z;

        return new Quaternion(
            a * e - b * f - c * g - d * h,
            b * e + a * f + c * h - d * g,
            a * g - b * h + c * e + d * f,
            a * h + b * g - c * f + d * e
        );
    }

    mag() {
        return sqrt(this.w ** 2 + this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    normalize() {
        const m = this.mag();

        return new Quaternion(
            this.w / m,
            this.x / m,
            this.y / m,
            this.z / m
        );
    }
}