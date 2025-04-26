import {
    MeshPhysicalMaterial,
    Vector2,
    DoubleSide,
} from "three";

import Vignette from "../../items/Vignette.js";
import Surface from "../../items/compute/Surface.js";
import Geodesic from "../../items/components/Geodesic.js";
import TangentVector from "../../items/integrators/TangentVector.js";
import WoodBlock from "../../items/components/WoodBlock.js";
import GeodesicSpray from "../../items/components/GeodesicSpray.js";
import GeodesicStripes from "../../items/components/GeodesicStripes.js";



class Test extends Vignette {

    constructor() {
        super();


        this.eqn = `a*exp(-x^2-y^2)+sin(b*x)*sin(b*y)/4.`;

        this.params = {
            a:1,
            b:0,
        };

        //build the surface we will work with
        let dom = [[-2,2],[-3,3]];

        let surf = new Surface(this.eqn, dom, this.params);
        this.surf = surf;

        //make the block
        let woodMat = new MeshPhysicalMaterial({color:0x2733e3, clearcoat:1,side:DoubleSide});
        this.block = new WoodBlock(surf,woodMat);

        //make the geodesic
        let tv = new TangentVector(new Vector2(1,-1),new Vector2(-0.2,1));

      //  this.geo = new Geodesic(surf,tv);

        let chromeMaterial = new MeshPhysicalMaterial({
            color:0x858282,
            metalness:1,
            roughness:0.,
        });
        this.spray = new GeodesicSpray(surf,undefined,undefined,chromeMaterial);

        this.stripes = new GeodesicStripes(surf);

        this.animateParams = {
            animateSpray:true,
            animateStripes:true,
            animateSurface:true,
            posxSpray:0,
            posySpray:0,
            angSpray:0,
            spreadSpray:1,

            needsUpdate:false,
        }

    }

    addToScene(scene){
        scene.add(this.block);
       // scene.add(this.geo);
        scene.add(this.spray);
        scene.add(this.stripes);
    }

    addToUI(ui){

        ui.add(this,'eqn').onFinishChange(value=> {
            this.surf.rebuild(value);
            this.block.update();
            this.animateParams.needsUpdate=true;
        });

        ui.add(this.params,'a',0,2,0.01).onChange(value=> {
            this.animateParams.needsUpdate=true;
        });
        ui.add(this.params,'b',0,3,0.01).onChange(value=> {
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
            this.animateParams.needsUpdate=false;
        }
    }

}


export default Test;
