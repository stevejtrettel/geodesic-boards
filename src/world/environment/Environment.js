
//one big class to take care of all the environmental rendering properties we want
import {ACESFilmicToneMapping, AgXToneMapping} from "three";

class Environment{
    constructor() {

        //set a background
        this.background = undefined;
        this.fog = undefined;

        //additional lights that need to be added to the scene
        this.lights=[];

        //objects that will be in the scene but (not the main star)
        //things like a table, or a plane for the floor / backdrop
        this.objects = [];

        //properties of the renderer (here with some sensible defaults)
        this.tone = AgXToneMapping;
        this.exposure = 1;
        this.shadows = false;

    }

    setBackground(bkg){
        this.background=bkg;
    }

    addLight(light){
        this.lights.push(light);
    }

    addObject(obj){
        this.objects.push(obj);
    }

}


export default Environment;