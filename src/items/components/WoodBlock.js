import {DoubleSide, Group, MeshPhysicalMaterial} from "three";
import ParametricSurface from "../meshes/ParametricSurface.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import ShaderSurface from "../meshes/ShaderSurface.js";
import {toGLSL} from "../utils/toGLSL";


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
        this.graph = new ShaderSurface(surface.math,surface.domain);

        // const pbrMat = new MeshPhysicalMaterial({ metalness: 0, roughness: 0.3,side:DoubleSide });
        //
        // const csm = new CustomShaderMaterial({
        //     baseMaterial: pbrMat,
        //     vertexShader: ``,
        //     fragmentShader: `
        // void main() {
        //     csm_DiffuseColor.rgb =vec3(1,0,0);   // modulate base colour
        // }`,
        //     uniforms: { size: { value: 1 } }
        // });
        //
        // this.graph = new ParametricSurface(surface.math.parametric, surface.domain,csm);
        //

        this.add(this.graph)
    }

    update(){
        this.graph.rebuild();
        //this.graph.redraw(this.surface.math.parametric);
    }

}

