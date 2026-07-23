Veloura Global Glass - based on the uploaded current source

The existing setting is used:
veloura_general_glass_effect_2026

When enabled, the same material values used by the current header are applied to:
- Full and legacy quick-view dialogs
- Veloura popup component
- Salla login and generic modal surfaces (including open Shadow DOM)
- SweetAlert dialogs
- Mobile sticky add-to-cart surface

Important behavior:
- Product cards are no longer forced to glass by the general switch; they keep their own product-card glass setting.
- Header glass remains controlled by the header glass switch.
- No new setting IDs were added.
- No shadows are added to the new glass surfaces.
