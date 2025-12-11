import World from "/src/world/World";
import Environment from "/src/world/environment/Environment";

import SkyBox from "/src/world/environment/background/examples/SkyBox";
import defaultLights from "/src/world/environment/lights/defaultLights";
import gridFloor from "/src/world/environment/objects/gridFloor";
import BoxNoLights from "/src/world/environment/background/examples/BoxNoLights.js";

import OurVignette from "./Board";
import {makePointerUvListener} from "../../../code/interaction/raycastUV.js";


// Put a container into the HTML named "World" to store our program
// let canvas = document.querySelector('#World');

// 1. Create an instance of the World class
const world = new World( {controls: false, ui:false}  );
world.setView({x:0,y:-13,z:7});

// 2. Build the Environment for the world:
const environment = new Environment();
environment.setBackground(new BoxNoLights());
environment.lights = defaultLights;
// environment.addObject(gridFloor);
//environment.shadows=true;

//add it to the world
world.setEnvironment(environment);

// 2. Setup the viewpoint

// 4. Add the Vignette to the world:
let board = new OurVignette();
world.add( board );




//listener for things
// create the listener
const pointerUvListener = makePointerUvListener(
    world.camera,
    board.block,
    (uv) => {
        let ang = uv.x - 0.5;
        if (board.stripes) {
            board.stripes.update({ spread: uv.y, angle: ang });
        }
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






//BUTTON MATH

// Define your presets (text or emoji label + action)
const buttonData = [
    { label: "Board 1", action: () => board.resetBoard(1,world.scene) },
    { label: "Board 2", action: () => board.resetBoard(2,world.scene)  },
    { label: "Board 3", action: () => board.resetBoard(3,world.scene)  },
    { label: "Board 4", action: () => board.resetBoard(4,world.scene)  },
    { label: "Board 5", action: () => board.resetBoard(5,world.scene)  },
    { label: "Board 6", action: () => board.resetBoard(6,world.scene)  }
];


//custom font
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap";
document.head.appendChild(fontLink);

// Create <style> for button bar
const style = document.createElement("style");
style.textContent = `
  #button-bar {
    position: fixed;
    bottom: 0;
    width: 100%;
    display: flex;
    justify-content: space-around;
    background: rgba(0, 0, 0, 0.);
    padding: 0.5em 0;
    z-index: 10;
    font-family: 'Roboto', sans-serif; /* Optional: for the bar too */
  }

  #button-bar button {
    flex: 1;
    margin: 0 0.5em;
    padding: 1em;
    font-size: 1.5em;
    font-family: 'Roboto', sans-serif;  /* ✅ Set the custom font here */
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 0.5em;
    transition: background 0.2s;
    touch-action: manipulation;
  }

  #button-bar button:hover,
  #button-bar button:active {
    background: rgba(0, 0, 0, 0.2);;
  }

  @media (max-width: 600px) {
    #button-bar button {
      font-size: 1.2em;
      padding: 0.8em;
    }
  }
`;
document.head.appendChild(style);

// Create button bar
const bar = document.createElement("div");
bar.id = "button-bar";
document.body.appendChild(bar);

// Add buttons
buttonData.forEach((data, i) => {
    const btn = document.createElement("button");
    btn.textContent = data.label;
    btn.addEventListener("click", () => {
        console.log("Button", i, "clicked");
        data.action();
    });
    bar.appendChild(btn);
});


