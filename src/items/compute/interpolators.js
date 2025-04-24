

//producing interpolating functions



//written with the help of CHATGPT :O

function createInterpolator(xs, ys, tension = 0.5) {
    if (xs.length !== ys.length || xs.length < 2) {
        throw new Error("Input and output arrays must have the same length and contain at least two points.");
    }

    return function (x) {
        if (x <= xs[0]) return ys[0]; // Extrapolate left
        if (x >= xs[xs.length - 1]) return ys[ys.length - 1]; // Extrapolate right

        // Find the interval containing x
        let i = 0;
        while (i < xs.length - 1 && x > xs[i + 1]) {
            i++;
        }

        // Get surrounding points
        let x0 = xs[Math.max(0, i - 1)], y0 = ys[Math.max(0, i - 1)];
        let x1 = xs[i], y1 = ys[i];
        let x2 = xs[Math.min(xs.length - 1, i + 1)], y2 = ys[Math.min(xs.length - 1, i + 1)];
        let x3 = xs[Math.min(xs.length - 1, i + 2)], y3 = ys[Math.min(xs.length - 1, i + 2)];

        // Compute parameter t in [0,1] within this segment
        let t = (x - x1) / (x2 - x1);

        // Compute Catmull-Rom spline coefficients (with tension)
        let t2 = t * t;
        let t3 = t2 * t;

        let m1 = (1 - tension) * (y2 - y0) / (x2 - x0);
        let m2 = (1 - tension) * (y3 - y1) / (x3 - x1);

        let a = 2 * t3 - 3 * t2 + 1;
        let b = t3 - 2 * t2 + t;
        let c = -2 * t3 + 3 * t2;
        let d = t3 - t2;

        return a * y1 + b * m1 * (x2 - x1) + c * y2 + d * m2 * (x2 - x1);
    };
}

export {createInterpolator}
