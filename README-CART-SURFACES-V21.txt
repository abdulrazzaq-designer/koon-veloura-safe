Veloura Cart Surfaces V2.1 — fixed safe installer

Fixes in this package:
- Counts only top-level Twilight setting definitions, not IDs used inside conditions.
- Fixes the PowerShell verifier variable interpolation error.
- Does not replace twilight.json, cart.twig, or app.scss.
- Validates JSON before and after modification.
- Creates a backup and restores original files automatically if writing fails.
- Safe to run again after a successful installation.

Run:
powershell -ExecutionPolicy Bypass -File .\INSTALL-CART-SURFACES-V21.ps1
powershell -ExecutionPolicy Bypass -File .\VERIFY-CART-SURFACES-V21.ps1
