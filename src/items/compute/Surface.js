import {Vector2, Vector3} from "three";
import RungeKutta from "../integrators/RungeKutta.js";
import Symplectic2 from "../integrators/Symplectic2.js";
import TransportIntegrator from "../integrators/TransportIntegrator.js";
import {createInterpolator2} from "./interpolators.js";
import Curve from "./Curve.js";
import TangentVector from "../integrators/TangentVector";



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



        //the geodesic integrator

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
            let denom = 1+ fu*fu + fv*fv;
            let coef = -num/denom;

            return new Vector2(fu,fv).multiplyScalar(coef);
        };

        this.geodesicFlow = new Symplectic2(this.acceleration,0.02);



        //the parallel transport integrator

        // transport of X along tangent vector tv
        this.dTransport = (tv, X) =>{
            let u =  tv.pos.x;
            let v =  tv.pos.y;
            let uP = tv.vel.x;
            let vP = tv.vel.y;

            let fu = this.fu(u,v);
            let fv = this.fv(u,v);
            let fuv = this.fuv(u,v);
            let fuu = this.fuu(u,v);
            let fvv = this.fvv(u,v);

            let Xu = X.x;
            let Xv = X.y;

            let denom = 1+ fu*fu + fv*fv;

            let Guuu = (fu*(fuu-fu*fv*fuv+fv*fv*fvv))/denom;
            let Gvvv = (fv*(fvv-fu*fv*fuv+fu*fu*fuu))/denom;
            let Guvu = (fu*fuv)/denom;
            let Guvv = (fv*fuv)/denom;
            let Guuv = (fuu*fv)/denom;
            let Gvvu = (fvv*fu)/denom;

            let XuP = -uP*(Guuu*Xu + Guvu*Xv) - vP*(Guvu*Xu + Gvvu*Xv);
            let XvP = -uP*(Guuv*Xu + Guvv*Xv) - vP*(Guvv*Xu + Gvvv*Xv);

            return new Vector2(XuP,XvP);
        }

        this.bdyCurve = new Curve(t=> new Vector2(this.domain[0][0]+t*(this.domain[0][1]-this.domain[0][0]),this.domain[1][0]));
        this.bdyTransport = this.getParallelTransport(this.bdyCurve);

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
        for(let i=0; i<300; i++){
            temp = this.geodesicFlow.step(temp);
            if(this.stop(temp.pos)){break;}

            x = temp.pos.x;
            y = temp.pos.y;
            z = this.f(x,y);
            pts.push([x,y,z]);

        }
        return pts;
    }

    getParallelTransport(curve){
        //returns an interpolating function along the curve
        //interpolating function takes in a time (along curve) and outputs two vectors
        //the parallel transport of (1,0) and (0,1) along the curve

        let integrator = new TransportIntegrator(curve, this.dTransport);

        let X = new Vector2(1,0);
        let Y = new Vector2(0,1);

        let Xpts = [X];
        let Ypts = [Y];
        let tpts = [0];

        let currentX = X;
        let currentY = Y;
        for(let i=0; i<100; i++){
            let t = i/100;

            currentX = integrator.step(t,currentX);
            currentY = integrator.step(t,currentY);

            tpts.push(t);
            Xpts.push(currentX);
            Ypts.push(currentY);

        }

        //now build the interpolating functions:
        let interpolateX = createInterpolator2(tpts,Xpts);
        let interpolateY = createInterpolator2(tpts,Ypts);

        let parallelTransport = (t,V) => {
            let X =  interpolateX(t);
            let Y =  interpolateY(t);
            let a = V.x;
            let b = V.y;
            return X.multiplyScalar(a).add(Y.multiplyScalar(b));
           }

        //return the interpolating function:
        return parallelTransport;
    }

    boundaryTransport(t,V){
        return new TangentVector(this.bdyCurve.getPoint(t), this.bdyTransport(t,V));
    }

}
