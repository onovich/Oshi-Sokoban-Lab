# Interactive shallow water study

Research checked 2026-09-09. Scope: visual experiments for Oshi / LearnSokoban's flat board and heavy sliding blocks. This document does not claim to identify Oshi's original implementation. No reference source code or art was copied into the project.

## Three different simulation models

| Model | State that evolves | What it can demonstrate | What it does not establish |
| --- | --- | --- | --- |
| Damped heightfield wave | Surface elevation and vertical velocity | Propagating ripples, interference, reflected waves, height-derived normals | Horizontal transport, circulating wakes, displaced water flowing around a block |
| Incompressible 2D flow | Horizontal velocity, pressure, optional advected scalar | Water-like currents around obstacles; persistent foam/tracer wakes | A changing free surface or water-depth accumulation by itself |
| Shallow-water flow | Water depth and horizontal momentum/velocity | Front accumulation, sideways transport, rear backfill and surface waves | Overturning waves, detached splashes, detailed vertical circulation |

The first and third models both use a heightfield, but that representation does not make their dynamics equivalent. Rendering only moving normal noise would be a fourth category: procedural animation without an evolving physical state.

## Verified primary sources

### Evan Wallace: WebGL Water

The [original source, water.js](https://github.com/evanw/webgl-water/blob/master/water.js) stores elevation, vertical velocity and two normal components in a texture. Its update moves velocity toward the average height of four neighbors, damps velocity, then updates height. It uses two 256 by 256 textures with float/half-float capability checks. Normals are computed from height differences. A moving sphere changes the height using its previous and current displaced-volume estimates. There is no horizontal velocity field or pressure projection in that update. This is an excellent small wave-state reference, but a sphere interaction does not supply a rectangular moving-solid boundary solver. The file header explicitly says MIT; retain the applicable copyright and license if source is adapted later. The [author's live demonstration](https://madebyevan.com/webgl-water/) separates attractive reflection/refraction/caustics from the small underlying wave model.

### Mark Harris: GPU Gems chapter 38

[Fast Fluid Dynamics Simulation on the GPU](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu) describes Stam-style stable fluids on a rectangular two-dimensional domain. Advection transports velocity and dye; a pressure solve removes velocity divergence. The chapter explicitly excludes water/air free-surface tracking from its basic model. Arbitrary and moving boundaries require extensions. Therefore, a colorful projected-flow demonstration is useful evidence of circulation, but does not by itself demonstrate shallow water. Semi-Lagrangian stability also does not guarantee crisp detail: the chapter notes numerical diffusion. Read this as an algorithm reference; no sample-code license was established during this study, so no NVIDIA source is proposed for copying.

### Crane, Llamas and Tariq: GPU Gems 3 chapter 30

[Real-Time Simulation and Rendering of 3D Fluids, section 30.2.4](https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation/chapter-30-real-time-simulation-and-rendering-3d-fluids) explains why obstacle handling must enter divergence, pressure and velocity projection. The solid's normal velocity must be represented at the fluid boundary; masking final color alone is insufficient. The chapter also discusses advection leakage and separate obstacle occupancy/velocity textures. Its full solver is three-dimensional: the proposed two-dimensional experiment borrows the boundary principle, not its entire implementation. Its simple shape/velocity forcing approximation is useful for early visual work, provided it is labelled an approximation. No sample-code reuse license was established here.

### Chentanez and Müller: shallow-water research

The authors' [Real-time Simulation of Large Bodies of Water with Small Scale Details](https://matthias-research.github.io/pages/publications/hfFluid.pdf), also [published by Eurographics in 2010](https://diglib.eg.org/items/d0320015-4b07-416b-8f41-047485c9f7f3), explicitly contrasts vertical-only wave dynamics with a heightfield plus horizontal flow. Their system couples solids with both height and velocity and adds particles for phenomena a single surface cannot represent. Section 2.3 covers solid/fluid interaction; section 2.4 covers particles. This supports treating block displacement, surface response and spray as separate concerns. Its two-way buoyancy/drag/lift system exceeds a puzzle game's visual requirement: prescribed block motion can drive a one-way effect. The publication carries Eurographics copyright; this study uses the ideas and citations, not reproduced implementation text or figures.

### Stephen Thompson: implementation experience

[Shallow Water Demo](https://www.solarflare.org.uk/shallow_water) is a first-person account with [original source repository](https://github.com/sdthompson1/shallow-water-demo). It uses a Kurganov–Petrova scheme in three GPU shader passes per timestep and explains depth/velocity as vertically averaged dynamics. It also reports resolution costs and spiky artifacts, tempering the claim that shallow water is automatically an easy production solution. Its rendering discussion covers depth attenuation, approximate refraction and Fresnel response. The page identifies separate texture origins and a non-commercial skybox tool license; copying its visual assets would require a separate license check. We did not verify repository-wide reuse terms or adopt any of its assets.

## Recommended isolated experiments

These are project-specific proposals, not descriptions of what the references implement. Keep identical board geometry, camera, lighting, block motion and water tint across comparisons.

1. **Directional wave basin.** Evolve a small damped wave grid with solid boundaries. Drive it along the swept rectangular block perimeter: stronger bow disturbance, weaker rear trough, corner release. Derive normals from the evolving height. Compare slow push, fast push and sudden stop. This tests whether coherent displaced-looking ripples sell the intended weight at minimal cost. Label front/back forcing as artistic; it does not conserve displaced liquid or produce a genuine horizontal wake.

2. **Flow with surface detail.** Evolve horizontal velocity using advection, forcing and obstacle-aware pressure projection. Transport sparse foam flecks or a faint texture through that velocity. Add a separate low-amplitude wave grid for surface normals. This tests whether side flow and a lingering curved wake improve the result. Use normal matching at moving boundaries and collision-aware backtraces. Label the loose coupling honestly: pressure is not surface height, and independent wave/flow layers are not a shallow-water solver.

3. **Depth and momentum basin.** Implement a conservative shallow-water update and prescribe the block as a moving excluded footprint. Track depth, flux and moving-wall interaction; redistribute water displaced by newly occupied cells and initialize newly uncovered cells without inventing net volume. Start with a constant-depth floor and reflective outer wall. Compare bow pile-up, side jets and rear refill. This is the strongest match to actual shallow-water displacement, and the highest numerical/engineering risk. An implementation that merely splats velocity into a depth grid should be labelled a simplified forced shallow-water experiment rather than validated moving-solid coupling.

## Practical implementation and evaluation

- Use fixed simulation timesteps with bounded catch-up. A large animation-frame interval must not become a single large physics step. Sweep the block trajectory during substeps so it cannot jump across water cells.
- Use a simulation resolution independent of display pixels. Compare, for example, 96², 144² and 192² fields on the actual target device; these are proposed test sizes, not benchmarked performance promises.
- With explicit shallow-water updates, choose the timestep from grid spacing and maximum local transport plus gravity-wave speed. Preserve nonnegative depth and record volume error. Damping and hard clamping can conceal an unstable solver, so expose their effects in diagnostics.
- Update occupancy, boundary velocity and state repair together when a block moves. A mask applied only in the final shader hides fluid instead of making it move around an obstacle.
- Keep the bed visible, with restrained highlights and sparse foam. A bright foam ridge should follow moving water; do not place a permanent glowing outline around every block. Depth tint and bed refraction should remain readable beneath the puzzle pieces.
- Test rest, one-cell slide, reversal, abrupt stop, wall approach, two adjacent blocks, repeated pushes and a long idle. Inspect wave reflection, rear refill, fluid leakage, residual motion and finite state values. For the flow solver inspect divergence; for shallow water inspect depth positivity and volume drift.
- Treat reset/undo as an explicit visual policy: reset simulation or restore a saved fluid state. Reversing the puzzle move is not a physical reversal of dissipative water.

The near-term selection criterion is the clearest heavy-block interaction at the available frame budget. The third experiment has the best physical model for displacement; the first may still be sufficient visually. None of these references proves a particular frame rate, exact Oshi fidelity, or production readiness for this project.

## Implemented comparison, not production approval

`/water-lab.html` implements three independent GPU sketches at 128² with fixed 1/120 s substeps and identical prescribed block motion. It is a separate build entry and never reads game progress. A uses a damped wave equation plus directional edge forcing. B uses semi-Lagrangian velocity/tracer transport, 24 Jacobi pressure iterations and pressure-gradient subtraction; moving wall velocities enter neighboring divergence samples. C is deliberately only **linearized shallow water** at constant reference depth, not the conservative nonlinear solver proposed above. Newly uncovered cells use approximate refill; depth clipping and damping are exposed limitations. B also lacks collision-aware advection backtrace clipping, so boundary leakage remains possible. No mass-conservation or divergence-tolerance acceptance is claimed.

The shared display uses analytic reflection and simple lighting, not the source demos' raytracing, caustics or art. B maps velocity to optical distortion as a visualization, not a physically derived free surface. Controls allow shared drag/keyboard input, automatic movement, speed, rain for A/C, reset, and diagnostic colors. Float field readbacks report finite values and elevation mean/peak (A/C), or peak speed (B). These are instrumentation, not proof of numerical correctness.

Browser smoke on the current device started all three GPU programs and showed evolving nonzero fields during automatic movement. Diagnostic colors revealed mean-height drift and grid artifacts; these should be judged as unfinished experiments. Static zero state was observed after reload. Build/typecheck and existing Board regressions pass; no claim of multi-device performance or production quality is made. Next gate is author selection of motion character, followed by correct moving-boundary treatment and automated numerical conservation/projection checks before any runtime integration.

Display-clarity revision: the display framebuffer now follows CSS size and device pixel ratio (capped at 2× and 1920 pixels wide), rather than stretching a fixed 512×384 canvas. The display pass bilinearly reconstructs state and height gradients while the 128² simulation and its parameters stay unchanged. Brighter shared lighting, crisp antialiased bed reference lines and a single-panel large view make distortion easier to inspect. This does not create additional simulated small-scale detail or fix the numerical artifacts. Browser checks covered both three-panel and C large-view modes; build/typecheck passed.

B optical revision: the former direct velocity-to-normal mapping is replaced by a passive micro-relief scalar in the state's red channel. It is deterministically seeded on startup/reset, transported through the velocity field, retained through pressure projection, and slowly replenished toward the seed to counter numerical diffusion. Its spatial gradient controls reflection/refraction normals; it is optical detail, not solved water elevation. No independent scrolling animation is used. Newly uncovered cells receive seed detail, and backtraces ending in a solid use the current cell (this is not full path clipping). Browser inspection of B large view showed visible stretched surface highlights, finite velocities during motion, and nonzero residual velocity immediately after stopping. Build/typecheck passed. Appearance still needs author acceptance; material detail is now different from A/C, so brightness alone is not a fair solver comparison.

## Current revision: A/C with a hidden side-view base

At the author's request, B is removed from the active comparison and no B GPU instance runs; the earlier experiment description remains historical. A and C retain identical motion and lighting. The visible rectangle represents the front face rather than the full water-contact footprint. A block of normalized front height 0.13 has base depth 0.065, extending behind its bottom edge; the static obstacle uses the same half-height ratio. Solid masking, moving-wall velocity, edge forcing, newly entered/uncovered cells and the controller's obstacle collision use this narrower base. Face rendering remains separate. A "显示接触区" toggle makes the faces translucent and shows the actual excluded base in green.

This is an artistic side-view contact approximation, not a true 3D camera or a newly validated physical solver. Browser inspection confirms the half-height bases and two-panel layout; build/typecheck passes. Production gameplay is unchanged.
