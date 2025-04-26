import { Vector2, Vector3 }         from 'three';
import { create, all }              from 'mathjs/number';
import { compileMath }              from '../utils/compileMath.js';
import {toGLSL}                     from "../utils/toGLSL.js";

const math = create(all);           // light-weight math.js bundle

export default class DiffGeo {

    constructor(eqn, parameters = {}) {
        this.eqn        = eqn;
        this.parameters = parameters;

        /* scratch vector reused each call to avoid GC churn */
        this.scratchVec = new Vector2();

        /* ------------------------------------------------------------
         * 0.  Build f, fx, fy, fxx, fxy, fyy  (symbolic → compiled)
         * ------------------------------------------------------------ */
        this._buildDerivatives();

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
        // ──────────────────────────────────────────────────────
        // 1) parse & simplify once
        // ──────────────────────────────────────────────────────
        const nodeF      = math.simplify(math.parse(this.eqn));
        const paramNames = Object.keys(this.parameters);
        const make       = src =>
            compileMath(src, {
                vars:      ['x','y'],
                params:    paramNames,
                paramsObj: this.parameters
            });

        // helper to try compile, else return null
        const tryCompile = node => {
            try { return make(node.toString()); }
            catch { return null; }
        };

        // helper to get a simplified node derivative
        const d = (n,v) => math.simplify(math.derivative(n, v));

        // ──────────────────────────────────────────────────────
        // 2) build symbolic ASTs for each partial
        // ──────────────────────────────────────────────────────
        const fxNode  = d(nodeF,    'x');
        const fyNode  = d(nodeF,    'y');
        const fxxNode = d(fxNode,   'x');
        const fxyNode = d(fxNode,   'y');
        const fyyNode = d(fyNode,   'y');

        // ──────────────────────────────────────────────────────
        // 3) compile to JS functions (with numeric fallback)
        // ──────────────────────────────────────────────────────
        this.f   = tryCompile(nodeF)       || ((x,y) => NaN);
        this.fx  = tryCompile(fxNode);
        this.fy  = tryCompile(fyNode);
        this.fxx = tryCompile(fxxNode);
        this.fxy = tryCompile(fxyNode);
        this.fyy = tryCompile(fyyNode);

        // numeric fallback if any failed
        const h = 1e-5, f = this.f;
        if (!this.fx)  this.fx  = (x,y) => (f(x+h,y) - f(x-h,y)) / (2*h);
        if (!this.fy)  this.fy  = (x,y) => (f(x,y+h) - f(x,y-h)) / (2*h);
        if (!this.fxx) this.fxx = (x,y) => (f(x+h,y) + f(x-h,y) - 2*f(x,y)) / (h*h);
        if (!this.fyy) this.fyy = (x,y) => (f(x,y+h) + f(x,y-h) - 2*f(x,y)) / (h*h);
        if (!this.fxy) this.fxy = (x,y) =>
            (f(x+h,y+h) + f(x-h,y-h)
                - f(x+h,y-h) - f(x-h,y+h))
            / (4*h*h);

        // ──────────────────────────────────────────────────────
        // 4) capture GLSL‐compatible code strings
        // ──────────────────────────────────────────────────────
        //    These strings can be inlined into your shader as:
        //      float fx(float x, float y) { return <this.glsl_fx>; }
        this.glsl_f   = toGLSL(nodeF.toString());
        this.glsl_fx  = toGLSL(fxNode.toString());
        this.glsl_fy  = toGLSL(fyNode.toString());
        this.glsl_fxx = toGLSL(fxxNode.toString());
        this.glsl_fxy = toGLSL(fxyNode.toString());
        this.glsl_fyy = toGLSL(fyyNode.toString());

        // float f(float x, float y) {
        //     return ${surfaceMath.glsl_f};
        // }
        // float fx(float x, float y) {
        //     return ${surfaceMath.glsl_fx};
        // }
    }

    rebuild(eqn){
        this.eqn=eqn;
        this._buildDerivatives();
    }



    /* ------------------------------------------------------------
 * 1.  ODE callbacks – arrow functions keep lexical `this`
 * ------------------------------------------------------------ */
    acceleration = tv => {
        const { x, y }   = tv.pos;
        const { x: xP, y: yP } = tv.vel;

        const fx  = this.fx(x, y);
        const fy  = this.fy(x, y);
        const fxx = this.fxx(x, y);
        const fxy = this.fxy(x, y);
        const fyy = this.fyy(x, y);

        const num  = fxx * xP * xP + 2 * fxy * xP * yP + fyy * yP * yP;
        const coef = -num / (1 + fx * fx + fy * fy);

        return this.scratchVec.set(fx, fy).multiplyScalar(coef);
    };

    dTransport = (tv, V) => {
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

        return this.scratchVec.set(VxP, VyP);
    };

    gaussCurvature = (x, y) => {
        const fx  = this.fx(x, y);
        const fy  = this.fy(x, y);
        const fxx = this.fxx(x, y);
        const fyy = this.fyy(x, y);
        const fxy = this.fxy(x, y);

        const denom = 1 + fx*fx + fy*fy;
        return (fxx * fyy - fxy * fxy) / (denom * denom);
    }

}
