
import NumericalCurve from "../meshes/NumericalCurve.js";


export default class Geodesic extends NumericalCurve{
    constructor(surface, tv, radius, material ) {

        let pts = surface.integrateGeodesic(tv);

        super(pts, radius, material);

        this.tv = tv;
        this.surface = surface;

    }

    update( tv=this.tv ){
        this.tv = tv;
        let pts = this.surface.integrateGeodesic(tv);
        this.redraw(pts);
    }

}
