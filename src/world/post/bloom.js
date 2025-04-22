import {Vector2} from "three";
import {UnrealBloomPass, OutputPass} from "three/addons";

const params = {
    threshold: 0,
    strength: 0.5,
    radius: 0,
    exposure: 1
};

const bloomPass = new UnrealBloomPass( new Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const outputPass = new OutputPass();

export default [bloomPass, outputPass];
