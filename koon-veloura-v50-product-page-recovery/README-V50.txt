Veloura V50 — Product Page Recovery

This package repairs the cumulative V49 failure without reverting the requested product-page work.

It removes:
- the recursive Shadow-DOM MutationObserver that could freeze the product page;
- duplicated V49 ordering variables;
- the wrong options-order setting reference;
- the hard-coded sortable class while ordering is OFF.

It preserves/fixes:
- Add to Cart: customized product-card background, text color and radius;
- Buy Now: solid store-primary color;
- horizontal movable thumbnails;
- glass-only edge-to-edge dividers with zero added spacing;
- ordering controls hidden and fully inactive while the switch is OFF.

Run:
node .\INSTALL-QV-V50.js
node .\VERIFY-QV-V50.js
git restore -- public
pnpm production
salla theme preview
