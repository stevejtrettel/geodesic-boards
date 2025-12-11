import {
    MeshPhysicalMaterial,
    Vector2,
    DoubleSide,
} from "three";

import Vignette from "/src/code/Vignette.js";
import GeodesicSpray from "/src/code/geodesics/GeodesicSpray.js";
import RevolutionGeometry from "../../../code/diffgeo/RevolutionGeometry.js";
import GPURevSurface from "../../../code/meshes/GPURevSurface.js";
import fragmentShader from "../../../code/shaders/gaussCurvatureShader.glsl";

export default class Board extends Vignette {

    constructor() {
        super();

        this.rEqn = `2+a*sin(b*u)`;
        this.hEqn = 'u'

        this.params = {
            a:1,
            b:1,
        };

        //build the surface we will work with
        let dom = [-6.28,6,28];

        let surf = new RevolutionGeometry([this.rEqn,this.hEqn], dom, this.params);
        this.surf = surf;

        this.block = new GPURevSurface(this.surf, {fragmentShader:fragmentShader});

        let yellowMat = new MeshPhysicalMaterial({color:0xffea2b, clearcoat:1,});

        this.spray = new GeodesicSpray(surf,undefined,undefined,yellowMat);

        this.animateParams = {
            animateSpray:true,
            posxSpray:0,
            posySpray:0,
            angSpray:0,
            spreadSpray:1,

            needsUpdate:false,
        }

    }

    addToScene(scene){
        scene.add(this.block);
        scene.add(this.spray);
    }

    addToUI(ui){

        ui.add(this,'rEqn').name('radius(u)').onFinishChange(value=> {
            this.rEqn=value;
            this.surf.rebuild([this.rEqn,'u']);
            this.block.rebuild();
            this.animateParams.needsUpdate=true;
        });

        ui.add(this.params,'a',0,2,0.01).onChange(value=> {
            this.animateParams.needsUpdate=true;
        });
        ui.add(this.params,'b',0,2,0.01).onChange(value=> {
            this.animateParams.needsUpdate=true;
        });

        let spray = ui.addFolder('Spray');
        spray.close();
        spray.add(this.animateParams,'animateSpray');
        spray.add(this.animateParams,'posxSpray',-1.5,1.5,0.01).onChange(value=>{
            this.spray.update({pos:new Vector2(this.animateParams.posxSpray,this.animateParams.posySpray)});
        });
        spray.add(this.animateParams,'posySpray',-2,2,0.01).onChange(value=>{
            this.spray.update({pos:new Vector2(this.animateParams.posxSpray,this.animateParams.posySpray)});
        });
        spray.add(this.animateParams,'angSpray',0,6.29,0.01).onChange(value=>{
            this.spray.update({angle:value});
        });
        spray.add(this.animateParams,'spreadSpray',0.05,2,0.01).onChange(value=>{
            this.spray.update({spread:value});
        });

    }


    tick(time,dTime){

        if(this.animateParams.animateSpray) {
            this.spray.update({angle: 2+time, pos: new Vector2(Math.cos(time), Math.sin(2 * time))});
        }

        if(this.animateParams.needsUpdate){
            this.spray.redraw();
            this.animateParams.needsUpdate=false;
        }
    }

}




