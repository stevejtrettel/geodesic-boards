import {
    BoxGeometry,
    MeshNormalMaterial,
    Mesh, MeshPhysicalMaterial,
    Vector3,
    Vector2,
} from "three";

import NumericalCurve from "../../items/meshes/NumericalCurve.js";
import NumericalTubeGeometry from "../../items/geometries/NumericalTubeGeometry.js";
import Vignette from "../../items/Vignette.js";
import ParametricCurve from "../../items/meshes/ParametricCurve.js";
import Surface from "../../items/compute/Surface.js";
import Geodesic from "../../items/trajectories/Geodesic.js";
import {TangentVector} from "../../items/integrators/TangentVector.js";
import ParametricSurface from "../../items/meshes/ParametricSurface.js";


const testParams = {
    first: 0,
}

class Test extends Vignette {

    constructor() {
        super();
        const geometry = new BoxGeometry();
        const material = new MeshPhysicalMaterial({color:0x444444, metalness:0.1,roughness:0.1});
        this.cube = new Mesh(geometry,material);
        this.cube.castShadow=true;


        let pts = [];
        for(let i=0;i<100;i++){
            let t = 4*Math.PI/100*i;
            pts.push([t,Math.sin(t),0]);
        }


        let eqn = function(t){
            return new Vector3(6.28*t,Math.sin(6.28*t),0);
        }

        this.curve = new ParametricCurve(eqn,[0,1]);

        this.curve.castShadow=true;




        let f = function(x,y){ return x*y;}

        let surf = new Surface(f,[[-1,1],[-1,1]]);

        let tv = new TangentVector(new Vector2(0,0),new Vector2(1,1));
        this.geo = new Geodesic(tv,surf);

        let paramFn = function(x,y){return new Vector3(x,y,f(x,y))};
        this.surface = new ParametricSurface(paramFn,[[0,3],[0,3]]);

    }

    addToScene(scene){
     //   scene.add(this.cube);
        scene.add(this.curve);
        scene.add(this.geo);
        scene.add(this.surface);
    }

    // addToUI(ui){
    //     ui.add(testParams, 'first',0,1,0.01);
    // }
    //
    // tick(time,dTime){
    //     // this.cube.rotation.x += 0.01;
    //     // this.cube.rotation.y += 0.01;
    // }


}


export default Test;
