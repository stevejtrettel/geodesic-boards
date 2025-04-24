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



        //build the surface we will work with
        let f = (x,y)=> Math.sin(x)*Math.sin(y);
        let twopi = 2*Math.PI;
        let dom = [[-twopi, twopi],[-twopi,twopi]];

        let derivatives = {
            fu: (u,v)=> Math.cos(u)*Math.sin(v),
            fv: (u,v)=> Math.sin(u)*Math.cos(v),
            fuu: (u,v)=> -Math.sin(u)*Math.sin(v),
            fvv: (u,v)=> -Math.sin(u)*Math.sin(v),
            fuv: (u,v)=>  Math.cos(u)*Math.cos(v),
        }

        let surf = new Surface(f,dom,derivatives);

        //make the block
        this.block = new WoodBlock(surf);

        //make the geodesic
        let tv = new TangentVector(new Vector2(0,0),new Vector2(1,1));

        this.geo = new Geodesic(tv,surf);


    }

    addToScene(scene){
      //  scene.add(this.block);
        scene.add(this.geo);
    }

}


export default Test;
