import {
    BackSide,
    BoxGeometry,
    Mesh,
    MeshStandardMaterial,
    PointLight
} from "three";

import Background from "../Background";


class BoxWithLights extends Background {

    constructor ( color ) {

        super( color );

        const lightParameters = {
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 2
        };

        //the rooom
        const geometry = new BoxGeometry();
        geometry.deleteAttribute( 'uv' );
        const parameters = {
            metalness: 0,
            side: BackSide
        };
        const roomMaterial = new MeshStandardMaterial( parameters );
        roomMaterial.color.set(0xffffff);

        const room = new Mesh( geometry, roomMaterial );
        room.scale.setScalar( 10 );
        this.add( room );

        const mainLight = new PointLight( 0xffffff, 100, 0, 2 );
        this.add( mainLight );
    }

}


export default  BoxWithLights;
