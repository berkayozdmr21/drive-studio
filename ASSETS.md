# Third-party assets

## Ferrari 458 Italia

- Creator: **vicent091036**
- Original: https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6
- License: Creative Commons Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/
- Bundled file: `frontend/public/models/ferrari.glb`
- Distribution source: https://github.com/mrdoob/three.js/blob/r174/examples/models/gltf/ferrari.glb
- Three.js attribution: https://threejs.org/examples/webgl_materials_car.html
- License mapping: https://github.com/mrdoob/three.js/issues/23089

Changes in this project: runtime paint and surface materials, alternative wheel geometries, rear wing geometry, interior colors and studio lighting. The source GLB is retained as downloaded. Attribution must remain with redistributed copies and exported imagery.

## Draco decoder

Files under `frontend/public/draco` originate from the Three.js r174 Draco distribution, using Google's Draco decoder. Apache License 2.0 text is included as `frontend/public/draco/LICENSE`.

## Other dependencies

React, Three.js, React Three Fiber, Drei, Lucide, GSAP, Vite, FastAPI and their dependencies retain their respective licenses. Installing dependencies includes their package license files. The portfolio authorship credit does not replace third-party asset attribution.

## Bundled file integrity (SHA-256)

- `frontend/public/draco/draco_decoder.js`: `8625489da79a805f4f2a7d511c3e52d8b4085608a9d2a4d5f4f9de5db0aea04f`
- `frontend/public/draco/draco_decoder.wasm`: `a680d927bed9cb864ddbd63521868891af2bfbe755092761b4837487618df8ac`
- `frontend/public/draco/draco_wasm_wrapper.js`: `8bb2952d2ba7d67e1414f8df819410cb0434a666be53f671fff75f68843d76f6`
- `frontend/public/models/ferrari.glb`: `cafe3f48da6797aa9bde75ca768bc5b57db366575fd233e90df186ae988a876e`

## Original concept vehicles

Apex GT, Volt S, Terra X, Metro R, Nomad Utility, Aero One, Coast Spider, Trail Rally and Atlas Touring are original parametric meshes authored in `frontend/src/ConceptCar.jsx`. They share reusable geometry components with different body dimensions, rooflines and category details. No third-party vehicle assets are used for these nine concepts.
