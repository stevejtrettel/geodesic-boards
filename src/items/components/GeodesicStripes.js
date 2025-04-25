import {Group,Vector2} from "three";
import Geodesic from "./Geodesic.js";


let defaultProps = {
    pos: 0.5,
    angle: 0,
    spread:0.2,
    radius:0.02,
};

export default class GeodesicStripes extends Group{
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
        //build the initial vector
        let V = new Vector2(Math.sin(this.properties.angle),Math.cos(this.properties.angle));

        for(let i=0; i<this.N; i++){
            let offset = i/this.N-0.5;
            let t = this.properties.pos+this.properties.spread*offset;
            console.log(this.surface.boundaryTransport(t,V));
            this.ini[i] = this.surface.boundaryTransport(t,V);
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
