import {
    BoxGeometry,
    MeshNormalMaterial,
    Mesh, MeshPhysicalMaterial,
    Vector3,
    Vector2, Group,
} from "three";

import Vignette from "../../items/Vignette.js";
import Surface from "../../items/compute/Surface.js";
import Geodesic from "../../items/components/Geodesic.js";
import TangentVector from "../../items/integrators/TangentVector.js";
import WoodBlock from "../../items/components/WoodBlock.js";
import Curve from "../../items/compute/Curve.js";
import GeodesicSpray from "../../items/components/GeodesicSpray.js";
import GeodesicStripes from "../../items/components/GeodesicStripes.js";

const testParams = {
    first: 0,
}

class Test extends Vignette {

    constructor() {
        super();

        this.params = {
            a:1,
            b:1,
            theta:0,
        };

        //build the surface we will work with
        let f = (x,y) => this.params.a*Math.exp(-x*x-y*y);
        let dom = [[-2,2],[-2,2]];

        let derivatives = {
            fu: (u,v)=> Math.cos(u)*Math.sin(v),
            fv: (u,v)=> Math.sin(u)*Math.cos(v),
            fuu: (u,v)=> -Math.sin(u)*Math.sin(v),
            fvv: (u,v)=> -Math.sin(u)*Math.sin(v),
            fuv: (u,v)=>  Math.cos(u)*Math.cos(v),
        }

        let surf = new Surface(f,dom);
        this.surf = surf;

        //make the block
        let woodMat = new MeshPhysicalMaterial({color:0x2733e3, clearcoat:1,});
        this.block = new WoodBlock(surf,woodMat);

        //make the geodesic
        let tv = new TangentVector(new Vector2(1,-1),new Vector2(-0.2,1));

        this.geo = new Geodesic(surf,tv);

        this.spray = new GeodesicSpray(surf);

        this.stripes = new GeodesicStripes(surf);



        //make an array of geodesics, with different starting conditions!
        // this.geodesics = []
        // for(let i=1; i<10; i++){
        //     let t=i/10;
        //     let V = new Vector2(0.3,1).normalize();
        //     let tv = surf.boundaryTransport(t,V);
        //     let geodesic = new Geodesic(surf,tv);
        //     this.geodesics.push(geodesic);
        // }

    }

    addToScene(scene){
        scene.add(this.block);
        scene.add(this.geo);
        // for(let i=1; i<10;i++){
        //     scene.add(this.geodesics[i-1]);
        // }
        scene.add(this.spray);
        scene.add(this.stripes);
    }

    addToUI(ui){

        let geo = this.geo;
        let block = this.block;

        ui.add(this.params,'a',0,2,0.01).onChange(value=> {
            this.geo.update();
            this.block.update();
        });
        ui.add(this.params,'theta',0,6.28,0.01).onChange(value=>{
            for(let i=1; i<10; i++){
                let t=i/10;
                let V = new Vector2(Math.cos(value),Math.sin(value));
                let tv = this.surf.boundaryTransport(t,V);
                this.geodesics[i-1].update(tv);
            }
        });
    }


    tick(time,dTime){
        let v = new Vector2(Math.cos(time),Math.sin(time));
        let tv = new TangentVector(new Vector2(1,-1),v);
        this.geo.update(tv);
        this.spray.update({angle:time,pos:new Vector2(Math.cos(time),Math.sin(2*time))});
        this.stripes.update({spread:0.2*(2+Math.sin(time)), pos:0.5+0.2*Math.sin(time)})
    }

}


export default Test;
