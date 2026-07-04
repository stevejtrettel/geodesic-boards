# Geodesic Boards

Compute and visualize **geodesics on curved surfaces**, then export the data needed to carve those surfaces — and the paths across them — on a CNC machine.

The surfaces are either **graphs** of a function `f(x, y)` in ℝ³ or **surfaces of revolution** (plus an experimental **black hole** / Schwarzschild-funnel surface). A family of geodesics is seeded along one edge and shot across the surface by parallel transport, producing the flowing "wood-grain" stripes you carve into a physical board.

The project has two goals:

1. **A live, playable program** — an interactive Three.js scene where you can change the surface equation, drag to re-aim the geodesic family, and watch them redraw in real time.
2. **A fabrication tool** — export the geodesic paths as ordered `(point, surface-normal)` samples, along with the surface equation and domain, so a CNC can carve the board and cut the grooves along the true geodesics.

## Quick start

```bash
npm install
npm run dev
```

Then open the local URL Vite prints. The scene that loads is whatever [index.html](index.html) points its `<script>` at — currently `demos/momath-display/a/main.js`. Edit that one line to switch scenes.

Requires Node and a WebGL2-capable browser.

## How it works

### 1. Symbolic surfaces (the core trick)

You describe a surface with a plain equation string, e.g.

```js
const eqn = `a*exp(-b*((x-c)*(x-c) + y*y))`;   // a Gaussian bump
```

[`GraphGeometry`](src/code/diffgeo/GraphGeometry.js) parses it with **mathjs**, symbolically differentiates it to get `fₓ, f_y, fₓₓ, fₓ_y, f_y_y`, and then compiles each expression **two ways** from the same AST:

- **[`fromMathJS`](src/code/utils/fromMathJS.js)** → a native JS closure, used on the CPU to integrate geodesics and parallel transport. (Falls back to finite differences if a derivative won't compile.)
- **[`toGLSL`](src/code/utils/toGLSL.js)** → a GLSL string, inlined into the vertex shader so the surface is lifted on the **GPU** ([`GPUGraphSurface`](src/code/meshes/GPUGraphSurface.js)).

One equation, one autodiff pass, both the math engine and the renderer stay perfectly in sync. Changing the equation is a `surf.rebuild(newEqn)` call.

### 2. Geodesics by parallel transport

From the differentiated surface we get the geodesic acceleration and the Christoffel symbols directly, so [`Geodesic`](src/code/geodesics/Geodesic.js) integrates the geodesic ODE ([`RungeKutta`](src/code/integrators/RungeKutta.js)) and [`TransportIntegrator`](src/code/integrators/TransportIntegrator.js) parallel-transports a frame along a curve.

[`GeodesicStripes`](src/code/geodesics/GeodesicStripes.js) uses this to build the stripe family: it walks along one boundary edge, parallel-transports a reference direction to stay "evenly fanned," and shoots `N` geodesics across the surface. Its `pos / spread / angle` controls are wired to pointer input, so dragging on the board re-aims the whole family live.

### 3. Rendering

The [`src/world/`](src/world/) engine (`World`, `Environment`, `View`, backgrounds, lights, post-processing) is a small Three.js harness. Surfaces are drawn with GPU shaders in [`src/code/shaders/`](src/code/shaders/) — including wood-grain, Gauss-curvature, and level-set looks — via [`three-custom-shader-material`](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial).

### 4. Fabrication export

`printToString` / `printToSring` on the surface and geodesics emit a `.txt` file ([`downloadTextFile`](src/code/utils/downloadTextFile.js)) containing:

- the simplified surface equation (as GLSL-style source) and its domain, and
- for each geodesic, a fixed number of evenly-spaced samples along the path, each as a **surface point `(x, y, z)` and unit surface normal `(nₓ, n_y, n_z)`** at fixed precision.

That point-and-normal stream is what downstream CNC tool-path generation consumes.

## Project layout

```
index.html                 single switchable entry (edit the <script src>)
vite.config.js             Vite + vite-plugin-glsl, plus the @/ → src alias
jsconfig.json              tells the editor about the @/ alias

demos/                     runnable scenes, each a { main.js, Board.js } pair
  design/  set/  momath-display/  versions/  old/

src/                       shared library (imported as @/...)
  code/
    diffgeo/               surface geometry: Graph, Revolution, BH, TangentVector
    geodesics/             Geodesic, GeodesicArray, GeodesicSpray, GeodesicStripes
    integrators/           RungeKutta, Symplectic2/4, TransportIntegrator, ...
    geometries/            Three.js BufferGeometry builders (surfaces & tubes)
    meshes/                GPU/numerical/parametric surface & curve meshes
    interpolators/         Curve, Catmull-Rom helpers
    shaders/               wood / curvature / level-set / design GLSL
    utils/                 fromMathJS, toGLSL, downloadTextFile
    interaction/           raycastUV (pointer → surface UV)
  world/                   Three.js harness: World, Environment, View, post
```

Imports into the shared library use the `@/` alias (e.g. `import GraphGeometry from "@/code/diffgeo/GraphGeometry.js"`); imports between sibling files in a demo stay relative (`./Board`).

A **scene** is a `main.js` that builds a `World` and adds a `Board`; the `Board` (extending [`Vignette`](src/code/Vignette.js)) owns the surface, the stripes, the UI, and the download action. See [`demos/momath-display/a/`](demos/momath-display/a/) for a representative example with a preset-board button bar.

## Dependencies

- [`three`](https://threejs.org/) — rendering
- [`mathjs`](https://mathjs.org/) — parsing, simplification, symbolic differentiation
- [`three-custom-shader-material`](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial) — inject custom GLSL into Three materials
- [`three-gpu-pathtracer`](https://github.com/gkjohnson/three-gpu-pathtracer) — high-quality stills
- [`vite`](https://vitejs.dev/) + [`vite-plugin-glsl`](https://github.com/UstymUkhman/vite-plugin-glsl) — dev server / `.glsl` imports

## Status

Actively used and being modernized. A refactor toward JSDoc-typed ES modules (a thinner `App`, a reactive `Params` system, `demos/<name>/main.js` entries) is in progress; the surface-abstraction and rendering internals will keep evolving.
