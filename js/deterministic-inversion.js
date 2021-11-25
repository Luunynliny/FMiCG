/* ######################## */
/* ### Global variables ### */
/* ######################## */

let startingCircles;
let inversionCircles;
let inversionCentroid; // Use to center drawing on screen
let sf = 1; // Scale factor

/* ###################### */
/* ### User Interface ### */
/* ###################### */

const NAV_HEIGHT = 40;

let nSlider;
let nText

/* ################## */
/* ### Processing ### */
/* ################## */

function setup() {
    createCanvas(windowWidth, windowHeight - NAV_HEIGHT);

    initialization();

    // Setup slider
    nSlider = createSlider(1, 5, 2);
    nSlider.position(10, windowHeight - 10 - NAV_HEIGHT);
    nSlider.addClass('slider');
}

function draw() {
    background(0);

    // Slider text
    textSize(15);
    fill(255);
    textFont('Courier New');
    textAlign(LEFT, CENTER);

    nText = text('n = ' + nSlider.value(), 250, windowHeight - 40 - NAV_HEIGHT);

    push();

    // Center drawing
    translate(width / 2 - inversionCentroid.x * sf, height / 2 - inversionCentroid.x * sf);

    // Zoom
    scale(sf);
    strokeWeight(2 / sf);

    // Inversion circles
    inversionCircles.forEach(circle => {
        circle.draw(color(47, 221, 146));
    });

    // Fractal
    fractal(startingCircles, inversionCircles, nSlider.value() - 1).forEach(circle => {
        circle.draw(color(60, 141, 173));
    });

    pop();
}

/* ################ */
/* ### Controls ### */
/* ################ */

// Zoom
window.addEventListener("wheel", e => {
    sf *= (e.deltaY < 0) ? 1.1 : 0.9;
});

/* ###################### */
/* ### Initialization ### */
/* ###################### */

function initialization() {
    startingCircles = [
        new Circle(400, 400, 200),
        new Circle(400, 282.85, 82.85),
        new Circle(400, 517.15, 82.85),
        new Circle(282.85, 400, 82.85),
        new Circle(517.15, 400, 82.85)
    ];

    inversionCircles = [
        new Circle(200, 200, 200),
        new Circle(600, 200, 200),
        new Circle(200, 600, 200),
        new Circle(600, 600, 200),
        new Circle(400, 400, 82.85),
    ];

    // Compute inversoin circles centroid
    inversionCentroid = centroid(
        inversionCircles.map(c => createVector(c.x, c.y))
    );
}

/* ########################### */
/* ### Inversion algorithm ### */
/* ########################### */

function fractal(startingCircles, inversionCircles, n) {
    F = startingCircles;
    T1 = [];

    // Number of inversion cricle use to obtain T1 item
    let q = [];

    for (let i = 0; i < inversionCircles.length; i++) {
        for (let j = 0; j < F.length; j++) {
            if (!F[j].isIntersecting(inversionCircles[i])) {
                let C = inversionTransformation(F[j], inversionCircles[i]);
                T1.push(C);
                q.push(i);
            }
        }
    }

    F = F.concat(T1);

    for (let l = 0; l < n; l++) {
        T2 = [];

        for (let i = 0; i < inversionCircles.length; i++) {
            for (let j = 0; j < T1.length; j++) {
                // Current circle to transform
                let S = T1[j];

                if (!inversionCircles[i].isOrthogonal(S) && i != q[j]) {
                    let C = inversionTransformation(S, inversionCircles[i]);
                    T2.push(C)
                }
            }
        }

        F = F.concat(T2);
        T1 = T2;
    }

    return F; // Remove duplicates
}

function inversionTransformation(S, C) {
    // Commun formula component
    let communFactor = (C.r ** 2) / (((S.x - C.x) ** 2) + ((S.y - C.y) ** 2) - (S.r ** 2));

    // print(C, S);
    // print(communFactor);

    // Compute transformed circle center
    let cComp1 = createVector(C.x, C.y);
    let cComp2 = createVector(S.x - C.x, S.y - C.y);
    let c = cComp1.add(cComp2.mult(communFactor));

    // Compute transformed circle radius
    let r = abs(communFactor) * S.r;

    return new Circle(c.x, c.y, r);
}

/* ##################### */
/* ### Circle object ### */
/* ##################### */

class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }

    isIntersecting(C) {
        let d = dist(this.x, this.y, C.x, C.y);
        return d < (this.r + C.r);
    }

    isOrthogonal(C) {
        let d = dist(this.x, this.y, C.x, C.y);
        return (d ** 2) == (this.r ** 2 + C.r ** 2);
    }

    draw(color) {
        stroke(color);
        fill(255, 0, 0, 0);
        circle(this.x, this.y, this.r * 2);
    }
}

/* ################ */
/* ### Centroid ### */
/* ################ */

// https://math.stackexchange.com/a/1801878
function centroid(points) {
    let cx = 0;
    let cy = 0;

    points.forEach(p => {
        cx += p.x;
        cy += p.y;
    });

    return createVector(cx / points.length, cy / points.length);
}