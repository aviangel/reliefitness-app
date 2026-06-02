export type Database = {
  public: {
    Tables: {
      user_profile: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      foods: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      meals_log: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      weight_log: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      drinks_log: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      slip_log: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
