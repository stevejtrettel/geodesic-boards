import {
    PlaneGeometry,
    MeshPhongMaterial,
    HemisphereLight,
    SpotLight,
    Mesh,
    Color,
    Fog,
} from "three";


import Background from "../Background";

class Floor extends Background{
    constructor() {
        super();

        this.background = new Color( 0x443333 );

        // Ground
        const plane = new Mesh(
            new PlaneGeometry( 8, 8 ),
            new MeshPhongMaterial( { color: 0xcbcbcb, specular: 0x101010 } )
        );
        plane.rotation.x = - Math.PI / 2;
        plane.position.y = -1.03;
        plane.receiveShadow = true;
        this.add( plane );

        // Lights
        const hemiLight = new HemisphereLight( 0x8d7c7c, 0x494966, 5 );
        this.add( hemiLight );

        // const spotLight = new SpotLight();
        // spotLight.intensity = 10;
        // spotLight.angle = Math.PI / 16;
        // spotLight.penumbra = 0.5;
        // //spotLight.castShadow = true;
        // spotLight.position.set( - 1, 1, 1 );
        // this.add( spotLight );


        this.bkgBrightness=1.;
        this.envBrightness = 1.;
        this.bluriness=0.1;


    }
}


export default Floor;