// varyings from your vertex shader
varying float vCurvature;
varying vec2  vUv;
varying float vZ;

//void main() {
//    //pick a base color
//    vec3 baseColor = vec3(0.5,0.6,0.9);
//
//    //stripes
//    float sinStripes = sin(100.*vZ);
//    sinStripes =(1.+sinStripes)/2.;
//    sinStripes = pow(sinStripes,10.);
//    float stripes = (1.+0.5*sinStripes)/2.;
////    if(sinStripes*sinStripes>0.9){
////        stripes=0.2;
////    }
//    csm_DiffuseColor = vec4(stripes*baseColor, 1.0);
//}




vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
    6.0)-3.0)-1.0,
    0.0,
    1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix( vec3(1.0), rgb, c.y);
}


float scalarGrid(float x, float scale){
    float spacing = 3.1416*scale;
    float grid1 = (1.-pow(abs(sin(spacing*x)),0.1))/10.;
    float grid2 = (1.-pow(abs(sin(5.*spacing*x)),0.1))/25.;
    float grid3 = (1.-pow(abs(sin(10.*spacing *x)),0.1))/50.;
    return grid1+grid2+grid3;
}



void main(){

    //allowable variables to use in coloring:
    float x = vUv.x;
    float y = vUv.y;
    float z = vZ;

    float r = sqrt(x*x+y*y);
    float t = atan(y,x)/3.14;
    vec2 polar = vec2(r,t);

    float hue = t;
    float sat =(2.*r*r/(1.+2.*r*r));
    float light =0.5;
    vec3 base = hsb2rgb(vec3(hue,sat,light));

    float grid = scalarGrid(z, 2.);
    vec3 col = base + 3.*vec3(grid);

    csm_DiffuseColor = vec4(col,1);
}
