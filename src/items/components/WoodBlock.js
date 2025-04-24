import {Group,MeshPhysicalMaterial} from "three";
import ParametricSurface from "../meshes/ParametricSurface.js";

let defaultMaterial = new MeshPhysicalMaterial({
    color:0xffffff,
    clearcoat:1,
    roughness:0,
    metalness:0,
});

export default class WoodBlock extends Group{
    constructor(surface, material=defaultMaterial) {
        super();

        this.surface = surface;

        this.graph = new ParametricSurface(surface.parametricEqn, surface.domain)
        this.add(this.graph)
    }

    update(){
        this.graph.redraw(this.surface.parametricEqn);
    }
}
