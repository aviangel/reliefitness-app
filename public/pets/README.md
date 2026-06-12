# Pet character art

Drop the pixel-art character PNGs here (transparent or solid background, ~1024px square):

| File           | Character       | Shop slug      |
|----------------|-----------------|----------------|
| `boy.png`      | Starter boy     | `pet-boy`      |
| `girl.png`     | Starter girl    | `pet-girl`     |
| `dog.png`      | Starter puppy   | `pet-dog`      |
| `dragon.png`   | Dragon (2000pt) | `pet-dragon`   |
| `mushroom.png` | Mushroom (1500pt) | `pet-mushroom` |

Until the PNGs exist, the UI automatically falls back to each character's emoji
(`PetAvatar` component handles this), so the feature works without the art.

To add a new character later: add a `shop_items` row (`item_type='pet'`,
`image_path='/pets/<name>.png'`) and drop the PNG here.
