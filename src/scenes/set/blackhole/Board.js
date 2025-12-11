
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
import {downloadTextFile} from "../../../code/utils/downloadTextFile.js";
import wood from "../../../code/shaders/components/wood.glsl"
import FragmentMaterial from "../../../code/materials/FragmentMaterial.js";




export default class Board extends Vignette {

    constructor() {
        super();

        //choose a radius where we know the bh can be made in the right size
        const R = 0.2;
        this.R=R;

        this.bh = new BHGeometry(R,[3/2*R,8.4]);

         console.log(this.bh.height(3/2*R));
         console.log(this.bh.radius(8.4));
        console.log(this.bh.height(8.4));


        let fragmentShader = wood + `
            varying vec3  vPosition;
            void main() {
                vec3 p = vec3(vPosition.z*vPosition.x,vPosition.x,vPosition.y);
                csm_DiffuseColor = vec4(pow(matWood(p), vec3(.4545)),1);
                if(abs(vPosition.x)>6. || abs(vPosition.y)>6.){
                   // discard;
                    csm_DiffuseColor = vec4(1);
                }
            }
         `;

        const bhMat = new FragmentMaterial(fragmentShader);

        let surfDomain = [this.bh.domain,[0,6.29]];
        this.surf = new ParametricSurface(this.bh.parameterization, surfDomain,bhMat);

        this.ini = {
            p0: 2.356,
            p1:2.356,
            p2:2.356,
            p3:2.356,
            p4:2.356,
            a0:-0.07,
            a1:-0.0254,
            a2:-0.00865,
            a3:0.0164,
            a4:0.0607,
        }


        let geoMat = new MeshPhysicalMaterial({
            color:0x635149,
            metalness:1,
            roughness:0.,
        });

        this.tv0 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p0),new Vector2(-Math.cos(this.ini.a0),Math.sin(this.ini.a0)))
        this.geo0 = new Geodesic(this.bh,this.tv0,0.05,geoMat);

        this.tv1 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p1),new Vector2(-Math.cos(this.ini.a1),Math.sin(this.ini.a1)))
        this.geo1 = new Geodesic(this.bh,this.tv1,0.05,geoMat);

        this.tv2 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p2),new Vector2(-Math.cos(this.ini.a2),Math.sin(this.ini.a2)))
        this.geo2 = new Geodesic(this.bh,this.tv2,0.05,geoMat);

        this.tv3 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p3),new Vector2(-Math.cos(this.ini.a3),Math.sin(this.ini.a3)))
        this.geo3 = new Geodesic(this.bh,this.tv3,0.05,geoMat);

        this.tv4 = new TangentVector(new Vector2(this.bh.domain[1],this.ini.p4),new Vector2(-Math.cos(this.ini.a4),Math.sin(this.ini.a4)))
        this.geo4 = new Geodesic(this.bh,this.tv4,0.05,geoMat);



        this.download = ()=> {
            let string = ``;
            string += this.bh.printToString();
            string += '\n\n'
            string += this.geo0.printToSring();
            string += this.geo1.printToSring();
            string += this.geo2.printToSring();
            string += this.geo3.printToSring();
            string += this.geo4.printToSring();

            downloadTextFile('bh.txt',string);
        }
    }


    addToScene(scene){
        // scene.add(this.geo);
        scene.add(this.surf);
        scene.add(this.geo0);
        scene.add(this.geo1);
        scene.add(this.geo2);
        scene.add(this.geo3);
        scene.add(this.geo4);
    }

    addToUI(ui){


        let ang = ui.addFolder('Angles ');
        ang.close();

        ang.add(this.ini,'a0',-0.1,0.1,0.001).onChange(value=>{
            this.tv0.vel = new Vector2(-Math.cos(value),Math.sin(value));
            this.geo0.update(this.tv0);
        });

        ang.add(this.ini,'a1',-0.1,0.1,0.0001).onChange(value=>{
            this.tv1.vel = new Vector2(-Math.cos(value),Math.sin(value));
            this.geo1.update(this.tv1);
        });

        ang.add(this.ini,'a2',-0.1,0.1,0.0001).onChange(value=>{
            this.tv2.vel = new Vector2(-Math.cos(value),Math.sin(value));
            this.geo2.update(this.tv2);
        });

        ang.add(this.ini,'a3',-0.1,0.1,0.0001).onChange(value=>{
            this.tv3.vel = new Vector2(-Math.cos(value),Math.sin(value));
            this.geo3.update(this.tv3);
        });

        ang.add(this.ini,'a4',-0.1,0.1,0.0001).onChange(value=>{
            this.tv4.vel = new Vector2(-Math.cos(value),Math.sin(value));
            this.geo4.update(this.tv4);
        });


        ui.add(this,'download');

    }


    tick(time,dTime){}

}

