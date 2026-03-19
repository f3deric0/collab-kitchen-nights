import { supabase } from "@/integrations/supabase/client";

// ── Tipi pubblici ────────────────────────────────────────────────
export type PublicRecipe = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  time_label: string;
  display_order: number;
  is_active?: boolean;
};

export type PublicPantryIngredient = {
  id: string;
  name: string;
  category: "base" | "spice" | "fresh" | "condiment" | "other";
  notes?: string | null;
  display_order: number;
};

// ── Etichette categorie dispensa ─────────────────────────────────
export const pantryCategoryLabels: Record<string, string> = {
  base:      "Base",
  spice:     "Spezia",
  fresh:     "Fresco",
  condiment: "Condimento",
  other:     "Altro",
};

export const pantryCategoryClasses: Record<string, string> = {
  base:      "bg-blue-500/10 text-blue-600 border-blue-500/20",
  spice:     "bg-orange-500/10 text-orange-600 border-orange-500/20",
  fresh:     "bg-green-500/10 text-green-600 border-green-500/20",
  condiment: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  other:     "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export const recipeDifficultyClasses: Record<string, string> = {
  Facile:    "bg-green-500/10 text-green-600 border-green-500/20",
  Media:     "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Difficile: "bg-red-500/10 text-red-600 border-red-500/20",
};

// ── Dati di default (fallback se Supabase non risponde) ──────────
export const DEFAULT_RECIPES: PublicRecipe[] = [
  { id: "1", title: "Carbonara Battle", description: "Ognuno porta la sua versione — guanciale, pecorino, uova. Chi fa la migliore?", difficulty: "Media", time_label: "45 min", display_order: 1, is_active: true },
  { id: "2", title: "Curry Night", description: "Spezie da tutto il mondo, latte di cocco, riso basmati.", difficulty: "Facile", time_label: "40 min", display_order: 2, is_active: true },
  { id: "3", title: "Pizza Fatta in Casa", description: "Impasto a mano, farciture libere.", difficulty: "Media", time_label: "90 min", display_order: 3, is_active: true },
];

export const DEFAULT_PANTRY: PublicPantryIngredient[] = [
  { id: "1", name: "Olio extravergine", category: "base", display_order: 1 },
  { id: "2", name: "Sale e pepe", category: "spice", display_order: 2 },
  { id: "3", name: "Aglio", category: "fresh", display_order: 3 },
  { id: "4", name: "Pasta secca", category: "base", display_order: 4 },
  { id: "5", name: "Pomodori pelati", category: "base", display_order: 5 },
  { id: "6", name: "Parmigiano", category: "condiment", display_order: 6 },
];

// ── Fetch pubblici ───────────────────────────────────────────────
export const fetchPublicRecipes = async (): Promise<PublicRecipe[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from("recipes")
      .select("id,title,description,difficulty,time_label,display_order,is_active")
      .eq("is_active", true)
      .order("display_order");
    if (error) throw error;
    return (data as PublicRecipe[]) ?? DEFAULT_RECIPES;
  } catch {
    return DEFAULT_RECIPES;
  }
};

export const fetchPublicPantry = async (): Promise<PublicPantryIngredient[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from("pantry_ingredients")
      .select("id,name,category,notes,display_order")
      .order("display_order");
    if (error) throw error;
    return (data as PublicPantryIngredient[]) ?? DEFAULT_PANTRY;
  } catch {
    return DEFAULT_PANTRY;
  }
};

// ── checkIsAdmin: confronta role come testo ──────────────────────
// NON usa la funzione has_role (che aveva problemi di tipo),
// fa direttamente una query su user_roles
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.warn("checkIsAdmin error:", error.message);
      return false;
    }

    // Confronto stringa — funziona sia con text che con enum castato
    return String(data?.role) === "admin";
  } catch (e) {
    console.warn("checkIsAdmin exception:", e);
    return false;
  }
};
