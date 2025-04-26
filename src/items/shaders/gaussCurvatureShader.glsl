// varyings from your vertex shader
varying float vCurvature;
varying vec2  vUv;         // if you ever want to overlay a grain texture

//— tweak these to taste ——
float uMinCurv=-0.25;    // lower bound of curvature (maps to t=0)
float uMaxCurv=5.;    // upper bound of curvature (maps to t=1)
float uHueShift=1.;   // maximum hue offset (in fraction of 1.0)
float uLightShift=0.; // maximum lightness offset
//--------------------------------

// simple HSL→RGB helpers
float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    if (s == 0.0) {
        return vec3(l); // achromatic
    } else {
        float q = l < 0.5 ? l * (1.0 + s) : (l + s - l * s);
        float p = 2.0 * l - q;
        float r = hue2rgb(p, q, h + 1.0/3.0);
        float g = hue2rgb(p, q, h);
        float b = hue2rgb(p, q, h - 1.0/3.0);
        return vec3(r, g, b);
    }
}

void main() {
    // 1) normalize curvature into [0,1]
    float t = clamp((vCurvature - uMinCurv) / (uMaxCurv - uMinCurv), 0.0, 1.0);

    // 2) pick a base wood color in HSL: hue~30°/360=0.083, med sat & light
    vec3 baseHSL = vec3(0.5);

    // 3) compute small shifts
    float dh = (t - 0.5) * uHueShift;    // hue offset ±uHueShift/2
    float dl = (t - 0.5) * uLightShift;  // lightness offset ±uLightShift/2

    // 4) convert back to RGB
    vec3 woodColor = hsl2rgb(vec3(baseHSL.x + dh,
    baseHSL.y,
    clamp(baseHSL.z + dl, 0.0, 1.0)));

    csm_DiffuseColor = vec4(woodColor, 1.0);
}
