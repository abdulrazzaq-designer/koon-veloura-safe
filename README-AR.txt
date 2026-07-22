Veloura Header + Tabs V14

This patch restores the structural rules accidentally omitted in V13 while preserving V13 independent colors:
- Radius settings work again.
- Non-floating mode is full-width and flush to top/right/left with lower radius only.
- Floating mode uses the exact theme container and full radius.
- Header and tabs remain sticky and visible unless their hide switches are explicitly enabled.
- Solid header and tabs colors remain independent.
- Glass mode alone uses one unified glass color.
