Veloura V55 — Direct Salla Surfaces

Fixes:
- Removes V54 recursive painter.
- Compact mobile sticky purchase bar: 12px inset and 12px bottom lift.
- Applies global radius to Read More/Less, sticky purchase container, add-to-cart, fast checkout radius variables, thumbnails and active thumbnail ring.
- Hides thumbnail arrows without disabling drag.
- Applies global radius to category sort/filter hosts.
- Restores related-product card action width from the card's existing horizontal spacing variable; 0 means full card width.

Install from the theme root:
  node .\INSTALL-QV-V55.js
  node .\VERIFY-QV-V55.js
  git restore -- public
  pnpm production
  salla theme preview
