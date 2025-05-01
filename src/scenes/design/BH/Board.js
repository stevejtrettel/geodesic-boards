
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



export default class Board extends Vignette {

    constructor() {
        super();

        //choose a radius where we know the bh can be made in the right size
        const R = 0.095;
            //0.22;
        this.R=R;

        this.bh = new BHGeometry(R,[3/2*R,6.08]);

        // console.log(this.bh.height(3/2*R));
        // console.log(this.bh.radius(6.02));
        // console.log(this.bh.height(6.02));


        const bhMat = new MeshPhysicalMaterial({
            color:0x000000,
            clearcoat:1,
            side:DoubleSide,
        })
        let surfDomain = [this.bh.domain,[0,6.29]];
        this.surf = new ParametricSurface(this.bh.parameterization, surfDomain,bhMat);

        this.ini = {
            mass:0.095,
            p0: 0,
            a0:0.016,
            p1:0,
            a1:-0.033,
            p2:1.96,
            a2:0.01,
        }


        let geoMat = new MeshPhysicalMaterial({color:0xffcb30,clearcoat:1,});

        this.tv0 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p0),new Vector2(-Math.cos(this.ini.a0),Math.sin(this.ini.a0)))
        this.geo0 = new Geodesic(this.bh,this.tv0,0.05,geoMat);

        this.tv1 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p1),new Vector2(-Math.cos(this.ini.a1),Math.sin(this.ini.a1)))
        this.geo1 = new Geodesic(this.bh,this.tv1,0.05,geoMat);

        this.tv2 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p2),new Vector2(-Math.cos(this.ini.a2),Math.sin(this.ini.a2)))
        this.geo2 = new Geodesic(this.bh,this.tv2,0.05,geoMat);



        this.download = ()=> {
            let string = ``;
            string += this.bh.printToString();
            string += this.geo0.printToSring();
            string += this.geo1.printToSring();
            string += this.geo2.printToSring();

            downloadTextFile('bh.txt',string);
        }
    }


    addToScene(scene){
        // scene.add(this.geo);
        scene.add(this.surf);
        scene.add(this.geo0);
        scene.add(this.geo1);
        scene.add(this.geo2);
    }

    addToUI(ui){


        ui.add(this.ini,'mass',{'small (2in)':0.095,'large (3in)':0.225}).onChange(value=>{

            //make domain so our circle is 6.125inch in radius
            let domainMax = 6.08;
            if(value>0.1){
                domainMax = 6.03;
            }
            this.bh.rebuild(value,[3/2*value,domainMax]);
            let surfDomain = [this.bh.domain,[0,6.29]];
            this.surf.redraw(this.bh.parameterization,surfDomain);

            this.tv0 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p0),new Vector2(-Math.cos(this.ini.a0),Math.sin(this.ini.a0)))
            this.geo0.update(this.tv0);
            this.tv1 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p1),new Vector2(-Math.cos(this.ini.a1),Math.sin(this.ini.a1)))
            this.geo1.update(this.tv1);
            this.tv2 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p2),new Vector2(-Math.cos(this.ini.a2),Math.sin(this.ini.a2)))
            this.geo2.update(this.tv2);

        })

        let f1 = ui.addFolder('Geodesic1 ');
        f1.add(this.ini,'p0',0,6.29,0.001).onChange(value=>{
            this.tv0.pos = new Vector2(this.bh.domain[1],value);
            this.geo0.update(this.tv0);
        });

        f1.add(this.ini,'a0',-0.25,0.25,0.001).onChange(value=>{
            this.tv0.vel = new Vector2(-Math.cos(value),Math.sin(value));
            this.geo0.update(this.tv0);
        });

        let f2 = ui.addFolder('Geodesic 2');
        f2.add(this.ini,'p1',0,6.29,0.001).onChange(value=>{
            this.tv1.pos = new Vector2(this.bh.domain[1],value);
            this.geo1.update(this.tv1);
        });

        f2.add(this.ini,'a1',-0.25,0.25,0.001).onChange(value=>{
            this.tv1.vel = new Vector2(-Math.cos(value),Math.sin(value));
            this.geo1.update(this.tv1);
        });


        let f3 = ui.addFolder('Geodesic 3');
        f3.add(this.ini,'p2',0,6.29,0.001).onChange(value=>{
            this.tv2.pos = new Vector2(this.bh.domain[1],value);
            this.geo2.update(this.tv2);
        });

        f3.add(this.ini,'a2',-0.25,0.25,0.001).onChange(value=>{
            this.tv2.vel = new Vector2(-Math.cos(value),Math.sin(value));
            this.geo2.update(this.tv2);
        });



        ui.add(this,'download');

    }


    tick(time,dTime){
        // let ang = new Vector2(-1,0.2*Math.sin(time));
        // let tv = new TangentVector(new Vector2(3.,0),ang);
        // this.geo.update(tv);

    }

}

