import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogOut, Plus, Save, ShieldAlert, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_PANTRY,
  DEFAULT_RECIPES,
  checkIsAdmin,
  pantryCategoryLabels,
  type PublicPantryIngredient,
  type PublicRecipe,
} from "@/lib/publicContent";

const recipeDifficultyOptions = ["Facile", "Media", "Difficile"] as const;
const pantryCategoryOptions = ["base", "spice", "fresh", "condiment", "other"] as const;

type AuthMode = "signin" | "signup";

type RecipeDraft = Pick<PublicRecipe, "title" | "description" | "difficulty" | "time_label">;
type PantryDraft = Pick<PublicPantryIngredient, "name" | "category" | "notes">;

const emptyRecipeDraft: RecipeDraft = {
  title: "",
  description: "",
  difficulty: "Facile",
  time_label: "30 min",
};

const emptyPantryDraft: PantryDraft = {
  name: "",
  category: "base",
  notes: "",
};

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PublicPantryIngredient[]>([]);
  const [newRecipe, setNewRecipe] = useState<RecipeDraft>(emptyRecipeDraft);
  const [newPantryItem, setNewPantryItem] = useState<PantryDraft>(emptyPantryDraft);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [savingPantry, setSavingPantry] = useState(false);

  const loadAdminData = async (userId: string) => {
    setLoadingData(true);
    try {
      const client = supabase as any;
      const [isAdminUser, recipesResponse, pantryResponse] = await Promise.all([
        checkIsAdmin(userId),
        client.from("recipes").select("id, title, description, difficulty, time_label, display_order, is_active").order("display_order", { ascending: true }),
        client.from("pantry_ingredients").select("id, name, category, notes, display_order").order("display_order", { ascending: true }),
      ]);

      setIsAdmin(isAdminUser);
      setRecipes(((recipesResponse.data as PublicRecipe[] | null) ?? DEFAULT_RECIPES).sort((a, b) => a.display_order - b.display_order));
      setPantryItems(((pantryResponse.data as PublicPantryIngredient[] | null) ?? DEFAULT_PANTRY).sort((a, b) => a.display_order - b.display_order));
    } catch (error) {
      console.error(error);
      toast.error("Non sono riuscito a caricare l'area admin.");
      setIsAdmin(false);
    } finally {
      setLoadingData(false);
      setCheckingAccess(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(activeSession);

      if (activeSession?.user?.id) {
        await loadAdminData(activeSession.user.id);
      } else {
        setCheckingAccess(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user?.id) {
        void loadAdminData(nextSession.user.id);
      } else {
        setIsAdmin(false);
        setCheckingAccess(false);
        setRecipes([]);
        setPantryItems([]);
      }
    });

    void bootstrap();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error("Inserisci email e password.");
      return;
    }

    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Accesso effettuato.");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              display_name: displayName || email,
            },
          },
        });

        if (error) throw error;
        toast.success("Account creato. Controlla la tua email per confermare l'accesso.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore imprevisto";
      toast.error(message);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sei uscito dall'area admin.");
  };

  const createRecipe = async () => {
    if (!newRecipe.title || !newRecipe.description) {
      toast.error("Compila titolo e descrizione della ricetta.");
      return;
    }

    setSavingRecipe(true);
    try {
      const client = supabase as any;
      const payload = {
        ...newRecipe,
        display_order: recipes.length,
        is_active: true,
      };
      const { data, error } = await client.from("recipes").insert(payload).select("id, title, description, difficulty, time_label, display_order, is_active").single();
      if (error) throw error;
      setRecipes((current) => [...current, data as PublicRecipe]);
      setNewRecipe(emptyRecipeDraft);
      toast.success("Ricetta aggiunta.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore imprevisto";
      toast.error(message);
    } finally {
      setSavingRecipe(false);
    }
  };

  const saveRecipe = async (recipe: PublicRecipe) => {
    setSavingRecipe(true);
    try {
      const client = supabase as any;
      const { error } = await client
        .from("recipes")
        .update({
          title: recipe.title,
          description: recipe.description,
          difficulty: recipe.difficulty,
          time_label: recipe.time_label,
          display_order: recipe.display_order,
          is_active: recipe.is_active ?? true,
        })
        .eq("id", recipe.id);
      if (error) throw error;
      toast.success("Ricetta salvata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore imprevisto";
      toast.error(message);
    } finally {
      setSavingRecipe(false);
    }
  };

  const deleteRecipe = async (id: string) => {
    setSavingRecipe(true);
    try {
      const client = supabase as any;
      const { error } = await client.from("recipes").delete().eq("id", id);
      if (error) throw error;
      setRecipes((current) => current.filter((item) => item.id !== id));
      toast.success("Ricetta eliminata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore imprevisto";
      toast.error(message);
    } finally {
      setSavingRecipe(false);
    }
  };

  const createPantryItem = async () => {
    if (!newPantryItem.name) {
      toast.error("Inserisci il nome dell'ingrediente.");
      return;
    }

    setSavingPantry(true);
    try {
      const client = supabase as any;
      const payload = {
        ...newPantryItem,
        display_order: pantryItems.length,
      };
      const { data, error } = await client.from("pantry_ingredients").insert(payload).select("id, name, category, notes, display_order").single();
      if (error) throw error;
      setPantryItems((current) => [...current, data as PublicPantryIngredient]);
      setNewPantryItem(emptyPantryDraft);
      toast.success("Ingrediente aggiunto.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore imprevisto";
      toast.error(message);
    } finally {
      setSavingPantry(false);
    }
  };

  const savePantryItem = async (item: PublicPantryIngredient) => {
    setSavingPantry(true);
    try {
      const client = supabase as any;
      const { error } = await client
        .from("pantry_ingredients")
        .update({
          name: item.name,
          category: item.category,
          notes: item.notes,
          display_order: item.display_order,
        })
        .eq("id", item.id);
      if (error) throw error;
      toast.success("Ingrediente salvato.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore imprevisto";
      toast.error(message);
    } finally {
      setSavingPantry(false);
    }
  };

  const deletePantryItem = async (id: string) => {
    setSavingPantry(true);
    try {
      const client = supabase as any;
      const { error } = await client.from("pantry_ingredients").delete().eq("id", id);
      if (error) throw error;
      setPantryItems((current) => current.filter((item) => item.id !== id));
      toast.success("Ingrediente eliminato.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore imprevisto";
      toast.error(message);
    } finally {
      setSavingPantry(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.6))] px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-border bg-card/80 p-6 shadow-[0_20px_80px_hsl(var(--foreground)/0.08)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
              Admin console
            </p>
            <h1 className="font-display text-4xl font-extrabold text-foreground sm:text-5xl">
              Ricette e dispensa, in un colpo d'occhio.
            </h1>
            <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
              Entra con email e password, poi aggiorna rapidamente contenuti pubblici senza toccare il codice.
            </p>
          </div>
          {session ? (
            <Button onClick={handleSignOut} variant="outline" className="rounded-full px-5 font-body font-semibold">
              <LogOut className="h-4 w-4" />
              Esci
            </Button>
          ) : null}
        </div>

        {checkingAccess ? (
          <div className="rounded-[2rem] border border-border bg-card p-10 text-center shadow-sm">
            <p className="font-body text-muted-foreground">Sto preparando l'area admin…</p>
          </div>
        ) : !session ? (
          <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-8 shadow-[0_20px_80px_hsl(var(--foreground)/0.08)]">
            <div className="mb-6 flex rounded-full border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`flex-1 rounded-full px-4 py-2 font-body text-sm font-semibold transition ${authMode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Entra
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`flex-1 rounded-full px-4 py-2 font-body text-sm font-semibold transition ${authMode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Crea account
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "signup" ? (
                <div>
                  <label className="mb-1.5 block font-body text-sm font-medium text-foreground">Nome da mostrare</label>
                  <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Federico" />
                </div>
              ) : null}
              <div>
                <label className="mb-1.5 block font-body text-sm font-medium text-foreground">Email</label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tuo@email.com" />
              </div>
              <div>
                <label className="mb-1.5 block font-body text-sm font-medium text-foreground">Password</label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimo 6 caratteri" />
              </div>
              <Button type="submit" className="w-full rounded-full font-body text-base font-semibold">
                <ShieldCheck className="h-4 w-4" />
                {authMode === "signin" ? "Entra nell'admin" : "Crea account admin"}
              </Button>
            </form>
          </div>
        ) : !isAdmin ? (
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-card p-8 text-center shadow-[0_20px_80px_hsl(var(--foreground)/0.08)]">
            <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-accent" />
            <h2 className="font-display text-3xl font-bold text-foreground">Accesso riuscito, ma non sei ancora admin.</h2>
            <p className="mx-auto mt-3 max-w-xl font-body text-muted-foreground">
              L'account è corretto, ma i permessi admin non sono ancora attivi su questo utente.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Ricette & idee</p>
                  <h2 className="font-display text-3xl font-bold text-foreground">Aggiorna le proposte del sito</h2>
                </div>
                <Sparkles className="mt-1 h-5 w-5 text-accent" />
              </div>

              <div className="mb-6 rounded-[1.5rem] border border-border bg-muted/40 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={newRecipe.title} onChange={(event) => setNewRecipe((current) => ({ ...current, title: event.target.value }))} placeholder="Nuova ricetta" />
                  <Input value={newRecipe.time_label} onChange={(event) => setNewRecipe((current) => ({ ...current, time_label: event.target.value }))} placeholder="30 min" />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_170px]">
                  <Textarea value={newRecipe.description} onChange={(event) => setNewRecipe((current) => ({ ...current, description: event.target.value }))} placeholder="Descrizione rapida della ricetta" className="min-h-[110px] resize-none" />
                  <select
                    value={newRecipe.difficulty}
                    onChange={(event) => setNewRecipe((current) => ({ ...current, difficulty: event.target.value }))}
                    className="h-10 rounded-md border border-input bg-background px-3 font-body text-sm text-foreground"
                  >
                    {recipeDifficultyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={createRecipe} disabled={savingRecipe} className="mt-4 rounded-full font-body font-semibold">
                  <Plus className="h-4 w-4" />
                  Aggiungi ricetta
                </Button>
              </div>

              <div className="space-y-4">
                {loadingData ? (
                  <p className="font-body text-sm text-muted-foreground">Sto caricando le ricette…</p>
                ) : (
                  recipes.map((recipe, index) => (
                    <div key={recipe.id} className="rounded-[1.5rem] border border-border bg-background p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-muted px-3 py-1 font-body text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          #{index + 1}
                        </span>
                        <label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={recipe.is_active ?? true}
                            onChange={(event) =>
                              setRecipes((current) =>
                                current.map((item) =>
                                  item.id === recipe.id ? { ...item, is_active: event.target.checked } : item,
                                ),
                              )
                            }
                            className="h-4 w-4 rounded border-border"
                          />
                          Visibile sul sito
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          value={recipe.title}
                          onChange={(event) =>
                            setRecipes((current) =>
                              current.map((item) => (item.id === recipe.id ? { ...item, title: event.target.value } : item)),
                            )
                          }
                        />
                        <Input
                          value={recipe.time_label}
                          onChange={(event) =>
                            setRecipes((current) =>
                              current.map((item) => (item.id === recipe.id ? { ...item, time_label: event.target.value } : item)),
                            )
                          }
                        />
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_170px]">
                        <Textarea
                          value={recipe.description}
                          onChange={(event) =>
                            setRecipes((current) =>
                              current.map((item) => (item.id === recipe.id ? { ...item, description: event.target.value } : item)),
                            )
                          }
                          className="min-h-[120px] resize-none"
                        />
                        <select
                          value={recipe.difficulty}
                          onChange={(event) =>
                            setRecipes((current) =>
                              current.map((item) => (item.id === recipe.id ? { ...item, difficulty: event.target.value } : item)),
                            )
                          }
                          className="h-10 rounded-md border border-input bg-background px-3 font-body text-sm text-foreground"
                        >
                          {recipeDifficultyOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button onClick={() => saveRecipe(recipe)} disabled={savingRecipe} className="rounded-full font-body font-semibold">
                          <Save className="h-4 w-4" />
                          Salva
                        </Button>
                        <Button onClick={() => deleteRecipe(recipe.id)} disabled={savingRecipe} variant="destructive" className="rounded-full font-body font-semibold">
                          <Trash2 className="h-4 w-4" />
                          Elimina
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Dispensa</p>
                  <h2 className="font-display text-3xl font-bold text-foreground">Gestisci ingredienti disponibili</h2>
                </div>
                <Sparkles className="mt-1 h-5 w-5 text-accent" />
              </div>

              <div className="mb-6 rounded-[1.5rem] border border-border bg-muted/40 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
                  <Input value={newPantryItem.name} onChange={(event) => setNewPantryItem((current) => ({ ...current, name: event.target.value }))} placeholder="Nuovo ingrediente" />
                  <select
                    value={newPantryItem.category}
                    onChange={(event) => setNewPantryItem((current) => ({ ...current, category: event.target.value as PantryDraft["category"] }))}
                    className="h-10 rounded-md border border-input bg-background px-3 font-body text-sm text-foreground"
                  >
                    {pantryCategoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {pantryCategoryLabels[option]}
                      </option>
                    ))}
                  </select>
                </div>
                <Textarea value={newPantryItem.notes ?? ""} onChange={(event) => setNewPantryItem((current) => ({ ...current, notes: event.target.value }))} placeholder="Nota opzionale" className="mt-3 min-h-[100px] resize-none" />
                <Button onClick={createPantryItem} disabled={savingPantry} className="mt-4 rounded-full font-body font-semibold">
                  <Plus className="h-4 w-4" />
                  Aggiungi ingrediente
                </Button>
              </div>

              <div className="space-y-4">
                {loadingData ? (
                  <p className="font-body text-sm text-muted-foreground">Sto caricando la dispensa…</p>
                ) : (
                  pantryItems.map((item, index) => (
                    <div key={item.id} className="rounded-[1.5rem] border border-border bg-background p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-muted px-3 py-1 font-body text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          #{index + 1}
                        </span>
                        <select
                          value={item.category}
                          onChange={(event) =>
                            setPantryItems((current) =>
                              current.map((ingredient) =>
                                ingredient.id === item.id
                                  ? { ...ingredient, category: event.target.value as PublicPantryIngredient["category"] }
                                  : ingredient,
                              ),
                            )
                          }
                          className="h-10 rounded-md border border-input bg-background px-3 font-body text-sm text-foreground"
                        >
                          {pantryCategoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {pantryCategoryLabels[option]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        value={item.name}
                        onChange={(event) =>
                          setPantryItems((current) =>
                            current.map((ingredient) =>
                              ingredient.id === item.id ? { ...ingredient, name: event.target.value } : ingredient,
                            ),
                          )
                        }
                      />
                      <Textarea
                        value={item.notes ?? ""}
                        onChange={(event) =>
                          setPantryItems((current) =>
                            current.map((ingredient) =>
                              ingredient.id === item.id ? { ...ingredient, notes: event.target.value } : ingredient,
                            ),
                          )
                        }
                        className="mt-3 min-h-[100px] resize-none"
                      />
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button onClick={() => savePantryItem(item)} disabled={savingPantry} className="rounded-full font-body font-semibold">
                          <Save className="h-4 w-4" />
                          Salva
                        </Button>
                        <Button onClick={() => deletePantryItem(item.id)} disabled={savingPantry} variant="destructive" className="rounded-full font-body font-semibold">
                          <Trash2 className="h-4 w-4" />
                          Elimina
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default Admin;
