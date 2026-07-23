Veloura Cart Surfaces V2 — safe installer

This package does not replace twilight.json or cart.twig.
The installer patches the current project in place, validates twilight.json before
and after the change, checks duplicate setting IDs, and restores the originals if
any step fails.

Settings are inserted immediately after the existing Cart Banners settings:
- Enable cart surface customization (disabled by default)
- Surface background color
- Unified surface radius
- Optional border and border color
- Optional light shadow

Affected cart elements only:
- Product cart cards
- Free-shipping box
- Gifting box
- Order summary box

No site-wide color is inherited and no change is applied while the switch is off.
