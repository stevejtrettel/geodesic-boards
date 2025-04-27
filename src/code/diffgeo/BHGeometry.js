import {Vector2,Vector3} from "three";

import {NIntegrateRK} from "../integrators/NIntegrateRK.js";
import Symplectic2 from "../integrators/Symplectic2.js";


export default class BHGeometry{
    constructor(R) {

        this.R = R;

        //domain 3/2R is the Event Horizon,
        this.domain = [3/2*this.R,30*this.R];

        //outside only matters with the radial not angle coordinate for the domain
        const r0 = this.domain[0];
        const r1 = this.domain[1];
        this._outside = (pos) => (pos.x < r0 || pos.x > r1);

        //scratch for not generating things a bajillion times
        this.scratch = new Vector2();

        //parameterize a profile of the optical geometry with (r,h) as functions of u:
        this.radius = (u) => Math.sqrt(u*u*u / (u-this.R));

        //can compute the height function
        let heightPrime = (u) => Math.sqrt(u*R*(8*u-9*this.R)/(4*(u-this.R)**3));
        this.height = NIntegrateRK(heightPrime,this.domain);

        //the profile curve
        this.profile = (u) => new Vector3(this.radius(u),this.height(u),0);


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

        this.geoInt = new Symplectic2(this.acceleration,0.05);


    }


    //compute the parameterization
    parameterization = (u,theta) => {
        let r = this.radius(u);
        let h = this.height(u);
        return new Vector3(r*Math.cos(theta),r*Math.sin(theta),h);
    }



    /* --------------------------------------------------------------------
 * Geodesic integration (returns point list [x,y,z][])
 * -------------------------------------------------------------------- */
    integrateGeodesic = (tv, steps = 300) => {

        const pts  = [];
        let state  = tv.clone();

        for (let i = 0; i < steps; ++i) {
            const u = state.pos.x;
            const t = state.pos.y;

            const pos = this.parameterization(u,t)
            pts.push([pos.x,pos.y,pos.z]);

            state = this.geoInt.step(state);
            if (this._outside(state.pos)) {
                break;
            }
        }
        return pts;
    }




}
