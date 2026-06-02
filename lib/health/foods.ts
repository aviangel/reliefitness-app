import type { FoodItem, FoodCategory } from '@/types/health';

export const FOODS: FoodItem[] = [
  // HOME MEALS
  { name: 'Chicken Schnitzel', name_he: 'שניצל עוף', category: 'home_meals', calories_per_100g: 250, protein_per_100g: 22, carbs_per_100g: 12, fat_per_100g: 12, default_portion_g: 200 },
  { name: 'Grilled Chicken Breast', name_he: 'חזה עוף צלוי', category: 'home_meals', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, default_portion_g: 150 },
  { name: 'Chicken Thighs', name_he: 'ירכי עוף', category: 'home_meals', calories_per_100g: 209, protein_per_100g: 24, carbs_per_100g: 0, fat_per_100g: 12, default_portion_g: 200 },
  { name: 'Chicken Legs', name_he: 'שוקי עוף', category: 'home_meals', calories_per_100g: 232, protein_per_100g: 23, carbs_per_100g: 0, fat_per_100g: 15, default_portion_g: 200 },
  { name: 'Beef Burger Patty', name_he: 'קציצת בקר', category: 'home_meals', calories_per_100g: 254, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 17, default_portion_g: 150 },
  { name: 'Beef Steak', name_he: 'סטייק בקר', category: 'home_meals', calories_per_100g: 271, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 18, default_portion_g: 200 },
  { name: 'White Rice (cooked)', name_he: 'אורז לבן מבושל', category: 'home_meals', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3, default_portion_g: 200 },
  { name: 'Ptitim (cooked)', name_he: 'פתיתים מבושלים', category: 'home_meals', calories_per_100g: 150, protein_per_100g: 5, carbs_per_100g: 30, fat_per_100g: 1, default_portion_g: 200 },
  { name: 'Couscous (cooked)', name_he: 'קוסקוס מבושל', category: 'home_meals', calories_per_100g: 112, protein_per_100g: 3.8, carbs_per_100g: 23, fat_per_100g: 0.2, default_portion_g: 200 },
  { name: 'Bulgur (cooked)', name_he: 'בורגול מבושל', category: 'home_meals', calories_per_100g: 83, protein_per_100g: 3, carbs_per_100g: 18, fat_per_100g: 0.2, default_portion_g: 200 },
  { name: 'Pasta with Tomato Sauce', name_he: 'פסטה ברוטב עגבניות', category: 'home_meals', calories_per_100g: 150, protein_per_100g: 5, carbs_per_100g: 28, fat_per_100g: 2, default_portion_g: 300 },
  { name: 'Eggs (2 eggs)', name_he: 'ביצים (2 יחידות)', category: 'home_meals', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11, default_portion_g: 120 },
  { name: 'Bread Slice', name_he: 'פרוסת לחם', category: 'home_meals', calories_per_100g: 265, protein_per_100g: 9, carbs_per_100g: 49, fat_per_100g: 3, default_portion_g: 30 },
  // JUNK FOOD
  { name: 'Shake Shack Double SmashBurger', name_he: 'שייק שאק דאבל', category: 'junk_food', calories_per_100g: 267, protein_per_100g: 21, carbs_per_100g: 20, fat_per_100g: 12, default_portion_g: 300 },
  { name: 'Shake Shack Fries', name_he: 'שייק שאק פריז', category: 'junk_food', calories_per_100g: 273, protein_per_100g: 5, carbs_per_100g: 35, fat_per_100g: 14, default_portion_g: 150 },
  { name: "McDonald's Hamburger", name_he: 'מקדונלדס המבורגר', category: 'junk_food', calories_per_100g: 208, protein_per_100g: 12, carbs_per_100g: 25, fat_per_100g: 8, default_portion_g: 120 },
  { name: "McDonald's 12 Nuggets", name_he: 'מקדונלדס 12 נאגטס', category: 'junk_food', calories_per_100g: 230, protein_per_100g: 14, carbs_per_100g: 15, fat_per_100g: 12, default_portion_g: 230 },
  { name: 'BBB 220g Burger', name_he: 'BBB קציצה 220 גרם', category: 'junk_food', calories_per_100g: 184, protein_per_100g: 14, carbs_per_100g: 20, fat_per_100g: 6, default_portion_g: 380 },
  { name: "Domino's Plain Pizza (slice)", name_he: 'דומינוס פיצה רגילה', category: 'junk_food', calories_per_100g: 205, protein_per_100g: 9, carbs_per_100g: 28, fat_per_100g: 6, default_portion_g: 110 },
  { name: "Domino's Pepperoni Pizza (slice)", name_he: 'דומינוס פיצה פפרוני', category: 'junk_food', calories_per_100g: 226, protein_per_100g: 10, carbs_per_100g: 27, fat_per_100g: 9, default_portion_g: 115 },
  { name: 'Hotdog in Bun', name_he: 'נקניקייה בלחמנייה', category: 'junk_food', calories_per_100g: 223, protein_per_100g: 10, carbs_per_100g: 22, fat_per_100g: 11, default_portion_g: 130 },
  // ISRAELI SWEETS
  { name: 'Klik Milk Chocolate', name_he: 'קליק חלב', category: 'israeli_sweets', calories_per_100g: 530, protein_per_100g: 7, carbs_per_100g: 60, fat_per_100g: 29, default_portion_g: 35 },
  { name: 'Klik Dark Chocolate', name_he: 'קליק מריר', category: 'israeli_sweets', calories_per_100g: 520, protein_per_100g: 6, carbs_per_100g: 56, fat_per_100g: 31, default_portion_g: 35 },
  { name: 'Klik White Chocolate', name_he: 'קליק לבן', category: 'israeli_sweets', calories_per_100g: 560, protein_per_100g: 6, carbs_per_100g: 60, fat_per_100g: 33, default_portion_g: 35 },
  { name: 'Pesek Zman', name_he: 'פסק זמן', category: 'israeli_sweets', calories_per_100g: 465, protein_per_100g: 5, carbs_per_100g: 59, fat_per_100g: 24, default_portion_g: 57 },
  { name: 'Shokolad Para (full tablet)', name_he: 'שוקולד פרה טבלה', category: 'israeli_sweets', calories_per_100g: 530, protein_per_100g: 6.5, carbs_per_100g: 58, fat_per_100g: 31, default_portion_g: 100 },
  { name: 'Shokolad Para (row)', name_he: 'שוקולד פרה שורה', category: 'israeli_sweets', calories_per_100g: 530, protein_per_100g: 6.5, carbs_per_100g: 58, fat_per_100g: 31, default_portion_g: 17 },
  { name: 'Kif Kef', name_he: 'כיף כף', category: 'israeli_sweets', calories_per_100g: 525, protein_per_100g: 7, carbs_per_100g: 60, fat_per_100g: 28, default_portion_g: 40 },
  { name: 'Egozi', name_he: 'אגוזי', category: 'israeli_sweets', calories_per_100g: 521, protein_per_100g: 8, carbs_per_100g: 55, fat_per_100g: 30, default_portion_g: 48 },
  { name: 'Mekupelet', name_he: 'מקופלת', category: 'israeli_sweets', calories_per_100g: 540, protein_per_100g: 7, carbs_per_100g: 58, fat_per_100g: 31, default_portion_g: 50 },
  { name: 'Bamba', name_he: 'במבה', category: 'israeli_sweets', calories_per_100g: 565, protein_per_100g: 10, carbs_per_100g: 52, fat_per_100g: 35, default_portion_g: 50 },
  { name: 'Bisli', name_he: 'ביסלי', category: 'israeli_sweets', calories_per_100g: 450, protein_per_100g: 9, carbs_per_100g: 62, fat_per_100g: 18, default_portion_g: 50 },
  // DRINKS
  { name: 'Water', name_he: 'מים', category: 'drinks', calories_per_100g: 0, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0, default_portion_g: 250 },
  { name: 'Coca-Cola Zero (330ml)', name_he: 'קוקה קולה זירו 330', category: 'drinks', calories_per_100g: 0.4, protein_per_100g: 0, carbs_per_100g: 0.1, fat_per_100g: 0, default_portion_g: 330 },
  { name: 'Coca-Cola Zero XL (500ml)', name_he: 'קוקה קולה זירו XL 500', category: 'drinks', calories_per_100g: 0.4, protein_per_100g: 0, carbs_per_100g: 0.1, fat_per_100g: 0, default_portion_g: 500 },
  { name: 'Diet Coke (330ml)', name_he: 'דיאט קוקה קולה 330', category: 'drinks', calories_per_100g: 0.4, protein_per_100g: 0, carbs_per_100g: 0.1, fat_per_100g: 0, default_portion_g: 330 },
];

export const FOODS_BY_CATEGORY: Record<FoodCategory, FoodItem[]> = {
  home_meals: FOODS.filter(f => f.category === 'home_meals'),
  junk_food: FOODS.filter(f => f.category === 'junk_food'),
  israeli_sweets: FOODS.filter(f => f.category === 'israeli_sweets'),
  drinks: FOODS.filter(f => f.category === 'drinks'),
};

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  home_meals: 'Home Meals',
  junk_food: 'Junk Food',
  israeli_sweets: 'Israeli Sweets 🍫',
  drinks: 'Drinks',
};

export function findFood(name: string): FoodItem | undefined {
  return FOODS.find(f => f.name === name);
}
