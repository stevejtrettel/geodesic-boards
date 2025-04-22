import {Group,Mesh,PlaneGeometry,MeshPhongMaterial,MeshStandardMaterial,GridHelper} from "three";

const gridFloor = new Group();

// ground
const mesh = new Mesh( new PlaneGeometry( 100, 100 ), new MeshStandardMaterial( { color: 0x999999, depthWrite: false, metalness:0.1,roughness:0.5, } ) );
mesh.rotation.x = - Math.PI / 2;
mesh.receiveShadow = true;

const grid = new GridHelper( 100, 50, 0x000000, 0x000000 );
grid.material.opacity = 0.2;
grid.material.transparent = true;

mesh.position.set(0,-4,0);
grid.position.set(0,-4,0);

gridFloor.add( mesh );
gridFloor.add( grid );

// gridFloor.tick=function(time,dTime){
//     mesh.position.set(0,-3+Math.sin(time),0);
//     grid.position.set(0,-3+Math.sin(time),0);
// }

export default gridFloor;