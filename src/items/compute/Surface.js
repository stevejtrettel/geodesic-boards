import { Vector2 }            from 'three';
import Symplectic2            from '../integrators/Symplectic2.js';
import TransportIntegrator    from '../integrators/TransportIntegrator.js';
import { createInterpolator2 } from './interpolators.js';
import Curve                  from './Curve.js';
import TangentVector          from '../integrators/TangentVector.js';
import SurfaceMath            from './SurfaceMath.js';

export default class Surface {

    constructor(eqn, domain = [[0, 1],[0, 1]], parameters = {}, hGeo = 0.02) {

        this.domain = domain;
        this.math   = new SurfaceMath(eqn, parameters);

        /* ----------------------------------------------------------------
         * 0.  Domain guard
         * ---------------------------------------------------------------- */
        const [[x0, x1], [y0, y1]] = domain;
        this._outside = ({ x, y }) => (x < x0 || x > x1 || y < y0 || y > y1);

        /* ----------------------------------------------------------------
         * 1.  Geodesic integrator
         * ---------------------------------------------------------------- */
        this.geoInt = new Symplectic2(this.math.acceleration, hGeo);

        /* ----------------------------------------------------------------
         * 2.  Parallel transport along the *bottom* edge of the patch
         * ---------------------------------------------------------------- */
        this.bdyCurve = new Curve(t => new Vector2(
            x0 + t * (x1 - x0),
            y0                                     // fixed y = y0
        ));

        this.trInt  = new TransportIntegrator(this.bdyCurve, this.math.dTransport);

        /* build an interpolator that gives the transported basis at any t */
        const steps = 100, tPts = [], basisX = [], basisY = [];
        let X = new Vector2(1, 0), Y = new Vector2(0, 1);

        tPts.push(0); basisX.push(X.clone()); basisY.push(Y.clone());

        for (let i = 1; i <= steps; ++i) {
            const t = i / steps;
            X = this.trInt.step(t - 1 / steps, X);
            Y = this.trInt.step(t - 1 / steps, Y);
            tPts.push(t);
            basisX.push(X.clone());
            basisY.push(Y.clone());
        }

        const interpX = createInterpolator2(tPts, basisX);
        const interpY = createInterpolator2(tPts, basisY);

        this.bdyTransport = (t, V) =>
            interpX(t).clone().multiplyScalar(V.x)
                .add(interpY(t).clone().multiplyScalar(V.y));
    }

    /* --------------------------------------------------------------------
     * Geodesic integration (returns point list [x,y,z][])
     * -------------------------------------------------------------------- */
    integrateGeodesic(tv, steps = 300) {

        const pts  = [];
        let state  = tv.clone();

        for (let i = 0; i < steps; ++i) {

            const { x, y } = state.pos;
            pts.push([x, y, this.math.evaluate(x, y)]);

            state = this.geoInt.step(state);
            if (this._outside(state.pos)) break;
        }
        return pts;
    }

    /* --------------------------------------------------------------------
     * Parallel transport of a vector V based at t ∈ [0,1] on boundary curve
     * -------------------------------------------------------------------- */
    boundaryTransport(t, V) {
        const transported = this.bdyTransport(t, V);
        return new TangentVector(this.bdyCurve.getPoint(t), transported);
    }
}
