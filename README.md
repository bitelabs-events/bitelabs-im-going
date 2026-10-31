# BiteLabs "I'm going" card maker

A self-serve page for attendees of the BiteLabs Digital Health and Innovation Summit (TMC Innovation Factory, Houston, Wednesday 2 December) to make their own "I'm going" card.

- 100% client-side: the photo is drawn on an HTML canvas and never leaves the device.
- `assets/card-base.png` and `assets/initials-bg.png` are the fixed layers of the approved v9 card, rendered by the same Python renderer used for the emailed cards; `card.js` draws the photo, badge, name and organisation with the same layout rules (shrink, wrap and ellipsis).
- Fonts are static instances of Sora (700) and Inter (opsz 14, weights 500 and 800), matching the renderer.
