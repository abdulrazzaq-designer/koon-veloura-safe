Veloura Cart Surfaces V2.2

This repair package:
- removes the corrupted V2.1 Cart Surfaces settings by ID;
- keeps the existing cart banner settings and values;
- renames the existing section to "صفحة وبنرات السلة";
- inserts the new cart-page controls inside that same section;
- uses Node.js for UTF-8-safe Arabic JSON handling;
- updates cart.twig and the scoped SCSS without replacing the full source files;
- creates a timestamped backup before writing.

Run:
node .\INSTALL-CART-SURFACES-V22.js
node .\VERIFY-CART-SURFACES-V22.js
