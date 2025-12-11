import World from "/src/world/World";
import Environment from "/src/world/environment/Environment";

import defaultLights from "/src/world/environment/lights/defaultLights";
import BoxNoLights from "/src/world/environment/background/examples/BoxNoLights.js";

import OurVignette from "./Board";

import {makePointerUvListener} from "../../../code/interaction/raycastUV.js";

// Put a container into the HTML named "World" to store our program
// let canvas = document.querySelector('#World');

// 1. Create an instance of the World class
const world = new World( {controls:false, ui:false} );
world.setView({x:0,y:-13,z:7});
//world.setView({x:0,y:0,z:15});

// 2. Build the Environment for the world:
const environment = new Environment();
environment.setBackground(new BoxNoLights());
environment.lights = defaultLights;

//add it to the world
world.setEnvironment(environment);

// 4. Add the Vignette to the world:
let board = new OurVignette();
world.add( board );


//listener for things
// create the listener
const pointerUvListener = makePointerUvListener(
    world.camera,
    board.block,                           // or [mesh1, mesh2, …]
(uv /* THREE.Vector2 */) => {
    // Log as plain numbers in [0, 1] space
   // console.log(`uv.x = ${uv.x}, uv.y = ${uv.y}`);

    let U = 6*uv.x-3.;
    let V = 12*uv.y-6;

    board.params.x0=U;
    board.params.y0=V;

    board.needsUpdate=true;

}
);

// attach for both desktop & touch
const canvas = world.renderer.domElement;
canvas.style.touchAction = 'none';           // stop browser scroll/zoom
canvas.addEventListener('pointerdown', pointerUvListener);
canvas.addEventListener('pointermove', pointerUvListener);

// (optional) stop when no pointer is active
canvas.addEventListener('pointerup',   ev => {/* cleanup if needed */});
canvas.addEventListener('pointercancel', ev => {/* cleanup if needed */});

// attach it to the renderer's canvas
world.renderer.domElement.addEventListener('pointermove', pointerUvListener);


// 5. Start the Animation Loop
world.start();
