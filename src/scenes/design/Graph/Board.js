import {MeshPhysicalMaterial} from "three";



import Vignette from "/src/code/Vignette.js";
import GeodesicStripes from "/src/code/geodesics/GeodesicStripes.js";
import GraphGeometry from "/src/code/diffgeo/GraphGeometry.js";
import GPUGraphSurface from "../../../code/meshes/GPUGraphSurface.js";
import fragmentShader from "../../../code/shaders/designShader.glsl"
import {downloadTextFile} from "../../../code/utils/downloadTextFile.js";



export default class Board extends Vignette {

    constructor() {
        super();

        this.eqn = `a*exp(-x^2-y^2)+sin(b*x)*sin(b*y)/4.`;

        this.params = {
            a:1,
            b: 1.5,
        };

        //build the surface we will work with
        let dom = [[-2.125,2.125],[-3.125,3.125]];

        let surf = new GraphGeometry(this.eqn, dom, this.params);
        this.surf = surf;

        this.block = new GPUGraphSurface(this.surf, {fragmentShader:fragmentShader});

        const stripeMat = new MeshPhysicalMaterial({
            color:0x000000,
            clearcoat:1,
            metalness:0,
            roughness:0,
        });
         this.stripes = new GeodesicStripes(surf,undefined,undefined,stripeMat);

        this.animateParams = {

            posStripes:0.5,
            angStripes:0,
            spreadStripes:0.2,

            needsUpdate:false,
        }


        this.download = ()=>{
            let string = ``;
            string += this.surf.printToString();
            string += this.stripes.printToSring();

            downloadTextFile('graph.txt',string);
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
        stripes.add(this.animateParams,'posStripes',0,1,0.01).name('position').onChange(value=>{
            this.stripes.update({pos:value});
        });
        stripes.add(this.animateParams,'angStripes',-2,2,0.01).name('angle').onChange(value=>{
            this.stripes.update({angle:value});
        });
        stripes.add(this.animateParams,'spreadStripes',0.05,2,0.01).name('spread').onChange(value=>{
            this.stripes.update({spread:value});
        });


        ui.add(this,'download');

    }


    tick(time,dTime){

        if(this.animateParams.needsUpdate){
            this.stripes.redraw();
            this.animateParams.needsUpdate=false;
        }
    }

}




