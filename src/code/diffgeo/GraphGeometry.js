//replacement for DiffGeo and Surface classes
import {Vector2, Vector3} from "three";
import { create, all } from 'mathjs/number';
const math = create(all); // light-weight math.js bundle

import {fromMathJS} from "../utils/fromMathJS.js";
import {toGLSL} from "../utils/toGLSL.js";
import Symplectic2 from "../integrators/Symplectic2.js";
import TransportIntegrator from "../integrators/TransportIntegrator.js";
import {createCatmullRomVec} from "../interpolators/catmullRomVector.js";
import DiffGeo from "./DiffGeo-Abstract.js";

export default class GraphGeometry extends DiffGeo{
    constructor(eqn, domain = [[0, 1],[0, 1]], parameters = {}) {

        super();

        this.eqn        = eqn;
        this.domain     = domain;
        this.parameters = parameters;

        //domain guard
        const [[x0, x1], [y0, y1]] = domain;
        this._outside = ({ x, y }) => (x < x0 || x > x1 || y < y0 || y > y1);

        /* scratch vector reused each call to avoid GC churn */
        this.scratch = new Vector2();

        //0.  Build f, fx, fy, fxx, fxy, fyy  (symbolic → compiled)
        this._buildDerivatives();

        //1.  Build geodesic acceleration, parallel transport etc from derivatives
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

            return this.scratch.set(fx, fy).multiplyScalar(coef);
        };

        this.geodesicEqn = new Symplectic2(this.acceleration, 0.02);

        this.dTransport = (tv, V) => {
            const { x:x, y:y }   = tv.pos;
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

            return this.scratch.set(VxP, VyP);
        };

        this.gaussCurvature = (x, y) => {
            const fx  = this.fx(x, y);
            const fy  = this.fy(x, y);
            const fxx = this.fxx(x, y);
            const fyy = this.fyy(x, y);
            const fxy = this.fxy(x, y);

            const denom = 1 + fx*fx + fy*fy;
            return (fxx * fyy - fxy * fxy) / (denom * denom);
        }


    }




    /* ----------------------------------------------------------------
    * Internals
    * ---------------------------------------------------------------- */

    _buildDerivatives() {

        // 1) parse & simplify once
        const nodeF      = math.parse(this.eqn);
        const paramNames = Object.keys(this.parameters);
        const make       = src =>
            fromMathJS(src, {
                vars:      ['x','y'],
                params:    paramNames,
                paramsObj: this.parameters
            });

        // helper to try compile, else return null
        const tryCompile = node => {
            let res= make(node);
            return res;
            // try { return make(node); }
            // catch { return null; }
        };

        // helper to get a simplified node derivative
        const d = (n,v) => math.simplify(math.derivative(n, v));


        // 2) build symbolic ASTs for each
        const fxNode  = d(nodeF,    'x');
        const fyNode  = d(nodeF,    'y');
        const fxxNode = d(fxNode,   'x');
        const fxyNode = d(fxNode,   'y');
        const fyyNode = d(fyNode,   'y');


        // 3) compile to JS functions (with numeric fallback)
        this.f   = tryCompile(nodeF) || ((x,y) => 1);
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


        // 4) capture GLSL‐compatible code strings
        //  These strings can be inlined into the shader as:
        // float fx(float x, float y) { return <this.glsl_fx>; }
        this.glsl_f   = toGLSL(nodeF.toString());
        this.glsl_fx  = toGLSL(fxNode.toString());
        this.glsl_fy  = toGLSL(fyNode.toString());
        this.glsl_fxx = toGLSL(fxxNode.toString());
        this.glsl_fxy = toGLSL(fxyNode.toString());
        this.glsl_fyy = toGLSL(fyyNode.toString());

    }





    /* ----------------------------------------------------------------
    * Required Methods
    * ---------------------------------------------------------------- */

    parameterization = (x, y) => new Vector3(x, y, this.f(x, y));

    surfaceNormal = (x,y) => {
        let fx = this.fx(x,y);
        let fy = this.fy(x,y);
        return this.scratch.set(-fx,-fy,1).normalize();
    }

    integrateGeodesic(tv, steps = 300) {

        const pts  = [];
        let state  = tv.clone();
        // console.log(state);

        for (let i = 0; i < steps; ++i) {

            const x = state.pos.x;
            const y = state.pos.y;

            pts.push([x, y, this.f(x, y)]);

            state = this.geodesicEqn.step(state);
            if (this._outside(state.pos)) break;
        }

        return pts;
    }

    parallelTransport(coordCurve){
        //return an interpolating function for basis along curve
        //coordCurve goes from 0 to 1

        const integrator  = new TransportIntegrator(coordCurve, this.dTransport);

        const steps = 100;
        const Ts = [], Xs = [], Ys = [];

        let X = new Vector2(1, 0), Y = new Vector2(0, 1);
        Ts.push(0); Xs.push(X.clone()); Ys.push(Y.clone());

        for (let i = 0; i < steps; ++i) {
            const t = i / steps;
            X = integrator.step(t - 1 / steps, X);
            Y = integrator.step(t - 1 / steps, Y);
            Ts.push(t);
            Xs.push(X.clone());
            Ys.push(Y.clone());
        }

        const XTransport = createCatmullRomVec(Ts,Xs);
        const YTransport = createCatmullRomVec(Ts,Ys);
        return (t)=>[XTransport(t),YTransport(t)];
    }

    rebuild(eqn){
        //rebuild: the other functions all call the derivatifes so don't need to be rebuilt
        this.eqn=eqn;
        this._buildDerivatives();
    }

}
