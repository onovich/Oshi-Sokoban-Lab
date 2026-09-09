# Rain shallow-water presentation

The water is a screen-space approximation for the flat board, not a physical fluid simulation or a new terrain rule. Clear levels do not mount it.

- `WaterSurface` owns GPU lifecycle, including unavailable WebGL and context restoration.
- `water-scene` samples the rendered glyph bounds, so reflections follow the existing CSS movement/reset animations. Reflections are vertically mirrored, compressed, and faded from the contact edge. Walls and occupied solid cells mask the water. SVG shape paints are reused rather than inventing a second icon set; numeric labels are deliberately omitted from faint reflections.
- `water-surface` uploads reflection/mask textures at up to 30 frames per second and 768 pixels wide. Rain landing phases use the existing CSS animation clock and landing coordinates. Moving glyphs emit short-lived disturbances; large position jumps do not leave a continuous wake. The impulse queue is bounded at 32 and expires after 1.4 seconds.
- `water-shaders` superimposes decaying radial waves on small capillary waves, distorts only the reflection texture, and adds restrained highlights. The source glyphs and Goal outlines remain above it and undistorted.
- Reduced-motion preference freezes the surface and stops impulses, while state/resize updates can redraw the static reflection. Hidden documents skip rendering. Unmount cancels animation and deletes GPU resources.

Verification: Board tests cover rain-only mounting, persistence across game moves, removal in clear weather, and alignment of rain impacts with visible splashes. Browser inspection confirms the shallow reflection and changing ripples without changing the player's current board. Pixel realism, motion perception, and GPU performance still require visual acceptance on the player's device; unit tests do not establish those qualities.
