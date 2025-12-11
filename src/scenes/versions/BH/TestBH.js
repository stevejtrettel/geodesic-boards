
import {
    MeshPhysicalMaterial,
    Vector2,
    DoubleSide,
    Vector3, CatmullRomCurve3, TubeGeometry, Mesh, Group,
} from "three";

import Vignette from "/src/code/Vignette.js";
import BHGeometry from "/src/code/diffgeo/BHGeometry.js";
import TangentVector from "/src/code/diffgeo/TangentVector.js";
import Geodesic from "/src/code/geodesics/Geodesic.js";
import ParametricSurface from "/src/code/meshes/ParametricSurface.js";
import GeodesicSpray from "/src/code/geodesics/GeodesicSpray.js";
import {downloadTextFile} from "../../../code/utils/downloadTextFile.js";


export default class TestBH extends Vignette {

    constructor() {
        super();

        const R = 0.25;

        this.bh = new BHGeometry(R);

        let geoMat = new MeshPhysicalMaterial({color:0xffcb30,clearcoat:1,});
        //make the geodesic
        // let tv = new TangentVector(new Vector2(3.,0),new Vector2(-0.5,0.05));
        // this.geo = new Geodesic(this.bh,tv,0.05,geoMat);

        const bhMat = new MeshPhysicalMaterial({
            color:0x000000,
            clearcoat:1,
            side:DoubleSide,
        })
        let surfDomain = [this.bh.domain,[0,6.29]];
        this.surf = new ParametricSurface(this.bh.parameterization, surfDomain,bhMat);


        this.spray = new GeodesicSpray(this.bh,undefined,undefined,geoMat);


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

        this.download = ()=>{
            let string = ``;
            string += this.bh.printToString();
            string += this.spray.printToSring();

            downloadTextFile('bh.txt',string);
        }

    }

    addToScene(scene){
        // scene.add(this.geo);
        scene.add(this.surf);
        scene.add(this.spray);
    }

    addToUI(ui){

        let spray = ui.addFolder('Spray');
        spray.close();
        spray.add(this.animateParams,'animateSpray');
        spray.add(this.animateParams,'posxSpray',0.5,5,0.001).name('Radius').onChange(value=>{
            this.spray.update({pos:new Vector2(this.animateParams.posxSpray,this.animateParams.posySpray)});
        });
        spray.add(this.animateParams,'angSpray',0,6.28,0.001).name('Angle').onChange(value=>{
            this.spray.update({angle:value});
        });
        spray.add(this.animateParams,'spreadSpray',0.01,1,0.001).name('Spread').onChange(value=>{
            this.spray.update({spread:value});
        });

        ui.add(this,'download');

    }


    tick(time,dTime){
        // let ang = new Vector2(-1,0.2*Math.sin(time));
        // let tv = new TangentVector(new Vector2(3.,0),ang);
        // this.geo.update(tv);

        if(this.animateParams.animateSpray) {
            this.spray.update({angle: 2+time, pos: new Vector2(2.5+0.5*Math.cos(time),  time)});
        }

    }

}

