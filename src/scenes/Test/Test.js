import {
    BoxGeometry,
    MeshNormalMaterial,
    Mesh, MeshPhysicalMaterial,
    Vector3,
    Vector2, Group, DoubleSide,
} from "three";

import Vignette from "../../items/Vignette.js";
import Surface from "../../items/compute/Surface.js";
import Geodesic from "../../items/components/Geodesic.js";
import TangentVector from "../../items/integrators/TangentVector.js";
import WoodBlock from "../../items/components/WoodBlock.js";
import GeodesicSpray from "../../items/components/GeodesicSpray.js";
import GeodesicStripes from "../../items/components/GeodesicStripes.js";
import {compileMath} from "../../items/utils/compileMath.js";



class Test extends Vignette {

    constructor() {
        super();


        this.params = {
            a:1,
            b:1,
            theta:0,
        };

        //build the surface we will work with
        let eqn = `a*exp(-x^2-y^2)`;
        let dom = [[-2,2],[-3,3]];


        let surf = new Surface(eqn,dom,this.params);
        this.surf = surf;

        //make the block
        let woodMat = new MeshPhysicalMaterial({color:0x2733e3, clearcoat:1,side:DoubleSide});
        this.block = new WoodBlock(surf,woodMat);

        //make the geodesic
        let tv = new TangentVector(new Vector2(1,-1),new Vector2(-0.2,1));

        this.geo = new Geodesic(surf,tv);

        this.spray = new GeodesicSpray(surf);

        this.stripes = new GeodesicStripes(surf);


    }

    addToScene(scene){
        scene.add(this.block);
        scene.add(this.geo);
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
