import {
    MeshPhysicalMaterial,
} from "three";

import Vignette from "/src/code/Vignette.js";
import GeodesicStripes from "/src/code/geodesics/GeodesicStripes.js";
import GPUGraphSurface from "../../../code/meshes/GPUGraphSurface.js";
import GraphGeometry from "/src/code/diffgeo/GraphGeometry.js";

import fragmentShader from "../../../code/shaders/designShader.glsl"
import {downloadTextFile} from "../../../code/utils/downloadTextFile.js";


const stripeParams = {
    pos: 0.5,
    angle: 0,
    spread:1,
    radius:0.02,
};


export default class Board extends Vignette {

    constructor() {
        super();

        this.eqn = `a*exp(-b*( (x-x0)*(x-x0) + (y-y0)*(y-y0)))-a/2.`;

        this.params = {
            a:-1.4,
            b:0.5,
            c:0,
            x0:0,
            y0:0,
        };

        //build the surface we will work with
        let dom = [[-3.125,3.125],[-6.125,6.125]];

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

        this.stripes = new GeodesicStripes(surf,30,this.stripeParams,geodesicMaterial);

        this.needsUpdate = false;

        this.download = ()=>{
            let string = ``;
            string += this.surf.printToString();
            string += this.stripes.printToSring();

            downloadTextFile('BumpDown.txt',string);
        }
    }

    addToScene(scene){
        scene.add(this.block);
        scene.add(this.stripes);
    }

    addToUI(ui){

        // let surface = ui.addFolder('Surface');
        // surface.close();
        //
        // surface.add(this.params,'a',-2.5,0,0.01).name('Height').onChange(value=> {
        //     this.needsUpdate=true;
        // });
        // surface.add(this.params,'b',0.,2,0.01).name( 'Width').onChange(value=> {
        //     this.needsUpdate=true;
        // });
        //
        //
        // let stripes = ui.addFolder('Stripes');
        // stripes.close();
        // stripes.add(this.stripeParams,'pos',0,1,0.01).onChange(value=>{
        //     this.stripes.update({pos:value});
        // });
        // stripes.add(this.stripeParams,'angle',-2,2,0.01).onChange(value=>{
        //     this.stripes.update({angle:value});
        // });
        // stripes.add(this.stripeParams,'spread',0.05,1,0.01).onChange(value=>{
        //     this.stripes.update({spread:value});
        // });
        //
        //
        // ui.add(this,'download');

    }


    tick(time,dTime){
        if(this.needsUpdate){
            // // really should recompute transport
            // this.stripes.recomputeTransport();
            // this.stripes.update();
            this.stripes.redraw();
            this.needsUpdate=false;
        }
    }

}




