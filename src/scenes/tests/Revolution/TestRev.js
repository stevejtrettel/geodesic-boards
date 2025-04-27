import {
    MeshPhysicalMaterial,
    Vector2,
    DoubleSide,
} from "three";

import Vignette from "/src/code/Vignette.js";
import TangentVector from "/src/code/diffgeo/TangentVector.js";
import Geodesic from "../../../code/geodesics/Geodesic.js";
import GeodesicSpray from "/src/code/geodesics/GeodesicSpray.js";
import GeodesicStripes from "/src/code/geodesics/GeodesicStripes.js";
import ParametricSurface from "/src/code/meshes/ParametricSurface.js";
import RevolutionGeometry from "../../../code/diffgeo/RevolutionGeometry.js";


export default class TestRev extends Vignette {

    constructor() {
        super();

        this.rEqn = `2+b*sin(u)`;
        this.hEqn = 'a*u+sin(u)'

        this.params = {
            a:1,
            b:1,
        };

        //build the surface we will work with
        let dom = [-6.28,6,28];

        let surf = new RevolutionGeometry([this.rEqn,this.hEqn], dom, this.params);
        this.surf = surf;

        const blockMat = new MeshPhysicalMaterial({ color: 0x317ef7, metalness: 0, roughness: 0.3,side:DoubleSide });
        this.block = new ParametricSurface(this.surf.parameterization, this.surf.domain,blockMat);

        //make the geodesic
        // let tv = new TangentVector(new Vector2(1,-1),new Vector2(-0.2,1));
        // this.geo = new Geodesic(surf,tv);

        let yellowMat = new MeshPhysicalMaterial({color:0xffea2b, clearcoat:1,});

        this.spray = new GeodesicSpray(surf,undefined,undefined,yellowMat);
         this.stripes = new GeodesicStripes(surf);

        this.animateParams = {
            animateSpray:true,
            animateStripes:true,
            animateSurface:true,

            posxSpray:0,
            posySpray:0,
            angSpray:0,
            spreadSpray:1,

            posStripes:0.5,
            angStripes:0,
            spreadStripes:0.2,

            needsUpdate:false,
        }

    }

    addToScene(scene){
        scene.add(this.block);
       //  scene.add(this.geo);
        scene.add(this.spray);
        scene.add(this.stripes);
    }

    addToUI(ui){

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

        // let v = new Vector2(Math.cos(time),Math.sin(time));
        // let tv = new TangentVector(new Vector2(1,-1),v);
        // this.geo.update(tv);

        if(this.animateParams.animateSpray) {
            this.spray.update({angle: 2+time, pos: new Vector2(Math.cos(time), Math.sin(2 * time))});
        }
        if(this.animateParams.animateStripes) {
            this.stripes.update({spread: 0.2 * (2 + Math.sin(time)), pos: 0.5 + 0.2 * Math.sin(time)});
        }

        if(this.animateParams.needsUpdate){
            this.stripes.redraw();
            this.spray.redraw();
            this.block.redraw();
            this.animateParams.needsUpdate=false;
        }
    }

}




