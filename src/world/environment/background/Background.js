import {Scene, WebGLCubeRenderTarget, CubeCamera, LinearMipmapLinearFilter, LightProbe,Fog} from "three";
import {LightProbeGenerator} from "three/addons";

class Background extends Scene {
    constructor() {
        super();

        //if we are updating constantly or not
        this.dynamic = false;

        //fog in the background (not the scene)
        //this.fog = new Fog( 0xa0a0a0, 10, 1000 );

        //if we want to have an image as the background instead:
        //this.image = undefined;

        // Create cube render target
        this.cubeMap = new WebGLCubeRenderTarget( 128, { generateMipmaps: true, minFilter: LinearMipmapLinearFilter } );
        // Create cube camera
        this.cubeCamera = new CubeCamera( 1, 100000, this.cubeMap );
        this.cubeCamera.position.set(0,0,0);
        this.add( this.cubeCamera );

        //OPTIONAL: TEST
        //lightprobe from the cube map
        this.probe = new LightProbe();
        this.probe.intensity =1.;

        //how this background is used in the scene
        this.bluriness = 0.2;
        this.bkgBrightness = 1.;
        this.envBrightness = 1.;
    }

    createCubeMap(renderer){
        this.cubeCamera.update(renderer,this);
        //generate the light probe:
        this.probe = LightProbeGenerator.fromCubeRenderTarget( renderer, this.cubeMap );
    }

    addToScene(scene){
        //set the scene properties
        scene.backgroundBlurriness = this.bluriness;
        scene.envMapIntensity = this.envBrightness;
        scene.backgroundIntensity = this.bkgBrightness;

        //this gets rendered by renderCubeMap...
        scene.background = this.cubeMap.texture;
        scene.environment = this.cubeMap.texture;

        //add in the light probe
        //scene.add(this.probe);
    }

}

export default Background;
