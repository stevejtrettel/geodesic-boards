import {Vector2,Vector3} from "three";
import RungeKutta from "../integrators/RungeKutta.js";

//takes in an equation (x,y)->f(x,y)
//the function should also allow the input of parameters a,b,c or something

export default class Surface {

    constructor(f, domain =[[0,1],[0,1]], derivatives = {}) {

        //equation and derivatives
        this.f = f;
        this.buildDerivatives(derivatives);
        this.parametricEqn = (x,y) => new Vector3(x,y,this.f(x,y));


        //domain and where to stop
        this.domain = domain;
        this.stop = (uv) => {
            let u = uv.x;
            let v = uv.y;
            if(u< domain[0][0] || u > domain[0][1]){
                return true;
            }
            if(v< domain[1][0] || v> domain[1][1]){
                return true;
            }
            return false;
        }


        this.acceleration = (tv) => {

            let u =  tv.pos.x;
            let v =  tv.pos.y;
            let uP = tv.vel.x;
            let vP = tv.vel.y;

            let fu = this.fu(u,v);
            let fv = this.fv(u,v);
            let fuv = this.fuv(u,v);
            let fuu = this.fuu(u,v);
            let fvv = this.fvv(u,v);

            let num = fuu*uP*uP + 2*fuv*uP*vP + fvv*vP*vP;
            let denom = 1+ fuu*fuu + fvv*fvv;
            let coef = -num/denom;

            return new Vector2(fu,fv).multiplyScalar(coef);
        };


        this.integrator = new RungeKutta(this.acceleration,0.01);

    }

    buildDerivatives(derivatives={}){
        let f = this.f;
        let h = 0.0001;

        this.fu = derivatives.fu || ((u,v) => (f(u+h,v)-f(u-h,v))/(2*h));
        this.fv = derivatives.fv || ((u,v) => (f(u,v+h)-f(u,v-h))/(2*h));
        this.fuu = derivatives.fuu || ((u,v)=> (f(u+h,v)+f(u-h,v)-2*f(u,v))/(h*h));
        this.fvv = derivatives.fvv || ((u,v)=> (f(u,v+h)+f(u,v-h)-2*f(u,v))/(h*h));
        this.fuv = derivatives.fuv || ((u,v)=> (f(u+h,v+h)+f(u-h,v-h)-f(u+h,v-h)-f(u-h,v+h))/(4*h*h));
    }


    integrateGeodesic(tv){
        //return list of points along geodesic
        let pts =[];
        pts.push([tv.pos.x,tv.pos.y, this.f(tv.pos.x,tv.pos.y)]);

        let temp=tv.clone();
        let x,y,z;
        for(let i=0; i<200; i++){
            temp = this.integrator.step(temp);
            if(this.stop(temp.pos)){break;}

            x = temp.pos.x;
            y = temp.pos.y;
            z = this.f(x,y);
            pts.push([x,y,z]);

        }

        return pts;
    }






}
