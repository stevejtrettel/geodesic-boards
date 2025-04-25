import {Vector2} from "three";
import GeodesicArray from "./GeodesicArray.js";

let defaultProps = {
    pos: 0.5,
    angle: 0,
    spread:0.2,
    radius:0.02,
};

export default class GeodesicStripes extends GeodesicArray{
    constructor(surface, N =10, properties=defaultProps, material) {

        super(surface, N, properties,material);

    }

    //the only method that needs to be build is initial tangents
    setIni(){
        let V = new Vector2(Math.sin(this.properties.angle),Math.cos(this.properties.angle));

        for(let i=0; i<this.N; i++){
            let offset = i/this.N-0.5;
            let t = this.properties.pos+this.properties.spread*offset;
            console.log(this.surface.boundaryTransport(t,V));
            this.ini[i] = this.surface.boundaryTransport(t,V);
        }
    }

}
