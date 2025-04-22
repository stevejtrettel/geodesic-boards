import {
    BoxGeometry,
    MeshNormalMaterial,
    Mesh, MeshPhysicalMaterial,
} from "three";



const testParams = {
    first: 0,
}

class Test {

    constructor() {
        const geometry = new BoxGeometry();
        const material = new MeshPhysicalMaterial({color:0x444444, metalness:0.1,roughness:0.1});
        this.cube = new Mesh(geometry,material);
        this.cube.castShadow=true;

    }

    addToScene(scene){
        scene.add(this.cube);
    }

    addToUI(ui){
        ui.add(testParams, 'first',0,1,0.01);
    }

    tick(time,dTime){
        // this.cube.rotation.x += 0.01;
        // this.cube.rotation.y += 0.01;
    }


}


export default Test;
