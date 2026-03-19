import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  CalendarX, Check, Clock, LogOut, Plus, Save,
  ShieldAlert, ShieldCheck, Sparkles, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_PANTRY, DEFAULT_RECIPES, checkIsAdmin,
  pantryCategoryLabels, type PublicPantryIngredient, type PublicRecipe,
} from "@/lib/publicContent";

const recipeDifficultyOptions = ["Facile", "Media", "Difficile"] as const;
const pantryCategoryOptions   = ["base", "spice", "fresh", "condiment", "other"] as const;

type AuthMode    = "signin" | "signup";
type RecipeDraft = Pick<PublicRecipe, "title" | "description" | "difficulty" | "time_label">;
type PantryDraft = Pick<PublicPantryIngredient, "name" | "category" | "notes">;
type BusyDay     = { id: string; date: string; reason: string | null };
type Booking     = {
  id: string; name: string; email: string;
  participants: number; requested_date: string;
  requested_time: string | null; notes: string | null;
  status: "pending" | "confirmed" | "rejected";
  created_at: string;
};

const emptyRecipe: RecipeDraft = { title: "", description: "", difficulty: "Facile", time_label: "30 min" };
const emptyPantry: PantryDraft = { name: "", category: "base", notes: "" };

const MONTHS = ["", "Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
const DAYS   = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const fmtDate = (s: string) => {
  const [y, m, d] = s.split("-");
  const dt = new Date(+y, +m - 1, +d);
  return `${DAYS[dt.getDay()]} ${d} ${MONTHS[+m]} ${y}`;
};

// ── Genera il mini-calendario del mese corrente + prossimo ─────────────────────
const buildCalendarMonths = () => {
  const today = new Date();
  const months = [];
  for (let offset = 0; offset < 2; offset++) {
    const year  = today.getMonth() + offset > 11 ? today.getFullYear() + 1 : today.getFullYear();
    const month = (today.getMonth() + offset) % 12;
    const days  = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay(); // 0=Dom
    const startPad  = firstDow === 0 ? 6 : firstDow - 1;
    months.push({ year, month, days, startPad });
  }
  return months;
};

const Admin = () => {
  const [session,        setSession]        = useState<Session | null>(null);
  const [isAdmin,        setIsAdmin]        = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingData,    setLoadingData]    = useState(false);
  const [authMode,       setAuthMode]       = useState<AuthMode>("signin");
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [displayName,    setDisplayName]    = useState("");
  const [activeTab,      setActiveTab]      = useState<"recipes" | "pantry" | "calendar">("recipes");

  const [recipes,     setRecipes]     = useState<PublicRecipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PublicPantryIngredient[]>([]);
  const [busyDays,    setBusyDays]    = useState<BusyDay[]>([]);
  const [bookings,    setBookings]    = useState<Booking[]>([]);

  const [newRecipe,     setNewRecipe]     = useState<RecipeDraft>(emptyRecipe);
  const [newPantryItem, setNewPantryItem] = useState<PantryDraft>(emptyPantry);
  const [newBusyDate,   setNewBusyDate]   = useState("");
  const [newBusyReason, setNewBusyReason] = useState("");

  const [savingRecipe, setSavingRecipe] = useState(false);
  const [savingPantry, setSavingPantry] = useState(false);
  const [savingBusy,   setSavingBusy]   = useState(false);
  const [savingBook,   setSavingBook]   = useState(false);

  // ── carica tutto ──────────────────────────────────────────────────────────
  const loadAdminData = async (userId: string) => {
    setLoadingData(true);
    try {
      const c = supabase as any;
      const [adminOk, recipesR, pantryR, busyR, bookR] = await Promise.all([
        checkIsAdmin(userId),
        c.from("recipes").select("id,title,description,difficulty,time_label,display_order,is_active").order("display_order"),
        c.from("pantry_ingredients").select("id,name,category,notes,display_order").order("display_order"),
        c.from("busy_days").select("id,date,reason").order("date"),
        c.from("booking_requests").select("id,name,email,participants,requested_date,requested_time,notes,status,created_at").order("requested_date"),
      ]);
      setIsAdmin(adminOk);
      setRecipes(((recipesR.data as PublicRecipe[] | null) ?? DEFAULT_RECIPES).sort((a, b) => a.display_order - b.display_order));
      setPantryItems(((pantryR.data as PublicPantryIngredient[] | null) ?? DEFAULT_PANTRY).sort((a, b) => a.display_order - b.display_order));
      setBusyDays((busyR.data as BusyDay[] | null) ?? []);
      setBookings((bookR.data as Booking[] | null) ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Errore nel caricamento admin.");
      setIsAdmin(false);
    } finally {
      setLoadingData(false);
      setCheckingAccess(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(s);
      if (s?.user?.id) await loadAdminData(s.user.id);
      else setCheckingAccess(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user?.id) void loadAdminData(s.user.id);
      else { setIsAdmin(false); setCheckingAccess(false); }
    });
    void boot();
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // ── auth ──────────────────────────────────────────────────────────────────
  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Inserisci email e password."); return; }
    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Accesso effettuato.");
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { display_name: displayName || email } } });
        if (error) throw error;
        toast.success("Account creato. Controlla la tua email.");
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Errore"); }
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Uscito dall'admin.");
  };

  // ── ricette ───────────────────────────────────────────────────────────────
  const createRecipe = async () => {
    if (!newRecipe.title || !newRecipe.description) { toast.error("Compila titolo e descrizione."); return; }
    setSavingRecipe(true);
    try {
      const c = supabase as any;
      const { data, error } = await c.from("recipes").insert({ ...newRecipe, display_order: recipes.length, is_active: true }).select("id,title,description,difficulty,time_label,display_order,is_active").single();
      if (error) throw error;
      setRecipes(r => [...r, data]); setNewRecipe(emptyRecipe); toast.success("Ricetta aggiunta.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Errore"); }
    finally { setSavingRecipe(false); }
  };
  const saveRecipe = async (recipe: PublicRecipe) => {
    setSavingRecipe(true);
    try {
      const { error } = await (supabase as any).from("recipes").update({ title: recipe.title, description: recipe.description, difficulty: recipe.difficulty, time_label: recipe.time_label, is_active: recipe.is_active ?? true }).eq("id", recipe.id);
      if (error) throw error; toast.success("Salvata.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Errore"); }
    finally { setSavingRecipe(false); }
  };
  const deleteRecipe = async (id: string) => {
    setSavingRecipe(true);
    try {
      const { error } = await (supabase as any).from("recipes").delete().eq("id", id);
      if (error) throw error; setRecipes(r => r.filter(x => x.id !== id)); toast.success("Eliminata.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Errore"); }
    finally { setSavingRecipe(false); }
  };

  // ── dispensa ──────────────────────────────────────────────────────────────
  const createPantryItem = async () => {
    if (!newPantryItem.name) { toast.error("Inserisci il nome."); return; }
    setSavingPantry(true);
    try {
      const c = supabase as any;
      const { data, error } = await c.from("pantry_ingredients").insert({ ...newPantryItem, display_order: pantryItems.length }).select("id,name,category,notes,display_order").single();
      if (error) throw error;
      setPantryItems(p => [...p, data]); setNewPantryItem(emptyPantry); toast.success("Aggiunto.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Errore"); }
    finally { setSavingPantry(false); }
  };
  const savePantryItem = async (item: PublicPantryIngredient) => {
    setSavingPantry(true);
    try {
      const { error } = await (supabase as any).from("pantry_ingredients").update({ name: item.name, category: item.category, notes: item.notes }).eq("id", item.id);
      if (error) throw error; toast.success("Salvato.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Errore"); }
    finally { setSavingPantry(false); }
  };
  const deletePantryItem = async (id: string) => {
    setSavingPantry(true);
    try {
      const { error } = await (supabase as any).from("pantry_ingredients").delete().eq("id", id);
      if (error) throw error; setPantryItems(p => p.filter(x => x.id !== id)); toast.success("Eliminato.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Errore"); }
    finally { setSavingPantry(false); }
  };

  // ── giorni occupati ───────────────────────────────────────────────────────
  const addBusyDay = async () => {
    if (!newBusyDate) { toast.error("Scegli una data."); return; }
    if (busyDays.some(d => d.date === newBusyDate)) { toast.error("Già bloccata."); return; }
    setSavingBusy(true);
    try {
      const c = supabase as any;
      const { data, error } = await c.from("busy_days").insert({ date: newBusyDate, reason: newBusyReason || null }).select("id,date,reason").single();
      if (error) throw error;
      setBusyDays(b => [...b, data].sort((a, b) => a.date.localeCompare(b.date)));
      setNewBusyDate(""); setNewBusyReason(""); toast.success("Giorno bloccato.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Errore"); }
    finally { setSavingBusy(false); }
  };
  const deleteBusyDay = async (id: string) => {
    setSavingBusy(true);
    try {
      const { error } = await (supabase as any).from("busy_days").delete().eq("id", id);
      if (error) throw error; setBusyDays(b => b.filter(x => x.id !== id)); toast.success("Giorno liberato.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Errore"); }
    finally { setSavingBusy(false); }
  };

  // ── booking status ────────────────────────────────────────────────────────
  const updateBookingStatus = async (id: string, status: Booking["status"]) => {
    setSavingBook(true);
    try {
      const { error } = await (supabase as any).from("booking_requests").update({ status }).eq("id", id);
      if (error) throw error;
      setBookings(b => b.map(x => x.id === id ? { ...x, status } : x));
      toast.success(status === "confirmed" ? "✅ Confermata!" : "❌ Rifiutata");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Errore"); }
    finally { setSavingBook(false); }
  };

  // ── helpers calendario ────────────────────────────────────────────────────
  const calMonths    = buildCalendarMonths();
  const busySet      = new Set(busyDays.map(d => d.date));
  const bookingMap   = new Map<string, Booking[]>();
  bookings.forEach(b => {
    const arr = bookingMap.get(b.requested_date) ?? [];
    arr.push(b); bookingMap.set(b.requested_date, arr);
  });
  const todayStr = new Date().toISOString().split("T")[0];

  const statusBadge = (s: Booking["status"]) => {
    if (s === "confirmed") return "bg-green-500/15 text-green-400 border-green-500/25";
    if (s === "rejected")  return "bg-red-500/15 text-red-400 border-red-500/25";
    return "bg-yellow-500/15 text-yellow-400 border-yellow-500/25";
  };
  const statusLabel = (s: Booking["status"]) =>
    s === "confirmed" ? "Confermata" : s === "rejected" ? "Rifiutata" : "In attesa";

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.6))] px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-border bg-card/80 p-6 shadow-[0_20px_80px_hsl(var(--foreground)/0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.24em] text-secondary">Admin console</p>
            <h1 className="font-display text-4xl font-extrabold text-foreground sm:text-5xl">Ricette, dispensa e calendario.</h1>
            <p className="mt-3 font-body text-sm text-muted-foreground">Gestisci i contenuti e il calendario delle Collab.</p>
          </div>
          {session && (
            <Button onClick={handleSignOut} variant="outline" className="rounded-full px-5 font-body font-semibold">
              <LogOut className="h-4 w-4" /> Esci
            </Button>
          )}
        </div>

        {/* States */}
        {checkingAccess ? (
          <div className="rounded-[2rem] border border-border bg-card p-10 text-center">
            <p className="font-body text-muted-foreground">Caricamento…</p>
          </div>

        ) : !session ? (
          <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-8 shadow-lg">
            <div className="mb-6 flex rounded-full border border-border bg-muted p-1">
              {(["signin","signup"] as AuthMode[]).map(m => (
                <button key={m} type="button" onClick={() => setAuthMode(m)}
                  className={`flex-1 rounded-full px-4 py-2 font-body text-sm font-semibold transition ${authMode===m?"bg-primary text-primary-foreground":"text-muted-foreground"}`}>
                  {m==="signin"?"Entra":"Crea account"}
                </button>
              ))}
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode==="signup" && (
                <div><label className="mb-1.5 block font-body text-sm font-medium">Nome</label>
                <Input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Federico"/></div>
              )}
              <div><label className="mb-1.5 block font-body text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tuo@email.com"/></div>
              <div><label className="mb-1.5 block font-body text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimo 6 caratteri"/></div>
              <Button type="submit" className="w-full rounded-full font-body font-semibold">
                <ShieldCheck className="h-4 w-4"/>
                {authMode==="signin"?"Entra nell'admin":"Crea account"}
              </Button>
            </form>
          </div>

        ) : !isAdmin ? (
          <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-accent"/>
            <h2 className="font-display text-2xl font-bold">Non sei ancora admin.</h2>
          </div>

        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6 flex gap-2 rounded-2xl border border-border bg-card p-2">
              {([
                {id:"recipes",  label:"🍽 Ricette"},
                {id:"pantry",   label:"🥘 Dispensa"},
                {id:"calendar", label:"📅 Calendario"},
              ] as const).map(tab => (
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                  className={`flex-1 rounded-xl px-4 py-2.5 font-body text-sm font-semibold transition ${activeTab===tab.id?"bg-primary text-primary-foreground shadow-sm":"text-muted-foreground hover:text-foreground"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── RICETTE ──────────────────────────────────────────────────── */}
            {activeTab==="recipes" && (
              <section className="rounded-[2rem] border border-border bg-card p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Ricette & idee</p>
                    <h2 className="font-display text-3xl font-bold">Aggiorna le proposte del sito</h2>
                  </div>
                  <Sparkles className="h-5 w-5 text-accent mt-1"/>
                </div>
                {/* nuova ricetta */}
                <div className="mb-6 rounded-[1.5rem] border border-border bg-muted/40 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input value={newRecipe.title} onChange={e=>setNewRecipe(c=>({...c,title:e.target.value}))} placeholder="Nuova ricetta"/>
                    <Input value={newRecipe.time_label} onChange={e=>setNewRecipe(c=>({...c,time_label:e.target.value}))} placeholder="30 min"/>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_170px]">
                    <Textarea value={newRecipe.description} onChange={e=>setNewRecipe(c=>({...c,description:e.target.value}))} placeholder="Descrizione" className="min-h-[90px] resize-none"/>
                    <select value={newRecipe.difficulty} onChange={e=>setNewRecipe(c=>({...c,difficulty:e.target.value}))} className="h-10 rounded-md border border-input bg-background px-3 font-body text-sm">
                      {recipeDifficultyOptions.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <Button onClick={createRecipe} disabled={savingRecipe} className="mt-4 rounded-full font-body font-semibold"><Plus className="h-4 w-4"/>Aggiungi</Button>
                </div>
                <div className="space-y-4">
                  {loadingData ? <p className="text-sm text-muted-foreground">Caricamento…</p> : recipes.map((recipe,i)=>(
                    <div key={recipe.id} className="rounded-[1.5rem] border border-border bg-background p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-muted px-3 py-1 font-body text-xs font-semibold uppercase text-muted-foreground">#{i+1}</span>
                        <label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                          <input type="checkbox" checked={recipe.is_active??true} onChange={e=>setRecipes(c=>c.map(r=>r.id===recipe.id?{...r,is_active:e.target.checked}:r))} className="h-4 w-4 rounded"/>
                          Visibile
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input value={recipe.title} onChange={e=>setRecipes(c=>c.map(r=>r.id===recipe.id?{...r,title:e.target.value}:r))}/>
                        <Input value={recipe.time_label} onChange={e=>setRecipes(c=>c.map(r=>r.id===recipe.id?{...r,time_label:e.target.value}:r))}/>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_170px]">
                        <Textarea value={recipe.description} onChange={e=>setRecipes(c=>c.map(r=>r.id===recipe.id?{...r,description:e.target.value}:r))} className="min-h-[100px] resize-none"/>
                        <select value={recipe.difficulty} onChange={e=>setRecipes(c=>c.map(r=>r.id===recipe.id?{...r,difficulty:e.target.value}:r))} className="h-10 rounded-md border border-input bg-background px-3 font-body text-sm">
                          {recipeDifficultyOptions.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button onClick={()=>saveRecipe(recipe)} disabled={savingRecipe} className="rounded-full font-body font-semibold"><Save className="h-4 w-4"/>Salva</Button>
                        <Button onClick={()=>deleteRecipe(recipe.id)} disabled={savingRecipe} variant="destructive" className="rounded-full font-body font-semibold"><Trash2 className="h-4 w-4"/>Elimina</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── DISPENSA ─────────────────────────────────────────────────── */}
            {activeTab==="pantry" && (
              <section className="rounded-[2rem] border border-border bg-card p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Dispensa</p>
                    <h2 className="font-display text-3xl font-bold">Gestisci ingredienti</h2>
                  </div>
                  <Sparkles className="h-5 w-5 text-accent mt-1"/>
                </div>
                <div className="mb-6 rounded-[1.5rem] border border-border bg-muted/40 p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
                    <Input value={newPantryItem.name} onChange={e=>setNewPantryItem(c=>({...c,name:e.target.value}))} placeholder="Nuovo ingrediente"/>
                    <select value={newPantryItem.category} onChange={e=>setNewPantryItem(c=>({...c,category:e.target.value as PantryDraft["category"]}))} className="h-10 rounded-md border border-input bg-background px-3 font-body text-sm">
                      {pantryCategoryOptions.map(o=><option key={o} value={o}>{pantryCategoryLabels[o]}</option>)}
                    </select>
                  </div>
                  <Textarea value={newPantryItem.notes??""} onChange={e=>setNewPantryItem(c=>({...c,notes:e.target.value}))} placeholder="Nota opzionale" className="mt-3 min-h-[70px] resize-none"/>
                  <Button onClick={createPantryItem} disabled={savingPantry} className="mt-4 rounded-full font-body font-semibold"><Plus className="h-4 w-4"/>Aggiungi</Button>
                </div>
                <div className="space-y-3">
                  {loadingData ? <p className="text-sm text-muted-foreground">Caricamento…</p> : pantryItems.map((item,i)=>(
                    <div key={item.id} className="rounded-[1.5rem] border border-border bg-background p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-muted px-3 py-1 font-body text-xs font-semibold uppercase text-muted-foreground">#{i+1}</span>
                        <select value={item.category} onChange={e=>setPantryItems(c=>c.map(x=>x.id===item.id?{...x,category:e.target.value as PublicPantryIngredient["category"]}:x))} className="h-9 rounded-md border border-input bg-background px-3 font-body text-sm">
                          {pantryCategoryOptions.map(o=><option key={o} value={o}>{pantryCategoryLabels[o]}</option>)}
                        </select>
                      </div>
                      <Input value={item.name} onChange={e=>setPantryItems(c=>c.map(x=>x.id===item.id?{...x,name:e.target.value}:x))}/>
                      <Textarea value={item.notes??""} onChange={e=>setPantryItems(c=>c.map(x=>x.id===item.id?{...x,notes:e.target.value}:x))} className="mt-3 min-h-[70px] resize-none"/>
                      <div className="mt-4 flex gap-3">
                        <Button onClick={()=>savePantryItem(item)} disabled={savingPantry} className="rounded-full font-body font-semibold"><Save className="h-4 w-4"/>Salva</Button>
                        <Button onClick={()=>deletePantryItem(item.id)} disabled={savingPantry} variant="destructive" className="rounded-full font-body font-semibold"><Trash2 className="h-4 w-4"/>Elimina</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── CALENDARIO ───────────────────────────────────────────────── */}
            {activeTab==="calendar" && (
              <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

                {/* Colonna sx: mini-calendari + lista prenotazioni */}
                <div className="space-y-6">

                  {/* Mini calendari */}
                  <section className="rounded-[2rem] border border-border bg-card p-6">
                    <div className="mb-4 flex items-start gap-3">
                      <CalendarX className="mt-1 h-5 w-5 text-accent"/>
                      <div>
                        <h2 className="font-display text-2xl font-bold">Panoramica mese</h2>
                        <p className="mt-1 font-body text-sm text-muted-foreground">
                          <span className="inline-block h-3 w-3 rounded-sm bg-red-500/30 border border-red-500/50 mr-1"/>bloccato da te &nbsp;
                          <span className="inline-block h-3 w-3 rounded-sm bg-yellow-500/25 border border-yellow-400/50 mr-1"/>prenotazione in attesa &nbsp;
                          <span className="inline-block h-3 w-3 rounded-sm bg-green-500/20 border border-green-500/40 mr-1"/>confermata
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-8 sm:grid-cols-2">
                      {calMonths.map(({year, month, days, startPad}) => {
                        const mName = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"][month];
                        return (
                          <div key={`${year}-${month}`}>
                            <p className="mb-3 font-display text-lg font-bold text-foreground">{mName} {year}</p>
                            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                              {["L","M","M","G","V","S","D"].map((d,i)=>(
                                <div key={i} className="font-body text-[10px] font-bold text-muted-foreground">{d}</div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {Array.from({length: startPad}).map((_,i)=><div key={`e-${i}`}/>)}
                              {Array.from({length: days}).map((_,i)=>{
                                const d   = i + 1;
                                const key = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                                const isBusy     = busySet.has(key);
                                const dayBooks   = bookingMap.get(key) ?? [];
                                const hasPending  = dayBooks.some(b=>b.status==="pending");
                                const hasConfirmed= dayBooks.some(b=>b.status==="confirmed");
                                const isPast     = key < todayStr;
                                return (
                                  <div key={d} title={isBusy?"Bloccato":dayBooks.length>0?`${dayBooks.length} prenotazione/i`:""}
                                    className={`aspect-square flex items-center justify-center rounded-lg font-body text-xs font-semibold transition
                                      ${isPast?"text-muted-foreground/30":"text-foreground"}
                                      ${isBusy?"bg-red-500/20 border border-red-500/40":""}
                                      ${!isBusy && hasConfirmed?"bg-green-500/20 border border-green-500/35":""}
                                      ${!isBusy && !hasConfirmed && hasPending?"bg-yellow-400/20 border border-yellow-400/40":""}
                                      ${!isBusy && !hasConfirmed && !hasPending && !isPast?"hover:bg-muted/60":""}
                                    `}>
                                    {d}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Prenotazioni ricevute */}
                  <section className="rounded-[2rem] border border-border bg-card p-6">
                    <div className="mb-5">
                      <h2 className="font-display text-2xl font-bold">Prenotazioni ricevute</h2>
                      <p className="mt-1 font-body text-sm text-muted-foreground">
                        {bookings.filter(b=>b.status==="pending").length} in attesa · {bookings.filter(b=>b.status==="confirmed").length} confermate
                      </p>
                    </div>
                    {loadingData ? (
                      <p className="text-sm text-muted-foreground">Caricamento…</p>
                    ) : bookings.length===0 ? (
                      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                        <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30"/>
                        <p className="font-body text-sm text-muted-foreground">Nessuna prenotazione ancora.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bookings.map(b => (
                          <div key={b.id} className="rounded-2xl border border-border bg-background p-4">
                            <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <p className="font-body text-sm font-bold text-foreground">{b.name}</p>
                                <p className="font-body text-xs text-muted-foreground">{b.email}</p>
                              </div>
                              <span className={`rounded-full border px-3 py-1 font-body text-xs font-semibold ${statusBadge(b.status)}`}>
                                {statusLabel(b.status)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                              <p className="font-body text-sm text-foreground"><span className="text-muted-foreground">📅 </span>{fmtDate(b.requested_date)} · {b.requested_time ?? "21:00"}</p>
                              <p className="font-body text-sm text-foreground"><span className="text-muted-foreground">👥 </span>{b.participants} persone</p>
                            </div>
                            {b.notes && <p className="mb-3 font-body text-xs text-muted-foreground italic">"{b.notes}"</p>}
                            {b.status==="pending" && (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={()=>updateBookingStatus(b.id,"confirmed")} disabled={savingBook}
                                  className="rounded-full font-body font-semibold bg-green-600 hover:bg-green-500 text-white">
                                  <Check className="h-3.5 w-3.5"/> Conferma
                                </Button>
                                <Button size="sm" onClick={()=>updateBookingStatus(b.id,"rejected")} disabled={savingBook}
                                  variant="destructive" className="rounded-full font-body font-semibold">
                                  <X className="h-3.5 w-3.5"/> Rifiuta
                                </Button>
                              </div>
                            )}
                            {b.status!=="pending" && (
                              <Button size="sm" onClick={()=>updateBookingStatus(b.id,"pending")} disabled={savingBook}
                                variant="outline" className="rounded-full font-body text-xs text-muted-foreground">
                                Rimetti in attesa
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                {/* Colonna dx: blocca giorni */}
                <div className="space-y-4">
                  <section className="rounded-[2rem] border border-border bg-card p-6">
                    <h2 className="font-display text-xl font-bold mb-1">Blocca un giorno</h2>
                    <p className="font-body text-xs text-muted-foreground mb-4">Il giorno non sarà prenotabile sul sito.</p>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block font-body text-xs text-muted-foreground">Data</label>
                        <Input type="date" value={newBusyDate} min={todayStr} onChange={e=>setNewBusyDate(e.target.value)}/>
                      </div>
                      <div>
                        <label className="mb-1 block font-body text-xs text-muted-foreground">Motivo (opzionale)</label>
                        <Input value={newBusyReason} onChange={e=>setNewBusyReason(e.target.value)} placeholder="Es. Sono via, impegno…"/>
                      </div>
                      <Button onClick={addBusyDay} disabled={savingBusy||!newBusyDate} className="w-full rounded-full font-body font-semibold">
                        <Plus className="h-4 w-4"/> Blocca giorno
                      </Button>
                    </div>
                  </section>

                  {/* Lista giorni bloccati */}
                  <section className="rounded-[2rem] border border-border bg-card p-6">
                    <h2 className="font-display text-xl font-bold mb-4">Giorni bloccati ({busyDays.length})</h2>
                    {busyDays.length===0 ? (
                      <p className="font-body text-xs text-muted-foreground">Nessun giorno bloccato.</p>
                    ) : (
                      <div className="space-y-2">
                        {busyDays.map(day=>(
                          <div key={day.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
                            <div>
                              <p className="font-body text-sm font-semibold text-foreground">{fmtDate(day.date)}</p>
                              {day.reason && <p className="font-body text-xs text-muted-foreground">{day.reason}</p>}
                            </div>
                            <Button onClick={()=>deleteBusyDay(day.id)} disabled={savingBusy} variant="outline" size="sm"
                              className="rounded-full font-body text-xs text-destructive hover:bg-destructive hover:text-white border-destructive/30">
                              <Trash2 className="h-3 w-3"/> Libera
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Admin;
