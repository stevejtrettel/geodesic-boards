import {
    BoxGeometry,
    MeshNormalMaterial,
    Mesh, MeshPhysicalMaterial,
    Vector3,
    Vector2,
} from "three";

import Vignette from "../../items/Vignette.js";
import Surface from "../../items/compute/Surface.js";
import Geodesic from "../../items/components/Geodesic.js";
import TangentVector from "../../items/integrators/TangentVector.js";
import WoodBlock from "../../items/components/WoodBlock.js";

const testParams = {
    first: 0,
}

class Test extends Vignette {

    constructor() {
        super();

        this.params = {
            a:1,
            b:1,
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

        //make the block
        this.block = new WoodBlock(surf);

        //make the geodesic
        let tv = new TangentVector(new Vector2(1,-1),new Vector2(-0.2,1));

        this.geo = new Geodesic(tv,surf);

    }

    addToScene(scene){
        scene.add(this.block);
        scene.add(this.geo);
    }

    addToUI(ui){

        let geo = this.geo;
        let block = this.block;

        ui.add(this.params,'a',0,2,0.01).onChange(value=> {
            this.geo.update();
            this.block.update();
        });
    }


    tick(time,dTime){
        let v = new Vector2(Math.cos(time),Math.sin(time));
        let tv = new TangentVector(new Vector2(1,-1),v);
        this.geo.update(tv);
    }

}


export default Test;
