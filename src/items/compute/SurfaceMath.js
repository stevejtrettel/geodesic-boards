import { Vector2, Vector3 }         from 'three';
import { create, all }              from 'mathjs/number';
import { compileMath }              from '../utils/compileMath.js';

const math = create(all);           // light-weight math.js bundle

export default class SurfaceMath {

    constructor(eqn, parameters = {}) {
        this.eqn        = eqn;
        this.parameters = parameters;

        /* ------------------------------------------------------------
         * 0.  Build f, fx, fy, fxx, fxy, fyy  (symbolic → compiled)
         * ------------------------------------------------------------ */
        this._buildDerivatives();

        /* ------------------------------------------------------------
         * 1.  ODE callbacks – arrow functions keep lexical `this`
         * ------------------------------------------------------------ */
        this.acceleration = tv => {
            const { x, y }   = tv.pos;
            const { x: xP, y: yP } = tv.vel;

            const fx  = this.fx(x, y);
            const fy  = this.fy(x, y);
            const fxx = this.fxx(x, y);
            const fxy = this.fxy(x, y);
            const fyy = this.fyy(x, y);

            const num  = fxx * xP * xP + 2 * fxy * xP * yP + fyy * yP * yP;
            const coef = -num / (1 + fx * fx + fy * fy);

            return this._scratchA.set(fx, fy).multiplyScalar(coef);
        };

        this.dTransport = (tv, V) => {
            const { x, y }   = tv.pos;
            const { x: xP, y: yP } = tv.vel;

            const fx  = this.fx(x, y);
            const fy  = this.fy(x, y);
            const fxx = this.fxx(x, y);
            const fxy = this.fxy(x, y);
            const fyy = this.fyy(x, y);

            const denom = 1 + fx * fx + fy * fy;

            /* Christoffel symbols in (x,y) coordinates */
            const Γxxx =  fx * (fxx - fx * fy * fxy + fy * fy * fyy) / denom;
            const Γyyy =  fy * (fyy - fx * fy * fxy + fx * fx * fxx) / denom;
            const Γxyx =  fx * fxy / denom;
            const Γxxy =  fxx * fy / denom;
            const Γxyy =  fy * fxy / denom;
            const Γyyx =  fyy * fx / denom;

            const VxP = -xP * (Γxxx * V.x + Γxyx * V.y)
                -yP * (Γxyx * V.x + Γyyx * V.y);
            const VyP = -xP * (Γxxy * V.x + Γxyy * V.y)
                -yP * (Γxyy * V.x + Γyyy * V.y);

            return this._scratchB.set(VxP, VyP);
        };

        /* scratch vectors reused each call to avoid GC churn */
        this._scratchA = new Vector2();
        this._scratchB = new Vector2();
    }

    /* ----------------------------------------------------------------
     * Public helpers
     * ---------------------------------------------------------------- */
    evaluate  = (x, y) => this.f(x, y);
    parametric = (x, y) => new Vector3(x, y, this.f(x, y));

    derivative(x, y, which) {
        switch (which) {
            case 'x' : return this.fx(x, y);
            case 'y' : return this.fy(x, y);
            case 'xx': return this.fxx(x, y);
            case 'xy': return this.fxy(x, y);
            case 'yy': return this.fyy(x, y);
            default  : throw new Error(`SurfaceMath: unknown derivative “${which}”`);
        }
    }

    /* ----------------------------------------------------------------
     * Internals
     * ---------------------------------------------------------------- */
    _buildDerivatives() {

        const nodeF = math.simplify(math.parse(this.eqn));
        const paramNames = Object.keys(this.parameters);

        const make = src =>
            compileMath(src, { vars: ['x', 'y'], params: paramNames,
                paramsObj: this.parameters });

        /* try to compile everything ------------------------------------------------ */
        const tryCompile = node => {
            try { return make(node.toString()); }
            catch { return null; }
        };

        const d = (n, v) => math.simplify(math.derivative(n, v));

        this.f   = tryCompile(nodeF)         || ((x, y) => NaN); // will never fail
        this.fx  = tryCompile(d(nodeF, 'x'));
        this.fy  = tryCompile(d(nodeF, 'y'));
        this.fxx = tryCompile(d(d(nodeF, 'x'), 'x'));
        this.fxy = tryCompile(d(d(nodeF, 'x'), 'y'));
        this.fyy = tryCompile(d(d(nodeF, 'y'), 'y'));

        /* any derivative that didn’t compile → numerical fallback */
        const h = 1e-5, f = this.f;
        if (!this.fx)  this.fx  = (x, y) => (f(x + h, y) - f(x - h, y)) / (2 * h);
        if (!this.fy)  this.fy  = (x, y) => (f(x, y + h) - f(x, y - h)) / (2 * h);
        if (!this.fxx) this.fxx = (x, y) => (f(x + h, y) + f(x - h, y) - 2 * f(x, y)) / (h * h);
        if (!this.fyy) this.fyy = (x, y) => (f(x, y + h) + f(x, y - h) - 2 * f(x, y)) / (h * h);
        if (!this.fxy) this.fxy = (x, y) =>
            (f(x + h, y + h) + f(x - h, y - h) - f(x + h, y - h) - f(x - h, y + h)) / (4 * h * h);
    }
}
