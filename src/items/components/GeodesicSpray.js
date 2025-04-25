import {Group,Vector2} from "three";
import TangentVector from "../integrators/TangentVector.js";
import Geodesic from "./Geodesic.js";


let defaultProps = {
    pos: new Vector2(-1,-0.5),
    angle: 0,
    radius:0.02,
    spread:2,
};

export default class GeodesicSpray extends Group{
    constructor(surface, N =10, properties=defaultProps, material) {

        super();

        this.surface = surface;
        this.N = N;
        this.properties = properties;
        this.material = material;

        this.ini = new Array(this.N);
        this.setIni();

        this.geodesics = [];
        for(let i=0;i<this.N;i++) {
            let geo = new Geodesic(this.surface, this.ini[i], this.properties.radius, this.material)
            this.geodesics.push(geo);
            //add to the group
            this.add(geo);
        }

    }

    setIni(){
        for(let i=0; i<this.N; i++){
            let offset = i/this.N-0.5;
            let newAngle = this.properties.angle+this.properties.spread*offset;
            let newVel = new Vector2(Math.cos(newAngle), Math.sin(newAngle));

            this.ini[i] = new TangentVector(this.properties.pos,newVel);
        }
    }

    redraw(){
        this.setIni();
        for(let i=0;i<this.N;i++) {
            this.geodesics[i].update(this.ini[i]);
        }
    }

    update(properties){

        for(const [key,value] of Object.entries(properties)){
            if(this.properties.hasOwnProperty(key)){
                this.properties[key]=value;
            }
        }
        this.redraw();
    }


}
