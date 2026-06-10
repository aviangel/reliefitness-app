export type Database = {
  public: {
    Tables: {
      user_profile: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          height_cm: number;
          current_weight_kg: number;
          target_weight_kg: number;
          birth_year: number | null;
          calorie_goal: number;
          protein_goal_g: number;
          carbs_goal_g: number;
          fat_goal_g: number;
          sugar_goal_g: number;
          hernia_flag: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          height_cm?: number;
          current_weight_kg?: number;
          target_weight_kg?: number;
          birth_year?: number | null;
          calorie_goal?: number;
          protein_goal_g?: number;
          carbs_goal_g?: number;
          fat_goal_g?: number;
          sugar_goal_g?: number;
          hernia_flag?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          height_cm?: number;
          current_weight_kg?: number;
          target_weight_kg?: number;
          birth_year?: number | null;
          calorie_goal?: number;
          protein_goal_g?: number;
          carbs_goal_g?: number;
          fat_goal_g?: number;
          sugar_goal_g?: number;
          hernia_flag?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      foods: {
        Row: {
          id: string;
          name: string;
          name_he: string | null;
          category: string;
          calories_per_100g: number;
          protein_per_100g: number | null;
          carbs_per_100g: number | null;
          fat_per_100g: number | null;
          sugar_per_100g: number | null;
          default_portion_g: number | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          name_he?: string | null;
          category: string;
          calories_per_100g?: number;
          protein_per_100g?: number | null;
          carbs_per_100g?: number | null;
          fat_per_100g?: number | null;
          sugar_per_100g?: number | null;
          default_portion_g?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          name_he?: string | null;
          category?: string;
          calories_per_100g?: number;
          protein_per_100g?: number | null;
          carbs_per_100g?: number | null;
          fat_per_100g?: number | null;
          sugar_per_100g?: number | null;
          default_portion_g?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
      };
      meals_log: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal_type: string;
          food_id: string | null;
          food_name: string | null;
          food_name_he: string | null;
          portion_g: number;
          calories: number | null;
          protein_g: number | null;
          carbs_g: number | null;
          fat_g: number | null;
          sugar_g: number | null;
          status: string | null;
          notes: string | null;
          logged_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          meal_type: string;
          food_id?: string | null;
          food_name?: string | null;
          food_name_he?: string | null;
          portion_g?: number;
          calories?: number | null;
          protein_g?: number | null;
          carbs_g?: number | null;
          fat_g?: number | null;
          sugar_g?: number | null;
          status?: string | null;
          notes?: string | null;
          logged_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          meal_type?: string;
          food_id?: string | null;
          food_name?: string | null;
          food_name_he?: string | null;
          portion_g?: number;
          calories?: number | null;
          protein_g?: number | null;
          carbs_g?: number | null;
          fat_g?: number | null;
          sugar_g?: number | null;
          status?: string | null;
          notes?: string | null;
          logged_at?: string | null;
          created_at?: string | null;
        };
      };
      weight_log: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight_kg: number;
          photo_url: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          weight_kg: number;
          photo_url?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          weight_kg?: number;
          photo_url?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
      };
      drinks_log: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          type: string;
          amount_ml: number;
          logged_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          type: string;
          amount_ml?: number;
          logged_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          type?: string;
          amount_ml?: number;
          logged_at?: string | null;
        };
      };
      slip_log: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          what: string;
          why: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          what: string;
          why?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          what?: string;
          why?: string | null;
          created_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
