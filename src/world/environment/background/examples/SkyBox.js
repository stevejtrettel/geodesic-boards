import {Vector3, MathUtils,} from "three";
import {Sky} from "three/addons";
import Background from "../Background";


class SkyBox extends Background {
    constructor(ang=2) {
        super();

        // Add Sky
        this.sky = new Sky();
        this.sky.scale.setScalar( 450000 );
        this.add( this.sky );

        this.sun = new Vector3();

        this.params = {
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: ang,
            azimuth: 180,
        };

        const uniforms = this.sky.material.uniforms;
        uniforms[ 'turbidity' ].value = this.params.turbidity;
        uniforms[ 'rayleigh' ].value = this.params.rayleigh;
        uniforms[ 'mieCoefficient' ].value = this.params.mieCoefficient;
        uniforms[ 'mieDirectionalG' ].value = this.params.mieDirectionalG;

        const phi = MathUtils.degToRad( 90 - this.params.elevation );
        const theta = MathUtils.degToRad( this.params.azimuth );

        this.sun.setFromSphericalCoords( 1, phi, theta );
        uniforms[ 'sunPosition' ].value.copy( this.sun );

    }

    tick(time,dTime){
        const uniforms = this.sky.material.uniforms;
        const phi = MathUtils.degToRad( 10*time );
        const theta = MathUtils.degToRad( this.params.azimuth );

        this.sun.setFromSphericalCoords( 1, phi, theta );

        uniforms[ 'sunPosition' ].value.copy( this.sun );
    }

}

export default SkyBox;