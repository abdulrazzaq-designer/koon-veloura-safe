Veloura Quick View V34 — Two-zone cards + true zero spacing
============================================================

What this fixes
---------------
1. Horizontal slider starts at 10px.
2. Saved 0 is a real 0px measured from the complete product-card edge.
3. Cart and under-cart quick view always use the same width.
4. Bottom slider starts at 10px.
5. The same bottom value is used between cart and quick view and below the last action.
6. Saved 0 joins the two actions and joins the last action to the card bottom.
7. Native content padding is measured and subtracted at runtime instead of being added to the slider.
8. Product cards are split logically into:
   - Upper zone: image + title + optional subtitle.
   - Lower zone: price + cart/more + optional quick view.
   Missing image height, subtitle, price, cart, or quick view creates flexible space only between the two zones.
9. Salla's native add-to-cart DOM is not moved, rebuilt, or modified through Shadow DOM.

Install
-------
node .\INSTALL-QV-V34.js
node .\VERIFY-QV-V34.js
git restore -- public
pnpm production
salla theme preview

After preview, use Ctrl+F5 once.
