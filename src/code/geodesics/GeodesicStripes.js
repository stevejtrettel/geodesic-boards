import {Vector2} from "three";
import GeodesicArray from "./GeodesicArray.js";
import Curve from "../interpolators/Curve.js";
import TangentVector from "../diffgeo/TangentVector.js";

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

    _initialize(){

        const [[x0, x1], [y0, y1]] = this.surface.domain;

        this.curve =new Curve(t => new Vector2(x0 + t * (x1 - x0), y0));

        this.parallel = this.surface.parallelTransport(this.curve);
    }

    //the only method that needs to be build is initial tangents
    setIni(){

        let V = new Vector2(Math.sin(this.properties.angle),Math.cos(this.properties.angle));
        for(let i=0; i<this.N; i++){

            let offset = i/this.N-0.5;
            let t = this.properties.pos+this.properties.spread*offset;

            let basis = this.parallel(t);

            let newPos = this.curve.getPoint(t);
            let newV = basis[0].multiplyScalar(V.x).add(basis[1].multiplyScalar(V.y));
            this.ini[i] = new TangentVector(newPos, newV);
        }

    }

}
