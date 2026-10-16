# Delivery verification

- 18 backend integration tests passed.
- 22 frontend configuration/API helper and render-dimension tests passed.
- Vite production build completed.
- FastAPI TestClient successfully served the homepage, GLB model and WASM decoder.

Actual browser rendering, responsive layout and GPU interaction could not be verified in this environment: locally spawned HTTP servers were unreachable from the browser. A file-based preview was blocked by browser URL policy and was not pursued through a workaround. No screenshot or end-to-end browser result is claimed.

The Windows launcher and Docker deployment are provided but were not executed end-to-end in a normal user desktop/container session. Use BASLAT.cmd to start the packaged application on Windows. Three.js is lazy loaded; its production chunk triggers Vite's large-chunk advisory. This is not a build failure.

The ten-model update verifies every model base price, save/share persistence of each vehicle, rejection of unknown IDs and legacy draft compatibility. Render-size tests cover 4K, portrait aspect ratios and GPU-limit rejection. Actual high-resolution and transparent GPU captures still require browser verification on the user device.

Vehicle differentiation fix: replaced the shared body/roof template with nine independently authored silhouettes and category-specific exterior details. Both 3D meshes and the WebGL fallback now use the selected model shape. The two added tests check independent body/roof definitions and identifying structural features; they do not substitute for visual browser verification.

The fallback rendering regression test confirms that all nine rendered SVG body outlines differ, not only their model names.
