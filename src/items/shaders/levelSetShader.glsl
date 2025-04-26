// varyings from your vertex shader
varying float vCurvature;
varying vec2  vUv;
varying float vZ;

void main() {
    //pick a base color
    vec3 baseColor = vec3(0.5,0.6,0.9);

    //stripes
    float sinStripes = sin(100.*vZ);
    sinStripes =(1.+sinStripes)/2.;
    sinStripes = pow(sinStripes,10.);
    float stripes = (1.+0.5*sinStripes)/2.;
//    if(sinStripes*sinStripes>0.9){
//        stripes=0.2;
//    }
    csm_DiffuseColor = vec4(stripes*baseColor, 1.0);
}
