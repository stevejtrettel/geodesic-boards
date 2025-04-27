import {
    MeshPhysicalMaterial,
} from "three";

import Vignette from "/src/code/Vignette.js";
import GeodesicStripes from "/src/code/geodesics/GeodesicStripes.js";
import GraphGeometry from "/src/code/diffgeo/GraphGeometry.js";
import GPUGraphSurface from "../../../code/meshes/GPUGraphSurface.js";


const stripeParams = {
    animate:false,
    pos: 0.5,
    angle: -0.2,
    spread:0.69,
    radius:0.02,
};



export default class Board extends Vignette {

    constructor() {
        super();

        this.eqn = `a*(sin(b*pi*x/3) + sin(b*pi*y/3))`;

        this.params = {
            a:0.375,
            b:2.5,
        };

        //build the surface we will work with
        let dom = [[-3,3],[-6,6]];

        let surf = new GraphGeometry(this.eqn, dom, this.params);
        this.surf = surf;

        this.block = new GPUGraphSurface(this.surf);

        let geodesicMaterial = new MeshPhysicalMaterial({
            color:0x635149,
            metalness:1,
            roughness:0.,
        });

        this.stripeParams = {
            pos:stripeParams.pos,
            angle:stripeParams.angle,
            animate:stripeParams.animate,
            spread:stripeParams.spread,
            radius: stripeParams.radius,
        };

        this.stripes = new GeodesicStripes(surf,16,this.stripeParams,geodesicMaterial);

        this.needsUpdate = false;
    }

    addToScene(scene){
        scene.add(this.block);
        scene.add(this.stripes);
    }

    addToUI(ui){

        ui.add(this.params,'a',0,2,0.01).onChange(value=> {
            this.needsUpdate=true;
        });
        ui.add(this.params,'b',0,3,0.01).onChange(value=> {
            this.needsUpdate=true;
        });


        let stripes = ui.addFolder('Stripes');
        stripes.close();
        stripes.add(this.stripeParams,'animate').onChange(value=>{if(!value){
            this.stripes.update(stripeParams)
        }});
        stripes.add(this.stripeParams,'pos',0,1,0.001).onChange(value=>{
            this.stripes.update({pos:value});
        });
        stripes.add(this.stripeParams,'angle',-2,2,0.01).onChange(value=>{
            this.stripes.update({angle:value});
        });
        stripes.add(this.stripeParams,'spread',0.05,1,0.01).onChange(value=>{
            this.stripes.update({spread:value});
        });

    }


    tick(time,dTime){

        if(this.stripeParams.animate) {
            this.stripes.update({spread: 0.2 * (2 + Math.sin(time)), pos: 0.5 + 0.2 * Math.sin(time)});
        }
        else if(this.needsUpdate){
            this.stripes.redraw();
            this.needsUpdate=false;
        }
    }


}




