/********************************************************************
 *  ShaderSurface.js
 *  ---------------------------------------------------------------
 *  THREE.Mesh subclass that visualises the graph z = f(x,y) purely
 *  on-GPU with three-custom-shader-material.
 *
 *  ‣ Depends on an *existing* DiffGeo instance, which supplies
 *      • parameters         – { a:1, b:2, … }
 *      • GLSL snippets      – glsl_f, glsl_fx, …, glsl_fyy
 *  ‣ Geometry is a static plane; vertex shader performs the lift.
 *  ‣ When DiffGeo.rebuild(eqn) is called the caller should follow
 *    with surface.rebuild() so the new GLSL is compiled.
 *******************************************************************/
import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

import woodShader   from '../shaders/woodShader.glsl';   // fragment shader
// If you want to swap colour maps, just pass a different frag shader.

export default class ShaderSurface extends THREE.Mesh {

    /** ----------------------------------------------------------------
     * @param {DiffGeo} diffGeo            – already-initialised instance
     * @param {Array<[number,number]>} domain  – [[xmin,xmax],[ymin,ymax]]
     * @param {Object} options
     *        • widthSegments / heightSegments
     *        • fragmentShader – override for colour logic
     *        • baseMaterial   – e.g. THREE.MeshPhysicalMaterial
     * ----------------------------------------------------------------*/
    constructor(
        diffGeo,
        domain  = [[0,1],[0,1]],
        options = {}
    ){
        const {
            widthSegments  = 128,
            heightSegments = 128,
            fragmentShader = woodShader,
            baseMaterial   = THREE.MeshPhysicalMaterial,
        } = options;

        // --- store -----------------------------------------------------------------
        super();                                 // dummy super; we’ll attach geo+mat below
        this.diffGeo = diffGeo;
        this.domain  = domain;
        this._segs   = { widthSegments, heightSegments };
        this._base   = baseMaterial;
        this._frag   = fragmentShader;

        // --- build once -------------------------------------------------------------
        this.geometry = this._buildGeometry();
        this.material = this._buildMaterial();

        this.frustumCulled = false;              // height-field often exceeds plane
    }

    /* ==================================================================== *
     *  PUBLIC API
     * ==================================================================== */

    /** Re-compile shaders after the underlying DiffGeo changed */
    rebuild() {
        // 1. toss uniforms & shaders living on the GPU
        this.material.dispose();
        // 2. replace with fresh GLSL generated from the *current* diffGeo
        this.material = this._buildMaterial();
    }

    /** Convenience: change just the domain (keeps seg counts) */
    setDomain(domain){
        this.domain = domain;
        this.geometry.dispose();
        this.geometry = this._buildGeometry();
    }

    /* ==================================================================== *
     *  INTERNAL HELPERS
     * ==================================================================== */

    /* ---- geometry is a simple plane ------------------------------------ */
    _buildGeometry(){
        const [[x0,x1],[y0,y1]] = this.domain;
        return new THREE.PlaneGeometry(
            x1 - x0,                       // width
            y1 - y0,                       // height
            this._segs.widthSegments,
            this._segs.heightSegments
        );
    }

    /* ---- uniforms & GLSL snippets -------------------------------------- */
    _buildMaterial(){

        const [[x0,x1],[y0,y1]] = this.domain;
        const diff = this.diffGeo;
        const { parameters }   = diff;       // live reference – uniforms auto-sync

        /* 1.  uniforms + declarations */
        const uniforms      = {
            uDomainMin : { value: new THREE.Vector2(x0, y0) },
            uDomainSize: { value: new THREE.Vector2(x1 - x0, y1 - y0) },
        };
        const decls = [
            'uniform vec2 uDomainMin;',
            'uniform vec2 uDomainSize;',
        ];

        //   create a *stable* uniform object for each param so that
        //   onBeforeRender can mutate .value without replacing the slot
        for (const [k,v] of Object.entries(parameters)){
            uniforms[k] = { value: v };
            decls.push(`uniform float ${k};`);
        }

        /* 2.  vertex shader generator ------------------------------------ */
        const vs = /* glsl */`
${decls.join('\n')}

/* --- analytic data supplied by DiffGeo ------------------------------ */
float f   (float x,float y){ return ${diff.glsl_f}; }
float fx  (float x,float y){ return ${diff.glsl_fx};}
float fy  (float x,float y){ return ${diff.glsl_fy};}
float fxx (float x,float y){ return ${diff.glsl_fxx};}
float fxy (float x,float y){ return ${diff.glsl_fxy};}
float fyy (float x,float y){ return ${diff.glsl_fyy};}

varying float vCurvature;
varying float vZ;
varying vec2  vUv;

void main(){
    vUv = uv;

    // map [0,1]² → user domain
    vec2 xy = uDomainMin + uv * uDomainSize;
    float x  = xy.x;
    float y  = xy.y;

    // graph height
    float z = f(x,y);
    vZ = z;

    // Gaussian curvature K for colour
    float fxv  = fx(x,y);
    float fyv  = fy(x,y);
    float denom= 1. + fxv*fxv + fyv*fyv;
    vCurvature = (fxx(x,y)*fyy(x,y) - fxy(x,y)*fxy(x,y)) / (denom*denom);

    // lift & set normal
    vec3 displaced = position;
    displaced.z += z;
    csm_Position = displaced;
    csm_Normal   = normalize(vec3(-fxv, -fyv, 1.0));
}
`;

        /* 3.  material ---------------------------------------------------- */
        const mat = new CustomShaderMaterial({
            baseMaterial  : this._base,
            vertexShader  : vs,
            fragmentShader: this._frag,
            uniforms,
            side          : THREE.DoubleSide,
            transparent   : false,
            roughness     : 0.25,
            metalness     : 0.0,
            clearcoat     : 0.0,
        });

        /* 4.  keep uniforms live with diffGeo.parameters ------------------ */
        mat.onBeforeRender = () => {
            for (const key in parameters){
                const u = mat.uniforms[key];
                if (u) u.value = parameters[key];
            }
        };

        return mat;
    }
}
