
import {
    MeshPhysicalMaterial,
    Vector2,
    DoubleSide,
    Vector3, CatmullRomCurve3, TubeGeometry, Mesh, Group,
} from "three";

import Vignette from "../../code/Vignette.js";
import BhOld from "../../code/diffgeo/BHGeometry.js";
import TangentVector from "../../code/diffgeo/TangentVector.js";
import Geodesic from "../../code/geodesics/Geodesic.js";
import ParametricSurface from "../../code/meshes/ParametricSurface.js";
import GeodesicSpray from "../../code/geodesics/GeodesicSpray.js";



class Test extends Vignette {

    constructor() {
        super();

        const R = 0.25;


        this.bhGroup = new Group();

        this.bh = new BhOld(R);

        //make the geodesic
        let geoMat = new MeshPhysicalMaterial({color:0xffcb30,clearcoat:1,});
        let tv = new TangentVector(new Vector2(3.,0),new Vector2(-0.5,0.05));
        this.geo = new Geodesic(this.bh,tv,0.05,geoMat);
        this.bhGroup.add(this.geo);

        let surfDomain = [this.bh.domain,[0,6.29]];
        this.surf = new ParametricSurface(this.bh.parameterization, surfDomain);
        this.bhGroup.add(this.surf);

        this.spray = new GeodesicSpray(this.bh,undefined,undefined,geoMat);
        this.bhGroup.add(this.spray);


        //reorient
        // this.bhGroup.rotateX(-Math.PI/2);
        // this.bhGroup.position.set(0,-4,0);

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

        scene.add(this.bhGroup);
        // scene.add(this.geo);
        // scene.add(this.surf);
        // scene.add(this.spray);
    }

    addToUI(ui){

        let spray = ui.addFolder('Spray');
        spray.close();
        spray.add(this.animateParams,'animateSpray');
        spray.add(this.animateParams,'posxSpray',0.5,5,0.01).name('Radius').onChange(value=>{
            this.spray.update({pos:new Vector2(this.animateParams.posxSpray,this.animateParams.posySpray)});
        });
        spray.add(this.animateParams,'angSpray',0,6.29,0.01).name('Angle').onChange(value=>{
            this.spray.update({angle:value});
        });
        spray.add(this.animateParams,'spreadSpray',0.01,1,0.01).name('Spread').onChange(value=>{
            this.spray.update({spread:value});
        });

    }


    tick(time,dTime){
        let ang = new Vector2(-1,0.2*Math.sin(time));
        let tv = new TangentVector(new Vector2(3.,0),ang);
        this.geo.update(tv);

        if(this.animateParams.animateSpray) {
            this.spray.update({angle: 2+time, pos: new Vector2(2.5+0.5*Math.cos(time),  time)});
        }

    }

}


export default Test;
