import World from "../../world/World";
import Environment from "../../world/environment/Environment";

import SkyBox from "../../world/environment/background/examples/SkyBox";
import defaultLights from "../../world/environment/lights/defaultLights";
import gridFloor from "../../world/environment/objects/gridFloor";
import Test from "./Test";
import BoxNoLights from "../../world/environment/background/examples/BoxNoLights.js";


// Put a container into the HTML named "World" to store our program
// let canvas = document.querySelector('#World');

// 1. Create an instance of the World class
const world = new World(  );

// 2. Build the Environment for the world:
const environment = new Environment();
environment.setBackground(new SkyBox());
environment.lights = defaultLights;
environment.addObject(gridFloor);
environment.shadows=true;

//add it to the world
world.setEnvironment(environment);

// 2. Setup the viewpoint

// 4. Add the Vignette to the world:
world.add( new Test() );

// 5. Add any postprocessing
//world.addPost( bloom );

// 5. Start the Animation Loop
world.start();
