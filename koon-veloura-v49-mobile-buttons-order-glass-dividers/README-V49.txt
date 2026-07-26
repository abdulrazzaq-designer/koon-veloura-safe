Veloura V49 Hotfix

Fixes:
1) Mobile Add to Cart uses the customized product-card button background/text/radius.
2) Buy Now uses a solid store-primary surface so it is visibly colored.
3) Product-detail ordering has a true OFF state and returns to the native order.
4) The order section title is directly above the switch; order controls are hidden while the switch is OFF.
5) Sticky purchase-card separators add no spacing, extend to the card edges, and appear only when actual backdrop blur is active.
6) Horizontal product thumbnails remain scrollable.

Run:
node .\INSTALL-QV-V49.js
node .\VERIFY-QV-V49.js
git restore -- public
pnpm production
salla theme preview
