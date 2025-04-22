import {DirectionalLight,Vector3} from "three";


const light1 = new DirectionalLight(0xffffff,2);
light1.castShadow=true;
light1.tick = (time,dTime)=>{
    light1.position.set(3*Math.sin(time),2,3*Math.cos(time));
}

const light2 =  new DirectionalLight(0xffffff,2);

const defaultLights = [light1];

export default defaultLights;