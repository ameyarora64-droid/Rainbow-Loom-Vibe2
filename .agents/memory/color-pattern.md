---
name: Color/pattern selection + pet type
description: CartItem shape, Fish Scale rule, and animal collar pet-type flow
---

## CartItem fields
- `colors[]` — array of color strings, length depends on pattern
- `pattern` — enum: regular | dragon_scale | fish_scale | double_fish_scale
- `price` — number
- `petType?` — optional enum: dog | cat (only set for Animal Collar product)

## Pattern color rules
- regular: exactly 3 colors
- dragon_scale: exactly 2 colors
- fish_scale: 1 OR 3 colors (2 is invalid — show warning)
- double_fish_scale: exactly 4 colors

## Animal Collar pet-type flow
ProductCard detects `isAnimalCollar` via `product.name.toLowerCase().includes('collar')`.
After color/pattern selection, a second dialog step asks dog 🐕 or cat 🐱, then sets `petType` on the CartItem.
`petType` is optional in OpenAPI CartItem schema — non-collar items omit it.

**How to apply:** Any new "collar"-named product automatically gets the dog/cat dialog step without code changes.

## Admin dashboard display
- Color dots shown on every order item (ColorDots component)
- PetBadge component renders 🐕 Dog / 🐱 Cat badge when petType present
