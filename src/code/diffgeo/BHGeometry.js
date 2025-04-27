import DiffGeo from "./DiffGeo-Abstract.js";
import {Vector2, Vector3} from "three";
import {NIntegrateRK} from "../integrators/NIntegrateRK.js";
import Symplectic2 from "../integrators/Symplectic2.js";

export default class BHGeometry extends DiffGeo{

    constructor(R) {
        super();

        this.R = R;

        //domain 3/2R is the Event Horizon, 9/8 is embedding limit
        this.domain = [3/2*this.R,30*this.R];

        const [r0,r1] = this.domain;
        this._outside = (pos) => (pos.x < r0 || pos.x > r1);

        //scratch for not generating things a bajillion times
        this.scratch = new Vector2();

        //build the embedding coords
        this._buildEmbeddingCoords();


        //compute the geodesic acceleration
        this.acceleration = (tv) => {
            let R = this.R;
            let u = tv.pos.x;
            let t = tv.pos.y;
            let uP = tv.vel.x;
            let tP = tv.vel.y;

            let denom = u*(R-u);

            let uAcc = 1/2*(2*u-3*R)*tP*tP - R*uP*uP/denom;
            let tAcc = (2*u-3*R)*uP*tP/denom;

            return this.scratch.set(uAcc,tAcc);
        }

        this.geodesicEqn = new Symplectic2(this.acceleration, 0.02);



    }


    _buildEmbeddingCoords(){

        const R = this.R;

        //parameterize a profile of the optical geometry with (r,h) as functions of u:
        this.radius = (u) => Math.sqrt(u*u*u / (u-this.R));

        //can compute the height function
        let heightPrime = (u) => Math.sqrt(u*R*(8*u-9*this.R)/(4*(u-this.R)**3));
        this.height = NIntegrateRK(heightPrime,this.domain);

    }


    /* ----------------------------------------------------------------
    * Required Methods
    * ---------------------------------------------------------------- */

    parameterization = (u,theta) => {
        let r = this.radius(u);
        let h = this.height(u);
        return new Vector3(r*Math.cos(theta),r*Math.sin(theta),h);
    }

    surfaceNormal(coords){
        console.log('Need to Implement GetNormal')
    }

    integrateGeodesic = (tv, steps = 300) => {

        const pts  = [];
        let state  = tv.clone();

        for (let i = 0; i < steps; ++i) {
            const u = state.pos.x;
            const t = state.pos.y;

            const pos = this.parameterization(u,t)
            pts.push([pos.x,pos.y,pos.z]);

            state = this.geodesicEqn.step(state);
            if (this._outside(state.pos)) {
                break;
            }
        }
        return pts;
    }

    parallelTransport(coordCurve){
        //return an interpolating function for basis along curve
        console.log('Need to Implement ParallelTransport')
    }

    rebuild(R){
        this.R=R;
        this._buildEmbeddingCoords();
    }

}
