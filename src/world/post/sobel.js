
import {LuminosityShader,ShaderPass,SobelOperatorShader,} from "three/addons";

// color to grayscale conversion
const effectGrayScale = new ShaderPass( LuminosityShader );

// you might want to use a gaussian blur filter before
// the next pass to improve the result of the Sobel operator

// Sobel operator
const effectSobel = new ShaderPass( SobelOperatorShader );
effectSobel.uniforms[ 'resolution' ].value.x = window.innerWidth * window.devicePixelRatio;
effectSobel.uniforms[ 'resolution' ].value.y = window.innerHeight * window.devicePixelRatio;


const sobel = [effectGrayScale,effectSobel];


export default sobel;