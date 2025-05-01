#include ./components/colors.glsl
#include ./components/levelSets.glsl



// varyings from your vertex shader
varying float vGaussCurve;
varying float vMeanCurve;
varying vec2 vSectionalCurve;
varying vec2  vUv;
varying float vZ;



void main(){

    vec3 base = heightColor(vGaussCurve/10.);

    float grid = levelSets(vGaussCurve, 2.);
    vec3 col = base + 5.*vec3(grid);

    float k1 = vSectionalCurve.x;
    float k2 = vSectionalCurve.y;

    if(k1>2.|| k2>2.){
        col = vec3(1.,0,0);
    }

    if(vZ>1.|| vZ<-1.){
        col = vec3(0.5,0,0.5);
    }

    csm_DiffuseColor = vec4(col,1);
}
