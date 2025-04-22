import {
    ACESFilmicToneMapping,
    Clock,
    PerspectiveCamera,
    PMREMGenerator,
    Scene,
    WebGLRenderer,
    EquirectangularReflectionMapping,
    SRGBColorSpace, LightProbe
} from "three";
import {OrbitControls} from "three/addons";
import {EffectComposer, SobelOperatorShader, ShaderPass, RenderPass,LuminosityShader,} from "three/addons";
import {GUI} from "three/addons/libs/lil-gui.module.min.js";



//NEED TO SIMPLIFY THIS NONSENSE
function createContainer(name){
    //either fetch it, or make it!
    const existingContainer = document.getElementById(name);
    if(existingContainer){
        //return the existing div, and don't change any CSS styling attached to it
        return existingContainer;
    }
    else {
        //we need to create this div:
        const createdContainer = document.createElement("div");
        createdContainer.setAttribute("id", name);
        document.body.appendChild(createdContainer);

        //set the style of the DIV: TAKE UP THW WHOLE FRAME
        createdContainer.style.width = '100%';
        createdContainer.style.height = '100%';
        createdContainer.style.position = 'absolute';
        createdContainer.style['background-color'] = "#0f213d";

        return createdContainer;
    }
}




class World{
    constructor() {

        //basics
        this.updatables = [];
        this.clock = new Clock();
        this.scene = new Scene();

        //camera initialization
        this.camera = new PerspectiveCamera();
        this.camera.position.z = 5;

        //the renderer
        this.renderer = new WebGLRenderer({
            antialias : true,
            preserveDrawingBuffer: true,
            outputColorSpace: SRGBColorSpace,
            physicallyCorrectLights:true,
        });
        this.renderer.setSize(window.innerWidth,window.innerHeight);
        this.pmrem =  new PMREMGenerator(this.renderer);
        this.pmrem.compileCubemapShader();

        //get the canvas that things attach to, and add to scene
        this.container = createContainer('Vignette');
        this.container.append( this.renderer.domElement );

        //set size
        this.setSize = function( container, camera, renderer ) {

            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( container.clientWidth, container.clientHeight );
            renderer.setPixelRatio( container.devicePixelRatio );
        }

        // postprocessing
        this.composer = new EffectComposer( this.renderer );
        const renderPass = new RenderPass( this.scene, this.camera );
        this.composer.addPass( renderPass );

        //controls
        this.controls = new OrbitControls(this.camera, this.container );
        this.controls.tick = () => this.controls.update();
        this.updatables.push(this.controls);

        this.ui = new GUI();

        // setting the size: initially + with listening to the window
        this.setSize( this.container, this.camera, this.renderer );
        window.addEventListener('resize', () => {
            this.setSize( this.container, this.camera, this.renderer );
        }, false );

    }

    setView(view){

        // //set some camera stuff
        // if (this.camera.tick) {
        //     this.updatables.push(this.camera);
        // }

        // //set some control parameters:
        //controls.autoRotate = true;
        //controls.autoRotateSpeed=0.75;
        //this.controls.enableDamping = true;
        //controls.minDistance = options.minDistance;
        // controls.maxDistance = options.maxDistance;
        //this.controls.enablePan = true;

        // // set some renderer stuff
        // // turn on the physically correct lighting model
        //this.renderer.physicallyCorrectLights = true;
        // //tone to screen
        //this.renderer.toneMapping = ACESFilmicToneMapping;//  CineonToneMapping;  //ACESFilmicToneMapping;
        //this.renderer.outputColorSpace = sRGBEncoding;
    }

    setEnvironment(env){

        //set the renderer properties:
        this.renderer.toneMapping = env.tone;
        this.renderer.toneMappingExposure = env.exposure;
        this.renderer.shadowMap.enabled = env.shadows;

        //set the lights (and if they're dynamic, add to updatables)
        for(let i = 0; i < env.lights.length; i++){
            this.scene.add(env.lights[i]);
            //if any of the lights are animated, add them to the loop
            if(env.lights[i].tick){
                this.updatables.push(env.lights[i]);
            }
        }

        //add the background (and save it to the world, for future updating if dynamic):
        //addToScene also sets the properties intensity, blurriness, fog
        this.background = env.background;
        this.background.createCubeMap(this.renderer);
        this.background.addToScene(this.scene);

        //add any supporting objects:
        for(let i = 0; i < env.objects.length; i++){
            this.scene.add(env.objects[i]);
            //if any of the lights are animated, add them to the loop
            if(env.objects[i].tick){
                this.updatables.push(env.objects[i]);
            }
        }

    }

    add(obj){
        obj.addToScene(this.scene);
        obj.addToUI(this.ui);
        this.updatables.push(obj);
    }

    postProcess(passes) {
        for (let i = 0; i < passes.length; i++) {
            this.composer.addPass(passes[i]);
        }
    }

    tick(){
        //get time since last frame
        const time = this.clock.elapsedTime;
        const dTime = this.clock.getDelta();

        //use this to update each object one tick forwards
        for (const object of this.updatables) {
            object.tick(time, dTime);
        }

        //if the environment is dynamic, update it
        // if(this.background.dynamic){
        //     this.background.tick(time,dTime);
        //     this.background.createCubeMap(this.renderer);
        // }
    }

    start(){
        this.renderer.setAnimationLoop(
            () => {
                // tell every animated object to tick forward one frame
                this.tick();
                // render a frame
                this.renderer.setRenderTarget(null);
                //run composer instead of renderer incase we want to add effects
                this.composer.render(this.scene, this.camera);
            }
        );
    }

    stop(){
        this.renderer.setAnimationLoop(null);
    }

}


export default World;
