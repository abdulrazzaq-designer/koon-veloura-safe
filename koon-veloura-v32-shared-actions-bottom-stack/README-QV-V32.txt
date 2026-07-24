Quick View V32 — shared actions + fixed bottom layout

What V32 changes:
- Horizontal slider default/value is 10px, min 0, max 100.
- 0 is a real zero: no hidden default is added.
- Add-to-cart footer and under-cart quick-view wrapper are moved into one direct full-card-width action stack.
- Both rows use exactly the same width formula and exactly the same right/left slider value.
- The native Salla add-to-cart element is forced to width="wide" and receives a Shadow DOM width fix when available.
- Bottom slider default/value is 10px, min 0, max 100.
- The same bottom value is applied under the add-to-cart row and under the quick-view row.
- Product title/subtitle/image remain at the top.
- Price remains inside the flexible content area and is pushed to its bottom.
- Add-to-cart and quick view stay at the card bottom.
- Missing subtitle or shorter image creates flexible space only between the upper texts and the price, not under the buttons.

Install:
node .\INSTALL-QV-V32.js
node .\VERIFY-QV-V32.js

after verification:
git restore -- public
pnpm production
salla theme preview
