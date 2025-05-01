import {MeshPhysicalMaterial} from "three";



import Vignette from "/src/code/Vignette.js";
import GeodesicStripes from "/src/code/geodesics/GeodesicStripes.js";
import GraphGeometry from "/src/code/diffgeo/GraphGeometry.js";
import GPUGraphSurface from "../../../code/meshes/GPUGraphSurface.js";
import levelSetShader from "../../../code/shaders/levelSetShader.glsl"



export default class Board extends Vignette {

    constructor() {
        super();

        this.eqn = `a*exp(-x^2-y^2)+sin(b*x)*sin(b*y)/4.`;

        this.params = {
            a:1,
            b:0.5,
        };

        //build the surface we will work with
        let dom = [[-2,2],[-3,3]];

        let surf = new GraphGeometry(this.eqn, dom, this.params);
        this.surf = surf;

        this.block = new GPUGraphSurface(this.surf, {fragmentShader:levelSetShader});

        const stripeMat = new MeshPhysicalMaterial({
            color:0x000000,
            clearcoat:1,
            metalness:0,
            roughness:0,
        });
         this.stripes = new GeodesicStripes(surf,undefined,undefined,stripeMat);

        this.animateParams = {
            animateStripes:true,

            posStripes:0.5,
            angStripes:0,
            spreadStripes:0.2,

            needsUpdate:false,
        }

    }

    addToScene(scene){
        scene.add(this.block);
        scene.add(this.stripes);
    }

    addToUI(ui){

        ui.add(this,'eqn').onFinishChange(value=> {
            this.eqn=value;
            this.surf.rebuild(this.eqn);
            this.block.rebuild();
            this.animateParams.needsUpdate=true;
        });

        ui.add(this.params,'a',0,2,0.01).onChange(value=> {
            this.animateParams.needsUpdate=true;
        });
        ui.add(this.params,'b',0,3,0.01).onChange(value=> {
            this.animateParams.needsUpdate=true;
        });


        let stripes = ui.addFolder('Stripes');
        stripes.close();
        stripes.add(this.animateParams,'animateStripes');
        stripes.add(this.animateParams,'posStripes',0,1,0.01).onChange(value=>{
            this.stripes.update({pos:value});
        });
        stripes.add(this.animateParams,'angStripes',-2,2,0.01).onChange(value=>{
            this.stripes.update({angle:value});
        });
        stripes.add(this.animateParams,'spreadStripes',0.05,2,0.01).onChange(value=>{
            this.stripes.update({spread:value});
        });

    }


    tick(time,dTime){

        if(this.animateParams.animateStripes) {
            this.stripes.update({spread: 0.2 * (2 + Math.sin(time)), pos: 0.5 + 0.2 * Math.sin(time)});
        }

        if(this.animateParams.needsUpdate){
            this.stripes.redraw();
            this.animateParams.needsUpdate=false;
        }
    }

}




