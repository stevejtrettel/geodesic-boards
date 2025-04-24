

export default class TransportIntegrator{
    constructor(curve, dTransport, eps=0.001) {
        this.h = eps;
        this.curve = curve;
        this.dTransport = dTransport;
    }

    step(t,vec){
        //take one step at time t along curve, transporting X
        let k1,k2,k3,k4;
        let tv1, tv2, tv3, tv4;
        let temp;

        //get the derivative
        tv1 =  this.curve.getTV(t);
        k1 = this.dTransport(tv1,vec);
        k1.multiplyScalar(this.h);

        //get k2
        tv2 = this.curve.getTV(t+0.5*this.h);
        temp=vec.clone().add(k1.clone().multiplyScalar(0.5));
        k2=this.dTransport(tv2, temp);
        k2.multiplyScalar(this.h);

        //get k3
        tv3 = this.curve.getTV(t+0.5*this.h);
        temp=vec.clone().add(k2.clone().multiplyScalar(0.5));
        k3=this.dTransport(tv3,temp);
        k3.multiplyScalar(this.h);

        //get k4
        tv4 =  this.curve.getTV(t+this.h);
        temp=vec.clone().add(k3.multiplyScalar(1.));
        k4=this.dTransport(tv4,temp);
        k4.multiplyScalar(this.h);

        //add up results:
        let update = k1;//scale factor 1
        update.add(k2.multiplyScalar(2));
        update.add(k3.multiplyScalar(2));
        update.add(k4);//scale factor 1
        update.multiplyScalar(1/6);

        //move ahead one step
        return vec.clone().add(update);
    }
}

