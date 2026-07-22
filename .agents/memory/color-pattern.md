---
name: Color and pattern selection
description: CartItem now has colors[] array and pattern enum instead of single color string
---
CartItem: { productId, productName, colors: string[], pattern: CartItemPattern, price }
Pattern enum: regular(3 colors) | dragon_scale(2) | fish_scale(1 or 3, NOT 2) | double_fish_scale(4)
**Why:** Breaking change from single color field — required orval codegen + lib rebuild.
**How to apply:** After openapi.yaml change: cd lib/api-spec && pnpm orval --config ./orval.config.ts, then cd lib/api-client-react && pnpm tsc --build
