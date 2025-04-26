import {
    Scene,
    WebGLRenderer,
    OrthographicCamera,
    AmbientLight,
    DirectionalLight,
    SphereGeometry,
    MeshNormalMaterial,
    Mesh,
} from 'three';
import {OrbitControls} from "three/addons";


import GPUSurface from "../../items/meshes/GPUSurface.js";



//------GENERAL STUFF LIKE LIGHTS AND CAMERAS----------

const scene = new Scene();
scene.background=0xffffff;

//const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const camera = new OrthographicCamera(-5*window.innerWidth / window.innerHeight,5*window.innerWidth / window.innerHeight,5,-5)
camera.position.set(0,5,0);
camera.lookAt(0,0,0);

const renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
renderer.gammaInput = true;
renderer.gammaOutput = true
document.body.appendChild( renderer.domElement );

let controls = new OrbitControls( camera, renderer.domElement );

//lighting
const ambient = new AmbientLight( 0x404040,3 ); // soft white light
scene.add( ambient );
const directionalLight = new DirectionalLight( 0xffffff, 2 );
scene.add( directionalLight );




//
// let geom = new SphereGeometry(1);
// let mesh = new Mesh(geom, new MeshNormalMaterial());
// scene.add(mesh);




//------OUR SCENE----------



let eqn = `a*exp(-x^2-y^2)+sin(b*x)*sin(b*y)/4.`;

let params = {
    a:1,
    b:0,
};

let domain = [[-2,2],[-3,3]];

let surf = new GPUSurface(eqn,domain,params);
scene.add(surf);

let eqn2 = `sin(x)*sin(y)`;
let surf2 = new GPUSurface(eqn2,domain,params);
surf2.position.set(1,0,3);
scene.add(surf2);









function animate() {

    controls.update();
    renderer.render(scene, camera);

}
