import { supabase } from "@/integrations/supabase/client";

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
  notes: string | null;
  display_order: number;
};

export const DEFAULT_RECIPES: PublicRecipe[] = [
  {
    id: "recipe-1",
    title: "Pasta alla Carbonara",
    description: "Il classico romano: guanciale croccante, uova, pecorino e pepe. Semplicità perfetta.",
    time_label: "25 min",
    difficulty: "Facile",
    display_order: 0,
  },
  {
    id: "recipe-2",
    title: "Thai Green Curry",
    description: "Latte di cocco, pasta di curry verde, verdure di stagione e riso basmati.",
    time_label: "35 min",
    difficulty: "Media",
    display_order: 1,
  },
  {
    id: "recipe-3",
    title: "Tacos al Pastor",
    description: "Tortillas calde, carne marinata, cipolla, coriandolo e lime. Festa messicana.",
    time_label: "40 min",
    difficulty: "Media",
    display_order: 2,
  },
  {
    id: "recipe-4",
    title: "Risotto ai Funghi",
    description: "Riso carnaroli mantecato con porcini, parmigiano e un filo d'olio al tartufo.",
    time_label: "30 min",
    difficulty: "Media",
    display_order: 3,
  },
  {
    id: "recipe-5",
    title: "Hummus & Pita Board",
    description: "Hummus cremoso, pita calda, verdure crude e feta sbriciolata. Perfetto per condividere.",
    time_label: "20 min",
    difficulty: "Facile",
    display_order: 4,
  },
  {
    id: "recipe-6",
    title: "Stir-Fry Noodles",
    description: "Noodles saltati con verdure croccanti, salsa di soia, zenzero e sesamo tostato.",
    time_label: "20 min",
    difficulty: "Facile",
    display_order: 5,
  },
];

export const DEFAULT_PANTRY: PublicPantryIngredient[] = [
  { id: "pantry-1", name: "Pasta (spaghetti, penne)", category: "base", notes: null, display_order: 0 },
  { id: "pantry-2", name: "Riso basmati", category: "base", notes: null, display_order: 1 },
  { id: "pantry-3", name: "Olio extravergine d'oliva", category: "condiment", notes: null, display_order: 2 },
  { id: "pantry-4", name: "Sale e pepe", category: "spice", notes: null, display_order: 3 },
  { id: "pantry-5", name: "Aglio", category: "fresh", notes: null, display_order: 4 },
  { id: "pantry-6", name: "Cipolla", category: "fresh", notes: null, display_order: 5 },
  { id: "pantry-7", name: "Peperoncino", category: "spice", notes: null, display_order: 6 },
  { id: "pantry-8", name: "Curcuma", category: "spice", notes: null, display_order: 7 },
  { id: "pantry-9", name: "Salsa di soia", category: "condiment", notes: null, display_order: 8 },
  { id: "pantry-10", name: "Latte di cocco", category: "base", notes: null, display_order: 9 },
  { id: "pantry-11", name: "Pomodori pelati", category: "base", notes: null, display_order: 10 },
  { id: "pantry-12", name: "Parmigiano Reggiano", category: "fresh", notes: null, display_order: 11 },
  { id: "pantry-13", name: "Limoni", category: "fresh", notes: null, display_order: 12 },
  { id: "pantry-14", name: "Aceto balsamico", category: "condiment", notes: null, display_order: 13 },
  { id: "pantry-15", name: "Farina 00", category: "base", notes: null, display_order: 14 },
  { id: "pantry-16", name: "Curry in polvere", category: "spice", notes: null, display_order: 15 },
];

export const recipeDifficultyClasses: Record<string, string> = {
  Facile: "border-primary/20 bg-primary/10 text-primary",
  Media: "border-accent/20 bg-accent/10 text-accent",
  Difficile: "border-destructive/20 bg-destructive/10 text-destructive",
};

export const pantryCategoryClasses: Record<PublicPantryIngredient["category"], string> = {
  base: "border-primary/20 bg-primary/10 text-primary",
  spice: "border-secondary/20 bg-secondary/15 text-secondary",
  fresh: "border-accent/20 bg-accent/10 text-accent",
  condiment: "border-foreground/10 bg-foreground/5 text-foreground",
  other: "border-border bg-muted text-muted-foreground",
};

export const pantryCategoryLabels: Record<PublicPantryIngredient["category"], string> = {
  base: "Base",
  spice: "Spezie",
  fresh: "Fresco",
  condiment: "Condimento",
  other: "Altro",
};

export const fetchPublicRecipes = async (): Promise<PublicRecipe[]> => {
  const client = supabase as any;
  const { data, error } = await client
    .from("recipes")
    .select("id, title, description, difficulty, time_label, display_order, is_active")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;

  return (data ?? []) as PublicRecipe[];
};

export const fetchPublicPantry = async (): Promise<PublicPantryIngredient[]> => {
  const client = supabase as any;
  const { data, error } = await client
    .from("pantry_ingredients")
    .select("id, name, category, notes, display_order")
    .order("display_order", { ascending: true });

  if (error) throw error;

  return (data ?? []) as PublicPantryIngredient[];
};

export const checkIsAdmin = async (userId: string) => {
  const client = supabase as any;
  const { data, error } = await client
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
};
