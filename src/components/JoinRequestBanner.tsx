import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Users, X, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type OpenCollab = {
  id: string;
  name: string;
  requested_date: string;
  requested_time: string | null;
  participants: number;
  notes: string | null;
};

type JoinForm = {
  name: string;
  email: string;
};

const JoinRequestBanner = () => {
  const [openCollabs, setOpenCollabs] = useState<OpenCollab[]>([]);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joiningCollab, setJoiningCollab] = useState<OpenCollab | null>(null);
  const [form, setForm] = useState<JoinForm>({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOpenCollabs = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await (supabase as any)
        .from("booking_requests")
        .select("id,name,requested_date,requested_time,participants,notes")
        .eq("status", "pending")
        .gte("requested_date", today)
        .order("requested_date", { ascending: true })
        .limit(5);

      if (data && data.length > 0) {
        setOpenCollabs(data);
      }
    };
    void fetchOpenCollabs();
  }, []);

  const visible = openCollabs.filter((c) => !dismissed.has(c.id));

  if (visible.length === 0) return null;

  const collab = visible[Math.min(current, visible.length - 1)];

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    setCurrent(0);
  };

  const handleJoinClick = (c: OpenCollab) => {
    setJoiningCollab(c);
    setShowJoinForm(true);
  };

  const handleJoinSubmit = async () => {
    if (!form.name || !form.email || !joiningCollab) {
      toast.error("Inserisci nome ed email per unirti.");
      return;
    }
    setSubmitting(true);
    try {
      // Salva la join request come nuova booking con note che indica join
      const { error } = await (supabase as any).from("booking_requests").insert({
        name: form.name,
        email: form.email,
        participants: 1,
        requested_date: joiningCollab.requested_date,
        requested_time: joiningCollab.requested_time ?? "21:00",
        notes: `JOIN REQUEST — si unisce alla collab di ${joiningCollab.name} (ref: ${joiningCollab.id})`,
        status: "pending",
      });
      if (error) throw error;
      toast.success(`Richiesta inviata! Chicco ti contatterà per confermare.`);
      setShowJoinForm(false);
      setJoiningCollab(null);
      setForm({ name: "", email: "" });
      handleDismiss(joiningCollab.id);
    } catch (e) {
      toast.error("Errore nell'invio. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  // Estrai ingrediente mancante dalle note
  const getMissingIngredient = (notes: string | null) => {
    if (!notes) return null;
    // Cerca pattern come "manca X", "mancano X", "serve X", "cercasi X"
    const patterns = [
      /manca[no]?\s+([^,.]+)/i,
      /serve\s+([^,.]+)/i,
      /cerco\s+([^,.]+)/i,
      /cercasi\s+([^,.]+)/i,
      /ho bisogno di\s+([^,.]+)/i,
    ];
    for (const p of patterns) {
      const m = notes.match(p);
      if (m) return m[1].trim();
    }
    return null;
  };

  const missingIngredient = getMissingIngredient(collab.notes);

  return (
    <>
      <AnimatePresence>
        <section className="relative overflow-hidden bg-[hsl(var(--accent)/0.08)] border-y border-accent/20 px-6 py-8 sm:py-10">
          {/* Sfondo decorativo */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--accent)/0.12),transparent_60%)]" />

          <div className="relative mx-auto max-w-6xl">
            {/* Header sezione */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 flex items-center gap-2"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
              </div>
              <p className="font-body text-xs font-bold uppercase tracking-[0.28em] text-accent">
                Collab aperte · unisciti a una serata
              </p>
              {visible.length > 1 && (
                <span className="ml-auto font-body text-xs text-muted-foreground">
                  {current + 1} / {visible.length}
                </span>
              )}
            </motion.div>

            {/* Card collab */}
            <AnimatePresence mode="wait">
              <motion.div
                key={collab.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className="relative rounded-[1.75rem] border border-accent/25 bg-card/90 p-5 shadow-[0_8px_40px_hsl(var(--accent)/0.12)] backdrop-blur-sm sm:p-6"
              >
                {/* Dismiss */}
                <button
                  onClick={() => handleDismiss(collab.id)}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  {/* Avatar / icona */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-2xl">
                    <ChefHat className="h-7 w-7 text-accent" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="font-display text-xl font-bold text-foreground">
                        {collab.name}
                      </p>
                      <span className="font-body text-sm text-muted-foreground">
                        vuole fare una collab
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {/* Data */}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 font-body text-xs font-semibold text-foreground">
                        📅 {format(new Date(collab.requested_date + "T00:00:00"), "EEE d MMM", { locale: it })} · {collab.requested_time ?? "21:00"}
                      </span>
                      {/* Partecipanti */}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 font-body text-xs font-semibold text-foreground">
                        <Users className="h-3 w-3" />
                        {collab.participants} {collab.participants === 1 ? "persona" : "persone"}
                      </span>
                      {/* Ingrediente mancante */}
                      {missingIngredient && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 font-body text-xs font-semibold text-orange-600 dark:text-orange-400">
                          <ShoppingBag className="h-3 w-3" />
                          manca: {missingIngredient}
                        </span>
                      )}
                    </div>

                    {collab.notes && !missingIngredient && (
                      <p className="mt-2 font-body text-sm text-muted-foreground italic line-clamp-1">
                        "{collab.notes}"
                      </p>
                    )}
                    {collab.notes && missingIngredient && (
                      <p className="mt-2 font-body text-sm text-muted-foreground italic line-clamp-1">
                        "{collab.notes}"
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <button
                      onClick={() => handleJoinClick(collab)}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-body text-sm font-bold text-accent-foreground shadow-md transition-transform hover:scale-105 hover:shadow-lg"
                    >
                      Unisciti
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {visible.length > 1 && (
                      <button
                        onClick={() => setCurrent((c) => (c + 1) % visible.length)}
                        className="font-body text-xs text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Vedi prossima →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </AnimatePresence>

      {/* Modal Join Form */}
      <AnimatePresence>
        {showJoinForm && joiningCollab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowJoinForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-accent mb-1">
                    Unisciti alla collab
                  </p>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    Serata di {joiningCollab.name}
                  </h3>
                  <p className="mt-1 font-body text-sm text-muted-foreground">
                    {format(new Date(joiningCollab.requested_date + "T00:00:00"), "EEEE d MMMM", { locale: it })} · {joiningCollab.requested_time ?? "21:00"}
                  </p>
                </div>
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {missingIngredient && (
                <div className="mb-5 rounded-[1.2rem] border border-orange-400/30 bg-orange-400/8 px-4 py-3">
                  <p className="font-body text-sm text-foreground">
                    <span className="font-semibold">🛒 Porta con te:</span>{" "}
                    <span className="text-orange-600 font-bold">{missingIngredient}</span>
                  </p>
                  <p className="mt-1 font-body text-xs text-muted-foreground">
                    È l'ingrediente che manca per completare la serata!
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-body text-sm font-medium text-foreground">
                    Il tuo nome *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Come ti chiami?"
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-sm font-medium text-foreground">
                    La tua email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="la-tua@email.com"
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
              </div>

              <button
                onClick={handleJoinSubmit}
                disabled={submitting}
                className="mt-6 w-full rounded-full bg-accent py-3 font-body text-sm font-bold text-accent-foreground shadow-md transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {submitting ? "Invio in corso…" : "Manda la richiesta di join 🍳"}
              </button>

              <p className="mt-3 text-center font-body text-xs text-muted-foreground">
                Chicco riceverà la tua richiesta e ti contatterà per confermare.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default JoinRequestBanner;
