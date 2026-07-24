Veloura Quick View V35 — Grouped button bottom spacing
======================================================

What changed
------------
1. The bottom-spacing slider now controls only the distance between the complete action-button group and the bottom edge of the product card.
2. Add-to-cart and under-cart quick view behave as one visual group.
3. The internal gap between add-to-cart and quick view is fixed and does not change with the bottom slider.
4. The fixed cart-to-quick-view gap is exactly the same as the fixed price-to-cart gap.
5. When quick view is hidden, add-to-cart becomes the last action and the slider controls only the distance below it.
6. Slider default remains 10px; saved 0 remains a true card-edge 0px.
7. Horizontal spacing and equal button widths remain unchanged from V34.
8. The two-zone layout remains: image/title/subtitle above; price/actions below; missing content leaves space only in the middle.
9. Native Salla add-to-cart DOM is not moved, rebuilt, or modified through Shadow DOM.

Install
-------
node .\INSTALL-QV-V35.js
node .\VERIFY-QV-V35.js
git restore -- public
pnpm production
salla theme preview

After preview, use Ctrl+F5 once.
