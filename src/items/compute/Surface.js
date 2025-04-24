import {Vector2,Vector3} from "three";
import RungeKutta from "../integrators/RungeKutta.js";


//takes in an equation (x,y)->f(x,y)
//the function should also allow the input of parameters a,b,c or something

export default class Surface {
    constructor(eqn, domain =[[0,1],[0,1]], derivatives = {}) {

        //equation and derivatives
        this.f = eqn;
        this.domain = domain;

        this.parametricEqn = function(x,y){return new Vector3(x,y,eqn(x,y))};

        this.stop = function(pos){
            return false;
        }




        let acc = function(tv){
            return new Vector2(0,0);
        };
        this.integrator = new RungeKutta(acc);

    }


    integrateGeodesic(tv){
        //return list of points along geodesic
        let pts =[];
        pts.push([tv.pos.x,tv.pos.y]);

        let temp=tv.clone();
        for(let i=0; i<200; i++){
            temp = this.integrator.step(temp);
            let x = temp.pos.x;
            let y = temp.pos.y;
            let z = this.f(x,y);
            pts.push([x,y,z]);
        }

        return pts;
    }

}
