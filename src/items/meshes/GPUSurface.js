import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import {toGLSL} from "../utils/toGLSL.js";
// now we take in a pre-built ShaderMath (with GLSL snippets + parameters)

/**
 * ShaderSurface renders z = f(x,y) on a flat plane, displaced in the vertex shader,
 * and colored by Gaussian curvature via a hue scale using three-custom-shader-material.
 *
 * Instead of an equation string, this takes a ShaderMath (or SurfaceMath) instance
 * that already holds .parameters and .glsl_* snippets.
 */
export default class GPUSurface extends THREE.Mesh {

    constructor(eqn, domain = [[0,1],[0,1]], parameters = {}) {


        const glslEqn = toGLSL(eqn);
        const [xMin, xMax] = domain[0];
        const [yMin, yMax] = domain[1];
        const width  = xMax - xMin;
        const height = yMax - yMin;
        const wSegs = 256;
        const hSegs = 256;

        // build plane geometry
        const geometry = new THREE.PlaneGeometry(width, height, wSegs, hSegs);

        // build uniforms: domain transform + user parameters
        const uniforms = {
            uDomainMin:  { value: new THREE.Vector2(xMin, yMin) },
            uDomainSize: { value: new THREE.Vector2(width, height) }
        };
        const uniformDecls = ['uniform vec2 uDomainMin;', 'uniform vec2 uDomainSize;'];
        for (const [key, val] of Object.entries(parameters)) {
            uniforms[key] = { value: val };
            uniformDecls.push(`uniform float ${key};`);
        }

        // GLSL function for f:
        const fnDecl = `float f(float x, float y) { return ${glslEqn}; }`;
        const varyingDecl = 'varying float vValue;';

        // assemble vertex shader
        const vertexShader = `
      ${uniformDecls.join('\n')}
      
      ${fnDecl}
      ${varyingDecl}
      
      void main() {
                // map uv to domain coords
          vec2 uvw = uv;
          float x = uDomainMin.x + uvw.x * uDomainSize.x;
          float y = uDomainMin.y + uvw.y * uDomainSize.y;
          float z = f(x, y);
          vValue = z;
          
          float h = 0.0001;
        
          // numeric partials for normal
          float fxv = (f(x + h, y) - f(x - h, y)) / (2.0 * h);
          float fyv = (f(x, y + h) - f(x, y - h)) / (2.0 * h);
        
        // displacement
        vec3 newPos = position;
        newPos.z += z;
        csm_Position = newPos;
        
          // recompute normal: (-fx, -fy, 1)
          vec3 newNormal = normalize(vec3(-fxv, -fyv, 1.0));
          csm_Normal = newNormal;
      }
    `;

        // assemble fragment shader
        const fragmentShader = `
      varying float vValue;
      // inline HSL->RGB (s=1,l=0.5)
      float hue2rgb(float p, float q, float t) {
        t = mod(t + 1.0, 1.0);
        if(t < 1.0/6.0) return p + (q - p)*6.0*t;
        if(t < 1.0/2.0) return q;
        if(t < 2.0/3.0) return p + (q - p)*(2.0/3.0 - t)*6.0;
        return p;
      }
      vec3 hsl2rgb(vec3 hsl) {
        float h=hsl.x, s=hsl.y, l=hsl.z;
        if(s==0.) return vec3(l);
        float q = l<0.5 ? l*(1.+s) : l+s-l*s;
        float p = 2.*l - q;
        return vec3(
          hue2rgb(p,q,h+1.0/3.0),
          hue2rgb(p,q,h),
          hue2rgb(p,q,h-1.0/3.0)
        );
      }
      void main() {
        float H = fract(0.5 + vValue * 0.2);
        vec3 rgb = hsl2rgb(vec3(H,1.0,0.5));
        csm_DiffuseColor = vec4(rgb,1.0);
      }
    `;

        // create material
        const material = new CustomShaderMaterial({
            baseMaterial: THREE.MeshPhysicalMaterial,
            uniforms,
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
            roughness: 0.0,
            metalness: 0.0,
            clearcoat:1,
        });

        // automatically sync uniforms to shaderMath.parameters before each render
        material.onBeforeRender = (renderer, scene, camera, geometry, mesh) => {
            for (const key of Object.keys(parameters)) {
                if (uniforms[key] !== undefined) {
                    uniforms[key].value = parameters[key];
                }
            }
        };

        super(geometry, material);
        this.frustumCulled = false;

    }
}
