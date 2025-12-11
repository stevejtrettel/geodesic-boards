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
    animate:false,
    pos: 0.5,
    angle: 0,
    spread:1,
    radius:0.02,
};

let geodesicMaterial = new MeshPhysicalMaterial({
    color:0x635149,
    metalness:1,
    roughness:0.,
});


export default class Board extends Vignette {

    constructor() {
        super();

        this.eqn = `a*exp(-b*( (x-U)*(x-U) + (y-V)*(y-V)))-a/2`;

        this.params = {
            a:-1.4,
            b:0.5,
            c:0,
            U:0,
            V:0,
        };

        //build the surface we will work with
        let dom = [[-3.125,3.125],[-6.125,6.125]];

        let surf = new GraphGeometry(this.eqn, dom, this.params);
        this.surf = surf;

        this.block = new GPUGraphSurface(this.surf);
        //this.block = new GPUGraphSurface(this.surf, {fragmentShader:fragmentShader});


        this.stripeParams = {
            pos:stripeParams.pos,
            angle:stripeParams.angle,
            animate:stripeParams.animate,
            spread:stripeParams.spread,
            radius: stripeParams.radius,
        };

        this.stripes = new GeodesicStripes(this.surf,9,this.stripeParams,geodesicMaterial);

        this.needsUpdate = false;

        this.download = ()=>{
            let string = ``;
            string += this.surf.printToString();
            string += this.stripes.printToSring();

            downloadTextFile('BumpUp.txt',string);
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
        // surface.add(this.params,'a',0,2.5,0.01).name('Height').onChange(value=> {
        //     this.needsUpdate=true;
        // });
        // surface.add(this.params,'b',0.,2,0.01).name('Width').onChange(value=> {
        //     this.needsUpdate=true;
        // });
        // surface.add(this.params,'c',0.,2,0.01).name('Spread').onChange(value=> {
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


    setStripeCount(newN, scene) {
        // 1. Remove old stripes from scene
        scene.remove(this.stripes);

        // 2. Dispose of the old stripes
            this.stripes.dispose(); // your existing method
            while (this.stripes.children.length > 0) {
                this.stripes.remove(this.stripes.children[0]);
            }


        // 3. Make new stripes
        let geodesicMaterial = this.stripes.material; // re-use the existing material
        this.stripes = new GeodesicStripes(this.surf, newN, this.stripeParams, geodesicMaterial);

        // 4. Add to scene
        scene.add(this.stripes);
    }




    resetBoard(i,scene){
        if(i==1){

            let nGeodesics = 8;
            this.eqn = `a*exp(-b*( (x-U)*(x-U) + (y-V)*(y-V)))-a/2`;

            this.params.a =-1.4;
            this.params.b = 0.5;
            this.params.c = 0.;
            this.params.U =0;
            this.params.V =0;

            this.stripeParams.pos= 0.5;
            this.stripeParams.angle= 0;
            this.stripeParams.spread=1;

            this.surf.rebuild(this.eqn);
            this.block.rebuild();

            this.setStripeCount(nGeodesics, scene);
            this.stripes.recomputeTransport();
             this.stripes.update();
             this.stripes.redraw();
        }

        if(i==2){

            let nGeodesics = 18;

            this.eqn = `V*exp(-(b)*( (x-c)*(x-c) + y*y))`;

            this.params.a =-1.4;
            this.params.b = 0.5;
            this.params.c = -2;
            this.params.U = 0;
            this.params.V = -1.5;

            this.stripeParams.pos= 0.555;
            this.stripeParams.angle= 0;
            this.stripeParams.spread=0.6;

            this.surf.rebuild(this.eqn);
            this.block.rebuild();

            this.setStripeCount(nGeodesics, scene);
            this.stripes.recomputeTransport();
            this.stripes.update();
            this.stripes.redraw();
        }


        if(i==3){

            //tall bump
            let nGeodesics = 8;

            this.eqn = `V*exp(-(b+0.25*U)*( (x-c)*(x-c) + y*y))`;

            this.params.a =2.5;
            this.params.b = 1.51;
            this.params.c = 0;
            this.params.U=1.51;
            this.params.V =2.5;

            this.stripeParams.pos= 0.67;
            this.stripeParams.angle= 0;
            this.stripeParams.spread=0.22;

            this.surf.rebuild(this.eqn);
            this.block.rebuild();

            this.setStripeCount(nGeodesics, scene);
            this.stripes.recomputeTransport();
            this.stripes.update();
            this.stripes.redraw();
        }




        if(i==4){

            //two bump
            let nGeodesics = 9;

            this.eqn = `V/2*exp(-b*( (x-c)*(x-c) + y*y))-V/2*exp(-b*( (x+c)*(x+c) + y*y))`;

            this.params.a =1.2;
            this.params.b = 1;
            this.params.c = 1;
            this.params.U = 0;
            this.params.V = 2.5;


            this.stripeParams.pos= 0.5;
            this.stripeParams.angle= 0;
            this.stripeParams.spread=0.66;

            this.surf.rebuild(this.eqn);
            this.block.rebuild();

            this.setStripeCount(nGeodesics, scene);
            this.stripes.recomputeTransport();
            this.stripes.update();
            this.stripes.redraw();
        }


        if(i==6){

            //eggcarton
            let nGeodesics = 12;

            this.eqn = `(a+0.2*(V+6))*(sin((b+(U+3)/3)*pi*x/3) + sin((b+(U+3)/3)*pi*y/3))`;

            this.params.a =0.375;
            this.params.b = 2.5;
            this.params.c = 0;
            this.params.U = -3;
            this.params.V = -6;

            this.stripeParams.pos= 0.46;
            this.stripeParams.angle= -0.26;
            this.stripeParams.spread=0.75;

            this.surf.rebuild(this.eqn);
            this.block.rebuild();

            this.setStripeCount(nGeodesics, scene);
            this.stripes.recomputeTransport();
            this.stripes.update();
            this.stripes.redraw();
        }


        if(i==5){

            //waves
            let nGeodesics = 10;

            this.eqn = `a*sin(b*(x+y))+0.25*U*sin(0.3*V*(x-y))`;

            this.params.a =0.5;
            this.params.b = 1.3;
            this.params.c = 0;
            this.params.U =0;
            this.params.V = 1;

            this.stripeParams.pos= 0.52;
            this.stripeParams.angle= -0.05;
            this.stripeParams.spread=0.86;

            this.surf.rebuild(this.eqn);
            this.block.rebuild();

            this.setStripeCount(nGeodesics, scene);
            this.stripes.recomputeTransport();
            this.stripes.update();
            this.stripes.redraw();
        }



    }

}




