V51 — Product controls and thumbnails recovery

- Removes V47/V48/V49/V50 conflicting product-page runtimes.
- Preserves native Salla Add to Cart and Buy Now rendering; no Shadow DOM rewriting.
- Applies the configured product-card color/radius to Add to Cart through supported CSS variables and ::part(button).
- Keeps Buy Now native and visible using Salla's supported fast-checkout dimensions.
- Removes all sticky mobile dividers.
- Connects related-products hide-arrows and center-title controls with bounded hydration retries.
- Restores Salla's native thumbnail slider with 4 thumbnails on mobile and 5 on desktop, swipe/drag enabled.
