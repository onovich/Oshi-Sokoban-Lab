# Oshi-Sokoban-Lab social preview design ledger

```yaml
repository:
  name: "Oshi-Sokoban-Lab"
  url: "git@github.com:onovich/Oshi-Sokoban-Lab.git"
  visibility: unknown
  default_branch: "main"
  local_checkout: "D:/LabProjects/LearnSokoban"

evidence:
  mode: runtime-tested
  inspected:
    - path_or_url: "http://127.0.0.1:5174/"
      proves: "The current web demo exposes twelve playable lessons, a lesson briefing, and a dark geometric board language."
    - path_or_url: "src/components/GameGlyph.tsx and src/styles.css"
      proves: "Player, Block, Goal, Gate, Spike, and Wall marks are implemented as project-owned geometric primitives; Gate uses the Spr_Gate_001 outer-ring-plus-core mask with Voronoi and vortex energy layers."
    - path_or_url: "src/levels/demo-levels.ts"
      proves: "The curriculum is composed from four first-batch level families."
    - path_or_url: "package.json"
      proves: "The project is a Vite + React web demo with test, typecheck, and build scripts."
  claim_boundaries:
    - "The cover represents the web demo, not the original game's art, VN content, or a claim of official affiliation."
    - "Twelve playable lessons is a current repository fact, not a claim that the planned full curriculum is complete."

content:
  promise: "A web lab for learning and testing grid-push mechanics."
  proof:
    - "Twelve playable lessons arranged as four three-stage technique groups."
    - "A visible grid board with player, blocks, goals, and paired Gates."
    - "Tested state-machine mechanics presented through a compact playable interface."
  exclude:
    - "Original Oshi art, audio, VN narrative, and non-implemented mechanics."
    - "Unverified performance, platform, or completion claims."

source_route:
  artifacts:
    - path_or_url: "Local runtime capture of gate-challenge-12"
      role: complete-artifact
      identity_value: 3
      intrinsic_beauty: 2
      composition_readiness: 2
      noise_burden: 2
      information_deficit: 0
    - path_or_url: "src/components/GameGlyph.tsx"
      role: glyph
      identity_value: 3
      intrinsic_beauty: 2
      composition_readiness: 3
      noise_burden: 0
      information_deficit: 0
  intervention:
    keep:
      - "Charcoal field, bright white board geometry, yellow player, white Blocks, cyan/orange Gates, and goal-corner marks."
    remove:
      - "Browser chrome, lesson selector, side-panel explanation, controls, and incidental runtime text."
    repair:
      - "Remove invented empty-cell grid lines: the runtime only outlines the board and Wall boundaries."
      - "Replace thick framed Gates and decorative wave lines with the runtime's Spr_Gate_001 outer ring, one-cell gap, energy core, sparse bright/dark Voronoi cells, and vortex layer."
      - "Make Player and Block fill their logical cells, matching the cell-filling GameGlyph variants."
    supplement:
      - cue: "Repository name and evidence-bounded value statement"
        provenance: "package name, app masthead, and current first-batch curriculum"
  interpretation_level: 2
  continuity_model: deliberate-collage
  aspect_fit:
    source_bounds: "Runtime viewport 1280x720"
    target_bounds: "1280x640"
    method: extracted-recomposition
    unused_area: "None; board primitives are recomposed into the right-hand proof region."
    verdict: pass
  fragment_ledger:
    - source_region: "Gate challenge board"
      semantic_unit: "Board topology: paired gates, divider wall, two Blocks, and two Goals"
      crop_boundary: "Rebuilt as a complete seven-by-four board fragment"
      adjacency: "Board edge and title field are intentionally separated by space, not a fake UI seam."
      thumbnail_verdict: pass

composition:
  production_route: code-native-svg
  regions:
    - name: "identity"
      bounds: "72, 72 to 500, 568"
      purpose: "Repository name, promise, and grounded lesson-count proof."
    - name: "gameplay proof"
      bounds: "548, 72 to 1208, 568"
      purpose: "A faithful geometric reconstruction of a Gate lesson board."
  line_ledger:
    - element: "Board perimeter and cell grid"
      role: "boundary"
      endpoints_or_bounds: "576,122 to 1192,506"
      evidence: "The runtime board uses a bright rectangular grid."
    - element: "Central wall divider"
      role: "boundary"
      endpoints_or_bounds: "840,122 to 840,506"
      evidence: "gate-challenge-12 uses a vertical Wall divider."
    - element: "Goal corners"
      role: "boundary"
      endpoints_or_bounds: "Cells 6,2 and 3,3"
      evidence: "GameGlyph GoalCorners path."

version:
  baseline: "docs/social-preview.svg"
  candidate: "docs/social-preview-v2.svg"
  preservation_contract:
    identity_anchors:
      - "Dark field and pale grid"
      - "Yellow player and white Block"
      - "Cyan/orange paired Gate marks"
    protected_strengths:
      - "The board must remain legible at thumbnail scale."
      - "The cover must identify the repository without suggesting official Oshi branding."
    allowed_changes:
      - "Recompose game primitives for the 2:1 format."
      - "Correct icon topology, material, and visual hierarchy from the running game."
    forbidden_changes:
      - "Use original game art or make unsupported feature claims."
  comparison_scores:
    v1:
      identity_fidelity: 2
      product_clarity: 4
      aesthetic_authorship: 3
      abstraction_fit: 3
      topology_fidelity: 2
      material_quality: 3
      composition: 4
      thumbnail_legibility: 4
      line_semantics: 2
      fragment_integrity: 5
    v2:
      identity_fidelity: 5
      product_clarity: 4
      aesthetic_authorship: 4
      abstraction_fit: 5
      topology_fidelity: 5
      material_quality: 4
      composition: 4
      thumbnail_legibility: 4
      line_semantics: 5
      fragment_integrity: 5
  vetoes: []
  verdict: promote
  reason: "v2 removes the non-runtime empty-cell grid and reconstructs the GameGlyph portal mask, energy core, and object footprints without lowering thumbnail readability."

output:
  svg: "docs/social-preview-v2.svg"
  png: "docs/social-preview-v2.png"
  review_sheet: "docs/social-preview-v2-review.png"
  width: 1280
  height: 640
  bytes: 49135
  mechanical_validation: pass
  full_size_review: pass
  thumbnail_light_review: pass
  thumbnail_dark_review: pass
  batch_contact_review: not-applicable

authorization:
  readme_modified: true
  github_uploaded: false
  upload_verification: not-requested
```
