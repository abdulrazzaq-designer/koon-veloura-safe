V45 — Ultra Square slider schema hotfix

Purpose:
- Fix the repeated Salla validation error on related-products column controls.
- Copy the exact working field schema already used by Ultra Square Images:
  type: number
  format: slider
  inputType: range
  value/step/minimum/maximum: numeric strings
- Preserve valid saved values.
- Remove V43/V44 integer/text/default metadata and duplicate definitions.

Files:
- INSTALL-QV-V45.js
- VERIFY-QV-V45.js
