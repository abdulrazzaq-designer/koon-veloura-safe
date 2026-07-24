Veloura Quick View V33 — Emergency cart button hotfix

What this fixes:
- Removes V32 DOM re-parenting of the Salla cart footer.
- Removes V32 shadow-root CSS injection and width=wide runtime mutation.
- Restores the native add-to-cart clickable surface, background, text and event handling.
- Gives cart / more and under-cart quick view the exact same width.
- Uses one horizontal slider for both controls and one bottom slider for both rows.
- Slider defaults are 10px; 0 remains a real 0px.
- Keeps image/title/subtitle at the top and price/actions at the bottom, leaving flexible space only in the middle.

Run from the theme root:
node .\INSTALL-QV-V33.js
node .\VERIFY-QV-V33.js
git restore -- public
pnpm production
salla theme preview
